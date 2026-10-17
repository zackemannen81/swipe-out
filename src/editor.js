import { NEON_CAUSEWAY, SYNTHETIC_DREAMS, DIGITAL_HORIZON, MOMMY_IM_SCARED } from './track-data.js';
import './editor.css';

const STORAGE_KEY = 'swipe-out-track-definitions';
const TRACKS = { track1: NEON_CAUSEWAY, track2: SYNTHETIC_DREAMS, track3: DIGITAL_HORIZON, track4: MOMMY_IM_SCARED };
const canvas = document.querySelector('#editor-canvas');
const context = canvas.getContext('2d');
const savedTracks = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } })();
let currentTrackId = document.querySelector('#track-select').value;
function loadTrack(id) { return savedTracks[id] ? structuredClone(savedTracks[id]) : { ...structuredClone(TRACKS[id]), objects: [] }; }
let track = loadTrack(currentTrackId);
const widthInput = document.querySelector('#width-input');
const scaleInput = document.querySelector('#scale-input');
const pointX = document.querySelector('#point-x');
const pointY = document.querySelector('#point-y');
const pointZ = document.querySelector('#point-z');
const status = document.querySelector('#status');
let selected = 0;
let selectedObject = -1;
let dragging = false;
let draggingObject = false;
let view = { scale: 1, cx: 0, cy: 0 };

function markChanged() {
  document.querySelector('#save-state').textContent = 'UNSAVED';
  status.textContent = 'Unsaved changes for this track. Save to use them in the race.';
  draw();
  syncPointFields();
  renderObjects();
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  draw();
}

function draw() {
  const { width, height } = canvas.getBoundingClientRect();
  context.clearRect(0, 0, width, height);
  const points = track.centerline;
  const minX = Math.min(...points.map((point) => point[0]));
  const maxX = Math.max(...points.map((point) => point[0]));
  const minZ = Math.min(...points.map((point) => point[2]));
  const maxZ = Math.max(...points.map((point) => point[2]));
  const padding = 58;

  view.scale = Math.min(
    (width - padding * 2) / Math.max(maxX - minX, 1),
    (height - padding * 2) / Math.max(maxZ - minZ, 1)
  );
  view.cx = (width - (minX + maxX) * view.scale) / 2;
  view.cy = (height - (minZ + maxZ) * view.scale) / 2;

  const screen = ([x, , z]) => [view.cx + x * view.scale, view.cy + z * view.scale];

  // Bakgrundsrutnät
  context.strokeStyle = 'rgba(112, 157, 174, .11)';
  context.lineWidth = 1;
  for (let x = 0; x < width; x += 32) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); }
  for (let y = 0; y < height; y += 32) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }

  // Bana (Väg)
  context.beginPath();
  points.forEach((point, index) => {
    const [x, y] = screen(point);
    if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
  });
  context.closePath();
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.strokeStyle = 'rgba(25, 39, 54, .9)';
  context.lineWidth = Math.max(3, track.width * view.scale);
  context.stroke();
  context.strokeStyle = '#56e6dc';
  context.lineWidth = 2;
  context.stroke();

  // Banans kontrollpunkter
  points.forEach((point, index) => {
    const [x, y] = screen(point);
    context.beginPath();
    context.arc(x, y, index === selected ? 7 : 4, 0, Math.PI * 2);
    context.fillStyle = index === selected ? '#ff5f98' : '#d8fff9';
    context.fill();
    context.strokeStyle = '#09121c';
    context.lineWidth = 2;
    context.stroke();
  });

  // 3D-PRIMITIVER (Enkel, korrekt loop)
  track.objects.forEach((object, index) => {
    const [x, y] = screen([object.position[0], 0, object.position[2]]);

    // Beräkna storlek i canvas-pixlar baserat på objektets scale
    const widthPx = (object.scale?.[0] ?? 1) * view.scale;
    const heightPx = (object.scale?.[2] ?? 1) * view.scale;
    const rotY = object.rotation ? (object.rotation[1] * Math.PI) / 180 : 0;
    const isSelected = selectedObject === index;

    context.save();
    context.translate(x, y);
    context.rotate(rotY);

    context.beginPath();
    if (object.type === 'box') {
      const w = Math.max(widthPx, 12); // Minst 12px så den går att klicka
      const h = Math.max(heightPx, 12);
      context.rect(-w / 2, -h / 2, w, h);
    } else {
      const rx = Math.max(widthPx / 2, 6); // Minst 6px radie
      const ry = Math.max(heightPx / 2, 6);
      context.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    }

    context.fillStyle = object.type === 'cylinder' ? '#ffd166' : object.type === 'sphere' ? '#b58cff' : '#ff7aa8';
    context.fill();
    context.strokeStyle = isSelected ? '#ffffff' : '#09121c';
    context.lineWidth = isSelected ? 3 : 2;
    context.stroke();

    context.restore();

    // Rita nummerlapp i mitten
    context.fillStyle = '#09121c';
    context.font = '9px "DM Mono", monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(String(index + 1), x, y);
  });

  document.querySelector('#point-count').textContent = `${points.length} POINTS · ${track.objects.length} OBJECTS`;
  document.querySelector('#width-value').textContent = Number(track.width).toFixed(2);
  document.querySelector('#scale-value').textContent = Number(track.horizontalScale).toFixed(2);
}
function syncPointFields() {
  const point = track.centerline[selected];
  document.querySelector('#selected-point').textContent = String(selected + 1).padStart(2, '0');
  [pointX, pointY, pointZ].forEach((input, axis) => { input.value = point[axis]; });
}

function pointerToPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left - view.cx) / view.scale;
  const z = (event.clientY - rect.top - view.cy) / view.scale;
  let nearest = -1;
  let distance = Infinity;
  track.centerline.forEach((point, index) => {
    const d = Math.hypot(point[0] - x, point[2] - z);
    if (d < distance) { distance = d; nearest = index; }
  });
  let nearestObject = -1;
  let objectDistance = Infinity;
  track.objects.forEach((object, index) => {
    const d = Math.hypot(object.position[0] - x, object.position[2] - z);
    if (d < objectDistance) { objectDistance = d; nearestObject = index; }
  });
  return { nearest, x, z, distance: distance * view.scale, nearestObject, objectDistance: objectDistance * view.scale };
}

function renderObjects() {
  const list = document.querySelector('#primitive-list');
  list.innerHTML = '';
  track.objects.forEach((object, index) => {
    const row = document.createElement('div');
    row.className = `primitive-row ${selectedObject === index ? 'active-row' : ''}`;
    
    object.rotation ||= [0, 0, 0];
    object.animType ||= 'none';
    object.opacity ||= 1;

    row.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <b>${index + 1}. ${object.type.toUpperCase()}</b>
        ${object.texture ? `<img src="${object.texture}" style="width:20px; height:20px; object-fit:cover; border-radius:2px;">` : ''}
      </div>
      
      <!-- POSITION -->
      <label>POS <input data-field="x" type="number" value="${object.position[0]}" step="1">
                 <input data-field="y" type="number" value="${object.position[1]}" step="1">
                 <input data-field="z" type="number" value="${object.position[2]}" step="1"></label>
      
      <!-- ROTATION -->
      <div class="object-dimensions">
        <span>ROTATION (DEG)</span>
        <label>X <input data-rot="0" type="number" step="15" value="${object.rotation[0]}"></label>
        <label>Y <input data-rot="1" type="number" step="15" value="${object.rotation[1]}"></label>
        <label>Z <input data-rot="2" type="number" step="15" value="${object.rotation[2]}"></label>
      </div>

      <!-- SCALE -->
      <div class="object-dimensions">
        <span>SCALE</span>
        ${['x', 'y', 'z'].map((axis, dim) => `<label>${axis.toUpperCase()} <input data-dimension="${dim}" type="number" min="0.1" step="0.5" value="${object.scale?.[dim] ?? 1}"></label>`).join('')}
      </div>

      <!-- TEXTUR & FX -->
      <label>TEXTURE <input data-field="texture" type="file" accept="image/*"></label>
      <label>FX 
        <select data-field="animType">
          <option value="none" ${object.animType === 'none' ? 'selected' : ''}>STATIC</option>
          <option value="scroll-x" ${object.animType === 'scroll-x' ? 'selected' : ''}>NEON SCROLL X</option>
          <option value="scroll-y" ${object.animType === 'scroll-y' ? 'selected' : ''}>NEON SCROLL Y</option>
          <option value="pulse" ${object.animType === 'pulse' ? 'selected' : ''}>GLOW PULSE</option>
        </select>
      </label>
      <label>OPACITY
        <input data-field="opacity" type="number" min="0.1" max="1" step="0.05" value="${object.opacity ?? 1}">
      </label>
      <button data-remove style="margin-top:8px;">REMOVE OBJECT</button>
    `;

    // Event listeners
    row.querySelectorAll('[data-field]').forEach((input) => input.addEventListener('change', () => {
      if (input.dataset.field === 'texture') {
        const file = input.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => { object.texture = reader.result; markChanged(); };
          reader.readAsDataURL(file);
        }
        return;
      }
      if (input.dataset.field === 'animType') {
        object.animType = input.value;
        markChanged();
        return;
      }
      if (input.dataset.field === 'opacity') {
        object.opacity = Number(input.value) || 1;
        markChanged();
        return;
      }
      object.position[['x', 'y', 'z'].indexOf(input.dataset.field)] = Number(input.value) || 0;
      markChanged();
    }));

    row.querySelectorAll('[data-rot]').forEach((input) => input.addEventListener('change', () => {
      const axis = Number(input.dataset.rot);
      object.rotation[axis] = Number(input.value) || 0;
      markChanged();
    }));

    row.querySelectorAll('[data-dimension]').forEach((input) => input.addEventListener('change', () => {
      const dim = Number(input.dataset.dimension);
      object.scale ||= [1, 1, 1];
      object.scale[dim] = Number(input.value) || 1;
      markChanged();
    }));

    row.querySelector('[data-remove]').addEventListener('click', () => { 
      track.objects.splice(index, 1); 
      selectedObject = -1;
      markChanged(); 
    });

    list.append(row);
  });
}

// 1. Infoga ny punkt efter den valda
document.querySelector('#add-point-btn')?.addEventListener('click', () => {
  const current = track.centerline[selected];
  const next = track.centerline[(selected + 1) % track.centerline.length];
  // Skapa en ny punkt mitt emellan
  const newPoint = [
    Math.round((current[0] + next[0]) / 2),
    Math.round((current[1] + next[1]) / 2),
    Math.round((current[2] + next[2]) / 2),
    current[3] || 0 // Lutning/Bank
  ];
  track.centerline.splice(selected + 1, 0, newPoint);
  selected = selected + 1;
  markChanged();
});

// 2. Ta bort vald punkt
document.querySelector('#del-point-btn')?.addEventListener('click', () => {
  if (track.centerline.length <= 4) {
    alert("Banan måste ha minst 4 punkter!");
    return;
  }
  track.centerline.splice(selected, 1);
  selected = Math.max(0, selected - 1);
  markChanged();
});

// 3. Automatisk höjdanpassning när du drar ett objekt på 2D-kartan
canvas.addEventListener('pointermove', (event) => {
  if (draggingObject && selectedObject >= 0) {
    const { x, z } = pointerToPoint(event);
    const obj = track.objects[selectedObject];
    obj.position[0] = Math.round(x);
    obj.position[2] = Math.round(z);

    // Hitta den banpunkt i 2D som också är närmast objektets NUVARANDE höjd (Y)
    let bestPoint = null;
    let minScore = Infinity;

    track.centerline.forEach((pt) => {
      const d2d = Math.hypot(pt[0] - x, pt[2] - z);
      if (d2d < 30) { // Inom rimligt räckvidd i 2D
        const dY = Math.abs(pt[1] - obj.position[1]);
        const score = d2d + dY * 2; // Prioritera punkter som ligger nära i höjdled
        if (score < minScore) {
          minScore = score;
          bestPoint = pt;
        }
      }
    });

    if (bestPoint) {
      obj.position[1] = bestPoint[1] + 2; // Sätt Y 2 enheter ovanför rätt spårnivå
    }

    markChanged();
    return;
  }

  if (!dragging) return;
  const { x, z } = pointerToPoint(event);
  track.centerline[selected][0] = Math.round(x);
  track.centerline[selected][2] = Math.round(z);
  markChanged();
});

document.querySelectorAll('[data-primitive]').forEach((button) => button.addEventListener('click', () => {
  track.objects.push({ id: crypto.randomUUID(), type: button.dataset.primitive, position: [0, 2, 0], rotation: [0, 0, 0], scale: [1, 1, 1], texture: null });
  markChanged();
}));
document.querySelector('#track-select').addEventListener('change', (event) => { currentTrackId = event.target.value; track = loadTrack(currentTrackId); widthInput.value = track.width; scaleInput.value = track.horizontalScale; selected = 0; syncPointFields(); draw(); renderObjects(); });

canvas.addEventListener('pointerdown', (event) => {
  const { nearest, distance, x, z, nearestObject, objectDistance } = pointerToPoint(event);
  if (nearestObject >= 0 && objectDistance <= 18 && (objectDistance <= distance || distance > 18)) {
    selectedObject = nearestObject;
    draggingObject = true;
    canvas.setPointerCapture(event.pointerId);
    draw();
    return;
  }
  selectedObject = -1;
  if (distance > 18) return;
  selected = nearest;
  dragging = true;
  canvas.setPointerCapture(event.pointerId);
  syncPointFields();
  draw();
});
canvas.addEventListener('pointermove', (event) => {
  if (draggingObject && selectedObject >= 0) {
    const { x, z } = pointerToPoint(event);
    track.objects[selectedObject].position[0] = Math.round(x);
    track.objects[selectedObject].position[2] = Math.round(z);
    markChanged();
    return;
  }
  if (!dragging) return;
  const { x, z } = pointerToPoint(event);
  track.centerline[selected][0] = Math.round(x);
  track.centerline[selected][2] = Math.round(z);
  markChanged();
});
canvas.addEventListener('pointerup', () => { dragging = false; draggingObject = false; });
canvas.addEventListener('pointercancel', () => { dragging = false; draggingObject = false; });

function bindNumber(input, axis) {
  input.addEventListener('input', () => {
    const value = Number(input.value);
    if (!Number.isFinite(value)) return;
    track.centerline[selected][axis] = value;
    markChanged();
  });
}
bindNumber(pointX, 0);
bindNumber(pointY, 1);
bindNumber(pointZ, 2);
widthInput.addEventListener('input', () => { track.width = Number(widthInput.value); markChanged(); });
scaleInput.addEventListener('input', () => { track.horizontalScale = Number(scaleInput.value); markChanged(); });

document.querySelector('#save-button').addEventListener('click', () => {
  savedTracks[currentTrackId] = track;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedTracks));
  document.querySelector('#save-state').textContent = 'SAVED';
  status.textContent = 'Saved for this track and browser. Reload the race to see the updated route and objects.';
});
document.querySelector('#reset-button').addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});
document.querySelector('#copy-button').addEventListener('click', async () => {
  await navigator.clipboard.writeText(`export const NEON_CAUSEWAY = ${JSON.stringify(track, null, 2)};\n`);
  status.textContent = 'Track definition copied as JavaScript.';
});
document.querySelector('#download-button').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(track, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${track.id || 'track'}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  status.textContent = 'Track JSON downloaded.';
});

widthInput.value = track.width;
scaleInput.value = track.horizontalScale;
syncPointFields();
renderObjects();
window.addEventListener('resize', resize);
resize();
