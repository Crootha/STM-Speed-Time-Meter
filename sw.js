/* Offline režim.
   Kód a styly bereme nejdřív ze sítě, aby po vydání nové verze nikdo nezůstal na staré;
   fonty a ikony se nemění, ty jedeme z cache. Bez sítě se vždy sáhne do cache. */
const VERSION = "tk-v2";
const SHELL = [
  "./", "./index.html", "./manifest.webmanifest", "./favicon.ico",
  "./src/styles.css", "./src/i18n.js", "./src/app.js",
  "./src/fonts/fonts.css",
  "./icons/icon.svg", "./icons/icon-192.png", "./icons/icon-512.png",
  "./icons/icon-maskable-192.png", "./icons/icon-maskable-512.png", "./icons/icon-180.png"
];
const IMMUTABLE = /\.(woff2|png|svg|ico)$/;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const keep = async (req, res) => {
  if (res.ok && new URL(req.url).origin === location.origin) {
    const copy = res.clone();
    (await caches.open(VERSION)).put(req, copy);
  }
  return res;
};

self.addEventListener("fetch", e => {
  const { request } = e;
  if (request.method !== "GET" || new URL(request.url).origin !== location.origin) return;

  if (IMMUTABLE.test(new URL(request.url).pathname)) {
    e.respondWith(caches.match(request).then(hit => hit || fetch(request).then(r => keep(request, r))));
    return;
  }

  e.respondWith(
    fetch(request)
      .then(r => keep(request, r))
      .catch(() => caches.match(request).then(hit => hit || caches.match("./index.html")))
  );
});
