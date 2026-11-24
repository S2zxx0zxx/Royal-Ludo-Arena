import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
const names=['home','events','club','inventory','social','more'];
const app=readFileSync('public/js/app.js','utf8');
const css=readFileSync('public/styles.css','utf8');
const sw=readFileSync('public/sw.js','utf8');
test('each original 3D navigation image exists once and has valid WebP bytes',()=>{
  for(const name of names){
    const file=`public/assets/ui/royal-nav/${name}.webp`;
    assert.ok(statSync(file).size > 15000, file);
    const bytes=readFileSync(file);
    assert.equal(bytes.toString('ascii',0,4),'RIFF');
    assert.equal(bytes.toString('ascii',8,12),'WEBP');
    assert.equal(app.split(`./assets/ui/royal-nav/${name}.webp`).length-1,1,name);
    assert.equal(sw.split(`./assets/ui/royal-nav/${name}.webp`).length-1,1,name);
  }
});
test('six route names and semantic buttons retain the same navigation handlers',()=>{
  for(const name of names) {
    assert.ok(app.includes(`id: '${name}'`));
    assert.ok(app.includes(`label: '${name.toUpperCase()}'`));
  }
  assert.match(app,/data-nav="\$\{n.id\}"/);
  assert.match(app,/class="v3-nav-tab/);
  assert.match(app,/aria-label="\$\{n.label\}"/);
  assert.match(app,/class="v3-nav-art"/);
});
test('single native text label, contained artwork, compact safe six-column dock',()=>{
  assert.match(css,/grid-template-columns:\s*repeat\(6,\s*1fr\)/);
  assert.match(css,/\.v3-bottom-dock \.v3-nav-tab \.v3-nav-art[^}]*object-fit:\s*contain/s);
  assert.match(css,/pointer-events:\s*none/);
  assert.match(css,/clamp\(20px,\s*5\.65vw,\s*24px\)/);
  assert.match(app,/\<span\>\$\{n.label\}\<\/span\>/);
});
