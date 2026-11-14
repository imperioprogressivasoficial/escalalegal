// A jornada de quem pagou: compra → cria a senha → primeiro acesso guiado → escala pronta + análise.
// E o contador: cadastro próprio, espaço do contador com as empresas, fechamento, planilha.
// Também: feriados do estado e da cidade, link da escala para o funcionário e "Minha conta".
const test = require('node:test');
const assert = require('node:assert');
const { analisar, gerarEscala, SETORES, limiteSemanal } = require('../public/scheduler.js');

const pular = !process.env.DATABASE_URL && 'defina DATABASE_URL para rodar';
process.env.WEBHOOK_TOKEN ||= 'tk-teste';
process.env.ADMIN_PASS ||= 'adm-teste';
process.env.SESSION_SECRET ||= 'segredo-teste';

test('limite semanal acompanha a EC 141/2026', () => {
  assert.equal(limiteSemanal('2026-12-15'), 44);
  assert.equal(limiteSemanal('2026-12-16'), 42);
  assert.equal(limiteSemanal('2027-12-15'), 42);
  assert.equal(limiteSemanal('2027-12-16'), 40);
});

test('análise aponta o que está errado em linguagem simples', () => {
  const s = SETORES.varejo, fs = ['A', 'B', 'C'].map(nome => ({ nome }));
  const { escala } = gerarEscala({ funcionarios: fs, abertos: s.abertos, minimo: s.minimo, semanas: 4 });
  const a = analisar({ inicio: '2027-01-04', semanas: 4, funcionarios: fs, abertos: s.abertos, minimo: s.minimo, dados: escala }, { horasDia: 9 });
  const titulos = a.itens.map(i => i.titulo).join(' | ');
  assert.match(titulos, /Falta 1 pessoa/); // varejo pede 4, tem 3
  assert.match(titulos, /\d+ dias? abaixo do mínimo/);
  assert.match(titulos, /9h por dia passa de 8h/);
  assert.ok(a.problemas >= 3);
  const ok = analisar({ inicio: '2027-01-04', semanas: 4, funcionarios: fs, abertos: [1, 1, 1, 1, 1, 0, 0], minimo: [1, 1, 1, 1, 1, 0, 0],
    dados: gerarEscala({ funcionarios: fs, abertos: [1, 1, 1, 1, 1, 0, 0], minimo: [1, 1, 1, 1, 1, 0, 0], semanas: 4 }).escala }, { horasDia: 8 });
  assert.equal(ok.problemas, 0); assert.match(ok.resumo, /pode publicar/);
});

test('jornada completa do cliente e do contador', { skip: pular }, async t => {
  const { app, migrar, pool } = require('../server.js');
  await migrar();
  const srv = app.listen(0);
  const base = `http://127.0.0.1:${srv.address().port}`;
  t.after(async () => { srv.close(); await pool.end(); });

  const sx = Date.now(), dono = `jdono${sx}@t.com`, cont = `jcont${sx}@t.com`, naoPagou = `jnp${sx}@t.com`;
  let ip = 0;
  const chama = async (url, { method = 'GET', body, cookie, conta } = {}) => {
    const r = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `10.9.${(ip / 250) | 0}.${ip++ % 250}`,
      ...(cookie && { cookie }), ...(conta && { 'x-conta': String(conta) }) }, body: body && JSON.stringify(body) });
    const txt = Buffer.from(await r.arrayBuffer()).toString('utf8');
    let json = null; try { json = JSON.parse(txt); } catch {}
    return { status: r.status, json, txt, headers: r.headers, cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
  };
  const linkDe = async email => /acesso=([\w-]+)/.exec((await pool.query('select texto from emails where para=$1 order by id desc limit 1', [email])).rows[0].texto)[1];

  // 1. comprou e criou a senha
  await chama(`/api/webhook/pagamento?token=${process.env.WEBHOOK_TOKEN}`, { method: 'POST', body: { email: dono, nome: 'Tássia Teste' } });
  const s = (await chama('/api/senha/definir', { method: 'POST', body: { token: await linkDe(dono), senha: 'senha123', empresa: 'Studio X' } })).cookie;
  assert.equal((await chama('/api/equipes', { cookie: s })).json.length, 0); // ainda sem unidade: o app abre o primeiro acesso

  // 2. primeiro acesso guiado: em um envio, cria tudo e já gera a escala
  let r = await chama('/api/onboarding', { method: 'POST', cookie: s, body: {
    empresa: { nome: 'Studio Progressiva', porte: 'me', uf: 'BA', cidade: 'Salvador', feriados_locais: '24/06, 08/12' },
    unidade: { nome: 'Salvador Norte Shopping', setor: 'salao', abertos: [1, 1, 1, 1, 1, 1, 1], minimo: [2, 2, 2, 2, 3, 4, 2], horas_dia: 8 },
    pessoas: ['Ana', 'Bia', 'Carla', 'Dani', 'Elis', 'Fabi'].map(nome => ({ nome })), inicio: '2027-06-21', semanas: 4,
  } });
  assert.equal(r.status, 200, r.txt);
  assert.equal(r.json.liberado, true);
  const esc = r.json.escala;
  assert.equal(esc.dados.length, 4); assert.equal(esc.funcionarios.length, 6);
  for (const sem of esc.dados) for (const f of sem) assert.equal(f.filter(c => c === 'F').length, 2);
  const eq = r.json.equipe;
  assert.equal(+eq.horas_dia, 8);
  // dados da empresa ficaram salvos, com feriados da Bahia e de Salvador
  r = await chama('/api/empresa', { cookie: s });
  assert.equal(r.json.nome, 'Studio Progressiva'); assert.equal(r.json.porte, 'me'); assert.equal(r.json.uf, 'BA');
  assert.deepEqual(r.json.feriados_locais.sort(), ['06-24', '12-08']);
  r = await chama('/api/conta', { cookie: s });
  assert.equal(r.json.ctx.uf, 'BA'); assert.ok(r.json.ctx.locais.includes('06-24'));
  // análise do que foi gerado (o front roda a mesma função)
  const a = analisar(esc, { horasDia: 8, ctx: r.json.ctx });
  assert.ok(a.itens.some(i => /feriado/.test(i.titulo) && /São João|Feriado municipal|Independência da Bahia/.test(i.texto)));
  // fechamento mostra o 2 de julho e o São João de Salvador como feriado
  r = await chama('/api/relatorio?mes=2027-07', { cookie: s });
  assert.equal(r.json.dias.find(d => d.data === '2027-07-02').feriado, 'Independência da Bahia');
  r = await chama('/api/relatorio?mes=2027-06', { cookie: s });
  assert.equal(r.json.dias.find(d => d.data === '2027-06-24').feriado, 'Feriado municipal');
  // segunda unidade pelo mesmo caminho, sem repetir os dados da empresa
  r = await chama('/api/onboarding', { method: 'POST', cookie: s, body: { unidade: { nome: 'Shopping Sumaré', setor: 'salao' }, pessoas: [{ nome: 'Gabi' }, { nome: 'Hana' }, { nome: 'Iris' }] } });
  assert.equal(r.status, 200); assert.ok(r.json.escala);
  assert.equal((await chama('/api/equipes', { cookie: s })).json.length, 2);
  assert.equal((await chama('/api/onboarding', { method: 'POST', cookie: s, body: { unidade: { nome: 'Vazia' }, pessoas: [] } })).status, 400);
  assert.equal((await chama('/api/empresa', { method: 'PUT', cookie: s, body: { cnpj: '123' } })).status, 400);

  // 3. quem ainda não pagou: monta tudo, mas a escala só sai depois do pagamento
  await chama('/api/cadastro', { method: 'POST', body: { nome: 'Sem Pagar', empresa: 'Loja Y', email: naoPagou, senha: 'senha123' } });
  const sn = (await chama('/api/login', { method: 'POST', body: { email: naoPagou, senha: 'senha123' } })).cookie;
  r = await chama('/api/onboarding', { method: 'POST', cookie: sn, body: { empresa: { porte: 'mei' }, unidade: { nome: 'Loja' }, pessoas: [{ nome: 'Zé' }] } });
  assert.equal(r.status, 200); assert.equal(r.json.liberado, false); assert.equal(r.json.escala, null);

  // 4. contador se cadastra sozinho, recebe acesso do cliente e vê no espaço dele
  r = await chama('/api/cadastro', { method: 'POST', body: { tipo: 'contador', nome: 'Carla Contábil', email: cont, senha: 'senha123' } });
  assert.equal(r.status, 200);
  const sc = r.cookie;
  let eu = (await chama('/api/eu', { cookie: sc })).json;
  assert.equal(eu.contador, true);
  assert.equal((await chama('/api/contador', { cookie: sc })).json.empresas.length, 0);
  await chama('/api/membros', { method: 'POST', cookie: s, body: { email: cont, papel: 'contador' } });
  r = await chama('/api/contador', { cookie: sc });
  assert.equal(r.json.empresas.length, 1);
  const emp = r.json.empresas[0];
  assert.equal(emp.empresa, 'Studio Progressiva'); assert.equal(emp.unidades, 2); assert.equal(emp.funcionarios, 9); assert.equal(emp.porte_nome, 'Microempresa (ME)');
  // abre a empresa do cliente: lê tudo, não altera, baixa a planilha
  assert.equal((await chama('/api/equipes', { cookie: sc, conta: emp.id })).json.length, 2);
  assert.equal((await chama('/api/onboarding', { method: 'POST', cookie: sc, conta: emp.id, body: { unidade: { nome: 'X' }, pessoas: [{ nome: 'Y' }] } })).status, 403);
  assert.equal((await chama('/api/empresa', { method: 'PUT', cookie: sc, conta: emp.id, body: { nome: 'Hack' } })).status, 403);
  r = await chama('/api/relatorio?mes=2027-07&formato=csv', { cookie: sc, conta: emp.id });
  assert.match(r.headers.get('content-type'), /text\/csv/); assert.match(r.txt, /Salvador Norte Shopping;;Ana/);
  // integração externa não existe mais
  assert.equal((await chama('/api/v1/fechamento?mes=2027-07')).status, 404);
  assert.equal((await chama('/api/empresa/chave', { method: 'POST', cookie: s })).status, 404);
  // dono fecha junho: contador é avisado e o espaço mostra o mês fechado quando for o mês anterior
  r = await chama('/api/fechamentos', { method: 'POST', cookie: s, body: { mes: '2026-10' } });
  assert.equal(r.json.contadores_avisados, 1);
  const aviso = (await pool.query("select texto from emails where para=$1 and assunto like 'Fechamento de 10/2026%'", [cont])).rows[0].texto;
  assert.match(aviso, /#contador/);

  // 5. funcionário vê pelo link, com o nome da empresa e feriados da cidade
  const link = (await chama(`/api/equipes/${eq.id}/link`, { method: 'POST', cookie: s })).json.link;
  r = await chama('/api/publico/escala/' + link.split('/e/')[1]);
  assert.equal(r.status, 200); assert.equal(r.json.equipe, 'Salvador Norte Shopping');

  // 6. minha conta
  assert.equal((await chama('/api/eu/senha', { method: 'POST', cookie: s, body: { atual: 'x', nova: 'nova12345' } })).status, 400);
  r = await chama('/api/eu/senha', { method: 'POST', cookie: s, body: { atual: 'senha123', nova: 'nova12345' } });
  assert.equal(r.status, 200);
  assert.equal((await chama('/api/eu', { cookie: s })).status, 401);
  assert.equal((await chama('/api/eu', { cookie: r.cookie })).status, 200);

  await pool.query('delete from usuarios where email = any($1)', [[dono, cont, naoPagou]]);
});
