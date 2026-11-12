from PIL import Image,ImageDraw
c=Image.new('RGB',(1440,660),'#0a1720');d=ImageDraw.Draw(c)
for i in range(8):
 im=Image.open(f'tmp/delivery-model-{i}.png');im.thumbnail((360,300));x=i%4*360;y=i//4*330;c.paste(im,(x,y+25));d.text((x+10,y+5),str(i),fill='white')
c.save('tmp/delivery-contact.jpg')
