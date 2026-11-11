# Current Task
Task ID: TOUR-AUDIO-001
Status: Complete
## Scope
Copy supplied tourbus audio without altering originals. First-visit crew
presentations after settled camera, exact README transcripts, profile flags,
holographic subtitles, Space/Enter skip, discovered-intro archive replay.
Zone music ducks under voice; respect settings, visibility and menu/race lifecycle.
Register missing recordings without requesting nonexistent files or exposing locked
zones. Expose supplied extra music/announcement for manual playback.
## Acceptance
Asset hashes/decoding, profile migration, audio lifecycle tests, browser first
visit/skip/replay/reload/navigation/settings checks and production build pass.
Document actual missing voices (10–16 and 16B), rather than assume five.

## Verification
All 21 source copies hash-match; all 20 MP3 files decode. 15 targeted tests pass.
Production build passes with existing bundle warning. Isolated Chrome passes
actual voice/music playback, ducking, settled arrival, skip, keyboard replay,
navigation interruption, persisted flags, mute, mobile and leave-hub cleanup.
No browser page or tourbus media HTTP errors. Desktop/mobile screenshots inspected.
Subjective listening and physical-device behavior not independently verified.
