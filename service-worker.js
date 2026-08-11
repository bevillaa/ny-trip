```javascript
// ==========================================
// 🗽 NY TRIP
// SERVICE WORKER
// ==========================================

// Cambiamos el número de versión.
// Esto obliga al navegador a crear una caché nueva.

const CACHE_NAME = "ny-trip-v2";


// Archivos básicos de la aplicación.

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

self.addEventListener(
    "install",
    function (event) {

        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then(
                    function (cache) {

                        return cache.addAll(
                            FILES_TO_CACHE
                        );

                    }
                )

        );

        // Activar inmediatamente
        // la nueva versión.

        self.skipWaiting();
    }
);


// ==========================================
// ACTIVACIÓN
// ==========================================

self.addEventListener(
    "activate",
    function (event) {

        event.waitUntil(

            caches
                .keys()
                .then(
                    function (cacheNames) {

                        return Promise.all(

                            cacheNames
                                .filter(
                                    function (cacheName) {

                                        return (
                                            cacheName !==
                                            CACHE_NAME
                                        );

                                    }
                                )
                                .map(
                                    function (cacheName) {

                                        return caches.delete(
                                            cacheName
                                        );

                                    }
                                )

                        );

                    }
                )

        );

        // Tomar control inmediatamente.

        self.clients.claim();
    }
);


// ==========================================
// PETICIONES
// ==========================================

self.addEventListener(
    "fetch",
    function (event) {

        event.respondWith(

            fetch(event.request)
                .then(
                    function (response) {

                        // Si tenemos conexión,
                        // usamos la versión nueva.

                        return response;

                    }
                )
                .catch(
                    function () {

                        // Si no hay Internet,
                        // usamos la copia guardada.

                        return caches.match(
                            event.request
                        );

                    }
                )

        );

    }
);
```
