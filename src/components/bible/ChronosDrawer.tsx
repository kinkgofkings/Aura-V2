import React, { useEffect, useState } from 'react';
import { MapPinned, ScrollText } from 'lucide-react';
import type { ChronosContext } from '../../../services/chronosContext';
import { getChronosContext } from '../../../services/chronosContext';

function project(lat: number, lng: number) {
  const x = ((lng - 10) / 40) * 320;
  const y = ((42 - lat) / 22) * 180;
  return { x: Math.max(12, Math.min(308, x)), y: Math.max(12, Math.min(168, y)) };
}

export function ChronosDrawer({ book, chapter }: { book: string; chapter: string | number }) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<ChronosContext>(() => getChronosContext(book, Number(chapter) || 1));

  useEffect(() => {
    const local = getChronosContext(book, Number(chapter) || 1);
    setContext(local);
    const controller = new AbortController();
    fetch(`/api/bible/context/${encodeURIComponent(book)}/${encodeURIComponent(String(chapter || 1))}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.epoch) setContext(data);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [book, chapter]);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <span className="text-sm font-black text-white flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-amber-300" /> Chronos context
        </span>
        <span className="text-[11px] text-slate-400">{open ? 'Hide' : 'Open timeline and map'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4">
          <p className="text-xs text-amber-200">{context.epoch}</p>
          <div className="flex gap-2 overflow-x-auto">
            {context.timeline.map((mark) => (
              <span key={mark} className="shrink-0 px-2.5 py-1 rounded-full bg-amber-500/15 text-[11px] text-amber-100 border border-amber-500/20">
                {mark}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
            <p><span className="text-slate-500">Kings: </span>{context.kings.join(', ')}</p>
            <p><span className="text-slate-500">Prophets: </span>{context.prophets.join(', ')}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#07111f] p-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-1">
              <MapPinned className="w-3.5 h-3.5" /> Places in this passage’s world
            </div>
            <svg viewBox="0 0 320 180" className="w-full h-40">
              <rect width="320" height="180" fill="#0b1b2e" rx="12" />
              <path d="M20 120 C 80 90, 140 140, 210 100 S 300 80, 310 60" stroke="#1d4e68" fill="none" strokeWidth="10" />
              {context.locations.map((place) => {
                const point = project(place.lat, place.lng);
                return (
                  <g key={place.name}>
                    <circle cx={point.x} cy={point.y} r="4" fill="#f59e0b" />
                    <text x={point.x + 6} y={point.y + 3} fill="#f8fafc" fontSize="9">{place.name}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">{context.brief}</p>
          {context.wordStudy.map((word) => (
            <p key={word.term} className="text-xs text-slate-300">
              <span className="text-amber-200 font-bold">{word.term}</span> ({word.language}): {word.meaning}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
