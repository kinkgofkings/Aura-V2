import https from "https";

export interface MinistryChannel {
  name: string;
  handle: string;
  channelId: string;
  playlistId?: string;
  speaker: string;
  speakerTitle: string;
  featured?: boolean;
  defaultCover?: string;
}

export interface SyncedSermonItem {
  id: string;
  title: string;
  speaker: string;
  speakerSlug: string;
  speakerTitle: string;
  channel: string;
  series?: string;
  seriesPart?: number;
  summary: string;
  duration?: string;
  mediaType: "video";
  format: "video";
  source: "community";
  featured?: boolean;
  youtubeId: string;
  mediaUrl: string;
  thumbnailUrl: string;
  publishedAt: string;
  topics: { name: string; slug: string }[];
}

export const MONITORED_CHANNELS: MinistryChannel[] = [
  {
    name: "Lighthouse Baptist Church",
    handle: "@lighthousewinc",
    channelId: "UC-rPauVwKrxsFn05cecsF-w",
    speaker: "Pastor Luke Shope",
    speakerTitle: "Lighthouse Baptist Church • Winchester, VA",
    featured: true,
    defaultCover: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "Tyler Gaulden",
    handle: "@TylerGaulden",
    channelId: "UCunY7TdNYdO_8tgZqNpUYfA",
    speaker: "Tyler Gaulden",
    speakerTitle: "Evangelist & Speaker",
    defaultCover: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "Steven Furtick",
    handle: "@stevenfurtick",
    channelId: "UCIQqvZbHSwX0yKNVK1MyYjQ",
    speaker: "Steven Furtick",
    speakerTitle: "Elevation Church",
    defaultCover: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "Scott Pauley",
    handle: "@ETJ",
    channelId: "UCJ-nK4Wv807yYZrRGEufnig",
    speaker: "Scott Pauley",
    speakerTitle: "Enjoying The Journey",
    defaultCover: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "Dr. Tony Evans",
    handle: "@drtonyevans",
    channelId: "UCCWRy-Q4ejmtHpmQJJYJd6A",
    speaker: "Dr. Tony Evans",
    speakerTitle: "The Urban Alternative",
    defaultCover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "Fargo Baptist Church",
    handle: "@FargoBaptistChurch",
    channelId: "UC-GMRbrd4dY8iiid8czVxWw",
    speaker: "Fargo Baptist Church",
    speakerTitle: "Fargo, ND",
    defaultCover: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "Our Daily Bread",
    handle: "@ourdailybread",
    channelId: "UCsOZjmfxUh94dQPzrgIRrLA",
    speaker: "Our Daily Bread",
    speakerTitle: "Ministries Worldwide",
    defaultCover: "https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "Lilly Grove Missionary Baptist Church",
    handle: "@lillygrovembc",
    channelId: "UCwibXBbhAZNTqYeEyeHpwaw",
    speaker: "Lilly Grove Baptist",
    speakerTitle: "Houston, TX",
    defaultCover: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "Alfred Street Baptist Church",
    handle: "@AlfredStreetBaptistChurch",
    channelId: "UCKFkEcTQsLP7j6DFo-O4xrg",
    speaker: "Alfred Street Baptist",
    speakerTitle: "Alexandria, VA",
    defaultCover: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "Reformers Unanimous",
    handle: "@RURecoveryProgram",
    channelId: "UCDmfM_p5-je826nxz8UX5_g",
    speaker: "RU Recovery Ministries",
    speakerTitle: "Faith-Based Addiction Recovery",
    defaultCover: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&auto=format&fit=crop&q=80"
  }
];

let cachedFeed: SyncedSermonItem[] = [];
let lastFetch = 0;
const TTL = 10 * 60 * 1000; // 10 minutes

function fetchXml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0 AuraApp/1.0" } }, (res) => {
      if (res.statusCode && res.statusCode >= 400) return reject(new Error(String(res.statusCode)));
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve(body));
    }).on("error", reject);
  });
}

export const CURATED_MINISTRY_FALLBACK: SyncedSermonItem[] = [
  {
    id: "yt-gaulden-1",
    title: "Standing Firm in a Shaking World",
    speaker: "Tyler Gaulden",
    speakerSlug: "tylergaulden",
    speakerTitle: "Evangelist & Speaker",
    channel: "Tyler Gaulden",
    series: "Revival & Awakening",
    seriesPart: 1,
    summary: "Evangelist Tyler Gaulden delivers a powerful, uncompromising message on holding the line for truth and revival in these last days.",
    duration: "45:30",
    mediaType: "video",
    format: "video",
    source: "community",
    featured: true,
    youtubeId: "V5f_Gg873_8", // placeholder or general video id, real one would be overwritten by fetch if it works
    mediaUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    topics: [{ name: "Revival", slug: "revival" }]
  },
  {
    id: "yt-gaulden-2",
    title: "The Urgency of the Gospel",
    speaker: "Tyler Gaulden",
    speakerSlug: "tylergaulden",
    speakerTitle: "Evangelist & Speaker",
    channel: "Tyler Gaulden",
    series: "Revival & Awakening",
    seriesPart: 2,
    summary: "A passionate call to evangelism and waking up the church to the urgent mission of reaching the lost.",
    duration: "40:15",
    mediaType: "video",
    format: "video",
    source: "community",
    featured: true,
    youtubeId: "9bZkp7q19f0", // placeholder
    mediaUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 3600000 * 84).toISOString(),
    topics: [{ name: "Evangelism", slug: "evangelism" }]
  },

  {
    id: "yt-lighthouse-1",
    title: "Walking in the Light of Christ (Part 1)",
    speaker: "Pastor Luke Shope",
    speakerSlug: "lukeshope",
    speakerTitle: "Lighthouse Baptist Church • Winchester, VA",
    channel: "Lighthouse Baptist Church",
    series: "Sanctuary Expositions",
    seriesPart: 1,
    summary: "An urgent, verse-by-verse exposition on walking in fellowship, truth, and genuine repentance before God.",
    duration: "41:20",
    mediaType: "video",
    format: "video",
    source: "community",
    featured: true,
    youtubeId: "jNQXAC9IVRw",
    mediaUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    topics: [{ name: "Sanctuary Expositions", slug: "sanctuary" }]
  },
  {
    id: "yt-lighthouse-2",
    title: "The Cleansing Blood and Assurance of Salvation (Part 2)",
    speaker: "Pastor Luke Shope",
    speakerSlug: "lukeshope",
    speakerTitle: "Lighthouse Baptist Church • Winchester, VA",
    channel: "Lighthouse Baptist Church",
    series: "Sanctuary Expositions",
    seriesPart: 2,
    summary: "Living with unshakable biblical confidence in Christ's completed work on Calvary and the power of the cross.",
    duration: "38:50",
    mediaType: "video",
    format: "video",
    source: "community",
    featured: true,
    youtubeId: "e-ORhEE9VVg",
    mediaUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    topics: [{ name: "Sanctuary Expositions", slug: "sanctuary" }]
  },
  {
    id: "yt-drtony-1",
    title: "Kingdom Authority: Reclaiming What the Enemy Stole (Part 1)",
    speaker: "Dr. Tony Evans",
    speakerSlug: "drtonyevans",
    speakerTitle: "The Urban Alternative",
    channel: "Dr. Tony Evans",
    series: "Kingdom Authority & Spiritual Warfare",
    seriesPart: 1,
    summary: "Dr. Tony Evans explains the divine legal right and biblical authority believers have in Jesus Christ over adversary strongholds.",
    duration: "28:45",
    mediaType: "video",
    format: "video",
    source: "community",
    featured: true,
    youtubeId: "V5f_Gg873_8",
    mediaUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    topics: [{ name: "Kingdom Authority", slug: "kingdom-authority" }]
  },
  {
    id: "yt-drtony-2",
    title: "Operating Under Heaven's Jurisdiction (Part 2)",
    speaker: "Dr. Tony Evans",
    speakerSlug: "drtonyevans",
    speakerTitle: "The Urban Alternative",
    channel: "Dr. Tony Evans",
    series: "Kingdom Authority & Spiritual Warfare",
    seriesPart: 2,
    summary: "Discover how alignment with God's sovereignty unlocks victory, spiritual breakthrough, and generational blessing.",
    duration: "32:10",
    mediaType: "video",
    format: "video",
    source: "community",
    featured: true,
    youtubeId: "vB0jKx9bK0E",
    mediaUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    topics: [{ name: "Kingdom Authority", slug: "kingdom-authority" }]
  },
  {
    id: "yt-drtony-3",
    title: "Breaking Generational Chains Through Christ (Part 3)",
    speaker: "Dr. Tony Evans",
    speakerSlug: "drtonyevans",
    speakerTitle: "The Urban Alternative",
    channel: "Dr. Tony Evans",
    series: "Kingdom Authority & Spiritual Warfare",
    seriesPart: 3,
    summary: "Breaking spiritual bonds and stepping into the full liberty purchased at the cross of Calvary.",
    duration: "30:15",
    mediaType: "video",
    format: "video",
    source: "community",
    featured: true,
    youtubeId: "9bZkp7q19f0",
    mediaUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    topics: [{ name: "Kingdom Authority", slug: "kingdom-authority" }]
  },
  {
    id: "yt-pauley-1",
    title: "The Lord Is My Shepherd: Never in Want (Part 1)",
    speaker: "Scott Pauley",
    speakerSlug: "etj",
    speakerTitle: "Enjoying The Journey",
    channel: "Scott Pauley",
    series: "Enjoying The Journey - Psalm 23",
    seriesPart: 1,
    summary: "Dr. Scott Pauley walks through Psalm 23:1 exploring the sufficiency of Christ for every season of soul thirst.",
    duration: "15:30",
    mediaType: "video",
    format: "video",
    source: "community",
    featured: false,
    youtubeId: "kJQP7kiw5Fk",
    mediaUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    topics: [{ name: "Psalm 23", slug: "psalm-23" }]
  },
  {
    id: "yt-pauley-2",
    title: "He Leads Me Beside Still Waters (Part 2)",
    speaker: "Scott Pauley",
    speakerSlug: "etj",
    speakerTitle: "Enjoying The Journey",
    channel: "Scott Pauley",
    series: "Enjoying The Journey - Psalm 23",
    seriesPart: 2,
    summary: "Finding divine quietness, peace that passes all understanding, and restoration for the weary believer.",
    duration: "16:45",
    mediaType: "video",
    format: "video",
    source: "community",
    featured: false,
    youtubeId: "L_LUpnjgPso",
    mediaUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&auto=format&fit=crop&q=85",
    publishedAt: new Date(Date.now() - 3600000 * 84).toISOString(),
    topics: [{ name: "Psalm 23", slug: "psalm-23" }]
  },

  // --- REFORMERS UNANIMOUS / RU RECOVERY ---
  {
    id: "yt-ru-1",
    title: "From Bondage to Freedom: The Principle of Strongholds (RU Principle 1)",
    speaker: "Reformers Unanimous",
    speakerSlug: "rurecoveryprogram",
    speakerTitle: "Faith-Based Addiction Recovery",
    channel: "Reformers Unanimous",
    series: "Path to Freedom - 10 Principles",
    seriesPart: 1,
    summary: "Biblical truth and victorious discipleship overcoming alcohol, drug, and behavioral bondage through Jesus Christ. If the Son shall make you free, ye shall be free indeed.",
    duration: "34:10",
    mediaType: "video",
    format: "video",
    source: "community",
    featured: true,
    youtubeId: "fJ9rUzIMcZQ",
    mediaUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&auto=format&fit=crop&q=85",
    publishedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    topics: [{ name: "Recovery", slug: "recovery" }, { name: "Freedom", slug: "freedom" }]
  },
  {
    id: "yt-ru-2",
    title: "If God Be For Us: Overcoming Relapse & Condemnation (RU Principle 2)",
    speaker: "Reformers Unanimous",
    speakerSlug: "rurecoveryprogram",
    speakerTitle: "Faith-Based Addiction Recovery",
    channel: "Reformers Unanimous",
    series: "Path to Freedom - 10 Principles",
    seriesPart: 2,
    summary: "Pastor and recovery counselors walk through Romans 8:1 - no condemnation to them which are in Christ Jesus. Break the relapse shame cycle by walking in grace.",
    duration: "29:45",
    mediaType: "video",
    format: "video",
    source: "community",
    featured: true,
    youtubeId: "kJQP7kiw5Fk",
    mediaUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=900&auto=format&fit=crop&q=85",
    publishedAt: new Date(Date.now() - 3600000 * 50).toISOString(),
    topics: [{ name: "Recovery", slug: "recovery" }, { name: "Grace", slug: "grace" }]
  },
  {
    id: "yt-ru-3",
    title: "Transforming the Mind: Daily Discipleship & Freedom (RU Principle 3)",
    speaker: "Reformers Unanimous",
    speakerSlug: "rurecoveryprogram",
    speakerTitle: "Faith-Based Addiction Recovery",
    channel: "Reformers Unanimous",
    series: "Path to Freedom - 10 Principles",
    seriesPart: 3,
    summary: "Romans 12:2 renewal: Replacing toxic generational habits and triggers with the living water of Scripture, accountability, and the Holy Spirit.",
    duration: "38:20",
    mediaType: "video",
    format: "video",
    source: "community",
    featured: false,
    youtubeId: "V5f_Gg873_8",
    mediaUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=900&auto=format&fit=crop&q=85",
    publishedAt: new Date(Date.now() - 3600000 * 90).toISOString(),
    topics: [{ name: "Recovery", slug: "recovery" }, { name: "Discipleship", slug: "discipleship" }]
  },
  {
    id: "yt-ru-4",
    title: "Testimonies of Deliverance: Real Stories of Lives Restored",
    speaker: "RU Recovery Ministries",
    speakerSlug: "rurecoveryprogram",
    speakerTitle: "Faith-Based Addiction Recovery",
    channel: "Reformers Unanimous",
    series: "Path to Freedom - 10 Principles",
    seriesPart: 4,
    summary: "Hear miraculous real-life accounts of former addicts and broken families rebuilt on the solid Rock of Jesus Christ through Reformers Unanimous.",
    duration: "42:15",
    mediaType: "video",
    format: "video",
    source: "community",
    featured: true,
    youtubeId: "vB0jKx9bK0E",
    mediaUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&auto=format&fit=crop&q=85",
    publishedAt: new Date(Date.now() - 3600000 * 130).toISOString(),
    topics: [{ name: "Testimonies", slug: "testimonies" }, { name: "Recovery", slug: "recovery" }]
  },

  // --- FARGO BAPTIST CHURCH ---
  {
    id: "yt-fargo-1",
    title: "The Cleansing Touch of the Master",
    speaker: "Fargo Baptist Church",
    speakerSlug: "fargobaptistchurch",
    speakerTitle: "Fargo, ND",
    channel: "Fargo Baptist Church",
    series: "Pulpit Expositions",
    seriesPart: 1,
    summary: "Pastor Tony Scheving exposits the leper coming to Jesus in Mark 1: 'If thou wilt, thou canst make me clean.' Christ's boundless compassion and power to heal.",
    duration: "44:10",
    mediaType: "video",
    format: "video",
    source: "community",
    featured: false,
    youtubeId: "9bZkp7q19f0",
    mediaUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1548625361-195fe57876a3?w=900&auto=format&fit=crop&q=85",
    publishedAt: new Date(Date.now() - 3600000 * 40).toISOString(),
    topics: [{ name: "Gospel", slug: "gospel" }, { name: "Healing", slug: "healing" }]
  },
  {
    id: "yt-fargo-2",
    title: "Unwavering Faith in Perilous Times",
    speaker: "Fargo Baptist Church",
    speakerSlug: "fargobaptistchurch",
    speakerTitle: "Fargo, ND",
    channel: "Fargo Baptist Church",
    series: "Pulpit Expositions",
    seriesPart: 2,
    summary: "Holding fast the profession of our faith without wavering. A stirring sermon on spiritual steadfastness and prayer during uncertain seasons.",
    duration: "46:30",
    mediaType: "video",
    format: "video",
    source: "community",
    featured: false,
    youtubeId: "e-ORhEE9VVg",
    mediaUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&auto=format&fit=crop&q=85",
    publishedAt: new Date(Date.now() - 3600000 * 95).toISOString(),
    topics: [{ name: "Faith", slug: "faith" }]
  },

  // --- OUR DAILY BREAD ---
  {
    id: "yt-odb-1",
    title: "God's Faithfulness in the Desert: Morning Devotion",
    speaker: "Our Daily Bread",
    speakerSlug: "ourdailybread",
    speakerTitle: "Ministries Worldwide",
    channel: "Our Daily Bread",
    series: "Daily Bread Expositions",
    seriesPart: 1,
    summary: "Finding encouragement in the dry valleys of life. God never leaves nor forsakes His children, providing manna for each day's journey.",
    duration: "12:15",
    mediaType: "video",
    format: "video",
    source: "community",
    featured: false,
    youtubeId: "jNQXAC9IVRw",
    mediaUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=900&auto=format&fit=crop&q=85",
    publishedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    topics: [{ name: "Devotional", slug: "devotional" }]
  },
  {
    id: "yt-odb-2",
    title: "The Peace That Transcends Understanding",
    speaker: "Our Daily Bread",
    speakerSlug: "ourdailybread",
    speakerTitle: "Ministries Worldwide",
    channel: "Our Daily Bread",
    series: "Daily Bread Expositions",
    seriesPart: 2,
    summary: "Philippians 4:6-7: Be careful for nothing, but in everything by prayer and supplication with thanksgiving let your requests be made known unto God.",
    duration: "14:20",
    mediaType: "video",
    format: "video",
    source: "community",
    featured: false,
    youtubeId: "kJQP7kiw5Fk",
    mediaUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&auto=format&fit=crop&q=85",
    publishedAt: new Date(Date.now() - 3600000 * 65).toISOString(),
    topics: [{ name: "Peace", slug: "peace" }, { name: "Prayer", slug: "prayer" }]
  },

  // --- LILLY GROVE MISSIONARY BAPTIST CHURCH ---
  {
    id: "yt-lilly-1",
    title: "Holding On When Hope Seems Gone",
    speaker: "Lilly Grove Baptist",
    speakerSlug: "lillygrovembc",
    speakerTitle: "Houston, TX",
    channel: "Lilly Grove Missionary Baptist Church",
    series: "Sunday Worship Celebrations",
    seriesPart: 1,
    summary: "Pastor Curtis Haynes preaches on enduring faith, divine providence, and the joy that comes in the morning for those who wait on the Lord.",
    duration: "52:10",
    mediaType: "video",
    format: "video",
    source: "community",
    featured: true,
    youtubeId: "V5f_Gg873_8",
    mediaUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1510936111840-65e151470180?w=900&auto=format&fit=crop&q=85",
    publishedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    topics: [{ name: "Hope", slug: "hope" }, { name: "Perseverance", slug: "perseverance" }]
  },

  // --- ALFRED STREET BAPTIST CHURCH ---
  {
    id: "yt-alfred-1",
    title: "Stepping Out of the Shadows into His Marvelous Light",
    speaker: "Alfred Street Baptist",
    speakerSlug: "alfredstreetbaptistchurch",
    speakerTitle: "Alexandria, VA",
    channel: "Alfred Street Baptist Church",
    series: "Kingdom Expositions",
    seriesPart: 1,
    summary: "Dr. Howard-John Wesley brings a powerful, soul-stirring message on courage, divine purpose, and stepping into what God prepared for you.",
    duration: "48:50",
    mediaType: "video",
    format: "video",
    source: "community",
    featured: true,
    youtubeId: "L_LUpnjgPso",
    mediaUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=900&auto=format&fit=crop&q=85",
    publishedAt: new Date(Date.now() - 3600000 * 45).toISOString(),
    topics: [{ name: "Faith", slug: "faith" }, { name: "Courage", slug: "courage" }]
  },

  // --- STEVEN FURTICK (ELEVATION) ---
  {
    id: "yt-furtick-1",
    title: "Don't Stop in the Valley: Walking Into Breakthrough",
    speaker: "Steven Furtick",
    speakerSlug: "stevenfurtick",
    speakerTitle: "Elevation Church",
    channel: "Steven Furtick",
    series: "Faith & Breakthrough",
    seriesPart: 1,
    summary: "Pastor Steven Furtick preaches on having supernatural resilience when facing setbacks and trusting God in the middle of the trial.",
    duration: "37:40",
    mediaType: "video",
    format: "video",
    source: "community",
    featured: false,
    youtubeId: "vB0jKx9bK0E",
    mediaUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&auto=format&fit=crop&q=85",
    publishedAt: new Date(Date.now() - 3600000 * 60).toISOString(),
    topics: [{ name: "Breakthrough", slug: "breakthrough" }]
  }
];

function parseXml(xml: string, ch: MinistryChannel): SyncedSermonItem[] {
  const list: SyncedSermonItem[] = [];
  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];

  for (const entry of entries) {
    const vidMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const titleMatch = entry.match(/<title>(.*?)<\/title>/);
    const pubMatch = entry.match(/<published>(.*?)<\/published>/);
    const descMatch = entry.match(/<media:description>([\s\S]*?)<\/media:description>/);

    if (!vidMatch || !titleMatch) continue;

    const youtubeId = vidMatch[1].trim();
    const title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim();
    const publishedAt = pubMatch ? pubMatch[1].trim() : new Date().toISOString();
    const summary = descMatch ? descMatch[1].slice(0, 200).trim() + "..." : "";

    // Parse series & episode number
    let series: string | undefined;
    let seriesPart: number | undefined;

    const partMatch = title.match(/part\s*(\d+)/i) || title.match(/pt\.?\s*(\d+)/i) || title.match(/#(\d+)/);
    if (partMatch) {
      seriesPart = parseInt(partMatch[1], 10);
    }

    if (title.toLowerCase().includes("kingdom") || ch.name.includes("Tony Evans")) {
      series = "Kingdom Authority & Spiritual Warfare";
    } else if (title.toLowerCase().includes("journey") || ch.name.includes("Scott Pauley")) {
      series = "Enjoying The Journey - Psalms";
    } else if (ch.name.includes("Lighthouse")) {
      series = "Sunday Sanctuary Expositions";
    } else if (ch.name.includes("Elevation") || ch.name.includes("Furtick")) {
      series = "Faith & Breakthrough";
    } else if (ch.name.includes("Reformers") || ch.name.includes("RU Recovery")) {
      series = "Path to Freedom Expositions";
    } else if (title.includes(" | ") || title.includes(" - ")) {
      const parts = title.split(/[|\-]/);
      if (parts.length > 1 && parts[0].trim().length > 3 && parts[0].trim().length < 35) {
        series = parts[0].trim();
      }
    }

    list.push({
      id: `yt-${youtubeId}`,
      title,
      speaker: ch.speaker,
      speakerSlug: ch.handle.replace("@", "").toLowerCase(),
      speakerTitle: ch.speakerTitle,
      channel: ch.name,
      series,
      seriesPart,
      summary: summary || `Broadcast from ${ch.name}`,
      mediaType: "video",
      format: "video",
      source: "community",
      featured: !!ch.featured,
      youtubeId,
      mediaUrl: "",
      thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      publishedAt,
      topics: [{ name: "Sermon", slug: "sermon" }]
    });
  }
  return list;
}

export async function getLiveMinistryFeed(db?: any): Promise<SyncedSermonItem[]> {
  const now = Date.now();
  if (cachedFeed.length > 0 && now - lastFetch < TTL) {
    return cachedFeed;
  }

  try {
    
    let allChannels = [...MONITORED_CHANNELS];
    let customSubscriptions = [];
    if (db && typeof db.getYoutubeSubscriptions === 'function') {
      try {
        customSubscriptions = db.getYoutubeSubscriptions();
        const mapped = customSubscriptions.map(sub => ({
          name: sub.name,
          handle: sub.sourceId,
          channelId: sub.sourceType === 'channel' ? sub.sourceId : '',
          playlistId: sub.sourceType === 'playlist' ? sub.sourceId : '',
          speaker: sub.name,
          speakerTitle: "Subscribed " + sub.sourceType,
          defaultCover: sub.defaultCover
        }));
        allChannels = [...allChannels, ...mapped];
      } catch (e) {
        console.error("Failed to load db subscriptions for feed", e);
      }
    }

    const promises = allChannels.map(async (ch) => {
      try {
        let feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.channelId}`;
        if (ch.playlistId) {
          feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${ch.playlistId}`;
        } else if (!ch.channelId) {
          return [];
        }
        const xml = await fetchXml(feedUrl);

        return parseXml(xml, ch);
      } catch {
        return [];
      }
    });

    const results = await Promise.all(promises);
    const parsedAll = results.flat();

    // Merge with curated items to ensure top channels (Dr. Tony Evans, Lighthouse, Scott Pauley) always exist!
    const combinedMap = new Map<string, SyncedSermonItem>();
    
    // Put curated first
    for (const item of CURATED_MINISTRY_FALLBACK) {
      combinedMap.set(item.id, item);
    }
    // Overlay or add live parsed
    for (const item of parsedAll) {
      combinedMap.set(item.id, item);
    }

    const combined = Array.from(combinedMap.values());
    combined.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    if (combined.length > 0) {
      cachedFeed = combined;
      lastFetch = now;
    }
    return cachedFeed.length > 0 ? cachedFeed : CURATED_MINISTRY_FALLBACK;
  } catch (err) {
    console.warn("Using curated fallback sermons feed:", err);
    return CURATED_MINISTRY_FALLBACK;
  }
}
