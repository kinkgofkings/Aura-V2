import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import {
  KingdomMission,
  intercessionDecision,
  missionForDate,
  nextMissionStreak,
  utcDateKey,
} from './kingdomMissions';

export interface MissionLog {
  id: string;
  missionId: string;
  userId: string;
  completedAt: string;
  notes?: string;
  shareToFeed: boolean;
}

let db: Database.Database | null = null;

function store(): Database.Database {
  if (db) return db;
  const file = path.join(process.cwd(), 'data', 'growth.db');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const connection = new Database(file);
  const schemaPath = path.join(process.cwd(), 'server', 'growth', 'schema.sql');
  connection.exec(fs.readFileSync(schemaPath, 'utf8'));
  db = connection;
  return connection;
}

export function getTodayMission(dateKey = utcDateKey()): KingdomMission {
  const mission = missionForDate(dateKey, 0);
  const row = store()
    .prepare('SELECT completionCount FROM kingdom_missions WHERE id = ?')
    .get(mission.id) as { completionCount: number } | undefined;
  if (!row) {
    store()
      .prepare(
        `INSERT INTO kingdom_missions (id, date, title, scriptureRef, promptText, category, completionCount)
         VALUES (?, ?, ?, ?, ?, ?, 0)`
      )
      .run(mission.id, mission.date, mission.title, mission.scriptureRef, mission.promptText, mission.category);
    return mission;
  }
  return { ...mission, completionCount: row.completionCount };
}

export function getUserMissionState(userId: string, dateKey = utcDateKey()) {
  const mission = getTodayMission(dateKey);
  const log = userId
    ? (store()
        .prepare('SELECT * FROM mission_logs WHERE missionId = ? AND userId = ?')
        .get(mission.id, userId) as any)
    : null;
  const streak = userId
    ? (store().prepare('SELECT streak, lastCompletedDate FROM user_mission_streaks WHERE userId = ?').get(userId) as
        | { streak: number; lastCompletedDate: string | null }
        | undefined)
    : undefined;
  return {
    mission,
    completed: Boolean(log),
    log: log
      ? {
          id: log.id,
          missionId: log.missionId,
          userId: log.userId,
          completedAt: log.completedAt,
          notes: log.notes || undefined,
          shareToFeed: Boolean(log.shareToFeed),
        }
      : null,
    streak: streak?.streak || 0,
    lastCompletedDate: streak?.lastCompletedDate || null,
  };
}

export function completeMission(input: {
  userId: string;
  notes?: string;
  shareToFeed?: boolean;
  dateKey?: string;
}): { mission: KingdomMission; log: MissionLog; streak: number; alreadyCompleted: boolean } {
  const dateKey = input.dateKey || utcDateKey();
  const mission = getTodayMission(dateKey);
  const existing = store()
    .prepare('SELECT * FROM mission_logs WHERE missionId = ? AND userId = ?')
    .get(mission.id, input.userId) as any;
  const streakRow = store()
    .prepare('SELECT streak, lastCompletedDate FROM user_mission_streaks WHERE userId = ?')
    .get(input.userId) as { streak: number; lastCompletedDate: string | null } | undefined;

  if (existing) {
    return {
      mission,
      log: {
        id: existing.id,
        missionId: existing.missionId,
        userId: existing.userId,
        completedAt: existing.completedAt,
        notes: existing.notes || undefined,
        shareToFeed: Boolean(existing.shareToFeed),
      },
      streak: streakRow?.streak || 1,
      alreadyCompleted: true,
    };
  }

  const completedAt = new Date().toISOString();
  const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const streak = nextMissionStreak(streakRow?.lastCompletedDate || null, dateKey, streakRow?.streak || 0);
  const write = store().transaction(() => {
    store()
      .prepare(
        `INSERT INTO mission_logs (id, missionId, userId, completedAt, notes, shareToFeed)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(logId, mission.id, input.userId, completedAt, input.notes || null, input.shareToFeed ? 1 : 0);
    store().prepare('UPDATE kingdom_missions SET completionCount = completionCount + 1 WHERE id = ?').run(mission.id);
    store()
      .prepare(
        `INSERT INTO user_mission_streaks (userId, streak, lastCompletedDate)
         VALUES (?, ?, ?)
         ON CONFLICT(userId) DO UPDATE SET streak = excluded.streak, lastCompletedDate = excluded.lastCompletedDate`
      )
      .run(input.userId, streak, dateKey);
  });
  write();
  const updated = getTodayMission(dateKey);
  return {
    mission: updated,
    log: {
      id: logId,
      missionId: mission.id,
      userId: input.userId,
      completedAt,
      notes: input.notes,
      shareToFeed: Boolean(input.shareToFeed),
    },
    streak,
    alreadyCompleted: false,
  };
}

export function prayNow(prayerId: string, userId: string, now = Date.now()) {
  const row = store()
    .prepare('SELECT lastPrayedAt FROM prayer_intercessions WHERE prayerId = ? AND userId = ?')
    .get(prayerId, userId) as { lastPrayedAt: string } | undefined;
  const decision = intercessionDecision(row?.lastPrayedAt || null, now);
  const countRow = store()
    .prepare('SELECT activeIntercessionCount FROM prayer_intercession_counts WHERE prayerId = ?')
    .get(prayerId) as { activeIntercessionCount: number } | undefined;
  const currentCount = countRow?.activeIntercessionCount || 0;
  if (!decision.allowed) {
    return { allowed: false, retryAfterSeconds: decision.retryAfterSeconds, activeIntercessionCount: currentCount };
  }
  const stamp = new Date(now).toISOString();
  const write = store().transaction(() => {
    store()
      .prepare(
        `INSERT INTO prayer_intercessions (id, prayerId, userId, lastPrayedAt)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(prayerId, userId) DO UPDATE SET lastPrayedAt = excluded.lastPrayedAt`
      )
      .run(`pray_${prayerId}_${userId}`, prayerId, userId, stamp);
    store()
      .prepare(
        `INSERT INTO prayer_intercession_counts (prayerId, activeIntercessionCount)
         VALUES (?, 1)
         ON CONFLICT(prayerId) DO UPDATE SET activeIntercessionCount = activeIntercessionCount + 1`
      )
      .run(prayerId);
  });
  write();
  return { allowed: true, retryAfterSeconds: 0, activeIntercessionCount: currentCount + 1 };
}
