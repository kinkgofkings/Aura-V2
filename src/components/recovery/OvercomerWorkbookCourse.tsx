import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Award,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  FileCheck,
  GraduationCap,
  Clock,
  Send,
  Save,
  MessageSquare,
  Shield,
  Star,
  Users,
  Search,
  Check,
  AlertCircle,
  HelpCircle,
  Flame,
  ArrowRight,
  Calendar,
  Lock,
  Edit3,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  FileText,
  Layers,
  Settings,
  FolderPlus,
  Copy,
  Paperclip,
  Filter,
  Crown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundEffects } from '../../services/audio';
import {
  OVERCOMER_FOUNDER_NOTE,
  OVERCOMER_STEVE_STORY,
  OVERCOMER_PROGRAM_FORMAT,
  OVERCOMER_CLOSING_NOTE,
  OVERCOMER_TINA_MORRIS_ARTICLE
} from '../../content/overcomerWorkbookData';
import { OvercomerChallenge, WorkbookSubmission, WorkbookBook, OvercomerFormField } from '../../types/workbook';

export const OvercomerWorkbookCourse: React.FC = () => {
  const { user } = useAuth();

  // Fine-grained Leader & Director Permissions
  const isDirector =
    user?.role === 'director' ||
    user?.isDirector ||
    (typeof user?.position === 'string' && user.position.toLowerCase().includes('director')) ||
    user?.handle?.toLowerCase() === 'nick' ||
    user?.name?.toLowerCase().includes('nick') ||
    user?.email?.toLowerCase().includes('nick@');

  const isLeader =
    user?.role === 'leader' ||
    user?.isLeader ||
    (typeof user?.position === 'string' && user.position.toLowerCase().includes('leader'));

  const isTeacher =
    user?.role === 'teacher' ||
    user?.isTeacher;

  const isAdmin =
    user?.role === 'admin' ||
    user?.isAdmin ||
    user?.handle?.toLowerCase() === 'tex' ||
    user?.email?.toLowerCase().includes('lightsouttattootex') ||
    user?.email?.toLowerCase().includes('tex@aura.social');

  const canEditCurriculum =
    isAdmin ||
    isDirector ||
    !!user?.permissions?.canEditCurriculum;

  const canGradeWorkbooks =
    isAdmin ||
    isDirector ||
    isLeader ||
    isTeacher ||
    !!user?.permissions?.canGradeWorkbooks;

  const isTeacherOrAdmin = canGradeWorkbooks || canEditCurriculum;

  // Workbooks state
  const [books, setBooks] = useState<WorkbookBook[]>([]);
  const [activeBookId, setActiveBookId] = useState<string>('overcomer');
  const [activeTab, setActiveTab] = useState<'challenges' | 'founder' | 'format' | 'article' | 'grading'>('challenges');
  const [submissions, setSubmissions] = useState<Record<number, WorkbookSubmission>>({});
  const [allSubmissions, setAllSubmissions] = useState<WorkbookSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Accordion & Filter State for Challenges
  const [expandedChallenges, setExpandedChallenges] = useState<Record<number, boolean>>({ 1: true });
  const [challengeSearch, setChallengeSearch] = useState<string>('');
  const [challengeFilter, setChallengeFilter] = useState<'all' | 'completed' | 'in_review' | 'in_progress' | 'not_started'>('all');

  // Multi-challenge Student answers & signatures state
  const [answersByChallenge, setAnswersByChallenge] = useState<Record<number, Record<string, string>>>({});
  const [signaturesByChallenge, setSignaturesByChallenge] = useState<Record<number, string>>({});
  const [mediaByChallenge, setMediaByChallenge] = useState<Record<number, string[]>>({});
  const [saveStatusByChallenge, setSaveStatusByChallenge] = useState<Record<number, string>>({});
  const [submittingChallengeId, setSubmittingChallengeId] = useState<number | null>(null);

  // Teacher grading state
  const [selectedSubmissionToGrade, setSelectedSubmissionToGrade] = useState<WorkbookSubmission | null>(null);
  const [gradeChoice, setGradeChoice] = useState<'approved' | 'needs_revision' | 'exceptional'>('approved');
  const [teacherFeedback, setTeacherFeedback] = useState<string>('');
  const [teacherSignature, setTeacherSignature] = useState<string>(
    user?.position ? `${user.name} (${user.position})` : user?.name || 'Challenge Leader'
  );
  const [isGradingSubmitting, setIsGradingSubmitting] = useState<boolean>(false);
  const [gradingFilter, setGradingFilter] = useState<'all' | 'submitted' | 'graded'>('all');

  // Book & Challenge Editing Modals (For Director Nick & Leaders)
  const [isEditChallengeOpen, setIsEditChallengeOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Partial<OvercomerChallenge> | null>(null);
  const [isEditingNewChallenge, setIsEditingNewChallenge] = useState(false);
  const [isSavingChallenge, setIsSavingChallenge] = useState(false);

  // New Book / Template Modal
  const [isNewBookModalOpen, setIsNewBookModalOpen] = useState(false);
  const [newBookTemplate, setNewBookTemplate] = useState<'ru_core' | 'discipleship' | 'custom'>('ru_core');
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookSubtitle, setNewBookSubtitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState(user?.name || 'RU Recovery Ministry Leader');
  const [newBookDesc, setNewBookDesc] = useState('');
  const [newBookCover, setNewBookCover] = useState('');
  const [isCreatingBook, setIsCreatingBook] = useState(false);

  // Direct Device Upload file input refs
  const challengeMediaInputRef = useRef<HTMLInputElement>(null);
  const challengeItemMediaInputRef = useRef<HTMLInputElement>(null);
  const [activeMediaUploadChallengeId, setActiveMediaUploadChallengeId] = useState<number | null>(null);
  const bookCoverInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const studentId = user?.id || 'guest_student';
  const studentName = user?.name || user?.handle || 'Honored Guest Student';

  useEffect(() => {
    loadWorkbooks();
  }, []);

  useEffect(() => {
    if (activeBookId) {
      loadStudentSubmissions();
      if (canGradeWorkbooks) {
        loadAllSubmissions();
      }
    }
  }, [activeBookId, studentId, canGradeWorkbooks]);

  const loadWorkbooks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/workbooks');
      if (res.ok) {
        const data = await res.json();
        if (data.workbooks && Array.isArray(data.workbooks)) {
          setBooks(data.workbooks);
        }
      }
    } catch (e) {
      console.warn('Could not load workbooks from API, using default', e);
    } finally {
      setIsLoading(false);
    }
  };

  const currentBook: WorkbookBook | undefined = books.find((b) => b.id === activeBookId) || books[0];
  const challengesList: OvercomerChallenge[] = currentBook?.challenges || [];

  // Initialize student answers for each challenge from submissions & local storage
  useEffect(() => {
    if (challengesList.length === 0) return;

    const initialAnswers: Record<number, Record<string, string>> = {};
    const initialSignatures: Record<number, string> = {};
    const initialMedia: Record<number, string[]> = {};

    challengesList.forEach((ch) => {
      const sub = submissions[ch.id];
      if (sub) {
        initialAnswers[ch.id] = sub.answers || {};
        initialSignatures[ch.id] = sub.studentSignature || user?.name || '';
        initialMedia[ch.id] = sub.mediaUrls || [];
      } else {
        try {
          const draftKey = `aura_overcomer_draft_${activeBookId}_${studentId}_${ch.id}`;
          const localDraft = localStorage.getItem(draftKey);
          if (localDraft) {
            const parsed = JSON.parse(localDraft);
            initialAnswers[ch.id] = parsed.answers || {};
            initialSignatures[ch.id] = parsed.signature || user?.name || '';
            initialMedia[ch.id] = parsed.media || [];
          } else {
            initialAnswers[ch.id] = {};
            initialSignatures[ch.id] = user?.name || '';
            initialMedia[ch.id] = [];
          }
        } catch {
          initialAnswers[ch.id] = {};
          initialSignatures[ch.id] = user?.name || '';
          initialMedia[ch.id] = [];
        }
      }
    });

    setAnswersByChallenge(initialAnswers);
    setSignaturesByChallenge(initialSignatures);
    setMediaByChallenge(initialMedia);
  }, [challengesList, submissions, activeBookId, user, studentId]);

  const loadStudentSubmissions = async () => {
    try {
      const res = await fetch(
        `/api/workbook/my-submissions/${encodeURIComponent(studentId)}?workbookId=${encodeURIComponent(activeBookId)}`
      );
      if (res.ok) {
        const data = await res.json();
        const map: Record<number, WorkbookSubmission> = {};
        if (Array.isArray(data.submissions)) {
          data.submissions.forEach((s: WorkbookSubmission) => {
            map[s.challengeId] = s;
          });
        }
        setSubmissions(map);
      }
    } catch (e) {
      console.warn('Could not load workbook submissions', e);
    }
  };

  const loadAllSubmissions = async () => {
    try {
      const res = await fetch(`/api/workbook/submissions?workbookId=${encodeURIComponent(activeBookId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.submissions)) {
          setAllSubmissions(data.submissions);
        }
      }
    } catch (e) {
      console.warn('Could not load all submissions', e);
    }
  };

  const completedCount = challengesList.filter((c) => {
    const s = submissions[c.id];
    return s && (s.grade === 'approved' || s.grade === 'exceptional');
  }).length;

  const inReviewCount = challengesList.filter((c) => {
    const s = submissions[c.id];
    return s && s.status === 'submitted' && !s.grade;
  }).length;

  const progressPercent = challengesList.length > 0 ? Math.round((completedCount / challengesList.length) * 100) : 0;

  // Accordion Toggle Handlers
  const toggleChallengeAccordion = (chId: number) => {
    soundEffects.playTap();
    setExpandedChallenges((prev) => ({
      ...prev,
      [chId]: !prev[chId]
    }));
  };

  const expandAllChallenges = () => {
    soundEffects.playTap();
    const next: Record<number, boolean> = {};
    challengesList.forEach((c) => {
      next[c.id] = true;
    });
    setExpandedChallenges(next);
  };

  const collapseAllChallenges = () => {
    soundEffects.playTap();
    setExpandedChallenges({});
  };

  // Update input for a specific challenge field
  const handleChallengeInputChange = (chId: number, fieldId: string, value: string) => {
    setAnswersByChallenge((prev) => {
      const existing = prev[chId] || {};
      const updated = { ...existing, [fieldId]: value };

      // Local storage auto-save
      try {
        localStorage.setItem(
          `aura_overcomer_draft_${activeBookId}_${studentId}_${chId}`,
          JSON.stringify({
            answers: updated,
            signature: signaturesByChallenge[chId] || user?.name || '',
            media: mediaByChallenge[chId] || []
          })
        );
      } catch {}

      return { ...prev, [chId]: updated };
    });
  };

  const handleSignatureChange = (chId: number, signature: string) => {
    setSignaturesByChallenge((prev) => {
      const updated = { ...prev, [chId]: signature };
      try {
        localStorage.setItem(
          `aura_overcomer_draft_${activeBookId}_${studentId}_${chId}`,
          JSON.stringify({
            answers: answersByChallenge[chId] || {},
            signature,
            media: mediaByChallenge[chId] || []
          })
        );
      } catch {}
      return updated;
    });
  };

  // Save Challenge Progress (Draft or Final Submit)
  const handleSaveChallenge = async (chId: number, isSubmittingForSignOff: boolean) => {
    setSubmittingChallengeId(chId);
    soundEffects.playTap();
    setSaveStatusByChallenge((prev) => ({ ...prev, [chId]: 'Saving...' }));

    try {
      const answers = answersByChallenge[chId] || {};
      const signature = signaturesByChallenge[chId] || user?.name || studentName;
      const media = mediaByChallenge[chId] || [];

      const payload = {
        studentId,
        studentName,
        studentAvatar: user?.avatarUrl,
        workbookId: activeBookId,
        challengeId: chId,
        answers,
        studentSignature: signature,
        mediaUrls: media,
        status: isSubmittingForSignOff ? 'submitted' : 'draft'
      };

      const res = await fetch('/api/workbook/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save');
      }

      const data = await res.json();
      setSubmissions((prev) => ({
        ...prev,
        [chId]: data.submission
      }));

      if (isSubmittingForSignOff) {
        soundEffects.playLevelUp();
        setSaveStatusByChallenge((prev) => ({
          ...prev,
          [chId]: '🎉 Submitted to Challenge Leader & RU Director for sign-off!'
        }));
      } else {
        soundEffects.playLikeSparkle();
        setSaveStatusByChallenge((prev) => ({
          ...prev,
          [chId]: '💾 Progress saved securely to cloud!'
        }));
      }

      setTimeout(() => {
        setSaveStatusByChallenge((prev) => {
          const next = { ...prev };
          delete next[chId];
          return next;
        });
      }, 4000);

      if (canGradeWorkbooks) loadAllSubmissions();
    } catch (err: any) {
      setSaveStatusByChallenge((prev) => ({
        ...prev,
        [chId]: `⚠️ ${err.message || 'Could not save'}`
      }));
    } finally {
      setSubmittingChallengeId(null);
    }
  };

  // Direct Device Upload Handler
  const handleDeviceFileUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('authorId', user?.id || 'tex');

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  };

  // Upload attachment for an individual challenge
  const handleChallengeItemFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const chId = activeMediaUploadChallengeId;
    if (!file || chId === null) return;

    setIsUploadingMedia(true);
    soundEffects.playTap();

    try {
      const url = await handleDeviceFileUpload(file);
      soundEffects.playLikeSparkle();
      setMediaByChallenge((prev) => {
        const currentMedia = prev[chId] || [];
        const updated = [...currentMedia, url];
        try {
          localStorage.setItem(
            `aura_overcomer_draft_${activeBookId}_${studentId}_${chId}`,
            JSON.stringify({
              answers: answersByChallenge[chId] || {},
              signature: signaturesByChallenge[chId] || user?.name || '',
              media: updated
            })
          );
        } catch {}
        return { ...prev, [chId]: updated };
      });
      alert('Media attached successfully! Click "Save Draft" to persist.');
    } catch (err: any) {
      alert(`Media upload failed: ${err.message}`);
    } finally {
      setIsUploadingMedia(false);
      setActiveMediaUploadChallengeId(null);
      if (challengeItemMediaInputRef.current) challengeItemMediaInputRef.current.value = '';
    }
  };

  // Teacher / Director Grade Submission
  const handleGradeSubmission = async () => {
    if (!selectedSubmissionToGrade) return;
    setIsGradingSubmitting(true);
    soundEffects.playTap();

    try {
      const payload = {
        submissionId: selectedSubmissionToGrade.id,
        grade: gradeChoice,
        teacherFeedback: teacherFeedback.trim() || 'Well done, keeping growing in faith and truth!',
        teacherSignature: teacherSignature.trim() || user?.name || 'Challenge Leader',
        gradedByUserId: user?.id || 'tex_leader',
        gradedByName: user?.name || 'Tex / RU Director'
      };

      const res = await fetch('/api/workbook/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to grade submission');
      }

      soundEffects.playLevelUp();
      setSelectedSubmissionToGrade(null);
      setTeacherFeedback('');
      loadStudentSubmissions();
      loadAllSubmissions();
    } catch (err: any) {
      alert(err.message || 'Error grading submission');
    } finally {
      setIsGradingSubmitting(false);
    }
  };

  // Director / Leader Edit Challenge Handlers
  const openEditChallengeModal = (ch: OvercomerChallenge) => {
    setEditingChallenge({ ...ch });
    setIsEditingNewChallenge(false);
    setIsEditChallengeOpen(true);
  };

  const openAddNewChallengeModal = () => {
    const nextId = (challengesList.reduce((max, c) => Math.max(max, c.id), 0) || 0) + 1;
    setEditingChallenge({
      id: nextId,
      title: `Challenge ${nextId}: New Ministry Challenge`,
      subtitle: 'Scripture Meditation & Discipleship',
      category: 'study',
      instructions: 'Read, meditate, and write your responses.',
      scripture: {
        reference: 'Romans 12:2',
        text: 'And be not conformed to this world: but be ye transformed by the renewing of your mind...'
      },
      formFields: [
        {
          id: `ch_${nextId}_q1`,
          label: 'What does this passage reveal to you about God and your recovery?',
          type: 'textarea',
          required: true
        }
      ]
    });
    setIsEditingNewChallenge(true);
    setIsEditChallengeOpen(true);
  };

  const handleSaveChallengeModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChallenge || !currentBook) return;
    setIsSavingChallenge(true);
    soundEffects.playTap();

    try {
      let res;
      if (isEditingNewChallenge) {
        res = await fetch(`/api/workbooks/${currentBook.id}/challenges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingChallenge)
        });
      } else {
        res = await fetch(`/api/workbooks/${currentBook.id}/challenges/${editingChallenge.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingChallenge)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save challenge');

      soundEffects.playLikeSparkle();
      setIsEditChallengeOpen(false);
      loadWorkbooks();
    } catch (err: any) {
      alert(err.message || 'Error saving challenge');
    } finally {
      setIsSavingChallenge(false);
    }
  };

  const handleDeleteChallenge = async (chId: number) => {
    if (!confirm(`Are you sure you want to delete Challenge ${chId}? This cannot be undone.`)) return;
    soundEffects.playTap();
    try {
      const res = await fetch(`/api/workbooks/${activeBookId}/challenges/${chId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete challenge');
      soundEffects.playLikeSparkle();
      loadWorkbooks();
    } catch (err: any) {
      alert(err.message || 'Error deleting challenge');
    }
  };

  // Filter challenges according to search and status pill
  const filteredChallenges = challengesList.filter((ch) => {
    const sub = submissions[ch.id];
    const isApproved = sub?.grade === 'approved' || sub?.grade === 'exceptional';
    const isSubmitted = sub?.status === 'submitted';
    const hasDraft = !isSubmitted && !isApproved && Object.keys(answersByChallenge[ch.id] || {}).length > 0;

    // Filter pill matching
    if (challengeFilter === 'completed' && !isApproved) return false;
    if (challengeFilter === 'in_review' && (!isSubmitted || isApproved)) return false;
    if (challengeFilter === 'in_progress' && (!hasDraft || isSubmitted || isApproved)) return false;
    if (challengeFilter === 'not_started' && (isApproved || isSubmitted || hasDraft)) return false;

    // Search query matching
    if (challengeSearch.trim()) {
      const query = challengeSearch.toLowerCase();
      const inTitle = ch.title.toLowerCase().includes(query);
      const inSub = ch.subtitle?.toLowerCase().includes(query);
      const inScripture = ch.scripture?.reference.toLowerCase().includes(query) || ch.scripture?.text.toLowerCase().includes(query);
      const inQuestions = ch.formFields.some((f) => f.label.toLowerCase().includes(query));
      return inTitle || inSub || inScripture || inQuestions;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Hidden file input for challenge media uploads */}
      <input
        type="file"
        ref={challengeItemMediaInputRef}
        onChange={handleChallengeItemFileUpload}
        className="hidden"
        accept="image/*,audio/*,application/pdf"
      />

      {/* Top Banner: Active Course Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950/60 via-[#0a0c16] to-[#04060c] border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{currentBook?.category || 'RU Core Curriculum'}</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-300 border border-white/10">
                Author: {currentBook?.author || 'Steven Curington'}
              </span>
              {isDirector && (
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                  <Crown className="w-3.5 h-3.5" />
                  <span>RU Director Mode</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {currentBook?.title || 'Overcomer Workbook (Full Course)'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentBook?.description ||
                'By Steven Curington (1965–2010). The foundational interactive curriculum of Reformers Unanimous. Complete each challenge, meditate on Scripture, and receive official leader sign-offs.'}
            </p>
          </div>

          {/* Student Progress Badge */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center min-w-[200px] text-center shrink-0">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Your Course Progress
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {completedCount} / {challengesList.length}
            </div>
            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden mt-2.5">
              <div
                className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[11px] font-bold text-amber-400 mt-2 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>{progressPercent}% Certified Completed</span>
            </div>
          </div>
        </div>

        {/* Director / Leader Actions: Add Book & Post Template */}
        {canEditCurriculum && (
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Director & Leadership Publishing Studio</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsNewBookModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-amber-500/40 transition-colors"
                title="Create a new workbook course using RU templates"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ New Book / Posting Template</span>
              </button>
              <button
                onClick={openAddNewChallengeModal}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/15 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Add Challenge</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Course Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10 scrollbar-hide text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap font-bold transition-all ${
            activeTab === 'challenges'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Interactive Challenges ({challengesList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('founder')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all ${
            activeTab === 'founder'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Founder's Note & RU Story</span>
        </button>

        <button
          onClick={() => setActiveTab('format')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all ${
            activeTab === 'format'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Class Format & Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab('article')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all ${
            activeTab === 'article'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>RU vs 12 Steps (Tina Morris)</span>
        </button>

        {/* Leader & Director Grading Portal Tab: HIDDEN from regular members */}
        {canGradeWorkbooks && (
          <button
            onClick={() => setActiveTab('grading')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all ml-auto ${
              activeTab === 'grading'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-lg shadow-blue-500/20'
                : 'bg-blue-950/30 text-blue-300 border border-blue-500/30 hover:bg-blue-900/40'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Leader / Director Grading ({allSubmissions.filter((s) => s.status === 'submitted' && !s.grade).length} Pending)</span>
          </button>
        )}
      </div>

      {/* TAB 1: INTERACTIVE CHALLENGES (ACCORDION STYLE) */}
      {activeTab === 'challenges' && (
        <div className="space-y-4">
          {/* Controls Bar: Search, Filter Pills & Expand/Collapse All */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={challengeSearch}
                onChange={(e) => setChallengeSearch(e.target.value)}
                placeholder="Search challenges by title, scripture, or keywords..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide text-xs">
              <button
                onClick={() => setChallengeFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  challengeFilter === 'all'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                All ({challengesList.length})
              </button>
              <button
                onClick={() => setChallengeFilter('completed')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  challengeFilter === 'completed'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                Passed ({completedCount})
              </button>
              <button
                onClick={() => setChallengeFilter('in_review')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  challengeFilter === 'in_review'
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                In Review ({inReviewCount})
              </button>
              <button
                onClick={() => setChallengeFilter('not_started')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  challengeFilter === 'not_started'
                    ? 'bg-slate-700 text-white font-black'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                Unstarted
              </button>
            </div>

            {/* Expand / Collapse All Toggle */}
            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <button
                onClick={expandAllChallenges}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors"
                title="Expand all challenge worksheets"
              >
                Expand All
              </button>
              <button
                onClick={collapseAllChallenges}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors"
                title="Collapse all challenges to save screen space"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Accordion List of Challenges */}
          {filteredChallenges.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white/[0.02] border border-white/5 rounded-3xl space-y-2">
              <p>No challenges match your current filter or search criteria.</p>
              <button
                onClick={() => {
                  setChallengeFilter('all');
                  setChallengeSearch('');
                }}
                className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs hover:bg-amber-500/30 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChallenges.map((ch) => {
                const isExpanded = !!expandedChallenges[ch.id];
                const sub = submissions[ch.id];
                const isApproved = sub?.grade === 'approved' || sub?.grade === 'exceptional';
                const isSubmitted = sub?.status === 'submitted' && !isApproved;
                const chAnswers = answersByChallenge[ch.id] || {};
                const hasDraft = !isApproved && !isSubmitted && Object.keys(chAnswers).length > 0;
                const statusMessage = saveStatusByChallenge[ch.id];
                const isSavingThis = submittingChallengeId === ch.id;
                const chMedia = mediaByChallenge[ch.id] || [];

                return (
                  <div
                    key={ch.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isApproved
                        ? 'bg-emerald-950/10 border-emerald-500/30'
                        : isSubmitted
                        ? 'bg-amber-950/15 border-amber-500/30'
                        : isExpanded
                        ? 'bg-[#080a14] border-amber-500/40 shadow-xl shadow-amber-500/5'
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* ACCORDION HEADER (Click to toggle) */}
                    <div
                      onClick={() => toggleChallengeAccordion(ch.id)}
                      className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      {/* Left: Challenge Badge & Title */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-transform ${
                            isApproved
                              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                              : isSubmitted
                              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                              : hasDraft
                              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                              : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          {isApproved ? (
                            <Check className="w-5 h-5 stroke-[3]" />
                          ) : (
                            String(ch.id).padStart(2, '0')
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-white text-sm sm:text-base truncate">
                              {ch.title}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-amber-300 border border-white/10">
                              {ch.category}
                            </span>
                            {isApproved && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Passed</span>
                              </span>
                            )}
                            {isSubmitted && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase text-amber-300 bg-amber-500/20 border border-amber-500/30 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>In Review</span>
                              </span>
                            )}
                            {hasDraft && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-blue-300 bg-blue-500/20">
                                Draft Saved
                              </span>
                            )}
                          </div>
                          {ch.subtitle && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {ch.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Leader Edit Action & Chevron Toggle */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Director / Leader Edit & Delete Buttons */}
                        {canEditCurriculum && (
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => openEditChallengeModal(ch)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-amber-300 hover:text-white transition-colors"
                              title="Edit challenge text, questions, and media"
                            >
                              <Edit3 className="w-4 h-4 text-amber-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteChallenge(ch.id)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
                              title="Delete challenge"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {/* Chevron */}
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-amber-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ACCORDION BODY (Expanded interactive worksheet) */}
                    {isExpanded && (
                      <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-white/10 space-y-5 animate-in fade-in duration-200">
                        {/* Scripture Anchor */}
                        {ch.scripture && (
                          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-200 space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                              <span className="flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Scripture Anchor</span>
                              </span>
                              <span className="font-mono bg-black/40 px-2 py-0.5 rounded">
                                {ch.scripture.reference} (KJV)
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm italic leading-relaxed text-amber-100">
                              "{ch.scripture.text}"
                            </p>
                          </div>
                        )}

                        {/* Challenge Instructions */}
                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs sm:text-sm text-slate-300 leading-relaxed">
                          <strong className="text-white block mb-1">Challenge Instructions:</strong>
                          {ch.instructions}
                        </div>

                        {/* Leader Feedback Banner (if already reviewed / signed off) */}
                        {sub?.teacherFeedback && (
                          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                              <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                Official Leader Sign-Off & Feedback
                              </span>
                              <span>
                                {sub.teacherSignedDate
                                  ? new Date(sub.teacherSignedDate).toLocaleDateString()
                                  : ''}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-200 italic">
                              "{sub.teacherFeedback}"
                            </p>
                            <div className="text-[11px] text-emerald-400 font-bold">
                              Signed: {sub.teacherSignature || sub.gradedByName || 'Challenge Leader'}
                            </div>
                          </div>
                        )}

                        {/* Fillable Worksheet Form Fields */}
                        <div className="space-y-4 pt-1">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2">
                            Student Worksheet & Answers (Type your responses below)
                          </div>

                          {ch.formFields.map((field) => (
                            <div key={field.id} className="space-y-1.5">
                              <label className="block text-xs font-semibold text-slate-200">
                                {field.label}
                              </label>

                              {field.type === 'textarea' ? (
                                <textarea
                                  value={chAnswers[field.id] || ''}
                                  onChange={(e) =>
                                    handleChallengeInputChange(ch.id, field.id, e.target.value)
                                  }
                                  placeholder={field.placeholder || 'Type your reflection or response here...'}
                                  rows={field.id.includes('meditation') || field.id.includes('paraphrase') ? 3 : 2}
                                  className="w-full bg-black/60 border border-white/15 rounded-2xl px-4 py-3 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:bg-black/80 resize-none transition-colors"
                                />
                              ) : (
                                <input
                                  type={field.type === 'number' ? 'number' : 'text'}
                                  value={chAnswers[field.id] || ''}
                                  onChange={(e) =>
                                    handleChallengeInputChange(ch.id, field.id, e.target.value)
                                  }
                                  placeholder={field.placeholder || ''}
                                  className="w-full bg-black/60 border border-white/15 rounded-2xl px-4 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:bg-black/80 transition-colors"
                                />
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Direct Device Media Attachments Area */}
                        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                              <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                              <span>Attached Photos / Audio Notes / Study Files</span>
                            </label>

                            <button
                              type="button"
                              disabled={isUploadingMedia}
                              onClick={() => {
                                setActiveMediaUploadChallengeId(ch.id);
                                if (challengeItemMediaInputRef.current) {
                                  challengeItemMediaInputRef.current.click();
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{isUploadingMedia && activeMediaUploadChallengeId === ch.id ? 'Uploading...' : 'Direct Upload from Device'}</span>
                            </button>
                          </div>

                          {chMedia.length === 0 ? (
                            <p className="text-[11px] text-slate-500 italic">
                              No files attached yet. You can directly upload photos of handwritten notes, voice recordings, or reference PDFs straight from your phone or device.
                            </p>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              {chMedia.map((url, idx) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-amber-300 flex items-center gap-1.5 border border-white/10"
                                >
                                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Attached File #{idx + 1}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Student Digital Signature & Pledge */}
                        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                          <label className="block text-xs font-bold text-slate-300">
                            Student Digital Signature & Pledge
                          </label>
                          <p className="text-[11px] text-slate-400">
                            By typing your name below, you certify that you have completed this challenge requirement with honesty before God and your leaders.
                          </p>
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={signaturesByChallenge[ch.id] || ''}
                              onChange={(e) => handleSignatureChange(ch.id, e.target.value)}
                              placeholder="Enter your full name to sign..."
                              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                            />
                            <span className="text-[11px] text-slate-400 font-mono">
                              {new Date().toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Action Feedback Message */}
                        {statusMessage && (
                          <div className="p-3 rounded-2xl bg-white/10 border border-white/20 text-xs font-bold text-center text-white animate-in fade-in">
                            {statusMessage}
                          </div>
                        )}

                        {/* Worksheet Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => toggleChallengeAccordion(ch.id)}
                              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs transition-colors"
                            >
                              Fold / Close
                            </button>
                          </div>

                          <div className="flex items-center gap-2.5 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => handleSaveChallenge(ch.id, false)}
                              disabled={isSavingThis}
                              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Save className="w-3.5 h-3.5 text-slate-300" />
                              <span>{isSavingThis ? 'Saving...' : 'Save Draft'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSaveChallenge(ch.id, true)}
                              disabled={isSavingThis}
                              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Submit for Leader Sign-Off</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FOUNDER'S NOTE & RU STORY */}
      {activeTab === 'founder' && (
        <div className="space-y-6">
          <div className="bg-[#090b17] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-2xl font-black text-white">{OVERCOMER_FOUNDER_NOTE.title}</h2>
            <div className="text-xs font-bold text-amber-400">{OVERCOMER_FOUNDER_NOTE.author}</div>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line space-y-3">
              {OVERCOMER_FOUNDER_NOTE.content}
            </div>
            <div className="pt-2 text-xs font-bold text-amber-300 italic">
              {OVERCOMER_FOUNDER_NOTE.signoff}
            </div>
          </div>

          <div className="bg-[#090b17] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-2xl font-black text-white">{OVERCOMER_STEVE_STORY.title}</h2>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line space-y-3">
              {OVERCOMER_STEVE_STORY.content}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLASS FORMAT & OVERVIEW */}
      {activeTab === 'format' && (
        <div className="space-y-6">
          <div className="bg-[#090b17] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white">{OVERCOMER_PROGRAM_FORMAT.title}</h2>
              <p className="text-sm text-slate-400 mt-1">
                The threefold Friday night format designed to facilitate personal encounter with God and fellowship.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {OVERCOMER_PROGRAM_FORMAT.steps.map((step) => (
                <div
                  key={step.num}
                  className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 hover:border-amber-500/30 transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center">
                    {step.num}
                  </div>
                  <h3 className="text-base font-black text-white">{step.text}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs sm:text-sm">
              <strong className="text-white block mb-1">{OVERCOMER_CLOSING_NOTE.title}:</strong>
              {OVERCOMER_CLOSING_NOTE.content}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RU VS 12 STEPS COMPARISON ARTICLE */}
      {activeTab === 'article' && (
        <div className="bg-[#090b17] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Theology & Analysis
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
              {OVERCOMER_TINA_MORRIS_ARTICLE.title}
            </h2>
            <div className="text-xs text-slate-400 mt-1">
              By <strong>{OVERCOMER_TINA_MORRIS_ARTICLE.author}</strong> • RU Recovery Ministry
            </div>
          </div>

          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line space-y-4">
            {OVERCOMER_TINA_MORRIS_ARTICLE.content}
          </div>
        </div>
      )}

      {/* TAB 5: LEADER & RU DIRECTOR GRADING PORTAL (HIDDEN FROM REGULAR MEMBERS) */}
      {activeTab === 'grading' && canGradeWorkbooks && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-blue-400" />
                <span>Student Submissions & Leader Review</span>
              </h2>
              <p className="text-xs text-slate-400">
                Review student answers for <strong>{currentBook?.title}</strong>, write encouragement feedback, and approve challenges.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setGradingFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  gradingFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                All ({allSubmissions.length})
              </button>
              <button
                onClick={() => setGradingFilter('submitted')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  gradingFilter === 'submitted'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                Pending Review ({allSubmissions.filter((s) => s.status === 'submitted' && !s.grade).length})
              </button>
              <button
                onClick={() => setGradingFilter('graded')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  gradingFilter === 'graded'
                    ? 'bg-emerald-600 text-white font-black'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                Approved ({allSubmissions.filter((s) => s.grade === 'approved' || s.grade === 'exceptional').length})
              </button>
            </div>
          </div>

          {/* Submissions List */}
          {allSubmissions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white/[0.02] border border-white/5 rounded-3xl">
              No submissions recorded yet for this workbook.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allSubmissions
                .filter((s) => {
                  if (gradingFilter === 'submitted') return s.status === 'submitted' && !s.grade;
                  if (gradingFilter === 'graded') return s.grade === 'approved' || s.grade === 'exceptional';
                  return true;
                })
                .map((sub) => {
                  const ch = challengesList.find((c) => c.id === sub.challengeId);
                  const isPending = sub.status === 'submitted' && !sub.grade;

                  return (
                    <div
                      key={sub.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isPending
                          ? 'bg-amber-950/20 border-amber-500/40 shadow-lg'
                          : sub.grade === 'approved' || sub.grade === 'exceptional'
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-white/[0.03] border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-black text-amber-300">
                          Challenge {sub.challengeId}: {ch?.title.split(': ')[1] || 'Challenge'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            isPending
                              ? 'bg-amber-500 text-slate-950'
                              : sub.grade === 'approved' || sub.grade === 'exceptional'
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          {sub.grade || sub.status}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-white truncate">
                        {sub.studentName || 'Student'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Signed: {sub.studentSignature || 'Yes'} •{' '}
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </div>

                      {/* Answers preview */}
                      <div className="my-3 p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-slate-300 line-clamp-3">
                        {Object.values(sub.answers || {}).filter(Boolean).join(' • ') || 'No written response recorded'}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedSubmissionToGrade(sub);
                          setTeacherFeedback(sub.teacherFeedback || '');
                          setGradeChoice(sub.grade === 'exceptional' ? 'exceptional' : 'approved');
                        }}
                        className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>{sub.grade ? 'Update Grade & Feedback' : 'Review & Sign Off'}</span>
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: EDIT / CREATE CHALLENGE MODAL (DIRECTOR / LEADERS) */}
      {isEditChallengeOpen && editingChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#090b17] border border-amber-500/30 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-400" />
                  {isEditingNewChallenge ? 'Create New Challenge' : `Edit Challenge ${editingChallenge.id}`}
                </h3>
                <p className="text-xs text-slate-400">
                  Update questions, scripture anchor, category, and instructions.
                </p>
              </div>
              <button
                onClick={() => setIsEditChallengeOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveChallengeModalSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Challenge Title
                  </label>
                  <input
                    type="text"
                    value={editingChallenge.title || ''}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, title: e.target.value })}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={editingChallenge.category || 'study'}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, category: e.target.value as any })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="memorization">Memorization</option>
                    <option value="reading">Reading Log / Requirement</option>
                    <option value="attendance">Class / Service Attendance</option>
                    <option value="study">Scripture Study & Dissection</option>
                    <option value="action">Witnessing / Action Step</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Subtitle / Slogan
                </label>
                <input
                  type="text"
                  value={editingChallenge.subtitle || ''}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, subtitle: e.target.value })}
                  placeholder="e.g. Only the Truth Makes Free!"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Scripture Anchor */}
              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                <div className="font-bold text-amber-400 text-[11px]">Scripture Anchor (Optional)</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <input
                      type="text"
                      placeholder="e.g. John 8:32"
                      value={editingChallenge.scripture?.reference || ''}
                      onChange={(e) =>
                        setEditingChallenge({
                          ...editingChallenge,
                          scripture: {
                            reference: e.target.value,
                            text: editingChallenge.scripture?.text || ''
                          }
                        })
                      }
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="e.g. And ye shall know the truth..."
                      value={editingChallenge.scripture?.text || ''}
                      onChange={(e) =>
                        setEditingChallenge({
                          ...editingChallenge,
                          scripture: {
                            reference: editingChallenge.scripture?.reference || '',
                            text: e.target.value
                          }
                        })
                      }
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Instructions for Students
                </label>
                <textarea
                  value={editingChallenge.instructions || ''}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, instructions: e.target.value })}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Questions Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300">
                    Questions & Form Fields ({editingChallenge.formFields?.length || 0})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const fields = editingChallenge.formFields || [];
                      const nextFieldId = `field_${Date.now()}`;
                      setEditingChallenge({
                        ...editingChallenge,
                        formFields: [
                          ...fields,
                          {
                            id: nextFieldId,
                            label: 'New Question / Reflection prompt',
                            type: 'textarea',
                            required: true
                          }
                        ]
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Question</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {editingChallenge.formFields?.map((f, idx) => (
                    <div key={f.id} className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[10px] font-bold text-slate-400">{idx + 1}.</span>
                      <input
                        type="text"
                        value={f.label}
                        onChange={(e) => {
                          const updated = [...(editingChallenge.formFields || [])];
                          updated[idx] = { ...updated[idx], label: e.target.value };
                          setEditingChallenge({ ...editingChallenge, formFields: updated });
                        }}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (editingChallenge.formFields || []).filter((_, i) => i !== idx);
                          setEditingChallenge({ ...editingChallenge, formFields: updated });
                        }}
                        className="p-1 text-rose-400 hover:bg-rose-500/20 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditChallengeOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingChallenge}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingChallenge ? 'Saving...' : 'Save Challenge'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NEW BOOK / POSTING TEMPLATE (DIRECTOR / LEADERS) */}
      {isNewBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#090b17] border border-amber-500/30 rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-amber-400" />
                  <span>Create Future Book or Course</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select a template to generate a complete interactive course with challenges.
                </p>
              </div>
              <button
                onClick={() => setIsNewBookModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newBookTitle.trim()) return;
                setIsCreatingBook(true);
                soundEffects.playTap();

                try {
                  const payload = {
                    title: newBookTitle.trim(),
                    subtitle: newBookSubtitle.trim() || 'Transformational Recovery Study',
                    author: newBookAuthor.trim() || 'RU Recovery Leadership',
                    description: newBookDesc.trim() || 'An official RU curriculum workbook.',
                    coverImage: newBookCover.trim() || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
                    template: newBookTemplate
                  };

                  const res = await fetch('/api/workbooks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });

                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Failed to create book');

                  soundEffects.playLevelUp();
                  setIsNewBookModalOpen(false);
                  loadWorkbooks();
                  if (data.book?.id) {
                    setActiveBookId(data.book.id);
                  }
                } catch (err: any) {
                  alert(err.message || 'Error creating book');
                } finally {
                  setIsCreatingBook(false);
                }
              }}
              className="space-y-4 text-xs"
            >
              {/* Template Choice */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                  Choose Template Base
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewBookTemplate('ru_core')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newBookTemplate === 'ru_core'
                        ? 'bg-amber-500/20 border-amber-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold text-amber-300">RU Core (15 Ch)</div>
                    <div className="text-[10px] text-slate-400 mt-1">Full 15 challenges layout</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewBookTemplate('discipleship')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newBookTemplate === 'discipleship'
                        ? 'bg-amber-500/20 border-amber-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold text-amber-300">Discipleship (10 Ch)</div>
                    <div className="text-[10px] text-slate-400 mt-1">Scripture dissection</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewBookTemplate('custom')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newBookTemplate === 'custom'
                        ? 'bg-amber-500/20 border-amber-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold text-amber-300">Custom Blank</div>
                    <div className="text-[10px] text-slate-400 mt-1">Build from scratch</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Strongholds (Book 2)"
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Walking in Complete Freedom"
                  value={newBookSubtitle}
                  onChange={(e) => setNewBookSubtitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Author Name
                </label>
                <input
                  type="text"
                  value={newBookAuthor}
                  onChange={(e) => setNewBookAuthor(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newBookDesc}
                  onChange={(e) => setNewBookDesc(e.target.value)}
                  rows={2}
                  placeholder="Briefly describe what this curriculum covers..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewBookModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBook}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isCreatingBook ? 'Creating...' : 'Create Book Course'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TEACHER / DIRECTOR SIGN-OFF MODAL */}
      {selectedSubmissionToGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#090b17] border border-blue-500/40 rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-400" />
                  <span>Grade & Sign Off Challenge {selectedSubmissionToGrade.challengeId}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Student: <strong>{selectedSubmissionToGrade.studentName}</strong> • Signed: {selectedSubmissionToGrade.studentSignature || 'Honesty Pledge Signed'}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmissionToGrade(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Student Answers Breakdown */}
            <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-2 max-h-48 overflow-y-auto text-xs">
              <div className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">
                Student Responses:
              </div>
              {Object.entries(selectedSubmissionToGrade.answers || {}).map(([key, val]) => (
                <div key={key} className="space-y-0.5">
                  <div className="font-semibold text-amber-400/90 text-[11px]">{key}:</div>
                  <p className="text-slate-200 italic pl-2 border-l border-white/10">{val}</p>
                </div>
              ))}
            </div>

            {/* Grade Selection */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-300">Grade & Approval Status</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setGradeChoice('approved')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    gradeChoice === 'approved'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  ✓ Approved
                </button>
                <button
                  type="button"
                  onClick={() => setGradeChoice('exceptional')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    gradeChoice === 'exceptional'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  ★ Exceptional
                </button>
                <button
                  type="button"
                  onClick={() => setGradeChoice('needs_revision')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    gradeChoice === 'needs_revision'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-black'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  ↺ Needs Revision
                </button>
              </div>
            </div>

            {/* Feedback textarea */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-300">Leader Encouragement Feedback</label>
              <textarea
                value={teacherFeedback}
                onChange={(e) => setTeacherFeedback(e.target.value)}
                rows={3}
                placeholder="Write an encouraging note or advice to the student..."
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* Leader Digital Signature */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-300">Leader Official Digital Signature</label>
              <input
                type="text"
                value={teacherSignature}
                onChange={(e) => setTeacherSignature(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-400"
              />
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedSubmissionToGrade(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isGradingSubmitting}
                onClick={handleGradeSubmission}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black hover:from-emerald-400 hover:to-teal-400 transition-all shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isGradingSubmitting ? 'Signing Off...' : 'Complete Sign-Off'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
