# Royal Coin Store art integration (v3.0.4)

Six owner-provided, original 1040×840 RGBA WebP cards from `Royal_Ludo_6_Coin_Store_Cards.zip` are mapped 1:1 to the Coins tab SKUs:

| SKU | Image | Amount |
|---|---|---|
| royal_bundle | royal_bundle.webp | 250,000 Coins + 50 Diamonds |
| coins_25k | coins_25k.webp | 25,000 Coins |
| coins_100k | coins_100k.webp | 100,000 Coins |
| coins_500k | coins_500k.webp | 500,000 Coins |
| coins_1m | coins_1m.webp | 1,000,000 Coins |
| coins_5m | coins_5m.webp | 5,000,000 Coins |

The full original card art, text, and 3D motifs remain intact (not cropped or re-generated). Price is a separate accessible button directly below art. Exact two-column layout, responsive to 320px+ mobile widths. Other Store tabs unchanged.

**Purchase CTA remains deliberately disabled/fail-closed at backend level**; it opens the existing non-transactional checkout preview. No payment/reward grant or balance mutation is introduced. The card art's sample prices match existing frontend values, but do not represent a live purchase listing.

Validation: `npm test`; verify `#store` Coins/Diamonds/Offers tabs and all six price buttons using responsive browser QA. Do not confuse baked card text with dynamic values.

## Centering correction v3.0.5

The source cards place the artwork/text group high with a large empty region below; CSS `object-position` does not reposition baked pixels. To fix this, six derivative WebP assets were composed from the owner's supplied images, shifting the existing icon and labels vertically inside the **same 1040 × 840 frame**, keeping the outer frame shape, original asset family and 2-column layout. Original files in `royal-coin-store/` are retained for rollback; `royal-coin-store-centered/` is displayed. The 3D objects were not replaced by AI-generated substitutes.

SKUs, price buttons, Checkout disabled messages and mobile dock unchanged.
