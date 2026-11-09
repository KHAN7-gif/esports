# Esports directory and separate subweb logins

https://khan7-gif.github.io/esports/ is a public directory of BOST, LEL, TEKKEN and eFLL links. There is no login gate or admin session at the directory. The Elite and PUBG are unchanged.

Every subweb has its own Log masuk entry and local login page. All four validate the same existing central account. The browser sends the password directly over HTTPS to the central service's `/subweb-api/login`; CORS allows only registered subweb origins. The password is never copied into subweb settings, source or browser storage.

The central service issues an ES256 signed session bound to the requesting subweb and a short-lived form nonce. A same-origin POST verifies the signature and nonce, then stores an HttpOnly, Secure, SameSite=Lax cookie. Admin requests verify the signature locally, without a server-to-server HTTP call. This avoids the EXCHANGE_NETWORK failure observed with the previous callback exchange. Sessions last up to 8 hours. Logout clears the current subweb's session; other subweb sessions are independent. Credential changes apply to new logins; existing signed sessions expire within 8 hours. Rotating the signing key requires redeploying the central service and all three subweb verifiers.

Runtime configuration:

- Central service: `SUBWEB_LOGIN_ENABLED=true`, `SUBWEB_SESSION_PRIVATE_KEY` (secret PKCS8 base64url), `SUBWEB_SESSION_PUBLIC_KEY` (SPKI base64url), existing `SSO_CLIENTS` and `DB`. Remove `LOGIN_HOME_URL`.
- BOST/LEL/eFLL: `SSO_ENABLED=true`, `SSO_LOGIN_MODE=local`, `SSO_ISSUER` pointing at the central service, registered `SSO_CLIENT_ID`, and `SUBWEB_SESSION_PUBLIC_KEY`. Remove old `SSO_LOGIN_HOME` and `SSO_SERVICE_TOKEN`.
- The private signing key belongs only to the central runtime. Never put it in source, archives, GitHub Pages, client bundles or the three subweb runtimes.

Run `node scripts/sync-sso.mjs --check`, `node central-auth/build.mjs`, and `node --test central-auth/tests/*.test.mjs`. `serve-subweb-login.mjs` plus `subweb-login-browser.py` exercise separate HTTPS origins using a synthetic account and an in-memory SQLite database. Production credentials are preserved.
