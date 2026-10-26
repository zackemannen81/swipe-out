import { createTrackCurve, progressAtControlPoint } from './track-path.js';

export const GAP_LAB = {
  id: 'gap-lab', name: 'TEST · Gap Run', width: 20, horizontalScale: 1, magnetic: true,
  centerline: [
    [0, 0, -250], [0, 0, -100], [0, 0, 0], [0, 7, 100],
    [0, 10, 140], [0, 0, 200], [0, 0, 400], [0, 0, 650],
    [100, 0, 800], [300, 0, 700], [350, 0, 450], [350, 0, 100],
    [300, 0, -200], [160, 0, -350], [0, 0, -350],
  ],
  objects: [],
};
const gapCurve = createTrackCurve(GAP_LAB);
GAP_LAB.gaps = [{ start: progressAtControlPoint(gapCurve, 3), end: progressAtControlPoint(gapCurve, 5) }];

const loopPoints = [[0, 0, -300, 0], [0, 0, -150, 0], [0, 0, 0, 0], [0, 0, 50, 0], [0, 0, 75, 0]];
for (let i = 0; i <= 20; i++) {
  const t = i / 20, angle = t * Math.PI * 2;
  loopPoints.push([40 * t * t * (3 - 2 * t), 75 * (1 - Math.cos(angle)), 100 + 75 * Math.sin(angle), 0]);
}
loopPoints.push(
  [40, 0, 125, 0], [40, 0, 150, 0], [40, 0, 200, 0],
  [40, 0, 250, 0], [40, 0, 350, 0], [40, 0, 500, 90],
  [40, 0, 650, 180], [40, 0, 800, 270], [40, 0, 950, 360],
  [200, 0, 1100, 390], [400, 0, 950, 390], [450, 0, 650, 360],
  [450, 0, 200, 360], [400, 0, -200, 385], [200, 0, -450, 385], [0, 0, -450, 360],
);
export const LOOP_LAB = {
  id: 'loop-lab', name: 'TEST · Loop & Roll', width: 18, horizontalScale: 1,
  magnetic: true, centerline: loopPoints, objects: [], gaps: [],
};
