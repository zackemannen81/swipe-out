import {environmentDocument,parseEnvironment,normalizeEnvironment} from './environment-format.js';
async function db(){return new Promise((resolve,reject)=>{
 if(typeof indexedDB==='undefined'){reject(Error('Scene storage unavailable. Download JSON to keep your work.'));return;}
 const r=indexedDB.open('swipe-out-environments',1);r.onupgradeneeded=()=>r.result.createObjectStore('scenes',{keyPath:'key'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Close other editor tabs and retry scene storage.'));
});}
async function run(mode,action){const database=await db();try{return await new Promise((resolve,reject)=>{const tx=database.transaction('scenes',mode),r=action(tx.objectStore('scenes'));tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error??Error('Scene write aborted'));});}finally{database.close();}}
export async function loadEnvironments(){const entries={},issues=[];try{for(const row of await run('readonly',s=>s.getAll())){try{entries[row.key]={data:parseEnvironment(JSON.stringify(row.document))};}catch(e){issues.push(`${row.key}: ${e.message}`);}}}catch(e){issues.push(e.message);}return {entries,issues};}
export async function persistEnvironment(key,value){const normalized=normalizeEnvironment(value);await run('readwrite',s=>s.put({key,document:environmentDocument(normalized)}));return normalized;}
export async function removeEnvironment(key){await run('readwrite',s=>s.delete(key));}
