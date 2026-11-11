// Small progress snapshots can outlive a full legacy localStorage track library.
export const PROGRESS_KEYS=['swipe-out:career:v1','swipe-out:race-records:v1'];
const PREFIX='swipe-out:progress:v1:';
function valid(row){return row&&row.version===1&&typeof row.value==='string'&&Number.isFinite(row.savedAt);}
export function indexedProgressStore(factory=globalThis.indexedDB){
 async function open(){return new Promise((resolve,reject)=>{
  if(!factory){reject(Error('IndexedDB unavailable'));return;}
  const request=factory.open('swipe-out-progress',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('snapshots');
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  request.onblocked=()=>reject(Error('Progress database blocked'));
 });}
 async function transact(mode,action){const db=await open();try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction('snapshots',mode);const req=action(tx.objectStore('snapshots'));
  tx.oncomplete=()=>resolve(req.result);tx.onabort=()=>reject(tx.error??Error('Progress transaction aborted'));tx.onerror=()=>reject(tx.error);
 });}finally{db.close();}}
 return {read:key=>transact('readonly',s=>s.get(key)),write:(key,row)=>transact('readwrite',s=>s.put(row,key))};
}
export async function createProgressStorage(local,durable=indexedProgressStore()){
 const cache=new Map();let timestamp=Date.now(),pending=Promise.resolve();
 for(const key of PROGRESS_KEYS){
  let legacy=null,a,b;try{legacy=local?.getItem(key);a=JSON.parse(local?.getItem(PREFIX+key));}catch{}
  try{b=await durable.read(key);}catch{}
  const latest=[a,b].filter(valid).sort((x,y)=>y.savedAt-x.savedAt)[0];
  if(latest){cache.set(key,latest.value);timestamp=Math.max(timestamp,latest.savedAt);}else if(legacy!=null)cache.set(key,legacy);
 }
 return {
  getItem:key=>cache.get(key)??null,
  setItem(key,value){
   if(!PROGRESS_KEYS.includes(key))throw Error('Unsupported progress key');
   const row={version:1,value:String(value),savedAt:timestamp=Math.max(Date.now(),timestamp+1)};
   cache.set(key,row.value);
   // Serialize whole snapshots so a slower older write cannot replace a newer save.
   pending=pending.catch(()=>{}).then(async()=>{
    let localSaved=false;try{local.setItem(PREFIX+key,JSON.stringify(row));localSaved=true;}catch{}
    try{await durable.write(key,row);}catch{if(!localSaved)throw Error('Could not save progress on this device. Keep this session open.');}
   });
   pending.catch(()=>{}); // The UI observes flush(); never emit an unhandled rejection.
  },
  flush:()=>pending,
 };
}
