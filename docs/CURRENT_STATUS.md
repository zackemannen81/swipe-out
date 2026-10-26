# Current Status

## 2026-10-26 — TRACK-003: scenery cloning, alternative routes and optional combat

The user gave positive feedback on gaps/loops and authorized the final two roadmap
stages plus object cloning. Fourteen built-ins now include TEST · Split Decision
(track13) and TEST · Crossfire Circuit (track14). The previous twelve remain.

Editor CLONE OBJECT / Ctrl/Cmd+D creates an independent scenery copy with a new ID,
visible offset, retained texture/transform/animation/material properties and normal
undo/redo/save/export. Version 3 adds validated sequential split/merge branches;
v1/v2/plain legacy files still load. The branch inspector authors start/end lap
percentages, name, side and width. Intermediate points use the 3D gizmo, numeric
coordinates and insert/delete; endpoints follow the main road automatically.

Racers choose a branch by approach lane, lock it until merge, and use the branch's
actual world length for travel. Common section distance drives rank, checkpoints
and catch-up. Ordered shared gates prevent skipped sectors from awarding a finish.
The approximately 535-unit, seven-wide Needle Shortcut replaces a 687-unit,
twenty-wide main section. Each CPU uses both routes across the three laps. Route
pads, local-width walls, world contacts, magnetic camera and minimap/HUD respect
the choice. Gaps cannot overlap branches; recovery after a recent fork uses the
shared road after the merge if the nominal run-up would land inside the fork.

COMBAT MODE defaults off and works on any circuit. Rocket/homing/minigun share
clip/cooldown/reload rules across player and CPU; clips are 6/4/50 and empty-clip
reloads 5/7/4 seconds. Homing needs 0.9 s of continuous forward visibility within
280 world units, uses a limited turn rate, and displays target reticle plus lock
and incoming warnings. Swept projectile/hull tests include target motion. Road
and scenery obstruct sight/shots. Hits persist in speed/lateral velocity (including
flight); short hit protection limits repeated stagger. No health or elimination.
Space/hold FIRE shoots; 1/2/3 and buttons select weapons. Effects use fixed-capacity
instancing (48 projectiles, 24 bursts), with synthesized firing sounds. Pause
freezes simulation; finish clears shots and retry resets ammo, locks and impacts.

Verification: all 44 Node tests pass. Nine new tests cover v3 topology/migration,
frame-continuous endpoints, real route-time savings at 30/60/120 Hz, route pad
ownership, gate rejection, equal-progress catch-up, safe recovery after merges,
all four CPUs completing three laps on both paths with contacts/pads, swept hits,
dodges/occlusion, sustained homing lock, warning, clip/reload/rate limits,
hit protection, bounded resources and combat pause/finish/reset/airborne impulses.
Chromium WebGL verifies cloning properties/textures/identity and independence,
undo/redo/save/reload/export, branch editing/creation/removal/import/export,
a controlled player fork-to-merge traversal and matching minimap/HUD, actual
keyboard rocket fire/hit, homing lock/fire/hit, pointer-held minigun, CPU firing
and player damage, pause, finish/retry and landscape layout. The existing editor
acceptance suite passes its real mouse gizmo and custom-track save/test flow too.
Final browser runs report no JS errors or failed requests. Inspected desktop and
landscape captures in temporary swipe-out-track003. Build/syntax/diff checks pass;
the existing Vite large-chunk warning remains.

Limits: at most four separate, non-nested branches, without gaps inside branches.
Branch bank angles are transported from its attachments; explicit per-branch bank
authoring is not included. Canonical catch-up is still an estimated leader gap,
not a true timing split. Weapon clips reload automatically; there are no pickups.
Minigun/effects are playable prototypes. Human weapon/shortcut balance, sound mix,
touch comfort and physical-device performance remain unverified. The positive
user feedback does not establish those new checks or a physical mobile test.

## 2026-10-26 — TRACK-002: gaps, magnetic banks, barrel-rolls and loops

Roadmap stages 3 and 4 are implemented for playtesting. The catalog now has twelve
built-ins: the original ten plus TEST · Gap Run (track11) and TEST · Loop & Roll
(track12). Original tracks keep their previous geometry, physics and tuning.
The new circuits are deliberately simple mechanic prototypes using existing
background/music assets. Branches and weapons remain unimplemented.

Version 2 JSON adds optional magnetic road, per-control-point bank degrees and
normalized gap intervals. Version 1 and plain legacy imports retain their old
behavior; legacy fourth-coordinate metadata is inactive unless magnetic road is
enabled. Editor controls include magnetic enable, bank/roll, gap start/end/remove,
orange guide segments and side view, integrated with validation/history/save/test.
Gaps stay at lap percentages when the spline changes; authors must recheck takeoff
and landing after reshaping. Validation checks data, not whether a jump is possible.

The shared transported frame remains continuous through vertical/inverted track,
bank winding and the closed seam. Road, rails, markers, pads, craft and AI use it.
Magnetic decks are opaque with subdued emission so they remain visible upside
down; authored decorative objects keep world-space transforms. The magnetic camera
follows local up and snaps on recovery; the legacy camera remains unchanged.

Gaps remove real road triangles and fixtures. Orange/green lips mark departure
and landing. Player/CPU launch at the exact edge with world momentum, downward
gravity and limited sideways air control. Local surface projection supplies race
progress and swept landing; it never constrains the flight position. Misses reset
70 units before takeoff (adjusted if an earlier gap occupies that point), with a
0.65-second recovery hold and no collision sweep across the teleport. Airborne
craft cannot collect pads or hit invisible spline walls. Air-to-air impulses affect
actual velocity. Checkpoints/finish wait for ground contact; race reset clears
flight state. CPU drivers center and build speed before gaps.

Verification: all 35 Node tests pass. New tests cover 100/129/140/210-speed landings,
low-speed/sideways misses, real gravity, pause, airborne contacts, fixture removal,
8,192 continuous frame samples, camera clearance, closed seams and 30/60/120 Hz.
All four CPUs complete three laps on both circuits with real pads and collisions.
Chromium WebGL passed the actual new editor controls and v2 export/import, player
and four-CPU jump/landing, paused-flight freeze, controlled failed jump/recovery,
reload reset, actual vertical-loop traversal and a controlled inverted barrel-roll
view. The existing 3D editor acceptance script also passes mouse gizmo manipulation,
history, legacy authoring, custom export/import/save-and-test, invalid-file
preservation, reset/reload and landscape layout. Screenshots are inspected in
temporary swipe-out-track001/002; no browser JS errors or failed requests.
Production build, syntax and whitespace checks pass; existing Vite chunk warning.

Limits: magnetic adhesion is intentional arcade behavior, not a force simulation.
Landing checks the nearby intended road, not arbitrary intersecting surfaces or
decorative scenery. Gap Run is a straight jump; unusual user-authored curved or
inverted jumps need their own testing. The minimap remains a top-down centerline
projection. Human readability/comfort, final difficulty and physical-device
performance remain open; stage 4's human playtest checkbox is intentionally unset.

## 2026-10-26 — TRACK-001: versioned track sharing and initial 3D editor

The approved six-stage expansion is tracked in TRACK_ROADMAP.md. Stages 1 and 2
are implemented; gaps, banking/twists/loops, branches and weapons remain planned.
The older historical records below retain their original scope and limitations.

Game/editor now share validated loading through track-format.js and track-library.js.
Version 1 exports use a swipe-out-track envelope; old plain JSON files and both
legacy storage keys load through the same migration. Every shipped track keeps its
original centerline and scenery. Imported files become separate unsaved custom
tracks, and saved customs appear in the game selector. Invalid files/future versions
are rejected before draft/storage changes; corrupt saved entries fall back safely.
Save/reset target one library entry; storage failure offers download recovery.

The editor uses the actual game road and scenery meshes in an orbit/pan/zoom 3D
view. Point selection and XYZ handles, numeric height/coordinates, width/scale,
point insertion/deletion, scenery translation/properties, undo/redo and per-track
drafts are connected. History is bounded by count and approximate string memory.
Save & Test opens the selected saved track in a game tab; Start remains disabled
while asynchronous craft assets initialize. Existing CPU, handling, catch-up and
thruster behavior is preserved, including the user's concurrent speed calibration.

Verification: 26 Node tests pass. Seven new regressions include exact geometry,
curve length and boost placements for all ten built-ins after JSON round-trip,
scenery/texture retention, legacy migration, invalid/future data, corrupt storage,
quota failure, scoped reset and history. Actual Chromium WebGL interaction passed
3D height drag, undo/redo, numeric/point editing, scenery preservation/opacity,
draft switching, download/import, invalid imports leaving data intact, save-and-test
on the exported track, race start/movement and reset/reload persistence. Inspected
desktop editor/race and 844x390 layout screenshots; final run had no JS errors or
failed requests. Build/syntax/whitespace checks pass; existing chunk-size warning.

Limits: editor lights/guides differ from race presentation; scenery animations
are static in the editor. Custom tracks currently inherit Neon Causeway music and
backdrop. Embedded images are portable; referenced paths/URLs still need their
assets. Imports are capped at 16 MB and browser save quota can be smaller. Full
banking, free flight, branches and combat are not implemented. Physical-device
performance, touch-authoring comfort and human track design/playtesting remain open.

Last verified: 2026-10-26 (CPU/interaction and thruster scopes below; older sections retain their historical verification limits)

## 2026-10-26 — CPU driving and persistent race impacts

The later RACE-003 catch-up addition below supersedes the no-distance-assistance
description in this historical RACE-002 record.

All four CPU craft now use `ship-physics.js` with individual engine force, mass,
reaction time, cornering and steering precision. Their normal speed caps are
126/130/136/140 world units/s (Vanta/Kestrel/Orca/Nexus-9), with acceleration
settings of 24/31/21/27 units/s². The player's existing cap is 133. Normal player
throttle and steering coefficients are unchanged. CPU steering uses inertia,
route lookahead, corner braking, nearby traffic/overtaking and physical pad
targeting. Player-distance speed multipliers were removed. A staggered flying
start and full state reset replace the old four-craft overlap.

`race-interactions.js` owns shared swept boost-pad detection, wall response and
mass-weighted ship collisions. Pads require correct lane and near-road height;
crossing between frames and subsequent laps are handled. CPU boost uses the same
one-second duration, 1.3x entry speed and 1.5x speed cap as the player, and drives
the accepted thruster effect. The existing shorter thruster tuning is preserved.

Collisions affect authoritative speed, lateral velocity and track-relative
position on both hulls, including CPU/CPU pairs. Swept contact prevents fast
crossings from skipping each other; separated airborne craft do not hit ground
craft. Pair cooldowns avoid repeated impact notifications. Wall contact uses the
active track width, pushes inward and loses about 15–45% speed based on severity,
replacing the former flat 80% player speed loss. Banking, camera shake and sound
respond to new impact events rather than being retriggered every frame.

CPU finish times update before player placement, HUD/results use five racers,
and unfinished CPUs continue to the finish during the player's celebration.
Restart clears engine, motion, pad, impact, decision, checkpoint and finish state.

Verification: 12 Node tests pass (eight racing and four existing thruster tests).
They cover distinct acceleration/caps, no distance-based speed advantage, pad
lane/height/sweep/lap rules, walls/width, rear/side/mass/swept/airborne collisions,
30/60/120 Hz CPU behavior, pause/reset/finish and a complete four-CPU Neon Causeway
simulation with collisions, boosts and wall recovery. Chromium WebGL checks
verified real start, driving, boost, collisions, pause/reset and a controlled
same-frame finish (player second of five); all remaining CPUs finished, then the
actual retry button cleared their state. Controlled rear impact changed player
speed 133 to about 52 and CPU speed 35 to about 90, persisting across later frames.
Browser runs had no console errors or failed requests. Build, syntax and whitespace
checks pass; Vite's existing large-chunk advisory remains. Difficulty/fun balance
across all ten tracks and physical-device performance still need playtesting.

## 2026-10-26 — continuous exhaust for all five craft

The active exhaust implementation is now `src/thrusters.js`. The player and four
CPU craft each have two white/cyan plasma wakes plus fine blue/white particles.
A reusable 240 Hz world-space history interpolates emission position, orientation
and birth age between render frames. This prevents frame-sized clumps; existing
exhaust retains its own age and intensity and fades smoothly after the ship moves
on. Throttle is damped, idle remains visible, and boost increases strength, width,
lifetime and particle rate. CPU output follows its existing speed demand.

Effects update after all craft poses, remain frozen during pause, fade on engine
shutdown, clear on race restart/track change, and discard ribbon history on a
teleport. Fixed resources: 128 samples per nozzle, 2,048 pooled particles,
ten ribbon meshes and one particle batch. Craft loading no longer imports game.js
to create emitters. The old ParticleSystem.js and shaders.js experiments remain
in the repository but are not used by the active exhaust. Existing local shader
edits were preserved. Driving and AI behavior were not changed.

Validation: four Node regression tests cover 30/60/120 Hz birth spacing and ages,
idle/throttle/boost smoothing, all five ships, shutdown/reset, turns/teleports and
bounded reusable resources. Chromium WebGL checks exercised real start/countdown,
keyboard throttle/release, boost, all ten nozzle draw ranges, pause and restart.
Pause preserved particle time/count; restart cleared all ten wakes and particles.
Desktop (1440x900), close camera and landscape viewport (844x390) captures were
visually inspected. The final browser run had no console errors or failed requests.
Production build, JS syntax and diff whitespace checks passed; Vite retains its
existing large-chunk warning. Physical phone performance and final art approval
remain unverified; this is not a full race/gameplay release validation.

## Recent change — telemetry HUD redesign

Replaced the broken legacy HUD markup with responsive telemetry panels in the existing cyan/magenta visual profile. The race HUD now shows lap time, lap count, player position, live speed/max speed, active-course minimap/progress, gyro/touch steering state, a steering meter, thrust/boost meter, and an active brake indicator. Values are connected to existing race/input state; no physics or controls were changed. `npm run build`, `node --check src/game.js`, and `git diff --check` pass. Browser/device visual verification remains pending.

## Recent change — live minimap position

The minimap player marker now follows the player's actual craft world position and is updated each render frame, including lateral movement from steering. The route and start marker remain derived from the active track. This is presentation-only: no physics, input, race progression, opponent, or finish logic was changed. Production build passed; interactive browser verification is still pending.

## Repository reality

The repository implements the first competitive version 0.1 race in Vite and Three.js. `index.html` is the start/results/HUD interface. `src/game.js` sets up the WebGL scene, camera follow, input, race lifecycle, HUD updates, three-lap finish/results/retry, crest-triggered craft lift, airborne drift, player placement, race audio integration, and audio-reactive player thrusters. `src/audio.js` plays `public/audio/tracks/track_002.mp3` after the start gesture and exposes smoothed kick, bass, mid, high, and hi-hat analyser channels extracted from the visualizer prototype; kick/bass modulate the engine glow and paired underbody thruster plumes. `src/opponents.js` creates two visually distinct CPU craft, advances them along fixed lane neighborhoods at deterministic speeds, records their finish times, and resets them for Race Again. `src/craft.js` creates the procedural craft, engine accents, glow, and paired rear thruster geometry; rival thrusters remain hidden outside the player race loop. The camera follows 3.6 world units behind and 1.72 above the craft, aims 9 units ahead, and uses 48-degree desktop / 56-degree mobile framing with smooth follow. `src/track.js` builds the closed circuit from the Neon Causeway definition in `src/track-data.js` (33 3D centerline control points, horizontal scale 3.25, width 10 world units); it creates the roadway, emissive edges, lane markers, instanced trackside posts/lights, and a width-matched start/finish gate. `src/craft.js` creates the player and rival craft plus engine accents. `src/style.css` provides responsive start/results presentation and HUD.

Automatic travel cruises at 65 world units/second (2,340 km/h); holding in the upper half of the touch/pointer surface smoothly raises speed by up to 30%, and holding in the lower half smoothly brakes by up to 30%. Releasing returns the target to cruise speed. Arrow-up/down or W/S provide matching keyboard input. The HUD reports current speed, thrust, brake, or air state and live position in a three-racer field. Vanta runs at 72.5 world units/second and Kestrel at 78.5 units/second; the tighter field makes throttle use and clean steering relevant while retaining deterministic lateral variation and no collision system, rubber-banding, or advanced track-aware strategy. The craft gains a slightly stronger, longer gravity-settled lift when its sampled route tangent transitions sharply toward a descent; airborne gravity is 6.4 units/s² and lateral slide/steering response is looser while airborne. Race distance, finish, placement, and retry use a three-lap race loop.

The current sampled circuit remains approximately 2,967.5 units long (about 4.34 times the previous 683.96-unit layout) and has a smoothed elevation range of approximately -12 to +36 units (48 units total). The centerline has 33 control points and varies from straights and open turns to tighter S-bends and apex sections; a 1,400-point self-proximity check found no nonlocal points within the 10-unit road width (minimum sampled separation about 39.9 units). Road ribbons, lane markers, trackside supports/lights, the start/finish gate, track frames, and craft poses follow the 3D path. Repeated markers and scenery use instanced meshes. The chase camera follows 3.6 units behind and 1.72 units above the craft and looks 9 units ahead; its field of view is 48 degrees on desktop and 56 on mobile, with smoothly damped position and aim. These are implementation settings, not visually playtested camera tuning. At 65 units/second, one lap implies about 45.7 seconds and three laps about 137.0 seconds; these are estimates, not observed race results.

Analytic crest/control checks, CPU distance/position/reset simulation, production build, JavaScript syntax checks, and whitespace verification passed; the Vite development server previously started and reported ready at `http://127.0.0.1:5173/`. These checks exercise numerical route samples, configured controls, rival movement/reset, and camera settings, not actual pointer/touch events, race behavior, visual composition, or physical-device behavior. Browser automation could not start a session, so vertical touch mapping, crest-jump feel, airborne slide, finish/results/retry, rival visibility, final placement, visual appearance including the closer camera, and physical-device behavior have not been interactively verified.

This pass has no automated regression-test suite; `npm run build` does not test race behavior. Report actual interaction checks separately instead of using build success as evidence that start, steering, throttle/braking, crest jumps, finish, results, retry, or visual tuning works in the browser.

## Product direction

The intended product is a fast-paced mobile 3D anti-gravity racer inspired by Wipeout 2097, built with Three.js and original content. See `GDD.md` for staged scope. Version 0.1 now has a one-track, three-racer single-player competition prototype. Audio, pause/resume, richer presentation, multiple tracks/craft, and launch-scale polish are not implemented. Product goals must not be described as implemented features.

## Next work

`docs/CURRENT_TASK.md` records completed IMPLEMENT-004, the small deterministic CPU competition prototype. The accepted player drive feel remains closed. Interactive browser/device verification is still the next release-readiness check; audio, pause/resume, content expansion, and broad visual polish remain later work.

## 2026-10-26 — RACE-003: shared mild catch-up

Player and all four CPU craft receive the same smoothed leader-relative top-speed
allowance from src/catch-up.js. Target bonus is zero at gaps up to 2 seconds and
reaches 8% at 8 seconds, with smoothstep interpolation and a 1.5-second exponential
time constant. One pre-movement snapshot supplies all racers. Estimated time gap
uses accumulated distance / the leader's nominal top speed, so laps count and
instantaneous braking or boost cannot distort the conversion. Finished distances
are capped at the finish line; non-racing/finished bonuses decay to zero.

The allowance raises shared physics caps, CPU driving demand and physical pad
entry/cap speeds. It does not directly assign speed, override braking or erase
collision loss. CPU traffic speed limits still take priority. Pausing freezes
values; restart clears them. The user's current CPU caps (129/130/135/136) and
shorter thruster tuning are preserved. README documents the four tuning settings.

Verification: 19 tests pass, including seven new catch-up regressions. Real
Chromium WebGL racing showed matching ~6.5% player/CPU bonuses at large gaps,
zero for the leader, and a decay from ~6.5% to ~4.9% after the player took the lead.
Pause preserved all values; restart cleared all five. No console errors or failed
requests. Build, syntax and whitespace checks pass; existing bundle-size warning
remains. Human balance testing and physical-device performance remain unverified.
