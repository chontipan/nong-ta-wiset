/* น้องตาวิเศษ - Service Worker
   Keeps the app, AI libraries and AI models on the device so a kiosk keeps
   working when the internet drops. Bump CACHE_VERSION when the cache rules change. */

const CACHE_VERSION = 'v1';
const APP_CACHE = `app-${CACHE_VERSION}`;
const LIB_CACHE = `libs-${CACHE_VERSION}`;

const APP_SHELL = [
    './',
    'index.html',
    'app.js',
    'ai-vision.js',
    'styles.css',
    'manifest.webmanifest',
    'icons/icon-192.png',
    'icons/icon-512.png'
];

// Versioned libraries, fonts and AI model files: they never change at the same URL
const LIB_HOSTS = [
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'storage.googleapis.com',
    'tfhub.dev',
    'www.kaggle.com'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(APP_CACHE)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys
                .filter(k => k !== APP_CACHE && k !== LIB_CACHE)
                .map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    // App files: try the network first so a new deploy shows up, fall back to the saved copy offline
    if (url.origin === self.location.origin) {
        event.respondWith(networkFirst(req, APP_CACHE));
        return;
    }

    // Libraries & models: use the saved copy, download once
    if (LIB_HOSTS.includes(url.hostname) || url.href.startsWith('https://www.gstatic.com/firebasejs/')) {
        event.respondWith(cacheFirst(req, LIB_CACHE));
        return;
    }

    // Your own Teachable Machine model: newest when online, saved copy when offline
    if (url.hostname === 'teachablemachine.withgoogle.com') {
        event.respondWith(networkFirst(req, LIB_CACHE));
    }
    // Everything else (Firestore, etc.) goes straight to the network
});

// Slow kiosk internet shouldn't freeze the screen: after a few seconds use the saved copy
const NETWORK_TIMEOUT_MS = 4000;

async function networkFirst(req, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedPromise = cache.match(req, { ignoreSearch: req.mode === 'navigate' })
        .then(hit => hit || (req.mode === 'navigate' ? cache.match('index.html') : undefined));
    const network = fetch(req).then(res => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
    });
    network.catch(() => {}); // a late failure after we answered from the cache is fine
    const cached = await cachedPromise;
    if (!cached) return network;
    const timeout = new Promise(resolve => setTimeout(() => resolve(null), NETWORK_TIMEOUT_MS));
    try {
        const res = await Promise.race([network, timeout]);
        return res || cached;
    } catch (err) {
        return cached;
    }
}

async function cacheFirst(req, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(req);
    if (cached) return cached;
    const res = await fetch(req);
    // Opaque (no-cors) responses are stored too, e.g. the icon font stylesheet
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
    return res;
}
