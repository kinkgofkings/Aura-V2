import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { SocialPost, UserStory, PostComment, StorySlide } from '../types';

const INITIAL_POSTS: SocialPost[] = [];
const INITIAL_STORIES: UserStory[] = [];
import { offlineStorage, STORAGE_KEYS } from '../services/offlineStorage';
import { notificationService } from '../services/notifications';
import { soundEffects } from '../services/audio';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface SocialContextType {
  posts: SocialPost[];
  stories: UserStory[];
  savedPostIds: string[];
  createPost: (content: string, mediaUrls: string[], tags: string[], location?: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  editPost: (postId: string, content: string, mediaUrls: string[], tags: string[], location?: string) => Promise<void>;
  toggleSavePost: (postId: string) => Promise<void>;
  addStory: (mediaUrl: string, caption?: string) => Promise<void>;
  deleteStory: (storyId: string) => Promise<void>;
  deleteStorySlide: (storyId: string, slideId: string) => Promise<void>;
  markStorySeen: (storyId: string) => Promise<void>;
  getPostById: (postId: string) => SocialPost | undefined;
  refreshFeed: () => Promise<void>;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const [posts, setPosts] = useState<SocialPost[]>(() => {
    const loaded = offlineStorage.load<SocialPost[]>(STORAGE_KEYS.POSTS, []);
    return (loaded || []).filter(
      (p) =>
        p &&
        !['user_alex', 'user_maya', 'user_liam', 'user_elena'].includes(p.authorId) &&
        !['post_1', 'post_2', 'post_3'].includes(p.id)
    );
  });

  const [stories, setStories] = useState<UserStory[]>(() => {
    const loaded = offlineStorage.load<UserStory[]>(STORAGE_KEYS.STORIES, []);
    return (loaded || []).filter(
      (s) =>
        s &&
        !['user_alex', 'user_maya', 'user_liam', 'user_elena'].includes(s.userId) &&
        !['story_1', 'story_2', 'story_3'].includes(s.id)
    );
  });

  const [savedPostIds, setSavedPostIds] = useState<string[]>(() => {
    return offlineStorage.load<string[]>(STORAGE_KEYS.BOOKMARKS, []).filter((id) => !id.startsWith('post_'));
  });

  const inFlightStoryUploads = useRef<Set<string>>(new Set());

  // Fetch posts & stories from server API with smart real-time merging
  const refreshFeed = async () => {
    try {
      const [serverPosts, serverStories] = await Promise.all([api.getPosts(), api.getStories()]);
      if (Array.isArray(serverPosts)) {
        const cleanServerPosts = serverPosts.filter(
          (p) =>
            p &&
            !['user_alex', 'user_maya', 'user_liam', 'user_elena'].includes(p.authorId) &&
            !['post_1', 'post_2', 'post_3'].includes(p.id)
        );
        setPosts((prevPosts) => {
          // Merge server posts with any optimistic local posts
          const serverMap = new Map<string, SocialPost>();
          cleanServerPosts.forEach((sp) => serverMap.set(sp.id, sp));

          // Include any pending offline posts that are not yet on the server
          const merged: SocialPost[] = [];
          const seenIds = new Set<string>();

          // Server posts take canonical precedence for comments and likes
          cleanServerPosts.forEach((sp) => {
            seenIds.add(sp.id);
            merged.push(sp);
          });

          // Check if local has any temp/offline pending posts (only truly pending posts, not stale cached ones)
          prevPosts.forEach((lp) => {
            if (lp.isPendingSync && !seenIds.has(lp.id)) {
              seenIds.add(lp.id);
              merged.unshift(lp);

              // Auto-sync pending post to server in background
              if (lp.isPendingSync) {
                api.createPost({
                  authorId: lp.authorId,
                  authorName: lp.authorName,
                  authorHandle: lp.authorHandle,
                  authorAvatar: lp.authorAvatar,
                  content: lp.content,
                  mediaUrls: lp.mediaUrls,
                  tags: lp.tags,
                  location: lp.location,
                }).then((saved) => {
                  if (saved) {
                    setPosts((current) => [saved, ...current.filter((p) => p.id !== lp.id)]);
                  }
                }).catch(() => {});
              }
            }
          });

          offlineStorage.save(STORAGE_KEYS.POSTS, merged);
          return merged;
        });
      }

      if (Array.isArray(serverStories)) {
        const cleanStories = serverStories.filter(
          (s) =>
            s &&
            !['user_alex', 'user_maya', 'user_liam', 'user_elena'].includes(s.userId) &&
            !['story_1', 'story_2', 'story_3'].includes(s.id)
        );
        const STORY_CUTOFF = 24 * 60 * 60 * 1000;
        const now = Date.now();
        const currentUser = userRef.current || user;

        setStories((prev) => {
          const serverMap = new Map<string, UserStory>();
          cleanStories.forEach((s) => {
            if (s.userId) serverMap.set(s.userId, s);
          });

          // Preserve any active stories from local state without re-posting
          prev.forEach((localStory) => {
            if (!localStory || !localStory.userId) return;
            if (now - localStory.createdAt >= STORY_CUTOFF) return;

            const existingServer = serverMap.get(localStory.userId);
            if (!existingServer) {
              serverMap.set(localStory.userId, localStory);
            } else {
              // Server has the story, ensure all slides in existingServer are unique by exact mediaUrl
              if (existingServer.slides && existingServer.slides.length > 0) {
                const seenUrls = new Set<string>();
                existingServer.slides = existingServer.slides.filter((sl) => {
                  if (!sl || !sl.mediaUrl) return false;
                  if (seenUrls.has(sl.mediaUrl)) return false;
                  seenUrls.add(sl.mediaUrl);
                  return true;
                });
              }
            }
          });

          const combined = Array.from(serverMap.values()).filter(
            (s) => now - s.createdAt < STORY_CUTOFF
          );
          offlineStorage.save(STORAGE_KEYS.STORIES, combined);
          return combined;
        });
      }
    } catch (err) {
      console.warn('Feed refresh error:', err);
    }
  };


  useEffect(() => {
    refreshFeed();
    // Real-time cross-device sync interval (every 10 seconds to avoid network contention)
    const interval = setInterval(refreshFeed, 10000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshFeed();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Save to offline storage
  useEffect(() => {
    offlineStorage.save(STORAGE_KEYS.POSTS, posts);
  }, [posts]);

  useEffect(() => {
    offlineStorage.save(STORAGE_KEYS.STORIES, stories);
  }, [stories]);

  useEffect(() => {
    offlineStorage.save(STORAGE_KEYS.BOOKMARKS, savedPostIds);
  }, [savedPostIds]);

  // Listen to cross-tab updates
  useEffect(() => {
    const unsub = offlineStorage.onBroadcastEvent(({ type, payload }) => {
      if (type === 'new_post') {
        setPosts((prev) => [payload, ...prev.filter((p) => p.id !== payload.id)]);
      } else if (type === 'post_liked') {
        setPosts((prev) =>
          prev.map((p) => (p.id === payload.postId ? { ...p, likesCount: payload.likesCount, likedByUserIds: payload.likedByUserIds } : p))
        );
      } else if (type === 'new_comment') {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === payload.postId) {
              const comments = p.comments || [];
              if (comments.some((c) => c.id === payload.comment.id)) {
                return p;
              }
              return {
                ...p,
                commentsCount: comments.length + 1,
                comments: [...comments, payload.comment],
              };
            }
            return p;
          })
        );
      } else if (type === 'new_story') {
        setStories((prev) => {
          const existingIdx = prev.findIndex((s) => s.userId === payload.userId || s.id === payload.id);
          if (existingIdx !== -1) {
            const updated = [...prev];
            updated[existingIdx] = payload;
            return updated;
          }
          return [payload, ...prev];
        });
      } else if (type === 'delete_story') {
        setStories((prev) => prev.filter((s) => s.id !== payload.storyId));
      }
    });
    return () => unsub();
  }, []);

  const createPost = async (content: string, mediaUrls: string[], tags: string[], location?: string) => {
    const currentUser = userRef.current || user || {
      id: 'user_tex',
      name: 'Tex',
      handle: 'tex',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=lightsouttattootex@gmail.com',
    };

    // If any mediaUrls are data: URIs, attempt background conversion to static files
    let processedMedia = [...mediaUrls];
    try {
      const uploadPromises = processedMedia.map(async (m) => {
        if (typeof m === 'string' && m.startsWith('data:')) {
          try {
            // Convert data URI to Blob
            const commaIdx = m.indexOf(',');
            if (commaIdx !== -1) {
              const header = m.substring(0, commaIdx);
              const b64 = m.substring(commaIdx + 1);
              const mimeMatch = header.match(/:(.*?);/);
              const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
              const byteCharacters = atob(b64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: mime });
              const uploaded = await api.uploadFile(blob, `post_img_${Date.now()}.jpg`);
              if (uploaded?.url) return uploaded.url;
            }
          } catch (e) {
            console.warn('[SocialContext] Inline upload fallback notice:', e);
          }
        }
        return m;
      });
      // Allow up to 3 seconds for client upload before proceeding
      const uploadResults = await Promise.race([
        Promise.all(uploadPromises),
        new Promise<string[]>((resolve) => setTimeout(() => resolve(processedMedia), 3000)),
      ]);
      processedMedia = uploadResults;
    } catch {
      // Proceed with processedMedia as-is
    }

    const newPostData = {
      authorId: currentUser.id,
      authorName: currentUser.name || 'Believer',
      authorHandle: currentUser.handle || 'believer',
      authorAvatar: currentUser.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=lightsouttattootex@gmail.com',
      content,
      mediaUrls: processedMedia,
      tags,
      location,
    };

    // Optimistic UI update
    const tempPost: SocialPost = {
      ...newPostData,
      id: 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      likesCount: 0,
      likedByUserIds: [],
      commentsCount: 0,
      comments: [],
      sharesCount: 0,
      savedByUserIds: [],
      createdAt: Date.now(),
      isPendingSync: true,
    };

    setPosts((prev) => {
      const updated = [tempPost, ...prev];
      offlineStorage.save(STORAGE_KEYS.POSTS, updated);
      return updated;
    });

    // Save to server database with a safety timeout so UI never hangs
    try {
      const serverPromise = api.createPost(newPostData);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
      const savedServerPost = await Promise.race([serverPromise, timeoutPromise]);

      if (savedServerPost) {
        setPosts((prev) => {
          const resolved = { ...savedServerPost, isPendingSync: false };
          const updated = [resolved, ...prev.filter((p) => p.id !== tempPost.id)];
          offlineStorage.save(STORAGE_KEYS.POSTS, updated);
          return updated;
        });
        offlineStorage.broadcastEvent('new_post', savedServerPost);
      } else {
        offlineStorage.broadcastEvent('new_post', tempPost);
      }
    } catch (err) {
      console.warn('Background save to server deferred:', err);
      offlineStorage.broadcastEvent('new_post', tempPost);
    }

    notificationService.notify({
      type: 'system',
      title: 'Post Published',
      body: 'Your post is published and visible on the sanctuary feed ✨',
      avatar: currentUser.avatarUrl,
      playSound: false,
    });
  };

  const likePost = async (postId: string) => {
    if (!user) return;
    
    // Find post first to do side effects safely outside state updater
    const post = posts.find((p) => p.id === postId);
    if (post) {
      const isLiked = post.likedByUserIds.includes(user.id);
      if (!isLiked) {
        soundEffects.playLikeSparkle();
        try {
          confetti({
            particleCount: 25,
            spread: 40,
            origin: { y: 0.8 },
            colors: ['#ec4899', '#8b5cf6', '#3b82f6'],
          });
        } catch (e) {}

        /* Outgoing like notification handled by server for recipient only */
      }
    }

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = p.likedByUserIds.includes(user.id);
          const updatedLikes = isLiked
            ? p.likedByUserIds.filter((id) => id !== user.id)
            : [...p.likedByUserIds, user.id];
          const newCount = isLiked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1;
          
          const updatedPost = {
            ...p,
            likesCount: newCount,
            likedByUserIds: updatedLikes,
          };
          
          offlineStorage.broadcastEvent('post_liked', {
            postId: p.id,
            likesCount: newCount,
            likedByUserIds: updatedLikes,
          });
          
          return updatedPost;
        }
        return p;
      })
    );

    // Call server
    await api.likePost(postId, user.id);
  };

  const addComment = async (postId: string, content: string) => {
    if (!user || !content.trim()) return;

    const newComment: PostComment = {
      id: 'comment_' + Date.now(),
      postId,
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatarUrl,
      content: content.trim(),
      createdAt: Date.now(),
      likesCount: 0,
      likedByUserIds: [],
    };

    const post = posts.find((p) => p.id === postId);
    /* Outgoing comment notification handled by server for recipient only */

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const updated = {
            ...p,
            commentsCount: p.commentsCount + 1,
            comments: [...(p.comments || []), newComment],
          };

          offlineStorage.broadcastEvent('new_comment', {
            postId,
            comment: newComment,
          });

          return updated;
        }
        return p;
      })
    );

    soundEffects.playMessageSent();
    await api.addComment(postId, user.id, content.trim());
  };

  const deletePost = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    await api.deletePost(postId);
  };

  const editPost = async (postId: string, content: string, mediaUrls: string[], tags: string[], location?: string) => {
    const updates = { content, mediaUrls, tags, location };
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, ...updates } : p))
    );
    await api.editPost(postId, updates);
  };

  const toggleSavePost = async (postId: string) => {
    if (!user) return;
    setSavedPostIds((prev) => {
      if (prev.includes(postId)) {
        return prev.filter((id) => id !== postId);
      } else {
        return [...prev, postId];
      }
    });
    await api.bookmarkPost(postId, user.id);
  };

  const addStory = async (mediaUrl: string, caption?: string) => {
    const currentUser = userRef.current || user || {
      id: 'user_tex',
      name: 'Tex',
      handle: 'tex',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=lightsouttattootex@gmail.com',
    };

    // If mediaUrl is data URI, try upload to static file
    let finalMediaUrl = mediaUrl;
    if (typeof mediaUrl === 'string' && mediaUrl.startsWith('data:')) {
      try {
        const commaIdx = mediaUrl.indexOf(',');
        if (commaIdx !== -1) {
          const header = mediaUrl.substring(0, commaIdx);
          const b64 = mediaUrl.substring(commaIdx + 1);
          const mimeMatch = header.match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const byteCharacters = atob(b64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const blob = new Blob([new Uint8Array(byteNumbers)], { type: mime });
          const uploadRes = await Promise.race([
            api.uploadFile(blob, `story_${Date.now()}.jpg`),
            new Promise<null>((res) => setTimeout(() => res(null), 3000)),
          ]);
          if (uploadRes?.url) finalMediaUrl = uploadRes.url;
        }
      } catch (err) {
        console.warn('Story upload fallback notice:', err);
      }
    }

    // Prevent duplicate in-flight network retries for the exact same upload
    if (inFlightStoryUploads.current.has(finalMediaUrl)) {
      return;
    }
    inFlightStoryUploads.current.add(finalMediaUrl);
    setTimeout(() => {
      inFlightStoryUploads.current.delete(mediaUrl);
    }, 4000);

    const now = Date.now();
    const slideId = 'slide_' + now + '_' + Math.random().toString(36).substr(2, 4);
    const newSlide: StorySlide = {
      id: slideId,
      mediaUrl,
      caption,
      createdAt: now,
    };

    // Optimistic UI update: Check if user already has an active story
    setStories((prev) => {
      const existingIndex = prev.findIndex((s) => s.userId === currentUser.id);
      if (existingIndex !== -1) {
        const existing = prev[existingIndex];
        const existingSlides =
          existing.slides && existing.slides.length > 0
            ? [...existing.slides]
            : [
                {
                  id: `slide_${existing.id}`,
                  mediaUrl: existing.mediaUrl,
                  caption: existing.caption,
                  createdAt: existing.createdAt,
                },
              ];

        // Deduplication: only reject if the exact same photo was added within the last 15 seconds
        const alreadyInSlides = existingSlides.some(
          (sl) => sl.mediaUrl === mediaUrl && Math.abs(sl.createdAt - now) < 15000
        );
        if (alreadyInSlides) {
          return prev;
        }

        const updatedStory: UserStory = {
          ...existing,
          userName: currentUser.name || existing.userName,
          userAvatar: currentUser.avatarUrl || existing.userAvatar,
          mediaUrl,
          caption,
          createdAt: now,
          seenByUserIds: [currentUser.id],
          slides: [...existingSlides, newSlide],
          isPendingSync: true,
        };
        const updated = [...prev];
        updated[existingIndex] = updatedStory;
        offlineStorage.save(STORAGE_KEYS.STORIES, updated);
        return updated;
      } else {
        const newStory: UserStory = {
          id: 'story_' + now + '_' + Math.random().toString(36).substr(2, 4),
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatarUrl,
          mediaUrl,
          caption,
          createdAt: now,
          seenByUserIds: [currentUser.id],
          slides: [newSlide],
          isPendingSync: true,
        };
        const updated = [newStory, ...prev];
        offlineStorage.save(STORAGE_KEYS.STORIES, updated);
        return updated;
      }
    });

    notificationService.notify({
      type: 'system',
      title: 'Story Added',
      body: 'Your photo was added to your story reel!',
      avatar: currentUser.avatarUrl,
      playSound: false,
    });

    try {
      const savedStory = await api.createStory(
        currentUser.id,
        mediaUrl,
        caption,
        currentUser.name,
        currentUser.avatarUrl
      );
      if (savedStory) {
        setStories((prev) => {
          const idx = prev.findIndex((s) => s.userId === currentUser.id || s.id === savedStory.id);
          const resolved = { ...savedStory, isPendingSync: false };
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = resolved;
            offlineStorage.save(STORAGE_KEYS.STORIES, updated);
            return updated;
          }
          const updated = [resolved, ...prev];
          offlineStorage.save(STORAGE_KEYS.STORIES, updated);
          return updated;
        });
        offlineStorage.broadcastEvent('new_story', savedStory);
      }
    } catch (err) {
      console.warn('Error saving story to server, keeping in optimistic offline reel:', err);
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!user) return;
    setStories((prev) => {
      const updated = prev.filter((s) => s.id !== storyId);
      offlineStorage.save(STORAGE_KEYS.STORIES, updated);
      return updated;
    });
    offlineStorage.broadcastEvent('delete_story', { storyId });
    await api.deleteStory(storyId, user.id);
  };

  const deleteStorySlide = async (storyId: string, slideId: string) => {
    if (!user) return;
    setStories((prev) => {
      const updated = prev
        .map((s) => {
          if (s.id === storyId) {
            if (s.slides && s.slides.length > 1) {
              const updatedSlides = s.slides.filter((sl) => sl.id !== slideId);
              const last = updatedSlides[updatedSlides.length - 1];
              return {
                ...s,
                mediaUrl: last.mediaUrl,
                caption: last.caption,
                slides: updatedSlides,
              };
            } else {
              return null;
            }
          }
          return s;
        })
        .filter(Boolean) as UserStory[];
      offlineStorage.save(STORAGE_KEYS.STORIES, updated);
      return updated;
    });
    const updated = await api.deleteStorySlide(storyId, slideId, user.id);
    if (updated) {
      offlineStorage.broadcastEvent('new_story', updated);
    }
  };

  const markStorySeen = async (storyId: string) => {
    if (!user) return;
    setStories((prev) =>
      prev.map((s) => {
        if (s.id === storyId && !s.seenByUserIds.includes(user.id)) {
          return { ...s, seenByUserIds: [...s.seenByUserIds, user.id] };
        }
        return s;
      })
    );
    await api.markStorySeen(storyId, user.id);
  };

  const getPostById = (postId: string) => {
    return posts.find((p) => p.id === postId);
  };

  return (
    <SocialContext.Provider
      value={{
        posts,
        stories,
        savedPostIds,
        createPost,
        likePost,
        addComment,
        deletePost,
        editPost,
        toggleSavePost,
        addStory,
        deleteStory,
        deleteStorySlide,
        markStorySeen,
        getPostById,
        refreshFeed,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
};

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) throw new Error('useSocial must be used within a SocialProvider');
  return context;
};
