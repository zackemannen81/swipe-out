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
