// Teste de ponta a ponta contra um Postgres de verdade.
// Rode com: DATABASE_URL=postgres://... npm test   (sem DATABASE_URL, é pulado)
const test = require('node:test');
const assert = require('node:assert');

const pular = !process.env.DATABASE_URL && 'defina DATABASE_URL para rodar';
process.env.WEBHOOK_TOKEN ||= 'tk-teste';
process.env.ADMIN_PASS ||= 'adm-teste';
process.env.SESSION_SECRET ||= 'segredo-teste';

test('fluxo completo: compra → e-mail → senha → escala → reembolso', { skip: pular }, async t => {
  const { app, migrar, pool } = require('../server.js');
  await migrar();
  const srv = app.listen(0);
  const base = `http://127.0.0.1:${srv.address().port}`;
  t.after(async () => { srv.close(); await pool.end(); });

  const sufixo = Date.now();
  const email = `comprador${sufixo}@teste.com`, outro = `outro${sufixo}@teste.com`;
  const chama = async (url, { method = 'GET', body, cookie, headers = {} } = {}) => {
    const r = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', ...(cookie && { cookie }), ...headers }, body: body && JSON.stringify(body) });
    return { status: r.status, json: await r.json().catch(() => null), cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
  };
  const webhook = body => chama(`/api/webhook/pagamento?token=${process.env.WEBHOOK_TOKEN}`, { method: 'POST', body });

  // token errado
  assert.equal((await chama('/api/webhook/pagamento?token=errado', { method: 'POST', body: { email } })).status, 401);
  // Pix gerado não libera
  let r = await webhook({ webhook_event_type: 'pix_created', order_status: 'waiting_payment', order_id: 'T1', Customer: { email, full_name: 'Maria Teste' } });
  assert.equal(r.json.acao, 'ignorar');
  // aprovado: cria a conta e manda o e-mail
  r = await webhook({ webhook_event_type: 'order_approved', order_status: 'paid', order_id: 'T1', Customer: { email, full_name: 'Maria Teste' } });
  assert.equal(r.json.acao, 'liberar'); assert.equal(r.json.conta_nova, true);
  // webhook repetido não duplica conta nem e-mail
  r = await webhook({ webhook_event_type: 'order_approved', order_status: 'paid', order_id: 'T1', Customer: { email, full_name: 'Maria Teste' } });
  assert.equal(r.json.ja_estava_liberado, true);
  const { rows: mails } = await pool.query('select texto from emails where para=$1', [email]);
  assert.equal(mails.length, 1);
  const token = /acesso=([\w-]+)/.exec(mails[0].texto)[1];

  // sem senha ainda: login avisa e reenvia link; cadastro com o mesmo e-mail não sequestra a conta
  r = await chama('/api/login', { method: 'POST', body: { email, senha: 'qualquer' } });
  assert.equal(r.status, 401); assert.match(r.json.erro, /criou sua senha/);
  r = await chama('/api/cadastro', { method: 'POST', body: { nome: 'Invasor', empresa: 'X', email, senha: '123456' } });
  assert.equal(r.status, 409);

  // cria a senha pelo link
  r = await chama('/api/senha/token?t=' + token);
  assert.equal(r.json.email, email); assert.equal(r.json.tem_senha, false);
  assert.equal((await chama('/api/senha/definir', { method: 'POST', body: { token, senha: 'senha123' } })).status, 400); // falta empresa
  r = await chama('/api/senha/definir', { method: 'POST', body: { token, senha: 'senha123', empresa: 'Loja Teste', whatsapp: '(71) 99999-0000' } });
  assert.equal(r.status, 200);
  const sessao = r.cookie;
  assert.equal((await chama('/api/senha/definir', { method: 'POST', body: { token, senha: 'outra123', empresa: 'X' } })).status, 404); // link de uso único

  r = await chama('/api/eu', { cookie: sessao });
  assert.equal(r.json.acesso_liberado, true); assert.equal(r.json.empresa, 'Loja Teste'); assert.equal(r.json.sessao_v, undefined);

  // monta equipe e gera escala
  const eq = (await chama('/api/equipes', { method: 'POST', cookie: sessao, body: { nome: 'Loja 1', setor: 'varejo' } })).json;
  r = await chama(`/api/equipes/${eq.id}/funcionarios`, { method: 'POST', cookie: sessao,
    body: ['Ana', 'Bia', 'Caio', 'Duda', 'Edu', 'Fábio'].map(nome => ({ nome, folga_fixa: nome === 'Ana' ? [6] : [] })) });
  assert.equal(r.json.length, 6);
  r = await chama(`/api/equipes/${eq.id}/escalas`, { method: 'POST', cookie: sessao, body: { inicio: '2026-12-07', semanas: 4 } });
  assert.equal(r.status, 200); assert.equal(r.json.dados.length, 4);
  for (const semana of r.json.dados) for (const f of semana) assert.equal(f.filter(c => c === 'F').length, 2);
  const esc = r.json;
  r = await chama(`/api/escalas/${esc.id}`, { method: 'PATCH', cookie: sessao, body: { semana: 0, funcionario: 0, dia: 2 } });
  assert.equal(r.status, 200);
  assert.equal((await chama(`/api/escalas/${esc.id}`, { method: 'PATCH', cookie: sessao, body: { semana: '__proto__', funcionario: 0, dia: 2 } })).status, 400);

  // outra empresa não enxerga nada da primeira
  const s2 = (await chama('/api/cadastro', { method: 'POST', body: { nome: 'Outro', empresa: 'Outra', email: outro, senha: 'senha123' } })).cookie;
  assert.equal((await chama(`/api/equipes/${eq.id}/funcionarios`, { cookie: s2 })).status, 404);
  assert.equal((await chama(`/api/equipes/${eq.id}/escalas`, { method: 'POST', cookie: s2, body: {} })).status, 402); // sem pagamento
  assert.equal((await chama(`/api/escalas/${esc.id}`, { method: 'PATCH', cookie: s2, body: { semana: 0, funcionario: 0, dia: 1 } })).status, 404);
  assert.equal((await chama('/api/equipes', { cookie: s2 })).json.length, 0);

  // reembolso de outra transação não bloqueia; da mesma, bloqueia
  r = await webhook({ event: 'PURCHASE_REFUNDED', data: { buyer: { email }, purchase: { transaction: 'OUTRA' } } });
  assert.equal(r.json.acao, 'ignorar');
  r = await webhook({ webhook_event_type: 'order_refunded', order_status: 'refunded', order_id: 'T1', Customer: { email } });
  assert.equal(r.json.conta_bloqueada, true);
  assert.equal((await chama(`/api/equipes/${eq.id}/escalas`, { method: 'POST', cookie: sessao, body: {} })).status, 402);

  // esqueci a senha: troca a senha e derruba sessões antigas
  await pool.query('delete from acesso_tokens where usuario_id=(select id from usuarios where email=$1)', [email]);
  assert.equal((await chama('/api/senha/esqueci', { method: 'POST', body: { email } })).status, 200);
  const { rows: m2 } = await pool.query('select texto from emails where para=$1 order by id desc limit 1', [email]);
  const t2 = /acesso=([\w-]+)/.exec(m2[0].texto)[1];
  r = await chama('/api/senha/definir', { method: 'POST', body: { token: t2, senha: 'nova12345' } });
  assert.equal(r.status, 200);
  assert.equal((await chama('/api/eu', { cookie: sessao })).status, 401);
  assert.equal((await chama('/api/login', { method: 'POST', body: { email, senha: 'nova12345' } })).status, 200);

  // admin
  assert.equal((await chama('/api/admin/clientes')).status, 401);
  const auth = { authorization: 'Basic ' + Buffer.from('admin:' + process.env.ADMIN_PASS).toString('base64') };
  r = await chama('/api/admin/acessos', { method: 'POST', headers: auth, body: { email: outro } });
  assert.equal(r.json.ok, true);
  assert.equal((await chama(`/api/equipes/${eq.id}/escalas`, { cookie: s2, method: 'GET' })).status, 404);
  r = await chama('/api/admin/resumo', { headers: auth });
  assert.ok(r.json.eventos.length >= 4);

  await pool.query('delete from usuarios where email = any($1)', [[email, outro]]);
});
