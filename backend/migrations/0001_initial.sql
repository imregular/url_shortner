CREATE TABLE IF NOT EXISTS urls (
  short_code TEXT PRIMARY KEY,
  long_url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  click_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_urls_created_at ON urls(created_at);
