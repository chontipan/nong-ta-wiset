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

    function candidateLines(tsv) {
        const lines = new Map();
        for (const row of tsv.split('\n').map(value => value.split('\t'))) {
            if (row[0] !== '5') continue;
            const key = row.slice(1, 5).join('/');
            const words = lines.get(key) || [];
            words.push(row);
            lines.set(key, words);
        }
        return [...lines.values()].flatMap(words => {
            const boxes = [];
            for (let i = 0; i < words.length; i++) {
                const first = words[i];
                const text = clean(first[11]);
                if (!/(?:^[CLS][RPF]|20[235][025]|^R20|^CR|^LR|^SR|^AG)/.test(text)) continue;
                const candidates = [[first]];
                if (words[i + 1] && /\d/.test(clean(words[i + 1][11]))) candidates.push([first, words[i + 1]]);
                for (const rows of candidates) {
                    const x = Math.min(...rows.map(row => +row[6]));
                    const y = Math.min(...rows.map(row => +row[7]));
                    const right = Math.max(...rows.map(row => +row[6] + +row[8]));
                    const bottom = Math.max(...rows.map(row => +row[7] + +row[9]));
                    if (right - x < 18 || bottom - y < 8 || right - x > 400) continue;
                    boxes.push({ x, y, width: right - x, height: bottom - y });
                }
            }
            return boxes;
        }).slice(0,3);
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
            // Try the regular orientations first, then look for slanted text.
            const turns = [0, 90, 180, 270, 22, 68, 112, 158, 202, 248, 292, 338];
            const line = document.createElement('canvas');
            const recognizerOptions = { text: true, tsv: true };
            for (const turn of turns) {
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
                const result = await Promise.race([worker.recognize(canvas, {}, recognizerOptions), canceled]);
                if (!result) return null;
                const code = findCode(result.data.tsv);
                if (code) return code;
                const boxes = candidateLines(result.data.tsv);
                if (!boxes.length) continue;
                await Promise.race([worker.setParameters({ tessedit_pageseg_mode: tesseract.PSM.SINGLE_LINE }), canceled]);
                for (const { x, y, width, height } of boxes) {
                    if (signal.aborted) return null;
                    const pad = Math.max(4, Math.round(height * .22));
                    const scale = Math.min(3, 360 / width);
                    line.width = Math.ceil((width + 2 * pad) * scale);
                    line.height = Math.ceil((height + 2 * pad) * scale);
                    const ctx = line.getContext('2d');
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, line.width, line.height);
                    ctx.drawImage(canvas, x - pad, y - pad, width + 2 * pad, height + 2 * pad, 0, 0, line.width, line.height);
                    const single = await Promise.race([worker.recognize(line, {}, recognizerOptions), canceled]);
                    if (!single) return null;
                    const recovered = findCode(single.data.tsv);
                    if (recovered) return recovered;
                }
                if (signal.aborted) return null;
                await Promise.race([worker.setParameters({ tessedit_pageseg_mode: tesseract.PSM.SPARSE_TEXT }), canceled]);
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
