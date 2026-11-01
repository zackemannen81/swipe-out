# Current Task
Task ID: CAMPAIGN-002
Status: Complete

## Scope
Pin Necros - Dark PRIME campaign and fly-by to user-confirmed custom-e7ead7a3-b303-4c3d-9464-ca52f28e8386. Remove name/prototype fallback. Explain missing local track and block unavailable event. Preserve authored saves and countdown.

## Acceptance
Browser checks missing track, same-name duplicates, exact preview/event selection, rewards and existing menu flows. Production build passes.

## Verification
Production build, career tests (2/2) and diff check pass. Isolated Chrome menu
acceptance passes with no page errors, including unavailable campaign, two
same-name custom fixtures, exact event ID, fly-by, rewards, settings and loadout
persistence, factory TA/cup and small-screen overflow. Fixture geometry uses
track17; the user-authored scene remains only in their browser storage and was
not inspected or modified. Existing bundle-size warning remains.
