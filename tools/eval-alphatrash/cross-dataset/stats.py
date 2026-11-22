"""Final numbers for the paper: object-disjoint protocol on AlphaTrash, cross-dataset tests, bootstrap 95% CIs
and exact McNemar tests. usage: python3 stats.py <dir> <out.json>"""
import json, sys, random
import numpy as np
from scipy.stats import binomtest
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupKFold

D, OUT = sys.argv[1:3]
C5 = ['plastic', 'metal', 'paper', 'organic', 'general']
BIN = {'plastic': 'r', 'metal': 'r', 'paper': 'r', 'glass': 'r', 'organic': 'g', 'general': 'g', 'background': 'n'}
MAP = {
    'trashnet': {'cardboard': 'paper', 'paper': 'paper', 'metal': 'metal', 'plastic': 'plastic', 'trash': 'general', 'glass': 'glass'},
    'realwaste': {'Cardboard': 'paper', 'Paper': 'paper', 'Metal': 'metal', 'Plastic': 'plastic', 'Food Organics': 'organic',
                  'Vegetation': 'organic', 'Miscellaneous Trash': 'general', 'Textile Trash': 'general', 'Glass': 'glass'},
}
APP = ['plastic', 'metal', 'paper', 'organic', 'general', 'background']
rng = np.random.default_rng(0)


def bal(y, p):
    y, p = np.asarray(y), np.asarray(p)
    m = y != 'glass'
    return float(np.mean([np.mean(p[m][y[m] == c] == c) for c in C5 if np.any(y[m] == c)]))


def binacc(y, p):
    return float(np.mean([BIN[a] == BIN[b] for a, b in zip(y, p)]))


def ci(y, p, f, B=2000):
    y, p = np.asarray(y), np.asarray(p); n = len(y)
    vals = [f(y[i], p[i]) for i in (rng.integers(0, n, n) for _ in range(B))]
    return [float(np.percentile(vals, 2.5)), float(np.percentile(vals, 97.5))]


def summary(y, p):
    return {'balanced5': bal(y, p), 'balanced5_ci': ci(y, p, bal), 'bin': binacc(y, p), 'bin_ci': ci(y, p, binacc), 'n': len(y)}


def mcnemar(y, pa, pb):
    """Exact McNemar on per-image correctness (5-class; glass images left out)."""
    y, pa, pb = map(np.asarray, (y, pa, pb)); m = y != 'glass'
    a, b = pa[m] == y[m], pb[m] == y[m]
    n01, n10 = int(np.sum(a & ~b)), int(np.sum(~a & b))
    return {'a_only_right': n01, 'b_only_right': n10, 'p': float(binomtest(n01, n01 + n10).pvalue) if n01 + n10 else 1.0}


def confusion(y, p, rows, cols):
    return {r: {c: int(np.sum((np.asarray(y) == r) & (np.asarray(p) == c))) for c in cols} for r in rows}


grp = json.load(open(f'{D}/groups_results.json'))
order = [tuple(k) for k in grp['order']]; ya = np.array(grp['y']); g = np.array(grp['groups_085'])
cache = [r for r in json.load(open(f'{D}/tmcache.json')) if r['cls'] != 'background']
Xm = np.array([r['f'] for r in cache], np.float32)
clipA = {(r['split'], r['cls'], r['file']): r['e'] for r in map(json.loads, open(f'{D}/clip.jsonl')) if r['ds'] == 'alphatrash'}
Xc = np.array([clipA[k] for k in order], np.float32)
T = json.load(open(f'{D}/clip_text.json')); TC = list(T); TT = np.array([T[c] for c in TC], np.float32)

rep = {'alphatrash_photos': len(ya), 'exact_copies': int(sum(' - Copy' in k[2] for k in order)),
       'objects': int(len(set(g.tolist()))), 'median_photos_per_object': float(np.median(np.bincount(g)[np.bincount(g) > 0]))}

# --- In-domain, object-disjoint 5-fold on all of AlphaTrash ---
P = {}
for name, X, C in [('mobilenet', Xm, 100), ('clip', Xc, 10)]:
    pred = np.empty(len(ya), dtype=object)
    for a, b in GroupKFold(5).split(X, ya, g):
        pred[b] = LogisticRegression(C=C, max_iter=4000).fit(X[a], ya[a]).predict(X[b])
    P[name] = pred
P['clip_zero_shot'] = np.array([TC[i] for i in (Xc @ TT.T).argmax(1)])
rep['alphatrash'] = {k: summary(ya, v) for k, v in P.items()}
rep['alphatrash']['random_split_for_comparison'] = {k: grp['0.85'][f'{k}_random']['balanced5'] for k in ('mobilenet', 'clip')}
rep['alphatrash']['mcnemar_clip_vs_mobilenet'] = mcnemar(ya, P['clip'], P['mobilenet'])
rep['alphatrash']['confusion_mobilenet'] = confusion(ya, P['mobilenet'], C5, C5)

# --- Cross-dataset: models trained on ALL AlphaTrash ---
mn_src = LogisticRegression(C=100, max_iter=4000).fit(Xm, ya)
clip_src = LogisticRegression(C=10, max_iter=4000).fit(Xc, ya)
for ds in MAP:
    xr = [json.loads(l) for l in open(f'{D}/x_{ds}.jsonl')]
    cr = {(r['cls'], r['file']): r['e'] for r in map(json.loads, open(f'{D}/clip.jsonl')) if r['ds'] == ds}
    y = np.array([MAP[ds][r['cls']] for r in xr])
    Xmt = np.array([r['f'] for r in xr], np.float32)
    Xct = np.array([cr[(r['cls'], r['file'])] for r in xr], np.float32)
    Q = {'app_model': np.array([APP[int(np.argmax(r['p']))] for r in xr]),
         'mobilenet_trained_alphatrash': mn_src.predict(Xmt),
         'clip_trained_alphatrash': clip_src.predict(Xct),
         'clip_zero_shot': np.array([TC[i] for i in (Xct @ TT.T).argmax(1)])}
    out = {k: summary(y, v) for k, v in Q.items()}
    out['app_said_background'] = float(np.mean(Q['app_model'] == 'background'))
    # few-shot with k local photos (seed 0 for the paired tests, mean of 5 seeds for the headline)
    for k in [10, 50]:
        for s in range(5):
            r_ = random.Random(s); pick = []
            for c in sorted(set(y)):
                ids = [i for i in range(len(y)) if y[i] == c]; pick += r_.sample(ids, k)
            rest = np.setdiff1d(np.arange(len(y)), pick)
            local = LogisticRegression(C=10, max_iter=4000).fit(Xct[pick], y[pick]).predict(Xct[rest])
            mixed = LogisticRegression(C=10, max_iter=4000).fit(np.vstack([Xc, Xct[pick]]), list(ya) + list(y[pick]),
                    sample_weight=np.r_[np.ones(len(ya)), np.full(len(pick), 10.0)]).predict(Xct[rest])
            mlocal = LogisticRegression(C=100, max_iter=4000).fit(Xmt[pick], y[pick]).predict(Xmt[rest])
            for nm, pr in [(f'clip_local_{k}', local), (f'clip_alphatrash_plus_local_{k}', mixed), (f'mobilenet_local_{k}', mlocal)]:
                out.setdefault(nm + '_seeds', []).append(bal(y[rest], pr))
            if s == 0:
                out[f'clip_local_{k}'] = summary(y[rest], local)
                out[f'mobilenet_local_{k}'] = summary(y[rest], mlocal)
                out[f'clip_alphatrash_plus_local_{k}'] = summary(y[rest], mixed)
                out[f'mcnemar_local_vs_mixed_{k}'] = mcnemar(y[rest], local, mixed)
                out[f'mcnemar_clip_vs_mobilenet_local_{k}'] = mcnemar(y[rest], local, mlocal)
    out['mcnemar_zero_shot_vs_app'] = mcnemar(y, Q['clip_zero_shot'], Q['app_model'])
    rows = sorted(set(y), key=lambda c: (C5 + ['glass']).index(c))
    out['confusion_app'] = confusion(y, Q['app_model'], rows, APP)
    out['confusion_clip_zero_shot'] = confusion(y, Q['clip_zero_shot'], rows, TC)
    rep[ds] = out

json.dump(rep, open(OUT, 'w'), indent=1, default=float)
def show(d, pre=''):
    for k, v in d.items():
        if isinstance(v, dict) and 'balanced5' in v:
            print(pre, k, f"{v['balanced5']*100:.1f} [{v['balanced5_ci'][0]*100:.1f}-{v['balanced5_ci'][1]*100:.1f}]  bin {v['bin']*100:.1f}")
        elif k.startswith('mcnemar') or k.endswith('_seeds') or isinstance(v, (int, float)):
            print(pre, k, v if not k.endswith('_seeds') else f'{np.mean(v)*100:.1f} ± {np.std(v)*100:.1f}')
for k in ['alphatrash', 'trashnet', 'realwaste']:
    print('==', k); show(rep[k])
print({k: rep[k] for k in ('alphatrash_photos', 'exact_copies', 'objects', 'median_photos_per_object')})
