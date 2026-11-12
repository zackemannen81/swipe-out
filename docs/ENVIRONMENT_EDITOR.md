# Bygg rum och miljöer

Öppna `/editor.html?mode=environment` på spelets utvecklingsserver, eller välj
**ENVIRONMENT EDITOR** i baneditorns sidhuvud.

1. Välj **NEW ROOM TEMPLATE** för golv och tre väggar (24 × 24, höjd 8),
   eller **NEW EMPTY SCENE**. Ge scenen ett namn.
2. Lägg till former och GLB-modeller. Vid skala 1 motsvarar en enhet ungefär
   en meter. Ändra position, rotation, storlek och material i objektpanelen.
   Shift/Ctrl-klick markerar flera objekt; kopiera/klistra in och ångra fungerar.
3. Placera kameran med orbit eller **FLY MODE** (WASD, Q/E, Shift och musdrag).
   Klicka **CAPTURE CAMERA** när du hittat rummets presentationsvy.
4. Justera FOV, ljus och bakgrund. **PREVIEW CAMERA** visar den fångade vyn
   utan rutnät och redigeringshjälpmedel. Escape återgår till redigeringen.
5. **SAVE SCENE** sparar i just den här webbläsaren och webbplatsadressen.
   **DOWNLOAD** ger en JSON-fil att säkerhetskopiera och lämna för integration.

## Modeller och bilder

**+ GLB FILE** bäddar in modeller upp till 32 MB. Hela JSON-filen får vara
högst 64 MB. Större modeller placeras under projektets `public/models/` och
läggs till med exempelvis `/models/my-room/chair.glb` i **GLB PATH**.
Dessa referenser kräver att modellfilerna följer med; de bäddas inte in i JSON.
Modellens material bevaras. Importerade modeller kan behöva skalas om.

Befintliga material-/texturkontroller kan användas på former. **SKYSPHERE**
använder panoramabilder från `public/images`; välj bakgrundsfärg för en enfärgad
bakgrund. Vanliga perspektivbilder blir inte automatiskt tredimensionella rum.
Musikval sparas som referens; editorn spelar inte musiken.

## Återanvänd en bana

**IMPORT SCENE / TRACK JSON** läser både scenfiler och exporterade banor.
Banans objekt och horisontella skala bevaras, men körbana, räcken och
banredigering visas inte. Importen blir ett nytt utkast; originalbanan ändras inte.

Scener ligger i ett separat IndexedDB-bibliotek (`swipe-out-environments`).
Exportformatet är `swipeout-environment`, version 1, med objekt, skala, kamera,
ljus, bakgrund och valfria mediareferenser. Det innehåller ingen körbana.

Det här är ett verktyg för att bygga och förhandsvisa miljöer. Koppling till ett
specifikt Tour Bus-rum, klickbara funktioner och kollisioner görs vid integration.
