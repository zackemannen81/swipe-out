from pathlib import Path
p=Path('src/environment-format.js');s=p.read_text().replace('[[0,0,0],[30,0,0],[30,0,30],[0,0,30]]','[[0,0,0],[200,0,0],[200,0,200],[0,0,200]]');p.write_text(s)
p=Path('src/editor-view.js');s=p.read_text(encoding='utf-8-sig');s=s.replace('onCommit, onError })','onCommit, onError, environmentMode=false })');s=s.replace('let skyPath=', 'let cleanPreview=false;\n  let skyPath=')
s=s.replace("const grid = new THREE.GridHelper(2000, 40,", "const grid = new THREE.GridHelper(environmentMode?200:2000, environmentMode?200:40,")
s=s.replace('const speed = flyKeys.has(\'ShiftLeft\') || flyKeys.has(\'ShiftRight\') ? 300 : 65;',"const speed = (flyKeys.has('ShiftLeft') || flyKeys.has('ShiftRight') ? 300 : 65)*(environmentMode?.1:1);")
s=s.replace("    const assets = createTrack(track);", """    if(environmentMode){
      road=new THREE.Group();scene.add(road);
      light.intensity=track.environment.lighting.key;fillLight.intensity=track.environment.lighting.ambient;
      if(!skyPath)scene.background=new THREE.Color(track.environment.background);
      const key=JSON.stringify([track.horizontalScale,track.objects]);
      if(key!==sceneryKey){spawnTrackObjects(scene,track);sceneryKey=key;}
      syncHighlights();dirty=false;lastBuild=performance.now();return;
    }
    const assets = createTrack(track);""")
s=s.replace("  function syncSelection() {", "  function syncSelection() {\n    if(cleanPreview||(environmentMode&&selection.kind!=='object')){transform.detach();return;}")
s=s.replace("    if (flyMode) {\n      if (event.button", "    if(cleanPreview)return;\n    if (flyMode) {\n      if (event.button")
s=s.replace("    if (flyMode) { flyPointer", "    if(cleanPreview)return;\n    if (flyMode) { flyPointer")
s=s.replace('const sources = track.centerline.map', 'const sources = (environmentMode?[]:track.centerline).map')
s=s.replace('    (track.branches??[]).forEach', '    (environmentMode?[]:(track.branches??[])).forEach')
s=s.replace('    grid.position.y = bounds.min.y - 10;',"""    if(environmentMode){
      for(const o of track.objects){const p=new THREE.Vector3(o.position[0]*track.horizontalScale,o.position[1],o.position[2]*track.horizontalScale);bounds.expandByPoint(p);}
      if(bounds.isEmpty())bounds.set(new THREE.Vector3(-12,0,-12),new THREE.Vector3(12,8,12));
    }
    grid.position.y = environmentMode?0:bounds.min.y - 10;""")
s=s.replace('  function fit(top = false) {',"""  function fit(top = false) {
    if(environmentMode){const objects=scene.getObjectByName('customTrackObjects');if(objects?.children.length){const b=new THREE.Box3().setFromObject(objects);if(!b.isEmpty())bounds.copy(b);}}
""")
s=s.replace('    else orbit.update();','    else if(!cleanPreview)orbit.update();')
s=s.replace('helpers:true','helpers:!cleanPreview')
s=s.replace('    setTrack, setSky, fit, setFlyMode,',"""    setTrack, setSky, fit, setFlyMode,
    getCamera(){return {position:camera.position.toArray(),target:orbit.target.toArray(),fov:camera.fov};},
    setCamera(value){if(flyMode)setFlyMode(false);camera.position.fromArray(value.position);orbit.target.fromArray(value.target);camera.up.set(0,1,0);camera.fov=value.fov;camera.updateProjectionMatrix();orbit.update();},
    setPreview(value){cleanPreview=!!value;grid.visible=!cleanPreview;markers.visible=!cleanPreview;selectionHelpers.visible=!cleanPreview;orbit.enabled=!cleanPreview&&!flyMode;transform.enabled=!cleanPreview&&!flyMode;transform.getHelper().visible=!cleanPreview&&!flyMode;if(cleanPreview)transform.detach();else syncSelection();},
""")
s=s.replace('Math.max(track.width * 7, 60,', 'Math.max(environmentMode?6:track.width * 7, environmentMode?8:60,')
p.write_text(s,encoding='utf8')
