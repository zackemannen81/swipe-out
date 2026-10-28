# Current Task

Task ID: AUDIO-002
Status: Complete
Created: 2026-10-28

## Scope
Integrate race/combat/Time Attack announcer events with bounded priority queue,
expiry/repeat limits and saved shared volume including existing countdown audio.
Preserve countdown triggers/assets/timing. Complete missing catalog clips using
accepted generator. Cup integration stays in later cup task.

## Definition of done
- [x] Events, priority/expiry and lifecycle work without overlapping queued voices.
- [x] Shared voice volume persists and controls countdown without timing changes.
- [x] Missing clips generated, meaningful tests/browser/build and docs complete.

## Verification

102 Node tests pass; production build passes with existing large-chunk warning.
Browser confirms persistence/reload, 21 decoded voices, countdown calls once,
missile preemption, pause/mute, retry and Time Attack finish; no page errors.
Desktop and 568x320 pause UI inspected. Countdown timer/trigger lines unchanged
from HEAD. 12 missing WAVs generated; 49 catalog files now present. Physical
phone and human mix/listening remain. Next task: E cup/progression.
