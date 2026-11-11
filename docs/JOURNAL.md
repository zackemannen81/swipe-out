## 2026-11-06 — EDITOR-SKY-FLY-001: panorama parity, fly and group editing

- Replaced the in-game moving UV panorama sphere with the same equirectangular scene.background used in the editor, retaining the camera FOV and real scenery fog.
- Added fly camera (WASD/arrows, Q/E, Shift and drag-look), multi-selection in the editor 3D viewport and group transform support.
- Added Delete and Ctrl+C/Ctrl+P for copied scenery at unchanged coordinates with new IDs, plus toolbar buttons, selection bounds and undo/redo integration.
- Focused tests 3/3; production build; isolated headless Chrome checked add/copy/paste/delete/undo, keyboard copy/paste and fly toggles, no page exceptions.
- Whole suite: 161 passed, six pre-existing failures as documented. Real-world sky and multi-click visuals remain author checks.
- Preserved the ongoing VITRUM-EDGES-001 task, track JSON version, and saved user tracks. Details: EDITOR-SKY-FLY-001.md.

## 2026-11-05 — EDITOR-TRACK-MEDIA-001: world and track authoring

- New editor UI chooses primary and alternate track audio, panorama/sky, rail side colors, CPU performance multiplier and road material/texture.
- Track JSON v9 preserves these fields for IndexedDB save, JSON import/export, Undo/Redo and Save & Test; v1–8 migrate without losing prior data.
- Vite catalog scans public/audio/tracks and public/images for select options; no manual asset manifest.
- The race loads track-specific sky/audio, rotates alternate soundtrack on playback end unless global preference overrides, and applies speed/acceleration/braking to all CPU opponents. Physical road/rails match editor.
- Left existing Vitrum edge-strip width edit and docs/CURRENT_TASK.md unchanged.
- Verified 17 focused tests and production build, plus isolated Edge editor interactions with IndexedDB save/reload and no JS errors. Full suite 158/164; six previously known failures in catch-up (3), Foundry CPU, Necros player and thruster color. No user saves modified.

## 2026-11-04 — RACE-LAPS-001: configurable lap counts

- Added saved 3/5/7/10-lap choice to Race Setup for Quick Race/Campaign.
- CPU and player finish at the same selected lap count; HUD, checkpoint counts, final-lap announcer, race/campaign records and medal limits scale correctly.
- Kept legacy 3-lap record identifiers; Cup fixed to 3/round and Time Attack one out plus 3 timed laps to preserve their progression and ghost rules.
- 22 targeted tests and production build pass. Full suite 155/161; six failures in unrelated catch-up, Foundry CPU, Necros player and thruster-visual tests. Manual browser race/visual validation remains pending.
- Preserved ongoing VITRUM-EDGES-001 task and unrelated working changes.

## 2026-11-04 — AUDIO-017: GOA by ME pause menu hotfix

- Corrected pause-menu asset path from track_017.m4a to track017.m4a.
- Registered GOA by ME for persisted soundtrack choice without changing other audio or the active VITRUM-EDGES task.
- FFmpeg AAC decode, 6 career tests, Vite build and git diff --check passed; browser playback not manually checked.
- track017.m4a is present locally but still untracked in Git.

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

- Following the user's feedback that the game feels too easy despite the graphics, music, track, and speed feeling right, raised Vanta's cruise speed from 60 to 72.5 and Singularity's from 70.5 to 78.5 world units/second.
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

- Added two visually distinct procedural rivals, Vanta and Singularity, to the existing Neon Causeway race. They use fixed lane neighborhoods, subtle deterministic lateral motion, and distinct cruising speeds of 60 and 70.5 world units/second.
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

## 2026-10-27 — README-001 SwipeOut2026 overview

- Refreshed README for the current playable build: setup, Race/Time Attack,
  PB ghost/sectors/guidance, handling/cameras, tracks/editor/sharing, CPU/combat,
  browser-local persistence and the approved next stages.
- Corrected stale top speed, procedural-craft and track-distance claims; kept
  release versions and gameplay unchanged. Archived completed DRIVE-002.
- Checked 28 local links, npm commands, browser-script paths and Markdown fences;
  diff check passes. No gameplay tests/build rerun for documentation-only edits.

## 2026-10-28 — PLAN-002 expanded wishlist

- Recorded all requested improvements with staged acceptance targets, source
  observations and recommended order. Preserve countdown unchanged; intro must
  end before it. Separate delivered features from proposals and reported defects.
- Flagged existing F/pitch mapping, missing per-point width, track-format/record
  compatibility, physical-phone checks and ship progression tradeoffs.
- Updated roadmap references and archived README-001. Documentation only; no
  gameplay changes, browser reproduction or gameplay tests claimed.

## 2026-10-28 — PRESENT-001 results and race intro

- Implemented stage A: short skippable fly-by, chase reset on retry, reduced-motion
  support and intro pause. Preserved countdown implementation, sounds and CSS.
- Reproduced clipped results heading using committed styles; sized typography to
  the card and isolated detail scrolling from heading/actions. Inspected desktop
  and small landscape screenshots including long Time Attack results.
- Test runner exposed a physics-to-game particle import cycle from recent work.
  Injected the same particle system/material at startup, preserving spark tuning.
  Updated a stale rocket clip assertion to respect the user's current value.
- All 73 Node tests and production build pass (existing chunk warning). Browser
  checks pass frozen intro state, pause, normal/skip/retry/solo/reduced-motion
  flows, legacy framing and original countdown audio boundaries. Physical phone
  and controller feel remain for playtesting. Roadmap next stage is CPU levels.

## 2026-10-28 — PRESENT-002 preferred start view

- User identified the start camera as the wrong chase variant. Confirmed the
  PRESENT-001 reset selected external and changed it to existing wipeoutStyle.
  Shared start/retry path covers Race and Time Attack. No camera tuning changed.
- Updated browser expectations; full presentation acceptance passes, including
  intro/retry mode and unchanged countdown sounds/source. Syntax/diff pass.
  This checks view selection, not high-speed curve visibility on every circuit.

## 2026-10-28 — CPU-001 difficulty and personality

- User accepted stage A in-game. Implemented saved Rookie/Pilot/Elite (Pilot
  default), safe preference fallback, per-race reset and disabled solo control.
- Added behavior profiles and separate risk personalities, occupied-lane checks,
  lap-varying shortcuts and recoverable input mistakes. Preserved user-tuned craft
  performance and player handling. Protected jump runups. Elite shared catch-up
  is 2%, Rookie/Pilot 8%; solo remains isolated.
- All 108 measured three-lap CPU runs completed on three tracks with zero gap
  recovery. Rookie/Pilot/Elite mean times ordered as intended; Elite trades more
  shortcut entries for some extra rail hits. Published reproducible measurements.
- 79 Node tests and build pass, existing chunk warning retained. Browser verifies
  save/reload/retry/runtime profiles/solo isolation/storage failure. Inspected
  desktop/landscape menu. Human race/combat balance and physical-phone testing
  remain; track tools/readability is next. Countdown and player controls unchanged.

## 2026-10-28 - TRACK-005: track tools and readability

- User approved every CPU level, committed and pushed; archived CPU-001.
- Implemented optional v4 pointWidths/pads/roadStyle with legacy v1-v3 reading.
  Shared width drives road/rails, physics, AI, guide, branch joins and landing.
- Editor supports inherited per-point width, pad position/type/route/focus,
  conservative boost suggestions and undo/save/import/export. Pads validate road
  footprint, gaps and overlaps. Authored boosts/brakes use instanced markings
  and two animated materials; brake reduces speed 28% once per pad/lap.
- Added separate track16 Raceway Workshop with changing widths and a shortcut.
  Earlier circuit data and accepted countdown/camera/handling remain unchanged.
- 86 tests and build pass (existing bundle warning); 12 CPU runs complete three
  Workshop laps. Browser authoring/reload/JSON roundtrip/start/retry passes with
  no page errors; inspected editor and desktop/landscape race screenshots.
- Updated status, roadmap, system/design docs, README and TRACK_WORKSHOP guide.
  Human balance/sign readability and physical-phone performance remain. Next: D1.

## 2026-10-28 - EDITOR-006: object colors and neon

- Added surface/glow pickers, five neon presets, glow off and default reset.
- Reused color/emissive fields; textured scenery now honors explicit colors too.
  Legacy defaults, textures, clone/history and serialized shape are preserved.
- 86 tests/build pass (existing chunk warning). Browser verifies presets, custom
  color, undo/clone, textured material values, off/reset, save/reload and export.
  Inspected editor screenshot; no page errors. Next roadmap stage remains D1.

## 2026-10-28 - COMBAT-002: D1 defence and feedback

- User approved object colors after testing; archived EDITOR-006 and advanced D1.
- Added player/CPU flares with shared 25s cooldown, 1.2s window and 140-unit range.
  CPU triggers within 85 units. Homing missiles visibly divert to decoys; rockets
  and bullets retain damage. Added X/touch/standard-gamepad B without changing F.
- Separated outgoing lock, incoming threats and diversion success, with short
  transition sounds. Added bounded instanced fading impact/flare sparks.
- 90 tests/build pass (existing bundle warning). Browser verifies input paths,
  pause/retry/solo and landscape HUD separation with no page errors. Inspected
  threat/diversion/impact screenshots; fixed overlap found on 568x320 viewport.
- Updated roadmap, status, design/system/structure docs, README and defence guide.
  Physical device/controller, audio perception and human balance remain. Next D2.

## 2026-10-28 — COMBAT-003: D2 weapon pickups

- User accepted D1; archived COMBAT-002. Empty start, one slot, 3 rocket / 1 homing /
  30 minigun ammo; replacement on pickup, no auto reload, shared 8s pad recharge.
- Added swept route-aware CPU/player pickups, ready-pad seeking, instanced visuals,
  HUD/audio and gamepad fire. Paired fallback pads improve access across the field.
- Editor supports weapon types with history/save/import/export; v5 reads v1–4.
  Time Attack/non-combat disable pads; handling and countdown remain unchanged.
- 97 tests and build pass (existing chunk warning). Browser editor/race/lifecycle
  checks pass with no page errors; desktop/editor/small landscape images reviewed.
- Updated continuity, roadmap, README and pickup guide. Physical device/controller,
  audio perception and human pickup balance remain. Next stage E: cup/progression.

## 2026-10-28 — COMBAT-004: supplied weapon icons

- Integrated user PNGs as floating, gently oscillating pickup icons and HUD art.
  Filename mapping: rockets to rocket, heatseeker to homing, minigun to minigun.
- Kept purple footprints, shared cooldown, combat rules and editor persistence.
  Three instanced batches own maps disposed through existing track cleanup.
- 97 tests/build pass (existing chunk warning). Browser editor/race/lifecycle
  checks pass; all icon URLs available, HUD decodes at 256px and hides when empty.
  Editor/race screenshots reviewed, no page errors. Physical device unmeasured.

## 2026-10-28 — AUDIO-001: announcer batch generation

- Added 49 race/combat/practice/warnings/cup lines and configurable batch script.
  Uses existing voice_creator.py and exact user two-stage SoX recipe; old scripts
  and countdown untouched. Selection/list/dry-run/skip/force with isolated temps.
- Six offline tests pass, including failed-force preservation and output checks.
  Real network TTS/FFmpeg/SoX produced weapon_acquired.wav, 2.60s PCM; 48 pending.
- SoX reported clipping from original gain settings; retained and documented for
  listening. No runtime integration. Added ANNOUNCER.md and continuity updates.

## 2026-10-29 — AUDIO-002: runtime announcer

- Connected 21 voice events for combat, final lap, Time Attack and finish/place.
  Bounded priority/expiry queue; incoming missiles preempt routine announcements.
  Pause drops stale speech; menu/retry/finish clear voice state.
- Added saved 0–100% voice control to start/pause, default 35%, shared with old
  countdown files. Countdown timer/trigger lines unchanged from HEAD; browser
  confirms Three/Two/One/Go once. Smaller pause heading prevents clipping.
- Found 37 user-created WAVs; generated 12 missing using accepted exact recipe.
  Existing assets untouched. All 49 present; no cup voice triggers yet.
- 102 tests/build pass (existing bundle warning). Browser verifies decode, saved
  volume, threats/preemption, pause/mute/retry/solo; no page errors. Desktop and
  small-landscape screenshots inspected. Human listening and physical phone remain.
- Updated guide/README/roadmap and continuity. Next: E cup/progression.

## 2026-10-29 — CUP-001: Foundry Cup E1

- User accepted announcer as-is; left runtime voice code and tuning unchanged.
- Added cup selection and three built-in rounds (track1/13/15), fixed settings,
  points/countback, actual finish-time standings and 60-second DNF closure.
- Versioned active round and configuration-specific best placement persist.
  Podium earns gold/silver/bronze; interrupted rounds restart without double points.
- 107 tests/build pass (existing chunk warning). Browser controlled finishes
  cover complete cup, DNF, reload/resume, medal, saved best and Race/TA isolation.
  No page errors; desktop and small-landscape result layout inspected.
- Updated roadmap/guide/README/continuity. Human full-cup balance remains.
  E2: time medals/cosmetic unlocks, followed by ship progression.

## 2026-10-29 - NECROS-001: playable track foundation

- Archived CUP-001 and built editable track17 from the supplied Necros concepts.
- 5.38 km, 73 points, 582 primitives; jump, core shortcut, banked cathedral,
  two-turn ascent and gated descent. Three local propaganda textures.
- Adjusted jump landing clearance and removed a vault pier crossing the shortcut.
- 112 Node tests pass; build passes with existing chunk warning. Browser confirms
  assets, intro/racing, real jump landing and editor export/save/reload, no errors.
- Inspected game/editor screenshots. Final models, sky, cinematic, human balance
  and phone performance remain. Existing handling/countdown/cup left unchanged.

## 2026-10-29 - NECROS-002: corrected route-only foundation

- Followed user clarification: long parade, around/through cathedral, rising tower
  spiral with through passages, summit exit/dive, monuments and sharp return.
- Removed placed scenery, jump and branch. 88 points, approximately 9.15 km.
- 110 tests and build pass; existing chunk warning. Browser live dive, sector
  captures and editor export/save/reload pass without errors.
- Preserved user browser saves; documented Restore Built-in for old overrides.
  Final buildings, human balance and physical-phone performance remain.

## 2026-10-29 - PHYSICS-001: slope momentum

- Shared tangential gravity and weak drag; engine limit no longer caps momentum.
- CPU keeps downhill speed on clear straights across all three difficulties.
- New Time Attack identities isolate old physics records without deleting them.
- 113 tests/build pass. Browser coasting Necros dive: ~140 to ~258 world units/s,
  no recovery/errors. Brake/boost expiry, modes, slopes and frame rates checked.
- Foundry traversal harness uses centering assist for neutral steering at new
  downhill speeds; original six landing and route requirements still pass.

## 2026-10-29 - HUD-001: consistent speed units

- Found current-speed overwrite used *36 while MAX/trip use 3.25m/world unit.
- Current HUD now reuses MAX conversion (*3.25*3.6); physics unchanged.
- Build passes (existing chunk warning). Browser dive HUD: current 3014, peak
  3016 km/h, consistent conversion; no page errors, editor checks pass.

## 2026-10-31 - RENDER-001: HDR protection enabled by default

- User confirms F5 HDR sanitize prevents black rectangular artifacts on Necros.
- Existing safety shader now starts enabled; diagnostic toggling retained.
- Build passes with existing bundle warning. Isolated WebGL two-load/toggle
  checks pass without page errors. Initial test instrumentation used a duplicate
  ShaderPass module; corrected to inspect the actual pipeline pass.
- Preserved prior task record as-is; no new completion claim for its stale status.
- Custom saved tracks, countdown and rendering shader math unchanged.

## 2026-10-31 - MENU-001: hangar, menus and campaign preview

- Added animated front-end views and separate 3D hangar sharing the HDR pipeline.
- Reused craft assets and a Necros facade; added paint, earned chassis/modules,
  campaign trophies and configuration-specific fastest results with local saves.
- Added saved display/music preferences, reused existing flight/voice controls,
  preserved countdown and isolated factory performance for TA/cup.
- Campaign fly-by uses the supplied trailer and saved custom Necros when present.
- Browser verifies navigation, preview, finish rewards, persistence, loadouts and
  factory isolation without page errors; desktop/small landscape inspected.
- 19 focused tests pass. Full suite 121/122: Foundry CPU zero-recovery expectation
  also fails at HEAD 9c91816 in a separate baseline copy. Not caused by this wave.
- Build passes with existing chunk warning. No user track saves or commits made.

## 2026-10-31 - CAMPAIGN-002: pin Dark PRIME
- User supplied exact custom ID; campaign and preview now use that ID only.
- Missing data disables entry/preview; message explains origin-local saves.
- Campaign rewards require exact ID; saved track names/data unchanged.
- Build, two career tests and isolated Chrome menu checks pass, no page errors.
- Same-name test fixtures confirm selection; actual authored scene not inspected.


## 2026-11-01 - SCENERY-001
- Added editable point lights, spin/shuttle/orbit, first embedded GLB clip playback.
- Shared editor/game updater, editor-only light markers, frozen race pause, mixer disposal.
- GLB UUID bindings remapped for cloned unnamed nodes; regression tests cover it.
- Version 7 reads old tracks. Necros rails/edges now blood red.
- Build and browser checks pass; 126/127 tests (known Foundry recovery failure).
- User saves untouched; no commit or push.


## 2026-11-01 - FINISH-001: roadmap completion pass
- Audited E-G against implemented menus/garage/scenery; corrected stale checkboxes.
- Added glow/music pulse, SFX/mute/mix, Race records, time medals and Silver unlock.
- Added course cards/categories/current PB, gamepad navigation, Necros patrols/signs.
- Added load-responsive engine and short brake/scrape/landing cues; closed replaced audio contexts.
- Traced Foundry failure to downhill overspeed at gap; CPU now brakes on earlier run-up.
- All 132 tests pass; original Foundry assertions unchanged. Build passes with bundle warning.
- Isolated browser flows pass and screenshots inspected; user saves untouched.
- Physical device, listening and human content balance remain explicit checks.


## 2026-11-01 - GIT-001
- Removed two oversized GLBs from four unpublished commits; retained local files and backup branch.
- Exact paths ignored; all other committed content preserved; largest outgoing blob 13.95 MB.
- Normal push to origin/main succeeded without force.


## 2026-11-01 — MOBILE-001
Revisited existing mobile HUD/touch input. Replaced single shared throttle press state with per-button pointer tracking and safe cleanup, prevented touch steering while gyro or pause is active, recalibrated gyro relative to initial device grip with deadzone/stale-reading safety. Vite build passed; 132 Node tests passed. Physical phone validation still needed.

## 2026-11-01 - GARAGE-002
- Installed supplied garage.jpg unchanged; live customizable ship over platform with fixed camera and cover crop.
- Removed procedural hangar/facade loading; retained motion preference and live craft glow control.
- Build and isolated menu flow passed without page errors; desktop and small landscape screenshots inspected.
- No commit/push; preserved pre-existing mobile, track and image edits.


## 2026-11-01 - REWARD-001
- Added supplied Necron Crimson Citadel craft and Vi lever inte song, shared all-five-challenge unlock.
- Added isolated local-development preview grant, persisted song selection in Settings/pause; trophies unchanged.
- 134 tests and build pass. Isolated browser verifies craft/audio/persistence/menu; production fresh locks verified.
- User browser unavailable; author test rewards apply on next local reload. No commit/push.


## 2026-11-01 - REWARD-002
- Added The sacrifice GLB and consolation trophy: completed 5/5, Swipeout, full assist, Rookie; Race only.
- Snapshot start settings and require completed distance, separate from post-finish autopilot and mastery goals.
- 135 tests/build passed; controlled browser finish verifies award, persisted selection, garage/grid model. No page errors.
- No automatic test grant for this prize; no commit/push.


## 2026-11-01 - THRUST-002
- Blood-red player/CPU wakes and sparks; four Sacrifice outlets, five Citadel, two for other hulls.
- Craft-local outlet layouts, narrowed widths, safe geometry disposal/reset on loadout switches.
- Five thruster tests and build pass. Isolated live racing checks and screenshots verify 4/5 jets, no page errors.
- No commit/push; preserved unrelated work.


## 2026-11-01 - THRUST-003
- Crimson visual hull/nozzles x1.10, reward jet widths x1.50; restored other player/CPU accent colours.
- Six thruster tests/build pass, browser checks 3.465 hull extent, CPU colours and 4/5 live wakes; screenshot inspected.
- No model export or physics changes; no commit/push.


## 2026-11-03 — VITRUM-001
- Added separate track18, Vitrum Lithofyter · Neural Ascent, using all nine stage2
  models and the supplied concepts. Seven sectors, banked continuous road,
  elevation/descent, lane-choice boosts, editable forest and neural landmarks.
- Added organic road texture, amber/turquoise rails and per-race forest atmosphere.
- Geometry and real GLB bounds checked; player/12 CPU configurations finish three
  laps. Browser verifies GLB loads, sector views and editor export/save/reload.
- Build passes. Full suite 141/142; existing Sacrifice jet width mismatch (.775
  implementation / .675 test) retained. Human/device balance remains unverified.
- Source models and prior working edits retained. No commit or push.

## 2026-11-03 — VITRUM-002
User rejected sparse environment, requested completion before supplying final
sky/trailer/music. Replaced first art pass with seven connected textured organic
GLBs: sanctuary, canopy, ascent supports, closed neural vault, ravine, drive-
through Bloom and return bridge. 220 supplied-model instances form colonies.
Neutral sky separates actual geometry from future user panorama; concept card
retained. Indexed/merged module geometry, embedded texture, reproducible tools.
Six Vitrum tests and browser editor/race checks pass, build passes. Full suite
142/143 with the pre-existing thruster-width mismatch retained. Actual triangle
clearance checked at 1,200 stations/five lanes. Human/device tests remain.
Saved tracks and unrelated working edits preserved. No commit or push.

## 2026-11-03 — VITRUM-003 media
Supplied 4096x2048 backdrop_track-017.jpg replaces temporary sky; track15.m4a
is default, track15/16 available and persisted in Settings/pause. Unrestricted
music choices use explicit allowlisting, preserving Necros reward restrictions.
Source assets unchanged. Build/12 career-library tests pass. Browser decodes
both stereo M4As and sky, verifies playback and persisted selections. No commit.

## 2026-11-03 — VITRUM-004
Built an original luminous forest city from the user's Avatar direction:
23 three-level settlements, 345 pods, 12 overhead footbridges, side promenades,
hanging lanterns and 280 glowing fronds. Six merged material batches per module;
small meshes use reduced tessellation. Assets ~30.6 MiB. Visual review moved
terraces lower/closer; inspected driving views and habitation detail. Six Vitrum
tests including real mesh clearance and three laps pass; build and isolated
browser/editor flow pass. Sky/music/route and user saves retained. Full suite
not repeated; prior unrelated thruster mismatch remains documented. No commit.

## 2026-11-03 - VITRUM-005
Applied all six supplied forest PBR families with correct UV scale, normal/
roughness data, neural emission and shared embedded maps. Added road clear coat,
small sky reflection, edge weathering and mottled organic vertex shading. User
then provided live screenshots of floating bases and requested denser vegetation
and warmer light. Measured source-model feet, aligned plants and generated 219
rooted soil supports after corridor adjustment; reserved their full footprint
against lower bends. Closed shoulder gaps and added 2,244 foliage clumps, 754
small fungi and 1,126 violet sprays. Warmed sun/ambient fill and softened fog.
Contact tests found dome-shaped footing gaps; flat soil caps with deep root
bases fixed them. Negative-zero rotations normalized for JSON round-trips.
Six tests now pass, including original triangle support/road rays; test-only
spatial bins reduce that check to ~26 seconds. Browser validates all GLBs/maps,
race views and editor save/export/reload without page/HTTP errors. Fixed a test
instrumentation replacement that had observed an unused older spawn function.
Build passes (existing bundle warning). Assets 95.8 MiB, ~64-215 whole-frame
draws / 0.87-3.36M triangles. No target-device FPS certification or full-suite
rerun. User saves, original media/source models and unrelated working edits
preserved. Old saved Vitrum needs built-in restore after export to adopt new
placements. No commit or push.

## 2026-11-03 - VITRUM-006: layered forest screen
User requested an image-based enclosure with megaforest silhouettes, hanging
roots and crossed-plane undergrowth. Added route-aware, world-fixed scenery in
src/vitrum-forest-screen.js, integrated only for Vitrum in createTrack. Three
forest rings, 28 curtains and 428 triple-plane plant clusters: 1,360 cards,
2,720 triangles, five instanced draws. Built-in image generation produced three
1536x1024 RGBA assets (8.86 MiB loaded), with exact prompts saved. A second
curtain edit removes a matte found during visual review; unused v1 retained.
Ten targeted tests and production build pass. Isolated Chrome confirms image
loading/alpha, seven sectors, all models, editor export/save/reload and exact
preservation of a synthetic 232-object saved override. No page/HTTP errors.
Inspected driving/editor images; captures 69-219 draws, 0.87-3.34M triangles.
Device FPS/overdraw unmeasured; cards remain automatic, not editor objects.
Saved user work, source models, panorama and soundtrack unchanged. No commit.
Evidence: tmp/vitrum-screen-{tests,browser,build}.txt and tmp/vitrum/.
## 2026-11-03 - TEXTURE-001: transparent image textures
User requested transparent-background texture uploads. Original uploads already
retained alpha; primitive materials ignored it when opacity was 1. Added default
cutout and optional soft blend, with opacity-scaled cutout threshold, correct
depth settings, clamped static maps and mode-aware material sharing. Retained
front-face rendering after real pixel checks caught mirrored back-face textures
filling holes on closed boxes. Scrolling maps still repeat independently.
Editor adds mode selector, transparency guidance and checkerboard thumbnail.
Format v8 stores optional textureAlpha and reads v1-7; no saved user data rewritten.
31 relevant tests and final production build pass (existing chunk-size warning).
Isolated Chrome validates PNG/WebP actual pixels and depth, half alpha, low
opacity, JPEG/untextured objects, primitive modes, cache and disposal. Actual
file upload, undo/redo, exact image bytes, IndexedDB reload, export/import and
Save & Test race pass without page/HTTP errors. Screenshot inspected. Full suite
not repeated; prior unrelated thruster expectation remains. No commit/push.
Evidence: tmp/texture-alpha-{browser,tests,build}.txt and tmp/texture-alpha/.
## 2026-11-03 - VITRUM-007 lighting
Vitrum sun intensity is 0.65 (formerly 3.4), hemisphere fill 0.48 (formerly
1.95). Game and editor share the darker treatment. Thirteen world-fixed point
lights follow route stations, alternating banks, 18 units above the road:
amber with two mint accents, intensity 8500, range 240, decay 2, no shadows.
Automatic lighting also applies to saved Vitrum variants without rewriting
objects. Forest image cards are tinted to 65% to match. Lighting adds fragment
shading cost; target-device FPS is not measured. Generated lights are tuned in
src/vitrum-lighting.js, separate from user-authored editable lights.
Visual correction: final intensity 850, height 24, side offset 35; the initial 8500 produced excessive road bloom.

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

## 2026-11-03 - HOP-001 investigation
User accepts both steering modes but reports occasional Swipeout hop. Inspected
physics and cameras; no confirmed cause or implementation changes. Need track,
motion direction and edge/open-road context to distinguish crest flight, impact
or follow-camera clearance correction. Current task remains In Progress.

## 2026-11-03 - HOP-001 camera correction implemented
User clarified upward bump and supplied Desktop/skutten.mp4. Extracted overview
and sequential frames show Vitrum forest driving. Camera-only Vitrum traversal
at 240 units/sec reproduces screen-space vertical kicks without physics/impacts.
At 60Hz the maximum change in successive projected vertical steps was .01021
NDC (5.51px at 1080p). Track-camera now damps clearance in road-local height,
retains horizontal world-space follow lag, and aims directly from the filtered
camera position/up instead of applying a second world-space quaternion delay.
Combined correction reduces measured kick to .000343 NDC (.185px); height-only
trial did not solve it and rotation-only trial left clearance-related kicks.
No ship physics or steering tuning changed. Wipeout camera untouched.
27 tests pass including new full-Vitrum projected-motion regression at 30/60/120Hz,
loop/roll clearance, pause/reset, handling, gaps and collisions. Build passes
with existing chunk warning. Evidence: tmp/hop-tests.txt, tmp/hop-build.txt,
tmp/hop-track-probe.mjs. No interactive post-change playtest yet; user confirmation
that this resolves their recorded sensation remains pending.
## 2026-11-03 - GLOW-001 neon underbody lighting
User accepted HOP-001 camera improvement. Replaced craft.js additive flat glow
plane with four accent-colored PointLights at x +/-0.55, y -0.12, z +/-0.85.
Each uses intensity 4, distance 5.5, decay 2, no shadows; actual road materials
receive overlapping light pools. Applies to player and CPU craft via createCraft.
Build passes (existing chunk warning). Stub-loader runtime check confirms four
lights, color/shadow settings and road clearance at normal +/-0.76 rad banking.
Evidence: tmp/underglow-check.mjs and tmp/underglow-build.txt. Visual appearance
and hardware FPS not verified in-browser; four lights per craft adds fragment
lighting cost even with short range, and glossy surfaces may retain highlights.
## 2026-11-03 - THRUSTER-001 age taper
Changed ribbon half-width multiplier from 1 + age * .35 (expansion) to
(1 - clamped normalized age)^1.2. Full width at nozzle, about 44% at half-life,
3% at 95% lifetime and zero at expiry. Core and halo share tapered geometry.
No lifetime/power/color/particle changes. Geometry test covers monotonic width
and camera-aligned fallback. Six thruster tests pass; one pre-existing hull width
expectation fails identically before/after (.775 actual vs .675 expected).
Build passes with existing chunk warning. Evidence: tmp/thruster-taper-baseline.txt,
tmp/thruster-taper-tests.txt, tmp/thruster-taper-build.txt. No visual playtest.
## 2026-11-03 - GLOW-002 original single light restored
User screenshot shows four distinct highlights and prefers original one-light
underglow. Restored settings verified in 6d61365:src/craft.js: one accent-colored
PointLight, intensity 1.8, distance 4, position (0,-.01,.1), no shadows. Removes
four-light arrangement; no flat glow plane. Thruster taper/camera/physics retained.
Production build passes (existing chunk warning), tmp/underglow-single-build.txt.
Visual confirmation awaits user. Supersedes GLOW-001 lighting design.
## 2026-11-03 - TOUR-001 Tour Bus blockout
User accepts current tracks/handling/graphics and requested simple-geometry hub
plus an object replacement document, guided by supplied carrier/hangar concepts.
Implemented opt-in THE TOUR BUS home entry and return shortcut from submenus.
Five camera stations: Grand Hangar, Service Bay, Tournament Nexus, Pilots Lounge,
Observation. Equipped craft/paint cloned from existing assets; geometry shared,
materials owned. Named geometry covers 44 replaceable groups; industrial ribs,
docks, crane, lounge furniture, banners, console, planet/window and star field.
World selection changes procedural planet tint. Necros delegates to exact saved
Dark PRIME campaign flow and remains unavailable without that browser-local ID.
Vitrum delegates to track18 open race; no new campaign rewards or progression.
Lounge has four public lore transmissions; no spoiler content or full NPC system.
Geometry/layout is a prototype, not final art; no new concept images or large
models are shipped. Markdown and JSON asset inventories generated from live scene
by tools/document-tour-bus.mjs, with Swedish purpose, dimensions, positions,
replacement priorities and optimization targets. See docs/TOUR_BUS_OBJECTS.md.
Validation: six scene/career tests pass; production build passes (existing chunk
warning). Isolated Chrome verifies all stations, garage, Vitrum actual race start
and abandon/menu return, missing Necros handling, seeded exact Necros setup,
390x844 layout, reduced motion and Escape; zero page errors. Screenshots inspected;
initial camera/pillar obstruction corrected. Hardware/mobile FPS not measured.
Evidence: tmp/tour-tests.txt, tmp/tour-browser.txt, tmp/tour-build.txt,
tmp/tour-hangar.png, tmp/tour-workshop.png and other station screenshots.
## 2026-11-03 — VITRUM-STUNTS-001
Added a 20 m gap after 321 m and a full 1,051 m magnetic roll in Neural Ascent.
Raised/widened landing and raised roll maintain clearance against actual scenery.
Kept scenery authoring snapshot for generator and left handling/custom saves alone.
Tests: Vitrum 6/6, original camera regression 1/1, track features 10/10; build OK
(existing chunk warning). CPU all difficulties and both player modes land all three
laps without recovery. Original camera regression explicitly uses original rises.

## 2026-11-03 — TOUR-PLANET-001
Added supplied Necros surface, 0.25-opacity cloud shell and space sky to Tour Bus.
Independent slow rotation and faint surface emission; Vitrum switching preserved.
Scene test, build and isolated browser texture/switching check passed; screenshot
inspected at tmp/tour-necros-textured.png. Updated object inventory.


## 2026-11-03 — TOUR-MOON-PAD-001
Added small textured Necros moon and user's repair platform GLB to hub.
Lazy model load with fallback, uniform fit, grounded base, central-deck craft
height and owned resource cleanup. Workshop camera raised; 45-group inventory updated.
Scene test/build and browser rendering/world-switch checks passed. Screenshots
inspected: tmp/tour-repair-platform.png, tmp/tour-necros-moon.png.


## 2026-11-03 — TOUR-SKY-002
Replaced Tour Bus sky map with supplied warm Gemini JPG; retained prior asset.
Browser decode/switching check passed; inspected observation screenshot.


## 2026-11-03 — TOUR-DOCKS-001
Trial left dock modules, side port and shared generic Space Shuttle copies added.
Shuttle simplified 2,073,209 to 232,156 triangles, 80.54 to 17.61 MB. Its open
cockpit/interior appearance is provisional. Opponent assignments unchanged.
Scene test/build pass; browser loaded eight instances, no page errors; screenshots inspected.


## 2026-11-03 — CPU-ELITE-AUDIT-001
Investigated Neural Ascent / Swipeout / Elite / assist off runaway-lead report.
Confirmed intentional shared 2% cap vs 8% other levels, delayed 2–8 s activation,
correct accumulated-distance accounting and engine-only allowance. Exact symptom
not reproduced by input-only Vitrum simulation. Tests 15/16; existing Foundry
Elite-faster-than-Pilot assertion fails (116.122 vs 113.439 s means). No runtime
changes; documented weak catch-up and AI balancing concern, not proven sign bug.

## 2026-11-04 — CPU-ELITE-BALANCE-001
User requested quick balance pass. Raised Elite shared catch-up ceiling 2% -> 8%
and updated menu description. Player handling and AI braking unchanged.
Catch-up suite 7/7; difficulty suite 5/6: Elite now beats Pilot, but existing
Pilot-faster-than-Rookie assertion fails. Latest Foundry means: Rookie 111.271 s,
Pilot 111.446 s, Elite 105.378 s. Remaining Rookie/Pilot ordering needs later tuning.
Build passes with existing bundle-size warning. Player feel still needs playtest.
## 2026-11-10 — TOUR-ZONES-001
Implemented plan-based Tour Bus room separation, retaining existing object IDs,
GLB assets, racer loadout, world selection and departure wiring. Added shared
16-zone graph and five stations across decks 3–5. Diplomacy transit is logical;
future zones stay unavailable. Short fade cuts mask all between-room relocation;
back history is shared by Escape/footer/gamepad, and garage returns to workshop.
Supplied overview received during implementation and used for all logical positions.
Prior Vitrum task archived as unfinished, not claimed complete.
10 targeted tests and build pass (existing chunk warning). Isolated Chrome checks
all destinations, garage return, footer/Escape, Vitrum actual race and menu return,
missing/seeded exact Necros track, mobile viewport and reduced motion: PASS, zero
page errors. Screenshots inspected at tmp/tour-{hangar,workshop,briefing,lounge,
observation,mobile}.png. First browser attempt was interrupted by development hot
reload; final unchanged-source run passes. Physical devices/listening untested.
Updated generated object inventory and model/audio recommendations; existing images
suffice. Room shells are functional blockout, with detailed art left for later.

## 2026-11-10 — TOUR-LOOP-001
Selected GDD M1-07 as next step after accepted room separation. Added guarded
per-tab Tour Bus session storage and carrier-origin setup/race/results routing.
Preserves world/station on reload, resets interrupted races to hangar without
awards, preserves origin through retry, and keeps ordinary menu return behavior.
Existing game race/finish/countdown code unchanged; frontend owns return context.
12 focused tests pass; build passes with pre-existing chunk-size warning.
Browser tools/verify-tour-loop.mjs passes reload, setup Back, actual abandon,
controlled real finish/result return, retry and regular-menu race isolation;
zero page errors. Prior zone work remains intact and task archived.
Remaining M1 work: final chosen GLB art and zone music/ambient announcements.

## 2026-11-10 — TOUR-AUDIO-001
Integrated user-supplied media and exact README scripts. All source copies hash
match; 20 MP3 files decode. Actual recordings are 00–09; eight scripts lack audio
(10–16, 16B), documented rather than assuming the user's estimate of five.
Implemented first-arrival welcome/room transcript, normalized visited flags,
holographic panel, skip/retry, discovered archive replay and room music ducking.
Imported extra tracks are manually selectable; standalone announcement has no
README transcript and is treated as audio-only. Future/locked rooms stay hidden.
15 targeted tests/build pass; final Chrome flow passes actual playback, ducking,
keyboard skip/archive/retry, navigation cancellation, saved flags, mute/mobile
and leave-hub cleanup with zero page/media HTTP errors. Screenshots inspected.
First browser attempt had an ambiguous test locator (nav and archive share a
room title); scoped to archive, then reran successfully including keyboard checks.
Listening quality and real devices remain unverified. Earlier race-flow harnesses
seed visited intro flags so their Escape navigation assertions remain isolated.

## 2026-11-10 — TOUR-AUDIO-002
User supplied voices 10–15 and reserved 16/16B for personal Zacke narration.
Copied six MP3s unchanged; regenerated manifest and updated coverage document.
All six hashes match and full decoding succeeds, lengths 37.56–62.136 seconds.
Manifest assertions verify 00–15 URLs and null 16/16B; build passes with existing
chunk warning. No navigation, profile or playback-code changes.

## 2026-11-10 — TOUR-WORKSHOP-001
User approved making Open Garage feel like an interior Service Bay work view.
Reused frontend garage and existing bus navigation/crew UI with contextual headings,
local fade and continuous workshop audio. No new customization path or art changes.
15 targeted Node tests/build pass. Isolated browser verifies same live media elements
advance through the transition, paint persists after reload, Back/room navigation,
reduced motion, mobile layout and standalone garage. Zero page errors; screenshots
at tmp/workshop-integrated.png, workshop-crew.png and workshop-mobile*.png inspected.
Initial harness attempted standalone home navigation in portrait and encountered the
existing rotate-device overlay; final test uses desktop for that separate flow.
Prior general bus test now awaits the local garage transition before assertions.

## 2026-11-10 — TOUR-ART-REVIEW-001
Inventoried and visually reviewed 29 supplied artwork images via three contact
sheets. Recorded filenames, dimensions, proposed roles and exact duplicate pair.
Recommended Observation as next environment pass, then hangar and pilot/poster
presentation. No runtime import/replacement; no testing/build for documentation.

## 2026-11-10 — TOUR-OBSERVATION-001
User requested modeled observation architecture plus an asset shopping list for
a future free-model GitHub connection. Used concept 29 for vaulted aperture,
railing, vegetation placements and warm lighting, preserving existing world systems.
Implemented via shared Tour Bus helpers/resource owner in src/tour-observation.js.
Updated object inventory (67 groups), camera and prior browser camera expectation.
Delivered detailed model/texture priorities, searches, slot IDs, local/world
coordinates, sizes, import guidance and JSON slots. No repo access needed yet.
16 Node tests/build pass. Browser Necros/Vitrum/mobile/Back checks pass with no
page errors; screenshots tmp/observation-{necros,vitrum,mobile}.png inspected.
This is architecture with colored materials/proxy props, not final textured art.

## 2026-11-11 — TOUR-STAGES-001
Integrated three Desktop stage exports with separate library keys because Necros
and Collective share an authored ID. Import validates v9 and exact field parity;
content-addressed extracted PNG/JPEG/GLB files avoid large embedded JSON strings.
Nexus now offers all three and uses existing campaign/open-race navigation.
Verification: 21 targeted tests pass; build passes; all three real Chrome races
load all GLBs without page/model errors, return to hangar, and appear in editor.
Screenshots tmp/stage-{necros,vitrum,collective}.png inspected. Initial browser
wait used Playwright timeout in the argument slot; corrected to the third argument
and reran successfully. Vitrum is dense; no device-performance claim.
Broader suite: 177 tests, 171 pass, 6 fail (3 catch-up, Foundry path traversal,
Necros dive completion, hull accent expectation). Import does not change these
physics/render modules; failures documented rather than changing game balance.
Desktop originals and prior library/browser data preserved. See TOUR_STAGES.md.

## 2026-11-11 — AMBIENT-PARTICLES-001
User confirms the three stages play as intended and requests connection of their
existing ambient effect instead of physics work. Kept their module intact, enabled
on non-Vitrum tracks, added game/flyover/editor uniform updates. Existing Vitrum
spores remain exclusive. Tests verify actual group construction, disposal and
immutable positions; browser verifies real race animation/pause and editor toggle.
2 targeted tests/build pass; Chrome Necros/Collective and editor pass without page
errors, screenshots inspected. Test hook was corrected to read the current rebuilt
track through a getter rather than the startup track. No gameplay changes.

## 2026-11-11 — PROGRESS-SAVE-001
User approved particle density and reported Rookie/Elite playtests and a close win.
Selected the screenshot's explicit record-write error as the next concrete fix.
Added ordered dual-store snapshots for career/race records, legacy read-through,
async success/error feedback, and pause-soundtrack persistence via the shared owner.
Retained original local data. No changes to track art, difficulty or particles.
10 tests pass (career plus quota/reload/legacy/order/failure recovery cases).
Chrome injected QuotaExceededError and confirmed result/profile survive reload via
IndexedDB; both stores blocked reports failure, with no page errors. Controlled
frontend finish used for persistence verification. Build passes with chunk warning.
Exact cause on user's active browser remains unknown; no claim of recovered old time.

## 2026-11-11 — TOUR-BLOCKOUT-001
User collects assets while development completes whole-carrier blockout and shared
procurement list. Added ten public rooms and sealed restricted volume; kept the
five established scenes, real imported assets and garage flow. Added public room
select, adjacent links, shared session validation and existing supplied intros.
Current-zone geometry/light visibility limits render work. Generated 143 object
entries and delivered room-by-room/shared-kit asset guide with candidate handoff.
10 focused tests/build pass. Browser visits all new rooms, reloads museum, triggers
Medbay first visit, checks mobile and Back without errors. Inspected all room images;
corrected archive/cargo camera obstructions then reran browser checks. No final
material/lighting pass, room-service gameplay or free-walking implementation.

## 2026-11-11 — TOUR-ASSET-COLLECTION-001
Clarified one candidate per asset type, with separate generation backlog. Browser
initialization failed in both CUA and node_repl; Chrome connector also unconnected.
Prepared external candidate folder and copied user's already-downloaded Leafy Fern,
verified exact SHA-256 and parsed GLB metadata. Did not label unsearched types as
missing or claim downloads. Task remains in progress pending working browser tools.
