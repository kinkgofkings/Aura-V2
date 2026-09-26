import React, { useState, useRef, useEffect } from 'react';
import { Play,
  Square,
  Mic,
  Video,
  Download,
  Plus,
  RefreshCw,
  Send,
  BookOpen,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  FolderSync,
  AlertCircle,
  FileVideo,
  Upload,
  Volume2,
  Share2, Image as ImageIcon, Search } from "lucide-react";
import { AsyncMedia } from '../common/AsyncMedia';

interface Sermon {
  id: string;
  title: string;
  scriptureRef?: string;
  speaker?: string;
  channel?: string;
  series?: string;
  seriesPart?: number;
  description?: string;
  mediaUrl?: string;
  mediaType?: 'audio' | 'video';
  duration?: number;
  dateRecorded?: string;
  courseLessonId?: string;
  blob?: Blob;
}

interface Course {
  id: string;
  title: string;
}

interface RecordedDraft {
  blob: Blob;
  previewUrl: string;
  duration: number;
  mimeType: string;
  fileSizeMb: string;
  title: string;
  scriptureRef: string;
  speaker: string;
  channel: string;
  series: string;
  seriesPart: number;
  description: string;
}

export function LiveSermonStudio() {
  const [activeTab, setActiveTab] = useState<'live' | 'archive' | 'upload'>('live');
  const [isLive, setIsLive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [sermonTitle, setSermonTitle] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [channelName, setChannelName] = useState('Aura Community Pulpit');
  const [seriesName, setSeriesName] = useState('');
  const [isSeries, setIsSeries] = useState(false);
  const [seriesPart, setSeriesPart] = useState(1);
  const [selectedExistingSeries, setSelectedExistingSeries] = useState('');
  const [scriptureRef, setScriptureRef] = useState('');
  const [sermonNotes, setSermonNotes] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [showUnsplashPicker, setShowUnsplashPicker] = useState(false);
  const [unsplashQuery, setUnsplashQuery] = useState("worship bible");
  const [unsplashResults, setUnsplashResults] = useState<Array<{ id: string; urls: { regular: string; thumb: string; small: string }; alt_description?: string; user?: { name: string } }>>([]);
  const [isSearchingUnsplash, setIsSearchingUnsplash] = useState(false);

  // Archive view toggle
  const [archiveViewMode, setArchiveViewMode] = useState<'all' | 'containers'>('all');

  const searchUnsplash = async (queryToSearch?: string) => {
    const q = (queryToSearch || unsplashQuery).trim();
    if (!q) return;
    setIsSearchingUnsplash(true);
    try {
      const res = await fetch(`/api/unsplash/search?query=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setUnsplashResults(data.results || []);
      }
    } catch (err) {
      console.error("Image search failed:", err);
    } finally {
      setIsSearchingUnsplash(false);
    }
  };

  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Verification modal state after stopping recording
  const [draftForVerification, setDraftForVerification] = useState<RecordedDraft | null>(null);
  const [isSavingVerification, setIsSavingVerification] = useState(false);

  // Archive view toggle (all vs series containers)
  const [archiveSubView, setArchiveSubView] = useState<'all' | 'containers'>('all');
  const [expandedContainer, setExpandedContainer] = useState<string | null>(null);

  // Push to course modal state
  const [pushingSermon, setPushingSermon] = useState<Sermon | null>(null);
  const [targetCourseId, setTargetCourseId] = useState('');
  const [isPushingToCourse, setIsPushingToCourse] = useState(false);

  // Editing sermon modal state
  const [editingSermon, setEditingSermon] = useState<Sermon | null>(null);

  // Direct file upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSpeaker, setUploadSpeaker] = useState('');
  const [uploadChannel, setUploadChannel] = useState('Aura Community Pulpit');
  const [uploadSeries, setUploadSeries] = useState('');
  const [uploadIsSeries, setUploadIsSeries] = useState(false);
  const [uploadSeriesPart, setUploadSeriesPart] = useState(1);
  const [uploadExistingSeries, setUploadExistingSeries] = useState('');
  const [uploadScripture, setUploadScripture] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');

  // Extract all existing Series Containers from sermons
  const existingSeriesContainers = React.useMemo(() => {
    const map = new Map<string, { count: number; channel?: string; maxPart: number; items: Sermon[] }>();
    sermons.forEach((s) => {
      if (s.series && s.series.trim()) {
        const ser = s.series.trim();
        const cur = map.get(ser) || { count: 0, channel: s.channel, maxPart: 0, items: [] };
        cur.count += 1;
        cur.items.push(s);
        if (s.channel && !cur.channel) cur.channel = s.channel;
        const p = s.seriesPart || cur.count;
        if (p > cur.maxPart) cur.maxPart = p;
        map.set(ser, cur);
      }
    });
    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      channel: data.channel || 'Aura Community Pulpit',
      maxPart: data.maxPart,
      items: data.items.sort((a, b) => (a.seriesPart || 0) - (b.seriesPart || 0))
    }));
  }, [sermons]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Load persistent sermons & courses from SQLite
  const fetchSermons = async () => {
    setLoadingArchive(true);
    try {
      const res = await fetch('/api/bible/sermons');
      if (res.ok) {
        const data = await res.json();
        setSermons(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch sermons:', err);
    } finally {
      setLoadingArchive(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/bible/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  useEffect(() => {
    fetchSermons();
    fetchCourses();
    return () => {
      stopLive();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const [isSyncingYoutube, setIsSyncingYoutube] = useState(false);

  const handleSyncYoutubeFolder = async () => {
    setIsSyncingYoutube(true);
    try {
      const res = await fetch('/api/bible/sermons/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        await fetchSermons();
        if (data.addedCount > 0) {
          showToast(`🎉 Imported ${data.addedCount} new video(s)! Check the sermons & containers below.`);
        } else {
          showToast(`Checked folder (${data.totalFiles} video(s) found, ${data.existingCount} already in database).`);
        }
      } else {
        showToast(data.error || 'Failed to sync YouTube folder', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error connecting to sync service', 'error');
    } finally {
      setIsSyncingYoutube(false);
    }
  };

  const startLive = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Video play error:', e));
      }
      setIsLive(true);
      showToast('Camera and microphone connected. You are ready to record!');
    } catch (error: any) {
      console.error('Failed to access camera/microphone:', error);
      showToast('Unable to access camera or microphone. Please check permissions.', 'error');
    }
  };

  const stopLive = () => {
    if (isRecording) {
      stopRecording();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsLive(false);
    setIsRecording(false);
  };

  const startRecording = () => {
    if (!streamRef.current) {
      showToast('Please start the camera first.', 'error');
      return;
    }

    chunksRef.current = [];
    setRecordingSeconds(0);

    let options: MediaRecorderOptions | undefined = undefined;
    if (typeof MediaRecorder !== 'undefined') {
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        options = { mimeType: 'video/webm;codecs=vp9,opus' };
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        options = { mimeType: 'video/webm;codecs=vp8,opus' };
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options = { mimeType: 'video/webm' };
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        options = { mimeType: 'video/mp4' };
      }
    }

    try {
      const mediaRecorder = options ? new MediaRecorder(streamRef.current, options) : new MediaRecorder(streamRef.current);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        const finalDuration = recordingSeconds;

        const mime = chunksRef.current[0]?.type || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: mime });
        const previewUrl = URL.createObjectURL(blob);
        const sizeMb = (blob.size / (1024 * 1024)).toFixed(2);

        const targetSeries = isSeries ? (selectedExistingSeries || seriesName.trim()) : seriesName.trim();
        const draft: RecordedDraft = {
          blob,
          previewUrl,
          duration: finalDuration || 1,
          mimeType: mime,
          fileSizeMb: sizeMb,
          title: sermonTitle.trim() || `Live Sermon - ${new Date().toLocaleDateString()}`,
          scriptureRef: scriptureRef.trim(),
          speaker: speakerName.trim() || 'Pastor',
          channel: channelName.trim() || 'Aura Community Pulpit',
          series: targetSeries || 'Sunday Live',
          seriesPart: isSeries ? seriesPart : 1,
          description: sermonNotes.trim()
        };

        setDraftForVerification(draft);
        setIsRecording(false);
        showToast('Recording finished! Please verify and approve before sending to Archive.');
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      showToast('Recording started! Speak clearly into the microphone.');
    } catch (err: any) {
      console.error('Failed to create MediaRecorder:', err);
      showToast('Could not initialize recording: ' + err.message, 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
        }
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping recorder:', e);
      }
    }
  };

  // Submit verified draft to database archive
  const handleConfirmAndSaveToArchive = async () => {
    if (!draftForVerification) return;
    setIsSavingVerification(true);

    try {
      const ext = draftForVerification.mimeType.includes('mp4') ? 'mp4' : 'webm';
      const cleanTitle = draftForVerification.title.trim() || `Live Sermon - ${new Date().toLocaleDateString()}`;

      const formData = new FormData();
      formData.append('file', draftForVerification.blob, `${cleanTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`);
      formData.append('title', cleanTitle);
      formData.append('scriptureRef', draftForVerification.scriptureRef || '');
      formData.append('speaker', draftForVerification.speaker || 'Pastor');
      formData.append('channel', draftForVerification.channel || channelName || 'Aura Community Pulpit');
      formData.append('series', draftForVerification.series || 'Sunday Live');
      formData.append('seriesPart', (draftForVerification.seriesPart || 1).toString());
      formData.append('description', draftForVerification.description || '');
      formData.append('duration', draftForVerification.duration.toString());
      formData.append('mediaType', 'video');
      if (thumbnailUrl) formData.append('thumbnailUrl', thumbnailUrl);

      const res = await fetch('/api/bible/media/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        if (data.sermon) {
          setSermons(prev => [data.sermon, ...prev.filter(s => s.id !== data.sermon.id)]);
          setSelectedSermon(data.sermon);
          showToast(`Sermon "${cleanTitle}" successfully verified and saved to Archives!`);
          
          // Cleanup draft
          URL.revokeObjectURL(draftForVerification.previewUrl);
          setDraftForVerification(null);
          setSermonTitle('');
          setScriptureRef('');
          setSpeakerName('');
          setSeriesName('');
          setIsSeries(false);
          setSelectedExistingSeries('');
          setSermonNotes('');
          setActiveTab('archive');
        }
      } else {
        showToast('Failed to save verified sermon to database.', 'error');
      }
    } catch (err) {
      console.error('Save to archive failed:', err);
      showToast('Error uploading verified sermon recording.', 'error');
    } finally {
      setIsSavingVerification(false);
    }
  };

  const handleDiscardDraft = () => {
    if (confirm('Are you sure you want to discard this recording? This action cannot be undone.')) {
      if (draftForVerification?.previewUrl) {
        URL.revokeObjectURL(draftForVerification.previewUrl);
      }
      setDraftForVerification(null);
      showToast('Draft discarded.');
    }
  };

  const handleDownloadDraft = () => {
    if (!draftForVerification) return;
    const ext = draftForVerification.mimeType.includes('mp4') ? 'mp4' : 'webm';
    const a = document.createElement('a');
    a.href = draftForVerification.previewUrl;
    a.download = `${draftForVerification.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Video download initiated.');
  };

  // Push sermon straight to Scripture Tab -> Podcasts & Sermons
  const handlePushToScripturesTab = (sermon: Sermon) => {
    // Navigate straight to the Scriptures Tab and select the Podcasts & Sermons subtab
    window.dispatchEvent(new CustomEvent('navigate_tab', { detail: { tab: 'bible' } }));
    showToast(`"${sermon.title}" is live in the Scripture tab under Podcasts & Sermons!`);
  };

  // Push sermon into a Course Lesson
  const handlePushToCourse = async () => {
    if (!pushingSermon || !targetCourseId) return;
    setIsPushingToCourse(true);
    try {
      const res = await fetch(`/api/bible/sermons/${pushingSermon.id}/push-to-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: targetCourseId,
          lessonTitle: pushingSermon.title
        })
      });
      if (res.ok) {
        showToast(`Sermon successfully attached as a lesson to your course!`);
        setPushingSermon(null);
        setTargetCourseId('');
        fetchSermons();
      } else {
        showToast('Failed to attach sermon to course.', 'error');
      }
    } catch (err) {
      console.error('Failed to push sermon to course:', err);
      showToast('Failed to push sermon to course.', 'error');
    } finally {
      setIsPushingToCourse(false);
    }
  };

  // Update sermon metadata
  const handleUpdateSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSermon) return;
    try {
      const res = await fetch(`/api/bible/sermons/${editingSermon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingSermon.title,
          speaker: editingSermon.speaker,
          channel: editingSermon.channel,
          series: editingSermon.series,
          seriesPart: editingSermon.seriesPart ? parseInt(editingSermon.seriesPart.toString(), 10) : undefined,
          scriptureRef: editingSermon.scriptureRef,
          description: editingSermon.description
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setSermons(prev => prev.map(s => s.id === updated.id ? updated : s));
        showToast('Sermon updated successfully!');
        setEditingSermon(null);
      }
    } catch (err) {
      console.error('Failed to update sermon:', err);
      showToast('Failed to update sermon.', 'error');
    }
  };

  // Delete sermon
  const handleDeleteSermon = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}" from the archive?`)) return;
    try {
      const res = await fetch(`/api/bible/sermons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSermons(prev => prev.filter(s => s.id !== id));
        if (selectedSermon?.id === id) setSelectedSermon(null);
        showToast('Sermon deleted from archive.');
      }
    } catch (err) {
      console.error('Failed to delete sermon:', err);
      showToast('Failed to delete sermon.', 'error');
    }
  };

  // Direct file upload
  const handleDirectUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast('Please select a media file to upload.', 'error');
      return;
    }

    setUploadProgress(true);
    try {
      const activeUploadSeries = uploadIsSeries ? (uploadExistingSeries || uploadSeries) : uploadSeries;
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle || uploadFile.name.replace(/\.[^/.]+$/, ''));
      formData.append('speaker', uploadSpeaker);
      formData.append('channel', uploadChannel || 'Aura Community Pulpit');
      formData.append('series', activeUploadSeries || 'Sunday Archive');
      formData.append('seriesPart', (uploadIsSeries ? uploadSeriesPart : 1).toString());
      formData.append('scriptureRef', uploadScripture);
      formData.append('description', uploadDescription);
      if (thumbnailUrl) formData.append('thumbnailUrl', thumbnailUrl);

      const res = await fetch('/api/bible/media/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        if (data.sermon) {
          setSermons(prev => [data.sermon, ...prev.filter(s => s.id !== data.sermon.id)]);
          showToast(`"${data.sermon.title}" uploaded to archive & ready for scriptures tab!`);
          setUploadFile(null);
          setUploadTitle('');
          setUploadSpeaker('');
          setUploadChannel('Aura Community Pulpit');
          setUploadSeries('');
          setUploadIsSeries(false);
          setUploadExistingSeries('');
          setUploadSeriesPart(1);
          setUploadScripture('');
          setUploadDescription('');
          setActiveTab('archive');
        }
      } else {
        showToast('Upload failed.', 'error');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      showToast('Failed to upload file.', 'error');
    } finally {
      setUploadProgress(false);
    }
  };

  const downloadSermon = (sermon: Sermon) => {
    const src = sermon.mediaUrl || (sermon.blob ? URL.createObjectURL(sermon.blob) : undefined);
    if (!src) return;

    const a = document.createElement('a');
    a.href = src;
    a.download = `${sermon.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${sermon.mediaType === 'audio' ? 'mp3' : 'webm'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-6 pb-44 sm:pb-36">
      {/* Toast Notification */}
      {statusMessage && (
        <div
          className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl flex items-center gap-3 transition-all animate-bounce-short ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{statusMessage.text}</span>
        </div>
      )}

      {/* Header & Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/30 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Video className="w-6 h-6 text-amber-400" />
            Live Sermon Studio & Archive
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Broadcast live, record HD sermon videos, auto-save to Archive, and push directly to the Scriptures tab
          </p>
        </div>

        {/* Studio Subtabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'live'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30 border border-amber-400/40'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Go Live / Record</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('archive');
              fetchSermons();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'archive'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30 border border-amber-400/40'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Sermon Archive ({sermons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'upload'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30 border border-amber-400/40'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Media</span>
          </button>
        </div>
      </div>

      {/* 1. Go Live / Preach Studio Section */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          {/* Sermon Details Form */}
          <div className="bg-[#090d24]/90 border border-amber-500/30 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
            <h3 className="text-base sm:text-lg font-bold text-amber-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Sermon Details & Metadata
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sermon Title *</label>
                <input
                  type="text"
                  value={sermonTitle}
                  onChange={e => setSermonTitle(e.target.value)}
                  placeholder="e.g. Walking in Grace - Chapter 3"
                  className="w-full bg-amber-950/50 border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Scripture Reference</label>
                <input
                  type="text"
                  value={scriptureRef}
                  onChange={e => setScriptureRef(e.target.value)}
                  placeholder="e.g. John 3:1-21 or Romans 8:28"
                  className="w-full bg-amber-950/50 border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Speaker / Preacher</label>
                <input
                  type="text"
                  value={speakerName}
                  onChange={e => setSpeakerName(e.target.value)}
                  placeholder="e.g. Pastor Paul / Elder David"
                  className="w-full bg-amber-950/50 border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Channel / Ministry</label>
                <input
                  type="text"
                  value={channelName}
                  onChange={e => setChannelName(e.target.value)}
                  placeholder="e.g. Aura Community Pulpit, Dr. Tony Evans"
                  className="w-full bg-amber-950/50 border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Series Container Connection Suite */}
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">Series & Video Container</h4>
                    <p className="text-[11px] text-slate-400">Group this sermon into a multi-part series container</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSeries}
                    onChange={e => setIsSeries(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  <span className="ml-2 text-xs font-semibold text-slate-200">
                    {isSeries ? 'Series Enabled' : 'Single Sermon'}
                  </span>
                </label>
              </div>

              {isSeries ? (
                <div className="space-y-3 pt-2 border-t border-amber-500/20">
                  {existingSeriesContainers.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Connect to Existing Series Container:
                      </label>
                      <select
                        value={selectedExistingSeries}
                        onChange={e => {
                          const val = e.target.value;
                          setSelectedExistingSeries(val);
                          if (val) {
                            setSeriesName(val);
                            const found = existingSeriesContainers.find(c => c.name === val);
                            if (found) {
                              setSeriesPart(found.maxPart + 1);
                              if (found.channel) setChannelName(found.channel);
                            }
                          }
                        }}
                        className="w-full bg-[#0a1033] border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                      >
                        <option value="">-- Or type custom series name below --</option>
                        {existingSeriesContainers.map(c => (
                          <option key={c.name} value={c.name}>
                            📁 {c.name} ({c.count} sermon{c.count === 1 ? '' : 's'} • {c.channel})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Series Container Title *
                      </label>
                      <input
                        type="text"
                        value={seriesName}
                        onChange={e => {
                          setSeriesName(e.target.value);
                          if (selectedExistingSeries && e.target.value !== selectedExistingSeries) {
                            setSelectedExistingSeries('');
                          }
                        }}
                        placeholder="e.g. Kingdom Authority & Spiritual Warfare"
                        className="w-full bg-amber-950/60 border border-amber-500/30 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Part / Episode #
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-300 font-bold">Part</span>
                        <input
                          type="number"
                          min={1}
                          value={seriesPart}
                          onChange={e => setSeriesPart(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-full bg-amber-950/60 border border-amber-500/30 rounded-xl px-3 py-2 text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>

                  {seriesName && (
                    <div className="p-3 rounded-xl bg-amber-900/30 border border-amber-400/30 flex items-start gap-2.5">
                      <Layers className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-300 space-y-0.5">
                        <p className="font-semibold text-amber-200">
                          Container Preview: <span className="text-white">"{seriesName}"</span> • Part {seriesPart}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          This sermon will automatically be grouped into this series container alongside any existing and future episodes in the Podcasts & Sermons player.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic">
                  Recorded sermon will be saved as a standalone release. Check "Series Enabled" above to bundle into a series container.
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Study Notes & Outline</label>
              <textarea
                value={sermonNotes}
                onChange={e => setSermonNotes(e.target.value)}
                placeholder="Key takeaways, key scriptures, sermon notes..."
                rows={2}
                className="w-full bg-amber-950/50 border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Cover Image / Unsplash Picker */}
            <div className="space-y-2 pt-2 border-t border-amber-500/20">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  Cover Image (Thumbnail)
                </label>
                <button
                  type="button"
                  onClick={() => setShowUnsplashPicker(!showUnsplashPicker)}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  {showUnsplashPicker ? "Close Picker" : "✨ Choose from Unsplash"}
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={thumbnailUrl}
                  onChange={e => setThumbnailUrl(e.target.value)}
                  placeholder="Paste custom cover image URL or pick below..."
                  className="flex-1 bg-amber-950/50 border border-amber-500/30 rounded-xl px-3.5 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                {thumbnailUrl && (
                  <button
                    type="button"
                    onClick={() => setThumbnailUrl("")}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Unsplash Dynamic Search Panel */}
              {showUnsplashPicker && (
                <div className="p-3 bg-amber-950/80 border border-amber-500/30 rounded-2xl space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={unsplashQuery}
                        onChange={e => setUnsplashQuery(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), searchUnsplash())}
                        placeholder="Search Pexels (e.g. prayer, cross, pulpit, choir)..."
                        className="w-full pl-8 pr-3 py-1.5 bg-amber-900/40 border border-amber-400/30 rounded-xl text-white text-xs placeholder-slate-400 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => searchUnsplash()}
                      disabled={isSearchingUnsplash}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {isSearchingUnsplash ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      Search
                    </button>
                  </div>

                  {/* Results Grid */}
                  <div className="max-h-56 overflow-y-auto pr-1">
                    {unsplashResults.length === 0 && !isSearchingUnsplash && (
                      <div className="text-center py-4">
                        <button
                          type="button"
                          onClick={() => searchUnsplash("worship bible")}
                          className="text-xs text-amber-300 hover:text-white underline"
                        >
                          Load popular worship & church images
                        </button>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {unsplashResults.map((img) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => {
                            setThumbnailUrl(img.urls.regular);
                            setShowUnsplashPicker(false);
                          }}
                          className={`group relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                            thumbnailUrl === img.urls.regular ? "border-amber-400 ring-2 ring-amber-400/50" : "border-white/10 hover:border-amber-400"
                          }`}
                        >
                          <img src={img.urls.small} alt={img.alt_description || "Sermon cover"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                          <span className="absolute inset-x-0 bottom-0 bg-black/75 text-[9px] text-white truncate px-1 py-0.5 text-left">
                            by {img.user?.name || "Unsplash"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Thumbnail Preview Badge */}
              {thumbnailUrl && (
                <div className="flex items-center gap-3 p-2 bg-amber-950/40 border border-amber-500/20 rounded-xl">
                  <img src={thumbnailUrl} alt="Thumbnail preview" className="w-16 h-10 object-cover rounded-lg border border-white/10" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">Active Cover Preview</p>
                    <p className="text-[10px] text-amber-300">Will render as card cover in Podcast feed</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Video Camera Viewfinder */}
          <div className="relative bg-black rounded-3xl overflow-hidden border border-amber-500/40 shadow-2xl aspect-video max-h-[500px] flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isLive ? 'block' : 'hidden'}`}
            />

            {!isLive && (
              <div className="text-center p-6 space-y-3 pb-8">
                <div className="w-16 h-16 rounded-full bg-amber-600/20 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto">
                  <Video className="w-8 h-8" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white">Live Camera Standby</h4>
                <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
                  Click 'Start Camera' to initiate your video studio preview, then start recording when you are ready.
                </p>
                <button
                  onClick={startLive}
                  className="mt-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-amber-500/30 transition-all active:scale-95 flex items-center gap-2 mx-auto"
                >
                  <Video className="w-4 h-4" />
                  <span>Start Camera</span>
                </button>
              </div>
            )}

            {/* Live Indicator Badges */}
            {isLive && (
              <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-emerald-300 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Camera Active</span>
                </div>

                {isRecording && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600/90 text-white text-xs font-bold shadow-lg animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>REC {formatDuration(recordingSeconds)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Studio Controls */}
          {isLive && (
            <div className="flex items-center justify-between gap-3 flex-wrap bg-[#090d24]/80 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={uploadProgress}
                  className={`px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-xl active:scale-95 ${
                    isRecording
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-4 h-4" />
                      <span>Stop & Verify Recording</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>Start Recording</span>
                    </>
                  )}
                </button>

                <button
                  onClick={stopLive}
                  className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all"
                >
                  Stop Camera
                </button>
              </div>

              {isRecording && (
                <div className="flex items-center gap-2 text-xs text-rose-300 font-medium">
                  <Clock className="w-4 h-4 animate-spin-slow" />
                  <span>Recording in progress. Click 'Stop & Verify' when finished to review before saving.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Sermon Archive Section */}
      {activeTab === 'archive' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs sm:text-sm text-slate-300">
                Archived sermons are persistently saved in your database. Push any recording over to the{' '}
                <strong className="text-amber-300">Scriptures (Podcasts & Sermons)</strong> tab for your community to stream!
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Toggle between All and Containers */}
              <div className="flex bg-black/40 border border-amber-500/30 rounded-xl p-1">
                <button
                  onClick={() => setArchiveSubView('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    archiveSubView === 'all'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({sermons.length})
                </button>
                <button
                  onClick={() => setArchiveSubView('containers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    archiveSubView === 'containers'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>Series Containers ({existingSeriesContainers.length})</span>
                </button>
              </div>

              <button
                onClick={handleSyncYoutubeFolder}
                disabled={isSyncingYoutube}
                className="flex items-center gap-1.5 text-xs text-red-300 hover:text-white px-3 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-xl border border-red-500/30 transition-all disabled:opacity-50 font-semibold shadow-sm"
                title="Scan public/uploads/youtube_series for YouTube videos now"
              >
                <FolderSync className={`w-3.5 h-3.5 text-red-400 ${isSyncingYoutube ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncingYoutube ? 'Syncing...' : 'Sync YouTube Folder'}</span>
              </button>

              <button
                onClick={fetchSermons}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors p-2 bg-white/5 rounded-xl border border-white/10"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingArchive ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loadingArchive ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
            </div>
          ) : sermons.length === 0 ? (
            <div className="text-center py-16 bg-[#090d24]/60 border border-amber-500/20 rounded-3xl p-8 space-y-3">
              <FileVideo className="w-12 h-12 text-amber-400/50 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Archived Sermons Yet</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Record your first live sermon in the 'Go Live / Record' tab, or upload video/audio files in the 'Upload Media' tab.
              </p>
            </div>
          ) : archiveSubView === 'containers' ? (
            /* Series Containers Subview */
            <div className="space-y-4">
              {existingSeriesContainers.length === 0 ? (
                <div className="p-8 text-center bg-[#090d24]/60 border border-amber-500/20 rounded-2xl text-slate-400 text-xs">
                  No sermons have been assigned to a series container yet. Edit existing sermons or record a new sermon with "Series Enabled" to create a container.
                </div>
              ) : (
                existingSeriesContainers.map(container => {
                  const isExpanded = expandedContainer === container.name;
                  return (
                    <div
                      key={container.name}
                      className="rounded-2xl border border-amber-500/30 bg-[#090d24]/90 overflow-hidden shadow-xl"
                    >
                      {/* Container Header */}
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-950/40 to-yellow-950/20">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-xl bg-amber-600/20 border border-amber-400/30 text-amber-300 shrink-0">
                            <Layers className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base sm:text-lg font-bold text-white">
                                {container.name}
                              </h3>
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                                {container.count} {container.count === 1 ? 'Episode' : 'Episodes'}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-bold border border-orange-500/30">
                                {container.channel}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Latest recorded: Part {container.maxPart} • Connected in Podcasts & Sermons stream
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedExistingSeries(container.name);
                              setSeriesName(container.name);
                              setChannelName(container.channel);
                              setSeriesPart(container.maxPart + 1);
                              setIsSeries(true);
                              setActiveTab('live');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Record Part {container.maxPart + 1}</span>
                          </button>

                          <button
                            onClick={() => setExpandedContainer(isExpanded ? null : container.name)}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all"
                          >
                            {isExpanded ? 'Collapse' : `View ${container.count} Videos`}
                          </button>
                        </div>
                      </div>

                      {/* Container Items List */}
                      {isExpanded && (
                        <div className="p-4 space-y-2.5 border-t border-white/10 bg-black/20">
                          {container.items.map((item, idx) => {
                            const isSelected = selectedSermon?.id === item.id;
                            return (
                              <div
                                key={item.id}
                                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                                  isSelected
                                    ? 'bg-[#0e1642] border-amber-400'
                                    : 'bg-white/5 border-white/5 hover:border-amber-500/30'
                                }`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-200 text-xs font-extrabold">
                                      Part {item.seriesPart || idx + 1}
                                    </span>
                                    <h4 className="text-xs sm:text-sm font-bold text-white">{item.title}</h4>
                                    {item.duration && (
                                      <span className="text-[11px] text-slate-400">
                                        ({formatDuration(item.duration)})
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-400">
                                    {item.speaker && <span>{item.speaker}</span>}
                                    {item.scriptureRef && <span className="text-yellow-300 font-medium"> • {item.scriptureRef}</span>}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setSelectedSermon(isSelected ? null : item)}
                                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1"
                                  >
                                    <Play className="w-3 h-3" />
                                    <span>{isSelected ? 'Close' : 'Play'}</span>
                                  </button>

                                  <button
                                    onClick={() => handlePushToScripturesTab(item)}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 shadow"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>Push</span>
                                  </button>

                                  <button
                                    onClick={() => setEditingSermon(item)}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* All Sermons Subview */
            <div className="grid grid-cols-1 gap-4">
              {sermons.map(sermon => {
                const isSelected = selectedSermon?.id === sermon.id;
                return (
                  <div
                    key={sermon.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isSelected
                        ? 'bg-[#0d1338] border-amber-400 shadow-xl shadow-amber-500/20'
                        : 'bg-[#090d24]/80 border-white/10 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Left: Metadata & Info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-bold text-white truncate">
                            {sermon.title}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                            {sermon.mediaType || 'Video'}
                          </span>
                          {sermon.channel && (
                            <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 text-[10px] font-bold border border-orange-500/30">
                              {sermon.channel}
                            </span>
                          )}
                          {sermon.series && (
                            <span className="px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-300 text-[10px] font-bold border border-yellow-500/30 flex items-center gap-1">
                              <Layers className="w-2.5 h-2.5" />
                              <span>{sermon.series}{sermon.seriesPart ? ` (Part ${sermon.seriesPart})` : ''}</span>
                            </span>
                          )}
                          {sermon.duration && (
                            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3" />
                              {formatDuration(sermon.duration)}
                            </span>
                          )}
                        </div>

                        {sermon.scriptureRef && (
                          <p className="text-xs font-semibold text-yellow-300 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Scripture: {sermon.scriptureRef}</span>
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                          {sermon.speaker && <span>Speaker: {sermon.speaker}</span>}
                          {sermon.dateRecorded && <span>• Date: {sermon.dateRecorded}</span>}
                        </div>

                        {sermon.description && (
                          <p className="text-xs text-slate-300 mt-1 line-clamp-2">{sermon.description}</p>
                        )}
                      </div>

                      {/* Right: Actions Suite */}
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        {/* Play/Pause Toggle */}
                        <button
                          onClick={() => setSelectedSermon(isSelected ? null : sermon)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                            isSelected
                              ? 'bg-amber-600 text-white'
                              : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10'
                          }`}
                          title="Play preview"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>{isSelected ? 'Close' : 'Preview'}</span>
                        </button>

                        {/* Push to Scriptures Tab Button */}
                        <button
                          onClick={() => handlePushToScripturesTab(sermon)}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-bold shadow-lg shadow-amber-500/25 border border-amber-400/40 flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
                          title="Push and view in Scriptures tab under Podcasts & Sermons"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Push to Scriptures</span>
                        </button>

                        {/* Push to Course Lesson Button */}
                        <button
                          onClick={() => setPushingSermon(sermon)}
                          className="p-2 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/30 transition-all text-xs"
                          title="Attach to a course lesson in Course Studio"
                        >
                          <Layers className="w-4 h-4" />
                        </button>

                        {/* Edit metadata */}
                        <button
                          onClick={() => setEditingSermon(sermon)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all"
                          title="Edit details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Download */}
                        {sermon.mediaUrl && (
                          <button
                            onClick={() => downloadSermon(sermon)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-amber-400 border border-white/10 transition-all"
                            title="Download file"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteSermon(sermon.id, sermon.title)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                          title="Delete sermon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Media Player */}
                    {isSelected && sermon.mediaUrl && (
                      <div className="border-t border-white/10 p-4 bg-black/40">
                        {sermon.mediaType === 'audio' ? (
                          <audio controls autoPlay className="w-full" src={sermon.mediaUrl} />
                        ) : (
                          <AsyncMedia
                            controls
                            autoPlay
                            mediaType="video"
                            className="w-full rounded-2xl bg-black max-h-[420px]"
                            src={sermon.mediaUrl}
                          />
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

      {/* 3. Direct Upload Section */}
      {activeTab === 'upload' && (
        <form onSubmit={handleDirectUpload} className="bg-[#090d24]/90 border border-amber-500/30 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-amber-400" />
            Upload Video or Audio Sermon into Archive
          </h3>
          <p className="text-xs text-slate-400">
            Upload any recorded sermon file (MP4, WebM, MOV, MP3, WAV, M4A) directly to your server and make it ready to push to the Scriptures tab.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Video/Audio File *</label>
            <input
              type="file"
              accept="video/*,audio/*"
              onChange={e => setUploadFile(e.target.files?.[0] || null)}
              className="w-full bg-amber-950/50 border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sermon Title</label>
              <input
                type="text"
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                placeholder="e.g. The Power of Faith"
                className="w-full bg-amber-950/50 border border-amber-500/30 rounded-xl px-3.5 py-2 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Scripture Reference</label>
              <input
                type="text"
                value={uploadScripture}
                onChange={e => setUploadScripture(e.target.value)}
                placeholder="e.g. Hebrews 11:1"
                className="w-full bg-amber-950/50 border border-amber-500/30 rounded-xl px-3.5 py-2 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Speaker</label>
              <input
                type="text"
                value={uploadSpeaker}
                onChange={e => setUploadSpeaker(e.target.value)}
                placeholder="e.g. Pastor John"
                className="w-full bg-amber-950/50 border border-amber-500/30 rounded-xl px-3.5 py-2 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Channel / Ministry</label>
              <input
                type="text"
                value={uploadChannel}
                onChange={e => setUploadChannel(e.target.value)}
                placeholder="e.g. Aura Community Pulpit, Dr. Tony Evans"
                className="w-full bg-amber-950/50 border border-amber-500/30 rounded-xl px-3.5 py-2 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Series Container Connection Suite for Upload */}
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Series & Video Container</h4>
                  <p className="text-[11px] text-slate-400">Bundle this upload into a series container alongside other episodes</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={uploadIsSeries}
                  onChange={e => setUploadIsSeries(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                <span className="ml-2 text-xs font-semibold text-slate-200">
                  {uploadIsSeries ? 'Series Enabled' : 'Single Sermon'}
                </span>
              </label>
            </div>

            {uploadIsSeries ? (
              <div className="space-y-3 pt-2 border-t border-amber-500/20">
                {existingSeriesContainers.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Connect to Existing Series Container:
                    </label>
                    <select
                      value={uploadExistingSeries}
                      onChange={e => {
                        const val = e.target.value;
                        setUploadExistingSeries(val);
                        if (val) {
                          setUploadSeries(val);
                          const found = existingSeriesContainers.find(c => c.name === val);
                          if (found) {
                            setUploadSeriesPart(found.maxPart + 1);
                            if (found.channel) setUploadChannel(found.channel);
                          }
                        }
                      }}
                      className="w-full bg-[#0a1033] border border-amber-500/40 rounded-xl px-3.5 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                    >
                      <option value="">-- Or type custom series container name below --</option>
                      {existingSeriesContainers.map(c => (
                        <option key={c.name} value={c.name}>
                          📁 {c.name} ({c.count} sermon{c.count === 1 ? '' : 's'} • {c.channel})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Series Container Title *
                    </label>
                    <input
                      type="text"
                      value={uploadSeries}
                      onChange={e => {
                        setUploadSeries(e.target.value);
                        if (uploadExistingSeries && e.target.value !== uploadExistingSeries) {
                          setUploadExistingSeries('');
                        }
                      }}
                      placeholder="e.g. Gospel Foundations"
                      className="w-full bg-amber-950/60 border border-amber-500/30 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Part / Episode #
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-300 font-bold">Part</span>
                      <input
                        type="number"
                        min={1}
                        value={uploadSeriesPart}
                        onChange={e => setUploadSeriesPart(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full bg-amber-950/60 border border-amber-500/30 rounded-xl px-3 py-2 text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {uploadSeries && (
                  <div className="p-3 rounded-xl bg-amber-900/30 border border-amber-400/30 flex items-start gap-2.5">
                    <Layers className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-300 space-y-0.5">
                      <p className="font-semibold text-amber-200">
                        Container Preview: <span className="text-white">"{uploadSeries}"</span> • Part {uploadSeriesPart}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        This sermon upload will be placed directly into this container and ordered as Part {uploadSeriesPart}.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 italic">
                Upload will be saved as a standalone sermon. Enable "Series Enabled" above to bundle into a series container.
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
            <textarea
              value={uploadDescription}
              onChange={e => setUploadDescription(e.target.value)}
              placeholder="Notes, reflections, scripture insights..."
              rows={2}
              className="w-full bg-amber-950/50 border border-amber-500/30 rounded-xl px-3.5 py-2 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={!uploadFile || uploadProgress}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
          >
            {uploadProgress ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Uploading to Archive...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload & Save to Archive</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Push to Course Lesson Modal */}
      {pushingSermon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#090d24] border border-amber-500/40 rounded-3xl p-6 space-y-4 text-white shadow-2xl">
            <h3 className="text-base font-bold text-amber-200 flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-400" />
              Attach Sermon to Course Lesson
            </h3>
            <p className="text-xs text-slate-400">
              Select which course you would like to push <strong className="text-white">"{pushingSermon.title}"</strong> to as a lesson video.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Course</label>
              <select
                value={targetCourseId}
                onChange={e => setTargetCourseId(e.target.value)}
                className="w-full bg-amber-950/60 border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
              >
                <option value="">Choose course...</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setPushingSermon(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePushToCourse}
                disabled={!targetCourseId || isPushingToCourse}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg transition-all"
              >
                {isPushingToCourse ? 'Attaching...' : 'Push to Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sermon Modal */}
      {editingSermon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#090d24] border border-amber-500/40 rounded-3xl p-6 space-y-4 text-white shadow-2xl">
            <h3 className="text-base font-bold text-amber-200 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-amber-400" />
              Edit Sermon Details
            </h3>

            <form onSubmit={handleUpdateSermon} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={editingSermon.title}
                  onChange={e => setEditingSermon({ ...editingSermon, title: e.target.value })}
                  className="w-full bg-amber-950/60 border border-amber-500/30 rounded-xl px-3 py-2 text-white text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Scripture Reference</label>
                <input
                  type="text"
                  value={editingSermon.scriptureRef || ''}
                  onChange={e => setEditingSermon({ ...editingSermon, scriptureRef: e.target.value })}
                  className="w-full bg-amber-950/60 border border-amber-500/30 rounded-xl px-3 py-2 text-white text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Speaker</label>
                  <input
                    type="text"
                    value={editingSermon.speaker || ''}
                    onChange={e => setEditingSermon({ ...editingSermon, speaker: e.target.value })}
                    className="w-full bg-amber-950/60 border border-amber-500/30 rounded-xl px-3 py-2 text-white text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Channel / Ministry</label>
                  <input
                    type="text"
                    value={editingSermon.channel || ''}
                    onChange={e => setEditingSermon({ ...editingSermon, channel: e.target.value })}
                    className="w-full bg-amber-950/60 border border-amber-500/30 rounded-xl px-3 py-2 text-white text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Series Container</label>
                  <input
                    type="text"
                    value={editingSermon.series || ''}
                    onChange={e => setEditingSermon({ ...editingSermon, series: e.target.value })}
                    className="w-full bg-amber-950/60 border border-amber-500/30 rounded-xl px-3 py-2 text-white text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Part #</label>
                  <input
                    type="number"
                    min={1}
                    value={editingSermon.seriesPart || 1}
                    onChange={e => setEditingSermon({ ...editingSermon, seriesPart: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-amber-950/60 border border-amber-500/30 rounded-xl px-3 py-2 text-white text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  value={editingSermon.description || ''}
                  onChange={e => setEditingSermon({ ...editingSermon, description: e.target.value })}
                  rows={3}
                  className="w-full bg-amber-950/60 border border-amber-500/30 rounded-xl px-3 py-2 text-white text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingSermon(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recording Verification & Approval Modal */}
      {draftForVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-[#090d24] border-2 border-amber-500/50 rounded-3xl p-6 sm:p-7 space-y-5 text-white shadow-2xl max-h-[82vh] overflow-y-auto pb-28 sm:pb-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Recording Finished • Ready for Verification</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  Review & Save Sermon to Archive
                </h3>
                <p className="text-xs text-slate-300">
                  Verify your recording playback, adjust sermon metadata, and approve sending it to your permanent Archive.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-400/30 text-amber-300">
                  {formatDuration(draftForVerification.duration)} • {draftForVerification.fileSizeMb} MB
                </span>
              </div>
            </div>

            {/* Video Playback Preview */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Recording Preview
              </label>
              <div className="bg-black rounded-2xl overflow-hidden border border-amber-500/30 shadow-inner">
                <video
                  controls
                  src={draftForVerification.previewUrl}
                  className="w-full max-h-[280px] object-contain mx-auto bg-black"
                />
              </div>
            </div>

            {/* Metadata Fields */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sermon Title *
                  </label>
                  <input
                    type="text"
                    value={draftForVerification.title}
                    onChange={e =>
                      setDraftForVerification({
                        ...draftForVerification,
                        title: e.target.value
                      })
                    }
                    placeholder="Enter sermon title..."
                    className="w-full bg-amber-950/60 border border-amber-500/30 rounded-xl px-3.5 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Scripture Reference
                  </label>
                  <input
                    type="text"
                    value={draftForVerification.scriptureRef}
                    onChange={e =>
                      setDraftForVerification({
                        ...draftForVerification,
                        scriptureRef: e.target.value
                      })
                    }
                    placeholder="e.g. John 3:16, Romans 8:1"
                    className="w-full bg-amber-950/60 border border-amber-500/30 rounded-xl px-3.5 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Speaker / Preacher
                  </label>
                  <input
                    type="text"
                    value={draftForVerification.speaker}
                    onChange={e =>
                      setDraftForVerification({
                        ...draftForVerification,
                        speaker: e.target.value
                      })
                    }
                    placeholder="e.g. Pastor Paul"
                    className="w-full bg-amber-950/60 border border-amber-500/30 rounded-xl px-3.5 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Channel / Ministry
                  </label>
                  <input
                    type="text"
                    value={draftForVerification.channel || ''}
                    onChange={e =>
                      setDraftForVerification({
                        ...draftForVerification,
                        channel: e.target.value
                      })
                    }
                    placeholder="e.g. Aura Community Pulpit, Dr. Tony Evans"
                    className="w-full bg-amber-950/60 border border-amber-500/30 rounded-xl px-3.5 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Series Container Name
                  </label>
                  <input
                    type="text"
                    value={draftForVerification.series}
                    onChange={e =>
                      setDraftForVerification({
                        ...draftForVerification,
                        series: e.target.value
                      })
                    }
                    placeholder="e.g. Sunday Live / Gospel Foundations"
                    className="w-full bg-amber-950/60 border border-amber-500/30 rounded-xl px-3.5 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Part #
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={draftForVerification.seriesPart || 1}
                    onChange={e =>
                      setDraftForVerification({
                        ...draftForVerification,
                        seriesPart: parseInt(e.target.value, 10) || 1
                      })
                    }
                    className="w-full bg-amber-950/60 border border-amber-500/30 rounded-xl px-3.5 py-2 text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / Sermon Notes
                </label>
                <textarea
                  value={draftForVerification.description}
                  onChange={e =>
                    setDraftForVerification({
                      ...draftForVerification,
                      description: e.target.value
                    })
                  }
                  placeholder="Summary, key truths, outline..."
                  rows={2}
                  className="w-full bg-amber-950/60 border border-amber-500/30 rounded-xl px-3.5 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  disabled={isSavingVerification}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Discard</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadDraft}
                  disabled={isSavingVerification}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Copy</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleConfirmAndSaveToArchive}
                disabled={isSavingVerification}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs sm:text-sm font-extrabold shadow-xl shadow-emerald-500/25 flex items-center gap-2 transition-all active:scale-95"
              >
                {isSavingVerification ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving to Archive...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Save to Archive</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
