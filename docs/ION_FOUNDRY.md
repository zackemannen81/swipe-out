# Ion Foundry — komplett bana (track15)

Öppna `/?track=track15` för race eller `/editor.html?track=track15` för att bygga
vidare. Banan är en orbital reaktoranläggning med metall, oxiderad koppar,
cyanbelysning och orange/rosa varningsmarkeringar. Musik: track_007; befintlig
stjärnbakgrund: backdrop_track-009.jpg.

## Ett varv

Huvudvägen är cirka **5 798 längdenheter**, med **22 enheters vägbredd**.
Tre varv tar ungefär 2:13–2:21 för CPU:erna i testet utan catch-up/strid.

1. **Reactor District:** startsträcka genom texturerade industribyggnader och
   skyltportaler. Bygg fart inför första hoppet.
2. **Coolant Leap:** cirka 101 enheters gap över ett djupt kylschakt. Håll gasen
   och sikta rakt mot landningen. Orange avstamp, gröna landningsmarkeringar.
3. **Reactor Bend:** stora doserade kurvor runt en reaktor, upp till cirka 30°
   avsedd dosering relativt den lokala horisonten.
4. **Needle Skyway:** välj **vänster före förgreningen** vid cirka 27 % av varvet.
   Genvägen är 8 bred och cirka 541 lång, jämfört med huvudvägens 749.
   Den stiger till 80 i höjd och återansluter vid cirka 40 %. Huvudvägen är
   bredare och går runt reaktorön. Vägvalet låses vid infarten.
5. **Switchback:** täta S-kurvor, växlande dosering och fallande höjd mellan
   maskinhallarna. Rosa ljus och skyltning markerar den tekniska sektionen.
6. **Coolant Leap II:** andra gapet, också cirka 101 långt. En lång rak
   landningssträcka ger utrymme även med boost innan den södra kurvan.
7. **Core Loop:** en vertikal loop med 70 i radie, upp till 160 i höjd, runt en
   reaktoraxel. Magnetisk väg håller skeppet kvar; kameran följer inversionen.
   Den förskjutna utgången ger separation från infarten. Därefter målrakan.

## Miljö och texturer

656 separata, redigerbara primitiver: byggnader, plattformar, reaktorer,
kylcylindrar, stöd, maskinhallar, loopkonstruktion, neonlister och skyltar.
Scenery är dekorativ som på övriga banor; banans räcken sköter väggkollisionerna.
Inget dekorationsgolv fyller igen gapen. Vapen kan träffa scenery enligt det
befintliga stridssystemet; strid är fortsatt avstängt som standard.

Originalen i `public/images/textures` är bevarade. Alla tolv har fått 512 × 512
WebP-kopior i `public/images/textures/optimized`: totalt 891 766 byte i stället
för 39 433 573 byte, cirka 97,7 % mindre. Fem nya skylttexturer är 1024 × 256.
Banan använder åtta av yttexturerna plus fem skyltar: totalt **683 454 byte**.

Kör `python tools/prepare-foundry-textures.py` med Pillow för att återskapa
kopiorna och skyltarna. Manifestet dokumenterar källformat, dimensioner och
filstorlekar. PNG-originalen laddas inte av denna bana.

Scenery delar fyra geometrier och 13 statiska texturer inom samma grupp.
Material återanvänds när inställningarna är identiska. Scrollande texturer får
egna instanser, så animationer inte påverkar andra objekt. Gruppbyte frigör
resurserna en gång; ingen global cache lever kvar mellan banorna.

## Ändra banan

Layout, namngivna sektorer och scenbygge finns i `src/track-foundry.js`.
Hjälpfunktionerna skapar vanlig v3-bandata; sparade editorändringar genereras
inte om. Alla objekt kan flyttas, klonas, tas bort och exporteras i editorn.
Flyttade banpunkter flyttar inte automatiskt scenery. Kontrollera gapens
procentsatser, väganslutningar och fri körbana efter layoutändringar.

Bankvärdena innehåller kompensation för den tredimensionella kurvans transporterade
orientering. Därför kan ett horisontellt parti ha ett banktal som inte är noll.
Använd 3D-vyn för att bedöma den faktiska doseringen.

Export behåller lokala WebP-sökvägar; de fungerar på samma spelinstallation.
För fristående delning till en annan installation måste motsvarande bildfiler
följa med, eller ersättas med inbäddade texturer via editorns uppladdning.

## Verifiering och kvarvarande provkörning

`tests/foundry.test.js` verifierar båda hoppen vid 30/120 Hz och 100/140/210
i fart, säker återställning vid för låg fart, tre spelarvarv på båda vägarna,
alla fyra CPU-profiler genom tre varv med boosts/kontakter och sex landningar,
format/export, filbudget, sampling av fri körbana och GPU-resursernas livscykel.

`tools/verify-foundry.mjs` kontrollerar laddade texturer, sektorer/cockpit/loop,
verklig renderloop för hoppen och genvägen, liggande skärm samt editor-export och
spara/ladda om. Samma Playwright-inställningar som övriga browserverktyg används;
skärmbilder hamnar normalt i temporära `swipe-out-track004`.

Mänsklig körkänsla, genvägens risk/vinst, loopkomfort och prestanda på fysisk
telefon återstår att bedöma. WebP minskar nedladdningen; delade texturer och
512-upplösningen minskar GPU-minnet. Filstorleken ensam bevisar inte bildfrekvens.
