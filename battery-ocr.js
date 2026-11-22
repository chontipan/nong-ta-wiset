/* Optional OCR on a confirmed scan frame. The camera image stays in the browser. */
window.readBatteryCode = (() => {
    const asset = name => new URL(`vendor/ocr/${name}`, document.baseURI).href;
    const codePattern = /^(?:CR(?:2032|2025|2016|2450|2430|1632|1616|1620|1220|1225|2354)|LR(?:44|43|41|1130)|SR(?:44|43|41|626)|AG13)$/;
    const clean = word => (word ?? '').toUpperCase().replace(/^[^A-Z0-9]+|[^A-Z0-9]+$/g, '');
    let library;
    let active = false;

    function loadLibrary() {
        library ??= new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = asset('tesseract.min.js');
            script.onload = () => resolve(window.Tesseract);
            script.onerror = () => {
                script.remove();
                library = undefined;
                reject(new Error('Battery OCR library unavailable'));
            };
            document.head.append(script);
        });
        return library;
    }

    function findCode(tsv) {
        const words = tsv.split('\n').map(row => row.split('\t')).filter(row => row[0] === '5');
        for (const [i, first] of words.entries()) {
            if (!(Number(first[10]) >= 70)) continue;
            const word = clean(first[11]);
            if (codePattern.test(word)) return word;
            const next = words[i + 1];
            if (next && Number(next[10]) >= 70
                && first.slice(1, 5).join('/') === next.slice(1, 5).join('/')) {
                const pair = word + clean(next[11]);
                if (codePattern.test(pair)) return pair;
            }
        }
        return null;
    }

    return async function readBatteryCode(source, signal) {
        if (active || signal.aborted) return null;
        active = true;
        let worker;
        let abort;
        const canceled = new Promise(resolve => {
            abort = () => resolve(null);
            signal.addEventListener('abort', abort, { once: true });
        });
        try {
            const tesseract = await Promise.race([loadLibrary(), canceled]);
            if (!tesseract || signal.aborted) return null;
            const initialize = tesseract.createWorker('eng', 1, {
                workerPath: asset('worker.min.js'),
                corePath: asset('tesseract-core-simd-lstm.wasm.js'),
                langPath: asset(''),
                workerBlobURL: false,
                cacheMethod: 'none'
            }).then(created => {
                if (signal.aborted) {
                    created.terminate().catch(() => {});
                    return null;
                }
                return created;
            });
            worker = await Promise.race([initialize, canceled]);
            if (!worker || signal.aborted) return null;
            await Promise.race([worker.setParameters({ tessedit_pageseg_mode: tesseract.PSM.SPARSE_TEXT }), canceled]);
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 512;
            const context = canvas.getContext('2d');
            const side = Math.min(source.width, source.height);
            for (const turn of [0, 90, 180, 270]) {
                if (signal.aborted) return null;
                context.resetTransform();
                context.filter = 'none';
                context.fillStyle = 'white';
                context.fillRect(0, 0, 512, 512);
                context.translate(256, 256);
                context.rotate(turn * Math.PI / 180);
                context.filter = 'grayscale(1) contrast(1.2)';
                context.drawImage(source, (source.width - side) / 2, (source.height - side) / 2,
                    side, side, -240, -240, 480, 480);
                const result = await Promise.race([worker.recognize(canvas, {}, { text: true, tsv: true }), canceled]);
                if (!result) return null;
                const code = findCode(result.data.tsv);
                if (code) return code;
            }
            return null;
        } catch (error) {
            if (!signal.aborted) console.warn('Battery OCR unavailable:', error);
            return null;
        } finally {
            signal.removeEventListener('abort', abort);
            worker?.terminate().catch(() => {});
            active = false;
        }
    };
})();
