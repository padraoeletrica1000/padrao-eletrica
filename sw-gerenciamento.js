// sw-gerenciamento.js
// Service worker mínimo — apenas para habilitar o critério de instalação do PWA.
// NÃO faz cache de arquivos nem de dados, propositalmente:
// este painel depende de dados em tempo real (Supabase), então cache agressivo
// poderia mostrar informações desatualizadas ou travar o app numa versão antiga.

self.addEventListener('install', (event) => {
  // Ativa o novo service worker imediatamente, sem esperar
  // a aba antiga fechar.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Assume o controle imediatamente das páginas abertas.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Sempre busca da rede, sem interceptar com cache.
  // Isso garante que o usuário sempre veja a versão e os dados mais recentes.
  event.respondWith(fetch(event.request));
});
