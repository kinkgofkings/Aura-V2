import React, { useState } from 'react';
import {
  X,
  Search,
  Shield,
  GraduationCap,
  User,
  CheckCircle2,
  Crown,
  Sparkles,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { soundEffects } from '../../services/audio';

interface PromoteLeadersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromoteLeadersModal: React.FC<PromoteLeadersModalProps> = ({
  isOpen,
  onClose
}) => {
  const { allUsers, user: currentUser, promoteUserRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredUsers = allUsers.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.handle?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  });

  const handleRoleChange = async (targetUserId: string, newRole: 'member' | 'teacher' | 'admin') => {
    setUpdatingUserId(targetUserId);
    soundEffects.playTap();
    try {
      const res = await promoteUserRole(targetUserId, newRole);
      if (res.success) {
        soundEffects.playLikeSparkle();
        setToastMessage(`Updated role to ${newRole.toUpperCase()} successfully!`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        alert(res.error || 'Failed to update role');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-[#090b17] border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-b from-amber-950/40 via-amber-900/10 to-transparent border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Staff & Leaders Management</h2>
              <p className="text-xs text-slate-400">
                Promote members to <strong>Teachers / Leaders</strong> (to grade challenges and edit courses) or <strong>Admins</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Toast */}
        <div className="p-4 border-b border-white/10 bg-black/30 space-y-3">
          {toastMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-in fade-in">
              {toastMessage}
            </div>
          )}

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search members by name, handle, or email..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 text-xs">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No members found matching "{searchTerm}".
            </div>
          ) : (
            filteredUsers.map((u) => {
              const currentRole = u.role || (u.isAdmin ? 'admin' : u.isTeacher ? 'teacher' : 'member');
              const isSelf = currentUser?.id === u.id;

              return (
                <div
                  key={u.id}
                  className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={u.avatarUrl} name={u.name || u.handle} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-sm truncate">{u.name}</span>
                        {isSelf && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/10 text-slate-300">
                            You
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            currentRole === 'admin'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : currentRole === 'teacher'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              : 'bg-white/10 text-slate-400'
                          }`}
                        >
                          {currentRole}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">@{u.handle} • {u.email}</p>
                    </div>
                  </div>

                  {/* Role Selector Controls */}
                  <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
                    <button
                      type="button"
                      disabled={updatingUserId === u.id}
                      onClick={() => handleRoleChange(u.id, 'member')}
                      className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                        currentRole === 'member'
                          ? 'bg-slate-700 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <User className="w-3 h-3" />
                      <span>Member</span>
                    </button>

                    <button
                      type="button"
                      disabled={updatingUserId === u.id}
                      onClick={() => handleRoleChange(u.id, 'teacher')}
                      className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                        currentRole === 'teacher'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-blue-300 hover:text-white hover:bg-blue-500/10'
                      }`}
                    >
                      <GraduationCap className="w-3 h-3" />
                      <span>Teacher / Leader</span>
                    </button>

                    <button
                      type="button"
                      disabled={updatingUserId === u.id}
                      onClick={() => handleRoleChange(u.id, 'admin')}
                      className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                        currentRole === 'admin'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                          : 'text-amber-400 hover:text-white hover:bg-amber-500/10'
                      }`}
                    >
                      <Crown className="w-3 h-3" />
                      <span>Admin</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
