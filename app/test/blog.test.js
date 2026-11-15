// Blog e gerador grátis no subdomínio: limites da lei no gerador, artigos, rotas pelo Host, sitemap,
// nada de redirecionar o blog, lead com consentimento, Google Ads e o aviso de cookies que aparece uma vez só.
const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const vm = require('node:vm');

process.env.WEBHOOK_TOKEN ||= 'tk-teste';
process.env.ADMIN_PASS ||= 'adm-teste';
process.env.SESSION_SECRET ||= 'segredo-teste';
process.env.META_PIXEL_ID ||= '123456789';
process.env.DOMAIN ||= 'escala.teste';
process.env.GOOGLE_ADS_ID ||= 'AW-1234567';
process.env.GOOGLE_ADS_CONVERSAO ||= 'gerouABC1';
const pular = !process.env.DATABASE_URL && 'defina DATABASE_URL para rodar';
const BLOG = 'blog.' + process.env.DOMAIN;

const G = require('../blog/gerador.js');
const Escala = require('../public/scheduler.js');
const { ARTIGOS, h1Para } = require('../blog');

test('gerador grátis: limites claros e a lei respeitada', () => {
  const base = { setor: 'varejo', abertos: [1, 1, 1, 1, 1, 1, 1], abre: '10:00', fecha: '22:00', inicio: '2026-11-16' };
  // até 10 pessoas
  assert.match(G.montar({ ...base, funcoes: [{ nome: 'Vendedor(a)', n: 11 }] }).erro, /até 10 pessoas/);
  assert.match(G.montar({ ...base, funcoes: [] }).erro, /pelo menos uma pessoa/);
  assert.match(G.montar({ ...base, abertos: [0, 0, 0, 0, 0, 0, 0], funcoes: [{ nome: 'Caixa', n: 2 }] }).erro, /um dia/);
  assert.equal(G.LIMITES.semanas, 1);
  for (const setor of Object.keys(Escala.SETORES)) {
    for (const inicio of ['2026-11-16', '2026-12-14', '2027-03-01', '2027-12-13', '2028-01-03']) {
      const p = G.padrao(setor);
      const r = G.montar({ setor, abertos: p.abertos, funcoes: p.funcoes, abre: p.abre, fecha: p.fecha, horasDia: 12, inicio });
      assert.ok(!r.erro, setor + ': ' + r.erro);
      assert.equal(r.semanas, 1);
      assert.ok(r.linhas.length <= 10 && r.linhas.length > 0);
      assert.equal(r.horasDia, 8, 'no máximo 8h por dia');
      assert.ok(r.horasSemana <= r.limite, `${setor} ${inicio}: ${r.horasSemana}h > ${r.limite}h`);
      assert.equal(r.limite, inicio < '2026-12-09' ? 44 : inicio < '2027-12-09' ? 42 : 40);
      for (const l of r.linhas) {
        assert.ok(l.dias.filter(c => c === 'F').length >= 2, `${setor}: ${l.nome} sem as 2 folgas`);
        assert.ok(l.dias.filter(c => c === 'T').length <= 5);
        assert.match(l.nome, / \d+$/, 'sem nomes: "Caixa 1", "Caixa 2"...');
      }
      r.presentes.forEach((pr, d) => { if (r.dias[d].aberto) assert.ok(pr >= r.minimo[d], `${setor} dia ${d}: ${pr} < ${r.minimo[d]}`); });
    }
  }
  // rodízio de domingo: no comércio, com 3 ou mais pessoas, alguém já folga no domingo na primeira semana
  const r = G.montar({ ...base, funcoes: [{ nome: 'Vendedor(a)', n: 4 }, { nome: 'Caixa', n: 2 }] });
  assert.equal(r.domingoSemanas, 3);
  assert.ok(r.domingoFolgam.length >= 1, 'alguém folga no domingo');
  assert.equal(G.montar({ ...base, setor: 'salao', funcoes: [{ nome: 'Manicure', n: 3 }] }).domingoSemanas, 7);
  // função que não pode faltar: 1 farmacêutico não cobre 7 dias e o gerador avisa
  const f = G.montar({ ...base, setor: 'farmacia', funcoes: [{ nome: 'Farmacêutico(a)', n: 1 }, { nome: 'Balconista', n: 3 }] });
  assert.ok(f.avisos.some(a => a.ok === false && /farmacêutico/i.test(a.titulo)));
  // semana sempre começa na segunda
  assert.equal(G.montar({ ...base, inicio: '2026-11-19', funcoes: [{ nome: 'Caixa', n: 3 }] }).inicio, '2026-11-16');
});

test('artigos: SEO e conteúdo', () => {
  assert.equal(ARTIGOS.length, 8);
  const slugs = new Set(ARTIGOS.map(a => a.slug));
  assert.equal(slugs.size, 8);
  for (const a of ARTIGOS) {
    assert.ok(a.titulo.length <= 60 && a.aba.length <= 60, 'título até 60: ' + a.titulo);
    assert.ok(a.descricao.length >= 120 && a.descricao.length <= 180, 'descrição: ' + a.slug);
    assert.ok(a.palavras >= 780 && a.palavras <= 1400, `${a.slug}: ${a.palavras} palavras`);
    assert.ok(a.indice.length >= 4, 'H2s: ' + a.slug);
    assert.ok(a.faq.length >= 3, 'FAQ: ' + a.slug);
    assert.ok(a.corpo.includes('href="/gerador"'), 'link para o gerador: ' + a.slug);
    assert.ok((a.corpo.match(/href="\/blog\/[\w-]+"/g) || []).length >= 1 || a.relacionados.length, 'links internos: ' + a.slug);
    for (const r of a.relacionados) assert.ok(slugs.has(r), 'relacionado existe: ' + r);
    for (const m of a.corpo.matchAll(/href="\/blog\/([\w-]+)"/g)) assert.ok(slugs.has(m[1]), 'link interno quebrado: ' + m[1]);
    // nada de promessa proibida e datas certas
    assert.ok(!/vitalício|pagamento único/i.test(a.corpo + a.descricao));
    assert.ok(!/40h? (por semana )?a partir de 15\/12\/2026|40 horas a partir de 15 de dezembro de 2026|42h? (por semana )?a partir de 15\/12\/2027/.test(a.corpo + a.descricao), 'datas da lei: ' + a.slug);
  }
  assert.equal(h1Para({}), 'Gere sua escala 5x2 grátis');
  assert.match(h1Para({ utm_term: 'como fazer escala 5x2' }), /^Como fazer escala 5x2/);
  assert.match(h1Para({ utm_term: 'fim da 6x1' }), /6x1/);
  assert.equal(h1Para({ utm_term: '<script>' }), 'Gere sua escala 5x2 grátis');
});

// pedido com Host trocado (fetch não deixa trocar o Host)
function pede(porta, host, caminho, { metodo = 'GET', corpo, cab = {} } = {}) {
  return new Promise((ok, falha) => {
    const dados = corpo ? JSON.stringify(corpo) : null;
    const r = http.request({ host: '127.0.0.1', port: porta, path: caminho, method: metodo,
      headers: { Host: host, ...(dados && { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(dados) }), ...cab } }, res => {
      let t = ''; res.setEncoding('utf8'); res.on('data', c => (t += c)); res.on('end', () => ok({ status: res.statusCode, h: res.headers, txt: t }));
    });
    r.on('error', falha); if (dados) r.write(dados); r.end();
  });
}

test('blog no subdomínio: rotas, sitemap, sem redirecionar, lead e Google Ads', { skip: pular }, async t => {
  const { app, migrar, pool } = require('../server.js');
  await migrar();
  const srv = app.listen(0), porta = srv.address().port;
  t.after(async () => { srv.close(); await pool.end(); });
  const b = (u, o) => pede(porta, BLOG, u, o);

  const home = await b('/');
  assert.equal(home.status, 200, 'o blog não é redirecionado');
  for (const x of ['<h1>Gere sua escala 5x2 grátis</h1>', 'id="gerador"', '/scheduler.js', '/gerador.js', '/rastreio.js', `<link rel="canonical" href="https://${BLOG}/">`,
    '"@type":"WebApplication"', '"@type":"FAQPage"', 'Até 10 pessoas', '1 semana', `https://${process.env.DOMAIN}/privacidade`, `https://${process.env.DOMAIN}/termos`, 'data-g='])
    assert.ok(home.txt.includes(x), 'falta no início do blog: ' + x);
  assert.ok(home.h['content-security-policy'].includes('https://www.googleadservices.com'));
  const ger = await b('/gerador?utm_source=google&utm_term=como+fazer+escala+5x2');
  assert.equal(ger.status, 200);
  assert.match(ger.txt, /<h1>Como fazer escala 5x2: gere a sua grátis<\/h1>/);
  assert.ok(ger.txt.includes(`<link rel="canonical" href="https://${BLOG}/gerador">`), 'canonical sem utm');
  assert.equal((await b('/gerador.js')).status, 200);
  assert.equal((await b('/scheduler.js')).status, 200);

  const lista = await b('/blog');
  assert.equal(lista.status, 200);
  for (const a of ARTIGOS) assert.ok(lista.txt.includes(`href="/blog/${a.slug}"`), 'lista: ' + a.slug);
  for (const a of ARTIGOS) {
    const r = await b('/blog/' + a.slug);
    assert.equal(r.status, 200, a.slug);
    for (const x of ['"@type":"Article"', '"@type":"FAQPage"', '"@type":"BreadcrumbList"', `<link rel="canonical" href="https://${BLOG}/blog/${a.slug}">`,
      `og-${a.slug}.jpg`, 'Este conteúdo é informativo; confira com seu contador', 'href="/gerador"', `https://${process.env.DOMAIN}/?utm_source=blog&amp;utm_medium=artigo`, '#preco', 'data-pago'])
      assert.ok(r.txt.includes(x), `${a.slug}: falta ${x}`);
    assert.equal((r.txt.match(/<h1>/g) || []).length, 1);
    const tit = /<title>([^<]*)<\/title>/.exec(r.txt)[1];
    assert.ok(tit.length <= 60, tit);
  }
  assert.ok(require('fs').existsSync(require('path').join(__dirname, '..', 'public', 'img', 'blog', `og-${ARTIGOS[0].slug}.jpg`)));
  assert.equal((await b('/blog/nao-existe')).status, 404);

  const mapa = await b('/sitemap.xml');
  assert.match(mapa.h['content-type'], /xml/);
  for (const a of ARTIGOS) assert.ok(mapa.txt.includes(`<loc>https://${BLOG}/blog/${a.slug}</loc>`));
  assert.ok(mapa.txt.includes(`<loc>https://${BLOG}/gerador</loc>`));
  const robots = await b('/robots.txt');
  assert.match(robots.txt, new RegExp(`Sitemap: https://${BLOG}/sitemap.xml`));

  // páginas do app no blog vão para o domínio principal; www vai para o principal; o principal segue normal
  const aj = await b('/ajuda');
  assert.equal(aj.status, 301); assert.equal(aj.h.location, `https://${process.env.DOMAIN}/ajuda`);
  const www = await pede(porta, 'www.' + process.env.DOMAIN, '/');
  assert.equal(www.status, 301); assert.equal(www.h.location, `https://${process.env.DOMAIN}/`);
  const venda = await pede(porta, '127.0.0.1', '/');
  assert.equal(venda.status, 200); assert.ok(!venda.txt.includes('id="gerador"'), 'página de vendas continua a mesma');
  assert.equal((await pede(porta, '127.0.0.1', '/blog')).status, 404, 'o blog só existe no subdomínio');

  // lead do gerador: só com consentimento, só do nosso domínio (o blog vale)
  const origem = { Origin: `https://${BLOG}` };
  const escala = { inicio: '2026-11-16', linhas: [{ nome: 'Caixa 1', dias: 'TTTTTFF' }, { nome: 'Caixa 2', dias: 'FFTTTTT' }] };
  const email = `gerador${Date.now()}@teste.com`;
  assert.equal((await b('/api/leads', { metodo: 'POST', cab: origem, corpo: { origem: 'blog-gerador', email, escala } })).status, 400, 'sem consentimento');
  assert.equal((await b('/api/leads', { metodo: 'POST', cab: origem, corpo: { origem: 'blog-gerador', email: 'x', consentimento: true } })).status, 400);
  assert.equal((await b('/api/leads', { metodo: 'POST', cab: { Origin: 'https://copia.com' }, corpo: { origem: 'blog-gerador', email, consentimento: true } })).status, 403);
  const ok = await b('/api/leads', { metodo: 'POST', cab: origem, corpo: { origem: 'blog-gerador', email, consentimento: true, novidades: false, setor: 'varejo', escala, utm: { utm_source: 'google' } } });
  assert.equal(ok.status, 200, ok.txt);
  const { rows } = await pool.query('select origem, consentimento_em, novidades, escala from leads where email=$1', [email]);
  assert.equal(rows[0].origem, 'blog-gerador'); assert.ok(rows[0].consentimento_em); assert.equal(rows[0].novidades, false);
  assert.equal(rows[0].escala.linhas.length, 2);
  const mail = await pool.query('select assunto, texto from emails where para=$1', [email]);
  assert.match(mail.rows[0].assunto, /escala 5x2 da semana de 16\/11/);
  assert.match(mail.rows[0].texto, /Caixa 1: folga Sáb e Dom/);

  // rastreio no blog: Google Ads só depois do aceite, consentimento começa negado
  const r = (await b('/rastreio.js')).txt;
  assert.match(r, /"aw":"AW-1234567"/); assert.match(r, /"awg":"gerouABC1"/); assert.match(r, /"awc":"gerouABC1"/);
  assert.match(r, /gtag\('consent','default',\{ad_storage:'denied'/);
  assert.ok(r.indexOf("gtag('config',C.aw)") > r.indexOf('function carrega'), 'Google Ads só dentro de carrega()');
  assert.ok(r.includes("gtag('event','conversion'"));
});

// ---------- aviso de cookies: aparece uma vez e vale no domínio e nos subdomínios ----------
function navegador(js, host, cookies = {}) {
  const jar = { ...cookies }, gravados = [], els = [];
  const loja = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; };
  const el = () => ({ style: {}, dataset: {}, classList: { add() {} }, setAttribute() {}, appendChild() {}, insertAdjacentHTML() {}, remove() { els.splice(els.indexOf(this), 1); } });
  const document = {
    get cookie() { return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; '); },
    set cookie(v) { gravados.push(v); const [par] = v.split(';'); const [k, val] = par.split('='); if (/max-age=0/.test(v)) delete jar[k]; else jar[k] = val; },
    body: { appendChild: e => els.push(e) }, head: { appendChild() {} }, documentElement: { style: {} },
    getElementById: id => els.find(e => e.id === id) || null, createElement: el,
    getElementsByTagName: () => [{ parentNode: { insertBefore() {} } }], addEventListener() {},
  };
  const ctx = { document, location: { hostname: host, protocol: 'https:', search: '', href: `https://${host}/` }, localStorage: loja(), sessionStorage: loja(),
    atob, URLSearchParams, setTimeout() {}, fetch: () => Promise.resolve(), Date, Math, JSON };
  ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(js, ctx);
  return { ctx, jar, gravados, aviso: () => els.find(e => e.id === 'avisoCookies') };
}

test('aviso de cookies: uma vez só, guardado em cookie de 1 ano no domínio e subdomínios', { skip: pular }, async t => {
  const { app } = require('../server.js');
  const srv = app.listen(0); t.after(() => srv.close());
  const js = (await pede(srv.address().port, BLOG, '/rastreio.js')).txt;
  const p = navegador(js, BLOG);
  const a = p.aviso();
  assert.ok(a, 'primeira visita mostra o aviso');
  a.onclick({ target: { closest: () => ({ dataset: { c: 'nao' } }) } });
  assert.ok(!p.aviso(), 'some depois da escolha');
  const c = p.gravados.find(x => x.startsWith('consentimento='));
  assert.match(c, /^consentimento=necessarios;max-age=31536000;path=\/;SameSite=Lax;domain=\.escala\.teste;Secure$/);
  assert.equal(p.ctx.localStorage.getItem('consentimento'), 'nao');
  // mesma página carregando o script de novo (SPA): não repete
  vm.runInContext(js, p.ctx);
  assert.ok(!p.aviso());
  // outro subdomínio (o cookie vale em .escala.teste): não mostra de novo
  assert.ok(!navegador(js, 'escala.teste', { consentimento: 'necessarios' }).aviso());
  const aceito = navegador(js, 'www.escala.teste', { consentimento: 'aceito' });
  assert.ok(!aceito.aviso() && typeof aceito.ctx.fbq === 'function', 'aceito: carrega o Pixel sem perguntar de novo');
  // sem armazenamento nenhum, a escolha vale na mesma visita
  const s = navegador(js, BLOG);
  s.ctx.localStorage.setItem = () => { throw new Error('bloqueado'); };
  s.aviso().onclick({ target: { closest: () => ({ dataset: { c: 'sim' } }) } });
  s.ctx.preferenciasCookies && assert.ok(!s.aviso());
  // "Preferências de cookies" reabre
  s.ctx.preferenciasCookies();
  assert.ok(s.aviso(), 'preferências reabrem o aviso');
});
