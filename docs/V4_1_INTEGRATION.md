# Royal Ludo Arena V4.1 — Verified integration

Source: uploaded V4.1 delta-only ZIP and `MERGE_MANIFEST.md`; baseline: repository `main` commit `ce003109be23c4fd15a0aa58f104ded949f0d66c` (matching archived files by Git blob SHA).

## Scope
- Splash loader with real image preloads and skip handling.
- Five native 3D mode setup screens, six-digit friend room input, local/AI roster and pawn selections.
- Interactive Lucky Spin cabinet, Free Coins and Bonus Chest, 7-day vault, leaderboard podium, Starter Pack showcase.
- Leaderboard request coalescing and 5-second client/server caches.
- Existing Home, sidebar, navigation, Store artwork and card radii left unchanged.

## Security/release constraints
- Paid Arena Stake / entry fees disabled: no real entry fee, payout or wallet transaction may be initiated from the V4.1 UI.
- Connected lucky spins and rewards use server responses; offline rewards are local-practice values and are not server-wallet balances.
- Connected spin response validated; animation frame IDs cleaned up on close to avoid timer buildup.
- Offline Events badge says PRACTICE, not LIVE.
- Payments and production multiplayer hosting remain separate release gates. Do not advertise them as activated by V4.1.
- No secret keys or third-party access tokens added.

## Verification
- `npm test`: 72/72 passed on integrated repository (V3/V2 regression suites + new tests).
- JavaScript syntax checks passed.
- Inlined Chromium smoke tested 320, 360, 390 and 921 pixel widths across Home, Online, Team, Friends, Computer, Pass, Events and Store: no page errors, no overflow, no broken image requests.
- Embedded Chromium test does not prove a public server, physical Android device, production billing, or multi-node scaling.
