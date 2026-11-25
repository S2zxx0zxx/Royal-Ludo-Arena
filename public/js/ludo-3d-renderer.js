/* Orthographic CPU mesh renderer. No WebGL requirement, no network, no RAF loop.
 * Model graphics are cached at bounded resolution; canonical LudoCore owns all rules. */
(function(g){
'use strict';
const PAWNS=Object.freeze({red:'#b82d30',green:'#287c49',blue:'#2467a4',yellow:'#d5a22b'});
const THEMES={
 'royal-walnut':['#432615','#79502e','#c6a46b','#eee0bd','#9b713b'],
 'emerald-palace':['#163e2c','#315d44','#a5bb89','#e7e8cf','#819b68'],
 'midnight-gold':['#201d26','#45414d','#c5a464','#ede1bb','#917340']
};
const SKINS={'classic-ivory':['#f1e4c7','#302318'],'royal-gold':['#dbb04e','#65251d'],'ruby-crimson':['#b52a39','#fff0c9']};
const CAMERA=Object.freeze({boardInset:.0875,boardThickness:.6/20.4,boardTilt:Math.PI/8,meshYaw:-.24,diceTilt:.28,pawnTilt:1.05,key:[-.48,.82,.30]});
const cached=new Map(),boards=new Map();
const norm=v=>Math.hypot(...v)||1;
const unit=v=>v.map(x=>x/norm(v));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
const light=unit(CAMERA.key);
function shade(hex,f){const s=parseInt(hex.slice(1),16);return 'rgb('+[s>>16,(s>>8)&255,s&255].map(v=>Math.max(0,Math.min(255,Math.round(v*f)))).join(',')+')';}
function rotate(v,axis,angle){const [x,y,z]=v,c=Math.cos(angle),s=Math.sin(angle);return axis==='x'?[x,c*y-s*z,s*y+c*z]:axis==='z'?[c*x-s*y,s*x+c*y,z]:[c*x+s*z,y,-s*x+c*z];}
const faceRot={1:['x',0],2:['x',-Math.PI/2],3:['z',Math.PI/2],4:['x',Math.PI/2],5:['z',-Math.PI/2],6:['x',Math.PI]};
function orientDice(v,n){const [axis,a]=faceRot[n]||faceRot[6];return rotate(v,axis,a);}
function camera(v,tilt,yaw){const [x,y,z]=rotate(v,'y',yaw);return [x,z*Math.cos(tilt)-y*Math.sin(tilt),y*Math.cos(tilt)+z*Math.sin(tilt)];}
function makeCanvas(n){const c=document.createElement('canvas');c.width=c.height=n;const ctx=c.getContext('2d',{alpha:true});if(!ctx)throw Error('Canvas unavailable');return [c,ctx];}
function polygon(ctx,pts,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.closePath();ctx.fill();}
function drawMesh(ctx,mesh,vertices,tilt,yaw,palette,size){
 const view=vertices.map(v=>camera(v,tilt,yaw));const minX=Math.min(...view.map(v=>v[0])),maxX=Math.max(...view.map(v=>v[0])),minY=Math.min(...view.map(v=>v[1])),maxY=Math.max(...view.map(v=>v[1]));
 const scale=size*.83/Math.max(maxX-minX,maxY-minY);const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
 const faces=mesh.faces.map(f=>{const [a,b,c]=f.indices;const n=unit(cross(sub(vertices[b],vertices[a]),sub(vertices[c],vertices[a])));return {pts:f.indices.map(i=>[(view[i][0]-cx)*scale+size/2,(view[i][1]-cy)*scale+size/2]),depth:(view[a][2]+view[b][2]+view[c][2])/3,n,pip:f.pip};}).sort((a,b)=>a.depth-b.depth);
 for(const f of faces){const lit=.62+.43*Math.max(0,dot(f.n,light));polygon(ctx,f.pts,shade(palette[f.pip?1:0],lit));}
}
function modelUrl(kind,key,face=1,frame=-1){
 const cacheKey=kind+':'+key+':'+face+':'+frame;if(cached.has(cacheKey))return cached.get(cacheKey);
 if(!g.RLAModelMeshes)return null;
 try{const size=128,[c,ctx]=makeCanvas(size),mesh=g.RLAModelMeshes[kind];
 const isDice=kind==='dice';const palette=isDice?(SKINS[key]||SKINS['classic-ivory']):[PAWNS[key]||PAWNS.red,'#fff'];
 let vertices=mesh.vertices.map(v=>isDice?orientDice(v,face):v);
 if(isDice&&frame>=0)vertices=vertices.map(v=>rotate(rotate(v,'x',frame*.93),'z',frame*.52));
 drawMesh(ctx,mesh,vertices,isDice?CAMERA.diceTilt:CAMERA.pawnTilt,CAMERA.meshYaw,palette,size);
 const url=c.toDataURL('image/png');if(!url.startsWith('data:image/png'))return null;if(cached.size>=48)cached.delete(cached.keys().next().value);cached.set(cacheKey,url);return url;
 }catch{return null;}
}
// The supplied 20.4 x 20.4 source board is not a 15-cell engine board.
// Preserve source slab thickness ratio and voxel flat faces; reconstruct the
// top using canonical track, homes and yard coordinates rather than stretching art.
function layout(core){
 const map=new Map(),put=(r,c,type,color=null)=>map.set(r+','+c,{row:r,col:c,type,color});
 core.MAIN_TRACK.forEach(([r,c],i)=>{const color=Object.keys(core.START_INDEX).find(k=>core.START_INDEX[k]===i)||null;put(r,c,core.SAFE_TRACK_INDICES.has(i)?'safe':'track',color);});
 for(const color of core.COLORS)core.HOME_STRETCH[color].forEach(([r,c])=>put(r,c,'home',color));
 return [...map.values()];
}
function boardCanvas(theme){
 const key=THEMES[theme]?theme:'royal-walnut';if(boards.has(key))return boards.get(key);
 const [c,ctx]=makeCanvas(768),s=c.width,m=s*CAMERA.boardInset,cell=(s-2*m)/15;
 const [wood,edge,gold,cream,line]=THEMES[key],core=g.LudoCore;if(!core)throw Error('LudoCore unavailable');
 // Orthographic board plane: x maps to x, z compensated for camera tilt.
 // Slab bottom is displaced along projected y; top stays exactly 82.5% square.
 const depth=s*CAMERA.boardThickness*Math.tan(CAMERA.boardTilt);
 const b=m*.36,e=s-b,top=e-depth;
 ctx.fillStyle='#21140d';ctx.fillRect(0,0,s,s);
 polygon(ctx,[[b,b],[e,b],[e,top],[b,top]],wood);
 polygon(ctx,[[b,top],[e,top],[e,e],[b,e]],shade(edge,.60));
 ctx.fillStyle=edge;ctx.fillRect(b+3,b+3,e-b-6,top-b-6);
 ctx.strokeStyle=gold;ctx.lineWidth=3;ctx.strokeRect(b+5,b+5,e-b-10,top-b-10);
 ctx.fillStyle=wood;ctx.fillRect(m-5,m-5,15*cell+10,15*cell+10);
 const rect=(r,col,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(m+col*cell,m+r*cell,w*cell,h*cell);};
 const yards={red:[0,0],green:[0,9],blue:[9,0],yellow:[9,9]};
 for(const [color,[r,col]] of Object.entries(yards)){
  rect(r,col,6,6,shade(PAWNS[color],.80));rect(r+.48,col+.48,5.04,5.04,gold);rect(r+.57,col+.57,4.86,4.86,shade(cream,.98));
  for(const [yr,yc] of core.YARD_SLOTS[color]){
   const x=m+(yc+.5)*cell,y=m+(yr+.5)*cell;
   ctx.beginPath();ctx.arc(x,y,cell*.62,0,Math.PI*2);ctx.fillStyle=shade(PAWNS[color],.70);ctx.fill();
   ctx.beginPath();ctx.arc(x,y,cell*.47,0,Math.PI*2);ctx.fillStyle=shade(PAWNS[color],1.15);ctx.fill();
   ctx.strokeStyle=gold;ctx.lineWidth=1.5;ctx.stroke();
  }
 }
 const star=(x,y,r)=>{const pts=Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5;const d=i%2?r*.43:r;return [x+Math.cos(a)*d,y+Math.sin(a)*d];});polygon(ctx,pts,'#594223');};
 for(const {row:r,col,type,color} of layout(core)){
  rect(r,col,1,1,color?shade(PAWNS[color],1.10):cream);
  ctx.strokeStyle=line;ctx.lineWidth=1.35;ctx.strokeRect(m+col*cell,m+r*cell,cell,cell);
  if(type==='safe')star(m+(col+.5)*cell,m+(r+.5)*cell,cell*.30);
 }
 const p=(r,col)=>[m+col*cell,m+r*cell];const center=p(7.5,7.5);
 for(const [color,points] of Object.entries({red:[p(6,6),p(9,6),center],green:[p(6,6),p(6,9),center],yellow:[p(6,9),p(9,9),center],blue:[p(9,6),p(9,9),center]}))polygon(ctx,points,PAWNS[color]);
 ctx.strokeStyle=gold;ctx.lineWidth=2;ctx.strokeRect(m+6*cell,m+6*cell,3*cell,3*cell);
 // Draw home-stretch terminal squares after the center triangles (same engine coords).
 for(const color of core.COLORS){const [r,col]=core.HOME_STRETCH[color].at(-1);rect(r,col,1,1,shade(PAWNS[color],1.08));ctx.strokeStyle=gold;ctx.lineWidth=1.2;ctx.strokeRect(m+col*cell,m+r*cell,cell,cell);}
 boards.set(key,c);return c;
}
function attachBoard(frame,theme){
 if(!frame||!g.LudoCore)return false;
 try{const source=boardCanvas(theme),[c,ctx]=makeCanvas(source.width);ctx.drawImage(source,0,0);c.className='rla-board-mesh';c.setAttribute('aria-hidden','true');c.dataset.geometry='canonical-15x15';frame.querySelector('.rla-board-mesh')?.remove();frame.insertBefore(c,frame.querySelector('.rla-board-surface'));frame.classList.add('rla-mesh-ready');return true;}catch{return false;}
}
function diceHTML(value,skin,rolling){
 if(!Number.isInteger(value)||value<1||value>6)return null;
 const first=modelUrl('dice',skin,value);if(!first)return null;
 if(!rolling)return '<img class="rla-dice-mesh" data-dice-face="'+value+'" src="'+first+'" alt="" draggable="false">';
 const frames=Array.from({length:6},(_,i)=>modelUrl('dice',skin,1,i));if(frames.some(v=>!v))return null;
 return '<span class="rla-dice-mesh-roll" aria-hidden="true">'+frames.map((src,i)=>'<img class="rla-dice-mesh-frame" style="--frame:'+i+'" src="'+src+'" alt="" draggable="false">').join('')+'</span>';
}
g.RLA3D=Object.freeze({CAMERA,layout,orientDice,camera,attachBoard,diceHTML,pawnURL:color=>modelUrl('pawn',color),cacheSize:()=>cached.size});
})(typeof window!=='undefined'?window:globalThis);
