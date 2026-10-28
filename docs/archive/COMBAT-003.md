# Current Task

Task ID: COMBAT-003
Status: Complete
Created: 2026-10-28

## Scope

D2: one weapon slot, empty start, fixed rocket/homing/minigun pickups, no automatic
ammo reload. Pickup replaces existing ammo; shared pad recharge is 8s. Shared swept
CPU/player detection with route metrics, pause/reset, authoring and legacy fallback.
Time Attack and non-combat races have no weapon pickups. Preserve D1 and handling.

## Definition of done

- [x] Single-slot ammo and pickup/recharge rules work for CPU/player at high speed.
- [x] Weapon pad visuals/readiness, HUD and CPU seeking integrate with existing systems.
- [x] Versioned editor supports weapon types, history/save/import/export and branches.
- [x] Old tracks get safe combat-only fallback pads; solo unaffected.
- [x] Tests/build, browser editing/race/lifecycle checks and docs complete.

## Verification

97 Node tests pass. Production build passes with existing large-chunk warning.
Browser editor/history/save/export/import, empty start/pickup/depletion, pause,
retry and Time Attack checks pass; no page errors. Editor, desktop and small
landscape screenshots inspected. Physical device/controller and human balance
remain unverified. Details: WEAPON_PICKUPS.md. Next roadmap stage: E.
