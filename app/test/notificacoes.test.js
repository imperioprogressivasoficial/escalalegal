// Notificações do sino: cada empresa só vê as suas, o papel certo vê o aviso certo e nada se repete.
const test = require('node:test');
const assert = require('node:assert');

const pular = !process.env.DATABASE_URL && 'defina DATABASE_URL para rodar';
process.env.WEBHOOK_TOKEN ||= 'tk-teste';
process.env.ADMIN_PASS ||= 'adm-teste';
process.env.SESSION_SECRET ||= 'segredo-teste';

test('notificações: escopo por empresa, papel e sem repetir', { skip: pular }, async t => {
  const { app, migrar, pool } = require('../server.js');
  await migrar();
  const srv = app.listen(0), base = `http://127.0.0.1:${srv.address().port}`;
  const ids = [];
  t.after(async () => { await pool.query('delete from usuarios where id = any($1)', [ids]).catch(() => {}); srv.close(); await pool.end(); });
  const chama = async (url, o = {}) => {
    const r = await fetch(base + url, { method: o.method || 'GET', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.9.0.' + (Math.random() * 250 | 0),
      ...(o.cookie && { cookie: o.cookie }), ...(o.conta && { 'x-conta': String(o.conta) }) }, body: o.body && JSON.stringify(o.body) });
    return { status: r.status, json: await r.json().catch(() => null), cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
  };
  const dono = async nome => {
    const email = `not.${nome}.${Date.now()}@t.com`;
    await chama(`/api/webhook/pagamento?token=${process.env.WEBHOOK_TOKEN}`, { method: 'POST', body: { email } });
    const tk = /acesso=([\w-]+)/.exec((await pool.query('select texto from emails where para=$1', [email])).rows[0].texto)[1];
    const cookie = (await chama('/api/senha/definir', { method: 'POST', body: { token: tk, senha: 'senha123', empresa: 'Empresa ' + nome } })).cookie;
    const id = (await pool.query('select id from usuarios where email=$1', [email])).rows[0].id;
    return { email, cookie, id };
  };
  const a = await dono('a'), b = await dono('b');
  ids.push(a.id, b.id);

  // A monta a escala: vira notificação de A
  const r = await chama('/api/onboarding', { method: 'POST', cookie: a.cookie, body: { unidade: { nome: 'Loja A', setor: 'varejo' },
    pessoas: ['Ana', 'Bia', 'Caio', 'Duda', 'Edu'].map(nome => ({ nome })), inicio: '2027-03-01', semanas: 2 } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  const na = (await chama('/api/notificacoes', { cookie: a.cookie })).json;
  assert.ok(na.itens.some(x => x.tipo === 'escala' && /Loja A/.test(x.titulo)));
  assert.ok(na.nao_lidas >= 1);

  // B não vê nada de A e não consegue marcar a notificação de A
  const nb = (await chama('/api/notificacoes', { cookie: b.cookie })).json;
  assert.ok(!nb.itens.some(x => /Loja A/.test(x.titulo)));
  const idA = na.itens.find(x => x.tipo === 'escala').id;
  assert.equal((await chama(`/api/notificacoes/${idA}/lida`, { method: 'POST', cookie: b.cookie })).status, 404);
  assert.equal((await pool.query('select lida from notificacoes where id=$1', [idA])).rows[0].lida, false);
  // nem pedindo pela conta de A no cabeçalho (B não é membro)
  assert.equal((await chama('/api/notificacoes', { cookie: b.cookie, conta: a.id })).status, 403);

  // sem repetir: abrir o sino de novo não cria os avisos do dia outra vez
  const antes = (await pool.query('select count(*)::int c from notificacoes where conta_id=$1', [a.id])).rows[0].c;
  await chama('/api/notificacoes', { cookie: a.cookie }); await chama('/api/notificacoes', { cookie: a.cookie });
  assert.equal((await pool.query('select count(*)::int c from notificacoes where conta_id=$1', [a.id])).rows[0].c, antes);
  const chaves = (await pool.query('select chave, count(*)::int c from notificacoes where conta_id=$1 and chave is not null group by chave', [a.id])).rows;
  assert.ok(chaves.every(x => x.c === 1));

  // aviso só para o contador não aparece para o dono
  await pool.query(`insert into notificacoes (conta_id, papel, tipo, titulo, chave) values ($1,'contador','fechado','Só contador','teste:contador')`, [a.id]);
  assert.ok(!(await chama('/api/notificacoes', { cookie: a.cookie })).json.itens.some(x => x.titulo === 'Só contador'));

  // marcar uma e marcar todas
  assert.equal((await chama(`/api/notificacoes/${idA}/lida`, { method: 'POST', cookie: a.cookie })).status, 200);
  await chama('/api/notificacoes/lidas', { method: 'POST', cookie: a.cookie });
  assert.equal((await chama('/api/notificacoes', { cookie: a.cookie })).json.nao_lidas, 0);
  assert.equal((await pool.query("select lida from notificacoes where conta_id=$1 and chave='teste:contador'", [a.id])).rows[0].lida, false, 'marcar todas não mexe no aviso do contador');
});
