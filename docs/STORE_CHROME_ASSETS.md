# Royal Store asset placement (v3.0.6)

User-provided generated high-resolution RGBA artwork was extracted to transparent optimized WebP sprites; **not true vector SVG**.

The six assets in `public/assets/ui/royal-store-chrome/` map to: top-left Back, centered Royal Store title banner, top-right Gift, and three category tabs Coins/Diamonds/Offers. All original source files are preserved outside the repository under uploaded attachments.

Crop removes low-alpha art noise/padding, not the visible shape. Elements maintain intrinsic aspect ratios using `object-fit: contain`, no stretched corners. Layout uses existing store width. Each is a real `<button>` with same `data-nav` and `data-store-tab` handlers. Offer artwork **does not bake a selection checkmark**; the only selected indication is a subtle dynamic underline controlled by `aria-pressed`, and there is no glyph.

The previous 6 centered Coin pack cards, separate price buttons and disabled checkout are unchanged. No new purchases or store credit. Recheck at 320/360/390px and wide viewport, keyboard focus, tab navigation and PWA cache.
