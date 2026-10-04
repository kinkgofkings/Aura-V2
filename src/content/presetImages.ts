export interface PresetImageItem {
  id: string;
  name: string;
  subtitle: string;
  url: string;
  category: 'lettering' | 'spiritual' | 'scripture' | 'mosaic' | 'symbolic' | 'worship' | 'communion' | 'prayer';
  tags?: string[];
}

export const ALL_CHRISTIAN_PRESET_IMAGES: PresetImageItem[] = [
  // Cross & Calvary
  {
    id: 'calvary-cross',
    name: 'Calvary Cross',
    subtitle: 'Silhouette of the cross at golden dawn',
    url: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1200&auto=format&fit=crop&q=80',
    category: 'symbolic',
    tags: ['cross', 'calvary', 'jesus', 'salvation', 'dawn', 'sunrise', 'redemption', 'easter']
  },
  {
    id: 'cross-celestial',
    name: 'Glory of the Cross',
    subtitle: 'Sunbeams radiating through dramatic clouds',
    url: 'https://images.unsplash.com/photo-1510936111840-65e151470180?w=1200&auto=format&fit=crop&q=80',
    category: 'symbolic',
    tags: ['cross', 'rays', 'light', 'glory', 'clouds', 'heaven', 'hope', 'jesus']
  },
  {
    id: 'cross-hilltop',
    name: 'Hilltop Cross',
    subtitle: 'Solitary cross on an expansive vista',
    url: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=1200&auto=format&fit=crop&q=80',
    category: 'symbolic',
    tags: ['cross', 'hill', 'nature', 'landscape', 'faith', 'peace']
  },
  {
    id: 'cross-sunset',
    name: 'Calvary at Sunset',
    subtitle: 'Silhouette of the cross at warm dusk',
    url: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1200&auto=format&fit=crop&q=80',
    category: 'symbolic',
    tags: ['cross', 'sunset', 'warmth', 'evening', 'redemption']
  },

  // Bible & Scripture
  {
    id: 'open-bible',
    name: 'The Living Word',
    subtitle: 'Morning study in the Scriptures',
    url: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1200&auto=format&fit=crop&q=80',
    category: 'scripture',
    tags: ['bible', 'scripture', 'open bible', 'holy bible', 'word of god', 'reading', 'verse']
  },
  {
    id: 'scripture-desk',
    name: 'Daily Devotional',
    subtitle: 'Parchment and Bible open on study desk',
    url: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=1200&auto=format&fit=crop&q=80',
    category: 'scripture',
    tags: ['bible', 'scripture', 'study', 'desk', 'coffee', 'devotional', 'reading']
  },
  {
    id: 'vintage-scripture',
    name: 'Ancient Truth',
    subtitle: 'Leather bound scriptures with ribbon bookmark',
    url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&auto=format&fit=crop&q=80',
    category: 'scripture',
    tags: ['bible', 'vintage', 'leather', 'antique', 'scriptures', 'psalms']
  },

  // Church, Sanctuary & Cathedrals
  {
    id: 'church-sanctuary',
    name: 'Sanctuary Light',
    subtitle: 'Sunbeams streaming through church sanctuary windows',
    url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&auto=format&fit=crop&q=80',
    category: 'spiritual',
    tags: ['church', 'sanctuary', 'window', 'sunbeams', 'cathedral', 'pews', 'altar', 'chapel']
  },
  {
    id: 'gothic-cathedral',
    name: 'Cathedral of Grace',
    subtitle: 'Historic gothic cathedral nave in warm ambient glow',
    url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&auto=format&fit=crop&q=80',
    category: 'mosaic',
    tags: ['cathedral', 'church', 'candles', 'sanctuary', 'nave', 'chapel']
  },
  {
    id: 'stained-glass',
    name: 'Mosaic of Grace',
    subtitle: 'Classic stained glass cathedral art',
    url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&auto=format&fit=crop&q=80',
    category: 'mosaic',
    tags: ['stained glass', 'mosaic', 'glass', 'colors', 'sacred', 'cathedral', 'church']
  },
  {
    id: 'white-steeple-church',
    name: 'Country Sanctuary',
    subtitle: 'Classic white steeple chapel on green hills',
    url: 'https://images.unsplash.com/photo-1548316131-7b0b7496efee?w=1200&auto=format&fit=crop&q=80',
    category: 'spiritual',
    tags: ['church', 'steeple', 'country church', 'baptist', 'sanctuary', 'chapel']
  },

  // Worship & Praise
  {
    id: 'worship-hands-raised',
    name: 'Surrender in Worship',
    subtitle: 'Congregation hands lifted in adoration',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
    category: 'worship',
    tags: ['worship', 'praise', 'hands raised', 'service', 'music', 'singing', 'adoration', 'church']
  },
  {
    id: 'worship-concert',
    name: 'Night of Praise',
    subtitle: 'Warm stage illumination and acoustic worship',
    url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80',
    category: 'worship',
    tags: ['worship', 'praise', 'lights', 'band', 'choir', 'stage', 'acoustic']
  },

  // Prayer & Intercession
  {
    id: 'prayer-candle',
    name: 'Silent Prayer',
    subtitle: 'Gentle candle flame in reverent solitude',
    url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=1200&auto=format&fit=crop&q=80',
    category: 'prayer',
    tags: ['prayer', 'praying', 'candle', 'intercession', 'peace', 'meditation', 'solitude']
  },
  {
    id: 'prayer-unity',
    name: 'Unity in Prayer',
    subtitle: 'Believers joined hand in hand in fellowship',
    url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&auto=format&fit=crop&q=80',
    category: 'prayer',
    tags: ['prayer', 'fellowship', 'community', 'holding hands', 'unity', 'intercession']
  },
  {
    id: 'prayer-hands',
    name: 'Humble Petition',
    subtitle: 'Folded hands in reverent devotion',
    url: 'https://images.unsplash.com/photo-1445445290350-18a3b86e0b5b?w=1200&auto=format&fit=crop&q=80',
    category: 'prayer',
    tags: ['prayer', 'hands', 'folded hands', 'humility', 'devotion', 'supplication']
  },

  // Communion & Lord's Supper
  {
    id: 'communion-bread',
    name: 'The Bread of Life',
    subtitle: 'Rustic loaf of bread broken at the table',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80',
    category: 'communion',
    tags: ['communion', 'bread', 'lords supper', 'eucharist', 'table', 'sacrament', 'remembrance']
  },
  {
    id: 'communion-cup',
    name: 'The Covenant Cup',
    subtitle: 'The fruit of the vine poured out in love',
    url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&auto=format&fit=crop&q=80',
    category: 'communion',
    tags: ['communion', 'wine', 'cup', 'grape', 'covenant', 'lords supper']
  },

  // Preacher & Pulpit
  {
    id: 'pastor-pulpit',
    name: 'Proclaiming Truth',
    subtitle: 'Sanctuary pulpit and microphone awaiting the Word',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
    category: 'spiritual',
    tags: ['pastor', 'preacher', 'pulpit', 'sermon', 'microphone', 'podium', 'teaching', 'message']
  },

  // Baptism & Living Water
  {
    id: 'living-water',
    name: 'Living Water',
    subtitle: 'Peaceful clear streams flowing through the valley',
    url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=80',
    category: 'spiritual',
    tags: ['baptism', 'water', 'living water', 'river', 'cleansing', 'stream', 'renewal']
  },

  // Creation & Sunrise
  {
    id: 'creation-mountains',
    name: 'Majestic Creation',
    subtitle: 'Golden sunrise over mountain peaks',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
    category: 'spiritual',
    tags: ['mountains', 'sunrise', 'creation', 'dawn', 'peaks', 'nature', 'landscape', 'glory']
  },
  {
    id: 'heavens-stars',
    name: 'Heavens Declare',
    subtitle: 'The cosmos and starry night sky',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
    category: 'spiritual',
    tags: ['stars', 'sky', 'heavens', 'cosmos', 'night', 'galaxy', 'astronomy', 'psalm 19']
  },

  // Recovery & Pathway
  {
    id: 'recovery-pathway',
    name: 'Pathway to Freedom',
    subtitle: 'Sunlit trail leading through deep green woods',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&auto=format&fit=crop&q=80',
    category: 'spiritual',
    tags: ['recovery', 'path', 'trail', 'ru recovery', 'reformers unanimous', 'freedom', 'woods', 'journey']
  },
  {
    id: 'recovery-hope',
    name: 'Overcoming Strongholds',
    subtitle: 'Golden horizon welcoming a fresh start in grace',
    url: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=1200&auto=format&fit=crop&q=80',
    category: 'spiritual',
    tags: ['recovery', 'freedom', 'victory', 'overcoming', 'sobriety', 'hope', 'grace']
  },

  // Spirit of Peace & Holy Fire
  {
    id: 'dove-peace',
    name: 'Spirit of Peace',
    subtitle: 'A quiet morning in nature',
    url: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=1200&auto=format&fit=crop&q=80',
    category: 'spiritual',
    tags: ['dove', 'peace', 'holy spirit', 'quiet', 'nature', 'flowers']
  },
  {
    id: 'holy-fire',
    name: 'Refining Fire',
    subtitle: 'Warmth and zeal of the Spirit',
    url: 'https://images.unsplash.com/photo-1472806426350-603610d85659?w=1200&auto=format&fit=crop&q=80',
    category: 'symbolic',
    tags: ['fire', 'refining fire', 'holy spirit', 'pentecost', 'flame', 'zeal']
  }
];

export const DEFAULT_PRESET_COVER = ALL_CHRISTIAN_PRESET_IMAGES[0].url;
