/**
 * IndexedDB Chunk Storage Service for Safe, Long-Duration Audio/Video Recording
 * Prevents browser memory leaks (OOM tab refresh at 22+ minutes) by streaming
 * media chunks directly to IndexedDB disk storage instead of keeping Blobs in RAM.
 * Also provides Crash Recovery in case of unexpected device sleep, tab crash, or reload.
 */

export interface RecordingMeta {
  sessionId: string;
  startedAt: number;
  updatedAt: number;
  title: string;
  speaker: string;
  channel: string;
  series: string;
  seriesPart: number;
  scriptureRef: string;
  description: string;
  mimeType: string;
  durationSeconds: number;
  chunkCount: number;
  totalBytes: number;
  isFinished: boolean;
}

const DB_NAME = 'aura_recording_storage';
const DB_VERSION = 1;
const SESSIONS_STORE = 'active_sessions';
const CHUNKS_STORE = 'recording_chunks';

class RecordingChunkStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private wakeLockSentinel: any = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported in this environment'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result as IDBDatabase;
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          db.createObjectStore(SESSIONS_STORE, { keyPath: 'sessionId' });
        }
        if (!db.objectStoreNames.contains(CHUNKS_STORE)) {
          const chunkStore = db.createObjectStore(CHUNKS_STORE, { keyPath: ['sessionId', 'index'] });
          chunkStore.createIndex('sessionId', 'sessionId', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Request Screen Wake Lock so phone screens do not turn off / throttle recording
   */
  public async acquireWakeLock(): Promise<boolean> {
    try {
      if ('wakeLock' in navigator && typeof (navigator as any).wakeLock.request === 'function') {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
        return true;
      }
    } catch (err) {
      console.warn('[WakeLock] Unable to acquire screen wake lock:', err);
    }
    return false;
  }

  public async releaseWakeLock(): Promise<void> {
    try {
      if (this.wakeLockSentinel) {
        await this.wakeLockSentinel.release();
        this.wakeLockSentinel = null;
      }
    } catch (err) {
      console.warn('[WakeLock] Release error:', err);
    }
  }

  /**
   * Initialize a new recording session
   */
  public async startSession(meta: Omit<RecordingMeta, 'updatedAt' | 'chunkCount' | 'totalBytes' | 'isFinished'>): Promise<string> {
    const db = await this.getDB();
    const sessionData: RecordingMeta = {
      ...meta,
      updatedAt: Date.now(),
      chunkCount: 0,
      totalBytes: 0,
      isFinished: false,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction([SESSIONS_STORE], 'readwrite');
      const store = tx.objectStore(SESSIONS_STORE);
      const req = store.put(sessionData);

      req.onsuccess = () => resolve(meta.sessionId);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Write a single chunk to IndexedDB disk and release from JS heap
   */
  public async writeChunk(sessionId: string, index: number, blob: Blob): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([CHUNKS_STORE, SESSIONS_STORE], 'readwrite');
      const chunkStore = tx.objectStore(CHUNKS_STORE);
      const sessionStore = tx.objectStore(SESSIONS_STORE);

      chunkStore.put({
        sessionId,
        index,
        data: blob,
        size: blob.size,
        timestamp: Date.now(),
      });

      // Update session statistics
      const getSessionReq = sessionStore.get(sessionId);
      getSessionReq.onsuccess = () => {
        const session: RecordingMeta | undefined = getSessionReq.result;
        if (session) {
          session.chunkCount = (session.chunkCount || 0) + 1;
          session.totalBytes = (session.totalBytes || 0) + blob.size;
          session.updatedAt = Date.now();
          sessionStore.put(session);
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Finalize and reassemble all chunks into a unified Blob without memory spikes
   */
  public async finalizeSession(sessionId: string, durationSeconds: number): Promise<{ blob: Blob; meta: RecordingMeta }> {
    const db = await this.getDB();

    // 1. Get session meta
    const meta: RecordingMeta = await new Promise((resolve, reject) => {
      const tx = db.transaction([SESSIONS_STORE], 'readwrite');
      const store = tx.objectStore(SESSIONS_STORE);
      const req = store.get(sessionId);
      req.onsuccess = () => {
        if (!req.result) return reject(new Error('Recording session not found'));
        const updated = { ...req.result, durationSeconds, isFinished: true, updatedAt: Date.now() };
        store.put(updated);
        resolve(updated);
      };
      req.onerror = () => reject(req.error);
    });

    // 2. Read all chunks in sequential order
    const chunks: Blob[] = await new Promise((resolve, reject) => {
      const tx = db.transaction([CHUNKS_STORE], 'readonly');
      const store = tx.objectStore(CHUNKS_STORE);
      const index = store.index('sessionId');
      const req = index.getAll(sessionId);

      req.onsuccess = () => {
        const items = req.result || [];
        // Sort explicitly by chunk index to maintain stream continuity
        items.sort((a, b) => a.index - b.index);
        const blobs = items.map((item: any) => item.data);
        resolve(blobs);
      };
      req.onerror = () => reject(req.error);
    });

    const unifiedBlob = new Blob(chunks, { type: meta.mimeType || 'video/webm' });
    return { blob: unifiedBlob, meta };
  }

  /**
   * Check for any unfinalized recording sessions (e.g. after tab crash or reload at 22+ minutes)
   */
  public async getUnfinishedSessions(): Promise<RecordingMeta[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([SESSIONS_STORE], 'readonly');
        const store = tx.objectStore(SESSIONS_STORE);
        const req = store.getAll();

        req.onsuccess = () => {
          const all: RecordingMeta[] = req.result || [];
          // Filter sessions that have chunks and are not marked finished or were abandoned within the last 7 days
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          const candidates = all.filter(s => s.chunkCount > 0 && (!s.isFinished || s.updatedAt > sevenDaysAgo));
          resolve(candidates);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  /**
   * Reassemble an interrupted session directly from storage
   */
  public async recoverSession(sessionId: string): Promise<{ blob: Blob; meta: RecordingMeta }> {
    const db = await this.getDB();
    const meta: RecordingMeta = await new Promise((resolve, reject) => {
      const tx = db.transaction([SESSIONS_STORE], 'readonly');
      const store = tx.objectStore(SESSIONS_STORE);
      const req = store.get(sessionId);
      req.onsuccess = () => {
        if (!req.result) return reject(new Error('Session not found'));
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });

    const chunks: Blob[] = await new Promise((resolve, reject) => {
      const tx = db.transaction([CHUNKS_STORE], 'readonly');
      const store = tx.objectStore(CHUNKS_STORE);
      const index = store.index('sessionId');
      const req = index.getAll(sessionId);

      req.onsuccess = () => {
        const items = req.result || [];
        items.sort((a, b) => a.index - b.index);
        resolve(items.map((item: any) => item.data));
      };
      req.onerror = () => reject(req.error);
    });

    const blob = new Blob(chunks, { type: meta.mimeType || 'video/webm' });
    return { blob, meta };
  }

  /**
   * Delete session and all its chunks from disk
   */
  public async discardSession(sessionId: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([SESSIONS_STORE, CHUNKS_STORE], 'readwrite');
        const sessionStore = tx.objectStore(SESSIONS_STORE);
        const chunkStore = tx.objectStore(CHUNKS_STORE);

        sessionStore.delete(sessionId);

        // Delete all chunks for this session
        const index = chunkStore.index('sessionId');
        const keyReq = index.getAllKeys(sessionId);
        keyReq.onsuccess = () => {
          const keys = keyReq.result || [];
          keys.forEach(k => chunkStore.delete(k));
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Error discarding session:', err);
    }
  }
}

export const recordingStorage = new RecordingChunkStorageService();
