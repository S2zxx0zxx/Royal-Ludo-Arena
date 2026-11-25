import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const css = readFileSync('public/styles.css','utf8');
const app = readFileSync('public/js/app.js','utf8');
const sw = readFileSync('public/sw.js','utf8');
for(const pair of [{action:'lucky-spin',asset:'lucky-spin',label:'Lucky Spin'},
                   {action:'free-chest',asset:'free-coins',label:'Free Coins'}]) {
  test('Floating footer keeps original '+pair.label+' click target and WebP',()=>{
    const maskPath='public/assets/ui/royal-footer-masks/'+pair.asset+'.svg';
    const svg=readFileSync(maskPath,'utf8');
    assert.ok(statSync(maskPath).size>250);
    assert.match(svg,/viewBox="0 0 622 638"/);
    assert.match(svg,/fill-rule="evenodd"/);
    assert.ok(css.includes('royal-footer-masks/'+pair.asset+'.svg'));
    assert.ok(css.includes('.v3-rail-btn[data-open="'+pair.action+'"] > .v3-card-image'));
    assert.ok(app.includes('data-open="'+pair.action+'" aria-label="'+pair.label+'"'));
    assert.ok(app.includes('royal-home-v2/'+pair.asset+'.webp'));
    assert.ok(sw.includes('royal-footer-masks/'+pair.asset+'.svg'));
  });
}
test('No other footer card gets masked; original labels stay readable',()=>{
  assert.ok(app.includes('royal-home-v2/tournament.webp'));
  assert.ok(!css.includes('royal-footer-masks/tournament'));
  assert.match(css,/content: attr\(aria-label\)/);
  assert.match(sw,/royal-ludo-arena-v3\.1\.2-floating-footer/);
});
