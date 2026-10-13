# Swipe-out — First playable 0.1

Swipe-out is a small Three.js anti-gravity racing prototype. Version 0.1 is a complete three-lap, one-track, three-racer race: start a run, drag to steer, race two deterministic CPU rivals, cross the finish, and race again. Track geometry, craft geometry, and the visual treatment are procedural and original prototype content.

## Requirements and run

- Node.js 20.19+ (or 22.12+)
- npm
- A modern browser with WebGL 2 support

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Run `npm run build` for the production bundle or `npm run preview` to serve that bundle locally. The developer track editor is available at `/editor.html`.

## Track editor and minimap

Open `/editor.html` to drag the top-down route points, edit point heights, road width, and horizontal scale. **Save to Game** stores the definition in browser `localStorage`; reloading the race reads it and rebuilds the same Three.js track. **Reset** removes the browser override. The race HUD includes a read-only minimap generated from the active track curve. This integration changes track data presentation/loading only; ship physics, input, opponents, and race flow remain in the existing gameplay path.

## Play

Press **Start Race** to begin. The race starts the bundled custom techno track `public/audio/tracks/track_002.mp3`; browser audio begins from that user gesture and stops at the finish. The analyser now uses stronger kick/bass sensitivity, faster attack, and a steadier release; kick hits and bass energy visibly drive the engine glow much harder. Forward travel cruises automatically at 2,340 km/h (65 world units/second). Drag left or right anywhere on the scene to steer; while holding, keep your finger in the upper half of the screen to accelerate up to 30% above cruise, or in the lower half to brake down to 30% below cruise. Release to return toward cruise speed and recenter steering. Up/down arrows or W/S provide keyboard throttle and braking; left/right arrows or A/D steer. The HUD reports current speed, status, lap, and live position in the three-racer field. Two CPU rivals follow fixed lane neighborhoods at 72.5 and 78.5 world units/second, leaving a tighter field where clean steering and active throttle matter; they have no collision system or advanced track-aware strategy. Leaving a downward-facing crest can give the craft a slightly stronger, longer arcade-style lift under reduced gravity; steering slides more while airborne. The three laps end at the start/finish gate, and the result panel records final position/time and offers **Race Again** without reloading the page.

This extended/elevated layout has not yet been exercised through an interactive browser race. The earlier touch-emulation checks apply to the baseline 0.1 build only; steering, course readability, finish/results/retry, and representative physical-device feel on the new layout still need playtesting. The chase camera now follows closely (3.6 units behind, 1.72 above) and aims 9 units ahead, with a slightly wider view on mobile. Its visual framing still needs interactive browser/device playtesting. See `docs/CURRENT_STATUS.md` for the current verification boundary and `docs/CURRENT_TASK.md` for the remaining check.

## Project map

- `src/game.js` — Three.js setup, camera follow, input, race lifecycle, and render loop
- `src/track.js` — track geometry generation and track-frame helpers
- `src/track-data.js` — Neon Causeway centerline and width
- `src/craft.js` — procedural player craft
- `src/style.css` — responsive start/results, HUD, and page presentation
- `docs/GDD.md` — product direction and staged release goals
- `docs/CURRENT_TASK.md` — active task (if any)
- `docs/archive/` — completed task records
