import { TimeAttackSession, recordKey, loadRecord, signedDelta } from './time-attack.js';
import { createRacingGuide, createGuideView } from './racing-guide.js';
import { createLapGhost } from './lap-ghost.js';

const PREF_KEY='swipe-out:practice-options:v1';
export const lapTime = value => {
  if(value==null)return '—';
  const ticks=Math.round(value*100);
  return `${Math.floor(ticks/6000).toString().padStart(2,'0')}:${(Math.floor(ticks/100)%60).toString().padStart(2,'0')}.${(ticks%100).toString().padStart(2,'0')}`;
};
const $=id=>document.getElementById(id);

export function createPracticeUI(scene,craft,storage,selection) {
  let preferences={mode:'race',line:true,warnings:true,ghost:true};
  try { const v=JSON.parse(storage.getItem(PREF_KEY)); if(v)preferences={mode:v.mode==='time-attack'?'time-attack':'race',
    ...Object.fromEntries(['line','warnings','ghost'].map(k=>[k,typeof v[k]==='boolean'?v[k]:true]))}; } catch { /* Defaults remain usable. */ }
  $('race-mode-select').value=preferences.mode;
  for(const name of ['line','warnings','ghost'])$(`practice-${name}`).checked=preferences[name];
  const lapGhost=createLapGhost(scene,craft),guideView=createGuideView(scene),cache=new Map();
  let active=false,session=null,guide=null,guideTimer=0,messageUntil=0;
  const keyFor=()=>recordKey(selection());
  function preview() {
    const solo=preferences.mode==='time-attack';
    document.body.classList.toggle('time-attack-selected',solo);
    $('start-copy').textContent=solo?'Learn the circuit. Chase your best flying lap. One out lap, then three timed attempts.':
      'A three-lap anti-gravity race against four CPU rivals. Drag left or right to steer; hold higher to accelerate or lower to brake.';
    $('combat-enabled').disabled=solo;
    $('practice-options').hidden=!solo;
    $('practice-preview').hidden=!solo;
    if(solo) {
      const key=keyFor(), loaded=loadRecord(storage,key),cached=cache.get(key);
      const best=cached&&(!loaded.record||cached.record.duration<loaded.record.duration)?cached.record:loaded.record;
      const settings=selection();
      const warning=cached&&best===cached.record?cached.warning:loaded.warning;
      $('practice-preview').textContent=`RACER · STANDARD · ${settings.handling.toUpperCase()}${settings.handling==='wipeout'?'':` · ASSIST ${settings.assist}`}\nPB ${lapTime(best?.duration)} · No rivals, combat or catch-up.${warning?` ${warning}`:''}`;
    }
  }
  $('race-mode-select').addEventListener('change',()=>{preferences.mode=$('race-mode-select').value;save();});
  for(const name of ['line','warnings','ghost'])$(`practice-${name}`).addEventListener('change',()=>{preferences[name]=$(`practice-${name}`).checked;save();});
  for(const id of ['track-select','handling-select','assist-select'])$(id).addEventListener('change',preview);
  function save(){try{storage.setItem(PREF_KEY,JSON.stringify(preferences));}catch{/* Gameplay stays available. */}preview();}
  preview();
  function hide(){lapGhost.group.visible=guideView.mesh.visible=false;$('time-attack-hud').hidden=true;$('corner-warning').hidden=true;}
  return {
    get active(){return active;},get session(){return session;},get guide(){return guide;},get ghost(){return lapGhost;},
    begin(track,curve,pads,settings) {
      active=preferences.mode==='time-attack';session=null;hide();messageUntil=0;guideTimer=0;
      $('end-session-button').hidden=!active;$('practice-results').hidden=true;
      $('race-messages').style.opacity='0';
      if(!active)return;
      const key=recordKey({track,...settings});
      session=new TimeAttackSession({length:curve.getLength(),key,storage,requiresGates:!!curve.track.branches.length});
      const cached=cache.get(key);
      if(cached&&(!session.best||cached.record.duration<session.best.duration)){
        session.best=cached.record;session.initialBest=session.best;session.warning=cached.warning;
      }
      guide=createRacingGuide(curve,pads,settings.topSpeed);
      $('practice-notice').textContent='OUT LAP · Build speed. Timing starts at the line.';
      $('practice-sectors').textContent='S1 —   S2 —   S3 —';
      $('practice-status').textContent=session.warning;
    },
    point(time,ship){return {time,distance:ship.distance,position:craft.position,quaternion:craft.quaternion,
      recoveries:ship.recoveries,flight:!!ship.flight,completedLaps:ship.completedLaps};},
    advance(point) {
      if(!active)return;
      session.advance(point);
      if(session.best){
        cache.delete(session.key);cache.set(session.key,{record:session.best,warning:session.warning});
        if(cache.size>8)cache.delete(cache.keys().next().value);
      }
      for(const event of session.events) {
        $('practice-notice').textContent=event.type==='sector'?`SECTOR ${event.sector} · ${signedDelta(event.delta)}`:
          !event.valid?`INVALID LAP · ${event.reason}`:event.improved?`PERSONAL BEST · ${lapTime(event.duration)} · ${signedDelta(event.difference)}`:`LAP · ${lapTime(event.duration)} · ${signedDelta(event.difference)}`;
        messageUntil=point.time+4;
      }
    },
    update(state,time,ship,dt) {
      if(!active||!['racing','countdown'].includes(state)){hide();return;}
      $('time-attack-hud').hidden=false;
      const out=session.lapStart===null;
      $('practice-lap').textContent=out?'OUT LAP':`LAP ${Math.min(3,session.completed.length+1)} / 3`;
      $('practice-clock').textContent=out?'—':lapTime(session.elapsed);
      $('practice-delta').textContent=out?'SET YOUR PACE':signedDelta(session.delta);
      $('practice-delta').dataset.ahead=String(session.delta!=null&&session.delta<0);
      $('practice-best').textContent=`PB ${lapTime(session.best?.duration)}`;
      const last=session.completed.at(-1);
      $('practice-sectors').textContent=[0,1,2].map(i=>`S${i+1} ${lapTime(session.splits[i]!=null?session.splits[i]-(session.splits[i-1]??0):last?.sectors[i])}`).join('  ');
      if(time>messageUntil)$('practice-notice').textContent=out?'OUT LAP · Timing starts at the line.':session.invalid||'FLYING LAP · Chase your personal best';
      $('practice-status').textContent=session.warning;
      lapGhost.update(session.reference,session.elapsed,craft.position,preferences.ghost&&!out&&state==='racing'&&!session.done);
      guideTimer-=dt;
      if(guideTimer<=0) {
        guideTimer=0.1;
        const points=guide.ahead(ship),warning=preferences.warnings&&!ship.flight?guide.warning(points,ship.speed):null;
        guideView.update(points,ship.speed,preferences.line);
        $('corner-warning').hidden=!warning;
        if(warning){$('corner-warning').textContent=warning.text;$('corner-warning').dataset.kind=warning.kind;}
      }
    },
    finish() {
      hide();if(!active)return;
      const valid=session.completed.filter(l=>l.valid),best=valid.length?Math.min(...valid.map(l=>l.duration)):null;
      const difference=best!==null&&session.initialBest?best-session.initialBest.duration:null;
      $('practice-results').hidden=false;
      $('practice-result-summary').textContent=`${valid.length} valid / ${session.completed.length} completed laps · SESSION BEST ${lapTime(best)} · ${signedDelta(difference)} vs starting PB`;
      $('practice-result-best').textContent=`PERSONAL BEST ${lapTime(session.best?.duration)}${session.warning?` · ${session.warning}`:''}`;
      const rows=session.completed.map((lap,i)=>{
        const row=document.createElement('tr');
        for(const value of [i+1,lapTime(lap.duration),...lap.sectors.map(lapTime),lap.valid?(lap.improved?'PB':'VALID'):'INVALID']){
          const cell=document.createElement('td');cell.textContent=String(value);row.append(cell);
        }
        row.title=lap.reason;return row;
      });
      $('practice-result-laps').replaceChildren(...rows);
      return best;
    },
    menu(){hide();preview();},
    dispose(){lapGhost.dispose();guideView.dispose();},
  };
}
