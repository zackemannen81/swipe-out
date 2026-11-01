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

D1 är godkänd av användaren efter provkörning. D2 är implementerad 2026-10-28:
se WEAPON_PICKUPS.md. Den nya pickupbalansen återstår att provspela.

- [x] Mer läsbara on-hit-partiklar: kort träffblixt, gnistor och avklingande effekt
  vid träffpunkten. Skilj skott, träff och miss utan att dölja körbanan.
- [x] Skilj egen TARGET LOCKED från ENEMY LOCK och INCOMING MISSILE. Visa en
  tydlig, något större hottext under låsrutan med ljud och begriplig prioritet.
- [x] Flares kan avleda inkommande homingmissil vid rätt timing, med synlig
  READY/cooldown. **Förslag att provbalansera:** 20–30 sekunders cooldown och
  kort skyddsfönster; ingen permanent immunitet eller effekt på vanliga kulor.
- [x] Lös input utan att stjäla pitch på F: föreslå X som första tangent, plus
  touchknapp och handkontrollbindning. F är möjligt endast med uttrycklig ombindning.
- [x] CPU följer samma flarevillkor och cooldown; paus fryser cooldown, retry
  återställer sessionen. Visa avledd missil så att effekten går att förstå.
- [x] Vapen hämtas på vapenplattor i stället för ständig tillgång till alla vapen.
  En slot, tom start, ny pickup ersätter ammunitionen; ingen automatisk omladdning.
  Plattan återkommer efter 8 sekunder, gemensamt för alla förare.
- [x] Vapenplattor stöds av editor, sparformat och CPU-vägval. Kontrollera att
  pickups och räckvidd fungerar även vid hög fart, på branches och i loopar.
- [x] Combat, vapenpickups och flares påverkar inte Time Attack.

## E — Cup, medaljer och upplåsningar

Implementerat i CUP-001, MENU-001 och FINISH-001; tidsgränserna behöver fortfarande
mänsklig provbalansering. Tidigare öppna rutor för garage/progression var inaktuella.

- [x] Foundry Cup: tre banor, poäng, placeringsmedaljer, lika poäng och återupptagning.
- [x] Tidsmedaljer i trevarvslopp, synliga måltider före start och efter loppet.
  Gold/Silver/Bronze baseras initialt på banlängd / 110, 95 respektive 80 world
  units/s. Necros Gold-tid låser upp Spire Silver; se FINISHING_PASS.md.
- [x] Kestrel/Orca och två moduler låses upp i kampanjen; originalskeppet finns kvar.
- [x] Dominion Gold-lackering, troféer och nästa kampanjmål på resultatskärmen.
- [x] Versionssparad progression; Race-rekord separeras efter bana/revision,
  svårighet, kontrolläge, assist, combat och loadout. TA/cup använder fabriksskepp.
- [x] Lokal RECORDS-sida, personbästa/differens och bästa varv; cup behåller poäng.

## F — Ljud och återkoppling

- [x] Motorvolym följer gaspådrag; luftbroms-, skrap- och landningsljud kompletterar
  befintliga boost-/kollisionsljud. Procedurala effekter är första ljudversionen.
- [x] Befintlig prioriterad announcer och anti-spam för sista varv, PB och hot.
- [x] Hotljud dämpar upprepade vapeneffekter; nya korta effekter har röstbudget.
- [x] Sparad musik-, effekt- och röstvolym, mute samt effektdynamik för hörlurar/
  högtalare. Nedräkningens klipp, timing och animation är oförändrade.
- [ ] Mänsklig lyssningskontroll på högtalare och hörlurar; slutlig ljudbalans.

## G — Presentation och prestanda

- [x] Gemensam menytypografi, övergångar, touch/tangentbord och gamepadnavigering;
  minskad rörelse respekteras. Fysisk handkontroll behöver fortfarande provas.
- [x] Banval med miljöbild (inte en skärmbild av banan), längd, geometribaserad
  svårighetsindikator, aktuellt Race-PB och kategorier för egna/testbanor.
- [x] Necros: blodröda räcken, justerbar glow och musikpuls, höga patrullfarkoster,
  upphöjda amber-skyltar. Editorn kan placera ljus, maskinrörelser och GLB-klipp.
- [x] Befintlig skippbar banpreview med trailer och skeppsintro före oförändrad
  nedräkning; kamera för handförfattad filmsekvens är framtida innehåll.
- [x] Sparade ljud-, assist-, kamera-, grafik-, bloom- och skakningsinställningar.
- [ ] Fysisk telefon: bildrutetid, minne, laddning och värme under längre pass
  med CPU/combat, TA/ghost och tung bana. Ingen emulering räknas som telefonmätning.
- [ ] Mänsklig kontroll av skyltplacering, flygtrafik och medaljgränser på den
  senaste lokalt sparade Dark PRIME-banan. Den finns bara i användarens browser.

## Genomförande och verifiering

Funktionsluckorna E–G är åtgärdade i FINISH-001. Återstående rutor ovan är
provkörning på fysisk utrustning och innehållsbalans; de är inte verifierade här.
Efter varje leverans: relevanta automatiska kontroller, visuell kontroll av ändrade
flöden och ärlig dokumentation av vad som återstår för mänsklig provkörning.

Den äldre sexstegsplanen finns kvar i historiken; denna lista ersätter dess
prioriteringsordning men behåller CPU, cup, ljud och presentation som mål.
