// Reproducible organic architecture with the user's embedded forest PBR textures. Each sector is one editable
// GLB with a handful of merged material batches, not hundreds of draw calls.
import * as T from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {VITRUM_SCENERY as VITRUM,VITRUM_SECTORS,VITRUM_SUPPORTS} from '../src/track-vitrum.js';
import {createTrackCurve,getTrackFrame} from '../src/track-path.js';
import {forestMap} from '../src/vitrum-materials.js';
import {forestBankHeight} from '../src/vitrum-terrain.js';

globalThis.FileReader=class {
  readAsArrayBuffer(blob){blob.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}
  readAsDataURL(blob){blob.arrayBuffer().then(r=>{this.result='data:application/octet-stream;base64,'+Buffer.from(r).toString('base64');this.onloadend?.();});}
};
const curve=createTrackCurve(VITRUM),length=curve.getLength();
const folder=new URL('../public/models/stage2/organic/',import.meta.url);
await mkdir(folder,{recursive:true});
const materials={
 bark:new T.MeshStandardMaterial({color:0x8e8263,roughness:1,vertexColors:true}),
 moss:new T.MeshStandardMaterial({color:0xffffff,roughness:1,vertexColors:true}),
 ivory:new T.MeshStandardMaterial({color:0xffffff,roughness:.9,vertexColors:true}),
 canopy:new T.MeshStandardMaterial({color:0xffffff,emissive:0xb5c985,emissiveIntensity:.12,roughness:.85,vertexColors:true}),
 gills:new T.MeshStandardMaterial({color:0xffffff,emissive:0xffd294,emissiveIntensity:.28,roughness:.8,vertexColors:true}),
 amber:new T.MeshStandardMaterial({color:0xffffff,emissive:0xffdf9e,emissiveIntensity:.9,roughness:.65,vertexColors:true}),
 teal:new T.MeshStandardMaterial({color:0xffffff,emissive:0x57d8be,emissiveIntensity:.9,roughness:.6,vertexColors:true}),
 violet:new T.MeshStandardMaterial({color:0xffffff,emissive:0xe1b6ff,emissiveIntensity:.23,roughness:.55,vertexColors:true}),
};
const surfaces={bark:'bark',ivory:'bark',moss:'moss',canopy:'canopy',gills:'gills',amber:'gills',teal:'mycelium',violet:'membrane'};
for(const [key,material] of Object.entries(materials))material.name='Vitrum/'+key;
function at(u,x=0,y=0,z=0){const f=getTrackFrame(curve,((u%1)+1)%1);return f.center.addScaledVector(f.right,x).addScaledVector(f.normal,y).addScaledVector(f.tangent,z);}
let batches;
function add(g,material){
 if(g.index)g=g.toNonIndexed();
 const p=g.getAttribute('position'),normal=g.getAttribute('normal'),colors=[];
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  // Broad earth stains and finer mottling break uniform tiled surfaces. The
  // underside term supplies restrained baked occlusion without extra lights.
  const damp=.5+.5*Math.sin(x*.021+y*.038)*Math.sin(z*.031-y*.017);
  const grain=Math.sin(x*.37+z*.19)*Math.sin(y*.29-z*.23);
  const v=(.66+damp*.25+grain*.055)*(.78+.22*Math.max(0,normal.getY(i)));
  colors.push(v*(material==='bark'?1.08:1),v,v*(material==='bark'?.8:.93));
 }
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 (batches[material]??=[]).push(g);
}
function tube(points,r,mat='bark',segments=48){
 const path=new T.CatmullRomCurve3(points),g=new T.TubeGeometry(path,segments,r,7,false),uv=g.getAttribute('uv');
 // Bark fibres follow each curved root, with consistent world-scale repeats.
 const along=path.getLength()/18,around=Math.max(1,Math.round(2*Math.PI*r/18));
 for(let i=0;i<uv.count;i++){const u=uv.getX(i),v=uv.getY(i);uv.setXY(i,v*around,u*along);}
 add(g,mat);
}
function ellipsoid(pos,scale,mat,rotation){
 let g=new T.SphereGeometry(1,Math.max(...scale)<12?12:20,Math.max(...scale)<12?8:12);
 const uv=g.getAttribute('uv'),p=g.getAttribute('position');
 for(let i=0;i<uv.count;i++){
  if(mat==='canopy'||mat==='moss')uv.setXY(i,p.getX(i)*scale[0]/20,p.getZ(i)*scale[2]/20);
  else if(mat==='gills')uv.setXY(i,uv.getX(i)*4,Math.hypot(p.getX(i),p.getZ(i)));
  else uv.setXY(i,uv.getX(i)*Math.max(1,Math.round(Math.PI*(scale[0]+scale[2])/18)),uv.getY(i)*Math.max(1,scale[1]*2/18));
 }
 // Canopy umbrellas get leafy tops and amber gills underneath using the same
 // triangles. Split before rotating, so banking cannot flip the material.
 const lower=[] ,upper=[];
 if(mat==='canopy')for(let i=0;i<g.index.count;i+=3){const tri=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)];(tri.reduce((n,j)=>n+p.getY(j),0)<0?lower:upper).push(...tri);}
 g.scale(...scale);if(rotation)g.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(rotation));g.translate(...pos.toArray());
 if(mat==='canopy'){
  const underside=g.clone();underside.setIndex(lower);g.setIndex(upper);
  // Radial gill UVs use the sphere's original longitude and local radius.
  const source=new T.SphereGeometry(1,Math.max(...scale)<12?12:20,Math.max(...scale)<12?8:12);
  const radial=source.getAttribute('uv'),sp=source.getAttribute('position');
  for(let i=0;i<radial.count;i++)radial.setXY(i,radial.getX(i)*4,Math.hypot(sp.getX(i),sp.getZ(i)));
  underside.setAttribute('uv',radial.clone());source.dispose();add(underside,'gills');
 }
 add(g,mat);
}
function line(start,end,offset,r,mat){tube(Array.from({length:33},(_,i)=>at(start+(end-start)*i/32,...offset(i/32))),r,mat,64);}
function arch(u,span=39,height=48,r=4,mat='ivory',twist=0){
 tube(Array.from({length:19},(_,i)=>{const a=i/18*Math.PI;return at(u,Math.cos(a)*span,Math.sin(a)*height-5,Math.sin(a*2)*twist);}),r,mat,48);
}
function shelves(start,end,width=42){
 for(const side of [-1,1]){
  line(start,end,t=>[side*width,-26+Math.sin(t*20)*2,0],19,'bark');
  line(start,end,t=>[side*width,-16+Math.sin(t*20)*2,0],16,'moss');
  line(start,end,t=>[side*22,-4,0],2.5,'ivory');
 }
 // Root keel follows the road underneath, connecting the elevated course.
 line(start,end,()=>[0,-12,0],10,'bark');
 for(const side of [-1,1])line(start,end,t=>[side*(6+Math.sin(t*26)*3),-10,0],2,'ivory');
}
function banks(start,end){
 // Continuous soil joins the deck to the shoulders. The old thin root tubes
 // left a visible sky slit along both road edges.
 const rows=Math.ceil((end-start)*length/12),cols=12;
 for(const side of [-1,1]){
  const positions=[],uv=[],indices=[];
  for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){
   const u=start+(end-start)*i/rows,x=side*(12+j/cols*80);
   positions.push(...at(u,x,forestBankHeight(u,x)).toArray());uv.push(u*length/18,x/18);
   if(i<rows&&j<cols){const k=i*(cols+1)+j;indices.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  // Normals should face the canopy regardless of which shoulder was authored.
  if(side>0){for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];g.setIndex(indices);g.computeVertexNormals();}
  add(g,'moss');
 }
}
function footings(start,end){
 for(const support of VITRUM_SUPPORTS.filter(s=>s.u>=start&&s.u<end)){
  const base=new T.Vector3(...support.base),q=new T.Quaternion().setFromEuler(new T.Euler(...support.rotation.map(T.MathUtils.degToRad)));
  const up=new T.Vector3(0,1,0).applyQuaternion(q),[rx,rz]=support.radius;
  const f=getTrackFrame(curve,support.u),side=Math.sign(base.clone().sub(f.center).dot(f.right))||1;
  // A flat rooted soil cap supports the actual foot ring. Its deep sides meet
  // the bank below, avoiding both curved-pad gaps and hovering saucer shapes.
  const positions=[...base.clone().addScaledVector(up,.35).toArray()],uv=[0,0],indices=[];
  const sides=[],sideUv=[],sideIndices=[],count=32;
  for(let i=0;i<=count;i++){
   const a=i/count*Math.PI*2;
   const x=Math.sign(Math.cos(a))*Math.abs(Math.cos(a))**.4*rx;
   const z=Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**.4*rz;
   const offset=new T.Vector3(x,0,z).applyQuaternion(q),top=base.clone().add(offset).addScaledVector(up,.15);
   positions.push(...top.toArray());uv.push(x/18,z/18);
   if(i<count)indices.push(0,i+2,i+1);
   const delta=top.clone().sub(f.center);
   const depth=Math.max(8,(delta.dot(f.normal)-forestBankHeight(support.u,delta.dot(f.right)))/up.dot(f.normal)+8);
   const bottom=top.clone().addScaledVector(up,-depth).add(offset.clone().multiplyScalar(.08));
   sides.push(...top.toArray(),...bottom.toArray());sideUv.push(i/count*8,0,i/count*8,depth/18);
   if(i<count){const k=i*2;sideIndices.push(k,k+2,k+1,k+1,k+2,k+3);}
  }
  for(const [p,tex,ix,mat] of [[positions,uv,indices,'moss'],[sides,sideUv,sideIndices,'bark']]){
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(tex,2));g.setIndex(ix);g.computeVertexNormals();add(g,mat);
  }
  const root=at(support.u,side*46,-18),joint=base.clone().lerp(root,.5).add(new T.Vector3(0,-10,0));
  tube([root,joint,base.clone().addScaledVector(up,-4)],Math.min(8,Math.max(2,Math.min(rx,rz)*.24)),'bark',20);
  // Buttress roots spread from the feet into the same soil mound.
  for(let i=0;i<4;i++){
   const a=i*Math.PI*.5,offset=new T.Vector3(Math.cos(a)*rx*.8,0,Math.sin(a)*rz*.8).applyQuaternion(q);
   tube([base.clone().addScaledVector(up,1.5),base.clone().add(offset.clone().multiplyScalar(.6)),base.clone().add(offset).addScaledVector(up,-2)],Math.min(2,Math.min(rx,rz)*.12),'ivory',8);
  }
 }
}
const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
function leaf(u,x,y,z,angle,reach,height,width,material='canopy'){
 const positions=[],uv=[],indices=[],steps=5;
 for(let i=0;i<=steps;i++){
  const t=i/steps,forward=reach*t,w=Math.sin(Math.PI*t)*width;
  for(let j=0;j<3;j++){
   const s=j-1,dx=Math.cos(angle)*forward-Math.sin(angle)*w*s,dz=Math.sin(angle)*forward+Math.cos(angle)*w*s;
   positions.push(...at(u,x+dx,y+height*Math.sin(t*Math.PI*.65)+(j===1?.18:0)*Math.sin(t*Math.PI),z+dz).toArray());uv.push(j/2,t);
  }
  if(i<steps)for(let j=0;j<2;j++){const k=i*3+j;indices.push(k,k+1,k+3,k+1,k+4,k+3);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();add(g,material);
}
function understory(start,end,sector){
 const count=Math.ceil((end-start)*length/8);
 for(let i=0;i<count;i++)for(const side of [-1,1]){
  const seed=sector*1500+i*7+(side+1),u=start+(end-start)*(i+.3)/count;
  const x=side*(24+noise(seed)*48),y=forestBankHeight(u,x)-.2;
  const reach=3+noise(seed+1)*3,height=1.5+noise(seed+2)*3.5;
  for(let j=0;j<7;j++)leaf(u,x,y,0,j/7*Math.PI*2+noise(seed+3)*5,reach,height,.7+noise(seed+4)*.7);
  if(i%3===0){
   const stem=1.8+noise(seed+5)*2.5;
   tube([at(u,x,y),at(u,x+.2,y+stem*.7),at(u,x+.5,y+stem)],.22,'ivory',6);
   ellipsoid(at(u,x+.5,y+stem),[1.7,.55,1.6],'canopy',getTrackFrame(curve,u).rotation);
  }
  if(i%2===0)for(let j=0;j<3;j++)leaf(u,x+side*2,y,1,j/3*Math.PI*2,1.2,3.4,.55,'violet');
 }
}
function tree(u,side,height=230){
 const f=getTrackFrame(curve,u),base=at(u,side*110,-80),x=base.x,z=base.z;
 ellipsoid(base.clone().add(new T.Vector3(0,-26,0)),[83,18,78],'moss');
 tube([at(u,side*45,-22),base.clone().add(new T.Vector3(-side*25,0,0)),base.clone().add(new T.Vector3(0,-25,0))],12,'bark',28);
 for(let j=0;j<5;j++){
  const a=j/5*Math.PI*2;
  tube([new T.Vector3(x+Math.cos(a)*65,base.y-30,z+Math.sin(a)*65),new T.Vector3(x+Math.cos(a+1)*22,base.y+35,z+Math.sin(a+1)*22),new T.Vector3(x+Math.cos(a+2)*14,base.y+height*.7,z+Math.sin(a+2)*14),new T.Vector3(x+Math.cos(a)*75,base.y+height,z+Math.sin(a)*75)],8,'bark');
 }
 ellipsoid(new T.Vector3(x,base.y+height,z),[105,19,95],'canopy');
 ellipsoid(new T.Vector3(x,base.y+height-12,z),[83,9,75],'gills');
 for(let j=0;j<9;j++){
  const a=j/9*Math.PI*2;
  tube([new T.Vector3(x,base.y+height-16,z),new T.Vector3(x+Math.cos(a)*48,base.y+height-18,z+Math.sin(a)*48),new T.Vector3(x+Math.cos(a)*85,base.y+height-10,z+Math.sin(a)*85)],.8,'amber');
 }
}
function chamber(start,end){
 // Continuous opaque vault, with an open 52-unit interior around the 26-unit road.
 const vertices=[],indices=[],uv=[],n=50,m=24;
 for(let i=0;i<=n;i++)for(let j=0;j<=m;j++){
  const a=j/m*Math.PI,p=at(start+(end-start)*i/n,Math.cos(a)*(40+Math.sin(i*.6)*2),Math.sin(a)*43-5);
  vertices.push(...p.toArray());
  uv.push(j/m*7,i/n*(end-start)*length/18);
  if(i<n&&j<m){const k=i*(m+1)+j;indices.push(k,k+m+1,k+1,k+1,k+m+1,k+m+2);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();add(g,'bark');
 for(let i=0;i<=13;i++)arch(start+(end-start)*i/13,37,40,1.7,i%3===0?'ivory':'moss',4);
 for(const a of [.24,.65,1.1,1.57,2.04,2.49,2.9])line(start,end,t=>[Math.cos(a+Math.sin(t*20)*.025)*36,Math.sin(a)*38-4,0],.5,'teal');
}
// A settlement is a vertically layered community, not another roadside prop.
// Local coordinates follow the road bank. Every balcony stays outside the
// racing corridor; cross-road footbridges are well above the chase camera.
function settlement(u,side){
 const x=side*60,rotation=getTrackFrame(curve,u).rotation;
 tube([at(u,x,-45),at(u,x+side*7,30),at(u,x-side*6,86),at(u,x,140)],7,'bark',36);
 for(let tier=0;tier<3;tier++){
  const y=12+tier*26,r=24-tier*2;
  ellipsoid(at(u,x,y),[r,3,r*.86],'bark',rotation);
  ellipsoid(at(u,x,y+2),[r*.96,1.3,r*.82],'moss',rotation);
  const ring=Array.from({length:33},(_,j)=>{const a=j/32*Math.PI*2;return at(u,x+Math.cos(a)*r,y+3,Math.sin(a)*r*.86);});
  tube(ring,.65,tier===1?'teal':'violet',32);
  for(let j=0;j<5;j++){
   const a=j/5*Math.PI*2+tier*.45,cx=x+Math.cos(a)*(r-8),z=Math.sin(a)*(r-8)*.8;
   ellipsoid(at(u,cx,y+9,z),[5.2,7,5],'ivory',rotation);
   ellipsoid(at(u,cx,y+14,z),[6.7,2.6,6.3],'canopy',rotation);
   // Warm openings face the road, making the habitation readable at speed.
   ellipsoid(at(u,cx-side*4.9,y+9,z),[.45,3.4,2.2],j%3===0?'violet':'amber',rotation);
  }
  for(let j=0;j<6;j++){
   const a=j/6*Math.PI*2,px=x+Math.cos(a)*r,pz=Math.sin(a)*r*.86;
   tube([at(u,px,y,pz),at(u,px+side*3,y-10,pz+2),at(u,px+side*1,y-22,pz+4)],.32,'moss',12);
   ellipsoid(at(u,px+side,y-22,pz+4),[.8,1.8,.8],j%2?'teal':'violet',rotation);
  }
 }
 // Umbrella crown shelters the upper terraces, with luminous radial veins.
 ellipsoid(at(u,x,105),[34,6,30],'canopy',rotation);
 for(let j=0;j<8;j++){
  const a=j/8*Math.PI*2;
  tube([at(u,x,99),at(u,x+Math.cos(a)*17,98,Math.sin(a)*18),at(u,x+Math.cos(a)*30,102,Math.sin(a)*27)],.45,'teal',16);
 }
 // Stair-like root ramps join the three terraces outside the road footprint.
 tube(Array.from({length:49},(_,j)=>{const a=j/48*Math.PI*4;return at(u,x+Math.cos(a)*26,12+j/48*52,Math.sin(a)*22);}),1.7,'ivory',64);
}
function city(start,end,sector){
 const count=sector===3?1:sector===4?2:4;
 const locations=Array.from({length:count},(_,i)=>start+(end-start)*(i+.45)/count);
 locations.forEach((u,i)=>settlement(u,i%2?1:-1));
 // Side promenades connect communities; two cross-canopy bridges mark civic
// plazas. Their tendrils stop at 24 units above road level.
 if(sector!==3){
  for(const side of [-1,1])line(start+.01,end-.01,t=>[side*77,52+Math.sin(t*Math.PI*2)*8,0],2.4,'bark');
  for(const u of [start+(end-start)*.28,start+(end-start)*.78]){
   tube([at(u,-100,66),at(u,-42,52,8),at(u,0,48,12),at(u,42,52,8),at(u,100,66)],2.4,'ivory',48);
   tube([at(u,-100,69),at(u,-42,55,8),at(u,0,51,12),at(u,42,55,8),at(u,100,69)],.45,'teal',48);
   for(const x of [-52,-30,30,52]){
    tube([at(u,x,52,9),at(u,x+2,39,10),at(u,x-1,26,12)],.3,'violet',12);
    ellipsoid(at(u,x-1,25,12),[1.2,2,1.2],'teal',getTrackFrame(curve,u).rotation);
   }
  }
 }
 // Small glowing fronds create scale contrast with the city above. Kept away
 // from boost stations and inside the scenery shoulder, never on the road.
 for(let i=0;i<40;i++){
  const u=start+(end-start)*(i+.5)/40,side=i%2?1:-1,x=side*(27+i%3*3);
  tube([at(u,x,-2),at(u,x+side*1.4,2),at(u,x+side*3,5)],.18,'teal',8);
  ellipsoid(at(u,x+side*3,5),[1.5,.45,1],i%3?'violet':'teal',getTrackFrame(curve,u).rotation);
 }
}
const anchors=Object.values(VITRUM_SECTORS),names=['rootwake','canopy','ascent','mycelium','ravine','bloom','return'];
for(let sector=0;sector<7;sector++){
 batches={};const start=anchors[sector],end=anchors[sector+1]??1;
 banks(start,end);footings(start,end);understory(start,end,sector);
 shelves(start,end,sector===4?64:42);
 if(sector===0){
  for(const u of [.005,.022,.044,.075,.103]){arch(u,43,58,5,'bark',16);arch(u+.001,40,54,1.1,'amber',15);}
  for(const side of [-1,1]){tree(.035,side,280);tree(.092,side,220);}
 }else if(sector===1){
  for(let i=0;i<5;i++)tree(start+.012+i*.021,i%2?1:-1,260+i*16);
  for(const u of [.155,.205]){arch(u,60,100,7,'bark',26);arch(u+.002,55,94,1.4,'ivory',25);}
 }else if(sector===2){
  for(const side of [-1,1])line(start,end,t=>[side*(31+Math.sin(t*16)*5),-30-Math.sin(t*8)**2*65,0],9,'ivory');
  for(let i=0;i<5;i++){const u=start+.01+i*.022;arch(u,50,70,5,'bark',20);tree(u,i%2?1:-1,320);}
 }else if(sector===3){
  chamber(start+.012,end-.012);
  for(const side of [-1,1])line(start,end,t=>[side*55,30,0],30,'moss');
  arch(start+.01,47,53,8,'ivory',10);arch(end-.01,47,53,8,'ivory',10);
 }else if(sector===4){
  // Tall, continuous ravine walls, with branching roots suspended above the dive.
  for(const side of [-1,1]){
   line(start,end,t=>[side*(100+Math.sin(t*12)*12),-45,0],65,'bark');
   line(start,end,t=>[side*108,14,0],37,'moss');
   for(let i=0;i<6;i++){const u=start+(end-start)*(i+.2)/6;tube([at(u,side*100,55),at(u,side*76,20,15),at(u,side*65,-55,28)],3,'ivory');}
  }
  for(const u of [.52,.58]){arch(u,110,120,8,'bark',30);arch(u+.002,105,115,1,'amber',30);}
 }else if(sector===5){
  const u=start+.04;
  // The road passes directly beneath the suspended neural heart, between petals.
  for(const offset of [-.018,0,.018]){arch(u+offset,53,59,5,'ivory',18);arch(u+offset+.001,50,55,1,'amber',18);}
  ellipsoid(at(u,0,34),[8,12,8],'amber',getTrackFrame(curve,u).rotation);
  for(let j=0;j<10;j++){
   const a=j/10*Math.PI*2,x=(Math.cos(a)<0?-1:1)*Math.max(45,Math.abs(Math.cos(a)*70)),z=Math.sin(a)*70;
   tube([at(u,x,-10,z),at(u,x*1.25,50,z*1.25),at(u,x*.75,85,z*.75),at(u,0,62,0)],4,'ivory');
   tube([at(u,x,-7,z),at(u,x*1.2,53,z*1.2),at(u,x*.72,81,z*.72),at(u,0,62,0)],.8,j%2?'amber':'teal');
  }
  for(const side of [-1,1]){
   for(const z of [-52,0,52])ellipsoid(at(u,side*60,47,z),[9,35,20],'ivory',getTrackFrame(curve,u).rotation);
   tree(start+.01,side,285);tree(end-.02,side,240);
  }
 }else{
  for(let i=0;i<7;i++){const u=start+.014+i*.026;tree(u,i%2?1:-1,230);if(i%2===0)arch(u,50,65,5,'bark',20);}
 }
 city(start,end,sector);
 // Merge within each material and localise to an editor-friendly sector anchor.
 const origin=getTrackFrame(curve,start).center,group=new T.Group();
 for(const [key,geometries]of Object.entries(batches)){
  const g=mergeVertices(mergeGeometries(geometries,false));g.translate(-origin.x,-origin.y,-origin.z);
  const mat=materials[key].clone();mat.side=T.DoubleSide;
  group.add(new T.Mesh(g,mat));
 }
 const raw=Buffer.from(await new GLTFExporter().parseAsync(group,{binary:true}));
 const jsonLength=raw.readUInt32LE(12),json=JSON.parse(raw.subarray(20,20+jsonLength));
 const binary=raw.subarray(28+jsonLength),chunks=[binary];let offset=binary.length;
 json.images=[];json.textures=[];json.samplers=[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}];
 const pad=b=>Buffer.concat([b,Buffer.alloc((4-b.length%4)%4)]);
 const embedded=new Map();
 async function embed(surface,channel){
  const path=forestMap(surface,channel);
  if(embedded.has(path))return embedded.get(path);
  const png=await readFile(new URL('../public'+path,import.meta.url));
  json.bufferViews.push({buffer:0,byteOffset:offset,byteLength:png.length});
  json.images.push({name:path,bufferView:json.bufferViews.length-1,mimeType:'image/png'});
  const index=json.textures.length;
  json.textures.push({sampler:0,source:json.images.length-1});embedded.set(path,index);
  const bytes=pad(png);chunks.push(bytes);offset+=bytes.length;
  return index;
 }
 for(const material of json.materials){
  const key=material.name.split('/')[1],surface=surfaces[key];
  material.pbrMetallicRoughness.baseColorTexture={index:await embed(surface,'basecolor')};
  // Supplied roughness is grayscale: the glTF G channel is the same value.
  // Metalness is zero, so the packed texture's unused B channel has no effect.
  material.pbrMetallicRoughness.metallicRoughnessTexture={index:await embed(surface,'roughness')};
  material.normalTexture={index:await embed(surface,'normal_approx'),scale:key==='moss'?.45:.28};
  if(['canopy','gills','amber','teal','violet'].includes(key))material.emissiveTexture={index:await embed(surface,key==='teal'?'emissive_mask':'basecolor')};
 }
 json.buffers[0].byteLength=offset;
 const text=Buffer.from(JSON.stringify(json)),jsonBytes=Buffer.concat([text,Buffer.alloc((4-text.length%4)%4,32)]),bin=Buffer.concat(chunks);
 const buffer=Buffer.alloc(28+jsonBytes.length+bin.length);
 buffer.writeUInt32LE(0x46546c67,0);buffer.writeUInt32LE(2,4);buffer.writeUInt32LE(buffer.length,8);
 buffer.writeUInt32LE(jsonBytes.length,12);buffer.writeUInt32LE(0x4e4f534a,16);jsonBytes.copy(buffer,20);
 buffer.writeUInt32LE(bin.length,20+jsonBytes.length);buffer.writeUInt32LE(0x004e4942,24+jsonBytes.length);bin.copy(buffer,28+jsonBytes.length);
 await writeFile(new URL(names[sector]+'.glb',folder),Buffer.from(buffer));
 console.log(names[sector],Math.round(buffer.byteLength/1024)+' KiB',group.children.length+' batches');
}
