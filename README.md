# Royal Ludo Arena

Original-art mobile game UI foundation. This repository is separate from all Chess projects.

## Run the interactive frontend

The current preview is plain HTML/CSS/JavaScript with no runtime dependencies. From this repository:

```sh
python3 -m http.server 4173 --directory public
# open http://localhost:4173
```

Use the five game cards on **Home** to navigate to **Play Online**, **Team Battle**, **Play With Friends**, **Play vs Computer**, and **Pass & Play**. Back, selection states, and the six-digit friends room-code input work. Actual gameplay, authentication, real online counts, matchmaking, payments, and AAB generation are **not implemented**; entry points that need these services are deliberately disabled.

### Design constraints

The six user-approved mobile designs are the sole visual baseline: walnut brown background, burgundy banners, gold detailing, cream lettering and dimensional Ludo artwork. Existing source-art screenshots are displayed as WebP with semantic transparent buttons overlaying real tap regions. This is a **visual-fidelity scaffold**, not a finished responsive component system. Affected text and checks remain embedded in images and may stretch on unusual phone proportions; independent HTML/CSS states and mobile-device sign-off are release blockers.

### Structure

- `public/index.html` and `public/styles.css`: web preview shell
- `public/js/app.js`: screen navigation, choices, selected-state feedback, and input validation
- `public/assets/screens`: six WebP screen images, exported from locked user designs
- `public/assets/ui`: five isolated home navigation-card images
- `docs/FRONTEND_STATUS.md`: completed and blocked features
- `tests/ui.test.mjs`: static source and assets regression checks

### Android / Play Store

Do not use Kotlin for this project. Later, when the hosted PWA and gameplay are ready, package its verified HTTPS origin into a Java-based Trusted Web Activity/AAB. A signed AAB cannot be generated without a package ID, signing keys, asset links, Android build toolchain and actual QA. See `docs/ANDROID_JAVA_AAB.md`.

## Validate

```sh
npm test
```

No claim of production readiness or live infrastructure is made by this frontend milestone.
