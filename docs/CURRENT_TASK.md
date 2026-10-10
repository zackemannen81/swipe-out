# Current Task

Task ID: IMPLEMENT-003
Status: Ready
Owner: Agent 008
Created: 2026-10-10
Last updated: 2026-10-10

## Task Summary

Add an explicit pause/resume action to the verified 0.1 race. Preserve the current one-track course, player craft, and live time/lap/speed HUD; while paused, movement and elapsed race time must stop and touch steering must not change the craft's position. Resume the same run in place. Keep CPU opponents, audio, extra content, and broad polish out of scope.

## Definition of Done

- [ ] Provide a clearly accessible pause action during a race and a resume action while paused; support keyboard and touch activation with visible keyboard focus.
- [ ] Pause freezes automatic travel, elapsed time, and player steering at the current race position; resume continues that exact run with no time or distance jump.
- [ ] Starting a new run, finish/results, and retry continue to work correctly when pause/resume has been used.
- [ ] The existing live elapsed-time, lap/progress, and velocity HUD remains readable and updates only while racing.
- [ ] `README.md`, `SYSTEMDOC.md`, `CURRENT_STATUS.md`, `FILESTRUCTURE.md`, and the journal describe only observed behavior; the journal records implementation and validation.
- [ ] `npm run build`, development-server smoke check, `git diff --check`, and a manual/browser start, pause, resume, finish, and retry flow pass; note physical-device validation limits.

## Scope notes

Reuse the established Three.js race flow and DOM HUD. Add only simple pause/resume behavior necessary to make a race session usable. CPU competition, sound, multiple ships/tracks, and broad visual polish remain out of scope.
