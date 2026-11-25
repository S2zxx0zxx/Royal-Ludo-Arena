import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const names=['starter-pack','events','bonus-chest','vip','daily-reward','missions','ranks'];
const styles=readFileSync('public/styles.css','utf8');
const sw=readFileSync('public/sw.js','utf8');
const app=readFileSync('public/js/app.js','utf8');
test('only seven home side shortcuts receive floating alpha masks',()=>{
 for(const name of names){
  const svg=readFileSync(`public/assets/ui/royal-sidebar-masks/${name}.svg`,'utf8');
  assert.match(svg,/viewBox="0 0 488 (384|468)"/);
  assert.match(svg,/fill-rule="evenodd"/);
  assert.match(styles,new RegExp('royal-sidebar-masks/'+name.replace('-','\\-')+'\\.svg'));
  assert.ok(app.includes('royal-sidebar/'+name+'.webp'));
  assert.ok(sw.includes('royal-sidebar-masks/'+name+'.svg'));
 }
 assert.match(styles,/sidebar-sheet[^\n]*> \.v3-card-image/);
 assert.match(sw,/royal-ludo-arena-v3\.1\.3-native-3d/);
});
test('original seven navigation/feature actions remain intact',()=>{
 for(const action of ['data-nav="store"','data-nav="events"','data-open="free-chest"','data-open="vip"','data-open="daily-reward"','data-nav="daily-goals"','data-open="leaderboard"']) assert.ok(app.includes(action));
});
