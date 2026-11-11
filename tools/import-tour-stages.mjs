import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {decodeTrack} from '../src/track-format.js';
const source=process.argv[2]??'C:/Users/zakri/Desktop/tourbus/stages';
const files=[['necken.json','necros','track19'],['VITRUM LITHOFYTER.json','vitrum','track20'],['the_collective.json','collective','track21']];
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=[];
fs.mkdirSync('src/tour-stages',{recursive:true});
for(const [file,world,key] of files){
 const raw=fs.readFileSync(path.join(source,file)),doc=JSON.parse(raw.toString('utf8').replace(/^\uFEFF/,''));decodeTrack(doc);
 const assets=new Map();
 function extract(v){
  if(Array.isArray(v))return v.map(extract);
  if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,extract(x)]));
  if(typeof v==='string'&&v.startsWith('data:')){
   const match=v.match(/^data:([^;]+);base64,([\s\S]+)$/);if(!match)throw Error('Unsupported data URI');
   const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','model/gltf-binary':'glb'}[match[1]];if(!ext)throw Error(match[1]);
   const bytes=Buffer.from(match[2],'base64'),sha=hash(bytes),url=`/${ext==='glb'?'models':'images'}/tour-stages/${sha}.${ext}`;
   fs.mkdirSync(path.dirname('public'+url),{recursive:true});fs.writeFileSync('public'+url,bytes);assets.set(url,{url,sha256:sha,bytes:bytes.length});
   assert.deepEqual(fs.readFileSync('public'+url),bytes);return url;
  }return v;
 }
 const packed=extract(doc);decodeTrack(packed);
 // Restore each changed field from its original after verifying extracted bytes.
 function parity(a,b){if(typeof a==='string'&&a.startsWith('data:')){assert.equal(hash(Buffer.from(a.split(',')[1],'base64')),hash(fs.readFileSync('public'+b)));return;}if(Array.isArray(a)){assert.equal(a.length,b.length);a.forEach((x,i)=>parity(x,b[i]));}else if(a&&typeof a==='object'){assert.deepEqual(Object.keys(a),Object.keys(b));for(const k of Object.keys(a))parity(a[k],b[k]);}else assert.deepEqual(a,b);}
 parity(doc,packed);
 const output=`src/tour-stages/${world}.json`;fs.writeFileSync(output,JSON.stringify(packed)+'\n');
 const entry={file,world,key,name:doc.track.name,authoredId:doc.track.id,sourceSha256:hash(raw),sourceBytes:raw.length,outputBytes:fs.statSync(output).size,points:doc.track.centerline.length,objects:doc.track.objects.length,assets:[...assets.values()]};manifest.push(entry);
 console.log(`${world}: ${entry.points} points / ${entry.objects} objects, ${entry.sourceBytes} → ${entry.outputBytes} JSON bytes; ${assets.size} unique media`);
}
fs.writeFileSync('docs/TOUR_STAGES_MANIFEST.json',JSON.stringify(manifest,null,2)+'\n');
