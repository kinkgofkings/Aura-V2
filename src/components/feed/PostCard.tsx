import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Send,
  CheckCircle2,
  Clock,
  MoreVertical,
  Trash2,
  Edit3,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SocialPost } from '../../types';
import { useSocial } from '../../context/SocialContext';
import { useAuth } from '../../context/AuthContext';
import { soundEffects } from '../../services/audio';
import { Avatar } from '../common/Avatar';
import { ImageLightboxModal } from '../common/ImageLightboxModal';
import { AsyncMedia } from '../common/AsyncMedia';
import { RichTextRenderer } from '../common/RichTextRenderer';
import { extractVideosFromText, isDirectVideoUrl } from '../../utils/mediaUtils';
import { VideoEmbed } from '../common/VideoEmbed';
import { CreatePostModal } from './CreatePostModal';

interface PostCardProps {
  post: SocialPost;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { likePost, addComment, toggleSavePost, deletePost } = useSocial();
  const { user } = useAuth();

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const isTexAdmin =
    user?.handle?.toLowerCase() === 'tex' ||
    user?.handle?.toLowerCase() === 'texxx360' ||
    user?.email?.toLowerCase().includes('lightsouttattootex') ||
    user?.email?.toLowerCase().includes('tex@aura.social');

  const canEdit = user && (
    isTexAdmin || 
    user.id === post.authorId || 
    post.authorId === 'user_tex' || 
    !post.authorId
  );

  const isLiked = user ? post.likedByUserIds.includes(user.id) : false;

  // Shortcut link targets for Prayer Wall, Sermons, Scripture, Devotionals, and Recovery
  const isPrayerPost =
    post.category === 'Prayer & Worship' ||
    post.tags?.some((t) =>
      ['prayer', 'prayers', 'prayerwall', 'healing', 'intercession'].includes(t.toLowerCase())
    ) ||
    post.content.toLowerCase().includes('#prayer') ||
    post.content.toLowerCase().includes('[prayer') ||
    post.content.toLowerCase().includes('prayer request');

  const isSermonPost =
    post.category === 'Sermons' ||
    post.tags?.some((t) =>
      ['sermon', 'sermons', 'pulpit', 'podcast', 'sermonindex'].includes(t.toLowerCase())
    ) ||
    post.content.toLowerCase().includes('#sermon') ||
    post.content.toLowerCase().includes('#pulpit');

  const scriptureMatch = post.content.match(/\b([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+)(-\d+)?\b/);
  const isScripturePost =
    !isSermonPost &&
    (!!scriptureMatch ||
      post.tags?.some((t) => ['scripture', 'bible', 'verse'].includes(t.toLowerCase())));

  const isDevotionalPost =
    post.tags?.some((t) => ['devotional', 'dailydevotional'].includes(t.toLowerCase())) ||
    post.content.toLowerCase().includes('#devotional');

  const isRecoveryPost =
    post.category === 'Recovery & Testimony' ||
    post.tags?.some((t) => ['recovery', 'fellowship', 'group'].includes(t.toLowerCase())) ||
    post.content.toLowerCase().includes('#recovery');

  const handleGoToPrayerWall = () => {
    soundEffects.playTap();
    const targetPrayerId = `prayer-post-${post.id}`;
    const prayerItem = {
      id: targetPrayerId,
      authorName: post.authorName,
      authorHandle: post.authorHandle,
      isAnonymous: false,
      category: 'General' as const,
      content: post.content.replace(/#\w+/g, '').trim(),
      prayedCount: post.likesCount || 1,
      prayedUsers: [],
      isAnswered: false,
      createdAt: post.createdAt,
    };

    try {
      localStorage.setItem('aura_study_initial_tab', 'prayers');
      localStorage.setItem('aura_target_prayer_id', targetPrayerId);
      sessionStorage.setItem('aura_target_prayer_id', targetPrayerId);
      sessionStorage.setItem('aura_target_prayer_data', JSON.stringify(prayerItem));
    } catch {}

    window.dispatchEvent(
      new CustomEvent('navigate_tab', {
        detail: {
          tab: 'bible',
          subtab: 'prayers',
          prayerId: targetPrayerId,
          prayer: prayerItem,
        },
      })
    );
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('switch_study_tab', {
          detail: {
            tab: 'prayers',
            prayerId: targetPrayerId,
            prayer: prayerItem,
          },
        })
      );
      window.dispatchEvent(
        new CustomEvent('target_prayer', {
          detail: {
            prayerId: targetPrayerId,
            prayer: prayerItem,
          },
        })
      );
    }, 60);
  };

  const handleGoToSermons = () => {
    soundEffects.playTap();
    const sermonId = `sermon-post-${post.id}`;
    const sermonItem = {
      id: sermonId,
      title: post.content.slice(0, 75).trim() + (post.content.length > 75 ? '...' : ''),
      speaker: post.authorName,
      format: (post.mediaUrls?.some((u) => isDirectVideoUrl(u)) ? 'video' : 'audio') as 'audio' | 'video',
      source: 'community' as const,
      mediaUrl: post.mediaUrls?.[0],
      duration: '25 min',
    };

    try {
      localStorage.setItem('aura_study_initial_tab', 'pulpit');
      localStorage.setItem('aura_target_sermon_id', sermonId);
      sessionStorage.setItem('aura_target_sermon_id', sermonId);
      sessionStorage.setItem('aura_target_sermon_data', JSON.stringify(sermonItem));
    } catch {}

    window.dispatchEvent(
      new CustomEvent('navigate_tab', {
        detail: {
          tab: 'bible',
          subtab: 'pulpit',
          sermonId,
          sermon: sermonItem,
        },
      })
    );
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('switch_study_tab', {
          detail: {
            tab: 'pulpit',
            sermonId,
            sermon: sermonItem,
          },
        })
      );
      window.dispatchEvent(
        new CustomEvent('open_sermon', {
          detail: {
            sermonId,
            sermon: sermonItem,
          },
        })
      );
    }, 60);
  };

  const handleGoToBible = () => {
    soundEffects.playTap();
    const ref = scriptureMatch ? scriptureMatch[0] : undefined;
    window.dispatchEvent(
      new CustomEvent('navigate_tab', {
        detail: {
          tab: 'bible',
          subtab: ref ? 'study' : 'reader',
          reference: ref,
        },
      })
    );
    if (ref) {
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('switch_study_tab', {
            detail: {
              tab: 'study',
              reference: ref,
            },
          })
        );
      }, 60);
    }
  };

  const handleTagClick = (tag: string) => {
    soundEffects.playTap();
    const clean = tag.toLowerCase().replace('#', '').trim();
    if (['prayer', 'prayers', 'prayerwall', 'healing'].includes(clean)) {
      handleGoToPrayerWall();
    } else if (['sermon', 'sermons', 'pulpit', 'podcast'].includes(clean)) {
      handleGoToSermons();
    } else if (['devotional', 'dailydevotional'].includes(clean)) {
      window.dispatchEvent(new CustomEvent('navigate_tab', { detail: { tab: 'devotional' } }));
    } else if (['recovery', 'fellowship'].includes(clean)) {
      window.dispatchEvent(new CustomEvent('navigate_tab', { detail: { tab: 'recovery' } }));
    } else if (['scripture', 'bible', 'verse'].includes(clean)) {
      handleGoToBible();
    } else {
      window.dispatchEvent(new CustomEvent('set_feed_filter', { detail: { filter: tag } }));
    }
  };

  React.useEffect(() => {
    const handleOpenPost = (e: Event) => {
      const customEvent = e as CustomEvent<{ postId: string; openComments?: boolean }>;
      if (customEvent.detail?.postId === post.id) {
        setIsHighlighted(true);
        if (customEvent.detail.openComments) {
          setIsCommentsOpen(true);
        }
        const el = document.getElementById(`post-card-${post.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setTimeout(() => setIsHighlighted(false), 3000);
      }
    };
    window.addEventListener('open_post', handleOpenPost);
    return () => window.removeEventListener('open_post', handleOpenPost);
  }, [post.id]);

  const handleLike = (e?: React.MouseEvent) => {
    likePost(post.id);
    window.dispatchEvent(
      new CustomEvent('trigger_aura_burst', {
        detail: {
          type: 'community',
          text: '✦ Community Connection & Love',
          x: e?.clientX,
          y: e?.clientY,
        },
      })
    );
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText);
    setCommentText('');
    window.dispatchEvent(
      new CustomEvent('trigger_aura_burst', {
        detail: {
          type: 'community',
          text: '✦ Fellowship Energy Shared',
        },
      })
    );
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Post by ${post.authorName} on Aura`,
          text: post.content,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const [isExpandedText, setIsExpandedText] = useState(false);
  const isTextLong = post.content.length > 220;

  return (
    <article
      id={`post-card-${post.id}`}
      className={`rounded-2xl bg-[#0b0f24]/90 backdrop-blur-xl border shadow-lg transition-all duration-300 mb-4 ${
        isHighlighted
          ? 'border-amber-400/80 shadow-[0_0_30px_rgba(59,130,246,0.3)] ring-2 ring-amber-400/50'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Author Header */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between">
        <div
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent('open_user_profile', { detail: { userId: post.authorId } })
            );
          }}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
          title={`View ${post.authorName}'s profile`}
        >
          <div className="transition-transform group-hover:scale-105">
            <Avatar src={post.authorAvatar} name={post.authorName} size="md" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                {post.authorName}
              </h4>
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="group-hover:text-slate-300">@{post.authorHandle}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {post.isPendingSync ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Queued offline
                  </span>
                ) : (
                  formatDistanceToNow(post.createdAt, { addSuffix: true })
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          {post.location && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <MapPin className="w-3 h-3" />
              <span>{post.location}</span>
            </div>
          )}

          {canEdit && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 w-36 bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setIsEditing(true);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Post
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (confirm('Are you sure you want to delete this post?')) {
                        deletePost(post.id);
                      }
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Text Content & Video Embeds */}
      <div className="px-3.5 sm:px-4 pb-2.5">
        <div className={`relative ${!isExpandedText && isTextLong ? 'max-h-24 overflow-hidden' : ''}`}>
          <RichTextRenderer content={post.content} className="text-sm text-slate-200 leading-relaxed" />
          {!isExpandedText && isTextLong && (
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0b0f24] to-transparent pointer-events-none" />
          )}
        </div>

        {isTextLong && (
          <button
            onClick={() => setIsExpandedText(!isExpandedText)}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 mt-1 focus:outline-none"
          >
            {isExpandedText ? 'Show less' : 'See more...'}
          </button>
        )}

        {/* Tags / Categories */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="text-[11px] font-medium text-amber-400/90 hover:text-amber-300 hover:underline cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Deep-link Shortcut Action Badges */}
        {(isPrayerPost || isSermonPost || isScripturePost || isDevotionalPost || isRecoveryPost) && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-white/5">
            {isPrayerPost && (
              <button
                onClick={handleGoToPrayerWall}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 text-xs font-bold transition-all active:scale-95 shadow-sm group"
              >
                <span>🙏 Open on Prayer Wall</span>
                <ArrowRight className="w-3 h-3 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {isSermonPost && (
              <button
                onClick={handleGoToSermons}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 text-xs font-bold transition-all active:scale-95 shadow-sm group"
              >
                <span>🎙️ Open in Pulpit / Sermons</span>
                <ArrowRight className="w-3 h-3 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {isScripturePost && (
              <button
                onClick={handleGoToBible}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/35 text-yellow-300 text-xs font-bold transition-all active:scale-95 shadow-sm group"
              >
                <span>📖 Open {scriptureMatch ? scriptureMatch[0] : 'in Bible Study'}</span>
                <ArrowRight className="w-3 h-3 text-yellow-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {isDevotionalPost && (
              <button
                onClick={() => {
                  soundEffects.playTap();
                  window.dispatchEvent(new CustomEvent('navigate_tab', { detail: { tab: 'devotional' } }));
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/35 text-orange-300 text-xs font-bold transition-all active:scale-95 shadow-sm group"
              >
                <span>✨ Daily Devotional</span>
                <ArrowRight className="w-3 h-3 text-orange-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {isRecoveryPost && (
              <button
                onClick={() => {
                  soundEffects.playTap();
                  window.dispatchEvent(new CustomEvent('navigate_tab', { detail: { tab: 'recovery' } }));
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-bold transition-all active:scale-95 shadow-sm group"
              >
                <span>🤝 Fellowship & Recovery</span>
                <ArrowRight className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Media Photo & Direct Video Responsive Display */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (() => {
        const nonBlankMedia = post.mediaUrls.filter(
          (url) => typeof url === 'string' && url.trim().length > 0
        );
        if (nonBlankMedia.length === 0) return null;

        const contentVideos = extractVideosFromText(post.content);
        const contentVideoUrls = new Set(contentVideos.map((v) => v.url));

        const externalVideoMedia = nonBlankMedia.filter((url) => {
          const yt = extractVideosFromText(url);
          return yt.length > 0 && yt[0].type !== 'direct' && !contentVideoUrls.has(url);
        });

        const nativeMedia = nonBlankMedia.filter((url) => {
          const yt = extractVideosFromText(url);
          return yt.length === 0 || yt[0].type === 'direct';
        });

        if (externalVideoMedia.length === 0 && nativeMedia.length === 0) return null;

        return (
          <div className="mb-2 space-y-2">
            {/* Any external video embeds (YouTube) */}
            {externalVideoMedia.map((vUrl, vIdx) => {
              const extracted = extractVideosFromText(vUrl);
              const vObj = extracted[0];
              return (
                <div key={vIdx} className="px-3.5 sm:px-4">
                  <VideoEmbed video={vObj} />
                </div>
              );
            })}

            {/* Native Media (Photos & Direct Videos) */}
            {nativeMedia.length === 1 && (
              <div
                onClick={() => {
                  if (!isDirectVideoUrl(nativeMedia[0])) {
                    setSelectedPhotoIndex(0);
                  }
                }}
                className={`relative w-full max-h-[520px] bg-black/60 flex items-center justify-center overflow-hidden ${
                  !isDirectVideoUrl(nativeMedia[0]) ? 'cursor-pointer group' : ''
                }`}
              >
                {isDirectVideoUrl(nativeMedia[0]) ? (
                  <AsyncMedia
                    mediaType="video"
                    src={nativeMedia[0]}
                    controls
                    playsInline
                    className="w-full max-h-[520px] object-contain bg-black"
                  />
                ) : (
                  <>
                    <div className="relative w-full max-h-[560px] flex items-center justify-center bg-black/90 overflow-hidden">
                      <AsyncMedia
                        mediaType="image"
                        src={nativeMedia[0]}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-110 pointer-events-none"
                      />
                      <AsyncMedia
                        mediaType="image"
                        src={nativeMedia[0]}
                        alt="Post media"
                        className="relative z-10 w-full max-h-[560px] object-contain transition-transform duration-300 group-hover:scale-[1.005]"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-xs font-semibold text-white border border-white/20 shadow-xl">
                        Click to View Full Size
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {nativeMedia.length > 1 && (
              <div
                className={`grid gap-1 px-1 ${
                  nativeMedia.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
                }`}
              >
                {nativeMedia.map((url, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (!isDirectVideoUrl(url)) {
                        setSelectedPhotoIndex(i);
                      }
                    }}
                    className={`relative aspect-square overflow-hidden rounded-lg ${
                      !isDirectVideoUrl(url) ? 'cursor-pointer group' : ''
                    } bg-black/50`}
                  >
                    {isDirectVideoUrl(url) ? (
                      <AsyncMedia
                        mediaType="video"
                        src={url}
                        controls
                        playsInline
                        className="w-full h-full object-contain bg-black"
                      />
                    ) : (
                      <>
                        <AsyncMedia
                          mediaType="image"
                          src={url}
                          alt={`Photo ${i + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] text-white">
                            View
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Engagement Counters / Reaction Summary (Facebook-style) */}
      {(post.likesCount > 0 || (post.comments && post.comments.length > 0)) && (
        <div className="px-3.5 sm:px-4 py-1.5 flex items-center justify-between text-xs text-slate-400 border-b border-white/5">
          <div className="flex items-center gap-1.5">
            {post.likesCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center">
                  <Heart className="w-2.5 h-2.5 fill-pink-400" />
                </span>
                <span className="text-[11px] text-slate-300">{post.likesCount}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            {post.comments && post.comments.length > 0 && (
              <button
                onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                className="hover:underline"
              >
                {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Minimal Action Buttons Bar (Facebook 3-Column Layout) */}
      <div className="px-2 py-1 border-t border-white/5 flex items-center justify-between gap-1">
        {/* Like Button */}
        <button
          id={`like-btn-${post.id}`}
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            isLiked
              ? 'text-pink-400 bg-pink-500/10'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-500 text-pink-500' : ''}`} />
          <span>Like</span>
        </button>

        {/* Comment Toggle */}
        <button
          id={`comments-toggle-${post.id}`}
          onClick={() => setIsCommentsOpen(!isCommentsOpen)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all ${
            isCommentsOpen ? 'bg-white/5 text-amber-400' : ''
          }`}
        >
          <MessageCircle className="w-4 h-4 text-amber-400" />
          <span>Comment</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
          title="Share Post"
        >
          <Share2 className="w-4 h-4 text-slate-400" />
          <span>Share</span>
        </button>
      </div>

      {/* Expandable Comments Drawer */}
      {isCommentsOpen && (
        <div className="px-3.5 sm:px-4 py-3 border-t border-white/5 bg-black/25 space-y-3">
          {post.comments && post.comments.length > 0 ? (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {post.comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2 text-xs">
                  <div
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent('open_user_profile', { detail: { userId: c.authorId } })
                      );
                    }}
                    className="cursor-pointer hover:scale-105 transition-transform mt-0.5"
                    title={`View ${c.authorName}'s profile`}
                  >
                    <Avatar src={c.authorAvatar} name={c.authorName} size="xs" />
                  </div>
                  <div className="flex-1 bg-white/5 rounded-2xl px-3 py-2 border border-white/5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('open_user_profile', { detail: { userId: c.authorId } })
                          );
                        }}
                        className="font-bold text-white cursor-pointer hover:text-amber-300 transition-colors"
                      >
                        {c.authorName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDistanceToNow(c.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    <div className="mt-0.5">
                      <RichTextRenderer
                        content={c.content}
                        className="text-slate-200"
                        showVideoEmbeds={true}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No comments yet. Write the first thought!</p>
          )}

          {/* Comment Input */}
          <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="p-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Lightbox for full image inspection */}
      {selectedPhotoIndex !== null && (
        <ImageLightboxModal
          isOpen={true}
          images={post.mediaUrls}
          initialIndex={selectedPhotoIndex}
          caption={post.content}
          authorName={post.authorName}
          authorAvatar={post.authorAvatar}
          authorHandle={post.authorHandle}
          createdAt={post.createdAt}
          onClose={() => setSelectedPhotoIndex(null)}
        />
      )}

      {isEditing && (
        <CreatePostModal
          onClose={() => setIsEditing(false)}
          initialContent={post.content}
          initialTags={post.tags}
          initialMedia={post.mediaUrls}
          initialLocation={post.location}
          editPostId={post.id}
        />
      )}
    </article>
  );
};
