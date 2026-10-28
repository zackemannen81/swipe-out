# Announcer – skapa röstklipp

Kör från projektroten i PowerShell:

```powershell
# Alla 49 repliker
py tools/generate-announcer.py

# En kategori eller några utvalda repliker
py tools/generate-announcer.py --group combat
py tools/generate-announcer.py --only incoming_missile final_lap personal_best

# Visa katalog / kommandon utan att skapa ljud eller anropa TTS
py tools/generate-announcer.py --list
py tools/generate-announcer.py --group cup --dry-run

# Gör om ett klipp, exempelvis efter att du ändrat texten
py tools/generate-announcer.py --only weapon_acquired --force
```

Filer hamnar i `public/audio/announcer/<id>.wav`. Scriptet fungerar också från
annan arbetskatalog; standardvägarna utgår från scriptets plats. `--out` anger
annan utdatamapp. Befintliga filer hoppas över om du inte anger `--force`.
Ändrad text/röst upptäcks inte automatiskt: använd `--force` för de berörda ID:na.

## Röst och effekter

Standard: `en-HK-SamNeural`, pitch `256`, speed `0.55`, följt av exakt de två
SoX-kedjor användaren angav. Ändra med `--voice`, `--pitch`, `--speed`.
Pitch är SoX-cents, trots att gamla voice_creator.py:s hjälptext säger semitoner.
Effektkedjorna ligger tydligt som `FX1` och `FX2` i generate-announcer.py.

```powershell
py tools/generate-announcer.py --only weapon_acquired --voice en-HK-SamNeural --pitch 256 --speed 0.55 --force
```

Gain 16/gain 6 och overdrive är bevarade. SoX rapporterade klippade samples vid
provkörningen. Ingen extra normalisering har lagts till; lyssna på provfilen och
justera FX1/FX2 om du vill ha mindre distorsion. `bend` utan kurvpunkter är också
bevarad från receptet och accepterades av installerad SoX 14.4.2.

## Katalog

Redigera `tools/announcer-lines.json`: varje post har ett stabilt `id`, `text`
och `group`. Stavningen är **weapon_acquired**, inte det gamla weapon_accuired.

- `race`: 12 klipp för varv, placering, ledning och målgång.
- `combat`: 13 för pickups, ammo, låsning, missiler och flares.
- `time_attack`: 8 för rekord, sektorer, ghost och session.
- `warnings`: 7 för kurvor, hopp, bromszon och återställning.
- `cup`: 9 för framtida cup, medaljer och upplåsningar.

Det här är ett ljudbibliotek för nuvarande och möjliga framtida händelser, inte
ett påstående om att alla händelser är implementerade. Generatorn kopplar inte själv in klipp. Runtime-integrationen beskrivs nedan;
endast relevanta händelser används och vapenspecifik pickup ersätter generell pickup.
Nedräkningen genereras inte och dess accepterade filer lämnas orörda.

## Beroenden och felhantering

Samma Python-miljö som voice_creator.py behöver `edge-tts` och `pysndfx`:

```powershell
py -m pip install edge-tts pysndfx
```

FFmpeg och SoX måste finnas i PATH. `--sox` kan ange full sökväg till sox.exe.
TTS använder nätverkstjänsten via edge-tts; vald röst måste vara tillgänglig där.
Listning och dry-run kräver varken nätverk eller ljudberoendena.

Varje klipp kör gamla voice_creator.py i en egen temporär arbetsmapp. Dess
output.wav/temp.mp3/temp.wav kan därför inte krocka med dina tidigare filer.
Först efter lyckade steg och kontroll av PCM-WAV ersätts målfilen. Vid fel
behålls tidigare målfil, övriga klipp fortsätter, och scriptet avslutar med felkod
samt en lista över ID:n att försöka igen. Varje process har 180 s timeout.

## Verifierat

Sex offline-tester: katalog/urval, felaktiga ID:n, dry-run utan skrivning,
överhoppning, bevarad originalfil vid misslyckad --force samt giltig publicerad WAV.
Kör `py tools/test-announcer.py`.

Ett riktigt end-to-end-prov skapade `weapon_acquired.wav` (cirka 2,60 s) via
befintlig voice_creator.py, nätverks-TTS, FFmpeg och båda SoX-stegen. Användaren genererade och godkände klippen. Vid integration fanns 37 i spelmappen;
de 12 saknade kompletterades med samma recept. Alla 49 finns nu. De kompletterade
klippen och den samlade mixen återstår att provlyssna i spelet.


## Runtime — AUDIO-002, 2026-10-29

ANNOUNCER-reglaget finns i start- och pausmenyn: 0–100 %, standard 35 %. Valet
sparas i localStorage (`swipeout.announcer.volume.v1`); vid lagringsfel behålls
sessionsvalet och ett meddelande visas. 0 tystar rösterna. Musik och SFX påverkas
inte. Samma gain gäller nya klipp och de befintliga countdown-filerna, med tidigare
0.6 som grundförstärkning. Countdown-timing, triggerkod och filer är oförändrade.

Aktiva händelser:
- Vapenupplockning (vapenspecifik replik), tom ammunition och färdigt target lock.
- Enemy lock, inkommande missil, flares deployed/ready och avledd missil.
- Sista varvet i Race och Time Attack.
- Time Attack: personbästa, förbättrad sektor och ogiltigt färdigkört varv.
- Race complete följt av placering; Time Attack session complete och eventuellt
  personbästa från sista varvet.

`src/announcer.js` definierar prioritet, minsta upprepningsintervall och livslängd.
Kön rymmer högst fyra meddelanden. Bara inkommande missil avbryter en pågående
lägre prioriterad röst. Expirerade meddelanden spelas aldrig, även om nedladdningen
blir sen. Nedräkning går direkt via sin gamla trigger och blockerar den vanliga
röstkön medan klippet spelar. Tal laddas separat utan att fördröja SFX-laddningen.

Paus avbryter den pågående announcer-repliken och tömmer kön så att gamla varningar
inte återkommer vid resume. Nedräkningens befintliga pausförfarande är oförändrat.
Retry, meny och musikbyte rensar announcern. Finish rensar stridsmeddelanden före
resultatreplikerna. Saknade ljud ger en varning och hoppas över utan att stoppa spel.
Cup/upplåsningar, kurvvarningar, checkpoint/ledning och alternativa rekordfraser
finns som tillgångar men har ännu inga nya rösttriggers.

Verifiering: 102 Node-tester passerar och produktion bygger (befintlig chunk-varning).
Browser kontrollerar sparad volym/reload, avkodade klipp, nedräkningens fyra anrop,
missilprioritet, paus/mute, retry och Time Attack-avslut utan page errors.
Kör `node tools/verify-announcer.mjs` med Chrome/Playwright. Hörlurs-/högtalarmix
samt verklig mobil återstår att provspela; testet bedömer inte upplevd ljudkvalitet.
