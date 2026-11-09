# BOST, LEL, Tekken and eFLL on Sites

Portal: https://esports-login.apengtakahashi.chatgpt.site/
Tekken: https://esports-login.apengtakahashi.chatgpt.site/tekken/
Owner setup: https://esports-login.apengtakahashi.chatgpt.site/setup

The four requested modules share one Sites login. The Elite is excluded; its original source/deployment scripts have been restored and no Elite production deployment is part of this change. No customer Cloudflare API token is required. Sites still manages the underlying hosting/storage infrastructure.

The portal links the existing BOST, LEL and eFLL Sites and hosts Tekken directly. Those three Sites retain their own URLs, audiences and tournament databases; this is one portal/login rather than a rewrite into one origin. Tekken state lives in the portal's separate DB table, created through a new additive Sites migration.

## Account and activation

Open `/setup` as the Site owner, ChatGPT email `apengtakahashi@gmail.com`. Choose the shared account email/password on that page. The one-time insert cannot overwrite an existing account. Passwords are salted PBKDF2 hashes; no plaintext password is stored, committed or collected in chat.

Client configuration uses `SSO_ENABLED=auto`, `SSO_ISSUER=https://esports-login.apengtakahashi.chatgpt.site`, and client IDs `bots`, `lel`, `efll`. `SSO_SERVICE_TOKEN` is the private portal's Sites service-access credential, set through native tools as a runtime secret. It is sent only by servers to the configured issuer. Never print it or commit it.

Automatic activation preserves legacy BOST/LEL authentication only while the authenticated issuer health endpoint explicitly reports that no shared account exists. Once the owner saves the account, clients switch to SSO without another deploy. Issuer errors/malformed responses fail closed rather than permit legacy credentials. The eFLL admin also joins this shared account; it has no separately configured legacy password.

PKCE S256, exact HTTPS callback registration, host-only HttpOnly cookies, single-use authorization codes and audience-bound tokens protect login. Admin requests verify sessions at the issuer. `/account` changes the shared credentials after verifying the current password and invalidates all sessions. `/logout` revokes the central session for all modules. Browser form pages use same-origin referrer policy so same-origin POST Origin checks work without leaking cross-origin referrers.

## Tekken

Secure hosted pages are built from the retained static prototype. The live portal has no demo password. Server APIs validate unique 8/16/32-player rosters, bracket/match IDs, score ranges, media URLs and a 1.5 MB payload limit. GET reads are public within the existing private portal boundary. Every PUT requires the shared admin session and same-origin access. Save and selection updates use optimistic versions and reject stale writes with 409.

Existing browser-only prototype selections are not deleted or silently imported. Hosted drafts use a distinct local namespace; saved rosters, scores, LIVE flags, dates, Character/Map selections and photos persist in the portal database. The separate GitHub Pages prototype stays unchanged.

## Build and checks

`node central-auth/build.mjs` produces a self-contained Worker with inline portal/Tekken assets and migration metadata, without dependency installation or direct Cloudflare deployment. `node --test central-auth/tests/*.test.mjs` covers the built portal, owner setup, login, save/refresh, logout and protocol errors. `central-auth/tests/serve-portal.mjs` plus `portal-browser.py` run a real local HTTPS browser test against SQLite. Never deploy the QA harness.

`node scripts/sync-sso.mjs --check` verifies the portable client copies. Build each Vinext Site before native publication. Source identity and runtime configuration stay separate; preserve Site audiences. Client rollback uses SSO_ENABLED=false plus a native redeploy and retains existing legacy credentials.

The original `0000_auth.sql` migration is preserved. `0001_tekken.sql` adds only the Tekken table. No existing tournament or registration records are reset.
