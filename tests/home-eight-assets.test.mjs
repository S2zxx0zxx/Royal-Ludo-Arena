import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync,readdirSync} from 'node:fs';
const src=readFileSync('public/js/app.js','utf8');
const css=readFileSync('public/styles.css','utf8');
const sw=readFileSync('public/sw.js','utf8');
const ids=['online','team','friends','computer','pass','lucky-spin','tournament','free-coins'];
test('all eight WebP Home graphics replace the old sheet',()=>{
  assert.deepEqual(readdirSync('public/assets/ui/royal-home-v2').sort(),ids.map(x=>x+'.webp').sort());
  for(const id of ids){
    const f=`public/assets/ui/royal-home-v2/${id}.webp`;
    assert.ok(existsSync(f));assert.ok(statSync(f).size>60_000,f);
    assert.deepEqual([...readFileSync(f).subarray(0,4)], [82,73,70,70]); // RIFF WebP
    assert.ok(src.includes('./assets/ui/royal-home-v2/'+id+'.webp'),id);
    assert.ok(sw.includes('./assets/ui/royal-home-v2/'+id+'.webp'),id);
  }
  assert.ok(!existsSync('public/assets/ui/royal-sheet'));
});
test('all modes and footer actions stay functional and semantic',()=>{
  for(const mode of ['online','team','friends','computer','pass'])
    assert.match(src,new RegExp('data-nav="'+mode+'" data-hit-id="home-'+mode+'"'));
  assert.match(src,/data-open="lucky-spin" aria-label="Lucky Spin"/);
  assert.match(src,/data-open="tournament" aria-label="Royal Tournaments"/);
  assert.match(src,/data-open="free-chest" aria-label="Free Coins"/);
  assert.match(src,/freeSpinReady \? '<span class="v3-badge-dot">1<\/span>'/);
});
test('sprite dimensions align with original buttons, no stretching',()=>{
  assert.match(css,/v3-mode-card \{ aspect-ratio: 880 \/ 1072;/);
  assert.match(css,/v3-modes-bottom \.v3-mode-card \{ aspect-ratio: 1340 \/ 722;/);
  assert.match(css,/v3-home-footer-strip \.v3-card-image \{[\s\S]*?object-fit: contain/);
  assert.doesNotMatch(src,/🎡<\/span><span class="v3-rail-lbl"/);
  assert.doesNotMatch(src,/💰<\/span><span class="v3-rail-lbl"/);
});
