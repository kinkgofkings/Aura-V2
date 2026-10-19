import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Trash2,
  AlertTriangle,
  Play,
  Video,
  Headphones,
  BookOpen,
  User,
  Tv,
  Layers,
  Calendar,
  Sparkles,
  Link,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { SermonItem } from './PodcastFeed';

interface SermonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sermon: SermonItem | null; // null means 'add new' mode
  onSaveSuccess: (savedSermon: SermonItem) => void;
  onDeleteSuccess: (deletedId: string) => void;
}

export const SermonEditorModal: React.FC<SermonEditorModalProps> = ({
  isOpen,
  onClose,
  sermon,
  onSaveSuccess,
  onDeleteSuccess,
}) => {
  const isEditMode = Boolean(sermon);

  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [channel, setChannel] = useState('');
  const [series, setSeries] = useState('');
  const [seriesPart, setSeriesPart] = useState<string>('');
  const [scriptureRef, setScriptureRef] = useState('');
  const [format, setFormat] = useState<'video' | 'audio'>('video');
  const [mediaUrl, setMediaUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [date, setDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync form state when active sermon changes
  useEffect(() => {
    if (sermon) {
      setTitle(sermon.title || '');
      setSpeaker(sermon.speaker || '');
      setChannel(sermon.channel || '');
      setSeries(sermon.series || '');
      setSeriesPart(sermon.seriesPart ? String(sermon.seriesPart) : '');
      setScriptureRef(sermon.scriptureRef || '');
      setFormat(sermon.format || 'video');
      setMediaUrl(sermon.mediaUrl || sermon.mp4Url || sermon.mp3Url || (sermon.youtubeId ? `https://www.youtube.com/watch?v=${sermon.youtubeId}` : ''));
      setThumbnailUrl(sermon.thumbnailUrl || '');
      setSummary(sermon.summary || sermon.description || '');
      setDate(sermon.date ? sermon.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    } else {
      // Defaults for new sermon
      setTitle('');
      setSpeaker('Pastor Luke Shope');
      setChannel('Lighthouse Baptist Church');
      setSeries('Sunday Sanctuary Expositions');
      setSeriesPart('1');
      setScriptureRef('');
      setFormat('video');
      setMediaUrl('');
      setThumbnailUrl('');
      setSummary('');
      setDate(new Date().toISOString().split('T')[0]);
    }
    setErrorMsg(null);
    setShowDeleteConfirm(false);
  }, [sermon, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Sermon title is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Determine YouTube ID if present in mediaUrl
      const ytMatch = mediaUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      const youtubeId = ytMatch ? ytMatch[1] : undefined;
      const derivedThumbnail = thumbnailUrl.trim() || (youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : undefined);

      const sermonId = sermon ? sermon.id : `sermon-${Date.now()}`;

      const payload = {
        title: title.trim(),
        speaker: speaker.trim() || 'Pastor',
        channel: channel.trim() || undefined,
        series: series.trim() || undefined,
        seriesPart: seriesPart ? parseInt(seriesPart, 10) : undefined,
        scriptureRef: scriptureRef.trim() || undefined,
        description: summary.trim() || undefined,
        summary: summary.trim() || undefined,
        mediaType: format,
        mediaUrl: mediaUrl.trim() || undefined,
        thumbnailUrl: derivedThumbnail,
        dateRecorded: date,
        date,
      };

      const url = isEditMode
        ? `/api/bible/sermons/${encodeURIComponent(sermonId)}`
        : '/api/bible/sermons';

      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server responded with status ${res.status}`);
      }

      const savedData = await res.json();

      const normalizedSaved: SermonItem = {
        id: savedData.id || sermonId,
        title: payload.title,
        speaker: payload.speaker,
        channel: payload.channel,
        series: payload.series,
        seriesPart: payload.seriesPart,
        scriptureRef: payload.scriptureRef,
        summary: payload.summary,
        description: payload.summary,
        format,
        mediaUrl: payload.mediaUrl,
        youtubeId,
        mp4Url: format === 'video' ? payload.mediaUrl : undefined,
        mp3Url: format === 'audio' ? payload.mediaUrl : undefined,
        thumbnailUrl: payload.thumbnailUrl,
        date: payload.date,
        source: 'community',
      };

      onSaveSuccess(normalizedSaved);
      onClose();
    } catch (err: any) {
      console.error('[Sermon Editor Error]:', err);
      setErrorMsg(err.message || 'Failed to save sermon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!sermon) return;
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/bible/sermons/${encodeURIComponent(sermon.id)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete sermon');
      }

      onDeleteSuccess(sermon.id);
      onClose();
    } catch (err: any) {
      console.error('[Delete Sermon Error]:', err);
      setErrorMsg(err.message || 'Failed to delete sermon');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#090b17] border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-amber-950/40 via-amber-900/10 to-transparent border-b border-white/10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-black/50 z-20 group"
          >
            <X className="w-4 h-4 text-amber-400 group-hover:text-white transition-colors" />
            <span className="font-extrabold tracking-wide">Close</span>
          </button>

          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 shrink-0">
              {format === 'video' ? <Video className="w-5 h-5 fill-slate-950" /> : <Headphones className="w-5 h-5 fill-slate-950" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
                {isEditMode ? 'Edit Sermon Entry' : 'Add New Sermon to Library'}
              </h2>
              <p className="text-xs text-amber-300 font-medium">
                {isEditMode
                  ? 'Update title, preacher, scripture, or video link with instant library sync'
                  : 'Add a new sermon exposition, Sunday service, or recovery teaching'}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-amber-500/20">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Sermon Title *</span>
              <span className="text-[10px] text-amber-400 font-normal">Exact title shown on sermon card</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Romans 8: The Triumph of Sovereign Grace"
              className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-amber-400 focus:outline-none text-white text-sm"
            />
          </div>

          {/* Preacher & Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Preacher / Speaker</span>
              </label>
              <input
                type="text"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                placeholder="e.g., Pastor Luke Shope"
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-amber-400 focus:outline-none text-white text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-amber-400" />
                <span>Church / Channel</span>
              </label>
              <input
                type="text"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                placeholder="e.g., Lighthouse Baptist Church"
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-amber-400 focus:outline-none text-white text-sm"
              />
            </div>
          </div>

          {/* Series & Series Part */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-yellow-400" />
                <span>Series Container Name</span>
              </label>
              <input
                type="text"
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                placeholder="e.g., Sunday Sanctuary Expositions"
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-amber-400 focus:outline-none text-white text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                <span>Series Part #</span>
              </label>
              <input
                type="number"
                min="1"
                value={seriesPart}
                onChange={(e) => setSeriesPart(e.target.value)}
                placeholder="e.g., 1"
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-amber-400 focus:outline-none text-white text-sm"
              />
            </div>
          </div>

          {/* Scripture Reference & Date Recorded */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Scripture Reference</span>
              </label>
              <input
                type="text"
                value={scriptureRef}
                onChange={(e) => setScriptureRef(e.target.value)}
                placeholder="e.g., Romans 8:28-39"
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-amber-400 focus:outline-none text-white text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Date Recorded</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-amber-400 focus:outline-none text-white text-sm"
              />
            </div>
          </div>

          {/* Format Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Media Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('video')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  format === 'video'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/30'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>HD Video (YouTube / MP4)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('audio')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  format === 'audio'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/30'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
              >
                <Headphones className="w-4 h-4" />
                <span>Audio Podcast / Stream (MP3)</span>
              </button>
            </div>
          </div>

          {/* Media URL */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-amber-400" />
                <span>Media Stream / Video URL</span>
              </span>
              <span className="text-[10px] text-slate-400">YouTube link, MP4, MP3, or direct stream</span>
            </label>
            <input
              type="text"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="e.g., https://www.youtube.com/watch?v=kGgVd2P... or https://refnet.fm"
              className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-amber-400 focus:outline-none text-white text-sm"
            />
          </div>

          {/* Thumbnail URL & Live Preview */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Cover Image / Thumbnail URL</span>
              </span>
              <span className="text-[10px] text-slate-400">Leave blank for auto YouTube thumbnail</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or auto"
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-amber-400 focus:outline-none text-white text-sm flex-1"
              />
              {thumbnailUrl && (
                <div className="w-12 h-10 rounded-xl overflow-hidden border border-white/20 shrink-0 bg-black">
                  <img src={thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Summary / Exposition Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Sermon Notes / Exposition Summary</label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Expository sermon outline, pastoral notes, or key teaching points..."
              className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-amber-400 focus:outline-none text-white text-sm resize-none"
            />
          </div>

          {/* Delete Confirmation Box */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/50 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Permanently Delete this Sermon?</h4>
                  <p className="text-xs text-rose-200 mt-0.5">
                    This will remove <span className="font-bold underline text-white">"{title || sermon?.title}"</span> from the app library and prevent automated channel syncs from re-adding it.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Entry'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
            {isEditMode ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete Entire Entry</span>
              </button>
            ) : <span />}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-extrabold shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Sermon'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
