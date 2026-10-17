import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Award,
  Sparkles,
  ChevronRight,
  ChevronLeft,
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
  FolderPlus
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

  const isTeacherOrAdmin =
    user?.role === 'teacher' ||
    user?.role === 'admin' ||
    user?.isTeacher ||
    user?.isAdmin ||
    user?.handle?.toLowerCase() === 'tex' ||
    user?.email?.toLowerCase().includes('lightsouttattootex') ||
    user?.email?.toLowerCase().includes('tex@aura.social');

  // Workbooks state
  const [books, setBooks] = useState<WorkbookBook[]>([]);
  const [activeBookId, setActiveBookId] = useState<string>('overcomer');
  const [activeTab, setActiveTab] = useState<'challenges' | 'founder' | 'format' | 'article' | 'grading'>('challenges');
  const [selectedChallengeId, setSelectedChallengeId] = useState<number>(1);
  const [submissions, setSubmissions] = useState<Record<number, WorkbookSubmission>>({});
  const [allSubmissions, setAllSubmissions] = useState<WorkbookSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Student answer state
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>>({});
  const [studentSignature, setStudentSignature] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Teacher grading state
  const [selectedSubmissionToGrade, setSelectedSubmissionToGrade] = useState<WorkbookSubmission | null>(null);
  const [gradeChoice, setGradeChoice] = useState<'approved' | 'needs_revision' | 'exceptional'>('approved');
  const [teacherFeedback, setTeacherFeedback] = useState<string>('');
  const [teacherSignature, setTeacherSignature] = useState<string>(user?.name || 'Challenge Leader');
  const [isGradingSubmitting, setIsGradingSubmitting] = useState<boolean>(false);
  const [gradingFilter, setGradingFilter] = useState<'all' | 'submitted' | 'graded'>('all');

  // Book & Challenge Editing Modals (For Director / Leaders)
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
      if (isTeacherOrAdmin) {
        loadAllSubmissions();
      }
    }
  }, [activeBookId, studentId, isTeacherOrAdmin]);

  const loadWorkbooks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/workbooks');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.workbooks) && data.workbooks.length > 0) {
          setBooks(data.workbooks);
          // If active book no longer exists, select first
          if (!data.workbooks.some((b: WorkbookBook) => b.id === activeBookId)) {
            setActiveBookId(data.workbooks[0].id);
          }
        }
      }
    } catch (e) {
      console.warn('Could not load workbooks', e);
    } finally {
      setIsLoading(false);
    }
  };

  const currentBook: WorkbookBook | undefined = books.find((b) => b.id === activeBookId) || books[0];
  const challengesList: OvercomerChallenge[] = currentBook?.challenges || [];

  // When changing challenges or books, populate inputs
  useEffect(() => {
    if (challengesList.length > 0) {
      if (!challengesList.some((c) => c.id === selectedChallengeId)) {
        setSelectedChallengeId(challengesList[0].id);
      }
    }
  }, [challengesList, selectedChallengeId]);

  useEffect(() => {
    const sub = submissions[selectedChallengeId];
    if (sub) {
      setCurrentAnswers(sub.answers || {});
      setStudentSignature(sub.studentSignature || user?.name || '');
    } else {
      try {
        const localDraft = localStorage.getItem(`aura_overcomer_draft_${activeBookId}_${studentId}_${selectedChallengeId}`);
        if (localDraft) {
          const parsed = JSON.parse(localDraft);
          setCurrentAnswers(parsed.answers || {});
          setStudentSignature(parsed.signature || user?.name || '');
          return;
        }
      } catch {}
      setCurrentAnswers({});
      setStudentSignature(user?.name || '');
    }
  }, [selectedChallengeId, submissions, activeBookId, user]);

  const loadStudentSubmissions = async () => {
    try {
      const res = await fetch(`/api/workbook/my-submissions/${encodeURIComponent(studentId)}?workbookId=${encodeURIComponent(activeBookId)}`);
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
      console.warn('Could not load all submissions for grading', e);
    }
  };

  const currentChallenge: OvercomerChallenge | undefined =
    challengesList.find((c) => c.id === selectedChallengeId) || challengesList[0];
  const currentSub = submissions[selectedChallengeId];

  // Calculate Progress
  const completedCount = challengesList.filter((c) => {
    const s = submissions[c.id];
    return s && (s.status === 'graded' || s.grade === 'approved' || s.grade === 'exceptional' || s.studentSignature);
  }).length;
  const progressPercent = challengesList.length > 0 ? Math.round((completedCount / challengesList.length) * 100) : 0;

  const handleInputChange = (fieldId: string, value: string) => {
    setCurrentAnswers((prev) => {
      const updated = { ...prev, [fieldId]: value };
      try {
        localStorage.setItem(
          `aura_overcomer_draft_${activeBookId}_${studentId}_${selectedChallengeId}`,
          JSON.stringify({ answers: updated, signature: studentSignature })
        );
      } catch {}
      return updated;
    });
  };

  const handleSaveProgress = async (isSubmittingForSignOff: boolean) => {
    setIsSubmitting(true);
    setSaveStatus(null);
    try {
      const res = await fetch('/api/workbook/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workbookId: activeBookId,
          userId: studentId,
          userName: studentName,
          userAvatar: user?.avatarUrl,
          challengeId: selectedChallengeId,
          answers: currentAnswers,
          studentSignature: isSubmittingForSignOff ? (studentSignature.trim() || studentName) : studentSignature.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      soundEffects.playLikeSparkle();
      setSubmissions((prev) => ({
        ...prev,
        [selectedChallengeId]: data.submission
      }));

      setSaveStatus(isSubmittingForSignOff ? '🎉 Submitted to Challenge Leader for sign-off!' : '💾 Progress saved to your account!');
      setTimeout(() => setSaveStatus(null), 4000);

      if (isTeacherOrAdmin) loadAllSubmissions();
    } catch (err: any) {
      setSaveStatus(`⚠️ ${err.message || 'Could not save'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTeacherGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmissionToGrade) return;

    setIsGradingSubmitting(true);
    try {
      const res = await fetch('/api/workbook/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmissionToGrade.id,
          grade: gradeChoice,
          feedback: teacherFeedback,
          teacherId: user?.id || 'tex',
          teacherName: user?.name || 'Pastor Tex',
          teacherSignature: teacherSignature.trim() || user?.name || 'Pastor Tex'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to grade');

      soundEffects.playLikeSparkle();
      setSelectedSubmissionToGrade(null);
      setTeacherFeedback('');
      loadAllSubmissions();
      loadStudentSubmissions();
    } catch (err: any) {
      alert(`Grading failed: ${err.message}`);
    } finally {
      setIsGradingSubmitting(false);
    }
  };

  // Direct Device Upload Handler
  const handleDeviceFileUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  };

  // Challenge Editing Handlers
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
      formFields: [
        {
          id: `c${nextId}_reflection`,
          label: 'Personal Reflection & Application:',
          type: 'textarea',
          placeholder: 'Write your notes and reflections here...'
        }
      ]
    });
    setIsEditingNewChallenge(true);
    setIsEditChallengeOpen(true);
  };

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChallenge || !currentBook) return;

    setIsSavingChallenge(true);
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
      await loadWorkbooks();
      if (editingChallenge.id) {
        setSelectedChallengeId(editingChallenge.id);
      }
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSavingChallenge(false);
    }
  };

  const handleDeleteChallenge = async (chId: number) => {
    if (!confirm(`Are you sure you want to delete Challenge ${chId}?`)) return;
    try {
      const res = await fetch(`/api/workbooks/${activeBookId}/challenges/${chId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        soundEffects.playTap();
        await loadWorkbooks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add field to editing challenge
  const handleAddFormField = () => {
    if (!editingChallenge) return;
    const currentFields = editingChallenge.formFields || [];
    const newFieldId = `field_${Date.now()}`;
    const newField: OvercomerFormField = {
      id: newFieldId,
      label: 'New Reflection Question:',
      type: 'textarea',
      placeholder: 'Enter response...'
    };
    setEditingChallenge({
      ...editingChallenge,
      formFields: [...currentFields, newField]
    });
  };

  const handleRemoveFormField = (index: number) => {
    if (!editingChallenge || !editingChallenge.formFields) return;
    const updated = [...editingChallenge.formFields];
    updated.splice(index, 1);
    setEditingChallenge({ ...editingChallenge, formFields: updated });
  };

  // Create New Book from Template
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim()) return;

    setIsCreatingBook(true);
    try {
      let templateChallenges: OvercomerChallenge[] = [];

      if (newBookTemplate === 'ru_core') {
        // RU Recovery 6-Challenge foundational template
        templateChallenges = [
          {
            id: 1,
            title: 'Challenge 1: Talk... Talk... Talk...',
            subtitle: 'Memorize Program Structure',
            category: 'memorization',
            instructions: 'Memorize: First we talk to God in prayer and testimonies. Second we talk to each other in challenge groups. Finally God talks to us during the message.',
            formFields: [{ id: 'c1_recite', label: 'Write the 3-part format:', type: 'textarea' }]
          },
          {
            id: 2,
            title: 'Challenge 2: Slogan of Truth',
            subtitle: 'Only the Truth Makes Free!',
            category: 'memorization',
            scripture: { reference: 'John 8:32', text: 'And ye shall know the truth, and the truth shall make you free.' },
            instructions: 'Memorize and quote John 8:32.',
            formFields: [{ id: 'c2_meaning', label: 'What does this verse mean to you?', type: 'textarea' }]
          },
          {
            id: 3,
            title: 'Challenge 3: Daily Proverbs Meditation',
            subtitle: 'Wisdom for 3 Days',
            category: 'reading',
            instructions: 'Read 3 chapters of Proverbs and record your meditation.',
            formFields: [
              { id: 'c3_d1', label: 'Day 1 Meditation:', type: 'textarea' },
              { id: 'c3_d2', label: 'Day 2 Meditation:', type: 'textarea' },
              { id: 'c3_d3', label: 'Day 3 Meditation:', type: 'textarea' }
            ]
          }
        ];
      } else if (newBookTemplate === 'discipleship') {
        // Discipleship & Strongholds template
        templateChallenges = [
          {
            id: 1,
            title: 'Chapter 1: Identifying Strongholds',
            subtitle: '2 Corinthians 10:4-5',
            category: 'study',
            scripture: { reference: '2 Corinthians 10:4', text: 'For the weapons of our warfare are not carnal, but mighty through God to the pulling down of strong holds;' },
            instructions: 'Identify stubborn thoughts and patterns contrary to God’s knowledge.',
            formFields: [
              { id: 'c1_stronghold', label: 'What deceptive pattern is God exposing?', type: 'textarea' },
              { id: 'c1_truth', label: 'What specific Scripture breaks this lie?', type: 'textarea' }
            ]
          },
          {
            id: 2,
            title: 'Chapter 2: Walking in Radical Accountability',
            subtitle: 'James 5:16',
            category: 'action',
            instructions: 'Meet with your prayer partner and pray over mutual areas of spiritual growth.',
            formFields: [{ id: 'c2_notes', label: 'Accountability notes and prayer focus:', type: 'textarea' }]
          }
        ];
      }

      const res = await fetch('/api/workbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newBookTitle.trim(),
          subtitle: newBookSubtitle.trim() || undefined,
          author: newBookAuthor.trim() || undefined,
          description: newBookDesc.trim() || undefined,
          coverImage: newBookCover || undefined,
          category: 'RU Recovery Curriculum',
          challenges: templateChallenges
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create book');

      soundEffects.playLikeSparkle();
      setIsNewBookModalOpen(false);
      setNewBookTitle('');
      setNewBookSubtitle('');
      setNewBookCover('');
      await loadWorkbooks();
      if (data.workbook?.id) {
        setActiveBookId(data.workbook.id);
      }
    } catch (err: any) {
      alert(`Creation error: ${err.message}`);
    } finally {
      setIsCreatingBook(false);
    }
  };

  const filteredSubmissions = allSubmissions.filter((s) => {
    if (gradingFilter === 'submitted') return s.status === 'submitted';
    if (gradingFilter === 'graded') return s.status === 'graded';
    return true;
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-16">
      {/* Multi-Book Selector & Director Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-black/40 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Selected Curriculum Book
            </div>
            {/* Book Selector Dropdown */}
            <select
              value={activeBookId}
              onChange={(e) => setActiveBookId(e.target.value)}
              className="bg-transparent text-white font-black text-base sm:text-lg focus:outline-none cursor-pointer"
            >
              {books.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-white font-bold">
                  {b.title} {b.isDefault ? '(Core)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Director / Leader Actions: Add Book & Post Template */}
        {isTeacherOrAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewBookModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <FolderPlus className="w-4 h-4" />
              <span>➕ Add Book / Posting Template</span>
            </button>

            <button
              onClick={openAddNewChallengeModal}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-white/10"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Challenge</span>
            </button>
          </div>
        )}
      </div>

      {/* Course Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950/70 via-slate-900 to-[#070919] border border-amber-500/30 p-6 sm:p-8 shadow-2xl shadow-amber-500/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                <Shield className="w-3.5 h-3.5" />
                {currentBook?.category || 'RU Core Curriculum'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-amber-300 border border-amber-400/30">
                {challengesList.length} Practical Challenges
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Interactive Study & Grading
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {currentBook?.title || 'The Overcomer Workbook'}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {currentBook?.description ||
                'By Steven Curington (1965–2010). The complete original foundational book of the RU Recovery program. Complete each challenge directly in the app, memorize scripture, study God\'s Word, and receive official leader sign-offs.'}
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
              <span>Author: <strong className="text-white">{currentBook?.author || 'Steven Curington (1965-2010)'}</strong></span>
              <span>•</span>
              <span>Key Slogan: <strong className="text-amber-400">"Only the Truth Makes Free!" (John 8:32)</strong></span>
            </div>
          </div>

          {/* Student Progress Badge Card */}
          <div className="bg-black/50 border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center sm:min-w-[240px] shrink-0 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 mb-2">
              <Award className="w-8 h-8 fill-slate-950" />
            </div>
            <div className="text-2xl font-black text-white">{completedCount} / {challengesList.length}</div>
            <div className="text-xs text-slate-400 font-medium mb-3">Challenges Completed</div>

            {/* Progress Bar */}
            <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden mb-2">
              <div
                className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[11px] font-bold text-amber-300">{progressPercent}% to Completion</div>
          </div>
        </div>

        {/* Milestone Milestones Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-white/10 text-xs">
          <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
            completedCount >= 6 ? 'bg-blue-950/40 border-blue-500/50 text-blue-200' : 'bg-white/[0.02] border-white/5 text-slate-500'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              completedCount >= 6 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold">Challenge 6 Milestone</div>
              <div className="text-[10px]">Blue Six-Challenge Badge</div>
            </div>
          </div>

          <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
            completedCount >= 12 ? 'bg-amber-950/40 border-amber-500/50 text-amber-200' : 'bg-white/[0.02] border-white/5 text-slate-500'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              completedCount >= 12 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              <Star className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="font-bold">Challenge 12 Milestone</div>
              <div className="text-[10px]">Twelve-Challenge Pin</div>
            </div>
          </div>

          <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
            completedCount >= challengesList.length && challengesList.length > 0
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-white/[0.02] border-white/5 text-slate-500'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              completedCount >= challengesList.length && challengesList.length > 0
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800 text-slate-400'
            }`}>
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold">Final Graduation</div>
              <div className="text-[10px]">{currentBook?.badgeEarned || 'Course Graduate'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Course Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all ${
            activeTab === 'challenges'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Worksheet Challenges ({challengesList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('founder')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all ${
            activeTab === 'founder'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Founder's Welcome & Story</span>
        </button>

        <button
          onClick={() => setActiveTab('format')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all ${
            activeTab === 'format'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Talk... Talk... Talk... Format</span>
        </button>

        <button
          onClick={() => setActiveTab('article')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all ${
            activeTab === 'article'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>RU vs 12 Steps (Tina Morris)</span>
        </button>

        {isTeacherOrAdmin && (
          <button
            onClick={() => setActiveTab('grading')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all ml-auto ${
              activeTab === 'grading'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Leader Grading Hub ({allSubmissions.filter((s) => s.status === 'submitted').length})</span>
          </button>
        )}
      </div>

      {/* TAB 1: INTERACTIVE CHALLENGES */}
      {activeTab === 'challenges' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Challenge Selector Sidebar */}
          <div className="lg:col-span-4 bg-white/[0.03] border border-white/10 rounded-3xl p-4 space-y-2 max-h-[750px] overflow-y-auto">
            <div className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 flex items-center justify-between">
              <span>{currentBook?.title} Directory</span>
              <span className="text-amber-400">{challengesList.length} Challenges</span>
            </div>

            <div className="space-y-1.5 pt-1">
              {challengesList.map((ch) => {
                const sub = submissions[ch.id];
                const isSelected = ch.id === selectedChallengeId;
                const isApproved = sub?.grade === 'approved' || sub?.grade === 'exceptional';
                const isSubmitted = sub?.status === 'submitted';

                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      soundEffects.playTap();
                      setSelectedChallengeId(ch.id);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/15'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                        isApproved
                          ? 'bg-emerald-500 text-slate-950'
                          : isSubmitted
                          ? 'bg-amber-500 text-slate-950'
                          : isSelected
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {isApproved ? <Check className="w-4 h-4" /> : ch.id}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold truncate">Challenge {ch.id}</span>
                        {isApproved && (
                          <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                            Passed
                          </span>
                        )}
                        {isSubmitted && !isApproved && (
                          <span className="text-[9px] font-black uppercase text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded">
                            In Review
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{ch.title.split(': ')[1] || ch.title}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {isTeacherOrAdmin && (
              <button
                onClick={openAddNewChallengeModal}
                className="w-full mt-3 py-2.5 rounded-xl border border-dashed border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Next Challenge</span>
              </button>
            )}
          </div>

          {/* Active Challenge Interactive Worksheet */}
          {currentChallenge ? (
            <div className="lg:col-span-8 bg-[#090b17] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative">
              {/* Header info */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {currentChallenge.category}
                    </span>

                    {/* Director / Leader Edit Challenge Button */}
                    {isTeacherOrAdmin && (
                      <button
                        onClick={() => openEditChallengeModal(currentChallenge)}
                        className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-amber-300 flex items-center gap-1 border border-white/15 transition-colors"
                        title="Edit challenge text, instructions, and questions"
                      >
                        <Edit3 className="w-3 h-3 text-amber-400" />
                        <span>Edit Challenge</span>
                      </button>
                    )}
                  </div>

                  {currentSub?.grade && (
                    <div className={`px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1.5 ${
                      currentSub.grade === 'approved' || currentSub.grade === 'exceptional'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Status: {currentSub.grade.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white">{currentChallenge.title}</h2>
                {currentChallenge.subtitle && (
                  <p className="text-sm font-semibold text-amber-400/90 mt-1">{currentChallenge.subtitle}</p>
                )}
              </div>

              {/* Scripture Anchor */}
              {currentChallenge.scripture && (
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-200 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                    <span>Scripture Anchor</span>
                    <span className="font-mono">{currentChallenge.scripture.reference} (KJV)</span>
                  </div>
                  <p className="text-xs sm:text-sm italic leading-relaxed text-amber-100">
                    "{currentChallenge.scripture.text}"
                  </p>
                </div>
              )}

              {/* Instructions */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <strong className="text-white block mb-1">Challenge Instructions:</strong>
                {currentChallenge.instructions}
              </div>

              {/* Teacher Feedback Banner (if already graded) */}
              {currentSub?.teacherFeedback && (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Leader Sign-Off & Feedback
                    </span>
                    <span>{currentSub.teacherSignedDate ? new Date(currentSub.teacherSignedDate).toLocaleDateString() : ''}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 italic">"{currentSub.teacherFeedback}"</p>
                  <div className="text-[11px] text-emerald-400 font-bold">
                    Signed: {currentSub.teacherSignature || currentSub.gradedByName || 'Challenge Leader'}
                  </div>
                </div>
              )}

              {/* Form Fields: Fillable Worksheet */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2">
                  Your Responses & Meditations (Type directly below)
                </h3>

                {currentChallenge.formFields.map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-200">
                      {field.label}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={currentAnswers[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || 'Type your reflection or response here...'}
                        rows={field.id.includes('meditation') || field.id.includes('paraphrase') ? 3 : 2}
                        className="w-full bg-black/50 border border-white/15 rounded-2xl px-4 py-3 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:bg-black/70 resize-none transition-colors"
                      />
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={currentAnswers[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className="w-full bg-black/50 border border-white/15 rounded-2xl px-4 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:bg-black/70 transition-colors"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Student Digital Signature */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Student Digital Signature & Pledge
                </label>
                <p className="text-[11px] text-slate-400">
                  By entering your name below, you certify that you have completed this challenge requirement with honesty before God and your leaders.
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={studentSignature}
                    onChange={(e) => setStudentSignature(e.target.value)}
                    placeholder="Enter your full name to sign..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action Feedback */}
              {saveStatus && (
                <div className="p-3 rounded-2xl bg-white/10 border border-white/20 text-xs font-bold text-center text-white animate-in fade-in">
                  {saveStatus}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={selectedChallengeId <= 1}
                    onClick={() => {
                      soundEffects.playTap();
                      setSelectedChallengeId((prev) => Math.max(1, prev - 1));
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-white/10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    disabled={selectedChallengeId >= challengesList.length}
                    onClick={() => {
                      soundEffects.playTap();
                      setSelectedChallengeId((prev) => Math.min(challengesList.length, prev + 1));
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-white/10"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleSaveProgress(false)}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-300" />
                    <span>Save Draft</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveProgress(true)}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit for Leader Sign-Off</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-8 p-12 text-center text-slate-400 bg-white/[0.02] border border-white/5 rounded-3xl">
              No challenges found in this workbook yet. Click "Add Challenge" to create the first one!
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

          <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-[#090b17] border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-xl font-black text-white">{OVERCOMER_CLOSING_NOTE.title}</h2>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {OVERCOMER_CLOSING_NOTE.content}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROGRAM FORMAT (TALK... TALK... TALK...) */}
      {activeTab === 'format' && (
        <div className="bg-[#090b17] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-black text-white">{OVERCOMER_PROGRAM_FORMAT.title}</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              The 3-fold core structure used in every Reformers Unanimous meeting across the nation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {OVERCOMER_PROGRAM_FORMAT.steps.map((st, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500 text-slate-950 uppercase">
                  {st.num}
                </span>
                <h3 className="text-base font-bold text-white pt-1">{st.text}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ARTICLE: RU vs 12 STEPS (Tina Morris) */}
      {activeTab === 'article' && (
        <div className="bg-[#090b17] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
          <div>
            <h2 className="text-2xl font-black text-white">{OVERCOMER_TINA_MORRIS_ARTICLE.title}</h2>
            <p className="text-xs font-bold text-amber-400 mt-1">{OVERCOMER_TINA_MORRIS_ARTICLE.author}</p>
          </div>

          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line space-y-3 border-t border-white/10 pt-4">
            {OVERCOMER_TINA_MORRIS_ARTICLE.content}
          </div>
        </div>
      )}

      {/* TAB 5: LEADER GRADING & REVIEW HUB (Teachers & Admins) */}
      {activeTab === 'grading' && isTeacherOrAdmin && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                Challenge Leader Sign-Off & Grading Portal
              </h2>
              <p className="text-xs text-slate-400">
                Review student answers for <strong>{currentBook?.title}</strong>, write encouragement feedback, and approve challenges.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2 bg-black/40 p-1 rounded-2xl border border-white/10 text-xs font-bold">
              <button
                onClick={() => setGradingFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  gradingFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({allSubmissions.length})
              </button>
              <button
                onClick={() => setGradingFilter('submitted')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  gradingFilter === 'submitted' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pending Review ({allSubmissions.filter((s) => s.status === 'submitted').length})
              </button>
              <button
                onClick={() => setGradingFilter('graded')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  gradingFilter === 'graded' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Completed ({allSubmissions.filter((s) => s.status === 'graded').length})
              </button>
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-white/[0.02] border border-white/5 rounded-3xl">
              No submissions match this filter for {currentBook?.title}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSubmissions.map((sub) => {
                const ch = challengesList.find((c) => c.id === sub.challengeId);
                return (
                  <div
                    key={sub.id}
                    className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                          {sub.userName ? sub.userName[0].toUpperCase() : 'S'}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{sub.userName}</div>
                          <div className="text-[10px] text-slate-400">
                            Challenge {sub.challengeId}: {ch?.title.split(': ')[1] || 'Challenge'}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          sub.grade === 'approved' || sub.grade === 'exceptional'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : sub.status === 'submitted'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {sub.grade || sub.status}
                      </span>
                    </div>

                    {/* Preview of student answers */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-slate-300">
                      {Object.entries(sub.answers).slice(0, 2).map(([k, v]) => (
                        <div key={k} className="truncate">
                          <span className="text-slate-500 font-mono text-[10px]">{k}:</span>{' '}
                          <span className="text-white">{v}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                      <span>Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</span>
                      <button
                        onClick={() => {
                          setSelectedSubmissionToGrade(sub);
                          setGradeChoice(sub.grade || 'approved');
                          setTeacherFeedback(sub.teacherFeedback || '');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Review & Sign Off</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Teacher Grading Modal */}
          {selectedSubmissionToGrade && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-[#090b17] border border-white/15 rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-lg font-black text-white">Review Student Challenge</h3>
                    <p className="text-xs text-slate-400">
                      Student: <strong className="text-white">{selectedSubmissionToGrade.userName}</strong> • Challenge {selectedSubmissionToGrade.challengeId}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSubmissionToGrade(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto p-3 rounded-2xl bg-black/50 border border-white/10 text-xs">
                  <div className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">
                    Student Responses
                  </div>
                  {Object.entries(selectedSubmissionToGrade.answers).map(([key, val]) => (
                    <div key={key} className="space-y-0.5 border-b border-white/5 pb-2">
                      <div className="font-semibold text-slate-400 text-[11px]">{key}</div>
                      <div className="text-white leading-relaxed whitespace-pre-line">{val}</div>
                    </div>
                  ))}
                  {selectedSubmissionToGrade.studentSignature && (
                    <div className="pt-1 text-[11px] text-amber-300">
                      Signed by Student: <strong>{selectedSubmissionToGrade.studentSignature}</strong> on {selectedSubmissionToGrade.studentSignedDate ? new Date(selectedSubmissionToGrade.studentSignedDate).toLocaleDateString() : 'N/A'}
                    </div>
                  )}
                </div>

                <form onSubmit={handleTeacherGrade} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Sign-Off Decision
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setGradeChoice('approved')}
                        className={`py-2 rounded-xl font-bold transition-all border ${
                          gradeChoice === 'approved'
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                            : 'bg-white/5 text-slate-300 border-white/10'
                        }`}
                      >
                        Approved ✅
                      </button>
                      <button
                        type="button"
                        onClick={() => setGradeChoice('exceptional')}
                        className={`py-2 rounded-xl font-bold transition-all border ${
                          gradeChoice === 'exceptional'
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                            : 'bg-white/5 text-slate-300 border-white/10'
                        }`}
                      >
                        Exceptional 🌟
                      </button>
                      <button
                        type="button"
                        onClick={() => setGradeChoice('needs_revision')}
                        className={`py-2 rounded-xl font-bold transition-all border ${
                          gradeChoice === 'needs_revision'
                            ? 'bg-rose-500 text-white border-rose-400 font-black'
                            : 'bg-white/5 text-slate-300 border-white/10'
                        }`}
                      >
                        Needs Revision 📝
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Encouragement & Feedback
                    </label>
                    <textarea
                      value={teacherFeedback}
                      onChange={(e) => setTeacherFeedback(e.target.value)}
                      placeholder="Great job memorizing and applying this truth! Keep pressing forward..."
                      rows={3}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Leader Digital Signature
                    </label>
                    <input
                      type="text"
                      value={teacherSignature}
                      onChange={(e) => setTeacherSignature(e.target.value)}
                      placeholder="e.g. Pastor Tex / Challenge Leader"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSubmissionToGrade(null)}
                      className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isGradingSubmitting}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black transition-colors"
                    >
                      {isGradingSubmitting ? 'Saving...' : 'Sign Off & Approve Challenge'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: EDIT / CREATE CHALLENGE MODAL (DIRECTOR / LEADERS) */}
      {isEditChallengeOpen && editingChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#090b17] border border-amber-500/30 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-400" />
                  {isEditingNewChallenge ? 'Create New Challenge' : `Edit Challenge ${editingChallenge.id}`}
                </h3>
                <p className="text-xs text-slate-400">
                  Update questions, scripture anchor, category, and direct device uploads.
                </p>
              </div>
              <button
                onClick={() => setIsEditChallengeOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveChallenge} className="space-y-4 text-xs">
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

              {/* Scripture Reference & Text */}
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

              {/* Instructions */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Challenge Instructions for Student
                </label>
                <textarea
                  value={editingChallenge.instructions || ''}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, instructions: e.target.value })}
                  rows={3}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* Form Fields Editor */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Form Questions & Inputs
                  </span>
                  <button
                    type="button"
                    onClick={handleAddFormField}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-bold text-[11px] flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Question</span>
                  </button>
                </div>

                {editingChallenge.formFields?.map((field, idx) => (
                  <div
                    key={field.id || idx}
                    className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2 flex items-start gap-2"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => {
                              const updated = [...(editingChallenge.formFields || [])];
                              updated[idx].label = e.target.value;
                              setEditingChallenge({ ...editingChallenge, formFields: updated });
                            }}
                            placeholder="Question label..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <select
                            value={field.type}
                            onChange={(e) => {
                              const updated = [...(editingChallenge.formFields || [])];
                              updated[idx].type = e.target.value as any;
                              setEditingChallenge({ ...editingChallenge, formFields: updated });
                            }}
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400"
                          >
                            <option value="textarea">Paragraph Box</option>
                            <option value="text">Single Line Text</option>
                            <option value="number">Number</option>
                          </select>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={field.placeholder || ''}
                        onChange={(e) => {
                          const updated = [...(editingChallenge.formFields || [])];
                          updated[idx].placeholder = e.target.value;
                          setEditingChallenge({ ...editingChallenge, formFields: updated });
                        }}
                        placeholder="Placeholder helper hint..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFormField(idx)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Remove field"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Direct Device Upload for Challenge Attachment */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 text-[11px] flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    Attach Device Media / Worksheet PDF (Direct from Phone/PC)
                  </span>
                  <input
                    type="file"
                    ref={challengeMediaInputRef}
                    accept="image/*,video/*,audio/*,.pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploadingMedia(true);
                      try {
                        const url = await handleDeviceFileUpload(file);
                        soundEffects.playLikeSparkle();
                        alert(`Uploaded ${file.name} successfully! File attached to instructions.`);
                        setEditingChallenge({
                          ...editingChallenge,
                          instructions: `${editingChallenge.instructions || ''}\n\n[Attached Resource: ${file.name}](${url})`
                        });
                      } catch (err: any) {
                        alert(`Upload failed: ${err.message}`);
                      } finally {
                        setIsUploadingMedia(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={isUploadingMedia}
                    onClick={() => challengeMediaInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{isUploadingMedia ? 'Uploading...' : '📱 Upload from Device'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                {!isEditingNewChallenge && editingChallenge.id && (
                  <button
                    type="button"
                    onClick={() => handleDeleteChallenge(editingChallenge.id!)}
                    className="px-3 py-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 font-bold transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}

                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsEditChallengeOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold hover:bg-white/15 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingChallenge}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition-colors shadow-lg shadow-amber-500/20"
                  >
                    {isSavingChallenge ? 'Saving...' : 'Save Challenge Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW BOOK / POSTING TEMPLATE (DIRECTOR & LEADERS) */}
      {isNewBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#090b17] border border-amber-500/30 rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-amber-400" />
                  Add Future Workbook / Posting Template
                </h3>
                <p className="text-xs text-slate-400">
                  Create a new RU book (e.g. Challenger, Strongholds, or Custom Discipleship Course).
                </p>
              </div>
              <button
                onClick={() => setIsNewBookModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="space-y-4 text-xs">
              {/* Template Picker */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                  Select Posting Template
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewBookTemplate('ru_core');
                      setNewBookTitle('The Challenger Workbook');
                      setNewBookSubtitle('Level 2 RU Recovery Curriculum');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      newBookTemplate === 'ru_core'
                        ? 'bg-amber-500/20 border-amber-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">RU Core Template</div>
                    <div className="text-[10px] text-slate-400 mt-1">Talk format, memory verses, Proverbs reading logs.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewBookTemplate('discipleship');
                      setNewBookTitle('Strongholds: Breaking Every Chain');
                      setNewBookSubtitle('Deep Root Deliverance');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      newBookTemplate === 'discipleship'
                        ? 'bg-amber-500/20 border-amber-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">Strongholds Guide</div>
                    <div className="text-[10px] text-slate-400 mt-1">Chapter study, prayer partners, scripture weapons.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewBookTemplate('custom');
                      setNewBookTitle('');
                      setNewBookSubtitle('');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      newBookTemplate === 'custom'
                        ? 'bg-amber-500/20 border-amber-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">Custom Blank</div>
                    <div className="text-[10px] text-slate-400 mt-1">Build your own book from scratch.</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Book Title
                </label>
                <input
                  type="text"
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  placeholder="e.g. The Challenger Workbook"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={newBookSubtitle}
                  onChange={(e) => setNewBookSubtitle(e.target.value)}
                  placeholder="e.g. RU Level 2 Discipleship Guide"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Author / Director
                </label>
                <input
                  type="text"
                  value={newBookAuthor}
                  onChange={(e) => setNewBookAuthor(e.target.value)}
                  placeholder="e.g. Pastor Tex / Director"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Description / Overview
                </label>
                <textarea
                  value={newBookDesc}
                  onChange={(e) => setNewBookDesc(e.target.value)}
                  placeholder="Brief description of who this book is for and its spiritual goals..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* Direct Device Upload for Cover Image */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <label className="block text-[11px] font-bold text-slate-300">
                  Book Cover Image (Direct Device Upload)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newBookCover}
                    onChange={(e) => setNewBookCover(e.target.value)}
                    placeholder="/uploads/... or paste image URL"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="file"
                    ref={bookCoverInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await handleDeviceFileUpload(file);
                        setNewBookCover(url);
                        soundEffects.playLikeSparkle();
                      } catch (err: any) {
                        alert(`Upload failed: ${err.message}`);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => bookCoverInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Cover</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewBookModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBook || !newBookTitle.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black transition-colors shadow-lg shadow-amber-500/20"
                >
                  {isCreatingBook ? 'Creating Book...' : 'Create Book from Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
