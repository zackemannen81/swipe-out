# Lokal assetleverans — 11 november 2026

Granskad källa: `C:/Users/zakri/Desktop/tourbus/assets`. Originalen är kvar oförändrade.
Åtta GLB-modeller och fyra PBR-paket hittades. Alla GLB-filer godkändes av spelets
formatkontroll och laddades i en separat 3D-förhandsvisning. De har inbäddade resurser
och kräver inga Draco/Meshopt/KTX2-avkodare. Samtliga modeller har ett material.

## Modeller

| Modell | Trianglar | Filstorlek | Bedömning / användning |
| --- | ---: | ---: | --- |
| Klätterväxt / vine | 9 977 | 2,16 MB | Inlagd på två sidoväggsplatser på observationsdäcket |
| Concrete Raised Garden | 27 286 | 18,72 MB | Bra alternativ för ett tomt långsmalt kärl; förbereds senare med växter |
| Futuristic modular bench | 20 712 | 7,44 MB | Inlagd i de två befintliga bänkplatserna, 3 m bred |
| LED Light | 10 000 | 7,70 MB | Kandidat; armaturen ser mörk ut i grundrenderingen, behöver separat ljus-/emissivpass |
| Wall decor | 6 909 | 5,82 MB | Kandidat för servicepanel; placeras vid kommande väggmaterialpass |
| planteringskärl_lång | 98 857 | 19,65 MB | Kärl med inbyggd grönska; bör förenklas före fyra upprepningar |
| TB-OBS-CONSOLE-01 | 20 824 | 10,64 MB | Inlagd i de två konsolplatserna; cirka 1,35 m hög efter proportionell skalning |
| Leafy Fern | 84 201 | 7,21 MB | Bra visuellt, men för tät geometri för 12–20 upprepningar utan förenkling |

Bänk, konsol och klätterväxt återanvänder laddade resurser mellan instanser.
Importen behåller modellernas material och texturer. Ingen geometri decimerad ännu.
Bänken är en låg, rygglös modul; konsolens skärm är dekorativ. Navigationen använder
befintligt gränssnitt. Växterna sitter utanför den centrala planetutsikten.
Exakta filnamn, SHA-256, ursprungsmått och runtime-filer finns i
`TOUR_ASSET_DELIVERY_2026-11-11.json`.

## Materialpaket

Alla fyra innehåller 2048 × 2048 Base Color och separata Roughness/Normal-kartor.
ZIP-filerna är granskade utan att skriva över redan uppackade filer.

| Paket | Rekommenderad yta | Status |
| --- | --- | --- |
| Dark Soil | Planteringsytor | Klart kandidatmaterial; ej kopplat i scenen ännu |
| Damp Moss | Planteringsdetaljer / grön vägg | Kandidat; använd sparsamt |
| Dark Mossy Rock | Små naturinslag / stendekor | Kandidat; inte fartygets golv eller huvudväggar |
| Furniture Fabric | Klädda dynor och framtida loungemöbler | Kandidat; den levererade vita bänken behåller sin egen yta |

Normalriktning, fysisk texturrepetition och färg-/datakartornas inställningar
kontrolleras vid materialintegrationen. Höjd-/displacementkartor behöver inte
kopplas in i första passet.

## Fortfarande att samla till observationsdäcket

- 1–2 små inomhusträd med luftig krona.
- Ytterligare 1–2 lågväxtvarianter, helst redan optimerade.
- Mörk borstad metall, diskreta golvpaneler och pulverlackerad metall.
- Brons/mässing för varma detaljer om ett lämpligt material hittas.

Detta är typer som inte ingår i leveransen, inte bevis på att de saknas på Meshy.
Genereringslistan hålls separat tills en sökning faktiskt misslyckats.

## Proveniens och nästa steg

Modellernas exakta produktlänkar och licensfiler finns inte med i denna leverans.
Materialpaketens medföljande metadata behålls hos originalen. Lägg gärna källänk och
licens bredvid respektive fil när du har dem; inga rättigheter har antagits från namnet.

Nästa miljöpass: optimera planteringsgruppen och ormbunken, sätt in dem i de fyra
planteringsplatserna och lägg jordmaterial. Därefter metall/golv och samlat ljuspass.
Ingen ny fjärrnedladdning har gjorts i detta arbete.
