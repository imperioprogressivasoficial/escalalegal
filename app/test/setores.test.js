// Setores: cada setor tem o próprio mínimo por dia, as regras por pessoa continuam, e unidade sem setor fica igual.
const test = require('node:test');
const assert = require('node:assert');
const Escala = require('../public/scheduler.js');
const { gruposDosSetores, assinatura, minimoValido } = require('../setores.js');

const ABERTO = [1, 1, 1, 1, 1, 1, 1];
const pessoas = (n, setor, pre) => Array.from({ length: n }, (_, i) => ({ nome: `${pre} ${i + 1}`, setor_id: setor }));

test('motor: mínimo por setor garantido, 2 folgas por pessoa', () => {
  const fs = [...pessoas(4, 1, 'Caixa'), ...pessoas(3, 2, 'Açougue'), ...pessoas(3, null, 'Geral')];
  const setores = [{ id: 1, nome: 'Frente de caixa', minimo: [2, 2, 2, 2, 2, 2, 2] }, { id: 2, nome: 'Açougue', minimo: [1, 1, 1, 1, 1, 1, 1] }];
  const grupos = gruposDosSetores(fs, setores);
  assert.deepEqual(grupos.map(g => g.membros), [[0, 1, 2, 3], [4, 5, 6]]);
  const r = Escala.gerarEscala({ funcionarios: fs.map(f => ({ nome: f.nome })), abertos: ABERTO, minimo: [5, 5, 5, 5, 5, 5, 5], semanas: 4, grupos });
  r.escala.forEach(sem => {
    sem.forEach(dias => assert.equal(dias.filter(c => c === 'F').length, 2, 'cada pessoa com 2 folgas'));
    for (let d = 0; d < 7; d++) {
      assert.ok([0, 1, 2, 3].filter(i => sem[i][d] === 'T').length >= 2, 'frente de caixa com 2 no dia ' + d);
      assert.ok([4, 5, 6].filter(i => sem[i][d] === 'T').length >= 1, 'açougue com 1 no dia ' + d);
    }
  });
  assert.equal(r.alertas.length, 0, r.alertas.join(' | '));
});

test('motor: setor sem mínimo não vira restrição e sem setores a escala é a mesma', () => {
  const fs = pessoas(6, null, 'P');
  assert.deepEqual(gruposDosSetores(fs, [{ id: 9, nome: 'Vazio', minimo: null }, { id: 8, nome: 'Zero', minimo: [0, 0, 0, 0, 0, 0, 0] }]), []);
  const base = { funcionarios: fs.map(f => ({ nome: f.nome })), abertos: ABERTO, minimo: [3, 3, 3, 3, 3, 3, 3], semanas: 4 };
  assert.deepEqual(Escala.gerarEscala({ ...base, grupos: gruposDosSetores(fs, []) }).escala, Escala.gerarEscala(base).escala);
});

test('setores: mínimo e assinatura', () => {
  assert.deepEqual(minimoValido(2), [2, 2, 2, 2, 2, 2, 2]);
  assert.deepEqual(minimoValido([1, 2, 3, 4, 5, 6, 99]), [1, 2, 3, 4, 5, 6, 50]);
  assert.equal(minimoValido([1, 2]), null);
  assert.equal(minimoValido(''), null);
  assert.deepEqual(assinatura([{ id: 2, minimo: [1] }, { id: 1, minimo: null }]), [[1, null], [2, [1]]]);
});

const pular = !process.env.DATABASE_URL && 'defina DATABASE_URL para rodar';
process.env.WEBHOOK_TOKEN ||= 'tk-teste';
process.env.ADMIN_PASS ||= 'adm-teste';
process.env.SESSION_SECRET ||= 'segredo-teste';

test('setores pela API: cria pelo cargo, gera por setor, isola empresas e refaz o futuro', { skip: pular }, async t => {
  const { app, migrar, pool } = require('../server.js');
  await migrar();
  const srv = app.listen(0), base = `http://127.0.0.1:${srv.address().port}`;
  const ids = [];
  t.after(async () => { await pool.query('delete from usuarios where id = any($1)', [ids]).catch(() => {}); srv.close(); await pool.end(); });
  const chama = async (url, o = {}) => {
    const r = await fetch(base + url, { method: o.method || 'GET', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.8.0.' + (Math.random() * 250 | 0),
      ...(o.cookie && { cookie: o.cookie }) }, body: o.body && JSON.stringify(o.body) });
    return { status: r.status, json: await r.json().catch(() => null) };
  };
  const dono = async nome => {
    const email = `set.${nome}.${Date.now()}@t.com`;
    await chama(`/api/webhook/pagamento?token=${process.env.WEBHOOK_TOKEN}`, { method: 'POST', body: { email } });
    const tk = /acesso=([\w-]+)/.exec((await pool.query('select texto from emails where para=$1', [email])).rows[0].texto)[1];
    const r = await fetch(base + '/api/senha/definir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: tk, senha: 'senha123', empresa: 'Empresa ' + nome }) });
    const id = (await pool.query('select id from usuarios where email=$1', [email])).rows[0].id;
    ids.push(id);
    return { cookie: (r.headers.get('set-cookie') || '').split(';')[0], id };
  };
  const a = await dono('a'), b = await dono('b');
  const pessoas = [...['Ana', 'Bia', 'Caio', 'Duda'].map(nome => ({ nome, cargo: 'Caixa' })), ...['Edu', 'Fabi', 'Gil'].map(nome => ({ nome, cargo: 'Açougue' })), { nome: 'Hugo', cargo: 'Gerente' }];
  const r = await chama('/api/onboarding', { method: 'POST', cookie: a.cookie, body: { unidade: { nome: 'Mercado A', setor: 'mercado' }, pessoas, inicio: '2027-03-01', semanas: 1 } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  const eq = r.json.equipe.id;

  // unidade sem setor: a semana continua igual (compatível)
  const s0 = await chama(`/api/equipes/${eq}/semana?data=2027-03-01`, { cookie: a.cookie });
  assert.equal(s0.status, 200); assert.ok(s0.json.escala); assert.equal(s0.json.escala.funcionarios[0].setor_id ?? null, null);

  // o quiz cria um setor por função e já coloca quem tem o cargo
  const c = await chama(`/api/equipes/${eq}/setores`, { method: 'POST', cookie: a.cookie, body: { setores: [{ nome: 'Frente de caixa', cargo: 'Caixa', minimo: 2 }, { nome: 'Açougue', cargo: 'açougue', minimo: 1 }] } });
  assert.equal(c.status, 200, JSON.stringify(c.json)); assert.equal(c.json.length, 2);
  const [cx, ac] = c.json;
  const lista = (await chama(`/api/equipes/${eq}/setores`, { cookie: a.cookie })).json;
  assert.deepEqual(lista.map(s => [s.nome, s.pessoas]), [['Frente de caixa', 4], ['Açougue', 3]]);

  // outra empresa não vê, não muda e não usa os setores de A
  assert.equal((await chama(`/api/equipes/${eq}/setores`, { cookie: b.cookie })).status, 404);
  assert.equal((await chama(`/api/setores/${cx.id}`, { method: 'PUT', cookie: b.cookie, body: { nome: 'x' } })).status, 404);
  assert.equal((await chama(`/api/setores/${cx.id}`, { method: 'DELETE', cookie: b.cookie })).status, 404);
  const hugo = (await chama(`/api/equipes/${eq}/funcionarios`, { cookie: a.cookie })).json.find(f => f.nome === 'Hugo');
  assert.equal((await chama(`/api/funcionarios/${hugo.id}/setor`, { method: 'PUT', cookie: b.cookie, body: { setor_id: cx.id } })).status, 404);

  // escala futura refeita sozinha com os setores, mínimo de cada setor garantido (daqui a 3 semanas: dentro das 26 que montam sozinhas)
  const d0 = new Date(); d0.setUTCDate(d0.getUTCDate() + 21 - ((d0.getUTCDay() + 6) % 7)); const fut = d0.toISOString().slice(0, 10);
  const s1 = (await chama(`/api/equipes/${eq}/semana?data=${fut}`, { cookie: a.cookie })).json;
  const e = s1.escala, sem = e.dados[s1.semana];
  const de = sid => e.funcionarios.map((f, i) => f.setor_id === sid ? i : -1).filter(i => i >= 0);
  assert.equal(de(cx.id).length, 4); assert.equal(de(ac.id).length, 3);
  for (let d = 0; d < 7; d++) if (e.abertos[d]) {
    assert.ok(de(cx.id).filter(i => sem[i][d] === 'T').length >= 2, 'caixa dia ' + d);
    assert.ok(de(ac.id).filter(i => sem[i][d] === 'T').length >= 1, 'açougue dia ' + d);
  }

  // mudar alguém de setor ou o mínimo deixa as semanas futuras desatualizadas: são refeitas
  assert.equal((await chama(`/api/funcionarios/${hugo.id}/setor`, { method: 'PUT', cookie: a.cookie, body: { setor_id: ac.id } })).status, 200);
  const s2 = (await chama(`/api/equipes/${eq}/semana?data=${fut}`, { cookie: a.cookie })).json;
  assert.equal(s2.montada, true);
  assert.equal(s2.escala.funcionarios.find(f => f.id === hugo.id).setor_id, ac.id);
  assert.equal((await chama(`/api/setores/${ac.id}`, { method: 'PUT', cookie: a.cookie, body: { minimo: 2 } })).status, 200);
  assert.equal((await chama(`/api/equipes/${eq}/semana?data=${fut}`, { cookie: a.cookie })).json.montada, true);
  assert.equal((await chama(`/api/equipes/${eq}/semana?data=${fut}`, { cookie: a.cookie })).json.montada, false, 'sem mudança não refaz');

  // apagar o setor deixa os colaboradores sem setor
  assert.equal((await chama(`/api/setores/${ac.id}`, { method: 'DELETE', cookie: a.cookie })).status, 200);
  const fs = (await chama(`/api/equipes/${eq}/funcionarios`, { cookie: a.cookie })).json;
  assert.equal(fs.find(f => f.nome === 'Edu').setor_id, null);
  assert.equal((await chama(`/api/equipes/${eq}/setores`, { method: 'POST', cookie: a.cookie, body: { nome: '  ' } })).status, 400);

  // o quiz manda os setores junto: um por função, já com quem tem o cargo, e a primeira escala já sai por setor
  const o = await chama('/api/onboarding', { method: 'POST', cookie: a.cookie, body: { unidade: { nome: 'Mercado B', setor: 'mercado' }, pessoas,
    setores: [{ nome: 'Caixa', cargo: 'Caixa', minimo: [2, 2, 2, 2, 2, 2, 2] }, { nome: 'Açougue', cargo: 'Açougue', minimo: [1, 1, 1, 1, 1, 1, 1] }], inicio: fut, semanas: 1 } });
  assert.equal(o.status, 200, JSON.stringify(o.json));
  const snap = o.json.escala.funcionarios;
  assert.equal(snap.filter(f => f.setor_id).length, 7);
  assert.equal((await chama(`/api/equipes/${o.json.equipe.id}/semana?data=${fut}`, { cookie: a.cookie })).json.montada, false, 'a primeira escala já está certa');
});
