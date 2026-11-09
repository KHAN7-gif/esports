# Shared admin login through The Elite

The Elite is the login issuer. Keep its existing ADMIN_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_PASSWORD_SALT, ADMIN_SESSION_SECRET and Turnstile secrets. No new admin account or standalone login setup is required.

## Routes and modules

- Main dashboard: `https://the-elite.esukan.app/esports`.
- Tekken with server persistence: `https://the-elite.esukan.app/tekken/`.
- Existing eFLL, BOTM and LEL origins remain in use, linked from that dashboard. Their admin pages use The Elite via S256 PKCE when SSO is activated. This does not merge all apps into one origin.
- Provider: `https://the-elite.esukan.app/sso`; exact callback registrations are in `sso/clients.json`.

The Elite validates credentials and Turnstile using its current login form. Its verified session can grant short-lived, one-use codes for the other apps. No alternative password endpoint or bootstrap is exposed on the Elite provider. The apps verify audience-bound opaque sessions server-side. Logging out at The Elite or confirming global logout revokes the shared session. Credential/session-secret rotation invalidates shared sessions.

## Tekken

The build removes the demo password from the active hosted bracket and match-detail pages. The original GitHub Pages prototype stays unchanged while production deployment is blocked. Legacy hosted match URLs redirect to the current secured detail page. Admin access comes from the real Elite session. Public tournament reads stay available; every write requires authenticated same-origin access. Save/Reload controls persist rosters, brackets, round formats/dates, scores, LIVE flags, photos and Character/Map selections. Version checks return 409 rather than overwrite another device's changes. Images accept HTTPS or bounded JPEG/PNG/WebP data URLs, with a 1.5 MB tournament limit. The server validates identifiers, scores and roster sizes, and computes match detail from the stored bracket.

Existing browser-only draft selections are not deleted; server-backed drafts use a new storage namespace. Nothing is automatically imported from a visitor's browser or seeded into the database. Tekken starts with the existing placeholder bracket until an admin explicitly saves.

## Rollout status

Code, 25 SQLite/API tests, three Vinext client builds and a Worker dry-run passed. Mobile browser QA with mocked API responses passed roster editing, save/reload, Character selection and public read-only controls without JavaScript errors.

The live Elite deployment attempt stopped at migration `0006_esports_sso_tekken.sql` with Cloudflare error 7500 (permission denied). The existing live worker/login was not replaced by that attempt. Client code is staged with SSO disabled; do not enable clients before the issuer deployment succeeds.

The managed environment's CLOUDFLARE_ACCOUNT_ID was a database UUID. API discovery confirmed the actual account as `1cf4264cff741f90be639418170e1248` and the existing Elite D1 database as `ed96447c-0b38-4f30-b7fd-024b032b76e3`. Use that existing database. The configured API token needs Account D1 Edit and Workers Scripts Edit for this account. Preserve existing production secret bindings and Turnstile site key. Never paste tokens/passwords into chat or Git.

After token permissions are repaired:

1. Run the existing Elite deployment script with the correct account/database IDs and current Turnstile site key. The script applies only pending migrations; it does not reset existing driver/registration data. Confirm `/api/admin/config`, `/esports`, `/tekken/` and the empty/new Tekken API response.
2. On eFLL, BOTM and LEL, set `SSO_ISSUER=https://the-elite.esukan.app/sso`, `SSO_CLIENT_ID=efll|bots|lel`, and `SSO_ENABLED=true`, then deploy the saved SSO-enabled source version. No private Sites service token is needed for the public Elite issuer. Preserve each Site's audience and database.
3. Test real admin login with Turnstile, cross-app login, save/refresh and global logout. Do not collect the password in chat. The live credential flow remains unverified until these checks run.

Rollback: disable client SSO and redeploy; keep old admin secrets available. Disable SSO_PROVIDER_ENABLED on Elite if needed. The schema-only migration adds tables and does not change existing competition tables.

The earlier private `esports-login` Site is a superseded prototype. Its `/setup` page is not part of this rollout; do not create a new shared account there.
