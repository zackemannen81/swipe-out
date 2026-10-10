# Swipe-out — First playable 0.1

Swipe-out is a small Three.js anti-gravity racing prototype. Version 0.1 is a complete one-track, one-craft race: start a run, drag to steer, cross the finish, and race again. Track geometry, craft geometry, and the visual treatment are procedural and original prototype content.

## Requirements and run

- Node.js 20.19+ (or 22.12+)
- npm
- A modern browser with WebGL 2 support

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Run `npm run build` for the production bundle or `npm run preview` to serve that bundle locally.

## Play

Press **Start Race** to begin. Forward travel is automatic. Drag left or right anywhere on the scene to steer; let go to return toward center. The left/right arrow keys and A/D are also supported for keyboard testing. The single lap ends at the start/finish gate. The result panel shows elapsed time; **Race Again** starts a fresh run without reloading.

Touch input has been exercised with browser mobile-device emulation; representative physical-device performance and usability have not been measured. The race displays live timer, lap/progress, and automatic speed telemetry. An explicit in-race pause/resume action is the next planned increment and is not yet implemented. See `docs/CURRENT_STATUS.md` for verified scope and `docs/CURRENT_TASK.md` for the active task.

## Project map

- `src/game.js` — Three.js setup, camera follow, input, race lifecycle, and render loop
- `src/track.js` — closed circuit, track edges, guide rails, gate, and track-frame helpers
- `src/craft.js` — procedural player craft
- `src/style.css` — responsive start/results, HUD, and page presentation
- `docs/GDD.md` — product direction and staged release goals
- `docs/CURRENT_TASK.md` — active task (if any)
- `docs/archive/` — completed task records
