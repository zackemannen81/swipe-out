import {VITRUM} from '../src/track-vitrum.js';
import {createTrackCurve} from '../src/track-path.js';
import {createShipPhysics,stepShipPhysics} from '../src/ship-physics.js';
const l=createTrackCurve(VITRUM).getLength();
for(let u=.50;u<.66;u+=.01){let results=[];for(const speed of [80,140,210,280]){const c=createTrackCurve({...VITRUM,gaps:[{start:u,end:u+25/l}]});const s=createShipPhysics(speed);s.distance=u*l-2;for(let i=0;i<120*10&&!s.landings&&!s.recoveries;i++)stepShipPhysics(s,{thrust:1},1/120,c,speed,26);results.push(s.landings);}console.log(u.toFixed(2),results.join(','));}
