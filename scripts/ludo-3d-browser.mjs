import {chromium} from 'playwright';import {createArenaServer} from '../server/index.js';import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import assert from 'node:assert/strict';
const dir=await mkdtemp(join(tmpdir(),'rla-3d-'));const {server}=createArenaServer({dataDir:dir,secret:'test-only-3d-renderer'});await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;let browser;const results=[];
await mkdir('reports/ludo-3d',{recursive:true});
try{browser=await chromium.launch({headless:true});for(const [width,height] of [[320,700],[360,800],[414,896],[768,1024],[896,414]]){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:width<500,isMobile:width<500,reducedMotion:'reduce'});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.waitForFunction(()=>window.RLA3D&&window.RLAGameView);await page.locator('.rla-splash-overlay').waitFor({state:'hidden'});
 await page.evaluate(()=>{window.RLAGameView.startMatch({mode:'classic',entryMode:'pass',playerCount:4,turnSeconds:120});});
 await page.locator('.rla-board-mesh').waitFor();await page.locator('.rla-pawn-img[data-mesh=true]').first().waitFor();
 assert.equal(await page.locator('.rla-pawn-img[data-mesh=true]').count(),16);
 assert.equal(await page.locator('.rla-dice-mesh').count(),4);
 const info=await page.evaluate(()=>{const b=document.querySelector('.rla-board-mesh'),f=b.getBoundingClientRect(),s=document.querySelector('.rla-board-surface').getBoundingClientRect(),p=b.getContext('2d').getImageData(384,384,1,1).data;return {inset:(s.left-f.left)/f.width,grid:s.width/f.width,opaque:p[3],overflow:document.documentElement.scrollWidth>innerWidth+1};});
 assert.ok(Math.abs(info.inset-.0875)<.005);assert.ok(Math.abs(info.grid-.825)<.005);assert.equal(info.opaque,255);assert.equal(info.overflow,false);
 // Exercise actual roll control and legal token move. Force only RNG in the browser fixture, never production code.
 await page.evaluate(()=>{Math.random=()=>.99999;});
 const dice=page.locator('.rla-dice-btn.ready');await dice.click();await page.locator('.rla-pawn-btn.movable').first().waitFor();
 assert.equal(await page.locator('.rla-dice-mesh[data-dice-face="6"]').count(),4);
 await page.locator('.rla-pawn-btn.movable').first().click();await page.waitForFunction(()=>!document.querySelector('.rla-pawn-btn.hopping')&&document.querySelector('.rla-dice-btn.ready'));
 const snap=await page.evaluate(()=>window.RLAState.loadActiveMatch());assert.equal(snap.players[0].tokens.filter(t=>t.progress===0).length,1);assert.equal(snap.phase,'roll');
 await page.screenshot({path:'reports/ludo-3d/'+width+'x'+height+'.png',fullPage:true});
 assert.deepEqual(errors,[]);results.push({width,height,...info,meshPawns:16,dice:4,legalMove:true,cacheSize:await page.evaluate(()=>window.RLA3D.cacheSize())});
 await ctx.close();
 }
 await writeFile('reports/ludo-3d/report.json',JSON.stringify({sha:process.env.GITHUB_SHA,browser:browser.version(),results},null,2));console.log('RLA_3D_QA '+JSON.stringify(results));
}finally{await browser?.close();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
