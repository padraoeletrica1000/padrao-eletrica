// ============================================================
// SERVICE WORKER – Padrão Elétrica
// Versão: mude este número toda vez que subir arquivos novos!
// ============================================================
const CACHE_VERSION = 'padrao-eletrica-v3';

const ARQUIVOS_CACHE = [
  './',
  './app-cliente.html',
  './GERENCIAMENTO-PADRAOELETRICA_APP.html',
  './manifest-cliente.json',
  './manifest-admin.json',
  './icon-192.png',
  './icon-512.png',
  './icon-32.png',
  './icon-maskable-512.png'
];

// ── INSTALL: baixa todos os arquivos e salva no cache novo ──
self.addEventListener('install', event => {
  console.log('[SW] Instalando versão:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(ARQUIVOS_CACHE);
    }).then(() => {
      // Força ativação imediata sem esperar o app fechar
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE: apaga caches antigos ──
self.addEventListener('activate', event => {
  console.log('[SW] Ativando versão:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_VERSION)
          .map(name => {
            console.log('[SW] Deletando cache antigo:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Toma controle de todas as abas abertas imediatamente
      return self.clients.claim();
    }).then(() => {
      // Avisa todas as abas para recarregar
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          client.postMessage({ tipo: 'ATUALIZADO', versao: CACHE_VERSION });
        });
      });
    })
  );
});

// ── FETCH: serve do cache, busca na rede se não tiver ──
self.addEventListener('fetch', event => {
  // Ignora requisições que não sejam GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(respostaCache => {
      if (respostaCache) {
        // Encontrou no cache — serve imediatamente
        // E em paralelo atualiza o cache em background
        const fetchAtualizado = fetch(event.request).then(respostaRede => {
          if (respostaRede && respostaRede.status === 200) {
            caches.open(CACHE_VERSION).then(cache => {
              cache.put(event.request, respostaRede.clone());
            });
          }
          return respostaRede;
        }).catch(() => respostaCache);

        return respostaCache;
      }

      // Não está no cache — busca na rede e salva
      return fetch(event.request).then(respostaRede => {
        if (!respostaRede || respostaRede.status !== 200) {
          return respostaRede;
        }
        const respostaClonar = respostaRede.clone();
        caches.open(CACHE_VERSION).then(cache => {
          cache.put(event.request, respostaClonar);
        });
        return respostaRede;
      }).catch(() => {
        // Offline e não tem cache — retorna página de fallback
        return new Response(
          `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
          <title>Sem conexão</title>
          <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#0f0c29;color:#fff;flex-direction:column;gap:16px;}
          h2{color:#f0c040;}p{color:rgba(255,255,255,0.6);text-align:center;}</style></head>
          <body><h2>⚡ Padrão Elétrica</h2><p>Você está offline.<br>Verifique sua conexão e tente novamente.</p></body></html>`,
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      });
    })
  );
});
