-- THE ELITE 2026 · public registration, private admin review
CREATE TABLE IF NOT EXISTS elite_registrations (
 id TEXT PRIMARY KEY,
 receipt_hash TEXT NOT NULL,
 full_name TEXT NOT NULL,
 ign TEXT NOT NULL COLLATE NOCASE,
 state TEXT NOT NULL,
 phone TEXT NOT NULL,
 club TEXT NOT NULL DEFAULT '',
 consent INTEGER NOT NULL DEFAULT 0,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 driver_id INTEGER,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 reviewed_at TEXT,
 CHECK(length(full_name) BETWEEN 2 AND 100),
 CHECK(length(ign) BETWEEN 2 AND 60),
 CHECK(length(phone) BETWEEN 9 AND 20)
);
CREATE INDEX IF NOT EXISTS idx_elite_registration_status ON elite_registrations(status,created_at);
CREATE INDEX IF NOT EXISTS idx_elite_registration_ign ON elite_registrations(ign);
CREATE TABLE IF NOT EXISTS elite_registration_limits (
 ip_hash TEXT PRIMARY KEY,
 submissions INTEGER NOT NULL DEFAULT 0,
 expires_at INTEGER NOT NULL
);
