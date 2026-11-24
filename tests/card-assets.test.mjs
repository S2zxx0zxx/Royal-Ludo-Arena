import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync, statSync} from 'node:fs';
const src=readFileSync('public/js/app.js','utf8');
const styles=readFileSync('public/styles.css','utf8');
const assets=['online','team','friends','computer','pass','lucky-spin','tournament','free-coins'];
test('eight approved Home cards are still present',()=>{
  for (const name of assets) {
    const path=`public/assets/ui/royal-home-v2/${name}.webp`;
    assert.ok(existsSync(path),path);
    assert.ok(statSync(path).size>9000,path);
    assert.ok(src.includes(`./assets/ui/royal-home-v2/${name}.webp`),name);
  }
});
test('game mode buttons preserve their original navigation targets',()=>{
  for (const name of ['online','team','friends','computer','pass']) {
    assert.ok(src.includes(`data-nav="${name}" data-hit-id="home-${name}"`));
  }
});
test('side cards retain their original semantic action routing',()=>{
  for (const action of ['data-open="vip"','data-open="daily-reward"','data-nav="daily-goals"','data-nav="store"','data-open="tournament"'])
    assert.ok(src.includes(action),action);
});
test('new images use object-fit contain and keyboard focus',()=>{
  assert.match(styles,/\.v3-card-image\s*\{[^}]*object-fit:\s*contain/);
  assert.match(styles,/v3-mode-card:focus-visible/);
  assert.match(src,/aria-label="Play Online"/);
});
