import * as THREE from 'three';
import {createTourBusScene,TOUR_VIEWS,TOUR_WORLDS} from './tour-bus.js';
import {PAINTS} from './career.js';
import './tour-bus.css';

export function createTourBus({container,templates,frontEnd,tracks}){
 const hub=createTourBusScene();let station='hangar',world='necros',lastTime=null,craftKey='',owned=[];
 const anchors=[
  {id:'workshop',label:'01 · SERVICE BAY',at:[4,3.2,4]},
  {id:'briefing',label:'02 · BRIEFING',at:[12,3.7,-15]},
  {id:'lounge',label:'03 · PILOTS’ LOUNGE',at:[-14,2.7,14]},
  {id:'observation',label:'04 · OBSERVATION',at:[0,4,-27]},
 ];
 container.innerHTML=`<div class="bus-heading"><p>INTERSTELLAR CHAMPIONSHIP CARRIER</p><h2>THE TOUR BUS</h2></div>
 <div class="bus-hotspots" aria-label="Destinations aboard the carrier"></div>
 <aside class="bus-panel"><p class="bus-kicker" id="bus-deck"></p><h3 id="bus-station"></h3><div id="bus-content"></div></aside>
 <nav class="bus-nav" aria-label="Carrier stations">${Object.entries(TOUR_VIEWS).map(([id,v])=>`<button type="button" data-station="${id}">${v.title}</button>`).join('')}</nav>`;
 const $=s=>container.querySelector(s);
 const hotspotRoot=$('.bus-hotspots');
 for(const anchor of anchors){const b=document.createElement('button');b.type='button';b.className='bus-hotspot';b.textContent=anchor.label;b.addEventListener('click',()=>go(anchor.id));anchor.button=b;hotspotRoot.append(b);}
 container.querySelectorAll('[data-station]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.station)));
 function draw(){
  $('#bus-deck').textContent=TOUR_VIEWS[station].subtitle;
  $('#bus-station').textContent=TOUR_VIEWS[station].title;
  container.querySelectorAll('[data-station]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.station===station)));
  const content=$('#bus-content');content.replaceChildren();
  const text=s=>{const p=document.createElement('p');p.textContent=s;content.append(p);};
  const button=(label,action,disabled=false)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=disabled;b.addEventListener('click',action);content.append(b);return b;};
  if(station==='hangar'){text('Your ship is ready. Prepare in the service bay, consult the briefing table or take a moment above the world below.');button('PREPARE YOUR CRAFT →',()=>go('workshop'));button('DESTINATION BRIEFING →',()=>go('briefing'));}
  if(station==='workshop'){text('Your equipped craft, finish and performance modules travel with you.');button('OPEN GARAGE →',()=>frontEnd.show('garage'));button('READY FOR DEPARTURE →',()=>go('briefing'));}
  if(station==='briefing'){
   text('SELECT ORBITAL DESTINATION');
   for(const [id,v] of Object.entries(TOUR_WORLDS)){const b=button(`${id==='necros'?'01':'02'} / ${v.title}`,()=>{world=id;hub.setWorld(id);draw();$(`[data-world="${id}"]`).focus();});b.setAttribute('aria-pressed',String(world===id));b.dataset.world=id;}
   text(TOUR_WORLDS[world].description);
   const available=world==='vitrum'?!!tracks.track18:!!tracks['custom-e7ead7a3-b303-4c3d-9464-ca52f28e8386']?.custom;
   text(world==='necros'?'Dark PRIME · Campaign event':'Neural Ascent · Open race / garage loadout');
   if(!available)text('Dark PRIME is not saved in this browser. Import your authored track library to depart for Necros.');
   const b=button(`DEPART · ${TOUR_WORLDS[world].track} →`,()=>frontEnd.depart(world),!available);b.id='bus-depart';
   button('VIEW PLANET →',()=>go('observation'));
  }
  if(station==='observation'){text(`IN ORBIT / ${TOUR_WORLDS[world].title}`);text(TOUR_WORLDS[world].description);button('RETURN TO BRIEFING →',()=>go('briefing'));}
  if(station==='lounge'){
   text('Four civilisations. One remaining chance.');
   const voices={Necken:'We have transcended death itself.', 'Vitrum Lithofyter':'Every root carries a memory. Every crystal carries a thought.', 'The Collective':'We have calculated 17 trillion possible outcomes.', 'Viruz-Tech':'All matter shall become our host.'};
   const quote=document.createElement('p');quote.className='bus-quote';quote.setAttribute('aria-live','polite');
   for(const [name,line] of Object.entries(voices))button(name,()=>{quote.textContent=`${name} — “${line}”`;});
   content.append(quote);text('Transmissions from the delegations.');
  }
 }
 function go(id){station=id;hub.setView(id);draw();$(`[data-station="${id}"]`).focus({preventScroll:true});}
 function syncCraft(){
  const p=frontEnd.profile,key=`${p.ship}:${p.paint}`;if(key===craftKey)return;craftKey=key;
  owned.forEach(m=>m.dispose());owned=[];hub.ship.clear();
  const paint=PAINTS.find(x=>x.id===p.paint)?.color;
  for(const source of (templates[p.ship]??templates.racer).children){
   if(source.isLight||source.name==='vehicleUnderglow')continue;
   const copy=source.clone(true);copy.traverse(o=>{if(o.isMesh){const arr=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{const c=m.clone();if(paint&&c.color)c.color.multiply(new THREE.Color(paint));owned.push(c);return c;});o.material=Array.isArray(o.material)?arr:arr[0];}});hub.ship.add(copy);
  }
 }
 draw();
 return {hub,render(renderer,time,motion,drawScene){
  hub.loadAssets();
  syncCraft();const dt=lastTime===null?0:Math.min(.05,Math.max(0,time-lastTime));lastTime=time;
  hub.camera.aspect=window.innerWidth/window.innerHeight;hub.camera.updateProjectionMatrix();hub.update(dt,motion);
  drawScene(hub.scene,hub.camera);
  for(const anchor of anchors){const p=new THREE.Vector3(...anchor.at).project(hub.camera);const visible=station==='hangar'&&p.z>-1&&p.z<1&&Math.abs(p.x)<.94&&Math.abs(p.y)<.75;anchor.button.hidden=!visible;if(visible){anchor.button.style.left=`${(p.x*.5+.5)*100}%`;anchor.button.style.top=`${(-p.y*.5+.5)*100}%`;}}
 },dispose(){owned.forEach(m=>m.dispose());hub.dispose();container.replaceChildren();}};
}
