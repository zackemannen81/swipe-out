# Current Task

Task ID: PORT-001
Status: In Progress
Owner: Agent 008
Created: 2026-10-12
Last updated: 2026-10-12

## Task Summary

Port the reference game's driving behavior in six controlled steps (0–5), prioritizing behavioral parity before adding touch controls or accessibility/ease-of-play simplifications. The requested parity scope is controllers, camera switching and view/viewport, physics, speed, steering/handling, collisions, crashes, and out-of-bounds behavior.

## Step plan

### Step 0 — Inspect and decompose (current)
- [x] Read repository instructions and docs-first sources of truth.
- [x] Inventory the current implementation owners: `src/game.js`, `src/track.js`, `src/track-data.js`, `src/craft.js`, and `src/opponents.js`.
- [ ] Inspect the reference functions in bounded sections and record exact constants, state transitions, and event ordering.
- [x] Define the remaining implementation steps below.

### Step 1 — Controllers and camera/view
- Port controller modes, input mapping, camera switching, view/viewport rules, resize behavior, and camera transitions.
- Acceptance: each reference mode has a matching local state path and deterministic resize/camera checks.

### Step 2 — Physics and speed
- Port acceleration/deceleration, gravity/hover behavior, velocity limits, boost/brake effects, and time-step handling.
- Acceptance: scripted time-step comparisons cover rest, throttle, braking, airborne, and recovery states.

### Step 3 — Steering and handling
- Port steering response, lateral drift, yaw/roll alignment, airborne handling, and surface/track-frame interaction.
- Acceptance: scripted steering traces reproduce reference direction, displacement, and settling behavior within documented tolerances.

### Step 4 — Collisions, crashes, and out-of-bounds
- [ ] Port craft/track/opponent collision tests, crash state/timers/resets, impact response, boundary recovery, and race-flow consequences.
- [x] Add an initial player-vs-CPU overlap response based on reference `ship_collide_with_ship`: positional separation, shared-mass velocity response, and impact cooldown. This is a scale-adapted first slice; geometric hull tests and remaining crash/recovery behavior are outstanding.
- Acceptance: scripted cases cover opponent impact, wall/track impact, crash recovery, and leaving/re-entering bounds.

### Step 5 — Verification and parity cleanup
- Run build/syntax/whitespace checks, targeted simulations, and interactive browser checks where available.
- Update status, journal, README, and task documentation with verified behavior and limitations.
- Do not add touch simplification/easy mode until Steps 1–5 are verified.

## Definition of done

- [ ] Steps 1–4 are implemented against inspected reference behavior, not assumptions.
- [ ] Step 5 verification is complete or blockers are explicitly documented.
- [ ] Touch controller and simplification work remains separate follow-up scope.

## Scope and evidence notes

The current repository status confirms that opponents currently have no collision system and that the existing physics/handling are arcade behavior. The reference source must be inspected in bounded sections before claiming 1:1 parity. If the reference cannot be accessed or read reliably, record the blocker and do not invent matching constants or behavior.
