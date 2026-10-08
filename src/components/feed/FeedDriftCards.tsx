import React, { useState, useEffect } from 'react';
import { 
  Heart, Sparkles, BookOpen, Volume2, Video, Play, Pause, 
  ExternalLink, Calendar, Users, CheckCircle2, UserPlus, MessageCircle, 
  Layers, ArrowRight, Share2, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../../services/audio';
import { Avatar } from '../common/Avatar';
import { AsyncMedia } from '../common/AsyncMedia';
import { UserProfile } from '../../types';
import { getSermonCoverImage, getFallbackSpiritualCover } from '../../utils/sermonCovers';

// ==========================================
// 1. PRAYER WALL DRIFT CARD
// ==========================================
interface PrayerItem {
  id: string;
  authorName: string;
  authorHandle: string;
  isAnonymous: boolean;
  content: string;
  category: string;
  prayedCount: number;
  prayedUsers: string[];
  isAnswered: boolean;
  createdAt: string;
}

const DEFAULT_PRAYERS: PrayerItem[] = [
  {
    id: 'prayer-tex-1',
    authorName: 'Tex',
    authorHandle: 'tex',
    isAnonymous: false,
    category: 'Community',
    content: 'Lord, grant strength, peace, and healing today over every household in our community. Let Your presence dwell in our hearts and guide our every step.',
    prayedCount: 42,
    prayedUsers: [],
    isAnswered: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prayer-recovery-freedom',
    authorName: 'Brother Marcus',
    authorHandle: 'marcus_in_christ',
    isAnonymous: false,
    category: 'Recovery',
    content: 'Father, I pray for every soul struggling with addiction or secret strongholds today. Break every chain in Jesus\' mighty name, for whom the Son sets free is free indeed! (John 8:36)',
    prayedCount: 65,
    prayedUsers: [],
    isAnswered: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'prayer-anxiety-peace',
    authorName: 'Sister Deborah',
    authorHandle: 'deborah_grace',
    isAnonymous: false,
    category: 'Peace',
    content: 'Lord, when anxiety rises within us, let Your consolations delight our souls. Calm every racing thought and give peaceful rest to the weary believer reading this right now.',
    prayedCount: 39,
    prayedUsers: [],
    isAnswered: false,
    createdAt: new Date(Date.now() - 3600000 * 7).toISOString()
  },
  {
    id: 'prayer-healing-testimony',
    authorName: 'Hannah Grace',
    authorHandle: 'hannahg',
    isAnonymous: false,
    category: 'Healing',
    content: 'Asking for continued prayers for my mother\'s full restoration. We felt God\'s miraculous peace through every medical report this week. Praise God for His healing touch!',
    prayedCount: 51,
    prayedUsers: [],
    isAnswered: true,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'prayer-family-marriage',
    authorName: 'Caleb & Sarah',
    authorHandle: 'caleb_s',
    isAnonymous: false,
    category: 'Family',
    content: 'Lord, we lift up every family and marriage in the Sanctuary. Knit our homes together in patience, humble forgiveness, and unwavering Christlike devotion.',
    prayedCount: 33,
    prayedUsers: [],
    isAnswered: false,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 'prayer-morning-renewal',
    authorName: 'Sanctuary Intercessors',
    authorHandle: 'sanctuary_prayer',
    isAnonymous: false,
    category: 'Praise',
    content: 'The steadfast love of the Lord never ceases; His mercies never come to an end; they are new every morning. Great is Your faithfulness, O God! (Lamentations 3:22-23)',
    prayedCount: 77,
    prayedUsers: [],
    isAnswered: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'prayer-youth-protection',
    authorName: 'Pastor Luke',
    authorHandle: 'pastor_luke',
    isAnonymous: false,
    category: 'Protection',
    content: 'Lord God, surround our young people with Your angels. Shield their minds from worldly deception, kindle a burning passion for Your Word, and raise them up as bold champions for the Gospel.',
    prayedCount: 48,
    prayedUsers: [],
    isAnswered: false,
    createdAt: new Date(Date.now() - 3600000 * 22).toISOString()
  },
  {
    id: 'prayer-wisdom-guidance',
    authorName: 'Elijah K.',
    authorHandle: 'elijah_walk',
    isAnonymous: false,
    category: 'Wisdom',
    content: 'Lord, for anyone facing big decisions or difficult crossroads this week, grant the spirit of wisdom and revelation. Make their paths straight as they trust in You with all their heart.',
    prayedCount: 29,
    prayedUsers: [],
    isAnswered: false,
    createdAt: new Date(Date.now() - 3600000 * 15).toISOString()
  }
];

export const PrayerDriftCard: React.FC<{ index?: number }> = ({ index = 0 }) => {
  const [prayerPool, setPrayerPool] = useState<PrayerItem[]>(DEFAULT_PRAYERS);
  const [prayerIndex, setPrayerIndex] = useState(() => (index % DEFAULT_PRAYERS.length));
  const [hasPrayed, setHasPrayed] = useState(false);
  const [amenCount, setAmenCount] = useState(42);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('aura_church_prayer_wall');
      let combined = [...DEFAULT_PRAYERS];
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          combined = [...parsed, ...DEFAULT_PRAYERS];
        }
      }
      setPrayerPool(combined);
      const chosenIdx = Math.abs((index * 3 + Math.floor(Date.now() / (1000 * 60 * 30))) % combined.length);
      setPrayerIndex(chosenIdx);
      setAmenCount(combined[chosenIdx]?.prayedCount || 35);
    } catch (e) {
      console.warn('Error loading prayer wall item for feed:', e);
    }
  }, [index]);

  const currentPrayer = prayerPool[prayerIndex] || DEFAULT_PRAYERS[0];

  const handleNextPrayer = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEffects.playTap();
    setHasPrayed(false);
    const nextIdx = (prayerIndex + 1) % prayerPool.length;
    setPrayerIndex(nextIdx);
    setAmenCount(prayerPool[nextIdx]?.prayedCount || 28);
  };

  const handleAmen = () => {
    soundEffects.playTap();
    if (!hasPrayed) {
      setHasPrayed(true);
      setAmenCount(prev => prev + 1);
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#f59e0b', '#fbbf24', '#38bdf8']
      });
    } else {
      setHasPrayed(false);
      setAmenCount(prev => Math.max(1, prev - 1));
    }
  };

  const handleGoToWall = () => {
    soundEffects.playTap();
    try {
      localStorage.setItem('aura_study_initial_tab', 'prayers');
      localStorage.setItem('aura_target_prayer_id', currentPrayer.id);
      sessionStorage.setItem('aura_target_prayer_id', currentPrayer.id);
    } catch {}
    window.dispatchEvent(
      new CustomEvent('navigate_tab', {
        detail: {
          tab: 'bible',
          subtab: 'prayers',
          prayerId: currentPrayer.id,
          prayer: currentPrayer,
        },
      })
    );
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('switch_study_tab', {
          detail: {
            tab: 'prayers',
            prayerId: currentPrayer.id,
            prayer: currentPrayer,
          },
        })
      );
      window.dispatchEvent(
        new CustomEvent('target_prayer', {
          detail: {
            prayerId: currentPrayer.id,
            prayer: currentPrayer,
          },
        })
      );
    }, 60);
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-amber-950/40 via-[#0a0f28]/95 to-amber-950/25 border border-amber-500/30 p-4 sm:p-5 shadow-2xl relative overflow-hidden space-y-3.5 backdrop-blur-xl animate-fade-in">
      {/* Ambient warm glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Tag */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold uppercase tracking-wider border border-amber-500/30 flex items-center gap-1.5">
            <span>🙏 Uplifting Prayer</span>
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            {currentPrayer.authorName} • {currentPrayer.category}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleNextPrayer}
            className="p-1 rounded-lg text-slate-400 hover:text-amber-300 bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1 text-[10px] font-semibold px-2 cursor-pointer"
            title="Read another prayer"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Next Prayer</span>
          </button>
          <span className="text-[10px] text-amber-400/80 font-semibold px-2 py-0.5 rounded-md bg-amber-500/10">
            Sanctuary Wall
          </span>
        </div>
      </div>

      {/* Prayer Content */}
      <div className="space-y-2 cursor-pointer group" onClick={handleGoToWall}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center font-bold text-sm shrink-0">
            {currentPrayer.isAnonymous ? '?' : currentPrayer.authorName.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-200 group-hover:text-amber-300 transition-colors">
              {currentPrayer.isAnonymous ? 'Anonymous Church Member' : currentPrayer.authorName}
              {!currentPrayer.isAnonymous && <span className="text-slate-400 font-normal ml-1">@{currentPrayer.authorHandle}</span>}
            </h4>
            <p className="text-xs sm:text-base text-amber-100/90 leading-relaxed font-serif italic group-hover:text-amber-200 transition-colors">
              "{currentPrayer.content}"
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-amber-500/15 gap-2 flex-wrap">
        <div className="text-[11px] text-amber-300/90 font-semibold flex items-center gap-1.5">
          <Heart className={`w-3.5 h-3.5 ${hasPrayed ? 'text-amber-400 fill-amber-400' : 'text-amber-400/60'}`} />
          <span>{amenCount} praying in faith</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAmen}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
              hasPrayed
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 font-extrabold'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
            }`}
          >
            <span>{hasPrayed ? '✓ Prayed Amen' : '🙏 Say Amen'}</span>
          </button>

          <button
            onClick={handleGoToWall}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
          >
            <span>Prayer Wall</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. SERMON DRIFT CARD (Audio & Video)
// ==========================================
interface SermonItem {
  id: string;
  title: string;
  speaker?: string;
  channel?: string;
  series?: string;
  seriesPart?: number;
  scriptureRef?: string;
  description?: string;
  mediaType?: 'audio' | 'video';
  mediaUrl?: string;
  duration?: number;
}

const FALLBACK_SERMONS: SermonItem[] = [
  {
    id: 'sermon-tony-evans',
    title: 'Kingdom Authority & Overcoming Spiritual Warfare',
    speaker: 'Dr. Tony Evans',
    channel: 'Dr. Tony Evans',
    series: 'Kingdom Foundations',
    seriesPart: 1,
    scriptureRef: 'Ephesians 6:10-18',
    description: 'Pastor Tony Evans breaks down how God equips believers to stand firm against darkness through faith, prayer, and the armor of God.',
    mediaType: 'video',
    mediaUrl: '',
    duration: 1845
  }
];

export const SermonDriftCard: React.FC<{ index?: number }> = ({ index = 0 }) => {
  const [sermon, setSermon] = useState<SermonItem>(FALLBACK_SERMONS[0]);
  const [isPlayingInline, setIsPlayingInline] = useState(false);

  useEffect(() => {
    const fetchRecentSermon = async () => {
      try {
        let combined: any[] = [];
        
        // 1. Fetch community & syndicated ministry sermons
        try {
          const resComm = await fetch('/api/bible/community/sermons');
          if (resComm.ok) {
            const list = await resComm.json();
            if (Array.isArray(list)) combined.push(...list);
          }
        } catch {}

        // 2. Fetch studio-uploaded or studio-recorded videos/audios
        try {
          const resStudio = await fetch('/api/bible/sermons');
          if (resStudio.ok) {
            const studioList = await resStudio.json();
            if (Array.isArray(studioList)) {
              combined.push(...studioList.map((s: any) => ({
                ...s,
                channel: s.channel || 'Sanctuary Studio Archive',
                publishedAt: s.dateRecorded || s.createdAt || new Date().toISOString()
              })));
            }
          }
        } catch {}

        if (combined.length > 0) {
          // Sort by recency to emphasize newly added media and newly made videos/audios
          combined.sort((a, b) => {
            const timeA = new Date(a.publishedAt || a.dateRecorded || a.createdAt || 0).getTime();
            const timeB = new Date(b.publishedAt || b.dateRecorded || b.createdAt || 0).getTime();
            return timeB - timeA;
          });

          // Rotate through diverse channels (RU Recovery, Tony Evans, Lighthouse, Scott Pauley, Fargo Baptist, etc.)
          const pickIdx = Math.abs((index * 2 + Math.floor(Date.now() / (1000 * 60 * 15))) % combined.length);
          setSermon(combined[pickIdx]);
        }
      } catch (e) {
        console.warn('Error loading sermon for feed:', e);
      }
    };
    fetchRecentSermon();
  }, [index]);

  const handleShareToFeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playTap();
    window.dispatchEvent(
      new CustomEvent('open_create_post', {
        detail: {
          content: `🎙️ Featured in Sanctuary Pulpit: "${sermon.title}" by ${sermon.speaker || 'Pastor'}${sermon.scriptureRef ? ` (${sermon.scriptureRef})` : ''} • Channel: ${sermon.channel || 'Pulpit'}\n\n#Sermon #FaithMedia #Sanctuary`,
          tags: 'Sermon,FaithMedia'
        }
      })
    );
  };

  const handleOpenInScriptures = () => {
    soundEffects.playTap();
    try {
      localStorage.setItem('aura_study_initial_tab', 'pulpit');
      localStorage.setItem('aura_target_sermon_id', sermon.id);
      sessionStorage.setItem('aura_target_sermon_id', sermon.id);
    } catch {}
    window.dispatchEvent(
      new CustomEvent('navigate_tab', {
        detail: {
          tab: 'bible',
          subtab: 'pulpit',
          sermonId: sermon.id,
          sermon,
        },
      })
    );
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('switch_study_tab', {
          detail: {
            tab: 'pulpit',
            sermonId: sermon.id,
            sermon,
          },
        })
      );
      window.dispatchEvent(
        new CustomEvent('open_sermon', {
          detail: {
            sermonId: sermon.id,
            sermon,
          },
        })
      );
    }, 60);
  };

  const formatMinSec = (secs?: number) => {
    if (!secs) return '28 min';
    const m = Math.floor(secs / 60);
    return `${m} min`;
  };

  const coverUrl = getSermonCoverImage(sermon, index);

  return (
    <div className="rounded-3xl bg-gradient-to-br from-amber-950/40 via-[#090e28]/95 to-yellow-950/30 border border-amber-500/35 p-4 sm:p-5 shadow-2xl space-y-3.5 backdrop-blur-xl relative overflow-hidden animate-fade-in">
      {/* Glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold uppercase tracking-wider border border-amber-500/30 flex items-center gap-1.5">
            {sermon.mediaType === 'audio' ? <Volume2 className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            <span>{sermon.mediaType === 'audio' ? 'Audio Sermon' : 'Video Sermon'}</span>
          </span>
          {sermon.channel && (
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-bold border border-orange-500/30">
              {sermon.channel}
            </span>
          )}
        </div>

        <span className="text-[10px] text-amber-300/80 font-bold px-2 py-0.5 rounded-md bg-amber-500/10">
          Recently Added Media
        </span>
      </div>

      {/* Visual Cover Preview */}
      <div 
        onClick={handleOpenInScriptures}
        className="relative w-full aspect-[21/9] sm:aspect-[16/7] rounded-2xl overflow-hidden cursor-pointer group border border-white/10"
      >
        <img
          src={coverUrl}
          alt={sermon.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-80"
          onError={(e) => {
            const fallback = getFallbackSpiritualCover(sermon, index);
            if (e.currentTarget.src !== fallback) {
              e.currentTarget.src = fallback;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-amber-600/90 text-white flex items-center justify-center shadow-lg shadow-amber-500/40 group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white font-semibold">
          <span className="truncate max-w-[200px] text-amber-200">{sermon.speaker || 'Pastor'}</span>
          <span className="bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] text-slate-300">
            {formatMinSec(sermon.duration)}
          </span>
        </div>
      </div>

      {/* Notification Headline */}
      <div className="space-y-1.5 cursor-pointer" onClick={handleOpenInScriptures}>
        <h4 className="text-base sm:text-lg font-extrabold text-white leading-snug hover:text-amber-300 transition-colors">
          {sermon.title}
        </h4>

        {sermon.series && (
          <p className="text-xs text-yellow-300 flex items-center gap-1 font-semibold">
            <Layers className="w-3 h-3 text-yellow-400" />
            <span>Series: {sermon.series} {sermon.seriesPart ? `(Part ${sermon.seriesPart})` : ''}</span>
          </p>
        )}

        {sermon.scriptureRef && (
          <p className="text-xs text-slate-300 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Passage: {sermon.scriptureRef}</span>
          </p>
        )}

        {sermon.description && (
          <p className="text-xs text-slate-300 line-clamp-2 mt-1">
            {sermon.description}
          </p>
        )}
      </div>

      {/* Inline Player */}
      {isPlayingInline && sermon.mediaUrl && (
        <div className="rounded-2xl overflow-hidden border border-amber-500/40 bg-black/60 p-2 space-y-2 animate-fade-in">
          {sermon.mediaType === 'audio' ? (
            <audio controls autoPlay src={sermon.mediaUrl} className="w-full" />
          ) : (
            <AsyncMedia
              src={sermon.mediaUrl}
              mediaType="video"
              controls
              autoPlay
              className="w-full max-h-56 rounded-xl bg-black"
            />
          )}
        </div>
      )}

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleShareToFeed}
          className="text-xs font-semibold text-slate-300 hover:text-amber-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          title="Share to Faith Feed"
        >
          <Share2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Share to Feed</span>
        </button>

        <div className="flex items-center gap-2">
          {sermon.mediaUrl && (
            <button
              onClick={() => setIsPlayingInline(!isPlayingInline)}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              {isPlayingInline ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isPlayingInline ? 'Close' : sermon.mediaType === 'audio' ? 'Listen' : 'Watch'}</span>
            </button>
          )}

          <button
            onClick={handleOpenInScriptures}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-bold shadow-lg shadow-amber-500/25 border border-amber-400/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <span>Sanctuary Pulpit</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. NEW MEMBER SIGN-UP & WELCOME CARD
// ==========================================
interface NewMemberProps {
  member?: UserProfile;
}

const DEFAULT_NEW_MEMBER: Partial<UserProfile> = {
  id: 'member-sarah',
  name: 'Sister Sarah Jenkins',
  handle: 'sarahj_faith',
  avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  bio: 'Walking with Christ daily • Worship choir member • Philippians 4:13'
};

export const NewMemberDriftCard: React.FC<NewMemberProps> = ({ member }) => {
  const activeMember = member || (DEFAULT_NEW_MEMBER as UserProfile);
  const [hasWelcomed, setHasWelcomed] = useState(false);
  const [welcomeCount, setWelcomeCount] = useState(19);

  const handleSayWelcome = () => {
    soundEffects.playTap();
    if (!hasWelcomed) {
      setHasWelcomed(true);
      setWelcomeCount(prev => prev + 1);
      confetti({
        particleCount: 35,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#ec4899', '#a855f7', '#6366f1']
      });
    } else {
      setHasWelcomed(false);
      setWelcomeCount(prev => Math.max(1, prev - 1));
    }
  };

  const handleOpenProfile = () => {
    soundEffects.playTap();
    window.dispatchEvent(new CustomEvent('open_user_profile', { detail: { userId: activeMember.id } }));
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-orange-950/40 via-[#0a0c24]/95 to-pink-950/30 border border-orange-500/30 p-4 sm:p-5 shadow-2xl space-y-3.5 backdrop-blur-xl relative overflow-hidden animate-fade-in">
      {/* Glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 text-[11px] font-bold uppercase tracking-wider border border-orange-500/30 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          <span>New Member Joining</span>
        </span>
        <span className="text-[10px] text-orange-300/80 font-bold px-2 py-0.5 rounded-md bg-orange-500/10">
          Welcome to the Family
        </span>
      </div>

      {/* Member Profile Snapshot */}
      <div className="flex items-center gap-3.5">
        <div className="relative cursor-pointer" onClick={handleOpenProfile}>
          <Avatar src={activeMember.avatarUrl} name={activeMember.name} size="lg" />
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0a0c24] flex items-center justify-center text-white text-[9px] font-bold">
            ✓
          </span>
        </div>

        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 
              onClick={handleOpenProfile}
              className="text-sm sm:text-base font-bold text-white hover:text-orange-300 cursor-pointer transition-colors truncate"
            >
              {activeMember.name}
            </h4>
            <span className="text-xs text-slate-400 truncate">@{activeMember.handle}</span>
          </div>
          <p className="text-xs text-slate-300 line-clamp-2">
            {activeMember.bio || 'New believer and brother/sister joining AURA fellowship!'}
          </p>
        </div>
      </div>

      {/* Welcome Note Banner */}
      <div className="p-3 rounded-2xl bg-orange-950/30 border border-orange-500/20 text-xs text-orange-200 flex items-start gap-2.5">
        <MessageCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-white">Welcome note: </strong>
          "We are so blessed to have you in fellowship! Leave a warm greeting or drop a scripture blessing to make them feel right at home."
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-orange-500/15 gap-2 flex-wrap">
        <div className="text-[11px] text-orange-300 font-semibold flex items-center gap-1.5">
          <Heart className={`w-3.5 h-3.5 ${hasWelcomed ? 'text-pink-400 fill-pink-400' : 'text-pink-400/60'}`} />
          <span>{welcomeCount} members welcomed</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSayWelcome}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
              hasWelcomed
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                : 'bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-500 hover:to-pink-500 text-white shadow-md'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{hasWelcomed ? '✓ Welcomed!' : 'Say Welcome'}</span>
          </button>

          <button
            onClick={handleOpenProfile}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all"
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. OCCASIONAL GROUP ACTIVITY CARD
// ==========================================
interface GroupActivityProps {
  activityId?: string;
}

const DEFAULT_ACTIVITIES = [
  {
    id: 'act-1',
    groupName: 'Midweek Fellowship & Prayer Encounter',
    category: 'Community Gathering',
    title: 'Wednesday Evening Worship, Intercession & Study',
    schedule: 'Every Wednesday • 7:00 PM CST',
    location: 'Main Sanctuary & Virtual Live Stream',
    attendeesCount: 32,
    description: 'Join us for acoustic worship, focused corporate prayer for the community, and an open exposition on the epistles.'
  },
  {
    id: 'act-2',
    groupName: 'Youth & Young Adults Ministry',
    category: 'Youth Fellowship',
    title: 'Saturday Night Live: Coffee, Praise & Testimonies',
    schedule: 'This Saturday • 6:30 PM CST',
    location: 'Fellowship Hall Lounge',
    attendeesCount: 24,
    description: 'An uplifting night for college and young professionals to connect, build lifelong friendships, and grow deep in scripture.'
  }
];

export const GroupActivityDriftCard: React.FC<GroupActivityProps> = () => {
  const activity = DEFAULT_ACTIVITIES[0];
  const [hasRsvpd, setHasRsvpd] = useState(false);
  const [count, setCount] = useState(activity.attendeesCount);

  const handleRsvp = () => {
    soundEffects.playTap();
    if (!hasRsvpd) {
      setHasRsvpd(true);
      setCount(prev => prev + 1);
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#34d399', '#60a5fa']
      });
    } else {
      setHasRsvpd(false);
      setCount(prev => Math.max(1, prev - 1));
    }
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-emerald-950/40 via-[#0a1024]/95 to-teal-950/25 border border-emerald-500/30 p-4 sm:p-5 shadow-2xl space-y-3.5 backdrop-blur-xl relative overflow-hidden animate-fade-in">
      {/* Glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>Group Activity</span>
        </span>
        <span className="text-[10px] text-emerald-300/80 font-bold px-2 py-0.5 rounded-md bg-emerald-500/10">
          {activity.category}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-1.5">
        <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
          {activity.title}
        </h4>
        <p className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span>Hosted by: {activity.groupName}</span>
        </p>
        <p className="text-xs text-slate-300 leading-relaxed">
          {activity.description}
        </p>
      </div>

      {/* Schedule & Location Badges */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-200 flex items-center gap-1">
          <Calendar className="w-3 h-3 text-emerald-400" />
          <span>{activity.schedule}</span>
        </span>
        <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-300">
          📍 {activity.location}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-emerald-500/15 gap-2 flex-wrap">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{count} members attending</span>
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRsvp}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
              hasRsvpd
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            <span>{hasRsvpd ? '✓ RSVP Confirmed' : 'RSVP & Join'}</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playTap();
              window.dispatchEvent(new CustomEvent('navigate_tab', { detail: { tab: 'recovery' } }));
            }}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all"
          >
            <span>Fellowship</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
