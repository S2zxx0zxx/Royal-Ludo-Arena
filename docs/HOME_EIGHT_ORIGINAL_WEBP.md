# Original 8 Home Card Replacement — v3.0.7

Eight assets are taken unchanged from the user-uploaded `Royal_Ludo_8_Home_Cards.zip`, rather than regenerated or cropped. Existing box layout and button route handlers remain intact. The original format is RGBA WebP and visual details/borders are inside the image.

- `online.webp`: Play Online (Home → Online)
- `team.webp`: Team Battle (Home → Team)
- `friends.webp`: Play With Friends (Home → Friends)
- `computer.webp`: Play vs Computer (Home → Computer)
- `pass.webp`: Pass & Play (Home → Pass)
- `lucky-spin.webp`: Lucky Spin (existing local feature action)
- `tournament.webp`: Royal Tournaments (existing feature action)
- `free-coins.webp`: Free Coins (existing free chest action)

The previous 10-card sheet's six Home gameplay/tournament cards and the footer emoji placeholders were removed. The unrelated active seven side rails, six 3D nav icons, Store Chrome and centered Coins gallery remain untouched. Legacy `royal-sheet` images are removed from the package and PWA cache, with a new cache version to avoid stale images. The dynamic Lucky Spin badge is rendered via code, not embedded artwork.

**Release scope:** This is an asset/UI replacement. Existing (some preview-only) feature actions do not become real payments or server-backed rewards. A separate staged V3 PR is still unmerged at time of local build.
