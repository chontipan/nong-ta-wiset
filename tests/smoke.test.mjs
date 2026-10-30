// Smoke test: opens the real page in Chromium with a fake camera and checks that
// it starts without JavaScript errors, the AI loads, and the camera watchdog works.
// Run with: npm run test:smoke
//
// Writes to the live Firestore are blocked, so this test never touches real data.
// LIBS_DIR (optional): a folder with node_modules for @tensorflow/tfjs, coco-ssd and
// firebase@10.8.0, for machines that can't reach the CDNs.
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

async function openPage(url) {
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

    await page.goto(url);
    return { page, errors };
}

test('page loads, AI starts, no JavaScript errors', async () => {
    const { page, errors } = await openPage(`${BASE}/?kiosk=smoke-test`);
    await page.waitForFunction(() => document.getElementById('aiStatusText')?.innerText.includes('พร้อม'), null, { timeout: 120000 });
    assert.match(await page.locator('#firebaseStatusText').innerText(), /smoke-test/);
    assert.equal(await page.locator('#trainerHiddenSection').count(), 1);
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

test('deleting a trained product hides it and it can be restored', async () => {
    const { page, errors } = await openPage(BASE);
    page.on('dialog', d => d.accept());
    await page.evaluate(() => {
        localStorage.setItem('ecoscan_custom_thai_products', JSON.stringify([{
            id: 'custom_smoke', name: 'สินค้าทดสอบ', bin: 'recyclable', shape: 'any',
            price: 'กก.ละ 3 บาท', estValue: 0.2, advice: 'ทดสอบ', image: null, images: [],
            timestamp: new Date().toISOString()
        }]));
    });
    await page.reload();
    await page.waitForSelector('.del-prod-btn[data-id="custom_smoke"]', { state: 'attached' });
    await page.evaluate(() => document.querySelector('.del-prod-btn[data-id="custom_smoke"]').click());
    await page.waitForSelector('#trainerHiddenSection:not(.hidden) .restore-prod-btn', { state: 'attached' });
    await page.evaluate(() => document.querySelector('.restore-prod-btn').click());
    await page.waitForSelector('.del-prod-btn[data-id="custom_smoke"]', { state: 'attached' });
    assert.equal(await page.locator('#trainerHiddenSection.hidden').count(), 1);
    assert.deepEqual(errors, []);
    await page.context().close();
});
