const fs = require('fs');
const file = 'src/components/recovery/GroupWall.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add postImage state and image processing
const createPostTarget = `  const [editingPostId, setEditingPostId] = useState<string | null>(null);
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
  };`;

const createPostReplacement = `  const [editingPostId, setEditingPostId] = useState<string | null>(null);
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
      avatar: user?.avatarUrl || user?.photoURL || '',
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
  };`;
content = content.replace(createPostTarget, createPostReplacement);

const postInputTarget = `                  <div className="flex items-center justify-between mt-3">
                    <button className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors">
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleCreatePost}
                      disabled={!postText.trim()}
                      className="flex items-center gap-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-50 disabled:hover:bg-amber-500 text-sm font-bold rounded-lg transition-all"
                    >`;

const postInputReplacement = `                  {postImage && (
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
                    >`;
content = content.replace(postInputTarget, postInputReplacement);

const feedPostTarget = `                    {/* Only author can edit/delete in this demo */}
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
                  )}`;

const feedPostReplacement = `                    {/* Only author can edit/delete in this demo */}
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
                  )}`;
content = content.replace(feedPostTarget, feedPostReplacement);


const modalEndTarget = `      {/* Pexels Search Modal Layer */}
      {isUnsplashOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">`;
        
const modalEndReplacement = `      {isPostUnsplashOpen && (
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

      {/* Pexels Search Modal Layer */}
      {isUnsplashOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">`;
content = content.replace(modalEndTarget, modalEndReplacement);

fs.writeFileSync(file, content);
