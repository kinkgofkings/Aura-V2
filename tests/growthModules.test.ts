import assert from 'node:assert/strict';
import { intercessionDecision, missionForDate, nextMissionStreak, PRAY_NOW_WINDOW_MS } from '../services/kingdomMissions';
import { getChronosContext } from '../services/chronosContext';
import { classifyWorshipService, isWorshipGathering, sermonMatchesQuery } from '../services/lighthouseCatalog';
import { composeEngagingFeed } from '../src/components/feed/composeFeed';

const today = missionForDate('2026-10-09');
const sameDay = missionForDate('2026-10-09');
assert.equal(today.id, 'mission-2026-10-09');
assert.equal(today.id, sameDay.id);
assert.equal(today.scriptureRef.length > 0, true);
assert.notEqual(missionForDate('2026-10-10').title, '');

assert.equal(nextMissionStreak(null, '2026-10-09', 0), 1);
assert.equal(nextMissionStreak('2026-10-09', '2026-10-09', 4), 4);
assert.equal(nextMissionStreak('2026-10-08', '2026-10-09', 4), 5);
assert.equal(nextMissionStreak('2026-10-01', '2026-10-09', 4), 1);

const fresh = intercessionDecision(null, 1_000_000);
assert.equal(fresh.allowed, true);
const recent = intercessionDecision(new Date(1_000_000).toISOString(), 1_000_000 + 60_000);
assert.equal(recent.allowed, false);
assert.equal(recent.retryAfterSeconds > 0, true);
const later = intercessionDecision(new Date(1_000_000).toISOString(), 1_000_000 + PRAY_NOW_WINDOW_MS);
assert.equal(later.allowed, true);

const wednesday = classifyWorshipService('Wednesday Evening Gathering | Pastor Luke Shope | Lighthouse Baptist Church | 10/7/26');
assert.equal(wednesday.isWorshipService, true);
assert.equal(wednesday.series, 'Wednesday Evening Worship');
const sunday = classifyWorshipService('Sunday Morning Gathering | Pastor Luke Shope | Lighthouse Baptist Church | 10/4/26');
assert.equal(sunday.kind, 'sunday-morning');
assert.equal(classifyWorshipService('Live with Restream').isWorshipService, false);
assert.equal(isWorshipGathering({ title: 'Wednesday Evening Gathering | 10/7/26', series: 'Wednesday Evening Worship' }), true);
assert.equal(sermonMatchesQuery({ title: 'Sunday Morning Gathering | Lighthouse Baptist Church', series: 'Sunday Morning Worship' }, 'sunday worship'), true);
assert.equal(sermonMatchesQuery({ title: 'Wednesday Evening Gathering', series: 'Wednesday Evening Worship' }, 'wednesday service'), true);

const genesis = getChronosContext('Genesis', 12);
assert.equal(genesis.locations.length > 0, true);
assert.equal(genesis.timeline.length > 0, true);
assert.match(genesis.epoch, /Patriarchs/);

const feed = composeEngagingFeed(2);
assert.equal(feed[0].kind, 'sermon');
assert.equal(feed[1].kind, 'post');
assert.equal(feed[2].kind, 'lesson');
assert.equal(feed[3].kind, 'member');
assert.equal(feed[4].kind, 'word');
assert.equal(feed.filter((entry) => entry.kind === 'post').length >= 2, true);

console.log('growth module checks passed');
