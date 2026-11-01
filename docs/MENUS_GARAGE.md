# Menus, garage and Necros campaign preview

The main menu opens in a real 3D service hangar. Existing craft models are reused
with separate materials, gothic vault ribs, a Necros facade, red lights, a lit
platform and drifting particles. Menu movement respects reduced-motion preference.

## Play
- Campaign: one three-lap Necros - Dark PRIME event, pinned to
  `custom-e7ead7a3-b303-4c3d-9464-ca52f28e8386` for racing and fly-by.
  Missing saved data disables both actions with an explanation; no name match
  or track17 fallback. localhost and 127.0.0.1 have separate browser storage.
  Authored names/data remain unchanged. Rewards require this exact circuit.
- Fly over Necros: a looping 40-second course camera with the supplied
  `To Death and Beyond` trailer audio. Escape or Back exits. It does not race,
  award progress or change saved track data. This is a preview flight, not a
  collision-aware cinematic; custom buildings can intersect its camera path.
- Quick Race retains all existing tracks and uses the garage loadout.
- Time Attack and Foundry Cup use factory Racer performance, keeping their
  existing identities and rules. Paint still applies. Existing countdown untouched.
- Pause offers Abandon Race / Menu; an interrupted cup retains its saved round.

## Rewards and customization
| Campaign result | Reward |
| --- | --- |
| Finish | Kestrel chassis and Launch capacitor |
| Podium | Orca chassis and Overdrive |
| Win | Dominion Gold finish |
| Elite win | To death and beyond trophy |

Kestrel: 97% engine limit, 118% thrust force, 90% mass.
Orca: 105% engine limit, 92% thrust force, 120% mass.
Racer retains the accepted factory baseline. One module can be fitted: Launch
adds 10% thrust force; Overdrive adds 4% engine limit. Downhill momentum remains
uncapped. Percentages are relative to factory; mass affects existing interactions.
Finishes tint the existing texture/material; this is not a UV/livery editor.

Trophies, equipped items and fastest campaign results are local to the device.
Results are keyed by full course revision, difficulty, handling, assist, combat,
chassis and module. Repeated finish handling cannot award a run twice. Old lap,
cup, driving and track saves retain their separate keys. New profile key:
`swipe-out:career:v1`. Save failures show a message and retain session progress.

## Settings
Reuses the existing live controls for handling, camera, assist and announcer.
Adds saved music/trailer volume, bloom, camera shake, menu motion and quality.
Quality caps renderer DPR at 2 / 1.5 / 1 and composer resolution at 100 / 75 / 50%.
HDR safety stays enabled by default; F5 remains diagnostic, outside Settings.
No physical-phone performance claim is made.

## Validation (2026-10-31)
- Build passes, existing >500 kB chunk warning remains.
- 19 targeted career/cup/intro/Time Attack tests pass.
- Full suite: 121/122 pass. Existing Foundry CPU recovery assertion fails
  (one recovery vs expected zero). Reproduced with source copied from HEAD
  9c91816 into an isolated temporary baseline; no test expectation weakened.
- `tools/verify-menu.mjs` uses an isolated Chrome context and source-only test
  hooks. Checks navigation, settings/reward/loadout persistence, locks, preview
  escape, actual finish handler/results, upgraded Quick Race and factory TA/cup.
  Desktop 1440x900 and landscape 667x375 screenshots inspected; no horizontal
  menu overflow or page errors. Controlled finishes are not human balance tests.
- Set PLAYWRIGHT_MODULE to your installed Playwright module before running it.

Updated by FINISH-001: records/time medals, audio/glow controls, generated Necros
patrols and amber signs are implemented. See FINISHING_PASS.md. Remaining content
work: human balancing, additional worlds, bespoke camera paths and phone testing.
