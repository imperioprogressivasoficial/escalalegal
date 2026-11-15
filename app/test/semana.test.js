// Mecanismo único: a semana se monta sozinha, e a equipe nova entra sozinha nas semanas seguintes.
const test = require('node:test');
const assert = require('node:assert');
const E = require('../public/scheduler.js');

const pular = !process.env.DATABASE_URL && 'defina DATABASE_URL para rodar';
process.env.WEBHOOK_TOKEN ||= 'tk-teste';
process.env.ADMIN_PASS ||= 'adm-teste';
process.env.SESSION_SECRET ||= 'segredo-teste';

const hojeBR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const segundaDe = d => E.somaDias(d, -((new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7));

test('semana se monta sozinha e se ajusta quando a equipe muda', { skip: pular }, async t => {
  const { app, migrar, pool } = require('../server.js');
  await migrar();
  const srv = app.listen(0), base = `http://127.0.0.1:${srv.address().port}`;
  t.after(async () => { srv.close(); await pool.end(); });
  const email = `sem${Date.now()}@t.com`;
  const chama = async (url, o = {}) => { const r = await fetch(base + url, { method: o.method || 'GET', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.7.0.' + (Math.random() * 250 | 0), ...(o.cookie && { cookie: o.cookie }) }, body: o.body && JSON.stringify(o.body) }); return { status: r.status, json: await r.json().catch(() => null), cookie: (r.headers.get('set-cookie') || '').split(';')[0] }; };
  await chama(`/api/webhook/pagamento?token=${process.env.WEBHOOK_TOKEN}`, { method: 'POST', body: { email } });
  const tk = /acesso=([\w-]+)/.exec((await pool.query('select texto from emails where para=$1', [email])).rows[0].texto)[1];
  const c = (await chama('/api/senha/definir', { method: 'POST', body: { token: tk, senha: 'senha123', empresa: 'Mercado Teste' } })).cookie;

  // unidade sem escala nenhuma: abrir a semana já monta
  const eq = (await chama('/api/equipes', { method: 'POST', cookie: c, body: { nome: 'Loja', setor: 'mercado' } })).json;
  const vazia = await chama(`/api/equipes/${eq.id}/semana`, { cookie: c });
  assert.equal(vazia.json.motivo, 'sem_pessoas');
  await chama(`/api/equipes/${eq.id}/funcionarios`, { method: 'POST', cookie: c, body: ['Ana', 'Bia', 'Caio', 'Duda', 'Edu', 'Fábio', 'Gil', 'Hugo'].map(nome => ({ nome })) });
  const hoje = hojeBR(), seg = segundaDe(hoje);
  const s1 = (await chama(`/api/equipes/${eq.id}/semana?data=${hoje}`, { cookie: c })).json;
  assert.ok(s1.montada, 'montou sozinha'); assert.equal(s1.inicio, seg); assert.equal(s1.semana, 0);
  const fer = (e, s, d) => (e.feriados || []).includes(require('../public/scheduler.js').somaDias(e.inicio, s * 7 + d));
  for (const f of s1.escala.dados[s1.semana]) assert.equal(f.filter((x, d) => x === 'F' && !fer(s1.escala, s1.semana, d)).length, 2);
  // abrir de novo não monta outra
  const s1b = (await chama(`/api/equipes/${eq.id}/semana?data=${hoje}`, { cookie: c })).json;
  assert.ok(!s1b.montada); assert.equal(s1b.escala.id, s1.escala.id);

  // pessoa nova: a semana em curso fica como estava; a próxima já inclui
  await chama(`/api/equipes/${eq.id}/funcionarios`, { method: 'POST', cookie: c, body: [{ nome: 'Iara' }] });
  const atual = (await chama(`/api/equipes/${eq.id}/semana?data=${hoje}`, { cookie: c })).json;
  assert.equal(atual.escala.id, s1.escala.id); assert.equal(atual.novos, 1);
  const prox = (await chama(`/api/equipes/${eq.id}/semana?data=${E.somaDias(seg, 7)}`, { cookie: c })).json;
  assert.ok(prox.montada); assert.ok(prox.escala.funcionarios.some(f => f.nome === 'Iara'));

  // férias lançadas: refaz a partir da semana que vem, nunca a semana em curso
  const iara = prox.escala.funcionarios.find(f => f.nome === 'Iara');
  const ini = E.somaDias(seg, 14), fim = E.somaDias(seg, 20);
  await chama('/api/ocorrencias', { method: 'POST', cookie: c, body: { funcionario_id: iara.id, tipo: 'ferias', inicio: ini, fim } });
  const r = (await chama(`/api/equipes/${eq.id}/refazer`, { method: 'POST', cookie: c, body: { de: ini, ate: fim } })).json;
  assert.ok(r.refeito); assert.equal(r.de, E.somaDias(seg, 14));
  const ferias = (await chama(`/api/equipes/${eq.id}/semana?data=${ini}`, { cookie: c })).json;
  const i = ferias.escala.funcionarios.findIndex(f => f.nome === 'Iara');
  assert.ok(ferias.escala.dados[ferias.semana][i].every((x, d) => !ferias.escala.abertos[d] || x === 'V'), 'Iara de férias a semana toda');

  // Google Planilhas: o link da equipe vira um CSV que o =IMPORTDATA puxa
  const { link } = (await chama(`/api/equipes/${eq.id}/link`, { method: 'POST', cookie: c, body: {} })).json;
  const tk2 = link.split('/e/')[1];
  const csv = await (await fetch(`${base}/api/publico/planilha/${tk2}`)).text();
  assert.match(csv, /^"Loja — escala \(atualiza sozinha\)"/);
  assert.match(csv, /"Pessoa","Seg /); assert.match(csv, /"Ana",/); assert.match(csv, /"FOLGA"/);
  assert.equal((await fetch(`${base}/api/publico/planilha/naoexiste`)).status, 404);
});
