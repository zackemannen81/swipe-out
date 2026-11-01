import { loadGlb } from './glb-scenery.js';
import * as THREE from 'three';
// A separate, bounded scene shares the game renderer; it never changes the track.
export function createGarage(templates){
 let disposed=false,backdrop=null;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#090f17');scene.fog=new THREE.FogExp2('#090f17',.035);
 const camera=new THREE.PerspectiveCamera(40,1,.1,100);const root=new THREE.Group();scene.add(root);
 const stone=new THREE.MeshStandardMaterial({color:'#27333e',metalness:.65,roughness:.5});
 const dark=new THREE.MeshStandardMaterial({color:'#111920',metalness:.55,roughness:.68});
 const red=new THREE.MeshBasicMaterial({color:new THREE.Color('#bb263a').multiplyScalar(2)}),cyan=new THREE.MeshBasicMaterial({color:new THREE.Color('#63fff2').multiplyScalar(2)});
 function box(x,y,z,w,h,d,mat=stone){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);root.add(m);return m;}
 box(0,-.7,0,34,.4,50,dark);
 for(let z=-24;z<=12;z+=6){
  for(const x of [-7,7]){box(x,4,z,.9,10,1.2);box(x,.1,z,1.8,1.2,2);box(x,3,z+ .7,.12,3,.08,red);box(x,8,z,1.5,.3,1.8);
   for(let j=0;j<5;j++){const a=box(x*(1-j/6),9+j*.65,z,.45,2, .65);a.rotation.z=Math.sign(x)*.6;}}
  box(0,12,z,3,.35,.8);box(0,11.6,z,2,.08,.08,cyan);
 }
 // Pointed vault ribs and repeated buttress details give the hangar its Necros silhouette.
 for(const z of [-18,-12,-6,0,6]){
  const shape=new THREE.Shape();shape.moveTo(-7,0);shape.lineTo(-7,5);shape.quadraticCurveTo(-7,8,-.0,10);shape.quadraticCurveTo(7,8,7,5);shape.lineTo(7,0);shape.lineTo(6.5,0);shape.lineTo(6.5,5);shape.quadraticCurveTo(6.5,7.7,0,9.4);shape.quadraticCurveTo(-6.5,7.7,-6.5,5);shape.lineTo(-6.5,0);shape.closePath();
  const arch=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.5,bevelEnabled:true,bevelSize:.08,bevelThickness:.08,bevelSegments:1,steps:1}),stone);arch.position.z=z;root.add(arch);
  for(const x of [-7,7])for(const y of [1.4,3.8,5.1])box(x,y,z,1.3,.16,1.5);
  for(const x of [-6.3,6.3]){box(x,2.5,z,.12,5,.25);box(x,5,z,.3,.3,.4,cyan);}
 }
 for(const x of [-8.5,8.5])for(let z=-20;z<12;z+=2){box(x,3,z,.4,6,.6);box(x,6.3,z,.7,.5,.9);}
 for(const x of [-10,10]){box(x,5,-7,.8,12,40);for(let z=-24;z<14;z+=3)box(x*.91,2,z,.4,5,.25,dark);}
 const dais=new THREE.Mesh(new THREE.CylinderGeometry(3.5,3.9,.45,8),dark);dais.position.y=-.1;root.add(dais);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(3.35,.025,6,80),cyan);ring.rotation.x=Math.PI/2;ring.position.y=.15;root.add(ring);
 for(let x=-15;x<=15;x+=1.2)box(x,-.46,0,.025,.02,45,stone);
 for(const z of [-3.5,3.5])box(0,.15,z,5,.04,.04,red);
 scene.add(new THREE.HemisphereLight('#c2d9ef','#293242',4));
 for(const [color,intensity,x,y,z]of [[0xc8eaff,80,3,6,2],[0xff2244,90,-5,3,-3],[0x38ffee,65,5,2,4]]){const l=new THREE.PointLight(color,intensity,30);l.position.set(x,y,z);scene.add(l);}
 void loadGlb('/models/Meshy_AI_Cathedral_Entrance_Fa_1031120542_texture.glb').then(model=>{
  if(disposed){releaseModel(model);return;}
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const scale=16/Math.max(size.x,.01);model.scale.setScalar(scale);model.position.set(-12-center.x*scale,-.6-bounds.min.y*scale,-9-bounds.max.z*scale);scene.add(model);backdrop=model;
 }).catch(error=>console.warn('Garage facade unavailable; procedural vault retained.',error));
 function releaseModel(model){const resources=new Set();model.traverse(o=>{if(o.geometry)resources.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:o.material?[o.material]:[])){resources.add(m);for(const v of Object.values(m))if(v?.isTexture)resources.add(v);}});resources.forEach(r=>r.dispose());}
 const ship=new THREE.Group();ship.position.y=1.25;scene.add(ship);let owned=[];
 function setCraft(id,paint){
  owned.forEach(m=>m.dispose());owned=[];ship.clear();
  const source=templates[id]??templates.racer;
  for(const child of source.children){if(child.isLight)continue;const copy=child.clone(true);copy.traverse(o=>{if(o.isMesh){o.material=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{const c=m.clone();if(paint&&c.color)c.color.multiply(new THREE.Color(paint));owned.push(c);return c;});if(o.material.length===1)o.material=o.material[0];}});ship.add(copy);}
 }
 const particles=new Float32Array(180);for(let i=0;i<particles.length;i+=3){particles[i]=Math.sin(i*23)*7;particles[i+1]=(i%13)*.6;particles[i+2]=Math.cos(i*11)*12;}
 const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(particles,3));const pm=new THREE.PointsMaterial({color:0xffba73,size:.035,transparent:true,opacity:.6});const dust=new THREE.Points(pg,pm);scene.add(dust);
 function render(renderer,time,motion,draw){const w=window.innerWidth,h=window.innerHeight;camera.aspect=w/h;camera.updateProjectionMatrix();const a=motion?Math.sin(time*.13)*.18:0;
 camera.position.set(7*Math.cos(a)-5*Math.sin(a),3.5,7*Math.sin(a)+5*Math.cos(a));camera.lookAt(-1.4,2.1,0);camera.setViewOffset(w,h,-w*.16,0,w,h);
 ship.position.y=1.25+(motion?Math.sin(time*.8)*.08:0);dust.rotation.y=motion?time*.015:0;draw(scene,camera);}
 return {setCraft,render,dispose(){disposed=true;if(backdrop)releaseModel(backdrop);owned.forEach(m=>m.dispose());root.traverse(o=>o.geometry?.dispose());pg.dispose();pm.dispose();stone.dispose();dark.dispose();red.dispose();cyan.dispose();}};
}
