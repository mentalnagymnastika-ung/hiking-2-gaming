// 👇 OVO JE JEDINA LINIJA KOJU MIJENJAŠ KADA AŽURIRAŠ APLIKACIJU 👇
const CACHE_NAME = 'kreator-oflajn-v24';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((lista) => {
            return Promise.all(lista.map((kes) => {
                if (kes !== CACHE_NAME) {
                    return caches.delete(kes);
                }
            }));
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Preskačemo sve što nije GET zahtev ILI ne počinje sa http/https
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;
    
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
                // Ako mreža pukne, tražimo u kešu
                return caches.match(event.request).then((kesiranOdgovor) => {
                    // Ako smo našli fajl u kešu, vraćamo ga
                    if (kesiranOdgovor) {
                        return kesiranOdgovor;
                    }
                    
                    // Ako fajla NEMA ni u kešu, MORAMO da vratimo pravi Response
                    // kako bismo sprečili onu "Failed to convert value to 'Response'" grešku
                    return new Response('Nema fajla, nije keširan.', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
            })
    );
});