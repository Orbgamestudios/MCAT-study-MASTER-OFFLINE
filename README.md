# MCAT Study — Offline PWA

An offline-capable build of the MCAT app. This is a **separate project** from the
live web app (`../Website`) so experiments here can't affect what's deployed.

## What's different from the live app

- **Vendored libraries** — React, React-DOM, Babel, and Tailwind are served from
  `vendor/` instead of CDNs, so the app loads with zero network. Re-download them
  with `vendor/refresh.ps1`.
- **Web app manifest** (`manifest.webmanifest`) — name, icons, standalone display.
- **Service worker** (`sw.js`) — precaches the app shell, vendored libs, and the
  runtime assets, then serves cache-first. This is what makes it work offline.

## What works offline (and what doesn't)

Offline you can use **everything you already downloaded while online**: cached
lessons, CARS sets, the question bank, quizzes, flashcards, and stats. What needs
a connection: **generating new content** (Gemini) and **cross-device sync / bank
downloads** (the Cloudflare worker). Those calls fail gracefully when offline.

## Run / test locally

```
node serve.js          # http://localhost:8765
```

To verify offline behaviour in Chrome: load the page once (lets the SW precache),
then DevTools → Application → Service Workers → check **Offline**, and reload — the
app should still boot. Or DevTools → Network → **Offline**.

## Install on iPhone (no App Store)

The app must be served over HTTPS for the service worker to register on a real
device (localhost is exempt, but your phone isn't on localhost). Easiest options:

1. Host the folder on any static HTTPS host (Cloudflare Pages, GitHub Pages,
   Netlify) — or run a local HTTPS tunnel (e.g. `cloudflared tunnel`).
2. On the iPhone, open the URL in **Safari** → Share → **Add to Home Screen**.
3. Open it **once while online** so the service worker caches the shell.
4. After that it launches fullscreen and works in Airplane Mode.

> Note: iOS renders all web content with WebKit, so the liquid-glass refraction
> is the same here as in Safari (the `url()` backdrop-filter is dropped on iOS).
> Genuinely better glass would require a native rewrite — see
> `../Website/FABLE5_LIQUID_GLASS.md`.

## Updating after an app.js change

Bump **both** the `?v=` query on the `app.js` `<script>` in `index.html` **and**
`CACHE_VERSION` in `sw.js` (and keep `APP_VERSION` in `sw.js` matching the `?v=`).
The new shell is picked up on the next launch.
