// 👇 OVO JE JEDINA LINIJA KOJU MIJENJAŠ KADA AŽURIRAŠ APLIKACIJU 👇
const CACHE_NAME = 'potraga-oflajn-v31.52'; 
// 👆 ----------------------------------------------------------- 👆

// Spisak ključnih fajlova koje aplikacija mora odmah da zapamti (uključujući novu JPG ikonicu)
const OBAVEZNI_FAJLOVI = [
    './',
    './index.html',
    './manifest.json',
    './logo_test.png'
];

// Kad se instalira, odmah preuzima kontrolu i kešira osnovne fajlove
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(OBABAVEZNI_FAJLOVI).catch((err) => {
                console.log('Neki fajl fali na serveru, ali nastavljamo dalje...', err);
            });
        })
    );
    self.skipWaiting();
});

// Brisanje starih verzija keša
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((listaKeševa) => {
            return Promise.all(
                listaKeševa.map((keš) => {
                    if (keš.startsWith('potraga-oflajn') && cacheWhitelist.indexOf(keš) === -1) {
                        return caches.delete(keš);
                    }
                })
            );
        })
    );
});

/////////// "Network First" strategija sa dinamičkim dopunjavanjem keša
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Ignorišemo Firebase i Google Auth da aplikacija ne puca
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
