import os, random, numpy as np
from PIL import Image, ImageFilter
import skimage.data as d
random.seed(1); np.random.seed(1)
for s in ('train','test'): os.makedirs(f'bg/{s}',exist_ok=True)
fl=sorted(os.popen("find flower_photos -name '*.jpg'").read().split())
random.shuffle(fl)
for i,f in enumerate(fl[:600]):
    Image.open(f).convert('RGB').save(f"bg/{'train' if i<300 else 'test'}/flower_{i}.jpg")
sk=['astronaut','camera','cat','chelsea','clock','coffee','eagle','grass','gravel','horse','hubble_deep_field','immunohistochemistry','lily','logo','moon','page','retina','rocket','text','brick','colorwheel','coins','skin','stereo_motorcycle']
j=0
for n in sk:
    try: a=getattr(d,n)()
    except Exception: continue
    if isinstance(a,tuple): a=a[0]
    a=np.asarray(a).astype(float)
    if a.ndim==2: a=np.stack([a]*3,-1)
    if a.shape[-1]==4: a=a[...,:3]
    a=(255*(a-a.min())/(np.ptp(a)+1e-9)).astype(np.uint8)
    Image.fromarray(a).save(f"bg/{'train' if j%2==0 else 'test'}/sk_{n}.jpg"); j+=1
import glob; at=sorted(glob.glob('/home/user/data/alphatrash-dataset/trash_dataset/train/*/*'))
random.shuffle(at)
for i,f in enumerate(at[:300]):
    Image.open(f).convert('RGB').filter(ImageFilter.GaussianBlur(40)).save(f"bg/{'train' if i<200 else 'test'}/blur_{i}.jpg")
for i in range(60):
    c=np.array([random.randint(0,255) for _ in range(3)])
    n=c+np.random.randint(-12,12,(360,640,3))
    Image.fromarray(np.clip(n,0,255).astype(np.uint8)).save(f"bg/{'train' if i<40 else 'test'}/flat_{i}.jpg")
print(j,len(os.listdir('bg/train')),len(os.listdir('bg/test')))
