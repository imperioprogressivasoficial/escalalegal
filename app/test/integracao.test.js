// Integração contábil (códigos da folha, arquivo de eventos, fechar mês, API com chave),
// link da escala para funcionários e "Minha conta".
const test = require('node:test');
const assert = require('node:assert');

const pular = !process.env.DATABASE_URL && 'defina DATABASE_URL para rodar';
process.env.WEBHOOK_TOKEN ||= 'tk-teste';
process.env.ADMIN_PASS ||= 'adm-teste';
process.env.SESSION_SECRET ||= 'segredo-teste';

test('integração contábil, link público e minha conta', { skip: pular }, async t => {
  const { app, migrar, pool } = require('../server.js');
  await migrar();
  const srv = app.listen(0);
  const base = `http://127.0.0.1:${srv.address().port}`;
  t.after(async () => { srv.close(); await pool.end(); });

  const sx = Date.now(), dono = `idono${sx}@t.com`, cont = `icont${sx}@t.com`, gest = `igest${sx}@t.com`;
  let ip = 0;
  const chama = async (url, { method = 'GET', body, cookie, conta, auth } = {}) => {
    const r = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `10.8.${(ip / 250) | 0}.${ip++ % 250}`,
      ...(cookie && { cookie }), ...(conta && { 'x-conta': String(conta) }), ...(auth && { authorization: auth }) }, body: body && JSON.stringify(body) });
    const buf = Buffer.from(await r.arrayBuffer()), txt = buf.toString('utf8');
    let json = null; try { json = JSON.parse(txt); } catch {}
    return { status: r.status, json, txt, headers: r.headers, cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
  };
  const linkDe = async email => /acesso=([\w-]+)/.exec((await pool.query('select texto from emails where para=$1 order by id desc limit 1', [email])).rows[0].texto)[1];

  await chama(`/api/webhook/pagamento?token=${process.env.WEBHOOK_TOKEN}`, { method: 'POST', body: { email: dono, nome: 'Dona Integração' } });
  const s = (await chama('/api/senha/definir', { method: 'POST', body: { token: await linkDe(dono), senha: 'senha123', empresa: 'Mercado Bom Preço' } })).cookie;
  const contaId = (await chama('/api/eu', { cookie: s })).json.id;
  const eq = (await chama('/api/equipes', { method: 'POST', cookie: s, body: { nome: 'Caixas', setor: 'farmacia' } })).json;
  const fs = (await chama(`/api/equipes/${eq.id}/funcionarios`, { method: 'POST', cookie: s,
    body: [{ nome: 'Rita', matricula: '501' }, { nome: 'Sara', matricula: '502' }, { nome: 'Téo', matricula: '503' }, { nome: 'Uri' }] })).json;
  const [rita, sara, teo] = fs;
  await chama(`/api/equipes/${eq.id}/escalas`, { method: 'POST', cookie: s, body: { inicio: '2026-09-28', semanas: 6 } }); // cobre outubro inteiro
  await chama('/api/ocorrencias', { method: 'POST', cookie: s, body: { funcionario_id: rita.id, tipo: 'falta', inicio: '2026-10-06' } });
  await chama('/api/ocorrencias', { method: 'POST', cookie: s, body: { funcionario_id: sara.id, tipo: 'atestado', inicio: '2026-10-13', fim: '2026-10-14' } });
  await chama('/api/ocorrencias', { method: 'POST', cookie: s, body: { funcionario_id: teo.id, tipo: 'banco_horas', inicio: '2026-10-20', horas: '3' } });
  await chama('/api/ocorrencias', { method: 'POST', cookie: s, body: { funcionario_id: teo.id, tipo: 'banco_horas', inicio: '2026-10-21', horas: '-1,5' } });

  // contador da empresa configura os códigos da folha
  await chama('/api/membros', { method: 'POST', cookie: s, body: { email: cont, nome: 'Contábil Silva', papel: 'contador' } });
  const sc = (await chama('/api/senha/definir', { method: 'POST', body: { token: await linkDe(cont), senha: 'senha123' } })).cookie;
  await chama('/api/membros', { method: 'POST', cookie: s, body: { email: gest, papel: 'gestor' } });
  const sg = (await chama('/api/senha/definir', { method: 'POST', body: { token: await linkDe(gest), senha: 'senha123' } })).cookie;

  let r = await chama('/api/empresa', { cookie: sc, conta: contaId });
  assert.equal(r.json.catalogo.length, 10);
  r = await chama('/api/empresa', { method: 'PUT', cookie: sc, conta: contaId, body: { razao_social: 'Tentativa do contador', eventos: { faltas: '8792', atestado: '8794', domingos: '150', feriados: '151', horas_credito: '200', horas_debito: '8800', ferias: '' } } });
  assert.equal(r.status, 200);
  assert.equal((await chama('/api/empresa', { method: 'PUT', cookie: sg, conta: contaId, body: { eventos: {} } })).status, 403); // gestor não mexe
  r = await chama('/api/empresa', { method: 'PUT', cookie: s, body: { razao_social: 'Mercado Bom Preço LTDA', cnpj: '12.345.678/0001-90', eventos: (await chama('/api/empresa', { cookie: s })).json.eventos } });
  assert.equal(r.status, 200);
  r = await chama('/api/empresa', { cookie: s });
  assert.equal(r.json.razao_social, 'Mercado Bom Preço LTDA'); assert.equal(r.json.cnpj, '12345678000190');
  assert.equal(r.json.eventos.faltas, '8792'); assert.equal(r.json.eventos.ferias, undefined);
  assert.equal((await chama('/api/empresa', { method: 'PUT', cookie: s, body: { cnpj: '123' } })).status, 400);

  // fechamento de outubro
  r = await chama('/api/relatorio?mes=2026-10', { cookie: sc, conta: contaId });
  assert.equal(r.json.empresa, 'Mercado Bom Preço LTDA'); assert.equal(r.json.fechado, null);
  assert.equal(r.json.eventos_configurados, 6); assert.equal(r.json.sem_matricula, 1);
  const lt = r.json.linhas.find(l => l.nome === 'Téo');
  assert.equal(lt.horas_credito, 3); assert.equal(lt.horas_debito, 1.5); assert.equal(lt.banco_mes, 1.5);

  // arquivo de eventos (com cabeçalho) e TXT simples
  r = await chama('/api/relatorio?mes=2026-10&formato=eventos', { cookie: sc, conta: contaId });
  assert.match(r.headers.get('content-disposition'), /eventos-folha-2026-10\.csv/);
  assert.match(r.txt, /Competência;Matrícula;Funcionário;Código do evento;Evento;Quantidade;Unidade/);
  assert.match(r.txt, /10\/2026;501;Rita;8792;Faltas;1;dias/);
  assert.match(r.txt, /10\/2026;502;Sara;8794;Atestado médico;2;dias/);
  assert.match(r.txt, /10\/2026;503;Téo;200;Horas extras \(banco, crédito\);3;horas/);
  assert.match(r.txt, /10\/2026;503;Téo;8800;Horas a descontar \(banco, débito\);1,5;horas/);
  assert.doesNotMatch(r.txt, /;Férias;/); // sem código, não exporta
  r = await chama('/api/relatorio?mes=2026-10&formato=eventos&layout=simples', { cookie: sc, conta: contaId });
  assert.match(r.headers.get('content-type'), /text\/plain/);
  assert.match(r.txt, /^501;8792;1\r\n/m); assert.match(r.txt, /^503;8800;1,5\r\n/m);

  // gestor fecha o mês: contador recebe e-mail
  r = await chama('/api/fechamentos', { method: 'POST', cookie: sg, conta: contaId, body: { mes: '2026-10' } });
  assert.equal(r.status, 200); assert.equal(r.json.contadores_avisados, 1);
  const { rows: m } = await pool.query("select assunto from emails where para=$1 and assunto like 'Fechamento de 10/2026%'", [cont]);
  assert.equal(m.length, 1);
  assert.equal((await chama('/api/fechamentos', { method: 'POST', cookie: s, body: { mes: '2026-10' } })).status, 409);
  assert.equal((await chama('/api/fechamentos', { method: 'POST', cookie: s, body: { mes: '2099-01' } })).status, 400);
  assert.equal((await chama('/api/fechamentos', { method: 'POST', cookie: sc, conta: contaId, body: { mes: '2026-09' } })).status, 403); // contador não fecha

  // mês fechado trava alterações
  r = await chama('/api/ocorrencias', { method: 'POST', cookie: s, body: { funcionario_id: rita.id, tipo: 'falta', inicio: '2026-10-07' } });
  assert.equal(r.status, 409); assert.match(r.json.erro, /10\/2026 já foi fechado/);
  const oc = (await chama('/api/ocorrencias?de=2026-10-01&ate=2026-10-31', { cookie: s })).json.find(o => o.tipo === 'falta');
  assert.equal((await chama(`/api/ocorrencias/${oc.id}`, { method: 'DELETE', cookie: s })).status, 409);
  const esc = (await chama(`/api/equipes/${eq.id}/escalas`, { cookie: s })).json[0];
  assert.equal((await chama(`/api/escalas/${esc.id}`, { method: 'PATCH', cookie: s, body: { semana: 1, funcionario: 0, dia: 2 } })).status, 409); // 07/10
  assert.equal((await chama(`/api/escalas/${esc.id}`, { method: 'PATCH', cookie: s, body: { semana: 0, funcionario: 0, dia: 0 } })).status, 200); // 28/09 continua aberto
  assert.equal((await chama(`/api/equipes/${eq.id}/escalas`, { method: 'POST', cookie: s, body: { inicio: '2026-10-26', semanas: 2 } })).status, 409);
  // números congelados: mudar o cadastro depois não mexe no fechamento
  await chama(`/api/funcionarios/${rita.id}`, { method: 'PUT', cookie: s, body: { nome: 'Rita Nova', matricula: '999' } });
  r = await chama('/api/relatorio?mes=2026-10', { cookie: sc, conta: contaId });
  assert.ok(r.json.fechado?.por); assert.ok(r.json.linhas.some(l => l.nome === 'Rita' && l.matricula === '501' && l.faltas === 1));

  // reabrir: só o dono
  assert.equal((await chama('/api/fechamentos/2026-10', { method: 'DELETE', cookie: sg, conta: contaId })).status, 403);
  assert.equal((await chama('/api/fechamentos/2026-10', { method: 'DELETE', cookie: s })).status, 200);
  assert.equal((await chama('/api/relatorio?mes=2026-10', { cookie: s })).json.fechado, null);
  await chama('/api/fechamentos', { method: 'POST', cookie: s, body: { mes: '2026-10' } });

  // ---- API de integração ----
  assert.equal((await chama('/api/empresa/chave', { method: 'POST', cookie: sc, conta: contaId })).status, 403); // só o dono gera
  const chave = (await chama('/api/empresa/chave', { method: 'POST', cookie: s })).json.chave;
  assert.match(chave, /^el_/);
  assert.match((await chama('/api/empresa', { cookie: s })).json.api.prefixo, /^el_.{4}…/);
  assert.equal((await chama('/api/v1/fechamento?mes=2026-10')).status, 401);
  assert.equal((await chama('/api/v1/fechamento?mes=2026-10', { auth: 'Bearer el_chaveerradaerradaerradaerrada' })).status, 401);
  const A = 'Bearer ' + chave;
  r = await chama('/api/v1/empresa', { auth: A });
  assert.deepEqual(r.json, { empresa: 'Mercado Bom Preço LTDA', cnpj: '12345678000190' });
  r = await chama('/api/v1/fechamento?mes=2026-10', { auth: A });
  assert.equal(r.json.linhas.length, 4); assert.ok(r.json.fechado);
  r = await chama('/api/v1/fechamento?mes=2026-10&formato=eventos&layout=simples', { auth: A });
  assert.match(r.txt, /^999;8792;1/m); // fechado de novo depois da reabertura: pega a matrícula atualizada
  assert.equal((await chama('/api/v1/fechamentos', { auth: A })).json[0].mes, '2026-10');
  assert.equal((await chama('/api/v1/funcionarios', { auth: A })).json.length, 4);
  assert.equal((await chama('/api/v1/ocorrencias?de=2026-10-01&ate=2026-10-31', { auth: A })).json.length, 4);
  // trocar a chave desliga a anterior
  const chave2 = (await chama('/api/empresa/chave', { method: 'POST', cookie: s })).json.chave;
  assert.equal((await chama('/api/v1/empresa', { auth: A })).status, 401);
  assert.equal((await chama('/api/v1/empresa', { auth: 'Bearer ' + chave2 })).status, 200);
  await chama('/api/empresa/chave', { method: 'DELETE', cookie: s });
  assert.equal((await chama('/api/v1/empresa', { auth: 'Bearer ' + chave2 })).status, 401);

  // ---- link da escala para os funcionários ----
  assert.equal((await chama(`/api/equipes/${eq.id}/link`, { method: 'POST', cookie: sc, conta: contaId })).status, 403);
  const link = (await chama(`/api/equipes/${eq.id}/link`, { method: 'POST', cookie: s })).json.link;
  const tk = link.split('/e/')[1];
  assert.equal((await chama(`/api/equipes/${eq.id}/link`, { method: 'POST', cookie: s })).json.link, link); // mesmo link
  assert.equal((await chama('/e/' + tk)).status, 200);
  await chama(`/api/equipes/${eq.id}/escalas`, { method: 'POST', cookie: s, body: { semanas: 2 } }); // a partir de hoje
  r = await chama('/api/publico/escala/' + tk);
  assert.equal(r.status, 200); assert.equal(r.json.equipe, 'Caixas'); assert.equal(r.json.empresa, 'Mercado Bom Preço LTDA');
  assert.equal(r.json.dias.length, 28); assert.equal(r.json.pessoas.length, 4);
  assert.ok(r.json.pessoas[0].dias.slice(0, 14).some(c => c === 'F'));
  assert.equal(r.json.pessoas[0].matricula, undefined); // não expõe dados internos
  const novo = (await chama(`/api/equipes/${eq.id}/link`, { method: 'POST', cookie: s, body: { novo: true } })).json.link;
  assert.notEqual(novo, link);
  assert.equal((await chama('/api/publico/escala/' + tk)).status, 404);

  // ---- minha conta ----
  assert.equal((await chama('/api/eu', { method: 'PUT', cookie: s, body: { nome: 'Dona Maria', whatsapp: '(71) 98888-7777' } })).status, 200);
  assert.equal((await chama('/api/eu', { cookie: s })).json.nome, 'Dona Maria');
  assert.equal((await chama('/api/eu/senha', { method: 'POST', cookie: s, body: { atual: 'errada', nova: 'nova12345' } })).status, 400);
  r = await chama('/api/eu/senha', { method: 'POST', cookie: s, body: { atual: 'senha123', nova: 'nova12345' } });
  assert.equal(r.status, 200);
  assert.equal((await chama('/api/eu', { cookie: s })).status, 401); // sessão antiga cai
  assert.equal((await chama('/api/eu', { cookie: r.cookie })).status, 200); // a deste aparelho continua
  assert.equal((await chama('/api/login', { method: 'POST', body: { email: dono, senha: 'nova12345' } })).status, 200);

  // histórico registra o que importa para a contabilidade
  const h = (await chama('/api/historico', { cookie: r.cookie })).json.map(x => x.acao).join('\n');
  assert.match(h, /Fechou o mês 10\/2026/); assert.match(h, /Reabriu o mês 10\/2026/); assert.match(h, /códigos da folha/); assert.match(h, /chave de integração/);

  await pool.query('delete from usuarios where email = any($1)', [[dono, cont, gest]]);
});
