const fs = require('fs');
const file = 'src/components/recovery/RecoveryDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `        {activeTab === 'groups' && (
          <div className="space-y-6">
            {/* Regular Groups */}
            <div className="mb-8">`;

const replacement = `        {activeTab === 'groups' && (
          <div className="space-y-6">
            {activeGroup ? (
              <GroupWall group={activeGroup} onBack={() => setActiveGroup(null)} />
            ) : (
              <>
            {/* Regular Groups */}
            <div className="mb-8">`;

content = content.replace(target, replacement);

const target2 = `                    <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-full">142 Members</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">Walking in Faith</h3>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">A daily support group for establishing strong habits, staying accountable, and walking out your recovery journey together.</p>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('navigate_tab', { detail: { tab: 'chat' } }))}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-sm transition-colors border border-white/10">
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
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('navigate_tab', { detail: { tab: 'chat' } }))}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-sm transition-colors border border-white/10">
                    View Group
                  </button>
                </div>
              </div>
            </div>`;

const replacement2 = `                    <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-full">142 Members</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">Walking in Faith</h3>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">A daily support group for establishing strong habits, staying accountable, and walking out your recovery journey together.</p>
                  <button 
                    onClick={() => setActiveGroup({ id: 'g1', name: 'Walking in Faith', description: 'A daily support group for establishing strong habits, staying accountable, and walking out your recovery journey together.', members: 142, icon: 'heart', color: 'from-blue-500 to-indigo-600' })}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-sm transition-colors border border-white/10">
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
                  <button 
                    onClick={() => setActiveGroup({ id: 'g2', name: "Men's Purity", description: 'Dedicated to overcoming lust, pornography, and strongholds through radical accountability and Scripture.', members: 89, icon: 'shield', color: 'from-emerald-500 to-teal-600' })}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-sm transition-colors border border-white/10">
                    View Group
                  </button>
                </div>
              </div>
            </div>`;

content = content.replace(target2, replacement2);

const target3 = `                ))}
              </div>
            )}
          </div>
        )}`;

const replacement3 = `                ))}
              </div>
            )}
            </>
            )}
          </div>
        )}`;

content = content.replace(target3, replacement3);

fs.writeFileSync(file, content);
