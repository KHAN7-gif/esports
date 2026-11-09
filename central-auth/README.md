# Esports home-login backend

The only normal password form is https://khan7-gif.github.io/esports/. This Sites service supplies the login API, one-use PKCE request handoffs and the Tekken module. It redirects its home to GitHub Pages when LOGIN_HOME_URL is configured. BOST, LEL, Tekken and eFLL use the existing shared account. The Elite and PUBG are separate.

Runtime: DB binding, LOGIN_HOME_URL, SSO_CLIENTS and SETUP_OWNER_EMAIL. Public API access was explicitly approved; privileged actions remain authenticated. CORS allows the configured home origin only, without credentialed third-party cookies. Never put a service-access token in GitHub Pages code.

Build with `node build.mjs`; test with `node build.mjs && node --test tests/*.test.mjs`. The dependency-free Worker includes static Tekken assets and additive D1 migrations. QA HTTPS servers under tests are not deployed.

Existing account data is preserved. One-time owner bootstrap at /setup requires trusted Sites identity headers and the owner allowlist. Ordinary login uses only the GitHub Pages home. No Cloudflare account token is needed for native Sites publication.
