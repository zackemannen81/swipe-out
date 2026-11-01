import assert from 'node:assert/strict';
import test from 'node:test';
import {loadProfile,normalizeProfile,saveProfile,awardCampaign,loadout,SHIPS,unlocked} from '../src/career.js';
test('career unlocks earned from campaign finishing, podium and Elite win; replay is idempotent',()=>{
 const p=normalizeProfile(null);assert.equal(unlocked(SHIPS[1],p),false);
 assert.deepEqual(awardCampaign(p,{position:4,time:100,difficulty:'rookie',key:'course|rookie'}),['finish']);
 assert.equal(unlocked(SHIPS[1],p),true);assert.equal(unlocked(SHIPS[2],p),false);
 assert.deepEqual(awardCampaign(p,{position:2,time:95,difficulty:'pilot',key:'course|pilot'}),['podium']);
 assert.deepEqual(awardCampaign(p,{position:1,time:90,difficulty:'elite',key:'course|elite'}),['win','elite']);
 assert.deepEqual(awardCampaign(p,{position:1,time:99,difficulty:'elite',key:'course|elite'}),[]);
 assert.equal(p.bests['course|elite'].time,90);assert.equal(Object.keys(p.bests).length,3);
 assert.deepEqual(awardCampaign(p,{position:0,time:NaN}),[]);
});
test('locked choices and malformed persistence fall back; earned loadout survives reload; standards isolate upgrades',()=>{
 const p=normalizeProfile({version:1,ship:'orca',module:'engine',paint:'gold'});assert.equal(p.ship,'racer');assert.equal(p.module,'stock');
 awardCampaign(p,{position:1,time:100,difficulty:'pilot',key:'x'});p.ship='orca';p.module='engine';p.paint='gold';
 let value;const storage={setItem(k,v){value=v;},getItem(){return value;}};
 assert.equal(saveProfile(storage,p),'');const loaded=loadProfile(storage);assert.equal(loaded.ship,'orca');assert.equal(loadout(loaded).speed,1.05*1.04);assert.deepEqual(loadout(loaded,true),{ship:'racer',speed:1,force:1,mass:1});
 assert.equal(loadProfile({getItem(){return '{broken';}}).ship,'racer');assert.match(saveProfile({setItem(){throw Error();}},p),/Could not save/);
});
