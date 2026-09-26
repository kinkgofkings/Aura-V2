import React, { useState, useRef } from 'react';
import { ArrowLeft, MessageSquare, Users, FileText, Image as ImageIcon, Send, Shield, Heart, MoreVertical, Flame , Settings, Trash2, Edit2, Camera, Check, X , Upload, Sparkles} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { UnsplashSearch } from '../common/UnsplashSearch';

interface GroupWallProps {
  group: {
    id: string;
    name: string;
    description: string;
    members: number;
    icon: 'heart' | 'shield';
    color: string;
    coverImage?: string;
    profileImage?: string;
  };
  onBack: () => void;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
}

export const GroupWall: React.FC<GroupWallProps> = ({ group, onBack, onUpdate, onDelete }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'rules' | 'members'>('feed');
  const [postText, setPostText] = useState('');
  
  const [posts, setPosts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('aura_group_posts_' + group.id);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'p1', author: 'Marcus J.', authorId: 'demo1', avatar: '', initial: 'M', time: '2 hours ago', content: 'Just wanted to share a praise report! Today makes 90 days clean for me. God has been so faithful. The urges have been strong this week, but leaning on the scripture we discussed in the live room on Tuesday really anchored me. Keep fighting the good fight, brothers and sisters!', likes: 24, comments: 5 },
      { id: 'p2', author: 'Sarah W.', authorId: 'demo2', avatar: '', initial: 'S', time: '5 hours ago', content: '"Therefore submit to God. Resist the devil and he will flee from you." - James 4:7. This verse is my shield today. Please keep me in prayer regarding a stressful situation at work that is testing my peace.', likes: 12, comments: 8 }
    ];
  });

  React.useEffect(() => {
    localStorage.setItem('aura_group_posts_' + group.id, JSON.stringify(posts));
  }, [posts, group.id]);

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostText, setEditPostText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [postImage, setPostImage] = useState('');
  const postFileInputRef = useRef<HTMLInputElement>(null);
  const [isPostUnsplashOpen, setIsPostUnsplashOpen] = useState(false);

  const handleCreatePost = () => {
    if (!postText.trim() && !postImage) return;
    const newPost = {
      id: 'post_' + Date.now(),
      author: user?.name || 'Anonymous',
      authorId: user?.id || 'anon',
      avatar: user?.avatarUrl || (user as any)?.photoURL || '',
      initial: (user?.name || 'A').charAt(0),
      time: 'Just now',
      content: postText,
      image: postImage,
      likes: 0,
      comments: 0
    };
    setPosts(prev => [newPost, ...prev]);
    setPostText('');
    setPostImage('');
  };

  const processPostImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPostImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleSaveEditPost = () => {
    if (!editPostText.trim() || !editingPostId) return;
    setPosts(prev => prev.map(p => p.id === editingPostId ? { ...p, content: editPostText } : p));
    setEditingPostId(null);
    setEditPostText('');
  };


  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent('navigate_tab', { detail: { tab: 'chat' } }));
    
    const chatGroupId = group.id.startsWith('g') ? 'group_' + group.id : group.id;
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open_chat_conversation', { 
        detail: { 
          id: chatGroupId,
          fallbackGroup: {
            id: chatGroupId,
            isGroup: true,
            name: group.name,
            avatar: group.profileImage,
            participantIds: [],
            participants: [],
            unreadCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        } 
      }));
    }, 50);
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/10 bg-slate-900 shadow-xl group/header">
        {group.coverImage ? (
          <img src={group.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-50" />
        ) : (
          <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${group.color}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
        <div className="relative p-6">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors w-fit bg-black/40 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-bold tracking-wide">Back</span>
            </button>
            <button onClick={() => setShowSettings(true)} className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white backdrop-blur-md border border-white/10 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-white/20 shadow-lg ${group.profileImage ? 'bg-black' : group.color.replace('from-', 'bg-').split(' ')[0] + '/40 backdrop-blur-sm'}`}>
                {group.profileImage ? (
                  <img src={group.profileImage} className="w-full h-full object-cover" />
                ) : group.icon === 'heart' ? (
                  <Heart className={`w-8 h-8 ${group.color.includes('blue') ? 'text-blue-400' : 'text-amber-400'}`} />
                ) : (
                  <Shield className={`w-8 h-8 ${group.color.includes('emerald') ? 'text-emerald-400' : 'text-amber-400'}`} />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">{group.name}</h1>
                <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-300">
                  <span className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/5">
                    <Users className="w-3.5 h-3.5" />
                    {group.members} Members
                  </span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleOpenChat}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Group Chat</span>
            </button>
          </div>
          
          <p className="mt-4 text-slate-300 text-sm leading-relaxed max-w-2xl">
            {group.description}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('feed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'feed' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
        >
          <Flame className="w-4 h-4" />
          Group Wall
        </button>
        <button 
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'rules' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
        >
          <FileText className="w-4 h-4" />
          Rules & Info
        </button>
        <button 
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'members' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
        >
          <Users className="w-4 h-4" />
          Members ({group.members})
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {activeTab === 'feed' && (
          <div className="space-y-6">
            {/* Create Post Input */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex gap-3">
                <Avatar src={user?.avatarUrl || (user as any)?.photoURL} name={user?.name} size="sm" />
                <div className="flex-1">
                  <textarea 
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder={`Share a testimony, prayer request, or encouragement with ${group.name}...`}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 resize-none min-h-[80px]"
                  />
                  {postImage && (
                    <div className="relative mt-2 mb-2 w-fit">
                      <img src={postImage} alt="Post Attachment" className="max-h-[200px] rounded-xl object-contain border border-white/20" />
                      <button onClick={() => setPostImage('')} className="absolute -top-2 -right-2 p-1 bg-black/80 hover:bg-black rounded-full text-white border border-white/20">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <input type="file" accept="image/*" ref={postFileInputRef} onChange={e => { if(e.target.files?.[0]) processPostImageFile(e.target.files[0]); e.target.value=''; }} className="hidden" />
                      <button onClick={() => postFileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors" title="Upload Image">
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => setIsPostUnsplashOpen(true)} className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors" title="Search Pexels">
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={handleCreatePost}
                      disabled={!postText.trim() && !postImage}
                      className="flex items-center gap-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-50 disabled:hover:bg-amber-500 text-sm font-bold rounded-lg transition-all"
                    >
                      <span>Post to Wall</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed Posts */}
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl relative group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {post.avatar ? (
                        <img src={post.avatar} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-white font-bold text-sm">
                          {post.initial}
                        </div>
                      )}
                      <div>
                        <h4 className="text-white font-bold text-sm">{post.author}</h4>
                        <p className="text-xs text-slate-400">{post.time}</p>
                      </div>
                    </div>
                    {/* Only author can edit/delete in this demo */}
                    {(post.authorId === user?.id || post.authorId === 'anon') && (
                      <div className="flex gap-2 opacity-100 transition-opacity">
                        <button onClick={() => { setEditingPostId(post.id); setEditPostText(post.content); }} className="p-1.5 text-slate-400 hover:text-amber-400 bg-white/5 hover:bg-white/10 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeletePost(post.id)} className="p-1.5 text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {editingPostId === post.id ? (
                    <div className="mb-4">
                      <textarea
                        value={editPostText}
                        onChange={(e) => setEditPostText(e.target.value)}
                        className="w-full bg-black/30 border border-amber-500/50 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-400 resize-none min-h-[80px]"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setEditingPostId(null)} className="px-3 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-lg">Cancel</button>
                        <button onClick={handleSaveEditPost} className="px-3 py-1.5 text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 rounded-lg">Save Edit</button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      {post.content && <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>}
                      {post.image && (
                        <div className="rounded-2xl overflow-hidden border border-white/10 mt-2 max-h-[400px]">
                          <img src={post.image} alt="Post attachment" className="w-full h-full object-contain bg-black/50" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-400 border-t border-white/10 pt-3">
                    <button className="flex items-center gap-1.5 hover:text-amber-400 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-amber-400 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.comments} Comments</span>
                    </button>
                  </div>
                </div>
              ))}
              {posts.length === 0 && (
                <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl">
                  <p className="text-slate-400 text-sm">No posts yet. Be the first to share!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
            <h3 className="text-lg font-black text-white mb-4">Group Guidelines</h3>
            <ul className="space-y-4 text-sm text-slate-300">
              <li className="flex gap-3">
                <span className="text-amber-400 font-bold">1.</span>
                <p><strong>Christ-Centered Focus:</strong> We anchor our recovery in the gospel of Jesus Christ. All advice and encouragement should align with scripture.</p>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-400 font-bold">2.</span>
                <p><strong>Confidentiality:</strong> What is shared in this group stays in this group. Protect the anonymity and privacy of your fellow members.</p>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-400 font-bold">3.</span>
                <p><strong>No Judgment:</strong> We are all sinners saved by grace. Meet honesty with compassion, not condemnation.</p>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-400 font-bold">4.</span>
                <p><strong>Trigger Warnings:</strong> Be mindful when sharing graphic details of past use or acting out. Keep the focus on the solution (Christ) rather than the problem.</p>
              </li>
            </ul>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-white">Group Members</h3>
              <span className="text-xs text-slate-400">{group.members} total</span>
            </div>
            
            <div className="space-y-4">
              {/* Dummy members list */}
              {['Marcus J.', 'Sarah W.', 'David T.', 'Rachel M.', 'John K.'].map((name, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-sm">
                      {name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-bold">{name}</h4>
                      <p className="text-xs text-slate-500">Member</p>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-lg hover:bg-amber-400/20 transition-colors">
                    Message
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {showSettings && (
        <GroupSettingsModal
          group={group}
          onClose={() => setShowSettings(false)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
      {isPostUnsplashOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Select Post Image
              </h3>
              <button
                type="button"
                onClick={() => setIsPostUnsplashOpen(false)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 relative">
              <UnsplashSearch
                onSelect={(url) => {
                  setPostImage(url);
                  setIsPostUnsplashOpen(false);
                }}
                placeholder="Search Pexels for a post image..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GroupSettingsModal = ({ group, onClose, onUpdate, onDelete }: any) => {
  const [name, setName] = useState(group.name);
  const [desc, setDesc] = useState(group.description);
  const [profileImg, setProfileImg] = useState(group.profileImage || '');
  const [coverImg, setCoverImg] = useState(group.coverImage || '');
  
  const [isUnsplashOpen, setIsUnsplashOpen] = useState(false);
  const [unsplashTarget, setUnsplashTarget] = useState<'profile' | 'cover' | null>(null);

  const profileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  
  const handleSave = () => {
    onUpdate({ name, description: desc, profileImage: profileImg, coverImage: coverImg });
    onClose();
  };

  const processImageFile = (file: File, target: 'profile' | 'cover') => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        if (target === 'profile') setProfileImg(e.target.result as string);
        else setCoverImg(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };


  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Group Settings</h3>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1">Group Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1">Description</label>
            <textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none resize-none" />
          </div>
          {/* Profile Image Section */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <label className="block text-sm font-semibold text-slate-300 mb-3">Profile Image</label>
            
            <input
              ref={profileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) processImageFile(e.target.files[0], 'profile');
              }}
              className="hidden"
            />
            
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => {
                  setUnsplashTarget('profile');
                  setIsUnsplashOpen(true);
                }}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Pexels Search</span>
              </button>

              <button
                type="button"
                onClick={() => profileInputRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>
            </div>
            
            <input 
              placeholder="Or paste image URL..." 
              value={profileImg} 
              onChange={e => setProfileImg(e.target.value)} 
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-[11px] text-white focus:border-amber-500 focus:outline-none" 
            />
            {profileImg && (
              <div className="mt-3 flex justify-center">
                <img src={profileImg} alt="Profile Preview" className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20" />
              </div>
            )}
          </div>

          {/* Cover Image Section */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <label className="block text-sm font-semibold text-slate-300 mb-3">Cover Image</label>
            
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) processImageFile(e.target.files[0], 'cover');
              }}
              className="hidden"
            />
            
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => {
                  setUnsplashTarget('cover');
                  setIsUnsplashOpen(true);
                }}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Pexels Search</span>
              </button>

              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>
            </div>
            
            <input 
              placeholder="Or paste image URL..." 
              value={coverImg} 
              onChange={e => setCoverImg(e.target.value)} 
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-[11px] text-white focus:border-amber-500 focus:outline-none" 
            />
            {coverImg && (
              <div className="mt-3">
                <img src={coverImg} alt="Cover Preview" className="w-full h-24 rounded-xl object-cover border border-white/20" />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-3 pt-4 border-t border-white/10 mt-2">
          <button onClick={() => { if(confirm('Are you sure you want to delete this group?')) onDelete(); }} className="px-4 py-3 rounded-xl font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors">
            Delete Group
          </button>
          <div className="flex-1"></div>
          <button onClick={handleSave} className="px-6 py-3 rounded-xl font-bold text-black bg-amber-500 hover:bg-amber-400 transition-colors flex items-center gap-2">
            <Check className="w-4 h-4" /> Save
          </button>
        </div>
      </div>



      {/* Pexels Search Modal Layer */}
      {isUnsplashOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Select {unsplashTarget === 'profile' ? 'Profile' : 'Cover'} Image
              </h3>
              <button
                type="button"
                onClick={() => setIsUnsplashOpen(false)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 relative">
              <UnsplashSearch
                onSelect={(url) => {
                  if (unsplashTarget === 'profile') setProfileImg(url);
                  else setCoverImg(url);
                  setIsUnsplashOpen(false);
                }}
                placeholder="Search Pexels for an image..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
