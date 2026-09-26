import React, { useState, useEffect } from 'react';
import { Sparkles, Image as ImageIcon, Video, Compass, Share2, QrCode } from 'lucide-react';
import { useSocial } from '../../context/SocialContext';
import { useAuth } from '../../context/AuthContext';
import { StoriesReel } from '../stories/StoriesReel';
import { ActiveUsersBar } from './ActiveUsersBar';
import { PostCard } from './PostCard';
import { CreatePostModal, POST_CATEGORIES } from './CreatePostModal';
import { Avatar } from '../common/Avatar';
import { 
  PrayerDriftCard, 
  SermonDriftCard, 
  NewMemberDriftCard, 
  GroupActivityDriftCard 
} from './FeedDriftCards';

const TAG_FILTERS = ['All', ...POST_CATEGORIES];

export const SocialFeed: React.FC = () => {
  const { posts } = useSocial();
  const { user, allUsers } = useAuth();

  const [activeFilter, setActiveFilter] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [initialPostContent, setInitialPostContent] = useState('');
  const [initialPostTags, setInitialPostTags] = useState('');

  useEffect(() => {
    const handleOpenCreatePost = (e: Event) => {
      const customEvent = e as CustomEvent<{ content?: string; tags?: string }>;
      if (customEvent.detail?.content) {
        setInitialPostContent(customEvent.detail.content);
      }
      if (customEvent.detail?.tags) {
        setInitialPostTags(customEvent.detail.tags);
      }
      setIsCreateModalOpen(true);
    };

    const handleSetFilter = (e: Event) => {
      const customEvent = e as CustomEvent<{ filter?: string }>;
      if (customEvent.detail?.filter) {
        const clean = customEvent.detail.filter.replace('#', '').trim();
        const found = TAG_FILTERS.find((t) => t.toLowerCase() === clean.toLowerCase());
        if (found) {
          setActiveFilter(found);
        } else {
          setActiveFilter(clean);
        }
      }
    };

    window.addEventListener('open_create_post', handleOpenCreatePost);
    window.addEventListener('set_feed_filter', handleSetFilter);
    return () => {
      window.removeEventListener('open_create_post', handleOpenCreatePost);
      window.removeEventListener('set_feed_filter', handleSetFilter);
    };
  }, []);

  const filteredPosts = posts.filter((post) => {
    if (activeFilter === 'All') return true;
    return post.tags.some((t) => t.toLowerCase() === activeFilter.toLowerCase());
  });

  const handleOpenCreateModal = (presetCategory?: string) => {
    setInitialPostContent('');
    setInitialPostTags(presetCategory || (activeFilter !== 'All' ? activeFilter : ''));
    setIsCreateModalOpen(true);
  };

  const recentMember = allUsers.find((u) => u.id !== user?.id) || allUsers[0];

  return (
    <div id="social-feed-view" className="w-full max-w-2xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
      {/* 24-Hour Ephemeral Stories Reel - Facebook-style rich card layout */}
      <StoriesReel />

      {/* Real-time Active Online Members Bar */}
      <ActiveUsersBar />

      {/* Quick Create Post Trigger Card (Facebook-style composer) */}
      <div
        id="quick-post-card"
        className="rounded-2xl bg-[#0b0f24]/90 backdrop-blur-xl border border-white/10 p-3.5 sm:p-4 mb-4 shadow-lg"
      >
        <div className="flex items-center gap-3">
          {user && <Avatar src={user.avatarUrl} name={user.name} size="md" />}
          <button
            onClick={() => handleOpenCreateModal()}
            className="flex-1 text-left px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 text-xs sm:text-sm transition-all flex items-center justify-between"
          >
            <span>What's on your mind?</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5 gap-1">
          <button
            onClick={() => handleOpenCreateModal('Photography')}
            className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-slate-300 hover:text-amber-400 py-1.5 rounded-lg hover:bg-white/5 transition-all"
          >
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span>Photo</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal()}
            className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-slate-300 hover:text-amber-300 py-1.5 rounded-lg hover:bg-white/5 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Cards & Quotes</span>
            <span className="sm:hidden">Cards</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal()}
            className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-slate-300 hover:text-orange-400 py-1.5 rounded-lg hover:bg-white/5 transition-all"
          >
            <Video className="w-4 h-4 text-rose-400" />
            <span>Camera</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none mb-2">
        <div className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center flex-shrink-0">
          <Compass className="w-3.5 h-3.5" />
        </div>
        {TAG_FILTERS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveFilter(tag)}
            className={`px-3.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeFilter === tag
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25 border border-amber-400/30'
                : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Feed Posts Stream with Interleaved Drift Cards */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-8 bg-[#0b0f24]/60 border border-white/5 rounded-3xl p-6 space-y-2">
              <Sparkles className="w-8 h-8 text-amber-400/60 mx-auto" />
              <h3 className="text-sm font-bold text-white">Latest From Your Faith Community</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Stay connected with recent prayers, sermons, new members, and fellowships happening across AURA.
              </p>
            </div>
            <PrayerDriftCard />
            <SermonDriftCard />
            <NewMemberDriftCard member={recentMember} />
            <GroupActivityDriftCard />
          </div>
        ) : (
          filteredPosts.map((post, index) => {
            // Interleave drift cards throughout the feed
            const showPrayerDrift = index === 0;
            const showSermonDrift = index === 2 || (index > 2 && index % 6 === 2);
            const showNewMemberDrift = index === 4 || (index > 4 && index % 6 === 4);
            const showGroupActivityDrift = index === 6 || (index > 6 && index % 6 === 0);

            return (
              <React.Fragment key={post.id}>
                <PostCard post={post} />

                {showPrayerDrift && <PrayerDriftCard index={index} />}
                {showSermonDrift && <SermonDriftCard index={index} />}
                {showNewMemberDrift && <NewMemberDriftCard member={recentMember} />}
                {showGroupActivityDrift && <GroupActivityDriftCard />}
              </React.Fragment>
            );
          })
        )}

        {/* If fewer than 5 posts, ensure remaining community drift cards still appear */}
        {filteredPosts.length > 0 && filteredPosts.length < 3 && (
          <>
            <SermonDriftCard />
            <NewMemberDriftCard member={recentMember} />
            <GroupActivityDriftCard />
          </>
        )}
        {filteredPosts.length >= 3 && filteredPosts.length < 5 && (
          <>
            <NewMemberDriftCard member={recentMember} />
            <GroupActivityDriftCard />
          </>
        )}
        {filteredPosts.length >= 5 && filteredPosts.length < 7 && (
          <GroupActivityDriftCard />
        )}
      </div>

      {/* Invite Friends & Share App Card at end of feed */}
      <div className="mt-8 p-6 rounded-[32px] bg-gradient-to-tr from-amber-600/15 via-yellow-600/10 to-orange-600/15 border border-amber-500/25 shadow-xl text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/20">
          <Share2 className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base font-bold text-white">Invite Friends to AURA</h4>
          <p className="text-xs text-slate-300 max-w-sm mx-auto mt-1">
            Share your personal referral link or QR code to chat in real-time, post stories, and jump on HD video calls!
          </p>
        </div>
        <button
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent('open_share_modal', { detail: { type: 'general' } })
            );
          }}
          className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-bold shadow-lg shadow-amber-500/30 transition-all hover:scale-105 inline-flex items-center gap-2"
        >
          <QrCode className="w-4 h-4" />
          <span>Open Invite & Share Hub</span>
        </button>
      </div>

      {/* Create Post Modal */}
      {isCreateModalOpen && (
        <CreatePostModal
          onClose={() => setIsCreateModalOpen(false)}
          initialContent={initialPostContent}
          initialTags={initialPostTags}
        />
      )}
    </div>
  );
};
