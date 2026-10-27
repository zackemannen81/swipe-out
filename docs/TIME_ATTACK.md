# Time Attack — rekord, ghost och körhjälp

Välj **EVENT → Time Attack · solo** på startskärmen. Välj styrning/assist som
vanligt. Kör ett **OUT LAP** för att lära dig banan och få upp farten, sedan tre
tidtagna flygande varv. Loppet slutar efter det tredje försöket. Via pausmenyns
**END TIME ATTACK** kan du avsluta tidigare; redan avslutade giltiga rekordvarv
behålls. Ett påbörjat, oavslutat varv blir aldrig ett rekord.

CPU:er körs inte, visas inte och kolliderar inte i detta läge. Strid och catch-up
är avstängda även om Combat var ikryssat före lägesbytet. Fysik, styrning, boost
pads, väggar och hopp använder spelets befintliga regler. Vanligt Race behåller
CPU:er och valbar strid.

## Tidtagning och rekord

- Tiden börjar vid startlinjen efter uppvärmningsvarvet. Sektorer slutar vid
  33 %, 66 % och startlinjen; de använder samma banprogress på båda vägvalen.
- Tidpunkterna interpoleras mellan fysikuppdateringar. Meny, nedräkning och
  paus räknas inte som varvtid. Spelets simuleringstid används, liksom i Race.
- HUD visar aktuell varvtid, personbästa och skillnad mot PB vid samma progress.
  **−0,24 s** betyder 0,24 sekunder före ghostets tid. Sektormeddelandet jämför
  sammanlagd tid till sektorns slut. S1/S2/S3-raden visar enskilda sektortider.
- En återställning efter missat hopp ogiltigförklarar varvet. Kör vidare till
  nästa varv för ett nytt försök. Räckeskontakt är tillåten och kostar tid genom
  ordinarie fysik. Missad validering av målgate, diskontinuerlig progress eller
  varv över tio minuter får inte bli rekord.
- Ett bättre giltigt varv sparas direkt. Ett långsammare/ogiltigt varv ersätter
  inte PB. Resultaten visar varje varv och dess sektorer, giltighet, personbästa
  och bästa varvet i sessionen jämfört med PB före sessionen.

Rekord lagras lokalt i denna webbläsare. Nyckeln inkluderar hela banans revision,
skepps-ID, hastighetsklass, toppfart, styrmodell, effektiv assist och fysikversion.
Det finns för närvarande ett spelarskepp (**Racer**) och en hastighetsklass
(**Standard**); nycklarna är förberedda för framtida val. Wipeout har samma manuella
rekordkategori oavsett det inaktiva assistreglaget. Kameraval och visningshjälp
delar rekordkategori eftersom de inte ändrar fysiken. Ändrad banfil ger en ny
kategori, även när ändringen är dekorativ. Ingen rekorddelning mellan enheter.

Skadade rekord ignoreras med meddelande. Om lagringen är full/blockerad fungerar
körningen fortfarande och nytt PB finns kvar i sessionens minne med en tydlig
varning. Ingen gammal lagrad post raderas för att göra plats. Upp till åtta
rekordkategorier hålls i minnets återförsökscache; en omladdning tappar osparade
rekord. Radering av webbläsarens webbplatsdata raderar sparade rekord.

## Ett riktigt ghost

PB-spöket är en transparent kopia av spelarskeppet. Position och quaternion
spelas in i världsrummet vid 20 Hz, med exakta sektor-/varvgränser, och interpoleras
under uppspelning. Det följer den verkliga körningen, inklusive genväg, glidning,
loopar och hopp. Det kan inte kollidera, skjuta eller påverka boost pads.

Ghostet startar samtidigt med varje flygande varv och använder PB som fanns när
varvet började. Första giltiga rekordet kan alltså köras mot redan på nästa varv.
Det tonas ned vid överlappning med spelaren och döljs efter ghostets målgång.
**PB GHOST** kan stängas av före start. Boostens äldre korta eftersken är en
separat visuell effekt och har inget med rekorduppspelningen att göra.

## Rekommenderad körlinje och varningar

**RACING LINE** visar en smal linje framför skeppet, på banans lokala vägyta.
Den försöker minska kurvaturen inom en säker marginal från räcket, söka nåbara
boost pads och förbereda vägval. Förgreningar jämförs med uppskattad färdtid
utifrån längd/kurvor; en tillräckligt snabbare genväg rekommenderas. När du redan
valt väg följer linjen den vägen. Linjen ritas inte över gaps.

- **Cyan:** flyt/gas enligt riktfarten.
- **Bärnsten:** närmar dig riktfarten; förbered att släppa gas.
- **Rosa:** rekommenderad bromsning. Färgen omfattar även ansatsen till kurvan.

**CORNER WARNINGS** visar lokal vänster/höger, skarp kurva och bromsuppmaning
beroende på fart, med avstånd i samma meterskala som trippmätaren. Gaps får
prioritet som varning. Banans dosering/inversion används vid riktningsbedömningen.

Detta är en geometriskt beräknad rekommendation, inte en bevisat snabbaste linje
eller autopilot. Den modellerar inte hela styrfysiken, alla boostkedjor eller
förarens färdighet. Riktfart och bromsning behöver mänsklig provkörning, särskilt
på egna banor. På gaps är avstampets fart/riktning fortfarande spelarens ansvar.
De tre visningsvalen sparas och gäller Time Attack; de ändrar inte körningen.

## Kod och verifiering

- `src/time-attack.js`: timing, flygande varv, validering, lagring, rekordnycklar,
  ghostinterpolation och delta. Höj `TIME_ATTACK.physics` vid rekordbrytande
  fysik-/boost-/hastighetsändringar.
- `src/lap-ghost.js`: icke-kolliderande ghostvisning med delad skeppsgeometri.
- `src/racing-guide.js`: bananalys, linje, vägval, bromsansats och varningar.
  `GUIDE` innehåller analysens avstånd och accelerationsantaganden. Ett fast
  mesh med högst 64 segment återanvänds och uppdateras vid cirka 10 Hz.
- `src/time-attack-ui.js`: meny, HUD, resultat, cache och sessionens presentation.
- `tests/time-attack.test.js`: tidtagning vid 30/60/120 Hz, ogiltiga varv, lagring,
  nycklar, ghost, linje och komplett fysikkörning med förgreningar/hopp.
- `tools/verify-time-attack.mjs`: faktisk webbläsarstart/solo/paus, accelererad
  fysik med styrinputs, sparning/återladdning, guidebilder, resultat och byte till
  Race. Testhjälparna injiceras endast i testets nätverkssvar och distribueras inte.

Webbläsarens testförare är inte en mänsklig provkörning. Optimal linje, komfort,
ljudmix och prestanda på fysisk telefon är fortsatt öppna utvärderingar.
