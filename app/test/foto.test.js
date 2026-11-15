// Foto de perfil: tamanho e tipo conferidos no servidor, e só quem está na mesma empresa vê a foto.
const test = require('node:test');
const assert = require('node:assert');
const { tipoDaImagem } = require('../foto.js');

const pular = !process.env.DATABASE_URL && 'defina DATABASE_URL para rodar';
process.env.WEBHOOK_TOKEN ||= 'tk-teste';
process.env.ADMIN_PASS ||= 'adm-teste';
process.env.SESSION_SECRET ||= 'segredo-teste';

// um WebP mínimo (cabeçalho RIFF/WEBP) e um JPEG mínimo: o servidor confere só a assinatura
const webp = n => Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 '), Buffer.alloc(Math.max(0, n - 16), 7)]);
const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(60, 1)]);

test('tipo da imagem pela assinatura', () => {
  assert.equal(tipoDaImagem(webp(40)), 'image/webp');
  assert.equal(tipoDaImagem(jpeg), 'image/jpeg');
  assert.equal(tipoDaImagem(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(20)])), 'image/png');
  assert.equal(tipoDaImagem(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null);
  assert.equal(tipoDaImagem(Buffer.from('GIF89a......')), null);
});

test('foto de perfil: limites e quem pode ver', { skip: pular }, async t => {
  const { app, migrar, pool } = require('../server.js');
  await migrar();
  const srv = app.listen(0), base = `http://127.0.0.1:${srv.address().port}`;
  const ids = [];
  t.after(async () => { await pool.query('delete from usuarios where id = any($1)', [ids]).catch(() => {}); srv.close(); await pool.end(); });
  const chama = async (url, o = {}) => {
    const r = await fetch(base + url, { method: o.method || 'GET', headers: { 'x-forwarded-for': '10.7.0.' + (Math.random() * 250 | 0),
      ...(o.tipo && { 'Content-Type': o.tipo }), ...(o.json && { 'Content-Type': 'application/json' }), ...(o.cookie && { cookie: o.cookie }) },
      body: o.json ? JSON.stringify(o.json) : o.body });
    const buf = Buffer.from(await r.arrayBuffer());
    let json = null; try { json = JSON.parse(buf.toString()); } catch {}
    return { status: r.status, json, buf, tipo: r.headers.get('content-type'), cache: r.headers.get('cache-control'), etag: r.headers.get('etag'), cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
  };
  const dono = async nome => {
    const email = `foto.${nome}.${Date.now()}@t.com`;
    await chama(`/api/webhook/pagamento?token=${process.env.WEBHOOK_TOKEN}`, { method: 'POST', json: { email } });
    const tk = /acesso=([\w-]+)/.exec((await pool.query('select texto from emails where para=$1', [email])).rows[0].texto)[1];
    const cookie = (await chama('/api/senha/definir', { method: 'POST', json: { token: tk, senha: 'senha123', empresa: 'Empresa ' + nome } })).cookie;
    const id = (await pool.query('select id from usuarios where email=$1', [email])).rows[0].id;
    ids.push(id);
    return { email, cookie, id };
  };
  const a = await dono('a'), b = await dono('b');

  // limites
  assert.equal((await chama('/api/eu/foto', { method: 'PUT', tipo: 'image/webp', body: webp(201 * 1024), cookie: a.cookie })).status, 413);
  assert.equal((await chama('/api/eu/foto', { method: 'PUT', tipo: 'image/png', body: Buffer.from('<svg onload="x()"></svg>'.padEnd(80)), cookie: a.cookie })).status, 415);
  assert.equal((await chama('/api/eu/foto', { method: 'PUT', tipo: 'image/webp', body: webp(2000) })).status, 401);
  const ok = await chama('/api/eu/foto', { method: 'PUT', tipo: 'image/webp', body: webp(2000), cookie: a.cookie });
  assert.equal(ok.status, 200, JSON.stringify(ok.json));
  assert.ok(ok.json.foto_em);

  // a própria pessoa vê, com cache privado e ETag
  const minha = await chama(`/api/usuarios/${a.id}/foto`, { cookie: a.cookie });
  assert.equal(minha.status, 200); assert.equal(minha.tipo, 'image/webp'); assert.equal(minha.buf.length, 2000);
  assert.match(minha.cache, /private/); assert.ok(minha.etag);
  assert.equal((await chama('/api/eu/foto/info', { cookie: a.cookie })).json.foto_em, ok.json.foto_em);

  // outra empresa não vê
  assert.equal((await chama(`/api/usuarios/${a.id}/foto`, { cookie: b.cookie })).status, 404);
  // depois que A dá acesso a B (gerente), B vê a foto de A e A vê a de B
  await chama('/api/eu/foto', { method: 'PUT', tipo: 'image/jpeg', body: jpeg, cookie: b.cookie });
  await pool.query("insert into membros (conta_id, usuario_id, papel) values ($1,$2,'gestor')", [a.id, b.id]);
  assert.equal((await chama(`/api/usuarios/${a.id}/foto`, { cookie: b.cookie })).status, 200);
  assert.equal((await chama(`/api/usuarios/${b.id}/foto`, { cookie: a.cookie })).tipo, 'image/jpeg');

  // remover
  assert.equal((await chama('/api/eu/foto', { method: 'DELETE', cookie: a.cookie })).status, 200);
  assert.equal((await chama(`/api/usuarios/${a.id}/foto`, { cookie: a.cookie })).status, 404);
});
