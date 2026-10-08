import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { soundEffects } from '../services/audio';
import { notificationService } from '../services/notifications';
import { offlineStorage } from '../services/offlineStorage';
import { dispatchDevotionalNow } from '../hooks/useDevotionalNotifications';
import { updateDeviceAppBadge } from '../utils/appBadge';

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';
export type PwaInstallState = 'available' | 'installed' | 'ios_manual' | 'unsupported';

interface PermissionsContextType {
  cameraStatus: PermissionState;
  micStatus: PermissionState;
  notificationStatus: PermissionState;
  pwaStatus: PwaInstallState;
  isStandalone: boolean;
  isIos: boolean;
  isAndroid: boolean;
  isBannerDismissed: boolean;
  isPermissionsModalOpen: boolean;
  isSaveToHomeModalOpen: boolean;
  
  // Actions
  requestCameraPermission: () => Promise<boolean>;
  requestMicPermission: () => Promise<boolean>;
  requestMediaPermissions: () => Promise<{ camera: boolean; mic: boolean }>;
  requestNotificationPermission: () => Promise<boolean>;
  requestAllPermissions: () => Promise<{ camera: boolean; mic: boolean; notifications: boolean }>;
  promptSaveToHome: () => Promise<void>;
  
  // Modal toggles
  openPermissionsModal: () => void;
  closePermissionsModal: () => void;
  openSaveToHomeModal: () => void;
  closeSaveToHomeModal: () => void;
  openAndroidApkModal: () => void;
  dismissBanner: () => void;
  restoreBanner: () => void;
  
  // Verification helpers
  isRequestingAll: boolean;
  checkAllPermissions: () => Promise<void>;
  sendTestNotification: () => void;
  sendTestDevotionalNotification: () => void;
  sendTestCallNotification: (isVideo?: boolean) => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

const BANNER_DISMISSED_KEY = 'aura_permissions_banner_dismissed';

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cameraStatus, setCameraStatus] = useState<PermissionState>('prompt');
  const [micStatus, setMicStatus] = useState<PermissionState>('prompt');
  const [notificationStatus, setNotificationStatus] = useState<PermissionState>('prompt');
  const [pwaStatus, setPwaStatus] = useState<PwaInstallState>('available');
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(BANNER_DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isSaveToHomeModalOpen, setIsSaveToHomeModalOpen] = useState(false);
  const [isRequestingAll, setIsRequestingAll] = useState(false);

  // Store deferred PWA install prompt
  const deferredPromptRef = useRef<any>(null);

  // Check platform environment
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Detect Android devices
    const isAndroidDevice = /android/.test(userAgent);
    setIsAndroid(isAndroidDevice);

    // Detect Standalone (already added to Home Screen)
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(Boolean(isInStandaloneMode));

    if (isInStandaloneMode) {
      setPwaStatus('installed');
    } else if (isIosDevice) {
      setPwaStatus('ios_manual');
    }

    // Listen for BeforeInstallPrompt event (Chrome, Android, Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      if (!isInStandaloneMode) {
        setPwaStatus('available');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // App installed event listener
    const handleAppInstalled = () => {
      setPwaStatus('installed');
      deferredPromptRef.current = null;
      soundEffects.playLevelUp();
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Check current permission queries
  const checkAllPermissions = useCallback(async () => {
    if (typeof window === 'undefined') return;

    // Direct check for native Notification.permission
    if ('Notification' in window) {
      if (window.Notification.permission === 'granted') {
        setNotificationStatus('granted');
        const activeUser = offlineStorage.load<any>('aura_active_user', null);
        if (activeUser?.id) {
          notificationService.registerPushSubscription(activeUser.id).catch(() => {});
        }
      } else if (window.Notification.permission === 'denied') {
        setNotificationStatus('denied');
      } else {
        setNotificationStatus('prompt');
      }
    } else {
      setNotificationStatus('unsupported');
    }

    // Modern permissions API query if available
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const notifPerm = await navigator.permissions.query({ name: 'notifications' as any }).catch(() => null);
        if (notifPerm) {
          if (notifPerm.state === 'granted') setNotificationStatus('granted');
          else if (notifPerm.state === 'denied') setNotificationStatus('denied');
          else setNotificationStatus('prompt');

          notifPerm.onchange = () => {
            if (notifPerm.state === 'granted') {
              setNotificationStatus('granted');
              try { localStorage.setItem('aura_perms_notif', 'granted'); } catch {}
            } else if (notifPerm.state === 'denied') {
              setNotificationStatus('denied');
            } else {
              setNotificationStatus('prompt');
            }
          };
        }

        const camPerm = await navigator.permissions.query({ name: 'camera' as any }).catch(() => null);
        if (localStorage.getItem('aura_perms_cam') === 'granted') {
          setCameraStatus('granted');
        } else if (camPerm) {
          setCameraStatus(camPerm.state as PermissionState);
          camPerm.onchange = () => setCameraStatus(camPerm.state as PermissionState);
        }

        const micPerm = await navigator.permissions.query({ name: 'microphone' as any }).catch(() => null);
        if (localStorage.getItem('aura_perms_mic') === 'granted') {
          setMicStatus('granted');
        } else if (micPerm) {
          setMicStatus(micPerm.state as PermissionState);
          micPerm.onchange = () => setMicStatus(micPerm.state as PermissionState);
        }
      } catch {
        // Some browsers don't support camera/mic in permissions.query
      }
    } else {
      // Fallback for browsers without permissions API
      if (localStorage.getItem('aura_perms_cam') === 'granted') setCameraStatus('granted');
      if (localStorage.getItem('aura_perms_mic') === 'granted') setMicStatus('granted');
    }
  }, []);

  useEffect(() => {
    checkAllPermissions();

    const handleFocusOrVisible = () => {
      checkAllPermissions();
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    return () => {
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    };
  }, [checkAllPermissions]);

  // Request Camera
  const requestCameraPermission = async (): Promise<boolean> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('unsupported');
      return false;
    }
    try {
      soundEffects.playTap();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraStatus('granted');
      localStorage.setItem('aura_perms_cam', 'granted');
      soundEffects.playSuccessTone();
      return true;
    } catch (err: any) {
      console.warn('Camera permission denied or unavailable:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
      }
      return false;
    }
  };

  // Request Microphone
  const requestMicPermission = async (): Promise<boolean> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicStatus('unsupported');
      return false;
    }
    try {
      soundEffects.playTap();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicStatus('granted');
      localStorage.setItem('aura_perms_mic', 'granted');
      soundEffects.playSuccessTone();
      return true;
    } catch (err: any) {
      console.warn('Mic permission denied or unavailable:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicStatus('denied');
      }
      return false;
    }
  };

  // Request Both Camera & Microphone
  const requestMediaPermissions = async (): Promise<{ camera: boolean; mic: boolean }> => {
    soundEffects.playTap();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('unsupported');
      setMicStatus('unsupported');
      return { camera: false, mic: false };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraStatus('granted');
      setMicStatus('granted');
      localStorage.setItem('aura_perms_cam', 'granted');
      localStorage.setItem('aura_perms_mic', 'granted');
      soundEffects.playSuccessTone();
      return { camera: true, mic: true };
    } catch (err: any) {
      console.warn('Combined media request error, trying separate requests:', err);
      const cameraResult = await requestCameraPermission();
      const micResult = await requestMicPermission();
      return { camera: cameraResult, mic: micResult };
    }
  };

  // Request Notifications (Robust & Safe for iframes & browsers)
  const requestNotificationPermission = async (): Promise<boolean> => {
    soundEffects.playTap();
    let isGranted = false;
    try {
      const granted = await notificationService.requestPermission();
      isGranted =
        granted &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        window.Notification.permission === 'granted';
    } catch (err) {
      console.warn('requestNotificationPermission error:', err);
      isGranted = false;
    }

    if (isGranted) {
      setNotificationStatus('granted');
      try {
        localStorage.setItem('aura_perms_notif', 'granted');
      } catch {}
      soundEffects.playHeavenlyChord();

      // Automatically register Web Push subscription on the server if supported
      const savedUser = offlineStorage.load<any>('aura_active_user', null);
      if (savedUser?.id) {
        notificationService.registerPushSubscription(savedUser.id).catch(() => {});
      }

      notificationService.notify({
        type: 'system',
        title: 'Device Alerts Active! 🕊️',
        body: 'Aura notifications are now active in your device slide-out drawer.',
        playSound: true,
        actionId: 'feed',
      });

      // Deliver current daily verse immediately so user sees and hears it working
      dispatchDevotionalNow();
      return true;
    } else {
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'denied') {
        setNotificationStatus('denied');
      } else {
        setNotificationStatus('prompt');
      }
      return false;
    }
  };

  // Request All (Camera, Mic & Notifications)
  const requestAllPermissions = async (): Promise<{ camera: boolean; mic: boolean; notifications: boolean }> => {
    setIsRequestingAll(true);
    let notifResult = false;
    let cameraResult = false;
    let micResult = false;

    try {
      // 1. Prioritize Notifications first (User's primary desire)
      notifResult = await requestNotificationPermission();
    } catch (e) {
      console.warn('Notification permission error during allow all:', e);
      notifResult = true;
    }

    try {
      // 2. Safely request media permissions (camera & microphone)
      const media = await requestMediaPermissions();
      cameraResult = media.camera;
      micResult = media.mic;
    } catch (err) {
      console.warn('Media permission error during allow all:', err);
    } finally {
      setIsRequestingAll(false);
    }

    return {
      camera: cameraResult,
      mic: micResult,
      notifications: notifResult,
    };
  };

  // Trigger Save to Home / Add to Home Screen
  const promptSaveToHome = async () => {
    soundEffects.playTap();
    if (deferredPromptRef.current) {
      try {
        deferredPromptRef.current.prompt();
        const { outcome } = await deferredPromptRef.current.userChoice;
        if (outcome === 'accepted') {
          setPwaStatus('installed');
          deferredPromptRef.current = null;
        }
      } catch (e) {
        console.warn('PWA install error:', e);
        setIsSaveToHomeModalOpen(true);
      }
    } else {
      // If prompt not directly available (e.g. iOS or manual), open step-by-step visual modal
      setIsSaveToHomeModalOpen(true);
    }
  };

  const sendTestNotification = () => {
    soundEffects.playMessageReceived();
    notificationService.notify({
      type: 'chat',
      title: 'Aura Sanctuary ✨',
      body: 'Check your device slide-out menu! Notifications and red badge are now active.',
      playSound: true,
      actionId: 'feed',
    });
    updateDeviceAppBadge(1);
  };

  const sendTestDevotionalNotification = () => {
    soundEffects.playHeavenlyChord();
    dispatchDevotionalNow();
  };

  // Test background incoming call push
  const sendTestCallNotification = async (isVideo: boolean = true) => {
    soundEffects.playTap();
    const savedUser = offlineStorage.load<any>('aura_active_user', null);
    const userId = savedUser?.id || 'demo-user-1';

    try {
      // Ensure push subscription exists on server
      await notificationService.registerPushSubscription(userId);

      const res = await fetch('/api/push/test-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isVideo }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        soundEffects.playSuccessTone();
        if (data.reachable === false) {
          notificationService.notify({
            type: 'system',
            title: 'This phone is not registered',
            body: 'Allow notifications and add Aura to your home screen, then run the test again. A closed app cannot ring without that registration.',
            playSound: false,
          });
        } else {
          notificationService.notify({
            type: 'call',
            title: 'Incoming Call Test Queued',
            body: 'Your device will alert in 3.5 seconds. Switch apps or lock your screen now to test.',
            playSound: true,
          });
        }
      }
    } catch (err) {
      console.warn('Failed to trigger test call push:', err);
    }
  };

  const dismissBanner = () => {
    setIsBannerDismissed(true);
    try {
      localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    } catch {}
  };

  const restoreBanner = () => {
    setIsBannerDismissed(false);
    try {
      localStorage.removeItem(BANNER_DISMISSED_KEY);
    } catch {}
  };

  return (
    <PermissionsContext.Provider
      value={{
        cameraStatus,
        micStatus,
        notificationStatus,
        pwaStatus,
        isStandalone,
        isIos,
        isAndroid,
        isBannerDismissed,
        isPermissionsModalOpen,
        isSaveToHomeModalOpen,
        requestCameraPermission,
        requestMicPermission,
        requestMediaPermissions,
        requestNotificationPermission,
        requestAllPermissions,
        promptSaveToHome,
        openPermissionsModal: () => setIsPermissionsModalOpen(true),
        closePermissionsModal: () => setIsPermissionsModalOpen(false),
        openSaveToHomeModal: () => setIsSaveToHomeModalOpen(true),
        closeSaveToHomeModal: () => setIsSaveToHomeModalOpen(false),
        openAndroidApkModal: () => setIsSaveToHomeModalOpen(true),
        dismissBanner,
        restoreBanner,
        isRequestingAll,
        checkAllPermissions,
        sendTestNotification,
        sendTestDevotionalNotification,
        sendTestCallNotification,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};
