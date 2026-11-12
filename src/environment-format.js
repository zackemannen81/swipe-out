import {normalizeTrack,parseTrack,MAX_TRACK_BYTES} from './track-format.js';
export const ENVIRONMENT_FORMAT='swipeout-environment';
const scaffold={width:10,horizontalScale:1,centerline:[[0,0,0],[200,0,0],[200,0,200],[0,0,200]],objects:[]};
const defaults=()=>({camera:{position:[12,10,18],target:[0,2,0],fov:45},lighting:{ambient:2.4,key:3},background:'#080f1a'});
function number(v,min,max,label){if(!Number.isFinite(v)||v<min||v>max)throw Error(`Invalid scene ${label}`);return v;}
function vector(v,label){if(!Array.isArray(v)||v.length!==3)throw Error(`Invalid scene ${label}`);return v.map(n=>number(n,-100000,100000,label));}
export function normalizeEnvironment(value){
 const {environment,...data}=value;const normalized=normalizeTrack(data),d=defaults(),e=environment??d;
 const camera={position:vector(e.camera?.position??d.camera.position,'camera position'),target:vector(e.camera?.target??d.camera.target,'camera target'),fov:number(e.camera?.fov??45,15,100,'FOV')};
 if(Math.hypot(...camera.position.map((n,i)=>n-camera.target[i]))<.01)throw Error('Camera position and target must differ');
 const lighting={ambient:number(e.lighting?.ambient??2.4,0,10,'ambient light'),key:number(e.lighting?.key??3,0,10,'key light')};
 const background=e.background??d.background;if(!/^#[0-9a-f]{6}$/i.test(background))throw Error('Invalid scene background color');
 return {...normalized,environment:{camera,lighting,background}};
}
export function newEnvironment(id,name='Untitled room',room=false){
 const objects=room?[
  {id:'floor',type:'box',position:[0,-.25,0],scale:[24,.5,24],color:'#33434c'},
  {id:'back-wall',type:'box',position:[0,4,-12],scale:[24,8,.4],color:'#233440'},
  {id:'left-wall',type:'box',position:[-12,4,0],scale:[.4,8,24],color:'#233440'},
  {id:'right-wall',type:'box',position:[12,4,0],scale:[.4,8,24],color:'#233440'},
 ]:[];
 return normalizeEnvironment({...scaffold,id,name,objects});
}
export function environmentDocument(value){const v=normalizeEnvironment(value);return {format:ENVIRONMENT_FORMAT,version:1,scene:{id:v.id,name:v.name,horizontalScale:v.horizontalScale,objects:v.objects,...(v.sky?{sky:v.sky}:{}),...(v.music?{music:v.music}:{}),...v.environment}};}
export function serializeEnvironment(value){const text=JSON.stringify(environmentDocument(value),null,2);if(new TextEncoder().encode(text).length>MAX_TRACK_BYTES)throw Error('Scene exceeds 64 MB; use model paths for large assets.');return text+'\n';}
export function parseEnvironment(text){
 if(new TextEncoder().encode(text).length>MAX_TRACK_BYTES)throw Error('Scene exceeds 64 MB');
 const doc=JSON.parse(text);
 if(doc?.format!==ENVIRONMENT_FORMAT){const track=parseTrack(text);return normalizeEnvironment({...track,environment:defaults()});}
 if(doc.version!==1||!doc.scene||typeof doc.scene!=='object')throw Error('Unsupported environment document');
 const s=doc.scene;
 for(const key of Object.keys(s))if(!['id','name','horizontalScale','objects','sky','music','camera','lighting','background'].includes(key))throw Error('Unknown scene field: '+key);
 return normalizeEnvironment({...scaffold,id:s.id,name:s.name,horizontalScale:s.horizontalScale??1,objects:s.objects,sky:s.sky,music:s.music,environment:{camera:s.camera,lighting:s.lighting,background:s.background}});
}
