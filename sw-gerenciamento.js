// sw-gerenciamento.js
// Service Worker do app "Padrão Elétrica – Gerenciamento de Serviços"
// Faz cache do "app shell" (HTML, manifest, ícones) para permitir abrir o app
// mesmo sem internet. Dados (Supabase) sempre precisam de rede — isso aqui
// só evita a tela branca quando o dispositivo está offline.
const CACHE_NAME = 'pe-gerenciamento-v3';
const APP_SHELL = [
  './GERENCIAMENTO-PADRAOELETRICA_APP.html',
  './manifest-gerenciamento.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Estratégia: network-first (rede primeiro) para tudo, com fallback pro
// cache apenas quando não há conexão. Assim, qualquer atualização feita no
// GitHub aparece já na próxima visita, sem precisar trocar o nome do cache
// manualmente toda vez. Nunca intercepta chamadas para o Supabase — essas
// sempre precisam ir direto pra rede.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.includes('supabase.co')) return; // nunca cachear dados do banco

  event.respondWith(
    fetch(req)
      .then((res) => {
        // só guarda respostas válidas do mesmo tipo básico
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      })
      .catch(() => caches.match(req)) // offline: usa o que tiver salvo
  );
});
