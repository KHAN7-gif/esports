# Login only at the esports home page

Requested entry: https://khan7-gif.github.io/esports/

The reference `KHAN7-gif/esportspubg` places its login form in index.html and restores an authenticated tab session after reload. This implementation follows that home-login interaction using the existing esports account/backend; it does not alter PUBG or migrate its Firebase accounts.

## Behavior

- The GitHub Pages home displays the only normal email/password login form. The four cards open BOST, LEL, Tekken and eFLL after server validation.
- The home stores a short-lived opaque session in tab-scoped sessionStorage, never the password or a refresh token. A stored label cannot unlock the app: reload checks the session on the backend. Static UI is not treated as authorization.
- A subweb without its local session redirects through a PKCE request ticket back to the same esports home page. An already signed-in home approves the ticket automatically and returns a one-use code to the registered callback. Each subweb keeps its own HttpOnly cookie and checks admin access on the server.
- Password forms are removed from the BOST/eFLL subweb login pages. Public subweb navigation points to Portal Esports. The Sites password endpoint is disabled in home-only mode. Tekken also uses the same home handoff.
- Logout revokes the shared server session and invalidates linked subweb tokens. No service-access token is sent to GitHub Pages or browser code.

## API

The existing Sites issuer exposes `/portal-api/config`, `/portal-api/login`, `/portal-api/session`, `/portal-api/approve` and `/portal-api/logout`. CORS permits only `https://khan7-gif.github.io`, without credentialed third-party cookies. POST bodies are bounded and login/request creation is rate-limited. All same-origin GitHub repositories share an origin; session storage keys are namespaced but paths are not a browser security boundary.

`/authorize` creates an expiring, single-use ticket. The home approves it with a bearer session. Callback URLs remain an exact server allowlist and PKCE remains mandatory. `/revoke` accepts a server-side, audience-bound subweb token for logout. The new migration adds only `portal_requests`; it preserves existing accounts, tokens and tournament data.

## Deployment gate and required access decision

The owner approved public API access and the public eFLL read view. Deployment uses the tested `home-login-only` implementation; admin editing remains authenticated.

The issuer Site and eFLL currently have owner-private platform access. GitHub Pages cannot call a private issuer API anonymously, and a private eFLL Site can still prompt for ChatGPT sign-in before the app receives the request. To satisfy home-only login, the approved access changes are:

1. Public platform access for the central issuer Site. Home-only mode redirects its home to GitHub and protects Tekken HTML/data with shared authentication. Owner-only account setup remains protected by trusted identity headers and the owner allowlist.
2. Public platform access for eFLL. Its league read view becomes publicly accessible, like BOST and LEL; admin editing remains session-protected. BOST/LEL are already public and need no audience change.

The access decision was supplied by the owner. No Cloudflare credentials are needed. The Elite remains excluded, including its existing hostname redirect compatibility.

After approval, deploy the prepared Sites backend with `LOGIN_HOME_URL=https://khan7-gif.github.io/esports/`. Set each client to `SSO_ENABLED=true`, keep the existing issuer and client ID, and set `SSO_LOGIN_HOME` to the same home URL. Publish current source artifacts and preserve all existing data. Then merge/deploy the Pages home. The API is publicly reachable but each privileged operation still authenticates its bearer/cookie; no secret belongs in auth-config.js.

If no shared account exists yet, the owner must complete the existing one-time `/setup` page. This is owner bootstrap rather than a recurring subweb login. Ordinary sign-in then happens only on the GitHub Pages home.

## Validation

26 SQLite/API tests passed, including CORS rejection, session restoration, expired/replayed tickets, PKCE, wrong audience, logout and prototype compatibility. BOST, eFLL and LEL passed TypeScript and production builds. A real HTTPS multi-origin Chromium test passed wrong-password handling, home login, reload, eFLL/Tekken SSO without another form, Tekken save and cross-subweb logout.

The browser harness serves the real home scripts and bundled Worker against local SQLite on separate hostnames. It does not use a live user's credentials or modify production records. `central-auth/tests/serve-home-login.mjs` and `home-login-browser.py` are QA-only.
