import React from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sun,
  Sparkles,
  BookOpen,
  Heart,
  Sliders,
  Share2,
  LogOut,
  Flame,
  MessageSquare,
  Play,
  SunMedium,
  Smartphone,
  Mic,
  Cpu,
  GraduationCap,
  RefreshCw,
  Zap,
  Database,
  UploadCloud
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { soundEffects } from '../../services/audio';
import { usePermissions } from '../../context/PermissionsContext';
import { useAuraEnergy } from '../../context/AuraEnergyContext';
import { recoverDeviceCachedPosts } from '../../services/cacheRecovery';

interface SuperAdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile?: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenPermissions?: () => void;
}

export const SuperAdminDrawer: React.FC<SuperAdminDrawerProps> = ({
  isOpen,
  onClose,
  onOpenProfile,
  onNavigateTab,
  onOpenPermissions
}) => {
  const { user, logout } = useAuth();
  const { openPermissionsModal, openSaveToHomeModal, isAndroid, isStandalone, pwaStatus } = usePermissions();
  const { openHub: openAuraHub, auraLevel } = useAuraEnergy();

  if (!isOpen) return null;

  const isTexAdmin =
    user?.handle?.toLowerCase() === 'tex' ||
    user?.email?.toLowerCase().includes('lightsouttattootex') ||
    user?.email?.toLowerCase().includes('tex@aura.social');

  const isAppInstalled = isStandalone || pwaStatus === 'installed';

  const handleAction = (cb: () => void) => {
    soundEffects.playTap();
    cb();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden flex justify-end pointer-events-auto">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      <div className="relative z-20 w-full max-w-xs sm:max-w-sm h-[100dvh] bg-[#070919] border-l border-white/10 shadow-2xl flex flex-col p-4 sm:p-5 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Aura Command Hub</h2>
              <p className="text-[10px] text-slate-400">Navigation & Tools</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playTap();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div 
            onClick={() => handleAction(() => onOpenProfile?.())}
            className="mt-4 p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center gap-3"
          >
            <Avatar src={user.avatarUrl} name={user.name || user.handle || 'User'} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white truncate">{user.name}</span>
                {isTexAdmin && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">@{user.handle}</p>
            </div>
          </div>
        )}

        {/* Navigation & Tools Sections */}
        <div className="mt-4 space-y-3 flex-1">
          {/* Admin Studio */}
          {isTexAdmin && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 mb-1.5">
                Creator & Admin Suite
              </p>
              <button
                onClick={() => handleAction(() => onNavigateTab?.('studio'))}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-600/10 border border-amber-500/20 text-amber-300 hover:bg-amber-600/20 transition-all text-xs font-semibold"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Master Studio & Course Builder</span>
              </button>
            </div>
          )}

          {/* Quick Inspirations & Tools */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 mb-1.5">
              Spiritual & Daily Tools
            </p>
            <button
              onClick={() => {
                soundEffects.playLikeSparkle();
                window.dispatchEvent(new CustomEvent('open_daily_motivation'));
                onClose();
              }}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition-all text-xs font-semibold"
            >
              <SunMedium className="w-4 h-4 text-amber-400" />
              <span>Daily Motivation Word</span>
            </button>

            {/* My Journey */}
            <button
              onClick={() => handleAction(() => {
                if (onOpenProfile) onOpenProfile();
              })}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-100 hover:bg-amber-500/20 transition-all text-xs font-bold"
            >
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 text-amber-400" />
                <span>My Journey (Profile)</span>
              </div>
            </button>

          </div>

          {/* Community & Feeds */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
              Community & Feeds
            </p>

            <button
              onClick={() => handleAction(() => onNavigateTab?.('feed'))}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold"
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Community Feed & Stories</span>
            </button>

            
            {/* Dedicated Bible Reader */}
            <button
              onClick={() => handleAction(() => {
                try { localStorage.setItem('aura_study_initial_tab', 'reader'); } catch {}
                onNavigateTab?.('bible');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('switch_study_tab', { detail: { tab: 'reader' } }));
                }, 50);
              })}
              className="w-full flex items-center justify-between p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Bible Reader (KJV)</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                KJV
              </span>
            </button>

            {/* Dedicated Pulpit & Sermons */}
            <button
              onClick={() => handleAction(() => {
                try { localStorage.setItem('aura_study_initial_tab', 'pulpit'); } catch {}
                onNavigateTab?.('bible');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('switch_study_tab', { detail: { tab: 'pulpit' } }));
                }, 50);
              })}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold"
            >
              <Mic className="w-4 h-4 text-orange-400" />
              <span>Pulpit & Sermons</span>
            </button>

            {/* Dedicated Study Engine */}
            <button
              onClick={() => handleAction(() => {
                try { localStorage.setItem('aura_study_initial_tab', 'study'); } catch {}
                onNavigateTab?.('bible');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('switch_study_tab', { detail: { tab: 'study' } }));
                }, 50);
              })}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold"
            >
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Study Engine</span>
            </button>

            {/* Dedicated Courses */}
            <button
              onClick={() => handleAction(() => {
                try { localStorage.setItem('aura_study_initial_tab', 'courses'); } catch {}
                onNavigateTab?.('bible');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('switch_study_tab', { detail: { tab: 'courses' } }));
                }, 50);
              })}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold"
            >
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>Courses</span>
            </button>

            {/* Dedicated Prayer Wall */}
            <button
              onClick={() => handleAction(() => {
                try { localStorage.setItem('aura_study_initial_tab', 'prayers'); } catch {}
                onNavigateTab?.('bible');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('switch_study_tab', { detail: { tab: 'prayers' } }));
                }, 50);
              })}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold"
            >
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Sanctuary Prayer Wall</span>
            </button>
          </div>

          {/* Tools & Device Settings */}
          <div className="space-y-1 pt-2 border-t border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
              Tools & Settings
            </p>

            {/* Aura Live Wallpaper & Energy Hub */}
            <button
              onClick={() => handleAction(() => openAuraHub())}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-500/25 text-amber-200 hover:border-amber-400/50 hover:bg-amber-500/20 transition-all text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.15)]"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Aura Energy & Live Wallpaper</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {auraLevel}%
              </span>
            </button>

            {/* Web App Install */}
            {!isAppInstalled ? (
              <button
                onClick={() => handleAction(() => openSaveToHomeModal())}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-orange-300 hover:bg-orange-600/20 transition-all text-xs font-semibold"
              >
                <Smartphone className="w-4 h-4 text-orange-400" />
                <span>Install Aura App</span>
              </button>
            ) : null}

            <button
              onClick={() =>
                handleAction(() => {
                  window.dispatchEvent(new CustomEvent('open_share_modal'));
                })
              }
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold"
            >
              <Share2 className="w-4 h-4 text-sky-400" />
              <span>Invite Friends & QR Code</span>
            </button>

            <button
              onClick={() =>
                handleAction(() => {
                  if (onOpenPermissions) onOpenPermissions();
                  else openPermissionsModal();
                })
              }
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Audio/Video & Notifications Setup</span>
            </button>

            {/* Sync Phone Cached Posts */}
            <button
              id="super-menu-sync-posts"
              onClick={async () => {
                soundEffects.play('pop');
                try {
                  const res = await recoverDeviceCachedPosts();
                  if (res.addedToServer > 0) {
                    alert(`🎉 Successfully recovered ${res.addedToServer} post(s) from this device to the server database!`);
                    soundEffects.play('success');
                    window.dispatchEvent(new CustomEvent('refresh_feed'));
                  } else if (res.foundCandidates > 0) {
                    alert(`Found ${res.foundCandidates} items in device storage, all are already up-to-date on the server.`);
                  } else {
                    alert(`No offline posts or reflections found in this device's storage. If you took church notes in another browser/app, open Aura there and tap this button!`);
                  }
                } catch (e: any) {
                  alert(`Sync error: ${e.message || 'Failed'}`);
                }
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl text-teal-300 hover:text-white hover:bg-teal-600/20 border border-teal-500/20 transition-all text-xs font-semibold"
            >
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-teal-400" />
                <span>Sync Phone Cached Posts</span>
              </div>
              <UploadCloud className="w-3.5 h-3.5 text-teal-400" />
            </button>

            <button
              id="super-menu-refresh-app"
              onClick={() =>
                handleAction(() => {
                  soundEffects.playTap();
                  window.location.reload();
                })
              }
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-emerald-300 hover:text-white hover:bg-emerald-600/20 border border-emerald-500/20 transition-all text-xs font-semibold"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>Refresh and Save App</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 mt-auto">
          <button
            onClick={() => handleAction(() => logout())}
            className="w-full flex items-center gap-2 p-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all text-xs font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
