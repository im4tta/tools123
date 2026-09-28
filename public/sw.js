// 123 Toolbox service worker — registered in production by components/AppRuntime.tsx.
//
// Strategy:
// - Page navigations: network first; a successful page is cached so it reopens offline.
// - /_next/static/* (content-hashed, immutable): cache first, so repeat visits and tools you
//   have already opened start instantly and keep working offline.
// - Icons and Google Fonts: cache first.
// - Everything else (RSC payloads, APIs, analytics, third-party data) is left to the network:
//   serving those stale after a deploy would mix builds.
const CACHE_VERSION = "v2";
const PAGE_CACHE = `toolbox123-pages-${CACHE_VERSION}`;
const STATIC_CACHE = `toolbox123-static-${CACHE_VERSION}`;
const FONT_CACHE = `toolbox123-fonts-${CACHE_VERSION}`;
const MAX_PAGES = 60;
const MAX_STATIC = 400;

const PRECACHE_URLS = ["/", "/manifest.webmanifest", "/favicon.ico", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  // Precache each URL on its own so one missing file cannot block installation.
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([PAGE_CACHE, STATIC_CACHE, FONT_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((key) => cache.delete(key)));
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      await cache.put(request, response.clone());
      void trim(PAGE_CACHE, MAX_PAGES);
    }
    return response;
  } catch (error) {
    const cached = (await cache.match(request, { ignoreSearch: true })) || (await cache.match("/"));
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") {
    await cache.put(request, response.clone());
    void trim(cacheName, max);
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate" && url.origin === self.location.origin) {
    event.respondWith(networkFirstPage(request));
    return;
  }
  if (url.hostname === "fonts.gstatic.com" || url.hostname === "fonts.googleapis.com") {
    event.respondWith(cacheFirst(request, FONT_CACHE, 60));
    return;
  }
  if (url.origin === self.location.origin && (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/"))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, MAX_STATIC));
  }
});
