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
  Users,
  Settings,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Save,
  Check,
  Award,
  BookOpen,
  Mic,
  Upload,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { soundEffects } from '../../services/audio';
import { UserProfile } from '../../types';

interface PromoteLeadersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromoteLeadersModal: React.FC<PromoteLeadersModalProps> = ({
  isOpen,
  onClose
}) => {
  const { allUsers, user: currentUser, promoteUserRole, provisionLeader, deleteUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'roster' | 'provision'>('roster');
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Expanded permissions accordion per user id
  const [expandedUserPerms, setExpandedUserPerms] = useState<Record<string, boolean>>({});

  // Local state for editing titles & permissions before committing
  const [editPositions, setEditPositions] = useState<Record<string, string>>({});
  const [editPermissions, setEditPermissions] = useState<Record<string, any>>({});

  // New Leader Provisioning State
  const [newLeaderName, setNewLeaderName] = useState('Nick');
  const [newLeaderEmail, setNewLeaderEmail] = useState('nick@rurecovery.com');
  const [newLeaderHandle, setNewLeaderHandle] = useState('nick');
  const [newLeaderPosition, setNewLeaderPosition] = useState('RU Director');
  const [newLeaderRole, setNewLeaderRole] = useState<'member' | 'leader' | 'director' | 'teacher' | 'admin'>('director');
  const [isProvisioning, setIsProvisioning] = useState(false);

  if (!isOpen) return null;

  const filteredUsers = allUsers.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.handle?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      (u.position && u.position.toLowerCase().includes(term))
    );
  });

  const getEffectiveRole = (u: UserProfile): 'member' | 'leader' | 'director' | 'teacher' | 'admin' => {
    if (u.role) return u.role;
    if (u.isAdmin) return 'admin';
    if (u.isDirector || (u.position && u.position.toLowerCase().includes('director'))) return 'director';
    if (u.isLeader || (u.position && u.position.toLowerCase().includes('leader'))) return 'leader';
    if (u.isTeacher) return 'teacher';
    return 'member';
  };

  const getEffectivePosition = (u: UserProfile): string => {
    if (editPositions[u.id] !== undefined) return editPositions[u.id];
    if (u.position) return u.position;
    const role = getEffectiveRole(u);
    if (role === 'director') return 'RU Director';
    if (role === 'leader') return 'Recovery Leader';
    if (role === 'teacher') return 'Curriculum Teacher';
    if (role === 'admin') return 'Super Admin';
    return 'Member';
  };

  const getUserPermissions = (u: UserProfile) => {
    if (editPermissions[u.id]) return editPermissions[u.id];
    const role = getEffectiveRole(u);
    return {
      canEditCurriculum: role === 'director' || role === 'admin' || !!u.permissions?.canEditCurriculum,
      canGradeWorkbooks: role === 'director' || role === 'leader' || role === 'teacher' || role === 'admin' || !!u.permissions?.canGradeWorkbooks,
      canManageMeetings: role === 'director' || role === 'leader' || role === 'admin' || !!u.permissions?.canManageMeetings,
      canUploadMedia: role === 'director' || role === 'leader' || role === 'teacher' || role === 'admin' || !!u.permissions?.canUploadMedia,
      canPostAnnouncements: role === 'director' || role === 'leader' || role === 'admin' || !!u.permissions?.canPostAnnouncements,
      canManageMembers: role === 'director' || role === 'admin' || !!u.permissions?.canManageMembers
    };
  };

  const toggleUserPerm = (userId: string, permKey: string) => {
    const u = allUsers.find((x) => x.id === userId);
    if (!u) return;
    const current = getUserPermissions(u);
    const updated = { ...current, [permKey]: !current[permKey] };
    setEditPermissions((prev) => ({ ...prev, [userId]: updated }));
  };

  const handleRoleChange = async (
    targetUserId: string,
    newRole: 'member' | 'leader' | 'director' | 'teacher' | 'admin'
  ) => {
    setUpdatingUserId(targetUserId);
    soundEffects.playTap();
    try {
      const u = allUsers.find((x) => x.id === targetUserId);
      const position = editPositions[targetUserId] || u?.position || (
        newRole === 'director' ? 'RU Director' :
        newRole === 'leader' ? 'Recovery Leader' :
        newRole === 'teacher' ? 'Teacher' :
        newRole === 'admin' ? 'Administrator' : 'Member'
      );

      const perms = editPermissions[targetUserId] || (u ? getUserPermissions(u) : undefined);

      const res = await promoteUserRole(targetUserId, newRole, position, perms);
      if (res.success) {
        soundEffects.playLikeSparkle();
        setToastMessage(`Updated ${u?.name || 'user'} to ${newRole.toUpperCase()} (${position})!`);
        setTimeout(() => setToastMessage(null), 3500);
      } else {
        alert(res.error || 'Failed to update role');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleSavePositionAndPerms = async (u: UserProfile) => {
    setUpdatingUserId(u.id);
    soundEffects.playTap();
    try {
      const position = getEffectivePosition(u);
      const role = getEffectiveRole(u);
      const perms = getUserPermissions(u);

      const res = await promoteUserRole(u.id, role, position, perms);
      if (res.success) {
        soundEffects.playLikeSparkle();
        setToastMessage(`Saved position "${position}" and permissions for ${u.name}!`);
        setTimeout(() => setToastMessage(null), 3500);
      } else {
        alert(res.error || 'Failed to save changes');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving changes');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleProvisionLeaderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaderName.trim() || !newLeaderEmail.trim()) {
      alert('Name and Email are required.');
      return;
    }
    setIsProvisioning(true);
    soundEffects.playTap();

    try {
      const res = await provisionLeader({
        name: newLeaderName.trim(),
        email: newLeaderEmail.trim(),
        handle: newLeaderHandle.trim() || newLeaderName.toLowerCase().replace(/[^a-z0-9]/g, ''),
        position: newLeaderPosition.trim() || 'RU Director',
        role: newLeaderRole,
        permissions: {
          canEditCurriculum: true,
          canGradeWorkbooks: true,
          canManageMeetings: true,
          canUploadMedia: true,
          canPostAnnouncements: true,
          canManageMembers: true
        }
      });

      if (res.success) {
        soundEffects.playLikeSparkle();
        setToastMessage(`Successfully configured leadership access for ${newLeaderName} (${newLeaderPosition})!`);
        setActiveTab('roster');
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        alert(res.error || 'Failed to provision leader');
      }
    } catch (err: any) {
      alert(err.message || 'Error provisioning leader');
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      const res = await deleteUser(deletingUser.id);
      if (res.success) {
        soundEffects.playLikeSparkle();
        setToastMessage(`Member ${deletingUser.name || deletingUser.handle} has been removed and deleted.`);
        setDeletingUser(null);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        alert(res.error || 'Failed to delete member');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting member');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-3xl bg-[#090b17] border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-b from-amber-950/40 via-amber-900/10 to-transparent border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">Ministry Leadership & Roles</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Director & Leader Control
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Assign exact ministry titles (e.g. <strong>RU Director Nick</strong>) and grant granular permissions to edit curriculum, grade student workbooks, and upload media.
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

        {/* Tab Controls */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/10 bg-black/40">
          <button
            onClick={() => setActiveTab('roster')}
            className={`pb-3 px-3 font-bold text-xs flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'roster'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Leader & Member Roster ({allUsers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('provision')}
            className={`pb-3 px-3 font-bold text-xs flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'provision'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision / Add Leader (Nick RU Director)</span>
          </button>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="p-3 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Roster View */}
        {activeTab === 'roster' && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-white/10 bg-black/20">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, handle, email, or position (e.g. Nick, Director, Leader)..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Users list */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  <p>No members found matching "{searchTerm}".</p>
                  <button
                    onClick={() => setActiveTab('provision')}
                    className="mt-3 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-colors"
                  >
                    Provision New Leader Account
                  </button>
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const currentRole = getEffectiveRole(u);
                  const currentPos = getEffectivePosition(u);
                  const perms = getUserPermissions(u);
                  const isExpanded = !!expandedUserPerms[u.id];
                  const isSelf = currentUser?.id === u.id;
                  const isNick = u.handle?.toLowerCase() === 'nick' || u.name?.toLowerCase().includes('nick');

                  return (
                    <div
                      key={u.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isNick
                          ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/5'
                          : currentRole === 'director'
                          ? 'bg-amber-950/10 border-amber-500/30'
                          : currentRole === 'leader' || currentRole === 'teacher'
                          ? 'bg-blue-950/15 border-blue-500/30'
                          : 'bg-white/[0.03] border-white/10'
                      }`}
                    >
                      {/* Top Bar: Avatar, Info, Role Badges */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar src={u.avatarUrl} name={u.name || u.handle} size="md" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-sm truncate">{u.name}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/10 text-slate-300">
                                  You
                                </span>
                              )}
                              {/* Position Badge */}
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  currentRole === 'director'
                                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                                    : currentRole === 'admin'
                                    ? 'bg-purple-500 text-white shadow-sm'
                                    : currentRole === 'leader'
                                    ? 'bg-blue-500 text-white shadow-sm'
                                    : currentRole === 'teacher'
                                    ? 'bg-emerald-500 text-slate-950 font-bold'
                                    : 'bg-white/10 text-slate-400'
                                }`}
                              >
                                {currentPos || currentRole}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              @{u.handle} • {u.email}
                            </p>
                          </div>
                        </div>

                        {/* Role Selector Buttons */}
                        <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10 shrink-0 flex-wrap">
                          <button
                            type="button"
                            disabled={updatingUserId === u.id}
                            onClick={() => handleRoleChange(u.id, 'director')}
                            className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                              currentRole === 'director'
                                ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                                : 'text-amber-300 hover:text-white hover:bg-amber-500/10'
                            }`}
                            title="RU Director: Manage curriculum, future books, student sign-offs, and leaders"
                          >
                            <Crown className="w-3 h-3" />
                            <span>Director</span>
                          </button>

                          <button
                            type="button"
                            disabled={updatingUserId === u.id}
                            onClick={() => handleRoleChange(u.id, 'leader')}
                            className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                              currentRole === 'leader'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-blue-300 hover:text-white hover:bg-blue-500/10'
                            }`}
                            title="Recovery Leader: Grade workbooks, host recovery groups, and post updates"
                          >
                            <Shield className="w-3 h-3" />
                            <span>Leader</span>
                          </button>

                          <button
                            type="button"
                            disabled={updatingUserId === u.id}
                            onClick={() => handleRoleChange(u.id, 'teacher')}
                            className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                              currentRole === 'teacher'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-emerald-300 hover:text-white hover:bg-emerald-500/10'
                            }`}
                            title="Teacher: Grade and review student challenges"
                          >
                            <GraduationCap className="w-3 h-3" />
                            <span>Teacher</span>
                          </button>

                          <button
                            type="button"
                            disabled={updatingUserId === u.id}
                            onClick={() => handleRoleChange(u.id, 'admin')}
                            className={`px-2 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                              currentRole === 'admin'
                                ? 'bg-purple-600 text-white shadow-sm font-black'
                                : 'text-purple-300 hover:text-white hover:bg-purple-500/10'
                            }`}
                            title="Admin: Full System & App Owner Privileges"
                          >
                            <Settings className="w-3 h-3" />
                            <span>Admin</span>
                          </button>

                          <button
                            type="button"
                            disabled={updatingUserId === u.id}
                            onClick={() => handleRoleChange(u.id, 'member')}
                            className={`px-2 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                              currentRole === 'member'
                                ? 'bg-slate-700 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                            title="Member: Normal participant access (cannot see or edit leader controls)"
                          >
                            <User className="w-3 h-3" />
                            <span>Member</span>
                          </button>
                        </div>
                      </div>

                      {/* Position Title Editor & Permissions Accordion */}
                      <div className="mt-3 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 flex-1">
                          <label className="text-[11px] font-bold text-slate-400 shrink-0">
                            Custom Title / Position:
                          </label>
                          <input
                            type="text"
                            value={currentPos}
                            onChange={(e) =>
                              setEditPositions((prev) => ({ ...prev, [u.id]: e.target.value }))
                            }
                            placeholder="e.g. RU Director, Recovery Leader, Pastor..."
                            className="flex-1 max-w-sm bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400"
                          />
                          <button
                            type="button"
                            disabled={updatingUserId === u.id}
                            onClick={() => handleSavePositionAndPerms(u)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1 border border-amber-500/30 transition-colors shrink-0"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Title</span>
                          </button>

                          {!isSelf &&
                            u.handle?.toLowerCase() !== 'tex' &&
                            !u.email?.toLowerCase().includes('lightsouttattootex') && (
                              <button
                                type="button"
                                disabled={updatingUserId === u.id || isDeleting}
                                onClick={() => setDeletingUser(u)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold text-xs flex items-center gap-1 border border-red-500/30 transition-colors shrink-0"
                                title="Remove and permanently delete member from the platform"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove Member</span>
                              </button>
                            )}
                        </div>

                        {/* Toggle Permissions Accordion */}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedUserPerms((prev) => ({ ...prev, [u.id]: !prev[u.id] }))
                          }
                          className="text-[11px] font-bold text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors self-start sm:self-auto"
                        >
                          <span>Detailed Permissions</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                      </div>

                      {/* Permissions Breakdown Drawer */}
                      {isExpanded && (
                        <div className="mt-3 p-3 bg-black/60 rounded-xl border border-white/10 space-y-2 text-xs animate-in fade-in">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Access Control Permissions for {u.name}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <label className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={perms.canEditCurriculum}
                                onChange={() => toggleUserPerm(u.id, 'canEditCurriculum')}
                                className="rounded text-amber-500 focus:ring-0"
                              />
                              <span className="text-slate-300 text-[11px]">
                                <strong>Edit Curriculum & Challenges</strong> (Modify questions, add future books)
                              </span>
                            </label>

                            <label className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={perms.canGradeWorkbooks}
                                onChange={() => toggleUserPerm(u.id, 'canGradeWorkbooks')}
                                className="rounded text-amber-500 focus:ring-0"
                              />
                              <span className="text-slate-300 text-[11px]">
                                <strong>Grade & Sign-Off Workbooks</strong> (Give feedback and official sign-offs)
                              </span>
                            </label>

                            <label className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={perms.canManageMeetings}
                                onChange={() => toggleUserPerm(u.id, 'canManageMeetings')}
                                className="rounded text-amber-500 focus:ring-0"
                              />
                              <span className="text-slate-300 text-[11px]">
                                <strong>Host Recovery Meetings</strong> (Lead recovery rooms and video calls)
                              </span>
                            </label>

                            <label className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={perms.canUploadMedia}
                                onChange={() => toggleUserPerm(u.id, 'canUploadMedia')}
                                className="rounded text-amber-500 focus:ring-0"
                              />
                              <span className="text-slate-300 text-[11px]">
                                <strong>Direct Device Uploads</strong> (Upload audio, photos, and study guides)
                              </span>
                            </label>

                            <label className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={perms.canPostAnnouncements}
                                onChange={() => toggleUserPerm(u.id, 'canPostAnnouncements')}
                                className="rounded text-amber-500 focus:ring-0"
                              />
                              <span className="text-slate-300 text-[11px]">
                                <strong>Post Leader Bulletins</strong> (Broadcast announcements to ministry wall)
                              </span>
                            </label>

                            <label className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={perms.canManageMembers}
                                onChange={() => toggleUserPerm(u.id, 'canManageMembers')}
                                className="rounded text-amber-500 focus:ring-0"
                              />
                              <span className="text-slate-300 text-[11px]">
                                <strong>Manage Member Profiles</strong> (Assign roles and review progress)
                              </span>
                            </label>
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleSavePositionAndPerms(u)}
                              className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors flex items-center gap-1.5"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Permissions</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Provision New Leader View */}
        {activeTab === 'provision' && (
          <form onSubmit={handleProvisionLeaderSubmit} className="p-6 space-y-5 overflow-y-auto">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Pre-Provision Leader Account (e.g. Nick RU Director)</span>
              </div>
              <p className="text-slate-300">
                Configure your leaders before they log in. As soon as Nick or your other ministry leaders open the app or create their account with this email/handle, their Director role and management rights will already be active!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Leader Full Name *</label>
                <input
                  type="text"
                  required
                  value={newLeaderName}
                  onChange={(e) => setNewLeaderName(e.target.value)}
                  placeholder="e.g. Nick"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Leader Email Address *</label>
                <input
                  type="email"
                  required
                  value={newLeaderEmail}
                  onChange={(e) => setNewLeaderEmail(e.target.value)}
                  placeholder="e.g. nick@rurecovery.com"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">App Handle / Username</label>
                <input
                  type="text"
                  value={newLeaderHandle}
                  onChange={(e) => setNewLeaderHandle(e.target.value)}
                  placeholder="e.g. nick"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Official Position / Ministry Title *</label>
                <input
                  type="text"
                  required
                  value={newLeaderPosition}
                  onChange={(e) => setNewLeaderPosition(e.target.value)}
                  placeholder="e.g. RU Director"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="font-bold text-slate-300">Leadership Access Level</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setNewLeaderRole('director');
                      setNewLeaderPosition('RU Director');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newLeaderRole === 'director'
                        ? 'bg-amber-500/20 border-amber-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs">
                      <Crown className="w-3.5 h-3.5" />
                      <span>RU Director</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Full curriculum & book editing rights</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewLeaderRole('leader');
                      setNewLeaderPosition('Recovery Leader');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newLeaderRole === 'leader'
                        ? 'bg-blue-500/20 border-blue-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-blue-400 text-xs">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Leader</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Grading & meeting hosting</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewLeaderRole('teacher');
                      setNewLeaderPosition('Teacher');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newLeaderRole === 'teacher'
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-xs">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Teacher</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Student grading & sign-offs</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewLeaderRole('admin');
                      setNewLeaderPosition('Administrator');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newLeaderRole === 'admin'
                        ? 'bg-purple-500/20 border-purple-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-purple-400 text-xs">
                      <Settings className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Full app owner access</p>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('roster')}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProvisioning}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isProvisioning ? 'Provisioning...' : `Save & Provision ${newLeaderName}`}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Delete Member Confirmation Dialog */}
      {deletingUser && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0f111a] border border-red-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Remove & Delete Member</h3>
                <p className="text-xs text-slate-400">Permanent account removal</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently remove and delete{' '}
              <strong className="text-white">{deletingUser.name}</strong> (@{deletingUser.handle})? This action will revoke their login access and remove their member records from the fellowship.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-red-500/20"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm & Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
