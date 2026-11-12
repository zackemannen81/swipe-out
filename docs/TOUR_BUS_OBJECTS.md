# Turnébussen – objektlista för modellbyte

Zonrevision, 11 november 2026. Se TOUR_BUS_ASSET_LIST.md för hela fartygets gemensamma assetlista. Se TOUR_BUS_ZONES.md för planlösning och OBSERVATION_DECK_ASSETS.md för det modellerade observationsdäcket och modell-/texturbehov. Detta dokument beskriver vad varje namngiven grupp i 3D-prototypen ska föreställa. Geometrin är enkla platshållare utom spelarens befintliga racerskepp och importerade serviceplattformen, hangarmodulerna, sidoporten och generiska fraktskyttlarna. Plattformens mått i listan avser den importerade modellen efter skalning. Necros använder nu dina yt-, moln- och rymdtexturer under public/images/tour-bus. JSON-filen bredvid innehåller exakta koordinater, rotationer och utbredning för modellmatchning.

## Så hittar du prototypen

Huvudmeny → THE TOUR BUS. Fem snabbknappar och en rumslista ger tillgång till 15 offentliga stationer. Däck 3060 är låst. Knapparna följer gemensamma zonförbindelser; Escape och tillbaka återgår i besökshistoriken. Garage och racestart använder befintliga menyer. Necros använder den levererade Dark PRIME-banan. Vitrum och Collective startar öppna race; nya kampanjbelöningar är inte införda.

## Visuell riktning

Racers- och industrihangarbilderna styr upprepade dockor, traverskran, servicebalkonger och stora bärverk. Observationsbilderna styr fönster, planet och varm/kall belysning. Den gotiska garagebilden är en möjlig senare utsmyckning av verkstadsområdet. Exteriörerna visar ambitionsnivå och silhuett, men hela moderskeppet byggs inte i denna version. Konceptbilderna används inte som runtime-texturer. Människor, besättning och spelbara NPC-dialoger är inte modellerade; loungen har fyra korta delegationstransmissioner.

## Koordinater och byte

En scenenhet behandlas som en meter i denna layout. +Y är uppåt. Planens vänster är -X och dess ovansida är -Z. Planetfönstret ligger längst västerut mot -X. Däck 3/4/5 använder Y=0/12/24. Däcket är 46 × 66 enheter och valven når cirka 21 enheter. Detta är ett spelbart utsnitt, inte hela turnébussens fastställda skala. Spelarens racer använder befintlig spelskala.

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

| ID | Zon | Föremål | Prioritet | Position | Utbredning | Ska ersättas med / funktion |
| --- | --- | --- | --- | --- | --- | --- |
| TB-DECK-01 | 01 | Huvuddäck | P1 | 0 / -0.3 / 0 | 46 / 0.64 / 66 | Slitna modulära metallplattor, kabelrännor och gångmarkeringar. |
| TB-ROOF-01 | 01 | Hangartak | P2 | 0 / 0 / 0 | 44.27 / 10.53 / 66 | Mörka takpaneler bakom bärverket, med plats för ventilation och kabelstegar. |
| TB-RIB-01 | 01 | Bärande valvbåge | P1 | 0 / 0 / 26 | 46.2 / 21.64 / 2 | Återanvändbar industribåge med pelarfot, snedsträva och takbalk. |
| TB-RIB-02 | 01 | Bärande valvbåge | P1 | 0 / 0 / 15 | 46.2 / 21.64 / 2 | Återanvändbar industribåge med pelarfot, snedsträva och takbalk. |
| TB-RIB-03 | 01 | Bärande valvbåge | P1 | 0 / 0 / 4 | 46.2 / 21.64 / 2 | Återanvändbar industribåge med pelarfot, snedsträva och takbalk. |
| TB-RIB-04 | 01 | Bärande valvbåge | P1 | 0 / 0 / -7 | 46.2 / 21.64 / 2 | Återanvändbar industribåge med pelarfot, snedsträva och takbalk. |
| TB-RIB-05 | 01 | Bärande valvbåge | P1 | 0 / 0 / -18 | 46.2 / 21.64 / 2 | Återanvändbar industribåge med pelarfot, snedsträva och takbalk. |
| TB-RIB-06 | 01 | Bärande valvbåge | P1 | 0 / 0 / -29 | 46.2 / 21.64 / 2 | Återanvändbar industribåge med pelarfot, snedsträva och takbalk. |
| TB-GALLERY-L | 01 | Servicebalkong | P2 | -20 / 0 / 0 | 4.07 / 1.85 / 63 | Gångbrygga med räcke och tekniska skåp längs hangaren. |
| TB-WALL-L | 01 | Hangarvägg | P2 | -23 / 0 / 0 | 1 / 18 / 66 | Paneler, serviceöppningar och ventilationsfält. |
| TB-GALLERY-R | 01 | Servicebalkong | P2 | 20 / 0 / 0 | 4.07 / 1.85 / 63 | Gångbrygga med räcke och tekniska skåp längs hangaren. |
| TB-WALL-R | 01 | Hangarvägg | P2 | 23 / 0 / 0 | 1 / 18 / 66 | Paneler, serviceöppningar och ventilationsfält. |
| TB-PAD-01 | 03 | Spelarens serviceplattform | P1 | 4 / 0 / 52 | 8.48 / 2.98 / 8.6 | Importerad repair-platform.glb, proportionellt skalad till 8,6 m bredd och grundad på däcket. Enkel ljusplattform används medan modellen laddas eller om laddningen misslyckas. |
| TB-RACER-01 | 03 | Utrustat racerskepp | P1 | 4 / 1.15 / 52 | 0 / 0 / 0 | Visar spelarens befintliga valda skepp och finish. Återanvänd spelets racer; ingen ny modell behövs. |
| TB-DOCK-01 | 01 | Bakgrundsdocka | P2 | -12 / 0 / -4 | 8.8 / 6.11 / 8.79 | Importerad öppen hangarmodul med tre valvbågar och golv. Upprepas runt generiska fraktskyttlar; inga motståndarskepp tilldelas här. |
| TB-SHUTTLE-01 | 01 | Serviceskyttel | P2 | -12 / 0.35 / -4 | 4.8 / 3.6 / 4.3 | Tillfällig generisk Meshy Space Shuttle med synlig cockpit/interiör, optimerad spelkopia. Dekoration i fraktdockan; påverkar inte CPU-racers eller deras slutliga skepp. |
| TB-DOCK-02 | 01 | Bakgrundsdocka | P2 | -12 / 0 / -14 | 8.8 / 6.11 / 8.79 | Importerad öppen hangarmodul med tre valvbågar och golv. Upprepas runt generiska fraktskyttlar; inga motståndarskepp tilldelas här. |
| TB-SHUTTLE-02 | 01 | Serviceskyttel | P2 | -12 / 0.35 / -14 | 4.8 / 3.6 / 4.3 | Tillfällig generisk Meshy Space Shuttle med synlig cockpit/interiör, optimerad spelkopia. Dekoration i fraktdockan; påverkar inte CPU-racers eller deras slutliga skepp. |
| TB-DOCK-03 | 01 | Bakgrundsdocka | P2 | -12 / 0 / -24 | 8.8 / 6.11 / 8.79 | Importerad öppen hangarmodul med tre valvbågar och golv. Upprepas runt generiska fraktskyttlar; inga motståndarskepp tilldelas här. |
| TB-SHUTTLE-03 | 01 | Serviceskyttel | P2 | -12 / 0.35 / -24 | 4.8 / 3.6 / 4.3 | Tillfällig generisk Meshy Space Shuttle med synlig cockpit/interiör, optimerad spelkopia. Dekoration i fraktdockan; påverkar inte CPU-racers eller deras slutliga skepp. |
| TB-PORT-01 | 01 | Fraktdockans sidoport | P1 | -19.5 / 0 / -14 | 6 / 4.05 / 6 | Importerad hangar_port.glb vid vänster sidovägg, med portpanel och servicegångar. |
| TB-CRANE-01 | 01 | Traverskran | P1 | 4 / 13 / 4 | 30 / 6.5 / 2 | Takbalk med löpvagn, dubbla vajrar och serviceok. |
| TB-CONSOLE-01 | 03 | Utrustningsterminal | P1 | 9 / 0 / 54 | 1.5 / 1.4 / 0.98 | Lutande skärm på stativ intill spelarens plattform. Öppnar garage. |
| TB-NEXUS-01 | 05 | Briefingbord | P1 | -46 / 12 / 6 | 5.2 / 3.18 / 5.2 | Runt hologrambord med planetprojektion. Välj Necros eller Vitrum. |
| TB-BANNER-01 | 02 | Civilisationsfana | P2 | -54 / 10 / -49 | 2 / 4.18 / 0.16 | Vertikal fana för en av de fyra offentliga civilisationerna. Symboler ersätts senare. |
| TB-BANNER-02 | 02 | Civilisationsfana | P2 | -48 / 10 / -49 | 2 / 4.18 / 0.16 | Vertikal fana för en av de fyra offentliga civilisationerna. Symboler ersätts senare. |
| TB-BANNER-03 | 02 | Civilisationsfana | P2 | -42 / 10 / -49 | 2 / 4.18 / 0.16 | Vertikal fana för en av de fyra offentliga civilisationerna. Symboler ersätts senare. |
| TB-BANNER-04 | 02 | Civilisationsfana | P2 | -36 / 10 / -49 | 2 / 4.18 / 0.16 | Vertikal fana för en av de fyra offentliga civilisationerna. Symboler ersätts senare. |
| TB-LOUNGE-01 | 02 | Loungepodie | P2 | -44 / 12 / -36 | 11 / 0.83 / 11 | Upphöjt viloområde med sittplatser och lågt bord. |
| TB-SEAT-01 | 02 | Pilotfåtölj | P2 | -44 / 12 / -32.5 | 1.3 / 1.67 / 1.32 | Modulär vilostol för lounge. Fristående säte, rygg och fot. |
| TB-SEAT-02 | 02 | Pilotfåtölj | P2 | -40.67130219296696 / 12 / -34.918440519687685 | 1.66 / 1.67 / 1.65 | Modulär vilostol för lounge. Fristående säte, rygg och fot. |
| TB-SEAT-03 | 02 | Pilotfåtölj | P2 | -41.942751616976345 / 12 / -38.831559480312315 | 1.83 / 1.67 / 1.84 | Modulär vilostol för lounge. Fristående säte, rygg och fot. |
| TB-SEAT-04 | 02 | Pilotfåtölj | P2 | -46.057248383023655 / 12 / -38.831559480312315 | 1.83 / 1.67 / 1.84 | Modulär vilostol för lounge. Fristående säte, rygg och fot. |
| TB-SEAT-05 | 02 | Pilotfåtölj | P2 | -47.32869780703304 / 12 / -34.918440519687685 | 1.66 / 1.67 / 1.65 | Modulär vilostol för lounge. Fristående säte, rygg och fot. |
| TB-CARGO-01 | 01 | Reservdelscontainer | P2 | 17 / 0 / 14 | 1.5 / 1.4 / 2.1 | Stapelbar låda med lås, hörnskydd och märkning. En modell kan återanvändas. |
| TB-CARGO-02 | 01 | Reservdelscontainer | P2 | 19 / 0 / 14 | 1.5 / 1.4 / 2.1 | Stapelbar låda med lås, hörnskydd och märkning. En modell kan återanvändas. |
| TB-CARGO-03 | 01 | Reservdelscontainer | P2 | 17 / 0 / 10 | 1.5 / 1.4 / 2.1 | Stapelbar låda med lås, hörnskydd och märkning. En modell kan återanvändas. |
| TB-CARGO-04 | 01 | Reservdelscontainer | P2 | 19 / 0 / 10 | 1.5 / 1.4 / 2.1 | Stapelbar låda med lås, hörnskydd och märkning. En modell kan återanvändas. |
| TB-CARGO-05 | 01 | Reservdelscontainer | P2 | 17 / 0 / 6 | 1.5 / 1.4 / 2.1 | Stapelbar låda med lås, hörnskydd och märkning. En modell kan återanvändas. |
| TB-CARGO-06 | 01 | Reservdelscontainer | P2 | 19 / 0 / 6 | 1.5 / 1.4 / 2.1 | Stapelbar låda med lås, hörnskydd och märkning. En modell kan återanvändas. |
| TB-CARGO-07 | 01 | Reservdelscontainer | P2 | 17 / 0 / 2 | 1.5 / 1.4 / 2.1 | Stapelbar låda med lås, hörnskydd och märkning. En modell kan återanvändas. |
| TB-WINDOW-01 | 06 | Orbitalfönstrets ram | P1 | -100 / 24 / 0 | 2.24 / 13.42 / 32.84 | Öppen 32 m panoramaram med elliptiskt valv och tre lager metall/ljustätning; fri central planetvy. |
| TB-RAIL-01 | 06 | Observationsräcke | P2 | -84 / 24 / 0 | 2.04 / 1.22 / 30.24 | Böjt 30 m observationsräcke, 1,15 m högt, med metallstolpar och tunna horisontella stag. |
| TB-PLANET-01 | 06 | Planetkuliss | P1 | -185 / -65 / -8 | 288.28 / 203.87 / 288.28 | Necros: brinnande yttextur på sfär och separat molnskal med opacitet 0,25. Vitrum använder tills vidare en färgad sfär. |
| TB-MOON-01 | 06 | Necros måne | P2 | -205 / 60 / -58 | 10.4 / 10.4 / 10.4 | Liten stenig måne med användarens grå yttextur. Syns tillsammans med Necros utanför orbitalfönstret. |
| TB-STARS-01 | 01 | Stjärnfält | P2 | 0 / 0 / 0 | 560 / 560 / 560 | Användarens valda rymdbild (space.jpg) på en inåtvänd sfär, kompletterad med ett glest punktstjärnfält bakom fönstret. |
| TB-ORBIT-SHUTTLE-1 | 06 | Orbital service traffic | P2 | -128 / 35 / -25 | 3 / 0.5 / 1 | Slow background shuttle outside the observation window; visual scale cue only, no race or gameplay collision. |
| TB-ORBIT-SHUTTLE-2 | 06 | Orbital service traffic | P2 | -145 / 39 / 4 | 3 / 0.5 / 1 | Slow background shuttle outside the observation window; visual scale cue only, no race or gameplay collision. |
| TB-ORBIT-SHUTTLE-3 | 06 | Orbital service traffic | P2 | -122 / 33 / -4 | 3 / 0.5 / 1 | Slow background shuttle outside the observation window; visual scale cue only, no race or gameplay collision. |
| TB-ROOM-03 | 03 | Workshop / Service Bay | P1 | 0 / 0 / 52 | 32.5 / 12.6 / 30.5 | Separat rum med golv, tak, slutna väggar och markerad passage. |
| TB-DOOR-03 | 03 | Passage / lift | P2 | 15.65 / 0 / 52 | 0.23 / 4.3 / 3.28 | Stängd markerad passage; scenövergång representerar färden mellan däck. |
| TB-ROOM-05 | 05 | Tournament Nexus | P1 | -46 / 12 / 6 | 28.5 / 11.6 / 28.5 | Separat rum med golv, tak, slutna väggar och markerad passage. |
| TB-DOOR-05 | 05 | Passage / lift | P2 | -32.35 / 12 / 6 | 0.23 / 4.3 / 3.28 | Stängd markerad passage; scenövergång representerar färden mellan däck. |
| TB-ROOM-02 | 02 | Pilots’ Lounge | P1 | -44 / 12 / -36 | 28.5 / 11.6 / 28.5 | Separat rum med golv, tak, slutna väggar och markerad passage. |
| TB-DOOR-02 | 02 | Passage / lift | P2 | -30.35 / 12 / -36 | 0.23 / 4.3 / 3.28 | Stängd markerad passage; scenövergång representerar färden mellan däck. |
| TB-ROOM-06 | 06 | Observation: välvt rumsskal | P1 | -84 / 24 / 0 | 34.25 / 14.15 / 34 | 34 × 34 m golv, välvt tak och slutna sidoväggar; panoramat öppnar mot babord. |
| TB-OBS-RIB-01 | 06 | Observationsvalv | P1 | -91 / 24 / 0 | 1.7 / 13.48 / 33.7 | Elliptiskt bärverk med varm integrerad ljuslist och låga pelarfötter. |
| TB-OBS-RIB-02 | 06 | Observationsvalv | P1 | -79 / 24 / 0 | 1.7 / 13.48 / 33.7 | Elliptiskt bärverk med varm integrerad ljuslist och låga pelarfötter. |
| TB-OBS-RIB-03 | 06 | Observationsvalv | P1 | -69 / 24 / 0 | 1.7 / 13.48 / 33.7 | Elliptiskt bärverk med varm integrerad ljuslist och låga pelarfötter. |
| TB-OBS-CEILING | 06 | Takpaneler och ljuslister | P1 | -84 / 24 / 0 | 32 / 8.74 / 32.15 | Längsgående takribbor, varma ljusfält och panelindelning under det välvda taket. |
| TB-OBS-CLADDING | 06 | Segmented vault panels | P1 | -84 / 24 / 0 | 31.58 / 10.33 / 32.92 | Dark inset ceiling panels, transverse seams and alternating warm/cool maintenance lights. |
| TB-OBS-WINDOW-REVEAL | 06 | Layered window reveal | P1 | -99.5 / 24 / 0 | 2.2 / 10.46 / 32.05 | Recessed panoramic window reveal with segmented structural covers and restrained guide lighting. |
| TB-DOOR-06 | 06 | Panoramahissens tröskel | P1 | -67.35 / 24 / 0 | 0.85 / 4.2 / 4.4 | Markerad stängd hissport mot Nexus, med dubbla dörrblad och infälld tröskel. |
| TB-OBS-PLANTER-01 | 06 | Observation: planter | P2 | -92 / 24 / -12 | 5 / 1.09 / 2.45 | Utbytbar inredningsplatshållare; byt gruppens innehåll med matchande GLB enligt observationsdäckets assetlista. |
| TB-OBS-FOLIAGE-01 | 06 | Observation: planted shrub | P2 | -92 / 25.1 / -12 | 1.922 / 1.268 / 2.2 | Supplied bush model rooted in the soil; shared geometry and materials. |
| TB-OBS-PLANTER-02 | 06 | Observation: planter | P2 | -92 / 24 / 12 | 5 / 1.09 / 2.45 | Utbytbar inredningsplatshållare; byt gruppens innehåll med matchande GLB enligt observationsdäckets assetlista. |
| TB-OBS-FOLIAGE-02 | 06 | Observation: planted shrub | P2 | -92 / 25.1 / 12 | 1.922 / 1.268 / 2.2 | Supplied bush model rooted in the soil; shared geometry and materials. |
| TB-OBS-PLANTER-03 | 06 | Observation: planter | P2 | -79 / 24 / -12 | 5 / 1.09 / 2.45 | Utbytbar inredningsplatshållare; byt gruppens innehåll med matchande GLB enligt observationsdäckets assetlista. |
| TB-OBS-FOLIAGE-03 | 06 | Observation: planted shrub | P2 | -79 / 25.1 / -12 | 1.922 / 1.268 / 2.2 | Supplied bush model rooted in the soil; shared geometry and materials. |
| TB-OBS-PLANTER-04 | 06 | Observation: planter | P2 | -79 / 24 / 12 | 5 / 1.09 / 2.45 | Utbytbar inredningsplatshållare; byt gruppens innehåll med matchande GLB enligt observationsdäckets assetlista. |
| TB-OBS-FOLIAGE-04 | 06 | Observation: planted shrub | P2 | -79 / 25.1 / 12 | 1.922 / 1.268 / 2.2 | Supplied bush model rooted in the soil; shared geometry and materials. |
| TB-OBS-BENCH-01 | 06 | Observation: bench | P2 | -84 / 24 / -8 | 3 / 0.426 / 1.252 | Supplied modular bench GLB, shared between the two observation seating slots. |
| TB-OBS-BENCH-02 | 06 | Observation: bench | P2 | -84 / 24 / 8 | 3 / 0.426 / 1.252 | Supplied modular bench GLB, shared between the two observation seating slots. |
| TB-OBS-CONSOLE-01 | 06 | Observation: console | P2 | -95 / 24 / -7 | 1.25 / 1.352 / 0.842 | Supplied information console GLB, proportionally fitted and grounded; decorative screen, existing UI retains controls. |
| TB-OBS-CONSOLE-02 | 06 | Observation: console | P2 | -95 / 24 / 7 | 1.25 / 1.352 / 0.842 | Supplied information console GLB, proportionally fitted and grounded; decorative screen, existing UI retains controls. |
| TB-OBS-TREE-L | 06 | Observation: indoor tree | P2 | -86 / 24 / -13.5 | 2.387 / 3.229 / 2.4 | Supplied potted money tree, grounded beside the planting beds; keeps the central panorama clear. |
| TB-OBS-TREE-R | 06 | Observation: indoor tree | P2 | -86 / 24 / 13.5 | 2.387 / 3.229 / 2.4 | Supplied potted money tree, grounded beside the planting beds; keeps the central panorama clear. |
| TB-OBS-VINE-L | 06 | Observation: hanging vine | P2 | -91 / 27 / -15.5 | 1.3 / 2.35 / 0.411 | Supplied climbing-vine GLB mounted along the side wall, outside the central panorama sightline. |
| TB-OBS-VINE-R | 06 | Observation: hanging vine | P2 | -91 / 27 / 15.5 | 1.3 / 2.35 / 0.411 | Supplied climbing-vine GLB mounted along the side wall, outside the central panorama sightline. |
| TB-ROOM-04 | 04 | Spare Parts Market | P1 | -30 / 0 / 52 | 20.5 / 9.6 / 24.5 | Separat rum med golv, tak, slutna väggar och markerad passage. |
| TB-DOOR-04 | 04 | Passage / lift | P2 | -20.35 / 0 / 52 | 0.23 / 4.3 / 3.28 | Stängd markerad passage; scenövergång representerar färden mellan däck. |
| TB-FIT-04 | 04 | SPARE PARTS MARKET | P2 | -30 / 0 / 52 | 18.4 / 9 / 21.3 | Independent stalls, component displays and a clear central aisle. |
| TB-04-STALL-L1 | 04 | STALL-L1 | P2 | -36 / 0 / 45 | 4.5 / 3.1 / 2.5 | Modular spare-parts stall with counter, canopy and sample components. |
| TB-04-STALL-L2 | 04 | STALL-L2 | P2 | -36 / 0 / 52 | 4.5 / 3.1 / 2.5 | Modular spare-parts stall with counter, canopy and sample components. |
| TB-04-STALL-L3 | 04 | STALL-L3 | P2 | -36 / 0 / 59 | 4.5 / 3.1 / 2.5 | Modular spare-parts stall with counter, canopy and sample components. |
| TB-04-STALL-R1 | 04 | STALL-R1 | P2 | -24 / 0 / 45 | 4.5 / 3.1 / 2.5 | Modular spare-parts stall with counter, canopy and sample components. |
| TB-04-STALL-R2 | 04 | STALL-R2 | P2 | -24 / 0 / 52 | 4.5 / 3.1 / 2.5 | Modular spare-parts stall with counter, canopy and sample components. |
| TB-04-STALL-R3 | 04 | STALL-R3 | P2 | -24 / 0 / 59 | 4.5 / 3.1 / 2.5 | Modular spare-parts stall with counter, canopy and sample components. |
| TB-ROOM-07 | 07 | Diplomacy Corridor | P1 | -14 / 12 / -40 | 28.5 / 8.6 / 10.5 | Separat rum med golv, tak, slutna väggar och markerad passage. |
| TB-DOOR-07 | 07 | Passage / lift | P2 | -0.35 / 12 / -40 | 0.23 / 4.3 / 3.28 | Stängd markerad passage; scenövergång representerar färden mellan däck. |
| TB-FIT-07 | 07 | DIPLOMACY CORRIDOR | P2 | -14 / 12 / -40 | 26.4 / 8 / 7.3 | Delegation banners and meeting alcoves connect the upper public deck. |
| TB-07-DELEGATION-1 | 07 | DELEGATION-1 | P2 | -24 / 12 / -43.8 | 2 / 5.5 / 1.45 | Public delegation banner placeholder with wall pedestal, no secret narrative art. |
| TB-07-DELEGATION-2 | 07 | DELEGATION-2 | P2 | -17.5 / 12 / -43.8 | 2 / 5.5 / 1.45 | Public delegation banner placeholder with wall pedestal, no secret narrative art. |
| TB-07-DELEGATION-3 | 07 | DELEGATION-3 | P2 | -11 / 12 / -43.8 | 2 / 5.5 / 1.45 | Public delegation banner placeholder with wall pedestal, no secret narrative art. |
| TB-07-DELEGATION-4 | 07 | DELEGATION-4 | P2 | -4.5 / 12 / -43.8 | 2 / 5.5 / 1.45 | Public delegation banner placeholder with wall pedestal, no secret narrative art. |
| TB-ROOM-08 | 08 | Crew Quarters | P1 | 34 / -12 / -40 | 20.5 / 8.6 / 22.5 | Separat rum med golv, tak, slutna väggar och markerad passage. |
| TB-DOOR-08 | 08 | Passage / lift | P2 | 43.65 / -12 / -40 | 0.23 / 4.3 / 3.28 | Stängd markerad passage; scenövergång representerar färden mellan däck. |
| TB-FIT-08 | 08 | CREW QUARTERS | P2 | 34 / -12 / -40 | 18.4 / 8 / 19.3 | Sleeping pods, lockers and a shared quiet area for the crew. |
| TB-08-POD-L1 | 08 | POD-L1 | P2 | 28 / -12 / -47 | 3.8 / 2.4 / 2 | Sleeping berth with mattress, privacy frame and adjacent personal locker. |
| TB-08-POD-L2 | 08 | POD-L2 | P2 | 28 / -12 / -41 | 3.8 / 2.4 / 2 | Sleeping berth with mattress, privacy frame and adjacent personal locker. |
| TB-08-POD-L3 | 08 | POD-L3 | P2 | 28 / -12 / -35 | 3.8 / 2.4 / 2 | Sleeping berth with mattress, privacy frame and adjacent personal locker. |
| TB-08-POD-R1 | 08 | POD-R1 | P2 | 40 / -12 / -47 | 3.8 / 2.4 / 2 | Sleeping berth with mattress, privacy frame and adjacent personal locker. |
| TB-08-POD-R2 | 08 | POD-R2 | P2 | 40 / -12 / -41 | 3.8 / 2.4 / 2 | Sleeping berth with mattress, privacy frame and adjacent personal locker. |
| TB-08-POD-R3 | 08 | POD-R3 | P2 | 40 / -12 / -35 | 3.8 / 2.4 / 2 | Sleeping berth with mattress, privacy frame and adjacent personal locker. |
| TB-ROOM-09 | 09 | Medbay | P1 | 12 / -12 / -40 | 18.5 / 8.6 / 22.5 | Separat rum med golv, tak, slutna väggar och markerad passage. |
| TB-DOOR-09 | 09 | Passage / lift | P2 | 20.65 / -12 / -40 | 0.23 / 4.3 / 3.28 | Stängd markerad passage; scenövergång representerar färden mellan däck. |
| TB-FIT-09 | 09 | MEDBAY | P2 | 12 / -12 / -40 | 16.4 / 8 / 19.3 | Treatment beds and diagnostic equipment beside the crew passage. |
| TB-09-BED-1 | 09 | BED-1 | P2 | 8 / -12 / -46 | 3 / 3.6 / 3.5 | Treatment bed with headrest and overhead scanner arch; decorative blockout. |
| TB-09-BED-2 | 09 | BED-2 | P2 | 8 / -12 / -40 | 3 / 3.6 / 3.5 | Treatment bed with headrest and overhead scanner arch; decorative blockout. |
| TB-09-BED-3 | 09 | BED-3 | P2 | 8 / -12 / -34 | 3 / 3.6 / 3.5 | Treatment bed with headrest and overhead scanner arch; decorative blockout. |
| TB-09-DIAGNOSTICS | 09 | DIAGNOSTICS | P2 | 16 / -12 / -45 | 1.8 / 1.25 / 0.89 | Replaceable control terminal with sloped display and grounded pedestal. |
| TB-ROOM-10 | 10 | Archive / Lore Chamber | P1 | -54 / 0 / 52 | 20.5 / 10.6 / 24.5 | Separat rum med golv, tak, slutna väggar och markerad passage. |
| TB-DOOR-10 | 10 | Passage / lift | P2 | -44.35 / 0 / 52 | 0.23 / 4.3 / 3.28 | Stängd markerad passage; scenövergång representerar färden mellan däck. |
| TB-FIT-10 | 10 | ARCHIVE / LORE CHAMBER | P2 | -54 / 0 / 52 | 18.4 / 10 / 21.3 | Data shelves and reading terminals preserve the public history of the tour. |
| TB-10-SHELF-L1 | 10 | SHELF-L1 | P2 | -61 / 0 / 45 | 2.2 / 5 / 4.2 | Tall archive rack with luminous data volumes and metal shelf divisions. |
| TB-10-SHELF-L2 | 10 | SHELF-L2 | P2 | -61 / 0 / 52 | 2.2 / 5 / 4.2 | Tall archive rack with luminous data volumes and metal shelf divisions. |
| TB-10-SHELF-L3 | 10 | SHELF-L3 | P2 | -61 / 0 / 59 | 2.2 / 5 / 4.2 | Tall archive rack with luminous data volumes and metal shelf divisions. |
| TB-10-SHELF-R1 | 10 | SHELF-R1 | P2 | -47 / 0 / 45 | 2.2 / 5 / 4.2 | Tall archive rack with luminous data volumes and metal shelf divisions. |
| TB-10-SHELF-R2 | 10 | SHELF-R2 | P2 | -47 / 0 / 52 | 2.2 / 5 / 4.2 | Tall archive rack with luminous data volumes and metal shelf divisions. |
| TB-10-SHELF-R3 | 10 | SHELF-R3 | P2 | -47 / 0 / 59 | 2.2 / 5 / 4.2 | Tall archive rack with luminous data volumes and metal shelf divisions. |
| TB-10-READING | 10 | READING | P2 | -54 / 0 / 49 | 1.8 / 1.25 / 0.89 | Replaceable control terminal with sloped display and grounded pedestal. |
| TB-ROOM-11 | 11 | Engineering Core | P1 | 76 / -24 / 0 | 32.5 / 18.6 / 32.5 | Separat rum med golv, tak, slutna väggar och markerad passage. |
| TB-DOOR-11 | 11 | Passage / lift | P2 | 91.65 / -24 / 0 | 0.23 / 4.3 / 3.28 | Stängd markerad passage; scenövergång representerar färden mellan däck. |
| TB-FIT-11 | 11 | ENGINEERING CORE | P2 | 76 / -24 / 0 | 30.4 / 18 / 29.3 | A shielded reactor, service ring and control consoles power the carrier. |
| TB-11-REACTOR | 11 | REACTOR | P2 | 76 / -24 / -3 | 10 / 12 / 10 | Shielded reactor silhouette, service ring and vertical conduits; no interactive controls. |
| TB-11-CONTROL | 11 | CONTROL | P2 | 68 / -24 / 5 | 1.8 / 1.25 / 0.89 | Replaceable control terminal with sloped display and grounded pedestal. |
| TB-ROOM-12 | 12 | Cargo & Storage | P1 | 28 / -12 / 52 | 20.5 / 9.6 / 24.5 | Separat rum med golv, tak, slutna väggar och markerad passage. |
| TB-DOOR-12 | 12 | Passage / lift | P2 | 37.65 / -12 / 52 | 0.23 / 4.3 / 3.28 | Stängd markerad passage; scenövergång representerar färden mellan däck. |
| TB-FIT-12 | 12 | CARGO & STORAGE | P2 | 28 / -12 / 52 | 18.4 / 9 / 21.3 | Container racks and loading lanes connect the workshop to the shuttle bay. |
| TB-12-RACK-L1 | 12 | RACK-L1 | P2 | 22 / -12 / 45 | 4 / 4.8 / 4 | Stackable freight containers on a reusable two-level loading rack. |
| TB-12-RACK-L2 | 12 | RACK-L2 | P2 | 22 / -12 / 52 | 4 / 4.8 / 4 | Stackable freight containers on a reusable two-level loading rack. |
| TB-12-RACK-L3 | 12 | RACK-L3 | P2 | 22 / -12 / 59 | 4 / 4.8 / 4 | Stackable freight containers on a reusable two-level loading rack. |
| TB-12-RACK-R1 | 12 | RACK-R1 | P2 | 34 / -12 / 45 | 4 / 4.8 / 4 | Stackable freight containers on a reusable two-level loading rack. |
| TB-12-RACK-R2 | 12 | RACK-R2 | P2 | 34 / -12 / 52 | 4 / 4.8 / 4 | Stackable freight containers on a reusable two-level loading rack. |
| TB-12-RACK-R3 | 12 | RACK-R3 | P2 | 34 / -12 / 59 | 4 / 4.8 / 4 | Stackable freight containers on a reusable two-level loading rack. |
| TB-ROOM-13 | 13 | Docking Ports / Shuttle Bay | P1 | 62 / -24 / 52 | 36.5 / 18.6 / 30.5 | Separat rum med golv, tak, slutna väggar och markerad passage. |
| TB-DOOR-13 | 13 | Passage / lift | P2 | 79.65 / -24 / 52 | 0.23 / 4.3 / 3.28 | Stängd markerad passage; scenövergång representerar färden mellan däck. |
| TB-FIT-13 | 13 | SHUTTLE BAY | P2 | 62 / -24 / 52 | 34.4 / 18 / 27.8 | Two shuttle berths, a freight apron and a sealed outer docking gate. |
| TB-13-BERTH-L | 13 | BERTH-L | P2 | 53 / -24 / 49 | 10 / 2.2 / 14 | Shuttle footprint and docking support, ready for a shared transport model. |
| TB-13-BERTH-R | 13 | BERTH-R | P2 | 71 / -24 / 49 | 10 / 2.2 / 14 | Shuttle footprint and docking support, ready for a shared transport model. |
| TB-13-DOCK-CONTROL | 13 | DOCK-CONTROL | P2 | 62 / -24 / 59 | 1.8 / 1.25 / 0.89 | Replaceable control terminal with sloped display and grounded pedestal. |
| TB-ROOM-14 | 14 | Security Nexus | P1 | 42 / -12 / 0 | 20.5 / 9.6 / 24.5 | Separat rum med golv, tak, slutna väggar och markerad passage. |
| TB-DOOR-14 | 14 | Passage / lift | P2 | 51.65 / -12 / 0 | 0.23 / 4.3 / 3.28 | Stängd markerad passage; scenövergång representerar färden mellan däck. |
| TB-FIT-14 | 14 | SECURITY NEXUS | P2 | 42 / -12 / 0 | 18.4 / 9 / 21.66 | A screening threshold and watch desk control access to engineering. |
| TB-14-WATCH | 14 | WATCH | P2 | 37 / -12 / -4 | 1.8 / 1.25 / 0.89 | Replaceable control terminal with sloped display and grounded pedestal. |
| TB-14-WAITING | 14 | WAITING | P2 | 47 / -12 / 5 | 3 / 1.15 / 1.03 | Replaceable modular bench, with seat and back at human scale. |
| TB-ROOM-15 | 15 | VIP Gallery / Race Museum | P1 | -60 / 24 / -32 | 22.5 / 10.6 / 20.5 | Separat rum med golv, tak, slutna väggar och markerad passage. |
| TB-DOOR-15 | 15 | Passage / lift | P2 | -49.35 / 24 / -32 | 0.23 / 4.3 / 3.28 | Stängd markerad passage; scenövergång representerar färden mellan däck. |
| TB-FIT-15 | 15 | VIP GALLERY / RACE MUSEUM | P2 | -60 / 24 / -32 | 20.4 / 10 / 17.3 | Exhibition plinths and gallery seating celebrate the championship. |
| TB-15-DISPLAY-1 | 15 | DISPLAY-1 | P2 | -66 / 24 / -36 | 3.2 / 2.28 / 3.2 | Exhibition pedestal and trophy silhouette; display content remains to be authored. |
| TB-15-DISPLAY-2 | 15 | DISPLAY-2 | P2 | -60 / 24 / -36 | 3.2 / 2.28 / 3.2 | Exhibition pedestal and trophy silhouette; display content remains to be authored. |
| TB-15-DISPLAY-3 | 15 | DISPLAY-3 | P2 | -54 / 24 / -36 | 3.2 / 2.28 / 3.2 | Exhibition pedestal and trophy silhouette; display content remains to be authored. |
| TB-15-GALLERY | 15 | GALLERY | P2 | -65 / 24 / -27 | 3 / 1.15 / 1.02 | Replaceable modular bench, with seat and back at human scale. |
| TB-ROOM-16 | 16 | Restricted | P1 | 0 / -36 / 60 | 18.5 / 8.6 / 16.5 | Separat rum med golv, tak, slutna väggar och markerad passage. |
| TB-DOOR-16 | 16 | Passage / lift | P2 | 8.65 / -36 / 60 | 0.23 / 4.3 / 3.28 | Stängd markerad passage; scenövergång representerar färden mellan däck. |
| TB-HANGAR-ENDS | 01 | Hangarens slutväggar | P1 | 0 / 0 / 0 | 46 / 21 / 66.1 | Slutna hangarväggar ersätter den tidigare stora observationsöppningen. |

## Övriga scenkomponenter

Rumsavgränsade punktljus, ett riktat ljus och hemisfäriskt grundljus är scenbelysning, inte GLB-objekt. Kamera, klicketiketter och navigation hör till gränssnittet. Hologramsfären ingår i TB-NEXUS-01; stjärnpunkterna i TB-STARS-01. Golvets linjer ingår i TB-DECK-01. Dessa grupper täcker alla statiska ritade objekt. Spelarens racer klonas med egna material; originalets geometri delas och får inte raderas vid modellbyte.

## Nästa modellleverans

Lägg gärna utvalda kandidater i public/models/tour-bus/incoming med beskrivande namn, exempelvis crane.glb, chair.glb och console.glb. Den mappen behöver inte innehålla hela din osorterade samling. Inga nya tunga modeller laddas automatiskt i denna version. För varje kandidat: notera källa, licens, filstorlek, trianglar, texturupplösning, avsedd TB-grupp och om den behöver förenklas.

Objektlistan genereras med node tools/document-tour-bus.mjs. Ändra malltexten där om dokumentet ska regenereras. Kamera och objektsgrupper finns i src/tour-bus.js; interaktioner och profilkoppling i src/tour-bus-ui.js.
