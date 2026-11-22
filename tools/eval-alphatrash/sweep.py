import json,random,numpy as np,sys
exec(open(__file__.replace('sweep.py','analyze.py')).read().split("# ---- B.")[0].replace("FEATS, MAPPING, OUT = sys.argv[1:4]","FEATS,MAPPING,OUT=sys.argv[1:4]"))
E2=lambda r: np.array(r['e_center'],dtype=np.float32)
T=np.stack([E2(r) for r in test]); y=[r['cls'] for r in test]
tr={c:[r for r in by['train'] if r['cls']==c] for c in CLASSES}
res={}
for k in [10,20,50]:
  for thr in [0.45,0.5,0.55,0.6,0.65,0.7,0.75]:
    cov=[];acc=[];tot=[]
    for s in range(5):
      rnd=random.Random(s);ex=[];lab=[]
      for c in CLASSES:
        for r in rnd.sample(tr[c],k): ex.append(r['e_center']);lab.append(c)
      S=T@np.array(ex,dtype=np.float32).T;g=np.array([GROUP[c] for c in lab])
      a=0;n=0;ok=0
      for i in range(len(test)):
        j=S[i].argmax();m=S[i,j]-S[i][g!=g[j]].max()
        if S[i,j]>=thr and m>=0.02:
          n+=1;ok+=GROUP[lab[j]]==GROUP[y[i]]
      cov.append(n/len(test));acc.append(ok/max(n,1));tot.append(ok/len(test))
    res[f'{k}@{thr}']=(round(np.mean(cov),3),round(np.mean(acc),3),round(np.mean(tot),3))
    print(k,thr,res[f'{k}@{thr}'])
S=T@T.T
json.dump(res,open(OUT+'/threshold_sweep.json','w'))
# similarity distribution
tr_all=np.array([r['e_center'] for r in by['train']],dtype=np.float32)
print('median best sim test->train', np.median((T@tr_all.T).max(1)))
