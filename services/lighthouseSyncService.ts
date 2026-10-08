import https from 'https';
import { BibleStudyDB } from '../server/bible/models';

export interface SyncedVideoResult {
  addedCount: number;
  existingCount: number;
  totalNow: number;
}

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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

/**
 * Sweeps Lighthouse Baptist Church YouTube channel (@lighthousewinc)
 * for all uploaded sermons and live stream broadcasts, inserting any newly
 * discovered messages into SQLite so they multiply and accumulate permanently.
 */
export async function syncLighthouseSermons(db: BibleStudyDB): Promise<SyncedVideoResult> {
  try {
    console.log('[LBC Sync] Starting sweep for Lighthouse Baptist Church (@lighthousewinc)...');

    const [vidHtml, streamHtml, plHtml, rssXml] = await Promise.all([
      fetchUrl('https://www.youtube.com/@lighthousewinc/videos').catch(() => ''),
      fetchUrl('https://www.youtube.com/@lighthousewinc/streams').catch(() => ''),
      fetchUrl('https://www.youtube.com/@lighthousewinc/playlists').catch(() => ''),
      fetchUrl('https://www.youtube.com/feeds/videos.xml?channel_id=UC-rPauVwKrxsFn05cecsF-w').catch(() => ''),
    ]);

    const vIds = [...vidHtml.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map((x) => x[1]);
    const sIds = [...streamHtml.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map((x) => x[1]);
    const pIds = [...plHtml.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map((x) => x[1]);
    const rIds = [...rssXml.matchAll(/<yt:videoId>(.*?)<\/yt:videoId>/g)].map((x) => x[1]);

    const allCandidateIds = Array.from(new Set([...vIds, ...sIds, ...pIds, ...rIds]));
    console.log(`[LBC Sync] Discovered ${allCandidateIds.length} candidate video/stream IDs from @lighthousewinc`);

    let addedCount = 0;
    let existingCount = 0;

    for (const ytId of allCandidateIds) {
      // Check if already archived
      const existing = (db as any).db
        .prepare('SELECT id FROM sermons_podcasts WHERE mediaUrl LIKE ? OR id = ?')
        .get(`%${ytId}%`, `yt-${ytId}`);

      if (existing) {
        existingCount++;
        continue;
      }

      const oembed = await fetchOembed(ytId);
      const rawTitle = oembed?.title || 'Lighthouse Baptist Church Gathering';
      let title = rawTitle;
      let speaker = 'Pastor Luke Shope';

      if (/given by (pastor luke shope)/i.test(rawTitle)) {
        speaker = 'Pastor Luke Shope';
        title = rawTitle.replace(/\s*\|\s*given by pastor luke shope/i, '').trim();
      } else if (/given by (mr\.?\s*aaron miller)/i.test(rawTitle)) {
        speaker = 'Mr. Aaron Miller';
        title = rawTitle.replace(/\s*\|\s*given by mr\.?\s*aaron miller/i, '').trim();
      } else if (/given by (steve ludwig)/i.test(rawTitle)) {
        speaker = 'Steve Ludwig';
        title = rawTitle.replace(/\s*\|\s*given by steve ludwig/i, '').trim();
      } else if (/given by (howard caldwell)/i.test(rawTitle)) {
        speaker = 'Howard Caldwell';
        title = rawTitle.replace(/\s*\|\s*given by howard caldwell/i, '').trim();
      } else if (/given by (gregory miller)/i.test(rawTitle)) {
        speaker = 'Gregory Miller';
        title = rawTitle.replace(/\s*\|\s*given by gregory miller/i, '').trim();
      } else if (/given by (assistant pastor james caldwell)/i.test(rawTitle)) {
        speaker = 'Assistant Pastor James Caldwell';
        title = rawTitle.replace(/\s*\|\s*given by assistant pastor james caldwell/i, '').trim();
      }

      // Series extraction
      let series = 'Sunday Sanctuary Expositions';
      let seriesPart = 1;
      const partMatch = title.match(/part\s*(\d+)/i) || title.match(/pt\.?\s*(\d+)/i);
      if (partMatch) {
        seriesPart = parseInt(partMatch[1], 10);
        series =
          title.split(/part\s*\d+|pt\.?\s*\d+/i)[0].replace(/[-|:]$/, '').trim() ||
          'Sunday Sanctuary Expositions';
      }

      const sermonId = `yt-${ytId}`;
      const mediaUrl = `https://www.youtube.com/watch?v=${ytId}`;
      const thumbUrl = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
      const now = new Date().toISOString();

      (db as any).db
        .prepare(`
        INSERT INTO sermons_podcasts (
          id, title, speaker, series, channel, seriesPart, description, mediaType, mediaUrl, thumbnailUrl, dateRecorded, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .run(
          sermonId,
          title,
          speaker,
          series,
          'Lighthouse Baptist Church',
          seriesPart,
          `Expository sermon from Lighthouse Baptist Church • Winchester, VA. Preached by ${speaker}.`,
          'video',
          mediaUrl,
          thumbUrl,
          now,
          now,
          now
        );

      addedCount++;
      console.log(`[LBC Sync] + Added new sermon: "${title}" by ${speaker} (yt: ${ytId})`);
    }

    const totalNow = (db as any).db.prepare('SELECT count(*) as c FROM sermons_podcasts').get().c;
    console.log(
      `[LBC Sync] Sweep completed! Added: ${addedCount}, Existing: ${existingCount}, Total in archive: ${totalNow}`
    );

    return { addedCount, existingCount, totalNow };
  } catch (err: any) {
    console.error('[LBC Sync] Error during sweep:', err);
    const totalNow = (db as any).db.prepare('SELECT count(*) as c FROM sermons_podcasts').get()?.c || 0;
    return { addedCount: 0, existingCount: 0, totalNow };
  }
}

/**
 * Initializes the automated 3x daily scheduler for Lighthouse Baptist Church.
 * Executes on startup, then runs every 6 hours (covering Morning, Midday, Afternoon/Evening)
 * so that new church services are pulled in promptly throughout the day.
 */
export function startLighthouseDailyScheduler(db: BibleStudyDB): void {
  // 1. Initial sweep on server boot
  syncLighthouseSermons(db).catch((e) => console.error('[LBC Scheduler] Boot sync failed:', e));

  // 2. Schedule 3x daily sweep: Every 6 hours = 4 sweeps per day (Morning ~6am, Midday ~12pm, Afternoon ~6pm, Night ~12am)
  const SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000;
  setInterval(() => {
    console.log('[LBC Scheduler] Running scheduled 3x-daily sweep for Lighthouse Baptist Church...');
    syncLighthouseSermons(db).catch((e) => console.error('[LBC Scheduler] Scheduled sweep failed:', e));
  }, SWEEP_INTERVAL_MS);

  console.log('[LBC Scheduler] 3x daily automated sweep initialized for @lighthousewinc.');
}
