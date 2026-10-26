import { BUILTIN_TRACKS, readTrackLibrary, saveTrack, resetTrack } from './track-library.js';
import { normalizeTrack, parseTrack, serializeTrack, MAX_TRACK_BYTES } from './track-format.js';
import { createHistory } from './editor-history.js';
import { createEditorView } from './editor-view.js';
import { createTrackCurve, progressAtControlPoint } from './track-path.js';
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
  onSelect(value) { selection = value; render(); view.select(selection); },
  onMove(value, position) {
    edit(next => {
      if (value.kind === 'point') next.centerline[value.index].splice(0, 3, ...position);
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
  const count = selection.kind === 'point' ? track().centerline.length : track().objects.length;
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
  const point = value.centerline[pointIndex];
  setValue('#point-bank', point[3] ?? 0);
  $('#point-bank').disabled = selection.kind !== 'point' || !value.magnetic;
  $('#selected-point').textContent = selection.kind === 'point' ? String(pointIndex + 1).padStart(2, '0') : 'OBJECT SELECTED';
  for (const [axis, name] of ['x', 'y', 'z'].entries()) {
    setValue(`#point-${name}`, point[axis]);
    $(`#point-${name}`).disabled = selection.kind !== 'point';
  }
  $('#add-point-btn').disabled = selection.kind !== 'point' || value.centerline.length >= 512;
  $('#del-point-btn').disabled = selection.kind !== 'point' || value.centerline.length <= 4;
  renderObjectInspector();
  renderGaps();
}

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
  const remove = document.createElement('button'); remove.textContent = 'REMOVE OBJECT';
  remove.addEventListener('click', () => {
    const index = selection.index;
    selection = { kind: 'point', index: 0 };
    edit(next => { next.objects.splice(index, 1); });
  });
  row.append(remove); panel.append(row);
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
    edit(next => { next.centerline[selection.index][axis] = value; });
  });
}
for (const [selector, key] of [['#width-input', 'width'], ['#scale-input', 'horizontalScale']]) {
  $(selector).addEventListener('input', event => edit(next => { next[key] = event.target.valueAsNumber; }, false));
  $(selector).addEventListener('change', () => { current().history.push(track()); render(); });
}
$('#add-point-btn').addEventListener('click', () => {
  const index = selection.index;
  edit(next => {
    const a = next.centerline[index], b = next.centerline[(index + 1) % next.centerline.length];
    const point = a.slice(0, 3).map((n, axis) => (n + b[axis]) / 2);
    if (a.length === 4) point.push(a[3]);
    next.centerline.splice(index + 1, 0, point);
  });
  selection.index = index + 1; render(); view.select(selection);
});
$('#del-point-btn').addEventListener('click', () => edit(next => { next.centerline.splice(selection.index, 1); }));
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
