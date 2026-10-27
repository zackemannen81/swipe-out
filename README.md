# Swipe-out

Swipe-out is a Three.js anti-gravity racing prototype with three-lap races against
four CPU opponents, fifteen built-in circuits, custom track import/export and a
3D editor. Test circuits cover gaps, loops, alternative routes and optional combat.

## Requirements and run

- Node.js 20.19+ (or 22.12+)
- npm
- A modern browser with WebGL 2 support

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Run `npm run build` for the production bundle or `npm run preview` to serve that bundle locally. The developer track editor is available at `/editor.html`.

## Time Attack

Select **EVENT → Time Attack · solo** for an out lap and three flying laps,
without CPU racers, combat or catch-up. Personal bests, sectors and a recorded
transparent ghost persist per track revision/ship/speed/handling/assist category.
Optional racing-line and corner-warning guides help learn the circuit. The line
is a geometric recommendation, not a guaranteed optimal lap. Pause → **End Time
Attack** keeps completed valid records and discards the unfinished attempt.
See [the Time Attack guide](docs/TIME_ATTACK.md) and the approved
[product roadmap](docs/PRODUCT_ROADMAP.md). Run `node --test tests/*.test.js` for
regressions and `node tools/verify-time-attack.mjs` for browser acceptance.

## Ion Foundry — complete circuit

Choose **Ion Foundry** (`/?track=track15`): a 5.8 km industrial circuit with two
gaps, banked corners, technical S bends, a vertical reactor loop and the narrow
Needle Skyway shortcut. Take the **left** approach lane at its amber fork. Keep
throttle through the jumps. All four CPU racers use the same road and flight rules.
The environment contains 656 editable primitives and optimized versions of the
user's textures. Open `/editor.html?track=track15` to customize it.
See [the track guide](docs/ION_FOUNDRY.md) for sectors, assets and tuning.
`node tools/verify-foundry.mjs` runs its browser acceptance checks.

## Track editor and minimap

Open `/editor.html` (or **Track Editor** in the game) for the 3D authoring view.
Drag empty space to orbit, right-drag to pan and scroll to zoom. Click a control
point, then drag its colored axes; green changes height. **Focus Selection** zooms
to a point or scenery object. Numeric coordinates, width/scale and insert/delete
remain available. Undo/redo also supports Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z outside
text fields. Switching tracks retains each draft until the editor is closed.

Select scenery and use **CLONE OBJECT** or Ctrl/Cmd+D outside text fields. The
copy gets a new ID and a small sideways offset, preserves all properties/textures,
and is selected for moving. Editing it does not change the source. Cloning works
with undo/redo, save/reload and import/export.

**Download** and **Copy JSON** produce version 3 `swipe-out-track` JSON files.
**Import JSON as New Track** accepts these files, versions 1/2 and older plain JSON exports,
validates before changing the editor, and creates a separate unsaved custom track.
The imported file never replaces an existing track. Embedded image textures travel
with the JSON; local image paths and HTTPS URLs remain references to those assets.
Import supports files up to 16 MB; browser storage may fill sooner. If saving
fails, download the draft to keep it. Version 2 added magnetic road, bank angles
and gaps; version 3 adds connected alternative routes. Version 1 and legacy tracks
keep their original behavior until magnetic road is explicitly enabled.

**Save to Game** stores this track in this browser. **Save & Test** saves and opens
a game tab with that exact track selected; press Start Race to begin. Saved custom
tracks also appear in the normal race selector, using Neon Causeway's music and
backdrop. **Restore Built-in** resets only the selected built-in track; **Remove
Custom** removes only that custom track, with a confirmation. Unrelated tracks are
kept. The editor preview uses game geometry with editing lights/guide lines, not
the game's bloom/audio animation. Scenery remains decorative, as before.

The agreed development sequence and completion checklists live in
[docs/TRACK_ROADMAP.md](docs/TRACK_ROADMAP.md). All six stages now have playable implementations; human balance/comfort checks remain open.
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

### Control mode and camera follow

The start screen offers **Swipeout** (existing assist/mobile handling, default)
and **Wipeout** (nose-led steering, momentum, countersteer and independent airbrakes).
**Camera Follow** can match the control mode or independently select the previous
Swipeout follow / new Wipeout-inspired heading camera. Choices persist locally.
V/C and CAMERA still choose the view. Wipeout gamepad controls use A/Cross for
thrust and L1/R1 or analog L2/R2 for airbrakes; Q/E are keyboard airbrakes.
See [DRIVING_MODES.md](docs/DRIVING_MODES.md) for source comparison, adaptation
limits and tuning. This is a first playable handling profile for human comparison.

### Alternative routes

Choose **TEST · Split Decision** (`/?track=track13`). Before the amber junction,
move to the side indicated by the route hint: **LEFT** selects Needle Shortcut on
this circuit. Stay on the other side or near the center for the wider main road.
Once you enter, steer normally and center on the narrower deck. The shortcut is
about 535 world units versus the main section's 687; its seven-unit width makes
clean steering more demanding. HUD/minimap highlight the route until the merge.
CPU drivers use both routes across laps. Actual physical route length determines
travel time; common section progress determines rank, checkpoints and catch-up.

In the editor, select a main-road point with magnetic road enabled and use
**+ BRANCH AT SELECTED POINT**. Choose the route in the inspector, edit START/END
percentages, approach side and width, and drag its intermediate points with the
same XYZ handles. Numeric point coordinates and insert/delete work on the selected
route. Endpoints attach automatically to the main road, including their orientation.
Save & Test and v3 sharing preserve all of it. The first version supports up to four
separate split/merge intervals; nested routes and gaps within branches are rejected.

### Optional combat

Enable **COMBAT MODE** before starting a race; it defaults off. Try
**TEST · Crossfire Circuit** (`/?track=track14`) for open sightlines. All tracks
can use the mode. **Space** or hold **FIRE** shoots; **1 / 2 / 3** or the HUD
buttons choose rocket, homing missile or minigun. On touch, FIRE is independent
of the steering/throttle controls.

| Weapon | Clip | Fire interval | Empty-clip reload |
| --- | ---: | ---: | ---: |
| Rocket | 6 | 0.7 s | 5 s |
| Homing | 4 | 1.1 s | 7 s |
| Minigun prototype | 50 | 0.11 s | 4 s |

Homing requires 0.9 seconds of continuous forward aim, clear sight and a target
within 280 world units. The reticle and lock meter show the selected target;
ENEMY LOCK / INCOMING MISSILE warns of threats. Steering out of the firing line
or breaking sight can avoid shots. Road/scenery block projectiles. Hits reduce
actual speed and apply lateral impulse, with short shared hit protection.
CPU craft use the same ammunition, locking and hit rules. There is no elimination
or health bar. Pause freezes combat; retry refills clips and clears shots/locks.
Weapons and effects are a playable balancing prototype, not final competitive tuning.

Weapon values live in `src/combat.js`; route/combat circuits in `src/track-labs.js`.
`node tools/verify-routes-combat.mjs` checks clone/route authoring and race/combat
flows with the browser prerequisites above; captures go to temporary `swipe-out-track003`.

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
