"""Cross-dataset + zero-shot study. usage: python3 cross.py <eval dir> <out.json>"""
import json, sys, random
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold

D, OUT = sys.argv[1], sys.argv[2]
C5 = ['plastic', 'metal', 'paper', 'organic', 'general']
MAP = {
    'alphatrash': {c: c for c in C5},
    'trashnet': {'cardboard': 'paper', 'paper': 'paper', 'metal': 'metal', 'plastic': 'plastic', 'trash': 'general', 'glass': 'glass'},
    'realwaste': {'Cardboard': 'paper', 'Paper': 'paper', 'Metal': 'metal', 'Plastic': 'plastic', 'Food Organics': 'organic',
                  'Vegetation': 'organic', 'Miscellaneous Trash': 'general', 'Textile Trash': 'general', 'Glass': 'glass'},
}
BIN = {'plastic': 'recyclable', 'metal': 'recyclable', 'paper': 'recyclable', 'glass': 'recyclable',
       'organic': 'general', 'general': 'general', 'background': 'none'}
APP_LABELS = ['plastic', 'metal', 'paper', 'organic', 'general', 'background']


def score(y, p):
    y, p = list(y), list(p)
    binacc = np.mean([BIN[a] == BIN[b] for a, b in zip(y, p)])
    idx = [i for i, a in enumerate(y) if a != 'glass']
    acc5 = np.mean([y[i] == p[i] for i in idx])
    per = {c: float(np.mean([p[i] == c for i in idx if y[i] == c])) for c in C5 if any(y[i] == c for i in idx)}
    macro = float(np.mean(list(per.values())))
    glass = [BIN[p[i]] == 'recyclable' for i, a in enumerate(y) if a == 'glass']
    return {'n': len(y), 'bin_acc': float(binacc), 'class5_acc': float(acc5), 'class5_balanced': macro,
            'recall5': per, 'glass_to_recyclable': float(np.mean(glass)) if glass else None}


# --- MobileNetV2 (the app's backbone) ---
mn = {}
for ds, f in [('trashnet', 'x_trashnet.jsonl'), ('realwaste', 'x_realwaste.jsonl'), ('alphatrash', 'x_alphatest.jsonl')]:
    rows = [json.loads(l) for l in open(f'{D}/{f}')]
    mn[ds] = {'y': [MAP[ds][r['cls']] for r in rows], 'X': np.array([r['f'] for r in rows], np.float32),
              'app': [APP_LABELS[int(np.argmax(r['p']))] for r in rows]}
cache = json.load(open(f'{D}/tmcache.json'))
tr = [r for r in cache if r['split'] != 'test' and r['cls'] != 'background']
Xa = np.array([r['f'] for r in tr], np.float32); ya = [r['cls'] for r in tr]

# --- CLIP ---
crow = [json.loads(l) for l in open(f'{D}/clip.jsonl')]
text = json.load(open(f'{D}/clip_text.json'))
TC = list(text); T = np.array([text[c] for c in TC], np.float32)
clip = {}
for ds in MAP:
    rows = [r for r in crow if r['ds'] == ds and (ds != 'alphatrash' or r['split'] == 'test')]
    clip[ds] = {'y': [MAP[ds][r['cls']] for r in rows], 'X': np.array([r['e'] for r in rows], np.float32)}
ctr = [r for r in crow if r['ds'] == 'alphatrash' and r['split'] != 'test']
Xca = np.array([r['e'] for r in ctr], np.float32); yca = [r['cls'] for r in ctr]


def lr(X, y, C):
    return LogisticRegression(C=C, max_iter=4000).fit(X, y)


def in_domain(X, y, C):
    """5-fold cross-validation inside one dataset (upper reference)."""
    y = np.array(y); pred = np.empty(len(y), dtype=object)
    for a, b in StratifiedKFold(5, shuffle=True, random_state=0).split(X, y):
        pred[b] = lr(X[a], y[a], C).predict(X[b])
    return list(pred)


def few_shot(Xsrc, ysrc, X, y, k, C, seeds=5):
    """Source data + k target photos per class; scored on the remaining target photos."""
    res = []
    y = np.array(y)
    for s in range(seeds):
        rnd = random.Random(s); pick = []
        for c in sorted(set(y)):
            ids = [i for i in range(len(y)) if y[i] == c]
            pick += rnd.sample(ids, min(k, len(ids)))
        rest = np.setdiff1d(np.arange(len(y)), pick)
        Xt = np.vstack([Xsrc, X[pick]]) if Xsrc is not None else X[pick]
        yt = list(ysrc) + list(y[pick]) if Xsrc is not None else list(y[pick])
        # target photos count more so a handful can pull the boundary
        w = np.r_[np.ones(len(ysrc)), np.full(len(pick), 10.0)] if Xsrc is not None else None
        m = LogisticRegression(C=C, max_iter=4000).fit(Xt, yt, sample_weight=w)
        res.append(score(y[rest], m.predict(X[rest])))
    keys = ['bin_acc', 'class5_acc', 'class5_balanced']
    return {k_: float(np.mean([r[k_] for r in res])) for k_ in keys}


report = {}
mn_src = lr(Xa, ya, 100)
clip_src = lr(Xca, yca, 10)
for ds in MAP:
    r = {}
    r['app_model'] = score(mn[ds]['y'], mn[ds]['app'])
    r['app_model_said_background'] = float(np.mean([p == 'background' for p in mn[ds]['app']]))
    r['mobilenet_trained_alphatrash'] = score(mn[ds]['y'], mn_src.predict(mn[ds]['X']))
    zs = [TC[i] for i in (clip[ds]['X'] @ T.T).argmax(1)]
    r['clip_zero_shot'] = score(clip[ds]['y'], zs)
    r['clip_trained_alphatrash'] = score(clip[ds]['y'], clip_src.predict(clip[ds]['X']))
    if ds != 'alphatrash':
        r['mobilenet_in_domain_cv'] = score(mn[ds]['y'], in_domain(mn[ds]['X'], mn[ds]['y'], 100))
        r['clip_in_domain_cv'] = score(clip[ds]['y'], in_domain(clip[ds]['X'], clip[ds]['y'], 10))
        r['few_shot'] = {}
        for k in [5, 10, 20, 50]:
            r['few_shot'][str(k)] = {
                'mobilenet_alphatrash_plus_k': few_shot(Xa, ya, mn[ds]['X'], mn[ds]['y'], k, 100),
                'mobilenet_k_only': few_shot(None, [], mn[ds]['X'], mn[ds]['y'], k, 100),
                'clip_alphatrash_plus_k': few_shot(Xca, yca, clip[ds]['X'], clip[ds]['y'], k, 10),
                'clip_k_only': few_shot(None, [], clip[ds]['X'], clip[ds]['y'], k, 10),
            }
    report[ds] = r
    print(ds, json.dumps({k: (v['bin_acc'], v['class5_acc']) if isinstance(v, dict) and 'bin_acc' in v else v
                          for k, v in r.items() if k != 'few_shot'}, indent=0))
    if 'few_shot' in r:
        for k, v in r['few_shot'].items():
            print(' k', k, {m: round(x['class5_acc'], 3) for m, x in v.items()})
json.dump(report, open(OUT, 'w'), indent=1)
