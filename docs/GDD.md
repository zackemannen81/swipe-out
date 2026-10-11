# Game Design Document (GDD)

**Project:** Swipe-out
**Document status:** Initial design baseline; proposed details require playtesting
**Audience:** Product, design, art, audio, and engineering

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
| Kestrel | Responsive steering | Lower top speed | Nimble and accessible |
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

Prototype a small field first. Opponent count, named personalities, catch-up
assistance, collision rules, and difficulty selection remain to be tested.

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
