import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Lock,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  BookOpen,
  Globe,
  Share2,
  Maximize2,
  Minimize2,
  Type,
  Home,
  Layers,
  Sparkles,
  Info,
  Search,
  BookMarked,
  Volume2
} from 'lucide-react';
import { cleanScriptureRef, getBibleGatewayUrl } from '../bible/LessonContentRenderer';

export interface BreadcrumbItem {
  label: string;
  icon?: 'home' | 'book' | 'course' | 'verse' | 'study';
  onClick?: () => void;
  tab?: string;
  subtab?: string;
}

export interface InAppBrowserPayload {
  url: string;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  scriptureRef?: string;
  version?: string;
  initialMode?: 'web' | 'reader';
}

const POPULAR_VERSIONS = [
  { code: 'KJV', name: 'King James Version' },
  { code: 'NKJV', name: 'New King James Version' },
  { code: 'ESV', name: 'English Standard Version' },
  { code: 'NIV', name: 'New International Version' },
  { code: 'NASB', name: 'New American Standard' },
  { code: 'NLT', name: 'New Living Translation' },
  { code: 'CSB', name: 'Christian Standard Bible' },
  { code: 'AMP', name: 'Amplified Bible' },
];

/**
 * Global helper to trigger the In-App Web Browser with custom breadcrumbs from any component.
 */
export function openInAppBrowser(payload: InAppBrowserPayload) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('open_in_app_browser', {
        detail: payload,
      })
    );
  }
}

export function InAppBrowser() {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [title, setTitle] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [scriptureRef, setScriptureRef] = useState<string>('');
  const [version, setVersion] = useState<string>('KJV');
  const [mode, setMode] = useState<'web' | 'reader'>('web');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [readerVerses, setReaderVerses] = useState<{ verse: number; text: string }[]>([]);
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerError, setReaderError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Listen for the custom open event
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<InAppBrowserPayload>;
      if (!customEvent.detail?.url) return;

      const detail = customEvent.detail;
      const initialUrl = detail.url;
      setUrl(initialUrl);
      setInputUrl(initialUrl);
      setHistory([initialUrl]);
      setHistoryIndex(0);

      // Determine scripture reference if not provided
      let detectedRef = detail.scriptureRef || '';
      let detectedVersion = detail.version || 'KJV';

      if (!detectedRef && initialUrl.includes('biblegateway.com')) {
        try {
          const parsed = new URL(initialUrl);
          detectedRef = parsed.searchParams.get('search') || '';
          const v = parsed.searchParams.get('version');
          if (v) detectedVersion = v;
        } catch {}
      }

      setScriptureRef(detectedRef);
      setVersion(detectedVersion);

      // Set clean title
      const initialTitle =
        detail.title ||
        (detectedRef ? `${detectedRef} (${detectedVersion}) - Bible Gateway` : 'Web Browser');
      setTitle(initialTitle);

      // Setup default breadcrumbs if none provided
      const defaultBreadcrumbs: BreadcrumbItem[] = detail.breadcrumbs || [
        { label: 'Aura', icon: 'home', tab: 'feed' },
        { label: 'The Word', icon: 'book', tab: 'bible' },
        ...(detectedRef ? [{ label: `${detectedRef} (${detectedVersion})`, icon: 'verse' as const }] : []),
      ];
      setBreadcrumbs(defaultBreadcrumbs);

      setMode(detail.initialMode || 'web');
      setIsOpen(true);
      setLoading(true);
    };

    window.addEventListener('open_in_app_browser', handleOpen);
    return () => {
      window.removeEventListener('open_in_app_browser', handleOpen);
    };
  }, []);

  // Fetch scripture verses for the reader mode when scriptureRef or version changes
  useEffect(() => {
    if (!isOpen || !scriptureRef) return;

    let isMounted = true;
    const loadScripture = async () => {
      setReaderLoading(true);
      setReaderError(null);

      try {
        // Parse book and chapter (e.g. "Romans 8:1-11" -> book="Romans", chapter="8")
        const match = scriptureRef.match(
          /^(?:1|2|3\s+)?[A-Za-z\s]+(?=\s+\d+)/
        );
        const bookName = match ? match[0].trim() : 'Romans';
        const numPart = scriptureRef.replace(bookName, '').trim();
        const parts = numPart.split(':');
        const chapter = parseInt(parts[0], 10) || 1;

        let startVerse = 1;
        let endVerse = 999;
        if (parts[1]) {
          const vRange = parts[1].split(/[-–—]/);
          startVerse = parseInt(vRange[0], 10) || 1;
          endVerse = vRange[1] ? parseInt(vRange[1], 10) : startVerse;
        }

        const res = await fetch(
          `/api/bible/chapter?book=${encodeURIComponent(bookName)}&chapter=${chapter}`
        );

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.verses) && data.verses.length > 0) {
            // Filter verses to the specified range if given
            const filtered = data.verses.filter(
              (v: any) => v.verse >= startVerse && v.verse <= endVerse
            );
            if (isMounted) {
              setReaderVerses(filtered.length > 0 ? filtered : data.verses);
            }
            return;
          }
        }

        // Fallback search endpoint
        const searchRes = await fetch(`/api/bible/search?q=${encodeURIComponent(scriptureRef)}`);
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (Array.isArray(searchData) && searchData.length > 0) {
            if (isMounted) {
              setReaderVerses(
                searchData.map((item: any, idx: number) => ({
                  verse: item.verse || idx + 1,
                  text: item.text || item.content || '',
                }))
              );
            }
            return;
          }
        }

        if (isMounted) {
          setReaderError('No offline verses found. Viewing live website via Web View.');
        }
      } catch (err) {
        if (isMounted) {
          setReaderError('Unable to load offline passage. Using live Web View.');
        }
      } finally {
        if (isMounted) setReaderLoading(false);
      }
    };

    loadScripture();
    return () => {
      isMounted = false;
    };
  }, [isOpen, scriptureRef, version]);

  const handleNavigate = (newUrl: string) => {
    let cleanUrl = newUrl.trim();
    if (!cleanUrl) return;

    // If user typed a scripture search query (e.g. "Romans 8:1-11" or "John 3:16")
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      if (cleanUrl.match(/^[1-3]?\s*[A-Za-z]+\s+\d+/)) {
        setScriptureRef(cleanUrl);
        cleanUrl = getBibleGatewayUrl(cleanUrl, version);
      } else {
        cleanUrl = 'https://' + cleanUrl;
      }
    }

    setUrl(cleanUrl);
    setInputUrl(cleanUrl);
    setLoading(true);

    const nextHistory = [...history.slice(0, historyIndex + 1), cleanUrl];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const prevUrl = history[prevIdx];
      setHistoryIndex(prevIdx);
      setUrl(prevUrl);
      setInputUrl(prevUrl);
      setLoading(true);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const nextUrl = history[nextIdx];
      setHistoryIndex(nextIdx);
      setUrl(nextUrl);
      setInputUrl(nextUrl);
      setLoading(true);
    }
  };

  const handleReload = () => {
    setLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'Aura Scripture Study',
          url,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const handleVersionChange = (newVersion: string) => {
    setVersion(newVersion);
    if (scriptureRef) {
      const updatedUrl = getBibleGatewayUrl(scriptureRef, newVersion);
      handleNavigate(updatedUrl);
      setTitle(`${scriptureRef} (${newVersion}) - Bible Gateway`);
    }
  };

  const handleBreadcrumbClick = (item: BreadcrumbItem, idx: number) => {
    if (item.onClick) {
      item.onClick();
      return;
    }
    if (item.tab) {
      setIsOpen(false);
      window.dispatchEvent(
        new CustomEvent('navigate_tab', {
          detail: {
            tab: item.tab,
            subtab: item.subtab,
          },
        })
      );
      return;
    }
    // If it's the current or earlier crumb, update browser state
    if (idx === breadcrumbs.length - 1 && scriptureRef) {
      setMode('reader');
    }
  };

  // Extract human readable domain (e.g. "biblegateway.com")
  const getDomain = (rawUrl: string) => {
    try {
      const u = new URL(rawUrl);
      return u.hostname.replace(/^www\./, '');
    } catch {
      return 'Web Browser';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="aura-in-app-browser-modal"
      className="fixed inset-0 z-[999999] flex flex-col bg-slate-950 text-white animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* TOP HEADER: Breadcrumbs & App Window Bar */}
      <header className="flex-none bg-slate-900 border-b border-white/10 px-3 sm:px-5 py-2.5 shadow-lg select-none">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-slate-300 hover:text-white transition-all shrink-0"
            title="Close In-App Browser (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Center: Title & Live Domain */}
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <h3 className="text-xs sm:text-sm font-bold text-white truncate leading-tight flex items-center gap-1.5">
              <span>{title || getDomain(url)}</span>
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
              <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="font-mono text-[10px] sm:text-xs text-slate-300">{getDomain(url)}</span>
              {version && (
                <span className="ml-1 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px] uppercase border border-amber-500/30">
                  {version}
                </span>
              )}
            </div>
          </div>

          {/* Right: Quick actions (View Mode, Fullscreen, External Tab) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* View Mode Toggle: Live Web vs Clean Reader */}
            <div className="hidden xs:flex items-center bg-black/40 rounded-xl p-0.5 border border-white/10 text-xs">
              <button
                onClick={() => setMode('web')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  mode === 'web'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="View live website"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Live Web</span>
              </button>
              <button
                onClick={() => setMode('reader')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  mode === 'reader'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="View distilled scripture reader"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reader</span>
              </button>
            </div>

            {/* Version dropdown */}
            <select
              value={version}
              onChange={(e) => handleVersionChange(e.target.value)}
              className="bg-black/50 border border-white/15 text-amber-300 text-xs font-bold rounded-xl px-2 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
              title="Select Scripture Translation"
            >
              {POPULAR_VERSIONS.map((v) => (
                <option key={v.code} value={v.code} className="bg-slate-900 text-white">
                  {v.code}
                </option>
              ))}
            </select>

            {/* External link */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Open in external browser window"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors relative"
              title="Copy URL"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="hidden sm:flex p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Share Page"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BREADCRUMBS ROW (Prominently rendered below the header) */}
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center overflow-x-auto scrollbar-none gap-1.5 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 shrink-0 pr-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">Path:</span>
          </div>

          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={`crumb-${idx}`}>
                <button
                  onClick={() => handleBreadcrumbClick(crumb, idx)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors whitespace-nowrap ${
                    isLast
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                      : 'hover:bg-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  {crumb.icon === 'home' && <Home className="w-3 h-3 text-amber-400" />}
                  {crumb.icon === 'book' && <BookOpen className="w-3 h-3 text-sky-400" />}
                  {crumb.icon === 'course' && <Sparkles className="w-3 h-3 text-amber-400" />}
                  {crumb.icon === 'verse' && <BookMarked className="w-3 h-3 text-amber-300" />}
                  <span>{crumb.label}</span>
                </button>
                {!isLast && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>
      </header>

      {/* BROWSER TOOLBAR: Back, Forward, Reload, Address Input */}
      <div className="flex-none bg-slate-900/95 border-b border-white/10 px-3 sm:px-5 py-2 flex items-center gap-2">
        <button
          onClick={handleBack}
          disabled={historyIndex <= 0}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          onClick={handleForward}
          disabled={historyIndex >= history.length - 1}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors"
          title="Forward"
        >
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={handleReload}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          title="Reload"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
        </button>

        {/* Address / Search Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleNavigate(inputUrl);
          }}
          className="flex-1 flex items-center relative"
        >
          <div className="absolute left-3 text-slate-500 pointer-events-none">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Search scripture (e.g. Romans 8:1-11) or enter URL..."
            className="w-full bg-black/60 border border-white/15 focus:border-amber-400 rounded-xl pl-8 pr-9 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none font-mono transition-colors"
          />
          <button
            type="submit"
            className="absolute right-2 p-1 rounded-lg text-slate-400 hover:text-amber-300"
            title="Navigate"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Mobile View Toggle */}
        <div className="flex xs:hidden items-center bg-black/40 rounded-xl p-0.5 border border-white/10">
          <button
            onClick={() => setMode('web')}
            className={`p-1.5 rounded-lg ${mode === 'web' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}
          >
            <Globe className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMode('reader')}
            className={`p-1.5 rounded-lg ${mode === 'reader' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* LOADING PROGRESS BAR */}
      {loading && (
        <div className="h-0.5 w-full bg-slate-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 animate-pulse w-full" />
        </div>
      )}

      {/* MAIN VIEWPORT */}
      <div className="flex-1 relative overflow-hidden bg-slate-950">
        {mode === 'web' ? (
          <div className="w-full h-full relative flex flex-col">
            <iframe
              ref={iframeRef}
              src={url}
              title={title || 'In-App Webview'}
              onLoad={() => setLoading(false)}
              className="w-full h-full border-none flex-1 bg-white"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals"
              allow="clipboard-write; fullscreen"
            />

            {/* Floating helper if user wants reader mode or external open */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 text-xs text-slate-300 z-10">
              <span className="text-[11px] text-slate-400 hidden sm:inline">Viewing Bible Gateway Web</span>
              <button
                onClick={() => setMode('reader')}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full hover:bg-amber-500/20"
              >
                <BookOpen className="w-3 h-3" />
                <span>Switch to Clean Reader</span>
              </button>
              <span className="text-slate-600">|</span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="hidden sm:inline">Open in Tab</span>
              </a>
            </div>
          </div>
        ) : (
          /* CLEAN SCRIPTURE READER MODE */
          <div className="w-full h-full overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
            {/* Header of Reader */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
                    Distilled Passage Reader
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                    {scriptureRef || 'Romans 8:1-11'}
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  {/* Font size control */}
                  <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/10">
                    <button
                      onClick={() =>
                        setFontSize((prev) =>
                          prev === 'xl' ? 'lg' : prev === 'lg' ? 'md' : 'sm'
                        )
                      }
                      className="px-2 py-1 text-xs text-slate-400 hover:text-white font-serif"
                      title="Smaller font"
                    >
                      A-
                    </button>
                    <span className="text-[10px] text-slate-500 px-1 font-mono uppercase">
                      {fontSize}
                    </span>
                    <button
                      onClick={() =>
                        setFontSize((prev) =>
                          prev === 'sm' ? 'md' : prev === 'md' ? 'lg' : 'xl'
                        )
                      }
                      className="px-2 py-1 text-xs text-slate-400 hover:text-white font-serif"
                      title="Larger font"
                    >
                      A+
                    </button>
                  </div>

                  <button
                    onClick={() => setMode('web')}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>View on Bible Gateway</span>
                  </button>
                </div>
              </div>

              {/* Version & Subtitle */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>{POPULAR_VERSIONS.find((v) => v.code === version)?.name || version}</span>
                <span className="italic">Authorized King James Text (Aura Biblical Engine)</span>
              </div>
            </div>

            {/* Verses Text Display */}
            {readerLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-amber-400">
                <RotateCw className="w-6 h-6 animate-spin" />
                <span className="text-sm font-semibold">Loading Scripture text...</span>
              </div>
            ) : readerVerses.length > 0 ? (
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-xl space-y-4">
                <div
                  className={`leading-relaxed text-slate-200 font-serif space-y-3.5 ${
                    fontSize === 'sm'
                      ? 'text-sm sm:text-base leading-6 sm:leading-7'
                      : fontSize === 'md'
                      ? 'text-base sm:text-lg leading-7 sm:leading-8'
                      : fontSize === 'lg'
                      ? 'text-lg sm:text-xl leading-8 sm:leading-9'
                      : 'text-xl sm:text-2xl leading-9 sm:leading-10'
                  }`}
                >
                  {readerVerses.map((v) => (
                    <p key={v.verse} className="group relative transition-colors hover:text-amber-100">
                      <span className="inline-block mr-2 font-sans font-bold text-amber-400 text-xs sm:text-sm select-none align-baseline px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        {v.verse}
                      </span>
                      <span>{v.text}</span>
                    </p>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
                  <span className="text-xs text-slate-400 italic">
                    Public Domain Biblical Translation.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const allText = readerVerses
                          .map((v) => `[${v.verse}] ${v.text}`)
                          .join('\n');
                        navigator.clipboard?.writeText(
                          `${scriptureRef} (${version})\n\n${allText}`
                        );
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied Passage</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Passage</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-slate-900 border border-white/10 text-center space-y-4">
                <p className="text-slate-300">
                  {readerError || 'Passage not found in local index. Switch to Live Web mode to view the original page.'}
                </p>
                <button
                  onClick={() => setMode('web')}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm inline-flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  <span>Switch to Live Web Browser</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
