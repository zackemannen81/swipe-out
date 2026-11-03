# Deterministic, tileable mineral/moss detail for procedural architecture.
from PIL import Image
import math, random
random.seed(27)
n=256
img=Image.new('RGB',(n,n));px=img.load()
waves=[(random.randint(1,16),random.randint(1,16),random.random()*6.28,random.random()*.08) for _ in range(22)]
for y in range(n):
 for x in range(n):
  u=x/n*math.tau;v=y/n*math.tau
  value=.75+sum(math.sin(a*u+b*v+c)*d for a,b,c,d in waves)
  vein=abs(math.sin(5*u+2*math.sin(v)+math.sin(3*v)))
  value-=.21*math.exp(-vein*vein*120)
  k=int(max(65,min(255,255*value)))
  px[x,y]=(k,min(255,int(k*1.03)),int(k*.91))
img.save('public/images/stage2/organic-surface.png')
