# V3 acceptance register

Baseline: `main` commit `1edf959cf5efa22b7f7ac282aa9b96a5013985ba`.

## Verified locally
- Game engine, AI and existing V2 WebSocket server code preserved.
- Home, VS Computer and board smoke at 320, 360, 390 and 921px in inline Chromium (earlier tool validation); no runtime JS page errors and no horizontal overflow in that harness.
- No CSS gradients in the review build; V1/V2 approved bitmap art Git hashes checked.
- Online mission claim-all guarded against local mint; connected profile edit checks server success.
- Source tests: 38/38 pass as of 2026-11-24.

## Blocking before a release or merge advertised as exact
- V3 native components do not match existing approved visual composition pixel-for-pixel. User locked exact Home/mode screen art and placement, so visual sign-off pending.
- No physical Android/touch QA and no full device-network UI walkthrough.
- Payment/account infrastructure remains single-node non-production, all purchases and prize payouts disabled.
- No Android Java signed AAB, store submission, hosted authoritative backend, or 20k concurrent-user certification.
- This local archive does not, by itself, create a GitHub PR or change `main`.
