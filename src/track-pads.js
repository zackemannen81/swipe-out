import * as THREE from 'three';
import { createTrackCurve, getTrackFrame, getTrackWidth, hasSurface } from './track-path.js';

export function padPlacement(curve, pad) {
  const length = curve.getLength(), branch = curve.track.branches.find(b=>b.id===pad.routeId);
  const metric = branch ? branch.span / branch.length : 1;
  const frameAt = d => branch ? branch.frame((d / length - branch.start) / (branch.end - branch.start)) : getTrackFrame(curve,d/length);
  const widthAt = d => branch ? branch.widthAt((d/length-branch.start)/(branch.end-branch.start)) : getTrackWidth(curve,d/length);
  const d = pad.progress * length;
  return { ...pad, d, metric, frameAt, widthAt };
}

export function validatePads(definition) {
  if (!definition.pads?.length) return;
  const curve = createTrackCurve(definition), length = curve.getLength();
  const checked=[];
  for(const pad of definition.pads) {
    const p = padPlacement(curve,pad), branch = curve.track.branches.find(b=>b.id===pad.routeId);
    if(checked.some(other=>(other.routeId??null)===(p.routeId??null) && Math.abs(other.d-p.d)<6*p.metric && Math.abs(other.offset-p.offset)<2.8)) throw new Error('Pad '+pad.id+': pads must not overlap.');
    checked.push(p);
    for(const step of [-5,-2,1]) {
      const d = p.d + step*p.metric;
      if(branch ? d <= branch.start*length || d >= branch.end*length : !hasSurface(curve,d,0.5)) throw new Error('Pad '+pad.id+': leave the whole pad on continuous road.');
      if(Math.abs(p.offset)+1.4 > p.widthAt(d)/2) throw new Error('Pad '+pad.id+': move the pad inside the road edges.');
    }
  }
}

// Suggestions are deliberately conservative: a clear acceleration corridor,
// no junction, gap or tight bend in the next 100 metres. Existing pads untouched.
export function suggestBoostPads(definition) {
  const curve = createTrackCurve(definition), length = curve.getLength(), result=[];
  for(let d=70;d<length-100;d+=140) {
    if(!hasSurface(curve,d,110)) continue;
    if(curve.track.branches.some(b=>[b.start,b.end].some(u=>Math.abs(d-u*length)<110))) continue;
    const f=getTrackFrame(curve,d/length);
    if([25,50,75,100].some(a=>getTrackFrame(curve,(d+a)/length).tangent.dot(f.tangent)<0.94)) continue;
    if((definition.pads??[]).some(p=>!p.routeId && Math.abs(p.progress*length-d)<30)) continue;
    result.push({id:'suggested-'+Math.round(d),type:'boost',progress:d/length,offset:0});
  }
  return result;
}

function addBatch(group, geometry, material, matrices) {
  const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);
  matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
  group.add(mesh);
}

export function addAuthoredPads(group, curve, pads, placements) {
  const materials = ['boost','brake'].map(type=>new THREE.MeshStandardMaterial({color:type==='boost'?0x55ffb3:0xff6a32,emissive:type==='boost'?0x18ed80:0xff3709,emissiveIntensity:2}));
  group.userData.padMaterials = materials;
  const bases=[], boosts=[], brakes=[];
  const baseMaterial = new THREE.MeshStandardMaterial({color:0x101b27,roughness:0.5});
  const baseGeometry = new THREE.BoxGeometry(2.8,0.04,6);
  const barGeometry = new THREE.BoxGeometry(2.35,0.05,0.25);
  const arrowGeometry = new THREE.BoxGeometry(0.22,0.05,1.35);
  for(const pad of pads) {
    const p=padPlacement(curve,pad), material=materials[pad.type==='brake'?1:0];
    placements.push({id:pad.id,type:pad.type,d:p.d,offset:p.offset,routeId:pad.routeId,metric:p.metric});
    const frame=p.frameAt(p.d-2*p.metric);
    const base=new THREE.Mesh(baseGeometry,baseMaterial);
    base.position.copy(frame.center).addScaledVector(frame.right,p.offset).addScaledVector(frame.normal,0.075);
    base.quaternion.copy(frame.rotation); base.updateMatrix(); bases.push(base.matrix.clone());
    for(let i=0;i<3;i++) {
      const f=p.frameAt(p.d-i*2*p.metric);
      for(const side of pad.type==='brake'?[0]:[-1,1]) {
        const mark=new THREE.Mesh(pad.type==='brake'?barGeometry:arrowGeometry,material);
        mark.position.copy(f.center).addScaledVector(f.right,p.offset+side*0.46).addScaledVector(f.normal,0.13);
        mark.quaternion.copy(f.rotation);
        if(side) mark.rotateY(-side*0.7);
        mark.updateMatrix(); (pad.type==='brake'?brakes:boosts).push(mark.matrix.clone());
      }
    }
  }
  addBatch(group,baseGeometry,baseMaterial,bases);
  addBatch(group,arrowGeometry,materials[0],boosts);
  addBatch(group,barGeometry,materials[1],brakes);
}

export function updateTrackPresentation(group, seconds) {
  for(const [i,material] of (group?.userData.padMaterials??[]).entries()) material.emissiveIntensity=1.7+0.65*(1+Math.sin(seconds*5-i));
}

export function addCornerSigns(group, curve) {
  const length=curve.getLength(), material=new THREE.MeshStandardMaterial({color:0xffcf63,emissive:0xff9900,emissiveIntensity:1.5});
  const geometry=new THREE.BoxGeometry(0.15,0.12,1.6);
  const matrices=[];
  let last=-200;
  for(let d=40;d<length-120;d+=15) {
    const frame=getTrackFrame(curve,d/length), ahead=getTrackFrame(curve,(d+110)/length);
    const turn=ahead.tangent.dot(frame.right);
    if(Math.abs(turn)<0.45 || d-last<120 || !hasSurface(curve,d,15) || curve.track.branches.some(b=>[b.start,b.end].some(u=>Math.abs(d-u*length)<40))) continue;
    last=d;
    for(let n=0;n<3;n++) {
      const f=getTrackFrame(curve,(d+n*4)/length);
      for(const side of [-1,1]) {
        const mesh=new THREE.Mesh(geometry,material);
        mesh.position.copy(f.center).addScaledVector(f.right,-Math.sign(turn)*(getTrackWidth(curve,(d+n*4)/length)/2-1)).addScaledVector(f.tangent,-Math.sign(turn)*side*0.45).addScaledVector(f.normal,0.15);
        mesh.quaternion.copy(f.rotation); mesh.rotateY(-side*0.7); mesh.rotateY(Math.sign(turn)*Math.PI/2);
        mesh.updateMatrix(); matrices.push(mesh.matrix.clone());
      }
    }
  }
  addBatch(group,geometry,material,matrices);
}
