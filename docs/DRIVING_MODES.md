# Swipeout och Wipeout — styrning och kamera

Välj **CONTROL MODE** på startskärmen. **Swipeout** är fortfarande standard och
behåller den tidigare körningen med High/Medium/Low-assist. **Wipeout** är en första
spelbar anpassning av styrprinciperna i användarens `tmp/src/wipeout/ship_player.c`.
Den är till för att jämföra körkänsla och finjustera genom provkörning.

**CAMERA FOLLOW** väljs separat:

- **Match control mode:** Swipeout-kamera med Swipeout, Wipeout-kamera med Wipeout.
- **Swipeout:** tidigare kameraföljning, oavsett styrmodell.
- **Wipeout:** nosföljande kamera, oavsett styrmodell.

V/C och CAMERA-knappen väljer fortfarande vy, exempelvis jaktkamera/cockpit.
Inställningarna sparas i denna webbläsare och används när nästa lopp startar.
Assistvärdet sparas även när reglaget är inaktiverat i Wipeout-läget.

## Vad som skiljer

Referenskoden accelererar skeppets rotation, bromsar rotationen snabbare vid
motstyrning och låter färdhastighetens riktning närma sig nosens riktning över tid.
Separata luftbromsar påverkar både fart, vridning och sladd. Den nya profilen
använder dessa principer i vår banas lokala koordinatsystem.

I Wipeout vrider styrningen nosen. Glidriktningen hinner efter. Att släppa styrningen
stoppar vridningen gradvis men centrerar inte automatiskt skeppet eller nosen.
Motstyr för att räta upp inför nästa kurva/hopp. Luftbromsa före tajta kurvor;
en ensidig luftbroms hjälper till att vrida och ger mer sidglid. Motorstyrkan är
20 i denna profil, jämfört med spelarens tidigare 8, för återacceleration efter
bromsning. Samma toppfarts-, boost- och catch-up-regler gäller. CPU-profilerna
har sin befintliga körning och motorstyrka.

Jaktkameran utgår från skeppets riktning och följer yaw/pitch. Skeppets egen
sidolutning får inte hela vyn att gunga; banans dosering/inversion följs däremot.
En dämpad korrigering mot banans mitt följer principen i referensens `camera.c`.
Korrigeringen lagras lokalt för att undvika att en fördröjd världskamera dras
genom loopen. Cockpit får en liten andel av skeppets egen roll.

## Kontroller

| Inmatning | Wipeout-läge |
| --- | --- |
| A/D eller vänster/höger pil | Vrid nosen / motstyr |
| W/uppåtpil | Gas |
| S/nedåtpil | Båda luftbromsarna |
| Q / E | Vänster / höger luftbroms |
| R / F | Pitch |
| Handkontroll vänster spak / styrkors | Analog styrning / digital styrning |
| Handkontroll A / kryss | Gas |
| L1/R1 eller L2/R2 | Separata luftbromsar; triggers är analoga |
| Handkontroll vänster spak vertikalt | Pitch, inte gas |

Wipeout-mapningen ger aldrig gas och höger luftbroms samtidigt från R2. Swipeouts
tidigare handkontrollsmappning behålls. Touchstyrning, gas/bromspedaler och gyro
fungerar med båda styrprofilerna; Swipeout med assist är fortsatt det enklare
alternativet för mobil. Fysiska handkontroller och telefoner behöver provköras.

Valbar strid följer nosen vid skott/låsning i Wipeout-läget. Swipeout och CPU:erna
behåller den tidigare banriktade siktningen.

## Anpassningens gränser

Detta är inte en exakt port av originalets kompletta fria 3D-fysik. Vår spline,
magnetiska vidhäftning, räckeskollisioner, branch-progress och gapfysik finns kvar.
Nosen begränsas till ungefär ±37° från banriktningen; skeppet kan inte vända och
köra baklänges. Originalets triangelfysik, höjdberoende repulsion och startsystem
har inte flyttats över. FOV och befintliga åskådarvyer är oförändrade.

## Finjustera och verifiera

- `src/classic-handling.js`: `CLASSIC_HANDLING` styr rotationsacceleration,
  maxrotation, motorstyrka, sladdens eftersläpning, bromsvridning och roll.
- `src/classic-camera.js`: `CLASSIC_CAMERA` styr avstånd, höjd, korrigering och
  cockpit-roll.
- `src/driving-settings.js`: validerade inställningar och Wipeout-handkontroll.
- `tests/driving-modes.test.js`: styrning, motstyrning, analog broms, 30/60/120 Hz,
  paus/återställning, båda hopp, lopp med riktiga inputs, kameror, lagring och sikte.
- `tools/verify-driving-modes.mjs`: verkliga tangent- och pekarkontroller, syntetisk
  handkontroll, kamera/hopp, UI, inställningar, paus och omstart i Chromium WebGL.

Testföraren kan slutföra lopp men skrapar räcken och är inte ett bevis på bra
mänsklig körkänsla eller optimal linje. Jämför först samma bana med Swipeout +
Wipeout-kamera, sedan Wipeout + samma kamera. Då går det lättare att känna om
det är styrningen eller kameran som behöver mer justering. Utvärdera särskilt
motstyrning, tajta S-kurvor, bromsåterhämtning och hur mycket nosen ska kunna glida.
