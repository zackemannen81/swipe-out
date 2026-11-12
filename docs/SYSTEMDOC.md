# System Document

## Environment authoring

The existing editor has an object-only environment mode with a separate scene
storage/JSON boundary. Saved presentation cameras and lighting travel with scene
objects. Track exports can supply scenery without carrying racing geometry into
the environment renderer. Tour Bus runtime integration remains a separate step.
See ENVIRONMENT_EDITOR.md for the authoring workflow.

## Product summary

Swipe-out is a fast-paced mobile 3D anti-gravity racing game built with
Three.js. Its design takes inspiration from Wipeout 2097: high-speed futuristic
racing, a strong sense of motion, and a distinctive electronic soundtrack. The
world and presentation should feel cyberpunk and original rather than copying
protected game assets, branding, music, or track designs.

## Product goals

- Deliver responsive, readable racing on mobile devices with swipe-based
  controls suited to touch screens.
- Create a polished 3D presentation with a coherent futuristic cyberpunk art
  direction and high-quality generated visual assets.
- Offer multiple playable ships with meaningfully distinct identities.
- Include CPU-controlled opponents and three distinct race levels.
- Use custom techno music tracks delivered as MP3 audio.
- Balance visual ambition with stable frame rates, fast loading, and practical
  memory use on mobile hardware.

## Intended core experience

The player chooses a ship and level, races at high speed against CPU opponents,
and steers using swipe gestures. The exact race rules, ship handling, progression,
UI, level themes, opponent behavior, and gesture mapping remain to be designed
and validated. Do not treat these open details as settled requirements without
an explicit product decision.

## Release strategy

Deliver the game in gated steps: version 0.1 proves a complete one-track,
one-craft playable race; version 0.5 adds CPU competition, HUD, results, audio,
and cohesive presentation; version 1.0 fulfills the GDD launch scope. The
GDD's milestone section owns the detailed acceptance criteria. Start with a
complete vertical slice and extend its race loop rather than creating separate
visual demonstrations. Keep input, rendering, and race flow understandable,
and make track and craft tuning extendable without introducing abstractions
that are not yet needed. These are implementation goals, not verified
architecture or behavior.

## Technical direction and constraints

- The initial implementation is a Vite-powered browser application using
  Three.js for rendering. `npm run dev`, `npm run build`, and `npm run preview`
  provide the development, production-build, and local-preview workflows.
- The current Three.js circuit race cruises automatically at 65 world units/second and supports touch/pointer horizontal steering plus vertical throttle/braking around that cruise speed; touch acceleration and braking are capped at ±30%. Crest-triggered lift now uses a slightly stronger launch impulse, 6.4 units/s² airborne gravity, and looser airborne steering drift; it remains an arcade handling feature rather than a physical simulation. The HUD reports live speed, player placement in a three-racer field, and the current thrust/brake/air state. Two deterministic CPU rivals follow the course at 72.5 and 78.5 units/second, with fixed lane neighborhoods and subtle lateral variation; this tighter field makes active throttle and clean steering relevant, but there is no collision system or advanced track-aware strategy. Race audio now plays bundled `track_002.mp3` after the Start Race gesture; `src/audio.js` exposes kick/bass/mid/high/hi-hat analysis channels and currently links kick/bass energy to engine glow. The chase camera follows 6.2 units behind and 2.8 units above the craft, aims 9 units ahead, and uses a 48-degree desktop / 56-degree mobile field of view with smoothed position and aim interpolation; the user has manually tested and accepted the current speed, floating, course-variation, and camera feel, though this environment did not independently observe the session. Track geometry and width are separate from race flow; other track properties and craft tuning data are not yet generalized. Multiple selectable tracks/craft remain unimplemented.
- Treat mobile touch input, variable device performance, asset download size,
  memory, and audio playback behavior as first-class design constraints.
- Generated assets and custom music must be reviewed for quality, consistency,
  performance, and rights to use. Optimize assets for delivery and runtime.
- Prefer original visual, audio, and level content. Wipeout 2097 is an
  inspiration/reference, not a source of assets or a requirement to reproduce
  its protected expression.

## Documentation truth boundary

Race presentation has a separate pre-countdown intro phase. It freezes race
progress, blends into the selected chase camera and may be skipped or paused.
The accepted countdown remains the next unchanged phase. Result headings/actions
stay outside the scrollable detail region. Collision spark presentation is
injected at game setup so shared physics does not import browser game lifecycle.

The user has accepted the skill-based handling baseline and explicitly requires
the existing countdown to remain unchanged. The expanded 2026-10-28 wishlist
covers race intro/results, CPU difficulty, track tools/readability, combat and
countermeasures, cup/ship progression, audio, menus/environments and device
performance. PRODUCT_ROADMAP.md owns the recommended sequence and acceptance
targets; CURRENT_STATUS records implementation evidence. A new camera intro must
finish before the existing countdown begins. Proposed tuning is not approved
implementation or proof of delivered behavior.

Time Attack uses one out lap and three flying laps, without CPU simulation,
combat or catch-up. The time-attack module owns interpolated timing, lap validity,
versioned local records and fixed-rate world-pose replay. Records are isolated by
track revision and effective driving configuration, and never replay as physical
racers. The racing-guide module analyses track geometry/pads/branches and renders
a bounded optional recommendation; it does not steer or claim a globally optimal
trajectory. Race mode retains its existing shared interactions and handling.

Player handling and camera follow are independently selectable. Swipeout retains
the assisted/mobile baseline and remains the default. The optional Wipeout-inspired
profile uses local heading/momentum separation, angular inertia, countersteer and
independent airbrakes. It retains spline progress, magnetic road and shared
collision/flight rules rather than replacing them with free-body physics.
Classic rail contact dissipates outward heading/angular motion and bounds rebound
without adding an inward steering impulse; existing player escape steering is
preserved. Open-track momentum remains manual. Mode-specific physics versions
isolate Time Attack records when one handling profile changes.
The source-informed camera follows ship heading with bounded local correction;
road bank/inversion and craft roll have separate treatment. CPU profiles retain
their existing handling. Player preferences are separate from track storage.

Complete authored circuits combine verified mechanics as ordinary versioned
track data. Ion Foundry is the first such combined environment: its source helper
builds editable primitives and control points; saved drafts remain independent.
Scenery assets share geometry/materials/static textures within one disposable
group. Animated scrolling textures remain independent. Original source images
are retained separately from reproducible delivery-sized WebP derivatives.

The approved expansion order is versioned track sharing, an initial 3D editor,
gaps, banking/twists/loops, route branches, then optional combat. The detailed
checklist and stage status are in TRACK_ROADMAP.md. Develop the editor alongside
these mechanics; do not implement speculative branch or free-flight physics in
the import/editor foundation. Existing handling and visual tuning remain the baseline.

Track files use a versioned envelope, with legacy raw definitions accepted by
the shared track-format/track-library modules. Game and editor use the same
validated definitions. New imports receive separate library keys; browser saves
and resets act on one track. Authoring uses game geometry, OrbitControls and
TransformControls; UI/history and the 3D view have separate ownership.

Version 2 optionally enables magnetic road, authored bank/roll angles and gap
intervals. `track-path.js` owns the shared spline and continuous transported local
frames for road geometry, physics, AI, fixtures and camera. Closed-path orientation
is corrected at the seam. Legacy tracks retain their original world-up frames and
crest handling unless magnetic road is explicitly enabled.

Magnetic craft adhere to continuous road. Missing road launches player and CPU
with world momentum into `gap-flight.js`, with world gravity, limited air steering,
surface landing and recovery before the failed gap. Local projection tracks race
progress without snapping flight onto the spline or another nearby floor. This
does not provide arbitrary surface landing. Magnetic
motion substeps at at most 1/120 second; camera orientation follows local up through
loops and rolls. Decorative scenery retains authored world transforms; road rails,
markers and boost pads follow the shared frame and are omitted inside gaps.

Version 3 adds sequential alternative-route intervals on magnetic tracks. Each
open spline attaches to a main-road start/end with matching orientation. Racer
state locks its choice at entry according to approach lane and clears it at the
merge. Canonical main-road distance represents common race progress; route-length
conversion preserves physical speed and lets shorter routes save time. Ordered
shared sector/merge gates validate laps. Geometry, pads, contacts, local-width
walls, camera and minimap follow the selected route. The first format supports
four non-overlapping branches, without gaps inside them.

Optional combat is owned by `combat.js`: a shared player/CPU simulation with
bounded projectiles/effects, single-slot ammo/cooldown state, forward lock acquisition,
limited-turn homing, swept relative hull intersections and persistent impacts.
The game supplies road/scenery visibility queries and input. Presentation uses
instanced effects, target reticle, threat warnings and short synthesized sounds.
Combat defaults off and adds no health/elimination. Minigun is an experimental
third weapon; balance and device budgets remain subject to playtesting. Editor
scenery clones copy data independently, assign new IDs and use existing history
and storage workflows.

Player and CPU motion now share `ship-physics.js`. CPU profiles and route/traffic
decisions belong to `opponents.js`; shared boost-pad, wall and craft contact rules
belong to `race-interactions.js`. Collision impulses modify authoritative motion
state rather than only visual transforms. Rival difficulty comes from explicit
driving profiles and physical track interactions. The user-approved mild catch-up
in `catch-up.js` applies equally to all five racers: a smoothed 0–8% top-speed
allowance based on estimated 2–8-second leader gaps, using accumulated distance
and nominal leader speed. It adjusts caps/demand rather than assigning velocity;
normal acceleration, braking and impact consequences remain. Current profile
values and verification boundaries are in CURRENT_STATUS.

CPU difficulty now belongs to cpu-difficulty.js: saved Rookie/Pilot/Elite
selection configures driving decisions at race reset, independently of driver
risk personality and physical craft performance. Traffic checks both passing
lanes; deterministic choices/errors vary with lap and simulation time. Elite
reduces the shared catch-up ceiling to 2%; Rookie/Pilot retain 8%. The per-race
ceiling applies equally to the player and CPU without changing global tuning.
Time Attack retains no CPU simulation or catch-up and ignores this preference
for record identity. CPU_DIFFICULTY.md records the initial balance and limits.

Thruster presentation is owned by `src/thrusters.js` and orchestrated by the game
after player and CPU transforms are finalized. All five craft share procedural
plasma and particle materials. Fixed-rate world-space history supplies continuous
wakes; pooled particles supply detail, and recorded birth times provide a smooth
lifetime fade independently of render rate. Throttle/boost affect presentation
without changing physics. See CURRENT_STATUS for verification and device limits.

This document records the intended product direction, not existing software
behavior. See `GDD.md` for the detailed game design and `CURRENT_STATUS.md` for
verified repository reality. Record confirmed durable architecture and behavior
here as implementation matures; keep unresolved design choices explicitly open.

## Track authoring update — 2026-10-28

Stage C uses one interpolated main-road width across render, physics, AI and guide.
Format v4 optionally stores point widths, authored boost/brake pads and road style.
Earlier formats retain their data and automatic pad behavior. Workshop (track16)
is the opt-in proving ground. Details and limits: TRACK_WORKSHOP.md.

Scenery surface color and emissive color are shared authoring properties for
textured and untextured primitives. Editor neon presets reuse those fields;
self-illumination is visible in the editor, with race bloom applied by the game.

## Combat defence — 2026-10-28

Flares share deterministic rules across player and CPU. They divert targeted
homing projectiles without altering rocket/bullet damage or player handling.
Combat HUD separates own lock from incoming threats. Presentation effects are
bounded and simulation-driven; Time Attack disables the entire combat system.
See COMBAT_DEFENCE.md for current values and validation limits.

## Weapon pickups — 2026-10-28

Combat starts empty and uses one weapon slot with finite ammo, no automatic reload.
Shared swept pickup detection accounts for route segments, frame timing and recovery;
all racers compete for an 8-second pad recharge. CPU seeks reachable ready pads.
Format v5 stores weapon type on authored pads; v1–4 remain readable. Tracks without
authored weapon pads receive runtime fallback placements, hidden outside Combat.
Instanced presentation follows simulation time. Details: WEAPON_PICKUPS.md.

Weapon artwork shares one URL mapping between HUD and track presentation. Floating
icons use three instanced textured batches, track-owned resources, and a small
oscillation around the approach-facing pose. Existing track disposal frees maps.

Announcer production tooling uses an editable 49-line catalog and accepted
voice/SoX recipe. Runtime playback now uses a bounded priority/expiry queue and
shared saved voice gain, including original countdown sounds. Countdown triggers
remain outside the queue and preserve their timing. See ANNOUNCER.md.

Cup progression owns versioned active-round results and best placements separately
from Time Attack. Built-in course definitions and fixed race settings keep a cup
consistent across reloads. Only finalized rounds commit points; interrupted races
restart. Finish-time scoring, DNF and countback rules are specified in CUP.md.


## 2026-10-29 — Necros foundation

Necros content foundation uses ordinary track data and editable primitives. Detailed model scenery is a later art pass; the race/physics systems are unchanged. See NECROS.md.


## 2026-10-29 — NECROS-002

Necros now uses a route-only definition with no scenery. Architecture is deferred until the corrected driving layout is accepted.


## 2026-10-29 — PHYSICS-001: slope momentum

Shared Swipeout/Wipeout and CPU road physics now apply gravity along the tangent.
Engine thrust tapers over the last 5% of its speed range; full throttle balances
flat-road drag at the engine limit. Above it, the engine adds no force and never
clamps momentum. Drag is weak linear plus quadratic; braking remains effective.
Boost expiration and catch-up changes do not clip speed. Existing minimum forward
speed 12 remains (no stalling/reversing). Gap flight retains ballistic gravity;
nonmagnetic airborne motion does not receive road-slope gravity a second time.
CPU permits overspeed on clear straights; corner and traffic braking still apply.
Time Attack physics keys changed for both modes; old saved records are retained
but no longer compared with new-physics laps.

113 tests/build pass (existing chunk warning). Browser Necros coast from dive to
monuments accelerated from ~140 to ~258 world units/s without throttle, with no
recovery/page errors. Human balance and mobile performance remain unmeasured.
Tuning: src/longitudinal-physics.js, LONGITUDINAL gravity/drag/taper constants.


## 2026-10-29 — HUD-001: speed units

Current speed now reuses the same converted value as race MAX: world speed *
3.25 metres/unit * 3.6. Trip distance already uses 3.25. A later HUD write used
*36 and overstated current speed by 36/11.7 (~3.08). MAX is the race peak, not
engine limit. Rendering-only correction; physics and record identities unchanged.


## 2026-10-29 — EDIT-CAMERA-COMBAT-001

Editor supports static GLB scenery, embedded files up to 8 MB or local public
paths (e.g. /models/necros.glb). Existing position/rotation/scale inspector,
translation gizmo, selection, cloning, undo and save/export apply. Materials are
preserved; no model animation playback or collision. GLBs must embed textures
and buffers; Draco/Meshopt/KTX2 assets need an uncompressed export. Version 6
track documents add model/type fields and still read versions 1–5. Total JSON
limit remains 16 MB; large models should use public paths, especially for local
storage quotas. Referenced files must accompany shared tracks. Loading errors
appear in the editor; scene disposal cancels late attachment and frees assets.
Transform edits reuse loaded model instances instead of fetching again.

Magnetic Swipeout-camera follow now uses damped world-position lag (bounded for
loops), filtered road-up and ship heading, with road clearance and respawn reset.
Nonmagnetic and Classic camera profiles and magnetic ship adhesion are unchanged.

Automatic weapon stations are single centre pads at 460 rather than 230 world
units on main/branch routes. Authored pads remain as authored. An equipped weapon
with ammo ignores same-type pickups without refill, pad cooldown or pickup event
(and therefore no announcer); different weapons still replace the slot.

118 tests pass; build passes with existing chunk warning. Isolated browser checks
cover GLB path/file import, transforms, cloning, JSON export, save/reload and game
loading; Necros magnetic descent and editor pass without page errors. Camera
loop/roll, transient smoothing and recovery are tested. Human camera feel and
physical-phone performance remain for playtesting.

## Front-end and career presentation

The hangar is a separate scene rendered through the shared HDR-safe pipeline.
Menus reuse live preference controls. Career progression is local and versioned,
separate from lap records, cup progress and authored tracks. Earned performance
applies to Campaign/Quick Race; TA/cup retain factory performance. Necros is one
preview campaign event, not a completed multi-world campaign. See MENUS_GARAGE.md.

## CAMPAIGN-002 — exact Dark PRIME circuit

Campaign and fly-by now require custom-e7ead7a3-b303-4c3d-9464-ca52f28e8386.
Same-name tracks and the track17 prototype cannot substitute. Missing local
data disables entry/preview and explains browser-origin storage separation.
Saved track names and data are unchanged; campaign label is Dark PRIME.

## 2026-11-01 — SCENERY-001

Editor now creates point lights (color/intensity/range, maximum 16) and authors
spin/shuttle/orbit motion plus first embedded GLB clip playback. Shared preview
and race updater restores authored transforms and freezes on race pause.
Version 7 track documents preserve settings and read versions 1–6. Necros-named
tracks use blood-red edge/rail lights; saved track geometry is unchanged.
See SCENERY_ANIMATION.md for controls, limitations and verification.

## 2026-11-01 — FINISH-001
Roadmap E–G reconciled with implemented garage/scenery features. Added glow/pulse
and sound controls, local Race records, time medals/Spire Silver, course cards,
gamepad menu navigation, Necros patrols/amber signs and CPU gap overspeed fix.
See FINISHING_PASS.md for behavior, validation and real-device limitations.
New modules: src/rail-glow.js, src/race-records.js, src/world-ambience.js.
New regression tests: tests/finish-features.test.js. Prior task archived in
 docs/archive/SCENERY-001.md.

## GARAGE-002 presentation
Garage uses a fixed photographic background with a live 3D craft. Cover cropping
and image-relative craft framing preserve the platform composition on resize.

## REWARD-001
Necros mastery is derived from all five campaign trophies. The craft and music
share this requirement. Local author preview grants are separate from trophies;
production builds never automatically grant them.

## REWARD-002
Bonus trophies are separate from campaign mastery requirements. The sacrifice
uses a completed last-place Race plus the starting assistance/CPU configuration;
post-finish control overrides never influence reward eligibility.

## 2026-11-03 — World 02: Vitrum
Vitrum is a separate editable built-in circuit. Authored source builds ordinary
track data and references external GLBs; the existing geometry, editor, loader,
animation and race systems own its lifecycle. World-specific road material and
race atmosphere are keyed by the stable track identity, also after export/import.
See VITRUM.md for course design and CURRENT_STATUS.md for verification evidence.

## 2026-11-03 — Vitrum architecture modules
Route-conforming environment GLBs are generated offline, embedded-texture and
editor-transformable. Their static geometry is not rebuilt when users drag road
points. Source route changes require regenerating modules. Supplied models remain
separately editable; existing loader/disposal owns every instance. Scene bounds
are insufficient for passage clearance: use actual mesh intersection tests.

## Vitrum music selection
Supplied Vitrum songs are unrestricted explicit soundtrack choices. Profile
validation preserves only known selections and still gates Necros reward music.
An empty choice uses the selected circuit's soundtrack; no asset conversion.

## 2026-11-03 — forest-city authoring
The Vitrum generator now includes settlement() and city() builders; inhabited
terraces, pods and footbridges are merged into the same seven scene modules.
No runtime world generator or new track-format fields. Small decorative meshes
use lower subdivisions; actual passage triangle tests still govern road space.

## 2026-11-03 — Vitrum material and support authoring
Forest maps are supplied PBR sources shared through src/vitrum-materials.js.
Offline GLBs embed/deduplicate their images; runtime road and floor own separate
maps and dispose them on rebuild. Road sky reflections are downsampled before
GPU upload. Source-model bottom/foot bounds determine authored soil supports
after corridor correction. Shared src/vitrum-terrain.js supplies bank heights
for planting and generated terrain. These are static authored modules, not a
runtime terrain/physics system; editing model transforms requires regeneration
to move their baked supports. Existing saved user tracks are never rewritten.

## 2026-11-03 — Vitrum scenery enclosure
src/vitrum-forest-screen.js builds five alpha-tested InstancedMesh layers in
createTrack for the stable Vitrum id. Three forest rings enclose the sampled
current route; near plants share the authored bank-height function; overhead
curtains and edge cards are rejected if their rectangles enter the road envelope.
Fixed world transforms provide parallax, with progressively paler distant art
and existing scene fog. Shared maps/geometry follow track disposal. No camera
animation, collision, track-format fields or storage migration. Saved overrides
receive the layer when loaded; its cards do not count as editable scene objects.

## 2026-11-03 — scenery texture alpha
Track format v8 adds optional textureAlpha: cutout (default) or blend. Versions
1–7 remain readable; older documents need no rewrite. Primitive textured
materials in spawnTrackObjects respect source image alpha at opacity 1. Cutout
discards alpha below 0.1 relative to object opacity and writes solid depth; blend
uses fractional alpha without depth writing. Existing front faces are retained
so a closed primitive's inner/back face does not fill transparent holes. Static
maps clamp at borders, scrolling maps repeat. Mode participates in material
sharing; texture ownership/disposal stays with the scenery group. GLB-authored
materials are unchanged. Editor file uploads preserve original image data.

## 2026-11-03 - VITRUM-007 lighting
Vitrum sun intensity is 0.65 (formerly 3.4), hemisphere fill 0.48 (formerly
1.95). Game and editor share the darker treatment. Thirteen world-fixed point
lights follow route stations, alternating banks, 24 units above the road:
amber with two mint accents, intensity 850, range 240, decay 2, no shadows.
Automatic lighting also applies to saved Vitrum variants without rewriting
objects. Forest image cards are tinted to 65% to match. Lighting adds fragment
shading cost; target-device FPS is not measured. Generated lights are tuned in
src/vitrum-lighting.js, separate from user-authored editable lights.
## 2026-11-03 - VITRUM-008 biological atmosphere
Vitrum now has three GPU-animated Points batches: 5,200 pollen, 650 larger spores
and 350 speed streaks. Deterministic world positions follow the current route,
biased toward banks and height; three denser zones align with canopy, mycelium
and Bloom. Cyan, amber, yellow-green and rare violet, slow bounded drift/pulse,
near-camera and 260-520 unit distance fade. Streaks fade in at speed 100-280
world units/sec and use short screen-space elongated sprites (not motion blur).
No new lights, textures or collision. Three extra draws; all 6,200 vertices are
submitted in fixed batches, with distance fading in the shader. Target-device
FPS is unmeasured. Existing scenery clock freezes animation on race pause;
editor motion preview enables animation. Saved Vitrum routes receive it without
rewriting objects. Shared track disposal releases geometry/materials.
Five targeted tests pass, including determinism, bounded counts, unchanged base
positions, time/speed uniforms and disposal. Production build passes (existing
chunk warning). Browser sectors, editor and saved override checks pass with no
page/HTTP errors; Rootwake capture inspected, rendered spores visible. Evidence:
tmp/vitrum-spores-{browser,tests,build}.txt and tmp/vitrum/*.png.
## 2026-11-03 - VITRUM-009 feedback pass
Magnetic mode constrains vertical offset and follows the road's moving frame;
it is not free-world inertial physics. Standard handling previously retained
4.5 lateral grip and only 0.1 centrifugal scale even with assistance off.
Magnetic standard handling now uses grip 1.6 at assist zero, interpolating to
4.5 at full assistance, with centrifugal scale 0.3 (still multiplied by 1-assist).
Classic handling and nonmagnetic coefficients are unchanged. A circular-track
regression confirms no-input outward drift with assist off while adhesion holds.
Spore sprites are larger/brighter, 42% placed over the road at height >=9;
remaining spores cluster nearer the banks. Vitrum sun/fill are 0.28/0.25;
fog is dark green 0x263e38, density 0.0024. Craft point lights replaced with
soft additive 3.8x5.2 chassis glow planes, colored per craft. This is a visual
halo attached to the craft, not projected area lighting; steep roll/jumps can
separate it from the road. No extra dynamic light or shadow passes.
Eight targeted tests pass, including both handling modes/player three-lap runs,
CPU fields and magnetic drift. Production build passes (existing chunk warning).
Browser sectors, editor save/reload and 232-object override pass. Final Rootwake
image inspected: airborne spores and wide underglow visible. Hardware FPS and
subjective steering balance remain playtest items. User saves untouched.
Evidence: tmp/vitrum-009-{tests,browser,build}.txt and tmp/vitrum/Rootwake.png.
## 2026-11-03 - BANK-001 steering bank independent of drift
Removed lateralVelocity from both standard and classic roll targets. Previously
outward drift could overpower steering bank and tip the craft to the opposite
side. Standard local bank now follows -yawVelocity * 0.3 (same 0.38 cap and
damping); classic retains its yaw term, spring and damping. Road-frame roll is
still composed into the craft orientation. Side forces, grip, assistance and
magnetic adhesion are unchanged. No reduction of road banking in this pass.
24 tests pass, including new mirrored steering/opposing-drift/neutral-input
checks in both modes, existing handling, magnetic drift and loop/camera tests.
Production build passes with existing chunk warning. No browser visual playtest
this pass; the behavioral regression is verified through production physics.
Evidence: tmp/banking-tests.txt, tmp/banking-build.txt. No user saves modified.
## 2026-11-03 - YAW-001 separate curve drift from nose heading
Classic/Wipeout added road-frame turn to both yaw and lateral velocity. Removed
only the yaw addition: heading now remains pilot/airbrake-controlled relative to
the road, while curvature still pushes lateral momentum outward. Heading clamp,
steering inertia, side grip, banking, adhesion and collision response retained.
Standard Swipeout already lacked this curvature-to-yaw coupling and is unchanged.
This intentionally uses track-relative heading, not inertially fixed world yaw.
22 targeted tests pass: mirrored sustained inward steering with changing road
frames, neutral-yaw outward drift, banking, driving modes, gaps, magnetic drift,
Vitrum three-lap CPU/player and mesh checks. Production build passes with existing
chunk warning. No browser playtest this pass; user's subjective handling remains
to be tried. Evidence: tmp/heading-tests.txt and tmp/heading-build.txt.
## 2026-11-03 - HANDLING-001 Wipeout tuning
User requested less nose rotation, more bank and more outward drift. Classic
turnRate 1.1 -> 0.8, maxHeading 0.65 -> 0.48, brakeYaw 0.0032 -> 0.0024.
Steering bank is normalized by turnRate and targets 0.32 local roll at full
input (formerly 0.22); makePose applies twice this angle, about 37 degrees
versus 25. Curvature impulse coefficient 0.5 -> 0.75, grip unchanged. Nose,
bank and curvature drift remain separate; standard Swipeout is unchanged.
Turn acceleration remains 2.8: trial 2.2 caused the existing timed wall-escape
regression to recontact a rail, so the original response was retained.
22 targeted tests pass including wall recovery, mirrored yaw/drift, banking,
frame rates, gaps, three-lap player/CPU simulations and original mesh checks.
Final production build passes with existing large-chunk warning. No browser
playtest this tuning pass; subjective balance needs user driving feedback.
Evidence: tmp/handling-tune-tests.txt and tmp/handling-tune-build.txt.
## 2026-11-03 - HANDLING-002 release-to-neutral trial
Read tmp/src/wipeout/ship_player.c: steering acceleration/countersteer 167-194,
velocity skid 365, banking and neutral-input angular braking 421-441. Original
normal driving damps angular velocity and roll, not heading to track tangent;
heading-to-track at 463 is rescue behavior, not player steering. This trial is
an explicit user-requested ribbon-track adaptation, not claimed original parity.
Classic now damps local yaw toward zero at rate 4.5/sec when steering is neutral
(0.03 deadzone), differential brake is below .01 and ship is on the surface.
About 90% of angle clears in .51 sec. Existing yaw-rate decay settles banking;
release does not directly change lane position or sideways velocity. Active
steering, differential airbrakes and airborne/flight heading retain integration.
Previous stronger drift/bank and calmer nose tuning retained. Standard unchanged.
23 tests pass including mirrored monotonic return, analog neutral noise, drift
persistence/no lane centering, airbrakes, airborne exclusion, 30/60/120Hz, gaps,
three-lap CPU/player and original scenery checks. Build passes (existing chunk
warning). No browser/human playtest this pass; release timing awaits user feel.
Evidence: tmp/heading-return-tests.txt and tmp/heading-return-build.txt.
## 2026-11-03 - HANDLING-003: release-to-neutral trial reverted
User reported HANDLING-002 felt worse. Removed automatic track-relative yaw
return and its added steering deadzone. Restored prior yaw integration and
heading-preservation tests. Neutral input damps angular velocity; it does not
pull nose heading toward the track tangent. HANDLING-001 tuning (turnRate .8,
maxHeading .48, brakeYaw .0024, curveDrift .75, steeringBank .32), independent
banking and lateral drift remain. This supersedes HANDLING-002 behavior above.
22 relevant tests pass; production build passes with existing chunk-size warning.
No human playtest this pass. Evidence: tmp/heading-return-rollback-tests.txt and
tmp/heading-return-rollback-build.txt.

## HOP-001 - Magnetic Swipeout follow camera
Chase height is damped relative to the road, independent of horizontal lag.
Camera aim uses the already-filtered position and road-up without a second
world-space angular delay. Steering and ship physics are unchanged.


## GLOW-001
Craft underglow uses four overlapping short-range accent point lights, without
shadows, replacing the flat additive plane. Road materials receive real light.


## THRUSTER-001
Thruster ribbons taper in geometric width with normalized age, full at the
nozzle and narrowing to zero at expiry; existing alpha fade remains.

## 2026-11-03 - GLOW-002 original single light restored
User screenshot shows four distinct highlights and prefers original one-light
underglow. Restored settings verified in 6d61365:src/craft.js: one accent-colored
PointLight, intensity 1.8, distance 4, position (0,-.01,.1), no shadows. Removes
four-light arrangement; no flat glow plane. Thruster taper/camera/physics retained.
Production build passes (existing chunk warning), tmp/underglow-single-build.txt.
Visual confirmation awaits user. Supersedes GLOW-001 lighting design.
## TOUR-001 - Carrier hub prototype
The Tour Bus is an optional 3D hub reachable from the main menu, with five
clickable camera stations and keyboard-accessible controls. Simple named groups
are replaceable independently using docs/TOUR_BUS_OBJECTS.md and its JSON manifest.
Reuse existing loadout and race setup; preserve exact Necros saved-track identity.
Vitrum is an open race destination until multi-world career progression is designed.
Planet geometry, furnishings and background shuttles remain blockout art.
Public civilisation transmissions only; do not expose finale material in this hub.
### Vitrum stunt authoring
`src/track-vitrum.js` authors scenery on the original upright curve, then adds
launch control points and a continuous unwrapped 360-degree bank to the racing
ribbon. `VITRUM_SCENERY` is the stable curve for organic mesh generation;
`VITRUM_STUNTS` identifies the roll span. Do not regenerate grounded scenery
against the rolled racing frame. Existing gap-flight and magnetic physics own
traversal; the track does not override handling.

### Tour Bus planet textures
TOUR_PLANET in src/tour-bus.js owns local surface/cloud/sky paths, sphere radii
and cloud opacity. Necros has a textured surface plus separate transparent shell;
Vitrum retains its prototype planet. Shared space sphere is unlit and fog-free.
All hub textures are owned and disposed by the scene.

### Tour Bus imported service platform and moon
TB-PAD-01 loads public/models/tour-bus/repair-platform.glb once, on first hub
render. Primitive pad is a loading/error fallback. Uniform XZ fit and grounded
minimum Y preserve proportions; a central ray sets racer height above the deck.
Hub owns imported GPU resources and handles disposal during pending loads.
TB-MOON-01 is a textured satellite visible only for Necros.

### Tour Bus left dock trials
TB-DOCK-01..03 share outside-hangar.glb; TB-SHUTTLE-01..03 share the simplified
cargo-shuttle.glb; TB-PORT-01 uses hangar-port.glb. These are generic transport
props. Opponent racing craft selection remains owned by existing racer definitions.
Load each source once, clone scene nodes, share immutable GPU resources and retain
fallback primitives on failure. Imported group descriptions track provisional art.

2026-11-04: Elite catch-up ceiling is now 8%, shared equally by player and CPU; this supersedes the earlier 2% cap. Thresholds and smoothing remain unchanged.

## 2026-11-10 — TOUR-ZONES-001
Tour Bus uses a shared 16-zone plan registry with five camera destinations,
logical passage/lift connections and masked station transitions. Deck 3 holds
hangar/workshop, deck 4 Nexus/lounge and deck 5 the separate observation room.
Asset IDs and existing garage/world flows remain the integration boundaries.
Diplomacy Corridor can be a transit node without a modeled corridor or camera.
Unavailable future zones must not become selectable merely because registered.

## 2026-11-10 — Tour Bus round-trip continuity
Carrier session state is per-tab sessionStorage, separate from progression.
A reload restores a settled hub destination, never a live race or award event.
Races launched from Nexus retain carrier origin through retries and return to
hangar after results/abandon. Ordinary menu launches retain home as their return.

## 2026-11-10 — Tour Bus crew media
Tour crew presentations use copied voices/README as exact script source and
stable zone IDs (00 is welcome; 16B is restricted authorized-entry material).
visitedZoneIntros is an optional normalized profile map, independent of rewards.
Only settled playable rooms auto-present; discovered intros replay via archive.
The tour-audio owner has separate music/voice elements, explicit lifecycle and
18% music ducking; it must not take over race/trailer audio. No implicit download
or fabricated speech for missing recordings; transcript remains usable.

### Restricted-area narration casting
User reserves room 16 and 16B recordings for their own voice, Zacke, as a surprise.
Keep those audio slots pending until supplied; do not synthesize substitutes.

## 2026-11-10 — Service Bay garage work view
The existing photographic garage is the player's work view within Service Bay.
OPEN GARAGE preserves carrier navigation, crew presentation and workshop music.
A short fade changes presentation without changing the logical zone. Back returns
to the service platform; another room selection follows the carrier graph.
The standalone garage entry remains available from home. Existing customization,
loadout rules, backdrop and craft composition remain the shared implementation.

## Observation architecture
Zone 06 uses its own procedural vaulted architecture module, registered through
the existing scene asset/resource owner. Shared planet/world and navigation remain
separate. OBSERVATION_SLOTS defines replaceable furniture positions; preserve those
IDs when importing GLBs. The procurement guide owns proposed material/model needs.

## 2026-11-10 — Supplied Tour stages
The shipped stage library owns three separate entries (track19/20/21) for authored
Necros, Vitrum and Collective previews. Nexus resolves through tour-destinations.js;
Necros joins existing campaign logic, the others use open race. Original authored
IDs are not library keys. Browser overrides remain authoritative per key.
Embedded media is extracted losslessly by the import tool, with a source/asset hash
manifest. Existing stage entries and records remain intact. See TOUR_STAGES.md.

## 2026-11-11 — Ambient track particles
Non-Vitrum track groups use the existing ambient-particles.js effect. Vitrum keeps
vitrum-spores.js exclusively. Both are updated through the same race scenery clock
(after the pause guard), flyover preview, and editor scenery-preview control.
Particles are visual-only track-owned resources, disposed with the track group.
Authored data, driving physics and particle palettes/counts remain unchanged.

## Progress persistence
Career and race records use progress-storage.js through the game/front-end owner.
The adapter hydrates legacy values, then selects the newest versioned local/IndexedDB
snapshot. Writes are ordered; synchronous profile/record helpers use the session
cache, while UI observes flush() before claiming durable success. Either store can
preserve progress independently. Failure of both retains session data with a visible
warning. No old track/profile/record keys are erased. Time Attack storage is separate
and unchanged by this task. This is local device storage, not cloud/account sync.

## Whole-carrier blockout
All public zones 01–15 have camera stations connected by the existing graph and
masked passage/lift transitions. tour-blockout.js owns ten new room specifications
and named proxy furnishings; tour-bus-zones.js remains navigation truth. Zone 16
is sealed and unavailable. Room services beyond existing garage/Nexus/crew UI remain
future work. Scene visibility and point lights follow the current zone to prevent
adjacent-room occlusion and avoid illuminating all rooms at once. Asset procurement
is tracked in TOUR_BUS_ASSET_LIST.md and the generated TOUR_BUS_OBJECTS manifest.

## First observation furniture import
The shared carrier asset loader now also fits and clones supplied observation bench,
console and vine GLBs. Original fixed slot IDs remain for benches/consoles; two named
vine groups attach to side ribs. Existing resource ownership/fallback/disposal stays
in createTourBusScene. No custom model loaders or scene-independent GPU owners added.

## Observation planting assets
Planter shells retain stable slot IDs. Separate foliage groups own shared shrub
instances, with two potted tree groups beside the beds. Soil color/roughness maps
use the carrier texture owner with explicit color/data spaces.

## Observation visual target
OBSERVATION_ART_DIRECTION.md records the user-approved reference: layered dark
vault, low planetary horizon, perimeter greenery, warm/cool inset lights and
external ships for scale. These are art targets; current implementation is tracked
in CURRENT_STATUS. Supplied space.jpg is the carrier sky texture.

## Observation presentation pass
The observation planet is positioned for a low orbital horizon; a carrier-owned
shader supplies a world-tinted limb. Exterior traffic shares existing model assets
and follows the menu motion flag. Quiet view is transient UI state, not profile
state: it hides room controls while maintaining camera/music, restores with Back
or a visible button and resets on navigation/return to hangar.
