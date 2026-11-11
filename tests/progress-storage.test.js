import test from 'node:test';
import assert from 'node:assert/strict';
import {createProgressStorage} from '../src/progress-storage.js';
import {loadProfile,saveProfile,PROFILE_KEY} from '../src/career.js';
import {readRaceRecords,saveRaceResult} from '../src/race-records.js';
const memory=()=>{const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
const database=()=>{const data=new Map();return {data,read:async k=>data.get(k),write:async(k,v)=>data.set(k,v)};};
const result={key:'track21|elite',name:'The Collective',time:225.43,position:1,bestLap:71.06};
test('full localStorage retains legacy profile and saves records/profile through durable storage',async()=>{
 const local=memory(),db=database();const p=loadProfile(local);p.paint='cyan';saveProfile(local,p);const legacy=local.getItem(PROFILE_KEY);
 local.setItem=()=>{throw Error('QuotaExceededError');};
 const store=await createProgressStorage(local,db);assert.equal(loadProfile(store).paint,'cyan');
 saveRaceResult(store,result);const next=loadProfile(store);next.paint='magenta';saveProfile(store,next);await store.flush();
 const reloaded=await createProgressStorage(local,db);assert.equal(readRaceRecords(reloaded)[0].time,225.43);assert.equal(loadProfile(reloaded).paint,'magenta');assert.equal(local.getItem(PROFILE_KEY),legacy);
});
test('both-store failure rejects, retains session values and subsequent save can recover',async()=>{
 const local=memory(),db=database();let fail=true;local.setItem=()=>{throw Error('full');};db.write=async(k,v)=>{if(fail)throw Error('blocked');db.data.set(k,v);};
 const store=await createProgressStorage(local,db);saveRaceResult(store,result);await assert.rejects(store.flush());assert.equal(readRaceRecords(store).length,1);
 fail=false;saveRaceResult(store,{...result,time:220});await store.flush();assert.equal(readRaceRecords(await createProgressStorage(local,db))[0].time,220);
});
test('serialized snapshots and newer local fallback survive unavailable durable writes',async()=>{
 const local=memory(),db=database(),store=await createProgressStorage(local,db);
 saveRaceResult(store,result);saveRaceResult(store,{...result,time:210});await store.flush();
 db.write=async()=>{throw Error('blocked');};saveRaceResult(store,{...result,time:205});await store.flush();
 const reloaded=await createProgressStorage(local,db);assert.equal(readRaceRecords(reloaded)[0].time,205);
});
