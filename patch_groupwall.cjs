const fs = require('fs');
const file = 'src/components/recovery/GroupWall.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{([^}]+)\} from 'lucide-react';/, (match, p1) => {
  const missing = ['Settings', 'Trash2', 'Edit2', 'Camera', 'Check', 'X'].filter(i => !p1.includes(i));
  if (missing.length) {
    return `import {${p1}, ${missing.join(', ')} } from 'lucide-react';`;
  }
  return match;
});

const propsTarget = `interface GroupWallProps {
  group: {
    id: string;
    name: string;
    description: string;
    members: number;
    icon: 'heart' | 'shield';
    color: string;
  };
  onBack: () => void;
}`;

const propsReplacement = `interface GroupWallProps {
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
}`;

content = content.replace(propsTarget, propsReplacement);

const compTarget = `export const GroupWall: React.FC<GroupWallProps> = ({ group, onBack }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'rules' | 'members'>('feed');
  const [postText, setPostText] = useState('');`;

const compReplacement = `export const GroupWall: React.FC<GroupWallProps> = ({ group, onBack, onUpdate, onDelete }) => {
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

  const handleCreatePost = () => {
    if (!postText.trim()) return;
    const newPost = {
      id: 'post_' + Date.now(),
      author: user?.name || 'Anonymous',
      authorId: user?.id || 'anon',
      avatar: user?.avatarUrl || user?.photoURL || '',
      initial: (user?.name || 'A').charAt(0),
      time: 'Just now',
      content: postText,
      likes: 0,
      comments: 0
    };
    setPosts(prev => [newPost, ...prev]);
    setPostText('');
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
`;
content = content.replace(compTarget, compReplacement);

const headerTarget = `      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/10 bg-slate-900 shadow-xl">
        <div className={\`absolute inset-0 opacity-20 bg-gradient-to-br \${group.color}\`} />
        <div className="relative p-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-300 hover:text-white mb-4 transition-colors w-fit bg-black/20 px-3 py-1.5 rounded-xl backdrop-blur-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-bold tracking-wide">Back to Groups</span>
          </button>
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={\`w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-white/10 shadow-lg \${group.color.replace('from-', 'bg-').split(' ')[0]}/20\`}>
                {group.icon === 'heart' ? <Heart className={\`w-8 h-8 \${group.color.includes('blue') ? 'text-blue-400' : 'text-amber-400'}\`} /> : <Shield className={\`w-8 h-8 \${group.color.includes('emerald') ? 'text-emerald-400' : 'text-amber-400'}\`} />}
              </div>`;
              
const headerReplacement = `      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/10 bg-slate-900 shadow-xl group/header">
        {group.coverImage ? (
          <img src={group.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-50" />
        ) : (
          <div className={\`absolute inset-0 opacity-20 bg-gradient-to-br \${group.color}\`} />
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
              <div className={\`w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-white/20 shadow-lg \${group.profileImage ? 'bg-black' : group.color.replace('from-', 'bg-').split(' ')[0] + '/40 backdrop-blur-sm'}\`}>
                {group.profileImage ? (
                  <img src={group.profileImage} className="w-full h-full object-cover" />
                ) : group.icon === 'heart' ? (
                  <Heart className={\`w-8 h-8 \${group.color.includes('blue') ? 'text-blue-400' : 'text-amber-400'}\`} />
                ) : (
                  <Shield className={\`w-8 h-8 \${group.color.includes('emerald') ? 'text-emerald-400' : 'text-amber-400'}\`} />
                )}
              </div>`;
content = content.replace(headerTarget, headerReplacement);

const inputTarget = `                    <button 
                      disabled={!postText.trim()}
                      className="flex items-center gap-2 px-4 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:hover:bg-white/10 text-white text-sm font-bold rounded-lg transition-all"
                    >
                      <span>Post to Wall</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>`;
const inputReplacement = `                    <button 
                      onClick={handleCreatePost}
                      disabled={!postText.trim()}
                      className="flex items-center gap-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-50 disabled:hover:bg-amber-500 text-sm font-bold rounded-lg transition-all"
                    >
                      <span>Post to Wall</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>`;
content = content.replace(inputTarget, inputReplacement);


const dummyFeedTarget = `            {/* Dummy Feed Posts */}
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      M
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">Marcus J.</h4>
                      <p className="text-xs text-slate-400">2 hours ago</p>
                    </div>
                  </div>
                  <button className="text-slate-500 hover:text-white">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed mb-4">
                  Just wanted to share a praise report! Today makes 90 days clean for me. God has been so faithful. The urges have been strong this week, but leaning on the scripture we discussed in the live room on Tuesday really anchored me. Keep fighting the good fight, brothers and sisters!
                </p>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 border-t border-white/10 pt-3">
                  <button className="flex items-center gap-1.5 hover:text-amber-400">
                    <Flame className="w-4 h-4" />
                    <span>24</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-amber-400">
                    <MessageSquare className="w-4 h-4" />
                    <span>5 Comments</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                      S
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">Sarah W.</h4>
                      <p className="text-xs text-slate-400">5 hours ago</p>
                    </div>
                  </div>
                  <button className="text-slate-500 hover:text-white">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed mb-4">
                  "Therefore submit to God. Resist the devil and he will flee from you." - James 4:7. This verse is my shield today. Please keep me in prayer regarding a stressful situation at work that is testing my peace.
                </p>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 border-t border-white/10 pt-3">
                  <button className="flex items-center gap-1.5 hover:text-amber-400 text-amber-400">
                    <Heart className="w-4 h-4 fill-amber-400" />
                    <span>12</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-amber-400">
                    <MessageSquare className="w-4 h-4" />
                    <span>8 Comments</span>
                  </button>
                </div>
              </div>
            </div>`;
const dummyFeedReplacement = `            {/* Feed Posts */}
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
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingPostId(post.id); setEditPostText(post.content); }} className="p-1.5 text-slate-400 hover:text-amber-400 bg-white/5 hover:bg-white/10 rounded-lg">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeletePost(post.id)} className="p-1.5 text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
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
                    <p className="text-slate-200 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
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
            </div>`;
content = content.replace(dummyFeedTarget, dummyFeedReplacement);

const endTarget = `  );
};`;
const endReplacement = `      {showSettings && (
        <GroupSettingsModal
          group={group}
          onClose={() => setShowSettings(false)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
  );
};

const GroupSettingsModal = ({ group, onClose, onUpdate, onDelete }: any) => {
  const [name, setName] = useState(group.name);
  const [desc, setDesc] = useState(group.description);
  const [profileImg, setProfileImg] = useState(group.profileImage || '');
  const [coverImg, setCoverImg] = useState(group.coverImage || '');
  
  const handleSave = () => {
    onUpdate({ name, description: desc, profileImage: profileImg, coverImage: coverImg });
    onClose();
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
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1">Profile Image URL</label>
            <input placeholder="https://..." value={profileImg} onChange={e => setProfileImg(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1">Cover Image URL</label>
            <input placeholder="https://..." value={coverImg} onChange={e => setCoverImg(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none" />
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
    </div>
  );
};`;
content = content.replace(endTarget, endReplacement);

fs.writeFileSync(file, content);
