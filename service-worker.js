// ==========================================
// 🗽 NY TRIP
// SERVICE WORKER
// SIN CACHÉ
// ==========================================

self.addEventListener(
    "install",
    () => {

        self.skipWaiting();

    }
);


self.addEventListener(
    "activate",
    async () => {

        await self.clients.claim();


        const cacheNames =
            await caches.keys();


        await Promise.all(
            cacheNames.map(
                cacheName =>
                    caches.delete(
                        cacheName
                    )
            )
        );

    }
);


// No interceptamos las peticiones.
// Todo se obtiene directamente de Internet.

self.addEventListener(
    "fetch",
    () => {

        // Sin caché.

    }
);
