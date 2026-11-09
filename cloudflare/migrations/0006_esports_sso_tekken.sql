CREATE TABLE sso_account (id TEXT PRIMARY KEY CHECK(id='main'), email TEXT NOT NULL, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL);

CREATE TABLE sso_sessions (id TEXT PRIMARY KEY, email TEXT NOT NULL, credential_version TEXT NOT NULL, expires_at INTEGER NOT NULL);

CREATE TABLE sso_codes (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, client_id TEXT NOT NULL, redirect_uri TEXT NOT NULL, challenge TEXT NOT NULL, expires_at INTEGER NOT NULL);

CREATE TABLE sso_tokens (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, client_id TEXT NOT NULL, expires_at INTEGER NOT NULL);

CREATE TABLE sso_attempts (id TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL);

CREATE INDEX sso_codes_expiry ON sso_codes(expires_at);

CREATE INDEX sso_tokens_session ON sso_tokens(session_id);

CREATE TABLE tekken_tournaments (id TEXT PRIMARY KEY CHECK(id='main'), data TEXT NOT NULL, version INTEGER NOT NULL);
