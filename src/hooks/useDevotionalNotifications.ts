import { useEffect } from 'react';
import { getCurrentDevotional, DailyDevotional, DevotionalEntry } from '../content/devotionals';
import { notificationService } from '../services/notifications';

const DEVOTIONAL_DATE_KEY = 'aura_last_devotional_sent_date';
const DEVOTIONAL_SLOT_KEY = 'aura_last_devotional_sent_slot';

export const getDevotionalSlot = (hour: number): 'morning' | 'midday' | 'evening' => {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'midday';
  return 'evening';
};

export const dispatchDevotionalNow = (forcedSlot?: 'morning' | 'midday' | 'evening') => {
  try {
    const now = new Date();
    const hour = now.getHours();
    const slot = forcedSlot || getDevotionalSlot(hour);
    const devotional = getCurrentDevotional();
    const entry: DevotionalEntry = devotional[slot];

    const slotNames: Record<string, string> = {
      morning: 'Morning Manna',
      midday: 'Midday Daily Bread',
      evening: 'Evening Scripture & Prayer',
    };

    const notif = notificationService.notify({
      type: 'system',
      title: `📖 Verse of the Day: ${entry.reference}`,
      body: `"${entry.text}"\n\n🕊️ ${entry.reminder}`,
      playSound: true,
      actionId: 'devotional-nav',
    });

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    try {
      localStorage.setItem(DEVOTIONAL_DATE_KEY, todayStr);
      localStorage.setItem(DEVOTIONAL_SLOT_KEY, slot);
    } catch {}

    return notif;
  } catch (err) {
    console.error('Failed to dispatch devotional:', err);
    return null;
  }
};

export const useDevotionalNotifications = () => {
  useEffect(() => {
    // 1. Check & request permissions gracefully
    const initNotifications = async () => {
      try {
        const status = await notificationService.getPermissionStatus();
        if (status === 'prompt' || status === 'default') {
          await notificationService.requestPermission();
        }
      } catch (err) {
        console.warn('Notification init check error:', err);
      }
    };
    initNotifications();

    // 2. Guaranteed Catch-Up & Periodic Delivery Check
    const checkAndDeliverDevotional = () => {
      try {
        const now = new Date();
        const hour = now.getHours();
        const slot = getDevotionalSlot(hour);
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const lastDate = localStorage.getItem(DEVOTIONAL_DATE_KEY);
        const lastSlot = localStorage.getItem(DEVOTIONAL_SLOT_KEY);

        // If never received today or haven't received current slot today, deliver immediately!
        const isNewDay = lastDate !== todayStr;
        const isNewSlot = lastSlot !== slot;

        if (isNewDay || isNewSlot) {
          dispatchDevotionalNow(slot);
        }
      } catch (e) {
        console.warn('Devotional delivery check error:', e);
      }
    };

    // Run catch-up delivery after 1.5s delay to ensure app & audio context are mounted
    const initialTimer = setTimeout(checkAndDeliverDevotional, 1500);

    // Continue checking every 60 seconds
    const intervalId = setInterval(checkAndDeliverDevotional, 60 * 1000);

    // Listen for manual trigger events (e.g. from Notifications Center "Get Verse" button)
    const handleManualTrigger = () => {
      dispatchDevotionalNow();
    };
    window.addEventListener('trigger_devotional_notification', handleManualTrigger);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
      window.removeEventListener('trigger_devotional_notification', handleManualTrigger);
    };
  }, []);
};

