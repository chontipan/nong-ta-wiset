// CLIP (ViT-B/32) image embeddings for every dataset + text embeddings for zero-shot prompts.
// usage: node clip.mjs <out.jsonl> <text.json>
import { env, AutoProcessor, AutoTokenizer, CLIPVisionModelWithProjection, CLIPTextModelWithProjection, RawImage } from '@huggingface/transformers';
import fs from 'node:fs';
import path from 'node:path';

env.localModelPath = path.resolve('models');
env.allowRemoteModels = false;
const id = 'Xenova/clip-vit-base-patch32';
const [OUT, TEXT] = process.argv.slice(2);

const CONCEPTS = {
    plastic: ['a plastic bottle', 'a plastic bag', 'a plastic cup', 'plastic packaging'],
    metal: ['an aluminum drink can', 'a metal can', 'a tin can'],
    paper: ['a piece of paper', 'a cardboard box', 'a paper cup', 'a paper carton'],
    glass: ['a glass bottle', 'a glass jar'],
    organic: ['food scraps', 'vegetable peels', 'a fruit peel', 'leaves and plant waste', 'leftover food'],
    general: ['a snack wrapper', 'a styrofoam food box', 'a used tissue', 'a piece of old cloth', 'mixed garbage']
};
const TEMPLATES = ['a photo of {}.', 'a photo of {}, a piece of trash.', 'a close-up photo of {} thrown away.'];
const norm = v => { const n = Math.hypot(...v); return v.map(x => x / n); };

const tok = await AutoTokenizer.from_pretrained(id);
const textModel = await CLIPTextModelWithProjection.from_pretrained(id, { dtype: 'fp32' });
const text = {};
for (const [c, words] of Object.entries(CONCEPTS)) {
    const prompts = words.flatMap(w => TEMPLATES.map(t => t.replace('{}', w)));
    const { text_embeds } = await textModel(tok(prompts, { padding: true, truncation: true }));
    const rows = text_embeds.tolist().map(norm);
    text[c] = norm(rows[0].map((_, i) => rows.reduce((s, r) => s + r[i], 0) / rows.length));
}
fs.writeFileSync(TEXT, JSON.stringify(text));

const proc = await AutoProcessor.from_pretrained(id);
const vis = await CLIPVisionModelWithProjection.from_pretrained(id, { dtype: 'fp32' });
const SETS = [
    ['alphatrash', '/home/user/data/alphatrash-dataset/trash_dataset', true],
    ['trashnet', '/home/user/data/trashnet/x/dataset-resized', false],
    ['realwaste', '/home/user/data/realwaste/RealWaste', false]
];
const SKIP = (process.env.SKIP || '').split(',');
const out = fs.openSync(OUT, 'a');
for (const [ds, root, splits] of SETS) {
    if (SKIP.includes(ds)) continue;
    const jobs = [];
    for (const split of splits ? ['train', 'val', 'test'] : ['all']) {
        const base = splits ? path.join(root, split) : root;
        for (const cls of fs.readdirSync(base).sort().filter(c => fs.statSync(path.join(base, c)).isDirectory()))
            for (const f of fs.readdirSync(path.join(base, cls)).sort())
                if (/\.(jpe?g|png)$/i.test(f)) jobs.push({ split, cls, file: f, p: path.join(base, cls, f) });
    }
    for (let i = 0; i < jobs.length; i += 32) {
        const chunk = jobs.slice(i, i + 32);
        const imgs = await Promise.all(chunk.map(j => RawImage.read(j.p)));
        const { image_embeds } = await vis(await proc(imgs));
        image_embeds.tolist().forEach((e, k) => {
            const j = chunk[k];
            fs.writeSync(out, JSON.stringify({ ds, split: j.split, cls: j.cls, file: j.file, e: norm(e).map(v => +v.toFixed(5)) }) + '\n');
        });
        if (i % 640 === 0) console.log(ds, i, jobs.length);
    }
}
fs.closeSync(out);
console.log('done');
