// Domingo das mulheres (CLT art. 386), feriados por unidade, avaliador e desfazer (reativar colaborador).
const test = require('node:test');
const assert = require('node:assert');
const E = require('../public/scheduler.js');

const pular = !process.env.DATABASE_URL && 'defina DATABASE_URL para rodar';
process.env.WEBHOOK_TOKEN ||= 'tk-teste';
process.env.ADMIN_PASS ||= 'adm-teste';
process.env.SESSION_SECRET ||= 'segredo-teste';

test('motor: mulher folga no domingo pelo menos a cada 2 semanas, mesmo fora do comércio', () => {
  const fs = ['Ana', 'Bia', 'Caio', 'Duda', 'Edu', 'Fábio', 'Gil'].map((nome, i) => ({ nome, sexo: i < 2 ? 'F' : null }));
  const r = E.gerarEscala({ funcionarios: fs, abertos: [1, 1, 1, 1, 1, 1, 1], minimo: [3, 3, 3, 3, 3, 3, 3], semanas: 8, domingoSemanas: 7 });
  for (const i of [0, 1]) {
    let seguidos = 0;
    r.escala.forEach(sem => { seguidos = sem[i][6] === 'T' ? seguidos + 1 : 0; assert.ok(seguidos < 2, `${fs[i].nome} trabalhou 2 domingos seguidos`); });
  }
  // a análise aponta a mulher que trabalha 2 domingos seguidos
  const dados = [0, 1].map(() => fs.map((_, i) => i === 0 ? ['F', 'F', 'T', 'T', 'T', 'T', 'T'] : ['T', 'T', 'T', 'T', 'T', 'F', 'F']));
  const a = E.analisar({ inicio: '2027-03-01', semanas: 2, funcionarios: fs, abertos: [1, 1, 1, 1, 1, 1, 1], minimo: [0, 0, 0, 0, 0, 0, 0], dados }, { domingoSemanas: 7 });
  const item = a.itens.find(x => x.titulo === 'Domingo de folga das mulheres');
  assert.ok(item && item.ok === false);
  assert.match(item.texto, /Ana: domingo de folga a cada 15 dias \(CLT, art\. 386\)/);
  assert.equal(E.domingoSemanasPessoa({ sexo: 'F' }, 3), 2);
  assert.equal(E.domingoSemanasPessoa({ sexo: 'M' }, 3), 3);
});

test('motor: feriado fechado (padrão), aberto, removido e extra', () => {
  // semana de 16/11/2026: sexta 20/11 é Consciência Negra
  const fs = ['A', 'B', 'C', 'D', 'E'].map(nome => ({ nome }));
  const abertos = [1, 1, 1, 1, 1, 1, 0], minimo = [2, 2, 2, 2, 2, 2, 0];
  const gera = config => {
    const ctx = { uf: 'SP', config };
    return E.gerarEscala({ funcionarios: fs, abertos, minimo, semanas: 1, feriadosFechados: E.diasFeriadoFechado('2026-11-16', 1, ctx, abertos) }).escala[0];
  };
  let sem = gera({});
  assert.ok(sem.every(p => p[4] === 'F'), 'feriado fechado: todos folgam');
  assert.ok(sem.every(p => p.filter(c => c === 'F').length === 3), 'feriado não come a folga da semana (domingo + 1 + feriado)');
  sem = gera({ abre: ['2026-11-20'] });
  assert.ok(sem.filter(p => p[4] === 'T').length >= 2, 'abre no feriado: cobre o mínimo');
  sem = gera({ removidos: ['2026-11-20'] });
  assert.ok(sem.filter(p => p[4] === 'T').length >= 2);
  assert.equal(E.feriado('2026-11-20', { config: { removidos: ['2026-11-20'] } }), null);
  sem = gera({ extras: [{ data: '2026-11-18', nome: 'Padroeiro' }] });
  assert.ok(sem.every(p => p[2] === 'F'));
  assert.equal(E.feriado('2026-11-18', { config: { extras: [{ data: '2026-11-18', nome: 'Padroeiro' }] } }), 'Padroeiro');
  const lista = E.feriadosEntre('2026-11-01', '2026-11-30', { uf: 'SP', config: { abre: ['2026-11-20'] } });
  assert.deepEqual(lista.map(f => [f.data, f.tipo, f.abre]), [['2026-11-02', 'nacional', false], ['2026-11-15', 'nacional', false], ['2026-11-20', 'nacional', true]]);
  // análise: aberto com gente trabalhando leva a nota da Lei 605/49
  const a = E.analisar({ inicio: '2026-11-16', semanas: 1, funcionarios: fs, abertos, minimo, dados: [gera({ abre: ['2026-11-20'] })] }, { ctx: { config: { abre: ['2026-11-20'] } } });
  assert.match(a.itens.find(i => /feriado/.test(i.titulo)).texto, /Lei 605\/49/);
});

test('avaliador: explica a conta quando o mínimo não fecha', () => {
  const fs = ['A', 'B', 'C'].map(nome => ({ nome }));
  const abertos = [1, 1, 1, 1, 1, 1, 1], minimo = [3, 3, 3, 2, 2, 2, 2];
  const r = E.gerarEscala({ funcionarios: fs, abertos, minimo, semanas: 1 });
  const itens = E.avaliar({ inicio: '2027-03-01', funcionarios: fs, abertos, minimo, dados: r.escala }, { ctx: {} });
  assert.equal(itens[0].tipo, 'conta');
  assert.equal(itens[0].texto, 'Faltam 2 dias de trabalho para cobrir a semana de 01/03 a 07/03: com 3 colaboradores e 2 folgas cada, sobram 15 dias de trabalho, mas o mínimo pede 17.');
  assert.deepEqual(itens[0].acoes, ['minimo', 'colaborador']);
  // tudo certo: nada a explicar
  assert.deepEqual(E.avaliar({ inicio: '2027-03-01', funcionarios: fs, abertos: [1, 1, 1, 1, 1, 0, 0], minimo: [2, 2, 2, 2, 2, 0, 0],
    dados: E.gerarEscala({ funcionarios: fs, abertos: [1, 1, 1, 1, 1, 0, 0], minimo: [2, 2, 2, 2, 2, 0, 0], semanas: 1 }).escala }, { ctx: {} }), []);
});

test('API: sexo do colaborador, feriados da unidade e reativar (só na própria conta)', { skip: pular }, async t => {
  const { app, migrar, pool } = require('../server.js');
  await migrar();
  const srv = app.listen(0);
  const base = `http://127.0.0.1:${srv.address().port}`;
  t.after(async () => { srv.close(); await pool.end(); });
  let ip = 0;
  const chama = async (url, { method = 'GET', body, cookie } = {}) => {
    const r = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `10.9.${(ip / 250) | 0}.${ip++ % 250}`, ...(cookie && { cookie }) }, body: body && JSON.stringify(body) });
    const txt = await r.text(); let json = null; try { json = JSON.parse(txt); } catch {}
    return { status: r.status, json, txt, cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
  };
  const conta = async email => {
    await chama(`/api/webhook/pagamento?token=${process.env.WEBHOOK_TOKEN}`, { method: 'POST', body: { email, nome: 'Dono' } });
    const { rows } = await pool.query('select texto from emails where para=$1 order by id desc limit 1', [email]);
    return (await chama('/api/senha/definir', { method: 'POST', body: { token: /acesso=([\w-]+)/.exec(rows[0].texto)[1], senha: 'senha123', empresa: 'Loja' } })).cookie;
  };
  const sx = Date.now(), s1 = await conta(`mel1${sx}@t.com`), s2 = await conta(`mel2${sx}@t.com`);

  const eq = (await chama('/api/equipes', { method: 'POST', cookie: s1, body: { nome: 'Centro', setor: 'salao',
    feriados_config: { abre: ['2027-04-21', 'lixo'], removidos: ['2027-05-01'], extras: [{ data: '2027-03-19', nome: 'São José' }, { data: 'x' }] } } })).json;
  assert.deepEqual(eq.feriados_config, { abre: ['2027-04-21'], fecha: [], removidos: ['2027-05-01'], extras: [{ data: '2027-03-19', nome: 'São José' }] });
  let r = await chama(`/api/equipes/${eq.id}`, { method: 'PUT', cookie: s1, body: { feriados_config: { abre: [], removidos: [], extras: [] } } });
  assert.deepEqual(r.json.feriados_config, { abre: [], fecha: [], removidos: [], extras: [] });
  r = await chama(`/api/equipes/${eq.id}`, { method: 'PUT', cookie: s2, body: { feriados_config: { abre: ['2027-04-21'] } } });
  assert.equal(r.status, 404, 'outra empresa não mexe nos feriados');

  const [ana, bia] = (await chama(`/api/equipes/${eq.id}/funcionarios`, { method: 'POST', cookie: s1, body: [{ nome: 'Ana', sexo: 'f' }, { nome: 'Bia' }] })).json;
  assert.equal(ana.sexo, 'F'); assert.equal(bia.sexo, null);
  r = await chama(`/api/funcionarios/${bia.id}`, { method: 'PUT', cookie: s1, body: { nome: 'Bia', sexo: 'F', entrada: '08:00', saida: '17:00' } });
  assert.equal(r.json.sexo, 'F'); assert.equal(r.json.entrada, '08:00');
  r = await chama(`/api/funcionarios/${bia.id}`, { method: 'PUT', cookie: s1, body: { nome: 'Bia Souza' } });
  assert.equal(r.json.sexo, 'F', 'sem o campo, o sexo continua'); assert.equal(r.json.saida, '17:00');
  r = await chama(`/api/funcionarios/${bia.id}`, { method: 'PUT', cookie: s1, body: { nome: 'Bia', sexo: 'X' } });
  assert.equal(r.json.sexo, null);
  r = await chama(`/api/funcionarios/${ana.id}`, { method: 'PUT', cookie: s2, body: { nome: 'Ana', sexo: 'M' } });
  assert.equal(r.status, 404);

  // a escala guarda o sexo e os feriados fechados
  const esc = (await chama(`/api/equipes/${eq.id}/escalas`, { method: 'POST', cookie: s1, body: { inicio: '2027-04-19', semanas: 1 } })).json;
  assert.equal(esc.funcionarios.find(f => f.id === ana.id).sexo, 'F');
  assert.deepEqual(esc.feriados, ['2027-04-21']); // Tiradentes, quarta
  assert.ok(esc.dados[0].every(p => p[2] === 'F'));

  // desfazer a remoção
  await chama(`/api/funcionarios/${ana.id}`, { method: 'DELETE', cookie: s1 });
  r = await chama(`/api/funcionarios/${ana.id}/reativar`, { method: 'POST', cookie: s2 });
  assert.equal(r.status, 404);
  r = await chama(`/api/funcionarios/${ana.id}/reativar`, { method: 'POST', cookie: s1 });
  assert.equal(r.json.ativo, true);
  const lista = (await chama(`/api/equipes/${eq.id}/funcionarios`, { cookie: s1 })).json;
  assert.ok(lista.some(f => f.id === ana.id));
  const eqs = (await chama('/api/equipes', { cookie: s1 })).json;
  assert.equal(typeof eqs[0].publicada, 'boolean');
});

test('feriado: unidade que abre no domingo abre no feriado por padrão; a escolha de cada data vence', () => {
  const Escala = require('../public/scheduler.js');
  const d = '2026-11-20'; // Consciência Negra (nacional)
  const todo = [1, 1, 1, 1, 1, 1, 1], semDom = [1, 1, 1, 1, 1, 1, 0];
  assert.equal(Escala.feriadoAberto(d, { config: Escala.configFeriados({}, todo) }), true);
  assert.equal(Escala.feriadoAberto(d, { config: Escala.configFeriados({}, semDom) }), false);
  assert.equal(Escala.feriadoAberto(d, { config: Escala.configFeriados({ fecha: [d] }, todo) }), false);
  assert.equal(Escala.feriadoAberto(d, { config: Escala.configFeriados({ abre: [d] }, semDom) }), true);
});
