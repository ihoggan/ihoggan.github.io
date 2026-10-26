/* sw.js — offline support for ihoggan.github.io
   ------------------------------------------------------------
   What it does
   - On first visit, saves every guide, the stylesheet, the
     diagrams and the icons on this device.
   - Pages: tries the network first (so you see updates), and
     falls back to the saved copy when there's no signal.
   - Everything else: serves the saved copy at once, then quietly
     refreshes it in the background.
   - Fonts from Google are saved too, so pages look right offline.

   What it never does
   - No tracking, no accounts, no data sent anywhere.
   - Only GET requests are handled; nothing is ever posted.
   - Only this site and Google Fonts are saved. Anything else
     goes straight to the network as normal.

   Maintenance
   - After adding or renaming a page, run:
       python3 tools/build_offline.py
     It rebuilds the list below and bumps VERSION, which tells
     every visitor's browser to refresh its saved copy.
   ------------------------------------------------------------ */

// VERSION-START
const VERSION = 'site-0a94954758';
// VERSION-END

const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;
const FONTS = 'fonts-v1';
const OFFLINE_PAGE = 'offline.html';

// PRECACHE-START
const PRECACHE = [
  './',
  'Hustler.html',
  'Linux_Guide.html',
  'Python.html',
  'Raspberry_Pi.html',
  'Rocks_Minerals_Metals.html',
  'TradeWar.html',
  'about.html',
  'account-audit.html',
  'contact.html',
  'electronics-1.html',
  'electronics-2.html',
  'esp32-clock.html',
  'gallery.html',
  'github-setup.html',
  'index.html',
  'networking.html',
  'neural_playground.html',
  'next-word.html',
  'offline.html',
  'pi-gpio.html',
  'portfolio.html',
  'reclaim.html',
  'sdr.html',
  'secure-ubuntu.html',
  'terminal.html',
  'website.html',
  'word-map.html',
  'site.css',
  'manifest.webmanifest',
  'sw-register.js',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'images/esp32-battery-plan.svg',
  'images/esp32-plug-in.svg',
  'images/esp32-screen-map.svg',
];
// PRECACHE-END

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const NETWORK_TIMEOUT_MS = 4000;

// Save each file on its own, so one missing file can't stop the rest.
async function saveAll(list) {
  const pages = await caches.open(PAGES);
  const assets = await caches.open(ASSETS);
  const results = await Promise.allSettled(list.map(async (path) => {
    const res = await fetch(path, { cache: 'reload' });
    if (!res.ok) throw new Error(`${path}: ${res.status}`);
    const target = path.endsWith('.html') || path === './' ? pages : assets;
    await target.put(path, res);
  }));
  return {
    saved: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
  };
}

self.addEventListener('install', (event) => {
  event.waitUntil(saveAll(PRECACHE).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([PAGES, ASSETS, FONTS]);
    for (const name of await caches.keys()) {
      if (!keep.has(name)) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

// "Save every page now" button on offline.html
self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'save-all') return;
  event.waitUntil(saveAll(PRECACHE).then((summary) => {
    if (event.source) event.source.postMessage({ type: 'save-all-done', ...summary });
  }));
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); },
                 (e) => { clearTimeout(t); reject(e); });
  });
}

// Pages: network first, saved copy if offline, offline page as last resort.
async function handlePage(request) {
  const cache = await caches.open(PAGES);
  try {
    const res = await withTimeout(fetch(request), NETWORK_TIMEOUT_MS);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch (err) {
    const saved = await cache.match(request, { ignoreSearch: true })
               || await caches.match(request, { ignoreSearch: true });
    if (saved) return saved;
    const fallback = await cache.match(OFFLINE_PAGE);
    return fallback || new Response('Offline, and this page has not been saved yet.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

// Assets and fonts: saved copy now, refresh in the background.
async function handleAsset(request, cacheName) {
  const cache = await caches.open(cacheName);
  const saved = await cache.match(request, { ignoreSearch: cacheName !== FONTS });
  const refresh = fetch(request).then((res) => {
    if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
    return res;
  }).catch(() => null);
  return saved || (await refresh) || new Response('', { status: 504 });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (request.mode === 'navigate') {
      event.respondWith(handlePage(request));
    } else {
      event.respondWith(handleAsset(request, ASSETS));
    }
    return;
  }
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(handleAsset(request, FONTS));
  }
  // Anything else: not ours to handle, the browser carries on as normal.
});
