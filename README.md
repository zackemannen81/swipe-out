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

## CPU driving and collisions

The four opponents now accelerate, brake, steer through inertia, seek boost pads
and react to traffic. Each uses its own profile in `src/opponents.js`:

| Driver | Normal speed cap | Acceleration setting | Mass | Character |
| --- | ---: | ---: | ---: | --- |
| Vanta | 129 | 24 | 1.05 | Moderate speed and precision |
| Kestrel | 130 | 31 | 0.90 | Quick acceleration and reactions |
| Orca | 135 | 21 | 1.30 | Heavy, slower recovery and wider lines |
| Nexus-9 | 136 | 27 | 1.00 | Highest top speed, less precise than Kestrel |

Speed is in world units/s; acceleration in world units/s² before throttle/drag.
The player's normal speed cap is 133. The current user-tuned CPU profiles above
combine with the shared mild catch-up described below. These are tuning values for
playtesting, not a claim of final difficulty balance.

All racers use the same physical boost-pad, wall and collision rules in
`src/race-interactions.js`. Impacts change both craft's real motion and persist
after the next render. Normal player controls and accepted thruster tuning remain.
Run `node --test tests/*.test.js` for racing and exhaust regression checks.

## Catch-up tuning

Edit `CATCH_UP` at the top of `src/catch-up.js`:

- `startGapSeconds: 2` — no target bonus within this estimated gap to the leader
- `fullGapSeconds: 8` — full target bonus at this gap or farther behind
- `maxBonus: 0.08` — up to 8% additional top speed, for player and CPU alike
- `smoothingSeconds: 1.5` — exponential response time; about 95% of a change in 4.5 seconds

Gap is accumulated race-distance difference divided by the leader's unboosted
normal top speed, an estimate rather than a measured timing split. Laps count;
instantaneous leader braking/boost does not change that reference speed. The
target uses a smooth curve between 2 and 8 seconds, and its rise/fall is damped.
A former leader/follower can retain a fading bonus briefly when positions change.

Catch-up raises the attainable cap and CPU speed demand; acceleration still builds
the actual speed. Normal braking, cornering, traffic limits and collision losses
apply. Physical boost-pad multipliers combine with the adjusted cap. There is no
negative leader penalty. Pause freezes the bonus, restart clears it, and outside
active racing it fades out. Set `maxBonus` to `0` to disable the speed allowance.

## Thruster effects

All five craft use paired white/cyan plasma exhaust with fine particles and a
world-space wake that fades behind them. Idle remains visible; throttle and boost
smoothly increase the output. CPU exhaust follows its existing speed demand.
Tuning and shaders live in `src/thrusters.js`. The earlier particle/shader
experiments are retained but are no longer imported by the game.

Run `node --test tests/thrusters.test.js` for emission/lifecycle regression checks.
Desktop WebGL and a landscape mobile viewport were checked; physical-device
performance still needs playtesting. See the dated current-status entry for evidence.

## Project map

- `src/game.js` — Three.js setup, camera follow, input, race lifecycle, and render loop
- `src/track.js` — track geometry generation and track-frame helpers
- `src/track-data.js` — Neon Causeway centerline and width
- `src/craft.js` — procedural player craft
- `src/style.css` — responsive start/results, HUD, and page presentation
- `docs/GDD.md` — product direction and staged release goals
- `docs/CURRENT_TASK.md` — active task (if any)
- `docs/archive/` — completed task records
