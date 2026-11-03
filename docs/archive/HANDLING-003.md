# Current Task
Task ID: HANDLING-003
Status: Complete
## Scope
Roll back HANDLING-002 release-to-neutral experiment after user reported worse
handling. Restore prior yaw integration and tests; retain HANDLING-001 tuning,
independent banking and lateral drift. No other handling or scenery changes.
## Acceptance
No automatic heading return or added steering deadzone. Relevant tests and build
pass. Record rejected experiment and restored behavior in continuity docs.

## 2026-11-03 - HANDLING-003: release-to-neutral trial reverted
User reported HANDLING-002 felt worse. Removed automatic track-relative yaw
return and its added steering deadzone. Restored prior yaw integration and
heading-preservation tests. Neutral input damps angular velocity; it does not
pull nose heading toward the track tangent. HANDLING-001 tuning (turnRate .8,
maxHeading .48, brakeYaw .0024, curveDrift .75, steeringBank .32), independent
banking and lateral drift remain. This supersedes HANDLING-002 behavior above.
22 relevant tests pass; production build passes with existing chunk-size warning.
No human playtest this pass. Evidence: tmp/heading-return-rollback-tests.txt and
tmp/heading-return-rollback-build.txt.