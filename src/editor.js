import editorMedia from 'virtual:track-editor-media';
import { loadGlb, validateGlb } from './glb-scenery.js';
import { CATHEDRAL_KIT, createCathedralObjects } from './cathedral-kit.js';
import { suggestBoostPads } from './track-pads.js';
import { createTrack, disposeTrackGroup } from './track.js';
import { BUILTIN_TRACKS } from './track-library.js';
import { loadTrackLibrary, persistTrack, removePersistedTrack } from './track-storage.js';
import { normalizeTrack, parseTrack, serializeTrack, MAX_TRACK_BYTES } from './track-format.js';
import { createHistory } from './editor-history.js';
import { selectedObjectIndexes, copySceneObjects, createPastedObjects, withoutSceneObjects } from './editor-object-actions.js';
import { createEditorView } from './editor-view.js';
import { createTrackCurve, getTrackFrame, progressAtControlPoint } from './track-path.js';
import './editor.css';

const $ = selector => document.querySelector(selector);
const library = await loadTrackLibrary(localStorage);
const drafts = new Map();
for (const [key, entry] of Object.entries(library.entries)) {
  drafts.set(key, { track: entry.data, saved: JSON.stringify(entry.data), history: createHistory(entry.data) });
}
const requestedKey = new URLSearchParams(location.search).get('track');
let currentKey = drafts.has(requestedKey) ? requestedKey : 'track1';
let selection = { kind: 'point', index: 0 };
let selectedObjects = new Set();
let objectClipboard = [];
let flyEnabled = false;
const current = () => drafts.get(currentKey);
const selectedIndexes = () => selection.kind === 'object'
  ? selectedObjectIndexes(selection, selectedObjects, track().objects.length) : [];
function chooseSelection(value, { additive = false, focus = false } = {}) {
  if (value.kind === 'object') {
    if (additive) {
      if (selectedObjects.has(value.index)) selectedObjects.delete(value.index);
      else selectedObjects.add(value.index);
      const remaining = [...selectedObjects];
      selection = remaining.length
        ? {kind:'object', index:selectedObjects.has(value.index) ? value.index : remaining.at(-1)}
        : {kind:'point', index:0};
    } else {
      selection = value;
      selectedObjects = new Set([value.index]);
    }
  } else {
    selection = value;
    selectedObjects.clear();
  }
  render();
  view.select(selection, selectedIndexes());
  if (focus) { if (flyEnabled) toggleFly(false); view.focus(); }
}

const track = () => current().track;
const isDirty = draft => draft.saved !== JSON.stringify(draft.track);
const status = $('#status');
const catalogOptions=[
  ['#track-music',editorMedia.audio,'Use circuit default'],
  ['#track-alt-music',editorMedia.audio,'No alternate'],
  ['#track-sky',editorMedia.images,'Use circuit default'],
  ['#road-texture',editorMedia.images,'No custom texture']
];
for(const [selector,files,label] of catalogOptions) {
  $(selector).replaceChildren(new Option(label,''),...files.map(path=>new Option(decodeURIComponent(path.split('/').slice(2).join('/')),path)));
}
function syncMediaChoice(selector,value,inherited='') {
  const input=$(selector);
  input.options[0].textContent=inherited ? 'Use default · '+decodeURIComponent(inherited.split('/').at(-1)) : input.options[0].textContent;
  if(value&&!Array.from(input.options).some(option=>option.value===value))
    input.add(new Option('Not found · '+value,value));
  setValue(selector,value??'');
}
function themeRailColors(definition) {
  if(definition.id==='vitrum-neural-ascent')return {left:'#e6bd67',right:'#89dcc2'};
  if(/necros/i.test(definition.name))return {left:'#a80010',right:'#a80010'};
  return {left:'#ff4b91',right:'#58f4e8'};
}
function message(text, error = false) { status.textContent = text; status.classList.toggle('error', error); }
const view = createEditorView($('#editor-canvas'), {
  onError(error) { message(error, true); },
  onSelect(value, options) { chooseSelection(value, options); },
  onMove(value, position) {
    const previous = value.kind === 'object' ? track().objects[value.index].position : null;
    const delta = previous?.map((v, i) => position[i] - v);
    const indexes = selectedIndexes();
    edit(next => {
      if (value.kind === 'point') next.centerline[value.index].splice(0, 3, ...position);
      else if (value.kind === 'branch') next.branches[value.branch].points[value.index] = position;
      else if (indexes.length > 1) {
        for (const index of indexes) {
          next.objects[index].position = next.objects[index].position.map((v, i) => Math.round((v + delta[i]) * 100) / 100);
        }
      } else next.objects[value.index].position = position;
    }, false);
  },
  onCommit() { current().history.push(track()); render(); view.setTrack(track(), selection, selectedIndexes()); },
});

function edit(change, commit = true) {
  try {
    const next = structuredClone(track());
    change(next);
    current().track = normalizeTrack(next);
    if (commit) current().history.push(track());
    render();
    view.setTrack(track(), selection, selectedIndexes());
    message('Unsaved changes. Save to Game or Save & Test when ready.');
    return true;
  } catch (error) {
    render();
    message(error.message, true);
    return false;
  }
}

function setValue(selector, value) {
  const input = $(selector);
  if (document.activeElement !== input) input.value = value;
}
function clampSelection() {
  selectedObjects = new Set([...selectedObjects].filter(i => i >= 0 && i < track().objects.length));
  if (selection.kind === 'branch' && !track().branches?.[selection.branch]) selection = {kind:'point',index:0};
  const count = selection.kind === 'point' ? track().centerline.length : selection.kind === 'branch' ? track().branches[selection.branch].points.length : track().objects.length;
  if (!count) { selection = { kind: 'point', index: 0 }; selectedObjects.clear(); }
  else selection.index = Math.max(0, Math.min(selection.index, count - 1));
}
function render() {
  clampSelection();
  const value = track();
  $('#track-title').textContent = value.name;
  const select = $('#track-select');
  select.replaceChildren(...Array.from(drafts, ([key, draft]) => {
    const option = new Option(`${BUILTIN_TRACKS[key] ? '' : 'CUSTOM · '}${draft.track.name}${isDirty(draft) ? ' *' : ''}`, key);
    return option;
  }));
  select.value = currentKey;
  $('#save-state').textContent = isDirty(current()) ? 'UNSAVED' : 'SAVED';
  $('#point-count').textContent = `${value.centerline.length} POINTS · ${value.objects.length} OBJECTS`;
  setValue('#track-name', value.name);
  setValue('#width-input', value.width);
  setValue('#scale-input', value.horizontalScale);
  $('#width-value').textContent = value.width.toFixed(2);
  $('#scale-value').textContent = value.horizontalScale.toFixed(2);
  $('#magnetic-input').checked = value.magnetic === true;
  const defaults=library.entries[currentKey]??BUILTIN_TRACKS[currentKey]??BUILTIN_TRACKS.track1;
  syncMediaChoice('#track-music',value.music,defaults.defaultAudio);
  syncMediaChoice('#track-alt-music',value.alternateMusic);
  syncMediaChoice('#track-sky',value.sky,defaults.backdrop);
  syncMediaChoice('#road-texture',value.roadTexture);
  setValue('#road-material',value.roadMaterial??'default');
  const rails=themeRailColors(value);
  setValue('#rail-left',value.railColors?.left??rails.left);
  setValue('#rail-right',value.railColors?.right??rails.right);
  setValue('#cpu-multiplier',value.cpuMultiplier??1);
  $('#cpu-multiplier-value').textContent=(value.cpuMultiplier??1).toFixed(2);
  view.setSky(value.sky??defaults.backdrop);
  $('#undo-button').disabled = !current().history.canUndo;
  $('#redo-button').disabled = !current().history.canRedo;
  $('#reset-button').textContent = BUILTIN_TRACKS[currentKey] ? 'RESTORE BUILT-IN' : 'REMOVE CUSTOM';
  const pointIndex = selection.kind === 'point' ? selection.index : 0;
  const point = selection.kind === 'branch' ? value.branches[selection.branch].points[selection.index] : value.centerline[pointIndex];
  setValue('#point-width', value.pointWidths?.[pointIndex] ?? '');
  $('#point-width').disabled = selection.kind !== 'point';
  setValue('#road-style', value.roadStyle ?? 'classic');
  renderPads();
  setValue('#point-bank', point[3] ?? 0);
  $('#point-bank').disabled = selection.kind !== 'point' || !value.magnetic;
  $('#selected-point').textContent = selection.kind === 'point' ? String(pointIndex + 1).padStart(2, '0') : selection.kind === 'branch' ? `ROUTE POINT ${selection.index+1}` : `${selectedIndexes().length} OBJECT(S)`;
  const count = selectedIndexes().length;
  $('#object-selection-count').textContent = count ? `${count} scenery object(s) selected. Shift/Ctrl-click to add or remove.` : 'Shift/Ctrl-click objects in the 3D view to select multiple.';
  $('#delete-objects-button').disabled = $('#copy-objects-button').disabled = !count;
  $('#paste-objects-button').disabled = !objectClipboard.length;
  for (const [axis, name] of ['x', 'y', 'z'].entries()) {
    setValue(`#point-${name}`, point[axis]);
    $(`#point-${name}`).disabled = selection.kind === 'object';
  }
  $('#add-point-btn').disabled = selection.kind === 'object' || (selection.kind==='branch' ? pointCollection(value).length>=64 : value.centerline.length>=512);
  $('#del-point-btn').disabled = selection.kind === 'object' || pointCollection(value).length <= (selection.kind==='branch'?1:4);
  renderObjectInspector();
  renderGaps();
  renderBranches();
}

function pointCollection(value) { return selection.kind==='branch' ? value.branches[selection.branch].points : value.centerline; }

function renderBranches() {
  const branches=track().branches??[], select=$('#branch-select');
  select.replaceChildren(new Option('Main road',''),...branches.map((b,i)=>new Option(b.name,String(i))));
  select.value=selection.kind==='branch'?String(selection.branch):'';
  $('#add-branch-button').disabled=!track().magnetic || selection.kind!=='point' || branches.length>=4;
  const panel=$('#branch-inspector'); if(panel.contains(document.activeElement)) return;
  panel.replaceChildren(); if(selection.kind!=='branch') return;
  const branch=branches[selection.branch];
  for(const [key,labelText,min,max] of [['name','NAME'],['start','START %',8,80],['end','END %',12,92],['width','WIDTH',4,track().width]]) {
    const label=document.createElement('label'); label.className='branch-field'; label.textContent=labelText;
    const input=document.createElement('input'); input.type=key==='name'?'text':'number';
    if(min!==undefined) {input.min=min;input.max=max;input.step=0.1;}
    input.value=['start','end'].includes(key)?(branch[key]*100).toFixed(3):branch[key];
    input.setAttribute('aria-label',`Route ${labelText}`);
    input.addEventListener('change',()=>{ const value=key==='name'?input.value:input.valueAsNumber/(['start','end'].includes(key)?100:1); input.blur(); edit(next=>{next.branches[selection.branch][key]=value;}); });
    label.append(input); panel.append(label);
  }
  const side=document.createElement('select'); side.setAttribute('aria-label','Route approach side');
  side.add(new Option('Approach LEFT','1'));side.add(new Option('Approach RIGHT','-1')); side.value=String(branch.side);
  side.addEventListener('change',()=>{const value=Number(side.value);side.blur();edit(next=>{next.branches[selection.branch].side=value;});});panel.append(side);
  const remove=document.createElement('button'); remove.textContent='REMOVE ROUTE'; remove.id='remove-branch-button';
  remove.addEventListener('click',()=>{const index=selection.branch;selectedObjects.clear();selection={kind:'point',index:0};edit(next=>{ const id=next.branches[index].id; next.branches.splice(index,1); if(next.pads) next.pads=next.pads.filter(p=>p.routeId!==id); });});panel.append(remove);
}

$('#branch-select').addEventListener('change',event=>{
  selectedObjects.clear();
  selection=event.target.value===''?{kind:'point',index:0}:{kind:'branch',branch:Number(event.target.value),index:0};
  if (flyEnabled) toggleFly(false);
  render();view.select(selection, []);view.focus();
});
$('#add-branch-button').addEventListener('click',()=>{
  const curve=createTrackCurve(track()), start=Math.max(0.08,Math.min(0.72,progressAtControlPoint(curve,selection.index))), end=start+0.16;
  const points=[0.25,0.5,0.75].map(u=>{
    const f=getTrackFrame(curve,start+(end-start)*u), p=f.center.addScaledVector(f.right,track().width*2*Math.sin(u*Math.PI));
    return [p.x/track().horizontalScale,p.y,p.z/track().horizontalScale];
  });
  const id=crypto.randomUUID();edit(next=>{next.branches??=[];next.branches.push({id,name:'Alternative route',start,end,side:1,width:Math.max(4,next.width*0.5),points});});
  const index=track().branches?.findIndex(b=>b.id===id)??-1;
  if(index>=0){selectedObjects.clear();selection={kind:'branch',branch:index,index:0};render();view.select(selection, []);view.fit();}
});

function renderGaps() {
  const gaps = track().gaps ?? [];
  $('#gap-count').textContent = String(gaps.length);
  $('#add-gap-button').disabled = !track().magnetic || selection.kind !== 'point' || gaps.length >= 16;
  const list = $('#gap-list');
  if (list.contains(document.activeElement)) return;
  list.replaceChildren(...gaps.map((gap, index) => {
    const row = document.createElement('div'); row.className = 'gap-row';
    for (const key of ['start', 'end']) {
      const label = document.createElement('label'); label.textContent = `${key.toUpperCase()} %`;
      const input = document.createElement('input');
      Object.assign(input, { type: 'number', min: 3, max: key === 'start' ? 90 : 94, step: 0.1, value: (gap[key] * 100).toFixed(3) });
      input.setAttribute('aria-label', `Gap ${index + 1} ${key} percent`);
      input.addEventListener('change', () => { const value = input.valueAsNumber / 100; input.blur(); edit(next => { next.gaps[index][key] = value; }); });
      label.append(input); row.append(label);
    }
    const remove = document.createElement('button'); remove.textContent = 'REMOVE';
    remove.addEventListener('click', () => edit(next => { next.gaps.splice(index, 1); }));
    row.append(remove); return row;
  }));
}

function renderObjectInspector() {
  const select = $('#object-select');
  select.replaceChildren(new Option('Select scenery…', ''), ...track().objects.map((object, i) => new Option(`${i + 1}. ${object.type === 'glb' ? (CATHEDRAL_KIT.find(part => part.model === object.model)?.label ?? 'GLB') : object.type.toUpperCase()}`, String(i))));
  select.value = selection.kind === 'object' ? String(selection.index) : '';
  const panel = $('#primitive-list');
  // Keep a focused numeric control alive while a value is being entered.
  if (panel.contains(document.activeElement)) return;
  panel.replaceChildren();
  if (selection.kind !== 'object') return;
  if (selectedIndexes().length > 1) {
    const note = document.createElement('p'); note.className = 'field-help';
    note.textContent = `${selectedIndexes().length} objects selected. Drag the gizmo to move the group, or use Copy / Paste / Delete above. Paste keeps their exact original positions.`;
    panel.append(note);
    return;
  }
  const object = track().objects[selection.index];
  const row = document.createElement('div');
  row.className = 'primitive-row active-row';
  const title = document.createElement('b');
  title.textContent = `${selection.index + 1}. ${object.type.toUpperCase()}`;
  row.append(title);
  for (const [field, labelText, step] of [['position', 'POSITION', 1], ['rotation', 'ROTATION (DEG)', 5], ['scale', 'SCALE', 0.5]]) {
    const section = document.createElement('div');
    section.className = 'object-dimensions';
    const heading = document.createElement('span'); heading.textContent = labelText; section.append(heading);
    ['X', 'Y', 'Z'].forEach((axis, i) => {
      const label = document.createElement('label'); label.textContent = axis;
      const input = document.createElement('input');
      input.type = 'number'; input.step = step; input.value = object[field][i];
      input.setAttribute('aria-label', `${labelText} ${axis}`);
      input.addEventListener('change', () => {
        const value = input.valueAsNumber;
        const index = selection.index;
        input.blur();
        edit(next => { next.objects[index][field][i] = value; });
      });
      label.append(input); section.append(label);
    });
    row.append(section);
  }
  if (object.type !== 'glb') {
  const colors = document.createElement('div'); colors.className = 'object-colors';
  const hex = value => typeof value === 'number' ? '#'+value.toString(16).padStart(6,'0') : value.length === 4 ? '#'+[...value.slice(1)].map(c=>c+c).join('') : value;
  const defaultColor = object.type==='light'?0xb60012:object.texture ? 0xffffff : object.type === 'cylinder' ? 0xffd166 : object.type === 'sphere' ? 0xb58cff : 0xff7aa8;
  for (const [key, title, fallback] of [['color','SURFACE COLOR',defaultColor],['emissive','GLOW COLOR',0x000000]]) {
    const label = document.createElement('label'); label.textContent = title;
    const input = document.createElement('input'); input.type = 'color'; input.value = hex(object[key] ?? fallback);
    input.setAttribute('aria-label',title); input.id = 'object-'+key;
    input.addEventListener('change',()=>{const value=input.value; input.blur(); edit(next=>{next.objects[selection.index][key]=value;});});
    label.append(input); colors.append(label);
  }
  const presets = document.createElement('div'); presets.className = 'neon-presets';
  for(const [name,color] of [['Blood red','#a80010'],['Cyan','#00e5ff'],['Pink','#ff269e'],['Lime','#a3ff12'],['Amber','#ffb020'],['Violet','#9c55ff']]) {
    const button = document.createElement('button'); button.textContent = name; button.style.setProperty('--swatch',color);
    button.setAttribute('aria-label','Neon '+name);
    button.addEventListener('click',()=>edit(next=>{Object.assign(next.objects[selection.index],{color,emissive:color});}));
    presets.append(button);
  }
  colors.append(presets);
  const off = document.createElement('button'); off.textContent='GLOW OFF'; off.id='object-glow-off';
  off.addEventListener('click',()=>edit(next=>{next.objects[selection.index].emissive=0x000000;})); colors.append(off);
  const reset = document.createElement('button'); reset.textContent='DEFAULT COLORS'; reset.id='object-color-reset';
  reset.addEventListener('click',()=>edit(next=>{delete next.objects[selection.index].color;delete next.objects[selection.index].emissive;})); colors.append(reset);
  const help = document.createElement('p'); help.className='field-help'; help.textContent='Neon sets surface and glow together. Surface color tints any texture; glow is self-lit. The race adds bloom around bright objects.';
  colors.append(help); row.append(colors);
  const opacityLabel = document.createElement('label'); opacityLabel.textContent = 'OPACITY';
  const opacity = document.createElement('input');
  Object.assign(opacity, { type: 'number', min: 0, max: 1, step: 0.05, value: object.opacity });
  opacity.setAttribute('aria-label', 'Object opacity');
  opacity.addEventListener('change', () => { const value = opacity.valueAsNumber; opacity.blur(); edit(next => { next.objects[selection.index].opacity = value; }); });
  opacityLabel.append(opacity); row.append(opacityLabel);
  const fxLabel = document.createElement('label'); fxLabel.textContent = 'ANIMATION';
  const fx = document.createElement('select'); fx.setAttribute('aria-label', 'Object animation');
  for (const type of ['none', 'scroll-x', 'scroll-y', 'pulse']) fx.add(new Option(type.toUpperCase(), type));
  fx.value = object.animType;
  fx.addEventListener('change', () => { const value = fx.value; fx.blur(); edit(next => { next.objects[selection.index].animType = value; }); });
  fxLabel.append(fx); row.append(fxLabel);
  const textureLabel = document.createElement('label'); textureLabel.textContent = 'TEXTURE';
  const file = document.createElement('input');
  file.type = 'file'; file.accept = 'image/png,image/jpeg,image/webp,image/gif';
  file.setAttribute('aria-label', 'Object texture');
  file.addEventListener('change', async () => {
    const image = file.files[0]; if (!image) return;
    if (image.size > 4 * 1024 * 1024) { message('Texture exceeds 4 MB. Choose a smaller image.', true); return; }
    const key = currentKey, index = selection.index, before = track().objects[index];
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(image);
    }).catch(() => null);
    if (key !== currentKey || track().objects[index] !== before) { message('Selection changed; choose the texture again.'); return; }
    if (!data) { message('Could not read the image.', true); return; }
    file.blur(); edit(next => { next.objects[index].texture = data; });
  });
  textureLabel.append(file); row.append(textureLabel);
  const textureHelp = document.createElement('p'); textureHelp.className = 'field-help';
  textureHelp.textContent = 'Upload a PNG or WebP with a transparent background. Image transparency works at OPACITY 1; lower OPACITY fades the whole object.';
  row.append(textureHelp);
  if (object.texture) {
    const alphaLabel = document.createElement('label'); alphaLabel.textContent = 'TEXTURE ALPHA';
    const alpha = document.createElement('select'); alpha.setAttribute('aria-label', 'Texture transparency');
    alpha.add(new Option('Cutout · plants / silhouettes', 'cutout'));
    alpha.add(new Option('Soft · mist / glass', 'blend'));
    alpha.value = object.textureAlpha ?? 'cutout';
    alpha.addEventListener('change', () => { const value = alpha.value; alpha.blur(); edit(next => { next.objects[selection.index].textureAlpha = value; }); });
    alphaLabel.append(alpha); row.append(alphaLabel);
    const image = document.createElement('img'); image.src = object.texture; image.alt = 'Object texture'; image.className = 'texture-preview'; row.append(image);
    const clear = document.createElement('button'); clear.textContent = 'CLEAR TEXTURE';
    clear.addEventListener('click', () => edit(next => { next.objects[selection.index].texture = null; })); row.append(clear);
  }
  }
  function numeric(label,key,value,min,max,step,apply){
    const wrap=document.createElement('label');wrap.textContent=label;
    const input=document.createElement('input');Object.assign(input,{type:'number',value,min,max,step});input.setAttribute('aria-label',label);
    input.addEventListener('change',()=>{const v=input.valueAsNumber;input.blur();edit(next=>apply(next.objects[selection.index],v));});wrap.append(input);row.append(wrap);
  }
  if(object.type==='light'){
    numeric('LIGHT INTENSITY','lightIntensity',object.lightIntensity,0,10000,10,(o,v)=>o.lightIntensity=v);
    numeric('LIGHT RANGE','lightRange',object.lightRange,1,2000,5,(o,v)=>o.lightRange=v);
  }
  const motion=object.motion??{type:'none',axis:'y',period:20,distance:50};
  function motionSelect(label,key,values){
    const wrap=document.createElement('label');wrap.textContent=label;const select=document.createElement('select');select.setAttribute('aria-label',label);
    for(const v of values)select.add(new Option(v.toUpperCase(),v));select.value=motion[key];
    select.addEventListener('change',()=>{const value=select.value;select.blur();edit(next=>next.objects[selection.index].motion={...motion,[key]:value});});wrap.append(select);row.append(wrap);
  }
  motionSelect('MOVEMENT','type',['none','spin','shuttle','orbit']);motionSelect('MOVEMENT AXIS','axis',['x','y','z']);
  numeric('CYCLE SECONDS','period',motion.period,.2,600,1,(o,v)=>o.motion={...motion,period:v});
  numeric('TRAVEL / RADIUS (WORLD UNITS)','distance',motion.distance,0,5000,5,(o,v)=>o.motion={...motion,distance:v});
  if(object.type==='glb'){
    const wrap=document.createElement('label');wrap.textContent='PLAY FIRST GLB ANIMATION';const input=document.createElement('input');input.type='checkbox';input.checked=object.playClip??false;
    input.addEventListener('change',()=>{const checked=input.checked;edit(next=>next.objects[selection.index].playClip=checked);});wrap.append(input);row.append(wrap);
    numeric('GLB PLAYBACK SPEED','clipSpeed',object.clipSpeed??1,0,10,.1,(o,v)=>o.clipSpeed=v);
  }
  const motionHelp=document.createElement('p');motionHelp.className='field-help';motionHelp.textContent='Shuttle moves back and forth along a world axis. Orbit circles around the chosen axis, starting at the saved position. Rotation uses the saved orientation. GLB playback needs an animation clip in the file.';row.append(motionHelp);
  const remove = document.createElement('button'); remove.textContent = 'REMOVE OBJECT';
  remove.addEventListener('click', deleteSelectedObjects);
  row.append(remove); panel.append(row);
  const clone = document.createElement('button'); clone.textContent = 'CLONE OBJECT';
  clone.id = 'clone-object-button'; clone.disabled = track().objects.length >= 1024;
  clone.addEventListener('click', cloneSelectedObject); row.prepend(clone);
}

function cloneSelectedObject() {
  if (selection.kind !== 'object' || track().objects.length >= 1024) return;
  const copy = structuredClone(track().objects[selection.index]);
  copy.id = crypto.randomUUID();
  const offset=Math.min(100,Math.max(2,copy.scale[0]+1));
  copy.position[0] += copy.position[0]+offset<=10000?offset:-offset;
  edit(next => { next.objects.push(copy); });
  chooseSelection({kind:'object',index:track().objects.length - 1}, {focus:true});
}

function copySelectedObjects() {
  const indexes = selectedIndexes();
  if (!indexes.length) return;
  objectClipboard = copySceneObjects(track().objects, indexes);
  render();
  message(`Copied ${objectClipboard.length} object(s). Paste will keep their original coordinates.`);
}

function pasteSelectedObjects() {
  if (!objectClipboard.length) return;
  let additions;
  try {
    additions = createPastedObjects(track().objects, objectClipboard, () => crypto.randomUUID());
    serializeTrack({...track(), objects:[...track().objects, ...additions]});
  } catch (error) { message(error.message, true); return; }
  const start = track().objects.length;
  if (!edit(next => { next.objects.push(...additions); })) return;
  selectedObjects = new Set(additions.map((_, i) => start + i));
  selection = {kind:'object',index:start};
  render(); view.select(selection, selectedIndexes());
  message(`Pasted ${additions.length} object(s) at their exact copied positions. Save when ready.`);
}

function deleteSelectedObjects() {
  const indexes = selectedIndexes();
  if (!indexes.length) return;
  if (!edit(next => { next.objects = withoutSceneObjects(next.objects, indexes); })) return;
  selectedObjects.clear();
  selection = {kind:'point',index:0};
  render(); view.select(selection, []);
  message(`Deleted ${indexes.length} object(s). Ctrl+Z to undo.`);
}

function activate(key) {
  if (flyEnabled) toggleFly(false);
  currentKey = key;
  selectedObjects.clear();
  selection = { kind: 'point', index: 0 };
  render(); view.setTrack(track(), selection, []); view.fit();
  message('Drafts are kept while switching tracks. Save or download before closing the editor.');
}
$('#track-select').addEventListener('change', event => activate(event.target.value));
$('#object-select').addEventListener('change', event => {
  if (event.target.value === '') return;
  chooseSelection({kind:'object', index:Number(event.target.value)}, {focus:true});
});
$('#track-name').addEventListener('change', event => { const value = event.target.value; event.target.blur(); edit(next => { next.name = value; }); });
$('#magnetic-input').addEventListener('change', event => edit(next => { next.magnetic = event.target.checked; }));
$('#point-bank').addEventListener('change', event => {
  const value = event.target.valueAsNumber; event.target.blur();
  edit(next => { next.centerline[selection.index][3] = value; });
});
$('#add-gap-button').addEventListener('click', () => {
  const curve = createTrackCurve(track());
  const start = Math.max(0.03, Math.min(0.87, progressAtControlPoint(curve, selection.index)));
  edit(next => { next.gaps ??= []; next.gaps.push({ start, end: start + 0.025 }); });
});
for (const [axis, name] of ['x', 'y', 'z'].entries()) {
  $(`#point-${name}`).addEventListener('change', event => {
    const value = event.target.valueAsNumber; event.target.blur();
    edit(next => { pointCollection(next)[selection.index][axis] = value; });
  });
}
for (const [selector, key] of [['#width-input', 'width'], ['#scale-input', 'horizontalScale']]) {
  $(selector).addEventListener('input', event => edit(next => { next[key] = event.target.valueAsNumber; }, false));
  $(selector).addEventListener('change', () => { current().history.push(track()); render(); });
}
$('#add-point-btn').addEventListener('click', () => {
  const index = selection.index;
  edit(next => {
    const points=pointCollection(next);
    const a = points[index];
    let b = points[(index + 1) % points.length];
    if(selection.kind==='branch' && index===points.length-1){const p=getTrackFrame(createTrackCurve(next),next.branches[selection.branch].end).center;b=[p.x/next.horizontalScale,p.y,p.z/next.horizontalScale];}
    const point = a.slice(0, 3).map((n, axis) => (n + b[axis]) / 2);
    if (a.length === 4) point.push(a[3]);
    points.splice(index + 1, 0, point);
    if(selection.kind === 'point' && next.pointWidths) next.pointWidths.splice(index+1,0,next.pointWidths[index]);
  });
  selectedObjects.clear(); selection.index = index + 1; render(); view.select(selection, []);
});
$('#del-point-btn').addEventListener('click', () => edit(next => { pointCollection(next).splice(selection.index, 1); if(selection.kind==='point') next.pointWidths?.splice(selection.index,1); }));
for (const button of document.querySelectorAll('[data-primitive]')) {
  button.addEventListener('click', () => {
    const position = track().centerline[selection.kind === 'point' ? selection.index : 0].slice(0, 3);
    position[1] += 2;
    edit(next => next.objects.push({ id: crypto.randomUUID(), type: button.dataset.primitive, position, scale: button.dataset.primitive==='light'?[1,1,1]:[5,5,5] }));
    chooseSelection({kind:'object', index:track().objects.length - 1});
  });
}
function historyAction(action) {
  current().track = current().history[action]();
  selectedObjects.clear();
  selection = {kind:'point',index:0};
  render(); view.setTrack(track(), selection, []);
  message(action === 'undo' ? 'Edit undone.' : 'Edit restored.');
}
$('#undo-button').addEventListener('click', () => historyAction('undo'));
$('#redo-button').addEventListener('click', () => historyAction('redo'));
window.addEventListener('keydown', event => {
  if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  const modifier = event.ctrlKey || event.metaKey;
  if ((event.code === 'Delete' || event.code === 'Backspace') && !modifier && selectedIndexes().length) {
    event.preventDefault(); deleteSelectedObjects(); return;
  }
  if (!modifier) return;
  if (event.code === 'KeyC' && selectedIndexes().length) { event.preventDefault(); copySelectedObjects(); return; }
  if (event.code === 'KeyP' && objectClipboard.length) { event.preventDefault(); pasteSelectedObjects(); return; }
  if (event.code === 'KeyD' && selection.kind === 'object') { event.preventDefault(); cloneSelectedObject(); return; }
  if (event.code === 'KeyZ' || event.code === 'KeyY') {
    event.preventDefault(); historyAction(event.shiftKey || event.code === 'KeyY' ? 'redo' : 'undo');
  }
});
$('#fit-button').addEventListener('click', () => { if (flyEnabled) toggleFly(false); view.fit(); });
$('#top-button').addEventListener('click', () => { if (flyEnabled) toggleFly(false); view.fit(true); });
$('#side-button').addEventListener('click', () => { if (flyEnabled) toggleFly(false); view.fit('side'); });
$('#focus-button').addEventListener('click', () => { if (flyEnabled) toggleFly(false); view.focus(); });
$('#copy-objects-button').addEventListener('click', copySelectedObjects);
$('#paste-objects-button').addEventListener('click', pasteSelectedObjects);
$('#delete-objects-button').addEventListener('click', deleteSelectedObjects);
function toggleFly(enabled = !flyEnabled) {
  flyEnabled = view.setFlyMode(enabled);
  const button = $('#fly-mode-button');
  button.textContent = `FLY MODE: ${flyEnabled ? 'ON' : 'OFF'}`;
  button.setAttribute('aria-pressed', String(flyEnabled));
  button.classList.toggle('active', flyEnabled);
  $('#editor-canvas').classList.toggle('flying', flyEnabled);
}
$('#fly-mode-button').addEventListener('click', () => toggleFly());
let saveInProgress = false;
async function save() {
  if (saveInProgress) return false;
  saveInProgress = true;
  const key = currentKey;
  const snapshot = structuredClone(track());
  try {
    const normalized = await persistTrack(localStorage, key, snapshot);
    const draft = drafts.get(key);
    draft.saved = JSON.stringify(normalized);
    render();
    message('Saved to IndexedDB in this browser. The track is now available in the race selector.');
    return true;
  } catch (error) { message(error.message, true); return false; }
  finally { saveInProgress = false; }
}
$('#save-button').addEventListener('click', () => { void save(); });
$('#test-button').addEventListener('click', async () => {
  // Open synchronously to avoid popup blockers while IndexedDB writes asynchronously.
  const tab = window.open('about:blank', '_blank');
  if (await save()) {
    if (tab) { tab.opener = null; tab.location.href = `./?track=${encodeURIComponent(currentKey)}&editor=1`; }
    else window.location.href = `./?track=${encodeURIComponent(currentKey)}&editor=1`;
  } else tab?.close();
});
$('#reset-button').addEventListener('click', async () => {
  const builtIn = BUILTIN_TRACKS[currentKey];
  if (!window.confirm(builtIn ? 'Restore this built-in track and discard its saved override and draft? Other tracks are kept.' : 'Remove this custom track and its draft? Download it first if you want to keep a copy.')) return;
  try {
    await removePersistedTrack(localStorage, currentKey);
    if (builtIn) {
      const restored = normalizeTrack(builtIn.data);
      drafts.set(currentKey, { track: restored, saved: JSON.stringify(restored), history: createHistory(restored) });
      activate(currentKey);
    } else { drafts.delete(currentKey); activate('track1'); }
    message('Selected track reset. Other tracks were kept.');
  } catch (error) { message(error.message, true); }
});
$('#copy-button').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(serializeTrack(track())); message('Track JSON copied.'); }
  catch (error) { message(`Could not copy: ${error.message} Use Download instead.`, true); }
});
$('#download-button').addEventListener('click', () => {
  try {
    const url = URL.createObjectURL(new Blob([serializeTrack(track())], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url;
    link.download = `${track().id.replace(/[^a-z0-9_-]/gi, '-').slice(0, 80) || 'track'}.json`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    message('Versioned track JSON downloaded. Embedded textures travel with the file.');
  } catch (error) { message(error.message, true); }
});
$('#import-button').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0]; event.target.value = ''; if (!file) return;
  try {
    if (file.size > MAX_TRACK_BYTES) throw new Error(`File exceeds ${MAX_TRACK_BYTES / (1024 * 1024)} MB.`);
    const value = parseTrack(await file.text());
    const key = `custom-${crypto.randomUUID()}`;
    drafts.set(key, { track: value, saved: null, history: createHistory(value) });
    activate(key);
    message('Imported as a new draft. Existing tracks are kept. Save to Game to make this track playable.');
  } catch (error) { message(`Import failed — ${error.message}`, true); }
});
window.addEventListener('beforeunload', event => {
  if ([...drafts.values()].some(isDirty)) { event.preventDefault(); event.returnValue = ''; }
});
render(); view.setTrack(track(), selection); view.fit();
if (library.issues.length) message(library.issues.join(' '), true);

function authoredPads(next) {
  if(next.pads) return;
  const assets=createTrack(next);
  next.pads=assets.boostPads.filter(p=>p.d/assets.length>0.001 && p.d/assets.length<0.999).map(p=>({id:crypto.randomUUID(),type:'boost',progress:p.d/assets.length,offset:p.offset,...(p.routeId?{routeId:p.routeId}:{})}));
  disposeTrackGroup(assets.group);
}
$('#point-width').addEventListener('change',event=>{
  const value=event.target.value===''?null:event.target.valueAsNumber; event.target.blur();
  edit(next=>{next.pointWidths??=next.centerline.map(()=>null);next.pointWidths[selection.index]=value;});
});
$('#road-style').addEventListener('change',event=>{const value=event.target.value;edit(next=>{next.roadStyle=value;});});
for(const [selector,key] of [['#track-music','music'],['#track-alt-music','alternateMusic'],
  ['#track-sky','sky'],['#road-texture','roadTexture']]){
  $(selector).addEventListener('change',event=>{
    const value=event.target.value;
    edit(next=>{if(value)next[key]=value;else delete next[key];});
  });
}
$('#road-material').addEventListener('change',event=>{
  const value=event.target.value;
  edit(next=>{if(value==='default')delete next.roadMaterial;else next.roadMaterial=value;});
});
for(const side of ['left','right']) {
  $('#rail-'+side).addEventListener('change',event=>{
    const color=event.target.value;
    edit(next=>{next.railColors??={};next.railColors[side]=color;});
  });
}
$('#reset-rail-colors').addEventListener('click',()=>edit(next=>{delete next.railColors;}));
$('#cpu-multiplier').addEventListener('input',event=>{
  $('#cpu-multiplier-value').textContent=Number(event.target.value).toFixed(2);
});
$('#cpu-multiplier').addEventListener('change',event=>{
  const scale=Number(event.target.value);
  edit(next=>{if(scale===1)delete next.cpuMultiplier;else next.cpuMultiplier=scale;});
});
for(const type of ['boost','brake','weapon']) $('#add-'+type).addEventListener('click',()=>{
  const curve=createTrackCurve(track());
  const branch=selection.kind==='branch'?curve.track.branches[selection.branch]:null;
  const progress=branch?(branch.start+branch.end)/2:Math.max(0.01,Math.min(0.99,progressAtControlPoint(curve,selection.kind==='point'?selection.index:0)));
  edit(next=>{authoredPads(next);next.pads.push({id:crypto.randomUUID(),type,progress,offset:0,...(type==='weapon'?{weapon:'rocket'}:{}),...(branch?{routeId:branch.id}:{})});});
});
$('#auto-pads').addEventListener('click',()=>edit(next=>{delete next.pads;}));
$('#suggest-pads').addEventListener('click',()=>edit(next=>{
  next.pads??=[];
  next.pads.push(...suggestBoostPads(next).map(p=>({...p,id:crypto.randomUUID()})));
}));
function renderPads() {
  const list=$('#pad-list'); if(list.contains(document.activeElement)) return;
  list.replaceChildren();
  if(!track().pads) {list.textContent='Automatic boost and Combat weapon placement';return;}
  if(!track().pads.length) {list.textContent='No pads. Add one or suggest boosts.';return;}
  track().pads.forEach((pad,index)=>{
    const row=document.createElement('div'); row.className='gap-row';
    const type=document.createElement('select'); type.setAttribute('aria-label','Pad '+(index+1)+' type');
    for(const value of ['boost','brake','weapon']) type.add(new Option(value.toUpperCase(),value)); type.value=pad.type;
    type.onchange=()=>{const value=type.value;type.blur();edit(next=>{next.pads[index].type=value;if(value==='weapon')next.pads[index].weapon='rocket';else delete next.pads[index].weapon;});}; row.append(type);
    if(pad.type==='weapon') {
      const weapon=document.createElement('select');weapon.setAttribute('aria-label','Pad '+(index+1)+' weapon');
      for(const value of ['rocket','homing','minigun'])weapon.add(new Option(value.toUpperCase(),value));weapon.value=pad.weapon;
      weapon.onchange=()=>{const value=weapon.value;weapon.blur();edit(next=>{next.pads[index].weapon=value;});};row.append(weapon);
    }
    for(const key of ['progress','offset']) {
      const label=document.createElement('label');label.textContent=key==='progress'?'LAP %':'OFFSET';
      const input=document.createElement('input'); Object.assign(input,{type:'number',step:0.1,value:key==='progress'?(pad.progress*100).toFixed(3):pad.offset});
      input.setAttribute('aria-label','Pad '+(index+1)+' '+key);
      input.onchange=()=>{const value=input.valueAsNumber/(key==='progress'?100:1);input.blur();edit(next=>{next.pads[index][key]=value;});};label.append(input);row.append(label);
    }
    const route=document.createElement('select');route.setAttribute('aria-label','Pad '+(index+1)+' route');route.add(new Option('Main road',''));
    for(const b of track().branches??[])route.add(new Option(b.name,b.id));route.value=pad.routeId??'';
    route.onchange=()=>{const value=route.value;route.blur();edit(next=>{const p=next.pads[index];if(value){const b=next.branches.find(b=>b.id===value);p.routeId=value;p.progress=(b.start+b.end)/2;p.offset=0;}else delete p.routeId;});};row.append(route);
    const focus=document.createElement('button');focus.textContent='FOCUS';focus.onclick=()=>{if(flyEnabled)toggleFly(false);view.focusPad(pad);};row.append(focus);
    const remove=document.createElement('button');remove.textContent='REMOVE';remove.onclick=()=>edit(next=>{next.pads.splice(index,1);});row.append(remove);
    list.append(row);
  });
}

async function addGlb(source) {
  const key=currentKey, draft=track();
  const model=await loadGlb(source);disposeTrackGroup(model);
  if(key!==currentKey || draft!==track())throw new Error('Draft changed during import. Please try again.');
  const position=[...track().centerline[0].slice(0,3)];
  if(selection.kind==='point')position.splice(0,3,...track().centerline[selection.index].slice(0,3));
  const object={id:crypto.randomUUID(),type:'glb',model:source,position,rotation:[0,0,0],scale:[1,1,1]};
  // Verify portable export budget before changing the draft.
  serializeTrack({...track(),objects:[...track().objects,object]});
  edit(next=>next.objects.push(object));
  chooseSelection({kind:'object',index:track().objects.length-1}, {focus:true});
}

// Cathedral kit: paths point to GLBs already present under public/models.
// A 114 MB GLB becomes a short string in the track JSON rather than ~152 MB
// of embedded base64. Both one-at-a-time and six-at-once staging are supported.
const cathedralSelector = $('#cathedral-model');
cathedralSelector.replaceChildren(...CATHEDRAL_KIT.map((part, index) => new Option(part.label, String(index))));
async function stageCathedral(parts) {
  const currentModels = new Set(track().objects.filter(obj => obj.type === 'glb').map(obj => obj.model));
  const missing = parts.filter(part => !currentModels.has(part.model));
  if (!missing.length) { message('These Cathedral GLBs are already in the track. Select them under SCENERY to reposition or clone.'); return; }

  const requestedKey = currentKey;
  const initialDraft = track();
  const anchor = selection.kind === 'object'
    ? track().objects[selection.index]?.position
    : selection.kind === 'branch'
      ? track().branches[selection.branch].points[selection.index]
      : track().centerline[selection.index];
  if (!anchor) { message('Select a control point first.', true); return; }
  const existing = CATHEDRAL_KIT.filter(part => currentModels.has(part.model)).length;

  try {
    // Check file availability without downloading the huge meshes twice.
    await Promise.all(missing.map(async part => {
      const response = await fetch(part.model, { method: 'HEAD' });
      if (!response.ok) throw new Error(`${part.label}: GLB not found at ${part.model} (${response.status})`);
    }));
    if (requestedKey !== currentKey || initialDraft !== track()) throw new Error('The draft changed during model checks; retry the import.');
    const additions = createCathedralObjects(missing, anchor, track().horizontalScale, existing).map(obj => ({
      ...obj, id: crypto.randomUUID()
    }));
    // Validate the portable file before changing the draft. GLB data stays on disk.
    serializeTrack({ ...track(), objects: [...track().objects, ...additions] });
    const firstIndex = track().objects.length;
    edit(next => { next.objects.push(...additions); });
    chooseSelection({kind:'object',index:firstIndex});
    message(`Staged ${additions.length} Cathedral GLB reference(s) by the selected point. Move/scale each piece under SCENERY, then Save to Game. Models remain in public/models.`);
  } catch (error) { message(`Cathedral import failed: ${error.message}`, true); }
}
$('#add-cathedral-part').addEventListener('click', () => {
  const part = CATHEDRAL_KIT[Number(cathedralSelector.value)];
  if (part) void stageCathedral([part]);
});
$('#add-cathedral-all').addEventListener('click', () => {
  if (!window.confirm('Stage all six Cathedral models? Two files are 80 MB and 114 MB; loading both into the editor may be demanding. The existing track will not be overwritten until you press Save to Game.')) return;
  void stageCathedral(CATHEDRAL_KIT);
});

$('#add-glb').onclick=()=>$('#glb-file').click();
$('#glb-file').onchange=async event=>{
 const file=event.target.files[0];event.target.value='';if(!file)return;
 try {
  if(file.size>8*1024*1024)throw new Error('GLB exceeds 8 MB. Use a public/models path for larger models.');
  validateGlb(await file.arrayBuffer());
  const source=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve('data:model/gltf-binary;base64,'+r.result.split(',')[1]);r.onerror=reject;r.readAsDataURL(file);});
  await addGlb(source);
 }catch(error){message(error.message,true);}
};
$('#add-glb-path').onclick=async()=>{
 try {
  const source=$('#glb-path').value.trim();
  normalizeTrack({...track(),objects:[{type:'glb',model:source,position:[0,0,0]}]});
  await addGlb(source);
 }catch(error){message(error.message,true);}
};
