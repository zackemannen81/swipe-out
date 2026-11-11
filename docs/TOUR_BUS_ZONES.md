# Tour Bus — zoner och assetbehov

## Plan och återanvändning

Implementerad 2026-11-10 från den levererade översiktsplanen och uppdragets
M1-avgränsning. Vänster = -X, övre delen = -Z. Planens proportioner används inte
som mått. Hangar och verkstad ligger på däck 3, Nexus/lounge på däck 4,
observation på däck 5. Övriga zoner följer kartan och dess däcklegend;
arkivet får marknadens angränsande däck 3 eftersom legenden inte anger arkivet.

- Hangar: befintliga dockor, tre fraktskyttlar, travers, gods och bärverk behålls.
- Verkstad: TB-PAD-01, TB-RACER-01 och TB-CONSOLE-01 flyttas söderut.
- Nexus: TB-NEXUS-01 flyttas till separat briefingrum väster om hangaren.
- Lounge: befintligt podium, fem stolar och fyra fanor flyttas nordväst.
- Observation: fönster, räcke, planet och måne flyttas längst västerut.
- Nya rumsskal använder enkel geometri; inga nya tunga modeller behövs.

## Kontrakt och navigation

`src/tour-bus-zones.js` är gemensamt register för 16 zoner, stationer och
ömsesidiga förbindelser. Varje zon har zoneId, name, deck, position,
connections, cameraStations, available, transit och requiredFlags.
Sedan 2026-11-11 är samtliga 15 offentliga zoner modellerade och besökbara.
Diplomacy Corridor har egen kameravy. Zon 16 har en sluten grundvolym och är låst.
Fem snabbknappar kompletteras av en rumslista; nya rum visar angränsande förbindelser.

UI-knappar använder samma go-funktion och ruttsökning. Varje övergång tonar
ned i 0,25 s, byter kamera endast under heltäckande mask, håller masken till
0,4 s och tonar upp till 0,7 s. Rutten visas under bytet. Ingen synlig kamera
flyger genom väggar. Reduced motion byter direkt. Panelen visas först när
övergången är klar; upprepade klick ignoreras under förflyttningen.
Escape, menyknapp och gamepad Back använder besökshistoriken; från hangarens
rotnivå återgår man till huvudmenyn. Hemloggan går direkt till huvudmenyn.
Inga ändringar av profilschema, banlagring, ljudmotor eller racefysik.

## Modell-, bild- och ljudlista

| Prioritet | Asset | Status / avsedd användning |
| --- | --- | --- |
| Krävs | Racer, repair-platform.glb | Finns; återanvänds i verkstad, inklusive vald lack |
| Krävs | outside-hangar.glb, hangar-port.glb, cargo-shuttle.glb | Finns; återanvänds i hangar |
| Krävs | Necros yta/moln/måne samt varm rymdbild | Finns i public/images/tour-bus; återanvänds i observation |
| Rekommenderas | Modulära rumspaneler och hiss-/dörrmodell | Ersätter TB-ROOM-* / TB-DOOR-*; fungerande geometri finns |
| Rekommenderas | console.glb, nexus.glb | Ersätter terminal och hologrambord, befintliga ID:n behålls |
| Rekommenderas | chair.glb, lounge-table.glb | Ersätter befintliga loungemöbler |
| Rekommenderas | crane.glb, panorama-frame.glb | Visuell förfining av kran/fönsterram |
| Senare | Kort hiss-/dörrljud | Inget nytt ljud krävs för navigation; kopplas senare till befintlig SFX-volym |
| Senare | Lågmäld Tour Bus-musik och rumsambienser | Behåll befintlig ljudhantering nu; nya loopar kräver separat mix/lyssningstest |
| Senare | PA-utrop och delegationsröster | Utanför denna rumsliga iteration |

Inga nya rasterbilder är nödvändiga för rumssepareringen: befintliga levererade
planetbilder återanvänds, väggar och skyltning använder geometri och UI-text.
Objektmått, zoner och modellbyten finns i TOUR_BUS_OBJECTS.md/.json och
regenereras med `node tools/document-tour-bus.mjs`.

## Avgränsning

Detta är funktionell rumsarkitektur med återanvänd art och enkla rumsskal,
inte färdig miljökonst. Alla offentliga rum har nu grundformer och möbelproxies.
Handel, vård och övriga nya rumstjänster är inte implementerade.
Fulla korridorer, NPC-system, planetbesök och nya cinematics ingår inte.
Fysisk mobilprestanda och lyssning kräver separat provspelning.

## M1-07 — session och racetur, 2026-11-10

Station och planet bevaras i sessionStorage per flik, separat från karriärprofilen.
Omladdning i navet återställer stationen; omladdning i Race Setup återgår till
briefing. Omladdning under lopp återgår till hangaren utan att återuppta eller
belöna loppet. Blockerad lagring innebär en fungerande session i minnet.

Lopp som startas via Nexus har RETURN TO TOUR BUS i resultatvyn och TOUR BUS
som mål i pausens avbryt-knapp. Återförsök behåller ursprunget. Resultat och
avbrott återgår till hangaren; vanlig Quick Race från huvudmenyn återgår som
förut till huvudmenyn. Escape/Back från busstartad Race Setup återgår till Nexus.
Hemloggan lämnar navflödet uttryckligen. Ingen förändring av countdown eller
belöningsvillkor; sessionsmarkören kan aldrig dela ut belöningar.

Kvar i M1: utvalda slutliga GLB för rum/terminal/Nexus/fönster samt bussens
musik, ambientutrop och zonmix. Dessa punkter är inte klarmarkerade av detta steg.

## Superseding audio integration
TOUR-AUDIO-001 now supplies zone music, first-visit crew presentations and archive
replay. See TOUR_BUS_AUDIO.md for copied media, coverage and missing recordings.
The earlier audio recommendations above describe the pre-integration state.

## Service Bay work view — 2026-11-10

OPEN GARAGE now opens the existing garage composition as a work view inside the
Service Bay. Carrier room navigation and crew archive remain visible. The heading
is SERVICE BAY / DECK 03 / YOUR WORKSHOP; the carrier context replaces Necros in
the header. Existing background, craft framing, paint and module controls remain.
Music and an active room presentation continue on the same media elements.

Platform ↔ garage uses a 160 ms fade-out and 180 ms fade-in. Reduced motion or
menu motion disabled switches directly. Back returns to the platform; a room
button leaves the work view and follows normal carrier navigation. Selecting
Service Bay itself returns to the platform. The standalone home-menu garage keeps
its original heading and return behavior. Reload restores the Service Bay station,
not an in-progress transition. Carrier work view reserves scrolling space above
the fixed room navigation, including mobile layouts.

Verification: 15 targeted tests, production build and isolated browser checks;
see CURRENT_STATUS for evidence and remaining physical-device limits.

## Gemensam insamling, 2026-11-11
Se TOUR_BUS_ASSET_LIST.md för prioriterad modell-/materiallista för hela fartyget.
De levererade röstpresentationerna 04 och 07–15 följer nu första besöket i rummet.
16/16B förblir reserverade. Endast aktuell zon och relevant belysning ritas.
