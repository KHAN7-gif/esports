CREATE TABLE portal_requests (id TEXT PRIMARY KEY, client_id TEXT NOT NULL, redirect_uri TEXT NOT NULL, state TEXT NOT NULL, challenge TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX portal_requests_expiry ON portal_requests(expires_at);
