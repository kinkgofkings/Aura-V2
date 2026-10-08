/**
 * Aura Sermon & Media Cover Imagery Library
 * 
 * Provides diverse, high-definition spiritual photography and artistic covers
 * to prevent visual repetition across sermon feeds, audio libraries, and drift cards.
 */

export interface SermonCoverTheme {
  category: 'scripture' | 'sanctuary' | 'creation' | 'cross' | 'recovery' | 'celestial' | 'worship' | 'prayer';
  url: string;
  alt: string;
}

export const DIVERSE_SERMON_COVERS: SermonCoverTheme[] = [
  // 1. Scripture & Sacred Word
  {
    category: 'scripture',
    url: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=900&auto=format&fit=crop&q=85',
    alt: 'Open Holy Bible bathed in warm morning light'
  },
  {
    category: 'scripture',
    url: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=900&auto=format&fit=crop&q=85',
    alt: 'Vintage open scriptures with warm lamp glow'
  },
  {
    category: 'scripture',
    url: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=900&auto=format&fit=crop&q=85',
    alt: 'Parchment and Bible open on study desk'
  },
  {
    category: 'scripture',
    url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=900&auto=format&fit=crop&q=85',
    alt: 'Open leather scripture pages in natural lighting'
  },

  // 2. Sanctuary & Historic Cathedrals
  {
    category: 'sanctuary',
    url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=900&auto=format&fit=crop&q=85',
    alt: 'Sunbeams streaming through sanctuary church window'
  },
  {
    category: 'sanctuary',
    url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=900&auto=format&fit=crop&q=85',
    alt: 'Gothic cathedral arches with warm candlelit nave'
  },
  {
    category: 'sanctuary',
    url: 'https://images.unsplash.com/photo-1548625361-195fe57876a3?w=900&auto=format&fit=crop&q=85',
    alt: 'Stained glass windows casting vibrant sacred light'
  },
  {
    category: 'sanctuary',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=900&auto=format&fit=crop&q=85',
    alt: 'Sanctuary altar illuminated by ambient worship light'
  },

  // 3. Majesty of God's Creation
  {
    category: 'creation',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&auto=format&fit=crop&q=85',
    alt: 'Radiant sunrise breaking over majestic mountain peaks'
  },
  {
    category: 'creation',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&auto=format&fit=crop&q=85',
    alt: 'Tranquil mountain lake reflecting the glory of God'
  },
  {
    category: 'creation',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&auto=format&fit=crop&q=85',
    alt: 'Misty golden pine forest at dawn'
  },
  {
    category: 'creation',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900&auto=format&fit=crop&q=85',
    alt: 'Dramatic peaks under celestial sky'
  },

  // 4. The Cross & Redemption
  {
    category: 'cross',
    url: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=900&auto=format&fit=crop&q=85',
    alt: 'Silhouette of the wooden cross against vibrant dawn'
  },
  {
    category: 'cross',
    url: 'https://images.unsplash.com/photo-1510936111840-65e151470180?w=900&auto=format&fit=crop&q=85',
    alt: 'The cross radiating golden rays through dramatic clouds'
  },
  {
    category: 'cross',
    url: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=900&auto=format&fit=crop&q=85',
    alt: 'Cross on a hilltop overlooking morning valley'
  },
  {
    category: 'cross',
    url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=900&auto=format&fit=crop&q=85',
    alt: 'Sunbeams bursting through dense branches in reverent light'
  },

  // 5. Pathway to Freedom & Recovery
  {
    category: 'recovery',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&auto=format&fit=crop&q=85',
    alt: 'Peaceful sunlit path leading through deep forest into liberty'
  },
  {
    category: 'recovery',
    url: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=900&auto=format&fit=crop&q=85',
    alt: 'Overcoming strongholds: golden horizon over calm waters'
  },
  {
    category: 'recovery',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&auto=format&fit=crop&q=85',
    alt: 'Restoration: still waters and tranquil sandy shore'
  },
  {
    category: 'recovery',
    url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=900&auto=format&fit=crop&q=85',
    alt: 'Fresh green growth reaching upward into brilliant sunlight'
  },

  // 6. Celestial Skies & Divine Eternity
  {
    category: 'celestial',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=900&auto=format&fit=crop&q=85',
    alt: 'The heavens declare the glory of God: starry cosmos'
  },
  {
    category: 'celestial',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=85',
    alt: 'Midnight starry expanse over quiet lake'
  },
  {
    category: 'celestial',
    url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=900&auto=format&fit=crop&q=85',
    alt: 'Vibrant nebula reminding of the infinite Creator'
  },

  // 7. Pulpit & Worship Atmosphere
  {
    category: 'worship',
    url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=900&auto=format&fit=crop&q=85',
    alt: 'Pulpit sanctuary with glowing atmospheric lighting'
  },
  {
    category: 'worship',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&auto=format&fit=crop&q=85',
    alt: 'Concert of prayer and acoustic praise atmosphere'
  },

  // 8. Reverent Prayer & Fellowship
  {
    category: 'prayer',
    url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=900&auto=format&fit=crop&q=85',
    alt: 'Believers gathered together in heartfelt unity'
  },
  {
    category: 'prayer',
    url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=900&auto=format&fit=crop&q=85',
    alt: 'Quiet contemplation and prayer in gentle ambient glow'
  }
];

export const FALLBACK_COVERS = DIVERSE_SERMON_COVERS.map(c => c.url);

/**
 * Returns a high-definition, aesthetically matched cover image for any sermon.
 * Prioritizes the actual real YouTube video cover so users see the real video artwork,
 * falling back to custom media art or dignified spiritual photography.
 */
export function getSermonCoverImage(
  sermon?: {
    id?: string;
    title?: string;
    series?: string;
    channel?: string;
    topics?: { slug: string; name: string }[];
    thumbnailUrl?: string;
    speakerImage?: string;
    youtubeId?: string;
    mediaUrl?: string;
  },
  index = 0
): string {
  // 1. If sermon has a YouTube video ID (or mediaUrl containing an 11-char YouTube ID, or yt- ID prefix),
  // return the actual real YouTube sermon video thumbnail!
  const ytMatch = (sermon?.mediaUrl || '').match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  const ytId =
    sermon?.youtubeId ||
    ytMatch?.[1] ||
    (sermon?.id && sermon.id.startsWith('yt-') ? sermon.id.replace('yt-', '') : undefined) ||
    (sermon?.mediaUrl && sermon.mediaUrl.length === 11 ? sermon.mediaUrl : undefined);

  if (ytId && ytId.length === 11 && !ytId.includes('.')) {
    return `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
  }

  // 2. If sermon already has a valid custom uploaded image or non-repetitive thumbnail, use it
  if (sermon?.thumbnailUrl) {
    const isRepetitiveHeadshot = 
      sermon.thumbnailUrl.includes('photo-1472099645785-5658abf4ff4e') ||
      sermon.thumbnailUrl.includes('photo-1519085360753-af0119f7cbe7') ||
      sermon.thumbnailUrl.includes('photo-1507003211169-0a1dd7228f2d');
    
    if (!isRepetitiveHeadshot && !sermon.thumbnailUrl.endsWith('/')) {
      return sermon.thumbnailUrl;
    }
  }

  // 3. Fallback to categorized spiritual photography
  return getFallbackSpiritualCover(sermon, index);
}

export function getFallbackSpiritualCover(
  sermon?: {
    id?: string;
    title?: string;
    series?: string;
    channel?: string;
    topics?: { slug: string; name: string }[];
  },
  index = 0
): string {
  const textToAnalyze = `${sermon?.title || ''} ${sermon?.series || ''} ${sermon?.channel || ''} ${(sermon?.topics || []).map(t => t.name).join(' ')}`.toLowerCase();

  // 1. Recovery / Reformers Unanimous / 12 Steps
  if (
    textToAnalyze.includes('recovery') || 
    textToAnalyze.includes('reformers') || 
    textToAnalyze.includes('stronghold') ||
    textToAnalyze.includes('bondage') ||
    textToAnalyze.includes('freedom') ||
    textToAnalyze.includes('addiction')
  ) {
    const list = DIVERSE_SERMON_COVERS.filter(c => c.category === 'recovery');
    return list[Math.abs(hashString(sermon?.id || sermon?.title || String(index))) % list.length].url;
  }

  // 2. Cross / Calvary / Salvation / Redemption
  if (
    textToAnalyze.includes('cross') || 
    textToAnalyze.includes('calvary') || 
    textToAnalyze.includes('blood') ||
    textToAnalyze.includes('salvation') ||
    textToAnalyze.includes('redeem') ||
    textToAnalyze.includes('resurrection')
  ) {
    const list = DIVERSE_SERMON_COVERS.filter(c => c.category === 'cross');
    return list[Math.abs(hashString(sermon?.id || sermon?.title || String(index))) % list.length].url;
  }

  // 3. Scripture / Psalms / Exposition / Bible Study
  if (
    textToAnalyze.includes('psalm') || 
    textToAnalyze.includes('scripture') || 
    textToAnalyze.includes('verse') ||
    textToAnalyze.includes('expos') ||
    textToAnalyze.includes('study') ||
    textToAnalyze.includes('epistle')
  ) {
    const list = DIVERSE_SERMON_COVERS.filter(c => c.category === 'scripture');
    return list[Math.abs(hashString(sermon?.id || sermon?.title || String(index))) % list.length].url;
  }

  // 4. Kingdom Authority / Spiritual Warfare / Heavens
  if (
    textToAnalyze.includes('warfare') || 
    textToAnalyze.includes('authority') || 
    textToAnalyze.includes('heaven') ||
    textToAnalyze.includes('eternity') ||
    textToAnalyze.includes('glory')
  ) {
    const list = DIVERSE_SERMON_COVERS.filter(c => c.category === 'celestial' || c.category === 'creation');
    return list[Math.abs(hashString(sermon?.id || sermon?.title || String(index))) % list.length].url;
  }

  // 5. Sanctuary / Church / Pulpit
  if (
    textToAnalyze.includes('sanctuary') || 
    textToAnalyze.includes('pulpit') || 
    textToAnalyze.includes('church') ||
    textToAnalyze.includes('lighthouse') ||
    textToAnalyze.includes('fargo')
  ) {
    const list = DIVERSE_SERMON_COVERS.filter(c => c.category === 'sanctuary' || c.category === 'worship');
    return list[Math.abs(hashString(sermon?.id || sermon?.title || String(index))) % list.length].url;
  }

  // Default deterministic assignment across the entire 24+ cover pool
  const hash = Math.abs(hashString((sermon?.id || '') + (sermon?.title || '') + index));
  return DIVERSE_SERMON_COVERS[hash % DIVERSE_SERMON_COVERS.length].url;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
