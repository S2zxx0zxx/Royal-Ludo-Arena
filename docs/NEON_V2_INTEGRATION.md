# Neon v2 integration — scope and release gates

This commit brings the owner-supplied Royal Ludo Arena v2 into the existing previously merged v1 source without changing the owner's original Home, Events, Profile, Store and setup images.

## Included

- A single-process Node 22 HTTP/WebSocket preview server (`server/index.js`, `server/rooms.js`, `server/ws-server.js`)
- Private friends rooms with ready states, host commands, server-generated dice, server-side move validation, turn clock, reconnect snapshots while the process is running
- 2v2 Team Battle queue and duo-party room codes (available in the same single Node runtime; bot fallback after timeout)
- Walnut board and cutout pawn artwork rendered by the existing game UI, and v2 Partner Finish Assist rules
- Guest preview identities, profile settings and virtual rewards stored in a local JSON file (not real-money currency, not horizontally scalable)
- Regression tests for user-input escaping, saved match validity, WebSocket origin / frame rules, wallet numeric safety, idempotent match results, entry-fee disablement, and provider payment disablement

## Hard safety boundaries

- Both payment endpoints deliberately return **501 Not Implemented**, even if Razorpay or Google Play environment credentials are supplied. Upstream code did not bind a provider-verified payment to a durable server-created order, amount, user, SKU, purchase settlement and acknowledgement. The in-game storefront displays a preview message and cannot charge or credit currency.
- Virtual entry-fee transfers and currency prize pools are disabled pending an atomic database escrow and settlement design. Played games still award ordinary demo XP.
- The Node JSON database and in-memory room state are not deployable as a scalable multi-instance backend. The default `npm start` binds **127.0.0.1** for local development. `NODE_ENV=production` refuses to start unless explicitly overridden for controlled staging.
- Account token expiration, unique guest IDs, CORS restrictions, WebSocket checks and rate limits are defense-in-depth for this local preview, **not** a substitute for OAuth, authoritative player accounts, durable database, deployment controls or an independent security assessment.
- The new `.webp` / `.png` studio graphics are 2D render assets, not 3D mesh `.glb` files.

## Validation

`npm test` runs the Node 22 test suite (30 cases after this integration). `npm start` serves the local preview at `http://127.0.0.1:4173` on the machine running the Node process. This does not create a public live deployment.

Manual mobile acceptance and network/WebSocket E2E on two physical devices are separate release gates. Visual browser QA was performed using inline document rendering at 360×800, 390×844 and 921×1536. The local Chrome sandbox blocked normal localhost/file URL navigation, so do not claim deployed Android verification.

Do not merge as **production**: real identity, transactional database, provider billing, Android Java/AAB, latency/load/security testing, and managed multi-instance real-time infrastructure remain pending.
