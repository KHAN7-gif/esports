# BOTS Cloudflare backend (initial foundation)

This directory is a **new, separate backend** for BOTS. It does not migrate, reset, or alter data in the existing BOTS portal.

## Requirements
- Cloudflare account, Workers and D1
- Node.js and Wrangler (run via `npx wrangler`)
- GitHub repository `KHAN7-gif/esports`

## Deploy
1. In Cloudflare Dashboard → Workers & Pages → D1, create `bots-database`. Copy its database ID.
2. Replace `REPLACE_WITH_CLOUDFLARE_D1_DATABASE_ID` in `wrangler.jsonc`.
3. From this directory, run `npx wrangler d1 execute bots-database --remote --file=./schema.sql`.
4. Create secrets using `npx wrangler secret put AUTH_SECRET` and `npx wrangler secret put BOOTSTRAP_TOKEN`. Use **different, long, random** values; never commit them. Configure `ALLOWED_ORIGIN` to the production GitHub Pages origin.
5. Run `npx wrangler deploy`. Test `GET /health`.
6. **Once only:** send `POST /admin/bootstrap` with JSON `{"username":"<your admin username>","password":"<a NEW strong password>"}` and header `X-Bootstrap-Token: <BOOTSTRAP_TOKEN>`. This endpoint refuses to create a second admin.
7. Test `POST /auth/login` and authorized `POST /api/seasons`. Remove the `BOOTSTRAP_TOKEN` secret after the first admin is created.
8. Do not switch the public BOTS frontend to this API until existing portal data has been exported and migration/reconciliation has been tested.

## Endpoints
- `GET /health` — health and D1 connectivity
- `GET /api/seasons`, `GET /api/teams?season_id=...`, `GET /api/players?team_id=...`, `GET /api/matches?season_id=...` — public read
- `POST /admin/bootstrap` — initial admin creation, guarded by bootstrap secret and empty-admin check
- `POST /auth/login` — returns short-lived signed bearer token
- `POST /api/seasons`, `POST /api/teams`, `POST /api/players`, `POST /api/matches` — authenticated writes
- `PATCH /api/matches/:id` — authenticated result/status update

### Security notes
- Do not reuse a password already posted in chat; rotate it before provisioning.
- All admin writes require an HMAC-signed token and a currently active admin record.
- CORS is limited to `ALLOWED_ORIGIN`. CORS is not authentication.
- Before production use, configure Cloudflare WAF/rate limiting for `/auth/login` and `/admin/bootstrap`, add backups, and verify authorization and migration end-to-end.
- Do not expose D1 binding, `AUTH_SECRET`, or `BOOTSTRAP_TOKEN` to GitHub Pages.
- The old `bots.html` currently contains no app code; frontend integration is deliberately not enabled by this backend scaffold.
