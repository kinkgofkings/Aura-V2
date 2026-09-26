const fs = require('fs');
const file = 'src/components/chat/ChatView.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `              {/* Tex / My Story Avatar */}
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open_create_story_modal'));
                }}
                className="flex flex-col items-center gap-1 flex-shrink-0 group focus:outline-none"
                title="Add to Your Story"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-yellow-500 to-orange-500 group-hover:scale-105 transition-transform">
                    <Avatar
                      src={user?.avatarUrl}
                      name={user?.name || 'You'}
                      size="md"
                      className="w-full h-full rounded-full border-2 border-[#090d22] object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-600 rounded-full border-2 border-[#090d22] flex items-center justify-center text-white text-[10px] font-black">
                    +
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-300 max-w-[52px] truncate text-center">
                  Your Story
                </span>
              </button>`;

const replacement = `              {/* Tex / My Story Avatar */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0 group">
                <div className="relative">
                  <button
                    onClick={() => {
                      const myStoryIdx = (stories || []).findIndex(s => user && s.userId === user.id);
                      if (myStoryIdx !== -1) {
                        setSelectedStoryIndex(myStoryIdx);
                      } else {
                        window.dispatchEvent(new CustomEvent('open_create_story_modal'));
                      }
                    }}
                    title={(stories || []).some(s => user && s.userId === user.id) ? "View your story" : "Add to Your Story"}
                    className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-yellow-500 to-orange-500 group-hover:scale-105 transition-transform focus:outline-none block"
                  >
                    <Avatar
                      src={user?.avatarUrl}
                      name={user?.name || 'You'}
                      size="md"
                      className="w-full h-full rounded-full border-2 border-[#090d22] object-cover"
                    />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.dispatchEvent(new CustomEvent('open_create_story_modal'));
                    }}
                    title="Add to Your Story"
                    className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-600 hover:bg-amber-500 rounded-full border-2 border-[#090d22] flex items-center justify-center text-white text-[10px] font-black transition-colors focus:outline-none"
                  >
                    +
                  </button>
                </div>
                <span className="text-[10px] font-medium text-slate-300 max-w-[52px] truncate text-center pointer-events-none">
                  Your Story
                </span>
              </div>`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
