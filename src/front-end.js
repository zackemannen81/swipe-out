import {recordKey} from './time-attack.js';
import {readRaceRecords,saveRaceResult,timeMedal} from './race-records.js';
import {createTrackCurve} from './track-path.js';
import {VITRUM_MUSIC,BONUS_TROPHIES,awardConsolation,REWARD_MUSIC,necrosMastered,grantNecrosPreview,SHIPS,PAINTS,MODULES,TROPHIES,unlocked,loadProfile,saveProfile,awardCampaign,loadout} from './career.js';
import './front-end.css';
const NECROS_TRACK_ID='custom-e7ead7a3-b303-4c3d-9464-ca52f28e8386';
const $=id=>document.getElementById(id);
export function createFrontEnd({garage,onSettings,onPreview,tracks}){
 const profile=loadProfile(localStorage);let view='home',campaign=false,run=null,preview=false,recordRun=null,bonusRun=null;
 // Explicit author testing grant, restricted to local Vite development. Never grants trophies.
 if(import.meta.env.DEV&&['localhost','127.0.0.1','[::1]'].includes(location.hostname)){grantNecrosPreview(profile);saveProfile(localStorage,profile);}
 const root=$('start-screen'),setup=document.createElement('div');setup.id='menu-race';setup.dataset.view='race';
 setup.append(...root.childNodes);root.append(setup);root.classList.add('front-end');root.removeAttribute('aria-labelledby');root.removeAttribute('aria-describedby');root.setAttribute('aria-label','SwipeOut menu');
 $('headline').textContent='RACE SETUP';
 const extra=document.createElement('div');extra.innerHTML=`
 <header class="menu-header"><a href="#" id="menu-home" aria-label="Main menu">SWIPEOUT<span>2026 / WORLD TOUR</span></a><span id="menu-location">NECROS · DARK PRIME</span></header>
 <div id="menu-pages">
 <section data-view="home" class="menu-page"><p class="menu-kicker">ANTI-GRAVITY WORLD CHAMPIONSHIP</p><h2>RACE FOR<br>YOUR <em>WORLD.</em></h2><p class="menu-lead">One pilot. An entire civilisation.<br>Your sacrifice is not optional.</p><nav class="menu-nav" aria-label="Main menu">
 <button data-go="campaign"><b>01</b> CAMPAIGN <small>NECROS · PREVIEW</small></button>
 <button data-event="race"><b>02</b> QUICK RACE <small>ALL CIRCUITS</small></button>
 <button data-event="time-attack"><b>03</b> TIME ATTACK <small>PERSONAL BEST / GHOST</small></button>
 <button data-event="cup"><b>04</b> FOUNDRY CUP <small>THREE ROUNDS</small></button>
 <button data-go="garage"><b>05</b> GARAGE <small>CRAFT / FINISH / MODULES</small></button>
 <button data-go="trophies"><b>06</b> TROPHIES <small>CAREER ARCHIVE</small></button>
 <button data-go="records"><b>07</b> RECORDS <small>LOCAL BEST TIMES</small></button><button data-go="settings"><b>08</b> SETTINGS <small>FLIGHT / AUDIO / DISPLAY</small></button></nav></section>
 <section data-view="campaign" class="menu-page"><p class="menu-kicker">WORLD 01 / CAMPAIGN PREVIEW 0.5</p><h2>NECROS</h2><p class="menu-lead">DARK PRIME</p><p>The Necken built an empire upon defeating death. Now they race for the survival of their world.</p><p class="menu-muted">One playable event. Three laps through the parade, cathedral and spire. More worlds will follow.</p><p id="campaign-availability" class="menu-muted" role="status"></p><div id="campaign-goals" class="menu-stack"></div><button id="world-preview" class="menu-primary">FLY OVER NECROS ↗</button><button id="campaign-enter" class="menu-primary">ENTER EVENT →</button><p class="menu-muted">Fly-by includes “To Death and Beyond”. Skip at any time. Race countdown remains unchanged.</p></section>
 <section data-view="garage" class="menu-page"><p class="menu-kicker">DARK PRIME / SERVICE HANGAR 01</p><h2>GARAGE</h2><h3>SELECT CRAFT</h3><div id="garage-ships" class="menu-stack"></div><p id="garage-description"></p><div id="garage-stats"></div><h3>PAINT & FINISH</h3><div id="garage-paints" class="menu-swatches"></div><h3>PERFORMANCE MODULE · ONE SLOT</h3><div id="garage-modules" class="menu-stack"></div><p class="menu-muted">Garage performance applies to Quick Race and Campaign. Time Attack and Foundry Cup use the factory Racer for comparable results.</p></section>
 <section data-view="trophies" class="menu-page"><p class="menu-kicker">ETERNAL RECORD / LOCAL PROFILE</p><h2>TROPHIES</h2><div id="trophy-list" class="menu-stack"></div><h3>CAMPAIGN RECORDS</h3><div id="career-bests"></div><p class="menu-muted">Records are separated by course revision, difficulty, handling, assist, combat and loadout. Stored on this device.</p></section>
 <section data-view="records" class="menu-page"><p class="menu-kicker">LOCAL PILOT ARCHIVE</p><h2>RECORDS</h2><div id="race-record-list"></div><p class="menu-muted">Three-lap race records grouped by circuit revision, controls, difficulty, combat and loadout. Time Attack has its own lap records and ghosts.</p></section><section data-view="settings" class="menu-page"><p class="menu-kicker">PILOT PREFERENCES</p><h2>SETTINGS</h2><h3>FLIGHT CONTROLS</h3><div id="settings-flight"></div><h3>AUDIO</h3><label class="menu-setting">RACE SOUNDTRACK<select id="menu-soundtrack"><option value="">Circuit soundtrack</option></select></label><div id="settings-voice"></div><label class="menu-setting">MUSIC & TRAILER <input id="menu-music" type="range" min="0" max="100" aria-label="Music and trailer volume"><output id="music-value"></output></label><label class="menu-setting">SOUND EFFECTS <input id="menu-sfx" aria-label="Sound effects volume" type="range" min="0" max="100"><output id="sfx-value"></output></label><label class="menu-setting"><input id="menu-mute" type="checkbox"> MUTE ALL AUDIO</label><label class="menu-setting">EFFECTS MIX<select id="menu-mix"><option value="headphones">Headphones · full dynamics</option><option value="speakers">Speakers · softer peaks</option></select></label><h3>DISPLAY</h3><label class="menu-setting">NEON GLOW <input id="menu-glow" aria-label="Neon glow" type="range" min="0" max="300"><output id="glow-value"></output></label><label class="menu-setting"><input id="menu-musicPulse" type="checkbox"> MUSIC-REACTIVE RAILS</label><label class="menu-setting">QUALITY<select id="menu-quality"><option value="high">High</option><option value="balanced">Balanced</option><option value="low">Low</option></select></label><label class="menu-setting"><input id="menu-bloom" type="checkbox"> BLOOM</label><label class="menu-setting"><input id="menu-shake" type="checkbox"> CAMERA SHAKE</label><label class="menu-setting"><input id="menu-motion" type="checkbox"> MENU MOTION & FLY-BY</label></section>
 </div><footer class="menu-footer"><button id="menu-back">← MAIN MENU</button><span id="profile-status" role="status"></span><span>TO DEATH AND BEYOND.</span></footer>`;
 root.prepend(...extra.childNodes);$('menu-pages').append(setup);
 // Reuse live controls and their listeners rather than duplicating preferences.
 $('settings-flight').append($('handling-select').closest('.driving-settings'),$('driving-description'));
 const assistLabel=document.createElement('label');assistLabel.className='menu-setting';assistLabel.textContent='LANE ASSIST';assistLabel.append($('assist-select'));$('settings-flight').append(assistLabel);
 $('settings-voice').append(root.querySelector('.announcer-setting'),root.querySelector('[data-voice-storage]'));
 const setupNote=document.createElement('p');setupNote.id='loadout-note';setupNote.className='menu-muted';$('start-button').before(setupNote);
 const overlay=document.createElement('div');overlay.id='world-preview-overlay';overlay.hidden=true;overlay.innerHTML='<div><span>NECROS / RECONNAISSANCE FLIGHT</span><button id="end-world-preview">BACK · ESC</button></div>';document.querySelector('.experience').append(overlay);
 const trailer=new Audio('/audio/necros-trailer.mp3');trailer.preload='none';
 function persist(){ $('profile-status').textContent=saveProfile(localStorage,profile); }
 function settings(){onSettings(profile.settings);trailer.volume=profile.settings.mute?0:profile.settings.music;for(const k of ['sfx','glow'])$(''+k+'-value').textContent=Math.round(profile.settings[k]*100)+'%';$('music-value').textContent=Math.round(profile.settings.music*100)+'%';}
 $('menu-music').value=profile.settings.music*100;$('menu-quality').value=profile.settings.quality;
 for(const k of ['bloom','shake','motion','mute','musicPulse']){$('menu-'+k).checked=profile.settings[k];$('menu-'+k).addEventListener('change',()=>{profile.settings[k]=$('menu-'+k).checked;settings();persist();});}
 for(const k of ['sfx','glow']){$('menu-'+k).value=profile.settings[k]*100;$('menu-'+k).addEventListener('input',()=>{profile.settings[k]=Number($('menu-'+k).value)/100;settings();persist();});}
 $('menu-mix').value=profile.settings.mix;$('menu-mix').addEventListener('change',()=>{profile.settings.mix=$('menu-mix').value;settings();persist();});
 $('menu-quality').addEventListener('change',()=>{profile.settings.quality=$('menu-quality').value;settings();persist();});
 $('menu-music').addEventListener('input',()=>{profile.settings.music=Number($('menu-music').value)/100;settings();persist();});
 function button(label,action,disabled=false,selected=false){const b=document.createElement('button');b.textContent=label;b.disabled=disabled;b.setAttribute('aria-pressed',String(selected));b.addEventListener('click',action);return b;}
 function drawGarage(){
  for(const [id,items,key]of [['garage-ships',SHIPS,'ship'],['garage-paints',PAINTS,'paint'],['garage-modules',MODULES,'module']]){
   $(id).replaceChildren(...items.map(item=>{const locked=!unlocked(item,profile);const b=button(item.name+(locked?' · LOCKED — '+item.require.toUpperCase():''),()=>{profile[key]=item.id;persist();drawGarage();},locked,profile[key]===item.id);b.title=item.description??item.name;if(key==='module'){const detail=document.createElement('small');detail.textContent=item.description;b.append(detail);}if(item.color)b.style.setProperty('--swatch',item.color);return b;}));
  }
  const ship=SHIPS.find(s=>s.id===profile.ship),spec=loadout(profile);$('garage-description').textContent=ship.description;
  $('garage-stats').replaceChildren(...[['ENGINE LIMIT',spec.speed],['THRUST FORCE',spec.force],['MASS',spec.mass]].map(([name,v])=>{const row=document.createElement('div');row.className='garage-stat';row.textContent=`${name} ${Math.round(v*100)}%`;const bar=document.createElement('meter');bar.min=0;bar.max=1.4;bar.value=v;row.append(bar);return row;}));
  garage.setCraft(profile.ship,PAINTS.find(p=>p.id===profile.paint)?.color);
 }
 function drawMusic(){
  for(const id of ['menu-soundtrack','music-select'])for(const song of VITRUM_MUSIC){const select=$(id);if(![...select.options].some(o=>o.value===song.url))select.add(new Option(song.name,song.url));}
  const allowed=unlocked(REWARD_MUSIC,profile);
  for(const id of ['menu-soundtrack','music-select']){const select=$(id);let option=[...select.options].find(o=>o.value===REWARD_MUSIC.url);if(!option){option=new Option('',REWARD_MUSIC.url);select.add(option);}option.textContent=REWARD_MUSIC.name+(allowed?'':' · LOCKED — complete all Necros challenges');option.disabled=!allowed;}
  $('menu-soundtrack').value=profile.soundtrack;
 }
 drawMusic();$('menu-soundtrack').addEventListener('change',()=>{profile.soundtrack=$('menu-soundtrack').value;persist();});
 function drawCareer(){
  for(const id of ['campaign-goals','trophy-list'])$(id).replaceChildren(...TROPHIES.map(t=>{const p=document.createElement('p');p.className='career-goal';p.dataset.earned=profile.trophies.includes(t.id);p.textContent=`${profile.trophies.includes(t.id)?'◆':'◇'} ${t.name} — ${t.description}`;return p;}));
  for(const t of BONUS_TROPHIES){const p=document.createElement('p');p.className='career-goal';p.dataset.earned=profile.trophies.includes(t.id);p.textContent=`${profile.trophies.includes(t.id)?'◆':'◇'} BONUS · ${t.name} — ${t.description}`;$('trophy-list').append(p);}
  const reward=document.createElement('p');reward.className='career-goal';reward.textContent=`${unlocked(REWARD_MUSIC,profile)?'◆':'◇'} NECROS MASTERY — Complete all five challenges to unlock Necron Crimson Citadel + Vi lever inte.${!necrosMastered(profile)&&unlocked(REWARD_MUSIC,profile)?' Local test rewards enabled; challenges remain unfinished.':''}`;$('campaign-goals').append(reward);$('trophy-list').append(reward.cloneNode(true));
  $('career-bests').replaceChildren(...Object.entries(profile.bests).map(([key,v])=>{const p=document.createElement('p');p.className='menu-muted';p.textContent=`${key.split('|').slice(1).join(' · ')} — ${v.time.toFixed(2)} s · #${v.position}`;return p;}));
  if(!Object.keys(profile.bests).length)$('career-bests').textContent='Complete your first campaign event to set a record.';
 }

 const card=document.createElement('div');card.id='course-card';$('start-button').before(card);
 const select=$('track-select');const selected=select.value;
 const categories={Circuits:[],Custom:[],Laboratory:[]};
 for(const option of [...select.options]){const t=tracks[option.value];if(!t)continue;categories[t.custom?'Custom':/test|lab/i.test(t.name)?'Laboratory':'Circuits'].push(option);}
 select.replaceChildren();for(const [name,options]of Object.entries(categories)){if(!options.length)continue;const g=document.createElement('optgroup');g.label=name;g.append(...options);select.append(g);}select.value=selected;
 function drawTrackCard(){
  const t=tracks[select.value];if(!t)return;card.replaceChildren();const img=document.createElement('img');img.src=t.preview??t.backdrop;img.alt=t.name+' — environment preview';img.loading='lazy';card.append(img);
  const p=document.createElement('p');const curve=createTrackCurve(t.data);let corners=0;for(let i=0;i<80;i++)if(curve.getTangentAt(i/80).dot(curve.getTangentAt((i+1)%80/80))<.85)corners++;
  p.textContent=`${t.name} · ${(curve.getLength()*3.25/1000).toFixed(1)} km · ${corners>10?'TECHNICAL':corners>4?'INTERMEDIATE':'FLOWING'} · ${t.data.magnetic?'MAGNETIC':'STANDARD'}`;card.append(p);
  const targets=document.createElement('p');targets.className='menu-muted';targets.textContent=`Race time medals: Gold ${(curve.getLength()*3/110).toFixed(1)}s / Silver ${(curve.getLength()*3/95).toFixed(1)}s / Bronze ${(curve.getLength()*3/80).toFixed(1)}s. Initial targets; loadouts have separate records.`;card.append(targets);
  const key=[select.value,recordKey({track:t.data}),$('cpu-difficulty-select').value,$('handling-select').value,$('assist-select').value,$('combat-enabled').checked,profile.ship,profile.module].join('|');
  const best=readRaceRecords(localStorage).find(r=>r.key===key);const record=document.createElement('p');record.className='menu-muted';record.textContent=$('race-mode-select').value==='race'?`Current setup PB: ${best?best.time.toFixed(2)+'s':'no record yet'}`:'Factory performance — separate event records.';card.append(record);
 }
 select.addEventListener('change',drawTrackCard);for(const id of ['cpu-difficulty-select','handling-select','assist-select','combat-enabled','race-mode-select'])$(id).addEventListener('change',()=>{if(view==='race')drawTrackCard();});
 function drawRecords(){const list=$('race-record-list');list.replaceChildren();const rows=readRaceRecords(localStorage);for(const r of rows){const p=document.createElement('p');p.className='career-goal';p.textContent=`${r.name} — ${r.time.toFixed(2)}s · Best lap ${r.bestLap?.toFixed(2)??'—'}s · #${r.position} · ${r.label??''}`;list.append(p);}if(!rows.length)list.textContent='Finish a race to set your first record.';}

 function stopPreview(){preview=false;trailer.pause();trailer.currentTime=0;overlay.hidden=true;root.hidden=false;onPreview(false);}
 function show(next){stopPreview();view=next;root.dataset.page=view;document.body.classList.add('in-menu');for(const p of root.querySelectorAll('[data-view]'))p.hidden=p.dataset.view!==view;$('menu-back').hidden=view==='home';if(view==='garage')drawGarage();if(view==='records')drawRecords();if(view==='race')drawTrackCard();if(view==='campaign'||view==='trophies')drawCareer();const heading=root.querySelector(`[data-view="${view}"] h1,[data-view="${view}"] h2`);if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}root.querySelector('#menu-pages').scrollTop=0;}
 function event(mode,isCampaign=false){campaign=isCampaign;$('race-mode-select').value=mode;$('race-mode-select').dispatchEvent(new Event('change'));$('track-select').disabled=isCampaign||mode==='cup';$('loadout-note').textContent=isCampaign?'CAMPAIGN · NECROS · Garage loadout active.':mode==='race'?'Garage loadout active. Change craft and modules in Garage.':'Factory Racer performance. Garage modules are disabled for this event.';show('race');}
 root.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.go)));
 root.querySelectorAll('[data-event]').forEach(b=>b.addEventListener('click',()=>event(b.dataset.event)));
 $('race-mode-select').addEventListener('change',()=>{campaign=false;$('loadout-note').textContent=$('race-mode-select').value==='race'?'Garage loadout active.':'Factory Racer performance; modules disabled.';});
 function necros(){return tracks[NECROS_TRACK_ID]?.custom?NECROS_TRACK_ID:null;}
 const available=Boolean(necros());
 $('campaign-enter').disabled=!available;$('world-preview').disabled=!available;
 $('campaign-availability').textContent=available?'NECROS · DARK PRIME — authored circuit ready.':'Dark PRIME is not saved in this browser origin. Open the localhost address where you created the track, or import its saved track library here. No substitute circuit will be used.';
 $('campaign-enter').addEventListener('click',()=>{if(!necros())return;$('track-select').value=necros();$('track-select').dispatchEvent(new Event('change'));event('race',true);campaign=true;});
 $('world-preview').addEventListener('click',()=>{if(!necros())return;if(!profile.settings.motion||matchMedia('(prefers-reduced-motion: reduce)').matches){$('profile-status').textContent='Enable menu motion in Settings to watch the fly-by.';return;}preview=true;root.hidden=true;overlay.hidden=false;onPreview(true,necros());trailer.currentTime=0;trailer.play().catch(()=>{$('profile-status').textContent='Trailer audio unavailable; fly-by remains available.';});$('end-world-preview').focus();});
 $('end-world-preview').addEventListener('click',()=>{stopPreview();show('campaign');});
 $('menu-home').addEventListener('click',e=>{e.preventDefault();show('home');});$('menu-back').addEventListener('click',()=>show('home'));
 window.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('in-menu')){e.preventDefault();show(preview?'campaign':'home');}});
 let padHeld=false;
 function gamepad(externalScope=null,onBack=null){
  const pad=Array.from(navigator.getGamepads?.()??[]).find(Boolean);if(!pad)return;
  const direction=pad.buttons[12]?.pressed||pad.axes[1]<-.6?-1:pad.buttons[13]?.pressed||pad.axes[1]>.6?1:0;
  const horizontal=pad.buttons[14]?.pressed||pad.axes[0]<-.6?-1:pad.buttons[15]?.pressed||pad.axes[0]>.6?1:0;
  const accept=pad.buttons[0]?.pressed,back=pad.buttons[1]?.pressed,held=!!(direction||horizontal||accept||back);if(held&&!padHeld){
   if(back){if(onBack)onBack();else show(preview?'campaign':'home');}
   else{const scope=externalScope??(preview?overlay:root);const items=[...scope.querySelectorAll('button,a,input,select')].filter(e=>!e.disabled&&e.getClientRects().length);const active=document.activeElement;
    if(direction){const i=items.indexOf(active);items[(i+direction+items.length)%items.length]?.focus();}
    else if(horizontal&&active?.tagName==='SELECT'){active.selectedIndex=Math.max(0,Math.min(active.options.length-1,active.selectedIndex+horizontal));active.dispatchEvent(new Event('change'));}
    else if(horizontal&&active?.type==='range'){active.value=Number(active.value)+horizontal*5;active.dispatchEvent(new Event('input'));}
    else if(accept){if(items.includes(active))active.click();else items[0]?.focus();}
   }
  }padHeld=held;
 }
 settings();drawGarage();show('home');$('front-loading')?.remove();
 return {profile,gamepad,get view(){return view;},get preview(){return preview;},get visible(){return document.body.classList.contains('in-menu');},
  open(){bonusRun=null;show('home');},
  begin(trackKey,revision,config){stopPreview();bonusRun={event:$('race-mode-select').value,entrants:5,difficulty:config.difficulty,handling:config.handling,assist:config.assist};const standard=$('race-mode-select').value!=='race';const spec=loadout(profile,standard);recordRun=!standard?{key:[trackKey,revision,config.difficulty,config.handling,config.assist,config.combat,spec.ship,profile.module].join('|'),name:tracks[trackKey].name,label:[config.difficulty,config.handling,'assist '+config.assist,config.combat?'combat':'clean',spec.ship,profile.module].join(' · '),length:createTrackCurve(tracks[trackKey].data).getLength()}:null;run=campaign&&trackKey===NECROS_TRACK_ID&&!standard?{length:recordRun.length,difficulty:config.difficulty,key:[revision,config.difficulty,config.handling,'assist '+config.assist,config.combat?'combat':'clean',spec.ship,profile.module].join('|')}:null;document.body.classList.remove('in-menu');root.hidden=true;return {...spec,paint:PAINTS.find(p=>p.id===profile.paint)?.color};},
  finish(position,time,bestLap,completed=false){
   const bonus=awardConsolation(profile,{...bonusRun,position,time,completed});bonusRun=null;
   $('bonus-result')?.remove();
   if(bonus.length){persist();const p=document.createElement('p');p.id='bonus-result';p.textContent='YOUR SACRIFICE HAS BEEN APPROVED. · Unlocked: The sacrifice · Visit Garage.';$('results-screen').querySelector('.results-details').append(p);}
   if(recordRun){const saved=saveRaceResult(localStorage,{...recordRun,position,time,bestLap});const medal=timeMedal(time,recordRun.length);recordRun=null;const p=document.createElement('p');p.id='race-record-result';p.textContent=`${medal?medal+' TIME MEDAL · ':''}${saved?.improved?'NEW PERSONAL BEST':saved?.delta!=null?'PB +'+saved.delta.toFixed(2)+'s':'RESULT RECORDED'} ${saved?.error??''}`;$('results-screen').querySelector('.results-details').append(p);}
   if(!run)return;const fresh=awardCampaign(profile,{...run,position,time,medal:timeMedal(time,run.length)});run=null;persist();drawMusic();const p=$('career-result')??document.createElement('p');p.id='career-result';p.textContent=`NECROS CAMPAIGN · ${fresh.length?'UNLOCKED: '+fresh.map(id=>TROPHIES.find(t=>t.id===id).name).join(' / '):'RESULT RECORDED'} · Next: ${TROPHIES.find(t=>!profile.trophies.includes(t.id))?.description??'All challenges complete: Necron Crimson Citadel + Vi lever inte unlocked.'} · Visit Garage & Trophies. ${$('profile-status').textContent}`;$('results-screen').querySelector('.results-details').append(p);},
  dispose(){trailer.pause();garage.dispose();}
 };
}
