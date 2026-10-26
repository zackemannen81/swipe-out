# Current Task

Task ID: VFX-001
Status: Complete
Created: 2026-10-26

## Scope

Continuous white/cyan exhaust, fine particles and a fading world-space wake,
using the supplied image as art direction. Apply to player and all four CPU
craft. Preserve driving behavior and unrelated local shader edits.
Previous PORT-001 work is retained in `archive/PORT-001-paused.md`; parity work
is not claimed complete.

## Definition of done

- [x] Visible idle exhaust; smooth throttle and boost response.
- [x] Interpolated emission positions and birth times without frame-sized groups.
- [x] World-space trails with smooth lifetime fade and continuous turns.
- [x] All five ships; inactive, restart and teleport states handled.
- [x] Bounded reusable buffers, no per-frame GPU resource creation.
- [x] Numerical regression, production build and browser visual checks recorded.
- [x] Continuity documents updated with evidence and limitations.

## Verification

Four tests pass via `node --test tests/thrusters.test.js`: 30/60/120 Hz continuity,
idle/throttle/boost, five-ship lifecycle, turns/teleports and resource reuse.
Production build, syntax checks and diff whitespace checks pass. Vite retains its
large-chunk advisory. Chromium WebGL verified start/countdown, keyboard throttle
and release, boost, all ten emitters, pause and restart, with no console errors or
failed requests in the final run. Desktop/close-camera and 844x390 renders inspected.
Physical phone performance and user art approval remain outstanding validation.
