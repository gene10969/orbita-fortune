CREATE TABLE IF NOT EXISTS bookings (
  booking_id TEXT PRIMARY KEY,
  advisor_id TEXT NOT NULL,
  start_at TEXT NOT NULL,
  ready_at TEXT NOT NULL,
  client_token_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'reserved',
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_advisor_start
ON bookings(advisor_id, start_at);

CREATE INDEX IF NOT EXISTS idx_bookings_time
ON bookings(start_at, ready_at);
