import test from 'node:test';
import assert from 'node:assert/strict';
import {TOUR_ZONES,TOUR_CONNECTIONS,TOUR_VIEWS,tourRoute} from '../src/tour-bus-zones.js';
import {createTourBusScene} from '../src/tour-bus.js';
test('plan registry has sixteen locations, fifteen destinations and valid reciprocal links',()=>{
 assert.equal(Object.keys(TOUR_ZONES).length,16);
 assert.equal(Object.values(TOUR_ZONES).filter(z=>z.available).length,15);
 for(const c of TOUR_CONNECTIONS)for(const id of [c.from,c.to])assert.ok(TOUR_ZONES[id].connections.includes(c.id));
 assert.deepEqual(tourRoute('01','02'),['01','07','02']);
 assert.deepEqual(tourRoute('01','06'),['01','05','06']);assert.equal(tourRoute('01','16'),null);
 assert.ok(TOUR_ZONES['03'].position[2]>33);assert.ok(TOUR_ZONES['06'].position[0]<TOUR_ZONES['05'].position[0]);
});
test('all station pairs cut only under full mask and settle exactly; rapid input is rejected',()=>{
 const hub=createTourBusScene();
 for(const from of Object.keys(TOUR_VIEWS))for(const to of Object.keys(TOUR_VIEWS)){
  hub.setView(from,true);hub.setView(to);const origin=hub.camera.position.toArray();
  if(from!==to)assert.equal(hub.setView(from),false);
  for(let i=0;i<90;i++){const before=hub.camera.position.toArray();hub.update(1/120);if(before.some((v,j)=>v!==hub.camera.position.toArray()[j]))assert.equal(hub.navigation.opacity,1);}
  assert.deepEqual(hub.camera.position.toArray(),TOUR_VIEWS[to].position);assert.equal(hub.navigation.pending,null);
 }
 hub.setView('hangar');hub.update(0,false);assert.deepEqual(hub.camera.position.toArray(),TOUR_VIEWS.hangar.position);
 const rows=hub.manifest();for(const [id,zone] of [['TB-RACER-01','03'],['TB-NEXUS-01','05'],['TB-LOUNGE-01','02'],['TB-WINDOW-01','06']])assert.equal(rows.find(r=>r.id===id).zoneId,zone);
 hub.dispose();
});
