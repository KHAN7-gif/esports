# eFLL

Live app: https://efll-labuan.apengtakahashi.chatgpt.site

Liga eFootball Mobile untuk kelab dari Labuan, adapted from [BOTM source](https://github.com/KHAN7-gif/esports/tree/main/battle-of-the-states).

## Features

- Editable club names and abbreviations, with independently selectable state flags.
- Club-name search, club filters, rosters, standings, 15 matchweeks and 120 fixtures.
- Player-game scores, LIVE results, statistics, MOTM, matchday PNG download and sharing.
- Two seasons, admin editing, demo labels, and optimistic save conflict protection.

The initial 16 names are the original state names, ready for replacement with club names in admin. Demo players/results remain included. No live database records or credentials are copied.

## Development

Requires Node.js >=22.13 and pnpm 11.25.

```sh
# From the esports repository root
cd efll
pnpm install
pnpm dev
pnpm exec tsc --noEmit
pnpm test
pnpm build
```

## Hosting and admin setup

This is a Vinext/React app for Cloudflare Workers + D1, not GitHub Pages. `.openai/hosting.json` identifies the independent eFLL Site and declares its D1 binding as `DB`. Sites applies the SQL migrations in `drizzle/` during deployment. Do not reuse BOTM hosting identity or database.

Admin uses the retained email/password implementation with an HMAC session cookie, not an automatic ChatGPT account grant. Configure `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_PASSWORD_SALT`, and `ADMIN_SESSION_SECRET` in runtime settings; keep secrets out of Git. Password hashing uses PBKDF2-SHA256 with 100000 iterations, a hex salt, and a 256-bit hex result. Generate a fresh random session secret. Use HTTPS for the secure admin cookie. Visit `/admin` to sign in.

Public data: `GET /api/tournament?season=1` (or `2`). Authenticated writes: `PUT` to the same endpoint with `{data, version}`; stale versions return 409. Existing `Team` fields remain compatible, with optional `stateCode` for the flag. An initial read shows demo data; Save changes creates the stored record.

The Site is deployed privately for its owner. Admin credentials still need runtime configuration before editing real tournament records.
