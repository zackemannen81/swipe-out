# Current Task
Task ID: MOBILE-001
Status: Complete (code; physical device validation pending)

## Scope
Restore/harden touch steering, independent touch thrust/brake and calibrated landscape gyro. Preserve existing desktop input, menu flow and unrelated working changes.

## Implementation
Existing mobile controls in index.html/style.css were retained. Touch pedal capture now tracks each pointer independently, releases on cancel/lostcapture, pause and blur. Mobile steering ignores input during pause or gyro mode. Gyro requests sensor permission on click, samples an initial neutral grip, applies a deadzone, supports toggling off/recalibration and zeros steering on stale sensor data.

## Verification
Vite production build passed (existing large bundle warning). `node --test tests/*.test.js`: 132 pass, 0 fail. Real-phone gyro direction, permission, ergonomics and sensor reliability require manual verification; no physical device was connected for playtesting. Existing local edits in track.js and public/images were not changed.
