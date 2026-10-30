import { loadGlb, validateGlb } from './glb-scenery.js';
import { suggestBoostPads } from './track-pads.js';
import { createTrack, disposeTrackGroup } from './track.js';
import { BUILTIN_TRACKS, readTrackLibrary, saveTrack, resetTrack } from './track-library.js';
import { normalizeTrack, parseTrack, serializeTrack, MAX_TRACK_BYTES } from './track-format.js';
import { createHistory } from './editor-history.js';
import { createEditorView } from './editor-view.js';
import { createTrackCurve, getTrackFrame, progressAtControlPoint } from './track-path.js';
import './editor.css';

const $ = selector => document.querySelector(selector);
const library = readTrackLibrary(localStorage);
const drafts = new Map();
for (const [key, entry] of Object.entries(library.entries)) {
  drafts.set(key, { track: entry.data, saved: JSON.stringify(entry.data), history: createHistory(entry.data) });
}
const requestedKey = new URLSearchParams(location.search).get('track');
let currentKey = drafts.has(requestedKey) ? requestedKey : 'track1';
let selection = { kind: 'point', index: 0 };
const current = () => drafts.get(currentKey);
const track = () => current().track;
const isDirty = draft => draft.saved !== JSON.stringify(draft.track);
const status = $('#status');
function message(text, error = false) { status.textContent = text; status.classList.toggle('error', error); }
const view = createEditorView($('#editor-canvas'), {
  onError(error) { message(error, true); },
  onSelect(value) { selection = value; render(); view.select(selection); },
  onMove(value, position) {
    edit(next => {
      if (value.kind === 'point') next.centerline[value.index].splice(0, 3, ...position);
      else if (value.kind === 'branch') next.branches[value.branch].points[value.index] = position;
      else next.objects[value.index].position = position;
    }, false);
  },
  onCommit() { current().history.push(track()); render(); view.setTrack(track(), selection); },
});

function edit(change, commit = true) {
  try {
    const next = structuredClone(track());
    change(next);
    current().track = normalizeTrack(next);
    if (commit) current().history.push(track());
    render();
    view.setTrack(track(), selection);
    message('Unsaved changes. Save to Game or Save & Test when ready.');
  } catch (error) {
    render();
    message(error.message, true);
  }
}

function setValue(selector, value) {
  const input = $(selector);
  if (document.activeElement !== input) input.value = value;
}
function clampSelection() {
  if (selection.kind === 'branch' && !track().branches?.[selection.branch]) selection = {kind:'point',index:0};
  const count = selection.kind === 'point' ? track().centerline.length : selection.kind === 'branch' ? track().branches[selection.branch].points.length : track().objects.length;
  if (!count) selection = { kind: 'point', index: 0 };
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
  $('#selected-point').textContent = selection.kind === 'point' ? String(pointIndex + 1).padStart(2, '0') : selection.kind === 'branch' ? `ROUTE POINT ${selection.index+1}` : 'OBJECT SELECTED';
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
  remove.addEventListener('click',()=>{const index=selection.branch;selection={kind:'point',index:0};edit(next=>{ const id=next.branches[index].id; next.branches.splice(index,1); if(next.pads) next.pads=next.pads.filter(p=>p.routeId!==id); });});panel.append(remove);
}

$('#branch-select').addEventListener('change',event=>{
  selection=event.target.value===''?{kind:'point',index:0}:{kind:'branch',branch:Number(event.target.value),index:0};
  render();view.select(selection);view.focus();
});
$('#add-branch-button').addEventListener('click',()=>{
  const curve=createTrackCurve(track()), start=Math.max(0.08,Math.min(0.72,progressAtControlPoint(curve,selection.index))), end=start+0.16;
  const points=[0.25,0.5,0.75].map(u=>{
    const f=getTrackFrame(curve,start+(end-start)*u), p=f.center.addScaledVector(f.right,track().width*2*Math.sin(u*Math.PI));
    return [p.x/track().horizontalScale,p.y,p.z/track().horizontalScale];
  });
  const id=crypto.randomUUID();edit(next=>{next.branches??=[];next.branches.push({id,name:'Alternative route',start,end,side:1,width:Math.max(4,next.width*0.5),points});});
  const index=track().branches?.findIndex(b=>b.id===id)??-1;
  if(index>=0){selection={kind:'branch',branch:index,index:0};render();view.select(selection);view.fit();}
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
  select.replaceChildren(new Option('Select scenery…', ''), ...track().objects.map((object, i) => new Option(`${i + 1}. ${object.type.toUpperCase()}`, String(i))));
  select.value = selection.kind === 'object' ? String(selection.index) : '';
  const panel = $('#primitive-list');
  // Keep a focused numeric control alive while a value is being entered.
  if (panel.contains(document.activeElement)) return;
  panel.replaceChildren();
  if (selection.kind !== 'object') return;
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
  const defaultColor = object.texture ? 0xffffff : object.type === 'cylinder' ? 0xffd166 : object.type === 'sphere' ? 0xb58cff : 0xff7aa8;
  for (const [key, title, fallback] of [['color','SURFACE COLOR',defaultColor],['emissive','GLOW COLOR',0x000000]]) {
    const label = document.createElement('label'); label.textContent = title;
    const input = document.createElement('input'); input.type = 'color'; input.value = hex(object[key] ?? fallback);
    input.setAttribute('aria-label',title); input.id = 'object-'+key;
    input.addEventListener('change',()=>{const value=input.value; input.blur(); edit(next=>{next.objects[selection.index][key]=value;});});
    label.append(input); colors.append(label);
  }
  const presets = document.createElement('div'); presets.className = 'neon-presets';
  for(const [name,color] of [['Cyan','#00e5ff'],['Pink','#ff269e'],['Lime','#a3ff12'],['Amber','#ffb020'],['Violet','#9c55ff']]) {
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
  if (object.texture) {
    const image = document.createElement('img'); image.src = object.texture; image.alt = 'Object texture'; image.className = 'texture-preview'; row.append(image);
    const clear = document.createElement('button'); clear.textContent = 'CLEAR TEXTURE';
    clear.addEventListener('click', () => edit(next => { next.objects[selection.index].texture = null; })); row.append(clear);
  }
  }
  const remove = document.createElement('button'); remove.textContent = 'REMOVE OBJECT';
  remove.addEventListener('click', () => {
    const index = selection.index;
    selection = { kind: 'point', index: 0 };
    edit(next => { next.objects.splice(index, 1); });
  });
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
  selection = { kind: 'object', index: track().objects.length - 1 };
  render(); view.select(selection); view.focus();
}

function activate(key) {
  currentKey = key;
  selection = { kind: 'point', index: 0 };
  render(); view.setTrack(track(), selection); view.fit();
  message('Drafts are kept while switching tracks. Save or download before closing the editor.');
}
$('#track-select').addEventListener('change', event => activate(event.target.value));
$('#object-select').addEventListener('change', event => {
  if (event.target.value === '') return;
  selection = { kind: 'object', index: Number(event.target.value) };
  render(); view.select(selection); view.focus();
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
  selection.index = index + 1; render(); view.select(selection);
});
$('#del-point-btn').addEventListener('click', () => edit(next => { pointCollection(next).splice(selection.index, 1); if(selection.kind==='point') next.pointWidths?.splice(selection.index,1); }));
for (const button of document.querySelectorAll('[data-primitive]')) {
  button.addEventListener('click', () => {
    const position = track().centerline[selection.kind === 'point' ? selection.index : 0].slice(0, 3);
    position[1] += 2;
    edit(next => next.objects.push({ id: crypto.randomUUID(), type: button.dataset.primitive, position, scale: [5, 5, 5] }));
    selection = { kind: 'object', index: track().objects.length - 1 };
    render(); view.select(selection);
  });
}
function historyAction(action) {
  current().track = current().history[action]();
  render(); view.setTrack(track(), selection);
  message(action === 'undo' ? 'Edit undone.' : 'Edit restored.');
}
$('#undo-button').addEventListener('click', () => historyAction('undo'));
$('#redo-button').addEventListener('click', () => historyAction('redo'));
window.addEventListener('keydown', event => {
  if (event.target.matches('input, textarea, select') || !(event.ctrlKey || event.metaKey)) return;
  if (event.code === 'KeyD' && selection.kind === 'object') { event.preventDefault(); cloneSelectedObject(); return; }
  if (event.code === 'KeyZ' || event.code === 'KeyY') {
    event.preventDefault(); historyAction(event.shiftKey || event.code === 'KeyY' ? 'redo' : 'undo');
  }
});
$('#fit-button').addEventListener('click', () => view.fit());
$('#top-button').addEventListener('click', () => view.fit(true));
$('#side-button').addEventListener('click', () => view.fit('side'));
$('#focus-button').addEventListener('click', () => view.focus());
function save() {
  try {
    const normalized = saveTrack(localStorage, currentKey, track());
    current().track = normalized; current().saved = JSON.stringify(normalized);
    render(); message('Saved to this browser. The track is now available in the race selector.');
    return true;
  } catch (error) { message(error.message, true); return false; }
}
$('#save-button').addEventListener('click', save);
$('#test-button').addEventListener('click', () => {
  if (save()) window.open(`./?track=${encodeURIComponent(currentKey)}&editor=1`, '_blank', 'noopener');
});
$('#reset-button').addEventListener('click', () => {
  const builtIn = BUILTIN_TRACKS[currentKey];
  if (!window.confirm(builtIn ? 'Restore this built-in track and discard its saved override and draft? Other tracks are kept.' : 'Remove this custom track and its draft? Download it first if you want to keep a copy.')) return;
  try {
    resetTrack(localStorage, currentKey);
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
    if (file.size > MAX_TRACK_BYTES) throw new Error('File exceeds 16 MB.');
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
    const focus=document.createElement('button');focus.textContent='FOCUS';focus.onclick=()=>view.focusPad(pad);row.append(focus);
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
  selection={kind:'object',index:track().objects.length-1};render();view.select(selection);view.focus();
}
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
