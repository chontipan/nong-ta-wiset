"""Object groups from shooting order: within each class, photos sorted by their number/time are one object
while consecutive shots stay similar (CLIP >= tau). '- Copy' files join their original.
Then compares random vs object-disjoint 5-fold accuracy. usage: python3 groups2.py <dir> <out.json>"""
import json, sys, os, re
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupKFold, StratifiedKFold

D, OUT = sys.argv[1:3]
R = '/home/user/data/alphatrash-dataset/trash_dataset'
C5 = ['plastic', 'metal', 'paper', 'organic', 'general']
order = [(s, c, f) for s in ['train', 'val', 'test'] for c in sorted(os.listdir(f'{R}/{s}')) for f in sorted(os.listdir(f'{R}/{s}/{c}'))]
cache = [r for r in json.load(open(f'{D}/tmcache.json')) if r['cls'] != 'background']
Xm = np.array([r['f'] for r in cache], np.float32)
clip = {(r['split'], r['cls'], r['file']): r['e'] for r in map(json.loads, open(f'{D}/clip.jsonl')) if r['ds'] == 'alphatrash'}
Xc = np.array([clip[k] for k in order], np.float32)
y = np.array([k[1] for k in order])

def sort_key(f):
    base = f.replace(' - Copy', '')
    m = re.match(r'^pic(\d+)\.', base)
    if m: return (0, int(m.group(1)), '')
    m = re.match(r'^(?:pic)?(\d{4}-\d\d-\d\d \d\d%3A\d\d%3A\d\d\.\d+)', base)
    if m: return (1, 0, m.group(1))
    return (2, int(re.match(r'^(\d+)', base).group(1)), '')

def make_groups(tau):
    g = np.full(len(order), -1); nxt = 0
    for c in C5:
        idx = sorted([i for i, k in enumerate(order) if k[1] == c], key=lambda i: sort_key(order[i][2]))
        orig = {}
        prev = None
        for i in idx:
            f = order[i][2]
            if ' - Copy' in f:
                continue
            if prev is None or float(Xc[i] @ Xc[prev]) < tau:
                nxt += 1
            g[i] = nxt; orig[f] = nxt; prev = i
        for i in idx:
            f = order[i][2]
            if ' - Copy' in f:
                g[i] = orig.get(f.replace(' - Copy', ''), nxt + 1)
                if g[i] == nxt + 1: nxt += 1
    return g

res = {}
for tau in [0.85, 0.90]:
    g = make_groups(tau); sizes = np.bincount(g)[1:]; sizes = sizes[sizes > 0]
    out = {'groups': int(len(sizes)), 'median_photos_per_object': float(np.median(sizes)), 'largest': int(sizes.max())}
    for name, X, C in [('mobilenet', Xm, 100), ('clip', Xc, 10)]:
        for sn, sp in [('random', StratifiedKFold(5, shuffle=True, random_state=0).split(X, y)), ('object_disjoint', GroupKFold(5).split(X, y, g))]:
            pred = np.empty(len(y), dtype=object)
            for a, b in sp:
                pred[b] = LogisticRegression(C=C, max_iter=4000).fit(X[a], y[a]).predict(X[b])
            out[f'{name}_{sn}'] = {'acc5': float(np.mean(pred == y)), 'balanced5': float(np.mean([np.mean(pred[y == c] == c) for c in C5])),
                                   'recall': {c: float(np.mean(pred[y == c] == c)) for c in C5}}
            if tau == 0.85: res.setdefault('preds', {})[f'{name}_{sn}'] = list(pred)
    res[str(tau)] = out
    print(tau, {k: (v if not isinstance(v, dict) else round(v['balanced5'], 3)) for k, v in out.items()})
res['y'] = list(y); res['groups_085'] = make_groups(0.85).tolist(); res['order'] = order
json.dump(res, open(OUT, 'w'))
