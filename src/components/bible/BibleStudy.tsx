import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  LayoutGrid, 
  List, 
  Share2, 
  ChevronDown, ChevronRight, 
  Loader, 
  Sparkles, 
  Play, 
  Radio, 
  GraduationCap, 
  FileText, ExternalLink, 
  Search, 
  BookMarked 
} from "lucide-react";

import { BibleReader } from "./BibleReader";
import { PodcastFeed } from "./PodcastFeed";
import { ScriptureLinker } from "./ScriptureLinker";
import { CompleteLessonCard } from "./LessonContentRenderer";
import { PrayerWall } from "./PrayerWall";
import { ChronosDrawer } from "./ChronosDrawer";
import { getBooksByTestament } from "../../content/bibleBooks";
import { INITIAL_COURSES, INITIAL_LESSONS } from "../../content/initialCourses";

interface Course {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  category?: string;
  level?: string;
}

interface Lesson {
  id: string;
  courseId?: string;
  title: string;
  scriptureRef?: string;
  notes?: string;
  content?: string;
  mediaType?: "youtube" | "upload" | "pdf" | "vimeo" | "none" | string;
  mediaUrl?: string;
  videoPosition?: 'top' | 'bottom';
  images?: string;
}

interface StudyBreakdown {
  passageText: string;
  bookSummary: {
    author: string;
    era: string;
    audience: string;
  };
  historicalContext: {
    mindsetThen: string;
    originalIssue: string;
  };
  thenVsNow: {
    then: string;
    now: string;
  };
  dailyApplication: string[];
  prayer: string;
}

export function BibleStudy() {
  const [activeTab, setActiveTab] = useState<"reader" | "pulpit" | "study" | "courses" | "prayers">(() => {
    try {
      const saved = localStorage.getItem("aura_study_initial_tab");
      if (saved === "prayer" || saved === "prayers") {
        localStorage.removeItem("aura_study_initial_tab");
        return "prayers";
      }
      if (saved === "podcasts" || saved === "pulpit") return "pulpit";
      if (saved === "reader" || saved === "bible") return "reader";
    } catch {}
    return "reader";
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [courseLessons, setCourseLessons] = useState<Record<string, Lesson[]>>({});
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseViewLevel, setCourseViewLevel] = useState<"catalog" | "course" | "lesson">("catalog");
  const [selectedCourseObj, setSelectedCourseObj] = useState<Course | null>(null);
  const [selectedLessonObj, setSelectedLessonObj] = useState<Lesson | null>(null);
  const [courseDisplayMode, setCourseDisplayMode] = useState<"grid" | "list">("grid");

  const [selectedTestament, setSelectedTestament] = useState<"Old Testament" | "New Testament">("New Testament");
  const [selectedBook, setSelectedBook] = useState("Genesis");
  const [selectedChapter, setSelectedChapter] = useState("1");
  const [selectedVerse, setSelectedVerse] = useState("1");
  const [studyBreakdown, setStudyBreakdown] = useState<StudyBreakdown | null>(null);
  const [matchingSermons, setMatchingSermons] = useState<any[]>([]);
  const [studyLoading, setStudyLoading] = useState(false);

  const oldTestamentBooks = getBooksByTestament("Old Testament");
  const newTestamentBooks = getBooksByTestament("New Testament");
  const currentBooks = selectedTestament === "Old Testament" ? oldTestamentBooks : newTestamentBooks;

  useEffect(() => {
    fetchCourses();

    const handleCoursesUpdated = () => {
      fetchCourses();
    };
    window.addEventListener('aura_courses_updated', handleCoursesUpdated);

    const handleSwitchStudyTab = (e: Event) => {
      const customEvent = e as CustomEvent<{
        tab: string;
        reference?: string;
        prayerId?: string;
        prayer?: any;
        sermonId?: string;
        sermon?: any;
      }>;
      const target = customEvent.detail?.tab;
      if (target === "prayer" || target === "prayers") {
        setActiveTab("prayers");
        if (customEvent.detail?.prayerId) {
          try {
            sessionStorage.setItem("aura_target_prayer_id", customEvent.detail.prayerId);
            localStorage.setItem("aura_target_prayer_id", customEvent.detail.prayerId);
          } catch {}
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("target_prayer", {
                detail: {
                  prayerId: customEvent.detail.prayerId,
                  prayer: customEvent.detail.prayer,
                },
              })
            );
          }, 80);
        }
      } else if (target === "courses") {
        setActiveTab("courses");
      } else if (target === "study") {
        setActiveTab("study");
        if (customEvent.detail?.reference) {
          const spaceIdx = customEvent.detail.reference.lastIndexOf(" ");
          if (spaceIdx !== -1) {
            const b = customEvent.detail.reference.slice(0, spaceIdx);
            const [c, v] = customEvent.detail.reference.slice(spaceIdx + 1).split(":");
            if (b && c) {
              fetchStudyBreakdown(b, c, v ? v.split("-")[0] : "1");
            }
          }
        }
      } else if (target === "pulpit" || target === "podcasts") {
        setActiveTab("pulpit");
        if (customEvent.detail?.sermonId || customEvent.detail?.sermon) {
          try {
            localStorage.setItem(
              "aura_target_sermon_id",
              customEvent.detail.sermonId || customEvent.detail.sermon?.id
            );
          } catch {}
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("open_sermon", {
                detail: {
                  sermonId: customEvent.detail.sermonId,
                  sermon: customEvent.detail.sermon,
                },
              })
            );
          }, 80);
        }
      } else if (target === "reader" || target === "bible") {
        setActiveTab("reader");
      }
    };

    window.addEventListener("aura_switch_study_tab", handleSwitchStudyTab);
    window.addEventListener("switch_study_tab", handleSwitchStudyTab);
    return () => {
      window.removeEventListener('aura_courses_updated', handleCoursesUpdated);
      window.removeEventListener("aura_switch_study_tab", handleSwitchStudyTab);
      window.removeEventListener("switch_study_tab", handleSwitchStudyTab);
    };
  }, []);

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await fetch("/api/bible/courses");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCourses(data);
          return;
        }
      }
      // Fallback to built-in code courses
      setCourses(INITIAL_COURSES.map((c) => ({
        id: c.id || c.title,
        title: c.title,
        description: c.description,
        coverImage: c.coverImage,
        category: c.category,
        level: c.level,
      })));
    } catch (e) {
      console.error("Failed to load courses, using bundled courses:", e);
      setCourses(INITIAL_COURSES.map((c) => ({
        id: c.id || c.title,
        title: c.title,
        description: c.description,
        coverImage: c.coverImage,
        category: c.category,
        level: c.level,
      })));
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchLessons = async (courseId: string) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
      return;
    }
    try {
      const res = await fetch("/api/bible/courses/" + courseId + "/lessons");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.lessons) && data.lessons.length > 0) {
          setCourseLessons(prev => ({ ...prev, [courseId]: data.lessons }));
          setExpandedCourse(courseId);
          return;
        }
      }
      
      // Fallback to matching static lessons from code
      const currentCourse = courses.find((c) => c.id === courseId);
      const fallbackLessons = INITIAL_LESSONS
        .filter((l) =>
          l.courseTitle.trim().toLowerCase() === (currentCourse?.title || '').trim().toLowerCase() ||
          l.id === courseId
        )
        .map((l, idx) => ({
          id: l.id || `static_lesson_${idx}`,
          courseId,
          title: l.title,
          scriptureRef: l.scriptureRef,
          notes: l.notes,
          content: l.content,
          mediaType: l.mediaType,
          mediaUrl: l.mediaUrl,
          videoPosition: l.videoPosition || 'bottom',
          images: l.images,
        }));

      setCourseLessons(prev => ({ ...prev, [courseId]: fallbackLessons }));
      setExpandedCourse(courseId);
    } catch (error) {
      console.error("Failed to fetch lessons, falling back to bundled lessons:", error);
      const currentCourse = courses.find((c) => c.id === courseId);
      const fallbackLessons = INITIAL_LESSONS
        .filter((l) =>
          l.courseTitle.trim().toLowerCase() === (currentCourse?.title || '').trim().toLowerCase() ||
          l.id === courseId
        )
        .map((l, idx) => ({
          id: l.id || `static_lesson_${idx}`,
          courseId,
          title: l.title,
          scriptureRef: l.scriptureRef,
          notes: l.notes,
          content: l.content,
          mediaType: l.mediaType,
          mediaUrl: l.mediaUrl,
          videoPosition: l.videoPosition || 'bottom',
          images: l.images,
        }));
      setCourseLessons(prev => ({ ...prev, [courseId]: fallbackLessons }));
      setExpandedCourse(courseId);
    }
  };

  const fetchStudyBreakdown = async (bookParam?: string, chapterParam?: string, verseParam?: string) => {
    const targetBook = bookParam || selectedBook;
    const targetChapter = chapterParam || selectedChapter;
    const targetVerse = verseParam || selectedVerse;

    setSelectedBook(targetBook);
    setSelectedChapter(targetChapter);
    setSelectedVerse(targetVerse);

    setStudyLoading(true);
    try {
      const res = await fetch("/api/bible/study?book=" + encodeURIComponent(targetBook) + "&chapter=" + targetChapter + "&verse=" + targetVerse);
      if (res.ok) {
        const data = await res.json();
        setStudyBreakdown({
          passageText: data.passageText 
            ? `"${data.passageText}" — ${targetBook} ${targetChapter}:${targetVerse} (King James Version)` 
            : `"${targetBook} ${targetChapter}:${targetVerse}" — King James Version`,
          bookSummary: {
            author: data.bookSummary?.author || "Biblical Author",
            era: data.bookSummary?.era || "Biblical Antiquity",
            audience: data.bookSummary?.audience || "God's Covenant People"
          },
          historicalContext: {
            mindsetThen: data.historicalContext?.mindsetThen || "The original audience lived in deep reverence for God's covenant word.",
            originalIssue: data.historicalContext?.originalIssue || ("Spiritual guidance and truth in " + targetBook + " " + targetChapter + ":" + targetVerse)
          },
          thenVsNow: {
            then: data.thenVsNow?.then || "Believers looked to God's promises for light and strength.",
            now: data.thenVsNow?.now || "We apply this timeless divine wisdom to our daily walk."
          },
          dailyApplication: Array.isArray(data.dailyApplication) && data.dailyApplication.length > 0
            ? data.dailyApplication
            : [
                "Reflect on how this passage speaks to your life today.",
                "Meditate on God's faithfulness in all circumstances.",
                "Share this encouraging scripture with someone in your community."
              ],
          prayer: data.prayer || "Lord, open my eyes that I may behold wondrous things out of Thy law. Lead my steps today in Jesus' name. Amen."
        });

        // Trigger Word energy burst into live wallpaper
        window.dispatchEvent(
          new CustomEvent('trigger_aura_burst', {
            detail: {
              type: 'word',
              text: `✦ Word Illumination: ${targetBook} ${targetChapter}:${targetVerse}`,
            },
          })
        );
      }

      try {
        const sermonRes = await fetch("/api/bible/sermonindex/scripture/" + encodeURIComponent(targetBook) + "/" + targetChapter + "/" + targetVerse);
        if (sermonRes.ok) {
          const sData = await sermonRes.json();
          if (Array.isArray(sData)) setMatchingSermons(sData);
        }
      } catch (sErr) {
        console.warn("Matching sermon fetch failed:", sErr);
      }
    } catch (err) {
      console.error("Study breakdown error:", err);
    } finally {
      setStudyLoading(false);
    }
  };

  const handleShareStudy = async () => {
    if (!studyBreakdown) return;
    try {
      await fetch("/api/bible/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verseRef: selectedBook + " " + selectedChapter + ":" + selectedVerse,
          passageText: studyBreakdown.passageText,
          takeaway: studyBreakdown.dailyApplication[0]
        })
      });
      window.dispatchEvent(new CustomEvent("open_share_modal", {
        detail: { type: "general", initialContent: "\"" + studyBreakdown.passageText + "\" — " + selectedBook + " " + selectedChapter + ":" + selectedVerse }
      }));
    } catch (e) {
      console.warn("Share failed:", e);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
      {/* Master 4-Tab Navigation Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 overflow-x-auto shadow-xl">
        <button
          onClick={() => setActiveTab("reader")}
          className={"flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all " + (
            activeTab === "reader"
              ? "bg-amber-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span>Bible</span>
        </button>

        <button
          onClick={() => setActiveTab("pulpit")}
          className={"flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all " + (
            activeTab === "pulpit"
              ? "bg-amber-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          )}
        >
          <Radio className="w-4 h-4" />
          <span>Pulpit & Sermons</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("study");
            if (!studyBreakdown) fetchStudyBreakdown();
          }}
          className={"flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all " + (
            activeTab === "study"
              ? "bg-amber-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>Study Engine</span>
        </button>

        <button
          onClick={() => setActiveTab("courses")}
          className={"flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all " + (
            activeTab === "courses"
              ? "bg-amber-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          )}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Courses</span>
        </button>

        <button
          onClick={() => setActiveTab("prayers")}
          className={"flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ml-auto " + (
            activeTab === "prayers"
              ? "bg-rose-600 text-white shadow-lg"
              : "text-slate-400 hover:text-rose-300"
          )}
        >
          <span>🙏</span>
          <span>Prayer Wall</span>
        </button>
      </div>

      {/* TAB 1: BIBLE READER */}
      {activeTab === "reader" && (
        <div className="space-y-4">
          <BibleReader
            initialBook={selectedBook}
            initialChapter={selectedChapter}
            initialVerse={selectedVerse}
            onOpenStudyBreakdown={(b, c, v) => {
              fetchStudyBreakdown(b, c, v);
              setActiveTab("study");
            }}
            onShareToFeed={(verseRef, passageText) => {
              window.dispatchEvent(new CustomEvent("open_share_modal", {
                detail: { type: "general", initialContent: "\"" + passageText + "\" — " + verseRef }
              }));
            }}
          />
        </div>
      )}

      {/* TAB 2: PULPIT & SERMONS */}
      {activeTab === "pulpit" && (
        <div className="space-y-4">
          <PodcastFeed 
            onStudyPassage={(scriptureRef) => {
              const spaceIdx = scriptureRef.lastIndexOf(" ");
              if (spaceIdx !== -1) {
                const b = scriptureRef.slice(0, spaceIdx);
                const [c, v] = scriptureRef.slice(spaceIdx + 1).split(":");
                if (b && c) {
                  fetchStudyBreakdown(b, c, v ? v.split("-")[0] : "1");
                  setActiveTab("study");
                }
              }
            }} 
          />
        </div>
      )}

      {/* TAB 3: STUDY ENGINE */}
      {activeTab === "study" && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-amber-400" />
                  <span>Expository Passage Selector</span>
                </h3>
                <p className="text-xs text-slate-400">Choose any scripture to open context, historical setting, and sermons</p>
              </div>

              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-semibold w-fit">
                <button
                  onClick={() => setSelectedTestament("Old Testament")}
                  className={"px-3 py-1.5 rounded-lg transition-all " + (selectedTestament === "Old Testament" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white")}
                >
                  Old Testament
                </button>
                <button
                  onClick={() => setSelectedTestament("New Testament")}
                  className={"px-3 py-1.5 rounded-lg transition-all " + (selectedTestament === "New Testament" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white")}
                >
                  New Testament
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {currentBooks.map(b => (
                  <option key={b.name} value={b.name} className="bg-slate-900 text-white">{b.name}</option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                max="150"
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                placeholder="Chapter"
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />

              <input
                type="number"
                min="1"
                max="176"
                value={selectedVerse}
                onChange={(e) => setSelectedVerse(e.target.value)}
                placeholder="Verse"
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />

              <button
                onClick={() => fetchStudyBreakdown()}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all"
              >
                <Search className="w-4 h-4" />
                <span>Open Passage</span>
              </button>
            </div>
          </div>

          <ChronosDrawer book={selectedBook} chapter={selectedChapter} />

          {studyLoading && (
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-12 text-center space-y-3">
              <Loader className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
              <p className="text-sm text-slate-300">Retrieving expository breakdown for {selectedBook} {selectedChapter}:{selectedVerse}...</p>
            </div>
          )}

          {studyBreakdown && !studyLoading && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="bg-gradient-to-r from-amber-950/60 to-yellow-950/60 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                    Scripture Text (KJV)
                  </span>
                  <span className="text-xs font-semibold text-slate-300">{selectedBook} {selectedChapter}:{selectedVerse}</span>
                </div>
                <p className="text-lg sm:text-xl font-serif text-white italic leading-relaxed pt-1">
                  {studyBreakdown.passageText}
                </p>
              </div>

              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-400">Book Overview</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-400">Author</p>
                    <p className="text-white font-bold mt-0.5">{studyBreakdown.bookSummary?.author}</p>
                  </div>
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-400">Era</p>
                    <p className="text-white font-bold mt-0.5">{studyBreakdown.bookSummary?.era}</p>
                  </div>
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-400">Audience</p>
                    <p className="text-white font-bold mt-0.5">{studyBreakdown.bookSummary?.audience}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-2">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-400">Mindset of the Era</h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{studyBreakdown.historicalContext?.mindsetThen}</p>
                </div>
                <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-2">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-400">Original Purpose</h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{studyBreakdown.historicalContext?.originalIssue}</p>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-400">Daily Life Application</h4>
                <ul className="space-y-2.5 text-xs sm:text-sm">
                  {(studyBreakdown.dailyApplication || []).map((app, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 bg-black/20 p-3 rounded-xl border border-white/5">
                      <span className="w-5 h-5 rounded-full bg-amber-600/80 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-slate-200 leading-relaxed">{app}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {matchingSermons.length > 0 && (
                <div className="bg-slate-900/70 border border-amber-500/30 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                      <Play className="w-4 h-4 text-amber-400 fill-current" />
                      <span>Expositions on {selectedBook} {selectedChapter}:{selectedVerse}</span>
                    </h4>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                      SermonIndex
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {matchingSermons.slice(0, 4).map((s: any) => (
                      <div key={s.id} className="p-3 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{s.title}</p>
                          <p className="text-[11px] text-amber-300 truncate">{s.speaker} {s.duration ? "• " + s.duration : ""}</p>
                        </div>
                        <button
                          onClick={() => setActiveTab("pulpit")}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all flex items-center gap-1 flex-shrink-0"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Pulpit</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleShareStudy}
                className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl text-sm"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Verse & Notes to Feed</span>
              </button>
            </div>
          )}
        </div>
      )}

            {/* TAB 4: COURSES & LESSONS */}
      {activeTab === "courses" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl">
            {/* BREADCRUMBS */}
            <div className="flex items-center gap-2 text-sm font-bold overflow-x-auto whitespace-nowrap scrollbar-hide">
              <button
                onClick={() => { setCourseViewLevel("catalog"); setSelectedCourseObj(null); setSelectedLessonObj(null); }}
                className={`flex items-center gap-1.5 transition-colors ${courseViewLevel === 'catalog' ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Courses</span>
              </button>
              
              {selectedCourseObj && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  <button
                    onClick={() => { setCourseViewLevel("course"); setSelectedLessonObj(null); }}
                    className={`flex items-center gap-1.5 transition-colors ${courseViewLevel === 'course' ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}
                  >
                    <span>{selectedCourseObj.title}</span>
                  </button>
                </>
              )}
              
              {selectedLessonObj && courseViewLevel === 'lesson' && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  <span className="text-amber-400">{selectedLessonObj.title}</span>
                </>
              )}
            </div>
            
            {courseViewLevel === 'catalog' && (
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setCourseDisplayMode("grid")}
                  className={"p-2 rounded-lg transition-all " + (courseDisplayMode === "grid" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCourseDisplayMode("list")}
                  className={"p-2 rounded-lg transition-all " + (courseDisplayMode === "list" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white")}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {loadingCourses ? (
            <div className="flex justify-center py-12">
              <Loader className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          ) : courseViewLevel === "catalog" ? (
            <div className={courseDisplayMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
              {courses.map(course => (
                <div key={course.id} className="bg-slate-900/60 backdrop-blur-md border border-white/10 hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-lg transition-all cursor-pointer group" onClick={() => { setSelectedCourseObj(course); setCourseViewLevel("course"); fetchLessons(course.id); }}>
                  {course.coverImage && (
                    <div className="relative w-full h-44 bg-slate-950 overflow-hidden">
                      <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-white text-base truncate group-hover:text-amber-400 transition-colors">{course.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{course.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : courseViewLevel === "course" && selectedCourseObj ? (
            <div className="space-y-6">
              {/* Course Hero */}
              {selectedCourseObj.coverImage && (
                <div className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <img src={selectedCourseObj.coverImage} alt={selectedCourseObj.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent flex flex-col justify-end p-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">{selectedCourseObj.title}</h2>
                    <p className="text-sm text-slate-300 mt-2 max-w-2xl">{selectedCourseObj.description}</p>
                  </div>
                </div>
              )}
              
              {/* Lessons List */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white mb-2">Lessons</h3>
                {(courseLessons[selectedCourseObj.id] || []).length === 0 ? (
                  <p className="text-sm text-slate-400">No lessons available for this course.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {courseLessons[selectedCourseObj.id].map(lesson => (
                      <button 
                        key={lesson.id} 
                        onClick={() => { setSelectedLessonObj(lesson); setCourseViewLevel("lesson"); }}
                        className="flex flex-col text-left bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-lg transition-all group"
                      >
                        <div className="relative w-full h-32 bg-slate-950 overflow-hidden border-b border-white/5">
                          {selectedCourseObj.coverImage ? (
                            <img src={selectedCourseObj.coverImage} alt="Cover" className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500 group-hover:opacity-70" />
                          ) : (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                              <FileText className="w-8 h-8 text-slate-700" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                          <div className="absolute bottom-3 left-3 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center backdrop-blur-md border border-amber-500/30">
                              {lesson.mediaType === 'youtube' ? <Play className="w-4 h-4 fill-current" /> : lesson.mediaType === 'pdf' ? <FileText className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                            </div>
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                              {lesson.mediaType === 'youtube' ? 'Video' : lesson.mediaType === 'pdf' ? 'PDF Study' : 'Lesson'}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 flex-1">
                          <p className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors line-clamp-2">{lesson.title}</p>
                          {lesson.scriptureRef && <p className="text-xs text-slate-400 mt-1">{lesson.scriptureRef}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : courseViewLevel === "lesson" && selectedLessonObj ? (
            <div className="space-y-4">
              <CompleteLessonCard
                lesson={{
                  id: selectedLessonObj.id,
                  courseId: selectedCourseObj?.id || '',
                  title: selectedLessonObj.title,
                  scriptureRef: selectedLessonObj.scriptureRef,
                  notes: selectedLessonObj.notes,
                  content: selectedLessonObj.content,
                  mediaType: (selectedLessonObj.mediaType as any) || 'none',
                  mediaUrl: selectedLessonObj.mediaUrl,
                  videoPosition: selectedLessonObj.videoPosition || 'top',
                  images: selectedLessonObj.images,
                }}
                courseTitle={selectedCourseObj?.title}
                onOpenStudy={(ref) => {
                  const spaceIdx = ref.lastIndexOf(" ");
                  if (spaceIdx !== -1) {
                    const b = ref.slice(0, spaceIdx);
                    const [c, v] = ref.slice(spaceIdx + 1).split(":");
                    fetchStudyBreakdown(b, c, v);
                    setActiveTab("study");
                  }
                }}
              />
            </div>
          ) : null}
        </div>
      )}
      
      {/* TAB 5: PRAYER WALL */}
      {activeTab === "prayers" && (
        <div className="space-y-4">
          <PrayerWall />
        </div>
      )}
    </div>
  );
}
