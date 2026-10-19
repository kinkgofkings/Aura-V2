import React, { useState, useEffect } from 'react';
import { Sparkles, Megaphone, Heart, BookOpen, Radio, Flame, Volume2, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCurrentDevotional } from '../../content/devotionals';

interface SermonAlertItem {
  id: string;
  title: string;
  speaker: string;
  mediaType: string;
  channel?: string;
  dateRecorded?: string;
}

export const GlobalAlertBanner: React.FC = () => {
  const [devotional, setDevotional] = useState<any>(null);
  const [recentSermons, setRecentSermons] = useState<SermonAlertItem[]>([]);
  const [spotlightSermon, setSpotlightSermon] = useState<SermonAlertItem | null>(null);

  const navigateTo = (tab: string, subtab?: string, sermonId?: string, courseId?: string) => {
    try {
      if (sermonId) {
        localStorage.setItem('aura_study_initial_tab', 'pulpit');
        localStorage.setItem('aura_target_sermon_id', sermonId);
        sessionStorage.setItem('aura_target_sermon_id', sermonId);
      } else if (subtab) {
        localStorage.setItem('aura_study_initial_tab', subtab);
      }
    } catch {}

    if (sermonId) {
      window.dispatchEvent(new CustomEvent('open_sermon', { detail: { sermonId } }));
    }

    // Direct event dispatch to both navigate_tab AND switch_study_tab / switch_recovery_tab
    window.dispatchEvent(new CustomEvent('navigate_tab', { detail: { tab, subtab, sermonId, courseId } }));
    if (tab === 'bible' && subtab) {
      window.dispatchEvent(new CustomEvent('switch_study_tab', { detail: { tab: subtab, sermonId, courseId } }));
      window.dispatchEvent(new CustomEvent('aura_switch_study_tab', { detail: { tab: subtab, sermonId, courseId } }));
    } else if (tab === 'recovery' && subtab) {
      window.dispatchEvent(new CustomEvent('switch_recovery_tab', { detail: { tab: subtab } }));
    }
  };

  const loadSermonData = async () => {
    try {
      const res = await fetch('/api/bible/sermons/recent');
      if (res.ok) {
        const data = await res.json();
        if (data.recent && Array.isArray(data.recent)) {
          setRecentSermons(data.recent.slice(0, 5));
        }
        if (data.spotlight) {
          setSpotlightSermon(data.spotlight);
        }
      }
    } catch (e) {
      console.warn('Could not fetch sermon alerts:', e);
    }
  };

  useEffect(() => {
    const dev = getCurrentDevotional();
    setDevotional(dev);
    loadSermonData();

    // Listen for newly uploaded or live streamed sermon broadcast event
    const handleNewSermon = (e: Event) => {
      const custom = e as CustomEvent<{ sermon?: SermonAlertItem }>;
      if (custom.detail?.sermon) {
        setRecentSermons((prev) => [custom.detail!.sermon!, ...prev.slice(0, 4)]);
      }
      loadSermonData();
    };

    window.addEventListener('new_sermon_added', handleNewSermon);
    window.addEventListener('sermon_sync_completed', loadSermonData);
    return () => {
      window.removeEventListener('new_sermon_added', handleNewSermon);
      window.removeEventListener('sermon_sync_completed', loadSermonData);
    };
  }, []);

  // Determine which verse to show based on time of day
  const getVerseOfTheDay = () => {
    if (!devotional) return null;
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return {
        label: "Morning Manna",
        ref: devotional.morning.reference,
        text: devotional.morning.text,
        subtab: 'morning'
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        label: "Midday Scripture",
        ref: devotional.midday.reference,
        text: devotional.midday.text,
        subtab: 'midday'
      };
    } else {
      return {
        label: "Evening Watch",
        ref: devotional.evening.reference,
        text: devotional.evening.text,
        subtab: 'evening'
      };
    }
  };

  const currentVerse = getVerseOfTheDay();

  // Construct dynamic broadcast alerts
  const alerts: Array<{ icon: React.ReactNode; text: string; action: () => void }> = [];

  // 1. Newly Streamed / Recorded Sunday Services
  if (recentSermons.length > 0) {
    const latest = recentSermons[0];
    alerts.push({
      icon: (
        <span className="relative flex h-3 w-3 mr-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
        </span>
      ),
      text: `🔴 NEW SUNDAY SERVICE RECORDED: "${latest.title}" by ${latest.speaker || 'Pastor'} • Tap to Listen & Watch Now!`,
      action: () => navigateTo('bible', 'pulpit', latest.id)
    });

    if (recentSermons.length > 1) {
      const secondLatest = recentSermons[1];
      alerts.push({
        icon: <Radio className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />,
        text: `📻 RECENT BROADCAST: "${secondLatest.title}" • ${secondLatest.speaker} (${secondLatest.channel || 'Sanctuary Pulpit'})`,
        action: () => navigateTo('bible', 'pulpit', secondLatest.id)
      });
    }
  }

  // 2. Powerhouse Spotlight Sermon of the Week
  if (spotlightSermon) {
    alerts.push({
      icon: <Flame className="w-4 h-4 text-orange-400 shrink-0 animate-bounce" />,
      text: `🕊️ SPOTLIGHT POWERHOUSE: "${spotlightSermon.title}" by ${spotlightSermon.speaker || 'Pastor'} • Holy Spirit Revival In The Pulpit`,
      action: () => navigateTo('bible', 'pulpit', spotlightSermon.id)
    });
  }

  // 3. Scripture of the Day
  if (currentVerse) {
    alerts.push({
      icon: <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />,
      text: `📖 ${currentVerse.label} (${currentVerse.ref}): "${currentVerse.text}"`,
      action: () => navigateTo('devotional', currentVerse.subtab)
    });
  }

  // 4. Interactive Gospel Courses & Lessons
  alerts.push({
    icon: <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />,
    text: "✝️ New Interactive Gospel Courses Open: The Roman Road to Salvation & RU 10 Spiritual Principles!",
    action: () => navigateTo('bible', 'courses')
  });

  // 5. Community Intercession & Prayer Wall
  alerts.push({
    icon: <Heart className="w-4 h-4 text-pink-400 shrink-0" />,
    text: "🙏 Corporate Prayer Wall Active: Uplift fellow brothers and sisters in Christ with an 'Amen' today.",
    action: () => navigateTo('bible', 'prayers')
  });

  const [idleIndex, setIdleIndex] = useState(0);

  const nextAlert = () => {
    if (alerts.length > 0) {
      setIdleIndex((prev) => (prev + 1) % alerts.length);
    }
  };

  const currentAlert = alerts[idleIndex % alerts.length] || alerts[0];

  return (
    <div className="w-full bg-gradient-to-r from-amber-600/20 via-amber-500/25 to-amber-600/20 border-b border-amber-500/30 overflow-hidden relative z-50">
      <div className="absolute inset-0 bg-[#05060f]/85 backdrop-blur-md" />

      <div
        className="relative w-full h-10 sm:h-11 px-4 flex items-center justify-center overflow-hidden cursor-pointer select-none"
        onClick={currentAlert?.action}
      >
        {alerts.length > 0 && (
          <div className="w-full h-full flex items-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={idleIndex}
                initial={{ x: "100vw" }}
                animate={{ x: "-100%" }}
                transition={{
                  duration: 26, // Smooth marquee ticker speed
                  ease: "linear"
                }}
                onAnimationComplete={nextAlert}
                className="flex items-center gap-2.5 whitespace-nowrap px-4 hover:opacity-90 transition-opacity"
              >
                {currentAlert.icon}
                <span className="text-xs sm:text-sm font-bold text-amber-200 tracking-wide drop-shadow-md leading-none">
                  {currentAlert.text}
                </span>
                <span className="text-[10px] font-semibold text-amber-400/80 px-2 py-0.5 rounded-full bg-amber-500/20 ml-2">
                  Tap to view ➜
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
