import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  X,
  Music,
  BookOpen,
  Headphones,
  Signal,
  CheckCircle2
} from 'lucide-react';
import { soundEffects } from '../../services/audio';

export interface RadioStation {
  id: 'family_radio_live' | 'bott_radio_live' | 'bbn_live' | 'afr_talk_live' | 'air1';
  name: string;
  shortName: string;
  tagline: string;
  streamUrl: string;
  directStreamUrl: string;
  fallbackStreamUrl?: string;
  genre: string;
  badge: string;
  badgeColor: string;
  accentGradient: string;
  primaryContent: string[];
  defaultSpeaker: string;
  defaultTitle: string;
  ministry: string;
}

export const STATIONS: RadioStation[] = [
  {
    id: 'family_radio_live',
    name: 'Family Radio',
    shortName: 'Family Radio',
    tagline: 'Traditional Preaching, Hymns & Daily Renewing Your Mind',
    streamUrl: '/api/radio/stream/family_radio_live',
    directStreamUrl: 'https://ais-sa3.cdnstream1.com/2632_128.mp3',
    fallbackStreamUrl: 'https://live.mystreamplayer.com/wfme',
    genre: 'Traditional Preaching & Hymns',
    badge: 'FAMILY RADIO',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    accentGradient: 'from-amber-600 via-yellow-600 to-amber-700',
    primaryContent: ['Expository Preaching', 'Daily Renewing Your Mind Broadcast', 'Scripture Readings'],
    defaultSpeaker: 'Various Ministries / Dr. R.C. Sproul',
    defaultTitle: 'Family Radio Live Preaching',
    ministry: 'Family Radio Network'
  },
  {
    id: 'bott_radio_live',
    name: 'Bott Radio Network',
    shortName: 'Bott Radio',
    tagline: 'Quality Bible Teaching & Expository Preaching 24/7',
    streamUrl: '/api/radio/stream/bott_radio_live',
    directStreamUrl: 'https://streaming.live365.com/a71179_2',
    fallbackStreamUrl: 'https://bottradionetwork.com',
    genre: 'Bible Teaching & Preaching',
    badge: 'BIBLE TEACHING',
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    accentGradient: 'from-emerald-600 via-teal-600 to-emerald-700',
    primaryContent: ['Systematic Bible Study', 'Expository Sermons'],
    defaultSpeaker: 'Bott Radio Network Teachers',
    defaultTitle: 'Getting the Word of God Into You',
    ministry: 'Bott Radio Network'
  },
  {
    id: 'bbn_live',
    name: 'Bible Broadcasting Network',
    shortName: 'BBN Radio',
    genre: 'Conservative Preaching & Study',
    tagline: 'Traditional Sermons & Step-by-Step Biblical Commentary',
    streamUrl: '/api/radio/stream/bbn_live',
    directStreamUrl: 'https://streams.radiomast.io/844b0a81-f4b9-485e-adaa-aab8d3ea9f7f',
    fallbackStreamUrl: 'https://bbn1.bbnradio.org',
    badge: 'CONSERVATIVE EXPOSITION',
    badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    accentGradient: 'from-blue-600 via-indigo-600 to-blue-700',
    primaryContent: ['Traditional Sermons', 'Step-by-Step Commentary'],
    defaultSpeaker: 'BBN Ministries Pastors',
    defaultTitle: 'BBN Live Broadcast',
    ministry: 'Bible Broadcasting Network'
  },
  {
    id: 'afr_talk_live',
    name: 'American Family Radio',
    shortName: 'AFR Talk',
    genre: 'Christian Talk & Biblical Worldview',
    tagline: 'Cultural Commentary, Christian Worldview & Preaching',
    streamUrl: '/api/radio/stream/afr_talk_live',
    directStreamUrl: 'https://mediaserver3.afa.net:8443/talk.mp3',
    fallbackStreamUrl: 'https://mediaserver3.afa.net:8443/music.mp3',
    badge: 'BIBLICAL WORLDVIEW',
    badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    accentGradient: 'from-rose-600 via-red-600 to-rose-700',
    primaryContent: ['Cultural Commentary', 'Evangelical Sermons'],
    defaultSpeaker: 'AFR Talk Hosts & Evangelists',
    defaultTitle: 'AFR Live Talk & Preaching',
    ministry: 'American Family Association'
  },
  {
    id: 'air1',
    name: 'Air1 Worship Radio',
    shortName: 'Air1 Worship',
    tagline: '24/7 Christian Worship Now & Uplifting Praise Anthems',
    streamUrl: '/api/radio/stream/air1',
    directStreamUrl: 'https://maestro.emfcdn.com/stream_for/air1/airable/aac',
    fallbackStreamUrl: 'https://maestro.emfcdn.com/stream_for/air1/airable/mp3',
    genre: 'Christian Worship Music',
    badge: 'WORSHIP NOW',
    badgeColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    accentGradient: 'from-sky-600 via-cyan-600 to-blue-700',
    primaryContent: ['Contemporary Christian Worship', 'Praise Anthems'],
    defaultSpeaker: 'Brandon Lake, Elevation Worship, Phil Wickham',
    defaultTitle: 'Worship Now • Uplifting Christian Praise',
    ministry: 'Air1 Radio (Educational Media Foundation)'
  }
];

export interface RadioNowPlayingData {
  aura_media_engine: {
    engine_mode: 'LIVE_TUNER';
    station_id: string;
    content_metadata: {
      author_name: string;
      church_or_ministry: string;
      sermon_series: string;
      title: string;
      media_source_type: string;
    };
    playback_transport: {
      stream_url: string;
      direct_stream_url?: string;
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
  const [activeStationId, setActiveStationId] = useState<RadioStation['id']>(() => {
    try {
      const saved = localStorage.getItem('aura_active_radio_station') as RadioStation['id'];
      if (saved && STATIONS.some((s) => s.id === saved)) return saved;
    } catch {}
    return 'family_radio_live';
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [nowPlayingMeta, setNowPlayingMeta] = useState<Record<string, { title: string; author: string; ministry: string }>>({});
  const [fetchError, setFetchError] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeStation = STATIONS.find((s) => s.id === activeStationId) || STATIONS[0];

  // Fetch real-time metadata for active station
  const fetchNowPlaying = async (stationId = activeStationId) => {
    try {
      const res = await fetch(`/api/radio/now-playing?station=${encodeURIComponent(stationId)}`);
      if (res.ok) {
        const json: RadioNowPlayingData = await res.json();
        const meta = json.aura_media_engine.content_metadata;
        setNowPlayingMeta((prev) => ({
          ...prev,
          [stationId]: {
            title: meta.title,
            author: meta.author_name,
            ministry: meta.church_or_ministry
          }
        }));
        setFetchError(false);
      }
    } catch (e) {
      setFetchError(true);
    }
  };

  useEffect(() => {
    fetchNowPlaying(activeStationId);
    const interval = setInterval(() => {
      fetchNowPlaying(activeStationId);
    }, 25000);
    return () => clearInterval(interval);
  }, [activeStationId]);

  // Audio lifecycle
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audio.volume = volume;
    audioRef.current = audio;

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      console.warn('Radio audio error, attempting direct stream fallback');
      setIsBuffering(false);
      // Fallback directly to directStreamUrl inside the app (never redirect to external site!)
      if (audioRef.current && audioRef.current.src !== activeStation.directStreamUrl) {
        audioRef.current.src = activeStation.directStreamUrl;
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  const handleSelectStation = (newId: RadioStation['id']) => {
    if (newId === activeStationId) return;
    soundEffects.playTap();
    const wasPlaying = isPlaying;
    setActiveStationId(newId);
    try {
      localStorage.setItem('aura_active_radio_station', newId);
    } catch {}

    const targetStation = STATIONS.find((s) => s.id === newId) || STATIONS[0];
    if (audioRef.current) {
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
            console.warn('Switch station play fallback:', err);
            if (audioRef.current) {
              audioRef.current.src = targetStation.directStreamUrl;
              audioRef.current.play().catch(() => {});
            }
          });
      }
    }
    fetchNowPlaying(newId);
  };

  const handleTogglePlay = () => {
    soundEffects.playTap();
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
      if (!audioRef.current.src || audioRef.current.src.endsWith('/')) {
        audioRef.current.src = activeStation.streamUrl;
      }
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
        })
        .catch((err) => {
          console.warn('Direct stream fallback on error:', err);
          // Never redirect externally! Play direct stream URL inside the app
          if (audioRef.current) {
            audioRef.current.src = activeStation.directStreamUrl;
            audioRef.current.play()
              .then(() => {
                setIsPlaying(true);
                setIsBuffering(false);
              })
              .catch(() => {
                setIsBuffering(false);
                setIsPlaying(false);
              });
          }
        });
    }
  };

  const toggleMute = () => {
    soundEffects.playTap();
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

  const currentMeta = nowPlayingMeta[activeStation.id] || {
    title: activeStation.defaultTitle,
    author: activeStation.defaultSpeaker,
    ministry: activeStation.ministry
  };

  if (variant === 'modal' && !isOpen) return null;

  /* MODAL VIEW */
  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
        <div className="relative w-full max-w-xl bg-[#090b17] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>Christian Teaching & Talk Radio</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Live In-App
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select from 5 verified live streams. Plays directly inside Aura.
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Main Tuner Body */}
          <div className="p-5 overflow-y-auto space-y-4">
            {/* Active Station Card & Player Controls */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-black/40 to-slate-900/60 border border-amber-500/30 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${activeStation.badgeColor}`}>
                    {activeStation.badge}
                  </span>
                  <h4 className="text-lg font-black text-white mt-1.5">{activeStation.name}</h4>
                  <p className="text-xs text-slate-300">{activeStation.tagline}</p>
                </div>

                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all shrink-0 active:scale-95"
                >
                  {isBuffering ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-4 h-4 fill-slate-950" />
                  ) : (
                    <Play className="w-4 h-4 fill-slate-950" />
                  )}
                  <span>{isBuffering ? 'Buffering...' : isPlaying ? 'Pause Live' : 'Play Live Now'}</span>
                </button>
              </div>

              {/* Dynamic Metadata Panel */}
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Signal className="w-3 h-3 animate-pulse" />
                  <span>Now Playing:</span>
                </div>
                <div className="text-xs font-bold text-white truncate">{currentMeta.title}</div>
                <div className="text-[11px] text-slate-300 flex items-center gap-1.5 truncate">
                  <span className="font-semibold text-amber-300">{currentMeta.author}</span>
                  <span>•</span>
                  <span className="text-slate-400">{currentMeta.ministry}</span>
                </div>
              </div>
            </div>

            {/* Station Selector List */}
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
                Available Christian Broadcast Stations
              </div>
              <div className="grid grid-cols-1 gap-2">
                {STATIONS.map((station) => {
                  const isCurrent = station.id === activeStationId;
                  return (
                    <button
                      key={station.id}
                      type="button"
                      onClick={() => handleSelectStation(station.id)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                          : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.07] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          isCurrent ? 'bg-amber-500 text-slate-950' : 'bg-white/10 text-slate-400'
                        }`}>
                          <Radio className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs truncate">{station.name}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase ${station.badgeColor}`}>
                              {station.genre}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {station.primaryContent.join(' • ')}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isCurrent && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-amber-400">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Selected</span>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* BANNER / EMBEDDED VIEW (inside PodcastFeed) */
  return (
    <div className="rounded-3xl bg-gradient-to-b from-[#0e1224] to-[#070914] border border-amber-500/30 p-4 sm:p-5 shadow-xl shadow-amber-500/5 space-y-4">
      {/* Top Header & Tuner Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                Live Christian Broadcast Radio
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Live In-App Stream
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              5 Major Christian Stations • Direct In-App Audio • Pure Stream (No Ads / No Redirects)
            </p>
          </div>
        </div>

        {/* Master Play Live Now Button */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 shrink-0"
          >
            {isBuffering ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-slate-950" />
            ) : (
              <Play className="w-4 h-4 fill-slate-950" />
            )}
            <span>{isBuffering ? 'Tuning In...' : isPlaying ? 'Pause Live' : 'Play Live Now'}</span>
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Station Selector Grid (Horizontal / Multi-tab) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {STATIONS.map((station) => {
          const isSelected = station.id === activeStationId;
          return (
            <button
              key={station.id}
              type="button"
              onClick={() => handleSelectStation(station.id)}
              className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                  : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider ${station.badgeColor}`}>
                  {station.badge}
                </span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </div>
              <div className="font-black text-xs truncate text-white">{station.shortName}</div>
              <div className="text-[9px] text-slate-400 truncate mt-0.5">{station.genre}</div>
            </button>
          );
        })}
      </div>

      {/* Dynamic Metadata Panel */}
      <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400 mb-0.5">
            <Signal className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>Now Playing on {activeStation.name}:</span>
          </div>
          <div className="font-bold text-white text-sm truncate">{currentMeta.title}</div>
          <div className="text-[11px] text-slate-300 flex items-center gap-2 truncate mt-0.5">
            <span className="font-semibold text-amber-300">{currentMeta.author}</span>
            <span>•</span>
            <span className="text-slate-400">{currentMeta.ministry}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-slate-400 font-mono">
            {isPlaying ? '● LIVE STREAMING' : '○ READY TO TUNE'}
          </span>
          <button
            type="button"
            onClick={() => fetchNowPlaying(activeStation.id)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Refresh current track metadata"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
