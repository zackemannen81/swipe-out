import assert from 'node:assert/strict';
import test from 'node:test';
import {loadProfile,normalizeProfile,saveProfile,awardCampaign,loadout,SHIPS,unlocked,VITRUM_MUSIC,RACE_LAP_OPTIONS,normalizeRaceLaps} from '../src/career.js';
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
 const p=normalizeProfile({version:1,ship:'mycelium',module:'engine',paint:'gold'});assert.equal(p.ship,'racer');assert.equal(p.module,'stock');
 awardCampaign(p,{position:1,time:100,difficulty:'pilot',key:'x'});p.ship='mycelium';p.module='engine';p.paint='gold';
 let value;const storage={setItem(k,v){value=v;},getItem(){return value;}};
 assert.equal(saveProfile(storage,p),'');const loaded=loadProfile(storage);assert.equal(loaded.ship,'mycelium');assert.equal(loadout(loaded).speed,1.05*1.04);assert.deepEqual(loadout(loaded,true),{ship:'racer',speed:1,force:1,mass:1});
 assert.equal(loadProfile({getItem(){return '{broken';}}).ship,'racer');assert.match(saveProfile({setItem(){throw Error();}},p),/Could not save/);
});
import {NECROS_REWARD,REWARD_MUSIC,TROPHIES,grantNecrosPreview,selectedSoundtrack,necrosMastered} from '../src/career.js';
test('all five Necros challenges unlock craft and soundtrack; partial/old profiles normalize correctly',()=>{
 const craft=SHIPS.find(s=>s.id==='necron-crimson-citadel');
 for(const missing of TROPHIES){const p=normalizeProfile({version:1,trophies:TROPHIES.filter(t=>t!==missing).map(t=>t.id),ship:craft.id,soundtrack:REWARD_MUSIC.url});assert.equal(unlocked(craft,p),false);assert.equal(unlocked(REWARD_MUSIC,p),false);assert.equal(p.ship,'racer');assert.equal(selectedSoundtrack(p,'default'),'default');}
 const p=normalizeProfile({version:1,trophies:TROPHIES.map(t=>t.id),ship:craft.id,soundtrack:REWARD_MUSIC.url});assert.equal(unlocked(craft,p),true);assert.equal(p.ship,craft.id);assert.equal(selectedSoundtrack(p,'default'),REWARD_MUSIC.url);assert.equal(loadout(p,true).ship,'racer');
 const progress=normalizeProfile(null);awardCampaign(progress,{time:100,position:1,difficulty:'elite',key:'x'});assert.equal(necrosMastered(progress),false);awardCampaign(progress,{time:90,position:4,difficulty:'rookie',medal:'GOLD',key:'y'});assert.equal(necrosMastered(progress),true);
});
test('preview grants only the two mastery rewards, persists, and never fakes trophies',()=>{
 const p=normalizeProfile(null);grantNecrosPreview(p);p.ship='necron-crimson-citadel';p.soundtrack=REWARD_MUSIC.url;
 const loaded=normalizeProfile(p);assert.deepEqual(loaded.previewRewards,[NECROS_REWARD]);assert.deepEqual(loaded.trophies,[]);assert.equal(unlocked(SHIPS[1],loaded),false);assert.equal(loaded.ship,p.ship);assert.equal(loaded.soundtrack,p.soundtrack);assert.equal(necrosMastered(loaded),false);
});
import {awardConsolation} from '../src/career.js';
test('The sacrifice requires completed last place, automatic full assist and Rookie in a race',()=>{
 const result={event:'race',completed:true,position:5,entrants:5,time:120,handling:'swipeout',assist:1,difficulty:'rookie'};
 const ship=SHIPS.find(s=>s.id==='the-sacrifice');
 for(const change of [{completed:false},{position:4},{position:1},{entrants:1},{time:0},{time:NaN},{handling:'wipeout'},{assist:.5},{assist:0},{difficulty:'pilot'},{difficulty:'elite'},{event:'time-attack'},{event:'cup'}]){
  const p=normalizeProfile(null);assert.deepEqual(awardConsolation(p,{...result,...change}),[]);assert.equal(unlocked(ship,p),false);
 }
 const p=normalizeProfile(null);grantNecrosPreview(p);assert.equal(unlocked(ship,p),false);
 assert.deepEqual(awardConsolation(p,result),['sacrifice']);assert.deepEqual(awardConsolation(p,result),[]);
 p.ship=ship.id;const loaded=normalizeProfile(p);assert.equal(loaded.ship,ship.id);assert.equal(unlocked(ship,loaded),true);assert.equal(loadout(loaded,true).ship,'racer');
 assert.equal(necrosMastered(loaded),false);
 const master=normalizeProfile({version:1,trophies:TROPHIES.map(t=>t.id)});assert.equal(necrosMastered(master),true);assert.equal(unlocked(ship,master),false);
});

test('GOA by ME is selectable and persists as an allowed soundtrack',()=>{
 const song=VITRUM_MUSIC.find(item=>item.name==='GOA by ME');
 assert.equal(song?.url,'/audio/tracks/track017.m4a');
 const profile=normalizeProfile({version:1,soundtrack:song.url});
 assert.equal(profile.soundtrack,song.url);
 assert.equal(selectedSoundtrack(profile,'fallback'),song.url);
});

test('race lap options persist and invalid values fall back to three laps',()=>{
 assert.deepEqual(RACE_LAP_OPTIONS,[3,5,7,10]);
 assert.equal(normalizeProfile(null).laps,3);
 for(const laps of RACE_LAP_OPTIONS){
  const saved=normalizeProfile({version:1,laps});
  assert.equal(saved.laps,laps);
  let content='';const storage={setItem:(k,v)=>{content=v;},getItem:()=>content};
  assert.equal(saveProfile(storage,saved),'');
  assert.equal(loadProfile(storage).laps,laps);
 }
 for(const value of [0,4,11,'5',null,-3,Infinity])assert.equal(normalizeRaceLaps(value),3);
 assert.equal(normalizeProfile({version:1,laps:99}).laps,3);
});
