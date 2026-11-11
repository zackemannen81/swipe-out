# Current Task
Task ID: TOUR-AUDIO-002
Status: Complete
## Scope
Import supplied recordings 10–15 and regenerate voice manifest. Reserve 16/16B
for Zacke's later personal recordings; no replacement speech or zone unlocks.
## Acceptance
Six copies hash-match, decode successfully, manifest maps 00–15 while 16/16B
remain null. Production build passes; documentation reflects current coverage.

## Verification
Six source hashes match; full FFmpeg decoding passes. Manifest assertions confirm
00–15 available, 16/16B null. Production build passes with existing chunk warning.
