/**
 * Pure helpers for Lighthouse Baptist Church worship services.
 * Sunday and Wednesday gatherings are uploaded on the channel Live tab
 * (not the regular videos tab), so search and the news feed classify them here.
 */

export type WorshipServiceKind =
  | 'sunday-morning'
  | 'sunday-evening'
  | 'sunday-school'
  | 'wednesday-evening';

export interface WorshipClassification {
  isWorshipService: boolean;
  kind?: WorshipServiceKind;
  series?: string;
  label?: string;
}

export interface LockupVideo {
  youtubeId: string;
  title: string;
  meta: string;
}

export interface SermonSearchFields {
  title?: string;
  speaker?: string;
  series?: string;
  channel?: string;
  summary?: string;
  description?: string;
  scriptureRef?: string;
  topics?: { name?: string; slug?: string }[];
  publishedAt?: string;
  date?: string;
  dateRecorded?: string;
}

const WORSHIP_SERIES = new Set([
  'sunday morning worship',
  'sunday evening worship',
  'wednesday evening worship',
  'sunday school',
]);

const TOKEN_SYNONYMS: Record<string, string[]> = {
  worship: ['worship', 'gathering', 'service', 'sanctuary'],
  service: ['service', 'gathering', 'worship'],
  services: ['service', 'gathering', 'worship'],
  sunday: ['sunday'],
  wednesday: ['wednesday'],
  wed: ['wednesday'],
  gathering: ['gathering', 'service', 'worship'],
  gatherings: ['gathering', 'service', 'worship'],
  live: ['live', 'stream', 'gathering'],
  stream: ['stream', 'gathering', 'live'],
  sermon: ['sermon', 'gathering', 'exposition', 'message'],
  church: ['church', 'lighthouse', 'baptist'],
  lighthouse: ['lighthouse', 'baptist'],
};

export function classifyWorshipService(title: string): WorshipClassification {
  const raw = title || '';
  const t = raw.toLowerCase();
  if (!t.trim() || /live with restream/.test(t)) {
    return { isWorshipService: false };
  }

  if (/sunday school|bible fellowship|winchester bible/.test(t)) {
    return {
      isWorshipService: true,
      kind: 'sunday-school',
      series: 'Sunday School',
      label: 'Sunday School',
    };
  }

  if (/wednesday/.test(t)) {
    return {
      isWorshipService: true,
      kind: 'wednesday-evening',
      series: 'Wednesday Evening Worship',
      label: 'Wednesday Evening Worship',
    };
  }

  if (/sunday/.test(t) && /evening/.test(t)) {
    return {
      isWorshipService: true,
      kind: 'sunday-evening',
      series: 'Sunday Evening Worship',
      label: 'Sunday Evening Worship',
    };
  }

  if (/sunday/.test(t)) {
    return {
      isWorshipService: true,
      kind: 'sunday-morning',
      series: 'Sunday Morning Worship',
      label: 'Sunday Morning Worship',
    };
  }

  return { isWorshipService: false };
}

export function isWorshipGathering(item: SermonSearchFields): boolean {
  const series = (item.series || '').trim().toLowerCase();
  if (WORSHIP_SERIES.has(series)) return true;
  if (classifyWorshipService(item.title || '').isWorshipService) return true;
  const blob = `${item.summary || ''} ${item.description || ''}`.toLowerCase();
  return blob.includes('sunday and wednesday worship');
}

export function speakerFromTitle(title: string): string {
  const given = title.match(/given by\s+([^|]+)/i);
  if (given) return tidySpeaker(given[1]);
  const parts = title.split('|').map((part) => part.trim()).filter(Boolean);
  for (const part of parts) {
    if (/^(pastor|bro\.?|brother|evangelist|mr\.?|assistant pastor|rev\.?)\s+/i.test(part)) {
      return tidySpeaker(part);
    }
  }
  return 'Pastor Luke Shope';
}

function tidySpeaker(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/[|].*$/, '').trim();
}

export function parseServiceDate(title: string, publishedLabel = '', now = new Date()): string {
  const stamped = (title || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*$/);
  if (stamped) {
    let year = parseInt(stamped[3], 10);
    if (year < 100) year += 2000;
    const month = parseInt(stamped[1], 10) - 1;
    const day = parseInt(stamped[2], 10);
    const parsed = new Date(Date.UTC(year, month, day, 16, 0, 0));
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  const relative = parseRelativePublished(publishedLabel, now);
  return relative || now.toISOString();
}

export function parseRelativePublished(label: string, now = new Date()): string | null {
  const text = (label || '').toLowerCase();
  if (!text) return null;
  if (/just now|moments ago|\btoday\b/.test(text)) return now.toISOString();
  const match = text.match(/(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago/);
  if (!match) return null;
  const amount = parseInt(match[1], 10);
  const unitMs: Record<string, number> = {
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  };
  return new Date(now.getTime() - amount * unitMs[match[2]]).toISOString();
}

export function sermonSearchText(item: SermonSearchFields): string {
  const topicText = (item.topics || [])
    .map((topic) => `${topic.name || ''} ${topic.slug || ''}`)
    .join(' ');
  return [item.title, item.speaker, item.series, item.channel, item.summary, item.description, item.scriptureRef, topicText]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function tokenMatches(haystack: string, token: string): boolean {
  if (haystack.includes(token)) return true;
  const alts = TOKEN_SYNONYMS[token];
  return !!alts && alts.some((alt) => haystack.includes(alt));
}

export function sermonMatchesQuery(item: SermonSearchFields, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = sermonSearchText(item);
  if (haystack.includes(q)) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.length > 0 && tokens.every((token) => tokenMatches(haystack, token));
}

export function sermonTimestamp(item: SermonSearchFields): number {
  const raw = item.publishedAt || item.date || item.dateRecorded || '';
  const time = Date.parse(raw);
  return Number.isNaN(time) ? 0 : time;
}

const RECENT_WORSHIP_WINDOW_MS = 21 * 24 * 60 * 60 * 1000;

/** Recent Sunday and Wednesday services lead the library so they are not buried. */
export function compareSermonLibrary<T extends SermonSearchFields>(a: T, b: T, now = Date.now()): number {
  const score = (item: T) => {
    const time = sermonTimestamp(item);
    if (isWorshipGathering(item) && time > 0 && now - time < RECENT_WORSHIP_WINDOW_MS) {
      return time + 1e15;
    }
    return time;
  };
  return score(b) - score(a);
}

export function extractLockupVideos(payload: unknown): LockupVideo[] {
  const found: LockupVideo[] = [];
  const seen = new Set<string>();

  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const record = node as Record<string, unknown>;
    const vm = record.lockupViewModel as { contentId?: string; metadata?: unknown } | undefined;
    if (vm && typeof vm.contentId === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(vm.contentId) && !seen.has(vm.contentId)) {
      const texts: string[] = [];
      collectContentStrings(vm.metadata, texts, 0);
      seen.add(vm.contentId);
      found.push({
        youtubeId: vm.contentId,
        title: texts[0] || 'Lighthouse Baptist Church Gathering',
        meta: texts.slice(1).join(' | '),
      });
    }
    Object.values(record).forEach(visit);
  };

  visit(payload);
  return found;
}

function collectContentStrings(node: unknown, texts: string[], depth: number) {
  if (!node || depth > 8) return;
  if (Array.isArray(node)) {
    node.forEach((child) => collectContentStrings(child, texts, depth + 1));
    return;
  }
  if (typeof node !== 'object') return;
  const record = node as Record<string, unknown>;
  if (typeof record.content === 'string' && record.content.trim().length > 1) {
    texts.push(record.content.trim());
  }
  Object.values(record).forEach((child) => collectContentStrings(child, texts, depth + 1));
}
