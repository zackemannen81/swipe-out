# Current Task
Task ID: PHYSICS-001
Status: Complete

## Scope
Separate engine speed limit from momentum. Shared slope gravity, soft drag,
no hard upper speed clamp, preserve braking/boost and both handling modes.
Verify CPU behavior, slopes, overspeed decay and existing race regressions.

## Verification
113 tests pass; build passes with existing chunk warning. Browser coast through
Necros dive: ~140 to ~258 without throttle, no recovery/errors. Updated physics
record identities retain old data separately. Foundry route test now uses
centering assist because neutral steering with new overspeed can hit walls;
all original six landings and both route assertions still pass. Human tuning remains.
