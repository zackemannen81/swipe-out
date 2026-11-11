import test from 'node:test';
import assert from 'node:assert/strict';
import {BLOCKOUT_ROOMS} from '../src/tour-blockout.js';
import {createTourBusScene} from '../src/tour-bus.js';
import {TOUR_VIEWS,TOUR_ZONES,tourRoute} from '../src/tour-bus-zones.js';
import {createTourSession} from '../src/tour-session.js';
import intros from '../src/tour-intros.json' with {type:'json'};
test('all new public interiors have grounded shells, interior cameras, narration and persistent destinations',()=>{
 const hub=createTourBusScene();let data=null;const store={getItem:()=>data,setItem:(k,v)=>data=v};
 for(const r of BLOCKOUT_ROOMS){
  const zone=TOUR_ZONES[r.zone],view=TOUR_VIEWS[r.station];assert.ok(tourRoute('01',r.zone));assert.ok(intros[r.zone]?.text);
  assert.ok(hub.scene.getObjectByName('TB-ROOM-'+r.zone));
  const local=view.position.map((v,i)=>v-zone.position[i]);assert.ok(Math.abs(local[0])<r.size[0]/2);assert.ok(local[1]>0&&local[1]<r.size[2]);assert.ok(Math.abs(local[2])<r.size[1]/2);
  hub.setView(r.station,true);assert.ok(hub.registry.filter(x=>x.group.visible&&x.kind!=='stars').every(x=>x.zoneId===r.zone));
  const s=createTourSession(store);s.visit(r.station,'collective');s.location('bus');assert.equal(createTourSession(store).state.station,r.station);
 }
 assert.equal(tourRoute('01','16'),null);assert.ok(hub.scene.getObjectByName('TB-ROOM-16'));assert.equal(hub.setView('restricted'),false);
 hub.scene.traverse(o=>{if(o.geometry?.attributes.position)assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));});hub.dispose();
});
