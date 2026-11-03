import {writeFileSync} from 'node:fs';
import {createTourBusScene} from '../src/tour-bus.js';
const hub=createTourBusScene(),rows=hub.manifest();
writeFileSync('docs/TOUR_BUS_OBJECTS.json',JSON.stringify(rows,null,2)+'\n');
let doc=`# Turnébussen – objektlista för modellbyte

Första byggversionen, 3 november 2026. Detta dokument beskriver vad varje namngiven grupp i 3D-prototypen ska föreställa. Alla objekt är enkla platshållare utom spelarens befintliga racerskepp. JSON-filen bredvid innehåller exakta koordinater, rotationer och utbredning för modellmatchning.

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
`;
for(const r of rows)doc+=`| ${r.id} | ${r.label} | ${r.priority} | ${r.position.join(' / ')} | ${r.size.join(' / ')} | ${r.description} |\n`;
doc+=`
## Övriga scenkomponenter

Fyra punktljus, ett riktat ljus och hemisfäriskt grundljus är scenbelysning, inte GLB-objekt. Kamera, klicketiketter och navigation hör till gränssnittet. Hologramsfären ingår i TB-NEXUS-01; stjärnpunkterna i TB-STARS-01. Golvets linjer ingår i TB-DECK-01. Dessa grupper täcker alla statiska ritade objekt. Spelarens racer klonas med egna material; originalets geometri delas och får inte raderas vid modellbyte.

## Nästa modellleverans

Lägg gärna utvalda kandidater i public/models/tour-bus/incoming med beskrivande namn, exempelvis crane.glb, chair.glb och console.glb. Den mappen behöver inte innehålla hela din osorterade samling. Inga nya tunga modeller laddas automatiskt i denna version. För varje kandidat: notera källa, licens, filstorlek, trianglar, texturupplösning, avsedd TB-grupp och om den behöver förenklas.

Objektlistan genereras med node tools/document-tour-bus.mjs. Ändra malltexten där om dokumentet ska regenereras. Kamera och objektsgrupper finns i src/tour-bus.js; interaktioner och profilkoppling i src/tour-bus-ui.js.
`;
writeFileSync('docs/TOUR_BUS_OBJECTS.md',doc);hub.dispose();console.log(rows.length+' documented asset groups');
