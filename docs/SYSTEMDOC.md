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
does not yet provide arbitrary surface collisions or route branching. Magnetic
motion substeps at at most 1/120 second; camera orientation follows local up through
loops and rolls. Decorative scenery retains authored world transforms; road rails,
markers and boost pads follow the shared frame and are omitted inside gaps.

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
