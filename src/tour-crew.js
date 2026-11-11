import INTROS from './tour-intros.json';
import {TOUR_VIEWS} from './tour-bus-zones.js';
import {createTourAudio,TOUR_MUSIC,ZONE_MUSIC} from './tour-audio.js';
export function createTourCrew({container,frontEnd}){
 const audio=createTourAudio();let current=null,active=false,archive=false,station='hangar',manualMusic=null,previousFocus=null;
 const panel=document.createElement('section');panel.className='bus-crew';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Crew information');
 const archiveButton=document.createElement('button');archiveButton.type='button';archiveButton.className='bus-archive-button';archiveButton.textContent='ARCHIVE · CREW INFORMATION';
 container.append(panel,archiveButton);
 function element(tag,text){const el=document.createElement(tag);el.textContent=text;return el;}
 function button(label,action){const b=element('button',label);b.type='button';b.onclick=action;panel.append(b);return b;}
 function close(){audio.stopVoice();current=null;archive=false;panel.hidden=true;if(previousFocus?.isConnected&&previousFocus.getClientRects().length)previousFocus.focus({preventScroll:true});}
 function show(id,replay=false){
  const intro=INTROS[id];if(!intro)return;previousFocus=document.activeElement;archive=false;current=id;panel.hidden=false;panel.replaceChildren();
  panel.append(element('p','TOUR BUS · CREW INFORMATION'),element('small',replay?'ARCHIVE REPLAY':'FIRST VISIT'),element('h3',intro.title));
  panel.append(element('small',id==='00'?'Passenger orientation':Object.values(TOUR_VIEWS).find(v=>v.zoneId===id)?.subtitle??'Crew information'));
  const transcript=element('div',intro.text);transcript.className='bus-transcript';transcript.tabIndex=0;panel.append(transcript);
  const status=element('p','');status.className='bus-voice-status';status.setAttribute('role','status');panel.append(status);
  const play=()=>audio.speak(intro.voice,close,message=>{status.textContent=message;});
  if(intro.voice)button('PLAY VOICE',play);else status.textContent='Transcript available · voice recording pending.';
  const skip=button('SPACE / ENTER TO SKIP',close);skip.focus({preventScroll:true});
  if(!replay)frontEnd.markZoneIntro(id);
  play();
 }
 function openArchive(){
  previousFocus=document.activeElement;audio.stopVoice();current=null;archive=true;panel.hidden=false;panel.replaceChildren();
  panel.append(element('p','TOUR BUS · CREW INFORMATION'),element('h3','CHAMPIONSHIP ARCHIVE'),element('small','Discovered presentations'));
  for(const id of Object.keys(INTROS))if(frontEnd.profile.visitedZoneIntros[id])button(INTROS[id].title,()=>show(id,true));
  panel.append(element('h3','SHIPBOARD MUSIC'));
  const select=document.createElement('select');select.setAttribute('aria-label','Shipboard music');
  select.add(new Option('Automatic · current room',''));for(const track of TOUR_MUSIC)select.add(new Option(track.title,track.id));select.value=manualMusic??'';
  select.onchange=()=>{manualMusic=select.value||null;chooseMusic();};panel.append(select);
  button('SHIPWIDE ANNOUNCEMENT',()=>{audio.speak('/audio/tourbus/announcement_tourbus.mp3',()=>{},message=>{status.textContent=message;});});
  const status=element('p','');status.setAttribute('role','status');panel.append(status);
  button('STOP ANNOUNCEMENT',()=>audio.stopVoice());button('CLOSE ARCHIVE',close).focus({preventScroll:true});
 }
 function chooseMusic(){audio.track((TOUR_MUSIC.find(t=>t.id===manualMusic)??TOUR_MUSIC[ZONE_MUSIC[station]]).url);}
 archiveButton.onclick=openArchive;
 const keyboard=e=>{if(!active||panel.hidden||e.repeat||e.target.tagName==='SELECT')return;if(e.key==='Escape'||(current&&(e.code==='Space'||e.key==='Enter')&&!(e.target.tagName==='BUTTON'&&e.target.textContent!=='SPACE / ENTER TO SKIP'))){e.preventDefault();e.stopImmediatePropagation();close();}};
 const visibility=()=>{if(document.hidden){active=false;audio.setActive(false);close();}};
 document.addEventListener('visibilitychange',visibility);
 const gesture=()=>{if(active)audio.retry();};
 window.addEventListener('keydown',keyboard,true);window.addEventListener('pointerdown',gesture);window.addEventListener('keydown',gesture);
 return {audio,close,back(){if(panel.hidden)return false;close();return true;},
  update({visible,settled,station:next}){
   const enabled=visible&&!document.hidden;audio.preferences(frontEnd.profile.settings);
   if(enabled!==active){active=enabled;audio.setActive(active);if(!active)close();}
   if(!active)return;
   if(station!==next){close();station=next;}
   chooseMusic();
   if(!settled){if(current||archive)close();return;}
   if(current||archive)return;
   const id=!frontEnd.profile.visitedZoneIntros['00']?'00':TOUR_VIEWS[station].zoneId;
   if(!frontEnd.profile.visitedZoneIntros[id])show(id);
  },
  dispose(){document.removeEventListener('visibilitychange',visibility);close();audio.dispose();window.removeEventListener('keydown',keyboard,true);window.removeEventListener('pointerdown',gesture);window.removeEventListener('keydown',gesture);panel.remove();archiveButton.remove();},
 };
}
