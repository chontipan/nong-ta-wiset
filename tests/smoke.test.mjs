// Smoke test: opens the real page in Chromium with a fake camera and checks that
// it starts without JavaScript errors, the AI loads, and the camera watchdog works.
// Run with: npm run test:smoke
//
// Writes to the live Firestore are blocked, so this test never touches real data.
// LIBS_DIR (optional): a folder with node_modules/firebase@10.8.0 for machines
// that can't reach the Firebase CDN.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const PORT = 8090 + Math.floor(Math.random() * 500);
const BASE = `http://127.0.0.1:${PORT}`;
let server;
let browser;

before(async () => {
    server = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
    for (let i = 0; i < 50; i++) {
        try { if ((await fetch(BASE)).ok) break; } catch { /* not up yet */ }
        await new Promise(r => setTimeout(r, 100));
    }
    browser = await chromium.launch({
        executablePath: process.env.CHROMIUM_PATH || undefined,
        args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
    });
});

after(async () => {
    await browser?.close();
    server?.kill();
});

async function openPage(url, configureContext) {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    await context.grantPermissions(['camera'], { origin: BASE });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));

    // Never write to the real database from a test
    await page.route(/firestore\.googleapis\.com/, r => r.abort());

    const libs = process.env.LIBS_DIR;
    if (libs) {
        const serve = file => existsSync(file)
            ? r => r.fulfill({ path: file, contentType: 'text/javascript' })
            : r => r.abort();
        await page.route(/cdn\.jsdelivr\.net\/npm\//, r => {
            const m = new URL(r.request().url()).pathname.match(/^\/npm\/(@[^/]+\/[^@/]+|[^@/]+)@[^/]+\/(.*)$/);
            return serve(m ? path.join(libs, 'node_modules', m[1], m[2]) : '')(r);
        });
        await page.route(/www\.gstatic\.com\/firebasejs\//, r =>
            serve(path.join(libs, 'node_modules/firebase', path.basename(new URL(r.request().url()).pathname)))(r));
        await page.route(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/, r => r.fulfill({ body: '' }));
    }

    await configureContext?.(context);
    await page.goto(url);
    return { page, errors };
}

test('page loads, AI starts, no JavaScript errors', async () => {
    const { page, errors } = await openPage(`${BASE}/?kiosk=smoke-test`);
    await page.waitForFunction(() => document.getElementById('aiStatusText')?.innerText.includes('พร้อม'), null, { timeout: 120000 });
    assert.match(await page.locator('#firebaseStatusText').innerText(), /smoke-test/);
    assert.equal(await page.locator('#trainerModalBackdrop, input[type=file]').count(), 0);
    const prediction = await page.evaluate(async () => {
        const engine = new RecycleNet();
        await engine.load();
        return engine.predict(document.getElementById('webcam'), true);
    });
    assert.match(prediction.label, /^(cardboard|glass|metal|paper|plastic|trash)$/);
    assert.ok(prediction.score >= 1 / 6 && prediction.score <= 1);
    assert.deepEqual(errors, []);
    await page.context().close();
});

test('camera watchdog reconnects a camera that stopped', async () => {
    const { page, errors } = await openPage(BASE);
    await page.waitForFunction(() => document.getElementById('webcam')?.srcObject?.active, null, { timeout: 30000 });
    // Simulate the camera being unplugged
    await page.evaluate(() => {
        window.__oldStream = document.getElementById('webcam').srcObject;
        window.__oldStream.getVideoTracks().forEach(t => t.stop());
    });
    await page.waitForFunction(() => {
        const s = document.getElementById('webcam').srcObject;
        return s && s !== window.__oldStream && s.getVideoTracks()[0]?.readyState === 'live';
    }, null, { timeout: 15000 });
    assert.deepEqual(errors, []);
    await page.context().close();
});

test('camera scan records only the bin confirmed by the user', async () => {
    const { page, errors } = await openPage(BASE);
    await page.waitForFunction(() => document.getElementById('aiStatusText').innerText.includes('พร้อม')
        && document.getElementById('webcam').readyState === 4);
    // A fake camera has no stable target class. Control only the model output for this UI test.
    await page.evaluate(() => {
        RecycleNet.prototype.predict = async () => ({ label: 'plastic', score: 0.95, margin: 0.8 });
    });
    await page.locator('#snapshotBtn').click();
    await page.locator('#scanConfirm').waitFor({ state: 'visible' });
    await page.locator('#scanConfirm button[value=cancel]').click();
    assert.match(await page.locator('#resultModalBackdrop').getAttribute('class'), /hidden/);
    await page.locator('#snapshotBtn').click();
    await page.locator('#scanConfirmBin').selectOption('hazardous');
    await page.locator('#scanConfirm button[value=save]').click();
    await page.locator('#scanConfirm').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.getElementById('scanConfirm').returnValue === 'save');
    await page.locator('#resultModalBackdrop:not(.hidden)').waitFor({ state: 'visible', timeout: 3000 });
    assert.match(await page.locator('#modalCategoryPill').innerText(), /ขยะอันตราย/);
    assert.deepEqual(errors, []);
    await page.context().close();
});

test('uncertain scan lets the user choose a bin without rescanning', async () => {
    const { page, errors } = await openPage(BASE);
    await page.waitForFunction(() => document.getElementById('aiStatusText').innerText.includes('พร้อม')
        && document.getElementById('webcam').readyState === 4);
    await page.evaluate(() => {
        RecycleNet.prototype.predict = async () => ({ label: 'plastic', score: 0.5, margin: 0.1 });
    });
    await page.locator('#snapshotBtn').click();
    const save = page.locator('#scanConfirm button[value=save]');
    await save.waitFor({ state: 'visible' });
    assert.equal(await save.isDisabled(), true);
    await page.locator('#scanConfirmBin').selectOption('hazardous');
    await save.click();
    await page.locator('#resultModalBackdrop:not(.hidden)').waitFor({ state: 'visible' });
    assert.match(await page.locator('#modalCategoryPill').innerText(), /ขยะอันตราย/);
    assert.deepEqual(errors, []);
    await page.context().close();
});

test('stalled model download leaves the loading state while the camera stays live', async () => {
    const { page, errors } = await openPage(BASE, async context => {
        await context.addInitScript(() => {
            const nativeTimeout = AbortSignal.timeout.bind(AbortSignal);
            AbortSignal.timeout = ms => nativeTimeout(ms === 12000 ? 250 : ms);
        });
        await context.route('**/models/recyclenet-small.onnx', () => {});
    });
    await page.waitForFunction(() => document.getElementById('aiStatusText').innerText.includes('ข้อผิดพลาด'));
    assert.equal(await page.locator('#webcam').evaluate(v => v.srcObject.active), true);
    assert.deepEqual(errors, []);
    await page.context().close();
});

test('material helper only changes predictions when glass and plastic are the uncertain top pair', async () => {
    const { page, errors } = await openPage(BASE);
    const { uncertainPair, confidentGlass, plasticThird, otherPair, lowerThreshold } = await page.evaluate(async () => {
        const engine = new RecycleNet();
        const image = document.createElement('canvas');
        image.width = image.height = 224;
        async function score(probabilities, confidence = 0.65) {
            engine.session = { run: async () => ({
                logits: { data: Float32Array.from(probabilities, Math.log) },
                material_log_odds: { data: [8] }
            }) };
            return engine.predict(image, true, confidence, 0.15);
        }
        return {
            uncertainPair: await score([.03, .58, .02, .02, .32, .03]),
            confidentGlass: await score([.03, .81, .02, .02, .09, .03]),
            plasticThird: await score([.13, .68, .02, .02, .12, .03]),
            otherPair: await score([.47, .02, .02, .43, .03, .03]),
            lowerThreshold: await score([.03, .58, .02, .02, .32, .03], .5)
        };
    });
    assert.equal(uncertainPair.label, 'plastic');
    assert.ok(uncertainPair.score > .65 && uncertainPair.margin > .15);
    assert.equal(confidentGlass.label, 'glass');
    assert.equal(plasticThird.label, 'glass');
    assert.equal(otherPair.label, 'cardboard');
    assert.equal(lowerThreshold.label, 'glass');
    assert.deepEqual(errors, []);
    await page.context().close();
});

test('glass and plastic can suggest one recycling bin while hazardous stays selectable', async () => {
    const { page, errors } = await openPage(BASE);
    await page.waitForFunction(() => document.getElementById('aiStatusText').innerText.includes('พร้อม')
        && document.getElementById('webcam').readyState === 4);
    await page.evaluate(() => {
        RecycleNet.prototype.predict = async () => ({
            label: 'glass', score: .43, margin: .04, recyclablePairScore: .82, outsidePairScore: .1
        });
    });
    await page.locator('#snapshotBtn').click();
    const select = page.locator('#scanConfirmBin');
    await select.waitFor({ state: 'visible' });
    assert.deepEqual(await select.locator('option').evaluateAll(options => options.map(o => o.value)),
        ['', 'recyclable', 'hazardous', 'general']);
    assert.equal(await select.inputValue(), 'recyclable');
    await page.locator('#scanConfirm button[value=save]').click();
    await page.locator('#resultModalBackdrop:not(.hidden)').waitFor({ state: 'visible' });
    const row = await page.evaluate(() => JSON.parse(localStorage.getItem('ecoscan_history'))[0]);
    assert.equal(row.type, 'recyclable');
    assert.deepEqual(errors, []);
    await page.context().close();
});
