## 2026-10-13 — minimap: live player position

- Changed the minimap player marker to use the craft's current Three.js world position instead of only the route progress centerline.
- Updated the marker every render frame after the craft pose is applied, so steering and lateral movement are reflected visually.
- Left ship physics, race distance, controls, opponents, and finish logic unchanged.
- `npm run build` passed; interactive browser verification remains pending.


- Moved the chase camera from 5.2 behind / 2.45 above the craft to 3.6 behind / 1.72 above, targeting the requested roughly 30% closer framing.
- Changed the race to three laps, with total-distance finish logic, lap HUD updates, looping player/opponent track frames, and updated start copy.
- Kept the accepted controls, speed balance, floating physics, visuals, audio, and opponent speeds unchanged.
- Production build, syntax, and whitespace checks remain pending; browser and physical-device interaction are still unverified.

## 2026-10-11 — IMPLEMENT-012: soften gravity for a floatier race feel

- Following the user's preference for a more realistic hovering sensation, reduced airborne gravity from 8.5 to 6.4 world units/s².
- Increased crest launch impulse slightly from a 3–7 to 3.5–8 world-unit/s range and made airborne lateral steering settle more gradually, without adding air-brake or pitch controls.
- Preserved touch/keyboard controls, player speed, opponent movement, race flow, visuals, and audio. This is still arcade tuning, not a physics simulation.
- Production build, syntax, and whitespace checks are pending; browser and physical-device interaction remain unverified.

## 2026-10-11 — tighten CPU race difficulty

- Following the user's feedback that the game feels too easy despite the graphics, music, track, and speed feeling right, raised Vanta's cruise speed from 60 to 72.5 and Kestrel's from 70.5 to 78.5 world units/second.
- Kept player speed/controls, rival movement logic, models, and race flow unchanged; the faster deterministic rivals make player throttle and clean steering more important without introducing catch-up behavior.
- Updated README, current status, and system documentation. Production build, syntax, and whitespace verification remain pending; the new balance has not yet been interactively playtested.

## 2026-10-11 — IMPLEMENT-008: add panorama cylinder backdrop

- Added the user-provided `public/images/backdrop_track-001.jpg` as a large inside-facing `THREE.CylinderGeometry` around the track.
- Kept the panorama unlit, fog-independent, and non-depth-writing/testing so it stays behind the existing road, craft, bloom, and speed trails at low rendering cost.
- Updated the active task and factual file map. Production build, syntax, whitespace, and interactive visual confirmation remain pending.

## 2026-10-11 — IMPLEMENT-007: add audio-reactive bloom and speed trails

- Added `EffectComposer`, `RenderPass`, and `UnrealBloomPass` to give the existing emissive track, engine glow, thrusters, and markers a restrained neon bleed.
- Bloom strength responds to kick hits and bass energy without changing the accepted beat analyser or music start/stop behavior.
- Added lightweight additive cyan/pink speed trails behind the player craft; their length and opacity respond to bass/kick energy and remain hidden outside the race.
- Deliberately deferred the dynamic backdrop/skybox until the user's concept layers are ready.
- `npm run build`, `node --check src/game.js`, and `git diff --check` passed. Interactive visual confirmation remains pending.

## 2026-10-11 — IMPLEMENT-006: add beat-reactive thrusters

- Added paired additive underbody thruster cones beneath the player engine pods, matching the requested rear/downward silhouette while preserving the existing engine glow.
- Thruster length and opacity respond to the existing bass and kick analyser channels; thrusters are visible only during the player race loop. Rival craft share the procedural geometry but keep their thrusters hidden.
- Build and syntax/whitespace verification are pending for this work wave. Interactive visual confirmation remains pending.

## 2026-10-11 — IMPLEMENT-005: strengthen beat response

- Increased kick and bass sensitivity, raised analyser energy scaling, and changed channel smoothing to a fast attack with a steadier release so beat changes read more clearly.
- Lowered the transient trigger threshold and accumulated kick hit energy briefly instead of replacing it, reducing weak/missed-looking visual pulses while preserving the analyser's band-based detection.
- Increased the engine glow contribution from kick hits and bass energy; music start/stop behavior remains unchanged.
- `npm run build`, `node --check src/audio.js`, `node --check src/game.js`, and `git diff --check` passed. Interactive browser verification remains pending.

## 2026-10-10 — IMPLEMENT-005: add race music and reusable audio analysis

- Added `src/audio.js`, extracting the visualizer's frequency-band analysis into reusable kick, bass, mid, high, and hi-hat channels with smoothing and transient hit detection.
- Start Race now begins the bundled `public/audio/tracks/track_002.mp3` from the user gesture; audio stops at the finish and kick/bass energy modulates the engine glow as the first audio-reactive hook.
- Updated README, current status, system direction, and file map. Browser audio playback and visual beat response remain pending interactive verification.
- `npm run build`, JavaScript syntax checks, and `git diff --check` are the required verification for this pass.


- The user manually tested the current CPU-race build and confirmed that the speed, floating feel, natural course variation, and current race implementation are satisfactory for continuing development.
- This manual confirmation is recorded as user-reported evidence; browser automation was not independently observed in this environment, and no physical-device result was reported.
- The accepted drive feel, camera, course, and one-lap race flow are now treated as closed for this wave. The user requested that the complete change set be committed and pushed before the next development step.

## 2026-10-10 — IMPLEMENT-004: add the first CPU competition field

- Added two visually distinct procedural rivals, Vanta and Kestrel, to the existing Neon Causeway race. They use fixed lane neighborhoods, subtle deterministic lateral motion, and distinct cruising speeds of 60 and 70.5 world units/second.
- Added live player placement in the three-racer HUD, rival finish-time recording, final placement on the results screen, and complete rival/player reset on Race Again. Moved finish evaluation after the same-frame rival update to keep placement timing consistent.
- Documented the prototype boundary: no collisions, rubber-banding, advanced track-aware strategy, audio, or interactive/device verification claims.
- `npm run build`, `node --check` for game/opponent/craft modules, a deterministic distance/position/reset simulation, and `git diff --check` passed. Browser automation did not start, so interactive race/finish/retry, visual rival readability, and physical-device behavior remain pending.
- The player's accepted speed, floating feel, course variation, and closer camera were preserved without retuning.



- Reduced the follow offset from 10.2 to 6.2 world units behind and 4.7 to 2.8 above the craft; moved the look target from 13.5 to 9 units ahead.
- Tightened the desktop/mobile field of view from 53/62 to 48/56 degrees and kept smoothed follow/aim interpolation, making the craft occupy more of the view without removing forward visibility.
- `npm run build`, `node --check src/game.js`, and `git diff --check` passed. Camera framing has not been interactively verified in a browser or on a physical device.
- Updated README, active task, current status, and system documentation to record the new configuration and verification limit.


- Added a brief gravity-settled arcade lift when the sampled course tangent sharply transitions toward a descent, plus looser steering response and lateral slide while airborne. 3,000 progress samples at 65 units/s found three lift events; the strongest rose about 0.7 world units.
- Retained the 65-unit/s cruising speed; holding in the upper half of the touch/pointer surface ramps speed toward +30%, while holding in the lower half ramps toward -30%. Releasing returns toward cruise. Arrow-up/down and W/S provide keyboard throttle/brake, and the HUD reflects live speed and thrust/brake/air state.
- Race distance, finish, timer/results, and retry remain on the existing race loop. Updated start-screen control guidance, mobile HUD visibility, README, status, system description, and active task.
- Production build, JS syntax checks, analytic crest/control sampling, and diff whitespace checks pass; Vite starts successfully at `http://127.0.0.1:5173/`. Browser automation failed to start, so interactive drive feel, finish/results/retry and visual behavior remain unverified, as does physical-device behavior. Keep these features described as arcade prototypes, not tested physics.

## 2026-10-10 — IMPLEMENT-003: sharper turns, larger elevation, +30% speed

- Reworked Neon Causeway from 19 to 33 3D centerline points, adding tighter alternating bends and a broader elevation profile. Horizontal scale remains 3.25 and road width remains 10 units.
- The sampled course is about 2,967.5 units (4.34× the earlier 683.96-unit version); smoothed height runs from approximately -12 to 36 (48 units). The 1,400-point nonlocal spacing check found no route points within the road width (minimum spacing about 39.9 units).
- Increased automatic speed from 50 to 65 units/s (+30%); the derived HUD reads 2,340 km/h. Estimated length/speed lap time is about 45.7 seconds, not a measured race time. Lowered the ground and grid below the full vertical range to keep the track from intersecting the terrain.
- `npm run build`, JS syntax checks, and `git diff --check` passed. Sampling 5,000 progress frames and generated mesh vertices found no invalid values; minimum frame-normal Y was about 0.984, and the four repeated-object meshes remain instanced. Interactive race/visual checks and physical-device performance are still unverified.
- Updated README, active task, current status, and system document to reflect current implementation and verification limits.

## 2026-10-10 — IMPLEMENT-003: extend and elevate Neon Causeway

- Kept the 50-unit/s speed and existing race loop; expanded the data-defined circuit to 19 3D centerline points with horizontal scale 3.25 and elevation varying from about 0 to 16 units. Added tighter apex points to vary turn radii alongside open turns/straights.
- The sampled route measures about 2,223.6 units, about 3.25× the previous 683.96-unit course. Road ribbons, lane markers, side supports/lights, gate, track frames, and craft follow the 3D path; repeated roadside/marker geometry is instanced.
- Sampled 5,000 progress frames and generated mesh vertices without non-finite values; the 1,400-point nonlocal route-spacing check found no points within the 10-unit road width. Production build, JavaScript syntax checks, and `git diff --check` passed. The Vite dev server returned HTTP 200 for the page and gameplay/track modules, but browser startup failed; interactive race and physical-device checks remain unverified.
- Updated README, active task, verified status, system document, and file map. The roughly 44.5-second lap time is a length/speed estimate, not a measured race.

## 2026-10-10 — IMPLEMENT-003: raise the speed close to double

- Following the positive handling feedback on the wider, sweeping course, raised automatic travel speed from 26.5 to 50 world units/second (about 1.89×); the existing HUD label remains derived from the same speed value and now reads 1,800 km/h.
- Updated the active task, README, and verified status to reflect the new setting. The sampled 683.96-unit circuit implies a nominal lap duration of about 13.68 seconds at this speed; this is a calculation, not an interactive race observation.
- Interactive browser validation of steering, visual speed, finish/results, and retry remains pending.

## 2026-10-10 — IMPLEMENT-003: tune the first playable race feel

- Reprioritized IMPLEMENT-003 from the stale pause/resume task to the user's current drive-feel milestone, preserving the approved 0.1 race loop and keeping additional content/polish out of scope.
- Moved Neon Causeway centerline coordinates and width into `src/track-data.js`; reshaped it into longer straights and broad turns, and increased lane-marker/beacon density; made the start/finish gate dimensions follow the data-defined road width.
- Raised automatic travel speed from 17.5 to 26.5 world units/second (displayed as 954 km/h), with the HUD label derived from the configured value.
- Lowered and softened camera follow and moved its look target farther ahead. Updated README, task, status, system direction, and file map.
- `npm ci` completed (zero reported vulnerabilities); `npm run build`, JS syntax checks, `git diff --check`, Vite HTTP 200 smoke checks, and direct Three.js curve/frame/mesh sampling passed. The curve measures 683.96 world units, yielding about 25.81 seconds at configured speed; a 60 Hz distance/time simulation reached the finish threshold at 25.82 seconds. Interactive browser steering/finish/retry could not be run because browser startup failed in the available tool; physical-device testing was not performed.

## 2026-10-10 — Task transition: IMPLEMENT-002 archived; IMPLEMENT-003 ready

- Marked IMPLEMENT-002 complete after verifying the one-track playable 0.1 race and archived the task at `docs/archive/IMPLEMENT-002.md` with its implemented scope and validation evidence.
- Updated verified status, durable system description, file map, and README for the live one-lap race, timed result, and retry; kept physical-device validation limits explicit.
- Set up IMPLEMENT-003 as a scoped follow-on for accessible pause/resume that freezes and preserves the active run. The elapsed/lap/speed HUD is already implemented.

## 2026-10-10 — IMPLEMENT-002: build the first playable 0.1 race

- Replaced the static presentation stage with an original procedural one-lap circuit, visible road-edge lighting, guide rails, and a marked start/finish gate; added a controllable player craft.
- Implemented automatic forward travel and a following camera, bounded pointer/touch drag steering with smooth recentering, and Arrow/A/D keyboard steering for desktop testing.
- Added an explicit race start, live elapsed-time/lap/speed display, finish results, and repeatable retry; updated the responsive UI and first-playable run instructions.
- Removed the obsolete rendering-only entry point; the browser shell now loads `src/game.js` and gameplay components in `src/track.js` and `src/craft.js`.
- Verified a production build, JavaScript syntax, Vite HTTP 200 smoke checks, `git diff --check`, and headless Chrome WebGL 2 execution. Desktop and 390x844 mobile-emulated races finished in approximately 17.13s; steering, result state, focused retry, state reset, and a fresh run were exercised without JS exceptions.
- Checked start-screen/HUD layout at 320x568, 390x844, 844x390, and 1440x900. Physical mobile-device validation was not performed.
- Archived IMPLEMENT-002 as complete and set up IMPLEMENT-003 (Ready) for a pause/resume flow and verified live race telemetry; CPU opponents, audio, and content expansion remain out of scope.

## 2026-10-10 — Task transition: IMPLEMENT-001 archived; IMPLEMENT-002 ready

- Archived the completed Step 1 rendering-foundation task at `docs/archive/IMPLEMENT-001.md` without changing its recorded outcome or verification.
- Confirmed the current app remains a rendering prototype and does not yet implement race gameplay.
- Set up IMPLEMENT-002 as the active Ready task, scoped to the GDD's first playable 0.1 race: one continuous course and craft, automatic movement, bounded touch/pointer drag steering, finish detection, elapsed-time result, and repeatable retry.
- Kept CPU rivals, audio, multiple tracks/craft, and polish out of scope. No gameplay implementation was started in this task-transition wave.

## 2026-10-10 — IMPLEMENT-001: establish the rendering foundation

- Added a minimal Vite browser app and Three.js scene with responsive sizing,
  capped pixel ratio, ambient lighting, and procedural prototype geometry.
- Added a restrained responsive landing presentation that labels the build as
  a rendering prototype and explicitly says gameplay is not implemented.
- Added npm setup/run/build/preview instructions; no external assets, framework,
  physics engine, or race mechanics were introduced.
- Verified `npm install` (zero reported vulnerabilities), `npm run build`, and
  HTTP 200 responses for the development app and its JavaScript/CSS modules.
  Visual browser automation could not be confirmed in this environment.
- Updated task, status, system direction, and file map. This is only the minimal
  app/rendering foundation; the playable 0.1 race slice remains outstanding.

## 2026-10-10 — MILESTONE-001: stage the delivery plan

- Replaced the single undifferentiated initial scope with gated 0.1, 0.5, and
  1.0 milestones and explicit acceptance criteria in `GDD.md`.
- Defined 0.1 as a complete one-track/one-craft touch-controlled race with
  speed feedback, finish detection, elapsed-time result, and retry; set 0.5
  and 1.0 scopes against the remaining GDD launch goals.
- Added lightweight architecture guidance for extending one coherent game,
  plus progression gates; did not claim or create game implementation.
- Updated the system direction and next-work status. The repository remains
  documentation-only.
- Validation: cross-checked task, GDD, system direction, and status; ran
  `git diff --check`. No code tests apply to this documentation-only wave.

## 2026-10-10 — DOCS-001: establish Swipe-out docs-first baseline

- Customized the task, status, system, workflow, journal, and file-structure
  documents for the Swipe-out mobile 3D racing game.
- Recorded the Three.js direction, touch controls, CPU rivals, ships, three
  levels, generated assets, custom techno MP3 music, and cyberpunk presentation
  as product goals, not implemented features.
- Verified before editing that the repository contained only `AGENTS.md` and
  docs, with a clean worktree; no game code, assets, or package tooling were
  present.
- Validation: reviewed the edited documentation for consistency with the
  verified docs-only repository state. No code tests apply to this documentation
  change.

## 2026-10-10 — GDD-001: create initial Swipe-out game design document

- Added `docs/GDD.md` with the high concept, product pillars, race loop, swipe
  controller, proposed ship archetypes, CPU opponent goals, three level themes,
  visual and audio direction, interface, mobile constraints, initial scope, and
  open design questions.
- Marked untested mechanics, names, and targets as proposals; explicitly
  separated design intent from implemented behavior.
- Linked the GDD from `SYSTEMDOC.md` and updated the workflow, current task,
  repository status, file map, and journal to include this work.
- Validation: checked documentation consistency and ran `git diff --check`.
  No code tests apply because the repository has no game implementation.

## 2026-10-17 � Nebula ion thrusters for every craft

- Connected the existing Three-nebula particle configuration to the player and all four CPU racers.
- Added two independently rendered exhaust emitters per craft, positioned at its paired rear nozzles and transformed with the craft pose.
- Validation: `npm run build` passed; `git diff --check` passed. No interactive browser visual verification was performed.

## 2026-10-19 - Responsive telemetry HUD redesign

- Replaced the mismatched legacy HUD markup with a responsive layout inspired by the supplied futuristic dashboard image, retaining Swipe-out's cyan/magenta palette and glass panels.
- Added live lap time, lap number, player position, speed/max speed, course minimap/progress, steering/gyro state and meter, thrust/boost meter, and brake indicators, connected to existing race and input state.
- Preserved race controls and physics. Updated current status and file map.
- Validation: `npm run build`, `node --check src/game.js`, and `git diff --check` passed. Browser and physical-device visual/input verification were not performed. `npm ci` installed dependencies; npm reported 3 moderate audit vulnerabilities.

## 2026-10-26 — VFX-001: continuous player and CPU thrusters

- Replaced the active 0.04-second, frame-aged particle experiment with two white/cyan
  plasma wakes per craft and pooled glint particles. Interpolate birth position,
  rotation and subframe age at 240 Hz; fade retained world-space history smoothly.
- Added damped idle/throttle/boost output and connected all four CPU racers to the
  same effect using existing speed demand. Handle pause, stop, restart,
  track reset and teleport without stale connecting trails.
- Removed craft-to-game emitter coupling and the per-frame unused cone/material
  creation from the local experiment. Preserved the user's shader texture edits
  and left the older experimental modules available but inactive.
- Archived the previous unfinished PORT-001 record and completed VFX-001.
- Validation: four Node tests passed, including 30/60/120 Hz equivalence; production
  build, JS syntax and diff whitespace checks passed. Chromium WebGL exercised
  start/countdown, throttle/release, boost, all five engines, pause and restart;
  all ten nozzle ranges populated, pause froze time/count, restart cleared all.
  Inspected desktop, close camera and 844x390 renders. Final browser run: no JS,
  shader or request errors. Vite's existing large-chunk warning remains.
- Physical-device performance and subjective art approval are still unverified.

## 2026-10-26 — RACE-002: CPU driving profiles and persistent impacts

- Replaced distance-based CPU speed jumps and lane interpolation with distinct
  top-speed/acceleration/mass/reaction profiles driving the shared ship physics.
  Added corner lookahead/braking, overtaking, pad targeting and steering error.
- Added shared swept boost-pad and craft-contact rules. Pads require actual lane
  and height contact; all craft use the same boost duration/multipliers. Collision
  impulses and separation persist in authoritative speed/lateral/track state for
  player/CPU and CPU/CPU, with mass, restitution, loss and pair cooldowns.
- Reworked walls to use track width, inward bounce and severity-dependent speed
  loss; impact events trigger bank, camera and sound. Preserved normal player
  input/engine coefficients and the user's shortened thruster tuning.
- Added staggered starts, complete CPU resets, same-frame finish ordering,
  five-racer placement and CPU completion during the celebration lap.
- Verified 12 Node tests, production build, JS syntax and whitespace. Full CPU
  simulation on Neon Causeway completed with boosts, wall recovery and collisions.
  Chromium WebGL confirmed actual start/driving, a persistent rear collision
  (player 133 to ~52; CPU 35 to ~90), pause/reset, a controlled simultaneous
  finish (player second of five), remaining CPU finishes and actual retry.
  Browser runs had no console/request errors. Existing build size warning remains.
- Recorded tuning in README and current status; archived VFX-001. Balance across
  all ten tracks and physical-device performance require human playtesting.

## 2026-10-26 — RACE-003: approved catch-up for player and CPU

- Added src/catch-up.js with the agreed 2–8-second estimated gap range, maximum
  8% cap bonus, shared leader snapshot and 1.5-second smoothing time constant.
- Integrated the same allowance into player/CPU physics, CPU driving demand and
  real boost pads. Acceleration, braking, traffic safety and impact loss remain.
- Added lap/finish-aware distance limits, pause preservation and fresh-race reset.
  Preserved the user's newer CPU caps and shortened thruster settings.
- Passed all 19 tests, production build, syntax and whitespace checks. Chromium
  WebGL verified shared bonuses, unchanged leader, smooth lead-change decay,
  pause and reset, with no console/request errors. Existing size warning remains.
- Updated README tuning guidance, GDD accepted direction and system/status/file map.
  Archived RACE-002. Gap is an estimate, and final balance needs human playtesting.

## 2026-10-26 — TRACK-001: approved roadmap and first authoring delivery

- Recorded all six approved stages in TRACK_ROADMAP.md, with acceptance checklists.
  Archived RACE-003 and delivered the import/export and first 3D editor stages.
- Added a versioned JSON format with legacy migration and field-specific validation;
  unified game/editor catalog and storage. Imports create separate custom drafts.
  Save/reset touch only the selected entry; errors preserve existing work.
- Replaced the top-down canvas with shared game geometry, orbit/pan/zoom and XYZ
  handles. Added independent draft/history state, scenery inspector, save-and-test,
  portable embedded textures and preservation of built-in scenery previously lost
  by the editor's fallback. Dispose track resources when replacing geometry.
- Browser testing exposed Start accepting clicks before async model initialization;
  it now shows loading until the race and input handlers are ready.
- Preserved racing/CPU/catch-up/thruster tuning and the user's concurrent calibration.
- Verified 26 Node tests, including all ten tracks' exact geometry/length/pads after
  round-trip. Chromium WebGL passed 3D manipulation/history, import/export, invalid
  file preservation, real custom-track race start/movement, scoped reset, reload and
  landscape layout. Inspected screenshots; no JS errors or failed requests in final
  run. Build/syntax/diff checks pass with existing Vite size warning.
- Next stage: a small gap test track with shared player/CPU free flight, landing
  and recovery. Physical-device performance and subjective editor feel are open.

## 2026-10-26 — TRACK-002: gaps and magnetic loops/rolls

- Delivered the next two authorized roadmap stages and archived TRACK-001.
  Added separate Gap Run and Loop & Roll circuits, catalog slots track11/track12.
- Added shared transported/banked track frames, closed seam correction and v2
  magnetic/gap fields while preserving v1/legacy behavior and original ten tracks.
- Gaps remove actual road/fixtures and launch both player and CPU into world-space
  flight, with gravity, limited steering, landing contact and pre-gap recovery.
  Airborne collisions persist in velocity; pads/walls/checkpoints respect flight.
- Magnetic adhesion, local-up chase/cockpit/orbit cameras and 120 Hz substeps make
  banks, inversion, a full barrel-roll and vertical loop playable. Added opaque,
  gently emissive magnetic road after visually checking the inverted deck.
- Extended the editor with gap intervals/removal, bank/roll degrees, magnetic
  enable and side view. Undo, versioned sharing and save/test retain the settings.
- All 35 Node tests pass, including real gravity, low/high speed, side misses,
  airborne contacts, pause/reset, exact gap geometry, frame/camera continuity,
  30/60/120 Hz and all four CPUs completing three laps on each feature track.
- Browser acceptance passes both the existing editor suite and new feature suite:
  actual player/CPU jump and landing, pause, controlled miss/recovery, reload,
  loop traversal and controlled inverted roll view; no JS/request errors.
  The first jump trial exposed an overly demanding landing after traffic impacts;
  shortened the opening and lowered its landing, then verified normal/missed jumps.
- Inspected screenshots and passed production build/syntax/diff checks. Existing
  bundle-size warning remains. Local-axis camera impact shake is preserved and
  reset on race start; that final integration is syntax/build checked.
- Updated roadmap/status/system/design/file-map/README. Human balance, comfort
  and physical-device performance remain open. Alternative routes are next in
  the roadmap, after feedback on these prototypes; weapons remain a later stage.

## 2026-10-26 — TRACK-003: approved routes/combat and editor cloning

- Archived TRACK-002 after positive user feedback and implemented the final two
  roadmap stages plus requested scenery-object cloning (button and Ctrl/Cmd+D).
  Clones preserve texture/material/transform/animation data independently, with
  new identity, visible offset, selection and normal history/storage behavior.
- Added v3 branch definitions and editor connection/width/side/point controls.
  Open route splines join main-road frames; physical length controls travel time,
  shared section distance controls rank/catch-up, and ordered gates validate laps.
  Pads, local-width walls, contacts, CPU decisions, minimap and camera honor routes.
  Safe gap recovery after a fork uses the common road beyond its merge.
- Added Split Decision (track13) and Crossfire Circuit (track14). CPU profiles use
  both route options across three laps; narrow shortcut trades width for time.
- Added optional shared rocket, homing and minigun combat with clip/reload and fire
  limits, 0.9-second visible lock, target/threat indicators, swept moving-hull hits,
  real speed/lateral impulses, hit protection, bounded effects and firing sounds.
  Combat defaults off; pause/retry/finish lifecycle is integrated.
- All 44 Node tests pass. Browser checks pass cloning/history/sharing, branch
  editing and controlled traversal, actual key/pointer fire, homing lock/hit,
  CPU damage, pause, finish/retry and landscape layout. Existing editor acceptance
  also passes. No JS/request errors. Inspected screenshots and moved the desktop
  weapon panel off the craft; added the visible target reticle and smaller bursts.
- Build/syntax/diff checks pass with existing bundle-size warning. Final branch
  fixtures are bounded/instanced, with affected tests and build passing again.
- Updated roadmap, README and continuity docs. No nested routes/gaps on branches,
  weapon pickups, health or elimination. Minigun is a playable prototype; balance,
  sound mix, touch comfort and physical-device performance need human evaluation.

## 2026-10-26 — TRACK-004 Ion Foundry

- Authored track15, a complete 5,798-unit industrial circuit with two real gaps,
  banked turns, a technical S section, narrow raised shortcut and vertical loop.
  Added 656 editable scenery primitives, sector signs, coolant shafts, reactors,
  machine halls and loop structure. Preserved previous tracks and gameplay tuning.
- Preserved all user texture originals. Added reproducible 512-square WebP
  derivatives (39.4 MB to 0.892 MB for all 12) and five sign maps. The circuit
  loads 13 maps totaling 0.683 MB. Shared group-owned geometries/materials/textures
  reduce duplicate GPU allocations; scrolling maps retain independent offsets.
- 50 Node tests pass; six affected tests rerun after final scenery change pass.
  All four CPUs finish three laps using both routes, with six landings and zero
  recoveries. Player physics finishes on either route. Jumps, sampled clearance,
  asset budgets, round-trip and GPU lifecycle pass. Extended the second landing
  straight after a boosted-speed test exposed a premature turn.
- WebGL browser checks pass all texture requests, inspected sectors/cockpit/loop,
  both real render-loop jumps, lane-selected shortcut traversal and merge,
  landscape capture and full editor export/save/reload. Existing editor browser
  regression also passes. No JS errors or failed requests in either suite.
- Final build/syntax/diff checks pass with the existing large-chunk warning.
  Added ION_FOUNDRY.md and updated roadmap/README/continuity docs. Physical-phone
  performance, human fun/balance and loop comfort remain playtest items.

## 2026-10-27 — DRIVE-001 selectable handling and camera

- Compared the supplied tmp/src/wipeout steering and camera source. Added an
  optional Wipeout-inspired profile with independent nose/momentum, angular
  acceleration, countersteer and analog airbrakes. Existing Swipeout assist,
  default controls and CPU tuning remain available and unchanged.
- Added independent saved handling/camera selectors. Classic chase follows the
  nose without hull roll, using track-local damped correction through loops;
  cockpit retains a small roll contribution. Shared gaps/routes/collisions remain.
- Classic controller A/Cross accelerates; L1/R1/L2/R2 are independent airbrakes.
  Added input cleanup for pause/blur and captured touch steering. Classic weapon
  aim follows the nose. Landing/recovery and retry reset transient state.
- All 58 Node tests pass, including frame rates, both gaps, three-lap input-driven
  progression, camera inversion, settings, brakes and aim. Browser WebGL checks
  pass keyboard, synthetic gamepad, pointer steering/pedal, pause, real landing,
  loop/cockpit, retry and independent mode persistence. No JS/request errors.
- Production build and diff check pass; existing large-chunk warning remains.
  Added DRIVING_MODES.md and updated continuity docs. This is a first track-relative
  adaptation, not the original free-body physics. Human steering/camera feel and
  physical-phone/controller evaluation remain for playtesting.

## 2026-10-27 — TT-001 Time Attack, PB ghost and guidance

- Recorded the approved product sequence in PRODUCT_ROADMAP.md. The user accepts
  Wipeout/low-assist skill handling; retain it while adding the surrounding game.
- Added solo Time Attack: one out lap, three flying attempts, interpolated sectors
  and finish, signed PB delta and per-lap results. CPU simulation/contacts,
  catch-up and combat are excluded; normal Race remains available. Recovery
  invalidates a lap. Early end saves completed valid attempts only.
- Versioned local records isolate track revision, ship/speed/handling/assist and
  physics version. Invalid storage is ignored visibly; quota failures retain a
  session PB with a warning. Added bounded 20 Hz world-pose recording, quaternion
  replay, transparent non-physical PB ghost and overlap fading.
- Added optional geometry-based line with lane smoothing, pad attraction,
  branch estimates and a braking envelope. It follows bank/loops/routes and
  skips missing road. Local turn/gap warnings and helper preferences are saved.
  This is a recommendation, not a mathematically optimal racing trajectory.
- All 68 Node tests pass. A real input-driven physics run completes four Foundry
  laps with eight landings, branches/gates and zero recovery. Chromium WebGL
  passes solo isolation, keyboard/pause, accelerated lap recording, PB reload and
  category isolation, guide toggles, results, early end and return to Race.
  Inspected desktop/landscape/loop/shortcut/gap captures; no JS/request errors.
- Tightened the line slope near jumps after visual review, fitted Time Attack
  overlays, and corrected early-end pause-button state. Focused retry/early-end
  browser check passes after the final lifecycle fix. Final build/diff checks
  pass with the existing large-chunk warning. Added TIME_ATTACK.md and updated
  continuity docs. Human line/ghost comfort and physical-phone performance
  remain playtest items; CPU difficulty is the next planned stage.

## 2026-10-27 — DRIVE-002 Wipeout wall pinball

- Reproduced four rail hits from one collision without steering on a straight
  10-wide road. Reflected side speed, angular reflection/kick and a reversed nose
  reinforced each other. Explained nose steering versus delayed momentum.
- Centralized classic wall attitude settling in the shared resolver; removed
  heading reversal and yaw impulse, limited rebound, retained player escape
  motion, speed loss and visual impact. Cooldown contacts stop outward motion.
  Open-track steering and Swipeout/CPU collision behavior are unchanged.
- The same fixture now settles after one hit. Added mirrored side/width/30-60-120
  Hz tests and digital away/countersteer recovery; all 71 tests pass, including
  complete Foundry/Time Attack physics. Build passes with existing chunk warning.
- Versioned Wipeout PB identity only, leaving old data stored and Swipeout PB keys
  unchanged. Updated control guide and continuity docs. Human feel still needs
  replay; no browser or physical-device playtest was performed for this change.
