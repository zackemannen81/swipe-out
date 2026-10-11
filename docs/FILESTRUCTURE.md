# File Structure

Verified 2026-10-11 after IMPLEMENT-008. The project implements the competitive version 0.1 circuit race, with a data-defined 3D Neon Causeway centerline and width, procedural Three.js geometry, touch/keyboard controls, two deterministic CPU rivals, live/final placement, finish/results, retry, audio-reactive presentation, and a user-provided panorama backdrop; interactive race/device verification remains pending.

- `AGENTS.md` — repository instructions and docs-first entry point
- `README.md` — runtime requirements, race instructions, and project map
- `package.json` / `package-lock.json` — npm scripts and pinned dependency graph
- `.gitignore` — generated and local-only files excluded from version control
- `index.html` — game canvas, start/results overlay, race HUD, and module entry
- `public/images/backdrop_track-001.jpg` — user-provided panorama backdrop image
- `src/game.js` — Three.js renderer/camera, panorama backdrop, input, race flow, HUD updates, placement, and render loop
- `src/opponents.js` — deterministic CPU racer definitions, movement, finish times, placement, and reset
- `src/track.js` — procedural road/edges, guide posts, start/finish gate, and track-frame helpers
- `src/track-data.js` — Neon Causeway 3D centerline, horizontal scale, and road width
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
