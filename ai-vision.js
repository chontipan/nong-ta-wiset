/* RecycleNet MobileNetV3 Small, RGB / ImageNet normalization, NCHW. */
window.RecycleNet = class RecycleNet {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.canvas.height = 224;
        this.context = this.canvas.getContext('2d', { willReadFrequently: true });
        this.queue = Promise.resolve();
    }

    async load() {
        ort.env.wasm.numThreads = 1;
        ort.env.wasm.wasmPaths = new URL('vendor/ort/', document.baseURI).href;
        const modelUrl = new URL('models/recyclenet-small.onnx', document.baseURI);
        const deadline = AbortSignal.timeout(12000);
        let onTimeout;
        const timeout = new Promise((_, reject) => {
            onTimeout = () => reject(new Error('RecycleNet initialization timed out'));
            deadline.addEventListener('abort', onTimeout, { once: true });
        });
        const initialize = async () => {
            const response = await fetch(modelUrl, { signal: deadline });
            if (!response.ok) throw new Error(`RecycleNet download failed (HTTP ${response.status})`);
            const bytes = await response.arrayBuffer();
            const session = await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'] });
            if (deadline.aborted) await session.release();
            return session;
        };
        try {
            this.session = await Promise.race([initialize(), timeout]);
        } finally {
            deadline.removeEventListener('abort', onTimeout);
        }
    }

    predict(source, cropCenter = false, confidenceThreshold = 0.65, minimumMargin = 0.15) {
        const task = this.queue.then(() => this.run(source, cropCenter, confidenceThreshold, minimumMargin));
        this.queue = task.catch(() => {});
        return task;
    }

    async run(source, cropCenter, confidenceThreshold, minimumMargin) {
        const size = 224;
        const plane = size * size;
        const width = source.videoWidth || source.width;
        const height = source.videoHeight || source.height;
        const side = Math.min(width, height);
        const region = cropCenter
            ? [(width - side) / 2, (height - side) / 2, side, side]
            : [0, 0, width, height];
        this.context.drawImage(source, ...region, 0, 0, size, size);
        const rgba = this.context.getImageData(0, 0, size, size).data;
        const data = new Float32Array(3 * plane);
        const mean = [0.485, 0.456, 0.406];
        const std = [0.229, 0.224, 0.225];
        for (let channel = 0; channel < 3; channel++) {
            for (let i = 0; i < plane; i++) {
                data[channel * plane + i] = (rgba[i * 4 + channel] / 255 - mean[channel]) / std[channel];
            }
        }
        const input = new ort.Tensor('float32', data, [1, 3, size, size]);
        const { logits, material_log_odds: materialLogOdds, battery_score: batteryScore, coin_score: coinScore } = await this.session.run({ image: input });
        const labels = ['cardboard', 'glass', 'metal', 'paper', 'plastic', 'trash'];
        const max = Math.max(...logits.data);
        const scores = Array.from(logits.data, value => Math.exp(value - max));
        const sum = scores.reduce((total, value) => total + value, 0);
        const rank = () => labels.map((_, i) => i).sort((a, b) => scores[b] - scores[a]);
        let [best, second] = rank();
        const recyclePair = best !== 5 && second !== 5
            ? { recyclablePairScore: (scores[best] + scores[second]) / sum, outsidePairScore: scores[5] / sum }
            : {};
        const glass = 1;
        const plastic = 4;
        const pairIsOnTop = (best === glass && second === plastic) || (best === plastic && second === glass);
        const uncertain = scores[best] / sum < confidenceThreshold
            || (scores[best] - scores[second]) / sum < minimumMargin;
        const helperOdds = materialLogOdds?.data[0];
        if (pairIsOnTop && uncertain && Number.isFinite(helperOdds)) {
            // Split only the existing probability mass of the two materials.
            const pairMass = scores[glass] + scores[plastic];
            const blendedOdds = (logits.data[plastic] - logits.data[glass] + helperOdds) / 2;
            const plasticShare = 1 / (1 + Math.exp(-blendedOdds));
            scores[plastic] = pairMass * plasticShare;
            scores[glass] = pairMass * (1 - plasticShare);
            [best, second] = rank();
        }
        return { label: labels[best], score: scores[best] / sum, margin: (scores[best] - scores[second]) / sum, ...recyclePair,
            batteryWarning: batteryScore?.data[0] >= 0.66 || coinScore?.data[0] >= 0.85 };
    }
};
