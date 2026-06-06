// 👇 NOVA SERIJA IGARA - KREĆEMO OD STOTKE 👇
const CACHE_NAME = 'potraga-oflajn-v100.10'; 
// 👆 ----------------------------------------------------------- 👆

const OBAVEZNI_FAJLOVI = [
    './',
    './index.html',
    './manifest.json',
    './logo_test.png'
];

// 1. INSTALACIJA: Čim legne novi fajl, preuzmi ga odmah bez čekanja
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(OBAVEZNI_FAJLOVI).catch((err) => {
                console.log('Neki fajl fali na serveru, ali nastavljamo dalje...', err);
            });
        })
    );
    self.skipWaiting(); // Skok pravo u aktivaciju bez zadržavanja
});

// 2. AKTIVACIJA: Čim se novi digne, brišemo apsolutno sve prethodne verzije keša
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((listaKeševa) => {
            return Promise.all(
                listaKeševa.map((keš) => {
                    if (keš.startsWith('potraga-oflajn') && cacheWhitelist.indexOf(keš) === -1) {
                        console.log('Brisanje starog keša:', keš);
                        return caches.delete(keš);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Istog trenutka preuzmi kontrolu nad aplikacijom
    );
});

/////////// "Network First" strategija
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    if (event.request.url.includes('firestore.googleapis.com') || 
        event.request.url.includes('identitytoolkit.googleapis.com') || 
        event.request.url.includes('firebase')) {
        return; 
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const klon = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, klon);
                });
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then((res) => {
                    if (res) return res;
                    return new Response('', { status: 404, statusText: 'Not Found' });
                });
            })
    );
});
