# Turnébussen — gemensam assetlista

Uppdaterad 2026-11-11. Alla 15 offentliga områden har nu en besökbar grundmodell.
Däck 3060 har endast ett slutet, låst rumsskal. Grundformerna är inte slutlig art.
Vi använder stationära kameravyer och maskerade passage-/hissbyten, inte fri gång.
Befintligt garage, skepp, importerad hangarutrustning och dina ljud behålls.

## Börja här

1. Samla P1 till observationsdäcket: träd, låga växter, kärl, konsol och tre material.
   Detaljer och mått finns i [OBSERVATION_DECK_ASSETS.md](OBSERVATION_DECK_ASSETS.md).
2. Välj ett sammanhängande gemensamt material-/modulkit till hela fartyget.
3. Samla en representativ modell per objekttyp till nästa rum. Vi provar den innan
   du lägger tid på fler varianter. Placeringar återanvänder samma modell.
4. Slutliga smådetaljer och unika berättelseföremål kommer efter första materialpasset.

## Gemensamt kit — hög återanvändning

| Prio | Modell/material | Antal unika att börja med | Sökord | Användning |
| --- | --- | --- | --- | --- |
| P1 | Väggpanel, hörn, sockel, takpanel | 1 sammanhängande kit | modular sci fi interior panels | Alla rum; anpassa mot befintliga rumsskal |
| P1 | Sluten skjutdörr / hissfront | 1–2 | sci fi sliding door, elevator door | TB-DOOR-*; cirka 3 × 4 m öppningsmarkering |
| P1 | Informations-/serviceterminal | 1–2 | sci fi terminal, touchscreen pedestal | Verkstad, observation, sjukstuga, säkerhet, dockning |
| P1 | Mörk borstad metall, matt golv, lackerad metall | 3 PBR-set | brushed metal, panel floor, powder coated metal | Grundpalett för hela skeppet |
| P2 | Bänk, stol och lågt bord | 1 av varje | modular lounge seating, futuristic chair | Lounge, museum, säkerhet, hytter |
| P2 | Standardlåda och lastbehållare | 2–3 | sci fi cargo crate, storage container | Hangar, marknad, verkstad, förråd |
| P2 | Ljuslist, armatur, ventil och kabelstege | 1–2 av varje | recessed light, vent grille, cable tray | Rumskanter, teknik och tak |
| P2 | Mässing/brons, textil, gummi | 3 PBR-set | brushed brass, upholstery, rubber | Varma detaljer och möbler |

Räcken, bärverk och rumsskal kan fortsatt vara specialbyggd geometri. Leta inte
nödvändigtvis efter ett färdigt helt rum: enhetliga material ger större nytta först.

## Rum för rum

Antal är en första uppsättning unika kandidater, inte antalet placeringar.
Grupp-ID:n och faktiska placeringar finns i [TOUR_BUS_OBJECTS.json](TOUR_BUS_OBJECTS.json).

| Zon / rum | Kandidater att samla | Unika | Befintligt / grupp-ID | Ordning |
| --- | --- | --- | --- | --- |
| 01 Huvudhangar | Travers, serviceställning, väggpaneler, kabelstegar | 1 per typ | Dockmodul, port och fraktskyttel finns redan; TB-CRANE-01, TB-RIB-* | Efter observation |
| 02 Pilotlounge | Fåtölj, soffa/bänk, bord, bardisk | 1 per typ | TB-SEAT-*, TB-LOUNGE-01; fanor får egen grafik senare | Nästa publika miljö |
| 03 Verkstad | Verktygsvagn, robot-/servicearm, reservdelsställ, terminal | 1 per typ | Serviceplattform och racerskepp finns; TB-PAD-01, TB-CONSOLE-01 | Återanvänd hangarkit |
| 04 Reservdelsmarknad | Modulärt stånd, små komponenter, displayhylla | 1 + 3 komponenter + 1 | Sex stånd: TB-04-STALL-*; disk cirka 4 × 1,1 × 2 m | Efter gemensamt kit |
| 05 Tournament Nexus | Hologrambord, delegationsstol, väggdisplay | 1 per typ | TB-NEXUS-01; bord cirka 5 m diameter | Viktigt huvudrum |
| 06 Observation | Träd, småväxter, kärl, konsol, bänk | Se separat lista | Specialbyggd arkitektur finns; TB-OBS-* | Första referensrum |
| 07 Diplomatikorridor | Banerfäste, väggrelief, utställningssockel | 1 per typ | Fyra platser TB-07-DELEGATION-*; inga nya hemliga symboler | Återanvänd museikit |
| 08 Besättningshytter | Sovkapsel/koj, personligt skåp, liten läslampa | 1 per typ | Sex TB-08-POD-*; koj ungefär 3 × 0,7 × 2 m | Efter publika rum |
| 09 Medbay | Vårdbädd, scannerbåge, diagnoskonsol, medicinskåp | 1 per typ | Tre TB-09-BED-*; bädd cirka 2 × 1 × 3,5 m | Eget ljust materialpass |
| 10 Arkiv | Datahylla, lästerminal, bok-/datavolym | 1 + 1 + 2–3 | Sex TB-10-SHELF-*; hylla cirka 2 × 5 × 4 m | Återanvänd terminaler |
| 11 Engineering Core | Reaktorhölje, grova rör, ventil, kontrollkonsol | 1 per typ | TB-11-REACTOR; cirka 10 m bred, 12 m hög silhuett | Särskild huvudmodell senare |
| 12 Cargo & Storage | Lastställ, pall, container, liten transportvagn | 1 per typ | Sex TB-12-RACK-*; ställ cirka 4 × 5 × 4 m | Återanvänd hangarlådor |
| 13 Shuttle Bay | Dockningsarm, bogser-/lastvagn, slussport | 1 per typ | TB-13-BERTH-L/R; använd befintlig skyttel som första kandidat | Efter hangaren |
| 14 Säkerhetsnav | Scannerportal, övervakningskonsol, skåp | 1 per typ | TB-14-WATCH; portal cirka 4 × 4 m | Återanvänd terminaler |
| 15 VIP / Museum | Monter, pokal/sockel, bänk | 1 + 2–3 + 1 | TB-15-DISPLAY-1..3; sockel cirka 3,2 m diameter | Efter observation/lounge |
| 16 Låst område | Inget att samla nu | — | Endast sluten grundvolym; innehåll och Zackes röster förblir reserverade | Separat senare pass |

## Leveransmall för varje kandidat

Spara helst utanför spelets public-mapp tills kandidaten är vald, exempelvis
`Desktop/tourbus/assets/<rum>/<assetnamn>/`. En stor nedladdningssamling ska inte
råka följa med varje spelbygge. Behåll originalfilerna och lägg en liten README bredvid:

- namn, avsett rum och gärna TB-grupp-ID
- källa/produktlänk, skapare, licensfil och eventuell attribution
- filformat, storlek, trianglar och materialantal om uppgifterna finns
- texturer som ingår, upplösning och eventuella konverteringsbehov

GLB med texturer är förstahandsformat. FBX/OBJ/glTF går att bedöma och konvertera.
Börja med 1K–2K PBR: Base Color, Roughness, Normal (OpenGL), Metallic när relevant.
Ett rimligt första urval är 2–10k trianglar för små möbler/terminaler och 1–3 material
per objekt; reaktor och stora huvudmodeller bedöms separat. Detta är arbetsmål,
inte uppmätta hårdvarugränser. Växtblad bör fungera som alpha-cutout.

Felix-repot och nedladdningar från Fab/Meshy är kandidatkällor. De har inte granskats
eller importerats i detta pass. Behåll respektive tillgångs licens/proveniens.
Vi behöver inte köpa eller generera alla detaljer innan första scenen är provad.

## Nästa visuella pass

Observation blir första referensrum för material, ljus och prestanda. Därefter
hangar/verkstad, Nexus/lounge, följt av övriga rum. Slutpasset jämnar ut material,
ljus, skyltning och övergångar. Rumsspecifika funktioner som handel, vård och
säkerhet är ännu inte implementerade; modellerna visar planerad användning.
