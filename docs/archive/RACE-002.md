# Current Task

Task ID: RACE-002
Status: Complete
Created: 2026-10-26

## Scope

Give the four CPU racers distinct top speeds, acceleration, handling and decisions.
Use persistent ship physics for CPU steering, wall impacts and recovery. Both CPU
and player collect the same physical boost pads. Make ship-to-ship impacts affect
both racers' real speed/lateral motion, including CPU-versus-CPU contact.
Preserve accepted thruster tuning and normal player controls.

## Definition of done

- [x] Distinct tunable CPU profiles; acceleration and braking replace speed jumps.
- [x] Route-aware driving, overtaking, boost targeting and imperfect steering.
- [x] Shared pad detection with lane/height checks and once-per-pass activation.
- [x] Persistent bilateral collisions, wall consequences and visible impact response.
- [x] Start/reset/pause/finish and five-racer placement remain coherent.
- [x] Deterministic tests cover acceleration, pads, walls, collisions and lifecycle.
- [x] Production build and browser checks; document balance/playtest limitations.

## Verification

12 Node tests pass, including a complete CPU race on Neon Causeway with pad use,
wall recovery and CPU collisions. Chromium WebGL exercised actual start/driving,
boost, persistent rear impact on player and CPU, pause/reset, same-frame finish
ordering, remaining CPU finishes and the retry button. Both runs recorded no
console errors or failed requests. Production build, syntax and whitespace checks
pass, with Vite's existing large-chunk warning. The latest CPU slope initialization
guard is covered by the full-race numerical regression.

Profile values are a first balance pass. Human playtesting across all ten tracks
and physical-device performance remain unverified. Player normal acceleration and
steering remain unchanged; wall loss is now severity-based rather than a fixed 80%.
