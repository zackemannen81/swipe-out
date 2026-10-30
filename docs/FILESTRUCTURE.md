# File Structure

## 2026-10-29 — CUP-001

- `src/cup.js` — cup configuration, validated persistence and scoring
- `src/cup-ui.js` — selection, continuation and results UI
- `tests/cup.test.js` — scoring/ties/DNF/persistence/failure coverage
- `tools/verify-cup.mjs` — browser three-round/resume/medal/isolation checks
- `docs/CUP.md` — rules and validation limits
- `docs/archive/AUDIO-002.md` — accepted announcer integration task

## 2026-10-29 — AUDIO-002

- `src/announcer.js` — voice policy, queue, loading and shared gain
- `tests/announcer.test.js` — priority/lifecycle/volume/assets tests
- `tools/verify-announcer.mjs` — browser volume/countdown/combat/solo acceptance
- `public/audio/announcer/` — 49 voice clips (21 referenced by current runtime)
- `docs/archive/AUDIO-001.md` — completed generator task

## 2026-10-28 — AUDIO-001

- `tools/generate-announcer.py` — batch TTS/SoX generator with isolated output
- `tools/announcer-lines.json` — 49 categorized SwipeOut phrases
- `tools/test-announcer.py` — offline selection/output/failure tests
- `docs/ANNOUNCER.md` — usage, dependencies, recipe and verification limits
- `public/audio/announcer/weapon_acquired.wav` — generated sample, not yet played by runtime
- `docs/archive/COMBAT-004.md` — completed icon integration task

## 2026-10-28 — COMBAT-004

- `src/weapon-icons.js` — shared artwork URLs for pickups and HUD
- `public/images/icons/*-256.png` — user-supplied transparent weapon icons
- `docs/archive/COMBAT-003.md` — completed weapon pickup task

## 2026-10-28 — COMBAT-003

- `src/weapon-pickups.js` — pure swept route-aware pickup crossing rules
- `src/weapon-pads.js` — automatic placement and instanced pad presentation
- `tests/weapon-pickups.test.js` — ammo, crossing, lifecycle, format and CPU coverage
- `tools/verify-weapon-pickups.mjs` — editor/pickup/HUD/lifecycle browser checks
- `docs/WEAPON_PICKUPS.md` — D2 authoring, controls, rules and validation limits
- `docs/archive/COMBAT-002.md` — accepted D1 task

## 2026-10-28 — COMBAT-002

- `docs/COMBAT_DEFENCE.md` — D1 controls, mechanics and verification limits
- `tests/combat-flares.test.js` — defence, cooldown, lifecycle and effect bounds
- `tools/verify-combat-flares.mjs` — browser input/HUD/pause/retry/solo checks
- `docs/archive/EDITOR-006.md` — completed object color editor task

## 2026-10-28 — EDITOR-006

- `tools/verify-object-colors.mjs` — color editor/material/persistence browser checks
- `docs/archive/TRACK-005.md` — completed track workshop task

## 2026-10-28 — TRACK-005

- `src/track-pads.js` — pad placement/validation/suggestions and instanced markings
- `src/track-workshop.js` — track16 variable-width demonstration
- `tests/track-workshop.test.js` — width, pads, migration and CPU race coverage
- `tools/verify-track-workshop.mjs` — editor and race browser acceptance
- `docs/TRACK_WORKSHOP.md` — editor guide, format and verification limits
- `docs/archive/CPU-001.md` — accepted CPU difficulty implementation

## 2026-10-28 — CPU-001 difficulty and personalities

- `src/cpu-difficulty.js` — profiles, safe preference persistence and route choices
- `docs/CPU_DIFFICULTY.md` — user/tuning guide and measured race comparisons
- `tests/cpu-difficulty.test.js` — settings, reset, traffic, catch-up, routes and full races
- `tools/measure-cpu-difficulty.mjs` — repeatable multi-track CPU race measurements
- `tools/verify-cpu-difficulty.mjs` — browser settings/retry/solo/storage acceptance
- `docs/archive/PRESENT-002.md` — completed start-view correction, user approved

## 2026-10-28 — PRESENT-002 start-view correction

- `docs/archive/PRESENT-001.md` — completed intro/results implementation record

## 2026-10-28 — PRESENT-001 race presentation

- `src/race-intro.js` — skippable presentation-only fly-by and chase blending
- `tests/race-intro.test.js` — frame-rate, endpoint, skip and restart checks
- `tools/verify-race-presentation.mjs` — browser lifecycle/layout/countdown acceptance
- `docs/archive/PLAN-002.md` — completed expanded-roadmap task

## 2026-10-28 — PLAN-002 expanded roadmap

- `docs/PRODUCT_ROADMAP.md` — expanded wishlist, proposed stages A–G and acceptance targets
- `docs/archive/README-001.md` — completed README refresh task

## 2026-10-27 — README-001 documentation refresh

- `README.md` — current SwipeOut2026 setup, play/editor guide and roadmap overview
- `docs/archive/DRIVE-002.md` — completed Wipeout wall-response task record

## 2026-10-27 — DRIVE-002 classic wall response

- `docs/archive/TT-001.md` — completed Time Attack task record
- `src/race-interactions.js` — central classic rail response and CLASSIC_WALL tuning
- `tests/driving-modes.test.js` — no-input pinball, mirrored/fps/cooldown/escape regressions
- `src/time-attack.js` / `tests/time-attack.test.js` — mode-specific physics identities

## 2026-10-27 — TT-001 Time Attack and racing guidance

- `docs/archive/DRIVE-001.md` — completed optional driving-mode task record
- `docs/PRODUCT_ROADMAP.md` — approved skill/progression/polish stages
- `docs/TIME_ATTACK.md` — controls, records, ghost, guidance and technical limits
- `src/time-attack.js` — lap/sector timing, validity, versioned storage and replay
- `src/time-attack-ui.js` — saved practice options, menu/HUD/results and session
- `src/lap-ghost.js` — transparent PB craft, sharing geometry without physics
- `src/racing-guide.js` — line/route estimates, warnings and bounded guide mesh
- `tests/time-attack.test.js` — timing/storage/ghost/guidance and full physics runs
- `tools/verify-time-attack.mjs` — WebGL flows, persistence, guides and screenshots

`game.js` isolates solo simulation and connects session lifecycle; `index.html`
and `style.css` add the event selector, timing panel, warning and results table.

## 2026-10-27 — DRIVE-001 optional handling and camera profiles

- `docs/archive/TRACK-004.md` — completed Ion Foundry task
- `docs/DRIVING_MODES.md` — user controls, source comparison, tuning and limits
- `src/classic-handling.js` — Wipeout-inspired angular/sideways momentum profile
- `src/classic-camera.js` — local correction and heading-follow chase/cockpit
- `src/driving-settings.js` — preferences, validation and isolated gamepad mapping
- `tests/driving-modes.test.js` — profile/input/camera/flight/progress/aim regressions
- `tools/verify-driving-modes.mjs` — browser preferences, controls and lifecycle

`ship-physics.js`, `gap-flight.js`, `combat.js` and `game.js` integrate the optional
profile; `index.html`/`style.css` provide independent mode and camera selectors.

## 2026-10-26 — TRACK-004 Ion Foundry

- `docs/archive/TRACK-003.md` — completed routes/combat/cloning task
- `docs/CURRENT_TASK.md` — TRACK-004 complete-circuit scope and verification
- `docs/ION_FOUNDRY.md` — circuit sectors, driving guide, assets and authoring notes
- `src/track-foundry.js` — authored track15, bank compensation and editable scenery
- `public/images/textures/tex*` — user-provided original source textures
- `public/images/textures/optimized/` — 12 WebP derivatives, five signs and manifest
- `tools/prepare-foundry-textures.py` — reproducible Pillow conversion/sign generation
- `tests/foundry.test.js` — track/asset/clearance/flight/race/resource regressions
- `tools/verify-foundry.mjs` — WebGL sector captures, flight/route and editor checks

`track-library.js` registers the circuit; `track.js` shares resources within each
scenery group while preserving independent scrolling texture animations.

## 2026-10-26 — TRACK-003 routes, combat and cloning

- `docs/archive/TRACK-002.md` — completed gaps/magnetic-track task
- `docs/CURRENT_TASK.md` — TRACK-003 scope and verification
- `src/branch-geometry.js` — branch deck, amber edges/rails, junction beacons and route-owned pads
- `src/combat.js` — shared weapon simulation, aim/locks, ammo, hits and instanced presentation
- `tests/routes-combat.test.js` — topology, physical/canonical progress, gates, CPU routes and combat regressions
- `tools/verify-routes-combat.mjs` — browser cloning, route authoring/traversal and weapon controls/lifecycle

`track-path.js` now owns branch runtime frames and progress mapping; v3 format,
editor/view, physics, race interactions, AI, minimap and game integrate it.
`track-labs.js` adds Split Decision (track13) and Crossfire Circuit (track14).
`audio.js` adds bounded-duration synthesized firing sounds.

## 2026-10-26 — TRACK-002 gaps and magnetic track

- `docs/CURRENT_TASK.md` — active TRACK-002 acceptance and verification
- `docs/archive/TRACK-001.md` — completed import/export and initial editor task
- `src/track-path.js` — shared spline, transported/banked frames, surface gaps and local projection
- `src/gap-flight.js` — world-space launch, gravity, air steering, landing and recovery
- `src/track-camera.js` — local-up magnetic camera with continuous quaternion rotation
- `src/track-labs.js` — Gap Run and Loop & Roll test circuits (catalog track11/track12)
- `tests/track-features.test.js` — gap, loop, camera, format, frame-rate and complete CPU-race regressions
- `tools/verify-track-features.mjs` — browser editor, flight/pause/recovery and inverted camera checks

Existing track-format/library, geometry, physics, interactions, opponents and
editor modules integrate these features. Older entries below remain historical.

## 2026-10-26 — TRACK-001 authoring foundation

- `docs/TRACK_ROADMAP.md` — approved Swedish six-stage plan and completion checklist
- `docs/archive/RACE-003.md` — completed catch-up task record
- `docs/CURRENT_TASK.md` — TRACK-001 scope, acceptance and verification
- `src/track-format.js` — versioned track envelope, validation, legacy decode, JSON IO
- `src/track-library.js` — shared built-in catalog, saved/custom loading and scoped writes
- `src/editor-history.js` — bounded independent undo/redo snapshots
- `src/editor-view.js` — Three.js authoring view, shared road/scenery, camera and XYZ handles
- `src/editor.js` — editor drafts, forms, selection, history, import/export and save/test UI
- `editor.html` / `src/editor.css` — responsive 3D editor interface
- `src/track.js` — shared geometry/scenery and GPU resource disposal on rebuild
- `tests/track-format.test.js` — migration, round-trip geometry/scenery, rejection/storage/history regressions
- `tools/verify-track-editor.mjs` — optional real-browser authoring-to-race acceptance checks

Historical entries below describe earlier implementations, not the current editor.

Verified 2026-10-11 after IMPLEMENT-008. The project implements the competitive version 0.1 circuit race, with a data-defined 3D Neon Causeway centerline and width, procedural Three.js geometry, touch/keyboard controls, two deterministic CPU rivals, live/final placement, finish/results, retry, audio-reactive presentation, and a user-provided panorama backdrop; interactive race/device verification remains pending.

- `AGENTS.md` — repository instructions and docs-first entry point
- `README.md` — runtime requirements, race instructions, and project map
- `package.json` / `package-lock.json` — npm scripts and pinned dependency graph
- `.gitignore` — generated and local-only files excluded from version control
- `vite.config.js` — multi-page Vite build entries for the race and editor
- `index.html` — game canvas, start/results overlay, telemetry race HUD, read-only minimap, and module entry
- `editor.html` — standalone developer track editor page
- `src/editor.js` — draggable route editor, local save/load, copy, and JSON download
- `src/editor.css` — responsive editor presentation
- `public/images/backdrop_track-001.jpg` — user-provided panorama backdrop image
- `src/game.js` — Three.js renderer/camera, panorama backdrop, input, race flow, HUD, active track loading, and minimap updates
- `src/opponents.js` — deterministic CPU racer definitions, movement, finish times, placement, and reset
- `src/track.js` — procedural road/edges, guide posts, start/finish gate, and track-frame helpers
- `src/track-data.js` — Neon Causeway default centerline, horizontal scale, and road width
- `src/craft.js` — procedural player/rival craft, engine accents, and glow
- `src/audio.js` — race music playback and reusable kick/bass/mid/high/hi-hat analyser channels
- `src/style.css` — responsive overlays, live HUD, and visual presentation
- `docs/CURRENT_TASK.md` — active IMPLEMENT-008 backdrop task and verification boundary
- `docs/archive/IMPLEMENT-001.md` — completed Step 1 rendering-foundation task
- `docs/archive/IMPLEMENT-002.md` — completed version 0.1 playable-race task
- `docs/archive/IMPLEMENT-003.md` — completed accepted handling/course/camera task
- `docs/TASK_WORKFLOW.md` — task lifecycle and continuity rules
- `docs/CURRENT_STATUS.md` — verified application behavior and remaining work
- `docs/SYSTEMDOC.md` — durable product direction and technical constraints
- `docs/GDD.md` — detailed game-design goals, release scope, and open decisions
- `docs/JOURNAL.md` — dated record of completed work waves and task transitions
- `docs/FILESTRUCTURE.md` — this factual repository map

Update this map when files or directories are added, removed, or reorganized.
Do not list planned paths as if they already exist.

## 2026-10-26 — CPU and interaction implementation

- `src/opponents.js` — four tunable driver profiles, shared-physics CPU driving,
  route/traffic/pad decisions, pose synchronization, finish and full reset
- `src/ship-physics.js` — player and CPU motion, tuning, persistent velocity and impact state
- `src/race-interactions.js` — shared swept pad detection, wall response and bilateral craft collisions
- `tests/racing.test.js` — acceleration, pads, wall/contact/lifecycle tests and a full CPU race simulation
- `docs/archive/VFX-001.md` — completed thruster task record
- `docs/CURRENT_TASK.md` — RACE-002 scope and verification record

## 2026-10-26 — thruster implementation additions

- `src/thrusters.js` — world-space plasma wakes, pooled glint particles, throttle
  smoothing, reset and disposal for the player plus four CPU craft
- `src/craft.js` — asynchronous GLTF loading; exhaust is managed by game.js
- `src/ParticleSystem.js` / `src/shaders.js` — retained older experiments, no longer
  imported by the active thruster implementation
- `tests/thrusters.test.js` — Node regression checks for temporal continuity,
  throttle, lifecycle and fixed resource budgets
- `docs/archive/PORT-001-paused.md` — previous unfinished task record preserved
- `docs/CURRENT_TASK.md` — VFX-001 scope and verification record

## 2026-10-26 — catch-up implementation additions

- `src/catch-up.js` — shared leader-gap calculation, configurable bonus curve,
  smoothing and effective top-speed helper for player and CPU
- `tests/catch-up.test.js` — thresholds, fairness, frame rates, lifecycle,
  attainable speed, physical consequences, pad stacking and traffic regressions
- `docs/archive/RACE-002.md` — completed CPU/interaction task record
- `docs/CURRENT_TASK.md` — RACE-003 catch-up scope and verification


## 2026-10-29 — Necros foundation

- `src/track-necros.js`: track17 authored layout and procedural primitive scenery.
- `public/images/necros/`: three propaganda PNG textures and SVG sources.
- `tests/necros.test.js`: geometry, clearance, jumps and route/CPU traversal.
- `tools/verify-necros.mjs`: isolated browser/editor acceptance and screenshots.
- `docs/NECROS.md`: design, editing, validation and remaining art.
- `docs/archive/CUP-001.md`: completed prior task.


## 2026-10-29 — NECROS-002

`src/track-necros.js` now contains only track geometry, named anchors and pads. `tests/necros.test.js` and `tools/verify-necros.mjs` verify continuous route/dive instead of the removed gap/shortcut. `docs/archive/NECROS-001.md` preserves the prior task.


## PHYSICS-001
- `src/longitudinal-physics.js`: shared road gravity, engine envelope, drag/braking.
- `tests/longitudinal.test.js`: slopes, overspeed, both handling modes and CPU levels.
- `docs/archive/NECROS-002.md`: prior task record.


## HUD-001
`docs/archive/PHYSICS-001.md` preserves the prior task. Existing game HUD and
Necros browser verification now share/check current and peak speed scaling.


## EDIT-CAMERA-COMBAT-001
- `src/glb-scenery.js`: self-contained GLB validation/loading, shared by editor/game.
- `tests/glb-scenery.test.js`: model format, loader, instances and lifecycle.
- `tools/verify-glb.mjs`: isolated UI import/transform/clone/save/export/game checks.
- `docs/archive/HUD-001.md`: prior task record.
