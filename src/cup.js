export const CUP = Object.freeze({id:'foundry-v1',name:'Foundry Cup',tracks:['track1','track13','track15'],points:[10,7,5,3,1]});
export const CUP_RACERS=['player','Vanta','Kestrel','Orca','Nexus-9'];
export const CUP_KEY='swipeout.cup.v1';
const defaults=()=>({version:1,active:null,bests:{}});
export function cupSettings(value){
 if(!value||!['rookie','pilot','elite'].includes(value.difficulty)||!['swipeout','wipeout'].includes(value.handling)||typeof value.combat!=='boolean'||![0,.5,1].includes(value.assist))throw Error('Invalid cup settings');
 return {difficulty:value.difficulty,handling:value.handling,assist:value.assist,combat:value.combat};
}
export function cupRecordKey(settings){const s=cupSettings(settings);return [CUP.id,s.difficulty,s.handling,s.assist,s.combat?'combat':'clean'].join(':');}
export function validResult(result){
 return Array.isArray(result)&&result.length===5&&new Set(result.map(r=>r.id)).size===5&&result.every(r=>CUP_RACERS.includes(r.id)&&(r.time===null||(Number.isFinite(r.time)&&r.time>=0))&&Number.isFinite(r.distance)&&r.distance>=0);
}
export function loadCup(storage){
 try{
  const raw=storage.getItem(CUP_KEY);if(!raw)return {data:defaults(),warning:''};if(raw.length>50000)throw Error();
  const data=JSON.parse(raw);if(data.version!==1||!data.bests||typeof data.bests!=='object'||Array.isArray(data.bests))throw Error();
  if(Object.entries(data.bests).some(([key,v])=>!key.startsWith(CUP.id+':')||!Number.isInteger(v)||v<1||v>5))throw Error();
  if(data.active){const a=data.active;if(a.id!==CUP.id||!Array.isArray(a.results)||a.results.length>3||!a.results.every(validResult))throw Error();cupSettings(a.settings);}
  return {data,warning:''};
 }catch{return {data:defaults(),warning:'Saved cup could not be read. A new cup can be started.'};}
}
export function raceOrder(racers){
 const sorted=racers.map(r=>({...r})).sort((a,b)=>a.time!==null&&b.time!==null?a.time-b.time||CUP_RACERS.indexOf(a.id)-CUP_RACERS.indexOf(b.id):a.time!==null?-1:b.time!==null?1:b.distance-a.distance||CUP_RACERS.indexOf(a.id)-CUP_RACERS.indexOf(b.id));
 if(!validResult(sorted))throw Error('Invalid race results');return sorted;
}
export function standings(results){
 const rows=CUP_RACERS.map(id=>({id,points:0,places:[0,0,0,0,0],last:5}));
 for(const result of results)result.forEach((r,i)=>{const row=rows.find(x=>x.id===r.id);if(r.time!==null){row.points+=CUP.points[i];row.places[i]++;}row.last=i;});
 return rows.sort((a,b)=>b.points-a.points||a.places.reduce((diff,n,i)=>diff||b.places[i]-n,0)||a.last-b.last||CUP_RACERS.indexOf(a.id)-CUP_RACERS.indexOf(b.id));
}
export function medal(place){return ['GOLD','SILVER','BRONZE'][place-1]??'CUP COMPLETE';}
export class CupProgress {
 constructor(storage){this.storage=storage;Object.assign(this,loadCup(storage));}
 get active(){return this.data.active;}
 save(){try{this.storage.setItem(CUP_KEY,JSON.stringify(this.data));this.warning='';return true;}catch{this.warning='Cup progress is kept for this session only. Browser storage is unavailable.';return false;}}
 start(settings){this.data.active={id:CUP.id,settings:cupSettings(settings),results:[]};this.save();return this.active;}
 record(round,racers){
  const a=this.active;if(!a||round!==a.results.length||round>=3)return false;
  a.results.push(raceOrder(racers));
  if(a.results.length===3){const place=standings(a.results).findIndex(r=>r.id==='player')+1,key=cupRecordKey(a.settings);this.data.bests[key]=Math.min(this.data.bests[key]??5,place);}
  this.save();return true;
 }
}
