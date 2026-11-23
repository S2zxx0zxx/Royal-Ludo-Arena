/**
 * Royal Ludo Arena — additional user-approved artwork & semantic interactions.
 * Copyright: original artwork supplied by the project owner.
 * Source images deliberately stay immutable. Data shown inside the artwork is illustrative.
 * No network/payment/matchmaking integration is represented as live.
 */
const RLA = (() => {
  const ROUTES = Object.freeze({
    events: {label:'Events',file:'events',width:922,height:1536},
    profile: {label:'My Profile',file:'profile',width:922,height:1536},
    store: {label:'Store',file:'store',width:864,height:1536},
    'store-compact': {label:'Store — Compact',file:'store-compact',width:1404,height:1536},
    'daily-goals': {label:'Daily Goals',file:'daily-goals',width:1404,height:1536},
    'send-gift': {label:'Send Gift',file:'send-gift',width:1404,height:1536},
  });
  const HOME_RECT=[921,1536];
  const fromHash=()=>decodeURIComponent(location.hash.slice(1).split('?')[0]);
  const root=()=>document.getElementById('app');
  const prefKey='rla.ui.profile.v1';
  const initial={screen:'',notice:'',dialog:'',currentGift:'',mode:'coins',draft:{name:'Satzzxzxx',bio:'Play • Win • Repeat!'},options:{},view:'standard'};
  const state=structuredClone(initial);
  try { const data=JSON.parse(localStorage.getItem(prefKey)||'null');if(data&&typeof data.name==='string'&&typeof data.bio==='string'){state.draft.name=data.name.slice(0,22);state.draft.bio=data.bio.slice(0,70)}}catch{}
  /** Rectangles are measured in original image pixels: [left,top,width,height]. */
  const btn=(id,label,rect,action,data={})=>({id,label,rect,action,...data});
  const HOME=[
    btn('profile','Player profile',[16,10,118,114],'route',{to:'profile'}),
    btn('settings','Settings',[138,15,72,85],'info',{message:'Settings panel is not part of the approved artwork yet.'}),
    btn('messages','Messages',[216,13,89,91],'info',{message:'Messages need a server-backed inbox; not available in this UI preview.'}),
    btn('diamonds','Diamond store',[300,12,238,89],'route',{to:'store'}),
    btn('coins','Coin store',[550,12,257,89],'route',{to:'store'}),
    btn('shop','Open store',[825,10,85,102],'route',{to:'store'}),
    btn('vip','VIP access',[772,120,132,135],'info',{message:'VIP membership and payments are not active.'}),
    btn('daily-reward','Daily Reward',[777,264,115,130],'route',{to:'events'}),
    btn('missions','Missions and Daily Goals',[777,396,115,116],'route',{to:'daily-goals'}),
    btn('leaderboard','Leaderboard',[783,535,109,119],'info',{message:'A real leaderboard requires completed game results and ranking services.'}),
    btn('starter','Starter Pack',[16,183,155,209],'route',{to:'store'}),
    btn('events-left','Events',[22,400,130,128],'route',{to:'events'}),
    btn('watch','Watch and Earn',[12,540,137,131],'info',{message:'Rewarded ads are not integrated. No reward is issued.'}),
    btn('lucky','Lucky Spin',[34,1156,139,167],'info',{message:'Lucky Spin feature is awaiting its rules and award ledger.'}),
    btn('tournaments','Tournaments',[300,1130,320,157],'route',{to:'events'}),
    btn('season-reward','Season Reward',[245,1280,430,118],'route',{to:'events'}),
    btn('free-coins','Free Coins',[753,1141,154,181],'route',{to:'store'}),
    btn('nav-events','Events tab',[181,1405,151,123],'route',{to:'events'}),
    btn('nav-club','Club tab',[343,1405,150,123],'info',{message:'Club UI design is not yet approved.'}),
    btn('nav-inventory','Inventory tab',[505,1405,155,123],'info',{message:'Inventory screen artwork has not been provided yet.'}),
    btn('nav-social','Social tab',[669,1405,157,123],'info',{message:'Social features require a separate UI and friend system.'}),
    btn('nav-more','More tab',[828,1405,86,123],'info',{message:'More menu has not been designed yet.'})
  ];
  const COMMON=[
    btn('header-profile','Player profile',[17,10,112,108],'route',{to:'profile'}),
    btn('header-diamonds','Diamonds',[304,6,246,100],'route',{to:'store'}),
    btn('header-coins','Coins',[564,6,256,100],'route',{to:'store'}),
    btn('header-shop','Store',[824,5,94,106],'route',{to:'store'}),
    btn('header-help','Help',[809,130,102,111],'info',{message:'Rules and help content for this section are pending.'}),
  ];
  const NAV=(width,height,y)=>[
    btn('nav-home','Home',[0,y,width/6,height-y],'route',{to:'home'}),
    btn('nav-events','Events',[width/6,y,width/6,height-y],'route',{to:'events'}),
    btn('nav-club','Club',[width*2/6,y,width/6,height-y],'info',{message:'Club screen is not yet approved.'}),
    btn('nav-inventory','Inventory',[width*3/6,y,width/6,height-y],'info',{message:'Inventory screen is not yet approved.'}),
    btn('nav-social','Social',[width*4/6,y,width/6,height-y],'info',{message:'Social screen is not yet approved.'}),
    btn('nav-more','More',[width*5/6,y,width/6,height-y],'info',{message:'More screen is not yet approved.'}),
  ];
  const HITS={
    events:[
      btn('back','Back',[20,112,118,129],'route',{to:'home'}),
      ...COMMON,
      btn('season','Season pass',[24,366,880,253],'info',{message:'Season Pass feature awaits its rewards specification.'}),
      btn('goals','Daily Goals',[24,641,877,212],'route',{to:'daily-goals'}),
      btn('bonus','Daily Bonus',[25,872,877,212],'info',{message:'Daily Bonus rewards and a secure claim ledger are not implemented.'}),
      btn('tour','Tournaments',[24,1104,877,226],'info',{message:'Tournament entry requires a rules and matchmaking service.'}),
      ...NAV(922,1536,1365)
    ],
    profile:[
      btn('back','Back',[18,116,118,116],'route',{to:'home'}),
      ...COMMON,
      btn('avatar-edit','Edit avatar',[192,434,89,72],'edit'),
      btn('copy-id','Copy player ID',[469,337,65,55],'copy',{value:'RL782346'}),
      btn('bio-edit','Edit status',[289,382,342,68],'edit'),
      btn('edit','Edit Profile',[258,1244,415,118],'edit'),
      btn('level','Level progress',[80,527,760,104],'info',{message:'Level XP shown here is sample artwork, not live account data.'}),
      btn('coins','View coin store',[309,447,230,83],'route',{to:'store'}),
      btn('diamonds','View diamond store',[559,447,235,83],'route',{to:'store'}),
      btn('stats','Game statistics',[26,654,874,356],'info',{message:'Statistics in this design are illustrative. Live statistics require recorded matches.'}),
      btn('save-data','Save Data',[49,1020,233,93],'info',{message:'Local profile preferences are saved on this device. Cloud account backup is not yet connected.'}),
      btn('change-device','Change device',[315,1020,264,93],'info',{message:'Account transfer is unavailable until authentication and cloud save are implemented.'}),
      btn('referral','Referral rewards',[605,1020,269,93],'info',{message:'Referral and reward attribution are not implemented.'}),
      btn('google','Google sign in',[51,1123,265,97],'info',{message:'Google Sign-In is not connected in this UI build.'}),
      btn('facebook','Facebook sign in',[317,1123,286,97],'info',{message:'Facebook login is not connected in this UI build.'}),
      btn('play-games','Play Games login',[614,1123,262,97],'info',{message:'Google Play Games Services are not connected.'}),
      ...NAV(922,1536,1382)
    ],
    store:[
      btn('back','Back',[12,21,86,96],'route',{to:'home'}),
      btn('tab-coins','Coins tab',[18,132,283,117],'mode',{value:'coins'}),
      btn('tab-diamonds','Diamonds tab',[298,133,281,119],'mode',{value:'diamonds'}),
      btn('tab-offers','Offers tab',[576,133,280,118],'mode',{value:'offers'}),
      btn('promo','Royal Coin Bundle',[20,265,818,359],'purchase',{value:'Royal Coin Bundle — ₹480.00'}),
      btn('pass','Pass benefits',[65,622,735,68],'info',{message:'Royal Pass discounts shown in concept art are not active.'}),
      btn('pack-25k','25,000 Coins',[36,712,385,252],'purchase',{value:'25,000 Coins — ₹100.00'}),
      btn('pack-100k','100,000 Coins',[434,712,391,252],'purchase',{value:'100,000 Coins — ₹180.00'}),
      btn('pack-500k','500,000 Coins',[36,966,385,253],'purchase',{value:'500,000 Coins — ₹480.00'}),
      btn('pack-1m','1,000,000 Coins',[434,966,391,253],'purchase',{value:'1,000,000 Coins — ₹690.00'}),
      btn('pack-5m','5,000,000 Coins',[36,1222,385,260],'purchase',{value:'5,000,000 Coins — ₹1,800.00'}),
      btn('pack-10m','10,000,000 Coins',[434,1222,391,260],'purchase',{value:'10,000,000 Coins — ₹3,000.00'}),
    ],
    'store-compact':[
      btn('back','Back',[24,18,116,111],'route',{to:'home'}),
      btn('coins','Coins tab',[60,166,393,135],'route',{to:'store'}),
      btn('diamonds','Diamonds tab',[471,166,397,136],'mode',{value:'diamonds'}),
      btn('offers','Offers tab',[891,166,430,136],'mode',{value:'offers'}),
      btn('coin-bundle','Coin Bundle',[44,314,1323,298],'purchase',{value:'Coin Bundle — illustrative promotion'}),
      btn('pack1','25,000 Coins',[40,616,437,290],'purchase',{value:'25,000 Coins — ₹100.00'}),
      btn('pack2','100,000 Coins',[485,616,434,290],'purchase',{value:'100,000 Coins — ₹180.00'}),
      btn('pack3','500,000 Coins',[930,616,432,290],'purchase',{value:'500,000 Coins — ₹480.00'}),
      btn('pack4','1,000,000 Coins',[40,930,437,277],'purchase',{value:'1,000,000 Coins — ₹690.00'}),
      btn('pack5','5,000,000 Coins',[485,930,434,277],'purchase',{value:'5,000,000 Coins — ₹1,800.00'}),
      btn('pack6','10,000,000 Coins',[930,930,432,277],'purchase',{value:'10,000,000 Coins — ₹3,000.00'}),
    ],
    'daily-goals':[
      btn('close','Close Daily Goals',[1194,109,145,126],'route',{to:'events'}),
      btn('play-3','Play 3 Games',[1004,547,230,110],'route',{to:'online'}),
      btn('win-1','Win a Game',[1005,669,230,109],'route',{to:'online'}),
      btn('invite','Invite a Friend',[1005,791,230,110],'route',{to:'friends'}),
      btn('claimed-ad','Claimed Ad Reward',[1005,915,230,104],'info',{message:'Claimed is a sample UI state. No diamonds were awarded.'}),
      btn('claimed-login','Claimed Login Reward',[1005,1033,230,108],'info',{message:'Claimed is a sample UI state. No coins were awarded.'}),
      btn('claim-all','Claim All',[403,1192,599,170],'info',{message:'Daily rewards are UI illustrations only; no reward issuance is connected.'}),
    ],
    'send-gift':[
      btn('close','Close Send Gift',[1229,116,141,131],'route',{to:'store'}),
      btn('king-pass','Send King Pass',[949,312,299,179],'gift',{value:'King Pass — ₹599.00'}),
      btn('gift-25k','Gift 25,000 coins',[81,663,392,249],'gift',{value:'25,000 Coins — ₹100.00'}),
      btn('gift-100k','Gift 100,000 coins',[489,663,417,249],'gift',{value:'100,000 Coins — ₹180.00'}),
      btn('gift-10m','Gift 10,000,000 coins',[920,663,434,249],'gift',{value:'10,000,000 Coins — ₹3,000.00'}),
      btn('gift-100d','Gift 100 diamonds',[82,923,395,247],'gift',{value:'100 Diamonds — ₹79.00'}),
      btn('gift-2kd','Gift 2,000 diamonds',[488,923,417,247],'gift',{value:'2,000 Diamonds — ₹999.00'}),
      btn('gift-12kd','Gift 12,500 diamonds',[922,923,428,247],'gift',{value:'12,500 Diamonds — ₹3,999.00'}),
    ],
  };
  const overlay=(hit,frame)=>{
    const el=document.createElement('button');el.type='button';el.className='rla-hit';el.dataset.action=hit.id;
    el.title=hit.label;el.setAttribute('aria-label',hit.label);
    const [x,y,w,h]=hit.rect;let ww=frame[0],hh=frame[1];
    el.style.cssText=`left:${(x/ww*100).toFixed(4)}%;top:${(y/hh*100).toFixed(4)}%;width:${(w/ww*100).toFixed(4)}%;height:${(h/hh*100).toFixed(4)}%;`;
    el.addEventListener('click',(event)=>{event.preventDefault();apply(hit)});
    return el;
  };
  const escapeHtml=(s)=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function modal(title,body,actions=[]){
    document.getElementById('rla-dialog')?.remove();
    const veil=document.createElement('div');veil.id='rla-dialog';veil.className='rla-dialog-veil';
    const card=document.createElement('section');card.className='rla-dialog';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label',title);
    card.innerHTML=`<header class="rla-dialog-title">${escapeHtml(title)}<button class="rla-dialog-x" aria-label="Close dialog">×</button></header><div class="rla-dialog-body">${escapeHtml(body)}</div><footer></footer>`;
    const foot=card.querySelector('footer');
    for(const [label,run] of actions){const b=document.createElement('button');b.className='rla-dialog-action';b.textContent=label;b.addEventListener('click',()=>{veil.remove();run()});foot?.append(b)}
    if(!actions.length){const b=document.createElement('button');b.className='rla-dialog-action';b.textContent='OK';b.addEventListener('click',()=>veil.remove());foot?.append(b)}
    card.querySelector('.rla-dialog-x')?.addEventListener('click',()=>veil.remove());veil.addEventListener('click',e=>{if(e.target===veil)veil.remove()});
    const esc=e=>{if(e.key==='Escape'){veil.remove();document.removeEventListener('keydown',esc)}};document.addEventListener('keydown',esc);
    veil.append(card);document.body.append(veil);card.querySelector('button')?.focus();
  }
  function edit(){document.getElementById('rla-dialog')?.remove();const veil=document.createElement('div');veil.id='rla-dialog';veil.className='rla-dialog-veil';
    const card=document.createElement('form');card.className='rla-dialog';card.setAttribute('aria-label','Edit Profile');
    card.innerHTML='<header class="rla-dialog-title">EDIT PROFILE<button class="rla-dialog-x" type="button" aria-label="Close dialog">×</button></header><label>Display Name <input name="name" maxlength="22" autocomplete="off" required></label><label>Status <textarea name="bio" maxlength="70" rows="3"></textarea></label><p class="rla-hint">Local UI preference only. This does not change a network account.</p><footer><button class="rla-dialog-action" type="submit">Save Changes</button></footer>';
    card.elements.namedItem('name').value=state.draft.name;card.elements.namedItem('bio').value=state.draft.bio;
    card.addEventListener('submit',e=>{e.preventDefault();const name=card.elements.namedItem('name').value.trim(),bio=card.elements.namedItem('bio').value.trim();if(!name)return;state.draft={name:name.slice(0,22),bio:bio.slice(0,70)};try{localStorage.setItem(prefKey,JSON.stringify(state.draft))}catch{}veil.remove();draw();modal('Profile saved','Display name and status have been saved locally on this device.')});
    card.querySelector('.rla-dialog-x').addEventListener('click',()=>veil.remove());veil.append(card);document.body.append(veil);card.elements.namedItem('name').focus();
  }
  function go(to){const old=location.hash.slice(1);if(old===to){draw()}else location.hash=to;}
  function apply(hit){switch(hit.action){
    case 'route': go(hit.to);break;
    case 'info':modal(hit.label,hit.message);break;
    case 'edit':edit();break;
    case 'copy':modal('Example ID', 'The ID shown in concept artwork is sample data. A real copyable Player ID requires player account creation.');break;
    case 'mode':state.mode=hit.value;draw();break;
    case 'purchase':modal('Store Preview',`${hit.value}. Prices are design samples; purchases are disabled until a Play Billing integration and product verification are complete.`);break;
    case 'gift':modal('Gift Preview',`${hit.value}. Sending gifts is not available until a friend recipient, secure checkout and fulfillment are implemented.`);break;
  }}
  function renderFallback(section,route){
    const data={events:[['Season Pass','Coming soon'],['Daily Goals','daily-goals'],['Daily Bonus','Coming soon'],['Tournaments','Coming soon']],profile:[['Player','Edit Profile'],['Game Statistics','Sample numbers'],['Save Data','Local only']],store:[['Coins','coins'],['Diamonds','diamonds'],['Offers','offers']],'daily-goals':[['Play 3 Games','online'],['Win 1 Game','online'],['Invite 1 Friend','friends'],['Claim All','Not connected']],'send-gift':[['King Pass','Not connected'],['Coins','Not connected'],['Diamonds','Not connected']]};
    const title=document.createElement('h1');title.textContent=ROUTES[route].label;section.append(title);
    for(const [name,desc] of data[route]||[['Store','store']]){const btn=document.createElement('button');btn.className='rla-fallback-control';btn.textContent=`${name} · ${desc}`;btn.addEventListener('click',()=>{if(ROUTES[desc]||['home','online','team','friends'].includes(desc))go(desc);else modal(name,'This feature is a frontend preview, not a live game service.')});section.append(btn)}
  }
  function drawExtended(route){const data=ROUTES[route];const stage=document.createElement('section');stage.className='rla-extended-stage';stage.setAttribute('aria-label',data.label);stage.style.setProperty('--art-ratio',`${data.width}/${data.height}`);stage.style.setProperty('--stage-bg','#351809');
    const img=document.createElement('img');img.className='rla-source-art';img.src=`./assets/screens/${data.file}.jpg`;img.alt='';img.draggable=false;
    img.onerror=()=>{stage.classList.add('rla-art-unavailable');renderFallback(stage,route)};
    stage.append(img);for(const hit of HITS[route])stage.append(overlay(hit,[data.width,data.height]));
    if(route==='profile'&&(state.draft.name!=='Satzzxzxx'||state.draft.bio!=='Play • Win • Repeat!')){
      const tag=document.createElement('div');tag.className='rla-live-profile';tag.textContent=state.draft.name+' · '+state.draft.bio;stage.append(tag);
    }
    if(route==='store'||route==='store-compact'){
      const area=document.createElement('div');area.className='rla-preview-label';area.textContent='Design preview · Prices not live';stage.append(area);
      if(state.mode!=='coins'){
        const panel=document.createElement('section');panel.className='rla-tab-panel';panel.setAttribute('aria-label',`${state.mode} store panel`);
        const title=document.createElement('h2');title.textContent=state.mode==='diamonds'?'Diamond Store':'Royal Offers';panel.append(title);
        const note=document.createElement('p');note.textContent='The approved original artwork for this tab has not been provided. Product checkout is unavailable.';panel.append(note);
        const list=state.mode==='diamonds'?[['100 Diamonds','₹79'],['500 Diamonds','₹329'],['2,000 Diamonds','₹999']]:[['Special Bundles','Preview only'],['Royal Pass Benefits','Not available']];
        for(const [p,price] of list){const button=document.createElement('button');button.textContent=`${p} · ${price}`;button.addEventListener('click',()=>modal('Store preview','Purchases are not connected.'));panel.append(button)}if(state.mode==='offers'){const gift=document.createElement('button');gift.textContent='Open Send Gift';gift.addEventListener('click',()=>go('send-gift'));panel.append(gift)}stage.append(panel);
      }
    }
    return stage;
  }
  function enhanceHome(){const stage=root()?.querySelector('.artboard');if(!stage)return;stage.querySelectorAll('.rla-home-hit').forEach(el=>el.remove());
    for(const hit of HOME){const b=overlay(hit,HOME_RECT);b.classList.add('rla-home-hit');stage.append(b)}
  }
  function enhanceOldScreens(route){const stage=root()?.querySelector('.artboard');if(!stage)return;stage.querySelectorAll('.rla-home-hit').forEach(el=>el.remove());
    if(route!=='home'&&['online','team','friends','computer','pass'].includes(route)){
      const h=[...COMMON,btn('header-back','Back to home',[18,128,116,116],'route',{to:'home'})];for(const hit of h){const b=overlay(hit,HOME_RECT);b.classList.add('rla-home-hit');stage.append(b)}
    }
  }
  function draw(){const route=fromHash();if(!root())return;
    if(ROUTES[route]){
      const main=document.createElement('div');main.className='rla-extra-shell';main.append(drawExtended(route));root().replaceChildren(main);document.title=`${ROUTES[route].label} — Royal Ludo Arena`;return;
    }
    if(route==='home'||route==='')enhanceHome();else enhanceOldScreens(route);
  }
  window.addEventListener('hashchange',()=>queueMicrotask(draw));
  window.addEventListener('DOMContentLoaded',draw);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&ROUTES[fromHash()]&&!document.getElementById('rla-dialog'))go('home')});
  queueMicrotask(draw);
  return {routes:Object.keys(ROUTES),go,draw,inspect:()=>({routes:ROUTES,hits:HITS,home:HOME})};
})();
