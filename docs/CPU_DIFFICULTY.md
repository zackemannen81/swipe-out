# CPU-svårighet och förarpersonligheter

Implementerat 2026-10-28 (CPU-001). Välj **CPU DIFFICULTY** vid EVENT på
startskärmen. Valet sparas lokalt och gäller nästa start/retry. Pilot är standard.
Time Attack stänger av CPU-valet, CPU-simulering och catch-up; Race-valet behålls.

| Nivå | Körning | Catch-up, spelare och CPU |
| --- | --- | --- |
| Rookie | Tidigare bromsning, lägre fartmål, större marginal vid omkörning, större linjefel och färre genvägar | Högst 8 % |
| Pilot | Balanserad körning nära tidigare profil, beräknade omkörningar och enstaka misstag | Högst 8 % |
| Elite | Snabbare reaktion, mer precisa linjer, mindre inbromsning och fler genvägar | Högst 2 % |

Fysiska toppfarter, acceleration och massa är användarens befintliga värden.
Ingen nivå teleporterar skepp eller höjer deras normala toppfart. Rookie väljer
ett lägre fartmål; nära gap prioriterar alla nivåer rak ansats och tillräcklig
hoppfart. Boost-plattor, verkliga kontakter och fartförluster gäller fortfarande.

Svårighet och personlighet är separata. Vanta är balanserad, Kestrel precis,
Orca försiktig och Nexus-9 aggressiv. Riskvilja påverkar omkörningsavstånd,
kurvmarginal, genvägsval och misstag. Blockerade omkörningslinjer ger följkörning
och ett farttak bakom framförvarande i stället för en blind sidoförflyttning.

Linjevariation är mjuk och reaktionstiden ändlig. I kurvor kan ett kort misstag
ge fel linje och ett sänkt fartmål; aggressiva förare gör större och tätare
misstag. Nya misstag startas inte i gapansats eller när ett vägval prioriteras.
Genvägsval varierar reproducerbart mellan förare och varv. Det är en första
balanserbar modell, inte inlärd AI eller ett löfte om samma svårighet på varje bana.

## Mätning

`node tools/measure-cpu-difficulty.mjs` kör tre varianter av förarnas beslutsfas
per bana och nivå, fyra CPU:er per variant, tre varv per lopp, 60 Hz. Verklig
fysik, trafik, CPU-kollisioner, boost, brancher och nivåns catch-up används.
Ingen spelare eller combat deltar. Mätningen returnerar även individuella varvtider.

Nedan är medeltid för **hela trevarvsloppet**, standardavvikelse mellan de tolv
CPU-sluttiderna samt summerade väggträffar, boostträffar och branchinträden.
Spridningen blandar olika skepp/personligheter och är inte ett rent mått på
samma förares konsekvens. Alla 108 CPU-körningar slutfördes; inga gapåterställningar.

| Bana | Nivå | Tid ± spridning (s) | Väggträffar | Boost | Brancher |
| --- | --- | ---: | ---: | ---: | ---: |
| Neon Causeway | Rookie | 122,12 ± 4,80 | 148 | 725 | 0 |
| Neon Causeway | Pilot | 111,78 ± 2,47 | 91 | 800 | 0 |
| Neon Causeway | Elite | 110,63 ± 2,69 | 59 | 813 | 0 |
| Split Decision | Rookie | 82,43 ± 3,94 | 34 | 141 | 6 |
| Split Decision | Pilot | 72,67 ± 2,83 | 38 | 130 | 14 |
| Split Decision | Elite | 68,67 ± 3,10 | 66 | 160 | 25 |
| Ion Foundry | Rookie | 154,58 ± 2,86 | 32 | 199 | 6 |
| Ion Foundry | Pilot | 132,59 ± 3,63 | 30 | 197 | 17 |
| Ion Foundry | Elite | 127,39 ± 3,82 | 41 | 219 | 26 |

Elite är snabbast i dessa körningar men tar fler smala genvägar och kan få fler
väggträffar. Skillnaden Pilot/Elite är liten på Neon Causeway. Mänsklig provkörning
behövs för lagom utmaning, särskilt med combat, andra banor och olika spelarassist.

## Finjustera och verifiera

- `src/cpu-difficulty.js`: nivåernas fartmål, reaktion, linjefel, framförhållning,
  kurvbromsning, omkörningsmarginal, genvägsfrekvens, misstag och catch-up.
- `src/opponents.js`: skeppens befintliga fysiska värden, personligheter/risk och
  körbeslut. Reset bygger ny fysik och nollställer misstag/reaktion/catch-up.
- `src/catch-up.js`: gemensamma 2/8-sekundströsklar och utjämning; valfri maxbonus
  skickas per lopp, utan att ändra globala inställningar eller Time Attack-rekord.
- `node --test tests/*.test.js`: 79 tester passerade efter ändringen.
- `node tools/verify-cpu-difficulty.mjs`: Chrome/Playwright och körande Vite krävs,
  samma `PLAYWRIGHT_MODULE` som övriga browserverktyg. Kontrollerar sparning,
  reload, retry, aktiva profiler, solo-isolering och lagringsfel; skärmbilder i
  temporära `swipe-out-cpu001`.

Build passerar med befintlig bundle-varning. Browserflöden och desktop/landskapsvy
kontrollerade; fysisk telefon, fysisk handkontroll och mänsklig balans ej verifierade.
