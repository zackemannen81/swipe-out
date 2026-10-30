# System Document

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
