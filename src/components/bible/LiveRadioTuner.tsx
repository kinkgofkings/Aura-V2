import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  Sparkles,
  RefreshCw,
  X,
  Music,
  BookOpen
} from 'lucide-react';

export interface RadioStation {
  id: 'refnet' | 'air1';
  name: string;
  shortName: string;
  tagline: string;
  streamUrl: string;
  fallbackStreamUrl: string;
  webUrl: string;
  genre: string;
  badge: string;
  badgeColor: string;
  accentGradient: string;
  defaultSpeaker: string;
  defaultTitle: string;
  ministry: string;
}

export const STATIONS: RadioStation[] = [
  {
    id: 'refnet',
    name: 'Renewing Your Mind (RefNet)',
    shortName: 'RefNet Radio',
    tagline: '24/7 Reformed Exposition & Bible Teaching',
    streamUrl: 'https://refnet.streamguys1.com/live',
    fallbackStreamUrl: 'https://listen.refnet.fm',
    webUrl: 'https://listen.refnet.fm',
    genre: 'Bible Exposition & Theology',
    badge: 'REFORMED TEACHING',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    accentGradient: 'from-amber-600 via-yellow-600 to-amber-700',
    defaultSpeaker: 'R.C. Sproul / Teaching Fellows',
    defaultTitle: 'Daily Bible Exposition & Sacred Broadcast',
    ministry: 'Ligonier Ministries'
  },
  {
    id: 'air1',
    name: 'Air1 Worship Radio',
    shortName: 'Air1 Worship',
    tagline: '24/7 Christian Worship Now & Contemporary Praise',
    streamUrl: 'https://maestro.emfcdn.com/stream_for/air1/airable/aac',
    fallbackStreamUrl: 'https://maestro.emfcdn.com/stream_for/air1/airable/mp3',
    webUrl: 'https://listen.air1.com',
    genre: 'Christian Worship Music',
    badge: 'WORSHIP NOW',
    badgeColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    accentGradient: 'from-sky-600 via-indigo-600 to-blue-700',
    defaultSpeaker: 'Elevation Worship, Tauren Wells, Brandon Lake, Phil Wickham',
    defaultTitle: 'Worship Now • Uplifting Christian Praise',
    ministry: 'Air1 Radio (Educational Media Foundation)'
  }
];

export interface RadioNowPlayingData {
  aura_media_engine: {
    engine_mode: 'LIVE_TUNER';
    station_id?: string;
    content_metadata: {
      author_name: string;
      church_or_ministry: string;
      sermon_series: string;
      title: string;
      media_source_type: string;
    };
    playback_transport: {
      stream_url: string;
      fallback_stream_url?: string;
      is_live_feed: boolean;
      validation_status: string;
    };
  };
}

interface LiveRadioTunerProps {
  variant?: 'banner' | 'card' | 'modal' | 'mini';
  isOpen?: boolean;
  onClose?: () => void;
}

export const LiveRadioTuner: React.FC<LiveRadioTunerProps> = ({
  variant = 'banner',
  isOpen = true,
  onClose
}) => {
  const [activeStationId, setActiveStationId] = useState<'refnet' | 'air1'>(() => {
    try {
      const saved = localStorage.getItem('aura_radio_station');
      if (saved === 'air1' || saved === 'refnet') return saved;
    } catch {}
    return 'refnet';
  });

  const [data, setData] = useState<RadioNowPlayingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeStation = STATIONS.find((s) => s.id === activeStationId) || STATIONS[0];

  const fetchNowPlaying = async (stId: 'refnet' | 'air1' = activeStationId) => {
    try {
      const res = await fetch(`/api/radio/now-playing?station=${stId}`);
      if (res.ok) {
        const json: RadioNowPlayingData = await res.json();
        setData(json);
      }
    } catch (e) {
      console.warn('Failed to fetch radio now playing metadata:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNowPlaying(activeStationId);
    const interval = setInterval(() => fetchNowPlaying(activeStationId), 40000);
    return () => clearInterval(interval);
  }, [activeStationId]);

  const handleSelectStation = (newId: 'refnet' | 'air1') => {
    if (newId === activeStationId) return;
    setActiveStationId(newId);
    try {
      localStorage.setItem('aura_radio_station', newId);
    } catch {}

    const targetStation = STATIONS.find((s) => s.id === newId) || STATIONS[0];

    if (audioRef.current) {
      const wasPlaying = isPlaying;
      audioRef.current.pause();
      audioRef.current.src = targetStation.streamUrl;
      audioRef.current.load();
      if (wasPlaying) {
        setIsBuffering(true);
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
          })
          .catch((err) => {
            console.warn('Switch station autoplay blocked:', err);
            setIsBuffering(false);
            setIsPlaying(false);
          });
      }
    }
    fetchNowPlaying(newId);
  };

  const handleTogglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(activeStation.streamUrl);
      audioRef.current.volume = volume;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsBuffering(false);
    } else {
      setIsBuffering(true);
      if (audioRef.current.src !== activeStation.streamUrl) {
        audioRef.current.src = activeStation.streamUrl;
      }
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
        })
        .catch((err) => {
          console.warn('Audio play notice (opening direct listener):', err);
          setIsBuffering(false);
          window.open(activeStation.webUrl, '_blank', 'noopener,noreferrer');
        });
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
    if (newVol > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const meta = data?.aura_media_engine.content_metadata || {
    author_name: activeStation.defaultSpeaker,
    church_or_ministry: activeStation.ministry,
    sermon_series: activeStation.tagline,
    title: activeStation.defaultTitle,
    media_source_type: `Live_${activeStation.id}_Stream`
  };

  // If modal variant and closed, do not render
  if (variant === 'modal' && !isOpen) return null;

  /* MODAL POPUP VIEW */
  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
        <div className="relative w-full max-w-lg bg-[#090b17] border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-500/20 overflow-hidden flex flex-col p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="text-xs font-black tracking-widest text-rose-400 uppercase">LIVE 24/7 BROADCAST</span>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* STATION TOGGLE BUTTONS (RefNet vs Air1) */}
          <div className="flex items-center p-1.5 rounded-2xl bg-black/60 border border-white/10 gap-1.5 justify-center">
            {STATIONS.map((st) => {
              const isSelected = activeStationId === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleSelectStation(st.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all flex-1 justify-center ${
                    isSelected
                      ? st.id === 'air1'
                        ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-500/30'
                        : 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {st.id === 'air1' ? <Music className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                  <span>{st.shortName}</span>
                </button>
              );
            })}
          </div>

          {/* Station Visual & Title */}
          <div className="flex flex-col items-center text-center space-y-3 py-1">
            <div className={`w-20 h-20 rounded-3xl bg-gradient-to-tr ${activeStation.accentGradient} p-0.5 shadow-xl flex items-center justify-center`}>
              <div className="w-full h-full rounded-[22px] bg-[#0c101d] flex items-center justify-center">
                <Radio className={`w-10 h-10 ${activeStationId === 'air1' ? 'text-sky-400' : 'text-amber-400'} ${isPlaying ? 'animate-pulse' : ''}`} />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-black text-white">{activeStation.name}</h3>
              <p className="text-xs text-slate-300 font-semibold">{activeStation.tagline}</p>
            </div>
          </div>

          {/* Current Broadcast Metadata */}
          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-1 text-center">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border inline-block mb-1 ${activeStation.badgeColor}`}>
              {activeStation.badge}
            </span>
            <p className="text-sm font-black text-white">{meta.title}</p>
            <p className="text-xs text-amber-300 font-medium">On-Air: {meta.author_name}</p>
            <p className="text-[11px] text-slate-400">{meta.church_or_ministry}</p>
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center gap-4 pt-1">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`px-8 py-3.5 rounded-2xl bg-gradient-to-r ${activeStation.accentGradient} text-white font-black text-sm flex items-center gap-2.5 shadow-xl transition-all active:scale-95`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5 fill-white" />
                  <span>Pause {activeStation.shortName}</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white" />
                  <span>{isBuffering ? 'Connecting...' : `Play ${activeStation.shortName} Live`}</span>
                </>
              )}
            </button>

            {/* Volume control */}
            <div className="flex items-center gap-2.5 w-full max-w-xs">
              <button type="button" onClick={toggleMute} className="text-slate-400 hover:text-white">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <a
              href={activeStation.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>Open official {activeStation.shortName} stream</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* FULL BANNER VIEW (PRIMARY DISPLAY IN PODCAST & PULPIT FEED) */
  return (
    <div className={`relative rounded-3xl overflow-hidden border ${activeStationId === 'air1' ? 'border-sky-500/35 bg-gradient-to-br from-[#071324] via-[#090d18] to-[#06080e]' : 'border-amber-500/35 bg-gradient-to-br from-[#120e06] via-[#090d18] to-[#06080e]'} p-5 sm:p-6 shadow-2xl space-y-4`}>
      {/* Glow highlight */}
      <div className={`absolute top-0 right-0 w-72 h-72 ${activeStationId === 'air1' ? 'bg-sky-500/10' : 'bg-amber-500/10'} rounded-full blur-3xl pointer-events-none`} />

      {/* Top Status & Station Selector Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-[10px] font-black tracking-widest text-rose-400 uppercase">
            LIVE 24/7 RADIO
          </span>
          <span className={`text-xs font-bold ${activeStationId === 'air1' ? 'text-sky-300' : 'text-amber-300'}`}>
            {activeStation.name}
          </span>
        </div>

        {/* Station Selector Pill Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md gap-1">
          {STATIONS.map((st) => {
            const isSelected = activeStationId === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => handleSelectStation(st.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-all ${
                  isSelected
                    ? st.id === 'air1'
                      ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-500/25'
                      : 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md shadow-amber-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={`Switch to ${st.name}`}
              >
                {st.id === 'air1' ? <Music className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                <span>{st.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Broadcast Content */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Station Avatar / Pulsing Equalizer */}
          <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr ${activeStation.accentGradient} p-[1.5px] shadow-lg shrink-0 flex items-center justify-center group`}>
            <div className="w-full h-full rounded-[14px] bg-[#070a14] flex items-center justify-center overflow-hidden relative">
              {isPlaying ? (
                <div className="flex items-end justify-center gap-1 h-6 w-6">
                  <span className={`w-1 ${activeStationId === 'air1' ? 'bg-sky-400' : 'bg-amber-400'} rounded-full animate-bounce [animation-delay:-0.3s] h-full`} />
                  <span className={`w-1 ${activeStationId === 'air1' ? 'bg-blue-400' : 'bg-yellow-400'} rounded-full animate-bounce [animation-delay:-0.15s] h-3/4`} />
                  <span className={`w-1 ${activeStationId === 'air1' ? 'bg-cyan-300' : 'bg-amber-300'} rounded-full animate-bounce h-5/6`} />
                </div>
              ) : (
                <Radio className={`w-7 h-7 ${activeStationId === 'air1' ? 'text-sky-400' : 'text-amber-400'}`} />
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${activeStation.badgeColor}`}>
                {activeStation.badge}
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                {meta.church_or_ministry || activeStation.ministry}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white truncate leading-snug">
              {meta.title}
            </h3>
            <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 truncate">
              <span>On-Air:</span>
              <span className={`font-bold ${activeStationId === 'air1' ? 'text-sky-300' : 'text-amber-300'}`}>{meta.author_name}</span>
            </p>
          </div>
        </div>

        {/* Action Button & Volume */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10">
            <button type="button" onClick={toggleMute} className="text-slate-400 hover:text-white">
              {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <button
            type="button"
            onClick={handleTogglePlay}
            className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${activeStation.accentGradient} text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>Pause {activeStation.shortName}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white ml-0.5" />
                <span>{isBuffering ? 'Connecting...' : `Play ${activeStation.shortName}`}</span>
              </>
            )}
          </button>

          <a
            href={activeStation.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
            title={`Open ${activeStation.name} Web Player`}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
