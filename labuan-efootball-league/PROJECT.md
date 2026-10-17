# Labuan eFootball League

- Fixtures: per-group ALL ROUND / ROUND 1… filters beneath group heading. Rounds use circle scheduling derived from member order and map existing pairings, preserving IDs, scores and home/away. Even N: N−1 rounds; odd N: N rounds with one bye. Share/save follows selected group rounds and prints group/round labels.

- GitHub Pages public frontend: `/esports/lel.html`. Build using `node scripts/export-github.mjs` after the Sites build. It renders the same public Dashboard directly, without an iframe or redirect. GET data uses the public backend with credentials omitted; only the exact GitHub Pages origin receives CORS permission. Admin remains on the authenticated backend.

Independent application with its own source repository, Site and D1 database. No BOTS API or data dependencies.

- / read view; /admin editing through ChatGPT sign-in and ADMIN_EMAIL allowlist.
- Mobile and console have independent records and optimistic version checking.
- User-requested demo: 32 participants per category, 4 groups of 8, Top 4 into the round of 16. Sample group scores and MOTM are explicitly marked DEMO.
- On the first GET of an absent category, insert the deterministic demo record using INSERT OR IGNORE. Never overwrite existing records. Subsequent reads use stored data.
- Admin can clear sample data, save, add real participants, then draw. An empty saved record stays empty.
- BO1 single round robin. Ranking: points, goal difference, goals scored, IGN.
- Two-leg knockout by aggregate, no away-goal rule. Final defaults to one match, configurable before bracket generation.
- Enter normal-time goals, extra-time goals and penalties separately. Penalties are excluded from goals.
- Groups lock after knockout generation; each round locks once its successor is generated.
- Apply changes updates the draft. Save changes persists to D1. Switching categories warns before discarding a draft.
- Google Drive image links require Anyone with the link / Viewer.

Use the Sites build helper. Generate schema migrations with drizzle-kit generate. Hosted migrations are applied at deployment.

- Admin Players → Tournament setup: manual ordered group slots; assigning an occupied player swaps slots. Changed grouping explicitly confirms resetting fixtures/results/bracket before draft apply. Unchanged assignments retain results.
- Optional player state codes, backward compatible with existing records. One showFlags switch per arena controls all player-avatar flags; state data stays stored while hidden.

- Tournament setup uses popups: 2/4/8 groups; Top 2/4; BO1 or Home/Away final. Group-count changes confirm reset of fixtures/results/bracket; qualification changes reset bracket only.
- Final tiebreak setting: extra-time then penalties (legacy default), or direct penalties on tied BO1/aggregate. Final settings lock once final exists.
- Shared third defaults ON: completed semifinal losers are jointly awarded third, shown in Home and Knockout; OFF hides the shared award.

- Tournament setup ends with a full-width Jana Liga button applying selected manual slots. Existing unchanged groups keep scores; changed groups confirm reset. Save changes persists the resulting draft. Random draw and reset tools appear before the manual slots.

- Registration groupSlots persist separately before generating fixtures. Empty registration starts with 8 placeholder entrants per selected group, named A1 etc. Each group has + Player, opening the first temporary profile, then appending a new slot once all are real (max 16/group). Equal group sizes required before fixture confirmation.
- Legacy simulated player names become temporary slot names on read; rankingName retains original alphabetical tiebreak to preserve existing seeded brackets/results. Real profile edits clear placeholder status.
