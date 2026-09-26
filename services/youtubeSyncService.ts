import fs from 'fs';
import path from 'path';
import { BibleStudyDB } from '../server/bible/models';

// Default directory paths where YouTube series videos are stored
export const UPLOAD_YOUTUBE_DIRS = [
  path.join(process.cwd(), 'public', 'uploads', 'youtube_series'),
  '/home/ubuntu/Aura-prod/public/uploads/youtube_series',
  '/app/applet/public/uploads/youtube_series',
];

export const PRIMARY_YOUTUBE_DIR = path.join(process.cwd(), 'public', 'uploads', 'youtube_series');
export const MEDIA_URL_PREFIX = '/uploads/youtube_series';

export interface ParsedSermonMetadata {
  title: string;
  speaker: string;
  series: string;
  seriesPart: number;
  channel: string;
  mediaType: 'video' | 'audio';
  scriptureRef: string;
  description: string;
}

/**
 * Intelligent filename parser for sermon and recovery series videos
 */
export function parseSermonFilename(filename: string): ParsedSermonMetadata {
  const ext = path.extname(filename);
  let base = path.basename(filename, ext).trim();

  // Remove trailing YouTube video IDs e.g. [7xQz_9k-ABC] or [1080p] or (Official Video)
  base = base.replace(/\[[a-zA-Z0-9_\-\s]{6,}\]$/g, '').trim();
  base = base.replace(/\([0-9]{3,4}p\)/gi, '').trim();
  base = base.replace(/\[[0-9]{3,4}p\]/gi, '').trim();
  base = base.replace(/\(official\s*(?:video|audio)?\)/gi, '').trim();

  // Normalize delimiters: replace em/en dashes and multiple underscores with standard " - "
  let normalized = base
    .replace(/\s*[–—]\s*/g, ' - ')
    .replace(/\s*\|\s*/g, ' - ')
    .trim();

  // Defaults
  let channel = 'YouTube Series';
  let series = '';
  let seriesPart = 1;
  let speaker = 'Community Ministry';
  let title = base;
  let scriptureRef = '';
  let description = 'YouTube sermon series recording';

  // Check for common Principle / Part / Episode number
  const partMatch = normalized.match(/(?:Principle|Part|Pt\.?|Episode|Ep\.?|Session|Week|Lesson)\s*(\d+)/i);
  if (partMatch) {
    seriesPart = parseInt(partMatch[1], 10);
  }

  // Detect Pathway to Recovery / 12 Steps
  if (/pathway\s*to\s*recovery|recovery|spiritual\s*principle/i.test(normalized) || /principle\s*\d+/i.test(normalized)) {
    series = 'Pathway to Recovery';
    channel = 'Pathway to Recovery';
    speaker = 'Tex';
  }

  // Detect Dr. Tony Evans
  if (/tony\s*evans/i.test(normalized)) {
    speaker = 'Dr. Tony Evans';
    channel = 'Dr. Tony Evans';
  }

  // Detect Charles Stanley
  if (/charles\s*stanley/i.test(normalized)) {
    speaker = 'Dr. Charles Stanley';
    channel = 'In Touch Ministries';
  }

  // Detect Pastor Paul / Lighthouse Baptist
  if (/lighthouse\s*baptist/i.test(normalized)) {
    channel = 'Lighthouse Baptist Church';
    speaker = 'Pastor Paul';
  }

  // Split into parts by delimiter " - "
  const parts = normalized.split(/\s+-\s+/).map((p) => p.trim()).filter(Boolean);

  if (parts.length >= 5) {
    // Format: Channel - Series - Part - Title - Speaker
    channel = parts[0] || channel;
    series = parts[1] || series;
    title = parts[3] || parts[2];
    speaker = parts[4] || speaker;
  } else if (parts.length === 4) {
    // Format: Channel / Series - Part - Title - Speaker
    if (/part|principle|ep/i.test(parts[1])) {
      series = parts[0];
      title = parts[2];
      speaker = parts[3];
    } else {
      channel = parts[0];
      series = parts[1];
      title = parts[2];
      speaker = parts[3];
    }
  } else if (parts.length === 3) {
    // Format: Series - Title - Speaker OR Channel - Title - Part
    if (/part|principle/i.test(parts[2])) {
      series = parts[0];
      title = parts[1];
    } else {
      series = parts[0];
      title = parts[1];
      speaker = parts[2];
    }
  } else if (parts.length === 2) {
    // Format: Speaker / Series - Title
    if (speaker !== 'Community Ministry' && !series) {
      title = parts[1];
    } else {
      speaker = parts[0];
      title = parts[1];
    }
  }

  // Clean title: replace underscores with spaces
  title = title.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

  // If title still has "Part X" or "Principle X" prefix, clean or leave it readable
  if (!series && /principle\s*\d+/i.test(title)) {
    series = 'Pathway to Recovery';
  }

  const mediaType: 'video' | 'audio' =
    ext.toLowerCase() === '.mp3' || ext.toLowerCase() === '.m4a' || ext.toLowerCase() === '.wav'
      ? 'audio'
      : 'video';

  return {
    title,
    speaker,
    series,
    seriesPart,
    channel,
    mediaType,
    scriptureRef,
    description: `${description} - ${title}`,
  };
}

export interface SyncResult {
  success: boolean;
  directory: string;
  totalFiles: number;
  addedCount: number;
  existingCount: number;
  addedTitles: string[];
  allFoundFiles: string[];
  errors: string[];
  timestamp: string;
}

/**
 * Scan directory and sync all YouTube sermon videos into the database
 */
export function syncYoutubeSermons(db: BibleStudyDB): SyncResult {
  const result: SyncResult = {
    success: true,
    directory: PRIMARY_YOUTUBE_DIR,
    totalFiles: 0,
    addedCount: 0,
    existingCount: 0,
    addedTitles: [],
    allFoundFiles: [],
    errors: [],
    timestamp: new Date().toISOString(),
  };

  // Find the directory that actually exists or create the primary one
  let activeDir = PRIMARY_YOUTUBE_DIR;
  for (const candidate of UPLOAD_YOUTUBE_DIRS) {
    if (fs.existsSync(candidate)) {
      activeDir = candidate;
      break;
    }
  }

  if (!fs.existsSync(activeDir)) {
    try {
      fs.mkdirSync(activeDir, { recursive: true });
      console.log(`[YouTube Sync] Created directory: ${activeDir}`);
    } catch (e: any) {
      console.error(`[YouTube Sync] Failed to create dir: ${activeDir}`, e);
      result.errors.push(`Directory creation error: ${e.message}`);
      result.success = false;
      return result;
    }
  }

  result.directory = activeDir;

  let fileList: string[] = [];
  try {
    fileList = fs.readdirSync(activeDir);
  } catch (e: any) {
    result.errors.push(`Failed to read directory: ${e.message}`);
    result.success = false;
    return result;
  }

  // Filter media files
  const mediaFiles = fileList.filter((f) => {
    if (f.startsWith('.')) return false;
    return /\.(mp4|mkv|webm|mov|avi|mp3|m4a|wav|m4v)$/i.test(f);
  });

  result.totalFiles = mediaFiles.length;
  result.allFoundFiles = mediaFiles;

  if (mediaFiles.length === 0) {
    console.log(`[YouTube Sync] No video or audio files in ${activeDir}. Ready for files.`);
    return result;
  }

  console.log(`[YouTube Sync] Found ${mediaFiles.length} media files in ${activeDir}. Cataloguing...`);

  const existingSermons = db.getAllSermons();

  for (const file of mediaFiles) {
    try {
      const mediaUrl = `${MEDIA_URL_PREFIX}/${file}`;

      // Check if already registered by URL or title
      const existing = existingSermons.find(
        (s) => s.mediaUrl === mediaUrl || s.mediaUrl?.endsWith(`/${file}`)
      );

      if (existing) {
        result.existingCount++;
        continue;
      }

      // If activeDir is not in public/uploads/youtube_series, copy or link it so express can serve it
      if (activeDir !== PRIMARY_YOUTUBE_DIR && !fs.existsSync(path.join(PRIMARY_YOUTUBE_DIR, file))) {
        try {
          if (!fs.existsSync(PRIMARY_YOUTUBE_DIR)) {
            fs.mkdirSync(PRIMARY_YOUTUBE_DIR, { recursive: true });
          }
          const srcFile = path.join(activeDir, file);
          const destFile = path.join(PRIMARY_YOUTUBE_DIR, file);
          fs.copyFileSync(srcFile, destFile);
        } catch (copyErr) {
          console.warn(`[YouTube Sync] Note: could not copy to primary uploads dir:`, copyErr);
        }
      }

      const meta = parseSermonFilename(file);
      const dateRecorded = new Date().toISOString().split('T')[0];

      db.createSermon(
        meta.title,
        meta.speaker,
        meta.series || undefined,
        meta.scriptureRef || undefined,
        meta.description,
        meta.mediaType,
        mediaUrl,
        60, // estimate duration default (can be updated by playback)
        dateRecorded,
        '', // thumbnailUrl
        meta.channel,
        meta.seriesPart
      );

      result.addedCount++;
      result.addedTitles.push(`${meta.title} (${meta.series || meta.channel}, Part ${meta.seriesPart})`);
      console.log(`[YouTube Sync] ✅ Catalogued: "${meta.title}" -> Channel: ${meta.channel}, Series: ${meta.series}, Part: ${meta.seriesPart}, Speaker: ${meta.speaker}`);
    } catch (itemErr: any) {
      console.error(`[YouTube Sync] Error processing file "${file}":`, itemErr);
      result.errors.push(`File "${file}": ${itemErr.message}`);
    }
  }

  console.log(`[YouTube Sync] Complete! Added: ${result.addedCount}, Existing: ${result.existingCount}, Total: ${result.totalFiles}`);
  return result;
}

let watcherInitialized = false;
let lastKnownFileCount = -1;

/**
 * Starts automatic directory watcher & periodic heartbeat so files pushed into the folder
 * are immediately ingested without waiting for midnight.
 */
export function startYoutubeFolderWatcher(db: BibleStudyDB) {
  if (watcherInitialized) return;
  watcherInitialized = true;

  console.log(`[YouTube Sync] Initializing real-time folder scanner on startup...`);

  // 1. Run immediate sync check right now at boot
  try {
    const initialSync = syncYoutubeSermons(db);
    lastKnownFileCount = initialSync.totalFiles;
  } catch (e) {
    console.error(`[YouTube Sync] Initial startup sync error:`, e);
  }

  // 2. Watch directory with fs.watch
  for (const dir of UPLOAD_YOUTUBE_DIRS) {
    if (fs.existsSync(dir)) {
      try {
        let debounceTimer: NodeJS.Timeout | null = null;
        fs.watch(dir, (_eventType, filename) => {
          if (filename && (filename.startsWith('.') || !/\.(mp4|mkv|webm|mov|avi|mp3|m4a|wav|m4v)$/i.test(filename))) {
            return;
          }
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            console.log(`[YouTube Sync] Folder change detected in ${dir}! Running sync now...`);
            syncYoutubeSermons(db);
          }, 1500);
        });
        console.log(`[YouTube Sync] Watching directory for live additions: ${dir}`);
      } catch (watchErr) {
        console.warn(`[YouTube Sync] fs.watch not supported on ${dir}:`, watchErr);
      }
    }
  }

  // 3. Periodic heartbeat check every 10 seconds in case files are copied in via rsync/docker mount
  setInterval(() => {
    try {
      let activeDir = PRIMARY_YOUTUBE_DIR;
      for (const d of UPLOAD_YOUTUBE_DIRS) {
        if (fs.existsSync(d)) {
          activeDir = d;
          break;
        }
      }
      if (fs.existsSync(activeDir)) {
        const currentFiles = fs.readdirSync(activeDir).filter(f => !f.startsWith('.') && /\.(mp4|mkv|webm|mov|avi|mp3|m4a|wav|m4v)$/i.test(f));
        if (currentFiles.length !== lastKnownFileCount) {
          console.log(`[YouTube Sync Heartbeat] File count changed from ${lastKnownFileCount} to ${currentFiles.length}. Running sync...`);
          lastKnownFileCount = currentFiles.length;
          syncYoutubeSermons(db);
        }
      }
    } catch (heartbeatErr) {
      // quiet fail on heartbeat check
    }
  }, 10000);
}
