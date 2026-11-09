# Shared esports account service

The public GitHub Pages portal is a directory only. BOST, LEL, TEKKEN and eFLL each have a local login form and use the same existing account stored in this service's D1 database. The Elite and PUBG are separate.

See [the current login architecture](../HOME_LOGIN.md) for the browser login API, ES256 signatures, runtime key settings and independent session lifecycle. The browser communicates with this service directly; subweb servers verify signed sessions locally without cross-Worker fetches. Tekken public pages remain public; admin writes require a verified Tekken session.

Build with `node build.mjs`; test with `node build.mjs && node --test tests/*.test.mjs`. The Worker includes Tekken assets and additive D1 migrations. QA servers under tests are not deployed. Existing account data is preserved. Owner bootstrap at `/setup` requires trusted Sites identity and its owner allowlist. Native Sites publication needs no Cloudflare account API token.
