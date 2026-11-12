# Meshy-samlingen — granskning 11 november 2026

331 GLB-filer, 14.66 GB. 301 unika SHA-256-innehåll.
30 extra byte-identiska kopior, totalt 0.50 GB. Inga original flyttade, raderade eller ändrade.
Alla filer klarade strukturell GLB-header-/JSON-kontroll och har inga identifierade
externa resurser eller avkodarkrav som den befintliga laddaren avvisar. Detta är
inte en full visuell validering av 331 modeller. Tolv kandidater renderades separat.

## Visuellt granskade kandidater

| # | Typ | Trianglar | MB | Bedömning |
| --- | --- | ---: | ---: | --- |
| 0 | Inomhusträd | 25,015 | 11.12 | Observation: bra kandidat, krukan ingår |
| 1 | Buske | 22,758 | 16.82 | Planteringar: bra kandidat; mörka blad behöver ljusbedömning |
| 2 | Fern 3D | 791,864 | 52.77 | Stiliserad och mycket tät; föredra tidigare ormbunke efter optimering |
| 3 | Skjutdörr | 10,000 | 1.14 | Gemensamt rumskit: lämplig kandidat |
| 4 | Panelkit | 2,430 | 9.16 | 16 paneler i en sammanhängande modell; behöver delas för modulärt bruk |
| 5 | Lastplattform / cargo pod | 216,332 | 17.73 | Cargo/verkstad: behöver förenklas |
| 6 | Kontrollkonsol | 860,098 | 33.44 | Ser ut som befintlig importerad konsol; behåll befintlig lättare version |
| 7 | Reaktorkärna | 1,560,856 | 53.89 | Engineering: mycket tät och blek i grundrendering; behöver optimering/materialpass |
| 8 | Lastpall / flatbed | 373,690 | 20.05 | Cargo: behöver förenklas |
| 9 | Kaveldunsplantering | 1,763,995 | 63.47 | Dekorativ kandidat; 1,76 miljoner trianglar behöver förenklas kraftigt |
| 10 | Bio-växt texturerad | 12,484 | 4.63 | Vitrum-dekoration; alternativ grönska, utpräglad alienstil |
| 11 | Bio-växt (1) | 12,484 | 0.23 | Nästan samma geometri som föregående men utan synlig textur; inte en enklare mesh |

## Rekommenderad arbetsordning

1. Inomhusträdet och busken kan täcka delar av observationsdäckets kvarvarande behov.
2. Skjutdörr och panelkit blir kandidater till fartygets gemensamma inredningskit.
3. Lastpall, lastplattform och reaktor tas efter förenkling, när respektive rum får sitt visuella pass.
4. Återanvänd den redan importerade konsolen; importera inte den mycket tätare versionen.

Filer märkta `(1)` är inte automatiskt dubbletter eller optimerade: bio-växtparet
har samma triangelantal men olika texturinnehåll. Endast matchande SHA-256 räknas
som exakta dubbletter. Full lista i MESHY_LIBRARY_INVENTORY.json; CSV har en rad per fil.
Produktlänkar och licensunderlag behöver fortfarande följa kandidaterna; katalogen
utgår från lokala användarlevererade filer. Inget laddades ned eller importerades
i spelet i detta inventeringspass. Ingen build behövdes för katalogen.

## Filnyckel till bildöversikten

0. `Meshy_AI_Braided_Money_Tree_1111005553_texture.glb`

1. `Meshy_AI_Realistic_Bush_1109124741_texture.glb`

2. `Meshy_AI_fern_3d_1111135331_image-to-3d-texture.glb`

3. `Meshy_AI_sci_fi_sliding_door_1111013338_texture.glb`

4. `Meshy_AI_panels_1111013319_texture.glb`

5. `Meshy_AI_Quantum_Cargo_Pod_1031114439_texture.glb`

6. `Meshy_AI_Cyber_Command_Console_1111135606_texture.glb`

7. `Meshy_AI_Orbital_Core_Engine_1103110046_texture.glb`

8. `Meshy_AI_Flatbed_1111013455_texture.glb`

9. `Meshy_AI_Cattail_Planter_1111140114_texture.glb`

10. `bio_flora_plant_lowpo.glb`

11. `bio_flora_plant_lowpo (1).glb`

## Subsequent integration
The reviewed tree and bush were copied into observation zone 06 in
TOUR-OBS-GREENERY-001 (two trees, four shrubs). See CURRENT_STATUS.md and
OBSERVATION_GREENERY_ASSETS.json for verification and exact source hashes.
