/* =========================================================
   Service worker minimo di Touchline (blocco 2 PWA, gradino 2).
   Precache dei file di dist/ con bypass della cache HTTP
   ({cache:'reload'} in install), strategia cache-first, nome di
   cache con prefisso "touchline-" e pulizia filtrata per prefisso
   all'activate: Cache Storage è condiviso per tutta l'origine
   jj-jacopo24.github.io (non solo da Touchline), quindi la pulizia
   non cancella mai cache che non iniziano per questo prefisso.
   Nessuna interfaccia utente qui: solo la meccanica di cache e,
   dal gradino 4, il minimo necessario per farsi attivare su
   richiesta esplicita della pagina (messaggio SKIP_WAITING) e
   prenderne davvero il controllo (clients.claim(), altrimenti
   controllerchange non scatterebbe mai per una pagina già aperta,
   prima di un reload vero).
   BUILD_ID è iniettato da build.js (stesso meccanismo a placeholder
   usato per CSS e JS in index.html), calcolato sugli stessi file che
   questo file precarica più il proprio modello: vedi il commento su
   BUILD_ID in build.js.
   ========================================================= */
const BUILD_ID = "9d5d09e922";
const CACHE_NAME = 'touchline-cache-' + BUILD_ID;
const PREFISSO_CACHE = 'touchline-';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return Promise.all(PRECACHE_URLS.map(function(url){
        return fetch(url, { cache: 'reload' }).then(function(resp){
          if(!resp.ok) throw new Error('precache fallito: ' + url + ' (' + resp.status + ')');
          return cache.put(url, resp);
        });
      }));
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    Promise.all([
      caches.keys().then(function(nomi){
        return Promise.all(
          nomi
            .filter(function(nome){ return nome.indexOf(PREFISSO_CACHE) === 0 && nome !== CACHE_NAME; })
            .map(function(nome){ return caches.delete(nome); })
        );
      }),
      // senza questo, un worker attivato con skipWaiting() non prende il controllo delle
      // pagine già aperte finché non navigano di nuovo: controllerchange (gradino 4, l'avviso
      // "Aggiorna" lo attende prima di ricaricare) non scatterebbe mai per la pagina corrente.
      self.clients.claim()
    ])
  );
});

// Messaggio dalla pagina (gradino 4, avviso "Aggiornamento disponibile", pulsante "Aggiorna"):
// solo il tipo esatto SKIP_WAITING fa attivare subito il worker in attesa. skipWaiting() è un
// metodo del worker stesso, richiamabile solo da qui dentro, mai dalla pagina.
self.addEventListener('message', function(event){
  if(event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function(cached){ return cached || fetch(event.request); })
  );
});
