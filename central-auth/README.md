# MAIDA Esports central admin login

Owner setup: https://esports-login.apengtakahashi.chatgpt.site/setup
Account management: https://esports-login.apengtakahashi.chatgpt.site/account

One email/password account serves eFLL, BOTM, LEL and The Elite. Tekken remains a local prototype and is deferred. No subweb has been switched to SSO yet; existing authentication remains active until the owner completes setup and deployment checks pass.

## Account setup

Open `/setup` while signed into the ChatGPT account matching runtime `SETUP_OWNER_EMAIL`. Both Sites identity headers and the allowlisted email are required. The page creates the first account atomically and cannot overwrite it. Enter the shared email/password on this page, never in chat or source. Only a salted PBKDF2-SHA256 hash is stored in the dedicated D1 database.

After login, `/account` allows changing the shared email/password with the current password. Changes invalidate every subweb session. `/logout` confirms logout and revokes the central session; linked local tokens immediately become invalid.

## Protocol

S256 PKCE authorization codes, exact registered HTTPS callbacks, short-lived one-use codes and client-bound opaque tokens. Tokens/sessions are stored hashed. Cookies are host-only, HttpOnly, Secure and SameSite=Lax. Subweb servers verify each admin request through `/userinfo`. Issuer failures deny access; no browser localStorage tokens.

- GET `/authorize`: client_id, redirect_uri, state, code_challenge, code_challenge_method=S256.
- POST `/token`: form-encoded client_id, redirect_uri, code, code_verifier.
- GET `/userinfo?client_id=...`: server bearer token; returns superadmin identity.
- Sessions last eight hours, codes sixty seconds, local handshakes five minutes.
- Login/account changes use atomic attempt limits, Origin/CSRF checks and expiry cleanup.

## Configuration and rollout

Central Site: D1 `DB`, `SETUP_OWNER_EMAIL`, `SSO_CLIENTS` JSON with exact callback URLs. Sites applies `drizzle/` migrations. Optional runtime `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_PASSWORD_SALT` override the stored account for controlled recovery; normal setup does not need them.

Client settings: `SSO_ISSUER=https://esports-login.apengtakahashi.chatgpt.site`, `SSO_CLIENT_ID` (`efll`, `bots`, `lel`, `elite`), `SSO_ENABLED=true`, plus the private issuer Sites service credential stored as secret `SSO_SERVICE_TOKEN`. Obtain it through native Sites access, without printing/committing it. The client attaches it only to server requests to that issuer. Preserve the issuer's private access.

Activation: complete owner setup and verify login; deploy configured clients starting with eFLL, then BOTM, LEL, The Elite. Test read/write, refresh, unauthenticated denial and global logout. Do not reset tournament databases. SSO absent/false retains legacy auth; true ignores old credentials and fails closed. Rollback: disable SSO and redeploy, keeping legacy secrets available.

Client endpoints: `/api/sso/start`, `/api/sso/callback`, POST `/api/sso/logout`. Register custom domains explicitly before use.

The Elite uses build variables `SSO_ENABLED`, `SSO_ISSUER`, client ID `elite` and runtime secret `SSO_SERVICE_TOKEN`. Keep Turnstile configuration for rollback. The separate unused `cloudflare/bots` legacy API is not migrated blindly.

## Validation

Run `node --test central-auth/tests/*.test.mjs`, `node scripts/sync-sso.mjs --check`, and `node central-auth/build.mjs`. Tests use real SQLite and cover PKCE, replay/races, audience, CSRF, expiry, shared login, logout, rotation and owner setup. Build all Vinext clients and dry-run The Elite before activation. Hosted login remains unverified until the owner creates the real account.
