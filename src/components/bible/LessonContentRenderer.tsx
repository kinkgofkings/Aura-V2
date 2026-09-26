import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  ExternalLink,
  X,
  Sparkles,
  Loader,
  Play,
  FileText,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Globe,
  Share2,
  Maximize2,
  ListOrdered,
  Plus
} from 'lucide-react';
import { openInAppBrowser } from '../common/InAppBrowser';

// Regex to capture canonical Bible books, chapter, and verse spans (including optional brackets and dashes)
export const SCRIPTURE_REGEX =
  /(?:\[|\()?\b((?:1|2|3\s+)?(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation))\s+(\d+)(?:\s*:\s*(\d+)(?:\s*[-–—]\s*(\d+))?)?\b(?:\]|\))?/gi;

// URL Regex
export const URL_REGEX = /(https?:\/\/[^\s<>'")]+)/gi;

export function cleanScriptureRef(ref: string): string {
  return ref
    .replace(/^[\[\(]/, '')
    .replace(/[\]\)]$/, '')
    .replace(/\s*[-–—]\s*/g, '-')
    .replace(/\s*:\s*/g, ':')
    .trim();
}

export function getBibleGatewayUrl(ref: string, version = 'KJV'): string {
  const clean = cleanScriptureRef(ref);
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(clean)}&version=${encodeURIComponent(version)}`;
}

/**
 * Intelligently separates combined text if a lesson has both scripture passages
 * and outline bullets in notes (or if content is empty).
 */
export function splitNotesAndOutline(rawNotes?: string): { scriptureText: string; outlineText: string } {
  if (!rawNotes || !rawNotes.trim()) {
    return { scriptureText: '', outlineText: '' };
  }
  const lines = rawNotes.split(/\r?\n/);
  const firstBulletIdx = lines.findIndex((l) => parseBulletHeader(l.trim()) !== null);
  if (firstBulletIdx === -1) {
    return { scriptureText: rawNotes, outlineText: '' };
  }
  const scriptureLines = lines.slice(0, firstBulletIdx);
  const outlineLines = lines.slice(firstBulletIdx);
  return {
    scriptureText: scriptureLines.join('\n').trim(),
    outlineText: outlineLines.join('\n').trim(),
  };
}

export function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

interface ScripturePopOverProps {
  reference: string;
  pos: { x: number; y: number };
  onClose: () => void;
  onOpenStudy?: (ref: string) => void;
}

function ScripturePopOver({ reference, pos, onClose, onOpenStudy }: ScripturePopOverProps) {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [verseData, setVerseData] = useState<{ reference: string; text: string } | null>(null);

  const cleanedRef = cleanScriptureRef(reference);
  const bgUrl = getBibleGatewayUrl(cleanedRef);

  useEffect(() => {
    let isMounted = true;
    const fetchVerse = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/bible/search?query=${encodeURIComponent(cleanedRef)}`);
        if (res.ok) {
          const data = await res.json();
          const passage =
            data.passage ||
            data.text ||
            (data.verses && data.verses.map((v: any) => `${v.verse}. ${v.text}`).join(' ')) ||
            'Scripture passage loaded from King James Version.';
          if (isMounted) setVerseData({ reference: cleanedRef, text: passage });
        } else {
          if (isMounted) {
            setVerseData({
              reference: cleanedRef,
              text: `King James Version passage: ${cleanedRef}. Click below to explore on Bible Gateway or study in-app.`,
            });
          }
        }
      } catch (e) {
        if (isMounted) {
          setVerseData({
            reference: cleanedRef,
            text: `Scripture Reference: ${cleanedRef}.`,
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVerse();

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      isMounted = false;
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [cleanedRef, onClose]);

  return (
    <div
      ref={popoverRef}
      style={{
        top: `${pos.y}px`,
        left: `${Math.max(12, Math.min(pos.x, window.innerWidth - 350))}px`,
      }}
      className="fixed z-[999] w-[320px] sm:w-[360px] bg-slate-900/98 backdrop-blur-2xl border border-amber-500/40 rounded-2xl p-4 shadow-2xl animate-fade-in text-left space-y-3"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black uppercase tracking-wider text-amber-300">
            {cleanedRef}
          </span>
          <span className="text-[10px] bg-amber-600/30 text-amber-200 px-1.5 py-0.5 rounded font-bold">
            KJV
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="text-xs text-slate-200 leading-relaxed max-h-48 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-amber-400 gap-2">
            <Loader className="w-4 h-4 animate-spin" />
            <span className="text-xs">Loading Scripture passage...</span>
          </div>
        ) : (
          <p className="italic font-serif leading-relaxed">"{verseData?.text}"</p>
        )}
      </div>

      <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => {
            openInAppBrowser({
              url: bgUrl,
              title: `${cleanedRef} (KJV) - Bible Gateway`,
              scriptureRef: cleanedRef,
              version: 'KJV',
              breadcrumbs: [
                { label: 'Aura', icon: 'home', tab: 'bible' },
                { label: 'The Word', icon: 'book', tab: 'bible' },
                { label: `${cleanedRef} (KJV)`, icon: 'verse' },
              ],
            });
            onClose();
          }}
          className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1.5 rounded-lg border border-amber-500/30 transition-all cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Bible Gateway (WebView)</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
        </button>

        {onOpenStudy && (
          <button
            onClick={() => {
              onOpenStudy(cleanedRef);
              onClose();
            }}
            className="text-[11px] font-semibold text-white hover:text-amber-200 flex items-center gap-1 bg-white/10 hover:bg-white/15 px-2.5 py-1.5 rounded-lg transition-all"
          >
            <span>In-App Study</span>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Text segment parser: replaces URLs and Scripture with interactive elements
 */
export function FormattedTextChunk({
  text,
  onOpenStudy,
}: {
  text: string;
  onOpenStudy?: (ref: string) => void;
}) {
  const [activeRef, setActiveRef] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);

  const handleScriptureClick = (e: React.MouseEvent, refStr: string) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopoverPos({
      x: rect.left,
      y: rect.bottom + window.scrollY + 6,
    });
    setActiveRef(refStr);
  };

  // 1. Identify URL matches and Scripture matches
  interface MatchItem {
    type: 'url' | 'scripture';
    start: number;
    end: number;
    text: string;
  }

  const items: MatchItem[] = [];

  // Match URLs
  for (const m of text.matchAll(URL_REGEX)) {
    if (m.index !== undefined) {
      items.push({
        type: 'url',
        start: m.index,
        end: m.index + m[0].length,
        text: m[0],
      });
    }
  }

  // Match Scripture References
  for (const m of text.matchAll(SCRIPTURE_REGEX)) {
    if (m.index !== undefined) {
      // Avoid overlap with URLs
      const start = m.index;
      const end = m.index + m[0].length;
      const overlaps = items.some(
        (it) => (start >= it.start && start < it.end) || (end > it.start && end <= it.end)
      );
      if (!overlaps) {
        items.push({
          type: 'scripture',
          start,
          end,
          text: m[0],
        });
      }
    }
  }

  // Sort by start index
  items.sort((a, b) => a.start - b.start);

  if (items.length === 0) {
    return <span>{text}</span>;
  }

  const nodes: React.ReactNode[] = [];
  let curIndex = 0;

  items.forEach((item, i) => {
    if (item.start > curIndex) {
      nodes.push(text.substring(curIndex, item.start));
    }

    if (item.type === 'url') {
      const isBibleGateway = item.text.includes('biblegateway.com');
      nodes.push(
        <button
          key={`url-${i}-${item.start}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openInAppBrowser({
              url: item.text,
              title: isBibleGateway ? 'Bible Gateway' : item.text,
              breadcrumbs: [
                { label: 'Aura', icon: 'home', tab: 'bible' },
                { label: 'The Word', icon: 'book', tab: 'bible' },
                { label: isBibleGateway ? 'Bible Gateway' : 'Web Link', icon: 'verse' },
              ],
            });
          }}
          className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold underline decoration-amber-500/50 hover:decoration-amber-300 break-all transition-colors mx-0.5 cursor-pointer text-left"
          title={isBibleGateway ? 'Open passage in In-App WebView Browser' : `Visit ${item.text}`}
        >
          {isBibleGateway && <BookOpen className="w-3.5 h-3.5 text-amber-400 inline" />}
          <span>{item.text}</span>
          <ExternalLink className="w-3 h-3 inline shrink-0" />
        </button>
      );
    } else {
      const cleaned = cleanScriptureRef(item.text);
      const bgUrl = getBibleGatewayUrl(cleaned);
      nodes.push(
        <span key={`scrip-${i}-${item.start}`} className="inline-flex items-center align-baseline mx-0.5">
          <button
            type="button"
            onClick={(e) => handleScriptureClick(e, item.text)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-100 font-semibold border border-amber-400/30 transition-all text-xs cursor-pointer"
            title={`Preview ${cleaned} or open on Bible Gateway`}
          >
            <BookOpen className="w-3 h-3 text-amber-400" />
            <span>{item.text}</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openInAppBrowser({
                url: bgUrl,
                title: `${cleaned} (KJV) - Bible Gateway`,
                scriptureRef: cleaned,
                version: 'KJV',
                breadcrumbs: [
                  { label: 'Aura', icon: 'home', tab: 'bible' },
                  { label: 'The Word', icon: 'book', tab: 'bible' },
                  { label: `${cleaned} (KJV)`, icon: 'verse' },
                ],
              });
            }}
            className="text-slate-400 hover:text-amber-300 ml-1 p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
            title="Open in In-App WebView Browser (KJV)"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </span>
      );
    }

    curIndex = item.end;
  });

  if (curIndex < text.length) {
    nodes.push(text.substring(curIndex));
  }

  return (
    <>
      <span>{nodes}</span>
      {activeRef && popoverPos && (
        <ScripturePopOver
          reference={activeRef}
          pos={popoverPos}
          onClose={() => setActiveRef(null)}
          onOpenStudy={onOpenStudy}
        />
      )}
    </>
  );
}

/**
 * Rich Lesson Content & Markdown Parser
 * Supports:
 * - Bullet outlines (6+ bullets, sub-paragraphs)
 * - Numbered steps
 * - Embedded Markdown images: ![alt](url)
 * - Section headers (## Heading)
 * - Quotes (> Quote)
 * - URLs & Bible verses automatically hyperlinked
 */
/**
 * Helper to detect bullet items in various formats:
 * 1. Title, [1] Title, (1) Title, • 1. Title, I. Title, Point 1: Title, • Title
 */
interface BulletItem {
  marker: string;
  title: string;
}

function parseBulletHeader(line: string): BulletItem | null {
  const trimmed = line.trim();

  // [1], [ 6 ], [12]
  const bracketMatch = trimmed.match(/^\[\s*(\d+)\s*\]\s*(.*)$/);
  if (bracketMatch) {
    return { marker: bracketMatch[1], title: bracketMatch[2].trim() };
  }

  // (1), (6)
  const parenMatch = trimmed.match(/^\(\s*(\d+)\s*\)\s*(.*)$/);
  if (parenMatch) {
    return { marker: parenMatch[1], title: parenMatch[2].trim() };
  }

  // • 1. Title or • 1) Title
  const bulletNumMatch = trimmed.match(/^[•\-\*]\s*(\d+)[\.\)]\s*(.*)$/);
  if (bulletNumMatch) {
    return { marker: bulletNumMatch[1], title: bulletNumMatch[2].trim() };
  }

  // Standard numbered: 1., 2), 6., 6:
  const numMatch = trimmed.match(/^(\d+)[\.\)\-:]\s+(.*)$/);
  if (numMatch) {
    return { marker: numMatch[1], title: numMatch[2].trim() };
  }

  // Roman numerals: I., II., III., IV., V., VI.
  const romanMatch = trimmed.match(/^([IVXLCDM]+)[\.\)\-:]\s+(.*)$/i);
  if (romanMatch) {
    return { marker: romanMatch[1].toUpperCase(), title: romanMatch[2].trim() };
  }

  // Point 1:, Bullet 1:, Key Point 1:
  const prefixMatch = trimmed.match(/^(?:Point|Bullet|Key Point|Section|Part)\s+(\d+)[\.:\-]?\s*(.*)$/i);
  if (prefixMatch) {
    return { marker: prefixMatch[1], title: prefixMatch[2].trim() };
  }

  // Standard bullet •, -, *
  const stdBulletMatch = trimmed.match(/^([•\-\*])\s+(.*)$/);
  if (stdBulletMatch) {
    return { marker: '•', title: stdBulletMatch[2].trim() };
  }

  return null;
}

/**
 * Rich Lesson Content & Notes Renderer
 * Handles Markdown headings, images, scripture links, blockquotes,
 * and robust multi-paragraph, numbered/bulleted study points (1, 2, 3, 4, 5, 6, etc.)
 */
export function RichLessonTextRenderer({
  content,
  onOpenStudy,
  className = '',
}: {
  content?: string;
  onOpenStudy?: (ref: string) => void;
  className?: string;
}) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!content || !content.trim()) {
    return null;
  }

  // Pre-process raw text into structured blocks
  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];

  interface ActiveBullet {
    marker: string;
    title: string;
    bodyLines: string[];
  }

  let activeBullet: ActiveBullet | null = null;
  let currentParagraphLines: string[] = [];

  const flushParagraph = (key: string | number) => {
    if (currentParagraphLines.length > 0) {
      const fullText = currentParagraphLines.join('\n').trim();
      if (fullText) {
        elements.push(
          <div key={key} className="leading-relaxed text-slate-200 mb-3 whitespace-pre-wrap text-sm sm:text-base">
            <FormattedTextChunk text={fullText} onOpenStudy={onOpenStudy} />
          </div>
        );
      }
      currentParagraphLines = [];
    }
  };

  const flushActiveBullet = (key: string | number) => {
    if (activeBullet) {
      const { marker, title, bodyLines } = activeBullet;
      elements.push(
        <div
          key={key}
          className="my-3.5 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/30 transition-all space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="min-w-7 h-7 px-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              {marker}
            </div>
            <div className="flex-1 text-sm sm:text-base font-bold text-white leading-snug">
              <FormattedTextChunk text={title} onOpenStudy={onOpenStudy} />
            </div>
          </div>

          {bodyLines.length > 0 && (
            <div className="pl-10 space-y-2 text-sm sm:text-[15px] text-slate-200 leading-relaxed">
              {bodyLines.map((line, bIdx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={bIdx} className="h-1.5" />;

                // Check for quotes inside bullet
                if (trimmed.startsWith('> ') || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
                  return (
                    <div
                      key={bIdx}
                      className="p-3 my-2 rounded-xl bg-amber-950/30 border-l-2 border-amber-500 text-amber-200/90 italic font-serif"
                    >
                      <FormattedTextChunk text={trimmed.replace(/^>\s*/, '')} onOpenStudy={onOpenStudy} />
                    </div>
                  );
                }

                // Check for embedded sub-bullets or lines starting with Then: / Now: / Post: / Reflection:
                if (trimmed.match(/^(?:Then|Now|Application|Cross-Ref|Note|Post|Commentary|Reflection|Takeaway|Discussion):/i)) {
                  const colonIdx = trimmed.indexOf(':');
                  const label = trimmed.slice(0, colonIdx + 1);
                  const rest = trimmed.slice(colonIdx + 1);
                  return (
                    <div key={bIdx} className="p-3 my-2 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-slate-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span className="font-bold text-amber-300 text-xs uppercase tracking-wider">{label}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        <FormattedTextChunk text={rest} onOpenStudy={onOpenStudy} />
                      </p>
                    </div>
                  );
                }

                // Check for embedded Markdown image inside bullet: ![caption](url)
                const imgInside = trimmed.match(/^!\[(.*?)\]\((https?:\/\/.+?)\)\s*$/);
                if (imgInside) {
                  const alt = imgInside[1] || 'Study Illustration';
                  const url = imgInside[2];
                  return (
                    <div key={bIdx} className="my-2.5 rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black/40">
                      <img
                        src={url}
                        alt={alt}
                        className="w-full max-h-72 object-cover rounded-xl cursor-pointer hover:scale-[1.01] transition-transform"
                        onClick={() => setSelectedImage(url)}
                        referrerPolicy="no-referrer"
                      />
                      {alt && alt !== 'Study Illustration' && (
                        <p className="text-[11px] text-center text-slate-400 py-1.5 px-3 italic bg-white/5">
                          {alt}
                        </p>
                      )}
                    </div>
                  );
                }

                // Standard paragraph within bullet
                return (
                  <p key={bIdx} className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    <FormattedTextChunk text={trimmed} onOpenStudy={onOpenStudy} />
                  </p>
                );
              })}
            </div>
          )}
        </div>
      );
      activeBullet = null;
    }
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    // 1. Check for Markdown image: ![caption](url)
    const imgMatch = line.match(/^!\[(.*?)\]\((https?:\/\/.+?)\)\s*$/);
    if (imgMatch) {
      flushParagraph(`para-before-img-${idx}`);
      flushActiveBullet(`bullet-before-img-${idx}`);
      const alt = imgMatch[1] || 'Lesson media';
      const url = imgMatch[2];
      elements.push(
        <div key={`img-${idx}`} className="my-4 rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-black/40 group">
          <div className="relative">
            <img
              src={url}
              alt={alt}
              className="w-full max-h-[500px] object-cover rounded-2xl cursor-pointer transition-transform hover:scale-[1.01]"
              onClick={() => setSelectedImage(url)}
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setSelectedImage(url)}
              className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="Expand image"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          {alt && alt !== 'Lesson media' && (
            <p className="text-xs text-center text-slate-400 py-2.5 px-4 italic bg-white/5 border-t border-white/5">
              {alt}
            </p>
          )}
        </div>
      );
      return;
    }

    // 2. Check for Headings: ## and ###
    if (line.startsWith('### ')) {
      flushParagraph(`para-before-h3-${idx}`);
      flushActiveBullet(`bullet-before-h3-${idx}`);
      elements.push(
        <h4 key={`h3-${idx}`} className="text-base font-bold text-amber-300 mt-4 mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span>{line.replace(/^###\s+/, '')}</span>
        </h4>
      );
      return;
    }

    if (line.startsWith('## ')) {
      flushParagraph(`para-before-h2-${idx}`);
      flushActiveBullet(`bullet-before-h2-${idx}`);
      elements.push(
        <h3 key={`h2-${idx}`} className="text-lg sm:text-xl font-bold text-white mt-6 mb-2.5 pb-1 border-b border-white/10 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{line.replace(/^##\s+/, '')}</span>
        </h3>
      );
      return;
    }

    // 3. Check for Bullet Items (e.g. 1., 2., 3., 4., 5., 6., [1], •)
    const bullet = parseBulletHeader(line);
    if (bullet) {
      flushParagraph(`para-before-bullet-${idx}`);
      flushActiveBullet(`bullet-before-bullet-${idx}`);
      activeBullet = {
        marker: bullet.marker,
        title: bullet.title,
        bodyLines: [],
      };
      return;
    }

    // 4. If an active bullet exists and this line is part of its description
    if (activeBullet) {
      // Empty line -> keep empty space in bullet
      if (!line) {
        if (activeBullet.bodyLines.length > 0) {
          activeBullet.bodyLines.push('');
        }
        return;
      }
      activeBullet.bodyLines.push(rawLine);
      return;
    }

    // 5. Check for Blockquote
    if (line.startsWith('> ')) {
      flushParagraph(`para-before-quote-${idx}`);
      const quoteText = line.replace(/^>\s+/, '');
      elements.push(
        <div
          key={`quote-${idx}`}
          className="p-4 my-3.5 rounded-2xl bg-amber-950/25 border-l-4 border-amber-500 text-slate-200 italic font-serif leading-relaxed text-sm sm:text-base"
        >
          <FormattedTextChunk text={quoteText} onOpenStudy={onOpenStudy} />
        </div>
      );
      return;
    }

    // 5b. Standalone Post / Reflection / Commentary Card
    if (line.match(/^(?:Post|Reflection|Application|Commentary|Takeaway|Discussion):/i)) {
      flushParagraph(`para-before-post-${idx}`);
      flushActiveBullet(`bullet-before-post-${idx}`);
      const colonIdx = line.indexOf(':');
      const label = line.slice(0, colonIdx);
      const postText = line.slice(colonIdx + 1).trim();
      elements.push(
        <div
          key={`post-${idx}`}
          className="p-5 my-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 shadow-lg space-y-2"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              {label}
            </span>
          </div>
          <div className="text-slate-200 text-sm leading-relaxed">
            <FormattedTextChunk text={postText} onOpenStudy={onOpenStudy} />
          </div>
        </div>
      );
      return;
    }

    // 5c. Bible Gateway Passage Link Card (e.g. "View passage on Bible Gateway (KJV)")
    if (line.match(/(?:View|Read|Study)\s+passage\s+on\s+Bible\s+Gateway(?:\s*\(([A-Za-z]+)\))?/i)) {
      flushParagraph(`para-before-bg-${idx}`);
      flushActiveBullet(`bullet-before-bg-${idx}`);
      const bgMatch = line.match(/(?:View|Read|Study)\s+passage\s+on\s+Bible\s+Gateway(?:\s*\(([A-Za-z]+)\))?/i);
      const detectedVer = (bgMatch && bgMatch[1]) ? bgMatch[1] : 'KJV';
      const mdUrlMatch = line.match(/\((https?:\/\/[^\)]+)\)/);
      const targetUrl = mdUrlMatch ? mdUrlMatch[1] : getBibleGatewayUrl('Romans 8:1-11', detectedVer);
      elements.push(
        <div
          key={`bg-callout-${idx}`}
          className="my-3.5 p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Scripture Portal
              </span>
              <span className="text-xs sm:text-sm font-bold text-white">
                View passage on Bible Gateway ({detectedVer})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              openInAppBrowser({
                url: targetUrl,
                title: `Bible Gateway (${detectedVer})`,
                scriptureRef: 'Romans 8:1-11',
                version: detectedVer,
                breadcrumbs: [
                  { label: 'Aura', icon: 'home', tab: 'bible' },
                  { label: 'The Word', icon: 'book', tab: 'bible' },
                  { label: `Bible Gateway (${detectedVer})`, icon: 'verse' },
                ],
              });
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
          >
            <span>Open In-App Browser</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      );
      return;
    }

    // 6. Empty line -> flush standard paragraph
    if (!line) {
      flushParagraph(`para-empty-${idx}`);
      return;
    }

    // 7. Otherwise standard paragraph line
    currentParagraphLines.push(rawLine);
  });

  flushParagraph('para-final');
  flushActiveBullet('bullet-final');

  return (
    <div className={`space-y-1 ${className}`}>
      {elements}

      {/* Lightbox Modal for Embedded Images */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage}
              alt="Expanded preview"
              className="w-auto h-auto max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 p-2.5 rounded-full bg-black/70 text-white hover:bg-black/90 transition-all border border-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Complete Full-Featured Lesson Card Display
 * Renders Section 1 (Scripture Anchor), Section 2 (Scripture Passages & References),
 * Section 3 (Lesson Outline, Bullets 1-6 & Full Commentary), Media Gallery, and Video!
 */
export function CompleteLessonCard({
  lesson,
  courseTitle,
  onOpenStudy,
  onEdit,
  isAuthorView = false,
}: {
  lesson: {
    id: string;
    courseId: string;
    title: string;
    scriptureRef?: string;
    notes?: string;
    content?: string;
    mediaType?: 'youtube' | 'upload' | 'pdf' | 'none';
    mediaUrl?: string;
    videoPosition?: 'top' | 'bottom';
    images?: string;
  };
  courseTitle?: string;
  onOpenStudy?: (ref: string) => void;
  onEdit?: () => void;
  isAuthorView?: boolean;
}) {
  const [section2Collapsed, setSection2Collapsed] = useState(false);
  const [section3Collapsed, setSection3Collapsed] = useState(false);
  const ytId = lesson.mediaType === 'youtube' ? extractYouTubeId(lesson.mediaUrl) : null;
  const isVideoAtEnd = lesson.videoPosition === 'bottom';

  // Derive effective content and notes (supporting automatic separation if bullets were previously stored in notes)
  let effectiveContent = lesson.content ? lesson.content.trim() : '';
  let effectiveNotes = lesson.notes ? lesson.notes.trim() : '';

  if (!effectiveContent && effectiveNotes) {
    const split = splitNotesAndOutline(effectiveNotes);
    if (split.outlineText) {
      effectiveContent = split.outlineText;
      effectiveNotes = split.scriptureText;
    }
  }

  // Parse attached gallery images
  let attachedImages: Array<{ url: string; caption?: string }> = [];
  if (lesson.images) {
    try {
      const parsed = JSON.parse(lesson.images);
      if (Array.isArray(parsed)) {
        attachedImages = parsed.map((item) =>
          typeof item === 'string' ? { url: item } : item
        );
      }
    } catch {
      // Comma-separated fallback
      attachedImages = lesson.images
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.startsWith('http'))
        .map((url) => ({ url }));
    }
  }

  const renderVideoPlayer = () => {
    if (!lesson.mediaUrl) return null;

    if (lesson.mediaType === 'youtube' && ytId) {
      return (
        <div className="rounded-2xl overflow-hidden aspect-video border border-white/15 shadow-2xl bg-black relative group">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`}
            title={lesson.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      );
    }

    if (lesson.mediaType === 'upload') {
      const isAudio =
        lesson.mediaUrl.endsWith('.mp3') ||
        lesson.mediaUrl.endsWith('.wav') ||
        lesson.mediaUrl.endsWith('.m4a');
      return (
        <div className="rounded-2xl p-4 bg-slate-950 border border-white/15">
          {isAudio ? (
            <audio controls src={lesson.mediaUrl} className="w-full" />
          ) : (
            <video controls src={lesson.mediaUrl} className="w-full max-h-96 rounded-xl" />
          )}
        </div>
      );
    }

    if (lesson.mediaType === 'pdf') {
      return (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Interactive Study PDF</h4>
              <p className="text-xs text-slate-300">Companion study guide and notes</p>
            </div>
          </div>
          <a
            href={lesson.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
          >
            <span>Open PDF</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Scripture Reference */}
      <div className="bg-slate-900/80 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            {courseTitle && (
              <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400">
                {courseTitle}
              </span>
            )}
            <h2 className="text-xl sm:text-2xl font-black text-white">{lesson.title}</h2>
          </div>

          {onEdit && isAuthorView && (
            <button
              onClick={onEdit}
              className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <span>Edit Lesson</span>
            </button>
          )}
        </div>

        {/* Dedicated Scripture Reference Section 1 */}
        {lesson.scriptureRef && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900/70 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                  Section 1: Scripture Anchor
                </span>
                <span className="text-base sm:text-lg font-black text-white">
                  {lesson.scriptureRef}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const ref = lesson.scriptureRef || 'Romans 8:1-11';
                  openInAppBrowser({
                    url: getBibleGatewayUrl(ref, 'KJV'),
                    title: `${ref} (KJV) - Bible Gateway`,
                    scriptureRef: ref,
                    version: 'KJV',
                    breadcrumbs: [
                      { label: 'Aura', icon: 'home', tab: 'bible' },
                      { label: 'The Word', icon: 'book', tab: 'bible' },
                      ...(courseTitle ? [{ label: courseTitle, icon: 'course' as const }] : []),
                      { label: lesson.title, icon: 'course' as const },
                      { label: `${ref} (KJV)`, icon: 'verse' as const },
                    ],
                  });
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                title="View full passage in In-App WebView Browser"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Bible Gateway (KJV)</span>
                <ExternalLink className="w-3 h-3" />
              </button>

              {onOpenStudy && (
                <button
                  type="button"
                  onClick={() => onOpenStudy(lesson.scriptureRef!)}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <span>In-App Study</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Video Player: Rendered HERE at the top if NOT configured at the end */}
      {!isVideoAtEnd && renderVideoPlayer()}

      {/* SECTION 2: Scripture Passages & Biblical References (effectiveNotes) */}
      {(effectiveNotes || isAuthorView) && (
        <div className="bg-slate-900/80 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Section 2: Scripture Passages & Biblical References</h3>
                <p className="text-[11px] text-slate-400">Featured scripture text, translation readings & cross-references</p>
              </div>
            </div>
            {effectiveNotes ? (
              <button
                onClick={() => setSection2Collapsed(!section2Collapsed)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 p-1.5 rounded-lg hover:bg-white/5"
              >
                <span>{section2Collapsed ? 'Expand' : 'Collapse'}</span>
                {section2Collapsed ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="text-[11px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20 font-medium">
                Scripture Optional
              </span>
            )}
          </div>

          {!section2Collapsed && (
            <div className="pt-1">
              {effectiveNotes ? (
                <RichLessonTextRenderer content={effectiveNotes} onOpenStudy={onOpenStudy} />
              ) : isAuthorView ? (
                <div className="p-4 rounded-2xl bg-black/40 border border-dashed border-white/10 text-center space-y-2">
                  <p className="text-xs text-slate-400">
                    No dedicated scripture quote entered yet. You can add reading passages, full-text translations, and cross-references.
                  </p>
                  {onEdit && (
                    <button
                      type="button"
                      onClick={onEdit}
                      className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Scripture Text</span>
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: Lesson Outline, Bullets & Full Commentary (effectiveContent) */}
      {(effectiveContent || isAuthorView) && (
        <div className="bg-slate-900/80 backdrop-blur-md p-5 sm:p-7 rounded-3xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ListOrdered className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Section 3: Lesson Outline, Study Points & Full Commentary</h3>
                <p className="text-[11px] text-slate-400">Complete multi-point outline, comprehensive exegesis, and practical application</p>
              </div>
            </div>
            {effectiveContent ? (
              <button
                onClick={() => setSection3Collapsed(!section3Collapsed)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 p-1.5 rounded-lg hover:bg-white/5"
              >
                <span>{section3Collapsed ? 'Expand' : 'Collapse'}</span>
                {section3Collapsed ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-bold">
                Outline Ready
              </span>
            )}
          </div>

          {!section3Collapsed && (
            <div className="pt-1 text-sm sm:text-base">
              {effectiveContent ? (
                <RichLessonTextRenderer content={effectiveContent} onOpenStudy={onOpenStudy} />
              ) : isAuthorView ? (
                <div className="p-6 rounded-2xl bg-black/40 border border-dashed border-amber-500/30 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <ListOrdered className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">No Outline or Study Bullets Entered Yet</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                      Section 3 is ready for your 6-point study outline, expository commentary, attached images, and discipleship takeaways.
                    </p>
                  </div>
                  {onEdit && (
                    <button
                      type="button"
                      onClick={onEdit}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-xs shadow-lg transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add 6-Point Study Outline in Studio</span>
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* 5. Attached Image Gallery (if any) */}
      {attachedImages.length > 0 && (
        <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span>Lesson Media Gallery ({attachedImages.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {attachedImages.map((img, idx) => (
              <div key={idx} className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 group relative">
                <img
                  src={img.url}
                  alt={img.caption || `Lesson image ${idx + 1}`}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                {img.caption && (
                  <p className="text-[11px] text-slate-300 p-2 bg-slate-950/80 backdrop-blur-sm border-t border-white/10 truncate">
                    {img.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Video Player: Rendered HERE at the end if user chose video at end of lesson */}
      {isVideoAtEnd && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">
            <Play className="w-3.5 h-3.5 text-rose-400 fill-current" />
            <span>Lesson Video & Sermon Message</span>
          </div>
          {renderVideoPlayer()}
        </div>
      )}
    </div>
  );
}
