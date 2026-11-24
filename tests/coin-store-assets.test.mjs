import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
const js = readFileSync('public/js/expansion.js', 'utf8');
const css = readFileSync('public/styles.css', 'utf8');
const sw = readFileSync('public/sw.js', 'utf8');
const items = ['royal_bundle','coins_25k','coins_100k','coins_500k','coins_1m','coins_5m'];
test('all six original royalty coin store card images are mapped in exact SKU order', () => {
 const positions = items.map(sku=>{
   assert.ok(statSync(`public/assets/ui/royal-coin-store/${sku}.webp`).size>80000,sku);
   const pattern = `sku: '${sku}', art: '${sku}'`;
   assert.ok(js.includes(pattern),pattern);
   assert.ok(sw.includes(`./assets/ui/royal-coin-store-centered/${sku}.webp`),sku);
   return js.indexOf(pattern);
 });
 assert.deepEqual(positions,[...positions].sort((a,b)=>a-b));
});
test('full card artwork, independent price actions and accessible store tabs are preserved', () => {
 assert.match(js,/class="rla-coin-pack-image"/);
 assert.match(js,/data-buy-sku="\$\{p.sku\}"/);
 assert.match(js,/data-buy-label="\$\{p.name\} — \$\{p.price\}"/);
 assert.match(js,/data-store-tab="coins"/);
 assert.match(js,/data-store-tab="diamonds"/);
 assert.match(js,/data-store-tab="offers"/);
 assert.match(css,/\.rla-coin-pack-image\s*\{[^}]*object-fit:\s*contain/);
});
test('the existing payment flow remains fail closed', () => {
 assert.match(js,/Store checkout is disabled in this preview/);
 assert.match(js,/openSecureCheckoutModal\(b.dataset.buySku, b.dataset.buyLabel\)/);
});
