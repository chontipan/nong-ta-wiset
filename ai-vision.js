/* ==========================================================================
   น้องตาวิเศษ - Visual Memory (ภาพจำ AI)
   Turns photos into MobileNetV2 feature vectors and matches new camera frames
   against the photos people taught the app (trainer studio + "ผิด" corrections).
   Same backbone Teachable Machine uses, so a few photos per item are enough.
   ========================================================================== */

(function () {
    const EMBEDDER_URL = 'https://storage.googleapis.com/teachable-machine-models/mobilenet_v2_weights_tf_dim_ordering_tf_kernels_1.0_224_no_top/model.json';
    const INPUT_SIZE = 224;

    class VisualMemory {
        constructor() {
            this.model = null;
            this.ready = false;
            this.examples = []; // { id, label, emb: Float32Array, group, boost }
        }

        get size() {
            return this.examples.length;
        }

        isUsable() {
            return this.ready && this.examples.length > 0;
        }

        async load() {
            const base = await tf.loadLayersModel(EMBEDDER_URL);
            // Same cut point as Teachable Machine: last conv features, averaged over the image
            const features = base.getLayer('out_relu').output;
            const pooled = tf.layers.globalAveragePooling2d({}).apply(features);
            this.model = tf.model({ inputs: base.inputs, outputs: pooled });
            tf.tidy(() => this.model.predict(tf.zeros([1, INPUT_SIZE, INPUT_SIZE, 3])));
            this.ready = true;
        }

        // region = [x, y, w, h] in source pixels. Padded a little and made square so the
        // object keeps its shape (squashing a tall bottle makes it look like a can).
        async embed(source, region = null) {
            if (!this.ready) return null;
            const out = tf.tidy(() => {
                const pixels = tf.browser.fromPixels(source);
                const [h, w] = pixels.shape;
                const box = squareBox(region || [0, 0, w, h], w, h, region ? 0.12 : 0);
                const batch = pixels.expandDims(0).toFloat();
                const crop = tf.image.cropAndResize(
                    batch,
                    [[box.y1 / h, box.x1 / w, box.y2 / h, box.x2 / w]],
                    [0],
                    [INPUT_SIZE, INPUT_SIZE]
                );
                const input = crop.div(127.5).sub(1);
                const emb = this.model.predict(input);
                return emb.div(emb.norm().add(1e-8)).squeeze();
            });
            const data = await out.data();
            out.dispose();
            return new Float32Array(data);
        }

        async embedDataUrl(dataUrl) {
            const img = await loadImage(dataUrl);
            return this.embed(img);
        }

        // group: which bin the example belongs to (labels in the same bin never conflict)
        // boost: small similarity bonus, used for corrections people made with the "ไม่ถูก" button
        add(id, label, emb, { group = label, boost = 0 } = {}) {
            if (!emb) return;
            this.examples.push({ id, label, emb, group, boost });
        }

        removeLabel(label) {
            this.examples = this.examples.filter(e => e.label !== label);
        }

        removeId(id) {
            this.examples = this.examples.filter(e => e.id !== id);
        }

        // Nearest taught photo by cosine similarity (1-NN works best with only a few photos per item).
        // margin = how far ahead it is of the closest photo that belongs to a *different* bin.
        classify(emb) {
            if (!emb || this.examples.length === 0) return null;
            let best = null;
            for (const e of this.examples) {
                const sim = dot(emb, e.emb);
                const score = sim + e.boost;
                if (!best || score > best.score) best = { e, sim, score };
            }
            let rival = -Infinity;
            for (const e of this.examples) {
                if (e.group === best.e.group) continue;
                rival = Math.max(rival, dot(emb, e.emb) + e.boost);
            }
            const margin = rival === -Infinity ? 1 : best.score - rival;
            return { label: best.e.label, sim: best.sim, margin };
        }
    }

    function dot(a, b) {
        let s = 0;
        for (let i = 0; i < a.length; i++) s += a[i] * b[i];
        return s;
    }

    function squareBox(region, w, h, pad) {
        let [x, y, bw, bh] = region;
        const cx = x + bw / 2;
        const cy = y + bh / 2;
        let side = Math.max(bw, bh) * (1 + pad);
        side = Math.min(side, Math.max(w, h));
        let x1 = cx - side / 2;
        let y1 = cy - side / 2;
        let x2 = cx + side / 2;
        let y2 = cy + side / 2;
        // Clamp inside the image
        if (x1 < 0) { x2 -= x1; x1 = 0; }
        if (y1 < 0) { y2 -= y1; y1 = 0; }
        if (x2 > w) { x1 -= x2 - w; x2 = w; }
        if (y2 > h) { y1 -= y2 - h; y2 = h; }
        return { x1: Math.max(0, x1), y1: Math.max(0, y1), x2: Math.min(w, x2), y2: Math.min(h, y2) };
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    // Cut a region out of a video/image into a small JPEG, to keep as a teaching example
    function cropToDataUrl(source, region, maxSide = 224) {
        const w = source.videoWidth || source.naturalWidth || source.width;
        const h = source.videoHeight || source.naturalHeight || source.height;
        if (!w || !h) return null;
        const box = squareBox(region || [0, 0, w, h], w, h, region ? 0.12 : 0);
        const sw = box.x2 - box.x1;
        const sh = box.y2 - box.y1;
        const scale = Math.min(1, maxSide / Math.max(sw, sh));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(sw * scale));
        c.height = Math.max(1, Math.round(sh * scale));
        c.getContext('2d').drawImage(source, box.x1, box.y1, sw, sh, 0, 0, c.width, c.height);
        return c.toDataURL('image/jpeg', 0.8);
    }

    window.VisualMemory = VisualMemory;
    window.cropToDataUrl = cropToDataUrl;
})();
