# eFLL

Public league: https://efll-labuan.apengtakahashi.chatgpt.site
Admin login: https://khan7-gif.github.io/esports/

Liga eFootball Mobile untuk kelab dari Labuan, adapted from BOTM in the same esports repository. Club-name search, editable club names/abbreviations and independently selectable state flags are included. Rosters, 15 matchweeks/120 fixtures, player-game scores, LIVE results, statistics, MOTM and poster sharing remain available.

Admin uses the shared esports session. The subweb has no separate password form; unauthenticated admin requests return to the esports home through a validated PKCE handoff. League reads are public and editing requires the shared account. No account or live tournament records are reset.

Requires Node.js >=22.13 and pnpm 11.25. From the repository root, `cd efll`, then `pnpm install`, `pnpm dev`, `pnpm test`, or `pnpm build`. Hosted runtime uses the existing Sites project ID in .openai/hosting.json and its own DB binding. Native Sites applies migrations at deployment.

Runtime SSO_ENABLED=true, SSO_ISSUER, SSO_CLIENT_ID=efll and SSO_LOGIN_HOME are configured on the Site, not in browser code. Do not reuse another competition's database or commit secrets. See ../HOME_LOGIN.md for the login protocol, validation and operational details.
