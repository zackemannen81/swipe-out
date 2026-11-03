import cv2, numpy as np
v=cv2.VideoCapture(r'C:\Users\zakri\Desktop\skutten.mp4'); rows=[];i=0
while True:
 ok,f=v.read()
 if not ok:break
 f=cv2.resize(f,(950,473));r=f[200:360,330:620];b,g,red=cv2.split(r);mask=((red.astype(float)>g*1.7+20)&(red.astype(float)>b*1.15+10)&(red>110)).astype('uint8')
 ys,xs=np.where(mask);y=float(np.percentile(ys,3))+200 if len(ys)>30 else None
 rows.append((i/30,y));i+=1
j=[]
for k in range(1,len(rows)):
 if rows[k][1] is not None and rows[k-1][1] is not None:j.append((abs(rows[k][1]-rows[k-1][1]),rows[k][0],rows[k-1][1],rows[k][1]))
print(sorted(j,reverse=True)[:20])
