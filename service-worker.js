// ==========================================
// 🗽 NY TRIP
// Service Worker
// ==========================================

const CACHE_NAME = "ny-trip-v1";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json"
];


// ==========================================
// INSTALACIÓN
// ==========================================

self.addEventListener("install", (event) => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then((cache) => {

                return cache.addAll(FILES_TO_CACHE);

            })

    );

    self.skipWaiting();
});


// ==========================================
// ACTIVACIÓN
// ==========================================

self.addEventListener("activate", (event) => {

    event.waitUntil(

        caches.keys()
            .then((cacheNames) => {

                return Promise.all(

                    cacheNames
                        .filter((cacheName) => {
                            return cacheName !== CACHE_NAME;
                        })
                        .map((cacheName) => {
                            return caches.delete(cacheName);
                        })

                );

            })

    );

    self.clients.claim();
});


// ==========================================
// PETICIONES
// ==========================================

self.addEventListener("fetch", (event) => {

    event.respondWith(

        caches.match(event.request)
            .then((cachedResponse) => {

                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request);

            })

    );

});
