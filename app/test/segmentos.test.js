// A escala se adapta ao segmento: função que não pode faltar (farmacêutico, caixa, cozinha...)
// e regra de domingo (comércio 3 semanas, demais 7).
const test = require('node:test');
const assert = require('node:assert');
const E = require('../public/scheduler.js');

const pular = !process.env.DATABASE_URL && 'defina DATABASE_URL para rodar';
process.env.WEBHOOK_TOKEN ||= 'tk-teste';
process.env.ADMIN_PASS ||= 'adm-teste';
process.env.SESSION_SECRET ||= 'segredo-teste';

test('todo segmento tem dados completos', () => {
  for (const [k, s] of Object.entries(E.SETORES)) {
    assert.ok(s.nome && s.local && s.abre && s.fecha, k);
    assert.equal(s.abertos.length, 7, k); assert.equal(s.minimo.length, 7, k);
    for (const c of s.criticas) { assert.equal(c.minimo.length, 7, k); assert.ok(s.funcoes.some(f => E.casaFuncao(f, c.chave)), `${k}: função ${c.nome} na lista`); }
  }
  assert.equal(E.domingoSemanasDe('farmacia'), 3); assert.equal(E.domingoSemanasDe('mercado'), 3);
  assert.equal(E.domingoSemanasDe('clinica'), 7); assert.equal(E.domingoSemanasDe('seguranca'), 7);
  assert.ok(E.casaFuncao('Farmacêutica', 'farmac')); assert.ok(!E.casaFuncao('Balconista', 'farmac'));
});

test('cada segmento gera escala que respeita a função obrigatória', () => {
  for (const [k, s] of Object.entries(E.SETORES)) {
    if (!s.criticas.length) continue;
    const c = s.criticas[0], precisaFunc = Math.ceil(c.minimo.reduce((a, m) => a + m, 0) / 5);
    const totalMin = s.minimo.reduce((a, m, d) => a + (s.abertos[d] ? m : 0), 0);
    const n = Math.max(Math.ceil(totalMin / 5) + 2, precisaFunc + 3);
    const fs = Array.from({ length: n }, (_, i) => ({ nome: 'P' + i, cargo: i < precisaFunc ? c.nome : s.funcoes.find(f => f !== c.nome) || 'Outro' }));
    const grupos = E.gruposDaUnidade(fs, s.criticas);
    const { escala } = E.gerarEscala({ funcionarios: fs, abertos: s.abertos, minimo: s.minimo, semanas: 6, grupos, domingoSemanas: E.domingoSemanasDe(k) });
    escala.forEach((sem, w) => {
      for (const f of sem) assert.equal(f.filter(x => x === 'F').length, 2, `${k} semana ${w}`);
      for (let d = 0; d < 7; d++) if (s.abertos[d]) assert.ok(grupos[0].membros.filter(i => sem[i][d] === 'T').length >= c.minimo[d], `${k}: ${c.nome} no dia ${d} semana ${w}`);
    });
    const a = E.analisar({ inicio: '2027-02-01', semanas: 6, funcionarios: fs, abertos: s.abertos, minimo: s.minimo, dados: escala },
      { horasDia: 8, criticas: s.criticas, domingoSemanas: E.domingoSemanasDe(k), abre: s.abre, fecha: s.fecha });
    assert.ok(a.itens.some(i => i.ok === true && i.titulo === `${c.nome} em todos os dias`), `${k}: ${a.itens.map(i => i.titulo).join(' | ')}`);
  }
});

test('análise avisa quando ninguém tem a função obrigatória', () => {
  const s = E.SETORES.farmacia, fs = ['A', 'B', 'C', 'D'].map(nome => ({ nome, cargo: 'Balconista' }));
  const { escala } = E.gerarEscala({ funcionarios: fs, abertos: s.abertos, minimo: s.minimo, semanas: 2 });
  const a = E.analisar({ inicio: '2027-02-01', semanas: 2, funcionarios: fs, abertos: s.abertos, minimo: s.minimo, dados: escala }, { criticas: s.criticas });
  assert.ok(a.itens.some(i => i.ok === false && /Ninguém marcado como Farmacêutico/.test(i.titulo)));
});

test('farmácia pelo primeiro acesso: farmacêutico garantido todo dia', { skip: pular }, async t => {
  const { app, migrar, pool } = require('../server.js');
  await migrar();
  const srv = app.listen(0), base = `http://127.0.0.1:${srv.address().port}`;
  t.after(async () => { srv.close(); await pool.end(); });
  const email = `farm${Date.now()}@t.com`;
  const chama = async (url, o = {}) => { const r = await fetch(base + url, { method: o.method || 'GET', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.6.0.' + (Math.random() * 250 | 0), ...(o.cookie && { cookie: o.cookie }) }, body: o.body && JSON.stringify(o.body) }); return { status: r.status, json: await r.json().catch(() => null), cookie: (r.headers.get('set-cookie') || '').split(';')[0] }; };
  await chama(`/api/webhook/pagamento?token=${process.env.WEBHOOK_TOKEN}`, { method: 'POST', body: { email } });
  const tk = /acesso=([\w-]+)/.exec((await pool.query('select texto from emails where para=$1', [email])).rows[0].texto)[1];
  const s = (await chama('/api/senha/definir', { method: 'POST', body: { token: tk, senha: 'senha123', empresa: 'Drogaria Teste' } })).cookie;
  const seg = E.SETORES.farmacia;
  const pessoas = [['Ana', 'Farmacêutico(a)'], ['Bia', 'Farmacêutico(a)'], ['Caio', 'Farmacêutico(a)'], ['Duda', 'Balconista'], ['Edu', 'Balconista'], ['Fábio', 'Caixa'], ['Gil', 'Caixa']].map(([nome, cargo]) => ({ nome, cargo }));
  const r = await chama('/api/onboarding', { method: 'POST', cookie: s, body: { empresa: { nome: 'Drogaria Teste', porte: 'me', uf: 'BA' },
    unidade: { nome: 'Drogaria Centro', setor: 'farmacia', abertos: seg.abertos, minimo: seg.minimo, abre: '07:00', fecha: '22:00', horas_dia: 8, criticas: seg.criticas }, pessoas, inicio: '2027-03-01', semanas: 4 } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal(r.json.equipe.abre, '07:00'); assert.equal(r.json.equipe.criticas[0].chave, 'farmac');
  const esc = r.json.escala, membros = esc.funcionarios.map((f, i) => /Farmac/.test(f.cargo) ? i : -1).filter(i => i >= 0);
  assert.equal(membros.length, 3);
  for (const sem of esc.dados) for (let d = 0; d < 7; d++) assert.ok(membros.filter(i => sem[i][d] === 'T').length >= 2, `dia ${d}`);
  // unidade sem crítica informada pega a do segmento
  const r2 = await chama('/api/onboarding', { method: 'POST', cookie: s, body: { unidade: { nome: 'Drogaria Bairro', setor: 'farmacia' }, pessoas: [{ nome: 'Zé', cargo: 'Farmacêutico' }] } });
  assert.equal(r2.json.equipe.criticas[0].nome, 'Farmacêutico(a)');
  await pool.query('delete from usuarios where email=$1', [email]);
});
