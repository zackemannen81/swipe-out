# Current Task
Task ID: GIT-001
Status: Complete

## Scope
Remove the two oversized Crimson Citadel and Urban Spire GLBs from the four
unpublished commits, keep local files, ignore them and push main to origin.
Preserve all other changes and commit metadata; retain a local backup branch.

## Acceptance
Outgoing history contains neither asset and no blobs over GitHub limit.
Local assets remain intact; other existing tracked content unchanged.
Normal push succeeds and remote main matches local HEAD.

## Verification
Four unpublished commits rewritten; original messages/authors preserved.
Only the two model paths differ from the original committed tree.
Both local files remain (80,329,224 and 113,808,552 bytes) and are ignored.
Largest outgoing blob is 13,945,932 bytes. Normal main push succeeded.
Local recovery branch: backup/before-large-model-removal-6d42d701 (not pushed).
