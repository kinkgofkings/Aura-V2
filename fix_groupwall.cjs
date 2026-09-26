const fs = require('fs');
const file = 'src/components/recovery/GroupWall.tsx';
let content = fs.readFileSync(file, 'utf8');

const postModalBlock = `      {isPostUnsplashOpen && (
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
      )}`;

// Remove it from where it currently is
content = content.replace(postModalBlock, '');

// Insert it into GroupWall before the closing div
const targetEndGroupWall = `      {showSettings && (
        <GroupSettingsModal
          group={group}
          onClose={() => setShowSettings(false)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </div>`;
const replacementEndGroupWall = `      {showSettings && (
        <GroupSettingsModal
          group={group}
          onClose={() => setShowSettings(false)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
${postModalBlock}
    </div>`;

content = content.replace(targetEndGroupWall, replacementEndGroupWall);

fs.writeFileSync(file, content);
