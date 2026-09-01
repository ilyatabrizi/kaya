// Service worker.
//
// The shell — HTML, CSS, modules, fonts, the mark — is precached so the app
// opens instantly and works with no signal. Photographs and the hero video are
// cached as they are used, because precaching 3MB of media on first visit is
// exactly the thing that makes a phone on a Tabriz 4G connection give up.

const VERSION = 'kaya-v1';
const SHELL = `${VERSION}-shell`;
const MEDIA = `${VERSION}-media`;

const PRECACHE = [
  './',
  'index.html',
  '404.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js',
  'js/router.js',
  'js/store.js',
  'js/ui.js',
  'js/util.js',
  'js/icons.js',
  'js/config.js',
  'js/data.js',
  'js/photos.js',
  'js/hero.js',
  'js/hero-manifest.js',
  'js/install.js',
  'js/views/home.js',
  'assets/brand/wordmark.svg',
  'assets/brand/mark.svg',
  'assets/fonts/IRANYekanXFaNum-Regular.woff2',
  'assets/fonts/IRANYekanXFaNum-Medium.woff2',
  'assets/fonts/IRANYekanXFaNum-DemiBold.woff2',
  'assets/fonts/IRANYekanXFaNum-Bold.woff2',
  'assets/hero/poster.webp',
  'assets/icons/icon-192.png',
  'assets/icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    // One failed URL must not fail the whole install.
    await Promise.all(PRECACHE.map((u) => c.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

const isMedia = (url) =>
  /\/assets\/(photos|hero)\//.test(url.pathname) || /\.(webp|mp4|jpg|png)$/.test(url.pathname);

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // Navigations: network first so a redeploy is picked up, cache as the net.
  if (request.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        const c = await caches.open(SHELL);
        c.put('index.html', fresh.clone());
        return fresh;
      } catch {
        return (await caches.match('index.html')) || (await caches.match('./'))
          || Response.error();
      }
    })());
    return;
  }

  // Media: cache first, and range requests go straight to the network — a
  // partial response must never be stored as if it were the whole file.
  if (isMedia(url)) {
    if (request.headers.has('range')) return;
    e.respondWith((async () => {
      const hit = await caches.match(request);
      if (hit) return hit;
      try {
        const res = await fetch(request);
        if (res.ok && res.status === 200) {
          const c = await caches.open(MEDIA);
          c.put(request, res.clone());
        }
        return res;
      } catch {
        return hit || Response.error();
      }
    })());
    return;
  }

  // Everything else (shell): cache first, refreshed in the background.
  e.respondWith((async () => {
    const hit = await caches.match(request);
    const net = fetch(request).then((res) => {
      if (res.ok) caches.open(SHELL).then((c) => c.put(request, res.clone()));
      return res;
    }).catch(() => null);
    return hit || (await net) || Response.error();
  })());
});
