# Current Status

## 2026-10-28 — EDITOR-006: object colors and neon

Selected scenery now exposes surface/glow color pickers, Cyan/Pink/Lime/Amber/Violet
neon presets, Glow Off and Default Colors. Existing color/emissive fields are reused;
no format migration. Textured scenery now honors those fields while keeping legacy
defaults when omitted. Texture tint/emission uses the same renderer in editor/game.
Clone, history and saved/exported data preserve colors. 86 tests and build pass
(existing chunk warning). Browser covers presets, custom color, undo/clone, textured
material values, off/reset, save/reload/export; screenshot inspected, no page errors.

## 2026-10-28 — TRACK-005: track tools and readability

User playtested all CPU levels, accepted stage B and committed/pushed the baseline.
Stage C adds format v4 optional pointWidths/pads/roadStyle, shared width interpolation
for geometry, physics, AI, guide, branch endpoints and gap landings. Editor supports
widths, pad types/positions/routes/focus, suggestions, undo and versioned persistence.
Orange brakes remove 28% speed once per pad/lap and cancel boost; shared swept
CPU/player detection handles route metrics. CPU avoids brakes where space permits.
Authored pads pulse; Raceway uses slim centre marks and approach turn arrows.
Track16 Workshop demonstrates this separately; earlier track data is unchanged.

86 tests and production build pass (existing bundle warning). All 12 CPU runs
finish three laps on Workshop. Browser authoring, save/reload, export/import, race
and retry pass; editor/race screenshots inspected. Human tuning and physical phone
performance remain. Guide: TRACK_WORKSHOP.md. Next planned stage: D1 combat feedback,
threat alerts and flares. Countdown, camera and handling tuning remain unchanged.

## 2026-10-28 — CPU-001: difficulty and driver personalities

User confirmed stage A, including the corrected wipeoutStyle start, works in-game.
Stage B now adds saved Rookie/Pilot/Elite selection (Pilot default), disabled in
Time Attack while retaining the Race preference. Storage failures retain the
session choice with a message. Retry applies the selected level through reset.

Difficulty adjusts desired pace, reaction, corner anticipation/braking, line
error, passing clearance, shortcut frequency and occasional driving mistakes.
Vanta is balanced, Kestrel precise, Orca cautious and Nexus-9 aggressive. Drivers
check passing lanes and follow when both are occupied. Gap approach prioritizes
straight launch and sufficient speed. Existing user-tuned top speeds, acceleration,
mass, player controls, camera and countdown remain unchanged. No teleportation.
Rookie/Pilot share up to 8% catch-up; Elite up to 2%, equally for player and CPU.
Solo still has no CPU simulation or catch-up; record identity is unchanged.

Three deterministic phase variants per level on Neon Causeway, Split Decision
and Ion Foundry completed all 108 CPU runs (three laps each), with no gap recovery.
Mean finish times are ordered Rookie > Pilot > Elite on all three tracks.
Foundry means: 154.58 / 132.59 / 127.39 seconds. Elite takes more shortcuts and can
hit more rails; the Pilot/Elite difference is small on Neon. Detailed times,
spread, wall/pad/route counts and methodology are in CPU_DIFFICULTY.md.

79 Node tests and production build pass (existing large-bundle warning). Browser
acceptance passed persisted selection/reload, runtime Elite and retry, disabled
solo choice, frozen hidden CPU/no catch-up, returning to Race and quota failure.
Inspected menu/landscape screenshots in temporary swipe-out-cpu001. Syntax and
diff checks pass. Human balance, combat races and physical-phone performance
remain unverified; next planned stage is track tools/readability.

## 2026-10-28 — PRESENT-002: preferred start camera

Corrected beginRace's view reset from external to wipeoutStyle, matching the
user's preferred existing view. This covers Race, Time Attack and retry through
the shared start path. Intro still blends into the active follow profile; no
camera tuning, handling, countdown or result layout was changed. The separate
camera-follow preference is still respected.

## 2026-10-28 — PRESENT-001: results and grid fly-by

Stage A implemented. Results now have a width-aware heading, fixed action row and
scrollable detail area. Reproduced clipped COMPLETE using the committed CSS;
inspected corrected desktop and 844x390, 667x375 and 568x320 landscape views.
Long Time Attack detail fixtures scroll without moving the heading or buttons.
Portrait continues to show the existing rotate-device overlay.

A separate 3.2-second intro frames the craft and blends into the selected camera
profile's chase pose before countdown. Enter/Space, gamepad A/Cross and a button
skip it; reduced motion skips automatically. Retry resets the victory camera.
Intro pauses without changing timer, distance or CPU progress. Legacy grids get
a framed start pose, then ease into existing driving-camera tuning after GO.
Countdown implementation and CSS/animation remain identical to committed code;
browser-observed Three/Two/One/Go audio fires once each at the original boundaries.

Removed the new physics-to-game import cycle by injecting the existing particle
system/material from game setup. Spark parameters and user physics/weapon tuning
are unchanged. Updated the stale rocket-reset assertion to use the configured
clip (currently three), rather than reverting that user change.

Verification: 73 Node tests pass; production build passes with existing bundle
size warning. Browser acceptance passes intro pause/resume, frozen CPU/player,
normal completion, skip, retry, solo early end, long results, reduced motion and
legacy grid framing. Screenshots in temporary swipe-out-present001 inspected.
Browser uses Windows Chrome/D3D11; no physical phone/controller playtest or new
performance claim. Countdown source/style identity and diff checks pass.

## 2026-10-28 — PLAN-002: expanded improvement roadmap

Captured the user's expanded wishlist and recommended delivery stages A–G in
PRODUCT_ROADMAP.md. Countdown preservation is explicit. Source inspection found
global/branch widths but no per-point main-road width in format v3; F already
controls classic pitch. Results inherit scroll/height rules, but the reported
clipping has not yet been visually reproduced or fixed. Existing combat alerts,
boosts and guide warnings are extension points, not newly delivered features.
No gameplay changes or new gameplay test claims. Next recommended implementation
is results layout and a separate pre-countdown camera intro; sequence/tuning are
proposals. Documentation links and diff checked.

## 2026-10-27 — README-001: SwipeOut2026 overview

README now describes the current playable build, setup, both events and handling
profiles, cameras, tracks/editor/sharing, combat, local data and planned work.
Corrected stale craft, top-speed and track-distance descriptions. No gameplay or
release-version changes. Checked all 28 local links, npm commands, browser-script
paths and Markdown fences; diff check passes. Gameplay tests/build were not rerun
for this documentation-only task; the README dates the existing DRIVE-002 evidence.

## 2026-10-27 — DRIVE-002: classic wall pinball correction

Reproduced the user's report on a straight 10-wide test track: a speed-143
classic ship hitting one rail reached the opposite rail after 0.52 s without
steering, with four contacts within 3.3 s. The old response stacked reflected
lateral velocity, reflected yaw velocity, an impact yaw kick and heading reversal.

Classic wall response now limits restitution to 12% and rebound to 1.25 internal
lateral units (2.5 world units/s), clears only heading/rotation into the wall and
adds no inward yaw kick. Existing away-steering/velocity remains player-owned.
The same resolver handles physics and post-collision wall correction; cooldown
contact also removes outward motion without repeated speed loss. Existing impact
speed loss and visual roll remain. Open-track classic steering, Swipeout and CPU
wall response are unchanged. Sustained steering or an angled nose can still
carry the craft across the track; this does not add lane centering.

The original no-input fixture now has one contact and settles near the same rail.
Digital away-then-countersteer pulses recover without another hit. All 71 Node
tests pass, covering mirrored sides, 7/10/22-wide tracks, 30/60/120 Hz, cooldown,
escape input, ordinary-race regressions and complete Foundry/Time Attack laps.
Production build and diff check pass with the existing large-chunk warning.
Human feel remains for the user's replay; no new browser/device playtest is claimed.

Only Wipeout's Time Attack physics identity advances to drive-002-wall-v2.
Previous Wipeout records remain stored but do not mix with changed physics;
unchanged Swipeout key fixtures continue matching their previous records.

## 2026-10-27 — TT-001: Time Attack, PB ghost and guidance

The user accepted Wipeout/low-assist handling as sufficiently skill-based. That
baseline is retained. PRODUCT_ROADMAP.md records the approved next stages; this
delivery implements Time Attack, while CPU difficulty/cup/audio/presentation
remain planned work.

EVENT now selects Race or solo Time Attack. Solo has one out lap followed by
three flying timed laps, with no CPU simulation/rendered rivals/contacts, combat
or catch-up. Shared steering, boosts, wall response and flight remain. Timing
interpolates 33%/66%/finish crossings in canonical route progress. Recovery
invalidates the affected lap; incomplete, failed-gate and over-ten-minute laps
cannot save. Pause freezes the simulation clock; early end retains completed
valid records. Retry starts a new out lap.

Versioned browser records include track revision, ship, speed class, top speed,
handling/effective assist and physics version. Current selection remains one
player craft (Racer) and one speed class (Standard). Camera/visual helpers do not
split records. Malformed records are ignored visibly; quota/unavailable storage
keeps a session PB with a warning rather than deleting existing records. A bounded
eight-category cache supports retry without losing an unsaved PB. No cloud sync.

The transparent PB ghost replays world position and quaternion recorded at 20 Hz
plus timing boundaries, with interpolation and no physics/collisions/pad triggers.
It follows recorded branches, loops and gaps, restarts on flying-lap boundaries,
and fades on overlap. HUD shows lap/sector times and signed progress-matched
delta. Results include valid/invalid status, per-lap sectors and session-best
improvement over the starting PB. Ghost and visual guides are separately saved
options. Existing boost afterimages are independent.

The optional local-surface racing line estimates lower-curvature lanes, attracts
to reachable pads, limits sideways slope and compares branch travel estimates.
It follows the actual selected route, omits gap segments and colours the braking
approach. Local left/right turn warnings depend on curvature/speed; gaps have
priority. A fixed 64-segment mesh updates at approximately 10 simulation Hz.
This is geometric coaching, not proven fastest-lap optimization or steering
assistance. It needs human tuning, especially on custom circuits.

Verification: all 68 Node tests pass, including ten new timing/storage/replay/
guidance checks. Off-frame crossings agree at 30/60/120 Hz. An input-driven
classic-physics run completes the out lap plus three timed Foundry laps with
four branch entries, eight landings and zero recovery, saving a reloadable PB.
The browser separately passes actual solo render-loop isolation and keyboard/
pause, accelerated input-driven complete laps, real storage/reload/category
isolation, persisted helper toggles, early end, results and return to Race.
Inspected desktop/landscape screenshots cover bank, gap, shortcut and inversion
in temporary swipe-out-tt001. No JS errors or failed HTTP responses were recorded.
Test hooks are response-only and never shipped. Production build passes with
the existing large-chunk warning; diff check passes.

Physical-phone performance, human ghost comfort and recommended-line balance
remain unverified. See TIME_ATTACK.md for operation, storage limits and tuning.

## 2026-10-27 — DRIVE-001: selectable handling and camera

Start-screen CONTROL MODE now selects the existing default Swipeout/assist or
an optional Wipeout-inspired profile. CAMERA FOLLOW independently selects either
camera, or follows the control mode. Both choices and the Swipeout assist value
persist in browser storage and apply at the next race start.

The new profile separates nose heading from lateral momentum, accelerates yaw,
supports faster countersteer and analog independent airbrakes, and removes lane
centering. Its engine force is 20 versus the existing player's 8 for recovery after
braking; top-speed/boost/catch-up rules and CPU profiles are unchanged. Keyboard,
touch and gyro retain their inputs. Classic gamepad A/Cross accelerates, while
L1/R1 or L2/R2 brake independently, eliminating R2's thrust/brake overlap in this
profile. Optional weapon aim follows the classic ship's nose.

The classic camera follows nose heading without hull roll in chase view, with
damped track-relative correction and a small hull-roll contribution in cockpit.
Local correction avoids world-position lag through loops; gap landing/recovery,
view changes and retry reset transient state. See DRIVING_MODES.md for reference
comparison, controls and tuning constants. This adapts the supplied C source's
principles to the existing spline physics; it does not port free-body triangle
collision/repulsion, and heading remains bounded to roughly +/-37 degrees.

All 58 Node tests and the production build pass. Coverage includes 30/60/120 Hz,
countersteer/brakes, reset, both Foundry gaps at three speeds, an input-driven
three-lap run with gates/branches/six landings, camera inversion, preferences and
weapon direction. The automated driver contacts walls; it is not evidence of
optimal racing or enjoyable human handling. Physical-device performance,
controller feel and final human handling/camera tuning remain playtest items.
The existing Vite large-chunk warning remains.

Chromium WebGL acceptance passes saved independent settings, keyboard steering/
countersteer, synthetic analog gamepad brakes/thrust/disconnect, mobile pointer
steering/pedal and pointer-capture reset on pause, frozen pause, real gap landing,
inverted chase/cockpit rendering, finish/retry and restored Swipeout assist.
Inspected desktop/landscape screenshots are in temporary swipe-out-drive001.
No browser JavaScript errors or failed HTTP responses were recorded.

## 2026-10-26 — TRACK-004: Ion Foundry complete circuit

Fifteen built-ins now include Ion Foundry (track15), a roughly 5,798-unit orbital
industrial circuit. It combines two 101-unit gaps, banked corners, a descending
S-bend section, a vertical loop of radius 70 with a separated exit, and the raised
Needle Skyway. Left approach selects the 8-wide, 541-unit shortcut; the 22-wide
main detour is 749 units. Six sign gantries identify hazards and sectors. Music
uses track_007 and the existing backdrop_track-009.jpg. Previous tracks/tuning
and default-off combat remain unchanged.

The environment contains 656 individually editable primitives: district buildings,
reactor islands, coolant shafts, machine halls, outriggers, skyway supports,
loop rings/core and neon guides. Launch/landing lanes stay clear. Bank metadata
compensates parallel-transport roll at authored anchors, keeping jump ramps level
in world space. Saved editor drafts are ordinary v3 data, independent of the
initial source helpers. Scenery remains decorative; existing weapon occlusion
still uses it. See ION_FOUNDRY.md for the driving/authoring guide.

All 12 user source textures are preserved and have reproducible 512-square WebP
derivatives (891,766 bytes vs 39,433,573 original bytes). Five generated wayfinding
textures are 1024x256. The circuit loads eight surface maps plus five signs,
683,454 bytes total. Scenery shares four geometries and 13 static texture instances
within its disposable group; identical materials also share. Scrolling maps remain
independent. Tests verify disposal once per resource and no offset cross-talk.

Verification: 50 Node regressions pass; after the final loop scenery adjustment,
the six affected Foundry tests pass again. Player physics completes three laps
on both paths with six landings; all four CPUs finish with six landings, zero
recoveries, boosts/contacts and both paths used. CPU times without catch-up/combat
are approximately 133–141 seconds. Both gaps land at 100/140/210 speed at 30/120 Hz;
40-speed misses recover safely. Conservative sampled scenery bounds leave the
road/craft/camera-height envelope clear. Format/asset budgets also pass.

Chromium WebGL loads all 13 scenery maps, renders inspected district, bank,
fork, skyway, switchback, cockpit, loop and inverted views, and passes actual
render-loop player jumps on both gaps plus lane-selected fork-to-merge travel.
The editor opens, exports all scenery/routes/gaps and saves/reloads. Desktop and
landscape captures are in temporary swipe-out-track004. No browser JS errors or
failed HTTP responses. The browser uses controlled approach/inspection poses;
complete multi-lap verification is the Node simulation, not a human playthrough.
The previous editor browser suite also passes gizmo/history/textures/import,
scoped reset and Save & Test. Final production build, syntax and diff checks pass.

Physical-phone frame rate, human challenge/fun, shortcut balance and inversion
comfort remain unverified. The unchanged main bundle still triggers Vite's
large-chunk warning. Local texture references in exported JSON require the same
assets when moved to another installation; they are not embedded automatically.

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
