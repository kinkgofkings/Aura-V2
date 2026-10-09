import React, { useEffect, useState } from 'react';
import { CheckCircle2, Flame, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundEffects } from '../../services/audio';
import type { KingdomMission } from '../../../services/kingdomMissions';

interface MissionState {
  mission: KingdomMission;
  completed: boolean;
  streak: number;
}

export function KingdomMissionCard({ variant = 'full' }: { variant?: 'full' | 'banner' }) {
  const { user } = useAuth();
  const [state, setState] = useState<MissionState | null>(null);
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [shareToFeed, setShareToFeed] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    const query = user?.id ? `?userId=${encodeURIComponent(user.id)}` : '';
    const response = await fetch(`/api/missions/today${query}`);
    if (!response.ok) return;
    const data = await response.json();
    setState({ mission: data.mission, completed: Boolean(data.completed), streak: data.streak || 0 });
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, [user?.id]);

  const complete = async () => {
    if (!state || !user) {
      setMessage('Sign in to mark today’s mission complete.');
      return;
    }
    setSaving(true);
    try {
      soundEffects.playTap();
      const response = await fetch(`/api/missions/${state.mission.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          notes,
          shareToFeed,
          authorName: user.name,
          authorHandle: user.handle,
          authorAvatar: user.avatarUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save the mission');
      setState({ mission: data.mission, completed: true, streak: data.streak || 1 });
      setOpen(false);
      setMessage(shareToFeed ? 'Mission posted to the feed.' : 'Marked complete. Well done.');
      soundEffects.playMessageSent();
    } catch (error: any) {
      setMessage(error.message || 'Could not save the mission');
    } finally {
      setSaving(false);
    }
  };

  if (!state) return null;
  const { mission } = state;
  const compact = variant === 'banner';

  return (
    <div className={`rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/50 via-[#0b1024] to-yellow-950/30 shadow-xl ${compact ? 'p-4 mb-4' : 'p-5'}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">Act & Abide</span>
        <span className="text-[10px] font-bold text-orange-200 flex items-center gap-1">
          <Flame className="w-3 h-3" /> {state.streak} day streak
        </span>
      </div>
      <h3 className={`font-black text-white ${compact ? 'text-base' : 'text-lg'}`}>{mission.title}</h3>
      <p className="text-xs text-amber-200 mt-1">{mission.scriptureRef} · {mission.category}</p>
      <p className={`text-sm text-slate-200 mt-2 leading-relaxed ${compact ? 'line-clamp-3' : ''}`}>{mission.promptText}</p>
      <p className="text-[11px] text-slate-400 mt-2">{mission.completionCount} believers have acted on this today</p>
      {state.completed ? (
        <p className="mt-3 text-xs font-bold text-emerald-300 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> Completed for today
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold"
        >
          Mark Completed
        </button>
      )}
      {message && <p className="text-[11px] text-amber-100 mt-2">{message}</p>}
      {open && (
        <div className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-black/30 p-3">
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Optional testimony of what you did"
            className="w-full rounded-xl bg-black/40 border border-white/10 p-2 text-xs text-white"
          />
          <label className="flex items-center gap-2 text-xs text-slate-200">
            <input type="checkbox" checked={shareToFeed} onChange={(event) => setShareToFeed(event.target.checked)} />
            Share a Mission Completed card to the feed
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-xs text-slate-300">Cancel</button>
            <button type="button" disabled={saving} onClick={complete} className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold flex items-center gap-1">
              <Send className="w-3 h-3" /> {saving ? 'Saving' : 'Finish'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
