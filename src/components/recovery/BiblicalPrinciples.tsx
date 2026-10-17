import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Volume2,
  Award,
  Save,
  Check,
  Share2,
  Crown,
  Layers,
  Heart
} from 'lucide-react';
import {
  CORE_BIBLICAL_RECOVERY_PRINCIPLES,
  RU_TEN_SPIRITUAL_PRINCIPLES
} from '../../content/recoveryPrinciples';
import { RecoveryPrinciple, UserPrincipleProgress } from '../../types/recovery';
import { useAuth } from '../../context/AuthContext';
import { soundEffects } from '../../services/audio';

export const BiblicalPrinciples: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'guest_local';

  // Track Selector: RU Principles vs Foundational Biblical Principles
  const [principleTrack, setPrincipleTrack] = useState<'ru' | 'foundational'>('ru');

  const [expandedStep, setExpandedStep] = useState<number | null>(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('p');
      return p ? parseInt(p) : 1;
    } catch {
      return 1;
    }
  });

  // Active Principles based on selected track
  const activePrinciples =
    principleTrack === 'ru'
      ? RU_TEN_SPIRITUAL_PRINCIPLES
      : CORE_BIBLICAL_RECOVERY_PRINCIPLES;

  // Separate progress maps for each track
  const [progressMapRu, setProgressMapRu] = useState<Record<number, UserPrincipleProgress>>({});
  const [progressMapFoundational, setProgressMapFoundational] = useState<Record<number, UserPrincipleProgress>>({});

  const [activeNotes, setActiveNotes] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState<number | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<number | null>(null);
  const [playingStep, setPlayingStep] = useState<number | null>(null);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    };
  }, []);

  // Load progress on mount & when track / user changes
  useEffect(() => {
    loadTrackProgress('ru');
    loadTrackProgress('foundational');
  }, [userId]);

  const loadTrackProgress = (track: 'ru' | 'foundational') => {
    try {
      const storageKey = `aura_principles_${track}_${userId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (track === 'ru') {
          setProgressMapRu(parsed);
        } else {
          setProgressMapFoundational(parsed);
        }
      }
    } catch (e) {
      console.warn(`Could not load local progress for ${track}:`, e);
    }

    // Try fetching from server
    fetch(`/api/recovery/user-principles/${userId}?track=${track}`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Not found');
      })
      .then((data) => {
        if (Array.isArray(data.principles)) {
          const map: Record<number, UserPrincipleProgress> = {};
          data.principles.forEach((p: UserPrincipleProgress) => {
            map[p.step] = p;
          });
          if (track === 'ru') {
            setProgressMapRu((prev) => ({ ...prev, ...map }));
          } else {
            setProgressMapFoundational((prev) => ({ ...prev, ...map }));
          }
        }
      })
      .catch(() => {});
  };

  const currentProgressMap = principleTrack === 'ru' ? progressMapRu : progressMapFoundational;

  // Sync activeNotes when changing tracks or principles
  useEffect(() => {
    const notes: Record<number, string> = {};
    activePrinciples.forEach((p) => {
      notes[p.step] = currentProgressMap[p.step]?.userNotes || '';
    });
    setActiveNotes(notes);
  }, [principleTrack, currentProgressMap, activePrinciples]);

  const toggleStep = (step: number) => {
    soundEffects.playTap();
    setExpandedStep(expandedStep === step ? null : step);
  };

  const handleToggleCommit = (step: number) => {
    const current = currentProgressMap[step] || {
      step,
      isCompleted: false,
      userNotes: '',
      actionCommitted: false
    };

    const nextCommitted = !current.actionCommitted;

    if (nextCommitted) {
      soundEffects.playSuccess();
      soundEffects.playMarioCoin();
      // Burst celebratory confetti
      import('canvas-confetti')
        .then((confettiModule) => {
          const confetti = (confettiModule.default || confettiModule) as any;
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.65 },
            colors: ['#10b981', '#f59e0b', '#3b82f6', '#ffffff']
          });
        })
        .catch(() => {});
    } else {
      soundEffects.playTap();
    }

    const updated: UserPrincipleProgress = {
      ...current,
      actionCommitted: nextCommitted,
      isCompleted: nextCommitted,
      completedAt: nextCommitted ? new Date().toISOString() : undefined,
      userNotes: activeNotes[step] || current.userNotes || ''
    };

    saveProgress(step, updated);
  };

  const handleSaveNotes = (step: number) => {
    soundEffects.playTap();
    setIsSaving(step);
    const current = currentProgressMap[step] || {
      step,
      isCompleted: false,
      userNotes: '',
      actionCommitted: false
    };

    const updated: UserPrincipleProgress = {
      ...current,
      userNotes: activeNotes[step] || ''
    };

    saveProgress(step, updated).then(() => {
      setIsSaving(null);
      setSaveSuccess(step);
      setTimeout(() => setSaveSuccess(null), 2500);
    });
  };

  const saveProgress = async (step: number, progress: UserPrincipleProgress) => {
    if (principleTrack === 'ru') {
      setProgressMapRu((prev) => {
        const nextMap = { ...prev, [step]: progress };
        try {
          localStorage.setItem(`aura_principles_ru_${userId}`, JSON.stringify(nextMap));
        } catch {}
        return nextMap;
      });
    } else {
      setProgressMapFoundational((prev) => {
        const nextMap = { ...prev, [step]: progress };
        try {
          localStorage.setItem(`aura_principles_foundational_${userId}`, JSON.stringify(nextMap));
        } catch {}
        return nextMap;
      });
    }

    try {
      await fetch(`/api/recovery/user-principles/${userId}?track=${principleTrack}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...progress, track: principleTrack })
      });
    } catch (err) {
      console.warn('Failed to save principle progress to server:', err);
    }
  };

  const handleShare = async (e: React.MouseEvent, principle: RecoveryPrinciple) => {
    e.stopPropagation();
    soundEffects.playTap();
    const url = `${window.location.origin}/?tab=recovery&rtab=principles&p=${principle.step}&track=${principleTrack}`;
    const shareData = {
      title: `Principle ${principle.step}: ${principle.title}`,
      text: `Path to Freedom - Principle ${principle.step}: "${principle.title}"`,
      url: url
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleReadAloud = (principle: RecoveryPrinciple) => {
    soundEffects.playTap();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    try {
      if (playingStep === principle.step) {
        window.speechSynthesis.cancel();
        setPlayingStep(null);
        (window as any).__activeUtterance = null;
        return;
      }
      window.speechSynthesis.cancel();
      const textToRead = `Principle ${principle.step}: ${principle.title}. Scripture from ${principle.scripture.reference}: ${principle.scripture.text}. Biblical Truth: ${principle.biblicalTruth}. Prayer: ${principle.prayer}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95;
      utterance.onend = () => {
        setPlayingStep(null);
        (window as any).__activeUtterance = null;
      };
      utterance.onerror = () => {
        setPlayingStep(null);
        (window as any).__activeUtterance = null;
      };
      (window as any).__activeUtterance = utterance;
      setPlayingStep(principle.step);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error safely caught:', e);
      setPlayingStep(null);
    }
  };

  // Compute completed count for active track
  const completedCount = Object.values(currentProgressMap).filter((p) => p.isCompleted).length;
  const percentage = Math.round((completedCount / activePrinciples.length) * 100);

  return (
    <div className="space-y-6">
      {/* Track Selector Tabs: RU Principles vs Foundational Biblical Principles */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => {
            soundEffects.playTap();
            setPrincipleTrack('ru');
            setExpandedStep(1);
          }}
          className={`flex-1 min-w-[240px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            principleTrack === 'ru'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>RU 10 Spiritual Principles (Steven Curington)</span>
        </button>

        <button
          onClick={() => {
            soundEffects.playTap();
            setPrincipleTrack('foundational');
            setExpandedStep(1);
          }}
          className={`flex-1 min-w-[240px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            principleTrack === 'foundational'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Foundational Biblical Recovery Steps (Original 10)</span>
        </button>
      </div>

      {/* Header & Progress Bar */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900/80 to-yellow-950/40 border border-white/10 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                {principleTrack === 'ru' ? 'Reformers Unanimous' : '10 Biblical Steps'}
              </span>
              <span className="text-xs text-slate-400">
                {principleTrack === 'ru' ? 'Official RU Spiritual Curriculum' : 'Christ-Centered Deliverance'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {principleTrack === 'ru'
                ? 'The RU Ten Spiritual Principles'
                : 'Core Biblical Recovery Principles'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              {principleTrack === 'ru'
                ? 'Authored by Steven Curington. The foundational spiritual truths taught weekly in Reformers Unanimous chapters worldwide to overcome strongholds and walk in daily victory.'
                : 'Anchored in the Gospel of Jesus Christ, deep heart repentance, renewing the mind, and walking in the Holy Spirit.'}
            </p>
          </div>

          {/* Progress Badge */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-amber-600/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Completed
              </div>
              <div className="text-xl font-black text-white">
                {completedCount} / {activePrinciples.length}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/10">
          <div
            className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2 text-[11px] font-bold text-slate-400">
          <span>{percentage}% of Principles Applied</span>
          <span>{completedCount === activePrinciples.length ? '🎉 All Applied in Christ!' : 'Keep Walking Daily'}</span>
        </div>
      </div>

      {/* Principles List */}
      <div className="space-y-4">
        {activePrinciples.map((principle) => {
          const isExpanded = expandedStep === principle.step;
          const progress = currentProgressMap[principle.step];
          const isCompleted = progress?.isCompleted || false;
          const isCommitted = progress?.actionCommitted || false;
          const isSpeaking = playingStep === principle.step;

          return (
            <div
              key={principle.step}
              id={`principle-card-${principle.step}`}
              className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                isCompleted
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : isExpanded
                  ? 'bg-slate-900/90 border-amber-500/50 shadow-xl'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20'
              }`}
            >
              {/* Card Header */}
              <div
                onClick={() => toggleStep(principle.step)}
                className="p-4 sm:p-6 flex items-start sm:items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-sm sm:text-base shrink-0 mt-1 sm:mt-0 transition-colors ${
                      isCompleted
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                        : isExpanded
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {isCompleted ? <Check className="w-6 h-6 stroke-[3]" /> : `P${principle.step}`}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        {principle.biblicalTheme}
                      </span>
                      {isCompleted && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Applied
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white leading-snug truncate">
                      Principle {principle.step}: {principle.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5 line-clamp-1">
                      {principle.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    onClick={(e) => handleShare(e, principle)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Share Principle Link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-amber-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              {isExpanded && (
                <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-white/10 space-y-6 animate-in fade-in duration-300">
                  {/* Scripture Anchor with Audio Playback */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                        <BookOpen className="w-4 h-4" />
                        <span>Scripture Anchor (KJV)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReadAloud(principle)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            isSpeaking
                              ? 'bg-amber-400 text-slate-950 animate-pulse'
                              : 'bg-white/10 text-amber-300 hover:bg-white/20'
                          }`}
                          title="Listen to this principle read aloud"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base italic font-serif leading-relaxed text-amber-100">
                      "{principle.scripture.text}"
                    </p>
                    <div className="text-xs font-mono text-amber-400 font-bold text-right">
                      — {principle.scripture.reference}
                    </div>
                  </div>

                  {/* Summary & Biblical Truth */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Summary
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {principle.summary}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Biblical Truth
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                        {principle.biblicalTruth}
                      </p>
                    </div>
                  </div>

                  {/* Reflection Questions */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Heart Reflection Questions
                    </h4>
                    <div className="space-y-2">
                      {principle.reflectionQuestions.map((q, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="leading-relaxed">{q}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Steps */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Practical Faith in Action
                    </h4>
                    <div className="space-y-2">
                      {principle.actionSteps.map((stepText, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">{stepText}</p>
                        </div>
                      ))}
                    </div>

                    {/* Commit Checkbox */}
                    <div className="pt-3 border-t border-white/10">
                      <button
                        onClick={() => handleToggleCommit(principle.step)}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                          isCommitted
                            ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                            : 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                        }`}
                      >
                        {isCommitted ? (
                          <>
                            <Check className="w-5 h-5 stroke-[3]" />
                            <span>Committed & Applied Before God! (Tap to unmark)</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-4 h-4" />
                            <span>Commit to Apply Principle {principle.step} Today</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Personal Notes */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Your Personal Prayer & Journal Notes
                      </h4>
                      {saveSuccess === principle.step && (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
                          <Check className="w-3.5 h-3.5" /> Saved!
                        </span>
                      )}
                    </div>
                    <textarea
                      value={activeNotes[principle.step] || ''}
                      onChange={(e) =>
                        setActiveNotes({ ...activeNotes, [principle.step]: e.target.value })
                      }
                      placeholder="Write your personal reflections, convictions, and prayers for this principle..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 resize-none transition-colors"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSaveNotes(principle.step)}
                        disabled={isSaving === principle.step}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5 text-slate-300" />
                        <span>{isSaving === principle.step ? 'Saving...' : 'Save Notes'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Closing Prayer & Affirmation */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/20 via-slate-900 to-amber-950/20 border border-white/10 space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-purple-300">
                      Prayer of Deliverance
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                      "{principle.prayer}"
                    </p>
                    <div className="pt-2 border-t border-white/10 text-xs text-amber-300 font-bold">
                      Daily Affirmation: <span className="text-white font-normal">"{principle.affirmation}"</span>
                    </div>
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
