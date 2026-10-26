# File Structure

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
