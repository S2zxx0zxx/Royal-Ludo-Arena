import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,statSync} from 'node:fs';
const root='public/assets/ui/royal-coin-store-centered/';const names=['royal_bundle','coins_25k','coins_100k','coins_500k','coins_1m','coins_5m'];
const view=readFileSync('public/js/expansion.js','utf8');const sw=readFileSync('public/sw.js','utf8');
test('all six centered original-derived cards exist and are webp',()=>{for(const name of names){const path=root+name+'.webp';const data=readFileSync(path);assert.ok(data.length>15000);assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP')}});
test('store loads centered assets without altering independent price buttons',()=>{assert.match(view,/royal-coin-store-centered\/\$\{p.art\}\.webp/);assert.match(view,/data-buy-sku/);assert.match(view,/rla-coin-pack-price/)});
test('pwa caches all centered card sprites',()=>{for(const name of names)assert.ok(sw.includes('royal-coin-store-centered/'+name+'.webp'))});
test('original assets kept for fallback',()=>{for(const name of names)assert.ok(statSync('public/assets/ui/royal-coin-store/'+name+'.webp').size>15000)});
