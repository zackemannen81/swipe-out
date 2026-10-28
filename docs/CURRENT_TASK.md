# Current Task

Task ID: CPU-001
Status: Complete
Created: 2026-10-28

## Scope

Stage B: saved Rookie/Pilot/Elite selection, behavior-based CPU difficulty and
separate driver risk personalities. Lower shared catch-up on Elite. Preserve
user-tuned craft caps/acceleration, player handling, countdown and Time Attack.
User has playtested and accepted stage A including wipeoutStyle start.

## Definition of done

- [x] Race selection persists safely; solo disables difficulty and catch-up.
- [x] Braking, precision, traffic/shortcut decisions and mistakes vary by level
      and personality without teleportation or hidden top-speed increases.
- [x] Elite uses reduced catch-up equally for CPU and player.
- [x] Repeatable multi-track simulations compare times, wall hits, pads/routes;
      lifecycle, storage and browser menu/retry flows verified.
- [x] Tests/build and continuity/roadmap updated; human balance limits recorded.

## Verification

79 Node tests and build pass (existing bundle warning). All 108 measured CPU
runs finish across three tracks and three levels; results in CPU_DIFFICULTY.md.
Browser persistence/retry/runtime/solo/quota flows pass; menu screenshots checked.
Countdown code identity and diff checked. Human balance is still a playtest item.
