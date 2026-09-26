const fs = require('fs');
const file = 'src/components/recovery/RecoveryDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `            <div className="mb-6 p-6 rounded-3xl bg-amber-950/20 border border-amber-500/30">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                Live Fellowship Rooms
              </h2>
              <p className="text-sm text-slate-400">
                Join scheduled and live recovery meetings. Share anonymously, pray together, and find support in a Christ-centered community.
              </p>
            </div>`;

const replacement = `            {/* Regular Groups */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  Support Groups
                </h2>
                <span className="text-xs font-bold bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full uppercase tracking-wider">Join</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                      <Heart className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-full">142 Members</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">Walking in Faith</h3>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">A daily support group for establishing strong habits, staying accountable, and walking out your recovery journey together.</p>
                  <button className="w-full py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-sm transition-colors border border-white/10">
                    View Group
                  </button>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                      <Shield className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-full">89 Members</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">Men's Purity</h3>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">Dedicated to overcoming lust, pornography, and strongholds through radical accountability and Scripture.</p>
                  <button className="w-full py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-sm transition-colors border border-white/10">
                    View Group
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-6 p-6 rounded-3xl bg-amber-950/20 border border-amber-500/30">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Mic className="w-5 h-5 text-amber-400" />
                Live Fellowship Rooms
              </h2>
              <p className="text-sm text-slate-400">
                Join scheduled and live recovery meetings. Share anonymously, pray together, and find support in a Christ-centered community.
              </p>
            </div>`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
