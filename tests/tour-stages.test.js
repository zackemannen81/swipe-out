import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {BUILTIN_TRACKS,readTrackLibrary,saveTrack} from '../src/track-library.js';
import {validateGlb} from '../src/glb-scenery.js';
import {createTourSession} from '../src/tour-session.js';
import {tourTrackKey} from '../src/tour-destinations.js';
const manifest=JSON.parse(fs.readFileSync('docs/TOUR_STAGES_MANIFEST.json'));
test('three supplied stages retain authored identity and media are present and byte-verified',()=>{
 const seen=new Set();
 function walk(value){if(Array.isArray(value))return value.forEach(walk);if(value&&typeof value==='object')return Object.values(value).forEach(walk);if(typeof value==='string'&&value.startsWith('/'))seen.add(value);}
 for(const item of manifest){const data=BUILTIN_TRACKS[item.key].data;assert.equal(data.name,item.name);assert.equal(data.id,item.authoredId);assert.equal(data.centerline.length,item.points);assert.equal(data.objects.length,item.objects);walk(data);
  for(const asset of item.assets){const bytes=fs.readFileSync('public'+asset.url);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);}
 }
 for(const url of seen){assert.ok(fs.existsSync('public'+url),url);if(url.endsWith('.glb')){const b=fs.readFileSync('public'+url);validateGlb(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}}
 assert.equal(tourTrackKey('necros',BUILTIN_TRACKS),'track19');assert.equal(tourTrackKey('vitrum',BUILTIN_TRACKS),'track20');assert.equal(tourTrackKey('collective',BUILTIN_TRACKS),'track21');
});
test('shipped tracks do not overwrite saved legacy tracks or overrides; Collective session persists',()=>{
 const data=new Map(),store={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 saveTrack(store,'custom-e7ead7a3-b303-4c3d-9464-ca52f28e8386',{...BUILTIN_TRACKS.track1.data,name:'Preserve my Necros draft'});
 saveTrack(store,'track20',{...BUILTIN_TRACKS.track20.data,name:'My Vitrum edits'});
 const lib=readTrackLibrary(store);assert.equal(lib.entries['custom-e7ead7a3-b303-4c3d-9464-ca52f28e8386'].name,'Preserve my Necros draft');assert.equal(lib.entries.track20.name,'My Vitrum edits');assert.equal(lib.entries.track18.name,BUILTIN_TRACKS.track18.name);assert.notEqual(BUILTIN_TRACKS.track20.name,'My Vitrum edits');
 const session=createTourSession(store);session.visit('observation','collective');session.location('bus');assert.equal(createTourSession(store).state.world,'collective');
 assert.equal(tourTrackKey('necros',{'custom-e7ead7a3-b303-4c3d-9464-ca52f28e8386':{}}),'custom-e7ead7a3-b303-4c3d-9464-ca52f28e8386');
});
