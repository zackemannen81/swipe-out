import {CUP,CupProgress,standings,medal,cupRecordKey} from './cup.js';
const $=id=>document.getElementById(id);
export function createCupUI(storage,getSettings,trackName){
 const progress=new CupProgress(storage);let running=false,round=0,waiting=false,lockedValues=null;
 const selected=()=>$('race-mode-select').value==='cup';
 function menu(){
  $('cup-options').hidden=!selected();
  document.body.classList.toggle('cup-selected',selected());
  document.querySelector('#start-screen .eyebrow').textContent=selected()?'CUP · FOUNDRY CUP':$('track-select').selectedOptions[0]?.textContent;
  const a=progress.active,continuing=!!a&&a.results.length<3;
  for(const id of ['track-select','cpu-difficulty-select','handling-select','assist-select','combat-enabled']){
   $(id).disabled=selected()&&(id==='track-select'||continuing);
  }
  // Restore solo-specific disablement when leaving cup.
  if(!selected()&&$('race-mode-select').value==='time-attack'){$('cpu-difficulty-select').disabled=true;$('combat-enabled').disabled=true;}
  const fields=['cpu-difficulty-select','handling-select','assist-select','combat-enabled'];
  if(selected()&&continuing){
   lockedValues??=fields.map(id=>({value:$(id).value,checked:$(id).checked}));
   $('cpu-difficulty-select').value=a.settings.difficulty;$('handling-select').value=a.settings.handling;$('assist-select').value=a.settings.assist.toFixed(1);$('combat-enabled').checked=a.settings.combat;
  }else if(lockedValues){fields.forEach((id,i)=>{$(id).value=lockedValues[i].value;$(id).checked=lockedValues[i].checked;});lockedValues=null;}
  if(!selected())return;
  $('start-copy').textContent='Three circuits. One championship. Points carry between races. Built-in courses keep the cup consistent.';
  const s=continuing?a.settings:getSettings();
  const best=progress.data.bests[cupRecordKey(s)];
  $('cup-summary').textContent=`${CUP.name} · ${CUP.tracks.map(trackName).join(' → ')}. ${continuing?'CONTINUE ROUND '+(a.results.length+1)+'/3':'NEW CUP'} · ${s.difficulty.toUpperCase()} · ${s.handling.toUpperCase()} · ASSIST ${s.assist} · ${s.combat?'COMBAT':'CLEAN'}${best?' · BEST '+medal(best)+' (#'+best+')':''}. ${progress.warning}`;
  $('cup-new').hidden=!a;
  $('cup-new').textContent='NEW CUP · RESET CURRENT RUN';
 }
 function table(){
  const a=progress.active,body=$('cup-standings');body.replaceChildren();
  standings(a.results).forEach((row,i)=>{
   const tr=document.createElement('tr');if(row.id==='player')tr.className='cup-player';
   const last=a.results.at(-1),place=last?.findIndex(r=>r.id===row.id),gain=place>=0&&last[place].time!==null?CUP.points[place]:0;
   for(const value of [i+1,row.id==='player'?'YOU':row.id,last?.[place]?.time==null?'DNF':last[place].time.toFixed(2)+'s','+'+gain,row.points]){const td=document.createElement('td');td.textContent=value;tr.append(td);}body.append(tr);
  });
 }
 $('race-mode-select').addEventListener('change',menu);
 for(const id of ['cpu-difficulty-select','handling-select','assist-select','combat-enabled'])$(id).addEventListener('change',menu);
 $('cup-new').addEventListener('click',()=>{progress.data.active=null;progress.save();menu();});
 menu();
 return {
  progress,menu,get running(){return running;},get waiting(){return waiting;},
  prepare(){
   running=selected();waiting=false;$('cup-results').hidden=true;$('retry-button').disabled=$('menu-button').disabled=false;$('retry-button').textContent='RACE AGAIN ↻';
   if(!running)return null;
   if(!progress.active||progress.active.results.length===3)progress.start(getSettings());
   round=progress.active.results.length;
   return {track:CUP.tracks[round],settings:progress.active.settings};
  },
  finish(){if(!running)return;waiting=true;$('cup-results').hidden=false;$('cup-result-summary').textContent='Waiting for the field to finish… (up to 60 seconds)';$('cup-standings').replaceChildren();$('retry-button').disabled=$('menu-button').disabled=true;},
  update(racers,elapsed){
   if(!running||!waiting||(!racers.every(r=>r.time!==null)&&elapsed<60))return;
   progress.record(round,racers);waiting=false;table();
   const a=progress.active,complete=a.results.length===3,place=standings(a.results).findIndex(r=>r.id==='player')+1;
   $('cup-result-summary').textContent=complete?`${CUP.name} · ${medal(place)} · FINAL POSITION ${place}/5. ${progress.warning}`:`ROUND ${a.results.length}/3 COMPLETE · Next: ${trackName(CUP.tracks[a.results.length])}. ${progress.warning}`;
   $('retry-button').disabled=$('menu-button').disabled=false;$('retry-button').textContent=complete?'NEW CUP ↻':'NEXT RACE ▶';
   $('retry-button').focus({preventScroll:true});
  },
 };
}
