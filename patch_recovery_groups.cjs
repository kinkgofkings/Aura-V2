const fs = require('fs');
const file = 'src/components/recovery/RecoveryDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Plus icon to imports
content = content.replace(/import \{([^}]+)\} from 'lucide-react';/, (match, p1) => {
  if (!p1.includes('Plus')) {
    return `import {${p1}, Plus } from 'lucide-react';`;
  }
  return match;
});

// 2. Add group state
const stateTarget = `  const [activeGroup, setActiveGroup] = useState<any>(null);`;
const stateReplacement = `  const [activeGroup, setActiveGroup] = useState<any>(null);
  
  const [supportGroups, setSupportGroups] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('aura_support_groups');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'g1', name: 'Walking in Faith', description: 'A daily support group for establishing strong habits, staying accountable, and walking out your recovery journey together.', members: 142, icon: 'heart', color: 'from-blue-500 to-indigo-600' },
      { id: 'g2', name: "Men's Purity", description: 'Dedicated to overcoming lust, pornography, and strongholds through radical accountability and Scripture.', members: 89, icon: 'shield', color: 'from-emerald-500 to-teal-600' }
    ];
  });
  
  useEffect(() => {
    localStorage.setItem('aura_support_groups', JSON.stringify(supportGroups));
  }, [supportGroups]);

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    const newGroup = {
      id: 'g' + Date.now(),
      name: newGroupName,
      description: newGroupDesc,
      members: 1,
      icon: 'shield', // Default
      color: 'from-purple-500 to-pink-600', // Default
      createdAt: Date.now()
    };
    setSupportGroups(prev => [newGroup, ...prev]);
    setIsCreatingGroup(false);
    setNewGroupName('');
    setNewGroupDesc('');
  };
  
  const handleDeleteGroup = (id: string) => {
    setSupportGroups(prev => prev.filter(g => g.id !== id));
    if (activeGroup?.id === id) setActiveGroup(null);
  };
  
  const handleUpdateGroup = (id: string, updates: any) => {
    setSupportGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    if (activeGroup?.id === id) setActiveGroup(prev => ({ ...prev, ...updates }));
  };
`;
content = content.replace(stateTarget, stateReplacement);

// 3. Update activeGroup Wall to pass update/delete
const wallTarget = `<GroupWall group={activeGroup} onBack={() => setActiveGroup(null)} />`;
const wallReplacement = `<GroupWall group={activeGroup} onBack={() => setActiveGroup(null)} onDelete={() => handleDeleteGroup(activeGroup.id)} onUpdate={(updates: any) => handleUpdateGroup(activeGroup.id, updates)} />`;
content = content.replace(wallTarget, wallReplacement);

// 4. Update group list render
const listTarget = `            {/* Regular Groups */}
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

const listReplacement = `            {/* Regular Groups */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  Support Groups
                </h2>
                <button onClick={() => setIsCreatingGroup(true)} className="flex items-center gap-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-full transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  Create Group
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supportGroups.map(g => (
                  <div key={g.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="flex items-start justify-between mb-3">
                      <div className={\`w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg \${g.profileImage ? 'p-0 overflow-hidden border-white/20' : g.color.replace('from-', 'bg-').split(' ')[0] + '/20 border-' + g.color.replace('from-', '').split('-')[0] + '-500/30'}\`}>
                        {g.profileImage ? (
                          <img src={g.profileImage} alt={g.name} className="w-full h-full object-cover" />
                        ) : g.icon === 'heart' ? (
                          <Heart className={\`w-5 h-5 \${g.color.includes('blue') ? 'text-blue-400' : 'text-amber-400'}\`} />
                        ) : (
                          <Shield className={\`w-5 h-5 \${g.color.includes('emerald') ? 'text-emerald-400' : 'text-amber-400'}\`} />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-full">{g.members} Members</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">{g.name}</h3>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{g.description}</p>
                    <button 
                      onClick={() => setActiveGroup(g)}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-sm transition-colors border border-white/10">
                      View Group
                    </button>
                  </div>
                ))}
              </div>
            </div>`;

content = content.replace(listTarget, listReplacement);

// 5. Add Modal for create group
const modalTarget = `      {/* Content Area */}`;
const modalReplacement = `      {/* Create Group Modal */}
      {isCreatingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Create Support Group</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Group Name</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="e.g. Daily Devotionals"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                  placeholder="What is this group about?"
                  rows={3}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsCreatingGroup(false)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-black bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 transition-colors"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}`;
content = content.replace(modalTarget, modalReplacement);

fs.writeFileSync(file, content);
