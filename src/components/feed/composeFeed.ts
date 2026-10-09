export type FeedEntry =
  | { kind: 'sermon'; slot: number }
  | { kind: 'post'; postIndex: number }
  | { kind: 'prayer'; slot: number }
  | { kind: 'lesson'; slot: number }
  | { kind: 'member'; slot: number }
  | { kind: 'word'; slot: number };

/**
 * Alternate the news feed so scrolling stays varied:
 * latest sermon, a user post or prayer, a lesson from a favorite course,
 * a new member announcement, the word of the day, then posts and prayers again.
 */
export function composeEngagingFeed(postCount: number): FeedEntry[] {
  const entries: FeedEntry[] = [];
  let postIndex = 0;
  let sermonSlot = 0;
  let prayerSlot = 0;
  let lessonSlot = 0;
  let memberSlot = 0;
  let wordSlot = 0;
  let cycles = 0;
  const safePostCount = Math.max(0, postCount);

  while (cycles < 3 || postIndex < safePostCount) {
    cycles += 1;
    if (cycles > 40) break;

    entries.push({ kind: 'sermon', slot: sermonSlot });
    sermonSlot += 1;

    if (postIndex < safePostCount) {
      entries.push({ kind: 'post', postIndex });
      postIndex += 1;
    } else {
      entries.push({ kind: 'prayer', slot: prayerSlot });
      prayerSlot += 1;
    }

    entries.push({ kind: 'lesson', slot: lessonSlot });
    lessonSlot += 1;
    entries.push({ kind: 'member', slot: memberSlot });
    memberSlot += 1;
    entries.push({ kind: 'word', slot: wordSlot });
    wordSlot += 1;

    if (postIndex < safePostCount && cycles % 2 === 0) {
      entries.push({ kind: 'post', postIndex });
      postIndex += 1;
    } else {
      entries.push({ kind: 'prayer', slot: prayerSlot });
      prayerSlot += 1;
    }
  }

  return entries;
}
