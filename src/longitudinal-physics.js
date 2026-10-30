// World units/second. Gravity acts along the road; magnetic adhesion does not
// cancel its tangential component. Flight keeps its separate ballistic gravity.
export const LONGITUDINAL = Object.freeze({ gravity: 26, linearDrag: 0.003, quadraticDrag: 0.000015, taper: 0.05, minimumSpeed: 12 });

export function stepLongitudinalSpeed(speed, { throttle, engineForce, engineLimit, brakeForce = 0, slope = 0 }, dt) {
  if (dt <= 0) return speed;
  const drag = LONGITUDINAL.linearDrag * speed + LONGITUDINAL.quadraticDrag * speed * speed;
  const reserve = Math.max(0, Math.min(1, (engineLimit - speed) / (engineLimit * LONGITUDINAL.taper)));
  // At the engine limit, full throttle can balance drag, but never remove
  // externally earned overspeed. Bound only engine acceleration, not momentum.
  const drive = speed <= engineLimit
    ? Math.min(throttle * (engineForce * reserve + drag), Math.max(0, engineLimit - speed) / dt + drag)
    : 0;
  return Math.max(LONGITUDINAL.minimumSpeed,
    speed + (drive - drag - brakeForce - LONGITUDINAL.gravity * slope) * dt);
}
