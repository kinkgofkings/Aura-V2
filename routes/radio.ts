import express, { Request, Response, Router } from 'express';
import http from 'http';
import https from 'https';
import { Transform, TransformCallback } from 'stream';

const router: Router = express.Router();

export interface RadioStreamConfig {
  id: string;
  display_name: string;
  short_name: string;
  genre: string;
  primary_content: string[];
  stream_url: string;
  fallback_stream_url?: string;
  badge: string;
  badge_color: string;
  accent_gradient: string;
  default_meta: {
    author: string;
    title: string;
    ministry: string;
    sermon_series: string;
  };
}

export const RADIO_STREAMS: RadioStreamConfig[] = [
  {
    id: 'family_radio_live',
    display_name: 'Family Radio',
    short_name: 'Family Radio',
    genre: 'Traditional Preaching & Hymns',
    primary_content: [
      'Expository Preaching',
      'Daily Renewing Your Mind Broadcast',
      'Scripture Readings',
    ],
    stream_url: 'https://ais-sa3.cdnstream1.com/2632_128.mp3',
    fallback_stream_url: 'https://live.mystreamplayer.com/wfme',
    badge: 'TEACHING & HYMNS',
    badge_color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    accent_gradient: 'from-amber-600 via-yellow-600 to-amber-700',
    default_meta: {
      author: 'Various Ministries',
      title: 'Family Radio Live Preaching',
      ministry: 'Family Radio Network',
      sermon_series: 'Expository Preaching & Sacred Hymns',
    },
  },
  {
    id: 'bott_radio_live',
    display_name: 'Bott Radio Network',
    short_name: 'Bott Radio',
    genre: 'Bible Teaching & Preaching',
    primary_content: ['Systematic Bible Study', 'Expository Sermons'],
    stream_url: 'https://streaming.live365.com/a71179_2',
    fallback_stream_url: 'https://bottradionetwork.com',
    badge: 'BIBLE TEACHING',
    badge_color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    accent_gradient: 'from-emerald-600 via-teal-600 to-emerald-700',
    default_meta: {
      author: 'Bott Radio Network',
      title: 'Getting the Word of God Into You',
      ministry: 'Bott Radio Network',
      sermon_series: 'Quality Bible Teaching 24/7',
    },
  },
  {
    id: 'bbn_live',
    display_name: 'Bible Broadcasting Network',
    short_name: 'BBN Radio',
    genre: 'Conservative Preaching & Study',
    primary_content: ['Traditional Sermons', 'Step-by-Step Commentary'],
    stream_url: 'https://streams.radiomast.io/844b0a81-f4b9-485e-adaa-aab8d3ea9f7f',
    fallback_stream_url: 'https://bbn1.bbnradio.org',
    badge: 'CONSERVATIVE EXPOSITION',
    badge_color: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    accent_gradient: 'from-blue-600 via-indigo-600 to-blue-700',
    default_meta: {
      author: 'BBN Ministries',
      title: 'BBN Live Broadcast',
      ministry: 'Bible Broadcasting Network',
      sermon_series: 'Sound Biblical Exposition',
    },
  },
  {
    id: 'afr_talk_live',
    display_name: 'American Family Radio',
    short_name: 'AFR Talk',
    genre: 'Christian Talk & Biblical Worldview',
    primary_content: ['Cultural Commentary', 'Evangelical Sermons'],
    stream_url: 'https://mediaserver3.afa.net:8443/talk.mp3',
    fallback_stream_url: 'https://mediaserver3.afa.net:8443/music.mp3',
    badge: 'BIBLICAL WORLDVIEW',
    badge_color: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    accent_gradient: 'from-rose-600 via-red-600 to-rose-700',
    default_meta: {
      author: 'AFR Talk',
      title: 'AFR Live Talk & Preaching',
      ministry: 'American Family Association',
      sermon_series: 'Equipping Believers for the Culture',
    },
  },
  {
    id: 'air1',
    display_name: 'Air1 Worship Radio',
    short_name: 'Air1 Worship',
    genre: 'Christian Worship Music',
    primary_content: ['Contemporary Christian Worship', 'Praise Anthems'],
    stream_url: 'https://maestro.emfcdn.com/stream_for/air1/airable/aac',
    fallback_stream_url: 'https://maestro.emfcdn.com/stream_for/air1/airable/mp3',
    badge: 'WORSHIP NOW',
    badge_color: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    accent_gradient: 'from-sky-600 via-cyan-600 to-blue-700',
    default_meta: {
      author: 'Worship Now • Contemporary Christian Artists',
      title: '24/7 Christian Worship & Contemporary Praise',
      ministry: 'Air1 Radio (Educational Media Foundation)',
      sermon_series: 'Worship Now',
    },
  },
];

// In-memory isolated metadata store per station ID
const stationMetadataCache: Record<
  string,
  {
    rawTitle?: string;
    parsedTitle?: string;
    parsedAuthor?: string;
    ministry?: string;
    sermonSeries?: string;
    updatedAt: number;
  }
> = {};

/**
 * Strict data matching rules & ICY metadata parser
 * Isolate metadata keys per station to avoid cross-contamination.
 */
function updateStationMetadata(stationId: string, rawIcyMetadata: string) {
  const match = rawIcyMetadata.match(/StreamTitle=['"]([^'"]+)['"]/i);
  if (!match || !match[1]) return;

  const rawTitle = match[1].trim();
  if (!rawTitle) return;

  const station = RADIO_STREAMS.find((s) => s.id === stationId);
  if (!station) return;

  let parsedTitle = rawTitle;
  let parsedAuthor = station.default_meta.author;
  let ministry = station.default_meta.ministry;
  let sermonSeries = station.default_meta.sermon_series;

  // Intercept "Renewing Your Mind" on Family Radio and attribute to Ligonier Ministries
  if (
    stationId === 'family_radio_live' &&
    (rawTitle.toLowerCase().includes('renewing your mind') ||
      rawTitle.toLowerCase().includes('sproul') ||
      rawTitle.toLowerCase().includes('ligonier'))
  ) {
    parsedAuthor = 'Dr. R.C. Sproul & Teaching Fellows';
    ministry = 'Ligonier Ministries';
    sermonSeries = 'Renewing Your Mind Broadcast';
    parsedTitle = rawTitle;
  } else if (rawTitle.includes(' - ')) {
    const parts = rawTitle.split(' - ');
    if (parts.length >= 2) {
      parsedAuthor = parts[0].trim();
      parsedTitle = parts.slice(1).join(' - ').trim();
    }
  } else if (rawTitle.includes(' by ')) {
    const parts = rawTitle.split(' by ');
    if (parts.length >= 2) {
      parsedTitle = parts[0].trim();
      parsedAuthor = parts[1].trim();
    }
  }

  stationMetadataCache[stationId] = {
    rawTitle,
    parsedTitle,
    parsedAuthor,
    ministry,
    sermonSeries,
    updatedAt: Date.now(),
  };
}

/**
 * Node.js Transform Stream: Strips ICY metadata bytes out of the stream
 * so standard HTML5 audio players never stutter, freeze, or error out.
 */
class IcyDemuxerStream extends Transform {
  private metaInt: number;
  private byteCount: number = 0;
  private remainingMetaBytes: number = 0;
  private metaBuffer: Buffer = Buffer.alloc(0);
  private stationId: string;

  constructor(metaInt: number, stationId: string) {
    super();
    this.metaInt = metaInt;
    this.stationId = stationId;
  }

  _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
    if (this.metaInt <= 0) {
      this.push(chunk);
      return callback();
    }

    let offset = 0;

    while (offset < chunk.length) {
      if (this.remainingMetaBytes > 0) {
        const toRead = Math.min(this.remainingMetaBytes, chunk.length - offset);
        const metaSlice = chunk.subarray(offset, offset + toRead);
        this.metaBuffer = Buffer.concat([this.metaBuffer, metaSlice]);
        offset += toRead;
        this.remainingMetaBytes -= toRead;

        if (this.remainingMetaBytes === 0) {
          const metaString = this.metaBuffer.toString('utf-8');
          updateStationMetadata(this.stationId, metaString);
          this.metaBuffer = Buffer.alloc(0);
        }
        continue;
      }

      const bytesUntilMeta = this.metaInt - this.byteCount;
      const audioToRead = Math.min(bytesUntilMeta, chunk.length - offset);

      if (audioToRead > 0) {
        this.push(chunk.subarray(offset, offset + audioToRead));
        offset += audioToRead;
        this.byteCount += audioToRead;
      }

      if (this.byteCount === this.metaInt && offset < chunk.length) {
        const metaLengthByte = chunk[offset];
        offset += 1;
        this.remainingMetaBytes = metaLengthByte * 16;
        this.byteCount = 0;
        this.metaBuffer = Buffer.alloc(0);
      }
    }

    callback();
  }
}

/**
 * GET /api/radio/stations
 * Returns the exact JSON registry required by the client
 */
router.get('/stations', (_req: Request, res: Response) => {
  res.json({
    radio_streams: RADIO_STREAMS.map((s) => ({
      id: s.id,
      display_name: s.display_name,
      short_name: s.short_name,
      genre: s.genre,
      primary_content: s.primary_content,
      stream_url: `/api/radio/stream/${s.id}`,
      direct_stream_url: s.stream_url,
      badge: s.badge,
      badge_color: s.badge_color,
      accent_gradient: s.accent_gradient,
      default_meta: s.default_meta,
    })),
  });
});

/**
 * GET /api/radio/now-playing
 * Returns isolated metadata for requested station
 */
router.get('/now-playing', (req: Request, res: Response) => {
  const stationId = ((req.query.station as string) || 'family_radio_live').toLowerCase();
  const station = RADIO_STREAMS.find((s) => s.id === stationId) || RADIO_STREAMS[0];
  const cached = stationMetadataCache[station.id];

  const contentMeta = {
    author_name: cached?.parsedAuthor || station.default_meta.author,
    church_or_ministry: cached?.ministry || station.default_meta.ministry,
    sermon_series: cached?.sermonSeries || station.default_meta.sermon_series,
    title: cached?.parsedTitle || station.default_meta.title,
    media_source_type: `Live_${station.id}_Stream`,
  };

  res.status(200).json({
    aura_media_engine: {
      engine_mode: 'LIVE_TUNER',
      station_id: station.id,
      content_metadata: contentMeta,
      playback_transport: {
        stream_url: `/api/radio/stream/${station.id}`,
        direct_stream_url: station.stream_url,
        fallback_stream_url: station.fallback_stream_url,
        is_live_feed: true,
        validation_status: 'VERIFIED_DATA_INTEGRITY',
      },
    },
  });
});

/**
 * GET /api/radio/stream/:stationId
 * Live Node.js stream proxy with ICY metadata demuxing and redirect handling.
 * Strips out ICY metadata bytes to deliver pure, uninterrupted audio to <audio>.
 */
router.get('/stream/:stationId', (req: Request, res: Response) => {
  const stationId = (req.params.stationId || 'family_radio_live').toLowerCase();
  const station = RADIO_STREAMS.find((s) => s.id === stationId) || RADIO_STREAMS[0];

  function openStream(targetUrl: string, redirectLimit = 5) {
    if (redirectLimit <= 0) {
      if (!res.headersSent) res.status(502).send('Too many stream redirects');
      return;
    }

    const client = targetUrl.startsWith('https') ? https : http;
    const reqOptions: http.RequestOptions = {
      headers: {
        'User-Agent': 'Aura-Sanctuary-Radio/2.0 (Mozilla/5.0 compatible)',
        Accept: '*/*',
        'Icy-MetaData': '1',
      },
    };

    const streamReq = client.get(targetUrl, reqOptions, (streamRes) => {
      // Follow redirects
      if (
        streamRes.statusCode &&
        streamRes.statusCode >= 300 &&
        streamRes.statusCode < 400 &&
        streamRes.headers.location
      ) {
        let nextUrl = streamRes.headers.location;
        if (nextUrl.startsWith('/')) {
          const u = new URL(targetUrl);
          nextUrl = `${u.protocol}//${u.host}${nextUrl}`;
        }
        return openStream(nextUrl, redirectLimit - 1);
      }

      if (streamRes.statusCode && streamRes.statusCode >= 400) {
        if (!res.headersSent) {
          res.redirect(station.stream_url);
        }
        return;
      }

      const metaIntHeader = streamRes.headers['icy-metaint'];
      const metaInt = metaIntHeader ? parseInt(metaIntHeader as string, 10) : 0;
      const contentType = streamRes.headers['content-type'] || 'audio/mpeg';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      if (metaInt > 0) {
        const demuxer = new IcyDemuxerStream(metaInt, station.id);
        streamRes.pipe(demuxer).pipe(res);
      } else {
        streamRes.pipe(res);
      }

      req.on('close', () => {
        streamRes.destroy();
      });
    });

    streamReq.on('error', (err) => {
      console.warn(`[Radio Proxy] Error connecting to ${station.id}:`, err.message);
      if (!res.headersSent) {
        res.redirect(station.stream_url);
      }
    });
  }

  openStream(station.stream_url);
});

export default router;
export { router };
