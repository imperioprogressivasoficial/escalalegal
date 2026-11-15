// Guia da jornada: GET /api/jornada diz o próximo passo de cada papel, lido dos dados reais da empresa.
const test = require('node:test');
const assert = require('node:assert');
const { nomeGenerico } = require('../jornada.js');

const pular = !process.env.DATABASE_URL && 'defina DATABASE_URL para rodar';
process.env.WEBHOOK_TOKEN ||= 'tk-teste';
process.env.ADMIN_PASS ||= 'adm-teste';
process.env.SESSION_SECRET ||= 'segredo-teste';

test('nome que ainda é só a função conta como "falta identificar"', () => {
  assert.equal(nomeGenerico({ nome: 'Caixa 1', cargo: 'Operador(a) de caixa' }), false); // rótulo "operador de caixa"
  assert.equal(nomeGenerico({ nome: 'Repositor 2', cargo: 'Repositor(a)' }), true);
  assert.equal(nomeGenerico({ nome: 'Garçom 1', cargo: 'Garçom/Garçonete' }), true);
  assert.equal(nomeGenerico({ nome: 'Ana', cargo: 'Repositor(a)' }), false);
  assert.equal(nomeGenerico({ nome: 'Repositor 1', cargo: '' }), false);
});

test('jornada: próximo passo por etapa e por papel, só da própria empresa', { skip: pular }, async t => {
  const { app, migrar, pool } = require('../server.js');
  await migrar();
  const srv = app.listen(0);
  const base = `http://127.0.0.1:${srv.address().port}`;
  t.after(async () => { srv.close(); await pool.end(); });
  const sx = Date.now();
  let ip = 0;
  const chama = async (url, { method = 'GET', body, cookie, conta } = {}) => {
    const r = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `10.7.${(ip / 250) | 0}.${ip++ % 250}`,
      ...(cookie && { cookie }), ...(conta && { 'x-conta': String(conta) }) }, body: body && JSON.stringify(body) });
    let json = null; const txt = await r.text(); try { json = JSON.parse(txt); } catch {}
    return { status: r.status, json, txt, cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
  };
  const linkDe = async email => /acesso=([\w-]+)/.exec((await pool.query('select texto from emails where para=$1 order by id desc limit 1', [email])).rows[0].texto)[1];
  const compra = async (email, empresa) => {
    await chama(`/api/webhook/pagamento?token=${process.env.WEBHOOK_TOKEN}`, { method: 'POST', body: { email, nome: 'Guia ' + empresa } });
    return (await chama('/api/senha/definir', { method: 'POST', body: { token: await linkDe(email), senha: 'senha123', empresa } })).cookie;
  };
  const dono = `gdono${sx}@t.com`, outro = `goutro${sx}@t.com`;
  const s = await compra(dono, 'Mercado Guia'), s2 = await compra(outro, 'Outra Loja');

  assert.equal((await chama('/api/jornada')).status, 401);
  let r = await chama('/api/jornada', { cookie: s });
  assert.equal(r.status, 200, r.txt);
  assert.equal(r.json.etapa, 'cadastro'); assert.equal(r.json.proximo.ir, 'cadastro');
  assert.equal(r.json.fatos.unidades, 0); assert.equal(r.json.fatos.papel, 'dono');

  // monta a unidade com dois "Repositor N" (sem nome) e abre no domingo
  r = await chama('/api/onboarding', { method: 'POST', cookie: s, body: {
    empresa: { nome: 'Mercado Guia', porte: 'me', uf: 'BA', cidade: 'Salvador' },
    unidade: { nome: 'Centro', setor: 'mercado', abertos: [1, 1, 1, 1, 1, 1, 1], minimo: [2, 2, 2, 2, 2, 2, 2], horas_dia: 8 },
    pessoas: [{ nome: 'Repositor 1', cargo: 'Repositor(a)' }, { nome: 'Repositor 2', cargo: 'Repositor(a)' }, { nome: 'Ana' }, { nome: 'Bia' }] } });
  assert.equal(r.status, 200, r.txt);
  r = await chama('/api/jornada', { cookie: s });
  assert.equal(r.json.etapa, 'publicar'); assert.equal(r.json.proximo.tela, 'escala');
  assert.equal(r.json.fatos.escala, true); assert.equal(r.json.fatos.colaboradores, 4); assert.equal(r.json.fatos.sem_nome, 2);

  await chama('/api/inicio/enviada', { method: 'POST', cookie: s });
  r = await chama('/api/jornada', { cookie: s });
  assert.equal(r.json.etapa, 'identificar'); assert.equal(r.json.fatos.publicada, true);

  // nomeia todo mundo: o próximo é a contabilidade (só para o dono)
  const fs = (await chama('/api/funcionarios', { cookie: s })).json;
  for (const f of fs.filter(f => /^Repositor/.test(f.nome))) await chama(`/api/funcionarios/${f.id}`, { method: 'PUT', cookie: s, body: { nome: 'Pessoa ' + f.id, cargo: f.cargo } });
  r = await chama('/api/jornada', { cookie: s });
  assert.equal(r.json.etapa, 'contabilidade'); assert.equal(r.json.fatos.sem_nome, 0);

  // outra empresa não vê nada desta: a conta dela é a própria, e o x-conta desta é recusado
  r = await chama('/api/jornada', { cookie: s2 });
  assert.equal(r.json.fatos.unidades, 0); assert.equal(r.json.fatos.colaboradores, 0);
  const contaDono = (await pool.query('select id from usuarios where email=$1', [dono])).rows[0].id;
  r = await chama('/api/jornada', { cookie: s2, conta: contaDono });
  assert.ok([403, 404].includes(r.status), r.txt);

  // contador convidado: vê o passo de consulta, nunca "liberar acesso" ou "gerar"
  const cont = `gcont${sx}@t.com`;
  r = await chama('/api/membros', { method: 'POST', cookie: s, body: { email: cont, nome: 'Contador Guia', papel: 'contador' } });
  assert.equal(r.status, 200, r.txt);
  const sc = (await chama('/api/senha/definir', { method: 'POST', body: { token: await linkDe(cont), senha: 'senha123' } })).cookie;
  r = await chama('/api/jornada', { cookie: sc, conta: contaDono });
  assert.equal(r.status, 200, r.txt);
  assert.equal(r.json.fatos.papel, 'contador'); assert.ok(['consultar', 'baixar'].includes(r.json.etapa));
  // e o dono, agora com a contabilidade, segue adiante
  r = await chama('/api/jornada', { cookie: s });
  assert.notEqual(r.json.etapa, 'contabilidade'); assert.equal(r.json.fatos.contador, true);
});
