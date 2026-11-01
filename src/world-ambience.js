import * as THREE from 'three';
export function addWorldAmbience(group,curve){
 if(!/necros/i.test(curve.track.name))return;
 const points=curve.getPoints(100),bounds=new THREE.Box3().setFromPoints(points),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
 const drones=[];const hull=new THREE.MeshStandardMaterial({color:0x17212a,metalness:.7,roughness:.5}),lamp=new THREE.MeshBasicMaterial({color:new THREE.Color(0xbb0010).multiplyScalar(12)});
 for(let i=0;i<3;i++){
  const drone=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(5,2,17),hull);drone.add(body);
  const wings=new THREE.Mesh(new THREE.BoxGeometry(15,.5,5),hull);drone.add(wings);
  for(const x of [-4,4]){const beacon=new THREE.Mesh(new THREE.SphereGeometry(.35,6,4),lamp);beacon.position.set(x,0,5);drone.add(beacon);}
  drone.position.set(center.x,bounds.max.y+70+i*25,center.z);group.add(drone);drones.push({drone,phase:i*2.1,center:center.clone(),height:drone.position.y,radius:Math.max(size.x,size.z)*.55+60});
 }
 group.userData.patrols=drones;
}
export function updateWorldAmbience(group,time){
 for(const {drone,phase,center,height,radius}of group?.userData.patrols??[]){const a=time*.018+phase;drone.position.set(center.x+Math.cos(a)*radius,height,center.z+Math.sin(a)*radius);drone.rotation.y=-a;}
}
