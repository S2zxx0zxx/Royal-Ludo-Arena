import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, statSync} from 'node:fs';
const html=readFileSync('public/js/app.js','utf8');
const css=readFileSync('public/styles.css','utf8');
const files=['starter-pack','events','bonus-chest','vip','daily-reward','missions','ranks'];
test('all seven original sidebar WebP assets are referenced by exactly one semantic card',()=>{
  for (const name of files){
    const path=`public/assets/ui/royal-sidebar/${name}.webp`;
    assert.ok(statSync(path).size>=20000,path);
    assert.equal(html.split(`./assets/ui/royal-sidebar/${name}.webp`).length-1,1,name);
  }
});
test('sidebar cards preserve navigation & feature action wiring',()=>{
  for(const marker of ['aria-label="Starter Pack"','aria-label="Events"','aria-label="Free Bonus Chest"','aria-label="VIP"','aria-label="Daily Reward"','aria-label="Missions"','aria-label="Leaderboard"']) assert.ok(html.includes(marker),marker);
  for(const marker of ['data-nav="store"','data-nav="events"','data-open="free-chest"','data-open="vip"','data-open="daily-reward"','data-nav="daily-goals"','data-open="leaderboard"']) assert.ok(html.includes(marker),marker);
});
test('native aspect ratios and uncropped images remain supported',()=>{
  assert.match(css,/sidebar-portrait\s*\{\s*aspect-ratio:\s*488 \/ 468/);
  assert.match(css,/sidebar-landscape\s*\{\s*aspect-ratio:\s*488 \/ 384/);
  assert.match(css,/\.v3-rail-btn\.sidebar-sheet > \.v3-card-image[^}]*object-fit:\s*contain/);
  assert.match(css,/sidebar-sheet:focus-visible/);
});
test('preserve prior mode cards and active reward badges',()=>{
  assert.ok(html.includes('royal-home-v2/online.webp'));
  assert.match(html,/dailyReady \? '<span/);
  assert.match(html,/readyMissions \? `<span/);
});
