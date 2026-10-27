// BeeManager Pro — service worker (offline support)
//
// Strategy:
//  - On first open, caches all app files on the phone.
//  - App files (html/js/css): try the network first (so you always get
//    the latest version pushed to GitHub); if no signal within 3 seconds,
//    use the cached copy.
//  - Libraries (lib/) and icons: straight from cache (they don't change).
//  - Requests to other sites (Open-Meteo weather) are not touched.
//
// When you add a new file to the project, add it to the list below too.
// When you change the list, bump the number in CACHE.

var CACHE = "beemanager-v17";

var FILES = [
  "./",
  "index.html",
  "manifest.json",
  "css/style.css",
  "js/i18n.js",
  "js/core.js",
  "js/plants.js",
  "js/config.js",
  "js/weather.js",
  "js/nav.js",
  "js/dashboard.js",
  "js/hives.js",
  "js/inspections.js",
  "js/frames.js",
  "js/queens.js",
  "js/honey.js",
  "js/treatments.js",
  "js/inventory.js",
  "js/pastorage.js",
  "js/calendar.js",
  "js/analytics.js",
  "js/settings.js",
  "js/calculator.js",
  "js/devcalc.js",
  "js/nucs.js",
  "js/feeding.js",
  "js/tasks.js",
  "js/varroa.js",
  "js/treatvarroa.js",
  "js/finance.js",
  "js/export.js",
  "js/fisa.js",
  "js/app.js",
  "js/pwa.js",
  "lib/chart.umd.min.js",
  "lib/fonts/caveat-latin-600-normal.woff2",
  "lib/fonts/caveat-latin-ext-600-normal.woff2",
  "lib/fontawesome/css/all.min.css",
  "lib/fontawesome/webfonts/fa-solid-900.woff2",
  "lib/fontawesome/webfonts/fa-regular-400.woff2",
  "lib/fontawesome/webfonts/fa-brands-400.woff2",
  "lib/fontawesome/webfonts/fa-v4compatibility.woff2",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-192.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // cache: "reload" = fetch files from the server, not the browser cache
      return c.addAll(FILES.map(function (f) { return new Request(f, { cache: "reload" }); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k.indexOf("beemanager-") === 0 && k !== CACHE;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function fromCache(req) {
  return caches.match(req, { ignoreSearch: true }).then(function (r) {
    if (r) return r;
    // offline navigation to any app URL → index.html
    if (req.mode === "navigate") return caches.match("index.html");
    return Response.error();
  });
}

function networkFirst(req) {
  return new Promise(function (resolve) {
    var done = false;
    var timer = setTimeout(function () {
      if (!done) { done = true; resolve(fromCache(req)); }
    }, 3000);
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      if (!done) { done = true; clearTimeout(timer); resolve(res.ok ? res : fromCache(req)); }
    }).catch(function () {
      if (!done) { done = true; clearTimeout(timer); resolve(fromCache(req)); }
    });
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // weather etc. → straight to the network

  if (url.pathname.indexOf("/lib/") >= 0 || url.pathname.indexOf("/icons/") >= 0) {
    e.respondWith(caches.match(req).then(function (r) {
      return r || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      });
    }));
    return;
  }
  e.respondWith(networkFirst(req));
});
