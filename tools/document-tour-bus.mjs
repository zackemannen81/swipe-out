import {writeFileSync} from 'node:fs';
import {createTourBusScene} from '../src/tour-bus.js';
const hub=createTourBusScene(),rows=hub.manifest();
writeFileSync('docs/TOUR_BUS_OBJECTS.json',JSON.stringify(rows,null,2)+'\n');
let doc=`# Turnébussen – objektlista för modellbyte

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
`;
for(const r of rows)doc+=`| ${r.id} | ${r.zoneId} | ${r.label} | ${r.priority} | ${r.position.join(' / ')} | ${r.size.join(' / ')} | ${r.description} |\n`;
doc+=`
## Övriga scenkomponenter

Rumsavgränsade punktljus, ett riktat ljus och hemisfäriskt grundljus är scenbelysning, inte GLB-objekt. Kamera, klicketiketter och navigation hör till gränssnittet. Hologramsfären ingår i TB-NEXUS-01; stjärnpunkterna i TB-STARS-01. Golvets linjer ingår i TB-DECK-01. Dessa grupper täcker alla statiska ritade objekt. Spelarens racer klonas med egna material; originalets geometri delas och får inte raderas vid modellbyte.

## Nästa modellleverans

Lägg gärna utvalda kandidater i public/models/tour-bus/incoming med beskrivande namn, exempelvis crane.glb, chair.glb och console.glb. Den mappen behöver inte innehålla hela din osorterade samling. Inga nya tunga modeller laddas automatiskt i denna version. För varje kandidat: notera källa, licens, filstorlek, trianglar, texturupplösning, avsedd TB-grupp och om den behöver förenklas.

Objektlistan genereras med node tools/document-tour-bus.mjs. Ändra malltexten där om dokumentet ska regenereras. Kamera och objektsgrupper finns i src/tour-bus.js; interaktioner och profilkoppling i src/tour-bus-ui.js.
`;
writeFileSync('docs/TOUR_BUS_OBJECTS.md',doc);hub.dispose();console.log(rows.length+' documented asset groups');
