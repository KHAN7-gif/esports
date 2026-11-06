-- BOTS eFootball · Cloudflare D1 (initial schema)
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS admins (
 id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
 password_salt TEXT NOT NULL, password_iterations INTEGER NOT NULL DEFAULT 210000,
 role TEXT NOT NULL DEFAULT 'admin', active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS seasons (
 id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, active INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS teams (
 id TEXT PRIMARY KEY, season_id TEXT NOT NULL REFERENCES seasons(id) ON DELETE RESTRICT,
 name TEXT NOT NULL, state TEXT, flag_url TEXT, logo_url TEXT, manager TEXT, assistant TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(season_id,name)
);
CREATE TABLE IF NOT EXISTS players (
 id TEXT PRIMARY KEY, team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
 ign TEXT NOT NULL, display_name TEXT, photo_url TEXT, jersey_number INTEGER,
 active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS matches (
 id TEXT PRIMARY KEY, season_id TEXT NOT NULL REFERENCES seasons(id) ON DELETE RESTRICT,
 home_team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
 away_team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
 matchday INTEGER NOT NULL DEFAULT 1, scheduled_at TEXT, status TEXT NOT NULL DEFAULT 'PREVIEW'
 CHECK(status IN ('PREVIEW','LIVE','FULL TIME','POSTPONED')),
 home_score INTEGER, away_score INTEGER, motm_player_id TEXT REFERENCES players(id),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(home_team_id <> away_team_id),
 CHECK(home_score IS NULL OR home_score >= 0),
 CHECK(away_score IS NULL OR away_score >= 0)
);
CREATE TABLE IF NOT EXISTS match_player_stats (
 match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
 player_id TEXT NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
 goals INTEGER NOT NULL DEFAULT 0 CHECK(goals>=0),
 motm INTEGER NOT NULL DEFAULT 0 CHECK(motm IN (0,1)),
 PRIMARY KEY(match_id,player_id)
);
CREATE TABLE IF NOT EXISTS audit_log (
 id TEXT PRIMARY KEY, actor_id TEXT, action TEXT NOT NULL, resource TEXT NOT NULL,
 resource_id TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_teams_season ON teams(season_id);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_season_day ON matches(season_id,matchday);
CREATE INDEX IF NOT EXISTS idx_match_stats_player ON match_player_stats(player_id);
