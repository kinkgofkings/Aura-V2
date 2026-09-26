import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  MessageSquare,
  Home,
  Bell,
  LogIn,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useNotifications } from '../../context/NotificationContext';
import { notificationService } from '../../services/notifications';
import { Avatar } from '../common/Avatar';
import { DailyMotivationModal } from '../feed/DailyMotivationModal';
import { SuperAdminDrawer } from './SuperAdminDrawer';
import { AuraEnergyQuickPill } from '../aura/AuraEnergyQuickPill';
import { SparkGridIcon } from '../common/SparkGridIcon';

interface NavbarProps {
  activeTab: 'feed' | 'bible' | 'chat' | 'studio' | 'devotional' | 'recovery';
  setActiveTab: (tab: 'feed' | 'bible' | 'chat' | 'studio' | 'devotional' | 'recovery') => void;
  onOpenProfile: () => void;
  onOpenShare?: () => void;
  onOpenNotifications?: () => void;
}

import { GlobalAlertBanner } from './GlobalAlertBanner';

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenProfile,
  onOpenShare,
  onOpenNotifications,
}) => {
  const { user, openAuthModal } = useAuth();
  const { conversations } = useChat();
  const { unreadCount, openNotifications } = useNotifications();

  const isTexAdmin =
    user?.handle?.toLowerCase() === 'tex' ||
    user?.email?.toLowerCase().includes('lightsouttattootex') ||
    user?.email?.toLowerCase().includes('tex@aura.social');

  const [isMotivationOpen, setIsMotivationOpen] = useState(false);
  const [isSuperDrawerOpen, setIsSuperDrawerOpen] = useState(false);

  React.useEffect(() => {
    const handleOpenMotivation = () => setIsMotivationOpen(true);
    window.addEventListener('open_daily_motivation', handleOpenMotivation);
    return () => window.removeEventListener('open_daily_motivation', handleOpenMotivation);
  }, []);

  const totalUnreadChats = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const handleBellClick = async () => {
    const status = await notificationService.getPermissionStatus();
    if (status === 'prompt' || status === 'default') {
      await notificationService.requestPermission();
    }
    if (onOpenNotifications) {
      onOpenNotifications();
    } else {
      openNotifications();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full flex flex-col shadow-lg">
      <GlobalAlertBanner />
      <div className="w-full pb-3 px-3 pt-3 sm:px-6 bg-[#05060f]/90 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo & Live Badge */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open_splash_screen'));
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-500 to-amber-600 p-[1.5px] shadow-lg shadow-amber-500/30 overflow-hidden cursor-pointer group"
            title="Aura Sanctuary - Lion of Judah"
          >
            <div className="w-full h-full rounded-[14px] bg-[#05060f]/90 backdrop-blur-md flex items-center justify-center overflow-hidden relative p-1 transition-transform group-hover:scale-105">
              <img
                src="/icon.png"
                alt="Aura Logo"
                className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                AURA
              </h1>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Live
              </span>
            </div>
          </div>
        </div>

        {/* Center Desktop Navigation Pill Tabs */}
        <nav className="hidden md:flex items-center p-1 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'feed'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30 border border-amber-400/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('bible')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bible'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30 border border-amber-400/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Bible</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30 border border-amber-400/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chats</span>
            {totalUnreadChats > 0 && (
              <span className="w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] font-black flex items-center justify-center">
                {totalUnreadChats}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('recovery')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'recovery'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30 border border-amber-400/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Path to Freedom</span>
          </button>

          {isTexAdmin && (
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'studio'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30 border border-amber-400/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Studio</span>
            </button>
          )}
        </nav>

        {/* Right Action Suite: Cleaned Up */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Aura Energy & Live Wallpaper Pill */}
          <AuraEnergyQuickPill />

          {/* Notifications Center Bell */}
          <button
            onClick={handleBellClick}
            className="relative p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-amber-400 transition-all flex items-center justify-center active:scale-95"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-amber-500/40 border-2 border-[#05060f] animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Spark Grid Super Enhanced Menu Trigger */}
          <button
            id="navbar-spark-grid-super-menu"
            onClick={() => setIsSuperDrawerOpen(true)}
            className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-br from-amber-600/15 via-yellow-600/20 to-orange-600/15 hover:from-amber-600/25 hover:to-orange-600/25 border border-amber-500/30 text-amber-400 hover:text-white transition-all active:scale-95 flex-shrink-0 shadow-lg shadow-amber-500/10 flex items-center justify-center group"
            title="Super Enhanced Menu"
            aria-label="Super Enhanced Menu"
          >
            <SparkGridIcon className="w-5 h-5 text-amber-400 group-hover:text-amber-200 transition-colors drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
          </button>

          {!user && (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-bold text-xs shadow-lg shadow-amber-500/25 border border-amber-400/30"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      <DailyMotivationModal
        isOpen={isMotivationOpen}
        onClose={() => setIsMotivationOpen(false)}
      />

      <SuperAdminDrawer
        isOpen={isSuperDrawerOpen}
        onClose={() => setIsSuperDrawerOpen(false)}
        onOpenProfile={onOpenProfile}
        onNavigateTab={(tab) => {
          setActiveTab(tab as any);
          setIsSuperDrawerOpen(false);
        }}
      />
      </div>
    </header>
  );
};
