# Current Task

Task ID: AUDIO-001
Status: Complete
Created: 2026-10-28

## Scope
Create a configurable announcer batch generator using the user's voice_creator.py
and exact two-stage SoX recipe. Curate current and future race/combat/practice/cup
phrases. Preserve countdown and existing scripts; no runtime audio integration.

## Definition of done
- [x] Editable clip catalog with stable names and categories.
- [x] Selection, dry-run, safe skipping, isolated temporary files and clear failures.
- [x] Validate recipe locally and generator controls; document usage and limits.

## Verification

Six offline tests pass, including preservation on failure and no-write dry-run.
Real TTS/FFmpeg/two-stage SoX generated weapon_acquired.wav (2.60s PCM). SoX
reported clipping from the supplied recipe; preserved and documented. Remaining
48 clips not rendered. No runtime integration, gameplay/build tests unnecessary.
