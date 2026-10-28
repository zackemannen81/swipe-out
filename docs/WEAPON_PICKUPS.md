# Vapenplattor

D2 / COMBAT-003, 2026-10-28. Aktivera Combat Mode i ett vanligt Race.

Alla startar utan vapen. Kör över en lila platta för att fylla din enda vapenslot:
3 raketer, 1 homingmissil eller 30 minigunskott. Ny pickup ersätter tidigare
ammunition. Ingen automatisk omladdning; när vapnet är tomt behöver du en ny platta.

Håll Space eller FIRE på skärmen, alternativt X/Square på standardgamepad, för
att skjuta. Tangentbordets X används fortfarande för flares; gamepad B/Circle
används för flares. Siffertangenterna väljer inte längre vapen. Homing kräver lås.

Plattans svävande ikon visar vapentypen: blå rockets, amber heatseeker och turkos
minigun. Samma ikon visas bredvid ammunitionen. Ikonen guppar och vrider sig lätt
i både editor och spel, och försvinner under återladdningen.

Plattan mörknar efter upplockning och återkommer efter 8 sekunder. Återladdningen
är gemensam: första föraren fram får vapnet. En lyckad upplockning per platta/varv.
Paus fryser tiden och retry återställer plattor och ammunition. CPU använder samma
regler och söker tillgängliga plattor när vapensloten är tom. Flygande skepp och
respawn plockar inte upp vapen. Time Attack och Race utan Combat saknar pickups.

## Editor och gamla banor

Använd + WEAPON och välj ROCKET, HOMING eller MINIGUN. Plattor kan ligga på
huvudbanan eller en branch. Undo/redo, sparning, export och import bevarar typen.
Exportformatet är v5; äldre v1–4 och råa banor går fortfarande att läsa.

Banor utan egna vapenplattor får automatiska placeringar, även om de har egna
boost/bromsplattor. Breda huvudvägar får två alternativ i olika körfält. När du
lägger till en egen vapenplatta ersätter den automatiska vapenplaceringar för hela
banan. Editorn visar plattorna som förhandsvisning; spelet visar dem bara i Combat.

## Verifiering

97 Node-tester passerar, inklusive ammunition, 30/60/120 Hz, hög fart, branchval,
flykt/respawn, gemensam cooldown, paus/retry, format och automatisk placering på
alla 16 banor. Fyra CPU-förare slutför tre varv på Crossfire, alla hämtar vapen
och skott avfyras. Bygget passerar med befintlig varning för stora chunks.

Browserkontroll täcker editorval/undo/redo/save/reload/export/import, tom start,
pickup, 30 skott till tom minigun, paus/retry och Time Attack. Editor-, desktop-
och 568x320-bilder granskade; inga page errors. Fysisk telefon/handkontroll och
upplevd balans/ljud återstår att provspela. Prova gärna Crossfire (track14).

Kör: node --test tests/*.test.js; npm run build;
node tools/verify-weapon-pickups.mjs (Chrome/Playwright, valfri PLAYWRIGHT_MODULE).
