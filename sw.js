// Service Worker — Padrão Elétrica
// Necessário para o navegador permitir "Instalar app" / "Adicionar à tela inicial".
// Faz cache básico do "casco" do app (HTML/ícones) para abrir mais rápido;
// os dados (agendamentos, serviços etc) sempre vêm frescos do Supabase, nunca do cache.

const CACHE_NAME = 'padrao-eletrica-v1';
const ARQUIVOS_CASCO = [
  './app-cliente.html',
  './GERENCIAMENTO-PADRAOELETRICA_APP.html',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS_CASCO)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Estratégia: network-first para HTML (sempre tenta buscar a versão mais nova),
// cache-first para o resto (ícones etc). Nunca intercepta chamadas ao Supabase.
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (url.includes('supabase.co')) return; // nunca cachear dados da API

  if (event.request.mode === 'navigate' || url.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
