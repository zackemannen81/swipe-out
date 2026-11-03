// Shared authoring surface for the banks, planted scenery and undergrowth.
// Periodic in lap progress, so sector boundaries and the finish seam agree.
export function forestBankHeight(u, x) {
  const side = Math.sign(x) || 1;
  const wave = Math.sin(u*Math.PI*74 + side*.7)*1.4 + Math.sin(u*Math.PI*142 + x*.055)*.7;
  const rise = Math.min(1, Math.max(0, (Math.abs(x)-19)/16));
  return -3.2 + rise*(3.4 + wave);
}
