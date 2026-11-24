import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(p,'utf8');
test('no priced stake is interactive and entry fee defaults to zero',()=>{
  const modes=read('public/js/modes-3d.js');
  assert.match(modes,/Paid arena stakes are not available/);
  assert.match(modes,/const activeStake = '0'/);
  const app=read('public/js/app.js');
  assert.match(app,/group === 'entryFee' && value !== '0'/);
  const cli=read('public/js/realtime-client.js');
  for(const name of ['queueOnline','queueTeamSolo','createTeamParty']) assert.ok(cli.includes(name+": (mode = 'classic', entryFee = 0)"));
});
test('Lucky Spin validates authoritative server response and cleans up animation',()=>{
  const src=read('public/js/hub-3d.js');
  assert.match(src,/Number.isSafeInteger\(res.prize.coins\)/);
  assert.match(src,/activeRafs.delete\(pendingFrame\)/);
  assert.match(src,/Local practice wallet only/);
});
test('Service worker cache version changes with V4 assets',()=>{
 assert.match(read('public/sw.js'),/royal-ludo-arena-v3\.1\.2-floating-footer/);
});

test('offline pages never claim live game-server status',()=>{
 const exp=read('public/js/expansion.js');
 assert.match(exp,/isOnline\(\) \? 'LIVE' : 'PRACTICE'/);
 const hub=read('public/js/hub-3d.js');
 assert.match(hub,/local practice only/);
});
