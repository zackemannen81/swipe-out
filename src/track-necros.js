import * as THREE from 'three';
import { createTrackCurve, getTrackFrame, progressAtControlPoint } from './track-path.js';
import { suggestBoostPads } from './track-pads.js';

// Route only. The named footprints reserve space for the later architecture.
const points = [], widths = [], anchors = {};
function p(name, x, y, z, bank = 0, width = 22) {
  if (name) anchors[name] = points.length;
  points.push([x, y, z, bank]); widths.push(width);
}
// Unbroken launch straight, followed by a gentle climbing bend.
p('start', 0, 30, -900, 0, 26);
p(null, 0, 30, -650, 0, 26);
p(null, 0, 30, -350, 0, 26);
p('paradeEnd', 0, 30, -100, 0, 26);
p(null, -60, 40, 40, 10, 24);
// Outside of the cathedral, then turn back into its central nave.
p('cathedralOutside', -200, 50, 180, 14);
p(null, -240, 55, 400, 10);
p(null, -200, 60, 620, -15);
p(null, 0, 65, 700, -18);
p(null, 230, 70, 620, -18);
p(null, 270, 75, 350, -12);
p(null, 200, 80, 140, -22);
p(null, 70, 85, 110, -22, 18);
p('cathedral', 0, 90, 240, -5, 18);
p(null, 0, 100, 450, 0, 18);
p('cathedralExit', 0, 140, 630, -8, 18);
p(null, 160, 165, 800, -16);
p(null, 340, 180, 700, -18);
p(null, 400, 190, 600, -14);
// First revolution around tower footprint (540, 500).
for (let i = 0; i <= 24; i++) {
  const a = Math.PI + i / 24 * Math.PI * 2;
  p(i === 0 ? 'ascension' : null, 540 + 140 * Math.cos(a), 200 + 140 * i / 24,
    500 + 140 * Math.sin(a), -18);
}
// Cross the interior between climbing revolutions, with room for future portals.
p(null, 420, 350, 410, -10);
p('towerCrossing', 540, 370, 440, 0, 20);
p(null, 660, 390, 470, -10);
for (let i = 0; i <= 24; i++) {
  const a = i / 24 * Math.PI * 2;
  p(null, 540 + 140 * Math.cos(a), 400 + 250 * i / 24,
    500 + 140 * Math.sin(a), -18);
}
p(null, 640, 665, 610, -18);
p('summit', 540, 675, 580, 0, 20);
p(null, 410, 675, 550, 0, 20);
p('drop', 330, 660, 480, 0, 24);
// Rounded crest, steep sustained descent, then a long smooth pull-out.
p(null, 315, 590, 440, 0, 24);
p(null, 310, 440, 400, 0, 24);
p(null, 310, 260, 355, 0, 24);
p(null, 320, 120, 290, 0, 26);
p(null, 350, 50, 160, -6, 26);
p('monuments', 420, 30, -40, -8, 26);
p(null, 500, 30, -300, 0, 26);
p(null, 500, 30, -650, 0, 26);
p(null, 460, 30, -950, -12, 24);
p('returnTurn', 300, 30, -1100, -24, 22);
p(null, 100, 30, -1100, -24, 22);
p(null, 0, 30, -1030, -18, 24);

export const NECROS = {
  id: 'necros-conquest-spire', name: 'Necros · The Conquest Spire', width: 22,
  horizontalScale: 1, magnetic: true, roadStyle: 'raceway',
  centerline: points, pointWidths: widths, objects: [], gaps: [], branches: [],
};
// Keep authored banking relative to the local horizon, compensating transported roll.
const flat=createTrackCurve({...NECROS,centerline:points.map(p=>p.slice(0,3))});
for(let i=0;i<points.length;i++){
 const f=getTrackFrame(flat,progressAtControlPoint(flat,i));const up=new THREE.Vector3(0,1,0).addScaledVector(f.tangent,-f.tangent.y).normalize();
 points[i][3]+=THREE.MathUtils.radToDeg(Math.atan2(f.tangent.dot(f.normal.clone().cross(up)),f.normal.dot(up)));
}
const base=createTrackCurve(NECROS);
export const NECROS_SECTORS=Object.fromEntries(Object.entries(anchors).map(([name,i])=>[name,progressAtControlPoint(base,i)]));
NECROS.pads = suggestBoostPads(NECROS);
