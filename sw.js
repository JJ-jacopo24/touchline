/* =========================================================
   Service worker minimo di Touchline (blocco 2 PWA, gradino 2).
   Precache dei file di dist/ con bypass della cache HTTP
   ({cache:'reload'} in install), strategia cache-first, nome di
   cache con prefisso "touchline-" e pulizia filtrata per prefisso
   all'activate: Cache Storage è condiviso per tutta l'origine
   jj-jacopo24.github.io (non solo da Touchline), quindi la pulizia
   non cancella mai cache che non iniziano per questo prefisso.
   Nessuna interfaccia utente qui: solo la meccanica di cache. Il
   rilevamento di un aggiornamento e l'avviso "Aggiorna/Più tardi"
   sono un blocco successivo, non ancora scritto.
   BUILD_ID è iniettato da build.js (stesso meccanismo a placeholder
   usato per CSS e JS in index.html), calcolato sugli stessi file che
   questo file precarica più il proprio modello: vedi il commento su
   BUILD_ID in build.js.
   ========================================================= */
const BUILD_ID = "d477378593";
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
    caches.keys().then(function(nomi){
      return Promise.all(
        nomi
          .filter(function(nome){ return nome.indexOf(PREFISSO_CACHE) === 0 && nome !== CACHE_NAME; })
          .map(function(nome){ return caches.delete(nome); })
      );
    })
  );
});

self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function(cached){ return cached || fetch(event.request); })
  );
});
