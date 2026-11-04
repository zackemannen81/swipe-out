# Turnébussen – objektlista för modellbyte

Första byggversionen, 3 november 2026. Detta dokument beskriver vad varje namngiven grupp i 3D-prototypen ska föreställa. Geometrin är enkla platshållare utom spelarens befintliga racerskepp och importerade serviceplattformen, hangarmodulerna, sidoporten och generiska fraktskyttlarna. Plattformens mått i listan avser den importerade modellen efter skalning. Necros använder nu dina yt-, moln- och rymdtexturer under public/images/tour-bus. JSON-filen bredvid innehåller exakta koordinater, rotationer och utbredning för modellmatchning.

## Så hittar du prototypen

Huvudmeny → THE TOUR BUS. Växla mellan Grand Hangar, Service Bay, Tournament Nexus, Pilots’ Lounge och Observation via knapparna längst ned. I översiktsvyn finns klickbara etiketter vid platserna. Garage och racestart använder befintliga menyer. Necros kräver den sparade Dark PRIME-banan i samma webbläsarursprung. Vitrum startar ett öppet race; nya kampanjbelöningar är inte införda.

## Visuell riktning

Racers- och industrihangarbilderna styr upprepade dockor, traverskran, servicebalkonger och stora bärverk. Observationsbilderna styr fönster, planet och varm/kall belysning. Den gotiska garagebilden är en möjlig senare utsmyckning av verkstadsområdet. Exteriörerna visar ambitionsnivå och silhuett, men hela moderskeppet byggs inte i denna version. Konceptbilderna används inte som runtime-texturer. Människor, besättning och spelbara NPC-dialoger är inte modellerade; loungen har fyra korta delegationstransmissioner.

## Koordinater och byte

En scenenhet behandlas som en meter i denna layout. +Y är uppåt. Planetfönstret ligger mot -Z, bakre hangaränden mot +Z. Däcket är 46 × 66 enheter och valven når cirka 21 enheter. Detta är ett spelbart utsnitt, inte hela turnébussens fastställda skala. Spelarens racer använder befintlig spelskala.

Behåll gruppens ID, position och rotation när en modell ersätter dess innehåll. Rotpunkten är gruppens lokala origo; för möbler och dockor ligger den vid golvet. För kranen ligger den vid takbalken. Måtten nedan är platshållarens axelriktade utbredning, inte bindande beställningsmått. TB-RACER-01 får storlek 0 i manifestet eftersom skeppet kopplas in från spelarprofilen först när navet visas.

1. Leta fram en modell per objekttyp, inte per instans.
2. Kopiera den till en arbetsmapp och behåll originalet orört.
3. Kontrollera skala, axlar, pivot, material, texturer och trianglar innan export till GLB.
4. Byt barnen under rätt grupp i src/tour-bus.js. Behåll grupp-ID och kameramål.
5. Kontrollera silhuett från alla fem kameravyer och att ljus/markkontakt fungerar.

## Prioritering och föreslagna budgetar

P1 betyder viktig för rummets karaktär eller interaktion; P2 kan vänta. Börja med valvbåge, lyftplattform, kran, briefingbord och fönsterram. Sikta initialt på 5–20k trianglar för stora hjälteobjekt, 1–5k för återkommande möbler och 300–1500 för lådor. Detta är arbetsbudgetar, inte uppmätta hårdvarugränser. Återanvänd geometri/material; helst 1–2 material per småobjekt, 1K texturer för bakgrund och upp till 2K för nära objekt. Undvik onödiga 4K/8K-kartor, inbakade lampor och stora transparenta ytor. Valv, väggar och balkonger kan förbli modulära i enkel geometri. Behåll racerresursernas nuvarande optimering.

## Objektregister

Position och mått anges som X / Y / Z. Varje rad motsvarar en utbytbar grupp; detaljer inuti gruppen såsom skruvar, ljuslister och räckesstolpar behöver inte egna modeller.

| ID | Föremål | Prioritet | Position | Utbredning | Ska ersättas med / funktion |
| --- | --- | --- | --- | --- | --- |
| TB-DECK-01 | Huvuddäck | P1 | 0 / -0.3 / 0 | 46 / 0.64 / 66 | Slitna modulära metallplattor, kabelrännor och gångmarkeringar. |
| TB-ROOF-01 | Hangartak | P2 | 0 / 0 / 0 | 44.27 / 10.53 / 66 | Mörka takpaneler bakom bärverket, med plats för ventilation och kabelstegar. |
| TB-RIB-01 | Bärande valvbåge | P1 | 0 / 0 / 26 | 46.2 / 21.64 / 2 | Återanvändbar industribåge med pelarfot, snedsträva och takbalk. |
| TB-RIB-02 | Bärande valvbåge | P1 | 0 / 0 / 15 | 46.2 / 21.64 / 2 | Återanvändbar industribåge med pelarfot, snedsträva och takbalk. |
| TB-RIB-03 | Bärande valvbåge | P1 | 0 / 0 / 4 | 46.2 / 21.64 / 2 | Återanvändbar industribåge med pelarfot, snedsträva och takbalk. |
| TB-RIB-04 | Bärande valvbåge | P1 | 0 / 0 / -7 | 46.2 / 21.64 / 2 | Återanvändbar industribåge med pelarfot, snedsträva och takbalk. |
| TB-RIB-05 | Bärande valvbåge | P1 | 0 / 0 / -18 | 46.2 / 21.64 / 2 | Återanvändbar industribåge med pelarfot, snedsträva och takbalk. |
| TB-RIB-06 | Bärande valvbåge | P1 | 0 / 0 / -29 | 46.2 / 21.64 / 2 | Återanvändbar industribåge med pelarfot, snedsträva och takbalk. |
| TB-GALLERY-L | Servicebalkong | P2 | -20 / 0 / 0 | 4.07 / 1.85 / 63 | Gångbrygga med räcke och tekniska skåp längs hangaren. |
| TB-WALL-L | Hangarvägg | P2 | -23 / 0 / 0 | 1 / 18 / 66 | Paneler, serviceöppningar och ventilationsfält. |
| TB-GALLERY-R | Servicebalkong | P2 | 20 / 0 / 0 | 4.07 / 1.85 / 63 | Gångbrygga med räcke och tekniska skåp längs hangaren. |
| TB-WALL-R | Hangarvägg | P2 | 23 / 0 / 0 | 1 / 18 / 66 | Paneler, serviceöppningar och ventilationsfält. |
| TB-PAD-01 | Spelarens serviceplattform | P1 | 4 / 0 / 4 | 8.48 / 2.98 / 8.6 | Importerad repair-platform.glb, proportionellt skalad till 8,6 m bredd och grundad på däcket. Enkel ljusplattform används medan modellen laddas eller om laddningen misslyckas. |
| TB-RACER-01 | Utrustat racerskepp | P1 | 4 / 1.15 / 4 | 0 / 0 / 0 | Visar spelarens befintliga valda skepp och finish. Återanvänd spelets racer; ingen ny modell behövs. |
| TB-DOCK-01 | Bakgrundsdocka | P2 | -12 / 0 / -4 | 8.8 / 6.11 / 8.79 | Importerad öppen hangarmodul med tre valvbågar och golv. Upprepas runt generiska fraktskyttlar; inga motståndarskepp tilldelas här. |
| TB-SHUTTLE-01 | Serviceskyttel | P2 | -12 / 0.35 / -4 | 4.8 / 3.6 / 4.3 | Tillfällig generisk Meshy Space Shuttle med synlig cockpit/interiör, optimerad spelkopia. Dekoration i fraktdockan; påverkar inte CPU-racers eller deras slutliga skepp. |
| TB-DOCK-02 | Bakgrundsdocka | P2 | -12 / 0 / -14 | 8.8 / 6.11 / 8.79 | Importerad öppen hangarmodul med tre valvbågar och golv. Upprepas runt generiska fraktskyttlar; inga motståndarskepp tilldelas här. |
| TB-SHUTTLE-02 | Serviceskyttel | P2 | -12 / 0.35 / -14 | 4.8 / 3.6 / 4.3 | Tillfällig generisk Meshy Space Shuttle med synlig cockpit/interiör, optimerad spelkopia. Dekoration i fraktdockan; påverkar inte CPU-racers eller deras slutliga skepp. |
| TB-DOCK-03 | Bakgrundsdocka | P2 | -12 / 0 / -24 | 8.8 / 6.11 / 8.79 | Importerad öppen hangarmodul med tre valvbågar och golv. Upprepas runt generiska fraktskyttlar; inga motståndarskepp tilldelas här. |
| TB-SHUTTLE-03 | Serviceskyttel | P2 | -12 / 0.35 / -24 | 4.8 / 3.6 / 4.3 | Tillfällig generisk Meshy Space Shuttle med synlig cockpit/interiör, optimerad spelkopia. Dekoration i fraktdockan; påverkar inte CPU-racers eller deras slutliga skepp. |
| TB-PORT-01 | Fraktdockans sidoport | P1 | -19.5 / 0 / -14 | 6 / 4.05 / 6 | Importerad hangar_port.glb vid vänster sidovägg, med portpanel och servicegångar. |
| TB-CRANE-01 | Traverskran | P1 | 4 / 13 / 4 | 30 / 6.5 / 2 | Takbalk med löpvagn, dubbla vajrar och serviceok. |
| TB-CONSOLE-01 | Utrustningsterminal | P1 | 9 / 0 / 6 | 1.5 / 1.4 / 0.98 | Lutande skärm på stativ intill spelarens plattform. Öppnar garage. |
| TB-NEXUS-01 | Briefingbord | P1 | 12 / 0 / -15 | 5.2 / 3.18 / 5.2 | Runt hologrambord med planetprojektion. Välj Necros eller Vitrum. |
| TB-BANNER-01 | Civilisationsfana | P2 | -19.5 / 0 / -18 | 0.16 / 4.18 / 2 | Vertikal fana för en av de fyra offentliga civilisationerna. Symboler ersätts senare. |
| TB-BANNER-02 | Civilisationsfana | P2 | -19.5 / 0 / -6 | 0.16 / 4.18 / 2 | Vertikal fana för en av de fyra offentliga civilisationerna. Symboler ersätts senare. |
| TB-BANNER-03 | Civilisationsfana | P2 | 19.5 / 0 / -18 | 0.16 / 4.18 / 2 | Vertikal fana för en av de fyra offentliga civilisationerna. Symboler ersätts senare. |
| TB-BANNER-04 | Civilisationsfana | P2 | 19.5 / 0 / -6 | 0.16 / 4.18 / 2 | Vertikal fana för en av de fyra offentliga civilisationerna. Symboler ersätts senare. |
| TB-LOUNGE-01 | Loungepodie | P2 | -14 / 0 / 14 | 11 / 0.83 / 11 | Upphöjt viloområde med sittplatser och lågt bord. |
| TB-SEAT-01 | Pilotfåtölj | P2 | -14 / 0 / 17.5 | 1.3 / 1.67 / 1.32 | Modulär vilostol för lounge. Fristående säte, rygg och fot. |
| TB-SEAT-02 | Pilotfåtölj | P2 | -10.671302192966962 / 0 / 15.081559480312317 | 1.66 / 1.67 / 1.65 | Modulär vilostol för lounge. Fristående säte, rygg och fot. |
| TB-SEAT-03 | Pilotfåtölj | P2 | -11.942751616976343 / 0 / 11.168440519687685 | 1.83 / 1.67 / 1.84 | Modulär vilostol för lounge. Fristående säte, rygg och fot. |
| TB-SEAT-04 | Pilotfåtölj | P2 | -16.057248383023655 / 0 / 11.168440519687683 | 1.83 / 1.67 / 1.84 | Modulär vilostol för lounge. Fristående säte, rygg och fot. |
| TB-SEAT-05 | Pilotfåtölj | P2 | -17.328697807033038 / 0 / 15.081559480312315 | 1.66 / 1.67 / 1.65 | Modulär vilostol för lounge. Fristående säte, rygg och fot. |
| TB-CARGO-01 | Reservdelscontainer | P2 | 17 / 0 / 14 | 1.5 / 1.4 / 2.1 | Stapelbar låda med lås, hörnskydd och märkning. En modell kan återanvändas. |
| TB-CARGO-02 | Reservdelscontainer | P2 | 19 / 0 / 14 | 1.5 / 1.4 / 2.1 | Stapelbar låda med lås, hörnskydd och märkning. En modell kan återanvändas. |
| TB-CARGO-03 | Reservdelscontainer | P2 | 17 / 0 / 10 | 1.5 / 1.4 / 2.1 | Stapelbar låda med lås, hörnskydd och märkning. En modell kan återanvändas. |
| TB-CARGO-04 | Reservdelscontainer | P2 | 19 / 0 / 10 | 1.5 / 1.4 / 2.1 | Stapelbar låda med lås, hörnskydd och märkning. En modell kan återanvändas. |
| TB-CARGO-05 | Reservdelscontainer | P2 | 17 / 0 / 6 | 1.5 / 1.4 / 2.1 | Stapelbar låda med lås, hörnskydd och märkning. En modell kan återanvändas. |
| TB-CARGO-06 | Reservdelscontainer | P2 | 19 / 0 / 6 | 1.5 / 1.4 / 2.1 | Stapelbar låda med lås, hörnskydd och märkning. En modell kan återanvändas. |
| TB-CARGO-07 | Reservdelscontainer | P2 | 17 / 0 / 2 | 1.5 / 1.4 / 2.1 | Stapelbar låda med lås, hörnskydd och märkning. En modell kan återanvändas. |
| TB-WINDOW-01 | Orbitalfönstrets ram | P1 | 0 / 0 / -32 | 46 / 19.5 / 1 | Stor öppen fönsterram. Ingen tung genomskinlig glasruta behövs i prototypen. |
| TB-RAIL-01 | Observationsräcke | P2 | 0 / 0 / -27 | 40.09 / 1.26 / 0.11 | Lågt skyddsräcke längs planetvyn. |
| TB-PLANET-01 | Planetkuliss | P1 | 8 / 7 / -88 | 77.91 / 55.1 / 77.91 | Necros: brinnande yttextur på sfär och separat molnskal med opacitet 0,25. Vitrum använder tills vidare en färgad sfär. |
| TB-MOON-01 | Necros måne | P2 | -29 / 16 / -103 | 10.4 / 10.4 / 10.4 | Liten stenig måne med användarens grå yttextur. Syns tillsammans med Necros utanför orbitalfönstret. |
| TB-STARS-01 | Stjärnfält | P2 | 0 / 0 / 0 | 560 / 560 / 560 | Användarens varma rymdbild (space-skybox-warm.jpg) på en inåtvänd sfär, kompletterad med ett glest punktstjärnfält bakom fönstret. |

## Övriga scenkomponenter

Fyra punktljus, ett riktat ljus och hemisfäriskt grundljus är scenbelysning, inte GLB-objekt. Kamera, klicketiketter och navigation hör till gränssnittet. Hologramsfären ingår i TB-NEXUS-01; stjärnpunkterna i TB-STARS-01. Golvets linjer ingår i TB-DECK-01. Dessa grupper täcker alla statiska ritade objekt. Spelarens racer klonas med egna material; originalets geometri delas och får inte raderas vid modellbyte.

## Nästa modellleverans

Lägg gärna utvalda kandidater i public/models/tour-bus/incoming med beskrivande namn, exempelvis crane.glb, chair.glb och console.glb. Den mappen behöver inte innehålla hela din osorterade samling. Inga nya tunga modeller laddas automatiskt i denna version. För varje kandidat: notera källa, licens, filstorlek, trianglar, texturupplösning, avsedd TB-grupp och om den behöver förenklas.

Objektlistan genereras med node tools/document-tour-bus.mjs. Ändra malltexten där om dokumentet ska regenereras. Kamera och objektsgrupper finns i src/tour-bus.js; interaktioner och profilkoppling i src/tour-bus-ui.js.
