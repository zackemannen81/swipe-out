import * as THREE from 'three';

export function addBranchGeometry(group, curve, boostPads) {
  for (const branch of curve.track.branches ?? []) {
    const positions = [], indices = [], edgePositions = [[], []];
    const samples = Math.min(2400, Math.max(80, Math.ceil(branch.length / 3)));
    for (let i = 0; i <= samples; i++) {
      const u = i / samples, frame = branch.frame(u), half = branch.widthAt(u) / 2;
      for (const [side, n] of [[-1,0],[1,1]]) {
        const point = frame.center.clone().addScaledVector(frame.right, side * half).addScaledVector(frame.normal,0.025);
        positions.push(...point.toArray());
        edgePositions[n].push(point.clone().addScaledVector(frame.normal, 0.15));
      }
      if (i < samples) { const a = i*2; indices.push(a,a+2,a+1,a+1,a+2,a+3); }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions,3)); geometry.setIndex(indices); geometry.computeVertexNormals();
    const deck = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({color:0x263345,emissive:0x10233b,emissiveIntensity:0.65,side:THREE.DoubleSide}));
    deck.userData.routeId = branch.id; group.add(deck);
    for (const points of edgePositions) {
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xffc468})));
    }
    const railGeometry = new THREE.BoxGeometry(0.18,0.8,5);
    const railMaterial = new THREE.MeshStandardMaterial({color:0xffbc53,emissive:0xff922c,emissiveIntensity:2});
    const railMatrices = [], matrix = new THREE.Matrix4();
    for (let d = 35; d < branch.length - 35; d += Math.max(6, branch.length/2400)) {
      const u = d / branch.length, frame = branch.frame(u);
      for (const side of [-1,1]) {
        const p = frame.center.clone().addScaledVector(frame.right,side*branch.widthAt(u)/2).addScaledVector(frame.normal,0.4);
        railMatrices.push(matrix.clone().compose(p,frame.rotation,new THREE.Vector3(1,1,1)));
      }
    }
    const rails = new THREE.InstancedMesh(railGeometry,railMaterial,railMatrices.length);
    railMatrices.forEach((m,i)=>rails.setMatrixAt(i,m)); group.add(rails);
    const padMatrices=[];
    for (let d = 70; d < branch.length - 60; d += Math.max(180,branch.length/128)) {
      const u = d / branch.length, frame = branch.frame(u);
      const position=frame.center.clone().addScaledVector(frame.normal,0.08);
      padMatrices.push(new THREE.Matrix4().compose(position,frame.rotation,new THREE.Vector3(1,1,1)));
      boostPads.push({d:(branch.start+(branch.end-branch.start)*u)*curve.getLength(),offset:0,routeId:branch.id});
    }
    const pads=new THREE.InstancedMesh(new THREE.BoxGeometry(2.4,0.06,5),new THREE.MeshStandardMaterial({color:0x7aff61,emissive:0x44ff32,emissiveIntensity:3}),padMatrices.length);
    padMatrices.forEach((m,i)=>pads.setMatrixAt(i,m));group.add(pads);
    // Paired amber beacons identify a shared junction without a blocking crossbar.
    for (const u of [0,1]) {
      const frame=branch.frame(u);
      for (const side of [-1,1]) {
        const beacon=new THREE.Mesh(new THREE.BoxGeometry(0.35,4,0.35),railMaterial);
        beacon.position.copy(frame.center).addScaledVector(frame.right,side*(curve.track.width/2+0.5)).addScaledVector(frame.normal,2);
        beacon.quaternion.copy(frame.rotation); group.add(beacon);
      }
    }
  }
}
