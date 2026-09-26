import { api } from './api';

export interface RecoveryReport {
  scannedKeys: number;
  foundCandidates: number;
  addedToServer: number;
  totalServerPosts: number;
  details: string[];
}

export async function recoverDeviceCachedPosts(): Promise<RecoveryReport> {
  const report: RecoveryReport = {
    scannedKeys: 0,
    foundCandidates: 0,
    addedToServer: 0,
    totalServerPosts: 0,
    details: [],
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    report.details.push('LocalStorage not available in current environment.');
    return report;
  }

  const candidatePosts: any[] = [];
  const seenContents = new Set<string>();

  // 1. Direct check of aura_cached_posts
  try {
    const rawCached = localStorage.getItem('aura_cached_posts');
    if (rawCached) {
      const parsed = JSON.parse(rawCached);
      if (Array.isArray(parsed)) {
        for (const p of parsed) {
          if (p && (p.content || (p.mediaUrls && p.mediaUrls.length > 0))) {
            const trimmed = (p.content || '').trim();
            if (!seenContents.has(trimmed)) {
              seenContents.add(trimmed);
              candidatePosts.push(p);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[CacheRecovery] Error parsing aura_cached_posts:', err);
  }

  // 2. Direct check of offline sync queue
  try {
    const rawQueue = localStorage.getItem('aura_sync_queue');
    if (rawQueue) {
      const queue = JSON.parse(rawQueue);
      if (Array.isArray(queue)) {
        for (const item of queue) {
          if (item?.payload && (item.payload.content || item.payload.mediaUrls)) {
            const trimmed = (item.payload.content || '').trim();
            if (!seenContents.has(trimmed)) {
              seenContents.add(trimmed);
              candidatePosts.push(item.payload);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[CacheRecovery] Error parsing aura_sync_queue:', err);
  }

  // 3. Check Prayer Wall entries (in case church notes were posted to prayer wall)
  try {
    const rawPrayers = localStorage.getItem('aura_church_prayer_wall');
    if (rawPrayers) {
      const prayers = JSON.parse(rawPrayers);
      if (Array.isArray(prayers)) {
        for (const pr of prayers) {
          if (pr?.content && !pr.id?.startsWith('p-1')) {
            const content = `[Prayer / Church Reflection] ${pr.content}`;
            if (!seenContents.has(content)) {
              seenContents.add(content);
              candidatePosts.push({
                id: `post_prayer_${pr.id || Date.now()}`,
                authorName: pr.authorName || 'Church Note',
                authorHandle: pr.authorHandle || 'prayer',
                content: content,
                tags: ['Prayer', 'Church', pr.category || 'Spiritual'],
                createdAt: pr.createdAt || new Date().toISOString(),
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[CacheRecovery] Error parsing prayer wall:', err);
  }

  // 4. Scan ALL other localStorage keys for any saved notes / posts
  report.scannedKeys = localStorage.length;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Look for suspicious or custom keys
    if (
      key.includes('post') ||
      key.includes('draft') ||
      key.includes('note') ||
      key.includes('verse') ||
      key.includes('study') ||
      key.includes('bible') ||
      key.includes('journal') ||
      key.includes('recovery')
    ) {
      try {
        const val = localStorage.getItem(key);
        if (!val || val.length < 5) continue;
        if (val.startsWith('{') || val.startsWith('[')) {
          const parsed = JSON.parse(val);
          const items = Array.isArray(parsed) ? parsed : [parsed];
          for (const it of items) {
            if (it && typeof it === 'object') {
              const textContent = it.content || it.text || it.notes || it.reflection || it.message;
              if (typeof textContent === 'string' && textContent.trim().length > 5) {
                const trimmed = textContent.trim();
                if (!seenContents.has(trimmed)) {
                  seenContents.add(trimmed);
                  candidatePosts.push({
                    id: it.id || `post_recovered_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                    authorName: it.authorName || 'Tex',
                    authorHandle: it.authorHandle || 'texxx360',
                    content: trimmed,
                    tags: ['ChurchNote', 'Recovered'],
                    createdAt: it.createdAt || it.date || new Date().toISOString(),
                  });
                }
              }
            }
          }
        }
      } catch {
        // Ignore unparseable entries
      }
    }
  }

  report.foundCandidates = candidatePosts.length;

  if (candidatePosts.length === 0) {
    report.details.push('No offline posts or reflections found in this device browser storage.');
    return report;
  }

  // Send candidate posts to server
  try {
    const response = await fetch('/api/sync/restore-client-cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posts: candidatePosts }),
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    report.addedToServer = data.added || 0;
    report.totalServerPosts = data.total || 0;
    report.details.push(`Recovered ${data.added} new post(s) into server database (Total active posts: ${data.total}).`);
  } catch (err: any) {
    report.details.push(`Sync failed: ${err.message}`);
  }

  return report;
}
