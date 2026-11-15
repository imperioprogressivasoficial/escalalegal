// Service worker mínimo: deixa a Sua Escala Blindada ser instalada na tela inicial.
// Nada fica guardado no aparelho (a escala sempre vem do servidor). Sem internet, mostra um aviso simples.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => new Response(
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sem internet</title>' +
    '<body style="font:16px system-ui;padding:40px 24px;text-align:center;color:#0c1b33"><h1 style="font-size:22px">Sem internet</h1>' +
    '<p>Conecte o celular e toque em tentar de novo.</p><button onclick="location.reload()" style="font:600 16px system-ui;padding:12px 20px;border:0;border-radius:10px;background:#168821;color:#fff">Tentar de novo</button></body>',
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
});
