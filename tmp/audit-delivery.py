from pathlib import Path
import json,struct,zipfile,hashlib
from PIL import Image,ImageDraw
root=Path('C:/Users/zakri/Desktop/tourbus/assets'); rows=[]; previews=[]
for p in root.rglob('*.glb'):
 b=p.read_bytes(); n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);tri=0
 for m in g.get('meshes',[]):
  for q in m['primitives']:
   if q.get('mode',4)==4:tri+=g['accessors'][q.get('indices',q['attributes']['POSITION'])]['count']//3
 row={'file':str(p.relative_to(root)),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'triangles':tri,'materials':len(g.get('materials',[])),'images':len(g.get('images',[])),'requiredExtensions':g.get('extensionsRequired',[]),'externalUris':[a['uri'] for a in g.get('images',[])+g.get('buffers',[]) if a.get('uri') and not a['uri'].startswith('data:')]};rows.append(row)
for p in root.glob('*.zip'):
 with zipfile.ZipFile(p) as z:
  names=z.namelist();rows.append({'file':p.name,'zipFiles':names})
  for name in names:
   if 'basecolor' in name.lower() and name.lower().endswith(('.jpg','.png')):
    import io
    im=Image.open(io.BytesIO(z.read(name)));previews.append((p.stem,im.copy())); print(p.name,im.size)
Path('tmp/delivered-assets.json').write_text(json.dumps(rows,indent=2,ensure_ascii=False),encoding='utf8')
print(json.dumps(rows,ensure_ascii=False))
c=Image.new('RGB',(1200,330),'#09141d');d=ImageDraw.Draw(c)
for i,(name,im) in enumerate(previews):im.thumbnail((295,295));c.paste(im,(i*300,30));d.text((i*300+3,5),name[:32],fill='white')
c.save('tmp/delivered-materials.jpg')
