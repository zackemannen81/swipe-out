# Combat: hot, träffar och flares

D1 / COMBAT-002, 2026-10-28. Aktivera COMBAT MODE före ett vanligt race.
Testbana: http://127.0.0.1:5173/?track=track14 (Crossfire Circuit).

## Kontroller och första balans

- X på tangentbord, Flares-knappen på touch eller B/Circle på en handkontroll
  med standardmappning (knapp 1). Ett tryck, inte automatisk upprepning.
- F behåller sin pitchfunktion i Wipeout. Befintlig körning/nedräkning är orörd.
- Flares laddar om på 25 sekunder och är aktiva i 1,2 sekunder. Cooldown visas
  i knappen. Paus fryser tiden; retry återställer till READY.
- Under fönstret avleds homingmissiler riktade mot skeppet inom 140 världsenheter.
  Missilen tappar målet, färgas amber och dras mot en flareposition bakom/vid sidan
  av skeppet. Den kan inte längre skada ett skepp och slocknar där eller efter 1,2s.
- Raketer och minigun påverkas inte. Flares bryter inte angriparens sikte/låsning:
  nya missiler efter skyddsfönstret är fortfarande farliga. För tidig användning
  kan därför förbruka skyddet innan missilen kommer fram.
- CPU använder samma cooldown/fönster/räckvidd och reagerar när en riktad missil
  är inom 85 enheter. Missilerna gör fortfarande samma skada när de träffar.

## Återkoppling

Egen TARGET LOCKING / TARGET LOCKED visas separat från ENEMY TARGET LOCK.
INCOMING MISSILE har högst prioritet, följt av MISSILE DIVERTED och fiendelåsning.
Hottexten visar om flares är redo eller laddar om. Korta syntetiska signaler spelas
vid övergång till ett hot, vid avledning och vid spelarens flareutsläpp.

Träffar ger en kort expanderande blixt och 24 gnistor som sprids och bleknar.
Flares har längre gulorange glöd. Effekterna har ett tak på 24 samtidiga händelser,
576 instanserade gnistor och 48 projektiler. Skott, träff och avledd missil har
separata visuella förlopp; animationerna använder simulationstid och fryser vid paus.

## Verifiering och återstående arbete

90 Node-tester passerar inklusive avledning vid 30/60/120 Hz, CPU, cooldown,
för tidiga flares, raketer/kulor, paus, retry/finish/off och begränsade resurser.
Produktionsbygget passerar med befintlig varning för stor bundle.
Browserkontroll verifierar X, touchknapp, standardgamepad B via simulerad input,
READY/cooldown, paus, retry, separat hottext, 844×390/568×320 och Time Attack utan
combat. Fysiska kontroller/telefon, upplevd ljudnivå och flarebalans behöver
provspelas av människa. Inga användarinställningar eller banor skrivs av testet.

Kod: src/combat.js (FLARES och effekter), src/game.js (input/HUD), src/audio.js.
Verifiering: node --test tests/*.test.js; npm run build;
node tools/verify-combat-flares.mjs (Chrome/Playwright, valfri PLAYWRIGHT_MODULE).

D2 är nu implementerad: se [WEAPON_PICKUPS.md](WEAPON_PICKUPS.md) för tom start,
vapenslot, ammunition och vapenplattor. Flare-reglerna ovan gäller fortfarande.
