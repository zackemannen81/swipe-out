import test from 'node:test';import assert from 'node:assert/strict';
import {CUP,CUP_RACERS,CUP_KEY,CupProgress,loadCup,raceOrder,standings,medal} from '../src/cup.js';
const settings={difficulty:'pilot',handling:'swipeout',assist:.5,combat:false};
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
const result=(ids=CUP_RACERS)=>ids.map((id,i)=>({id,time:100+i,distance:1000}));
test('three rounds score once, medals and best finish survive reload',()=>{
 const store=memory(),p=new CupProgress(store);p.start(settings);
 for(let i=0;i<3;i++){assert.ok(p.record(i,result()));assert.equal(p.record(i,result()),false);}
 assert.equal(standings(p.active.results)[0].points,30);assert.equal(medal(1),'GOLD');
 const loaded=new CupProgress(store);assert.equal(loaded.active.results.length,3);assert.deepEqual(Object.values(loaded.data.bests),[1]);
 loaded.start({...settings,difficulty:'elite'});assert.deepEqual(loaded.active.results,[]);assert.equal(Object.values(loaded.data.bests)[0],1);
});
test('interrupted race resumes same round and fixed settings',()=>{
 const store=memory(),p=new CupProgress(store);p.start(settings);p.record(0,result());
 const resumed=new CupProgress(store);assert.equal(CUP.tracks[resumed.active.results.length],'track13');assert.deepEqual(resumed.active.settings,settings);
 assert.equal(resumed.record(2,result()),false);
});
test('all actual finish times beat DNF; DNF uses distance and earns no points',()=>{
 const rows=result();rows[0].time=null;rows[0].distance=900;rows[1].time=null;rows[1].distance=800;
 const order=raceOrder(rows);assert.deepEqual(order.map(r=>r.id),['Kestrel','Orca','Nexus-9','player','Vanta']);
 const table=standings([order]);assert.equal(table.find(r=>r.id==='player').points,0);assert.equal(table[0].points,10);
});
test('ties use countback then most recent race, deterministic even for equal finish times',()=>{
 const a=result(),b=result(['Vanta','player','Kestrel','Orca','Nexus-9']);
 assert.equal(standings([a,b])[0].id,'Vanta');assert.equal(standings([b,a])[0].id,'player');
 const tied=result().map(r=>({...r,time:100}));assert.deepEqual(raceOrder(tied.reverse()).map(r=>r.id),CUP_RACERS);
});
test('invalid storage/settings/results rejected and write failure retains session',()=>{
 for(const raw of ['{','{"version":9}','{"version":1,"bests":{},"active":{"id":"other"}}'])assert.ok(loadCup({getItem:()=>raw}).warning);
 const p=new CupProgress({getItem(){throw Error();},setItem(){throw Error();}});p.start(settings);assert.match(p.warning,/session/);assert.ok(p.record(0,result()));assert.equal(p.active.results.length,1);
 assert.throws(()=>p.start({...settings,assist:7}));assert.throws(()=>raceOrder(result().slice(1)));
});
