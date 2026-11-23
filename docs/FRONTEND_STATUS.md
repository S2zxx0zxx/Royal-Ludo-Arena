# Frontend acceptance — v0.1.0

**Verified in this PR:** six reference-aligned screens, five navigation cards, browser hash/back navigation, semantic selection controls, friend room-code sanitation, 2–4-player UI choices, and original 6+5 WebP artwork.

**BLOCKED for UI-production acceptance:** screenshot-baked UI still forms each screen; not a decomposed responsive component tree. Individual selection badges, counters, balances, and labels cannot yet update visually at pixel parity. The screenshot data displays illustrative player counts/currencies and is **not live**. Need clean sprites, proper disabled/selected artwork, real typography, all tappable touch targets, landscape/tablet layout, and physical Android device QA.

**Not implemented by design:** Ludo engine/rules, online queues, rooms, friends login, computer AI, monetization, analytics, player data, payments, Google Play AAB/SDK, signing and release.

**Next production step:** rebuild each screen as independent DOM/SVG layers preserving the approved art; bind typed view models; verify mobile screenshot diffs; then add actual game wiring on later feature PRs.
