# Royal Ludo Arena V3.0.1 — review build

This source archive contains the user-supplied V3 native component frontend, with review fixes applied. It was compared with GitHub `main` commit `1edf959cf5efa22b7f7ac282aa9b96a5013985ba` (PR #4).

## Start locally

```sh
npm test
npm start
# Then open http://127.0.0.1:4173
```

The Node server runs a **single-node development preview**. It is not a production-scale multiplayer service, and is not hosted by the Cloudflare Pages static preview. Without that server, local practice works. Actual payment fulfillment, Google Play Billing, entry fees and prize payouts are disabled.

## V3 improvements over V2

- Native clickable frontend screens for Home, Play Online, Team Battle, Play With Friends, Play vs Computer, Pass & Play, Profile, Events, Store, Inventory, Club, Social, More and Daily Goals.
- New pre-rendered artwork: `hero-ludo-3d.webp`, `avatar-hero.webp`, `bot-mascot.webp` (these are **2D sprites**, not meshes).
- Improved game-board visual styles, while retaining the existing v2 engine, AI, WebSocket server and V1/V2 asset library.
- Screen accessibility: DOM controls and selection state rather than baked screenshot hit regions.

## Safety checks and limits

- User names and text are escaped in generated HTML, and match snapshots are validated.
- Server-active daily mission claims use the server endpoint and do not issue local currency.
- Server-active profile edits require a confirmed success response.
- Payments and currency minting via checkout remain disabled.
- CSS backgrounds use flat colors and layered shadows, without gradients.
- Previously approved V1/V2 source art files remain byte-identical, but **V3's new native layout is NOT pixel-identical to those screens**. Visual fidelity/physical Android acceptance is an explicit merge blocker, not claimed complete.
- `npm test` currently covers unit, server, security and static compatibility checks; device-browser/system and live-Internet verification remain separate.

## Android and release

This is **not** a signed Java AAB and not a Play Store-ready release. For a Play Store app, prepare Java/TWA packaging, hosted HTTPS PWA, Android App Links, identity, game-data declarations, and full physical device QA. Do not treat these source files alone as production certification.
