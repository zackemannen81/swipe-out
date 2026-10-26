# Swipe-out

Swipe-out is a Three.js anti-gravity racing prototype with three-lap races against
four CPU opponents, twelve built-in circuits, custom track import/export and a
3D editor. The newest two circuits test real gaps and magnetic loops/barrel-rolls.

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

Open `/editor.html` (or **Track Editor** in the game) for the 3D authoring view.
Drag empty space to orbit, right-drag to pan and scroll to zoom. Click a control
point, then drag its colored axes; green changes height. **Focus Selection** zooms
to a point or scenery object. Numeric coordinates, width/scale and insert/delete
remain available. Undo/redo also supports Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z outside
text fields. Switching tracks retains each draft until the editor is closed.

**Download** and **Copy JSON** produce version 2 `swipe-out-track` JSON files.
**Import JSON as New Track** accepts these files, version 1 and older plain JSON exports,
validates before changing the editor, and creates a separate unsaved custom track.
The imported file never replaces an existing track. Embedded image textures travel
with the JSON; local image paths and HTTPS URLs remain references to those assets.
Import supports files up to 16 MB; browser storage may fill sooner. If saving
fails, download the draft to keep it. Version 2 adds magnetic road, bank angles
and gaps. Version 1 and legacy tracks keep their original behavior until magnetic
road is explicitly enabled. Branches are a later stage.

**Save to Game** stores this track in this browser. **Save & Test** saves and opens
a game tab with that exact track selected; press Start Race to begin. Saved custom
tracks also appear in the normal race selector, using Neon Causeway's music and
backdrop. **Restore Built-in** resets only the selected built-in track; **Remove
Custom** removes only that custom track, with a confirmation. Unrelated tracks are
kept. The editor preview uses game geometry with editing lights/guide lines, not
the game's bloom/audio animation. Scenery remains decorative, as before.

The agreed development sequence and completion checklists live in
[docs/TRACK_ROADMAP.md](docs/TRACK_ROADMAP.md). Stages 3 and 4 now have playable test tracks.
Run `node --test tests/*.test.js` for regression checks. The optional browser
acceptance script `node tools/verify-track-editor.mjs` requires Playwright, a local
Chrome installation and a running Vite server. Set `PLAYWRIGHT_MODULE` to an
external `playwright/index.mjs` if it is not installed in this project; screenshots
are written to the temporary directory `swipe-out-track001` by default.

## Gaps, banked turns, rolls and loops

Select **TEST · Gap Run** (`/?track=track11`) or **TEST · Loop & Roll**
(`/?track=track12`) in the race or editor. The original ten circuits remain available.
Gap Run has an orange takeoff lip and green landing beacons. Hold throttle and keep
a straight approach; insufficient speed or a sideways miss causes **RECOVERING**
and a short reset before the ramp. Air control is deliberately limited. All CPU
craft launch, land and recover through the same physics as the player.

Loop & Roll combines a vertical loop, a full barrel-roll and banked turns.
Magnetic road keeps craft attached to continuous track, even upside down. The
camera follows the track's local up direction; gaps detach into world-space flight
under downward gravity. These are prototype circuits for testing readability and
comfort, not finished production environments.

In the editor, enable **MAGNETIC ROAD · LOOPS & GAPS**. Select points and set
**BANK / ROLL (°)**: `0 → 90 → 180 → 270 → 360` makes one complete roll; keep
360 on subsequent points to avoid rolling back. Change XYZ/height to shape a
vertical loop; **SIDE VIEW** and **FOCUS SELECTION** help inspect it.
**+ GAP AT SELECTED POINT** removes a span of road. Adjust its start/end as
percentages of lap length or remove it. Orange guide segments show missing road.
Point edits change lap length, so recheck gaps after reshaping the track. Save,
undo/redo, import/export and Save & Test include these settings. The validator
checks structure and spacing; it cannot guarantee an authored jump is achievable.

Flight tuning is in `src/gap-flight.js` (`FLIGHT`), magnetic camera offsets in
`src/track-camera.js`, and both test layouts in `src/track-labs.js`.
`node tools/verify-track-features.mjs` checks the new editor/race flows using the
same browser prerequisites as above; captures go to temporary `swipe-out-track002`.

## Play

Choose a track and press **Start Race**. After the countdown, use up/down arrows
or W/S for throttle/braking and left/right arrows or A/D to steer. Q/E apply the
individual airbrakes. On touch, drag horizontally to steer and vertically for
throttle/braking. The HUD shows speed, lap and position among five racers. Drive
over boost pads for extra speed; walls and craft impacts cost momentum. Finish
three laps to see results and use **Race Again** to restart. Music begins from the
start gesture, and C cycles camera modes.

Original tracks retain crest-triggered arcade lift. Magnetic tracks hold craft
on continuous road and use free flight at gaps. Automated physics and browser
checks cover the implemented flows; human balance, camera comfort and physical
phone performance still need playtesting. See `docs/CURRENT_STATUS.md` for evidence
and `docs/TRACK_ROADMAP.md` for the remaining stages.

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
