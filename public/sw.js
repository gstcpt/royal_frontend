const CACHE_NAME = 'royal-erp-pos-v1';
const PRECACHE_URLS = ['/dashboard/pos', '/manifest.webmanifest', '/icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => null))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never serve stale API mutations or sensitive JSON caches; fallback gracefully if offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).catch(() =>
        new Response(
          JSON.stringify({ offline: true, message: 'Connexion perdue — Mode hors-ligne POS actif.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    return;
  }

  // Static Next.js chunks & icons: Cache-First with network refresh
  if (url.pathname.startsWith('/_next/static/') || url.pathname === '/icon.png') {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        });
      }),
    );
    return;
  }

  // HTML navigations (e.g. /dashboard/pos): Network-First falling back to cached shell
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/dashboard/pos'))),
    );
  }
});
