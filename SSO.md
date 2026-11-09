# Shared esports login

Login home: https://khan7-gif.github.io/esports/

BOST, LEL, Tekken and eFLL share the existing esports account. The only normal password form is on the GitHub Pages home. The Elite and the PUBG repository are separate and unchanged. The owner approved public access to the login API and eFLL league read view; admin editing remains authenticated.

The home validates its tab-scoped opaque session against the backend after reload. Subwebs use short-lived request tickets and one-use PKCE codes to obtain their own HttpOnly cookies without another form. Logout revokes the shared server session and invalidates linked tokens. Passwords are not stored in browser storage, source or URLs.

The Sites backend uses LOGIN_HOME_URL=https://khan7-gif.github.io/esports/. Clients use SSO_ENABLED=true, their existing issuer/client ID, and SSO_LOGIN_HOME with the same home URL. Root browser code contains only public endpoint configuration; private service-access credentials stay server-side. CORS allows the configured GitHub Pages origin without third-party cookies.

Tekken is served by the Sites backend and requires the shared session. Its scores, rosters and selections persist through validated, version-checked APIs. BOST, LEL and eFLL retain their existing databases. The migration adds only portal_requests and preserves existing records.

PR #2 was merged and its GitHub Pages build/deploy completed successfully: https://github.com/KHAN7-gif/esports/actions/runs/42627979215 . Native Sites deployments also succeeded. Validation includes 26 SQLite/API tests, TypeScript/production builds for all three Vinext clients and HTTPS multi-origin browser tests. Direct live HTTP probes from the managed environment were blocked by its network proxy, so a real-user password login was not exercised there.

See HOME_LOGIN.md for protocol details and rollback/configuration guidance. Existing accounts are preserved; one-time owner bootstrap is needed only if an account does not already exist.
