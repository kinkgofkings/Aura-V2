import React, { useState, useEffect, useRef, useMemo } from "react";
import { X,
  Play,
  Pause,
  Headphones,
  Video,
  Search,
  BookOpen,
  Sparkles,
  LayoutGrid,
  List,
  Clock,
  User,
  Volume2,
  ExternalLink,
  Flame,
  Radio,
  FolderPlus,
  Tv,
  Film,
  Layers,
  ChevronRight,
  Share2,
  RotateCcw
} from "lucide-react";
import { getSermonCoverImage, getFallbackSpiritualCover } from "../../utils/sermonCovers";
import { soundEffects } from "../../services/audio";
import { compareSermonLibrary, isWorshipGathering, sermonMatchesQuery } from "../../../services/lighthouseCatalog";

export interface SermonItem {
  id: string;
  title: string;
  speaker: string;
  speakerSlug?: string;
  speakerTitle?: string;
  speakerImage?: string;
  channel?: string;
  series?: string;
  seriesPart?: number;
  scriptureRef?: string;
  description?: string;
  summary?: string;
  duration?: string;
  format: "audio" | "video";
  source: "community" | "sermonindex";
  mediaUrl?: string;
  mp3Url?: string;
  mp4Url?: string;
  youtubeId?: string;
  thumbnailUrl?: string;
  views?: number;
  publishedAt?: string;
  date?: string;
  topics?: { slug: string; name: string }[];
}

const FALLBACK_COVERS = [
  "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&auto=format&fit=crop&q=80"
];

export function PodcastFeed({
  onStudyPassage,
}: {
  onStudyPassage?: (scriptureRef: string) => void;
}) {
  const [sermons, setSermons] = useState<SermonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formatFilter, setFormatFilter] = useState<"all" | "audio" | "video">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "community" | "sermonindex" | "stories">("all");
  const [worshipOnly, setWorshipOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const [activeItem, setActiveItem] = useState<SermonItem | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<SermonItem | null>(null);
  const [isPlayingModalVideo, setIsPlayingModalVideo] = useState(false);
  const [syncingLbc, setSyncingLbc] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [activePlayingVideo, setActivePlayingVideo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Channels & Series state
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [selectedSeries, setSelectedSeries] = useState<string>("all");
  const [activeSeriesContainer, setActiveSeriesContainer] = useState<string | null>(null);

  const [highlightedSermonId, setHighlightedSermonId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('aura_target_sermon_id') || sessionStorage.getItem('aura_target_sermon_id');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleOpenSermon = (e: Event) => {
      const custom = e as CustomEvent<{ sermonId?: string; videoId?: string; sermon?: SermonItem; series?: string }>;
      if (custom.detail?.series) {
        setSelectedSeries(custom.detail.series);
        setActiveSeriesContainer(custom.detail.series);
      }
      const targetSermon = custom.detail?.sermon || sermons.find(s => s.id === custom.detail?.sermonId);
      const targetId = custom.detail?.sermonId || targetSermon?.id;

      if (targetSermon) {
        if (targetSermon.format === "video") {
          setSelectedVideo(targetSermon);
        } else {
          handlePlayAudio(targetSermon);
        }
      }

      if (targetId) {
        setHighlightedSermonId(targetId);
        setTimeout(() => {
          const el = document.getElementById(`sermon-card-${targetId}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);

        setTimeout(() => {
          setHighlightedSermonId(prev => (prev === targetId ? null : prev));
          try {
            localStorage.removeItem('aura_target_sermon_id');
            sessionStorage.removeItem('aura_target_sermon_id');
          } catch {}
        }, 7000);
      }
    };
    window.addEventListener("open_sermon", handleOpenSermon);
    return () => window.removeEventListener("open_sermon", handleOpenSermon);
  }, [sermons]);

  useEffect(() => {
    if (highlightedSermonId && sermons.length > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`sermon-card-${highlightedSermonId}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 250);

      const clearTimer = setTimeout(() => {
        setHighlightedSermonId(null);
        try {
          localStorage.removeItem('aura_target_sermon_id');
          sessionStorage.removeItem('aura_target_sermon_id');
        } catch {}
      }, 7000);

      return () => {
        clearTimeout(timer);
        clearTimeout(clearTimer);
      };
    }
  }, [highlightedSermonId, sermons]);

  const fetchAllSermons = async () => {
    setLoading(true);
    let combined: SermonItem[] = [];

    // 1. Fetch SermonIndex Feed
    try {
      const resSI = await fetch("/api/bible/sermonindex/feed");
      const cType = resSI.headers.get("content-type") || "";
      if (resSI.ok && cType.includes("application/json")) {
        const siData = await resSI.json();
        const normalizedSI = (Array.isArray(siData) ? siData : []).map((item: any) => {
          const isVideo = item.mediaType === "video" || !!item.mp4Url || (!!item.youtubeId && !item.mp3Url);
          const audioStream = item.mp3Url || item.cdnMp3Url || (isVideo ? "" : item.mediaUrl);
          const videoStream = item.mp4Url || (isVideo ? item.mediaUrl : "");
          return {
            ...item,
            channel: item.channel || "SermonIndex Global",
            series: item.series || (item.title && item.title.includes(" - ") ? item.title.split(" - ")[0].trim() : undefined),
            seriesPart: item.seriesPart,
            format: isVideo ? "video" : "audio",
            mediaUrl: isVideo ? videoStream : audioStream,
            mp3Url: audioStream,
            mp4Url: videoStream,
            source: "sermonindex" as const,
          };
        });
        combined = [...combined, ...normalizedSI];
      }
    } catch (e) {
      console.warn("Could not fetch SermonIndex feed:", e);
    }

    // 2. Fetch Community Podcasts (Safely check for JSON)
    try {
      const resComm = await fetch("/api/bible/community/sermons");
      const cType = resComm.headers.get("content-type") || "";
      if (resComm.ok && cType.includes("application/json")) {
        const commData = await resComm.json();
        const normalizedComm = (Array.isArray(commData) ? commData : []).map((item: any) => ({
          ...item,
          channel: item.channel || item.speaker || "Community Pulpit",
          series: item.series,
          seriesPart: item.seriesPart,
          format: item.format || (item.youtubeId ? "video" : "audio"),
          source: "community" as const,
        }));
        combined = [...combined, ...normalizedComm];
      }
    } catch (e) {
      console.warn("Could not fetch community sermons:", e);
    }

    // 3. Fetch Manually Uploaded Studio Sermons & Podcasts (SQLite database)
    try {
      const resStudio = await fetch("/api/bible/sermons");
      const cType = resStudio.headers.get("content-type") || "";
      if (resStudio.ok && cType.includes("application/json")) {
        const studioData = await resStudio.json();
        const normalizedStudio = (Array.isArray(studioData) ? studioData : []).map((item: any) => {
          const ytMatch = (item.mediaUrl || "").match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
          const youtubeId = item.youtubeId || (ytMatch ? ytMatch[1] : (item.id && item.id.startsWith("yt-") ? item.id.replace("yt-", "") : undefined));
          const isVideo = item.mediaType === "video" || Boolean(youtubeId) || (!!item.mediaUrl && !item.mediaUrl.match(/\.(mp3|m4a|wav)$/i));
          return {
            id: item.id,
            title: item.title,
            speaker: item.speaker || "Community Speaker",
            channel: item.channel || item.speaker || "Aura Community Studio",
            series: item.series,
            seriesPart: item.seriesPart,
            scriptureRef: item.scriptureRef,
            summary: item.description,
            format: (isVideo ? "video" : "audio") as "video" | "audio",
            youtubeId,
            mediaUrl: item.mediaUrl,
            mp3Url: isVideo ? undefined : item.mediaUrl,
            mp4Url: isVideo && !youtubeId ? item.mediaUrl : undefined,
            thumbnailUrl: item.thumbnailUrl || (youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : undefined),
            duration: item.duration ? `${Math.floor(item.duration / 60)}:${String(item.duration % 60).padStart(2, '0')}` : undefined,
            date: item.dateRecorded || item.createdAt,
            source: "community" as const,
          };
        });
        combined = [...normalizedStudio, ...combined];
      }
    } catch (e) {
      console.warn("Could not fetch studio manual sermons:", e);
    }
    
    try {
      const targetDataStr = sessionStorage.getItem('aura_target_sermon_data');
      if (targetDataStr) {
        const targetData = JSON.parse(targetDataStr);
        if (targetData && targetData.id && !combined.some(s => s.id === targetData.id)) {
          combined = [targetData, ...combined];
        }
      }
    } catch {}

    // Deduplicate all combined sermons by normalized ID / YouTube ID
    const seen = new Set<string>();
    const deduplicated: SermonItem[] = [];
    for (const item of combined) {
      const key = item.youtubeId ? `yt-${item.youtubeId}` : item.id;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(item);
      }
    }

    setSermons(deduplicated);
    setLoading(false);
  };

  const handleSyncLbc = async () => {
    setSyncingLbc(true);
    setSyncSuccessMsg(null);
    try {
      soundEffects.playTap();
      const res = await fetch('/api/bible/sync/lighthouse', { method: 'POST' });
      const data = await res.json();
      await fetchAllSermons();
      setSyncSuccessMsg(`Synced! Total church archive: ${data.totalNow || 84} sermons.`);
      setTimeout(() => setSyncSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Error syncing Lighthouse sermons:', err);
    } finally {
      setSyncingLbc(false);
    }
  };

  const handleOpenVideoModal = (sermon: SermonItem) => {
    soundEffects.playTap();
    setSelectedVideo(sermon);
    setIsPlayingModalVideo(false);
  };

  useEffect(() => {
    fetchAllSermons();
  }, []);

  const handlePlayAudio = (item: SermonItem) => {
    if (activeItem?.id === item.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    setActiveItem(item);
    setIsPlaying(true);
    if (audioRef.current && item.mediaUrl) {
      audioRef.current.src = item.mediaUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true)).catch((err) => {
        console.warn("Audio playback error:", err);
        setIsPlaying(false);
      });
    }
  };

  // Channels and series available for the current format
  const availableChannels = useMemo(() => {
    const set = new Set<string>();
    sermons
      .filter((s) => formatFilter === "all" || s.format === formatFilter)
      .forEach((s) => {
        if (s.channel && s.channel.trim()) set.add(s.channel.trim());
        else if (s.speaker && s.speaker.trim()) set.add(s.speaker.trim());
      });
    const list = Array.from(set);
    list.sort((a, b) => {
      if (a.toLowerCase().includes("lighthouse")) return -1;
      if (b.toLowerCase().includes("lighthouse")) return 1;
      if (a.toLowerCase().includes("reformers") || a.toLowerCase().includes("ru recovery")) return -1;
      if (b.toLowerCase().includes("reformers") || b.toLowerCase().includes("ru recovery")) return 1;
      return a.localeCompare(b);
    });
    return list;
  }, [sermons, formatFilter]);

  const availableSeries = useMemo(() => {
    const map = new Map<string, number>();
    sermons
      .filter((s) => (formatFilter === "all" || s.format === formatFilter) && s.series)
      .forEach((s) => {
        const ser = s.series!.trim();
        map.set(ser, (map.get(ser) || 0) + 1);
      });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [sermons, formatFilter]);

  const filtered = useMemo(() => {
    const matches = sermons.filter((item) => {
    if (formatFilter !== "all" && item.format !== formatFilter) return false;
    if (worshipOnly && !isWorshipGathering(item)) return false;
    if (sourceFilter === "stories") {
      const isStory = 
        item.title?.toLowerCase().includes("audio story") || 
        item.title?.toLowerCase().includes("story:") ||
        item.topics?.some((t) => t.slug === "audio-stories" || t.name.toLowerCase().includes("story"));
      if (!isStory) return false;
    } else if (sourceFilter !== "all" && item.source !== sourceFilter) {
      return false;
    }

    // Channel filter (with support for Lighthouse Baptist Church and RU Recovery)
    if (selectedChannel !== "all") {
      const qCh = selectedChannel.toLowerCase();
      const itemCh = (item.channel || "").toLowerCase();
      const itemSpk = (item.speaker || "").toLowerCase();
      const isRuMatch = 
        (qCh.includes("ru recovery") || qCh.includes("reformers")) && 
        (itemCh.includes("ru recovery") || itemCh.includes("reformers") || itemSpk.includes("reformers"));
      const isLbcMatch =
        (qCh.includes("lighthouse") || qCh.includes("shope")) &&
        (itemCh.includes("lighthouse") || itemSpk.includes("shope") || itemSpk.includes("lighthouse"));

      const matchCh = isRuMatch || isLbcMatch || itemCh === qCh || itemCh.includes(qCh) || itemSpk.includes(qCh);
      if (!matchCh) return false;
    }

    // Series filter
    if (selectedSeries !== "all") {
      if (!item.series || item.series.toLowerCase() !== selectedSeries.toLowerCase()) {
        return false;
      }
    }

    if (searchQuery.trim() && !sermonMatchesQuery(item, searchQuery)) return false;
    return true;
  });
    return matches.sort((a, b) => compareSermonLibrary(a, b));
  }, [sermons, formatFilter, sourceFilter, worshipOnly, selectedChannel, selectedSeries, searchQuery]);

  const handleShareSermon = (sermon: SermonItem) => {
    soundEffects.playTap();
    window.dispatchEvent(
      new CustomEvent('open_create_post', {
        detail: {
          content: `🎙️ Check out this sermon: "${sermon.title}" by ${sermon.speaker}${sermon.scriptureRef ? ` (${sermon.scriptureRef})` : ''} in the Sanctuary Pulpit!\n\n#Sermon #SanctuaryWord #${(sermon.channel || 'Pulpit').replace(/[^a-zA-Z0-9]/g, '')}`,
          tags: 'Sermon,SanctuaryWord'
        }
      })
    );
  };

  // Sermons inside the selected series container, sorted by part number
  const seriesContainerItems = useMemo(() => {
    if (selectedSeries === "all") return [];
    return sermons
      .filter((s) => s.series?.toLowerCase() === selectedSeries.toLowerCase())
      .sort((a, b) => (a.seriesPart || 999) - (b.seriesPart || 999));
  }, [sermons, selectedSeries]);

  return (
    <div className="space-y-6 pb-28">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* HERO SECTION WITH DYNAMIC GRAPHIC & EMBEDDED SWITCHER */}
      <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-[#0a0d14]">
        <div className="absolute inset-0 opacity-40 mix-blend-luminosity">
          <img
            src="https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1600&auto=format&fit=crop&q=80"
            alt="Pulpit Worship Atmosphere"
            className="w-full h-full object-cover object-center filter blur-[1px] transform scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/70 to-transparent" />
        <div className="absolute inset-0 bg-radial-vignette opacity-70" />

        <div className="relative px-6 pt-10 pb-8 sm:px-10 sm:pt-14 sm:pb-10 flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md text-[11px] font-bold text-amber-400 uppercase tracking-widest">
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>Pulpit & Expository Library</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
            Listen & Watch The Word
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Stream verified historical expositions, modern pulpit teachings, and community sermons across audio and video.
          </p>

          {/* DYNAMIC HERO SEGMENTED SWITCHER */}
          <div className="pt-3">
            <div className="inline-flex p-1.5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-2xl gap-1">
              <button
                type="button"
                onClick={() => setFormatFilter("all")}
                className={"flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all " + (formatFilter === "all" ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-500/30 scale-[1.02]" : "text-slate-400 hover:text-white")}
              >
                <Layers className="w-4 h-4" />
                <span>All Formats</span>
              </button>
              <button
                type="button"
                onClick={() => setFormatFilter("audio")}
                className={"flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all " + (formatFilter === "audio" ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-500/30 scale-[1.02]" : "text-slate-400 hover:text-white")}
              >
                <Headphones className="w-4 h-4" />
                <span>Audio Sermons</span>
              </button>
              <button
                type="button"
                onClick={() => setFormatFilter("video")}
                className={"flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all " + (formatFilter === "video" ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-500/30 scale-[1.02]" : "text-slate-400 hover:text-white")}
              >
                <Video className="w-4 h-4" />
                <span>Video Sermons</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER, SEARCH & VIEW MODE BAR */}
      <div className="space-y-2.5">
        <div className="sticky top-2 z-10 bg-[#0a0d14]/90 backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Source Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-0.5">
            <button
              type="button"
              onClick={() => {
                setWorshipOnly(false);
                setSourceFilter("all");
              }}
              className={"px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap " + (sourceFilter === "all" && !worshipOnly ? "bg-white/15 text-white shadow border border-white/20" : "text-slate-400 hover:text-white")}
            >
              All Sources
            </button>
            <button
              type="button"
              onClick={() => {
                setWorshipOnly(false);
                setSourceFilter("community");
              }}
              className={"px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap " + (sourceFilter === "community" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white")}
            >
              Community
            </button>
            <button
              type="button"
              onClick={() => {
                setWorshipOnly(false);
                setSourceFilter("sermonindex");
              }}
              className={"px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 " + (sourceFilter === "sermonindex" ? "bg-yellow-600 text-white shadow" : "text-slate-400 hover:text-white")}
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>SermonIndex</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setWorshipOnly(false);
                setSourceFilter("stories");
                setFormatFilter("audio");
              }}
              className={"px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 " + (sourceFilter === "stories" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white")}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-200" />
              <span>Audio Stories</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setWorshipOnly(true);
                setSourceFilter("all");
                setSelectedChannel("all");
                setSelectedSeries("all");
              }}
              className={"px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap " + (worshipOnly ? "bg-sky-600 text-white shadow" : "text-slate-400 hover:text-white")}
            >
              Sunday & Wednesday
            </button>
          </div>

          {/* Search & Grid/List Switcher */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search speaker, passage, title, channel..."
                className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 flex-shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={"p-1.5 rounded-lg transition-all " + (viewMode === "grid" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white")}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={"p-1.5 rounded-lg transition-all " + (viewMode === "list" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white")}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* CHANNELS ROW */}
        {availableChannels.length > 0 && (
          <div className="bg-[#0b0f19]/80 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400 flex-shrink-0 pr-2 border-r border-white/10">
              <Tv className="w-3.5 h-3.5 text-amber-400" />
              <span>Channels:</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedChannel("all")}
              className={"px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 " + (selectedChannel === "all" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white bg-white/5")}
            >
              All Channels
            </button>
            {availableChannels.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setSelectedChannel(ch)}
                className={"px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 " + (selectedChannel === ch ? "bg-amber-600 text-white shadow" : "text-slate-300 hover:text-white bg-white/5 hover:bg-white/10")}
              >
                {ch}
              </button>
            ))}
            <button
              type="button"
              onClick={handleSyncLbc}
              disabled={syncingLbc}
              className="ml-auto px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 flex-shrink-0 disabled:opacity-50"
              title="Sweep YouTube for all Lighthouse Baptist Church sermons (@lighthousewinc)"
            >
              <RotateCcw className={`w-3 h-3 ${syncingLbc ? 'animate-spin' : ''}`} />
              <span>{syncingLbc ? 'Sweeping LBC Channel...' : 'Sync LBC Sermons'}</span>
            </button>
          </div>
        )}

        {syncSuccessMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{syncSuccessMsg}</span>
          </div>
        )}

        {/* SERIES CONTAINERS ROW */}
        {availableSeries.length > 0 && (
          <div className="bg-[#0b0f19]/80 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400 flex-shrink-0 pr-2 border-r border-white/10">
              <Layers className="w-3.5 h-3.5 text-yellow-400" />
              <span>Series:</span>
            </div>
            <button
              type="button"
              onClick={() => { setSelectedSeries("all"); setActiveSeriesContainer(null); }}
              className={"px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 " + (selectedSeries === "all" ? "bg-yellow-600 text-white shadow" : "text-slate-400 hover:text-white bg-white/5")}
            >
              All Series
            </button>
            {availableSeries.map(([ser, count]) => (
              <button
                key={ser}
                type="button"
                onClick={() => { setSelectedSeries(ser); setActiveSeriesContainer(ser); }}
                className={"px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 " + (selectedSeries === ser ? "bg-yellow-600 text-white shadow" : "text-slate-300 hover:text-white bg-white/5 hover:bg-white/10")}
              >
                <span>{ser}</span>
                <span className={"text-[10px] px-1.5 py-0.2 rounded-full " + (selectedSeries === ser ? "bg-white/20 text-white" : "bg-white/10 text-slate-400")}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ACTIVE SERIES CONTAINER SPOTLIGHT */}
      {selectedSeries !== "all" && (
        <div className="rounded-3xl p-5 bg-gradient-to-r from-yellow-950/70 via-slate-900 to-amber-950/70 border border-yellow-500/30 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-[11px] font-black uppercase tracking-wider border border-yellow-400/20">
                <Layers className="w-3.5 h-3.5 text-yellow-400" />
                <span>Connected Series Container • {seriesContainerItems.length} Sermon{seriesContainerItems.length > 1 ? "s" : ""}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{selectedSeries}</h2>
              {seriesContainerItems[0]?.channel && (
                <p className="text-xs text-slate-300 flex items-center gap-2">
                  <span className="text-slate-400">Channel:</span>
                  <span className="font-semibold text-white bg-white/10 px-2 py-0.5 rounded-md">{seriesContainerItems[0].channel}</span>
                  {seriesContainerItems[0]?.speaker && <span className="text-slate-400">• {seriesContainerItems[0].speaker}</span>}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setSelectedSeries("all"); setActiveSeriesContainer(null); }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all self-start sm:self-auto flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Back to All Series</span>
            </button>
          </div>

          {/* Container Playlist of connected parts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {seriesContainerItems.map((item, partIdx) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.format === "video") handleOpenVideoModal(item);
                  else handlePlayAudio(item);
                }}
                className="cursor-pointer bg-black/50 hover:bg-yellow-950/50 border border-white/10 hover:border-yellow-500/40 rounded-2xl p-3 transition-all flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-yellow-600/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400 flex-shrink-0 group-hover:bg-yellow-600 group-hover:text-white transition-colors">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black text-yellow-400 uppercase tracking-wider block">
                    Part {item.seriesPart || partIdx + 1}
                  </span>
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-yellow-300">{item.title}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{item.duration || "Full Exposition"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FEED CONTENT */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 tracking-wider font-semibold uppercase">Streaming Sermon Library...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-12 text-center space-y-2">
          <p className="text-base font-bold text-white">No sermons found matching this filter</p>
          <p className="text-xs text-slate-400">
            {worshipOnly
              ? "No Sunday or Wednesday gatherings are in the library yet. Use Sync LBC Sermons to pull the latest Lighthouse services."
              : "Try changing your search term, switching format, or selecting All Sources."}
          </p>
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-3"}>
          {filtered.map((sermon, idx) => {
            const cover = getSermonCoverImage(sermon, idx);
            const isCurrent = activeItem?.id === sermon.id;
            const isTargeted = highlightedSermonId === sermon.id;

            if (sermon.format === "video") {
              return (
                <div
                  key={sermon.id}
                  id={`sermon-card-${sermon.id}`}
                  onClick={() => handleOpenVideoModal(sermon)}
                  className={`cursor-pointer bg-slate-900/70 backdrop-blur-md border rounded-3xl overflow-hidden shadow-xl transition-all duration-500 flex flex-col justify-between group relative ${
                    isTargeted
                      ? "ring-2 ring-amber-400 border-amber-400 shadow-[0_0_35px_rgba(59,130,246,0.45)] scale-[1.01]"
                      : "border-white/10 hover:border-amber-500/50"
                  }`}
                >
                  {isTargeted && (
                    <div className="bg-amber-600/40 border-b border-amber-500/50 px-4 py-2 flex items-center justify-between text-xs font-bold text-amber-200 animate-fade-in">
                      <span className="flex items-center gap-1.5 animate-pulse">
                        <span>🎯 Targeted Sermon Exposition</span>
                      </span>
                      <span className="text-[10px] text-amber-300 font-mono">From Feed Shortcut</span>
                    </div>
                  )}
                  <div>
                    <div className="relative w-full aspect-video bg-black overflow-hidden">
                      <img
                        src={cover}
                        alt={sermon.title}
                        loading="eager"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
                        onError={(e) => {
                          const fallback = getFallbackSpiritualCover(sermon, idx);
                          if (e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-black/20 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-amber-600/90 text-white flex items-center justify-center shadow-lg shadow-amber-500/50 group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 fill-white ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-white border border-white/10 flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-amber-400" />
                        <span>Tap to Watch</span>
                      </div>
                    </div>

                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className={"text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md " + (sermon.source === "sermonindex" ? "bg-yellow-600/90 text-white" : "bg-emerald-600/90 text-white")}>
                          {sermon.source === "sermonindex" ? "Historical Archive" : "Community"}
                        </span>
                        {sermon.duration && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {sermon.duration}
                          </span>
                        )}
                      </div>

                      <h3 className="font-black text-white text-base leading-snug line-clamp-2 group-hover:text-amber-400 transition-colors">
                        {sermon.title}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-semibold text-white">{sermon.speaker}</span>
                        {sermon.speakerTitle && <span className="text-slate-500 font-normal">• {sermon.speakerTitle}</span>}
                      </div>

                      {sermon.scriptureRef && (
                        <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{sermon.scriptureRef}</span>
                        </div>
                      )}

                      {/* Channel & Series badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {sermon.channel && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedChannel(sermon.channel!);
                            }}
                            className="text-[10px] font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors"
                            title="Filter by channel"
                          >
                            <Tv className="w-2.5 h-2.5 text-amber-400" />
                            <span className="truncate max-w-[120px]">{sermon.channel}</span>
                          </button>
                        )}
                        {sermon.series && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSeries(sermon.series!);
                              setActiveSeriesContainer(sermon.series!);
                            }}
                            className="text-[10px] font-bold text-yellow-300 hover:text-white bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors"
                            title="Open Series Container"
                          >
                            <Layers className="w-2.5 h-2.5 text-yellow-400" />
                            <span className="truncate max-w-[120px]">{sermon.series}</span>
                            {sermon.seriesPart && <span className="text-yellow-200">Pt. {sermon.seriesPart}</span>}
                          </button>
                        )}
                      </div>

                      {/* Video Bottom Actions */}
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 mt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareSermon(sermon);
                          }}
                          className="text-xs font-semibold text-slate-300 hover:text-amber-300 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                          title="Share to Faith Feed"
                        >
                          <Share2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Share to Feed</span>
                        </button>

                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <span>Watch</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            /* AUDIO CARD (SPOTIFY / DWELL AESTHETIC) */
            return (
              <div
                key={sermon.id}
                id={`sermon-card-${sermon.id}`}
                className={`bg-slate-900/60 backdrop-blur-md border rounded-3xl overflow-hidden shadow-xl transition-all duration-500 group flex flex-col justify-between relative ${
                  isTargeted
                    ? "ring-2 ring-amber-400 border-amber-400 shadow-[0_0_35px_rgba(59,130,246,0.45)] scale-[1.01]"
                    : isCurrent
                    ? "border-amber-500/80 ring-2 ring-amber-500/20"
                    : "border-white/10 hover:border-amber-500/40"
                }`}
              >
                {isTargeted && (
                  <div className="bg-amber-600/40 border-b border-amber-500/50 px-4 py-2 flex items-center justify-between text-xs font-bold text-amber-200 animate-fade-in">
                    <span className="flex items-center gap-1.5 animate-pulse">
                      <span>🎯 Targeted Sermon Exposition</span>
                    </span>
                    <span className="text-[10px] text-amber-300 font-mono">From Feed Shortcut</span>
                  </div>
                )}
                <div>
                  <div className="relative w-full h-44 bg-slate-950 overflow-hidden">
                    <img
                      src={cover}
                      alt={sermon.title}
                      loading="eager"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const fallback = getFallbackSpiritualCover(sermon, idx);
                        if (e.currentTarget.src !== fallback) {
                          e.currentTarget.src = fallback;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className={"text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow " + (sermon.source === "sermonindex" ? "bg-yellow-600/90 text-white" : "bg-emerald-600/90 text-white")}>
                        {sermon.source === "sermonindex" ? "Historical Master" : "Community"}
                      </span>
                      {sermon.duration && (
                        <span className="text-[10px] font-semibold bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {sermon.duration}
                        </span>
                      )}
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handlePlayAudio(sermon)}
                        className="w-14 h-14 rounded-full bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center shadow-2xl backdrop-blur-sm transition-transform active:scale-95 group-hover:scale-110"
                      >
                        {isCurrent && isPlaying ? (
                          <Pause className="w-6 h-6 fill-current" />
                        ) : (
                          <Play className="w-6 h-6 fill-current ml-1" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-black text-white text-base leading-snug line-clamp-2">{sermon.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-bold text-white">{sermon.speaker}</span>
                      {sermon.speakerTitle && <span className="text-slate-500 truncate">• {sermon.speakerTitle}</span>}
                    </div>

                    {sermon.scriptureRef && (
                      <p className="text-xs font-semibold text-amber-300">{sermon.scriptureRef}</p>
                    )}

                    {/* Channel & Series badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {sermon.channel && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedChannel(sermon.channel!);
                          }}
                          className="text-[10px] font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors"
                          title="Filter by channel"
                        >
                          <Tv className="w-2.5 h-2.5 text-amber-400" />
                          <span className="truncate max-w-[120px]">{sermon.channel}</span>
                        </button>
                      )}
                      {sermon.series && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSeries(sermon.series!);
                            setActiveSeriesContainer(sermon.series!);
                          }}
                          className="text-[10px] font-bold text-yellow-300 hover:text-white bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors"
                          title="Open Series Container"
                        >
                          <Layers className="w-2.5 h-2.5 text-yellow-400" />
                          <span className="truncate max-w-[120px]">{sermon.series}</span>
                          {sermon.seriesPart && <span className="text-yellow-200">Pt. {sermon.seriesPart}</span>}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between gap-2 border-t border-white/5 mt-3 pt-3">
                  <div className="flex items-center gap-2">
                    {sermon.scriptureRef ? (
                      <button
                        type="button"
                        onClick={() => onStudyPassage && onStudyPassage(sermon.scriptureRef!)}
                        className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Study</span>
                      </button>
                    ) : <span />}

                    <button
                      type="button"
                      onClick={() => handleShareSermon(sermon)}
                      className="text-xs font-semibold text-slate-300 hover:text-amber-300 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      title="Share to Faith Feed"
                    >
                      <Share2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Share</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlayAudio(sermon)}
                    className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    {isCurrent && isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isCurrent && isPlaying ? "Pause" : "Listen"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DOCKED BOTTOM AUDIO PLAYER (DWELL / SPOTIFY BAR) */}
      {activeItem && (
        <div className="fixed bottom-3 inset-x-3 sm:inset-x-6 max-w-4xl mx-auto z-50 bg-[#0c1017]/95 backdrop-blur-2xl border border-white/15 p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <img
              src={activeItem.speakerImage || activeItem.thumbnailUrl || FALLBACK_COVERS[0]}
              alt={activeItem.title}
              className="w-11 h-11 rounded-xl object-cover border border-white/10 flex-shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Volume2 className="w-3 h-3 animate-pulse text-amber-400" />
                <span>Now Playing</span>
              </p>
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">{activeItem.title}</h4>
              <p className="text-[11px] text-slate-400 truncate">{activeItem.speaker}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => handlePlayAudio(activeItem)}
              className="w-10 h-10 rounded-full bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN VIDEO MODAL PLAYER */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6"
          onClick={() => { setSelectedVideo(null); setIsPlayingModalVideo(false); }}
        >
          <div 
            className="bg-[#0b0f19] border border-white/20 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl space-y-3 p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-1">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-600 text-white">
                    {selectedVideo.channel || 'Expository Sermon'}
                  </span>
                  {selectedVideo.series && (
                    <span className="text-[10px] font-bold text-yellow-300 bg-yellow-500/15 border border-yellow-500/20 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                      {selectedVideo.series} {selectedVideo.seriesPart ? `Pt. ${selectedVideo.seriesPart}` : ''}
                    </span>
                  )}
                </div>
                <h2 className="text-white font-black text-sm sm:text-base leading-snug line-clamp-1">{selectedVideo.title}</h2>
                <p className="text-xs text-amber-400 font-semibold">{selectedVideo.speaker} {selectedVideo.scriptureRef ? `• ${selectedVideo.scriptureRef}` : ""}</p>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedVideo(null); setIsPlayingModalVideo(false); }}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Container */}
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-inner">
              {(() => {
                const effectiveYtId =
                  selectedVideo.youtubeId ||
                  (selectedVideo.mediaUrl || '').match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)?.[1];

                const coverUrl = getSermonCoverImage(selectedVideo);

                // 1. Loaded & waiting state: Display real sermon video cover artwork with Play prompt
                if (!isPlayingModalVideo) {
                  return (
                    <div
                      className="relative w-full h-full cursor-pointer group select-none overflow-hidden"
                      onClick={() => setIsPlayingModalVideo(true)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setIsPlayingModalVideo(true);
                        }
                      }}
                    >
                      <img
                        src={coverUrl}
                        alt={selectedVideo.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
                        onError={(e) => {
                          const fallback = getFallbackSpiritualCover(selectedVideo);
                          if (e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/25 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setIsPlayingModalVideo(true)}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center shadow-2xl shadow-amber-600/60 group-hover:scale-110 transition-all border border-amber-400/50"
                          >
                            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white translate-x-0.5" />
                          </button>
                          <div className="px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-xs font-bold text-white shadow-xl flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Loaded & Ready • Tap to Play</span>
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                        <span className="bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 font-bold text-amber-300">
                          {selectedVideo.channel || 'Sermon Broadcast'}
                        </span>
                        {selectedVideo.duration && (
                          <span className="bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 font-semibold text-slate-300">
                            {selectedVideo.duration}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                // 2. Active playing state
                if (effectiveYtId) {
                  return (
                    <iframe
                      src={`https://www.youtube.com/embed/${effectiveYtId}?autoplay=1&playsinline=1&rel=0`}
                      title={selectedVideo.title}
                      className="w-full h-full border-0"
                      referrerPolicy="no-referrer-when-downgrade"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  );
                }
                if (selectedVideo.mediaUrl) {
                  return (
                    <video controls autoPlay playsInline className="w-full h-full object-contain">
                      <source src={selectedVideo.mediaUrl} type="video/mp4" />
                    </video>
                  );
                }
                return (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                    <Video className="w-8 h-8 text-slate-600" />
                    <p className="text-xs">No video stream available</p>
                  </div>
                );
              })()}
            </div>

            {/* Footer with Direct App Pop-out */}
            <div className="flex items-center justify-between px-1 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">Aura Sanctuary Stream</span>
                {isPlayingModalVideo && (
                  <button
                    type="button"
                    onClick={() => setIsPlayingModalVideo(false)}
                    className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline"
                  >
                    View Cover Poster
                  </button>
                )}
              </div>
              {(() => {
                const effectiveYtId =
                  selectedVideo.youtubeId ||
                  (selectedVideo.mediaUrl || '').match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)?.[1];
                if (!effectiveYtId) return null;
                return (
                  <a
                    href={`https://www.youtube.com/watch?v=${effectiveYtId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    Watch on YouTube ↗
                  </a>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
