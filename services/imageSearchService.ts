/**
 * Image Search Service for Winchester Xpress / Aura Sanctuary
 * 
 * Supports:
 * 1. Pexels API (when PEXELS_API_KEY is configured in .env)
 * 2. Live Wikimedia Commons high-resolution photography search (no API key needed, unlimited free queries)
 * 3. Comprehensive curated keyword-indexed Christian & worship photography catalog
 */

export interface ImageSearchResult {
  id: string;
  url: string;
  thumb: string;
  author: string;
  photographer_url?: string;
  alt_description: string;
  urls: {
    regular: string;
    full: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
  };
}

// Curated high-resolution spiritual, worship, and biblical photography with keyword tags
export interface TaggedImage {
  id: string;
  url: string;
  thumb: string;
  author: string;
  title: string;
  tags: string[];
}

export const CURATED_CHRISTIAN_LIBRARY: TaggedImage[] = [
  // Cross & Calvary
  {
    id: 'cross_dawn_1',
    url: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=450&auto=format&fit=crop&q=80',
    author: 'Aaron Burden',
    title: 'Wooden Cross at Sunrise',
    tags: ['cross', 'calvary', 'jesus', 'salvation', 'sunrise', 'dawn', 'redemption', 'crucifixion', 'silhouette', 'easter']
  },
  {
    id: 'cross_rays_2',
    url: 'https://images.unsplash.com/photo-1510936111840-65e151470180?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1510936111840-65e151470180?w=450&auto=format&fit=crop&q=80',
    author: 'Chad Madden',
    title: 'Cross Radiating Celestial Light',
    tags: ['cross', 'light', 'clouds', 'sunbeams', 'heaven', 'glory', 'god', 'holy', 'hope', 'jesus', 'worship']
  },
  {
    id: 'cross_hilltop_3',
    url: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=450&auto=format&fit=crop&q=80',
    author: 'Diana Vargas',
    title: 'Cross on Grassy Hill',
    tags: ['cross', 'hill', 'calvary', 'nature', 'landscape', 'faith', 'christian', 'peace']
  },
  {
    id: 'cross_sunset_4',
    url: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=450&auto=format&fit=crop&q=80',
    author: 'Patrick Fore',
    title: 'Golden Sunset Silhouette of Cross',
    tags: ['cross', 'sunset', 'sky', 'warmth', 'evening', 'redemption', 'symbolic', 'dusk']
  },

  // Holy Bible & Scripture
  {
    id: 'bible_open_1',
    url: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=450&auto=format&fit=crop&q=80',
    author: 'Aaron Burden',
    title: 'Open Holy Bible with Warm Light',
    tags: ['bible', 'scripture', 'holy bible', 'open bible', 'study', 'gods word', 'reading', 'kjv', 'pages', 'verse']
  },
  {
    id: 'bible_desk_2',
    url: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=450&auto=format&fit=crop&q=80',
    author: 'Aaron Burden',
    title: 'Scripture Study Table',
    tags: ['bible', 'scripture', 'desk', 'devotional', 'study', 'coffee', 'morning', 'living word']
  },
  {
    id: 'bible_leather_3',
    url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=450&auto=format&fit=crop&q=80',
    author: 'Aaron Burden',
    title: 'Vintage Leather Bound Bible',
    tags: ['bible', 'leather', 'antique', 'vintage', 'scripture', 'proverbs', 'psalms', 'wisdom']
  },
  {
    id: 'bible_lamp_4',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=450&auto=format&fit=crop&q=80',
    author: 'Benjamin Davies',
    title: 'Bible and Lantern in the Wilderness',
    tags: ['bible', 'lamp', 'light unto my path', 'psalm 119', 'word', 'guide', 'mountains']
  },

  // Church, Sanctuary & Cathedrals
  {
    id: 'church_sanctuary_1',
    url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=450&auto=format&fit=crop&q=80',
    author: 'Ben White',
    title: 'Sunbeams Streaming Through Church Windows',
    tags: ['church', 'sanctuary', 'window', 'sunbeams', 'cathedral', 'pews', 'historic', 'chapel', 'altar', 'architecture']
  },
  {
    id: 'church_cathedral_2',
    url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=450&auto=format&fit=crop&q=80',
    author: 'Patrick Fore',
    title: 'Cathedral Nave and Warm Candle Glow',
    tags: ['cathedral', 'church', 'candles', 'sanctuary', 'nave', 'arches', 'altar', 'chapel']
  },
  {
    id: 'church_stained_glass_3',
    url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=450&auto=format&fit=crop&q=80',
    author: 'K. Mitch Hodge',
    title: 'Stained Glass Cathedral Window',
    tags: ['stained glass', 'glass', 'mosaic', 'cathedral', 'church', 'colors', 'sacred', 'art', 'jesus']
  },
  {
    id: 'church_architecture_4',
    url: 'https://images.unsplash.com/photo-1548316131-7b0b7496efee?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1548316131-7b0b7496efee?w=450&auto=format&fit=crop&q=80',
    author: 'Karl Fredrickson',
    title: 'Classic White Steeple Country Church',
    tags: ['church', 'steeple', 'country church', 'baptist', 'sanctuary', 'building', 'chapel', 'heritage']
  },

  // Worship & Praise
  {
    id: 'worship_hands_1',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=450&auto=format&fit=crop&q=80',
    author: 'Chad Madden',
    title: 'Hands Raised in Worship',
    tags: ['worship', 'praise', 'hands raised', 'service', 'congregation', 'church service', 'music', 'singing', 'adoration']
  },
  {
    id: 'worship_lights_2',
    url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=450&auto=format&fit=crop&q=80',
    author: 'Sam Balye',
    title: 'Praise and Worship Stage Lighting',
    tags: ['worship', 'praise', 'stage', 'lights', 'worship team', 'choir', 'band', 'acoustic', 'concert of prayer']
  },
  {
    id: 'worship_guitar_3',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=450&auto=format&fit=crop&q=80',
    author: 'Austin Neill',
    title: 'Acoustic Guitar Praise Musician',
    tags: ['worship', 'guitar', 'music', 'praise', 'acoustic', 'hymns', 'songs', 'musician', 'choir']
  },

  // Prayer, Intercession & Fellowship
  {
    id: 'prayer_candle_1',
    url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=450&auto=format&fit=crop&q=80',
    author: 'Nicola Fioravanti',
    title: 'Reverent Candlelight Prayer',
    tags: ['prayer', 'praying', 'candle', 'candles', 'intercession', 'peace', 'meditation', 'quiet time', 'solitude', 'supplication']
  },
  {
    id: 'prayer_gathering_2',
    url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=450&auto=format&fit=crop&q=80',
    author: 'Priscilla Du Preez',
    title: 'Believers Holding Hands in Prayer',
    tags: ['prayer', 'fellowship', 'community', 'holding hands', 'unity', 'church family', 'gathering', 'intercession']
  },
  {
    id: 'prayer_hands_3',
    url: 'https://images.unsplash.com/photo-1445445290350-18a3b86e0b5b?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1445445290350-18a3b86e0b5b?w=450&auto=format&fit=crop&q=80',
    author: 'Priscilla Du Preez',
    title: 'Folded Hands in Humble Prayer',
    tags: ['prayer', 'hands', 'folded hands', 'humility', 'petition', 'supplication', 'faith', 'devotion']
  },

  // Communion & The Lord's Supper
  {
    id: 'communion_bread_wine_1',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=450&auto=format&fit=crop&q=80',
    author: 'Mae Mu',
    title: 'The Bread of Life',
    tags: ['communion', 'bread', 'lords supper', 'body of christ', 'eucharist', 'table', 'sacrament', 'remembrance']
  },
  {
    id: 'communion_cup_2',
    url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=450&auto=format&fit=crop&q=80',
    author: 'Thomas Martinsen',
    title: 'The Cup of the New Covenant',
    tags: ['communion', 'wine', 'cup', 'grape', 'blood of christ', 'covenant', 'supper', 'fellowship']
  },

  // Preacher, Pulpit & Sermon
  {
    id: 'pastor_preaching_1',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=450&auto=format&fit=crop&q=80',
    author: 'Mitchell Orr',
    title: 'Pulpit and Open Microphone',
    tags: ['pastor', 'preacher', 'pulpit', 'sermon', 'microphone', 'podium', 'proclamation', 'teaching', 'message']
  },
  {
    id: 'pastor_bible_open_2',
    url: 'https://images.unsplash.com/photo-1548625361-195fe57876a3?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1548625361-195fe57876a3?w=450&auto=format&fit=crop&q=80',
    author: 'Karl Fredrickson',
    title: 'Open Scriptures on Pulpit Table',
    tags: ['pastor', 'preacher', 'pulpit', 'sermon', 'bible', 'altar', 'teaching', 'exhortation']
  },

  // Baptism & Living Water
  {
    id: 'baptism_water_1',
    url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=450&auto=format&fit=crop&q=80',
    author: 'Dave Hoefler',
    title: 'Clear Running Living Water in the Valley',
    tags: ['baptism', 'water', 'living water', 'river', 'cleansing', 'stream', 'flow', 'rebirth', 'renewal']
  },
  {
    id: 'baptism_ocean_2',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=450&auto=format&fit=crop&q=80',
    author: 'Sean Oulashin',
    title: 'Tranquil Sea and Clean Shore',
    tags: ['baptism', 'sea', 'ocean', 'tide', 'clean', 'washed', 'waves', 'shore', 'beach']
  },

  // Majesty of Creation & Sunrise
  {
    id: 'creation_mountain_dawn_1',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=450&auto=format&fit=crop&q=80',
    author: 'Kalon Foley',
    title: 'Majestic Peaks at Golden Dawn',
    tags: ['mountains', 'sunrise', 'creation', 'dawn', 'peaks', 'majesty', 'nature', 'landscape', 'glory']
  },
  {
    id: 'creation_lake_reflection_2',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=450&auto=format&fit=crop&q=80',
    author: 'Bailey Zindel',
    title: 'Tranquil Lake Reflecting Pines and Sky',
    tags: ['lake', 'reflection', 'still waters', 'psalm 23', 'peace', 'nature', 'landscape', 'forest']
  },
  {
    id: 'creation_misty_forest_3',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=450&auto=format&fit=crop&q=80',
    author: 'Kalen Emsley',
    title: 'Misty Evergreen Pines at Morning Light',
    tags: ['forest', 'mist', 'trees', 'nature', 'morning', 'green', 'cedars', 'serenity']
  },
  {
    id: 'creation_stars_cosmos_4',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=450&auto=format&fit=crop&q=80',
    author: 'NASA',
    title: 'The Heavens Declare the Glory of God',
    tags: ['stars', 'sky', 'heavens', 'cosmos', 'night', 'galaxy', 'celestial', 'psalm 19', 'astronomy']
  },

  // Recovery, Overcoming & Pathway to Freedom
  {
    id: 'recovery_path_1',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=450&auto=format&fit=crop&q=80',
    author: 'Luke Stackpoole',
    title: 'Sunlit Path Through Green Woods',
    tags: ['path', 'trail', 'recovery', 'journey', 'way', 'walk in the light', 'ru recovery', 'reformers unanimous', 'freedom']
  },
  {
    id: 'recovery_golden_horizon_2',
    url: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=450&auto=format&fit=crop&q=80',
    author: 'Mohamed Nohassi',
    title: 'Looking Out Into Victory and Grace',
    tags: ['recovery', 'freedom', 'victory', 'overcoming', 'sobriety', 'hope', 'future', 'grace', 'renewal']
  },
  {
    id: 'recovery_new_sprout_3',
    url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=450&auto=format&fit=crop&q=80',
    author: 'Christian Joudrey',
    title: 'Fresh Green Sprout in Brilliant Sunshine',
    tags: ['growth', 'new life', 'born again', 'sprout', 'seed', 'recovery', 'healing', 'harvest']
  },

  // Dove, Holy Spirit & Celestial Peace
  {
    id: 'dove_peace_1',
    url: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=450&auto=format&fit=crop&q=80',
    author: 'Luca Upper',
    title: 'Quiet Morning Peace in Floral Garden',
    tags: ['dove', 'peace', 'holy spirit', 'comforter', 'garden', 'gentle', 'flowers', 'grace']
  },
  {
    id: 'fire_refining_2',
    url: 'https://images.unsplash.com/photo-1472806426350-603610d85659?w=1200&auto=format&fit=crop&q=85',
    thumb: 'https://images.unsplash.com/photo-1472806426350-603610d85659?w=450&auto=format&fit=crop&q=80',
    author: 'Claudio Schwarz',
    title: 'Refining Fire and Glowing Embers',
    tags: ['fire', 'flame', 'refining fire', 'holy spirit', 'pentecost', 'zeal', 'warmth', 'burning bush']
  }
];

/**
 * Searches the curated high-res library by keyword relevance
 */
export function searchCuratedLibrary(query: string, count = 25): ImageSearchResult[] {
  const clean = (query || '').toLowerCase().trim();
  const tokens = clean.split(/\s+/).filter(t => t.length > 1);

  if (tokens.length === 0) {
    // Return balanced mix
    return CURATED_CHRISTIAN_LIBRARY.slice(0, count).map(formatTaggedItem);
  }

  // Score each image
  const scored = CURATED_CHRISTIAN_LIBRARY.map(item => {
    let score = 0;
    const titleLower = item.title.toLowerCase();
    const tagsJoined = item.tags.join(' ').toLowerCase();

    for (const token of tokens) {
      if (titleLower.includes(token)) score += 10;
      if (tagsJoined.includes(token)) score += 5;
      for (const tag of item.tags) {
        if (tag === token) score += 15;
        else if (tag.includes(token)) score += 5;
      }
    }

    return { item, score };
  });

  const matched = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => formatTaggedItem(s.item));

  if (matched.length > 0) {
    return matched.slice(0, count);
  }

  // If no direct token match, return top diverse gallery
  return CURATED_CHRISTIAN_LIBRARY.slice(0, count).map(formatTaggedItem);
}

function formatTaggedItem(item: TaggedImage): ImageSearchResult {
  return {
    id: item.id,
    url: item.url,
    thumb: item.thumb,
    author: item.author,
    photographer_url: 'https://unsplash.com',
    alt_description: item.title,
    urls: {
      regular: item.url,
      full: item.url,
      small: item.thumb,
      thumb: item.thumb
    },
    user: {
      name: item.author
    }
  };
}

/**
 * Queries Wikimedia Commons Media API (unlimited free high-resolution photo repository)
 */
export async function searchWikimediaCommons(query: string, count = 20): Promise<ImageSearchResult[]> {
  try {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) return [];

    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrlimit=${Math.min(count, 35)}&prop=imageinfo&iiprop=url|extmetadata|size|mime&iiurlwidth=1000&format=json`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'AuraChristianSanctuary/1.0 (https://aura.webcraftstudio.cloud; contact@webcraftstudio.cloud)'
      }
    });

    if (!res.ok) return [];
    const data = await res.json();
    const pages = Object.values(data.query?.pages || {});

    const validImages: ImageSearchResult[] = [];

    for (const p of pages as any[]) {
      const info = p.imageinfo?.[0];
      if (!info?.url) continue;

      const rawUrl = info.url;
      const cleanUrl = rawUrl.split('?')[0].toLowerCase();
      // Only keep actual photography
      if (!cleanUrl.endsWith('.jpg') && !cleanUrl.endsWith('.jpeg') && !cleanUrl.endsWith('.png') && !cleanUrl.endsWith('.webp')) {
        continue;
      }

      const meta = info.extmetadata || {};
      const artist = meta.Artist?.value?.replace(/<[^>]*>/g, '').trim() || 'Wikimedia Contributor';
      const cleanTitle = (p.title || '').replace(/^File:/i, '').replace(/\.[^.]+$/, '').replace(/_/g, ' ');
      const desc = meta.ImageDescription?.value?.replace(/<[^>]*>/g, '').trim() || cleanTitle || query;
      const thumb = info.thumburl || rawUrl;

      validImages.push({
        id: `wiki_${p.pageid || Math.random().toString(36).substring(2, 9)}`,
        url: rawUrl,
        thumb: thumb,
        author: artist,
        photographer_url: info.descriptionurl || 'https://commons.wikimedia.org',
        alt_description: desc.slice(0, 120),
        urls: {
          regular: rawUrl,
          full: rawUrl,
          small: thumb,
          thumb: thumb
        },
        user: {
          name: artist
        }
      });
    }

    return validImages;
  } catch (err: any) {
    console.warn('[Wikimedia Search] Error fetching upstream photos:', err.message);
    return [];
  }
}

/**
 * Queries official Pexels API if key is present
 */
export async function searchPexelsAPI(query: string, apiKey: string, count = 30): Promise<ImageSearchResult[] | null> {
  const trimmedKey = (apiKey || '').trim();
  if (!trimmedKey || trimmedKey.includes('YOUR_PEXELS_API_KEY') || trimmedKey.length < 15) {
    return null;
  }

  try {
    const endpoint = query
      ? `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}`
      : `https://api.pexels.com/v1/curated?per_page=${count}`;

    const res = await fetch(endpoint, {
      headers: {
        Authorization: trimmedKey
      }
    });

    if (!res.ok) {
      console.warn(`[Pexels API] Upstream returned status ${res.status}`);
      return null;
    }

    const data = await res.json();
    const photos = data.photos || [];

    if (Array.isArray(photos) && photos.length > 0) {
      return photos.map((p: any) => ({
        id: p.id.toString(),
        url: p.src?.large || p.src?.original || p.src?.medium,
        thumb: p.src?.medium || p.src?.small,
        author: p.photographer || 'Pexels Creator',
        photographer_url: p.photographer_url,
        alt_description: p.alt || `${query || 'Worship'} background`,
        urls: {
          regular: p.src?.large || p.src?.original,
          full: p.src?.original,
          small: p.src?.medium || p.src?.small,
          thumb: p.src?.small || p.src?.tiny || p.src?.medium
        },
        user: {
          name: p.photographer || 'Pexels Creator'
        }
      }));
    }

    return [];
  } catch (err: any) {
    console.warn('[Pexels API] Request error:', err.message);
    return null;
  }
}

export const DEFAULT_PEXELS_API_KEY = 'cY6ajm4oZeTHCoKHGCVYvizEkWs0KGf9VU4jJ8K50AKAmeESWfqk0rkM';

/**
 * Unified Multi-Tier Image Search
 * 
 * 1. Pexels API (uses user's configured Pexels key)
 * 2. Curated Christian & Worship tagged catalog (instant relevance)
 * 3. Wikimedia Commons live photography (boundless diversity for any custom term)
 */
export async function performUnifiedImageSearch(
  rawQuery: string,
  apiKey?: string
): Promise<{ results: ImageSearchResult[]; source: string }> {
  const query = (rawQuery || '').trim();
  const effectiveKey = (apiKey || process.env.PEXELS_API_KEY || DEFAULT_PEXELS_API_KEY).trim();

  // Tier 1: Check Pexels API with user's verified key
  if (effectiveKey && !effectiveKey.includes('YOUR_PEXELS_API_KEY')) {
    const pexelsResults = await searchPexelsAPI(query, effectiveKey, 30);
    if (pexelsResults && pexelsResults.length > 0) {
      return { results: pexelsResults, source: 'pexels' };
    }
  }

  // Tier 2: Check Curated Tagged Catalog
  const curatedResults = searchCuratedLibrary(query, 24);

  // If query is empty, return curated results
  if (!query) {
    return { results: curatedResults, source: 'curated' };
  }

  // Tier 3: Query Wikimedia Commons for live photography
  const wikiResults = await searchWikimediaCommons(query, 24);

  // If both exist, merge curated results that matched well with Wikimedia live results
  if (wikiResults.length > 0) {
    // Interleave so user gets both curated modern Unsplash photos and specific Wikimedia photos
    const combined: ImageSearchResult[] = [];
    const maxLen = Math.max(curatedResults.length, wikiResults.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < curatedResults.length) combined.push(curatedResults[i]);
      if (i < wikiResults.length) combined.push(wikiResults[i]);
    }
    // Deduplicate by URL
    const seen = new Set<string>();
    const deduplicated = combined.filter(item => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });

    return { results: deduplicated.slice(0, 32), source: 'unified' };
  }

  return { results: curatedResults, source: 'curated' };
}
