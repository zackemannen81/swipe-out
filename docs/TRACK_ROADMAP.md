# Utvecklingsplan: banor, editor och strid

Godkänd riktning: 2026-10-26. Aktiv uppgift: [CURRENT_TASK.md](CURRENT_TASK.md).
Detta är vår checklista för successiva leveranser. En etapp är klar först när
dess kontroller är verifierade. Körkänsla, CPU-profiler och thrusters bevaras.

| Etapp | Mål | Status |
| --- | --- | --- |
| 1 | Versionsmärkt banformat och import/export | Klar — TRACK-001 (2026-10-26) |
| 2 | Första användbara 3D-editorn | Klar — TRACK-001 (2026-10-26) |
| 3 | Gaps med avstamp, luftfärd och landning | Implementerad — TRACK-002, redo för provkörning |
| 4 | Dosering, twists och loopar | Implementerad — TRACK-002, komforttest återstår |
| 5 | Alternativa vägar och shortcuts | Planerad |
| 6 | Valbart vapensystem | Planerad |

## 1. Banformat och import/export

- [x] Versionsmärkt JSON med läsbar validering och stöd för tidigare exporter.
- [x] Importera som egen bana utan att skriva över befintligt arbete.
- [x] Export → import → spara → välj i spelet → kör samma bana.
- [x] Behåll namn, geometri, höjder, bredd, skala och scenery inklusive texturer.
- [x] Felaktig fil eller okänd framtida version lämnar arbetet orört.
- [x] Gemensam laddning för editor och spel; gamla sparade banor fungerar.

## 2. Första användbara 3D-editorn

- [x] Visa samma bangeometri som i spelet med orbit, panorering och zoom.
- [x] Välj och flytta kontrollpunkter i 3D; redigera höjd och banbredd.
- [x] Lägg till/ta bort punkter och behåll stöd för scenery.
- [x] Ångra/gör om ändringar och spara/provkör med ett tydligt arbetsflöde.
- [x] Kontrollera export/import och provkörning genom editorns faktiska UI.

Editorn har nu gapmarkeringar, bank/roll och sidovy. Vägförgreningar och
vapenpickups läggs till när respektive spelfunktion finns. Checkpointbaserad
sektionsprovning och avancerade sceneryverktyg är senare förbättringar;
Save & Test provkör ett normalt lopp från start.

## 3. Gaps

- [x] En testbana med ett tydligt, läsbart hopp och generös landningsyta.
- [x] Vägytan upphör på riktigt: avstamp med aktuell fart/riktning, friflygning,
      begränsad luftstyrning och landningskontakt.
- [x] Missat hopp ger snabb och begriplig återställning vid säker checkpoint.
- [x] Spelare och samtliga CPU:er använder samma fysik och kan klara hoppet.
- [x] Testa låg/hög fart, sidoförskjutning, kollision, paus och omstart.

Provkör **TEST · Gap Run** (`track11`). Orange avstamp, gröna landningsmarkeringar.
Fart och riktning vid avstamp avgör om hoppet lyckas. Balansen finjusteras efter
mänsklig provkörning; verifierade tekniktester finns i CURRENT_STATUS.

## 4. Dosering → twists → loopar

- [x] Gemensam stabil banorientering för väg, skepp, banräcken/markörer, AI och kamera.
- [x] Magnetisk vidhäftning på sammanhängande väg; friflygning över gaps.
- [x] Prova doserad kurva, inversion, barrel-roll och vertikal loop.
- [x] Kamera och styrning fungerar kontinuerligt utan plötsliga vändningar.
- [x] Samma beteende för spelare/CPU; testa skarvar, boost och varierande bildfrekvens.
- [ ] Mänsklig kontroll av läsbarhet och komfort, särskilt på mobil.

Provkör **TEST · Loop & Roll** (`track12`). Egna sceneryobjekt behåller sina
redigerbara världskoordinater. De tio ursprungliga banornas fysik ändras inte.

## 5. Alternativa vägar / shortcuts

- [ ] Bansektioner kan dela sig och återförenas; en första testbana med ett vägval.
- [ ] Kortare väg kräver mer skicklighet; längre väg är tryggare.
- [ ] Gemensamma checkpoints ger rättvis placering, varv, mål och catch-up
      trots olika faktisk färdsträcka. Ingen vinst genom att hoppa över checkpoints.
- [ ] CPU väljer och kör båda vägarna; minimap och återställning följer vägvalet.
- [ ] Editorn visar och redigerar anslutningarna.

## 6. Vapensystem

- [ ] Strid kan slås av/på; börja med en framåtriktad raket.
- [ ] Tydlig projektil, träff, knuff och kort fartförlust för både spelare och CPU.
- [ ] Begränsad ammunition/eldtakt och skydd mot upprepad låsning i träffreaktion.
- [ ] Testa undanmanöver, kollision, paus, omstart och loppets slut.
- [ ] Därefter prova målsökande missil med låstid, siktkrav och målvarning.
- [ ] Utvärdera minigun sist utifrån spelkänsla, läsbarhet och mobilprestanda.

## Leveransregler

- En liten spelbar testbana per ny mekanik före bred innehållsproduktion.
- Dokumentera faktisk verifiering i CURRENT_STATUS; skilj kodtester från
  visuell kontroll, spelbalans och mätning på fysisk telefon.
- Uppdatera denna checklista efter varje etapp. Nya idéer får egna öppna punkter.
- Nästa planerade mekanik efter TRACK-002 är alternativa vägar. Ta först in
  återkoppling från gap-/loop-provkörningen och justera körkänsla/komfort.
