import React, { useEffect, useState } from 'react';
import { CloudRain, Guitar, Moon, Music2, Volume2, Waves } from 'lucide-react';
import { ambienceEngine, AmbientTrack, SleepChoice } from '../../services/ambienceEngine';

const TRACKS: { id: AmbientTrack; label: string; icon: React.ReactNode }[] = [
  { id: 'rain', label: 'Rain', icon: <CloudRain className="w-3.5 h-3.5" /> },
  { id: 'picking', label: 'Picking', icon: <Guitar className="w-3.5 h-3.5" /> },
  { id: 'strings', label: 'Strings', icon: <Music2 className="w-3.5 h-3.5" /> },
  { id: 'pads', label: 'Pads', icon: <Waves className="w-3.5 h-3.5" /> },
];

export function AmbienceMixer({
  narrationRef,
  onSleep,
}: {
  narrationRef?: React.RefObject<HTMLAudioElement | null>;
  onSleep?: () => void;
}) {
  const [, setTick] = useState(0);

  useEffect(() => ambienceEngine.subscribe(() => setTick((value) => value + 1)), []);

  useEffect(() => {
    if (!narrationRef) return;
    return ambienceEngine.registerNarration(narrationRef.current);
  }, [narrationRef, narrationRef?.current]);

  const chooseTrack = (track: AmbientTrack) => {
    ambienceEngine.setTrack(ambienceEngine.track === track ? null : track);
  };

  const chooseSleep = (choice: SleepChoice) => {
    ambienceEngine.armSleep(ambienceEngine.sleepChoice === choice ? null : choice, onSleep);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Scripture ambience</p>
        {ambienceEngine.sleeping && <span className="text-[10px] text-slate-300">Fading to rest...</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TRACKS.map((track) => (
          <button
            key={track.id}
            type="button"
            onClick={() => chooseTrack(track.id)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 ${
              ambienceEngine.track === track.id ? 'bg-amber-600 text-white' : 'bg-white/5 text-slate-300'
            }`}
          >
            {track.icon}
            {track.label}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-[11px] text-slate-300">
        <Volume2 className="w-3.5 h-3.5 text-amber-300" />
        <span className="w-16">Voice</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={ambienceEngine.narrationVolume}
          onChange={(event) => ambienceEngine.setNarrationVolume(parseFloat(event.target.value))}
          className="flex-1 accent-amber-500"
        />
      </label>
      <label className="flex items-center gap-2 text-[11px] text-slate-300">
        <Music2 className="w-3.5 h-3.5 text-amber-300" />
        <span className="w-16">Ambience</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={ambienceEngine.ambientVolume}
          onChange={(event) => ambienceEngine.setAmbientVolume(parseFloat(event.target.value))}
          className="flex-1 accent-amber-500"
        />
      </label>
      <div className="flex flex-wrap items-center gap-1.5">
        <Moon className="w-3.5 h-3.5 text-slate-400" />
        {(['15', '30', '45', '60', 'chapter'] as SleepChoice[]).map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => chooseSleep(choice)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
              ambienceEngine.sleepChoice === choice ? 'bg-yellow-600 text-white' : 'bg-white/5 text-slate-300'
            }`}
          >
            {choice === 'chapter' ? 'End of chapter' : `${choice}m`}
          </button>
        ))}
      </div>
    </div>
  );
}
