/* MCAT Study — offline service worker.
 *
 * Caches the app shell + vendored libraries + runtime assets so the app boots
 * with no network. Content the user has already downloaded (lessons, CARS, the
 * question bank) lives in localStorage and is available offline automatically;
 * generating NEW content still needs a connection (Gemini), and those cross-
 * origin calls pass straight through to the network.
 *
 * ── Updating ──────────────────────────────────────────────────────────────
 * After changing app.js (or any precached file), bump BOTH:
 *   1. the ?v= query on the app.js <script> in index.html, and
 *   2. CACHE_VERSION below.
 * Bumping CACHE_VERSION drops the old cache on activate, so clients pick up
 * the new shell on their next launch. APP_VERSION must match index.html's ?v=.
 */
const CACHE_VERSION = 'v37';
const APP_VERSION = '204'; // keep in sync with app.js?v= in index.html
const CACHE = 'mcat-offline-' + CACHE_VERSION;

const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'MCAT_PASSAGE_GENERATION.md',
  'app.js?v=' + APP_VERSION,
  'app.legacy.js?v=' + APP_VERSION,
  'legacy-polyfills.js?v=' + APP_VERSION,
  'legacy-tailwind.css?v=' + APP_VERSION,
  'apple-touch-icon-v2.png',
  'icon-512-v2.png',
  'vendor/react.development.js',
  'vendor/react-dom.development.js',
  'vendor/babel.min.js',
  'vendor/tailwind.play.js',
  'assets/bird.png',
  'assets/correct.mp3',
  'assets/wrong.mp3',
  'assets/aa/145742.png', 'assets/aa/33032.png', 'assets/aa/5862.png',
  'assets/aa/5950.png', 'assets/aa/5951.png', 'assets/aa/5960.png',
  'assets/aa/5961.png', 'assets/aa/5962.png', 'assets/aa/6057.png',
  'assets/aa/6106.png', 'assets/aa/6137.png', 'assets/aa/6140.png',
  'assets/aa/6267.png', 'assets/aa/6274.png', 'assets/aa/6287.png',
  'assets/aa/6288.png', 'assets/aa/6305.png', 'assets/aa/6306.png',
  'assets/aa/6322.png', 'assets/aa/750.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // Best-effort per-file: one 404 shouldn't abort the whole install.
      .then((cache) => Promise.all(PRECACHE.map((url) =>
        cache.add(new Request(url, { cache: 'reload' })).catch((e) => {
          console.warn('[sw] precache miss:', url, e && e.message);
        })
      )))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Only the app's own origin is cached. Gemini + the Cloudflare sync/bank
  // worker are cross-origin and must always hit the network (and fail
  // gracefully offline, which the app already handles).
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // Runtime-cache anything same-origin we didn't precache (lazy assets).
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        // Offline and uncached: for page loads, fall back to the app shell.
        if (req.mode === 'navigate') return caches.match('index.html');
        return Response.error();
      });
    })
  );
});
