import test from 'node:test';
import assert from 'node:assert/strict';
import {newEnvironment,normalizeEnvironment,serializeEnvironment,parseEnvironment} from '../src/environment-format.js';
import {serializeTrack,parseTrack} from '../src/track-format.js';
import {BUILTIN_TRACKS} from '../src/track-library.js';
import {createHistory} from '../src/editor-history.js';
test('scene exports only environment data, retaining transforms/camera/light and undo',()=>{
 const scene=newEnvironment('room','Room',true);scene.environment.camera={position:[7,4,8],target:[0,2,-3],fov:65};scene.environment.lighting.key=1.2;
 const history=createHistory(scene);const modified=structuredClone(scene);modified.objects[0].position[0]=6;history.push(modified);assert.equal(history.undo().objects[0].position[0],0);assert.equal(history.redo().objects[0].position[0],6);
 const text=serializeEnvironment(scene),doc=JSON.parse(text);assert.equal(doc.format,'swipeout-environment');assert.equal(doc.scene.centerline,undefined);assert.equal(doc.scene.pads,undefined);assert.deepEqual(parseEnvironment(text),normalizeEnvironment(scene));assert.throws(()=>parseTrack(text));
});
test('track import preserves every scenery field and horizontal scale without race export fields',()=>{
 const track=BUILTIN_TRACKS.track21.data,scene=parseEnvironment(serializeTrack(track));assert.deepEqual(scene.objects,track.objects);assert.equal(scene.horizontalScale,track.horizontalScale);
 const loaded=parseEnvironment(serializeEnvironment(scene));assert.deepEqual(loaded.objects,track.objects);assert.equal(loaded.horizontalScale,track.horizontalScale);
});
test('malformed camera, version and fields rejected; minimum scale is portable',()=>{
 const scene=newEnvironment('a');scene.horizontalScale=.1;assert.equal(parseEnvironment(serializeEnvironment(scene)).horizontalScale,.1);
 const doc=JSON.parse(serializeEnvironment(scene));doc.scene.camera.target=doc.scene.camera.position;assert.throws(()=>parseEnvironment(JSON.stringify(doc)),/differ/);
 doc.version=2;assert.throws(()=>parseEnvironment(JSON.stringify(doc)),/Unsupported/);
 assert.throws(()=>normalizeEnvironment({...scene,environment:{camera:{fov:200}}}),/FOV/);
});
