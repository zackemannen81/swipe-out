# Current Task
Task ID: VITRUM-009
Status: Complete
## Scope
Explain magnetic lane-frame behavior and reduce hidden-feeling lateral damping
in unassisted standard handling on magnetic roads. Increase visible airborne
spores, darken Vitrum/fog and replace craft point highlight with broad underglow.
## Acceptance
Verify physics distinction and regression tests, build, shader/browser rendering.
Preserve assisted/classic behavior and saved work; document visual limits.

## 2026-11-03 - VITRUM-009 feedback pass
Magnetic mode constrains vertical offset and follows the road's moving frame;
it is not free-world inertial physics. Standard handling previously retained
4.5 lateral grip and only 0.1 centrifugal scale even with assistance off.
Magnetic standard handling now uses grip 1.6 at assist zero, interpolating to
4.5 at full assistance, with centrifugal scale 0.3 (still multiplied by 1-assist).
Classic handling and nonmagnetic coefficients are unchanged. A circular-track
regression confirms no-input outward drift with assist off while adhesion holds.
Spore sprites are larger/brighter, 42% placed over the road at height >=9;
remaining spores cluster nearer the banks. Vitrum sun/fill are 0.28/0.25;
fog is dark green 0x263e38, density 0.0024. Craft point lights replaced with
soft additive 3.8x5.2 chassis glow planes, colored per craft. This is a visual
halo attached to the craft, not projected area lighting; steep roll/jumps can
separate it from the road. No extra dynamic light or shadow passes.
Eight targeted tests pass, including both handling modes/player three-lap runs,
CPU fields and magnetic drift. Production build passes (existing chunk warning).
Browser sectors, editor save/reload and 232-object override pass. Final Rootwake
image inspected: airborne spores and wide underglow visible. Hardware FPS and
subjective steering balance remain playtest items. User saves untouched.
Evidence: tmp/vitrum-009-{tests,browser,build}.txt and tmp/vitrum/Rootwake.png.