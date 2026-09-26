import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Video,
  Mic,
  Bell,
  Download,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { usePermissions } from '../../context/PermissionsContext';

export const PermissionBanner: React.FC = () => {
  const {
    cameraStatus,
    micStatus,
    notificationStatus,
    pwaStatus,
    isStandalone,
    isBannerDismissed,
    isRequestingAll,
    requestNotificationPermission,
    requestCameraPermission,
    requestMicPermission,
    requestAllPermissions,
    promptSaveToHome,
    openPermissionsModal,
    dismissBanner,
  } = usePermissions();

  const [isSuccessFeedback, setIsSuccessFeedback] = useState(false);

  const isMediaGranted = cameraStatus === 'granted' && micStatus === 'granted';
  const isNotifGranted =
    notificationStatus === 'granted' ||
    (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted');
  const isPwaInstalled = isStandalone || pwaStatus === 'installed';

  const allComplete = isMediaGranted && isNotifGranted && isPwaInstalled;

  // Don't show if all permissions are granted and app is installed, or if user dismissed
  if (allComplete || isBannerDismissed) {
    return null;
  }

  const handleAllowAll = async () => {
    try {
      await requestAllPermissions();
      if (!isPwaInstalled) {
        await promptSaveToHome();
      }
      setIsSuccessFeedback(true);
      setTimeout(() => {
        dismissBanner();
      }, 1600);
    } catch (err) {
      console.warn('Allow All execution warning:', err);
      dismissBanner();
    }
  };

  return (
    <div
      id="permission-smart-banner"
      className="relative z-30 max-w-7xl mx-auto px-3 sm:px-6 pt-2 pb-1 animate-fade-in"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/80 via-[#0d1333]/95 to-orange-950/80 border border-amber-500/40 p-3 sm:p-4 shadow-xl backdrop-blur-xl">
        {/* Ambient subtle glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          {/* Info & Status Badges */}
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/25 border border-amber-500/50 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                  <span>Enable Full Aura Features</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/30">
                    Recommended
                  </span>
                </h4>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-snug">
                Allow Camera & Mic for calling, enable Daily Verse alerts & sound chimes, and Save to Home Screen.
              </p>

              {/* Status pills list */}
              <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap text-[10px] font-semibold">
                {/* Camera & Mic Status */}
                <button
                  type="button"
                  onClick={async () => {
                    await requestCameraPermission();
                    await requestMicPermission();
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-all ${
                    isMediaGranted
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:border-amber-400/50 active:scale-95'
                  }`}
                  title="Enable Camera & Microphone"
                >
                  <Video className="w-3 h-3 text-amber-400" />
                  <span>Camera & Mic</span>
                  {isMediaGranted ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-0.5" />
                  ) : (
                    <span className="text-[9px] text-amber-400 font-bold ml-0.5">Allow</span>
                  )}
                </button>

                {/* Notifications Status */}
                <button
                  type="button"
                  onClick={async () => {
                    await requestNotificationPermission();
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-all ${
                    isNotifGranted
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/40 hover:bg-amber-500/30 active:scale-95 animate-pulse'
                  }`}
                  title="Enable Daily Verses & Alerts"
                >
                  <Bell className="w-3 h-3 text-amber-400" />
                  <span>Notifications & Verses</span>
                  {isNotifGranted ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-0.5" />
                  ) : (
                    <span className="text-[9px] text-amber-300 font-bold ml-0.5">Enable</span>
                  )}
                </button>

                {/* Save to Home Status */}
                <button
                  type="button"
                  onClick={promptSaveToHome}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-all ${
                    isPwaInstalled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:border-amber-400/50 active:scale-95'
                  }`}
                >
                  <Smartphone className="w-3 h-3 text-orange-400" />
                  <span>Save to Home</span>
                  {isPwaInstalled ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-0.5" />
                  ) : (
                    <span className="text-[9px] text-yellow-400 font-bold ml-0.5">Add</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
            <button
              id="allow-all-permissions-banner-btn"
              type="button"
              onClick={handleAllowAll}
              disabled={isRequestingAll}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-white text-xs font-bold shadow-lg border flex items-center gap-1.5 transition-all active:scale-95 ${
                isSuccessFeedback
                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-amber-500/30 border-amber-400/40 hover:scale-105'
              }`}
            >
              {isRequestingAll ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-200" />
                  <span>Enabling All...</span>
                </>
              ) : isSuccessFeedback ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Activated!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Allow All & Activate</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={openPermissionsModal}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 text-xs font-semibold flex items-center gap-1 transition-all"
              title="Inspect Device Settings"
            >
              <span>Manage</span>
              <ChevronRight className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={dismissBanner}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Dismiss for now"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

