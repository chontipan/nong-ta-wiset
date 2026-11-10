// Runs the app's AI pieces on every AlphaTrash image and saves raw outputs.
// usage: node extract.js <dataset_root> <out.jsonl>
const tf = require('@tensorflow/tfjs-node');
const coco = require('@tensorflow-models/coco-ssd');
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2];
const OUT = process.argv[3];
const EMBEDDER_URL = 'https://storage.googleapis.com/teachable-machine-models/mobilenet_v2_weights_tf_dim_ordering_tf_kernels_1.0_224_no_top/model.json';

// Same as ai-vision.js
function squareBox(region, w, h, pad) {
    let [x, y, bw, bh] = region;
    const cx = x + bw / 2, cy = y + bh / 2;
    let side = Math.max(bw, bh) * (1 + pad);
    side = Math.min(side, Math.max(w, h));
    let x1 = cx - side / 2, y1 = cy - side / 2, x2 = cx + side / 2, y2 = cy + side / 2;
    if (x1 < 0) { x2 -= x1; x1 = 0; }
    if (y1 < 0) { y2 -= y1; y1 = 0; }
    if (x2 > w) { x1 -= x2 - w; x2 = w; }
    if (y2 > h) { y1 -= y2 - h; y2 = h; }
    return { x1: Math.max(0, x1), y1: Math.max(0, y1), x2: Math.min(w, x2), y2: Math.min(h, y2) };
}
const centerRegion = (w, h) => [w * 0.2, h * 0.15, w * 0.6, h * 0.7];

(async () => {
    const det = await coco.load({ base: 'mobilenet_v2' });
    const base = await tf.loadLayersModel(EMBEDDER_URL);
    const pooled = tf.layers.globalAveragePooling2d({}).apply(base.getLayer('out_relu').output);
    const emb = tf.model({ inputs: base.inputs, outputs: pooled });

    const embed = (pixels, box) => tf.tidy(() => {
        const [h, w] = pixels.shape;
        const crop = tf.image.cropAndResize(pixels.expandDims(0).toFloat(),
            [[box.y1 / h, box.x1 / w, box.y2 / h, box.x2 / w]], [0], [224, 224]);
        const e = emb.predict(crop.div(127.5).sub(1));
        return Array.from(e.div(e.norm().add(1e-8)).squeeze().dataSync()).map(v => +v.toFixed(5));
    });

    const out = fs.createWriteStream(OUT);
    const jobs = [];
    for (const split of ['train', 'val', 'test'])
        for (const cls of fs.readdirSync(path.join(ROOT, split)).sort())
            for (const f of fs.readdirSync(path.join(ROOT, split, cls)).sort())
                jobs.push({ split, cls, f });
    let n = 0;
    for (const j of jobs) {
        const pixels = tf.node.decodeImage(fs.readFileSync(path.join(ROOT, j.split, j.cls, j.f)), 3);
        const [h, w] = pixels.shape;
        const rec = { split: j.split, cls: j.cls, file: j.f, w, h };
        // COCO-SSD exactly like the app asks for it (max 10 boxes, min score 0.30)
        const preds = await det.detect(pixels, 10, 0.30);
        rec.coco = preds.map(p => ({ c: p.class, s: +p.score.toFixed(4), b: p.bbox.map(v => Math.round(v)) }));
        const IGN = ['person','dog','cat','bird','horse','sheep','cow','elephant','bear','zebra','giraffe','chair','couch','bed','dining table','toilet','bench','tv','refrigerator','oven','sink','car','bus','truck','train','airplane','boat','motorcycle','bicycle','traffic light','fire hydrant','stop sign','parking meter','kite'];
        const valid = preds.filter(p => p.score >= 0.58 && !IGN.includes(p.class));
        if (valid.length) {
            const cx = w / 2, cy = h / 2, md = Math.hypot(cx, cy);
            const pr = p => p.score * (1.2 - Math.hypot(p.bbox[0] + p.bbox[2] / 2 - cx, p.bbox[1] + p.bbox[3] / 2 - cy) / md * 0.35);
            valid.sort((a, b) => pr(b) - pr(a));
            rec.e_box = embed(pixels, squareBox(valid[0].bbox, w, h, 0.12));
        }
        // Visual-memory embedding of the centre region (what the app uses when COCO finds nothing)
        rec.e_center = embed(pixels, squareBox(centerRegion(w, h), w, h, 0.12));
        // Teachable Machine style: centre square of the frame
        const side = Math.min(w, h);
        rec.e_square = embed(pixels, { x1: (w - side) / 2, y1: (h - side) / 2, x2: (w + side) / 2, y2: (h + side) / 2 });
        pixels.dispose();
        out.write(JSON.stringify(rec) + '\n');
        if (++n % 200 === 0) console.log(n, '/', jobs.length);
    }
    out.end();
    console.log('done', n);
})().catch(e => { console.error(e); process.exit(1); });
