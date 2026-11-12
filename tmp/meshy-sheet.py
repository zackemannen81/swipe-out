from PIL import Image,ImageDraw
c=Image.new('RGB',(1440,990),'#0a1720');d=ImageDraw.Draw(c)
labels=['Money tree','Realistic bush','Fern 3D','Sliding door','Panels','Quantum cargo pod','Command console','Orbital engine','Flatbed','Cattail planter','Bio plant textured','Bio plant (1)']
for i in range(12):
 im=Image.open(f'tmp/meshy-model-{i}.png');im.thumbnail((360,300));x=i%4*360;y=i//4*330;c.paste(im,(x,y+25));d.text((x+10,y+5),f'{i}: {labels[i]}',fill='white')
c.save('tmp/meshy-shortlist.jpg')
