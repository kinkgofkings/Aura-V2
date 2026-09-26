import React, { useState, useEffect } from 'react';
import { 
  Heart, Sparkles, BookOpen, Volume2, Video, Play, Pause, 
  ExternalLink, Calendar, Users, CheckCircle2, UserPlus, MessageCircle, 
  Layers, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../../services/audio';
import { Avatar } from '../common/Avatar';
import { AsyncMedia } from '../common/AsyncMedia';
import { UserProfile } from '../../types';

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
    category: 'General',
    content: 'Lord, grant strength, peace, and healing today over every household in our community. Let Your presence dwell in our hearts and guide our every step.',
    prayedCount: 38,
    prayedUsers: [],
    isAnswered: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prayer-community-2',
    authorName: 'Hannah Grace',
    authorHandle: 'hannahg',
    isAnonymous: false,
    category: 'Healing',
    content: 'Asking for continued prayers for my mother recovery. We felt God peace through every test and doctor report this week!',
    prayedCount: 24,
    prayedUsers: [],
    isAnswered: true,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

export const PrayerDriftCard: React.FC<{ index?: number }> = () => {
  const [prayer, setPrayer] = useState<PrayerItem>(DEFAULT_PRAYERS[0]);
  const [hasPrayed, setHasPrayed] = useState(false);
  const [amenCount, setAmenCount] = useState(38);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('aura_church_prayer_wall');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Find Tex's prayer or take the first prayer
          const texPrayer = parsed.find(p => p.authorName?.toLowerCase().includes('tex') || p.authorHandle?.toLowerCase().includes('tex'));
          const chosen = texPrayer || parsed[0];
          setPrayer(chosen);
          setAmenCount(chosen.prayedCount || 28);
        }
      }
    } catch (e) {
      console.warn('Error loading prayer wall item for feed:', e);
    }
  }, []);

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
      localStorage.setItem('aura_target_prayer_id', prayer.id);
      sessionStorage.setItem('aura_target_prayer_id', prayer.id);
    } catch {}
    window.dispatchEvent(
      new CustomEvent('navigate_tab', {
        detail: {
          tab: 'bible',
          subtab: 'prayers',
          prayerId: prayer.id,
          prayer,
        },
      })
    );
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('switch_study_tab', {
          detail: {
            tab: 'prayers',
            prayerId: prayer.id,
            prayer,
          },
        })
      );
      window.dispatchEvent(
        new CustomEvent('target_prayer', {
          detail: {
            prayerId: prayer.id,
            prayer,
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
            <span>🙏 Prayer Wall</span>
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            {prayer.authorName} posted a {prayer.category.toLowerCase()} prayer
          </span>
        </div>
        <span className="text-[10px] text-amber-400/80 font-semibold px-2 py-0.5 rounded-md bg-amber-500/10">
          Community Request
        </span>
      </div>

      {/* Prayer Content */}
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center font-bold text-sm shrink-0">
            {prayer.isAnonymous ? '?' : prayer.authorName.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-200">
              {prayer.isAnonymous ? 'Anonymous Church Member' : prayer.authorName}
              {!prayer.isAnonymous && <span className="text-slate-400 font-normal ml-1">@{prayer.authorHandle}</span>}
            </h4>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-serif italic">
              "{prayer.content}"
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-amber-500/15 gap-2 flex-wrap">
        <div className="text-[11px] text-amber-300/90 font-semibold flex items-center gap-1.5">
          <Heart className={`w-3.5 h-3.5 ${hasPrayed ? 'text-amber-400 fill-amber-400' : 'text-amber-400/60'}`} />
          <span>{amenCount} praying with {prayer.authorName}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAmen}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
              hasPrayed
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 font-extrabold'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
            }`}
          >
            <span>{hasPrayed ? '✓ Prayed' : '🙏 Amen / Pray'}</span>
          </button>

          <button
            onClick={handleGoToWall}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all"
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

export const SermonDriftCard: React.FC<{ index?: number }> = () => {
  const [sermon, setSermon] = useState<SermonItem>(FALLBACK_SERMONS[0]);
  const [isPlayingInline, setIsPlayingInline] = useState(false);

  useEffect(() => {
    const fetchRecentSermon = async () => {
      try {
        // We fetch from community sermons to ensure we get the Lighthouse sermons
        const res = await fetch('/api/bible/community/sermons');
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            // Prefer Lighthouse sermons
            const lighthouse = list.find(s => s.channel?.toLowerCase().includes('lighthouse'));
            setSermon(lighthouse || list[0]);
          }
        }
      } catch (e) {
        console.warn('Error loading sermon for feed:', e);
      }
    };
    fetchRecentSermon();
  }, []);

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
          Recently Uploaded
        </span>
      </div>

      {/* Notification Headline */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <p className="text-xs font-bold text-amber-200">
            {sermon.speaker || 'Pastor'} uploaded a new sermon • watch/listen now
          </p>
        </div>

        <h4 className="text-base sm:text-lg font-extrabold text-white leading-snug">
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
        <span className="text-xs text-slate-400 font-medium">
          Duration: {formatMinSec(sermon.duration)}
        </span>

        <div className="flex items-center gap-2">
          {sermon.mediaUrl && (
            <button
              onClick={() => setIsPlayingInline(!isPlayingInline)}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
            >
              {isPlayingInline ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isPlayingInline ? 'Close Player' : sermon.mediaType === 'audio' ? 'Listen Now' : 'Watch Now'}</span>
            </button>
          )}

          <button
            onClick={handleOpenInScriptures}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-bold shadow-lg shadow-amber-500/25 border border-amber-400/30 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <span>Go to Sermons</span>
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
