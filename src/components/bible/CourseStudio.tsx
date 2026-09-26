import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Edit3,
  Edit2,
  Trash2,
  Play,
  Loader,
  Video,
  Radio,
  GraduationCap,
  FileText,
  LayoutGrid,
  Image as ImageIcon,
  Sparkles,
  Upload,
  X,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  Globe,
  ExternalLink,
  Check,
  AlignLeft,
  ListOrdered,
  ImagePlus,
  RefreshCw,
  Layers,
  ArrowDownCircle,
  ArrowUpCircle,
  UploadCloud,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { LiveSermonStudio } from './LiveSermonStudio';
import { PodcastLibraryStudio } from './PodcastLibraryStudio';
import { UniversalUnsplashModal } from '../common/UniversalUnsplashModal';
import {
  CompleteLessonCard,
  extractYouTubeId,
  getBibleGatewayUrl,
  splitNotesAndOutline,
} from './LessonContentRenderer';
import { openInAppBrowser } from '../common/InAppBrowser';
import { INITIAL_COURSES, INITIAL_LESSONS } from '../../content/initialCourses';

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
  courseId: string;
  title: string;
  scriptureRef?: string;
  notes?: string;
  content?: string;
  mediaType?: 'youtube' | 'upload' | 'pdf' | 'none';
  mediaUrl?: string;
  videoPosition?: 'top' | 'bottom';
  images?: string;
}

export function CourseStudio({
  onNavigateToCourses,
}: {
  onNavigateToCourses?: () => void;
} = {}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<
    'podcast' | 'create' | 'add-lesson' | 'manage' | 'live'
  >('podcast');

  // Submit loading states
  const [submittingCourse, setSubmittingCourse] = useState(false);
  const [submittingLesson, setSubmittingLesson] = useState(false);
  const [pushingCourseId, setPushingCourseId] = useState<string | null>(null);

  // Notifications and push sync confirmation modal
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pushConfirmation, setPushConfirmation] = useState<{
    isOpen: boolean;
    courseTitle: string;
    courseId: string;
    lessonCount: number;
    message?: string;
  } | null>(null);

  // Image upload target ('notes' for Section 2, 'content' for Section 3)
  const [lessonImageUploadTarget, setLessonImageUploadTarget] = useState<'notes' | 'content'>('content');

  // Unsplash modal state
  const [isUnsplashOpen, setIsUnsplashOpen] = useState(false);
  const [unsplashTarget, setUnsplashTarget] = useState<
    'create-course' | 'edit-course' | 'lesson-notes' | 'lesson-content' | 'lesson-gallery' | null
  >(null);

  // Create Course state
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseCoverPreview, setCourseCoverPreview] = useState('');
  const [courseCategory, setCourseCategory] = useState('Theology');
  const [courseLevel, setCourseLevel] = useState('Beginner');
  const courseFileInputRef = useRef<HTMLInputElement>(null);

  // Add / Edit Lesson state
  const [selectedCourse, setSelectedCourse] = useState('');
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [scriptureRef, setScriptureRef] = useState('');
  const [lessonNotes, setLessonNotes] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [mediaType, setMediaType] = useState<'none' | 'youtube' | 'upload' | 'pdf'>('none');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [videoPosition, setVideoPosition] = useState<'top' | 'bottom'>('top');
  const [lessonImages, setLessonImages] = useState<Array<{ url: string; caption?: string }>>([]);
  const [youtubePreview, setYoutubePreview] = useState('');
  const [lessonFormViewMode, setLessonFormViewMode] = useState<'edit' | 'preview'>('edit');
  const [courseLessons, setCourseLessons] = useState<Record<string, Lesson[]>>({});
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [expandedLessonCardId, setExpandedLessonCardId] = useState<string | null>(null);
  const lessonFileInputRef = useRef<HTMLInputElement>(null);

  // Edit Course Modal state
  const [confirmDeleteCourseId, setConfirmDeleteCourseId] = useState<string | null>(null);
  const [confirmDeleteLessonId, setConfirmDeleteLessonId] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('Theology');
  const [editLevel, setEditLevel] = useState('Beginner');
  const [editCoverPreview, setEditCoverPreview] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bible/courses');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setCourses(data);
        return;
      }
      setCourses(INITIAL_COURSES.map((c) => ({
        id: c.id || c.title,
        title: c.title,
        description: c.description,
        coverImage: c.coverImage,
        category: c.category,
        level: c.level,
        createdAt: '',
        updatedAt: '',
      })));
    } catch (error) {
      console.error('Failed to fetch courses, falling back to code courses:', error);
      setCourses(INITIAL_COURSES.map((c) => ({
        id: c.id || c.title,
        title: c.title,
        description: c.description,
        coverImage: c.coverImage,
        category: c.category,
        level: c.level,
        createdAt: '',
        updatedAt: '',
      })));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!courseTitle.trim() || submittingCourse) return;

    setSubmittingCourse(true);
    try {
      const res = await fetch('/api/bible/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: courseTitle.trim(),
          description: courseDesc.trim(),
          category: courseCategory,
          level: courseLevel,
          coverImage: courseCoverPreview || '',
        }),
      });

      if (res.ok) {
        setCourseTitle('');
        setCourseDesc('');
        setCourseCoverPreview('');
        await fetchCourses();
        setActiveSection('manage');
      }
    } catch (error) {
      console.error('Failed to create course:', error);
    } finally {
      setSubmittingCourse(false);
    }
  };

  const resetLessonForm = () => {
    setEditingLessonId(null);
    setLessonTitle('');
    setScriptureRef('');
    setLessonNotes('');
    setLessonContent('');
    setMediaUrl('');
    setYoutubePreview('');
    setMediaType('none');
    setVideoPosition('top');
    setLessonImages([]);
    setLessonFormViewMode('edit');
  };

  const startEditLesson = (lesson: Lesson, courseId: string, autoFillOutlineIfEmpty = false) => {
    setSelectedCourse(courseId);
    setEditingLessonId(lesson.id);
    setLessonTitle(lesson.title || '');
    setScriptureRef(lesson.scriptureRef || '');

    // Intelligently separate notes and outline if bullets were previously stored in notes
    let initialNotes = lesson.notes || '';
    let initialContent = lesson.content || '';
    if (!initialContent.trim() && initialNotes.trim()) {
      const split = splitNotesAndOutline(initialNotes);
      if (split.outlineText) {
        initialContent = split.outlineText;
        initialNotes = split.scriptureText;
      }
    }

    // If requested and still empty, provide the 6-point outline template
    if (autoFillOutlineIfEmpty && !initialContent.trim()) {
      initialContent = `• 1. The Divine Calling & Foundation
   Expository analysis and scriptural grounding...

• 2. The Word Revealed & Preserved [Romans 8:1-2]
   Historical transmission and theological precision...

• 3. Justification and Covenant Grace
   Deliverance from condemnation and walking in peace...

• 4. The Ministry of the Holy Spirit
   Practical guidance for holy daily living...

• 5. Perseverance Through Trials
   Spiritual fortitude, prayer, and divine protection...

• 6. Consecration & the Eternal Kingdom
   Doxology, commission, and life application...
`;
    }

    setLessonNotes(initialNotes);
    setLessonContent(initialContent);
    setMediaType((lesson.mediaType as any) || 'none');
    setMediaUrl(lesson.mediaUrl || '');
    setVideoPosition(lesson.videoPosition || 'top');

    if (lesson.mediaType === 'youtube' && lesson.mediaUrl) {
      setYoutubePreview(extractYouTubeId(lesson.mediaUrl) || '');
    } else {
      setYoutubePreview('');
    }

    if (lesson.images) {
      try {
        const parsed = JSON.parse(lesson.images);
        if (Array.isArray(parsed)) {
          setLessonImages(
            parsed.map((item) => (typeof item === 'string' ? { url: item } : item))
          );
        }
      } catch {
        setLessonImages(
          lesson.images
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((url) => ({ url }))
        );
      }
    } else {
      setLessonImages([]);
    }

    setLessonFormViewMode('edit');
    setActiveSection('add-lesson');
  };

  const handleSaveLesson = async (andPushToCourses = false) => {
    if (!selectedCourse || !lessonTitle.trim() || submittingLesson) return;

    setSubmittingLesson(true);
    try {
      const payload = {
        title: lessonTitle.trim(),
        scriptureRef: scriptureRef.trim(),
        notes: lessonNotes.trim(),
        content: lessonContent.trim(),
        mediaType,
        mediaUrl: mediaUrl.trim(),
        videoPosition,
        images: lessonImages.length > 0 ? JSON.stringify(lessonImages) : '',
      };

      // Single copy guarantee: check if lesson ID exists or if matching title already exists
      let lessonIdToUpdate = editingLessonId;
      if (!lessonIdToUpdate) {
        const existingLessons = courseLessons[selectedCourse] || [];
        const existingMatch = existingLessons.find(
          (l) => l.title.trim().toLowerCase() === lessonTitle.trim().toLowerCase()
        );
        if (existingMatch) {
          lessonIdToUpdate = existingMatch.id;
        }
      }

      let res: Response;
      if (lessonIdToUpdate) {
        res = await fetch(`/api/bible/lessons/${lessonIdToUpdate}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/bible/courses/${selectedCourse}/lessons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const targetCourseId = selectedCourse;
        const currentCourse = courses.find((c) => c.id === targetCourseId);
        resetLessonForm();

        // Refresh lessons for this course
        const lessonsRes = await fetch(`/api/bible/courses/${targetCourseId}/lessons`);
        const lessonsData = await lessonsRes.json();
        const updatedLessons = lessonsData.lessons || [];
        setCourseLessons((prev) => ({
          ...prev,
          [targetCourseId]: updatedLessons,
        }));
        setExpandedCourseId(targetCourseId);
        setActiveSection('manage');

        if (andPushToCourses) {
          await handlePushToCourses(targetCourseId, currentCourse?.title);
        } else {
          setToastMessage('Lesson saved successfully! (Single copy preserved)');
          setTimeout(() => setToastMessage(null), 3500);
        }
      }
    } catch (error) {
      console.error('Failed to save lesson:', error);
    } finally {
      setSubmittingLesson(false);
    }
  };

  const handlePushToCourses = async (courseId: string, courseTitle?: string) => {
    setPushingCourseId(courseId);
    try {
      const res = await fetch(`/api/bible/courses/${courseId}/push-sync`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        // Broadcast custom events to update courses globally
        window.dispatchEvent(
          new CustomEvent('aura_courses_updated', {
            detail: { courseId, lessonCount: data.lessonCount },
          })
        );
        const resolvedTitle =
          courseTitle || courses.find((c) => c.id === courseId)?.title || 'Course Curriculum';
        setPushConfirmation({
          isOpen: true,
          courseId,
          courseTitle: resolvedTitle,
          lessonCount: data.lessonCount || (courseLessons[courseId] || []).length,
          message: data.message || 'Course and all curriculum lessons pushed live to student Courses!',
        });
      }
    } catch (err) {
      console.error('Failed to push sync course:', err);
    } finally {
      setPushingCourseId(null);
    }
  };

  const handleDeduplicateLessons = async (courseId: string) => {
    try {
      const res = await fetch(`/api/bible/courses/${courseId}/deduplicate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        const lessonsRes = await fetch(`/api/bible/courses/${courseId}/lessons`);
        const lessonsData = await lessonsRes.json();
        setCourseLessons((prev) => ({
          ...prev,
          [courseId]: lessonsData.lessons || [],
        }));
        setToastMessage(data.message || 'Duplicates removed! 1 copy of each lesson retained.');
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error('Failed to deduplicate lessons:', err);
    }
  };

  const fetchCourseLessons = async (courseId: string) => {
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null);
      return;
    }
    try {
      const res = await fetch(`/api/bible/courses/${courseId}/lessons`);
      const data = await res.json();
      if (Array.isArray(data.lessons) && data.lessons.length > 0) {
        setCourseLessons((prev) => ({
          ...prev,
          [courseId]: data.lessons,
        }));
        setExpandedCourseId(courseId);
        return;
      }
      // Fallback
      const targetCourse = courses.find((c) => c.id === courseId);
      const fallback = INITIAL_LESSONS
        .filter((l) =>
          l.courseTitle.trim().toLowerCase() === (targetCourse?.title || '').trim().toLowerCase() ||
          l.id === courseId
        )
        .map((l, idx) => ({
          id: l.id || `static_lesson_${idx}`,
          courseId,
          title: l.title,
          scriptureRef: l.scriptureRef,
          notes: l.notes,
          content: l.content,
          mediaType: l.mediaType || 'none',
          mediaUrl: l.mediaUrl,
          videoPosition: l.videoPosition || 'bottom',
          images: l.images,
          createdAt: '',
          updatedAt: '',
        }));
      setCourseLessons((prev) => ({
        ...prev,
        [courseId]: fallback,
      }));
      setExpandedCourseId(courseId);
    } catch (error) {
      console.error('Failed to fetch lessons, falling back to code lessons:', error);
      const targetCourse = courses.find((c) => c.id === courseId);
      const fallback = INITIAL_LESSONS
        .filter((l) =>
          l.courseTitle.trim().toLowerCase() === (targetCourse?.title || '').trim().toLowerCase() ||
          l.id === courseId
        )
        .map((l, idx) => ({
          id: l.id || `static_lesson_${idx}`,
          courseId,
          title: l.title,
          scriptureRef: l.scriptureRef,
          notes: l.notes,
          content: l.content,
          mediaType: l.mediaType || 'none',
          mediaUrl: l.mediaUrl,
          videoPosition: l.videoPosition || 'bottom',
          images: l.images,
          createdAt: '',
          updatedAt: '',
        }));
      setCourseLessons((prev) => ({
        ...prev,
        [courseId]: fallback,
      }));
      setExpandedCourseId(courseId);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const res = await fetch(`/api/bible/courses/${courseId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCourses((prev) => prev.filter((c) => c.id !== courseId));
      }
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  const handleDeleteLesson = async (lessonId: string, courseId: string) => {
    try {
      const res = await fetch(`/api/bible/lessons/${lessonId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCourseLessons((prev) => ({
          ...prev,
          [courseId]: (prev[courseId] || []).filter((l) => l.id !== lessonId),
        }));
      }
    } catch (error) {
      console.error('Failed to delete lesson:', error);
    }
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setEditTitle(course.title);
    setEditDesc(course.description || '');
    setEditCategory(course.category || 'Theology');
    setEditLevel(course.level || 'Beginner');
    setEditCoverPreview(course.coverImage || '');
  };

  const handleSaveEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || savingEdit) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/bible/courses/${editingCourse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDesc.trim(),
          category: editCategory,
          level: editLevel,
          coverImage: editCoverPreview || '',
        }),
      });

      if (res.ok) {
        setEditingCourse(null);
        await fetchCourses();
      }
    } catch (error) {
      console.error('Failed to update course:', error);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCoverDirectUpload = async (target: 'create' | 'edit', file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/bible/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const url = data.url || data.mediaUrl;
        if (target === 'create') {
          setCourseCoverPreview(url);
        } else {
          setEditCoverPreview(url);
        }
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          if (target === 'create') setCourseCoverPreview(dataUrl);
          else setEditCoverPreview(dataUrl);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Cover upload error:', err);
    }
  };

  const handleSelectUnsplash = (url: string) => {
    if (unsplashTarget === 'create-course') {
      setCourseCoverPreview(url);
    } else if (unsplashTarget === 'edit-course') {
      setEditCoverPreview(url);
    } else if (unsplashTarget === 'lesson-notes') {
      setLessonNotes((prev) => `${prev ? prev + '\n\n' : ''}![Scripture Reference Illustration](${url})\n`);
    } else if (unsplashTarget === 'lesson-content') {
      setLessonContent((prev) => `${prev ? prev + '\n\n' : ''}![Biblical Illustration](${url})\n`);
    } else if (unsplashTarget === 'lesson-gallery') {
      setLessonImages((prev) => [...prev, { url, caption: 'Biblical Illustration' }]);
    }
    setUnsplashTarget(null);
  };

  const handleLessonDirectImageUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/bible/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const url = data.url || data.mediaUrl;
        if (lessonImageUploadTarget === 'notes') {
          setLessonNotes((prev) => `${prev ? prev + '\n\n' : ''}![${file.name}](${url})\n`);
        } else {
          setLessonContent((prev) => `${prev ? prev + '\n\n' : ''}![${file.name}](${url})\n`);
        }
        setLessonImages((prev) => [...prev, { url, caption: file.name }]);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          if (lessonImageUploadTarget === 'notes') {
            setLessonNotes((prev) => `${prev ? prev + '\n\n' : ''}![${file.name}](${dataUrl})\n`);
          } else {
            setLessonContent((prev) => `${prev ? prev + '\n\n' : ''}![${file.name}](${dataUrl})\n`);
          }
          setLessonImages((prev) => [...prev, { url: dataUrl, caption: file.name }]);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Lesson image upload error:', err);
    }
  };

  const handleYoutubePreview = () => {
    const videoId = extractYouTubeId(mediaUrl);
    if (videoId) setYoutubePreview(videoId);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
      {/* Universal Unsplash Picker Modal */}
      <UniversalUnsplashModal
        isOpen={isUnsplashOpen}
        onClose={() => setIsUnsplashOpen(false)}
        onSelect={handleSelectUnsplash}
        title="Select Course Cover Artwork"
        initialQuery="bible theology cross faith church"
      />

      {/* Hidden file inputs for direct cover uploads */}
      <input
        ref={courseFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleCoverDirectUpload('create', file);
        }}
      />
      <input
        ref={editFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleCoverDirectUpload('edit', file);
        }}
      />
      <input
        ref={lessonFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleLessonDirectImageUpload(file);
        }}
      />

      {/* Master 5-Tab Navigation Bar matching 'The Word' */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 overflow-x-auto shadow-xl">
        <button
          type="button"
          onClick={() => setActiveSection('podcast')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeSection === 'podcast'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Podcast & Sermons</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('create')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeSection === 'create'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Create Course</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('add-lesson')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeSection === 'add-lesson'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Add Lesson</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('manage')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeSection === 'manage'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>My Courses ({courses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('live')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ml-auto ${
            activeSection === 'live'
              ? 'bg-rose-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-rose-300'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Live Broadcast</span>
        </button>
      </div>

      {/* SECTION 1: PODCAST & SERMON LIBRARY STUDIO */}
      {activeSection === 'podcast' && (
        <div className="space-y-4">
          <PodcastLibraryStudio courses={courses} />
        </div>
      )}

      {/* SECTION 2: CREATE COURSE */}
      {activeSection === 'create' && (
        <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Create New Bible Course</h2>
                <p className="text-xs text-slate-400">Design a structured discipleship series or topical study</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
              The Word Studio
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Course Title *</label>
            <input
              type="text"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="e.g., The Gospel of John: Expository Discipleship"
              className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description & Objective</label>
            <textarea
              rows={3}
              value={courseDesc}
              onChange={(e) => setCourseDesc(e.target.value)}
              placeholder="Provide a comprehensive course overview, intended audience, and theological focus..."
              className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          {/* Cover Art Selector: Unsplash + Direct File Upload */}
          <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                Course Cover Image
              </span>
              {courseCoverPreview && (
                <button
                  type="button"
                  onClick={() => setCourseCoverPreview('')}
                  className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Remove Cover
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {courseCoverPreview ? (
                <div className="relative w-full sm:w-48 aspect-video rounded-xl overflow-hidden border border-white/20 group shadow-md">
                  <img
                    src={courseCoverPreview}
                    alt="Course Cover Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUnsplashTarget('create-course');
                        setIsUnsplashOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-amber-600 text-white text-[10px] font-bold"
                    >
                      Unsplash
                    </button>
                    <button
                      type="button"
                      onClick={() => courseFileInputRef.current?.click()}
                      className="p-1.5 rounded-lg bg-slate-700 text-white text-[10px] font-bold"
                    >
                      Direct
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full sm:w-48 h-28 rounded-xl border border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <ImageIcon className="w-6 h-6 mb-1 text-slate-500" />
                  <span>No cover selected</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setUnsplashTarget('create-course');
                    setIsUnsplashOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Choose from Unsplash</span>
                </button>

                <button
                  type="button"
                  onClick={() => courseFileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 flex items-center gap-1.5 transition-all"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Direct Image Upload</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
              <select
                value={courseCategory}
                onChange={(e) => setCourseCategory(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Theology">Theology & Doctrine</option>
                <option value="Daily Walk">Christian Living & Walk</option>
                <option value="Gospels">The Four Gospels</option>
                <option value="Old Testament">Old Testament Survey</option>
                <option value="New Testament">New Testament Epistles</option>
                <option value="Prophecy">Eschatology & Prophecy</option>
                <option value="Baptist Heritage">Baptist & Church History</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Level</label>
              <select
                value={courseLevel}
                onChange={(e) => setCourseLevel(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Beginner">Foundational / Beginner</option>
                <option value="Intermediate">Intermediate Discipleship</option>
                <option value="Deep Study">Expository / Deep Study</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateCourse}
            disabled={!courseTitle.trim() || submittingCourse}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {submittingCourse && <Loader className="w-4 h-4 animate-spin" />}
            <span>{submittingCourse ? 'Publishing Course...' : 'Create Course & Begin Curriculum'}</span>
          </button>
        </div>
      )}

      {/* SECTION 3: ADD / EDIT LESSON */}
      {activeSection === 'add-lesson' && (
        <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl">
          {/* Header & Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {editingLessonId ? 'Edit Curriculum Lesson' : 'Add Curriculum Lesson'}
                  </h2>
                  {editingLessonId && (
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Editing Mode
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Compose rich lessons with scriptures, structured outlines, full expositions, images, and video placement.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="flex items-center p-1 bg-black/40 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setLessonFormViewMode('edit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    lessonFormViewMode === 'edit'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLessonFormViewMode('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    lessonFormViewMode === 'preview'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Live Preview</span>
                </button>
              </div>

              {editingLessonId && (
                <button
                  type="button"
                  onClick={resetLessonForm}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1"
                  title="Cancel editing and create new lesson"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cancel</span>
                </button>
              )}
            </div>
          </div>

          {/* VIEW MODE: LIVE STUDENT PREVIEW */}
          {lessonFormViewMode === 'preview' ? (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                <span>
                  💡 This is an exact preview of how students experience this lesson in <strong>The Word</strong>.
                </span>
                <button
                  type="button"
                  onClick={() => setLessonFormViewMode('edit')}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs"
                >
                  Return to Editor
                </button>
              </div>

              <CompleteLessonCard
                lesson={{
                  id: editingLessonId || 'preview-temp',
                  courseId: selectedCourse,
                  title: lessonTitle.trim() || 'Untitled Lesson Preview',
                  scriptureRef: scriptureRef.trim(),
                  notes: lessonNotes.trim(),
                  content: lessonContent.trim(),
                  mediaType,
                  mediaUrl: mediaUrl.trim(),
                  videoPosition,
                  images: lessonImages.length > 0 ? JSON.stringify(lessonImages) : '',
                }}
                courseTitle={courses.find((c) => c.id === selectedCourse)?.title}
                isAuthorView
                onEdit={() => setLessonFormViewMode('edit')}
              />
            </div>
          ) : (
            /* VIEW MODE: FORM EDITOR */
            <div className="space-y-5">
              {/* Course Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Course <span className="text-amber-400">*</span>
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Choose a course for this lesson...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lesson Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lesson Title <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="e.g., Lesson 1: The Incarnation of the Word & The Eternal Light"
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* SECTION 1: SCRIPTURE REFERENCE */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Section 1: Scripture Anchor & Reference
                    </span>
                  </div>
                  {scriptureRef.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        const activeCourseName = courses.find((c) => c.id === selectedCourse)?.title;
                        openInAppBrowser({
                          url: getBibleGatewayUrl(scriptureRef),
                          title: `${scriptureRef} (KJV) - Bible Gateway`,
                          scriptureRef: scriptureRef,
                          version: 'KJV',
                          breadcrumbs: [
                            { label: 'Aura', icon: 'home', tab: 'bible' },
                            { label: 'Course Studio', icon: 'course' },
                            ...(activeCourseName ? [{ label: activeCourseName, icon: 'course' as const }] : []),
                            ...(lessonTitle ? [{ label: lessonTitle, icon: 'course' as const }] : []),
                            { label: `${scriptureRef} (KJV)`, icon: 'verse' as const },
                          ],
                        });
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
                    >
                      <Globe className="w-3 h-3" />
                      <span>Test in In-App Browser (KJV)</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={scriptureRef}
                    onChange={(e) => setScriptureRef(e.target.value)}
                    placeholder="e.g., Romans 8:1-4, John 1:1-14, Genesis 1:1-3"
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    Citations are automatically linked to Bible Gateway and integrated with the interactive verse study explorer.
                  </p>
                </div>
              </div>

              {/* SECTION 2: BIBLE SCRIPTURE PASSAGES & REFERENCES */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Section 2: Bible Scripture Passages & References
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Featured scripture text, translation readings (KJV), and passage references
                  </span>
                </div>

                {/* Section 2 Toolbar (Full parity: media, scripture, quotes, formatting) */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-black/40 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() =>
                      setLessonNotes(
                        (prev) =>
                          `${prev ? prev + '\n\n' : ''}> "There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit." — [Romans 8:1] (KJV)\n`
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-xs font-bold flex items-center gap-1 transition-all border border-amber-500/30"
                  >
                    <span>&gt; Scripture Quote</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLessonNotes((prev) => `${prev ? prev + ' ' : ''}[Romans 8:1-4] (KJV) `)
                    }
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-amber-400 text-xs font-medium transition-all"
                  >
                    + Verse Citation
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLessonNotes(
                        (prev) =>
                          `${prev ? prev + '\n\n' : ''}[Read passage on Bible Gateway](https://www.biblegateway.com/passage/?search=Romans+8%3A1-4&version=KJV)\n`
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-sky-400 text-xs font-medium transition-all"
                  >
                    + Bible Gateway Link
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLessonNotes((prev) => `${prev ? prev + '\n\n' : ''}## Scripture Passage: `)
                    }
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-all"
                  >
                    ## Heading
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLessonImageUploadTarget('notes');
                      setUnsplashTarget('lesson-notes');
                      setIsUnsplashOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 text-xs font-medium flex items-center gap-1 transition-all"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Unsplash Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLessonImageUploadTarget('notes');
                      lessonFileInputRef.current?.click();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium flex items-center gap-1 transition-all"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = window.prompt('Enter image URL:');
                      if (url) {
                        const caption = window.prompt('Caption (optional):') || 'Scripture Reference Illustration';
                        setLessonNotes((prev) => `${prev ? prev + '\n\n' : ''}![${caption}](${url})\n`);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-sky-400 text-xs font-medium flex items-center gap-1 transition-all"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>Image URL</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLessonNotes((prev) => `${prev ? prev + '\n' : ''}• `)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-all"
                  >
                    • Bullet
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const matches = lessonNotes.match(/(?:^|\n)\s*(\d+)\./g);
                      const nextNum = matches ? matches.length + 1 : 1;
                      setLessonNotes((prev) => `${prev ? prev + '\n' : ''}${nextNum}. `);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-all"
                  >
                    + Numbered (1.)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLessonNotes(
                        (prev) =>
                          `${prev ? prev + '\n\n' : ''}• 1. Expository Study Point\n   Detailed commentary notes and reflections...\n`
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 text-xs font-medium transition-all"
                  >
                    + Point Outline
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLessonNotes(
                        (prev) =>
                          `${prev ? prev + '\n\n' : ''}Post: Key Theological Takeaway\nPractical insight and ministry application...\n`
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-400 text-xs font-medium transition-all"
                  >
                    + Post Block
                  </button>
                </div>

                <textarea
                  rows={8}
                  value={lessonNotes}
                  onChange={(e) => setLessonNotes(e.target.value)}
                  placeholder={`Enter the full scripture text and biblical references here (e.g. KJV, ESV)...

Example:
> "There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit." — [Romans 8:1] (KJV)

> "For the law of the Spirit of life in Christ Jesus hath made me free from the law of sin and death." — [Romans 8:2] (KJV)

[Read full context on Bible Gateway](https://www.biblegateway.com/passage/?search=Romans+8&version=KJV)`}
                  className="w-full bg-black/50 border border-white/15 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans text-xs leading-relaxed"
                />
              </div>

              {/* SECTION 3: LESSON OUTLINE, BULLETS & FULL COMMENTARY */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Section 3: Lesson Outline, Study Points & Full Commentary
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Supports unlimited bullets (all 6+ points), multi-paragraph commentary & images
                  </span>
                </div>

                {/* Section 3 Toolbar */}
                <div className="flex flex-wrap items-center gap-2 p-2 bg-black/40 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() =>
                      setLessonContent(
                        (prev) =>
                          `${prev ? prev + '\n\n' : ''}• 1. The Divine Calling & Foundation
   Here begins the first point of expository study. The believer is grounded in divine purpose...

• 2. The Word Revealed & Preserved [Romans 8:1-2]
   Examining the scriptural verification and historical transmission of the text...

• 3. Justification and the Verdict of Grace
   Delving into the doctrine of justification by faith and freedom from legalism...

• 4. The Ministry & Walk of the Holy Spirit
   Practical daily applications for walking according to the Spirit and not the flesh...

• 5. Enduring Trial & Spiritual Warfare
   The perseverance of the saints through covenant faithfulness and prayer...

• 6. Consecration & the Eternal Benediction
   The culminating doxology and commission for every disciple of Christ...
`
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>+ Insert 6-Point Outline Template</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLessonContent((prev) => `${prev ? prev + '\n' : ''}• `)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all"
                  >
                    + Bullet (•)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      // Detect next number
                      const matches = lessonContent.match(/(?:^|\n)\s*(\d+)\./g);
                      const nextNum = matches ? matches.length + 1 : 1;
                      setLessonContent((prev) => `${prev ? prev + '\n' : ''}${nextNum}. `);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all"
                  >
                    + Numbered Item (1.)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLessonImageUploadTarget('content');
                      setUnsplashTarget('lesson-content');
                      setIsUnsplashOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all border border-amber-500/30"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Insert Unsplash Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLessonImageUploadTarget('content');
                      lessonFileInputRef.current?.click();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-white/10"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload Image File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const url = window.prompt('Enter image URL:');
                      if (url) {
                        const caption = window.prompt('Enter image caption (optional):') || 'Biblical Study Illustration';
                        setLessonContent((prev) => `${prev ? prev + '\n\n' : ''}![${caption}](${url})\n`);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-white/10"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                    <span>Image URL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setLessonContent((prev) => `${prev ? prev + '\n\n' : ''}## Study Point: `)
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all"
                  >
                    ## Subheading
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setLessonContent(
                        (prev) =>
                          `${prev ? prev + '\n\n' : ''}> "Verily, verily, I say unto you, He that heareth my word..." — [John 5:24] (KJV)\n`
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 text-xs font-semibold transition-all"
                  >
                    &gt; Scripture Quote
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setLessonContent(
                        (prev) =>
                          `${prev ? prev + '\n\n' : ''}[Read full chapter on Bible Gateway](https://www.biblegateway.com/passage/?search=Romans+8&version=KJV)\n`
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sky-300 text-xs font-semibold transition-all"
                  >
                    Bible Gateway Link
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setLessonContent((prev) => `${prev ? prev + ' ' : ''}[Romans 8:1-4] (KJV) `)
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-400 text-xs font-semibold transition-all"
                  >
                    + Verse Citation
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setLessonContent(
                        (prev) =>
                          `${prev ? prev + '\n\n' : ''}Post: Key Discipleship Takeaway\nDetailed reflection, commentary notes, and application for students...\n`
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-400 text-xs font-semibold transition-all"
                  >
                    + Post Block
                  </button>
                </div>

                {!lessonContent.trim() && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>
                        Ready to add your outline? Click <strong>+ Insert 6-Point Outline Template</strong> to pre-fill all 6 bullets, or type them directly below.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setLessonContent(
                          `• 1. The Divine Calling & Foundation\n   Expository analysis and scriptural grounding...\n\n• 2. The Word Revealed & Preserved [Romans 8:1-2]\n   Historical transmission and theological precision...\n\n• 3. Justification and Covenant Grace\n   Deliverance from condemnation and walking in peace...\n\n• 4. The Ministry of the Holy Spirit\n   Practical guidance for holy daily living...\n\n• 5. Perseverance Through Trials\n   Spiritual fortitude, prayer, and divine protection...\n\n• 6. Consecration & the Eternal Kingdom\n   Doxology, commission, and life application...\n`
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 transition-all shadow-sm"
                    >
                      Pre-fill 6 Bullets
                    </button>
                  </div>
                )}

                <textarea
                  rows={14}
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  placeholder={`Enter your 6-point lesson outline, commentary, and multi-paragraph teaching points here...

Example Structure:
• 1. The Call to Discipleship
   In-depth explanation and foundational principles for point 1...

• 2. The Nature of Faith
   Full commentary and exposition for point 2...

• 3. Covenant Promise & Security
   Detailed theological study for point 3...

• 4. Walking in the Spirit
   Practical application for daily Christian life...

• 5. Spiritual Warfare & Perseverance
   Biblical guidelines and encouragement...

• 6. The Crown of Righteousness
   Concluding benediction and life application...

All 6 bullets, embedded images, and long-form commentary are displayed in full without cutoff.`}
                  className="w-full bg-black/50 border border-white/15 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
                />

                {/* Attached Lesson Images Gallery */}
                {lessonImages.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="font-semibold">Attached Images Gallery ({lessonImages.length})</span>
                      <button
                        type="button"
                        onClick={() => setLessonImages([])}
                        className="text-rose-400 hover:text-rose-300 text-[11px]"
                      >
                        Clear All Images
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {lessonImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="group relative rounded-xl overflow-hidden aspect-video border border-white/15 bg-black"
                        >
                          <img
                            src={img.url}
                            alt={img.caption || `Image ${idx + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setLessonImages((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/70 text-rose-400 hover:bg-rose-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                            title="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {img.caption && (
                            <div className="absolute bottom-0 inset-x-0 bg-black/75 px-2 py-1 text-[10px] text-slate-300 truncate">
                              {img.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: VIDEO & MEDIA ATTACHMENT */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/30 border border-white/10 space-y-4">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Section 4: Video Sermon & Media Attachment
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Media Attachment Type
                  </label>
                  <select
                    value={mediaType}
                    onChange={(e) => {
                      const newType = e.target.value as any;
                      setMediaType(newType);
                      if (newType === 'youtube' && mediaUrl) {
                        const id = extractYouTubeId(mediaUrl);
                        if (id) setYoutubePreview(id);
                      }
                    }}
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="none">Text-Only Study (No Media)</option>
                    <option value="youtube">YouTube Video Sermon</option>
                    <option value="upload">Uploaded Audio / Video File</option>
                    <option value="pdf">External PDF Document</option>
                  </select>
                </div>

                {mediaType !== 'none' && (
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-4">
                    {mediaType === 'youtube' ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            YouTube Video URL
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={mediaUrl}
                              onChange={(e) => {
                                setMediaUrl(e.target.value);
                                const id = extractYouTubeId(e.target.value);
                                if (id) setYoutubePreview(id);
                              }}
                              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                              className="flex-1 bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                            />
                            <button
                              type="button"
                              onClick={handleYoutubePreview}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Preview</span>
                            </button>
                          </div>
                        </div>

                        {youtubePreview && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" /> YouTube Video Recognized (ID: {youtubePreview})
                            </span>
                            <div className="rounded-xl overflow-hidden aspect-video border border-white/20 shadow-lg bg-black">
                              <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube-nocookie.com/embed/${youtubePreview}`}
                                title="YouTube preview"
                                allowFullScreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : mediaType === 'pdf' ? (
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-300">PDF Guide URL</label>
                        <input
                          type="url"
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          placeholder="https://example.com/study-guide.pdf"
                          className="w-full px-3.5 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white text-xs focus:border-amber-500 outline-none"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-300">Upload Media File</label>
                        <input
                          type="file"
                          accept="video/*,audio/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setMediaFile(f);
                          }}
                          className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-500 cursor-pointer"
                        />
                      </div>
                    )}

                    {/* VIDEO PLACEMENT SELECTOR */}
                    {(mediaType === 'youtube' || mediaType === 'upload') && (
                      <div className="pt-3 border-t border-white/10 space-y-2">
                        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                          Video Placement in Lesson
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setVideoPosition('top')}
                            className={`p-3.5 rounded-xl border text-left transition-all ${
                              videoPosition === 'top'
                                ? 'bg-amber-500/15 border-amber-500 shadow-md'
                                : 'bg-black/30 border-white/10 hover:border-white/20 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <ArrowUpCircle
                                className={`w-4 h-4 ${
                                  videoPosition === 'top' ? 'text-amber-400' : 'text-slate-500'
                                }`}
                              />
                              <span
                                className={`text-xs font-bold ${
                                  videoPosition === 'top' ? 'text-white' : 'text-slate-300'
                                }`}
                              >
                                Start / Lead with Video (Top)
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-normal">
                              Video sermon plays prominently at the very top of the lesson before the scripture outline and commentary.
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setVideoPosition('bottom')}
                            className={`p-3.5 rounded-xl border text-left transition-all ${
                              videoPosition === 'bottom'
                                ? 'bg-amber-500/15 border-amber-500 shadow-md'
                                : 'bg-black/30 border-white/10 hover:border-white/20 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <ArrowDownCircle
                                className={`w-4 h-4 ${
                                  videoPosition === 'bottom' ? 'text-amber-400' : 'text-slate-500'
                                }`}
                              />
                              <span
                                className={`text-xs font-bold ${
                                  videoPosition === 'bottom' ? 'text-white' : 'text-slate-300'
                                }`}
                              >
                                Place Video at End of Lesson
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-normal">
                              Students engage with the scripture reference and written outline first, watching the sermon recap at the end.
                            </p>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveLesson(false)}
                  disabled={!selectedCourse || !lessonTitle.trim() || submittingLesson}
                  className="w-full sm:flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {submittingLesson && <Loader className="w-4 h-4 animate-spin" />}
                  <span>
                    {submittingLesson
                      ? 'Saving Lesson...'
                      : editingLessonId
                      ? 'Update Lesson (Single Copy)'
                      : 'Save Lesson (Single Copy)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveLesson(true)}
                  disabled={!selectedCourse || !lessonTitle.trim() || submittingLesson}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-sm border border-amber-500/30 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
                  title="Save this lesson and immediately push & sync it to student Courses"
                >
                  <UploadCloud className="w-4 h-4 text-amber-400" />
                  <span>Save & Push to Courses</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLessonFormViewMode('preview')}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/15 transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>Preview Lesson</span>
                </button>

                {editingLessonId && (
                  <button
                    type="button"
                    onClick={resetLessonForm}
                    className="w-full sm:w-auto px-4 py-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-sm border border-rose-500/20 transition-all"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: MY COURSES */}
      {activeSection === 'manage' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Published Courses & Curriculum
            </h3>
            <button
              type="button"
              onClick={() => setActiveSection('create')}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Course</span>
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader className="w-7 h-7 animate-spin text-amber-500" />
              <p className="text-xs text-slate-400">Loading your courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-12 text-center space-y-3">
              <GraduationCap className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-base font-bold text-white">No courses created yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Begin by creating your first discipleship or expository course using the Create Course tab.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => {
                const lessons = courseLessons[course.id] || [];
                const isExpanded = expandedCourseId === course.id;

                return (
                  <div
                    key={course.id}
                    className="bg-slate-900/80 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-3xl overflow-hidden shadow-xl transition-all"
                  >
                    <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {course.coverImage ? (
                          <img
                            src={course.coverImage}
                            alt={course.title}
                            className="w-20 h-20 rounded-2xl object-cover border border-white/10 flex-shrink-0 shadow-md"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                            <BookOpen className="w-8 h-8" />
                          </div>
                        )}

                        <div className="space-y-1">
                          <h4 className="text-base font-bold text-white">{course.title}</h4>
                          <p className="text-xs text-slate-400 line-clamp-2 max-w-lg">
                            {course.description || 'No description provided.'}
                          </p>

                          <div className="flex items-center gap-2 pt-1">
                            {course.category && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {course.category}
                              </span>
                            )}
                            {course.level && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                {course.level}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handlePushToCourses(course.id, course.title)}
                          disabled={pushingCourseId === course.id}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-all active:scale-95"
                          title="Push and synchronize all lessons live to student Courses tab"
                        >
                          {pushingCourseId === course.id ? (
                            <Loader className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UploadCloud className="w-3.5 h-3.5" />
                          )}
                          <span>Push to Courses</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCourse(course.id);
                            setActiveSection('add-lesson');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                          title="Add Lesson"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Lesson</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fetchCourseLessons(course.id)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
                          title="Toggle Lessons"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(course)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-amber-300 transition-all"
                          title="Edit Course"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {confirmDeleteCourseId === course.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteCourseId(null)}
                              className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleDeleteCourse(course.id);
                                setConfirmDeleteCourseId(null);
                              }}
                              className="px-2 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold"
                            >
                              Confirm
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCourseId(course.id)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all"
                            title="Delete Course"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expandable Lessons list */}
                    {isExpanded && (
                      <div className="border-t border-white/10 bg-black/30 p-5 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Curriculum Lessons ({lessons.length})
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDeduplicateLessons(course.id)}
                              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all border border-white/10"
                              title="Clean duplicate copies of lessons and keep 1 copy"
                            >
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              <span>Clean Duplicates</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePushToCourses(course.id, course.title)}
                              disabled={pushingCourseId === course.id}
                              className="px-2.5 py-1 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all border border-amber-500/40"
                              title="Manually push & sync all lessons to student Courses tab"
                            >
                              {pushingCourseId === course.id ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                <UploadCloud className="w-3 h-3" />
                              )}
                              <span>Push to Courses</span>
                            </button>
                          </div>
                        </div>

                        {lessons.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-2">
                            No lessons added yet. Click &quot;Add Lesson&quot; above to create content for this course.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {lessons.map((lesson) => {
                              const isCardExpanded = expandedLessonCardId === lesson.id;
                              return (
                                <div
                                  key={lesson.id}
                                  className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden transition-all"
                                >
                                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-bold text-white">{lesson.title}</p>
                                        {lesson.mediaType === 'youtube' && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                            <Play className="w-2.5 h-2.5 fill-current" /> YouTube Sermon
                                          </span>
                                        )}
                                        {lesson.mediaType === 'youtube' && lesson.videoPosition && (
                                          <span
                                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                              lesson.videoPosition === 'bottom'
                                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                            }`}
                                          >
                                            {lesson.videoPosition === 'bottom' ? '🏁 End Video' : '🎬 Top Video'}
                                          </span>
                                        )}
                                        {lesson.mediaType === 'pdf' && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                            <FileText className="w-2.5 h-2.5 fill-current" /> PDF Guide
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                        {lesson.scriptureRef && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              openInAppBrowser({
                                                url: getBibleGatewayUrl(lesson.scriptureRef!),
                                                title: `${lesson.scriptureRef} (KJV) - Bible Gateway`,
                                                scriptureRef: lesson.scriptureRef,
                                                version: 'KJV',
                                                breadcrumbs: [
                                                  { label: 'Aura', icon: 'home', tab: 'bible' },
                                                  { label: 'Course Studio', icon: 'course' },
                                                  ...(course?.title ? [{ label: course.title, icon: 'course' as const }] : []),
                                                  { label: lesson.title, icon: 'course' as const },
                                                  { label: `${lesson.scriptureRef} (KJV)`, icon: 'verse' as const },
                                                ],
                                              });
                                            }}
                                            className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 hover:underline font-medium cursor-pointer"
                                          >
                                            <BookOpen className="w-3 h-3" />
                                            <span>{lesson.scriptureRef}</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </button>
                                        )}
                                        {lesson.notes && (
                                          <span className="text-[11px] text-sky-400/90 flex items-center gap-1 font-medium">
                                            <BookOpen className="w-3 h-3 text-sky-400" />
                                            <span>Scripture Passages</span>
                                          </span>
                                        )}
                                        {(lesson.content || (lesson.notes && (lesson.notes.includes('•') || lesson.notes.includes('1.')))) && (
                                          <span className="text-[11px] text-amber-400 flex items-center gap-1 font-bold">
                                            <ListOrdered className="w-3 h-3 text-amber-400" />
                                            <span>Study Outline (6 Points)</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedLessonCardId(isCardExpanded ? null : lesson.id)
                                        }
                                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                          isCardExpanded
                                            ? 'bg-amber-600 text-white shadow-md'
                                            : 'bg-white/10 hover:bg-white/15 text-slate-300'
                                        }`}
                                        title={isCardExpanded ? 'Hide Preview' : 'View Full Lesson'}
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>{isCardExpanded ? 'Collapse' : 'Preview'}</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handlePushToCourses(course.id, `${course.title} — ${lesson.title}`)}
                                        disabled={pushingCourseId === course.id}
                                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all border border-amber-500/30"
                                        title="Manually push & sync this lesson to student Courses"
                                      >
                                        {pushingCourseId === course.id ? (
                                          <Loader className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                                        )}
                                        <span className="hidden sm:inline">Push to Courses</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => startEditLesson(lesson, course.id)}
                                        className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-amber-300 transition-all"
                                        title="Edit Lesson"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>

                                      {confirmDeleteLessonId === lesson.id ? (
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => setConfirmDeleteLessonId(null)}
                                            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px]"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleDeleteLesson(lesson.id, course.id);
                                              setConfirmDeleteLessonId(null);
                                            }}
                                            className="px-2 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold"
                                          >
                                            Confirm
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteLessonId(lesson.id)}
                                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all"
                                          title="Delete Lesson"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Inline Lesson Expansion Preview */}
                                  {isCardExpanded && (
                                    <div className="p-4 border-t border-white/10 bg-black/40">
                                      <CompleteLessonCard
                                        lesson={{
                                          ...lesson,
                                          videoPosition: lesson.videoPosition || 'top',
                                        }}
                                        courseTitle={course.title}
                                        isAuthorView
                                        onEdit={() => startEditLesson(lesson, course.id, !lesson.content && !(lesson.notes && (lesson.notes.includes('•') || lesson.notes.includes('1.'))))}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 5: LIVE SERMON STREAMING */}
      {activeSection === 'live' && (
        <div className="space-y-4">
          <LiveSermonStudio />
        </div>
      )}

      {/* EDIT COURSE MODAL */}
      {editingCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setEditingCourse(null)}
        >
          <div
            className="w-full max-w-lg bg-slate-950 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Edit Course Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Course Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-black/40 border border-white/15 rounded-xl text-white text-sm focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 bg-black/40 border border-white/15 rounded-xl text-white text-sm focus:border-amber-500 outline-none resize-none"
                />
              </div>

              {/* Cover Art in Edit Modal */}
              <div className="p-3 rounded-2xl bg-black/30 border border-white/10 space-y-2">
                <span className="text-xs font-bold text-slate-300">Cover Artwork</span>
                {editCoverPreview && (
                  <div className="w-full h-32 rounded-xl overflow-hidden border border-white/10 relative">
                    <img
                      src={editCoverPreview}
                      alt="Cover"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUnsplashTarget('edit-course');
                      setIsUnsplashOpen(true);
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Unsplash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="flex-1 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3 h-3 text-amber-400" />
                    <span>Direct Upload</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white text-xs focus:border-amber-500 outline-none"
                  >
                    <option value="Theology">Theology</option>
                    <option value="Daily Walk">Daily Walk</option>
                    <option value="Gospels">Gospels</option>
                    <option value="Old Testament">Old Testament</option>
                    <option value="New Testament">New Testament</option>
                    <option value="Baptist Heritage">Baptist Heritage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Level</label>
                  <select
                    value={editLevel}
                    onChange={(e) => setEditLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white text-xs focus:border-amber-500 outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Deep Study">Deep Study</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg transition-all flex items-center gap-1.5"
                >
                  {savingEdit ? <Loader className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PUSH TO COURSES CONFIRMATION MODAL */}
      {pushConfirmation && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setPushConfirmation(null)}
        >
          <div
            className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-white tracking-tight">Curriculum Pushed to Courses!</h3>
              <p className="text-sm font-semibold text-amber-300">
                {pushConfirmation.courseTitle}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                {pushConfirmation.message ||
                  'All lessons have been synchronized. Students can immediately study this lesson curriculum in The Word > Courses.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-300 flex items-center justify-around">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Lessons Synced</span>
                <span className="text-lg font-bold text-amber-400">{pushConfirmation.lessonCount}</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Status</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-center mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live in Courses
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPushConfirmation(null);
                  if (onNavigateToCourses) {
                    onNavigateToCourses();
                  } else {
                    window.dispatchEvent(
                      new CustomEvent('aura_navigate_tab', {
                        detail: { tab: 'bible', subTab: 'courses' },
                      })
                    );
                    window.dispatchEvent(
                      new CustomEvent('switch_study_tab', { detail: { tab: 'courses' } })
                    );
                    window.dispatchEvent(
                      new CustomEvent('aura_switch_study_tab', { detail: { tab: 'courses' } })
                    );
                  }
                }}
                className="w-full sm:flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open in Courses</span>
              </button>

              <button
                type="button"
                onClick={() => setPushConfirmation(null)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs transition-all"
              >
                Stay in Studio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[1000] bg-slate-900/95 border border-amber-500/40 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
