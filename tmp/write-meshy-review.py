from pathlib import Path
import json,csv,shutil
p=Path('docs/MESHY_LIBRARY_INVENTORY.json');d=json.loads(p.read_text(encoding='utf8')); review=json.loads(Path('tmp/meshy-shortlist-review.json').read_text(encoding='utf8'));by={r['file']:r for r in d['entries']};seen=set();extra=0
for r in d['entries']:
 if r['sha256'] in seen:extra+=r['bytes']
 seen.add(r['sha256'])
labels=[('Inomhusträd','Observation: bra kandidat, krukan ingår'),('Buske','Planteringar: bra kandidat; mörka blad behöver ljusbedömning'),('Fern 3D','Stiliserad och mycket tät; föredra tidigare ormbunke efter optimering'),('Skjutdörr','Gemensamt rumskit: lämplig kandidat'),('Panelkit','16 paneler i en sammanhängande modell; behöver delas för modulärt bruk'),('Lastplattform / cargo pod','Cargo/verkstad: behöver förenklas'),('Kontrollkonsol','Ser ut som befintlig importerad konsol; behåll befintlig lättare version'),('Reaktorkärna','Engineering: mycket tät och blek i grundrendering; behöver optimering/materialpass'),('Lastpall / flatbed','Cargo: behöver förenklas'),('Kaveldunsplantering','Dekorativ kandidat; 1,76 miljoner trianglar behöver förenklas kraftigt'),('Bio-växt texturerad','Vitrum-dekoration; alternativ grönska, utpräglad alienstil'),('Bio-växt (1)','Nästan samma geometri som föregående men utan synlig textur; inte en enklare mesh')]
text=f'''# Meshy-samlingen — granskning 11 november 2026

{d['files']} GLB-filer, {d['bytes']/1e9:.2f} GB. {d['unique']} unika SHA-256-innehåll.
{d['duplicateCopies']} extra byte-identiska kopior, totalt {extra/1e9:.2f} GB. Inga original flyttade, raderade eller ändrade.
Alla filer klarade strukturell GLB-header-/JSON-kontroll och har inga identifierade
externa resurser eller avkodarkrav som den befintliga laddaren avvisar. Detta är
inte en full visuell validering av 331 modeller. Tolv kandidater renderades separat.

## Visuellt granskade kandidater

| # | Typ | Trianglar | MB | Bedömning |
| --- | --- | ---: | ---: | --- |
'''
for i,(r,(label,note)) in enumerate(zip(review,labels)):
 a=by[r['file']];text+=f"| {i} | {label} | {a['triangles']:,} | {a['bytes']/1e6:.2f} | {note} |\n"
text+='''
## Rekommenderad arbetsordning

1. Inomhusträdet och busken kan täcka delar av observationsdäckets kvarvarande behov.
2. Skjutdörr och panelkit blir kandidater till fartygets gemensamma inredningskit.
3. Lastpall, lastplattform och reaktor tas efter förenkling, när respektive rum får sitt visuella pass.
4. Återanvänd den redan importerade konsolen; importera inte den mycket tätare versionen.

Filer märkta `(1)` är inte automatiskt dubbletter eller optimerade: bio-växtparet
har samma triangelantal men olika texturinnehåll. Endast matchande SHA-256 räknas
som exakta dubbletter. Full lista i MESHY_LIBRARY_INVENTORY.json; CSV har en rad per fil.
Produktlänkar och licensunderlag behöver fortfarande följa kandidaterna; katalogen
utgår från lokala användarlevererade filer. Inget laddades ned eller importerades
i spelet i detta inventeringspass. Ingen build behövdes för katalogen.

## Filnyckel till bildöversikten
'''
for i,r in enumerate(review):text+=f"\n{i}. `{r['file']}`\n"
Path('docs/MESHY_LIBRARY_REVIEW.md').write_text(text,encoding='utf8')
folder=Path(d['root'])/'GRANSKNING';folder.mkdir(exist_ok=True)
shutil.copy2('docs/MESHY_LIBRARY_REVIEW.md',folder/'LAS_MIG.md');shutil.copy2(p,folder/p.name);shutil.copy2('tmp/meshy-shortlist.jpg',folder/'kandidater.jpg')
with (folder/'modeller.csv').open('w',encoding='utf-8-sig',newline='') as f:
 writer=csv.writer(f);writer.writerow(['Fil','Bytes','Trianglar','Material','Bilder','SHA256','Formatkontroll'])
 for r in d['entries']:writer.writerow([r['file'],r['bytes'],r.get('triangles'),r.get('materials'),r.get('images'),r.get('sha256'),r.get('loaderCompatible')])
print(f"Catalogue: {folder}; exact duplicate bytes: {extra}")
