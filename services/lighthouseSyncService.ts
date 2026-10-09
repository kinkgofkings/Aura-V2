import https from 'https';
import { BibleStudyDB } from '../server/bible/models';
import {
  classifyWorshipService,
  extractLockupVideos,
  parseServiceDate,
  speakerFromTitle,
  type LockupVideo,
} from './lighthouseCatalog';

export interface SyncedVideoResult {
  addedCount: number;
  existingCount: number;
  worshipCount: number;
  totalNow: number;
}

export interface LighthouseUpload {
  youtubeId: string;
  title: string;
  speaker: string;
  series: string;
  seriesPart: number | null;
  description: string;
  publishedAt: string;
  isWorshipService: boolean;
  serviceKind?: string;
}

const CHANNEL_ID = 'UC-rPauVwKrxsFn05cecsF-w';
const VIDEOS_TAB = 'EgZ2aWRlb3PyBgQKAjoA';
const LIVE_TAB = 'EgdzdHJlYW1z8gYECgJ6AA==';

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      }
    ).on('error', reject);
  });
}

function postJson(url: string, body: unknown): Promise<unknown> {
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error(`Timeout posting ${url}`));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function fetchOembed(id: string): Promise<{ title: string; author_name: string } | null> {
  return new Promise((resolve) => {
    https
      .get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(d));
          } catch {
            resolve(null);
          }
        });
      })
      .on('error', () => resolve(null));
  });
}

async function browseChannelTab(params: string): Promise<LockupVideo[]> {
  const payload = await postJson('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20261008.01.00',
        hl: 'en',
        gl: 'US',
      },
    },
    browseId: CHANNEL_ID,
    params,
  });
  return extractLockupVideos(payload);
}

function uploadsFromLockups(videos: LockupVideo[]): LighthouseUpload[] {
  return videos.map((video) => {
    const classified = classifyWorshipService(video.title);
    let series = classified.series || 'Sunday Sanctuary Expositions';
    let seriesPart: number | null = null;
    if (!classified.isWorshipService) {
      const partMatch = video.title.match(/part\s*(\d+)/i) || video.title.match(/pt\.?\s*(\d+)/i);
      if (partMatch) {
        seriesPart = parseInt(partMatch[1], 10);
        const stem = video.title.split(/part\s*\d+|pt\.?\s*\d+/i)[0].replace(/[-|:]$/, '').trim();
        if (stem) series = stem;
      }
    }
    const speaker = speakerFromTitle(video.title);
    const publishedAt = parseServiceDate(video.title, video.meta);
    const description = classified.isWorshipService
      ? `${classified.label} from Lighthouse Baptist Church in Winchester, VA. ${video.title}. Sunday and Wednesday worship service preached by ${speaker}.`
      : `Expository sermon from Lighthouse Baptist Church • Winchester, VA. Preached by ${speaker}.`;
    return {
      youtubeId: video.youtubeId,
      title: video.title,
      speaker,
      series,
      seriesPart,
      description,
      publishedAt,
      isWorshipService: classified.isWorshipService,
      serviceKind: classified.kind,
    };
  });
}

/**
 * Live Sunday and Wednesday gatherings are published on the channel Live tab.
 * The public videos RSS for this channel is unavailable, so the catalog is read
 * from YouTube's browse API (videos + live).
 */
export async function fetchLighthouseUploads(): Promise<LighthouseUpload[]> {
  const [live, videos] = await Promise.all([
    browseChannelTab(LIVE_TAB).catch((err) => {
      console.warn('[LBC Sync] Live tab browse failed:', err);
      return [] as LockupVideo[];
    }),
    browseChannelTab(VIDEOS_TAB).catch((err) => {
      console.warn('[LBC Sync] Videos tab browse failed:', err);
      return [] as LockupVideo[];
    }),
  ]);

  const merged = new Map<string, LighthouseUpload>();
  for (const upload of uploadsFromLockups([...live, ...videos])) {
    if (!merged.has(upload.youtubeId)) merged.set(upload.youtubeId, upload);
  }
  if (merged.size > 0) return Array.from(merged.values());

  const fallbackIds = await scrapeLegacyVideoIds();
  const fallback: LighthouseUpload[] = [];
  for (const youtubeId of fallbackIds) {
    const oembed = await fetchOembed(youtubeId);
    const title = oembed?.title || 'Lighthouse Baptist Church Gathering';
    fallback.push(...uploadsFromLockups([{ youtubeId, title, meta: '' }]));
  }
  return fallback;
}

async function scrapeLegacyVideoIds(): Promise<string[]> {
  const [vidHtml, streamHtml, rssXml] = await Promise.all([
    fetchUrl('https://www.youtube.com/@lighthousewinc/videos').catch(() => ''),
    fetchUrl('https://www.youtube.com/@lighthousewinc/streams').catch(() => ''),
    fetchUrl('https://www.youtube.com/feeds/videos.xml?channel_id=UC-rPauVwKrxsFn05cecsF-w').catch(() => ''),
  ]);
  const ids = [
    ...vidHtml.matchAll(/"(?:videoId|contentId)":"([a-zA-Z0-9_-]{11})"/g),
    ...streamHtml.matchAll(/"(?:videoId|contentId)":"([a-zA-Z0-9_-]{11})"/g),
    ...rssXml.matchAll(/<yt:videoId>(.*?)<\/yt:videoId>/g),
  ].map((match) => match[1]);
  return Array.from(new Set(ids));
}

/**
 * Sweeps Lighthouse Baptist Church (@lighthousewinc) videos and live worship
 * services, inserting newly discovered messages into SQLite.
 */
export async function syncLighthouseSermons(db: BibleStudyDB): Promise<SyncedVideoResult> {
  try {
    console.log('[LBC Sync] Starting sweep for Lighthouse Baptist Church (@lighthousewinc)...');
    const uploads = await fetchLighthouseUploads();
    const worshipCount = uploads.filter((item) => item.isWorshipService).length;
    console.log(`[LBC Sync] Discovered ${uploads.length} uploads (${worshipCount} Sunday/Wednesday services)`);

    let addedCount = 0;
    let existingCount = 0;
    const sqlite = (db as any).db;

    for (const upload of uploads) {
      const existing = sqlite
        .prepare('SELECT id FROM sermons_podcasts WHERE mediaUrl LIKE ? OR id = ?')
        .get(`%${upload.youtubeId}%`, `yt-${upload.youtubeId}`) as { id: string } | undefined;

      if (existing) {
        if (upload.isWorshipService) {
          sqlite
            .prepare(
              `UPDATE sermons_podcasts
               SET title = ?, speaker = ?, series = ?, description = ?, dateRecorded = ?, seriesPart = ?, updatedAt = ?
               WHERE id = ?`
            )
            .run(
              upload.title,
              upload.speaker,
              upload.series,
              upload.description,
              upload.publishedAt,
              upload.seriesPart,
              new Date().toISOString(),
              existing.id
            );
        }
        existingCount++;
        continue;
      }

      const now = new Date().toISOString();
      sqlite
        .prepare(
          `INSERT INTO sermons_podcasts (
            id, title, speaker, series, channel, seriesPart, description, mediaType, mediaUrl, thumbnailUrl, dateRecorded, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          `yt-${upload.youtubeId}`,
          upload.title,
          upload.speaker,
          upload.series,
          'Lighthouse Baptist Church',
          upload.seriesPart,
          upload.description,
          'video',
          `https://www.youtube.com/watch?v=${upload.youtubeId}`,
          `https://i.ytimg.com/vi/${upload.youtubeId}/hqdefault.jpg`,
          upload.publishedAt,
          now,
          now
        );

      addedCount++;
      console.log(`[LBC Sync] + Added: "${upload.title}" [${upload.series}] (${upload.youtubeId})`);
    }

    const totalNow = sqlite.prepare('SELECT count(*) as c FROM sermons_podcasts').get().c;
    console.log(
      `[LBC Sync] Sweep completed! Added: ${addedCount}, Existing: ${existingCount}, Worship services: ${worshipCount}, Total: ${totalNow}`
    );

    return { addedCount, existingCount, worshipCount, totalNow };
  } catch (err: any) {
    console.error('[LBC Sync] Error during sweep:', err);
    const totalNow = (db as any).db.prepare('SELECT count(*) as c FROM sermons_podcasts').get()?.c || 0;
    return { addedCount: 0, existingCount: 0, worshipCount: 0, totalNow };
  }
}

/**
 * Pulls new Sunday and Wednesday services through the day.
 * The channel uploads gatherings several times on those days, so the sweep
 * runs every 2 hours instead of waiting on a single daily pass.
 */
export function startLighthouseDailyScheduler(db: BibleStudyDB): void {
  syncLighthouseSermons(db).catch((e) => console.error('[LBC Scheduler] Boot sync failed:', e));

  const SWEEP_INTERVAL_MS = 2 * 60 * 60 * 1000;
  setInterval(() => {
    console.log('[LBC Scheduler] Sweeping Lighthouse Baptist Church for new Sunday and Wednesday services...');
    syncLighthouseSermons(db).catch((e) => console.error('[LBC Scheduler] Scheduled sweep failed:', e));
  }, SWEEP_INTERVAL_MS);

  console.log('[LBC Scheduler] 2-hour worship sweep initialized for @lighthousewinc.');
}
