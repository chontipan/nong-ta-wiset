"""Scores the app's AI on AlphaTrash. usage: python3 analyze.py feats.jsonl mapping.json outdir"""
import json, sys, os, random
import numpy as np
from sklearn.linear_model import LogisticRegression

FEATS, MAPPING, OUT = sys.argv[1:4]
os.makedirs(OUT, exist_ok=True)
MAP = json.load(open(MAPPING))
CLASSES = ['plastic', 'metal', 'paper', 'organic', 'general']
# Which app bin is correct for each AlphaTrash class (plastic: either plastic bin counts)
GT_BINS = {'plastic': {'plastic_bottle', 'recyclable'}, 'metal': {'recyclable'}, 'paper': {'recyclable'},
           'organic': {'general'}, 'general': {'general'}}
GROUP = {c: ('recyclable' if c in ('plastic', 'metal', 'paper') else 'general') for c in CLASSES}
PRED_COLS = ['plastic_bottle', 'recyclable', 'hazardous', 'general', 'money', 'none']
IGN = {'person','dog','cat','bird','horse','sheep','cow','elephant','bear','zebra','giraffe','chair','couch','bed','dining table','toilet','bench','tv','refrigerator','oven','sink','car','bus','truck','train','airplane','boat','motorcycle','bicycle','traffic light','fire hydrant','stop sign','parking meter','kite'}
THR = 0.58

rows = [json.loads(l) for l in open(FEATS)]
by = {s: [r for r in rows if r['split'] == s] for s in ('train', 'val', 'test')}
test = by['test']


def top_coco(r):
    w, h = r['w'], r['h']
    cx, cy, md = w / 2, h / 2, np.hypot(w / 2, h / 2)
    ok = []
    for p in r['coco']:
        if p['s'] < THR or p['c'] in IGN:
            continue
        x, y, bw, bh = p['b']
        if bw * bh < w * h * 0.012 and p['s'] < THR + 0.12:
            continue
        pr = p['s'] * (1.2 - np.hypot(x + bw / 2 - cx, y + bh / 2 - cy) / md * 0.35)
        ok.append((pr, p))
    return max(ok, key=lambda t: t[0])[1] if ok else None


def coco_bin(r):
    t = top_coco(r)
    return ('none', None) if t is None else (MAP.get(t['c'], 'general'), t['c'])


def confusion(preds, recs, cols):
    m = {c: {k: 0 for k in cols} for c in CLASSES}
    for p, r in zip(preds, recs):
        m[r['cls']][p] += 1
    return m


def bin_scores(preds, recs):
    res = {}
    for c in CLASSES + ['ALL']:
        sel = [(p, r) for p, r in zip(preds, recs) if c == 'ALL' or r['cls'] == c]
        n = len(sel)
        correct = sum(p in GT_BINS[r['cls']] for p, r in sel)
        answered = [(p, r) for p, r in sel if p != 'none']
        res[c] = {'n': n, 'correct': correct, 'acc': correct / n,
                  'answered': len(answered), 'coverage': len(answered) / n,
                  'acc_when_answered': (sum(p in GT_BINS[r['cls']] for p, r in answered) / len(answered)) if answered else None}
    return res


def macro(res):
    return float(np.mean([res[c]['acc'] for c in CLASSES]))


report = {'n_test': len(test), 'counts': {s: {c: sum(r['cls'] == c for r in by[s]) for c in CLASSES} for s in by}}

# ---- A. The app as shipped: COCO-SSD + WASTE_MAPPING, nothing taught ----
a_preds, a_cls = zip(*[coco_bin(r) for r in test])
coco_hits = {c: {} for c in CLASSES}
for (b, k), r in zip(zip(a_preds, a_cls), test):
    if k:
        coco_hits[r['cls']][k] = coco_hits[r['cls']].get(k, 0) + 1
report['A'] = {'scores': bin_scores(a_preds, test), 'confusion': confusion(a_preds, test, PRED_COLS),
               'coco_classes': {c: dict(sorted(v.items(), key=lambda t: -t[1])) for c, v in coco_hits.items()}}
report['A']['macro'] = macro(report['A']['scores'])
# Same with the lowest slider setting (0.40) to show coverage isn't just a threshold issue
THR_SAVE = THR
THR = 0.40
low = [coco_bin(r)[0] for r in test]
report['A_thr040'] = {'scores': bin_scores(low, test)}
THR = THR_SAVE

# ---- B. Visual memory: teach k photos per class from train, exact app rule ----
def emb_for(r):
    return np.array(r['e_box'] if 'e_box' in r and top_coco(r) else r['e_center'], dtype=np.float32)

test_E = np.stack([emb_for(r) for r in test])
test_has_box = [top_coco(r) is not None for r in test]
train_by_cls = {c: [r for r in by['train'] if r['cls'] == c] for c in CLASSES}


def visual_memory_run(k, seed, thresholds=True):
    rnd = random.Random(seed)
    ex, lab = [], []
    for c in CLASSES:
        pool = train_by_cls[c]
        for r in (pool if k == 'all' else rnd.sample(pool, k)):
            ex.append(r['e_center']); lab.append(c)  # trainer photos are centre crops
    E = np.array(ex, dtype=np.float32)
    grp = np.array([GROUP[c] for c in lab])
    S = test_E @ E.T
    preds, preds5 = [], []
    for i, r in enumerate(test):
        j = int(S[i].argmax()); best = S[i, j]
        other = S[i][grp != grp[j]]
        margin = best - other.max() if len(other) else 1
        c = lab[j]
        bin_ = 'recyclable' if GROUP[c] == 'recyclable' else 'general'
        need = 0.68 if test_has_box[i] else 0.75
        if not thresholds or (best >= need and margin >= 0.02):
            preds.append(bin_)
        else:
            preds.append(a_preds[i])  # falls back to COCO, like the app
        preds5.append(c)
    return preds, preds5


report['B'] = {}
for k in [1, 3, 5, 10, 20, 50, 'all']:
    seeds = [0] if k == 'all' else range(5)
    accs, accs_nt, acc5, covs = [], [], [], []
    for s in seeds:
        p, p5 = visual_memory_run(k, s)
        sc = bin_scores(p, test)
        accs.append(sc['ALL']['acc']); covs.append(sc['ALL']['coverage'])
        p_nt, _ = visual_memory_run(k, s, thresholds=False)
        accs_nt.append(bin_scores(p_nt, test)['ALL']['acc'])
        acc5.append(np.mean([a == r['cls'] for a, r in zip(p5, test)]))
        if k == 10 and s == 0:
            report['B_k10_confusion'] = confusion(p, test, PRED_COLS)
            report['B_k10_scores'] = sc
    report['B'][str(k)] = {'bin_acc': float(np.mean(accs)), 'bin_acc_sd': float(np.std(accs)),
                           'coverage': float(np.mean(covs)), 'bin_acc_no_threshold': float(np.mean(accs_nt)),
                           'class5_acc_1nn': float(np.mean(acc5)), 'runs': len(seeds)}

# ---- C. Teachable-Machine-style model: same MobileNetV2 features + linear softmax head ----
Xtr = np.array([r['e_square'] for r in by['train']]); ytr = [r['cls'] for r in by['train']]
Xva = np.array([r['e_square'] for r in by['val']]); yva = [r['cls'] for r in by['val']]
Xte = np.array([r['e_square'] for r in test]); yte = [r['cls'] for r in test]
best = None
for C in [0.3, 1, 3, 10, 30, 100]:
    clf = LogisticRegression(C=C, max_iter=3000).fit(Xtr, ytr)
    va = clf.score(Xva, yva)
    if not best or va > best[0]:
        best = (va, C)
clf = LogisticRegression(C=best[1], max_iter=3000).fit(np.vstack([Xtr, Xva]), ytr + yva)
p5 = list(clf.predict(Xte)); prob = clf.predict_proba(Xte).max(1)
c_bins = ['recyclable' if GROUP[c] == 'recyclable' else 'general' for c in p5]
conf5 = {c: {k: 0 for k in CLASSES} for c in CLASSES}
for a, b in zip(yte, p5):
    conf5[a][b] += 1
per5 = {}
for c in CLASSES:
    tp = conf5[c][c]; fn = sum(conf5[c].values()) - tp; fp = sum(conf5[o][c] for o in CLASSES) - tp
    pr = tp / (tp + fp) if tp + fp else 0; rc = tp / (tp + fn)
    per5[c] = {'precision': pr, 'recall': rc, 'f1': 2 * pr * rc / (pr + rc) if pr + rc else 0, 'n': tp + fn}
# what the app does with its 0.75 rule: below it the TM answer is ignored and COCO is used
c_bins_app = [b if pr_ >= 0.75 else a for b, pr_, a in zip(c_bins, prob, a_preds)]
report['C'] = {'C': best[1], 'val_acc': best[0], 'class5_acc': float(np.mean([a == b for a, b in zip(yte, p5)])),
               'per_class': per5, 'confusion5': conf5,
               'macro_f1': float(np.mean([per5[c]['f1'] for c in CLASSES])),
               'bin_scores': bin_scores(c_bins, test), 'bin_scores_app_rule': bin_scores(c_bins_app, test),
               'share_prob_ge_075': float(np.mean(prob >= 0.75))}

# learning curve for C: photos per class
lc = {}
for k in [5, 10, 20, 50, 100, 'all']:
    accs = []
    for s in (range(5) if k != 'all' else [0]):
        rnd = random.Random(s); idx = []
        for c in CLASSES:
            ids = [i for i, y in enumerate(ytr) if y == c]
            idx += ids if k == 'all' else rnd.sample(ids, k)
        m = LogisticRegression(C=best[1], max_iter=3000).fit(Xtr[idx], [ytr[i] for i in idx])
        pp = m.predict(Xte)
        accs.append(np.mean([GROUP[a] == GROUP[b] for a, b in zip(yte, pp)]))
        accs[-1] = (accs[-1], np.mean([a == b for a, b in zip(yte, pp)]))
    lc[str(k)] = {'bin_acc': float(np.mean([a for a, _ in accs])), 'class5_acc': float(np.mean([b for _, b in accs]))}
report['C_learning_curve'] = lc

json.dump(report, open(os.path.join(OUT, 'results.json'), 'w'), indent=1, ensure_ascii=False)
print(json.dumps({'A': report['A']['scores']['ALL'], 'A_macro': report['A']['macro'],
                  'A040': report['A_thr040']['scores']['ALL'], 'B': report['B'],
                  'C': {k: report['C'][k] for k in ('class5_acc', 'macro_f1', 'val_acc', 'share_prob_ge_075')},
                  'C_bin': report['C']['bin_scores']['ALL'], 'C_app': report['C']['bin_scores_app_rule']['ALL'],
                  'LC': lc}, indent=1))
