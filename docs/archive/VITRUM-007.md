# Current Task
Task ID: VITRUM-007
Status: Complete

## Scope
Lower Vitrum global illumination and add warm local point-light pools along the
current route in game and editor, including saved overrides. Preserve user data.
## Acceptance
Bounded lights without shadow passes, readable road, darker global fill, build
and browser sector checks pass. Document visual and performance limitations.

## Verification
Nine relevant tests pass; 13 finite bounded shadow-free lights checked. Final build passes (existing chunk warning). Browser seven sectors, textures, editor save/export/reload and 232-object override pass without page/HTTP errors. Final Rootwake image inspected after reducing excessive initial bloom. Evidence: tmp/vitrum-light-browser-final.txt, tmp/vitrum-light-tests.txt, tmp/vitrum-light-build.txt. Device FPS unmeasured.
