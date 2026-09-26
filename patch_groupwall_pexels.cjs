const fs = require('fs');
const file = 'src/components/recovery/GroupWall.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{([^}]+)\} from 'lucide-react';/, (match, p1) => {
  const missing = ['Upload', 'Sparkles'].filter(i => !p1.includes(i));
  if (missing.length) {
    return "import {" + p1 + ", " + missing.join(', ') + "} from 'lucide-react';";
  }
  return match;
});

if (!content.includes('UnsplashSearch')) {
  content = content.replace(/(import { Avatar } from '..\/common\/Avatar';)/, "$1\nimport { UnsplashSearch } from '../common/UnsplashSearch';");
}

if (!content.includes('import React, { useState, useRef }')) {
  content = content.replace("import React, { useState }", "import React, { useState, useRef }");
}

const modalTarget = `const GroupSettingsModal = ({ group, onClose, onUpdate, onDelete }: any) => {
  const [name, setName] = useState(group.name);
  const [desc, setDesc] = useState(group.description);
  const [profileImg, setProfileImg] = useState(group.profileImage || '');
  const [coverImg, setCoverImg] = useState(group.coverImage || '');
  
  const handleSave = () => {
    onUpdate({ name, description: desc, profileImage: profileImg, coverImage: coverImg });
    onClose();
  };`;

const modalReplacement = `const GroupSettingsModal = ({ group, onClose, onUpdate, onDelete }: any) => {
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
`;

content = content.replace(modalTarget, modalReplacement);

const inputFieldsTarget = `          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1">Profile Image URL</label>
            <input placeholder="https://..." value={profileImg} onChange={e => setProfileImg(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1">Cover Image URL</label>
            <input placeholder="https://..." value={coverImg} onChange={e => setCoverImg(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none" />
          </div>`;

const inputFieldsReplacement = `          {/* Profile Image Section */}
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
          </div>`;

content = content.replace(inputFieldsTarget, inputFieldsReplacement);

// Add Pexels modal at the end of the GroupSettingsModal, right before the closing div
const modalEndTarget = `        <div className="flex gap-3 pt-4 border-t border-white/10 mt-2">
          <button onClick={() => { if(confirm('Are you sure you want to delete this group?')) onDelete(); }} className="px-4 py-3 rounded-xl font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors">
            Delete Group
          </button>
          <div className="flex-1"></div>
          <button onClick={handleSave} className="px-6 py-3 rounded-xl font-bold text-black bg-amber-500 hover:bg-amber-400 transition-colors flex items-center gap-2">
            <Check className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>`;
    
const modalEndReplacement = `        <div className="flex gap-3 pt-4 border-t border-white/10 mt-2">
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
    </div>`;
    
content = content.replace(modalEndTarget, modalEndReplacement);

fs.writeFileSync(file, content);
