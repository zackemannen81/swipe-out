import { NEON_CAUSEWAY } from './track-data.js';
import './editor.css';

const STORAGE_KEY = 'swipe-out-track-definition';
const canvas = document.querySelector('#editor-canvas');
const context = canvas.getContext('2d');
const track = loadTrack();
const widthInput = document.querySelector('#width-input');
const scaleInput = document.querySelector('#scale-input');
const pointX = document.querySelector('#point-x');
const pointY = document.querySelector('#point-y');
const pointZ = document.querySelector('#point-z');
const status = document.querySelector('#status');
let selected = 0;
let dragging = false;
let view = { scale: 1, cx: 0, cy: 0 };

function loadTrack() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.centerline) && saved.centerline.length >= 4) return saved;
  } catch (error) {
    console.warn('Ignoring invalid saved track data.', error);
  }
  return structuredClone(NEON_CAUSEWAY);
}

function markChanged() {
  document.querySelector('#save-state').textContent = 'UNSAVED';
  status.textContent = 'Unsaved changes. Save to use this route in the race.';
  draw();
  syncPointFields();
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
  view.scale = Math.min((width - padding * 2) / Math.max(maxX - minX, 1), (height - padding * 2) / Math.max(maxZ - minZ, 1));
  view.cx = (width - (minX + maxX) * view.scale) / 2;
  view.cy = (height - (minZ + maxZ) * view.scale) / 2;
  const screen = ([x, , z]) => [view.cx + x * view.scale, view.cy + z * view.scale];

  context.strokeStyle = 'rgba(112, 157, 174, .11)';
  context.lineWidth = 1;
  for (let x = 0; x < width; x += 32) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); }
  for (let y = 0; y < height; y += 32) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }

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
  document.querySelector('#point-count').textContent = `${points.length} POINTS`;
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
  return { nearest, x, z, distance: distance * view.scale };
}

canvas.addEventListener('pointerdown', (event) => {
  const { nearest, distance } = pointerToPoint(event);
  if (distance > 18) return;
  selected = nearest;
  dragging = true;
  canvas.setPointerCapture(event.pointerId);
  syncPointFields();
  draw();
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const { x, z } = pointerToPoint(event);
  track.centerline[selected][0] = Math.round(x);
  track.centerline[selected][2] = Math.round(z);
  markChanged();
});
canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('pointercancel', () => { dragging = false; });

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(track));
  document.querySelector('#save-state').textContent = 'SAVED';
  status.textContent = 'Saved for this browser. Reload the race to see the updated route.';
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
window.addEventListener('resize', resize);
resize();
