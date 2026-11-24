# Original 7-card sidebar asset integration

Source: user-uploaded `Royal_Ludo_7_Sidebar_Cards.zip` (original generated 488px PNG/WebP pairs). Seven supplied WebP files are copied byte-for-byte into `public/assets/ui/royal-sidebar/`. No re-generation or image manipulation. PNG duplicates intentionally excluded to avoid extra transfer and keeping responsive downloads low.

Left rail: Starter Pack → Store, Events → Events screen, Bonus Chest → existing free-chest feature.
Right rail: VIP → existing VIP feature, Daily Reward → reward feature, Missions → Daily Goals screen, Ranks → leaderboard.

Images keep their source aspect ratio (488×468 or 488×384) using `object-fit: contain`, never `cover`, and are purely decorative inside real accessible button elements. Existing data attributes, dynamic badge indicators, sounds and navigation remain intact.

**Not new backend features:** This change does not activate paid purchases, authoritative virtual currency, global leaderboard, rewards, or matchmaking. Actual availability still depends on the earlier V3 game code/backend.

QA: use `npm test` and mobile browser checks at 320/360/390/921px.

PWA service worker cache version v3.0.2 preloads the seven rail assets and ten approved gameplay cards for offline reuse.
