# Current Task

Task ID: TT-001
Status: Complete
Created: 2026-10-27

## Scope

Deliver the approved next stage: solo Time Attack, durable personal lap bests,
sector timing/deltas, actual recorded ghost playback, recommended racing line
and sharp-corner warnings. Preserve accepted handling. Record subsequent approved
CPU/cup/audio/presentation stages separately in PRODUCT_ROADMAP.md.

## Definition of done

- [x] Solo mode excludes CPU simulation/contacts, combat and catch-up.
- [x] One out lap and three flying laps, interpolated sectors/finish timing,
      recovery-invalidated laps, safe pause/retry/menu lifecycle.
- [x] Versioned records separated by track revision, ship, speed class, handling
      and effective assist; corrupt/unavailable/quota storage handled visibly.
- [x] Fixed-rate world-pose ghost replays PB timing/branches/gaps/orientation,
      is non-collidable and bounded; comparison shows signed deltas and sectors.
- [x] Optional surface-following recommended line, pad/route guidance and local
      sharp-turn warnings; no ribbon over missing road, safe in loops/branches.
- [x] Desktop/touch HUD/menu/results, saved guidance preferences and clear limits.
- [x] Meaningful tests, browser acceptance/visual checks, regressions/build pass.
- [x] User guide, approved product roadmap and continuity docs updated.

## Verification

- All 68 Node tests pass (ten new TT tests). Includes off-frame 30/60/120 Hz
  timing, lap validity, storage failure/isolation, replay, guidance and a real
  input-driven four-lap Foundry physics run with eight landings/no recovery.
- Chromium WebGL acceptance passes real solo render-loop isolation, keyboard/
  pause, accelerated complete laps, PB/ghost/storage reload, category separation,
  helper toggle persistence/visibility, early end and return to Race. No JS or
  failed HTTP responses. Final focused early-end/retry/pause-button check passes.
- Inspected menu/results and bank/gap/shortcut/inverted/landscape screenshots:
  temporary swipe-out-tt001. Tests inject helpers only in network responses.
- Final build and diff check pass; existing large-chunk warning remains.

Physical-phone tests and final recommended-line/human-feel tuning require
playtesting. The line is heuristic, not a proven fastest trajectory. Current ship
and speed-class selections are Racer/Standard; record identity supports future
choices. Existing driving changes in the working tree belong to DRIVE-001.
