# Current Task
Task ID: MENU-001
Status: Complete

## Scope
Animated front end: main menu, race setup, campaign preview, garage, trophies,
settings. Real procedural gothic hangar with selectable existing craft models,
paint and earned performance modules. Necros campaign finish/podium/win/Elite
milestones, persisted unlocks and configuration-specific best results.
Playable saved Necros takes priority over built-in foundation. Skippable track
fly-by preview and supplied trailer audio. Existing countdown stays untouched.
Time Attack and cup retain standard craft performance and record identity.

## Acceptance
Navigation, settings persistence, real garage-to-race loadout, campaign rewards
and reload, locked items, repeat finish protection and damaged storage tested.
Desktop/small landscape layout inspected; no horizontal overflow. Build and
relevant regression checks introduce no new failures. No user track storage changes.

## Verification
Production build and diff check pass (existing bundle warning). Nineteen focused
career/cup/intro/Time Attack tests pass. Full suite: 121/122; the Foundry CPU
recovery assertion fails identically using committed HEAD 9c91816 sources in a
separate temporary baseline. This pre-existing failure was not weakened/fixed.
Isolated Chrome checks pass for settings and earned loadout reload, locked
choices, fly-by escape, real finish handler/results, upgraded Quick Race and
factory TA/cup. Desktop and 667x375 screenshots inspected; no horizontal menu
overflow or page errors. Human balance and physical phone remain unverified.
See MENUS_GARAGE.md for tuning and collision-unaware preview camera limitations.
