// ==========================================
// 🗽 NY TRIP
// Service Worker
// ==========================================

const CACHE_NAME = "ny-trip-v2";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json"
];


// ==========================================
// INSTALAR
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
// ACTIVAR
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

    // Para páginas HTML intentamos primero Internet.
    // Así las actualizaciones de NY TRIP aparecen
    // sin tener que cambiar la URL.

    if (event.request.mode === "navigate") {

        event.respondWith(

            fetch(event.request)
                .then((response) => {

                    const responseClone =
                        response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {

                            cache.put(
                                event.request,
                                responseClone
                            );

                        });

                    return response;

                })
                .catch(() => {

                    return caches.match(
                        event.request
                    );

                })

        );

        return;

    }


    // Para archivos como CSS, JavaScript e imágenes:
    // usamos caché y, si no existe, Internet.

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
