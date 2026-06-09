// Specifično ime keša za admina da se ne sudara sa običnim kreatorom
const CACHE_NAME = 'admin-cache-v31.34';

// Spisak fajlova koje želimo odmah da sačuvamo za oflajn rad
const urlsToCache = [
    './admin.html', 
    './admin-manifest.json',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://i.ibb.co/VYdS4Yr9/logo-ikona-removebg-preview.png',
    'https://i.ibb.co/ybWXLWh/location.png'
];

// 1. INSTALACIJA - Prvo preuzimanje fajlova u keš
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Admin SW: Fajlovi su uspešno keširani za oflajn rad.');
                return cache.addAll(urlsToCache);
            })
    );
});

// 2. AKTIVACIJA - Čišćenje starih verzija admin keša
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Brišemo samo ako pripada adminu, a nije trenutna verzija
                    if (cacheName.startsWith('admin-cache') && cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Admin SW: Brisanje starog keša', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 3. FETCH - Rad bez interneta (preskakanje Firebase-a)
self.addEventListener('fetch', event => {
    // Ne keširamo Firebase i Firestore pozive bazi
    if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('firebase')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Ako imamo fajl u kešu, vraćamo ga
                if (response) {
                    return response;
                }

                // Ako nema, preuzmi sa neta i dodaj u keš
                return fetch(event.request).then(
                    function(networkResponse) {
                        if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        var responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    }
                ).catch(() => {
                    console.log("Admin SW: Nema interneta i fajl nije u kešu.");
                });
            })
    );
});
