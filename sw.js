const CACHE_NAME = 'biblia-bilingue-v56';
const DATA_CACHE = 'biblia-bilingue-data-1';
const BASE = new URL('./', self.location.href).href;
const DATA_FILE = new URL('data/bible-combined.json', BASE).href;
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
        Promise.all([
            caches.open(CACHE_NAME).then(cache => {
                return cache.addAll(SHELL.map(a => new URL(a, BASE).href));
            }),
            caches.open(DATA_CACHE).then(async cache => {
                if (!(await cache.match(DATA_FILE))) {
                    await cache.add(DATA_FILE);
                }
            })
        ]).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME && key !== DATA_CACHE)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

async function fetchAndCache(request) {
    const response = await fetch(request);
    if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
    }
    return response;
}

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;
    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;
            return fetchAndCache(request).catch(() => {
                if (request.mode === 'navigate') {
                    return caches.match(new URL('index.html', BASE).href);
                }
                return Response.error();
            });
        })
    );
});
