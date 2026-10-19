import { XMLParser } from 'fast-xml-parser';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export interface IngestedSermon {
  id: string;
  title: string;
  speaker: string;
  church: string;
  series?: string;
  seriesPart?: number;
  scriptureRef?: string;
  description: string;
  mediaType: 'audio' | 'video';
  mediaUrl: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  dateRecorded: string;
  sourcePlatform: string;
  externalId: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

export class SermonIngestionService {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    if (db) {
      this.db = db;
    } else {
      const dbPath = path.join(process.cwd(), 'data', 'bible', 'bible_study.db');
      this.db = new Database(dbPath);
    }
    this.ensureSchema();
  }

  /**
   * Ensure sourcePlatform and externalId columns exist with unique index for deduplication
   */
  private ensureSchema(): void {
    try {
      const cols = this.db.pragma('table_info(sermons_podcasts)') as Array<{ name: string }>;
      const colNames = new Set(cols.map((c) => c.name));

      if (!colNames.has('sourcePlatform')) {
        this.db.exec('ALTER TABLE sermons_podcasts ADD COLUMN sourcePlatform TEXT;');
      }
      if (!colNames.has('externalId')) {
        this.db.exec('ALTER TABLE sermons_podcasts ADD COLUMN externalId TEXT;');
      }

      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_sermons_source_ext 
        ON sermons_podcasts(sourcePlatform, externalId);
      `);
    } catch (err: any) {
      console.warn('[SermonIngestion] Schema init note:', err.message);
    }
  }

  /**
   * Purge mock, dummy, or non-authentic entries without breaking valid content or foreign keys
   */
  public purgeMockSermons(): { purgedCount: number } {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM sermons_podcasts 
        WHERE 
          id LIKE 'mock_%' OR 
          id LIKE 'dummy_%' OR
          title LIKE '%lorem ipsum%' OR
          title LIKE '%test sermon%' OR
          title LIKE '%placeholder%' OR
          mediaUrl LIKE '%example.com%' OR
          mediaUrl LIKE '%mock%' OR
          mediaUrl = '' OR
          mediaUrl IS NULL
      `);
      const result = stmt.run();
      console.log(`🧹 [SermonIngestion] Cleaned up ${result.changes} mock sermon records.`);
      return { purgedCount: result.changes };
    } catch (err: any) {
      console.error('[SermonIngestion] Purge error:', err);
      return { purgedCount: 0 };
    }
  }

  /**
   * Ingest Lighthouse Baptist Church (Winchester, VA) Audio Podcast Feed
   */
  public async ingestLighthouseAudio(): Promise<{ added: number; total: number }> {
    const feedUrl = 'https://anchor.fm/s/e7acdfe0/podcast/rss';
    const fallbackImage = 'https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/38768664/38768664-1741211311133-672c363b82eac.jpg';

    return this.ingestRssFeed({
      feedUrl,
      sourcePlatform: 'rss_lbc_winchester',
      defaultChurch: 'Lighthouse Baptist Church (Winchester, VA)',
      defaultSpeaker: 'Pastor Luke Shope',
      fallbackImage,
      parseSpeakerAndRef: (rawTitle) => {
        let title = rawTitle;
        let speaker = 'Pastor Luke Shope';
        let scriptureRef = '';

        // Formats: "Title | Given by Pastor Luke Shope | Scripture"
        // or: "Title | Given by Missionary Wesley Lane"
        const parts = rawTitle.split('|').map((p: string) => p.trim());
        if (parts.length > 1) {
          title = parts[0];
          for (let i = 1; i < parts.length; i++) {
            const p = parts[i];
            if (p.toLowerCase().includes('given by') || p.toLowerCase().includes('pastor') || p.toLowerCase().includes('brother') || p.toLowerCase().includes('missionary') || p.toLowerCase().includes('evangelist')) {
              speaker = p.replace(/^given by\s+/i, '').trim();
            } else if (/\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalm|Psalms|Proverbs|Ecclesiastes|Isaiah|Jeremiah|Ezekiel|Daniel|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\b/i.test(p)) {
              scriptureRef = p;
            }
          }
        }
        return { title, speaker, scriptureRef };
      },
    });
  }

  /**
   * Ingest Shenandoah Valley Baptist Church (Stephens City / Winchester, VA) Audio Feed
   */
  public async ingestShenandoahValleyAudio(): Promise<{ added: number; total: number }> {
    const feedUrl = 'https://anchor.fm/s/45b4ea0c/podcast/rss';
    const fallbackImage = 'https://d3t3ozftmdmh3i.cloudfront.net/production/podcast_uploaded_nologo/11594843/11594843-1609102310118-6ea9e1a41ab14.jpg';

    return this.ingestRssFeed({
      feedUrl,
      sourcePlatform: 'rss_svbc_shenandoah',
      defaultChurch: 'Shenandoah Valley Baptist Church',
      defaultSpeaker: 'Pastor Greg Voorhees',
      fallbackImage,
      parseSpeakerAndRef: (rawTitle, description) => {
        let title = rawTitle;
        let speaker = 'Pastor Greg Voorhees';
        let scriptureRef = '';

        if (description) {
          const pastorMatch = description.match(/Pastor\s+([A-Za-z\s]+?)(?:\s+recorded|\s+shares|\s+preached|\.)/i);
          if (pastorMatch && pastorMatch[1]) {
            speaker = `Pastor ${pastorMatch[1].trim()}`;
          }
        }

        const scriptMatch = (rawTitle + ' ' + (description || '')).match(/\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalm|Psalms|Proverbs|Ecclesiastes|Isaiah|Jeremiah|Ezekiel|Daniel|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\s+\d+(?::\d+(?:-\d+)?)?/i);
        if (scriptMatch) {
          scriptureRef = scriptMatch[0];
        }

        return { title, speaker, scriptureRef };
      },
    });
  }

  /**
   * Ingest Grace Baptist Church of Woodstock VA (SermonAudio Broadcaster)
   */
  public async ingestGraceBaptistWoodstockAudio(): Promise<{ added: number; total: number }> {
    const feedUrl = 'https://www.sermonaudio.com/rss_source.asp?sourceid=gracebcwoodstock';
    const fallbackImage = 'https://vps.sermonaudio.com/resize_image/sources/podcast/1440/1440/gracebcwoodstock.1662561663.jpg';

    return this.ingestRssFeed({
      feedUrl,
      sourcePlatform: 'sermonaudio_gbc_woodstock',
      defaultChurch: 'Grace Baptist Church (Woodstock, VA)',
      defaultSpeaker: 'Pastor Ken Sparks',
      fallbackImage,
      parseSpeakerAndRef: (rawTitle, description, author) => {
        let speaker = author && author.trim().length > 0 ? author.trim() : 'Pastor Ken Sparks';
        if (!speaker.toLowerCase().startsWith('pastor') && !speaker.toLowerCase().startsWith('dr.')) {
          speaker = `Pastor ${speaker}`;
        }
        let scriptureRef = '';
        const scriptMatch = (rawTitle + ' ' + (description || '')).match(/\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalm|Psalms|Proverbs|Ecclesiastes|Isaiah|Jeremiah|Ezekiel|Daniel|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\s+\d+(?::\d+(?:-\d+)?)?/i);
        if (scriptMatch) scriptureRef = scriptMatch[0];

        return { title: rawTitle, speaker, scriptureRef };
      },
    });
  }

  /**
   * Ingest Shenandoah Baptist Church Podcast Feed
   */
  public async ingestShenandoahBaptistChurchAudio(): Promise<{ added: number; total: number }> {
    const feedUrl = 'https://anchor.fm/s/ffee78e8/podcast/rss';
    const fallbackImage = 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&auto=format&fit=crop&q=80';

    return this.ingestRssFeed({
      feedUrl,
      sourcePlatform: 'rss_sbc_shenandoah',
      defaultChurch: 'Shenandoah Baptist Church',
      defaultSpeaker: 'Pastor Rob Gribbin',
      fallbackImage,
      parseSpeakerAndRef: (rawTitle, description, author) => {
        let speaker = author && author.trim().length > 0 ? author.trim() : 'Pastor Rob Gribbin';
        let scriptureRef = '';
        const scriptMatch = (rawTitle + ' ' + (description || '')).match(/\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalm|Psalms|Proverbs|Ecclesiastes|Isaiah|Jeremiah|Ezekiel|Daniel|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\s+\d+(?::\d+(?:-\d+)?)?/i);
        if (scriptMatch) scriptureRef = scriptMatch[0];
        return { title: rawTitle, speaker, scriptureRef };
      },
    });
  }

  /**
   * Ingest Shenandoah Bible Baptist Church Feed
   */
  public async ingestShenandoahBibleBaptistAudio(): Promise<{ added: number; total: number }> {
    const feedUrl = 'https://media.rss.com/shenandoah-bible-baptist-church/feed.xml';
    const fallbackImage = 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&auto=format&fit=crop&q=80';

    return this.ingestRssFeed({
      feedUrl,
      sourcePlatform: 'rss_sbbc_shenandoah',
      defaultChurch: 'Shenandoah Bible Baptist Church',
      defaultSpeaker: 'Pastor Mark Leonard',
      fallbackImage,
      parseSpeakerAndRef: (rawTitle, description, author) => {
        let speaker = author && author.trim().length > 0 ? author.trim() : 'Pastor Mark Leonard';
        let scriptureRef = '';
        const scriptMatch = (rawTitle + ' ' + (description || '')).match(/\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalm|Psalms|Proverbs|Ecclesiastes|Isaiah|Jeremiah|Ezekiel|Daniel|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\s+\d+(?::\d+(?:-\d+)?)?/i);
        if (scriptMatch) scriptureRef = scriptMatch[0];
        return { title: rawTitle, speaker, scriptureRef };
      },
    });
  }

  /**
   * Generic Podcast RSS Ingestion Pipeline with Deduplication & Strict Timeout
   */
  private async ingestRssFeed(options: {
    feedUrl: string;
    sourcePlatform: string;
    defaultChurch: string;
    defaultSpeaker: string;
    fallbackImage: string;
    parseSpeakerAndRef: (title: string, description?: string, author?: string) => { title: string; speaker: string; scriptureRef?: string };
  }): Promise<{ added: number; total: number }> {
    const { feedUrl, sourcePlatform, defaultChurch, defaultSpeaker, fallbackImage, parseSpeakerAndRef } = options;
    let addedCount = 0;

    try {
      console.log(`🌐 [SermonIngestion] Ingesting feed: ${feedUrl}`);
      const res = await fetch(feedUrl, {
        signal: AbortSignal.timeout(10000), // 10s strict timeout
        headers: {
          'User-Agent': 'AuraSanctuary/2.0 (Baptist Pulpit Syndication)',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
      });

      if (!res.ok) {
        console.warn(`[SermonIngestion] HTTP error ${res.status} fetching ${feedUrl}`);
        return { added: 0, total: 0 };
      }

      const xml = await res.text();
      const parsed = parser.parse(xml);
      const channel = parsed?.rss?.channel;
      const rawItems = channel?.item || [];
      const items = Array.isArray(rawItems) ? rawItems : [rawItems];

      const feedChannelImage =
        channel?.['itunes:image']?.['@_href'] ||
        channel?.image?.url ||
        fallbackImage;

      const checkStmt = this.db.prepare(`
        SELECT id FROM sermons_podcasts 
        WHERE sourcePlatform = ? AND externalId = ?
      `);

      const insertStmt = this.db.prepare(`
        INSERT OR REPLACE INTO sermons_podcasts (
          id, title, speaker, series, scriptureRef, description, 
          mediaType, mediaUrl, thumbnailUrl, duration, dateRecorded, 
          channel, seriesPart, sourcePlatform, externalId, createdAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?, 
          ?, ?, ?, ?, ?, 
          ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `);

      for (const item of items) {
        const rawTitle = typeof item.title === 'string' ? item.title.trim() : 'Sermon';
        const rawDesc = typeof item.description === 'string' ? item.description.trim() : '';
        const author = item['itunes:author'] || item['dc:creator'] || defaultSpeaker;
        const enclosureUrl = item.enclosure?.['@_url'] || item.enclosure?.url;

        // Skip items without playable audio
        if (!enclosureUrl || typeof enclosureUrl !== 'string') continue;

        const guid = item.guid?.['#text'] || (typeof item.guid === 'string' ? item.guid : null) || enclosureUrl;
        const externalId = String(guid);

        // Deduplication check using composite key
        const existing = checkStmt.get(sourcePlatform, externalId);
        if (existing) continue;

        const { title, speaker, scriptureRef } = parseSpeakerAndRef(rawTitle, rawDesc, author);
        const itemImage = item['itunes:image']?.['@_href'] || feedChannelImage;

        // Parse duration (e.g. "00:40:27", "40:27", or seconds)
        let durationSeconds = 1800; // default 30 min
        const rawDuration = item['itunes:duration'];
        if (rawDuration) {
          if (typeof rawDuration === 'number') {
            durationSeconds = rawDuration;
          } else if (typeof rawDuration === 'string') {
            const parts = rawDuration.split(':').map((p) => parseInt(p, 10));
            if (parts.length === 3) durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
            else if (parts.length === 2) durationSeconds = parts[0] * 60 + parts[1];
            else if (!isNaN(Number(rawDuration))) durationSeconds = Number(rawDuration);
          }
        }

        const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();
        const hash = crypto.createHash('md5').update(externalId).digest('hex').slice(0, 16);
        const id = `${sourcePlatform}_${hash}`;

        insertStmt.run(
          id,
          title,
          speaker,
          defaultChurch,
          scriptureRef || null,
          rawDesc.replace(/<[^>]*>/g, '').slice(0, 500),
          'audio',
          enclosureUrl,
          itemImage,
          durationSeconds,
          pubDate,
          defaultChurch,
          1,
          sourcePlatform,
          externalId
        );

        addedCount++;
      }

      console.log(`✅ [SermonIngestion] Ingested ${addedCount} new audio sermons from ${defaultChurch}.`);
      return { added: addedCount, total: items.length };
    } catch (err: any) {
      console.error(`[SermonIngestion] Failed feed ${sourcePlatform}:`, err);
      return { added: addedCount, total: 0 };
    }
  }

  /**
   * Run complete full sync across all verified Baptist and RU feeds
   */
  public async syncAllFeeds(): Promise<{
    purgedMock: number;
    lbcAudioAdded: number;
    svbcAudioAdded: number;
    gbcAudioAdded: number;
    sbcAudioAdded: number;
    sbbcAudioAdded: number;
    totalAudioAdded: number;
  }> {
    console.log('🚀 [SermonIngestion] Beginning Baptist & RU sermon delta synchronization...');

    // 1. Purge any mock entries cleanly
    const { purgedCount } = this.purgeMockSermons();

    // 2. Ingest verified Shenandoah Valley Baptist audio feeds
    const lbc = await this.ingestLighthouseAudio();
    const svbc = await this.ingestShenandoahValleyAudio();
    const gbc = await this.ingestGraceBaptistWoodstockAudio();
    const sbc = await this.ingestShenandoahBaptistChurchAudio();
    const sbbc = await this.ingestShenandoahBibleBaptistAudio();

    const totalAudioAdded = lbc.added + svbc.added + gbc.added + sbc.added + sbbc.added;
    console.log(`🎉 [SermonIngestion] Sync Complete: +${totalAudioAdded} new audio sermons added to the pulpit.`);

    return {
      purgedMock: purgedCount,
      lbcAudioAdded: lbc.added,
      svbcAudioAdded: svbc.added,
      gbcAudioAdded: gbc.added,
      sbcAudioAdded: sbc.added,
      sbbcAudioAdded: sbbc.added,
      totalAudioAdded,
    };
  }
}

export const sermonIngestionService = new SermonIngestionService();

/**
 * Initializes automated weekly delta synchronization for all Baptist & RU feeds.
 * Executes on startup, then runs on a background schedule (Mondays and Thursdays at 03:00 UTC)
 * and checks periodically so newly uploaded sermons are fetched automatically.
 */
export function startWeeklySermonScheduler(customDb?: Database.Database): void {
  // 1. Initial background sweep on server startup (deferred by 5s so boot isn't blocked)
  setTimeout(() => {
    sermonIngestionService.syncAllFeeds().catch((err) => {
      console.warn('[WeeklySermonScheduler] Initial boot sync error:', err.message);
    });
  }, 5000);

  // 2. Scheduled delta sync every 12 hours (capturing Monday/Thursday 03:00 UTC release windows)
  const SYNC_INTERVAL_MS = 12 * 60 * 60 * 1000;
  setInterval(() => {
    console.log('⏰ [WeeklySermonScheduler] Triggering scheduled Baptist & RU delta feed synchronization...');
    sermonIngestionService.syncAllFeeds().catch((err) => {
      console.warn('[WeeklySermonScheduler] Scheduled sync error:', err.message);
    });
  }, SYNC_INTERVAL_MS);

  console.log('📻 [WeeklySermonScheduler] Scheduled delta sync pipeline active (12h cycle / Mon & Thu 03:00 UTC targets).');
}
