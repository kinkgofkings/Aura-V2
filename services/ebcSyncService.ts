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
 * Sweeps Emmanuel Baptist Church YouTube channel (@emmanuelbaptistchurch7615)
 * in Winchester, VA off Route 50 (2774 Northwestern Pike).
 *
 * Captures both Sunday church sermons and EBC Addictions & Recovery / RU messages,
 * saving them permanently in the SQLite database so church members and RU attendees
 * have immediate access.
 */
export async function syncEbcSermons(db: BibleStudyDB): Promise<SyncedVideoResult> {
  try {
    console.log('[EBC Sync] Starting sweep for Emmanuel Baptist Church (@emmanuelbaptistchurch7615)...');

    const [vidHtml, streamHtml, plHtml, rssXml] = await Promise.all([
      fetchUrl('https://www.youtube.com/@emmanuelbaptistchurch7615/videos').catch(() => ''),
      fetchUrl('https://www.youtube.com/@emmanuelbaptistchurch7615/streams').catch(() => ''),
      fetchUrl('https://www.youtube.com/@emmanuelbaptistchurch7615/playlists').catch(() => ''),
      fetchUrl('https://www.youtube.com/feeds/videos.xml?channel_id=UCMNYx8TJjFieTZWuvxS35XA').catch(() => ''),
    ]);

    const vIds = [...vidHtml.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map((x) => x[1]);
    const sIds = [...streamHtml.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map((x) => x[1]);
    const pIds = [...plHtml.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map((x) => x[1]);
    const rIds = [...rssXml.matchAll(/<yt:videoId>(.*?)<\/yt:videoId>/g)].map((x) => x[1]);

    // Known curated Emmanuel Baptist Church video IDs (including RU Addictions & Recovery)
    const curatedEbcIds = [
      'dzX3ZIpXtIc', // Help for Everyone - Reformers Unanimous
      'W_S_MqVtpRo', // Abraham's Relapse
      'oCojUJfa1v0', // Sunday Morning Service
      'KOpJV-n3WnE', // Sunday Service
      'zksVg8UCf-s', // Sunday Evening
      'dirIa3C1fI0', // Midweek Service
      'L8a55sTVmfk',
      'k7O9rlVjlxo',
      'm2hljDRdCv0',
      'HO6crgLsbhI',
      'Eb2DuToDgkU'
    ];

    const allCandidateIds = Array.from(new Set([...curatedEbcIds, ...vIds, ...sIds, ...pIds, ...rIds]));
    console.log(`[EBC Sync] Discovered ${allCandidateIds.length} candidate video/stream IDs from @emmanuelbaptistchurch7615`);

    let addedCount = 0;
    let existingCount = 0;

    for (const ytId of allCandidateIds) {
      const existing = (db as any).db
        .prepare('SELECT id FROM sermons_podcasts WHERE mediaUrl LIKE ? OR id = ?')
        .get(`%${ytId}%`, `yt-${ytId}`);

      if (existing) {
        existingCount++;
        continue;
      }

      const oembed = await fetchOembed(ytId);
      const rawTitle = oembed?.title || 'Emmanuel Baptist Church Message';
      let title = rawTitle;
      let speaker = 'Pastor - Emmanuel Baptist Church';

      const isRecovery =
        /reformers|unanimous|recovery|addiction|relapse|deliverance|overcomer|sobriety/i.test(rawTitle);

      const channel = isRecovery ? 'EBC Addictions and Recovery' : 'Emmanuel Baptist Church';

      // Series extraction
      let series = isRecovery ? 'EBC Freedom & Recovery' : 'Sunday Worship & Expositions';
      let seriesPart = 1;
      const partMatch = title.match(/part\s*(\d+)/i) || title.match(/pt\.?\s*(\d+)/i);
      if (partMatch) {
        seriesPart = parseInt(partMatch[1], 10);
        series =
          title.split(/part\s*\d+|pt\.?\s*\d+/i)[0].replace(/[-|:]$/, '').trim() || series;
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
          channel,
          seriesPart,
          isRecovery
            ? `Emmanuel Baptist Church Addictions & Recovery (RU) • Route 50, Winchester, VA. Meeting every Friday at 7 PM.`
            : `Sunday and midweek preaching from Emmanuel Baptist Church • Route 50 (2774 Northwestern Pike), Winchester, VA.`,
          'video',
          mediaUrl,
          thumbUrl,
          now,
          now,
          now
        );

      addedCount++;
      console.log(`[EBC Sync] + Added new sermon: "${title}" (${channel}) (yt: ${ytId})`);
    }

    const totalNow = (db as any).db.prepare('SELECT count(*) as c FROM sermons_podcasts').get().c;
    console.log(
      `[EBC Sync] Sweep completed! Added: ${addedCount}, Existing: ${existingCount}, Total in archive: ${totalNow}`
    );

    return { addedCount, existingCount, totalNow };
  } catch (err: any) {
    console.error('[EBC Sync] Error during sweep:', err);
    const totalNow = (db as any).db.prepare('SELECT count(*) as c FROM sermons_podcasts').get()?.c || 0;
    return { addedCount: 0, existingCount: 0, totalNow };
  }
}

/**
 * Initializes the automated 3x daily scheduler for Emmanuel Baptist Church (EBC Winchester).
 */
export function startEbcDailyScheduler(db: BibleStudyDB): void {
  setTimeout(() => {
    syncEbcSermons(db).catch((e) => console.error('[EBC Scheduler] Boot sync failed:', e));
  }, 8000);

  const SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000;
  setInterval(() => {
    console.log('[EBC Scheduler] Running scheduled 3x-daily sweep for Emmanuel Baptist Church...');
    syncEbcSermons(db).catch((e) => console.error('[EBC Scheduler] Scheduled sweep failed:', e));
  }, SWEEP_INTERVAL_MS);

  console.log('[EBC Scheduler] 3x daily automated sweep initialized for @emmanuelbaptistchurch7615.');
}
