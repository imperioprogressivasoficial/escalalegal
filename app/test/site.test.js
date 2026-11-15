// Site público: páginas com metas, robots, sitemap, llms, rastreio com consentimento e 404.
const test = require('node:test');
const assert = require('node:assert');

const pular = !process.env.DATABASE_URL && 'defina DATABASE_URL para rodar';
process.env.WEBHOOK_TOKEN ||= 'tk-teste';
process.env.ADMIN_PASS ||= 'adm-teste';
process.env.SESSION_SECRET ||= 'segredo-teste';
process.env.META_PIXEL_ID ||= '123456789';
process.env.GA_ID ||= 'G-TESTE123';
process.env.DOMAIN ||= 'escala.teste'; // liga o guarda anticlone (127.0.0.1 continua permitido)
const vm = require('node:vm');

test('site público pronto para busca, anúncios e LGPD', { skip: pular }, async t => {
  const { app, migrar, pool } = require('../server.js');
  await migrar();
  const srv = app.listen(0), base = `http://127.0.0.1:${srv.address().port}`;
  t.after(() => srv.close()); // o banco fecha no fim do último teste
  const get = async u => { const r = await fetch(base + u, { redirect: 'manual' }); return { status: r.status, tipo: r.headers.get('content-type') || '', txt: await r.text(), loc: r.headers.get('location') }; };

  const home = await get('/');
  assert.equal(home.status, 200);
  for (const x of ['<link rel="canonical"', 'og:image', 'twitter:card', '"@type":"SoftwareApplication"', '"@type":"FAQPage"', '/rastreio.js', 'href="/privacidade"', 'href="/termos"', 'Pular para o conteúdo'])
    assert.ok(home.txt.includes(x), 'falta na página de vendas: ' + x);
  assert.ok(!home.txt.includes('<!--HEAD-->') && !home.txt.includes('{{'), 'marcadores trocados');

  for (const u of ['/ajuda', '/privacidade', '/termos']) {
    const r = await get(u);
    assert.equal(r.status, 200, u); assert.ok(r.txt.includes('<link rel="canonical"'), u); assert.ok(!r.txt.includes('{{'), u);
  }
  const obr = await get('/obrigado');
  assert.ok(obr.txt.includes('noindex') && !obr.txt.includes('rel="canonical"') && obr.txt.includes("rastrear('Purchase'"));

  const robots = await get('/robots.txt');
  assert.match(robots.txt, /Disallow: \/app/); assert.match(robots.txt, /Sitemap: .*\/sitemap\.xml/);
  const mapa = await get('/sitemap.xml');
  assert.match(mapa.tipo, /xml/); assert.match(mapa.txt, /<loc>[^<]*\/ajuda<\/loc>/); assert.ok(!mapa.txt.includes('/app'));
  assert.match((await get('/llms.txt')).txt, /^# Sua Escala 5x2/);

  // rastreio: Pixel e GA só depois do "Aceitar"; consentimento do Google começa negado
  const r = (await get('/rastreio.js')).txt;
  assert.match(r, /"pixel":"123456789"/); assert.match(r, /"ga":"G-TESTE123"/);
  assert.match(r, /gtag\('consent','default',\{ad_storage:'denied'/);
  assert.ok(r.indexOf("fbq('init'") > r.indexOf('function carrega'), 'Pixel só dentro de carrega()');

  assert.equal((await get('/reembolso')).loc, '/termos#reembolso');
  const nao = await get('/pagina-que-nao-existe');
  assert.equal(nao.status, 404); assert.match(nao.tipo, /html/); assert.match(nao.txt, /não existe/);
  assert.equal((await get('/api/nada')).status, 404);
});

test('anticlone e proteção contra ataque', { skip: pular }, async t => {
  const { app, pool } = require('../server.js');
  const srv = app.listen(0), base = `http://127.0.0.1:${srv.address().port}`;
  t.after(async () => { srv.close(); await pool.end(); });
  let ip = 1;
  const req = async (u, o = {}) => {
    const r = await fetch(base + u, { method: o.method || 'GET', redirect: 'manual',
      headers: { 'x-forwarded-for': '10.55.0.' + (ip++ % 250), ...(o.body && { 'Content-Type': 'application/json' }), ...(o.h || {}) }, body: o.body && JSON.stringify(o.body) });
    return { status: r.status, h: r.headers, txt: await r.text() };
  };

  // cabeçalhos: sem iframe em outro site, CSP com o que a página usa
  const home = await req('/');
  assert.equal(home.h.get('x-frame-options'), 'DENY');
  const csp = home.h.get('content-security-policy');
  for (const x of ["frame-ancestors 'none'", "object-src 'none'", 'https://fonts.googleapis.com', 'https://connect.facebook.net', 'https://scripts.converteai.net', 'https://*.google-analytics.com'])
    assert.ok(csp.includes(x), 'falta na CSP: ' + x);
  assert.equal(home.h.get('x-content-type-options'), 'nosniff');

  // guarda e marca d'água na página
  const g = /<script data-g="([0-9a-f]+)">([\s\S]*?)<\/script>/.exec(home.txt);
  assert.ok(g, 'guarda anticlone na página de vendas');
  assert.ok(home.txt.includes(`data-se="${g[1]}"`) && home.txt.includes('original em https://escala.teste'), 'marca d\'água');
  assert.ok(!home.txt.includes('escala.teste",') && !/"escala\.teste"/.test(g[2]), 'domínio não aparece em texto puro no guarda');
  assert.ok(home.txt.indexOf('data-g=') < home.txt.indexOf('og:title'), 'guarda vem antes do resto do cabeçalho');
  assert.ok((await req('/rastreio.js')).txt.includes('__se5x2'), 'rastreio também confere o domínio');

  // o guarda roda: em outro domínio vai para o site real levando ?ind e utm; no domínio certo não faz nada
  const roda = (host, search = '', protocol = 'https:') => {
    let foi = null; const html = { style: {} };
    const w = { location: { hostname: host, search, protocol, replace: u => { foi = u; } } };
    vm.runInNewContext(g[2], { window: w, document: { documentElement: html }, URLSearchParams, atob: s => Buffer.from(s, 'base64').toString() });
    return { foi, escondeu: html.style.display === 'none', ok: w.__se5x2 };
  };
  let r = roda('clonado.com', '?ind=abc123&utm_source=fb&utm_campaign=x&outro=1');
  assert.equal(r.foi, 'https://escala.teste/?ind=abc123&utm_source=fb&utm_campaign=x'); assert.ok(r.escondeu); assert.equal(r.ok, 0);
  assert.equal(roda('', '', 'file:').foi, 'https://escala.teste/', 'página salva no computador também volta');
  for (const h of ['escala.teste', 'www.escala.teste', 'localhost', '127.0.0.1']) { r = roda(h); assert.equal(r.foi, null, h); assert.equal(r.ok, 1); }

  // copiadores de página barrados; buscadores, prévias de link e curl liberados; a API não é afetada
  for (const ua of ['Mozilla/4.5 (compatible; HTTrack 3.0x; Windows 98)', 'Wget/1.21.4', 'python-requests/2.31', 'Scrapy/2.11'])
    assert.equal((await req('/', { h: { 'user-agent': ua } })).status, 403, ua);
  for (const ua of ['Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'facebookexternalhit/1.1', 'WhatsApp/2.23', 'curl/8.5.0', 'Mozilla/5.0 (compatible; bingbot/2.0)'])
    assert.equal((await req('/', { h: { 'user-agent': ua } })).status, 200, ua);
  assert.equal((await req('/api/health', { h: { 'user-agent': 'Wget/1.21' } })).status, 200);
  assert.match((await req('/robots.txt', { h: { 'user-agent': 'HTTrack' } })).txt, /User-agent: HTTrack\nDisallow: \//);

  // imagens puxadas por página em outro domínio: bloqueadas (menos ícone e imagem de compartilhamento)
  assert.equal((await req('/img/iphone-escala.webp', { h: { referer: 'https://clonado.com/' } })).status, 403);
  assert.equal((await req('/img/iphone-escala.webp', { h: { referer: 'https://escala.teste/' } })).status, 200);
  assert.equal((await req('/img/iphone-escala.webp', { h: { referer: 'https://www.google.com/' } })).status, 200);
  assert.equal((await req('/img/iphone-escala.webp')).status, 200);
  assert.equal((await req('/img/og.png', { h: { referer: 'https://clonado.com/' } })).status, 200);

  // lead só do nosso formulário; POST de outro site barrado (CSRF); webhook continua sem Origin
  const lead = { nome: 'Teste', whatsapp: '71999990000', email: 'lead@t.com' };
  assert.equal((await req('/api/leads', { method: 'POST', body: lead })).status, 403, 'sem origem');
  assert.equal((await req('/api/leads', { method: 'POST', body: lead, h: { origin: 'https://clonado.com' } })).status, 403);
  assert.equal((await req('/api/leads', { method: 'POST', body: lead, h: { origin: 'https://escala.teste' } })).status, 200);
  assert.equal((await req('/api/leads', { method: 'POST', body: lead, h: { referer: base + '/' } })).status, 200);
  assert.equal((await req('/api/login', { method: 'POST', body: { email: 'x@t.com', senha: 'x' }, h: { origin: 'https://clonado.com' } })).status, 403);
  assert.equal((await req('/api/webhook/pagamento?token=errado', { method: 'POST', body: {} })).status, 401);

  // senha errada repetida: trava o e-mail por 15 minutos, mesmo com a senha certa
  const email = `trava${Date.now()}@t.com`;
  assert.equal((await req('/api/cadastro', { method: 'POST', body: { nome: 'Tavares', empresa: 'Trava', email, senha: 'senha123' } })).status, 200);
  for (let i = 0; i < 8; i++) assert.equal((await req('/api/login', { method: 'POST', body: { email, senha: 'errada' + i } })).status, 401);
  assert.equal((await req('/api/login', { method: 'POST', body: { email, senha: 'senha123' } })).status, 429);
  // e-mail que não existe responde igual
  assert.equal((await req('/api/login', { method: 'POST', body: { email: 'ninguem' + email, senha: 'x' } })).status, 401);

  // /admin: depois de 10 senhas erradas do mesmo IP, trava
  const h = { 'x-forwarded-for': '10.66.0.1', authorization: 'Basic ' + Buffer.from('admin:errada').toString('base64') };
  for (let i = 0; i < 10; i++) assert.equal((await fetch(base + '/api/admin/resumo', { headers: h })).status, 401);
  assert.equal((await fetch(base + '/api/admin/resumo', { headers: { ...h, authorization: 'Basic ' + Buffer.from('admin:' + process.env.ADMIN_PASS).toString('base64') } })).status, 429);
});
