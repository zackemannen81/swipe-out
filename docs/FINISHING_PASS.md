# FINISH-001 — roadmap audit and completion pass

## What changed
The E–G roadmap had not been reconciled with the garage/career/scenery releases.
PRODUCT_ROADMAP.md now distinguishes delivered software from actual human/device
verification. The accepted intro/countdown and player handling remain unchanged.

### Glow and sound
Settings adds Neon glow (0–300%, default 100%), music-reactive rails, effects
volume, mute, and effects mix. Red garage sources now use HDR multiplier 12;
Necros rail emission baseline is 12. The former 2.2 red intensity was too weak
for useful bloom. Shared rail-material references retain the base intensity;
kick adds up to 140% and bass 35%, multiplied by the user's glow setting.
HDR sanitization remains on. Music pulse only runs with racing audio analysis.
Settings also apply when starting a new race or switching songs.

Effects use their own gain bus. Headphones preserves dynamics; Speakers applies
4:1 compression above -18 dB to effects only. Voice/countdown remain on their
existing path. Global mute preserves levels for unmute. Airbrake/scrape/landing
sounds are short filtered noise cues with cooldowns; engine volume follows
throttle. Weapon/surface effects share an eight-voice budget and weapon cues
briefly yield to alert tones. Audio contexts are closed on music/track replacement.

### Results and progression
RECORDS shows local three-lap Race bests, with a separate key for track ID/full
revision, CPU difficulty, handling, assist, combat, chassis and module. Old Time
Attack records/ghosts and cup saves are untouched. Storage key:
`swipe-out:race-records:v1`. Retains at most 200 configurations; storage failure
appears in results. Record time and best lap are independent minima.
Results show PB improvement/delta and best lap; cup still displays its own points.

Time medals use initial, explicitly displayed thresholds: 3 * route length /
110 (Gold), 95 (Silver), 80 (Bronze), in world units/second. These are provisional
race targets, not benchmarked human lap records. A Gold time medal on the exact
campaign custom ID unlocks Spire Silver. Results show the next career target.
Different loadouts have separate records but the same medal targets.

Course card uses the configured environment image, geometric length and a rough
turn-density difficulty classification. It does not claim a screenshot or human
rating. Test courses are grouped separately. Current configuration PB is shown
for Race; TA/cup use their existing record interfaces.

### World/menu presentation
Necros-named tracks generate three simple, unarmed patrol craft above the highest
sampled road elevation. Patrols remain decorative, outside racing collision.
Sharp corners receive elevated amber chevrons facing approaching racers, on the
outside of the bend. Track name is propagated into curve metadata so shared
branch rails, signage and patrol builders use the correct palette.
The generated additions do not rewrite browser track saves or place editable
objects. Existing authoring tools remain available for bespoke scenery.

Menus support edge-triggered gamepad D-pad/stick navigation, A to activate and B
back; horizontal movement adjusts selects/ranges. Pause and results share this
navigation and reduced-motion-aware transitions. Keyboard/touch remains native.

### Foundry regression
The previously failing CPU simulation was caused by downhill overspeed being
allowed into a jump. CPU gap preparation now looks ahead 2.4 seconds / at least
180 world units and uses ordinary braking toward nominal top speed on run-up.
Player physics is untouched; the original six-landing, zero-recovery assertion
now passes without weakening it.

## Verification and remaining limits
See CURRENT_TASK.md for final runs. Automated browser tests use isolated saved
fixtures, never the user's local authoring data. Controlled finish injection
checks reward/record integration, not human race balance. Physical phone heat,
long-session memory/frame time, real controller comfort, speaker/headphone
listening and hand-placed content quality require actual playtesting. Extra
worlds and bespoke authored cinematic paths are not created by this pass.
