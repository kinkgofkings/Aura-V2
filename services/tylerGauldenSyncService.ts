import https from 'https';
import { BibleStudyDB } from '../server/bible/models';

export interface SyncedVideoResult {
  addedCount: number;
  existingCount: number;
  totalNow: number;
}

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => resolve(data));
        }
      )
      .on('error', reject);
  });
}

function fetchOembed(id: string): Promise<{ title: string; author_name: string } | null> {
  return new Promise((resolve) => {
    https
      .get(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
        (res) => {
          let d = '';
          res.on('data', (c) => (d += c));
          res.on('end', () => {
            try {
              resolve(JSON.parse(d));
            } catch {
              resolve(null);
            }
          });
        }
      )
      .on('error', () => resolve(null));
  });
}

// All 10 Reformers Unanimous Spiritual Principles with direct YouTube video IDs
export const RU_10_PRINCIPLES_SEED = [
  {
    step: 1,
    title: "RU Principle #1: If God's Against it, so am I",
    youtubeId: 'SHzFPyaewLA',
    scriptureRef: '1 Thessalonians 5:22',
    description: "RU Spiritual Principle 1: If God's against it, so am I. Learn to align your heart and mind with God's absolute truth to overcome addiction and strongholds.",
  },
  {
    step: 2,
    title: 'RU Principle #2: Every sin has its origin in your heart',
    youtubeId: 'MTzfz_MY7hM',
    scriptureRef: 'Proverbs 4:23 & Mark 7:21',
    description: 'RU Spiritual Principle 2: Every sin has its origin in your heart. Guarding the heart with all diligence is the secret to lasting sobriety and purity.',
  },
  {
    step: 3,
    title: 'RU Principle #3: It is easier to keep the heart clean than it is to clean it after it has been defiled',
    youtubeId: '6s0maNd7DiA',
    scriptureRef: 'Psalm 119:9 & 2 Timothy 2:22',
    description: 'RU Spiritual Principle 3: It is easier to keep the heart clean than it is to clean it after it has been defiled. Flee youthful lusts and establish daily biblical boundaries.',
  },
  {
    step: 4,
    title: 'RU Principle #4: You cannot fight a fleshly appetite by indulging in it',
    youtubeId: 'rPMoVIWOIv4',
    scriptureRef: 'Romans 13:14 & Galatians 5:16',
    description: 'RU Spiritual Principle 4: You cannot fight a fleshly appetite by indulging in it. Starve the flesh and feed the spirit through daily fellowship with Christ.',
  },
  {
    step: 5,
    title: 'RU Principle #5: Small compromises lead to great disasters',
    youtubeId: 'zzGe6CMsU-g',
    scriptureRef: 'Song of Solomon 2:15 & Galatians 5:9',
    description: 'RU Spiritual Principle 5: Small compromises lead to great disasters (little sins lead to big sins). Catch the little foxes that spoil the vines.',
  },
  {
    step: 6,
    title: 'RU Principle #6: Those who do not love the Lord will not help us serve the Lord',
    youtubeId: '-kKI4xunJnw',
    scriptureRef: '2 Corinthians 6:14 & 1 Corinthians 15:33',
    description: 'RU Spiritual Principle 6: Those who do not love the Lord will not help us serve the Lord. Surround yourself with Godly fellowship and accountability.',
  },
  {
    step: 7,
    title: 'RU Principle #7: Our sinful habits do hurt those who follow us',
    youtubeId: '7bRAC2H40hc',
    scriptureRef: 'Romans 14:7 & 1 Corinthians 8:12',
    description: 'RU Spiritual Principle 7: Our sinful habits do hurt those who follow us. Breaking generational cycles through the healing power of Jesus Christ.',
  },
  {
    step: 8,
    title: 'RU Principle #8: It is not possible to fight a fleshly temptation with fleshly weapons',
    youtubeId: 'euZ1OsSqqpo',
    scriptureRef: '2 Corinthians 10:4 & Ephesians 6:10-18',
    description: 'RU Spiritual Principle 8: It is not possible to fight a fleshly temptation with fleshly weapons. Put on the whole armor of God to stand in the evil day.',
  },
  {
    step: 9,
    title: 'RU Principle #9: We lose our freedom to choose when we give in to temptation',
    youtubeId: 'rSUO3zTthzQ',
    scriptureRef: 'Romans 6:16 & Proverbs 5:22',
    description: 'RU Spiritual Principle 9: We lose our freedom to choose when we give in to temptation. The consequences are inevitable, incalculable, and up to God.',
  },
  {
    step: 10,
    title: 'RU Principle #10: God balances guilt with blame',
    youtubeId: '4iK96E-jH6E',
    scriptureRef: '1 John 1:9 & Psalm 32:5',
    description: 'RU Spiritual Principle 10: God balances guilt with blame. Accept the blame for your actions, and God will remove the guilt through the blood of Jesus.',
  },
];

/**
 * Seeds all 10 Reformers Unanimous Spiritual Principles into the Sermons database
 */
export function seedRU10Principles(db: BibleStudyDB): { added: number; existing: number } {
  let added = 0;
  let existing = 0;

  for (const p of RU_10_PRINCIPLES_SEED) {
    const existingRow = (db as any).db
      .prepare(
        'SELECT id FROM sermons_podcasts WHERE (mediaUrl LIKE ? OR id = ? OR (channel = ? AND seriesPart = ?))'
      )
      .get(`%${p.youtubeId}%`, `yt-${p.youtubeId}`, 'Reformers Unanimous Recovery', p.step);

    if (existingRow) {
      existing++;
      continue;
    }

    const mediaUrl = `https://www.youtube.com/watch?v=${p.youtubeId}`;
    const thumbnailUrl = `https://i.ytimg.com/vi/${p.youtubeId}/hqdefault.jpg`;
    const dateRecorded = new Date().toISOString().split('T')[0];

    db.createSermon(
      p.title,
      'Reformers Unanimous',
      'Reformers Unanimous - 10 Spiritual Principles',
      p.scriptureRef,
      p.description,
      'video',
      mediaUrl,
      45 * 60, // 45 minutes
      dateRecorded,
      thumbnailUrl,
      'Reformers Unanimous Recovery',
      p.step
    );
    added++;
  }

  console.log(`[RU Sync] 10 Principles synced: Added ${added}, Already present: ${existing}`);
  return { added, existing };
}

/**
 * Sweeps Tyler Gaulden's YouTube channel (@TylerGaulden)
 * and inserts new sermons regularly so recent messages are automatically archived.
 */
export async function syncTylerGauldenSermons(db: BibleStudyDB): Promise<SyncedVideoResult> {
  try {
    console.log('[Tyler Gaulden Sync] Starting sweep for @TylerGaulden...');

    // First ensure RU 10 principles are seeded
    seedRU10Principles(db);

    const [vidHtml, streamHtml] = await Promise.all([
      fetchUrl('https://www.youtube.com/@TylerGaulden/videos').catch(() => ''),
      fetchUrl('https://www.youtube.com/@TylerGaulden/streams').catch(() => ''),
    ]);

    const vIds = [...vidHtml.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map((x) => x[1]);
    const sIds = [...streamHtml.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map((x) => x[1]);

    // Known seed video IDs from Tyler Gaulden's library
    const fallbackIds = [
      'Acb9DJua4lU',
      'cofW0MYm5yU',
      'I_sX09349Us',
      'L6bHhBCKEJc',
      'ZKk5mlATdug',
      'pKBLnLI8ogM',
      'MN9OC5wMtHk',
      'wQ3PS8RgPnE',
      '7rqeQ2rXDG0',
      'vurK11ktiyE',
      'HgnfUJeLym0',
      '7foOkL4WDng',
      'qSFaPL_TP-k',
      'oEDMj7Wo5eQ',
      'usenjtylAA0',
    ];

    const allCandidateIds = Array.from(new Set([...vIds, ...sIds, ...fallbackIds]));
    console.log(`[Tyler Gaulden Sync] Discovered ${allCandidateIds.length} candidate video IDs from @TylerGaulden`);

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
      const rawTitle = oembed?.title || 'Tyler Gaulden Gospel Message';
      const title = rawTitle.replace(/\s*\|\s*Tyler Gaulden/gi, '').trim();
      const speaker = 'Pastor Tyler Gaulden';
      const channel = 'Tyler Gaulden';
      const mediaUrl = `https://www.youtube.com/watch?v=${ytId}`;
      const thumbnailUrl = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
      const dateRecorded = new Date().toISOString().split('T')[0];

      db.createSermon(
        title,
        speaker,
        'Tyler Gaulden Pulpit Messages',
        undefined,
        `Bible preaching by Pastor Tyler Gaulden from his official ministry channel. Title: ${title}`,
        'video',
        mediaUrl,
        45 * 60,
        dateRecorded,
        thumbnailUrl,
        channel,
        1
      );
      addedCount++;
    }

    const totalNow = (db as any).db
      .prepare('SELECT count(*) as c FROM sermons_podcasts')
      .get().c;

    console.log(`[Tyler Gaulden Sync] Finished! Added: ${addedCount}, Existing: ${existingCount}, Total now: ${totalNow}`);
    return { addedCount, existingCount, totalNow };
  } catch (err: any) {
    console.error('[Tyler Gaulden Sync] Error:', err);
    return { addedCount: 0, existingCount: 0, totalNow: 0 };
  }
}
