# Current Task
Task ID: TOUR-LOOP-001
Status: Complete
## Scope
M1-07: preserve Tour Bus station/world on reload; route race setup cancellation,
results and abandonment back to the carrier when launched there. Reload during
a carrier race returns safely to hangar without awarding completion. Existing
main-menu race paths remain unchanged. Separate session state from career saves.
## Acceptance
Targeted lifecycle/persistence tests and browser flow verify setup Back, race
abandonment/results return, reload and ordinary menu isolation. Build passes.
No countdown, physics, campaign reward or track-storage changes.

## Verification
12 targeted Node tests pass. Production build passes (existing chunk warning).
Isolated Chrome: station/world reload, setup Back, race abandonment with no new
awards, controlled real finish/results return, retry origin, mid-race reload and
ordinary-menu race isolation all pass without page exceptions. Full manual race
and physical device performance not retested; race/countdown logic unchanged.
