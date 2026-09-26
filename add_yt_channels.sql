CREATE TABLE IF NOT EXISTS youtube_subscriptions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  sourceId TEXT NOT NULL,
  sourceType TEXT NOT NULL, -- 'channel' or 'playlist'
  defaultCover TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
