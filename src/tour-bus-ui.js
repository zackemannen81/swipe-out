import {BLOCKOUT_ROOMS} from './tour-blockout.js';
import {TOUR_CONNECTIONS} from './tour-bus-zones.js';
import {tourTrackKey,TOUR_DESTINATIONS} from './tour-destinations.js';
import {createTourCrew} from './tour-crew.js';
import * as THREE from 'three';
import {createTourBusScene,TOUR_VIEWS,TOUR_WORLDS,TOUR_ZONES} from './tour-bus.js';
import {PAINTS} from './career.js';
import './tour-bus.css';

export function createTourBus({container,templates,frontEnd,tracks}){
 const hub=createTourBusScene();let station=frontEnd.tourSession.state.station,world=frontEnd.tourSession.state.world,lastTime=null,craftKey='',owned=[];
 const history=[];
 const anchors=[]; // Navigation buttons represent inter-deck routes, not through-wall hotspots.
 container.innerHTML=`<div class="bus-transition" aria-hidden="true"><span></span></div><div class="bus-heading"><p>INTERSTELLAR CHAMPIONSHIP CARRIER</p><h2>THE TOUR BUS</h2></div>
 <div class="bus-hotspots" aria-label="Destinations aboard the carrier"></div>
 <aside class="bus-panel"><p class="bus-kicker" id="bus-deck"></p><h3 id="bus-station"></h3><div id="bus-content"></div></aside>
 <nav class="bus-nav" aria-label="Carrier stations">${Object.entries(TOUR_VIEWS).filter(([id])=>!BLOCKOUT_ROOMS.some(r=>r.station===id)).map(([id,v])=>`<button type="button" data-station="${id}">${v.title}</button>`).join('')}</nav>`;
 const $=s=>container.querySelector(s);
 const directory=document.createElement('select');directory.className='bus-directory';directory.setAttribute('aria-label','All carrier rooms');
 for(const [id,v] of Object.entries(TOUR_VIEWS)){const option=document.createElement('option');option.value=id;option.textContent=`${v.subtitle} · ${v.title}`;directory.append(option);}
 directory.addEventListener('change',()=>go(directory.value));container.append(directory);
 const crew=createTourCrew({container,frontEnd});
 const hotspotRoot=$('.bus-hotspots');
 for(const anchor of anchors){const b=document.createElement('button');b.type='button';b.className='bus-hotspot';b.textContent=anchor.label;b.addEventListener('click',()=>go(anchor.id));anchor.button=b;hotspotRoot.append(b);}
 container.querySelectorAll('[data-station]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.station)));
 function draw(){
  directory.value=station;
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
   for(const [index,[id,v]] of Object.entries(TOUR_WORLDS).entries()){const b=button(`${String(index+1).padStart(2,'0')} / ${v.title}`,()=>{world=id;hub.setWorld(id);frontEnd.tourSession.visit(station,world);draw();$(`[data-world="${id}"]`).focus();});b.setAttribute('aria-pressed',String(world===id));b.dataset.world=id;}
   text(TOUR_WORLDS[world].description);
   const key=tourTrackKey(world,tracks),entry=tracks[key];
   text(`${entry?.name??TOUR_WORLDS[world].track} · ${TOUR_DESTINATIONS[world].event}`);
   text('PLAYABLE PREVIEW · Environment and track are still in development.');
   if(!entry)text('This destination is not available in the track library.');
   const b=button(`DEPART · ${entry?.name??TOUR_WORLDS[world].track} →`,()=>frontEnd.depart(world),!entry);b.id='bus-depart';
   button('VIEW PLANET →',()=>go('observation'));
  }
  if(station==='observation'){text(`IN ORBIT / ${TOUR_WORLDS[world].title}`);text(TOUR_WORLDS[world].description);button('RETURN TO BRIEFING →',()=>go('briefing'));}
  const blockout=BLOCKOUT_ROOMS.find(r=>r.station===station);
  if(blockout){text(blockout.description);text('CREW ACCESS · Interior services are being prepared.');
   const zone=TOUR_VIEWS[station].zoneId;
   for(const c of TOUR_CONNECTIONS.filter(c=>c.from===zone||c.to===zone)){
    const next=c.from===zone?c.to:c.from,v=Object.entries(TOUR_VIEWS).find(([,v])=>v.zoneId===next);
    if(v)button(`${c.label} → ${v[1].title}`,()=>go(v[0]));
   }
  }
  if(station==='lounge'){
   text('Four civilisations. One remaining chance.');
   const voices={Necken:'We have transcended death itself.', 'Vitrum Lithofyter':'Every root carries a memory. Every crystal carries a thought.', 'The Collective':'We have calculated 17 trillion possible outcomes.', 'Viruz-Tech':'All matter shall become our host.'};
   const quote=document.createElement('p');quote.className='bus-quote';quote.setAttribute('aria-live','polite');
   for(const [name,line] of Object.entries(voices))button(name,()=>{quote.textContent=`${name} — “${line}”`;});
   content.append(quote);text('Transmissions from the delegations.');
  }
 }
 function go(id,remember=true){
  if(frontEnd.workshopTransition)return;
  if(frontEnd.isBusGarage)frontEnd.show('bus');
  if(id===station||!hub.setView(id))return;
  if(remember)history.push(station);
  directory.disabled=true;container.setAttribute('aria-busy','true');
  $('.bus-panel').hidden=true;
  $('.bus-transition span').textContent=hub.navigation.route.map(zone=>TOUR_ZONES[zone].name).join(' → ');
  container.querySelectorAll('[data-station]').forEach(b=>b.disabled=true);
 }
 function back(){
  if(crew.back())return true;
  if(hub.navigation.pending)return true;
  if(history.length){go(history.pop(),false);return true;}
  if(station!=='hangar'){go('hangar',false);return true;}
  return false;
 }
 frontEnd.setBusBack(back);
 function returnToHangar(){
  hub.update(1,false);hub.setView('hangar',true);station='hangar';history.length=0;
  directory.disabled=false;container.setAttribute('aria-busy','false');$('.bus-panel').hidden=false;
  $('.bus-transition').style.opacity='0';container.querySelectorAll('[data-station]').forEach(b=>b.disabled=false);draw();
 }
 frontEnd.setBusReturn(returnToHangar);
 hub.setView(station,true);hub.setWorld(world);


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
 return {hub,crew,updateAudio(){crew.update({visible:frontEnd.visible&&(frontEnd.view==='bus'||frontEnd.isBusGarage)&&!frontEnd.preview,settled:!hub.navigation.pending,station:hub.navigation.station});},render(renderer,time,motion,drawScene){
  hub.loadAssets();
  syncCraft();const dt=lastTime===null?0:Math.min(.05,Math.max(0,time-lastTime));lastTime=time;
  hub.camera.aspect=window.innerWidth/window.innerHeight;hub.camera.updateProjectionMatrix();hub.update(dt,motion);
  $('.bus-transition').style.opacity=String(hub.navigation.opacity);
  if(!hub.navigation.pending&&container.getAttribute('aria-busy')==='true'){
   station=hub.navigation.station;frontEnd.tourSession.visit(station,world);draw();$('.bus-panel').hidden=false;
   directory.disabled=false;container.setAttribute('aria-busy','false');
   container.querySelectorAll('[data-station]').forEach(b=>b.disabled=false);
   ($(`[data-station="${station}"]`)??directory).focus({preventScroll:true});
  }
  drawScene(hub.scene,hub.camera);
  for(const anchor of anchors){const p=new THREE.Vector3(...anchor.at).project(hub.camera);const visible=station==='hangar'&&p.z>-1&&p.z<1&&Math.abs(p.x)<.94&&Math.abs(p.y)<.75;anchor.button.hidden=!visible;if(visible){anchor.button.style.left=`${(p.x*.5+.5)*100}%`;anchor.button.style.top=`${(-p.y*.5+.5)*100}%`;}}
 },dispose(){crew.dispose();frontEnd.setBusReturn(null);frontEnd.setBusBack(null);owned.forEach(m=>m.dispose());hub.dispose();container.replaceChildren();}};
}
