# Current Task
Task ID: TOUR-STAGES-001
Status: Complete
## Scope
Integrate three authored Desktop/tourbus/stages exports as separate shipped
library entries and Nexus destinations. Preserve exact authored data except
byte-identical extraction of embedded media. Preserve old built-ins/browser saves.
Necros uses existing campaign; Vitrum/Collective use open-race flow.
## Verification
- Import validates format, media hashes and complete recursive authored data parity.
- 21 targeted stage/storage/session/format/career tests pass.
- Production build passes with existing chunk-size warning.
- Chrome: all three Nexus choices launch correct real races, every GLB loads,
  no page/model errors; abandon returns to hangar. Editor lists all three.
- Screenshots of all three races inspected; Collective session persistence tested.
- Full suite: 171/177 pass. Six failures remain in catch-up, Foundry/Necros physics
  and hull appearance tests outside this import. Global suite is not green.
## Limits
Playable authored previews, not full-lap/balance certification. No mobile FPS
measurement. Collective observation planet uses placeholder material. No new
Collective/Vitrum campaign rewards. Details/provenance in TOUR_STAGES.md.
