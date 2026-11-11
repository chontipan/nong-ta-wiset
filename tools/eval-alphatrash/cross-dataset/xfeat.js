// For each image in <root>/<class>/*: MobileNetV2 features (as Teachable Machine sees it) and the
// app's AlphaTrash model output. usage: node xfeat.js <dataset name> <root> <model dir> <out.jsonl>
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');
const [DS, ROOT, MODEL, OUT] = process.argv.slice(2);
const EMBEDDER_URL = 'https://storage.googleapis.com/teachable-machine-models/mobilenet_v2_weights_tf_dim_ordering_tf_kernels_1.0_224_no_top/model.json';

(async () => {
    const base = await tf.loadLayersModel(EMBEDDER_URL);
    const trunk = tf.model({ inputs: base.inputs, outputs: tf.layers.globalAveragePooling2d({}).apply(base.getLayer('out_relu').output) });
    const model = await tf.loadLayersModel('file://' + path.resolve(MODEL, 'model.json'));
    const out = fs.openSync(OUT, 'w');
    let n = 0;
    for (const cls of fs.readdirSync(ROOT).sort()) {
        const dir = path.join(ROOT, cls);
        if (!fs.statSync(dir).isDirectory()) continue;
        for (const f of fs.readdirSync(dir).sort()) {
            if (!/\.(jpe?g|png)$/i.test(f)) continue;
            let px;
            try { px = tf.node.decodeImage(fs.readFileSync(path.join(dir, f)), 3); } catch (e) { continue; }
            const [feat, prob] = tf.tidy(() => {
                const [h, w] = px.shape, side = Math.min(w, h), y1 = (h - side) / 2, x1 = (w - side) / 2;
                const x = tf.image.cropAndResize(px.expandDims(0).toFloat(),
                    [[y1 / h, x1 / w, (y1 + side) / h, (x1 + side) / w]], [0], [224, 224]).div(127.5).sub(1);
                return [trunk.predict(x).dataSync(), model.predict(x).dataSync()];
            });
            px.dispose();
            fs.writeSync(out, JSON.stringify({ ds: DS, cls, file: f,
                f: Array.from(feat, v => +v.toFixed(4)), p: Array.from(prob, v => +v.toFixed(4)) }) + '\n');
            if (++n % 500 === 0) console.log(DS, n);
        }
    }
    fs.closeSync(out);
    console.log('done', DS, n);
})().catch(e => { console.error(e); process.exit(1); });
