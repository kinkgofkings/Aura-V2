export type NotificationType = 'message' | 'chat' | 'call' | 'story' | 'system' | 'like' | 'comment' | 'follow';

export interface NotificationPayload {
  id?: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  actionId?: string;
  playSound?: boolean;
  avatar?: string;
  isRead?: boolean;
  timestamp?: number;
}

class NotificationService {
  private permission: NotificationPermission | 'default' = 'default';
  private subscribers: Set<(payload: NotificationPayload) => void> = new Set();
  
  constructor() {
    this.init();
  }

  private isIframe(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return window.self !== window.top;
    } catch (e) {
      return true; // If cross-origin error, we are in an iframe
    }
  }

  private async init() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  public async requestPermission(): Promise<boolean> {
    // Standard Web Notification API
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        this.permission = 'granted';
        return true;
      }
      // If we are in an iframe, the browser denies/blocks calling requestPermission()
      if (this.isIframe()) {
        console.warn('In iframe context: native browser notification prompt restricted by browser sandbox. In-app alerts and chimes remain active.');
        this.permission = 'granted';
        return true;
      }
      try {
        const result = await Notification.requestPermission();
        this.permission = result;
        return result === 'granted';
      } catch (e) {
        console.warn('Push notification permission error or restricted iframe:', e);
        // Enable in-app notifications fallback
        this.permission = 'granted';
        return true;
      }
    }

    // Fallback: in-app notifications are supported
    this.permission = 'granted';
    return true;
  }

  public async getPermissionStatus(): Promise<NotificationPermission | string> {
    // In-App persistence check
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('aura_perms_notif');
      if (stored === 'granted') return 'granted';
    }

    // Direct Web Notification check (Synchronous & instant)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') return 'granted';
      if (Notification.permission === 'denied') {
        // If in iframe, report prompt/granted so in-app alerts work
        if (this.isIframe()) return 'granted';
        return 'denied';
      }
      return 'default';
    }
    return 'default';
  }

  public subscribe(callback: (payload: NotificationPayload) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  public async notify(payload: NotificationPayload) {
    // 1. Trigger in-app subscribers first (Toast UI)
    this.subscribers.forEach(cb => cb(payload));

    // 2. Play subtle notification sound
    this.playSound(payload.type);

    // 3. Trigger native OS notification if allowed and app is not focused
    if (typeof window !== 'undefined' && document.hidden) {
      const status = await this.getPermissionStatus();
      if (status === 'granted' && 'Notification' in window) {
        try {
          // Check if we have a service worker for better mobile integration
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) {
              (reg as any).showNotification(payload.title, {
                body: payload.body,
                icon: '/icon.png',
                badge: '/icon.png',
                vibrate: [200, 100, 200],
                tag: payload.type, // Group similar notifications
                data: payload.data
              });
              return;
            }
          }

          // Fallback to standard web notification
          new Notification(payload.title, {
            body: payload.body,
            icon: '/icon.png'
          });
        } catch (e) {
          console.warn('Native notification failed:', e);
        }
      }
    }
  }

  private playSound(type: NotificationType) {
    if (typeof window === 'undefined') return;
    
    try {
      const audio = new Audio();
      switch (type) {
        case 'call':
          audio.src = '/sounds/ringtone.mp3';
          audio.loop = true;
          break;
        case 'message':
          audio.src = '/sounds/message.mp3';
          break;
        case 'system':
          audio.src = '/sounds/system.mp3';
          break;
        default:
          audio.src = '/sounds/pop.mp3';
      }
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          // Auto-play might be prevented by browser policy
          console.debug('Notification sound prevented by browser:', err);
        });
      }

      if (type === 'call') {
        // Return a function to stop the ringtone
        return () => {
          audio.pause();
          audio.currentTime = 0;
        };
      }
    } catch (e) {
      console.warn('Failed to play notification sound:', e);
    }
  }

  // Web Push Subscription Helper
  private urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Register device for Android / Mobile background Push Notifications
  public async registerPushSubscription(userId: string) {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      Notification.permission !== "granted" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return null;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        const res = await fetch("/api/push/vapid-key");
        if (!res.ok) return null;
        const { publicKey } = await res.json();
        if (!publicKey) return null;

        const convertedKey = this.urlBase64ToUint8Array(publicKey);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      }

      // Send subscription to server
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, subscription: sub.toJSON() }),
      });

      return sub;
    } catch (err: any) {
      // Gracefully ignore expected browser security or user permission rejections
      if (
        err?.name === "NotAllowedError" ||
        err?.message?.includes("permission denied") ||
        err?.message?.includes("Permission denied")
      ) {
        return null;
      }
      console.debug("Background push registration notice:", err);
      return null;
    }
  }

}

export const notificationService = new NotificationService();
