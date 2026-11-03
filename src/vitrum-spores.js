import * as THREE from 'three';
import {getTrackFrame,getTrackWidth} from './track-path.js';

const random=n=>{const v=Math.sin(n*127.1+31.7)*43758.5453;return v-Math.floor(v);};
const vertex=`
uniform float time; uniform float speed; uniform float layer;
attribute float phase; attribute vec3 tint;
varying vec3 hue; varying float fade;
void main(){
 vec3 p=position;
 p.x+=sin(time*.23+phase)*2.5;
 p.z+=cos(time*.19+phase)*2.5;
 p.y+=sin(time*.31+phase)*2.0;
 vec4 mv=modelViewMatrix*vec4(p,1.0);
 float d=length(mv.xyz);
 fade=(1.0-smoothstep(260.0,520.0,d))*smoothstep(4.0,22.0,d);
 fade*=.65+.35*sin(time*(.35+fract(phase)) +phase);
 if(layer>1.5)fade*=smoothstep(100.0,280.0,speed);
 hue=tint;
 float size=layer<.5?2.8:(layer<1.5?6.5:7.0);
 gl_PointSize=clamp(size*320.0/max(1.0,-mv.z),2.0,layer>1.5?20.0:16.0);
 gl_Position=projectionMatrix*mv;
}`;
const fragment=`
uniform float layer; varying vec3 hue; varying float fade;
void main(){
 vec2 p=gl_PointCoord-.5;
 if(layer>1.5)p.x*=5.0;
 float r=length(p)*2.0;
 if(r>1.0)discard;
 float a=pow(1.0-r,1.6)*fade*(layer<.5?.7:.85);
 gl_FragColor=vec4(hue,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

export function createVitrumSpores(curve){
 const group=new THREE.Group();group.name='vitrumSpores';
 const palette=[0x8acfc3,0xc7c98a,0xe1b779,0xafa0c7].map(c=>new THREE.Color(c));
 [5200,650,350].forEach((count,layer)=>{
  const positions=[],phases=[],colors=[];
  for(let i=0;i<count;i++){
   const seed=i+layer*10000,u=random(seed+3),f=getTrackFrame(curve,u);
   // More spores at the canopy, mycelium and Bloom; fewer in exposed stretches.
   const rich=Math.sin(u*Math.PI*6)>.1;
   const side=random(seed+7)>.5?1:-1;
   const overRoad=random(seed+31)<.42;
   const lateral=overRoad?(random(seed+11)-.5)*getTrackWidth(curve,u):side*(getTrackWidth(curve,u)/2+5+random(seed+11)*(rich?40:65));
   const p=f.center.clone().addScaledVector(f.right,lateral).addScaledVector(f.normal,(overRoad?9:4)+random(seed+13)*30);
   positions.push(...p.toArray());phases.push(random(seed+19)*Math.PI*20);
   const color=palette[random(seed+23)>.94?3:Math.floor(random(seed+29)*3)];colors.push(...color.toArray());
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('phase',new THREE.Float32BufferAttribute(phases,1));
  geometry.setAttribute('tint',new THREE.Float32BufferAttribute(colors,3));
  const material=new THREE.ShaderMaterial({uniforms:{time:{value:0},speed:{value:0},layer:{value:layer}},vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending});
  const points=new THREE.Points(geometry,material);points.name=['pollen','glowing-spores','speed-spores'][layer];
  geometry.computeBoundingSphere();geometry.boundingSphere.radius+=5;group.add(points);
 });
 return group;
}

export function updateVitrumSpores(track,time,speed=0){
 const group=track?.getObjectByName('vitrumSpores');
 for(const p of group?.children??[]){p.material.uniforms.time.value=time;p.material.uniforms.speed.value=Math.max(0,speed);}
}
