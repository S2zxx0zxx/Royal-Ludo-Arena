# Royal Ludo Arena (v1.0.0 — Offline Playable Foundation)

Offline-playable Royal Ludo Arena using the existing approved walnut, burgundy, antique gold, and cream source art. Zero runtime dependencies for the app. Browser storage is demo state, not secure/authoritative account data.

## Quick Start

```sh
python3 -m http.server 4173 --directory public
# Open http://localhost:4173
```

Run automated tests:

```sh
npm test
```

## What Was Upgraded in v1.0.0

- **Complete 15×15 Ludo Engine (`public/js/ludo-engine.js`)**: Authentic 52-cell outer loop, 4 colored home columns, 8 Star safe zones, exact-roll home entry, token stacking, captures with bonus turns, and the 3-consecutive-6s forfeit rule.
- **Seven Rule Variants (Offline)**: Classic, Quick (2-pawn win + pre-deployed pawn), Rush Blitz (3-minute timed points mode), One Kill Win (sudden death), Team Battle / Team Up (2v2 partners), Popular (+2 Power Rerolls), and Mask Mode.
- **4-Tier Tactical AI (`public/js/ludo-ai.js`)**: Easy, Medium, Hard, and Expert AI with threat detection, safe-zone tactics, capture hunting, and Team 2v2 partner awareness.
- **Interactive Luxury Arena (`public/js/game-view.js`, `public/game.css`)**: Glossy 3D SVG pawns with step-by-step hop animation, 3D tumbling dice, active turn countdown ring with auto-play timeout, capture bursts, confetti celebrations, quick emotes, 1x/2x speed toggle, Spacebar roll shortcut, and auto-save/resume.
- **All 5 Entry Modes + Tournament**:
  - Play vs Computer (2–4 players + Custom seat setup)
  - Pass & Play (2–4 local players, color picker, Classic / Team Up / Quick)
  - Play Online & Team Battle (animated matchmaking lobby + prize pot)
  - Play With Friends (6-digit Private Room generator + BroadcastChannel live multi-tab local sync)
  - 2-Round Knockout Royal Tournament (Semi-Final + Grand Final)
- **Procedural Web Audio SFX & Haptics (`public/js/sound.js`)**: Dice rattle, ascending pawn hops, capture impact, safe-zone sparkle, victory fanfare, coin clinks, and vibration support.
- **Local Demo Economy & Progression (`public/js/state.js`, `public/js/expansion.js`)**: Persistent Coins, Diamonds, Level/XP, Career Stats, 7-Day Daily Rewards, Interactive Lucky Spin Wheel, Live Missions, Unlockable Board Themes & Dice Skins (Inventory), Leaderboard, Claimable Inbox, Hourly Free Chest, and Settings.


## Release / security boundaries

- **Play Online and Team Battle are offline simulations with bots.** No real remote matchmaking, authenticated accounts, cross-device friend rooms, or global leaderboard is provided. Private rooms use BroadcastChannel within same-origin tabs only.
- **Coins, diamonds, missions, daily streaks and purchases are browser-local demo values.** They can be modified by the user and cannot be used for real-money, fraud-resistant rewards, tournaments or balances. Google Play Billing is not integrated.
- Existing six concept-screen assets are preserved. The new game board is generated SVG and CSS, not a native GLB scene; gameplay appearance still requires owner acceptance.
- Frontend runs in web browsers. Android AAB, Java TWA signing, Digital Asset Links, offline-device tests and Play Console compliance are separate release gates.
- Untrusted displayed names are HTML-escaped; saved match shape is validated before restore. Browser storage remains untrusted.
