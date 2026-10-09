export type MissionCategory = 'encouragement' | 'generosity' | 'service' | 'witnessing';

export interface KingdomMission {
  id: string;
  date: string;
  title: string;
  scriptureRef: string;
  promptText: string;
  category: MissionCategory;
  completionCount: number;
}

export interface MissionTemplate {
  title: string;
  scriptureRef: string;
  promptText: string;
  category: MissionCategory;
}

export const MISSION_CATALOG: MissionTemplate[] = [
  {
    title: 'Speak Peace Today',
    scriptureRef: 'James 1:22',
    promptText: 'Be a doer of the Word. Send one sincere word of encouragement to someone who has been quiet lately.',
    category: 'encouragement',
  },
  {
    title: 'Open Hands',
    scriptureRef: 'Proverbs 11:25',
    promptText: 'The liberal soul shall be made fat. Give something useful today: a meal, a ride, or a bill you can quietly cover.',
    category: 'generosity',
  },
  {
    title: 'Shoulder a Burden',
    scriptureRef: 'Galatians 6:2',
    promptText: 'Bear one burden with someone. Ask what you can carry for them this week, then do the first step before the day ends.',
    category: 'service',
  },
  {
    title: 'Name the Hope',
    scriptureRef: '1 Peter 3:15',
    promptText: 'Be ready to give an answer. Tell one person, in ordinary words, why Jesus is your hope.',
    category: 'witnessing',
  },
  {
    title: 'Bless the Overlooked',
    scriptureRef: 'Matthew 25:40',
    promptText: 'Notice someone who is usually overlooked. Greet them by name and ask how you can pray for them.',
    category: 'encouragement',
  },
  {
    title: 'Give Without a Record',
    scriptureRef: 'Matthew 6:3',
    promptText: 'Let not thy left hand know what thy right hand doeth. Give in secret today and tell no one but the Lord.',
    category: 'generosity',
  },
  {
    title: 'Serve Before You Are Asked',
    scriptureRef: 'Mark 10:45',
    promptText: 'The Son of man came to minister. Do one unnoticed act of service in your home, church, or workplace.',
    category: 'service',
  },
  {
    title: 'Invite Someone to the Word',
    scriptureRef: 'Romans 10:17',
    promptText: 'Faith cometh by hearing. Invite one person to read a chapter with you or to watch a Sunday service.',
    category: 'witnessing',
  },
  {
    title: 'Write a Mercy Note',
    scriptureRef: 'Colossians 3:12',
    promptText: 'Put on bowels of mercies. Write a short note that thanks someone for a specific kindness.',
    category: 'encouragement',
  },
  {
    title: 'Share Your Table',
    scriptureRef: 'Hebrews 13:2',
    promptText: 'Be not forgetful to entertain strangers. Share a meal, coffee, or groceries with someone outside your usual circle.',
    category: 'generosity',
  },
  {
    title: 'Visit or Call the Weary',
    scriptureRef: 'James 1:27',
    promptText: 'Pure religion visits the afflicted. Call or sit with someone who is sick, lonely, or grieving.',
    category: 'service',
  },
  {
    title: 'Pray Aloud With Someone',
    scriptureRef: 'Matthew 18:20',
    promptText: 'Where two or three are gathered. Pray out loud with one other person about a real need.',
    category: 'witnessing',
  },
  {
    title: 'Forgive Before Sunset',
    scriptureRef: 'Ephesians 4:32',
    promptText: 'Be ye kind one to another, tenderhearted, forgiving one another. Release a grudge and, if it is safe, tell them you forgive them.',
    category: 'encouragement',
  },
  {
    title: 'Give the First Portion',
    scriptureRef: '2 Corinthians 9:7',
    promptText: 'God loveth a cheerful giver. Set aside a gift for your church or for someone in need before you spend on yourself.',
    category: 'generosity',
  },
];

export function utcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function previousDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map((part) => parseInt(part, 10));
  const prev = new Date(Date.UTC(year, month - 1, day));
  prev.setUTCDate(prev.getUTCDate() - 1);
  return prev.toISOString().slice(0, 10);
}

export function missionForDate(dateKey = utcDateKey(), completionCount = 0): KingdomMission {
  const [year, month, day] = dateKey.split('-').map((part) => parseInt(part, 10));
  const start = Date.UTC(year, 0, 0);
  const current = Date.UTC(year, month - 1, day);
  const dayOfYear = Math.floor((current - start) / 86400000);
  const template = MISSION_CATALOG[((dayOfYear % MISSION_CATALOG.length) + MISSION_CATALOG.length) % MISSION_CATALOG.length];
  return {
    id: `mission-${dateKey}`,
    date: dateKey,
    title: template.title,
    scriptureRef: template.scriptureRef,
    promptText: template.promptText,
    category: template.category,
    completionCount,
  };
}

export function nextMissionStreak(lastDate: string | null, today: string, current: number): number {
  if (lastDate === today) return Math.max(0, current);
  if (lastDate && lastDate === previousDateKey(today)) return Math.max(0, current) + 1;
  return 1;
}

export const PRAY_NOW_WINDOW_MS = 15 * 60 * 1000;

export function intercessionDecision(lastPrayedAt: string | null, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
  if (!lastPrayedAt) return { allowed: true, retryAfterSeconds: 0 };
  const elapsed = now - Date.parse(lastPrayedAt);
  if (Number.isNaN(elapsed) || elapsed >= PRAY_NOW_WINDOW_MS) return { allowed: true, retryAfterSeconds: 0 };
  return { allowed: false, retryAfterSeconds: Math.ceil((PRAY_NOW_WINDOW_MS - elapsed) / 1000) };
}
