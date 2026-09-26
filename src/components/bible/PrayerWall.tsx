import React, { useState, useEffect } from 'react';
import { Heart, Send, Sparkles, CheckCircle2, User, ShieldCheck, MessageSquare, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundEffects } from '../../services/audio';

interface PrayerItem {
  id: string;
  authorName: string;
  authorHandle: string;
  isAnonymous: boolean;
  content: string;
  category: 'Healing' | 'Family' | 'Guidance' | 'Salvation' | 'Praise' | 'General';
  prayedCount: number;
  prayedUsers: string[];
  isAnswered: boolean;
  praiseUpdate?: string;
  createdAt: string;
}

const STORAGE_KEY = 'aura_church_prayer_wall';

const INITIAL_DEFAULT_PRAYERS: PrayerItem[] = [
  {
    id: 'prayer-tex-1',
    authorName: 'Pastor Tex Jenkins',
    authorHandle: 'tex',
    isAnonymous: false,
    category: 'Healing',
    content: 'Lifting up all families walking through seasons of recovery and illness. May God grant supernatural peace, divine healing, and restore joy unto every broken heart today!',
    prayedCount: 42,
    prayedUsers: [],
    isAnswered: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prayer-community-2',
    authorName: 'Daphne & Family',
    authorHandle: 'daphne',
    isAnonymous: false,
    category: 'Praise',
    content: 'Asking for continued prayers for my mother recovery. We felt God peace through every test and doctor report this week!',
    prayedCount: 29,
    prayedUsers: [],
    isAnswered: true,
    praiseUpdate: 'Doctors confirmed stable progress! Thank you church family for lifting us up.',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'p-1',
    authorName: 'Church Family',
    authorHandle: 'church',
    isAnonymous: false,
    category: 'Praise',
    content: 'Praising God for His abundant grace and for our Wednesday and Sunday gatherings in the Word!',
    prayedCount: 14,
    prayedUsers: [],
    isAnswered: true,
    praiseUpdate: 'Thank you for continuing to lift up the leadership and congregation in prayer.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'p-2',
    authorName: 'Anonymous Member',
    authorHandle: 'anonymous',
    isAnonymous: true,
    category: 'Healing',
    content: 'Please pray for physical healing and strength for a family member recovering this week.',
    prayedCount: 8,
    prayedUsers: [],
    isAnswered: false,
    createdAt: new Date().toISOString(),
  }
];

export const PrayerWall: React.FC = () => {
  const { user } = useAuth();
  const [prayers, setPrayers] = useState<PrayerItem[]>(() => {
    let initialList = INITIAL_DEFAULT_PRAYERS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure default Tex prayer is accessible
          const hasTex = parsed.some(p => p.id === 'prayer-tex-1');
          initialList = hasTex ? parsed : [INITIAL_DEFAULT_PRAYERS[0], ...parsed];
        }
      }
      
      const targetDataStr = sessionStorage.getItem('aura_target_prayer_data');
      if (targetDataStr) {
        const targetData = JSON.parse(targetDataStr);
        if (targetData && targetData.id && !initialList.some(p => p.id === targetData.id)) {
          initialList = [targetData, ...initialList];
        }
      }
    } catch {}
    return initialList;
  });

  const [highlightedPrayerId, setHighlightedPrayerId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('aura_target_prayer_id') || localStorage.getItem('aura_target_prayer_id');
    } catch {
      return null;
    }
  });

  const [filter, setFilter] = useState<string>('all');
  const [newRequest, setNewRequest] = useState('');
  const [category, setCategory] = useState<PrayerItem['category']>('General');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showPraiseModal, setShowPraiseModal] = useState<string | null>(null);
  const [praiseText, setPraiseText] = useState('');
  
  const [editingPrayerId, setEditingPrayerId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const startEditing = (prayer: PrayerItem) => {
    setEditingPrayerId(prayer.id);
    setEditContent(prayer.content);
  };

  const handleUpdatePrayer = (prayerId: string) => {
    if (!editContent.trim()) return;
    setPrayers(prev => prev.map(p => 
      p.id === prayerId ? { ...p, content: editContent.trim() } : p
    ));
    setEditingPrayerId(null);
    setEditContent('');
  };

  const handleDeletePrayer = (prayerId: string) => {
    if (confirm("Are you sure you want to remove this prayer request?")) {
      setPrayers(prev => prev.filter(p => p.id !== prayerId));
    }
  };

  // Listen for target_prayer events dispatched from NewsFeed shortcut links
  useEffect(() => {
    const handleTargetPrayer = (e: Event) => {
      const custom = e as CustomEvent<{ prayerId: string; prayer?: PrayerItem }>;
      const targetId = custom.detail?.prayerId;
      if (!targetId) return;

      if (custom.detail.prayer) {
        setPrayers(prev => {
          if (prev.some(p => p.id === targetId)) return prev;
          return [custom.detail.prayer!, ...prev];
        });
      }

      setFilter('all');
      setHighlightedPrayerId(targetId);

      setTimeout(() => {
        const el = document.getElementById(`prayer-card-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      setTimeout(() => {
        setHighlightedPrayerId(prev => (prev === targetId ? null : prev));
        try {
          sessionStorage.removeItem('aura_target_prayer_id');
          localStorage.removeItem('aura_target_prayer_id');
        } catch {}
      }, 7000);
    };

    window.addEventListener('target_prayer', handleTargetPrayer);
    return () => window.removeEventListener('target_prayer', handleTargetPrayer);
  }, []);

  // On initial mount if target prayer was stored
  useEffect(() => {
    if (highlightedPrayerId) {
      setFilter('all');
      const timer = setTimeout(() => {
        const el = document.getElementById(`prayer-card-${highlightedPrayerId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 250);

      const clearTimer = setTimeout(() => {
        setHighlightedPrayerId(null);
        try {
          sessionStorage.removeItem('aura_target_prayer_id');
          localStorage.removeItem('aura_target_prayer_id');
        } catch {}
      }, 7000);

      return () => {
        clearTimeout(timer);
        clearTimeout(clearTimer);
      };
    }
  }, [highlightedPrayerId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prayers));
    } catch {}
  }, [prayers]);

  const handleAddPrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.trim()) return;

    soundEffects.playTap();
    const item: PrayerItem = {
      id: `prayer-${Date.now()}`,
      authorName: isAnonymous ? 'Anonymous Member' : (user?.name || 'Fellow Believer'),
      authorHandle: isAnonymous ? 'anonymous' : (user?.handle || 'member'),
      isAnonymous,
      category,
      content: newRequest.trim(),
      prayedCount: 1,
      prayedUsers: user ? [user.id] : [],
      isAnswered: false,
      createdAt: new Date().toISOString(),
    };

    setPrayers([item, ...prayers]);
    setNewRequest('');
  };

  const handlePrayFor = (prayerId: string) => {
    soundEffects.playTap();
    setPrayers(prev => prev.map(p => {
      if (p.id !== prayerId) return p;
      const userId = user?.id || 'anon';
      const hasPrayed = p.prayedUsers.includes(userId);
      return {
        ...p,
        prayedCount: hasPrayed ? Math.max(1, p.prayedCount - 1) : p.prayedCount + 1,
        prayedUsers: hasPrayed
          ? p.prayedUsers.filter(id => id !== userId)
          : [...p.prayedUsers, userId]
      };
    }));
  };

  const handleMarkAnswered = (prayerId: string) => {
    if (!praiseText.trim()) return;
    try {
      soundEffects.playShofarHorn();
    } catch {}
    setPrayers(prev => prev.map(p => {
      if (p.id !== prayerId) return p;
      return {
        ...p,
        isAnswered: true,
        praiseUpdate: praiseText.trim()
      };
    }));
    setShowPraiseModal(null);
    setPraiseText('');
  };

  const filteredPrayers = prayers.filter(p => {
    if (filter === 'praise') return p.isAnswered || p.category === 'Praise';
    if (filter === 'requests') return !p.isAnswered;
    return true;
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-yellow-950/80 border border-amber-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                Church Fellowship
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Live Prayer Wall
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Prayer & Praise Community</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              "Bear ye one another's burdens, and so fulfil the law of Christ." — Galatians 6:2
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'all' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('requests')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'requests' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Needs
            </button>
            <button
              onClick={() => setFilter('praise')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'praise' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Praises & Answered
            </button>
          </div>
        </div>
      </div>

      {/* Submit Prayer Box */}
      <form onSubmit={handleAddPrayer} className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-400" />
          Share a Prayer Need or Praise Report
        </h3>

        <textarea
          rows={3}
          required
          value={newRequest}
          onChange={e => setNewRequest(e.target.value)}
          placeholder="How can your church family stand with you in prayer today?"
          className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-amber-500 outline-none resize-none leading-relaxed placeholder:text-slate-500"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-300 outline-none"
            >
              <option value="General">General Prayer</option>
              <option value="Healing">Healing & Health</option>
              <option value="Family">Family & Home</option>
              <option value="Guidance">Guidance & Wisdom</option>
              <option value="Salvation">Salvation</option>
              <option value="Praise">Praise & Thanksgiving</option>
            </select>

            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-amber-600 focus:ring-0"
              />
              Share Anonymously
            </label>
          </div>

          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-bold shadow-lg shadow-amber-900/30 flex items-center gap-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post to Wall</span>
          </button>
        </div>
      </form>

      {/* Prayers List */}
      <div className="space-y-3.5">
        {filteredPrayers.map((prayer) => {
          const userHasPrayed = user ? prayer.prayedUsers.includes(user.id) : false;
          const isOwner = user && (user.handle === prayer.authorHandle || user.handle === 'tex');
          const isTargeted = highlightedPrayerId === prayer.id;

          return (
            <div
              key={prayer.id}
              id={`prayer-card-${prayer.id}`}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-500 relative overflow-hidden ${
                isTargeted
                  ? 'ring-2 ring-amber-400 border-amber-400 bg-gradient-to-br from-amber-950/50 via-slate-900 to-amber-950/30 shadow-[0_0_35px_rgba(245,158,11,0.35)] scale-[1.01]'
                  : prayer.isAnswered
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-slate-900/50 border-white/10 hover:border-amber-500/30'
              }`}
            >
              {/* Targeted Banner from NewsFeed shortcut */}
              {isTargeted && (
                <div className="mb-3.5 pb-2.5 border-b border-amber-500/30 flex items-center justify-between gap-2 flex-wrap animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="animate-pulse bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                      <span>🎯 Targeted Prayer Request</span>
                    </span>
                    <span className="text-xs text-amber-300/90 font-semibold">Opened from NewsFeed Shortcut</span>
                  </div>
                  <span className="text-[10px] text-amber-400/80 font-mono">ID: {prayer.id}</span>
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-amber-400 font-bold text-xs">
                    {prayer.isAnonymous ? <User className="w-4 h-4 text-slate-400" /> : prayer.authorName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{prayer.authorName}</span>
                      {prayer.category && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/5">
                          {prayer.category}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(prayer.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {prayer.isAnswered && (
                  <span className="flex items-center gap-1 text-[11px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Answered Praise
                  </span>
                )}
              </div>

              {/* Prayer Content */}
              {editingPrayerId === prayer.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500/50 resize-none min-h-[100px]"
                    placeholder="Edit your prayer request..."
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingPrayerId(null)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdatePrayer(prayer.id)}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white shadow-sm transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-slate-200 mt-3 leading-relaxed whitespace-pre-wrap">
                  {prayer.content}
                </p>
              )}

              {/* Answered Praise Report Box */}
              {prayer.praiseUpdate && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-900/30 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-300">
                    <Sparkles className="w-3.5 h-3.5" /> Praise Report / Testimony:
                  </p>
                  <p className="leading-relaxed italic">{prayer.praiseUpdate}</p>
                </div>
              )}

              {/* Footer Actions */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                  onClick={() => handlePrayFor(prayer.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    userHasPrayed
                      ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 shadow-sm'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                  }`}
                  title="Lift this request up in prayer"
                >
                  <span className="text-sm">🙏</span>
                  <span>{userHasPrayed ? 'Praying with you' : 'I Prayed For This'}</span>
                  <span className="ml-1 px-1.5 py-0.5 rounded-md bg-black/40 text-[10px] text-white font-mono">
                    {prayer.prayedCount}
                  </span>
                </button>

                  {isOwner && !prayer.isAnswered && (
                    <button
                      onClick={() => setShowPraiseModal(prayer.id)}
                      className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Share Praise Report
                    </button>
                  )}
                </div>

                {/* Edit / Delete Actions */}
                {isOwner && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => startEditing(prayer)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="Edit prayer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePrayer(prayer.id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete prayer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Modal for Answered Praise */}
              {showPraiseModal === prayer.id && (
                <div className="mt-3 p-3 bg-black/50 border border-emerald-500/40 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-emerald-300 block">
                    Praise Report / Answered Prayer Testimony:
                  </label>
                  <textarea
                    rows={2}
                    value={praiseText}
                    onChange={e => setPraiseText(e.target.value)}
                    placeholder="Share how God answered this prayer to encourage the church..."
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowPraiseModal(null)}
                      className="px-2.5 py-1 rounded-md text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleMarkAnswered(prayer.id)}
                      className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
                    >
                      Publish Praise
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
