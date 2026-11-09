# Shared esports session protocol

The active design now uses **The Elite's existing login and Turnstile** as issuer, as requested by the owner. See [SSO rollout documentation](../SSO.md).

`worker/index.js` supplies PKCE grants, hashed sessions, audience-bound tokens and logout. `cloudflare/elite-sso.mjs` exposes only authorize/token/userinfo/logout through `/sso`, using the verified Elite session. It does not expose the prototype password form, account bootstrap or account settings.

The earlier standalone ChatGPT Site is a superseded prototype. No new account setup is required there. Existing Elite credentials remain authoritative.

Tests: `node --test central-auth/tests/*.test.mjs cloudflare/tests/elite-sso.test.mjs`. Use `node scripts/sync-sso.mjs --check` to verify client copies. See SSO.md for the deployment permission blocker, exact configuration, persistence behavior and validation limits.
