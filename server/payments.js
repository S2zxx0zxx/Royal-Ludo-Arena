/**
 * Royal Ludo Arena v2.0.0 — Production Payment Verification (Google Play Billing + Razorpay)
 *
 * Security rules:
 * - Client ONLY sends `sku` + signed receipt / payment signature.
 * - Server looks up exact coin/diamond grants from immutable SKU_CATALOG.
 * - Replay-attack protection via `db.state.processedPayments[receiptHash]`.
 * - NEVER credits currency without valid cryptographic/provider verification.
 */

export const SKU_CATALOG = Object.freeze({
  royal_bundle:  { title: 'Royal Coin Bundle',   priceInr: 480,  coins: 250000,   diamonds: 50 },
  coins_25k:     { title: '25,000 Coins',        priceInr: 100,  coins: 25000,    diamonds: 0 },
  coins_100k:    { title: '100,000 Coins',       priceInr: 180,  coins: 100000,   diamonds: 0 },
  coins_500k:    { title: '500,000 Coins',       priceInr: 480,  coins: 500000,   diamonds: 0 },
  coins_1m:      { title: '1,000,000 Coins',     priceInr: 690,  coins: 1000000,  diamonds: 0 },
  coins_5m:      { title: '5,000,000 Coins',     priceInr: 1800, coins: 5000000,  diamonds: 0 },
  coins_10m:     { title: '10,000,000 Coins',    priceInr: 3000, coins: 10000000, diamonds: 0 },
  diamonds_100:  { title: '100 Diamonds',        priceInr: 79,   coins: 0,        diamonds: 100 },
  diamonds_500:  { title: '500 Diamonds',        priceInr: 329,  coins: 0,        diamonds: 500 },
  diamonds_2000: { title: '2,000 Diamonds',      priceInr: 999,  coins: 0,        diamonds: 2000 },
  king_pass:     { title: 'King Pass',           priceInr: 599,  coins: 150000,   diamonds: 100 }
});


/**
 * FAIL CLOSED: These are interface contracts, not working production billing.
 * The upstream v2 receipt handlers accepted client-selected SKU without proving a
 * matching server-created order, amount, user and payment status. That could
 * credit a different item from a valid unrelated payment. Production checkout
 * requires durable order state, provider verification, and a transactional ledger.
 * No wallet mutation occurs in either handler until a separate audited billing
 * implementation replaces this one.
 */
export function verifyRazorpayPayment(_db, _userId, _payload = {}) {
  return { status: 501, body: { ok: false, error: 'Billing disabled pending server-bound order and settlement verification.' } };
}
export async function verifyGooglePlayPurchase(_db, _userId, _payload = {}) {
  return { status: 501, body: { ok: false, error: 'Billing disabled pending Google Play Developer API verification and purchase acknowledgement.' } };
}
