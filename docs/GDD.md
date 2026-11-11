# Game Design Document (GDD)

**Project:** Swipe-out
**Document status:** Initial design baseline; proposed details require playtesting
**Audience:** Product, design, art, audio, and engineering

## Expanded product plan — 2026-10-28

[PRODUCT_ROADMAP.md](PRODUCT_ROADMAP.md) owns the latest expanded wishlist and
proposed delivery order, including race presentation, CPU levels, variable track
width, hazards, weapon pickups/flares and ship progression. Its concrete design
proposals remain subject to playtesting. Preserve the accepted driving baseline
and countdown. Older milestone ordering below is historical design context;
CURRENT_STATUS remains the evidence for implemented behavior.

## 1. High concept

Swipe-out is a fast-paced mobile 3D anti-gravity racing game. Players pilot
sleek racing craft through dangerous-looking, tightly composed futuristic
circuits, competing against CPU rivals. Accessible swipe steering and a strong
sense of speed meet expressive ship handling, readable tracks, polished
cyberpunk presentation, and original techno music.

The reference point is the energy and pace of classic anti-gravity racers such
as Wipeout 2097. Swipe-out must establish its own name, world, ships, track
layouts, interface, visual designs, and music; it is not to reuse or reproduce
another game's protected content.

## 2. Product goals and design pillars

1. **Immediate touch response:** A player can understand steering in seconds;
   swipes feel direct and forgiving without making high-speed racing trivial.
2. **Speed with readability:** Camera, track geometry, effects, and interface
   communicate velocity while keeping the racing line and upcoming turns clear.
3. **Distinct craft and circuits:** Ship choices and three launch tracks provide
   recognizable play styles and visual identities.
4. **A cohesive original future:** Lighting, materials, generated assets, UI,
   sound design, and custom techno tracks reinforce one cyberpunk setting.
5. **Mobile-ready polish:** Visual ambition is balanced with stable performance,
   manageable downloads, and reliable touch and audio behavior on phones.

## 3. Target experience

- **Platform:** Mobile devices; Three.js is the intended 3D rendering
  foundation. Specific operating systems, browser/container, and minimum device
  capability have not yet been selected.
- **Orientation:** Landscape is the recommended starting point for track
  visibility and thumb controls; confirm with a device prototype.
- **Session:** A short, replayable race with fast entry, clear results, and an
  obvious retry or next-track path.
- **Audience:** Players who enjoy arcade racing, futuristic worlds, and
  skill-based touch controls; the experience should be approachable without
  requiring prior racing-game expertise.
- **Presentation:** Original cyberpunk/sci-fi art direction. Avoid visual noise
  that obscures track edges, rivals, or steering feedback.

## 4. Core player loop

### Approved product expansion — 2026-10-27

The user accepts the current Wipeout/low-assist handling as the skill baseline.
Add solo Time Attack with PB sectors, a real replay ghost, optional recommended
line and corner warnings; then Rookie/Pilot/Elite CPU difficulty, a three-track
cup/medals/liveries, richer audio feedback and presentation/device settings.
PRODUCT_ROADMAP.md owns this approved sequence. Time Attack uses an out lap and
three flying laps, excludes combat/catch-up/CPU contacts, and separates records
by track revision and effective vehicle/speed/handling/assist configuration.
Guidance supports learning but never modifies steering or guarantees optimality.
Later progression and physical-phone performance remain future stages.

1. Choose an available ship and one of the three tracks.
2. Start a race and learn the course through its visual landmarks and turns.
3. Swipe to steer, hold a clean racing line, and compete with CPU opponents.
4. Cross the finish line and review placement and race feedback.
5. Retry for a better result or choose another ship or track.

A compact MVP should prioritize this complete loop before progression systems,
account features, monetization, online play, or additional content.

## 5. Race and controls

### Race format

The initial design target is a short circuit race against CPU opponents, ending
when the player completes the course and receives a finishing position. A
three-lap format is a reasonable prototype baseline, but lap count, field size,
race duration, checkpoint rules, and difficulty settings need validation.

### Swipe-controller

- Horizontal touch movement is the primary steering input. The ship should
  respond promptly and smoothly, with bounded steering and forgiving return to
  center when the gesture ends.
- The prototype should compare continuous finger-drag steering with short
  left/right flicks; select the mapping that is easiest to control precisely
  on small screens.
- Forward motion is automatic for the first playable version, keeping attention
  on steering and the racing line. Braking, boost, drift, and combat are not
  required for the initial scope unless testing demonstrates a clear need.
- Provide immediate visual feedback from ship banking, engine effects, and
  track-relative movement. Camera motion and screen effects must not make the
  course unreadable or uncomfortable.
- Reserve comfortable screen space for thumbs and keep essential race
  information away from gesture areas. Support pause and resume.

Exact gesture thresholds, steering curve, camera follow behavior, and any
assists remain tuning decisions to be made on real target devices.

## 6. Ships

Ship selection should offer multiple original craft with readable silhouettes
and genuinely different handling rather than cosmetic-only variants. Initial
archetypes to prototype:

| Working archetype | Strength | Trade-off | Intended feel |
| --- | --- | --- | --- |
| Vector | High top speed | Less forgiving steering | Precise and demanding |
| Singularity | Responsive steering | Lower top speed | Nimble and accessible |
| Bastion | Stable handling | Slower acceleration / recovery | Composed through turns |

These names and stat profiles are placeholders for original designs. Final
ship count, stats, unlock rules, customization, and balancing are open. Each
craft needs clear visual identity, readable color treatment, engine feedback,
and performance-conscious geometry/materials.

## 7. CPU opponents

CPU rivals make each race competitive without requiring online services. They
should follow the course, steer through turns, avoid obvious collisions where
practical, and present distinct positions and motion so the field is legible.
Difficulty should be tunable and fair: opponents may challenge the player but
must not appear to teleport, ignore the track, or make placement feel arbitrary.

The user approved mild catch-up on 2026-10-26: both player and CPU receive a
smooth top-speed allowance from zero within an estimated two seconds of the
leader to a maximum of 8% at eight seconds. Acceleration and physical consequences
remain active. These are starting balance values to playtest; current implementation
and verification are recorded in CURRENT_STATUS. Difficulty selection remains open.

## 8. Launch tracks (three distinct levels)

Each level should have a memorable silhouette, palette, landmark, and turn
rhythm. The following are proposed themes and working names, not final content:

1. **Neon Causeway — Megacity:** Elevated lanes thread between dense towers,
   holographic signage, and luminous transit infrastructure. The visual read is
   layered vertical depth; the course should keep lane edges clear.
2. **Glassline — Polar Array:** A cold, reflective research complex over an
   alien ice field. Cool lights, long sightlines, and broad sweeping turns
   contrast with the city circuit.
3. **Vanta Core — Reactor Works:** A high-contrast industrial energy facility
   with massive machinery, warning lights, and tighter technical turns. Strong
   landmarks and lighting cues guide the player through complex sections.

All tracks need a clear route, safe edge readability, distinctive scenery, and
mobile-appropriate asset budgets. Track length, route topology, hazards,
shortcuts, and whether circuits share reusable modules are open production and
gameplay decisions.

## 9. Art, visual effects, and generated assets

Target a polished, coherent 3D look: sleek original anti-gravity craft, authored
track forms, dramatic but controlled lighting, emissive accents, atmospheric
scale, and restrained motion effects. High-quality generated assets may support
concepting and production, but must be curated and checked for consistency,
readability, artifacting, provenance/usage rights, file size, and runtime cost.

Prioritize a readable ship-versus-track silhouette, strong track-edge cues, and
visual hierarchy over dense decoration. Effects should reinforce speed and
turning without obscuring the racing line. Art direction should define a shared
palette/material language across ship, world, and interface before content
production scales up.

## 10. Audio

Use original custom techno tracks supplied as MP3 files, with a high-energy
futuristic tone that supports sustained racing. Music should start and stop
reliably, respect mute/volume settings, and not prevent the player from hearing
important race feedback. Add concise engine, UI, and race-state sounds as
original supporting audio where feasible. Track count, length, licensing,
looping, mix, and delivery/streaming strategy remain to be determined.

## 11. Interface and accessibility

The essential flow is title/start, ship and track selection, race HUD, pause,
and results/retry. HUD elements should be minimal and legible on a small screen;
placement, lap/position presentation, and typography need device testing.

Plan for adjustable music and effects volume, clear pause/resume, and options
to reduce camera shake or intense screen effects. Communicate race state using
more than color alone. Validate controls for left- and right-handed use and
account for varied screen aspect ratios and touch behavior.

## 12. Performance and technical constraints

- Three.js is the rendering direction; application framework, physics, build
  system, and deployment target are not yet established.
- Profile on representative mobile hardware early. Optimize geometry, draw
  calls, textures, lighting, effects, audio, and loading rather than relying on
  desktop results.
- Treat frame pacing, memory, startup time, network transfer, thermal behavior,
  and touch latency as product quality concerns.
- Establish measurable device-specific frame-rate and loading budgets after
  target devices are selected. Do not describe an unmeasured target as met.
- Provide graceful behavior when audio cannot start until a user gesture, and
  when a device cannot sustain the highest visual settings.

## 13. Delivery milestones and scope

Build the game in three gated steps so the first implementation is a coherent,
extendable race rather than a standalone visual demo. Acceptance criteria below
are release goals, not claims about current implementation. Version 0.1 is the
first playable build; 0.5 adds presentation and competition; 1.0 covers the
launch scope in this GDD.

### Version 0.1 — First playable vertical slice

Deliver one complete race with one track and one player craft. Keep forward
motion automatic and implement direct, responsive horizontal touch-drag
steering as the first control mapping. The track may use simple geometry and
placeholder art; prove the race loop before scaling visual content.

Acceptance criteria:

- The app launches into a playable 3D scene using the selected Three.js setup.
- The player can steer the craft on a continuous, readable track using touch;
  steering is bounded and responds while dragging, then recenters smoothly.
- Automatic movement, a following camera, visible track edges, and craft
  movement/banking communicate speed without hiding the route.
- A race can be started, the start/finish line is recognized, and completing
  the course transitions to a finished state.
- The result shows the completed run's elapsed time and offers a working retry.
- The race can be completed and retried without reloading the app or becoming
  stuck in a race state.

Architecture guidance: keep rendering, input, and race-state responsibilities
understandable and separable; keep track definition and craft handling values
out of race-flow logic where practical. Establish only the seams needed by this
slice so later tracks and craft can be added without replacing the race loop;
do not build speculative generic systems.

### Version 0.5 — Impressive single-track race

Build on the same playable race and make it feel like a polished game session.
Keep one track and one player craft while adding CPU rivals, a readable HUD,
results, audio, and a coherent original visual style.

Acceptance criteria:

- The player can race CPU opponents from race start through a finish, with
  opponent positions and final placement communicated consistently.
- The HUD communicates essential live race information and remains readable
  during steering.
- The results screen shows race outcome and supports retry (and returning to
  the race entry flow where implemented).
- Original music and supporting race/UI sound play through the race flow and
  can be muted or adjusted; audio startup respects device/user-gesture rules.
- Track, craft, interface, lighting, and effects share a deliberate visual
  direction, with the racing line still clear.
- Start, race, finish, results, and retry are manually verified as one connected
  session on the development runtime and a representative touch device.

### Version 1.0 — GDD launch scope

Complete the intended launch experience in this GDD: three distinct tracks,
multiple craft with meaningfully different handling, CPU racing, mobile-ready
controls and presentation, complete race results/flow, original techno music,
and optimized original visual content.

Acceptance criteria:

- The player can select and race on all three distinct circuits: Neon
  Causeway, Glassline, and Vanta Core (working names; themes/layouts may be
  refined through production).
- Multiple selectable craft have visibly distinct identities and verified,
  meaningfully different handling profiles.
- CPU opponents complete each race without obvious track-breaking behavior;
  field position and final results are consistent with observed race outcomes.
- Start/selection, race HUD, pause/resume, results, and retry work across the
  complete race flow.
- Swipe controls, orientation/layout behavior, resizing, and audio are checked
  on the agreed representative mobile device/browser targets, including varied
  screen sizes and left-/right-handed use where practical.
- Original music is delivered as MP3, and visual/audio assets are reviewed for
  consistency, rights/provenance, readability, download size, and runtime cost.
- A release verification checklist covers every GDD launch requirement and
  records observed results. Device-specific performance and loading budgets
  must be agreed after targets are selected, then measured on those targets;
  do not treat unmeasured goals as passed.

### Progression gates

- Do not scale up content until 0.1's complete start-to-finish, result, and
  retry loop works with touch control.
- Do not call 0.5 complete until player and CPU races, HUD, finish/results,
  audio, and retry work together in one verified session.
- Call 1.0 complete only after the GDD launch checklist is verified; keep
  unresolved platform, device, and performance targets explicit until decided.

Online multiplayer, a large career campaign, monetization, extensive
customization, and procedural track generation remain outside the launch scope
unless explicitly added later.

## 14. Open design questions

### Approved expansion sequence — 2026-10-26

The user approved the staged plan in [TRACK_ROADMAP.md](TRACK_ROADMAP.md):
track import/export and a growing 3D editor, followed by gaps, banked/twisted/looped
track, alternative routes and optional weapons. This extends the earlier scope;
it does not establish that those gameplay mechanics are already implemented.

Gaps should detach craft into momentum-based flight with generous landing and
quick checkpoint recovery. Player and CPU share the rules. Continuous inverted
road uses magnetic adhesion; camera and controls must stay readable throughout.
Shortcuts trade difficulty for time saved and require shared checkpoints for
fair placement, laps and catch-up across unequal route lengths. Combat starts
as a toggleable mode with a forward rocket, impact and temporary speed loss;
homing with lock time/warning follows, and miniguns are evaluated last.

Each mechanic is first proven on a small test track before expanding content.
Exact tuning remains subject to playtesting; acceptance checks are in the roadmap.

TRACK-002 delivers separate Gap Run and Loop & Roll prototypes with shared
player/CPU flight, pre-gap recovery and magnetic adhesion. The editor authors gap
intervals and per-point bank angles in version 2 files. Technical verification is
recorded in CURRENT_STATUS; human comfort, mobile performance and final tuning
remain playtest gates.

TRACK-003 adds a first split/merge circuit and optional combat, plus scenery
cloning in the editor. Shorter routes trade time savings for narrower road;
canonical section progress and ordered shared gates preserve race accounting.
Combat is off by default: rockets, a visible-lock homing missile and a minigun
trial share ammunition limits and brief impact protection across player and CPU.
There is no elimination/health system. Gameplay balance, the minigun's long-term
inclusion and physical-device comfort/performance remain evaluation decisions.

- What mobile runtime and minimum device/browser targets will be supported?
- Which swipe mapping and orientation feel best in player tests?
- What are the final ship roster, field size, lap count, race duration, and
  difficulty model?
- What are each track's final layout, hazards, shortcuts, and production scope?
- Is progression or unlockable content needed after the core race loop works?
- What performance, download-size, and loading budgets can the team meet?
- What audio mix, track count, and asset provenance/rights review are required?

Resolve these questions through explicit product decisions and prototypes;
update this GDD and the system document when durable choices are confirmed.

## 15. Implementation truth boundary

This GDD describes intended design and proposed starting points. It is not
proof that any game feature, asset, track, or soundtrack has been implemented.
The current prototype does include a small deterministic CPU field as an
implementation step, but that does not establish the complete version 0.5
acceptance criteria or interactive/device verification. See
`CURRENT_STATUS.md` for verified repository state and `SYSTEMDOC.md` for
durable product and technical direction.

## Stage C implemented prototype — 2026-10-28

Raceway Workshop (track16) demonstrates variable main-road width, optional new
markings, authored boost and brake pads. Brakes remove 28% of speed once per
plate/lap and cancel boost; acceleration can immediately recover. CPU uses the
same effects and attempts avoidance. These values and sign readability await
human balance testing. Authoring, constraints and evidence: TRACK_WORKSHOP.md.

## D1 combat defence prototype — 2026-10-28

Initial implemented flare balance is 25s cooldown / 1.2s active. X, touch and
standard gamepad B/Circle deploy; F remains pitch. CPU shares rules but reacts
at 85 units. Incoming homing within 140 units diverts, with visible/audio feedback;
rockets and bullets remain dangerous. D1 was accepted after user playtesting; D2 pickup balance remains to be tested.

## D2 weapon pickup prototype — 2026-10-28

All racers start empty. One slot holds 3 rockets, 1 homing missile or 30 minigun
rounds; a new pickup replaces the old ammunition. No automatic reload. Fixed-type
purple pads recharge for everyone after 8 seconds; the first crossing wins. One
successful collection per pad/lap. CPU follows the same rules and seeks available
pads when empty. Editor exposes pad type; automatic fallback serves older tracks.
Time Attack and non-combat races hide and disable these pads. See WEAPON_PICKUPS.md.

## Announcer integration — 2026-10-29

Race/combat/practice voices share saved volume with countdown, default 35%.
Imminent missile warnings take precedence over routine messages. Short-lived
queues and per-event cooldowns prevent chatter; pause discards stale speech.
Cup voices remain prepared assets. Human mix validation remains. See ANNOUNCER.md.

## E1 cup prototype — 2026-10-29

Foundry Cup uses Neon Causeway, Split Decision and Ion Foundry, with 10/7/5/3/1
points and podium medals. CPU level, handling/assist and Combat stay fixed for
three rounds. DNF earns zero; countback then latest race resolves ties. Active
cup and best placement persist. Cosmetic/ship unlocks and time medals remain
future E work. Details and verification limits: CUP.md.


## 2026-10-29 — Necros foundation

World 01: Necros, The Eternal Dominion, Vhar-Keth. The Conquest Spire combines parade, technical cathedral, core shortcut, climbing spiral and descent. Greybox track17 exists; final imperial gothic art, machine hazards and cinematic are future work. See NECROS.md.


## 2026-10-29 — NECROS-002

Necros route correction: parade is a launch straight, followed by outside/inside cathedral, tower spiral with interior and summit passages, near-vertical dive, flat monuments and sharp return. No scenery in this iteration; prior jump/shortcut removed.


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

## 2026-10-31 — Garage and campaign preview

Necros/Dark Prime is the first playable campaign preview. Finish, podium and win
unlock two chassis, two mutually exclusive modules and a gold finish; Elite win
adds a trophy. Garage paint is a material tint, not a livery editor. Menu fly-by
uses supplied trailer audio, independently of the accepted race countdown.
Tuning and validation limits are recorded in MENUS_GARAGE.md.

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

## 2026-11-03 — Vitrum Lithofyter
World 02 uses the supplied living-planet brief: seven connected areas, monumental
forest, ivory biological structures, amber/turquoise light, neural chamber and
ravine descent. No physics changes; line-choice boosts reward course learning.
Neural Ascent is available independently of the existing Necros campaign.
See VITRUM.md for the implemented layout and human-playtest boundaries.

## 2026-11-03 — VITRUM-002 layout and media ownership
Vitrum now prioritizes connected traversable structures and clustered colonies.
Seven route-conforming GLB modules supplement all nine supplied models. The
road enters an enclosed mycelium vault and passes under the neural heart inside
Bloom. Existing route physics remain. User owns final panorama, trailer/flyby
script and music; built-in media remain temporary until supplied. See VITRUM.md.

## 2026-11-03 — VITRUM-004 design
User requested an Avatar-like city feeling. Interpreted as a luminous organic
forest settlement: tiered tree habitats, warm pod openings, root ramps,
canopy promenades, hanging seed lanterns and violet/turquoise undergrowth.
Original Vitrum assets/forms retained. Racing route and supplied media unchanged.

## 2026-11-03 — VITRUM-005 art direction
Use the user's forest textures and reference imagery for moss/ivory/amber
contrast, restrained cyan mycelium and lavender growth. Glossy road has darker
weathered edges. Following live user feedback, every planted asset receives a
physical soil/root footing and smaller plants follow the bank slope. Dense
broad-leaf understory, small mushrooms and flower sprays connect the large
landmarks. Warm sunlight and green ambient fill replace the cooler forest light.
The Bloom orb remains deliberately suspended. No driving/route/media change.

## 2026-11-03 — VITRUM-006 scenic enclosure
User's shield means forest scenery masking the finite world: dense megaforest
silhouettes behind real geometry, porous hanging roots and clustered understory.
Three fixed physical depths produce parallax rather than following the camera.
Dark olive foreground gives way to paler green/teal distance through fog. Small
plants use three planes at 60-degree intervals, rooted into the banks. Preserve
an open racing corridor and the supplied panoramic sky. Generated art matches
the moss, ivory wood, amber gills and restrained cyan/lavender world palette.

## 2026-11-03 — TEXTURE-001 authoring
Users can upload transparent vegetation and silhouette textures onto scenery
objects. Cutout is the default for crisp foliage and overlapping layers; Soft
is available for mist and glass. Whole-object opacity remains independent of
image holes. A checkerboard thumbnail makes imported transparency visible.

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
## 2026-11-10 — Service Bay / garage continuity
Accepted presentation: keep the existing garage art and customization controls as
an interior work view of Service Bay. Retain carrier room navigation and continuous
zone audio; fade between platform/work view, Back to platform. Do not create a
second customization system or replace the accepted garage background.
