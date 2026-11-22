// Tests for firestore.rules. Run with: npm run test:rules (starts the Firestore emulator)
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import {
    initializeTestEnvironment, assertSucceeds, assertFails
} from '@firebase/rules-unit-testing';
import {
    doc, setDoc, getDoc, updateDoc, deleteDoc, addDoc, collection,
    serverTimestamp, increment
} from 'firebase/firestore';

let env;
let db;

before(async () => {
    env = await initializeTestEnvironment({
        projectId: 'demo-nong-ta-wiset',
        firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') }
    });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => {
    await env.clearFirestore();
    db = env.unauthenticatedContext().firestore(); // the app has no login
});

const scan = (extra = {}) => ({
    item: 'ขวด PET', bin: 'ถังขวดพลาสติก', type: 'plastic_bottle', confidence: '91%',
    timestamp: serverTimestamp(), timeString: '10:00:00', ...extra
});

const counts = (extra = {}) => ({
    total: increment(1), plastic_bottle: increment(1), recyclable: increment(0),
    general: increment(0), hazardous: increment(0), co2: increment(0.18),
    lastUpdated: serverTimestamp(), ...extra
});

// --- scans ---
test('scans: a normal scan with day and kiosk can be saved', async () => {
    await assertSucceeds(addDoc(collection(db, 'scans'), scan({ day: '2026-10-30', kiosk: 'ตลาดแม่จัน' })));
});

test('scans: older app versions without day/kiosk still work', async () => {
    await assertSucceeds(addDoc(collection(db, 'scans'), scan()));
});

test('scans: unknown fields, bad day and bad bin are refused', async () => {
    await assertFails(addDoc(collection(db, 'scans'), scan({ hacked: true })));
    await assertFails(addDoc(collection(db, 'scans'), scan({ day: 'yesterday' })));
    await assertFails(addDoc(collection(db, 'scans'), scan({ type: 'bomb' })));
});

test('scans: cannot be edited or deleted', async () => {
    const ref = doc(db, 'scans', 's1');
    await assertSucceeds(setDoc(ref, scan()));
    await assertFails(updateDoc(ref, { item: 'x' }));
    await assertFails(deleteDoc(ref));
});

// --- stats ---
test('stats: daily and per-kiosk counters can go up by one', async () => {
    await assertSucceeds(setDoc(doc(db, 'stats', '2026-10-30'), counts({ day: '2026-10-30' }), { merge: true }));
    await assertSucceeds(setDoc(doc(db, 'stats', '2026-10-30'), counts({ day: '2026-10-30' }), { merge: true }));
    await assertSucceeds(setDoc(doc(db, 'stats', '2026-10-30__main'),
        counts({ day: '2026-10-30', kiosk: 'main' }), { merge: true }));
    const snap = await assertSucceeds(getDoc(doc(db, 'stats', '2026-10-30')));
    if (snap.data().total !== 2) throw new Error('expected total 2, got ' + snap.data().total);
});

test('stats: jumps, decreases and mismatched ids are refused', async () => {
    await assertFails(setDoc(doc(db, 'stats', '2026-10-30'),
        counts({ day: '2026-10-30', total: increment(100) }), { merge: true }));
    await assertSucceeds(setDoc(doc(db, 'stats', '2026-10-30'), counts({ day: '2026-10-30' }), { merge: true }));
    await assertFails(setDoc(doc(db, 'stats', '2026-10-30'),
        counts({ day: '2026-10-30', total: increment(-1) }), { merge: true }));
    await assertFails(setDoc(doc(db, 'stats', '2026-10-30'), counts({ day: '2026-10-29' }), { merge: true }));
    await assertFails(setDoc(doc(db, 'stats', '2026-10-30__main'),
        counts({ day: '2026-10-30', kiosk: 'other' }), { merge: true }));
    await assertFails(setDoc(doc(db, 'stats', 'today'), counts({ day: '2026-10-30' }), { merge: true }));
    await assertFails(deleteDoc(doc(db, 'stats', '2026-10-30')));
});

test('retired training collection rejects client reads and image writes', async () => {
    const ref = doc(db, 'custom_thai_products', 'legacy');
    await assertFails(getDoc(ref));
    await assertFails(setDoc(ref, { image: 'data:image/jpeg;base64,example' }));
});

test('everything else is closed', async () => {
    await assertFails(setDoc(doc(db, 'secrets', 'x'), { a: 1 }));
    await assertFails(getDoc(doc(db, 'secrets', 'x')));
});
