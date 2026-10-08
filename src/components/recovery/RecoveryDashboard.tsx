import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Heart, BookOpen, Music, Users, ArrowLeft, Pencil, Mic , Plus } from 'lucide-react';
import { BiblicalPrinciples } from './BiblicalPrinciples';
import { RecoveryAudioFeed } from './RecoveryAudioFeed';
import { RecoveryJournal } from './RecoveryJournal';
import { MeetingCountdownTimer } from './MeetingCountdownTimer';
import { RecoveryMeetingRoom } from './RecoveryMeetingRoom';
import { GroupWall } from './GroupWall';
import { RecoveryMeeting } from '../../types/recovery';
import { useAuth } from '../../context/AuthContext';
import { PastorProposalModal } from './PastorProposalModal';

export const RecoveryDashboard: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [showProposal, setShowProposal] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'principles' | 'audio' | 'journal' | 'groups'>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const rtabParam = urlParams.get('rtab');
      if (rtabParam && ['principles', 'audio', 'journal', 'groups'].includes(rtabParam)) {
        return rtabParam as any;
      }
      const saved = localStorage.getItem('aura_recovery_tab');
      return (saved as any) || 'principles';
    } catch {
      return 'principles';
    }
  });

  const [activeGroup, setActiveGroup] = useState<any>(null);
  
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


  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState('');
  
  // Calculate days clean
  const getDaysClean = () => {
    let dateStr = user?.cleanDate;
    if (!dateStr) {
      dateStr = localStorage.getItem('aura_clean_date') || undefined;
    }
    
    if (!dateStr) {
      // Fallback to legacy journal streak if no date set
      try {
        const journal = JSON.parse(localStorage.getItem('aura_recovery_journal') || '[]');
        if (journal.length > 0) return journal[0].streakDay;
      } catch {}
      return 0;
    }
    
    const cleanDate = new Date(dateStr);
    const today = new Date();
    // Reset times to midnight for accurate day calculation
    cleanDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(today.getTime() - cleanDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getMilestoneChip = (days: number) => {
    const years = Math.floor(days / 365);
    if (years >= 2) return { name: `${years} Years`, color: 'bg-yellow-700', text: 'text-yellow-100', border: 'border-yellow-600' };
    if (years === 1) return { name: '1 Year', color: 'bg-yellow-600', text: 'text-black', border: 'border-yellow-400' };
    
    const months = Math.floor(days / 30);
    if (months >= 9) return { name: `${months} Months`, color: 'bg-purple-600', text: 'text-white', border: 'border-purple-400' };
    if (months >= 6) return { name: `${months} Months`, color: 'bg-blue-600', text: 'text-white', border: 'border-blue-400' };
    if (months >= 3) return { name: `${months} Months`, color: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-400' };
    if (months === 2) return { name: `2 Months`, color: 'bg-amber-500', text: 'text-black', border: 'border-amber-300' };
    if (months === 1) return { name: `1 Month`, color: 'bg-red-600', text: 'text-white', border: 'border-red-400' };
    
    if (days > 0) return { name: `${days} Days`, color: 'bg-slate-200', text: 'text-black', border: 'border-white' };
    return { name: 'Just for Today', color: 'bg-slate-800', text: 'text-white', border: 'border-slate-600' };
  };

  const handleSaveDate = async () => {
    if (tempDate) {
      if (user) {
        await updateProfile({ cleanDate: tempDate });
      }
      localStorage.setItem('aura_clean_date', tempDate);
    }
    setIsEditingDate(false);
  };

  useEffect(() => {
    try {
      localStorage.setItem('aura_recovery_tab', activeTab);
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const event = e as CustomEvent<{ tab: any }>;
      if (event.detail?.tab) {
        setActiveTab(event.detail.tab);
      }
    };
    
    window.addEventListener('switch_recovery_tab', handleSwitchTab);
    return () => {
      window.removeEventListener('switch_recovery_tab', handleSwitchTab);
    };
  }, []);

  const [meetings, setMeetings] = useState<RecoveryMeeting[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<RecoveryMeeting | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadMeetings = () => {
      fetch('/api/recovery/meetings')
        .then(res => res.json())
        .then(data => {
          if (!cancelled && data.meetings) setMeetings(data.meetings);
        })
        .catch(console.error);
    };
    loadMeetings();
    const timer = setInterval(loadMeetings, 8000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const startLiveRoom = async (title?: string) => {
    try {
      const res = await fetch('/api/recovery/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Live Fellowship Room',
          description: 'An open room. Come in and talk.',
          status: 'live',
          scheduledAt: new Date().toISOString(),
          hostId: user?.id || 'host',
          hostName: user?.name || 'Host',
          hostAvatar: user?.avatarUrl,
          format: 'open_discussion',
          topic: 'Open fellowship',
          scriptureFocus: 'James 5:16',
        }),
      });
      const data = await res.json();
      if (data.meeting) {
        setMeetings(prev => [data.meeting, ...prev.filter(m => m.id !== data.meeting.id)]);
        setActiveGroup(null);
        setActiveMeeting(data.meeting);
      }
    } catch (err) {
      console.error('Could not open live room:', err);
    }
  };

  const handleJoinMeeting = (meeting: RecoveryMeeting) => {
    setActiveMeeting(meeting);
  };

  const handleLeaveMeeting = () => {
    setActiveMeeting(null);
  };

  const handleMeetingStatusChange = (status: 'scheduled' | 'live' | 'completed') => {
    if (activeMeeting) {
      setMeetings(prev => prev.map(m => m.id === activeMeeting.id ? { ...m, status } : m));
    }
  };

  const toggleMeetingStatus = (meetingId: string, status: 'scheduled' | 'live' | 'completed') => {
    fetch(`/api/recovery/meetings/${meetingId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).then(() => {
      setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, status } : m));
    }).catch(console.error);
  };

  // If inside a live meeting room, render it in full screen mode
  if (activeMeeting) {
    return (
      <RecoveryMeetingRoom
        meeting={activeMeeting}
        onLeave={handleLeaveMeeting}
        onMeetingStatusChange={handleMeetingStatusChange}
      />
    );
  }

  const daysClean = getDaysClean();
  const chip = getMilestoneChip(daysClean);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 pb-24">

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Shield className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Path to Freedom
            </h1>
          </div>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed mb-3">
            Christ-centered deliverance and recovery. Journey through biblical principles, fellowship in live rooms, listen to teachings, and track your victorious walk in the Spirit.
          </p>
          <button
            onClick={() => setShowProposal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 text-amber-300 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            title="Open Church Donation proposal to copy or share with your Pastor"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>🎁 Pastor Ministry Proposal (1-Tap Copy)</span>
          </button>
        </div>

        {/* Dynamic Streak Widget */}
        <div className="flex flex-col gap-2 shrink-0">
          {isEditingDate ? (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/10 border border-amber-500/50">
              <input 
                type="date" 
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                className="bg-black/50 border border-white/20 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-amber-500"
              />
              <button 
                onClick={handleSaveDate}
                className="px-3 py-1 bg-amber-500 text-black font-bold text-sm rounded-lg hover:bg-amber-400"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-4 p-2 rounded-2xl bg-white/5 border border-white/10 w-full sm:w-auto">
                <button 
                  onClick={() => {
                    const savedDate = user?.cleanDate || localStorage.getItem('aura_clean_date') || new Date().toISOString().split('T')[0];
                    setTempDate(savedDate);
                    setIsEditingDate(true);
                  }}
                  className={`w-16 h-16 rounded-xl ${chip.color} border-4 ${chip.border} flex flex-col items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 transition-all shrink-0`}
                >
                  <span className={`text-2xl font-black leading-none ${chip.text}`}>
                    {daysClean}
                  </span>
                  <span className={`text-[9px] font-bold uppercase mt-1 opacity-80 ${chip.text}`}>Edit</span>
                </button>
                <div className="ml-1 pr-4">
                  <span className="block text-sm font-black text-white uppercase tracking-wider">Days Clean</span>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${chip.color} ${chip.text} border border-white/20`}>
                    {chip.name}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Main Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        <button
          onClick={() => setActiveTab('principles')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all shadow-sm ${
            activeTab === 'principles'
              ? 'bg-amber-600 text-white shadow-amber-500/30'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Biblical Principles
        </button>

        <button
          onClick={() => setActiveTab('journal')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all shadow-sm ${
            activeTab === 'journal'
              ? 'bg-emerald-600 text-white shadow-emerald-500/30'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
          }`}
        >
          <Heart className="w-4 h-4" />
          Victory Journal
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all shadow-sm ${
            activeTab === 'audio'
              ? 'bg-yellow-600 text-white shadow-yellow-500/30'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
          }`}
        >
          <Music className="w-4 h-4" />
          Audio Teachings
        </button>

        <button
          onClick={() => setActiveTab('groups')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all shadow-sm ${
            activeTab === 'groups'
              ? 'bg-amber-600 text-white shadow-amber-500/30'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
          }`}
        >
          <Users className="w-4 h-4" />
          Groups & Meetings
        </button>
      </div>

      {/* Create Group Modal */}
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

      {/* Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'principles' && <BiblicalPrinciples />}
        {activeTab === 'journal' && <RecoveryJournal />}
        {activeTab === 'audio' && <RecoveryAudioFeed />}
        {activeTab === 'groups' && (
          <div className="space-y-6">
            {activeGroup ? (
              <GroupWall group={activeGroup} onBack={() => setActiveGroup(null)} onDelete={() => handleDeleteGroup(activeGroup.id)} onUpdate={(updates: any) => handleUpdateGroup(activeGroup.id, updates)} onStartLive={() => startLiveRoom(activeGroup.name)} />
            ) : (
              <>
            {/* Regular Groups */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  Support Groups
                </h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => startLiveRoom()} className="flex items-center gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1.5 rounded-full transition-colors">
                    <Mic className="w-3.5 h-3.5" />
                    Open Live Room
                  </button>
                  <button onClick={() => setIsCreatingGroup(true)} className="flex items-center gap-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-full transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    Create Group
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supportGroups.map(g => (
                  <div key={g.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg ${g.profileImage ? 'p-0 overflow-hidden border-white/20' : g.color.replace('from-', 'bg-').split(' ')[0] + '/20 border-' + g.color.replace('from-', '').split('-')[0] + '-500/30'}`}>
                        {g.profileImage ? (
                          <img src={g.profileImage} alt={g.name} className="w-full h-full object-cover" />
                        ) : g.icon === 'heart' ? (
                          <Heart className={`w-5 h-5 ${g.color.includes('blue') ? 'text-blue-400' : 'text-amber-400'}`} />
                        ) : (
                          <Shield className={`w-5 h-5 ${g.color.includes('emerald') ? 'text-emerald-400' : 'text-amber-400'}`} />
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
            </div>

            <div className="mb-6 p-6 rounded-3xl bg-amber-950/20 border border-amber-500/30">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Mic className="w-5 h-5 text-amber-400" />
                Live Fellowship Rooms
              </h2>
              <p className="text-sm text-slate-400">
                Join scheduled and live recovery meetings. Share anonymously, pray together, and find support in a Christ-centered community.
              </p>
            </div>
            
            {meetings.length === 0 ? (
              <div className="text-center p-12 rounded-3xl bg-white/5 border border-white/10">
                <Shield className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white">No Scheduled Meetings</h3>
                <p className="text-sm text-slate-400 mt-2">
                  Check back later for upcoming fellowship rooms.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {meetings.filter(m => m.status !== 'completed').map(meeting => (
                  <MeetingCountdownTimer
                    key={meeting.id}
                    meeting={meeting}
                    onJoinMeeting={handleJoinMeeting}
                    onToggleStatus={toggleMeetingStatus}
                  />
                ))}
              </div>
            )}
            </>
            )}
          </div>
        )}
      </div>

      {/* 1-Tap Pastor & Ministry Proposal Modal */}
      <PastorProposalModal
        isOpen={showProposal}
        onClose={() => setShowProposal(false)}
      />
    </div>
  );
};
