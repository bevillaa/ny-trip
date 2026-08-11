// ==========================================
// 🗽 NY TRIP
// Service Worker
// SIN CACHÉ
// ==========================================


// ==========================================
// INSTALAR
// ==========================================

self.addEventListener("install", (event) => {

    // Activar inmediatamente la nueva versión
    self.skipWaiting();

});


// ==========================================
// ACTIVAR
// ==========================================

self.addEventListener("activate", (event) => {

    event.waitUntil(

        caches.keys()
            .then((cacheNames) => {

                // Borrar TODAS las cachés antiguas
                return Promise.all(

                    cacheNames.map((cacheName) => {

                        return caches.delete(cacheName);

                    })

                );

            })
            .then(() => {

                // Tomar el control inmediatamente
                return self.clients.claim();

            })

    );

});


// ==========================================
// PETICIONES
// ==========================================

self.addEventListener("fetch", (event) => {

    // NO usamos caché.
    // Todas las peticiones van directamente
    // a GitHub Pages.

    event.respondWith(

        fetch(event.request)

    );

});
