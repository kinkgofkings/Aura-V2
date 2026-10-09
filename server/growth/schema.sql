CREATE TABLE IF NOT EXISTS kingdom_missions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  scriptureRef TEXT NOT NULL,
  promptText TEXT NOT NULL,
  category TEXT NOT NULL,
  completionCount INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS mission_logs (
  id TEXT PRIMARY KEY,
  missionId TEXT NOT NULL,
  userId TEXT NOT NULL,
  completedAt TEXT NOT NULL,
  notes TEXT,
  shareToFeed INTEGER DEFAULT 0,
  UNIQUE(missionId, userId)
);

CREATE TABLE IF NOT EXISTS prayer_intercessions (
  id TEXT PRIMARY KEY,
  prayerId TEXT NOT NULL,
  userId TEXT NOT NULL,
  lastPrayedAt TEXT NOT NULL,
  UNIQUE(prayerId, userId)
);

CREATE TABLE IF NOT EXISTS prayer_intercession_counts (
  prayerId TEXT PRIMARY KEY,
  activeIntercessionCount INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_mission_streaks (
  userId TEXT PRIMARY KEY,
  streak INTEGER NOT NULL DEFAULT 0,
  lastCompletedDate TEXT
);
