import { pathToFileURL } from 'node:url';
import { createTrack, disposeTrackGroup } from '../src/track.js';
import { ION_FOUNDRY } from '../src/track-foundry.js';
import { NEON_CAUSEWAY } from '../src/track-data.js';
import { ROUTE_LAB } from '../src/track-labs.js';
import { RACER_DEFINITIONS, createOpponentState, resetOpponents, updateOpponents } from '../src/opponents.js';
import { createCollisionState, resolveRacerCollisions } from '../src/race-interactions.js';
import { updateCatchUp } from '../src/catch-up.js';
import { CPU_DIFFICULTIES } from '../src/cpu-difficulty.js';

export function measureCpuRace(track, difficulty, run = 0, hz = 60) {
  const { group, curve, boostPads } = createTrack(track);
  const rivals = RACER_DEFINITIONS.map(d => createOpponentState({ ...d, phase: d.phase + run * 0.73 }));
  resetOpponents(rivals, difficulty);
  const collisions = createCollisionState(), dt = 1 / hz;
  const lapTimes = rivals.map(() => []), lastLap = rivals.map(() => 0);
  let elapsed = 0;
  try {
    for (let i = 0; i < hz * 360; i++) {
      elapsed = (i + 1) * dt;
      updateCatchUp(rivals.map(r => ({physics:r.physics,topSpeed:r.topSpeed,finished:r.finishTime!==null})),
        dt,curve.getLength()*3,true,CPU_DIFFICULTIES[difficulty].catchUp);
      updateOpponents(rivals,curve,dt,elapsed,true,{boostPads,trackWidth:track.width});
      resolveRacerCollisions(rivals.map(r=>({id:r.name,physics:r.physics,group:r.group,finished:r.finishTime!==null})),curve,dt,collisions);
      rivals.forEach((r,j)=>{
        const count = Math.min(3,Math.floor(r.distance/curve.getLength()));
        if(count>lapTimes[j].length){const end=r.finishTime??elapsed;lapTimes[j].push(end-lastLap[j]);lastLap[j]=end;}
      });
      if(rivals.every(r=>r.finishTime!==null))break;
    }
    return rivals.map((r,i)=>({driver:r.name,time:r.finishTime,laps:lapTimes[i],walls:r.physics.wallHits,
      pads:r.physics.boostCount,routes:r.physics.routeEntries,recoveries:r.physics.recoveries,
      contacts:r.physics.craftHits,mistakes:r.mistakes}));
  } finally { disposeTrackGroup(group); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for(const track of [NEON_CAUSEWAY,ROUTE_LAB,ION_FOUNDRY]) {
    for(const difficulty of Object.keys(CPU_DIFFICULTIES)) {
      const rows=[0,1,2].flatMap(run=>measureCpuRace(track,difficulty,run));
      const times=rows.map(r=>r.time).filter(t=>t!==null), mean=times.reduce((a,b)=>a+b,0)/times.length;
      const sum=k=>rows.reduce((total,r)=>total+r[k],0);
      console.log(JSON.stringify({track:track.name,difficulty,finished:times.length,total:rows.length,
        mean:+mean.toFixed(2),spread:+Math.sqrt(times.reduce((a,t)=>a+(t-mean)**2,0)/times.length).toFixed(2),
        walls:sum('walls'),pads:sum('pads'),routes:sum('routes'),recoveries:sum('recoveries'),mistakes:sum('mistakes')}));
    }
  }
}
