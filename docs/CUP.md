# Foundry Cup

E1 / CUP-001, 2026-10-29.

Välj **Foundry Cup · 3 races** under EVENT och starta som vanligt.

1. Neon Causeway (track1)
2. TEST · Split Decision (track13, branchbanan)
3. Ion Foundry (track15)

Varje lopp är tre varv med samma fem förare. Cupen använder alltid inbyggda
bandefinitioner; lokala editorändringar gäller fortfarande vanliga Race och
Time Attack. CPU-nivå, handling, assist och Combat låses när cupen startas.
Kamera och ljud kan fortfarande ändras. Inga fysik-/announcerändringar ingår.

## Poäng och medaljer

Placering 1–5 ger 10, 7, 5, 3 respektive 1 poäng. DNF ger 0 poäng. Resultat
fastställs när alla gått i mål, eller efter 60 sekunders speltid från spelarens
målgång. Då markeras kvarvarande förare DNF och ordnas efter körd distans.
Finish-tider används för färdiga förare; exakt tidslikhet avgörs av fast startordning.

Totalpoäng avgör cupen. Vid lika poäng: flest förstaplatser, sedan andraplatser
osv, sedan senaste loppets placering. Fast startordning är sista skiljeregel.
Slutplacering 1/2/3 ger guld/silver/brons; övriga får CUP COMPLETE.
Bästa slutplacering sparas separat per CPU-nivå, handling, assist och Combat.

Resultatskärmen visar aktuell loppstid, cupställning, sista loppets finish/DNF,
nya poäng och totalpoäng. NEXT RACE fortsätter. Efter tre lopp visas slutmedaljen
 och NEW CUP börjar om. MENU går tillbaka utan att radera cupen.

## Spara och fortsätta

Cupen sparas i localStorage, nyckeln `swipeout.cup.v1`, med formatversion 1 och
cupdefinition `foundry-v1`. En startad runda kan återupptas efter omladdning genom
att välja Cup/start. Den aktuella rundan körs då från början; redan fastställda
rundor behåller sina poäng. Ingen mitt-i-loppet-sparning.

Resultatet för en runda registreras bara en gång. Knapparna är låsta medan fältet
kör i mål. Omladdning under väntan startar om den ännu ej fastställda rundan.
NEW CUP · RESET CURRENT RUN nollställer pågående cup, men behåller bästa resultaten.
Trasig/okänd lagringsversion ignoreras med meddelande. Vid skrivfel fortsätter
cupen i minnet och UI varnar att progressionen endast gäller denna session.

## Omfattning och verifiering

Detta är E1: cup, slutplaceringsmedaljer och sparad progression. Tidsmedaljer,
lackeringar, skeppsupplåsningar och uppgraderingar återstår i roadmapen. Time Attack
är fortsatt separat och dess rekordformat/fysik är oförändrat. Cupen annonseras
med de redan accepterade race/resultatrösterna; inga nya announcerregler.

107 Node-tester passerar. Cup-tester täcker scoring, dubbla resultat, resume,
låsta inställningar, DNF, skiljeregler, medaljer, korrupt data och lagringsfel.
Produktion bygger med befintlig varning för stora chunks.

Browser kör hela treloppsflödet med kontrollerade målgångsfixturer, DNF-timeout,
reload mellan lopp och under avbruten runda, nästa bana, slutmedalj, sparat bästa
resultat och isolering från Race/Time Attack. Desktop/568x320-resultat granskade.
Detta är inte en mänsklig provkörning av tre fulla lopp eller fysisk mobilmätning.

Kör `node --test tests/*.test.js`, `npm run build`, och
`node tools/verify-cup.mjs` (Chrome/Playwright, valfri PLAYWRIGHT_MODULE).
