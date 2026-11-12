from pathlib import Path
p=Path('src/editor.js');s=p.read_text(encoding='utf-8-sig');s="import {newEnvironment,normalizeEnvironment,serializeEnvironment,parseEnvironment} from './environment-format.js';\nimport {loadEnvironments,persistEnvironment,removeEnvironment} from './environment-storage.js';\n"+s
s=s.replace('normalizeTrack, parseTrack, serializeTrack, MAX_TRACK_BYTES','normalizeTrack as normalizeRaceTrack, parseTrack as parseRaceTrack, serializeTrack as serializeRaceTrack, MAX_TRACK_BYTES')
s=s.replace('const library = await loadTrackLibrary(localStorage);',"""const environmentMode=new URLSearchParams(location.search).get('mode')==='environment';
const normalizeTrack=environmentMode?normalizeEnvironment:normalizeRaceTrack;
const parseTrack=environmentMode?parseEnvironment:parseRaceTrack;
const serializeTrack=environmentMode?serializeEnvironment:serializeRaceTrack;
const library = environmentMode?await loadEnvironments():await loadTrackLibrary(localStorage);
if(environmentMode&&!Object.keys(library.entries).length){const key='scene-'+crypto.randomUUID();library.entries[key]={data:newEnvironment(key)};}
const modeLink=document.createElement('a');modeLink.className='game-link';modeLink.href=environmentMode?'./editor.html':'./editor.html?mode=environment';modeLink.textContent=environmentMode?'TRACK EDITOR ↗':'ENVIRONMENT EDITOR ↗';$('.editor-header').append(modeLink);
if(environmentMode){
 document.title='SwipeOut — Environment Editor';document.body.classList.add('environment-editor');
 $('.eyebrow').textContent='DEV TOOL / ENVIRONMENT AUTHORING';$('.canvas-panel .panel-heading span').textContent='3D ENVIRONMENT EDITOR';$('.controls-panel .panel-heading span').textContent='SCENE SETTINGS';
 $('#fit-button').textContent='FIT SCENE';$('#save-button').textContent='SAVE SCENE';$('#test-button').textContent='PREVIEW SAVED CAMERA';$('#import-button').textContent='IMPORT SCENE / TRACK JSON';
 $('#track-select').parentElement.firstChild.textContent='SCENE ';$('#scale-input').parentElement.firstChild.textContent='OBJECT X/Z SCALE ';
 $('#width-input').parentElement.hidden=true;$('#magnetic-input').parentElement.hidden=true;
 document.querySelectorAll('.point-editor,.cathedral-kit').forEach(e=>e.hidden=true);
 document.querySelectorAll('.gap-editor').forEach(e=>{if(!e.contains($('#track-sky')))e.hidden=true;});
 $('#track-alt-music').parentElement.hidden=true;
 $('#track-sky').closest('.gap-editor').querySelector('.field-help').textContent='Scene music is stored as a reference. The editor does not play it.';
 $('footer').textContent='ENVIRONMENTS SAVE SEPARATELY FROM TRACKS · DOWNLOAD JSON FOR BACKUP · MODEL PATHS REQUIRE THEIR FILES';
 const controls=document.createElement('section');controls.className='environment-controls';controls.innerHTML=`<div class="button-row"><button id="new-scene">NEW EMPTY SCENE</button><button id="new-room">NEW ROOM TEMPLATE</button></div><p class="field-help">1 unit ≈ 1 metre at scale 1. Add models or primitives, then capture a camera. Scenes do not appear in the race selector.</p><div class="button-row"><button id="capture-camera">CAPTURE CAMERA</button><button id="restore-camera">RESTORE CAMERA</button></div><label>CAMERA FOV <input id="scene-fov" type="number" min="15" max="100" value="45"></label><label>AMBIENT LIGHT <input id="scene-ambient" type="number" min="0" max="10" step="0.1"></label><label>KEY LIGHT <input id="scene-key" type="number" min="0" max="10" step="0.1"></label><label>BACKGROUND COLOR <input id="scene-background" type="color"></label><p class="field-help">Preview hides grid and edit handles. Press Escape or the preview button to return.</p>`;
 $('.controls-panel').prepend(controls);
}
""")
s=s.replace("let currentKey = drafts.has(requestedKey) ? requestedKey : 'track1';", "let currentKey = drafts.has(requestedKey) ? requestedKey : environmentMode?drafts.keys().next().value:'track1';")
s=s.replace("const view = createEditorView($('#editor-canvas'), {", "const view = createEditorView($('#editor-canvas'), {\n  environmentMode,")
s=s.replace("message('Unsaved changes. Save to Game or Save & Test when ready.');", "message(environmentMode?'Unsaved scene. Save Scene or Download when ready.':'Unsaved changes. Save to Game or Save & Test when ready.');")
s=s.replace("  $('#point-count').textContent = `${value.centerline.length} POINTS · ${value.objects.length} OBJECTS`;", "  $('#point-count').textContent = environmentMode?`${value.objects.length} OBJECTS · ENVIRONMENT`:`${value.centerline.length} POINTS · ${value.objects.length} OBJECTS`;\n  if(environmentMode){setValue('#scene-fov',value.environment.camera.fov);setValue('#scene-ambient',value.environment.lighting.ambient);setValue('#scene-key',value.environment.lighting.key);setValue('#scene-background',value.environment.background);}")
s=s.replace('view.setSky(value.sky??defaults.backdrop);',"view.setSky(value.sky??(environmentMode?'':defaults.backdrop));")
s=s.replace("  message('Drafts are kept while switching tracks. Save or download before closing the editor.');", "  if(environmentMode)view.setCamera(track().environment.camera);\n  message('Drafts are kept while switching. Save or download before closing the editor.');")
s=s.replace("const position = track().centerline[selection.kind === 'point' ? selection.index : 0].slice(0, 3);", "const position = environmentMode?[0,0,0]:track().centerline[selection.kind === 'point' ? selection.index : 0].slice(0, 3);")
s=s.replace('await persistTrack(localStorage, key, snapshot)', 'await (environmentMode?persistEnvironment(key,snapshot):persistTrack(localStorage, key, snapshot))')
s=s.replace("message('Saved to IndexedDB in this browser. The track is now available in the race selector.');", "message(environmentMode?'Scene saved in this browser. Download JSON for a portable backup.':'Saved to IndexedDB in this browser. The track is now available in the race selector.');")
s=s.replace("  // Open synchronously", "  if(environmentMode){toggleScenePreview();return;}\n  // Open synchronously")
s=s.replace("const builtIn = BUILTIN_TRACKS[currentKey];", "const builtIn = environmentMode?null:BUILTIN_TRACKS[currentKey];")
s=s.replace("    await removePersistedTrack(localStorage, currentKey);", "    if(environmentMode){await removeEnvironment(currentKey);drafts.delete(currentKey);if(!drafts.size)addEnvironment(false);else activate(drafts.keys().next().value);message('Scene removed. Other scenes and tracks were kept.');return;}\n    await removePersistedTrack(localStorage, currentKey);")
s=s.replace("message('Track JSON copied.');", "message(environmentMode?'Scene JSON copied.':'Track JSON copied.');")
s=s.replace("message('Versioned track JSON downloaded. Embedded textures travel with the file.');", "message('Versioned JSON downloaded. Embedded models/textures travel with the file; path references require their files.');")
s=s.replace("message('Imported as a new draft. Existing tracks are kept. Save to Game to make this track playable.');", "message(environmentMode?'Imported as a new scene draft. Track objects retain their X/Z scale; racing geometry is omitted. Save Scene when ready.':'Imported as a new draft. Existing tracks are kept. Save to Game to make this track playable.');")
s=s.replace('render(); view.setTrack(track(), selection); view.fit();', 'render(); view.setTrack(track(), selection); view.fit();\nif(environmentMode)view.setCamera(track().environment.camera);')
# Append scene mode interactions. Helpers are hoisted for delete fallback.
s+='''
let scenePreview=false,editingCamera=null;
function toggleScenePreview(force){
 if(!environmentMode)return;
 const enable=force??!scenePreview;
 if(enable===scenePreview)return;
 if(flyEnabled)toggleFly(false);
 if(enable){editingCamera=view.getCamera();view.setCamera(track().environment.camera);}else if(editingCamera)view.setCamera(editingCamera);
 scenePreview=enable;view.setPreview(enable);document.body.classList.toggle('scene-preview',enable);
 $('#test-button').textContent=enable?'RETURN TO EDITING · ESC':'PREVIEW SAVED CAMERA';
}
function addEnvironment(room){
 toggleScenePreview(false);const key='scene-'+crypto.randomUUID(),value=newEnvironment(key,room?'New room':'Untitled scene',room);
 drafts.set(key,{track:value,saved:null,history:createHistory(value)});activate(key);
}
if(environmentMode){
 $('#new-scene').onclick=()=>addEnvironment(false);$('#new-room').onclick=()=>addEnvironment(true);
 $('#capture-camera').onclick=()=>{const camera=view.getCamera();edit(n=>{n.environment.camera=camera;});message('Camera captured. Save Scene to keep it.');};
 $('#restore-camera').onclick=()=>{if(flyEnabled)toggleFly(false);view.setCamera(track().environment.camera);};
 $('#scene-fov').onchange=e=>{const value=e.target.valueAsNumber;if(edit(n=>{n.environment.camera.fov=value;}))view.setCamera({...view.getCamera(),fov:value});};
 for(const name of ['ambient','key'])$('#scene-'+name).onchange=e=>{const value=e.target.valueAsNumber;edit(n=>{n.environment.lighting[name]=value;});};
 $('#scene-background').onchange=e=>{const value=e.target.value;edit(n=>{n.environment.background=value;});};
 window.addEventListener('keydown',e=>{if(e.code==='Escape'&&scenePreview){e.preventDefault();toggleScenePreview(false);}});
}
'''
p.write_text(s,encoding='utf8')
