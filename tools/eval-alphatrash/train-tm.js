// Trains a Teachable-Machine-style waste model on AlphaTrash (+ a "background" class) and
// exports it as a tfjs layers model the app's WasteModel can load.
// usage: node train-tm.js <alphatrash trash_dataset dir> <background dir with train/ test/> <out model dir> <cache.json>
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

const [ROOT, BG, OUT, CACHE] = process.argv.slice(2);
const EMBEDDER_URL = 'https://storage.googleapis.com/teachable-machine-models/mobilenet_v2_weights_tf_dim_ordering_tf_kernels_1.0_224_no_top/model.json';
// Class names start with the app bin (see BIN_KEYWORDS in ai-vision.js)
const LABELS = {
    plastic: 'recyclable: พลาสติก',
    metal: 'recyclable: กระป๋องโลหะ',
    paper: 'recyclable: กระดาษ / กล่อง',
    organic: 'general: เศษอาหาร (ขยะอินทรีย์)',
    general: 'general: ขยะทั่วไป',
    background: 'background'
};
const CLASSES = Object.keys(LABELS);
const BIN = { plastic: 'recyclable', metal: 'recyclable', paper: 'recyclable', organic: 'general', general: 'general', background: 'none' };

function centreSquare(pixels) {
    const [h, w] = pixels.shape;
    const side = Math.min(w, h), y1 = (h - side) / 2, x1 = (w - side) / 2;
    return tf.image.cropAndResize(pixels.expandDims(0).toFloat(),
        [[y1 / h, x1 / w, (y1 + side) / h, (x1 + side) / w]], [0], [224, 224]).div(127.5).sub(1);
}

(async () => {
    const base = await tf.loadLayersModel(EMBEDDER_URL);
    const pooled = tf.layers.globalAveragePooling2d({}).apply(base.getLayer('out_relu').output);
    const trunk = tf.model({ inputs: base.inputs, outputs: pooled });

    let data;
    if (CACHE && fs.existsSync(CACHE)) data = JSON.parse(fs.readFileSync(CACHE));
    else {
        data = [];
        const add = (file, cls, split) => {
            const f = tf.tidy(() => {
                const px = tf.node.decodeImage(fs.readFileSync(file), 3);
                const x = centreSquare(px);
                const both = tf.concat([x, x.reverse(2)]); // original + mirror
                return trunk.predict(both).arraySync();
            });
            data.push({ cls, split, f: f[0].map(v => +v.toFixed(4)), fm: f[1].map(v => +v.toFixed(4)) });
        };
        for (const split of ['train', 'val', 'test'])
            for (const cls of fs.readdirSync(path.join(ROOT, split)).sort())
                for (const f of fs.readdirSync(path.join(ROOT, split, cls)).sort()) add(path.join(ROOT, split, cls, f), cls, split);
        for (const split of ['train', 'test'])
            for (const f of fs.readdirSync(path.join(BG, split)).sort()) add(path.join(BG, split, f), 'background', split);
        if (CACHE) fs.writeFileSync(CACHE, JSON.stringify(data));
        console.log('features', data.length);
    }

    // Train on train+val (+ mirrored copies), keep test for scoring
    const tr = data.filter(d => d.split !== 'test');
    const te = data.filter(d => d.split === 'test');
    const X = tf.tensor2d(tr.flatMap(d => [d.f, d.fm]));
    const Y = tf.oneHot(tf.tensor1d(tr.flatMap(d => [CLASSES.indexOf(d.cls), CLASSES.indexOf(d.cls)]), 'int32'), CLASSES.length);
    // Teachable Machine's head: dense 100 + softmax
    const head = tf.sequential({ layers: [
        tf.layers.dense({ inputShape: [1280], units: 100, activation: 'relu', kernelInitializer: 'varianceScaling', name: 'tm_dense_1' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: CLASSES.length, activation: 'softmax', name: 'tm_dense_2' })
    ] });
    head.compile({ optimizer: tf.train.adam(0.001), loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
    await head.fit(X, Y, { epochs: 50, batchSize: 16, shuffle: true, verbose: 0 });

    const P = head.predict(tf.tensor2d(te.map(d => d.f))).arraySync();
    const conf = {}; CLASSES.forEach(a => { conf[a] = {}; CLASSES.forEach(b => conf[a][b] = 0); });
    let ok5 = 0, okBin = 0, nW = 0, okBinApp = 0, bgFalse = 0, nBg = 0;
    te.forEach((d, i) => {
        const p = P[i]; let k = 0; p.forEach((v, j) => { if (v > p[k]) k = j; });
        const pc = CLASSES[k];
        conf[d.cls][pc]++;
        if (d.cls === 'background') { nBg++; if (pc !== 'background' && p[k] >= 0.75) bgFalse++; return; }
        nW++;
        if (pc === d.cls) ok5++;
        if (BIN[pc] === BIN[d.cls]) okBin++;
        if (BIN[pc] === BIN[d.cls] && p[k] >= 0.75) okBinApp++;
    });
    const result = {
        test_waste_images: nW, class5_acc: ok5 / nW, bin_acc: okBin / nW,
        bin_acc_sure_075: okBinApp / nW,
        background_test_images: nBg, background_false_alarm_075: bgFalse / nBg, confusion: conf
    };
    console.log(JSON.stringify(result, null, 1));

    // Export: MobileNetV2 trunk + head as one layers model (input 224x224x3 in [-1, 1])
    const out = head.apply(trunk.outputs[0]);
    const full = tf.model({ inputs: trunk.inputs, outputs: out });
    fs.mkdirSync(OUT, { recursive: true });
    await full.save('file://' + path.resolve(OUT));
    fs.writeFileSync(path.join(OUT, 'metadata.json'), JSON.stringify({
        tfjsVersion: tf.version.tfjs, modelName: 'alphatrash-waste', imageSize: 224,
        labels: CLASSES.map(c => LABELS[c]),
        trainedOn: 'AlphaTrash train+val (4,842 photos) + background photos',
        testResult: result
    }, null, 1));
    fs.writeFileSync(path.join(OUT, 'eval.json'), JSON.stringify(result, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
