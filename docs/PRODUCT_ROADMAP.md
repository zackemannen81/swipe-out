# Från racingprototyp till färdig spelupplevelse

Utökad 2026-10-28 efter användarens förbättringslista. Funktionsönskemålen kommer
från användaren; ordning och konkreta designval nedan är rekommendationer tills
respektive implementation avgränsas. Detta är en plan, inte en leveransrapport.

## Bevara och bygg vidare på

- Körkänslan i Wipeout och låg assist är accepterad. Bevara baslinjen.
- **Nedräkningen är uttryckligen godkänd och får inte ändras:** ljud, timing,
  text, animation och GO-förlopp. Ett nytt intro ska avslutas före nedräkningen.
- Time Attack har personbästa, sektorer, inspelat ghost, rekommenderad körlinje
  och kurvvarningar. Vidareutveckla befintliga system i stället för parallella.
- Bevara användarens senaste fart-, kamera-, ljud- och combatjusteringar.
  Läs aktuell kod innan varje etapp; äldre statusposter är daterad historik.
- Fysisk telefonmätning får inte ersättas av emulerad skärmstorlek.

## Nuläge granskat 2026-10-28

Källgranskning, inte ny spelverifiering: CPU-profiler, vapen/låsning, boost-plattor,
banmarkeringar och HUD-varningar finns redan. Förbättringarna ska bygga på dessa.
Banformat v3 har global huvudbanebredd och separat branchbredd, men ingen bredd
per huvudbanepunkt. F används redan för pitch i Wipeout. Resultatkortet ärver
höjdbegränsning och automatisk vertikal scroll från `.screen-card`; användaren
rapporterar klippt RACE COMPLETE och ful scrollbar. Orsaken måste reproduceras
visuellt innan den fastställs. Läs [aktuell status](CURRENT_STATUS.md) och
[Time Attack-guiden](TIME_ATTACK.md) för tidigare verifiering och begränsningar.

## Rekommenderad genomförandeordning

| Etapp | Leverans | Varför här? |
| --- | --- | --- |
| A | Resultatskärm och startintro | Rätta synliga problem och rama in varje lopp |
| B | Rookie / Pilot / Elite | Ge återspelbar utmaning före cupbalansering |
| C | Banbredd, plattor och läsbarhet | Gemensam grund för nya banor och vapenupplockning |
| D | Combat: träffeffekter, hot, flares och vapenplattor | Gör strid begriplig och taktisk |
| E | Cup, medaljer och skeppsupplåsningar | Bygg progression på stabila lopp och regler |
| F | Ljud och samlad återkoppling | Koppla konsekventa signaler till färdiga händelser |
| G | Menyer, miljöer och prestandapass | Sammanhängande presentation med mätbar mobilbudget |

Varje etapp kan delas i mindre leveranser. Mät prestanda under arbetet; slutpasset
ersätter inte löpande kontroll. Etapp A är implementerad och godkänd i användarens provspelning. Etapp B är
implementerad och godkänd efter provkörning av alla nivåer. Etapp C är implementerad
2026-10-28 (TRACK-005); mänsklig provbalansering återstår. Se TRACK_WORKSHOP.md.

## A — Resultatskärm och startintro

- [x] Reproducera och rätta klippning av RACE COMPLETE. Rubrik och primärknappar
  ska vara helt synliga på desktop och liten landskapsskärm. Långa resultatlistor
  får en avsiktlig egen scrollregion vid behov; dölj inte bara överflödet.
- [x] Kort fly-by som tydligt visar spelarens skepp, inspirerad av den uppskattade
  inzoomningen vid laddning. Kameran landar mjukt i chase cam innan nedräkningen.
- [x] Separat introfas; ingen tävlingstid eller CPU-start innan befintlig start.
  Ge möjlighet att hoppa över fly-by till samma stabila chase-position.
- [x] Retry, paus, Race och Time Attack startar korrekt utan dubbla ljud/timers.
  Jämför nedräkningen före/efter: dess timing, ljud och animation ska vara identiska.

## B — CPU-svårighet och förarpersonlighet

- [x] Rookie bromsar tidigare och ger större marginaler. Pilot kör mer precist.
  Elite har bättre bromspunkter, omkörningar och konsekvens; ingen dold teleport.
- [x] Skilj svårighetsnivå från personlighet: aggressiv förare tar fler risker och
  genvägar, försiktig förare är jämnare. Misstag ska ha verklig kostnad.
- [x] Minska catch-up på Elite; håll inställningarna synliga och samlade.
  Ändra inte accepterad spelarstyrning för att skapa svårighet.
- [x] Jämför varvtider, spridning, väggkontakter, boostträffar och genvägsval över
  upprepade lopp på samma banor. Se [mätresultat och guide](CPU_DIFFICULTY.md).
- [x] Mänsklig provkörning: användaren har godkänt samtliga nivåer.

## C — Banverktyg, plattor och läsbarhet

- [x] Bredd per kontrollpunkt med mjuka övergångar. Samma bredd måste användas av
  väg, räcken, kollision, CPU, körlinje, boostplacering och branchanslutningar.
- [x] Versionera format vid behov, läs gamla banor med oförändrad global bredd.
  Editor, undo/redo, sparning och import/export ska bevara de nya egenskaperna.
- [x] Tydliga varningspilar före skarpa svängar, placerade med hänsyn till fart,
  sikt, bank och loopar. Komplettera befintliga HUD-varningar.
- [x] Smartare och redigerbar boostplacering: belöna bra utgång ur kurvan och
  alternativa linjer. Undvik plattor som leder rakt in i räcke eller omöjligt hopp.
- [x] Animerade boost-plattor med tydlig riktning och aktiv yta. Animationen får
  inte ändra den fysiska träffytan eller skapa blinkande visuell förvirring.
- [x] Prova bromsplattor som första hinder. De ska kunna upptäckas och undvikas,
  påverka CPU och spelare enligt samma regler och inte skapa permanent fastlåsning.
- [x] Prova en sammanhållen stil för vägmarkeringar, pilar, boost-zoner och mittens
  rutor på en bana innan hela biblioteket ändras. Behåll tydlig färg/funktionskod.

## D — Combat som ett taktiskt lopp

Dela gärna upp i D1 (träffar/hot/flares) och D2 (vapenplattor).

- [ ] Mer läsbara on-hit-partiklar: kort träffblixt, gnistor och avklingande effekt
  vid träffpunkten. Skilj skott, träff och miss utan att dölja körbanan.
- [ ] Skilj egen TARGET LOCKED från ENEMY LOCK och INCOMING MISSILE. Visa en
  tydlig, något större hottext under låsrutan med ljud och begriplig prioritet.
- [ ] Flares kan avleda inkommande homingmissil vid rätt timing, med synlig
  READY/cooldown. **Förslag att provbalansera:** 20–30 sekunders cooldown och
  kort skyddsfönster; ingen permanent immunitet eller effekt på vanliga kulor.
- [ ] Lös input utan att stjäla pitch på F: föreslå X som första tangent, plus
  touchknapp och handkontrollbindning. F är möjligt endast med uttrycklig ombindning.
- [ ] CPU följer samma flarevillkor och cooldown; paus fryser cooldown, retry
  återställer sessionen. Visa avledd missil så att effekten går att förstå.
- [ ] Vapen hämtas på vapenplattor i stället för ständig tillgång till alla vapen.
  Rekommenderad första version: en vapenslot och begränsad ammunition; bestäm
  ersättning vid ny pickup och plattans återladdning före implementation.
- [ ] Vapenplattor stöds av editor, sparformat och CPU-vägval. Kontrollera att
  pickups och räckvidd fungerar även vid hög fart, på branches och i loopar.
- [ ] Combat, vapenpickups och flares påverkar inte Time Attack.

## E — Cup, medaljer och upplåsningar

- [ ] Välj tre genomarbetade och provkörda banor; cup har poäng mellan loppen,
  slutplacering, definierad hantering av lika poäng och möjlighet att fortsätta.
- [ ] Medaljer för tid och placering samt upplåsbara lackeringar. Visa nästa mål
  och vad som låstes upp direkt efter loppet.
- [ ] Rekommendation: lås först upp skepp med olika styrkor (acceleration, fart,
  grepp, luftbromsar eller massa). Startskeppet ska fortfarande vara användbart.
- [ ] Uppgraderingar till befintligt skepp är ett separat alternativ att prova,
  inte ett beslutat parallellt ekonomisystem. Visa kompromisser och undvik att
  obegränsade fartökningar ersätter skicklighet.
- [ ] Spara progression med versionshantering. Separera Time Attack-rekord efter
  faktisk skeppskonfiguration/uppgradering och fysik; jämför inte olika prestanda.
- [ ] Resultat visar placering, bästa varv, rekordförbättring och cup-poäng utan
  att återinföra klippningen från etapp A.

## F — Ljud och återkoppling

- [ ] Motor reagerar på belastning; luftbromsar susar, boost har tydligt påslag,
  räcken ger metallskrap och landning har ett distinkt ljud.
- [ ] Korta signaler för sista varvet, personbästa och inkommande missil, samordnade
  med befintliga ljud så att samma händelse inte annonseras flera gånger.
- [ ] Prioritera farovarningar över upprepade lågprioriterade effekter. Begränsa
  samtidiga röster och kontrollera mix med musik på både högtalare och hörlurar.
- [ ] Sparade nivåer för musik/effekter och mute. Nedräkningens ljud/timing bevaras.

## G — Sammanhängande presentation och stabil prestanda

- [ ] Enhetliga animerade start-, paus-, val- och resultatmenyer med gemensam
  typografi, knappar och övergångar. Responsiva på touch, tangentbord och gamepad;
  stöd minskad rörelse och undvik att animation blockerar input.
- [ ] Banval visar förhandsbild, svårighet och relevant rekord. Samla mekanikernas
  testbanor i egen kategori. Skeppsval förklarar styrkor och svagheter.
- [ ] Bättre bakgrunder och levande omgivningar, exempelvis långsam maskinrörelse,
  trafik på avstånd och ljusvariation. Börja med en sammanhållen miljö per bana;
  behåll fri sikt mot väg, landningsyta, varningar och mål.
- [ ] Spara ljud-, assist-, kamera- och grafikval. Erbjud grafiknivåer samt
  inställningar för kameraskakning och bloom utan att ändra tävlingsfysiken.
- [ ] Mät bildrutetid, minne, laddning och värme över längre pass på namngiven fysisk
  telefon. Bestäm mål utifrån den enheten; verifiera Race med CPU/combat/partiklar,
  Time Attack med ghost och en tung bana. Dokumentera faktiska resultat.

## Genomförande och verifiering

Nästa implementation är **D1: combat, träffeffekter, hot och flares**. Sätt
exakt omfattning och acceptans i [CURRENT_TASK](CURRENT_TASK.md) före kodändring.
Efter varje leverans: relevanta automatiska kontroller, visuell kontroll av ändrade
flöden och ärlig dokumentation av vad som återstår för mänsklig provkörning.

Den äldre sexstegsplanen finns kvar i historiken; denna lista ersätter dess
prioriteringsordning men behåller CPU, cup, ljud och presentation som mål.
