# MAIDA Esports portal and shared login

Live portal: https://esports-login.apengtakahashi.chatgpt.site/

Includes BOST, LEL, Tekken and eFLL; The Elite is excluded. BOST/LEL/eFLL keep their own Sites and data, while Tekken runs at `/tekken/` on this portal.

Use `/setup` once as the Site owner to choose the shared email/password. Other modules automatically join the shared login after that account exists. `/account` manages credentials and `/logout` ends all linked sessions. Account setup is restricted to trusted Sites identity headers and the configured owner email; it cannot overwrite an existing account.

Build: `node build.mjs`. Tests: `node build.mjs && node --test tests/*.test.mjs`. The build produces a dependency-free Worker with portal/Tekken assets and D1 migration metadata. Deploy through native Sites tools; no customer Cloudflare token is needed.

Runtime: DB binding, SETUP_OWNER_EMAIL and exact SSO_CLIENTS callbacks. Client Sites use SSO_ENABLED=auto, SSO_ISSUER, SSO_CLIENT_ID and a secret SSO_SERVICE_TOKEN for the private issuer. Keep tokens out of source and browser code. See the monorepo SSO.md for activation behavior, validation and rollback.

The QA HTTPS server in tests is local-only and is not included in the deployment bundle. Source migrations are additive and preserve existing account/session records.
