import * as THREE from 'three';
import { createTrackCurve, getTrackFrame, progressAtControlPoint } from './track-path.js';
import { suggestBoostPads } from './track-pads.js';
import {forestBankHeight} from './vitrum-terrain.js';

// Authoring coordinates, not runtime geometry: everything remains editable.
const points = [
  [0,40,-900], [0,40,-640], [0,48,-360], [70,70,-110],
  [260,110,70], [490,160,160], [730,225,100], [890,290,-100],
  [960,355,-350], [1110,420,-550], [1360,485,-590],
  [1580,540,-450], [1690,580,-210], [1660,600,70],
  [1530,590,330], [1320,560,550], [1080,485,740],
  [820,340,900], [530,175,1030], [250,75,1100],
  [-50,55,1080], [-300,70,950], [-460,100,700],
  [-490,145,410], [-650,180,160], [-860,185,-60],
  [-970,160,-330], [-940,110,-600], [-760,65,-830],
  [-500,40,-980], [-220,40,-1050], [-50,40,-1030],
];
export const VITRUM = {
  id:'vitrum-neural-ascent', name:'Vitrum Lithofyter · Neural Ascent',
  width:26, horizontalScale:1, magnetic:true, roadStyle:'raceway',
  centerline:points, pointWidths:points.map((_,i)=>i>=15&&i<=20?30:26),
  objects:[], gaps:[], branches:[],
};
// Horizon-relative banking, compensated for the transported magnetic frame.
const unbanked=createTrackCurve(VITRUM);
for(let i=0;i<points.length;i++) {
  const u=progressAtControlPoint(unbanked,i), f=getTrackFrame(unbanked,u);
  const before=getTrackFrame(unbanked,(u-.006+1)%1),after=getTrackFrame(unbanked,(u+.006)%1);
  const turn=before.tangent.clone().cross(after.tangent).y;
  const bank=THREE.MathUtils.clamp(-turn*100,-22,22);
  const up=new THREE.Vector3(0,1,0).addScaledVector(f.tangent,-f.tangent.y).normalize();
  points[i][3]=bank+THREE.MathUtils.radToDeg(Math.atan2(f.tangent.dot(f.normal.clone().cross(up)),f.normal.dot(up)));
}
const curve=createTrackCurve(VITRUM);
export const VITRUM_SECTORS=Object.fromEntries(Object.entries({
  'Rootwake':0,'The Great Canopy':4,'Glassroot Ascent':8,'The Mycelium Veins':12,
  'The Singing Ravine':16,'Neural Bloom':21,'The Canopy Return':25,
}).map(([name,i])=>[name,progressAtControlPoint(curve,i)]));
VITRUM.pads=suggestBoostPads(VITRUM)
  .filter(p=>p.progress< VITRUM_SECTORS['The Singing Ravine'] || p.progress>VITRUM_SECTORS['Neural Bloom'])
  .filter((_,i)=>i%2===0).map((p,i)=>({...p,id:`vitrum-boost-${i}`,offset:[-7,6,0,8,-6][i%5]}));

const objects=VITRUM.objects;
const localAnchors=new WeakMap(),modelAnchors=new Map();
function primitive(type,position,scale,color,extra={}) {
  objects.push({id:`vitrum-${objects.length}`,type,position,rotation:[0,0,0],scale,color,...extra});
}
function model(name,position,scale,yaw=0,extra={}) {
  const object={id:`vitrum-${objects.length}`,type:'glb',model:`/models/stage2/${name}.glb`,
    position,scale:Array.isArray(scale)?scale:[scale,scale,scale],rotation:[0,yaw || 0,0],...extra};
  objects.push(object);modelAnchors.set(object.id,localAnchors.get(position));
}
function local(u,x,y,z=0) {
  const f=getTrackFrame(curve,u);
  const position=f.center.addScaledVector(f.right,x).addScaledVector(f.normal,y).addScaledVector(f.tangent,z).toArray();
  localAnchors.set(position,u);return position;
}
primitive('sphere',[400,-230,50],[5000,260,4300],0x203e2b);
// Dense, staged colonies grow on the continuous shelf modules. Vary the
// grouping within each place rather than repeating isolated props every 200 m.
for(const [sector,start] of Object.values(VITRUM_SECTORS).entries()) {
  const end=Object.values(VITRUM_SECTORS)[sector+1]??1;
  for(let cluster=0;cluster<5;cluster++) {
    const u=start+(end-start)*(cluster+.5)/5,side=cluster%2?1:-1;
    for(let j=0;j<4;j++) {
      const size=15+(j%3)*7;
      const name=['mushroom_lamp_lowpoly','bio_flora_plant_lowpo','lantern_flower_lowpol','mushroom_lamp_lowpoly'][j];
      model(name,local(u,side*(37+j%2*13),size*.477,(j-1.5)*13),size,cluster*31+j*67);
    }
    if(cluster%2===0)model('canopy_spire_lowpoly',local(u,side*100,50),180,cluster*49);
  }
  for(const side of [-1,1]) {
    model('spire_orb_holder_lowp',local(start+.009,side*42,40),65,side*90);
    model('bridge_segment_lowpol',local(start+.025,side*24,-32),[130,80,90],0);
  }
}
// Textured roots frame entrances in pairs, backed by continuous organic shells.
for(const u of [.008,.12,.25,.365,.477,.52,.59,.68,.72,.83,.94]) {
  for(const side of [-1,1])model('half_arch_segment_low',local(u,side*64,38),[130,140,150],side*90);
}
// The hanging heart is visible ahead before driving beneath its petal vault.
const bloomU=VITRUM_SECTORS['Neural Bloom']+.04;
model('bio_orb_sphere_lowpol',local(bloomU,0,34),20,0,
  {motion:{type:'shuttle',axis:'y',period:16,distance:2}});
primitive('light',local(bloomU,0,25),[1,1,1],0xffbf65,{lightIntensity:2200,lightRange:110});
for(const side of [-1,1]) {
  model('monolith_egg_lowpoly',local(bloomU,side*59,30),70);
  for(let i=0;i<3;i++)model('lantern_flower_lowpol',local(bloomU,side*(62+i*12),48,i*35-35),90,i*45);
}

// The imported assets are centred, approximately unit-height exports. Reserve
// the whole road corridor against their conservative transformed bounds. Nearby
// bends must be checked too: an arch clear at its anchor can intrude downstream.
const modelBounds={
  bio_flora_plant_lowpo:[.369,.477,.306],bio_orb_sphere_lowpol:[.431,.478,.410],
  bridge_segment_lowpol:[.480,.230,.224],canopy_spire_lowpoly:[.284,.477,.283],
  half_arch_segment_low:[.137,.251,.479],lantern_flower_lowpol:[.242,.478,.231],
  monolith_egg_lowpoly:[.287,.477,.283],mushroom_lamp_lowpoly:[.236,.477,.236],
  spire_orb_holder_lowp:[.251,.478,.184],
};
// Measured lowest vertices of the supplied, untransformed GLBs. Their origins
// are at the model centre, not the feet. Source files remain untouched.
const modelMinY={bio_flora_plant_lowpo:-.4763180017,bio_orb_sphere_lowpol:-.4768069983,
 bridge_segment_lowpol:-.2272949964,canopy_spire_lowpoly:-.4753420055,
 half_arch_segment_low:-.2497559935,lantern_flower_lowpol:-.4763180017,
 monolith_egg_lowpoly:-.4758299887,mushroom_lamp_lowpoly:-.4758299887,spire_orb_holder_lowp:-.4763180017};
// Footprint of the bottom 6% of each mesh, rather than the entire crown/arch.
const modelFeet={
 bio_flora_plant_lowpo:[.001709,.005371,.366212,.30005],
 bridge_segment_lowpol:[.099854,.033447,.328614,.151368],
 canopy_spire_lowpoly:[.001465,0,.281006,.281494],
 half_arch_segment_low:[0,.34668,.135011,.130128],
 lantern_flower_lowpol:[.001221,-.006104,.239259,.223145],
 monolith_egg_lowpoly:[.000244,-.002198,.285156,.278809],
 mushroom_lamp_lowpoly:[.005371,-.002442,.181885,.179444],
 spire_orb_holder_lowp:[.015869,.001709,.229493,.180665],
};
export const VITRUM_SUPPORTS=[];
const corridor=Array.from({length:900},(_,i)=>getTrackFrame(curve,i/900).center);
for(const o of objects.filter(o=>o.type==='glb')) {
  const key=o.model.split('/').pop().replace('.glb',''),b=modelBounds[key];
  const u=modelAnchors.get(o.id),f=getTrackFrame(curve,u),hanging=key==='bio_orb_sphere_lowpol';
  const up=new THREE.Vector3(0,1,0);
  // Small growth follows the sloped bank. Monumental trunks/arches stay upright
  // on their own rooted plinths, rather than leaning with the racing camber.
  if(!hanging && o.scale[1]<75)up.copy(f.normal);
  const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),up)
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),THREE.MathUtils.degToRad(o.rotation[1])));
  if(!hanging){
    const delta=new THREE.Vector3(...o.position).sub(f.center),x=delta.dot(f.right),z=delta.dot(f.tangent);
    const base=new THREE.Vector3(...local(u,x,forestBankHeight(u,x),z));
    o.position=base.addScaledVector(up,-modelMinY[key]*o.scale[1]-.3).toArray();
    o.rotation=new THREE.Euler().setFromQuaternion(rotation).toArray().slice(0,3).map(a=>THREE.MathUtils.radToDeg(a)||0);
  }
  const bounds=new THREE.Box3(new THREE.Vector3(...b).multiplyScalar(-1),new THREE.Vector3(...b));
  bounds.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(),rotation,new THREE.Vector3(...o.scale)));
  const extent=bounds.getSize(new THREE.Vector3()).multiplyScalar(.5);
  for(let attempt=0;attempt<80;attempt++) {
    const c=new THREE.Vector3(...o.position);
    // Rooted foundations extend below the visible mesh. Reserve their whole
    // horizontal footprint, including against lower neighbouring road bends.
    const margin=hanging?20:26;
    const hit=corridor.find(p=>Math.abs(p.x-c.x)<extent.x+margin&&Math.abs(p.z-c.z)<extent.z+margin&&(!hanging || (p.y+9>c.y-extent.y&&p.y-3<c.y+extent.y)));
    if(!hit)break;
    const away=c.clone().sub(hit);away.y=0;if(away.lengthSq()<1)away.x=1;away.normalize().multiplyScalar(12);
    o.position[0]+=away.x;o.position[2]+=away.z;
    if(attempt===79)throw new Error('Vitrum model corridor could not be cleared: '+o.id);
  }
  if(!hanging){
    // Derive supports AFTER corridor correction: moving a prop must move its
    // footing too. Generator consumes this manifest; no new track-format data.
    const feet=modelFeet[key];
    const base=new THREE.Vector3(...o.position).add(new THREE.Vector3(feet[0]*o.scale[0],modelMinY[key]*o.scale[1],feet[1]*o.scale[2]).applyQuaternion(rotation));
    VITRUM_SUPPORTS.push({id:o.id,u,base:base.toArray(),rotation:o.rotation,
      radius:[feet[2]*o.scale[0]+2.4,feet[3]*o.scale[2]+2.4]});
  }
}

// Route-conforming organic shells have open interiors; an enclosing AABB is
// intentionally not used to move them away from the road. Their actual mesh
// clearance is tested separately. Each remains a transformable editor object.
export const VITRUM_MODULES=['rootwake','canopy','ascent','mycelium','ravine','bloom','return'];
Object.values(VITRUM_SECTORS).forEach((u,i)=>objects.push({
  id:'vitrum-architecture-'+VITRUM_MODULES[i],type:'glb',
  model:'/models/stage2/organic/'+VITRUM_MODULES[i]+'.glb',
  position:getTrackFrame(curve,u).center.toArray(),rotation:[0,0,0],scale:[1,1,1],
}));

// Scenery retains its authored, grounded frame while the racing ribbon performs
// the stunts. Keep this snapshot for regenerating the organic modules.
export const VITRUM_SCENERY = {...VITRUM, centerline:points.map(p=>[...p]), pointWidths:[...VITRUM.pointWidths], gaps:[]};
points.splice(2,0,[0,44,-610],[0,46,-580],[0,46,-560],[0,44,-530],[0,44,-500]);
VITRUM.pointWidths.splice(2,0,34,38,44,44,38);
points.splice(1,0,[0,40,-760],[0,40,-700]);
VITRUM.pointWidths.splice(1,0,26,26);
// Lift the roll above the rooted roadside shelf, leaving room beneath the hull.
for(const i of [12,13,14])points[i][1]+=38;
const stuntBase=createTrackCurve({...VITRUM,centerline:points.map(p=>p.slice(0,3))});
for(let i=0;i<points.length;i++){
 const u=progressAtControlPoint(stuntBase,i),f=getTrackFrame(stuntBase,u);
 const up=new THREE.Vector3(0,1,0).addScaledVector(f.tangent,-f.tangent.y).normalize();
 const turn=getTrackFrame(stuntBase,(u-.006+1)%1).tangent.cross(getTrackFrame(stuntBase,(u+.006)%1).tangent).y;
 const bank=THREE.MathUtils.clamp(-turn*100,-22,22);
 points[i][3]=bank+THREE.MathUtils.radToDeg(Math.atan2(f.tangent.dot(f.normal.clone().cross(up)),f.normal.dot(up)))+Math.max(0,Math.min(4,i-11))*90;
}
const stuntCurve=createTrackCurve(VITRUM);
VITRUM.gaps=[{start:progressAtControlPoint(stuntCurve,5),end:progressAtControlPoint(stuntCurve,6)}];
export const VITRUM_STUNTS={rollStart:progressAtControlPoint(stuntCurve,11),rollEnd:progressAtControlPoint(stuntCurve,15)};
VITRUM.pads=VITRUM.pads.filter(p=>p.progress<VITRUM.gaps[0].start-.015 || p.progress>VITRUM.gaps[0].end+.015);
