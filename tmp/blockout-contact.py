from PIL import Image, ImageOps, ImageDraw
from pathlib import Path
files=[p for p in Path('tmp').glob('blockout-*.png') if p.name!='blockout-contact.png' and p.name!='blockout-mobile.png']
canvas=Image.new('RGB',(1500,((len(files)+2)//3)*330),'#07121c');d=ImageDraw.Draw(canvas)
for i,p in enumerate(files):
 im=Image.open(p);im.thumbnail((500,300));x=(i%3)*500;y=(i//3)*330;canvas.paste(im,(x,y+25));d.text((x+8,y+5),p.stem,fill='white')
canvas.save('tmp/blockout-contact.jpg')
