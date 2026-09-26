// Aura Community & Bible Experience - Build v1.0.4
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocialProvider } from './context/SocialContext';
import { ChatProvider } from './context/ChatContext';
import { CallProvider } from './context/CallContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { PermissionsProvider, usePermissions } from './context/PermissionsContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { SocialFeed } from './components/feed/SocialFeed';
import { ChatView } from './components/chat/ChatView';
import { BookmarksView } from './components/bookmarks/BookmarksView';
import { BibleStudy } from './components/bible/BibleStudy';
import { DailyDevotionalTab } from './components/devotional/DailyDevotional';
import { useDevotionalNotifications } from './hooks/useDevotionalNotifications';
import { CourseStudio } from './components/bible/CourseStudio';
import { VideoCallModal } from './components/call/VideoCallModal';
import { IncomingCallBanner } from './components/call/IncomingCallBanner';
import { NotificationToastContainer } from './components/notifications/NotificationToastContainer';
import { NotificationsModal } from './components/notifications/NotificationsModal';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { MemberProfileModal } from './components/profile/MemberProfileModal';
import { AuthModal } from './components/auth/AuthModal';
import { MatrixSplashScreen } from './components/splash/MatrixSplashScreen';
import { ShareAppModal } from './components/common/ShareAppModal';
import { PermissionBanner } from './components/permissions/PermissionBanner';
import { PermissionsModal } from './components/permissions/PermissionsModal';
import { SaveToHomeModal } from './components/permissions/SaveToHomeModal';

import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuraEnergyProvider } from './context/AuraEnergyContext';
import { AuraLiveWallpaper } from './components/aura/AuraLiveWallpaper';
import { AuraEnergyHubModal } from './components/aura/AuraEnergyHubModal';

import { GospelTractModal } from './components/auth/GospelTractModal';

import { RecoveryDashboard } from './components/recovery/RecoveryDashboard';

import { UnverifiedBanner } from './components/auth/UnverifiedBanner';
import { InAppBrowser } from './components/common/InAppBrowser';

function MainApp() {
  useDevotionalNotifications();
  const [activeTab, setActiveTab] = useState<'feed' | 'bible' | 'chat' | 'studio' | 'devotional' | 'recovery'>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && ['feed', 'bible', 'chat', 'studio', 'devotional', 'recovery'].includes(tabParam)) {
        return tabParam as any;
      }
      const savedTab = localStorage.getItem('aura_active_tab');
      return (savedTab as any) || 'feed';
    } catch {
      return 'feed';
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('aura_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareModalType, setShareModalType] = useState<'general' | 'call' | 'chat'>('general');
  const [shareRoomId, setShareRoomId] = useState<string | undefined>();
  const [shareInitialContent, setShareInitialContent] = useState<string | undefined>();
  const [showSplashScreen, setShowSplashScreen] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('aura_splash_entered') !== 'true';
    } catch {
      return false;
    }
  });

  const [showGospelTract, setShowGospelTract] = useState(false);

  React.useEffect(() => {
    if (!showSplashScreen) {
      try {
        const hasSeenGospel = localStorage.getItem('aura_gospel_seen');
        if (!hasSeenGospel) {
          setShowGospelTract(true);
        }
      } catch {}
    }
  }, [showSplashScreen]);

  const { user, isAuthModalOpen, setIsAuthModalOpen } = useAuth();
  const { isNotificationsOpen, closeNotifications, openNotifications } = useNotifications();

  React.useEffect(() => {
    const handleTabNav = (e: Event) => {
      const customEvent = e as CustomEvent<{
        tab: 'feed' | 'bible' | 'chat' | 'studio' | 'recovery' | 'devotional';
        subtab?: string;
        prayerId?: string;
        sermonId?: string;
        reference?: string;
        [key: string]: any;
      }>;
      if (customEvent.detail?.tab) {
        setActiveTab(customEvent.detail.tab);
        if (customEvent.detail.subtab) {
          try {
            if (customEvent.detail.tab === 'recovery') {
              localStorage.setItem('aura_recovery_tab', customEvent.detail.subtab);
            } else {
              localStorage.setItem('aura_study_initial_tab', customEvent.detail.subtab);
            }
          } catch {}
          setTimeout(() => {
            if (customEvent.detail.tab === 'recovery') {
              window.dispatchEvent(
                new CustomEvent('switch_recovery_tab', {
                  detail: {
                    tab: customEvent.detail.subtab,
                    ...customEvent.detail,
                  },
                })
              );
            } else {
              window.dispatchEvent(
                new CustomEvent('switch_study_tab', {
                  detail: {
                    tab: customEvent.detail.subtab,
                    ...customEvent.detail,
                  },
                })
              );
            }
          }, 60);
        }
      }
    };
    const handleOpenShare = (e: Event) => {
      const customEvent = e as CustomEvent<{ type?: 'general' | 'call' | 'chat'; roomId?: string; initialContent?: string }>;
      if (customEvent.detail?.type) {
        setShareModalType(customEvent.detail.type);
      } else {
        setShareModalType('general');
      }
      setShareRoomId(customEvent.detail?.roomId);
      setShareInitialContent(customEvent.detail?.initialContent);
      setIsShareModalOpen(true);
    };
    const handleOpenUserProfile = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: string }>;
      if (customEvent.detail?.userId) {
        setViewingUserId(customEvent.detail.userId);
      }
    };

    const handleOpenSplash = () => {
      setShowSplashScreen(true);
    };

    window.addEventListener('navigate_tab', handleTabNav);
    window.addEventListener('open_share_modal', handleOpenShare);
    window.addEventListener('open_user_profile', handleOpenUserProfile);
    window.addEventListener('open_splash_screen', handleOpenSplash);
    return () => {
      window.removeEventListener('navigate_tab', handleTabNav);
      window.removeEventListener('open_share_modal', handleOpenShare);
      window.removeEventListener('open_user_profile', handleOpenUserProfile);
      window.removeEventListener('open_splash_screen', handleOpenSplash);
    };
  }, []);

  const handleOpenShareModal = (type: 'general' | 'call' | 'chat' = 'general', roomId?: string) => {
    setShareModalType(type);
    setShareRoomId(roomId);
    setShareInitialContent(undefined);
    setIsShareModalOpen(true);
  };

  const handleEnterMatrix = () => {
    try {
      sessionStorage.setItem('aura_splash_entered', 'true');
    } catch {}
    setShowSplashScreen(false);
  };

  const handleReplayMatrix = () => {
    setShowSplashScreen(true);
  };

  return (
    <div
      className={`relative ${
        activeTab === 'chat' ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-screen'
      } bg-[#05060f] text-white flex flex-col selection:bg-amber-500/30 selection:text-amber-200`}
    >
      {/* Matrix Style Splash Screen with Touch to Enter */}
      {showSplashScreen && (
        <MatrixSplashScreen onEnter={handleEnterMatrix} />
      )}

      {/* Live Animated Aura Energy Wallpaper */}
      <AuraLiveWallpaper />

      <UnverifiedBanner />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenShare={() => handleOpenShareModal('general')}
      />

      {/* Permissions & Save to Home Screen Smart Banner */}
      <PermissionBanner />

      {/* Main Content Area */}
      <main
        className={`relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden ${
          activeTab === 'chat' ? 'p-0 sm:p-2 md:p-4' : 'pb-36 sm:pb-24 md:pb-12 overflow-y-auto'
        }`}
      >
        {activeTab === 'feed' && <SocialFeed />}
        {activeTab === 'bible' && <BibleStudy />}
        {activeTab === 'devotional' && <DailyDevotionalTab />}
        {activeTab === 'chat' && <ChatView />}
        {activeTab === 'studio' && <CourseStudio />}
        {activeTab === 'recovery' && <RecoveryDashboard />}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenShare={() => handleOpenShareModal('general')}
      />

      {/* WebRTC Video Call & Incoming Call Overlay */}
      <VideoCallModal />
      <IncomingCallBanner />

      {/* Toast Notifications */}
      <NotificationToastContainer onNavigate={(tab) => setActiveTab(tab)} />

      {/* Notifications Center Modal */}
      <NotificationsModal isOpen={isNotificationsOpen} onClose={closeNotifications} />

      {/* App Permissions Setup & Diagnostic Modal */}
      <PermissionsModal />

      {/* Save to Home Screen & PWA Modal */}
      <SaveToHomeModal />

      {/* Direct Android APK Install Warning & Procedure Modal */}



      {/* User Profile Modal (Self) */}
      {isProfileOpen && (
        <UserProfileModal
          onClose={() => setIsProfileOpen(false)}
          onTriggerMatrixSplash={handleReplayMatrix}
          onOpenGospelTract={() => setShowGospelTract(true)}
          onOpenShare={() => {
            setIsProfileOpen(false);
            handleOpenShareModal('general');
          }}
          onStudyPassage={(ref) => {
            setIsProfileOpen(false);
            setActiveTab('bible');
            window.dispatchEvent(new CustomEvent('navigate_bible_study', { detail: { reference: ref } }));
          }}
          onViewPublicProfile={() => {
            setIsProfileOpen(false);
            if (user) setViewingUserId(user.id);
          }}
        />
      )}

      {/* Member Profile Modal (Other Users / Profile Cards) */}
      {viewingUserId && (
        <MemberProfileModal
          userId={viewingUserId}
          onClose={() => setViewingUserId(null)}
          onOpenSelfEdit={() => {
            setViewingUserId(null);
            setIsProfileOpen(true);
          }}
        />
      )}

      {/* Invite Friends & Share App Modal */}
      <ShareAppModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        initialType={shareModalType}
        roomId={shareRoomId}
        initialContent={shareInitialContent}
      />

      {/* Authentication / Onboarding Modal */}
      {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />}

      {/* Gospel Tract Onboarding Modal */}
      <GospelTractModal
        isOpen={showGospelTract}
        onClose={() => setShowGospelTract(false)}
        onOpenSignUp={() => setIsAuthModalOpen(true)}
      />

      {/* Aura Energy & Live Wallpaper Hub Modal */}
      <AuraEnergyHubModal />

      {/* Global In-App Webview Browser with Breadcrumbs */}
      <InAppBrowser />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <PermissionsProvider>
            <AuraEnergyProvider>
              <SocialProvider>
                <ChatProvider>
                  <CallProvider>
                    <MainApp />
                  </CallProvider>
                </ChatProvider>
              </SocialProvider>
            </AuraEnergyProvider>
          </PermissionsProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
