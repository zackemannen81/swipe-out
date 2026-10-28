# Banverktyg och Raceway Workshop

Etapp C, 2026-10-28. Provbana: [track16](http://127.0.0.1:5173/?track=track16).
[Öppna i editorn](http://127.0.0.1:5173/editor.html?track=track16).

## Användning

- Välj en huvudbanepunkt och ändra **POINT WIDTH** (4–100). Tomt fält ärver
  ROAD WIDTH. Bredden övergår mjukt till nästa punkt och över varvskarven.
- **ROAD MARKINGS & PADS → Raceway** ger en smal streckad mittlinje och
  gula riktningspilar inför tydliga kurvor. Classic behåller tidigare markeringar.
- **+ BOOST / + BRAKE** lägger plattan vid vald huvudbanepunkt eller mitt på
  vald alternativrutt. Första manuella ändringen tar över de automatiska plattorna.
- Ändra LAP %, OFFSET och ROUTE i listan. **FOCUS** visar plattan nära i 3D.
  Positionsprocent på en alternativrutt använder samma varvkoordinat som huvudbanan.
- **SUGGEST BOOSTS** lägger förslag på fria accelerationssträckor; första klicket
  ersätter automatisk placering med förslag. Befintliga manuella plattor behålls.
  Förslagen granskar 100 meter framåt och håller avstånd till hopp och korsningar.
- **RESTORE AUTO PADS** återgår till den gamla placeringen. Undo/redo kan återställa
  redigeringar. Save to Game, Download och Import JSON bevarar alla egenskaper.

Gröna framåtpilar ger befintlig boost. Orange tvärstreck tar bort 28% av aktuell
fart och avbryter pågående boost, en gång per platta och varv. Acceleration fungerar
omedelbart efteråt. Samma passagekontroll gäller spelare och CPU; CPU försöker
undvika orange plattor. Luftburna skepp aktiverar inte plattor. En platta kan missas
åt sidan. Den fysiska ytan är 2,4 × 6 meter och den mörka ramen är lite bredare.
Alternativrutter räknar om längden till fysisk distans. Ljuspulsen ändrar inte ytan.

## Format och begränsningar

Export är nu version 5; version 1–4 och äldre råa banor läses fortfarande.
V5 lägger till vapenplattor med val av rocket/homing/minigun, se WEAPON_PICKUPS.md.
De nya fälten är frivilliga: pointWidths är en array med bredd/null per punkt,
pads är en array med id/type/progress/offset och valfri routeId, roadStyle är
classic eller raceway. Saknat pads-fält använder gamla autoplattor; [] betyder
inga plattor. Gamla banor får inga nya metadata automatiskt och deras Time Attack-
identitet behålls. Redigerad geometri/plattor ger en egen rekordidentitet.

Plattor utanför väg, i hopp, över en ruttände eller överlappande plattor avvisas
med felmeddelande. Vid kraftig avsmalning kan plattor behöva flyttas inåt först.
Punktbredder gäller huvudbanan; alternativrutter behåller sin separata bredd med
anslutningar till den lokala huvudbanebredden. Förslag är geometriska hjälpmedel,
inte bevis på optimal körlinje eller garanterat säker placering vid varje fart.
Kurvpilar ligger före kurvan, följer bankningen och kompletterar befintlig
hastighetsberoende HUD-varning. Manuell provkörning behövs för banbalans.

Track16 är en separat testbana med bredd 12–22, genväg, boost och en sidoplacerad
bromsplatta. De tidigare femton banornas data är oförändrade. Markeringsgeometrin
ritas i instanser; animeringen uppdaterar två delade material.

## Verifiering

86 Node-tester passerar, inklusive bredd/mesh/fysik, formatmigration, plattornas
höghastighetspassage vid 30/60/120 Hz och ruttkoordinater. Alla tolv CPU-körningar
(4 förare × 3 nivåer) slutför tre varv på Workshop utan återställning efter hopp.
Produktionsbygget passerar med tidigare varning för stor bundle.
Webbläsartest: bredd, undo/redo, save/reload, lägga till/ångra platta, export/import,
spelstart och retry. Editor och race har granskats visuellt, även 844×390 race.
Fysisk telefonprestanda och mänsklig provbalansering av denna etapp återstår.

Kör tester: node --test tests/*.test.js; npm run build.
Webbläsarkontroll: node tools/verify-track-workshop.mjs (Playwright/Chrome,
valfri PLAYWRIGHT_MODULE-sökväg).

## Objektfärger och neon

Välj ett objekt under SCENERY. SURFACE COLOR väljer ytfärg och färgar även in
eventuell textur. GLOW COLOR väljer egenlysande färg. Cyan, Pink, Lime, Amber
och Violet sätter både ytfärg och neonglöd. GLOW OFF släcker glöden; DEFAULT COLORS
återställer materialets standardfärger. Editorn visar självlysande material; spelet
lägger också bloom runt ljusa objekt. Färger följer med vid kloning, undo/redo,
sparning och export. Befintliga texturer behålls.
