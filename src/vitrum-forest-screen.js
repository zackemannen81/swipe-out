import * as THREE from 'three';
import {getTrackFrame, getTrackWidth} from './track-path.js';
import {forestBankHeight} from './vitrum-terrain.js';

export const FOREST_SCREEN_IMAGES = {
  forest: '/images/stage2/parallax/megaforest-v1.png',
  curtain: '/images/stage2/parallax/root-curtain-v2.png',
  understory: '/images/stage2/parallax/undergrowth-v1.png',
};
// Fixed world distances produce real parallax. No camera-following transforms.
export const FOREST_SCREEN_LAYERS = [
  {name: 'near-forest', inset: 280, count: 14, height: 1160, color: 0x879b77},
  {name: 'middle-forest', inset: 640, count: 16, height: 1400, color: 0xacc2ae},
  {name: 'far-silhouettes', inset: 1040, count: 18, height: 1660, color: 0xc5d9d1},
];
const random = n => {const value=Math.sin(n*127.1+311.7)*43758.5453;return value-Math.floor(value);};
const up = new THREE.Vector3(0, 1, 0);

// Distance to the full image rectangle, conservative even in transparent holes.
export function distanceToForestCard(point, card) {
  const p=point.clone().sub(new THREE.Vector3(...card.position))
    .applyQuaternion(new THREE.Quaternion(...card.quaternion).invert());
  return Math.hypot(Math.max(0,Math.abs(p.x)-card.width/2),
    Math.max(0,Math.abs(p.y)-card.height/2),p.z);
}

export function layoutVitrumForestScreen(curve) {
  const length=curve.getLength(),sampleCount=Math.ceil(length/12);
  const frames=Array.from({length:sampleCount},(_,i)=>getTrackFrame(curve,i/sampleCount));
  const bounds=new THREE.Box3().setFromPoints(frames.map(f=>f.center));
  const center=bounds.getCenter(new THREE.Vector3());
  const radius=Math.max(...frames.map(f=>Math.hypot(f.center.x-center.x,f.center.z-center.z)));
  const road=frames.map((f,i)=>({point:f.center.clone().addScaledVector(f.normal,4),clearance:Math.max(28,getTrackWidth(curve,i/sampleCount)/2+12)}));
  const cards=[];
  const add=(type,layer,base,width,height,q,seed,guard=true)=>{
    const position=base.clone().add(new THREE.Vector3(0,height/2,0).applyQuaternion(q));
    const card={type,layer,width,height,position:position.toArray(),quaternion:q.toArray(),mirror:random(seed)>.5};
    const bound=Math.hypot(width,height)/2;
    if(guard && road.some(({point,clearance})=>point.distanceToSquared(position)<(bound+clearance)**2 && distanceToForestCard(point,card)<clearance))return;
    cards.push(card);
  };
  FOREST_SCREEN_LAYERS.forEach((layer,level)=>{
    for(let i=0;i<layer.count;i++){
      const seed=level*100+i,angle=(i+.3*level)/layer.count*Math.PI*2;
      const r=radius+layer.inset,height=layer.height*(.86+random(seed)*.2);
      const base=new THREE.Vector3(center.x+Math.sin(angle)*r,bounds.min.y-380-random(seed+4)*50,center.z+Math.cos(angle)*r);
      const q=new THREE.Quaternion().setFromAxisAngle(up,angle);
      // Each plane is tangent to a circle enclosing ALL road samples. Its full
      // rectangle stays outside that radius, even at neighbouring bends.
      add('forest',layer.name,base,height*1.5,height,q,seed,false);
    }
  });

  const clusters=Math.ceil(length/42);
  for(let i=0;i<clusters;i++)for(const side of [-1,1]){
    const seed=i*13+(side+1),u=(i+.35)/clusters,f=getTrackFrame(curve,u);
    const x=side*(43+random(seed)*27),width=15+random(seed+1)*13,height=width/1.5;
    const base=f.center.clone().addScaledVector(f.right,x).addScaledVector(f.normal,forestBankHeight(u,x)-1.1);
    for(let cross=0;cross<3;cross++){
      const q=f.rotation.clone().multiply(new THREE.Quaternion().setFromAxisAngle(up,random(seed+2)*Math.PI+cross*Math.PI/3));
      add('understory','edge-growth',base,width,height,q,seed+cross);
    }
  }

  // Keep curtains above the driving/camera envelope. Their branches span the
  // existing tree crowns while hanging strands break long empty sightlines.
  for(const [i,u] of [.035,.092,.155,.205,.27,.31,.35,.52,.58,.69,.74,.83,.88,.94].entries()){
    const f=getTrackFrame(curve,u),width=210+random(i+500)*65,height=width/1.5;
    const base=f.center.clone().addScaledVector(f.normal,38);
    for(const turn of [-.18,.18]){
      const q=f.rotation.clone().multiply(new THREE.Quaternion().setFromAxisAngle(up,turn));
      add('curtain','hanging-roots',base,width,height,q,i+600);
    }
  }
  return {cards,center:center.toArray(),radius};
}

export function createVitrumForestScreen(curve) {
  const layout=layoutVitrumForestScreen(curve),group=new THREE.Group();
  group.name='vitrumForestScreen';
  group.userData.cardCount=layout.cards.length;
  group.userData.layerCounts={};
  const textures=new Map(),loader=typeof document==='undefined'?null:new THREE.TextureLoader();
  for(const [type,path] of Object.entries(FOREST_SCREEN_IMAGES)){
    const texture=loader?.load(path)??null;
    if(texture){texture.name='ForestScreen/'+type;texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;}
    textures.set(type,texture);
  }
  const geometry=new THREE.PlaneGeometry(1,1);
  const layers=[...FOREST_SCREEN_LAYERS.map(l=>({...l,type:'forest'})),
    {name:'hanging-roots',type:'curtain',color:0xc2c8a4},
    {name:'edge-growth',type:'understory',color:0xc1c9ab}];
  for(const layer of layers){
    const cards=layout.cards.filter(c=>c.layer===layer.name);
    if(!cards.length)continue;
    const material=new THREE.MeshBasicMaterial({map:textures.get(layer.type),color:layer.color,
      alphaTest:.32,transparent:false,depthWrite:true,side:THREE.DoubleSide,fog:true});
    material.name='ForestScreen/'+layer.name;
    material.color.multiplyScalar(.65);
    // Alpha testing keeps depth correct across intersecting cutouts; no sorted
    // translucent rectangles and no new lights. Maps are shared per scene.
    const mesh=new THREE.InstancedMesh(geometry,material,cards.length);
    mesh.name=layer.name;
    const matrix=new THREE.Matrix4();
    cards.forEach((card,index)=>{
      // Avoid negative instance determinants (unsupported for InstancedMesh).
      // Mirroring uses a half turn around Y instead, with DoubleSide materials.
      const q=new THREE.Quaternion(...card.quaternion);
      if(card.mirror)q.multiply(new THREE.Quaternion().setFromAxisAngle(up,Math.PI));
      matrix.compose(new THREE.Vector3(...card.position),q,new THREE.Vector3(card.width,card.height,1));
      mesh.setMatrixAt(index,matrix);
    });
    mesh.computeBoundingSphere();
    group.userData.layerCounts[layer.name]=cards.length;
    group.add(mesh);
  }
  return group;
}
