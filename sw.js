const CACHE_NAME = 'biblia-bilingue-v57';
const DATA_CACHE = 'biblia-bilingue-data-1';
const BASE = new URL('./', self.location.href).href;
const DATA_URL = new URL('data/bible-combined.json', BASE).href;
const SHELL = [
    '',
    'index.html',
    'css/style.css',
    'js/app.js',
    'manifest.json',
    'icons/icon-192.png',
    'icons/icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(SHELL.map(a => new URL(a, BASE).href)))
            .then(() => self.skipWaiting())
    );
});

async function ensureDataCached() {
    try {
        const cache = await caches.open(DATA_CACHE);
        if (await cache.match(DATA_URL)) return true;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const response = await fetch(DATA_URL, { cache: 'no-store' });
                if (!response.ok) throw new Error('HTTP ' + response.status);
                await cache.put(DATA_URL, response);
                return true;
            } catch (e) {
                if (attempt < 3) await new Promise(r => setTimeout(r, 1500 * attempt));
            }
        }
    } catch (e) { }
    return false;
}

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => key !== CACHE_NAME && key !== DATA_CACHE)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
            .then(() => ensureDataCached())
    );
});

async function fetchAndCache(request, cacheName) {
    const response = await fetch(request);
    if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(cacheName).then(cache => cache.put(request, clone));
    }
    return response;
}

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;
    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;
            const isData = request.url.indexOf('bible-combined.json') >= 0;
            return fetchAndCache(request, isData ? DATA_CACHE : CACHE_NAME).catch(() => {
                if (request.mode === 'navigate') {
                    return caches.match(new URL('index.html', BASE).href);
                }
                return Response.error();
            });
        })
    );
});
