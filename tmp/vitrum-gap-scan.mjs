import {VITRUM} from '../src/track-vitrum.js';
import {createTrackCurve} from '../src/track-path.js';
import {createShipPhysics,stepShipPhysics} from '../src/ship-physics.js';
const l=createTrackCurve(VITRUM).getLength();
for(let u=.04;u<.95;u+=.005){let results=[];for(const speed of [100,160,210,280]){const c=createTrackCurve({...VITRUM,gaps:[{start:u,end:u+16/l}]});const s=createShipPhysics(speed);s.distance=u*l-2;for(let i=0;i<120*6&&!s.landings&&!s.recoveries;i++)stepShipPhysics(s,{thrust:1},1/120,c,speed,26);results.push(s.landings);}if(results.every(Boolean))console.log(u.toFixed(3));}
