# Observation Deck — byggd arkitektur och assetlista

## Levererat

Observationsdäcket är modellerat i det befintliga spelet, zon 06 / däck 5.
Konceptbild 29 i TOUR_BUS_ARTWORK.md styr formspråket. Arkitekturen byggs av
`src/tour-observation.js` och använder samma scen, navigation, planet, ljud och
resursstädning som resten av bussen. Detta är en modellerad grund med materialfärger
och inredningsplatshållare; inga externa modeller eller PBR-texturer har importerats.

- Golv 34 × 34 m, 0,5 m tjockt, indelat i cirka 2 m paneler.
- Elliptiskt tak: cirka 13,65 m högsta punkt; tre inre bärvalv.
- Panoramaram: cirka 32 m bred, 13 m hög, tre lager metall och varm ljuslist.
- Mittfältet är öppet för planetutsikten; inga mittstolpar eller dyrt refraktionsglas.
- Böjt räcke cirka 30 m långt och 1,15 m högt.
- Längsgående taklister, infällda lampor, vägledande golvlister och hissport.
- Fyra planteringsplatser med enkla växtproxies, två bänkar och två konsoler.
- Konsolerna är dekorativa platshållare; befintligt UI äger världsval/information.

Du behöver alltså inte hitta ett helt rum, ett färdigt panoramafönster eller en
ny planetmodell. Vi behåller den specialbyggda arkitekturen och klär den med
material och utvalda modeller.

## Söklista: 3D-modeller

P1 = störst visuell förbättring; P2 = nästa utsmyckning. Måtten är önskad storlek
efter inpassning, inte ett krav på originalfilens enheter. En modell kan återanvändas.

| Prio | Asset att leta efter | Antal unika / placeringar | Önskad storlek | Engelska sökord | Anslutning |
| --- | --- | --- | --- | --- | --- |
| P1 | Inomhusträd med tydlig stam och luftig krona | 1–2 / 4 | 2–3,5 m högt, krona högst 2 m bred | indoor tree, ficus, small palm, low poly tree | Planteringsgrupperna nedan; ersätt växtproxy |
| P1 | Ormbunke / bredbladig låg växt | 2–3 / 12–20 | 0,3–0,8 m högt | fern, tropical foliage, indoor plant, foliage cluster | Fyll planteringskärlen utan att täcka utsikten |
| P1 | Långt planteringskärl | 1 / 4 | 5 × 1 × 2,4 m, eller bygg av korta moduler | modular planter, rectangular planter, sci fi planter | TB-OBS-PLANTER-01..04 |
| P1 | Diskret informationskonsol | 1 / 2 | 1,4 × 1,25 × 0,7 m | sci fi kiosk, information terminal, touch screen pedestal | TB-OBS-CONSOLE-01..02 |
| P2 | Bekväm modulär bänk | 1 / 2 | 3 × 0,9 × 1 m | futuristic bench, lounge bench, modular seating | TB-OBS-BENCH-01..02 |
| P2 | Hängande grönska | 1–2 / senare 4–6 | 1–2 m långa partier | hanging plant, hanging vine, ivy cluster | Fönstrets sidokanter; nya platser väljs vid inpassning |
| P2 | Små väggdetaljer / ventilationsgaller | 1–3 / senare | 0,3–1 m | sci fi wall panel, ventilation grille, access panel | Sidovägg/tak; inget nytt rum krävs |
| P2 | Infälld armatur | 1 / 6 | cirka 3 × 0,1 × 0,4 m | recessed strip light, sci fi ceiling light | TB-OBS-CEILING, befintliga ljusfält |

Människor/NPC: inte nödvändiga för denna leverans. Lägg till dem separat när
pilot-/besättningssystemet byggs, så att inredning inte blandas med nya funktioner.

## Söklista: texturer/material

Sök efter sömlösa PBR-material med Base Color, Roughness och Normal (OpenGL).
Metallic/AO är användbara när de finns; höjdkarta är valfri och behövs inte för
första integrationen. Börja med 1K–2K, helst med angiven verklig repetitionsstorlek.

| Prio | Material | Användning | Sökord / inriktning |
| --- | --- | --- | --- |
| P1 | Mörkt borstat stål eller aluminium | Tak, bärvalv, fönsterram | dark brushed metal, brushed aluminium PBR |
| P1 | Mörkt golv med fina fogar / diskret slitage | Golvpanelerna | sci fi floor panels, dark metal floor, satin floor PBR |
| P1 | Mörk pulverlackerad metall | Planteringskärl, konsolstativ, väggar | powder coated metal, painted metal PBR |
| P2 | Borstad mässing / anodiserad brons | Räcke och varma kantlister | brushed brass, bronze metal PBR |
| P2 | Mörk textil eller läder | Bänkdynor | upholstery fabric, dark leather PBR |
| P2 | Jord / barkflis | Planteringsytor | potting soil, mulch PBR |
| P2 | Bladmaterial med alpha | Växter om det inte ingår i GLB | leaf atlas, foliage alpha, cutout leaves |

Undvik redan inbakade starka skuggor i basfärgen. Transparenta blad bör fungera
med alpha-cutout; stora överlappande transparenta ytor blir dyra. Planet-/rymdkartor
finns redan. Glasmaterial är inte ett krav: utsikten använder nu en öppen ram.
Takets UV följer ungefär 4 m repetition i längdriktningen. Befintliga box-UV:er på
övriga delar behöver justeras för rätt fysisk skala när materialet är valt.

## Exakta modellplatser

Lokalt origo är världspunkt **(-84, 24, 0)**. +Y är uppåt, -X mot planetfönstret,
+X mot hissporten, Z längs rummets bredd. En scenenhet motsvarar ungefär en meter.
Tabellen anger lokal position, med global position inom parentes. Modellpivot i
markkontakt mitt under objektet. Mått anges X × Y × Z före rotation.

| Grupp-ID | Position lokal (värld) | Rotation Y | Förväntad inpassning |
| --- | --- | --- | --- |
| TB-OBS-PLANTER-01 | -8 / 0 / -12 (-92 / 24 / -12) | 0° | 5 × 1 × 2,4 m kärl, växter ovanpå |
| TB-OBS-PLANTER-02 | -8 / 0 / 12 (-92 / 24 / 12) | 0° | Samma |
| TB-OBS-PLANTER-03 | 5 / 0 / -12 (-79 / 24 / -12) | 0° | Samma |
| TB-OBS-PLANTER-04 | 5 / 0 / 12 (-79 / 24 / 12) | 0° | Samma |
| TB-OBS-BENCH-01 | 0 / 0 / -8 (-84 / 24 / -8) | 90° | 3 × 0,9 × 1 m |
| TB-OBS-BENCH-02 | 0 / 0 / 8 (-84 / 24 / 8) | 90° | Samma |
| TB-OBS-CONSOLE-01 | -11 / 0 / -7 (-95 / 24 / -7) | 90° | 1,4 × 1,25 × 0,7 m |
| TB-OBS-CONSOLE-02 | -11 / 0 / 7 (-95 / 24 / 7) | 90° | Samma |

Planteringsgrupperna innehåller både kärl och enkel grönska nu. Vid modellbyte
sätter vi ihop valt kärl och valda växter i samma grupp. `OBSERVATION_SLOTS` i
koden är placeringskällan; objektregistret listar faktisk total utbredning inklusive
växtproxies. Behåll den fria mittgången och siktlinjen ovanför räcket.

## Leverans och import

- GLB med inbäddade texturer är förstahandsformat; glTF/FBX/OBJ kan konverteras.
- Ta med modellens källänk och licenstext (även när modellen kallas gratis), samt
  eventuell attribution. Repoanslutningen och val av konkreta kandidater återstår.
- Arbetsbudget: cirka 2–10k trianglar per bänk/kärl/konsol, 3–15k per träd och
  0,3–2k per låg växt. Detta är mål för urval, inte uppmätta hårdvarugränser.
- Sikta på 1–3 material per objekt och dela resurser mellan återanvända instanser.
- Spara originalen separat. Föreslagen kandidatplats efter leverans:
  `public/models/tour-bus/incoming/observation/` (ännu inte skapad).
- Slutlig skala, rotation, materialkonvertering och eventuell förenkling görs vid
  integration. Inga okända filer laddas automatiskt från ett nytt repo.

## Kontroller

Scenens objekt-ID:n, markkontakt, geometri och resursstädning är testade; kamerans
centrala siktlinje genom panoramat är fri. Befintliga fem stationer och maskerade
övergångar använder samma navigationssystem. Necros/Vitrum växlas som förut.
Fysisk mobilprestanda och slutlig material-/modellbudget ska mätas efter att de
riktiga modellerna har valts. Vitrum är fortfarande den tidigare enfärgade planeten.
