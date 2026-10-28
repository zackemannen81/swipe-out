import * as THREE from 'three';
import { hasSurface, getTrackFrame, getTrackWidth } from './track-path.js';
import { padPlacement } from './track-pads.js';
import { WEAPONS } from './combat.js';
import { WEAPON_ICONS } from './weapon-icons.js';

// Fallback only when the author supplied no weapon pads. Never modify track data.
export function automaticWeaponPads(curve, existing=[]) {
  const pads=[],length=curve.getLength(),types=Object.keys(WEAPONS);
  const add=(d,routeId,metric=1,offset=0)=>{
    if(existing.some(p=>(p.routeId??null)===(routeId??null)&&Math.abs(p.d-d)<14*metric&&Math.abs(p.offset-offset)<2.8))return;
    const pad={id:'auto-weapon-'+pads.length,type:'weapon',weapon:types[pads.length%types.length],progress:d/length,offset,...(routeId?{routeId}:{})};
    pads.push(pad);
  };
  for(let d=95;d<length-25;d+=230){
    if(!hasSurface(curve,d,40)||curve.track.branches.some(b=>[b.start,b.end].some(u=>Math.abs(d-u*length)<45)))continue;
    const f=getTrackFrame(curve,d/length);if(f.tangent.dot(getTrackFrame(curve,(d+25)/length).tangent)<.9||getTrackWidth(curve,d/length)<4)continue;
    const width=getTrackWidth(curve,d/length);
    if(width>=10){add(d,undefined,1,-Math.min(3,width/2-2));add(d,undefined,1,Math.min(3,width/2-2));}else add(d);
  }
  for(const b of curve.track.branches)for(let d=75;d<b.length-65;d+=230)add((b.start+(b.end-b.start)*d/b.length)*length,b.id,b.span/b.length);
  return pads;
}
export function addWeaponPads(group,curve,definitions) {
  const pads=definitions.map(p=>{const {d,metric}=padPlacement(curve,p);return {...p,d,metric};});
  const visual=new THREE.Group();visual.visible=false;group.add(visual);
  const bases=new THREE.InstancedMesh(new THREE.BoxGeometry(2.8,.06,6),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}),pads.length);
  bases.frustumCulled=false;visual.add(bases);
  // One batch per weapon, owned by this track group and disposed with it.
  const tokens=Object.fromEntries(Object.keys(WEAPONS).map(type=>{
    const map=typeof document==='undefined'?null:new THREE.TextureLoader().load(WEAPON_ICONS[type]);
    if(map)map.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(2.4,2.4),new THREE.MeshBasicMaterial({
      map,color:0xffffff,transparent:true,alphaTest:.08,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
    }),pads.filter(p=>p.weapon===type).length);
    mesh.name='weapon-icon-'+type;mesh.frustumCulled=false;visual.add(mesh);return [type,mesh];
  }));
  const counts={};const tokenIndices=pads.map(p=>{const index=counts[p.weapon]??0;counts[p.weapon]=index+1;return index;});
  const frames=pads.map(p=>padPlacement(curve,p).frameAt(p.d-2*p.metric));
  group.userData.weaponPads={visual,bases,tokens,tokenIndices,pads,frames,initialized:false};
  updateWeaponPads(group,0);return pads;
}
export function updateWeaponPads(group,seconds,combat=null,preview=false) {
  const data=group?.userData.weaponPads;if(!data)return;
  const {visual,bases,tokens,tokenIndices,pads,frames}=data;visual.visible=preview||!!combat?.enabled;
  if(!visual.visible && data.initialized)return;
  data.initialized=true;
  const matrix=new THREE.Matrix4(),scale=new THREE.Vector3(),position=new THREE.Vector3(),color=new THREE.Color();
  pads.forEach((pad,i)=>{
    const ready=!combat||combat.padReady(pad.id),frame=frames[i];
    position.copy(frame.center).addScaledVector(frame.right,pad.offset).addScaledVector(frame.normal,.09);
    matrix.compose(position,frame.rotation,scale.set(1,1,1));bases.setMatrixAt(i,matrix);bases.setColorAt(i,color.set(ready?0x7137aa:0x261b32));
    position.addScaledVector(frame.normal,1.7+.15*Math.sin(seconds*2+i));
    const rotation=frame.rotation.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI+.3*Math.sin(seconds*.9+i)));
    matrix.compose(position,rotation,scale.setScalar(ready?1:0));tokens[pad.weapon].setMatrixAt(tokenIndices[i],matrix);
  });
  for(const mesh of [bases,...Object.values(tokens)]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
}
