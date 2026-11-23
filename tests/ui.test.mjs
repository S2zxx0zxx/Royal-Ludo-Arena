import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync,existsSync}from'node:fs';
const js=readFileSync('public/js/app.js','utf8');const html=readFileSync('public/index.html','utf8');
test('six art screens and five home card sprites exist',()=>{for(const x of ['home','online','team','friends','computer','pass'])assert.ok(existsSync('public/assets/screens/'+x+'.webp'));for(const x of ['online','team','friends','computer','pass'])assert.ok(existsSync('public/assets/ui/home_'+x+'.webp'));});
test('visual screens are routed and accessible',()=>{for(const x of ['online','team','friends','computer','pass'])assert.ok(js.includes("to: '"+x+"'"));assert.match(html,/aria-label="Royal Ludo Arena"/);assert.match(js,/aria-label/);});
test('live network-only actions are disabled',()=>{assert.match(js,/hit.action === 'readonly'/);assert.match(js,/button.disabled = true/);});
test('room code and team-up validation present',()=>{assert.match(js,/slice\(0, 6\)/);assert.match(js,/Team Up needs exactly four players/);});
