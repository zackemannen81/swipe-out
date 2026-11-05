const STORAGE='swipe-out:race-records:v1';
export function readRaceRecords(storage){try{const raw=JSON.parse(storage.getItem(STORAGE));if(raw?.version!==1||!Array.isArray(raw.rows))return [];return raw.rows.filter(r=>r&&typeof r.key==='string'&&r.key.length<500&&typeof r.name==='string'&&r.name.length<200&&Number.isFinite(r.time)&&r.time>0&&Number.isInteger(r.position)&&r.position>=1&&r.position<=5&&(r.bestLap==null||(Number.isFinite(r.bestLap)&&r.bestLap>0))&&(r.label===undefined||(typeof r.label==='string'&&r.label.length<300))).slice(-200);}catch{return [];}}
export function timeMedal(time,length,laps=3){return time<=length*laps/110?'GOLD':time<=length*laps/95?'SILVER':time<=length*laps/80?'BRONZE':null;}
export function saveRaceResult(storage,result){
 if(!Number.isFinite(result.time)||result.time<=0)return null;
 const rows=readRaceRecords(storage),old=rows.find(r=>r.key===result.key),improved=!old||result.time<old.time;
 const bestLap=Number.isFinite(result.bestLap)&&result.bestLap>0?result.bestLap:null;
 const row={...result,time:Math.min(old?.time??Infinity,result.time),position:Math.min(old?.position??5,result.position),bestLap:Math.min(old?.bestLap??Infinity,bestLap??Infinity)};
 if(!Number.isFinite(row.bestLap))row.bestLap=null;
 const next=[...rows.filter(r=>r.key!==result.key),row].slice(-200);let error='';try{storage.setItem(STORAGE,JSON.stringify({version:1,rows:next}));}catch{error='Record could not be saved.';}
 return {improved,delta:old?result.time-old.time:null,best:row.time,error};
}
