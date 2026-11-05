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
| Finish | Singularity chassis and Launch capacitor |
| Podium | Mycelium chassis and Overdrive |
| Win | Dominion Gold finish |
| Elite win | To death and beyond trophy |

Singularity: 97% engine limit, 118% thrust force, 90% mass.
Mycelium: 105% engine limit, 92% thrust force, 120% mass.
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

## Garage backdrop update (GARAGE-002)
The procedural hangar/facade has been replaced by public/images/garage.jpg.
The original 5504x3072 JPEG is retained; cover cropping does not stretch it.
src/garage.js controls image anchors (.67, .61), camera and craft hover/yaw.
Lighting affects the live craft; baked lighting in the image is static.
Glow preference scales live craft emissive materials, not the photograph.

## Necros mastery rewards
All five existing trophies (finish, podium, win, Elite win, Gold time medal)
unlock Necron Crimson Citadel and Vi lever inte. Existing complete profiles
qualify automatically. Craft uses factory performance plus normal paint/modules;
TA/cup still use factory Racer. Settings > Race soundtrack selects the song
for races; pause selector can change it. Selection persists across reloads.
Local Vite DEV on localhost/127.0.0.1 auto-grants previewRewards:necros_mastery
for author testing, without granting trophies. Production fresh profiles do not
receive this override. Remove the development grant in src/front-end.js to end
local testing and clear only previewRewards in the career profile if desired.

## The sacrifice — consolation reward
Finish last (5/5) with Swipeout handling, High (Auto) lane assist and Rookie CPU
in Quick Race or Campaign. Settings are snapshotted at race start; victory-lap
autopilot cannot qualify. Completed distance is checked by the race integration.
DNF, abandoned runs, TA and Cup do not qualify. The bonus trophy appears in
Trophies, separately from the five Necros mastery goals. The craft keeps normal
factory stats, paint and module support, and remains locked until earned.

## Exhaust profiles
src/thrusters.js defines thrusterLayout(ship): four outlets for The sacrifice,
five for Necron Crimson Citadel, two otherwise. Positions are craft-local metres
(+Z forward); widthScale keeps adjacent jets separate. BLOOD_RED matches Necros
rail #a80010. Player and CPU exhaust use this colour. applyPlayerLoadout rebuilds
the player emitter and disposes old wake geometry. Garage remains a hover display.

## THRUST-003 tuning
Crimson visual scale is 1.10 (3.465 game-unit longest dimension), applied to model
child transforms so garage/race clones agree. Its nozzle offsets use the same
CRIMSON_VISUAL_SCALE exported from src/thrusters.js. No physics size changes.
Reward jet widths increased 50%: Sacrifice .675, Crimson .54. Only these two
hulls force #a80010; stock/CPU exhaust uses original craft accents again.
Export size is normalized by loadCraftModel: changing Meshy centimetres does
not set game size; leave resize off and tune the code multiplier instead.
