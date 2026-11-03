import * as THREE from 'three';

// The photographic hangar stays fixed; only the live craft moves over its platform.
export function createGarage(templates) {
 let disposed=false, backdrop=null, glow=1;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#090f17');
 const camera=new THREE.PerspectiveCamera(40,1,.1,100);
 new THREE.TextureLoader().load('/images/garage.jpg', texture=>{
  if(disposed){texture.dispose();return;}
  texture.colorSpace=THREE.SRGBColorSpace;
  backdrop=texture;scene.background=texture;
 },undefined,error=>console.warn('Garage background unavailable.',error));
 scene.add(new THREE.HemisphereLight('#c2d9ef','#293242',3));
 for(const [color,intensity,x,y,z] of [[0xc8eaff,80,3,6,2],[0xff2244,90,-5,3,-3],[0x9acfff,45,5,2,4]]){
  const light=new THREE.PointLight(color,intensity,30);light.position.set(x,y,z);scene.add(light);
 }
 const ship=new THREE.Group();ship.position.y=1.25;scene.add(ship);let owned=[];
 function setCraft(id,paint){
  owned.forEach(m=>m.dispose());owned=[];ship.clear();
  const source=templates[id]??templates.racer;
  for(const child of source.children){if(child.isLight)continue;const copy=child.clone(true);copy.traverse(o=>{if(o.isMesh){o.material=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{const c=m.clone();if(paint&&c.color)c.color.multiply(new THREE.Color(paint));owned.push(c);return c;});if(o.material.length===1)o.material=o.material[0];}});ship.add(copy);}
 }
 function render(renderer,time,motion,draw){
  const w=window.innerWidth,h=window.innerHeight,aspect=w/h;
  camera.aspect=aspect;
  // Cover without stretching. Anchor the ship to the same point in the cropped image.
  const imageAspect=backdrop?.image ? backdrop.image.width/backdrop.image.height : 5504/3072;
  const repeatX=Math.min(1,aspect/imageAspect),repeatY=Math.min(1,imageAspect/aspect);
  const offsetX=(1-repeatX)/2,offsetY=(1-repeatY)/2;
  if(backdrop){backdrop.repeat.set(repeatX,repeatY);backdrop.offset.set(offsetX,offsetY);}
  const shipX=THREE.MathUtils.clamp((.67-offsetX)/repeatX,.55,.85);
  const shipY=THREE.MathUtils.clamp((.61-offsetY)/repeatY,.45,.75);
  camera.position.set(7,3.5,5);camera.lookAt(0,1.25,0);
  camera.setViewOffset(w,h,(.5-shipX)*w,(.5-shipY)*h,w,h);
  camera.updateProjectionMatrix();
  ship.position.y=1.25+(motion?Math.sin(time*.8)*.06:0);
  ship.rotation.y=motion?Math.sin(time*.13)*.12:0;
  for(const material of owned){
   if(material.emissiveIntensity!==undefined){
    material.userData.garageBaseGlow??=material.emissiveIntensity;
    material.emissiveIntensity=material.userData.garageBaseGlow*glow;
   }
  }
  draw(scene,camera);
 }
 return {setCraft,render,setGlow(value){glow=value;},dispose(){disposed=true;backdrop?.dispose();owned.forEach(m=>m.dispose());}};
}
