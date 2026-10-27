# Från racingprototyp till färdig spelupplevelse

Godkänd riktning 2026-10-27. Genomför stegvis och verifiera varje spelbar etapp.
Fysisk telefonmätning får inte ersättas av en emulerad skärmstorlek.

1. **Körkänsla — godkänd av användaren.** Wipeout och låg assist ger tillräcklig
   skicklighet/träning. Behåll detta som baslinje.
2. **Time Attack — implementerad, TT-001.** Personbästa, sektorer och tidsdifferens med tecken,
   ett riktigt inspelat ghost, rekommenderad snabb körlinje och kurvvarningar.
   Solokörning utan strid/catch-up, separata rekord per körförutsättning.
   68 tester och webbläsarflödet passerar. [Guiden](TIME_ATTACK.md) beskriver
   användning och gränser; körlinjens balans och fysisk telefon behöver provköras.
3. **CPU-svårighetsgrader — planerad.** Rookie/Pilot/Elite med bromspunkter,
   precision, omkörningar, genvägsval och olika riskvilja. Kostsamma men begripliga
   misstag; mindre catch-up på Elite. Ingen ändring av accepterad spelarstyrning.
4. **Cup och progression — planerad.** Tre genomarbetade banor, poäng och slutlig
   placering, medaljer för tid/placering och upplåsbara lackeringar. Beständiga
   resultat och tydlig fortsättning mellan loppen.
5. **Ljud och återkoppling — planerad.** Motorbelastning, luftbromsar, boost,
   räckesskrap, landning, sista varvet, personbästa och inkommande missil.
   Samlad resultatskärm med bästa varv, förbättring och cup-poäng.
6. **Presentation och prestanda — planerad.** Banbilder/svårighet/rekord,
   begripliga skeppsegenskaper, sparade ljud/kamera/assistval, separat testkategori,
   grafiknivåer, kameraskakning/bloom och mätning på fysisk telefon.

Detaljerade acceptanskriterier hör till respektive CURRENT_TASK. Färdiga delar
och verifieringsbegränsningar redovisas i CURRENT_STATUS; listan är inte ett
påstående att senare etapper redan är implementerade.
