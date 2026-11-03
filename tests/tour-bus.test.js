import test from 'node:test';
import assert from 'node:assert/strict';
import {createTourBusScene,TOUR_VIEWS} from '../src/tour-bus.js';
test('Tour Bus replacement inventory covers named groups and navigation has finite camera poses',()=>{
 const hub=createTourBusScene(),rows=hub.manifest();
 assert.ok(rows.length>35);assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
 for(const row of rows){assert.equal(hub.scene.getObjectByName(row.id).userData.assetId,row.id);assert.ok(row.position.every(Number.isFinite));assert.ok(row.size.every(Number.isFinite));assert.ok(row.description.length>20);}
 for(const id of Object.keys(TOUR_VIEWS)){hub.setView(id);for(let i=0;i<120;i++)hub.update(1/60);assert.ok(hub.camera.position.distanceTo({x:TOUR_VIEWS[id].position[0],y:TOUR_VIEWS[id].position[1],z:TOUR_VIEWS[id].position[2]})<.03);}
 hub.setWorld('vitrum');hub.setView('hangar');hub.update(0,false);hub.camera.position.toArray().forEach((v,i)=>assert.ok(Math.abs(v-TOUR_VIEWS.hangar.position[i])<1e-10));
 hub.dispose();
});
