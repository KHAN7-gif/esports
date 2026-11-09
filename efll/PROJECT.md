# eFLL

Independent adaptation of `KHAN7-gif/esports/battle-of-the-states` for Labuan clubs.

Club names and abbreviations are editable in admin. State flags remain separate via `Team.stateCode`. Legacy records are normalized on read without changing club names. Demo rosters and results are retained; original live database records are not included.

Requires Cloudflare Workers and a dedicated D1 database; not a standalone GitHub Pages app. Original Site identity and runtime/database state are excluded. Live app: https://efll-labuan.apengtakahashi.chatgpt.site (owner-private). Admin runtime credentials still require configuration.
