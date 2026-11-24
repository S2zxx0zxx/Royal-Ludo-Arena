# Six original 3D bottom navigation icons

Source: uploaded user-approved `93131.png`, not AI-redrawn. The six cropped transparent WebP assets are generated from that original image with GrabCut background extraction and manual visual inspection. Each has its original proportions contained in a 192×192 transparent canvas. Native text labels and the existing 6-column tap targets are preserved.

Asset mapping: `home` house, `events` July calendar, `club` royal blue shield, `inventory` red backpack, `social` double speech bubbles, `more` blue-center gear.

`public/js/app.js` now references `assets/ui/royal-nav/{name}.webp` in the existing primary navigation. `public/styles.css` displays the icons at 20–24px mobile-sized without stretching/cropping; service worker caches all six for PWA updates. There is no routing, progression, currency or backend behavior change.

QA: Node tests and headless Chromium at 320×720, 360×800, 390×844, 921×1536; no overflow/page exceptions and all six buttons navigate to their respective hash. Physical Android and hosted Cloudflare QA remain required.

Some alpha-extraction edges may exhibit mild halo against very light backgrounds; this project uses a dark burgundy dock. Original graphic includes a fixed `July 17` calendar illustration; this is decorative, not a live calendar date.
