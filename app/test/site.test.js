// Site público: páginas com metas, robots, sitemap, llms, rastreio com consentimento e 404.
const test = require('node:test');
const assert = require('node:assert');

const pular = !process.env.DATABASE_URL && 'defina DATABASE_URL para rodar';
process.env.WEBHOOK_TOKEN ||= 'tk-teste';
process.env.ADMIN_PASS ||= 'adm-teste';
process.env.SESSION_SECRET ||= 'segredo-teste';
process.env.META_PIXEL_ID ||= '123456789';
process.env.GA_ID ||= 'G-TESTE123';

test('site público pronto para busca, anúncios e LGPD', { skip: pular }, async t => {
  const { app, migrar, pool } = require('../server.js');
  await migrar();
  const srv = app.listen(0), base = `http://127.0.0.1:${srv.address().port}`;
  t.after(async () => { srv.close(); await pool.end(); });
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
