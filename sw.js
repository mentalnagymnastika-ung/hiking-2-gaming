// 👇 OVO JE JEDINA LINIJA KOJU MIJENJAŠ KADA AŽURIRAŠ APLIKACIJU 👇
// Kada promijeniš nešto u HTML-u ili manifest.json, promijeni broj ovdje (npr. u 'v12', pa 'v13'...)
const CACHE_NAME = 'potraga-oflajn-v31.51'; 
// 👆 ----------------------------------------------------------- 👆

// Kad se instalira, odmah preuzima kontrolu
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Brisanje starih duhova (Samo onih koji pripadaju ovoj aplikaciji)
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((listaKeševa) => {
            return Promise.all(
                listaKeševa.map((keš) => {
                    // Brišemo SAMO ako počinje sa 'potraga-oflajn', a nije trenutna verzija. 
                    // Na ovaj način ne diramo admin-cache!
                    if (keš.startsWith('potraga-oflajn') && cacheWhitelist.indexOf(keš) === -1) {
                        return caches.delete(keš);
                    }
                })
            );
        })
    );
});

/////////// MAGIJA: "Network First" strategija 
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // MAGIJA: Kažemo mu da ignoriše Firebase bazu i Google Auth. 
    // Ako ovo pokuša da kešira, aplikacija puca!
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
                    // Ovo sprečava "Failed to convert value to Response" grešku
                    return new Response('', { status: 404, statusText: 'Not Found' });
                });
            })
    );
});
