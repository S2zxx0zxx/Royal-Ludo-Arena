import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const css=readFileSync('public/styles.css','utf8');
const js=readFileSync('public/js/expansion.js','utf8');
const sw=readFileSync('public/sw.js','utf8');
const names=['back','header','gift','coins','diamonds','offers'];
test('all six newly fitted assets are optimized WebP and cached',()=>{
  for(const name of names){
    const path=`public/assets/ui/royal-store-chrome/${name}.webp`;
    const data=readFileSync(path);
    assert.equal(data.toString('ascii',0,4),'RIFF',name);
    assert.equal(data.toString('ascii',8,12),'WEBP',name);
    assert.ok(data.byteLength>5000 && data.byteLength<350000,`${name} bytes ${data.byteLength}`);
    assert.ok(sw.includes('./assets/ui/royal-store-chrome/'+name+'.webp'),name);
    assert.ok(js.includes('./assets/ui/royal-store-chrome/'+name+'.webp'),name);
  }
});
test('store artwork is structured inside live navigation and tab controls',()=>{
  assert.match(js,/class="v3-screen-head rla-store-art-header"/);
  assert.match(js,/class="rla-store-art-icon" data-nav="home"/);
  assert.match(js,/class="rla-store-art-icon" data-nav="send-gift"/);
  for(const tab of ['coins','diamonds','offers'])assert.match(js,new RegExp('class="rla-store-art-tab" data-store-tab="'+tab+'"'));
  assert.match(js,/aria-pressed="\$\{state\.storeTab === 'offers'\}"/);
});
test('selected marker is dynamic and has no baked checkmark pseudo element',()=>{
  const style=css.slice(css.indexOf('/* Original Royal Store header/tabs:'));
  assert.match(style,/\.rla-store-art-tab\[aria-pressed="true"\]::after/);
  assert.match(style,/content:'';/);
  assert.doesNotMatch(style,/content:\s*['"](?:✓|✔)/);
});
test('exact card packs and fail-closed payment action remain intact',()=>{
  assert.match(js,/royal-coin-store-centered/);
  assert.match(js,/data-buy-sku/);
  assert.match(js,/Store checkout is disabled in this preview/);
  assert.match(css,/\.rla-store-art-tab img\s*\{[^}]*object-fit:contain/);
});
