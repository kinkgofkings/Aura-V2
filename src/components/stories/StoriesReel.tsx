import React, { useState, useRef } from 'react';
import {
  Plus,
  Sparkles,
  Upload,
  Camera,
  Image as ImageIcon,
  X,
  Trash2,
  Smile,
} from 'lucide-react';
import { useSocial } from '../../context/SocialContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { StoryViewerModal } from './StoryViewerModal';
import { UnsplashSearch } from '../common/UnsplashSearch';
import { soundEffects } from '../../services/audio';
import { ALL_CHRISTIAN_PRESET_IMAGES } from '../../content/presetImages';
import { useAsyncMedia } from '../../utils/useAsyncMedia';
import { compressImage } from '../../utils/imageCompressor';

const PRESET_STORY_IMAGES = ALL_CHRISTIAN_PRESET_IMAGES;

const STORY_EMOJIS = ['🙏', '✝️', '🕊️', '📖', '✨', '🔥', '💫', '💖'];

const StoryCardMedia: React.FC<{
  src?: string | null;
  alt: string;
  className?: string;
}> = ({ src, alt, className }) => {
  const { resolvedSrc, error } = useAsyncMedia(src);
  const safeSrc = (resolvedSrc || src || '').trim();
  if (!safeSrc || error) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-amber-950 via-yellow-950 to-orange-950 flex items-center justify-center p-2 text-center">
        <Sparkles className="w-6 h-6 text-amber-400/40" />
      </div>
    );
  }
  return (
    <img
      src={safeSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className || "w-full h-full object-cover"}
    />
  );
};

export const StoriesReel: React.FC = () => {
  const { stories, addStory } = useSocial();
  const { user, allUsers } = useAuth();
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [isAddingStory, setIsAddingStory] = useState(false);
  const [storyImageUrl, setStoryImageUrl] = useState('');
  const [storyCaption, setStoryCaption] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isCapturingCamera, setIsCapturingCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isSubmittingStory, setIsSubmittingStory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // File upload handler
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const compressedUrl = await compressImage(file, 800, 1400, 0.65);
      soundEffects.playTap();
      setStoryImageUrl(compressedUrl);
    } catch (e) {
      console.warn('Failed to compress story image:', e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Camera capture
  const startCamera = async () => {
    try {
      setIsCapturingCamera(true);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (e) {
      console.warn('Camera capture error:', e);
      setIsCapturingCamera(false);
    }
  };

  const takeSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      let w = videoRef.current.videoWidth || 720;
      let h = videoRef.current.videoHeight || 1280;
      if (w > 720 || h > 1280) {
        const ratio = Math.min(720 / w, 1280 / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
        setStoryImageUrl(dataUrl);
        soundEffects.playTap();
      }
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setIsCapturingCamera(false);
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingStory) return;
    setIsSubmittingStory(true);
    const url = storyImageUrl.trim() || PRESET_STORY_IMAGES[0].url;
    soundEffects.playMessageSent();
    try {
      await addStory(url, storyCaption.trim() || undefined);
    } finally {
      stopCamera();
      setIsAddingStory(false);
      setStoryImageUrl('');
      setStoryCaption('');
      setIsSubmittingStory(false);
    }
  };

  const handleCloseModal = () => {
    stopCamera();
    setIsAddingStory(false);
    setStoryImageUrl('');
    setStoryCaption('');
  };

  return (
    <div id="stories-reel" className="w-full mb-6 select-none">
      <div className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto pt-1 pb-4 scrollbar-none px-1">
        {/* Facebook-style 'Create a story' Card */}
        <div
          id="create-story-card"
          onClick={() => setIsAddingStory(true)}
          className="w-[114px] sm:w-[130px] h-[184px] sm:h-[200px] rounded-2xl overflow-hidden relative bg-[#090d20] border border-white/15 hover:border-amber-400/50 flex-shrink-0 cursor-pointer group shadow-xl hover:shadow-amber-500/25 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between"
          title="Create a new 24-hour story"
        >
          {/* Top User Photo / Avatar Area */}
          <div className="w-full h-[124px] sm:h-[136px] overflow-hidden relative bg-gradient-to-b from-amber-900/40 via-yellow-950/60 to-[#090d20] flex items-center justify-center">
            {user?.avatarUrl && user.avatarUrl.trim() ? (
              <img
                src={user.avatarUrl.trim()}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-amber-600/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Avatar src={user?.avatarUrl || undefined} name={user?.name || 'You'} size="lg" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
          </div>

          {/* Bottom Card Footer with Overlapping Circular Plus Button */}
          <div className="flex-1 bg-[#070a1a] relative flex flex-col items-center justify-end pb-3 sm:pb-3.5 pt-3.5 px-1.5 border-t border-white/10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-600 group-hover:bg-amber-500 text-white flex items-center justify-center shadow-lg border-[3px] border-[#070a1a] transition-transform group-hover:scale-110 active:scale-95">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="text-[11px] font-bold text-white text-center leading-tight">
              Create story
            </span>
          </div>
        </div>

        {/* Current User's Active Story Card (if exists) */}
        {(() => {
          const myStoryIndex = stories.findIndex(
            (s) => user && (s.userId === user.id || (user.email && s.userId === user.email))
          );
          if (myStoryIndex === -1) return null;
          const myStory = stories[myStoryIndex];
          const myMedia = myStory?.mediaUrl || myStory?.slides?.[0]?.mediaUrl;

          return (
            <div
              key="my-active-story"
              id="my-active-story-card"
              onClick={() => setSelectedStoryIndex(myStoryIndex)}
              className="w-[114px] sm:w-[130px] h-[184px] sm:h-[200px] rounded-2xl overflow-hidden relative bg-slate-950 border-2 border-amber-500/80 hover:border-amber-400 flex-shrink-0 cursor-pointer group shadow-xl hover:shadow-amber-500/30 hover:scale-[1.02] transition-all duration-300"
              title="Click to view your active story"
            >
              {/* Story Visual Media */}
              {myMedia ? (
                <StoryCardMedia
                  src={myMedia}
                  alt="Your story"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-900 via-yellow-900 to-orange-950 p-2 flex items-center justify-center text-center">
                  <p className="text-[10px] text-white font-bold line-clamp-4 leading-tight">
                    {myStory.caption || 'Your Story'}
                  </p>
                </div>
              )}

              {/* Author Avatar in Top-Left */}
              <div className="absolute top-2.5 left-2.5 z-10 ring-2 ring-amber-500 ring-offset-2 ring-offset-black/70 rounded-full shadow-lg">
                <Avatar src={user?.avatarUrl || myStory.userAvatar} name="You" size="xs" />
              </div>

              {/* Plus button to add another slide */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddingStory(true);
                }}
                className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-amber-600/90 hover:bg-amber-500 text-white flex items-center justify-center shadow-lg border border-white/20 transition-transform active:scale-90 z-20"
                title="Add another slide to your story"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              {/* Bottom Scrim & Name */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent pt-12 pb-3.5 px-2.5 pointer-events-none z-10">
                <p className="text-xs font-bold text-white leading-tight drop-shadow-md">
                  Your Story
                </p>
                <span className="text-[9px] text-amber-300 font-semibold block mt-0.5">
                  {myStory.slides?.length || 1} {(myStory.slides?.length || 1) === 1 ? 'slide' : 'slides'}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Stories from other users */}
        {stories.map((story, index) => {
          if (user && story.userId === user.id) return null;

          const isSeen = user ? story.seenByUserIds.includes(user.id) : false;
          const media = story.mediaUrl || story.slides?.[0]?.mediaUrl;
          const authorUser = allUsers.find(
            (u) => u.id === story.userId || u.name.toLowerCase() === story.userName.toLowerCase()
          );
          const isAuthorOnline = authorUser?.status === 'online' || authorUser?.status === 'busy';

          return (
            <div
              key={story.id}
              id={`story-item-${story.id}`}
              onClick={() => setSelectedStoryIndex(index)}
              className={`w-[114px] sm:w-[130px] h-[184px] sm:h-[200px] rounded-2xl overflow-hidden relative bg-slate-950 flex-shrink-0 cursor-pointer group shadow-xl hover:shadow-amber-500/25 hover:scale-[1.02] transition-all duration-300 ${
                isSeen
                  ? 'border border-white/15 hover:border-white/30'
                  : 'border-2 border-amber-500/80 hover:border-amber-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
              }`}
              title={`View ${story.userName}'s story`}
            >
              {/* Story Visual Background */}
              {media ? (
                <StoryCardMedia
                  src={media}
                  alt={story.userName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-yellow-900 via-orange-900 to-amber-950 p-2 flex items-center justify-center text-center">
                  <p className="text-[10px] text-white font-bold line-clamp-4 leading-tight">
                    {story.caption || story.userName}
                  </p>
                </div>
              )}

              {/* Author Avatar Badge in Top Left with Facebook Ring */}
              <div
                className={`absolute top-2.5 left-2.5 z-10 rounded-full shadow-lg ${
                  isSeen
                    ? 'ring-2 ring-white/30 ring-offset-2 ring-offset-black/70'
                    : 'ring-[2.5px] ring-amber-500 ring-offset-2 ring-offset-black/70 animate-pulse-glow'
                }`}
              >
                <Avatar src={story.userAvatar} name={story.userName} size="xs" />
                {isAuthorOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black" />
                )}
              </div>

              {/* Bottom Scrim with Author Name */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent pt-12 pb-3.5 px-2.5 pointer-events-none z-10">
                <p className="text-xs font-bold text-white leading-tight drop-shadow-md line-clamp-2">
                  {story.userName}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Story Viewer Modal */}
      {selectedStoryIndex !== null && (
        <StoryViewerModal
          initialStoryIndex={selectedStoryIndex}
          onClose={() => setSelectedStoryIndex(null)}
          onOpenChat={() => {
            setSelectedStoryIndex(null);
            window.dispatchEvent(new CustomEvent('navigate_tab', { detail: { tab: 'chat' } }));
          }}
        />
      )}

      {/* Add Story Modal */}
      {isAddingStory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 pb-24 sm:p-4 sm:pb-4 bg-black/80 backdrop-blur-2xl animate-fade-in">
          <div className="w-full max-w-md rounded-[32px] bg-[#070a1a]/95 backdrop-blur-3xl border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-white">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Share 24-Hour Story
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStory} className="p-5 sm:p-6 pb-8 overflow-y-auto space-y-4 flex-1">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Camera mode */}
              {isCapturingCamera ? (
                <div className="relative rounded-2xl overflow-hidden bg-black border border-white/20 aspect-[9/16] max-h-72 mx-auto">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={takeSnapshot}
                      className="px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3.5 py-2 rounded-full bg-black/60 hover:bg-black/80 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : storyImageUrl ? (
                /* Active Story Image Preview */
                <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-black/60 aspect-[9/14] max-h-64 mx-auto group">
                  <img
                    src={storyImageUrl}
                    alt="Story preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={() => setStoryImageUrl('')}
                      className="p-1.5 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {storyCaption && (
                    <div className="absolute bottom-3 inset-x-3 p-2 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs text-center font-medium">
                      {storyCaption}
                    </div>
                  )}
                </div>
              ) : (
                /* Drag & Drop / File Upload Card */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-amber-400 bg-amber-500/20 scale-[1.02]'
                      : 'border-white/20 hover:border-amber-400/60 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-white">
                    Click to browse or drop photo here
                  </p>
                  <p className="text-xs text-slate-400">Supports PNG, JPG, WebP, GIF</p>
                </div>
              )}

              {/* Upload & Camera Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload from Device</span>
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Camera className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Take Selfie</span>
                </button>
              </div>

              {/* Direct URL input */}
              <div>
                <input
                  type="text"
                  placeholder="Or paste photo URL (https://...)"
                  value={storyImageUrl}
                  onChange={(e) => setStoryImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Unsplash Search */}
              <div>
                <UnsplashSearch
                  onSelect={(url) => {
                    soundEffects.playTap();
                    setStoryImageUrl(url);
                  }}
                  placeholder="Search Pexels for an image..."
                />
              </div>

              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">Caption (Optional)</label>
                  <div className="flex items-center gap-1">
                    {STORY_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setStoryCaption((prev) => prev + emoji)}
                        className="text-xs hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="What's happening right now?"
                  value={storyCaption}
                  onChange={(e) => setStoryCaption(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!storyImageUrl || isSubmittingStory}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-amber-500/25 border border-amber-400/30 transition-all hover:scale-105"
                >
                  {isSubmittingStory ? 'Posting...' : 'Post Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

