export function updateRailGlow(group, settings={}, channels={}) {
 const amount=Number.isFinite(settings.glow)?Math.max(0,Math.min(3,settings.glow)):1;
 const kick=Math.max(0,Math.min(1,channels.kick?.hitValue??0));
 const bass=Math.max(0,Math.min(1,channels.bass?.value??0));
 const pulse=settings.musicPulse===false?1:1+kick*1.4+bass*.35;
 for(const material of group?.userData.railMaterials??[]){
  material.userData.baseGlow??=material.emissiveIntensity;
  material.emissiveIntensity=material.userData.baseGlow*amount*pulse;
 }
}
