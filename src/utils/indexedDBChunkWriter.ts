/**
 * IndexedDBChunkWriter
 * High-performance, crash-safe chunked storage for live audio/video recording.
 * 
 * Flushes in-flight MediaRecorder chunks to IndexedDB disk storage instead of
 * keeping hundreds of megabytes in browser JavaScript heap memory.
 * Prevents out-of-memory (OOM) tab refreshes/crashes at 22+ minutes,
 * and allows instant recovery of interrupted sermons if a tab closes or reloads.
 */

const DB_NAME = 'AuraSermonRecorderDB';
const DB_VERSION = 1;
const STORE_CHUNKS = 'recorded_chunks';
const STORE_SESSIONS = 'recording_sessions';

export interface RecordingSessionMetadata {
  sessionId: string;
  title: string;
  speaker: string;
  series?: string;
  scriptureRef?: string;
  startTime: number;
  mimeType: string;
  isFinalized: boolean;
  totalDurationSeconds?: number;
  chunkCount: number;
  totalBytes: number;
}

export interface ChunkRecord {
  id?: number;
  sessionId: string;
  chunkIndex: number;
  blob: Blob;
  size: number;
  timestamp: number;
}

class IndexedDBChunkWriterClass {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private wakeLockSentinel: any = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB is not supported in this environment'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_CHUNKS)) {
          const chunkStore = db.createObjectStore(STORE_CHUNKS, { keyPath: 'id', autoIncrement: true });
          chunkStore.createIndex('by_session', 'sessionId', { unique: false });
          chunkStore.createIndex('by_session_index', ['sessionId', 'chunkIndex'], { unique: true });
        }

        if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
          db.createObjectStore(STORE_SESSIONS, { keyPath: 'sessionId' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Request Screen Wake Lock to prevent mobile devices from sleeping
   * or terminating background recording threads.
   */
  async requestWakeLock(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
        return true;
      } catch (err) {
        console.warn('[Recorder] Wake Lock request note:', err);
      }
    }
    return false;
  }

  releaseWakeLock(): void {
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch {}
      this.wakeLockSentinel = null;
    }
  }

  /**
   * Initialize a new recording session on disk
   */
  async initSession(metadata: {
    sessionId: string;
    title: string;
    speaker: string;
    series?: string;
    scriptureRef?: string;
    mimeType: string;
  }): Promise<void> {
    const db = await this.openDB();
    const sessionRecord: RecordingSessionMetadata = {
      ...metadata,
      startTime: Date.now(),
      isFinalized: false,
      chunkCount: 0,
      totalBytes: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SESSIONS);
      const req = store.put(sessionRecord);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Write an uncompressed blob chunk directly to IndexedDB.
   * Drops memory reference from browser RAM immediately after commit.
   */
  async writeChunk(sessionId: string, chunkIndex: number, chunkBlob: Blob): Promise<void> {
    const db = await this.openDB();

    const record: ChunkRecord = {
      sessionId,
      chunkIndex,
      blob: chunkBlob,
      size: chunkBlob.size,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_CHUNKS, STORE_SESSIONS], 'readwrite');
      const chunkStore = tx.objectStore(STORE_CHUNKS);
      const sessionStore = tx.objectStore(STORE_SESSIONS);

      chunkStore.add(record);

      const sessReq = sessionStore.get(sessionId);
      sessReq.onsuccess = () => {
        const session: RecordingSessionMetadata | undefined = sessReq.result;
        if (session) {
          session.chunkCount = (session.chunkCount || 0) + 1;
          session.totalBytes = (session.totalBytes || 0) + chunkBlob.size;
          sessionStore.put(session);
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Assemble all chunks for a session into a single final Blob
   */
  async assembleSessionBlob(sessionId: string): Promise<{
    blob: Blob;
    session: RecordingSessionMetadata;
  } | null> {
    const db = await this.openDB();

    const session: RecordingSessionMetadata | null = await new Promise((resolve) => {
      const tx = db.transaction(STORE_SESSIONS, 'readonly');
      const req = tx.objectStore(STORE_SESSIONS).get(sessionId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (!session) return null;

    const chunks: Blob[] = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CHUNKS, 'readonly');
      const index = tx.objectStore(STORE_CHUNKS).index('by_session');
      const range = IDBKeyRange.only(sessionId);
      const req = index.getAll(range);

      req.onsuccess = () => {
        const results: ChunkRecord[] = req.result || [];
        // Sort strictly by chunkIndex
        results.sort((a, b) => a.chunkIndex - b.chunkIndex);
        resolve(results.map((r) => r.blob));
      };
      req.onerror = () => reject(req.error);
    });

    if (chunks.length === 0) return null;

    const mime = session.mimeType || 'video/webm';
    const finalBlob = new Blob(chunks, { type: mime });

    return { blob: finalBlob, session };
  }

  /**
   * Mark session as finalized
   */
  async markFinalized(sessionId: string, durationSeconds: number): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SESSIONS);
      const req = store.get(sessionId);
      req.onsuccess = () => {
        const session: RecordingSessionMetadata | undefined = req.result;
        if (session) {
          session.isFinalized = true;
          session.totalDurationSeconds = durationSeconds;
          store.put(session);
        }
        resolve();
      };
      req.onerror = () => resolve();
    });
  }

  /**
   * Check for any unfinalized recording sessions from previous app launches/crashes
   */
  async getUnfinishedSession(): Promise<RecordingSessionMetadata | null> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_SESSIONS, 'readonly');
        const req = tx.objectStore(STORE_SESSIONS).getAll();
        req.onsuccess = () => {
          const sessions: RecordingSessionMetadata[] = req.result || [];
          const unfinished = sessions.find((s) => !s.isFinalized && s.chunkCount > 0);
          resolve(unfinished || null);
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * Discard and delete chunks for a session
   */
  async discardSession(sessionId: string): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction([STORE_CHUNKS, STORE_SESSIONS], 'readwrite');
      const chunkStore = tx.objectStore(STORE_CHUNKS);
      const sessionStore = tx.objectStore(STORE_SESSIONS);

      const index = chunkStore.index('by_session');
      const range = IDBKeyRange.only(sessionId);
      const req = index.getAllKeys(range);

      req.onsuccess = () => {
        const keys: IDBValidKey[] = req.result || [];
        keys.forEach((key) => chunkStore.delete(key));
        sessionStore.delete(sessionId);
      };
    } catch (e) {
      console.warn('[Recorder] Error discarding session:', e);
    }
  }
}

export const indexedDBChunkWriter = new IndexedDBChunkWriterClass();
