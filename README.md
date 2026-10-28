# SwipeOut2026

A browser-based anti-gravity racer built with Three.js and Vite. Race four CPU
pilots, chase your own ghost in Time Attack, or build circuits in the integrated
3D editor. Choose assisted touch-friendly handling or a Wipeout-inspired profile
with nose steering, momentum and independent airbrakes.

**Current playable development build · 27 October 2026.** Fifteen built-in tracks,
one selectable player craft (**Racer**) and one speed class (**Standard**).
Cup progression and selectable CPU difficulty are still planned.

## Run locally

Requirements: Node.js **20.19.x or later in the 20.x line, or 22.12+**, npm, and a
modern browser with WebGL 2 support.

```sh
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. Select a track,
event and control mode, then start. Audio starts after the user gesture.

- Game: `/` — add `?track=track15` to select Ion Foundry.
- Editor: `/editor.html` — also available through **Track Editor** in the game.
- Production build: `npm run build` writes `dist/`.
- Local production preview: `npm run preview` after building.

## Events

| Mode | Session | Opponents and rules |
| --- | --- | --- |
| Race | Three laps, then results and retry | Four CPU opponents; boost pads, impacts and mild catch-up; optional combat |
| Time Attack · solo | One out lap, then three flying timed laps | No CPU craft, combat or catch-up; personal bests, sectors and recorded ghost |

### Time Attack

Timing begins when you cross the start line after the out lap. The HUD shows the
current lap, personal best, three sectors and a signed time delta against your PB
at matching track progress. Results include lap validity, sector times and record
improvement.

- **PB ghost:** a transparent, non-colliding craft replays the actual recorded
  positions and orientations of your best lap, including shortcuts, loops and gaps.
- **Racing line:** optional guidance with cyan flow, amber lift and pink braking
  sections. It estimates a useful line and route; it is not a proven fastest line
  or automatic steering.
- **Corner warnings:** optional speed-sensitive sharp-turn warnings; gap warnings
  take priority.
- **Validity:** a missed-gap recovery invalidates the current lap. Wall contact
  costs speed but does not itself invalidate a lap. Incomplete laps, failed timing
  gates and laps over ten minutes cannot become records.
- **Early finish:** Pause → **End Time Attack** retains completed valid records and
  discards the unfinished lap. Retry begins a fresh out lap.

Records are separated by track revision, ship, speed class, top speed, control
mode, effective assist and physics version. Camera and guide choices do not split
records. Track edits, including scenery changes, create a new track revision.
The latest Wipeout wall-response fix uses a new physics category: previous
Wipeout records remain stored, but are not compared with new laps. Swipeout
records are unaffected.

See [Time Attack](docs/TIME_ATTACK.md) for timing, replay and storage details.

## Driving and cameras

**Swipeout** is the default profile, with High/Medium/Low assist and touch-oriented
handling. **Wipeout** uses angular acceleration, delayed sideways momentum,
countersteering and separate airbrakes. It adapts the reference handling principles
to this game's track physics; it is not a complete port of the original physics.

In Wipeout, steering turns the nose. Releasing steering gradually stops rotation,
but does not automatically straighten the nose or center the craft. After steering
away from a rail, countersteer to point along the road. The latest wall response
limits rebound and removes the extra rotation kick that previously caused
wall-to-wall pinball; speed loss and visible impact remain.

**Camera Follow** independently selects **Match control mode**, **Swipeout** or
**Wipeout**. The Wipeout chase camera follows the nose while limiting craft-roll
sway; it still follows the road's banking and inversion. V/C or the CAMERA button
cycles views. Control mode, assist and camera-follow preferences persist locally.

| Keyboard | Action |
| --- | --- |
| A / D or ← / → | Steer; nose steering and countersteering in Wipeout |
| W or ↑ | Throttle |
| S or ↓ | Brake / both airbrakes |
| Q / E | Left / right airbrake |
| R / F | Pitch |
| V / C | Cycle camera view |
| Esc | Pause |
| Space | Fire in combat mode |
| 1 / 2 / 3 | Rocket / homing missile / minigun |

**Touch:** drag horizontally to steer and vertically for throttle/braking, or use
the steering zone and gas/brake pedals. On-screen camera, pause and combat controls
are available. Optional gyro input depends on device support and permission.

**Gamepad in Wipeout:** left stick or D-pad steers, A/Cross provides thrust,
L1/R1 or analog L2/R2 apply separate airbrakes, and vertical left stick controls
pitch. Swipeout retains its existing gamepad mapping; the mappings differ.

See [Driving modes](docs/DRIVING_MODES.md) for detailed controls and tuning.

## Tracks and race systems

The library includes the original ten circuits, four mechanic test circuits and
**Ion Foundry**, an industrial environment built with textured, editable primitives.

| Track ID | Circuit | Focus |
| --- | --- | --- |
| `track11` | TEST · Gap Run | Takeoff, landing and missed-gap recovery |
| `track12` | TEST · Loop & Roll | Vertical loop, barrel roll and banked turns |
| `track13` | TEST · Split Decision | Narrow shortcut versus wider main route |
| `track14` | TEST · Crossfire Circuit | Combat practice and open sightlines |
| `track15` | Ion Foundry | Two gaps, banked corners, technical S bends, reactor loop and Needle Skyway shortcut |

For Ion Foundry, take the **left** approach lane at the amber fork to enter the
narrow elevated shortcut. Keep throttle through the jumps. Open
`/editor.html?track=track15` to edit its scenery and layout. See the
[Ion Foundry guide](docs/ION_FOUNDRY.md) for sectors, textures and driving notes.

Magnetic tracks keep craft attached through banks, rolls and loops; gaps detach
craft into world-space flight with limited air control. Original non-magnetic
tracks retain their crest-triggered arcade lift. Alternative routes split and
merge with the main road: physical route length determines travel time, while
shared race progress determines timing gates and position.

### CPU racers, impacts and catch-up

Vanta, Kestrel, Orca and Nexus-9 have different speed caps, acceleration, mass and
driving profiles. They brake, steer, seek boost pads, react to traffic, choose
routes and can make mistakes or hit walls. Boost pads and craft collisions affect
actual motion. Wipeout has its own tuned rail response; Swipeout and CPU craft
retain their existing wall behavior.

The player's normal top-speed setting is **143 world units/s**, before boosts or
catch-up. CPU normal caps are **129, 130, 135 and 136**. These are internal physics
values, not the scaled HUD speed readout. Profiles live in
[src/opponents.js](src/opponents.js).

Race catch-up grants both the player and CPU racers up to **8%** extra attainable
top speed. It begins at an estimated two-second gap to the leader, reaches its full
target at eight seconds and smooths changes over time. Acceleration, braking and
impact losses still apply; there is no negative leader penalty. Tune `CATCH_UP` in
[src/catch-up.js](src/catch-up.js); set `maxBonus` to `0` to disable it. Time Attack
always disables catch-up.

### Optional combat

Enable **Combat Mode** before a Race; it defaults off and is disabled in Time
Attack. Rockets, lock-on homing missiles and a minigun use clips and automatic
empty-clip reloads. Hold Space or **FIRE**, and select weapons with 1/2/3 or HUD
buttons. Homing needs sustained forward aim and clear sight; the HUD shows target
lock and incoming threats.

Road and scenery block shots. Hits reduce speed and apply sideways impulse;
there is no health bar or elimination. CPU craft use the same ammunition, lock
and hit rules. Wipeout aims with the nose. Weapon balance remains a playable
prototype; tuning lives in [src/combat.js](src/combat.js).

### Presentation

All active racing craft have paired white/cyan plasma thrusters with continuous
particles and a fading world-space wake. Idle exhaust stays visible; throttle and
boost increase output smoothly. Tune the active effect in
[src/thrusters.js](src/thrusters.js); the older particle experiments are not used
by the game. Track backdrops, music, bloom, HUD effects and existing race/combat
sounds accompany the races; richer sound feedback remains on the roadmap.

## 3D track editor and sharing

Open **Track Editor** or `/editor.html`. Orbit by dragging empty space, pan with
right-drag, and zoom with the wheel. Select a point or scenery object to use XYZ
handles, numeric properties and **Focus Selection**. Side/top views help with
height changes and loops.

- Shape control points, road width, height and bank/roll angles; enable
  **Magnetic Road · Loops & Gaps** for magnetic layouts.
- Add gap intervals and connected alternative routes. Up to four non-overlapping
  branches are supported; nested routes and gaps inside branches are not.
- Build scenery with primitives, materials, textures and animations. Scenery is
  decorative for ship movement, though it can block weapons.
- **Clone Object** or Ctrl/Cmd+D duplicates selected scenery with independent
  properties and a small offset. Undo/redo uses Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z
  outside text fields.
- **Save to Game** persists the selected track locally. **Save & Test** saves and
  opens the game with that track selected. **Restore Built-in** resets only the
  selected built-in track; **Remove Custom** removes the selected custom track.
- **Download** and **Copy JSON** export version 3 `swipe-out-track` documents.
  **Import JSON as New Track** also accepts v1/v2 and older plain JSON exports,
  validates them, and creates a separate unsaved track without replacing others.

The import limit is **16 MB**. Embedded image textures travel with the JSON;
local paths and HTTPS image URLs remain references and need their assets available
separately. Export backups before clearing browser data or moving to another device.
If local saving fails, download the draft to preserve it.

The editor uses game geometry with editing lights and guides, rather than the
full race presentation. Validation checks structure; authored gaps and routes
still need driving tests. See the [track development record](docs/TRACK_ROADMAP.md).

## Local data

Tracks, driving/camera preferences, Time Attack options and records use browser
storage. They are local to the browser and site origin, with no cloud sync.
Changing hostname or port can make a different storage area visible. Clearing
site data removes locally saved content.

Time Attack ignores malformed records with a warning. If storage is unavailable
or full, a best lap can remain available for the current session but will not
survive reload unless saved successfully. Track JSON export is a track backup,
not an export of personal-best records or settings.

## Development and verification

```sh
node --test tests/*.test.js
npm run build
```

The repository uses Node's built-in test runner; there is no `npm test` script.
Tests cover racing, catch-up, thrusters, track formats, flight, routes, combat,
Foundry, handling, timing, records and replay.

Optional browser acceptance scripts require a running Vite server on port 5173,
local Chrome and a separately available Playwright installation. Playwright is
not included in `package.json`; set `PLAYWRIGHT_MODULE` to the absolute path of
an external `playwright/index.mjs` when needed.

```sh
node tools/verify-track-editor.mjs
node tools/verify-track-features.mjs
node tools/verify-routes-combat.mjs
node tools/verify-foundry.mjs
node tools/verify-driving-modes.mjs
node tools/verify-time-attack.mjs
```

Scripts write captures into task-specific directories under the system temporary
folder. See [Current status](docs/CURRENT_STATUS.md) for dated evidence and limits.
The latest recorded gameplay verification, **DRIVE-002 on 27 October 2026**, passed
**71 Node tests** and the production build. The existing large-chunk warning
remains. Browser flows were verified in earlier stages; the wall fix did not
receive a new browser or physical-device playtest. This README refresh changes
only documentation.

## Project guide

| Location | Responsibility |
| --- | --- |
| [src/game.js](src/game.js) | Game setup, input, race lifecycle and render loop |
| [src/craft.js](src/craft.js) | GLTF craft loading and presentation |
| [src/ship-physics.js](src/ship-physics.js) | Shared ship motion and track integration |
| [src/classic-handling.js](src/classic-handling.js) | Wipeout-inspired handling |
| [src/classic-camera.js](src/classic-camera.js) | Wipeout-inspired camera follow |
| [src/race-interactions.js](src/race-interactions.js) | Boost pads, craft contacts and rail response |
| [src/track-library.js](src/track-library.js) | Built-in/custom track library and persistence |
| [src/track.js](src/track.js) | Track and scenery geometry |
| [src/time-attack.js](src/time-attack.js) | Timing, validity, record storage and replay data |
| [src/lap-ghost.js](src/lap-ghost.js) | Recorded PB ghost presentation |
| [src/racing-guide.js](src/racing-guide.js) | Recommended line and turn warnings |
| [docs/CURRENT_TASK.md](docs/CURRENT_TASK.md) | Active task and acceptance criteria |
| [docs/TASK_WORKFLOW.md](docs/TASK_WORKFLOW.md) | Docs-first contribution workflow |
| [docs/SYSTEMDOC.md](docs/SYSTEMDOC.md) / [docs/GDD.md](docs/GDD.md) | System direction and game design |
| [docs/FILESTRUCTURE.md](docs/FILESTRUCTURE.md) | Detailed repository map |
| [docs/JOURNAL.md](docs/JOURNAL.md) / [docs/archive](docs/archive/) | Development history and completed tasks |

Begin repository work in `docs/CURRENT_TASK.md`. Intended product goals in design
documents are not evidence that a feature is already implemented.

## Next steps and current limits

The expanded [product roadmap](docs/PRODUCT_ROADMAP.md), updated 28 October 2026,
adds race intro/results, track tools, combat countermeasures and weapon pickups,
ship unlocks and animated menus. It recommends starting with results layout and
a camera intro while preserving the existing countdown. The longer-term goals
following the completed handling and Time Attack stages include:

1. **Rookie / Pilot / Elite CPU difficulty:** precision, braking, overtaking,
   shortcut decisions and risk profiles.
2. **A three-track cup:** points, final standings, medals and unlockable liveries.
3. **Richer audio and feedback:** engine load, airbrakes, rail scraping, landings
   and clearer race/result cues.
4. **Presentation and performance:** track previews, clearer ship selection,
   expanded saved settings, a separate test-track category, graphics options,
   adjustable shake/bloom and measurements on physical phones.

These stages are planned, not current menu features. Combat balance, custom-track
guidance and camera/ghost comfort still need human playtesting. A simulated mobile
viewport does not establish physical-phone performance.
