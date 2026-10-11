# File Structure

Verified 2026-10-10 after the IMPLEMENT-003 sharper-turn/elevation/speed pass. The project implements the playable version 0.1 circuit race, with a data-defined 3D Neon Causeway centerline and width, procedural Three.js geometry, touch/keyboard controls, finish/results, and retry. IMPLEMENT-001 and IMPLEMENT-002 are archived under `docs/archive/`; IMPLEMENT-003 remains active pending interactive race verification.

- `AGENTS.md` — repository instructions and docs-first entry point
- `README.md` — runtime requirements, race instructions, and project map
- `package.json` / `package-lock.json` — npm scripts and pinned dependency graph
- `.gitignore` — generated and local-only files excluded from version control
- `index.html` — game canvas, start/results overlay, race HUD, and module entry
- `src/game.js` — Three.js renderer/camera, input, race flow, HUD updates, and render loop
- `src/track.js` — procedural road/edges, guide posts, start/finish gate, and track-frame helpers
- `src/track-data.js` — Neon Causeway 3D centerline, horizontal scale, and road width
- `src/craft.js` — procedural player craft, engine accents, and glow
- `src/style.css` — responsive overlays, live HUD, and visual presentation
- `docs/CURRENT_TASK.md` — active IMPLEMENT-003: extend/elevate the track (interactive finish/retry verification pending)
- `docs/archive/IMPLEMENT-001.md` — completed Step 1 rendering-foundation task
- `docs/archive/IMPLEMENT-002.md` — completed version 0.1 playable-race task
- `docs/TASK_WORKFLOW.md` — task lifecycle and continuity rules
- `docs/CURRENT_STATUS.md` — verified application behavior and remaining work
- `docs/SYSTEMDOC.md` — durable product direction and technical constraints
- `docs/GDD.md` — detailed game-design goals, release scope, and open decisions
- `docs/JOURNAL.md` — dated record of completed work waves and task transitions
- `docs/FILESTRUCTURE.md` — this factual repository map

Update this map when files or directories are added, removed, or reorganized.
Do not list planned paths as if they already exist.
