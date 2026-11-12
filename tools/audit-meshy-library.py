from pathlib import Path
import json,struct,hashlib,collections
root=Path('C:/Users/zakri/Desktop/tourbus/assets/meshyai');rows=[]
for p in sorted(root.rglob('*.glb')):
 row={'file':str(p.relative_to(root)),'bytes':p.stat().st_size}
 try:
  with p.open('rb') as f:
   head=f.read(20);magic,version,total,size,kind=struct.unpack('<IIIII',head)
   if magic!=0x46546c67 or version!=2 or total!=row['bytes'] or kind!=0x4e4f534a or size>total-20:raise ValueError('Invalid GLB header')
   g=json.loads(f.read(size));f.seek(0);h=hashlib.sha256()
   while b:=f.read(1048576):h.update(b)
  row.update(sha256=h.hexdigest(),triangles=sum(g['accessors'][q.get('indices',q['attributes']['POSITION'])]['count']//3 for m in g.get('meshes',[]) for q in m['primitives'] if q.get('mode',4)==4),meshes=len(g.get('meshes',[])),materials=len(g.get('materials',[])),images=len(g.get('images',[])),requiredExtensions=g.get('extensionsRequired',[]),externalUris=[a['uri'] for a in g.get('images',[])+g.get('buffers',[]) if a.get('uri') and not a['uri'].startswith('data:')])
  row['loaderCompatible']=not row['externalUris'] and not set(row['requiredExtensions']).intersection(['KHR_draco_mesh_compression','EXT_meshopt_compression','KHR_texture_basisu'])
 except Exception as e:row['error']=str(e)
 rows.append(row)
groups=collections.defaultdict(list)
for r in rows:
 if r.get('sha256'):groups[r['sha256']].append(r['file'])
report={'root':str(root),'files':len(rows),'bytes':sum(r['bytes'] for r in rows),'unique':len(groups),'duplicateCopies':sum(len(v)-1 for v in groups.values()),'duplicateGroups':[v for v in groups.values() if len(v)>1],'entries':rows}
Path('docs/MESHY_LIBRARY_INVENTORY.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
print(json.dumps({k:v for k,v in report.items() if k not in ['entries','duplicateGroups']}))
for r in rows:
 if any(x in r['file'].lower() for x in ['tree','plant','bush','fern','bench','chair','console','panel','door','cargo','crate','reactor','core','cabinet','locker','bed','light','medical','lamp']):
  print(r['file'],r.get('triangles'),round(r['bytes']/1e6,1),'MB',r.get('loaderCompatible'))
