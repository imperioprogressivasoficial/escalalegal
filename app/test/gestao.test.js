// Gestão completa: acessos (gestor/contador), ocorrências na escala, visão geral, fechamento do mês, histórico.
// Rode com: DATABASE_URL=postgres://... npm test
const test = require('node:test');
const assert = require('node:assert');

const pular = !process.env.DATABASE_URL && 'defina DATABASE_URL para rodar';
process.env.WEBHOOK_TOKEN ||= 'tk-teste';
process.env.ADMIN_PASS ||= 'adm-teste';
process.env.SESSION_SECRET ||= 'segredo-teste';

test('gestão: contador, gestor, ocorrências, fechamento', { skip: pular }, async t => {
  const { app, migrar, pool } = require('../server.js');
  await migrar();
  const srv = app.listen(0);
  const base = `http://127.0.0.1:${srv.address().port}`;
  t.after(async () => { srv.close(); await pool.end(); });

  const sx = Date.now();
  const emails = { dono: `dono${sx}@t.com`, cont: `cont${sx}@t.com`, gest: `gest${sx}@t.com`, outro: `outro${sx}@t.com` };
  let ip = 0; // cada chamada de um "IP" diferente, para o limitador não atrapalhar
  const chama = async (url, { method = 'GET', body, cookie, conta } = {}) => {
    const r = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `10.7.${(ip / 250) | 0}.${ip++ % 250}`,
      ...(cookie && { cookie }), ...(conta && { 'x-conta': String(conta) }) }, body: body && JSON.stringify(body) });
    const buf = Buffer.from(await r.arrayBuffer()), txt = buf.toString('utf8');
    let json = null; try { json = JSON.parse(txt); } catch {}
    return { status: r.status, json, txt, buf, headers: r.headers, cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
  };
  const linkDe = async email => {
    const { rows } = await pool.query('select texto from emails where para=$1 order by id desc limit 1', [email]);
    return /acesso=([\w-]+)/.exec(rows[0].texto)[1];
  };

  // dono compra e cria a senha
  await chama(`/api/webhook/pagamento?token=${process.env.WEBHOOK_TOKEN}`, { method: 'POST', body: { email: emails.dono, nome: 'Bruno Dono' } });
  const sDono = (await chama('/api/senha/definir', { method: 'POST', body: { token: await linkDe(emails.dono), senha: 'senha123', empresa: 'Loja Teste' } })).cookie;
  const eu = (await chama('/api/eu', { cookie: sDono })).json;
  const contaId = eu.id;
  assert.equal(eu.contas.length, 1); assert.equal(eu.contas[0].papel, 'dono');

  // equipe com 6 pessoas, aberta todo dia, mínimo 2
  const eq = (await chama('/api/equipes', { method: 'POST', cookie: sDono, body: { nome: 'Loja Centro', setor: 'farmacia' } })).json;
  const fs = (await chama(`/api/equipes/${eq.id}/funcionarios`, { method: 'POST', cookie: sDono,
    body: ['Ana', 'Bia', 'Caio', 'Duda', 'Edu', 'Fábio'].map((nome, i) => ({ nome, matricula: 'M' + i, admissao: '2025-02-01' })) })).json;
  const ana = fs.find(f => f.nome === 'Ana'), bia = fs.find(f => f.nome === 'Bia'), caio = fs.find(f => f.nome === 'Caio');
  assert.equal(ana.matricula, 'M0');

  // férias da Ana na semana inteira antes de gerar: a escala já sai sem ela
  const inicio = '2027-03-01'; // segunda-feira
  let r = await chama('/api/ocorrencias', { method: 'POST', cookie: sDono, body: { funcionario_id: ana.id, tipo: 'ferias', inicio, fim: '2027-03-07' } });
  assert.equal(r.status, 200, r.txt);
  r = await chama('/api/ocorrencias', { method: 'POST', cookie: sDono, body: { funcionario_id: ana.id, tipo: 'atestado', inicio: '2027-03-05' } });
  assert.equal(r.status, 409); assert.match(r.json.erro, /férias/);
  r = await chama('/api/ocorrencias', { method: 'POST', cookie: sDono, body: { funcionario_id: bia.id, tipo: 'banco_horas', inicio: '2027-03-10', horas: '2,5' } });
  assert.equal(+r.json.horas, 2.5);

  const esc = (await chama(`/api/equipes/${eq.id}/escalas`, { method: 'POST', cookie: sDono, body: { inicio, semanas: 2 } })).json;
  const iAna = esc.funcionarios.findIndex(f => f.id === ana.id), iCaio = esc.funcionarios.findIndex(f => f.id === caio.id);
  assert.deepEqual(esc.dados[0][iAna], ['V', 'V', 'V', 'V', 'V', 'V', 'V']);
  assert.equal(esc.dados[1][iAna].filter(c => c === 'F').length, 2); // volta das férias com as 2 folgas
  for (const [i, f] of esc.dados[0].entries()) if (i !== iAna) assert.equal(f.filter(c => c === 'F').length, 2);

  // atestado lançado depois aparece na escala na hora e não deixa trocar a célula
  const diaCaio = esc.dados[1][iCaio].indexOf('T'); // um dia que o Caio trabalharia na semana 2
  const dataAtestado = `2027-03-${String(8 + diaCaio).padStart(2, '0')}`;
  const oc = (await chama('/api/ocorrencias', { method: 'POST', cookie: sDono, body: { funcionario_id: caio.id, tipo: 'atestado', inicio: dataAtestado, obs: 'CID não informado' } })).json;
  let escs = (await chama(`/api/equipes/${eq.id}/escalas`, { cookie: sDono })).json;
  assert.equal(escs[0].dados[1][iCaio][diaCaio], 'M');
  r = await chama(`/api/escalas/${esc.id}`, { method: 'PATCH', cookie: sDono, body: { semana: 1, funcionario: iCaio, dia: diaCaio } });
  assert.equal(r.status, 409);
  // apagou o atestado: volta a trabalhar
  assert.equal((await chama(`/api/ocorrencias/${oc.id}`, { method: 'DELETE', cookie: sDono })).status, 200);
  escs = (await chama(`/api/equipes/${eq.id}/escalas`, { cookie: sDono })).json;
  assert.equal(escs[0].dados[1][iCaio][diaCaio], 'T');
  // falta de novo, para o relatório
  await chama('/api/ocorrencias', { method: 'POST', cookie: sDono, body: { funcionario_id: caio.id, tipo: 'falta', inicio: dataAtestado } });

  // ---- acessos ----
  r = await chama('/api/membros', { method: 'POST', cookie: sDono, body: { email: emails.cont, nome: 'Carla Contadora', papel: 'contador' } });
  assert.equal(r.status, 200); assert.ok(r.json.link);
  await chama('/api/membros', { method: 'POST', cookie: sDono, body: { email: emails.gest, nome: 'Gil Gestor', papel: 'gestor' } });
  // contador cria a senha sem informar empresa
  const tk = await linkDe(emails.cont);
  r = await chama('/api/senha/token?t=' + tk);
  assert.equal(r.json.convidado, true);
  const sCont = (await chama('/api/senha/definir', { method: 'POST', body: { token: tk, senha: 'senha123' } })).cookie;
  assert.ok(sCont);
  const euCont = (await chama('/api/eu', { cookie: sCont })).json;
  assert.ok(euCont.contas.some(c => c.id === contaId && c.papel === 'contador'));
  // sem escolher a empresa, o contador vê a conta dele (vazia)
  assert.equal((await chama('/api/equipes', { cookie: sCont })).json.length, 0);
  // na empresa do dono: vê tudo
  assert.equal((await chama('/api/equipes', { cookie: sCont, conta: contaId })).json.length, 1);
  assert.equal((await chama(`/api/equipes/${eq.id}/escalas`, { cookie: sCont, conta: contaId })).json.length, 1);
  assert.equal((await chama('/api/ocorrencias?de=2027-03-01&ate=2027-03-31', { cookie: sCont, conta: contaId })).json.length, 3);
  // mas não altera nada
  assert.equal((await chama('/api/equipes', { method: 'POST', cookie: sCont, conta: contaId, body: { nome: 'X' } })).status, 403);
  assert.equal((await chama(`/api/equipes/${eq.id}/escalas`, { method: 'POST', cookie: sCont, conta: contaId, body: {} })).status, 403);
  assert.equal((await chama('/api/ocorrencias', { method: 'POST', cookie: sCont, conta: contaId, body: { funcionario_id: bia.id, tipo: 'falta', inicio } })).status, 403);
  assert.equal((await chama(`/api/escalas/${esc.id}`, { method: 'PATCH', cookie: sCont, conta: contaId, body: { semana: 0, funcionario: 1, dia: 1 } })).status, 403);
  assert.equal((await chama('/api/membros', { cookie: sCont, conta: contaId })).status, 403);

  // gestor edita
  const sGest = (await chama('/api/senha/definir', { method: 'POST', body: { token: await linkDe(emails.gest), senha: 'senha123' } })).cookie;
  r = await chama(`/api/equipes/${eq.id}/funcionarios`, { method: 'POST', cookie: sGest, conta: contaId, body: { nome: 'Gabi' } });
  assert.equal(r.status, 200);
  assert.equal((await chama('/api/membros', { cookie: sGest, conta: contaId })).status, 403); // acessos só o dono

  // quem não é da empresa não entra nem trocando o cabeçalho
  await chama('/api/cadastro', { method: 'POST', body: { nome: 'Outro', empresa: 'Outra', email: emails.outro, senha: 'senha123' } });
  const sOutro = (await chama('/api/login', { method: 'POST', body: { email: emails.outro, senha: 'senha123' } })).cookie;
  assert.equal((await chama('/api/equipes', { cookie: sOutro, conta: contaId })).status, 403);
  assert.equal((await chama('/api/relatorio?mes=2027-03', { cookie: sOutro, conta: contaId })).status, 403);

  // ---- fechamento do mês ----
  r = await chama('/api/relatorio?mes=2027-03', { cookie: sCont, conta: contaId });
  assert.equal(r.status, 200); assert.equal(r.json.dias.length, 31);
  const la = r.json.linhas.find(l => l.id === ana.id), lc = r.json.linhas.find(l => l.id === caio.id), lb = r.json.linhas.find(l => l.id === bia.id);
  assert.equal(la.ferias, 7); assert.equal(la.trabalhados, 5); assert.equal(la.folgas, 2); assert.equal(la.sem_escala, 17);
  assert.equal(lc.faltas, 1); assert.equal(lc.trabalhados + lc.folgas + lc.faltas, 14);
  assert.equal(lb.banco_mes, 2.5); assert.equal(lb.banco_saldo, 2.5);
  assert.equal(la.matricula, 'M0');
  // planilha (abre no Excel com acento)
  r = await chama('/api/relatorio?mes=2027-03&formato=csv', { cookie: sCont, conta: contaId });
  assert.match(r.headers.get('content-type'), /text\/csv/);
  assert.ok(r.txt.startsWith('﻿Equipe;Matrícula;Funcionário'));
  assert.match(r.txt, /Loja Centro;M0;Ana;;5;2;\d;\d;0;0;7;0;0;0;0;17;FÉRIAS/);

  // ---- visão geral ----
  r = await chama('/api/visao?data=2027-03-03', { cookie: sDono });
  const v = r.json.equipes[0];
  assert.equal(v.dias.length, 7);
  assert.ok(v.hoje.ausentes.some(a => a.nome === 'Ana' && a.motivo === 'Férias'));
  assert.equal(v.hoje.trabalham.length + v.hoje.folgam.length + v.hoje.ausentes.length, 6);
  assert.equal(v.proxima_semana_sem_escala, false);
  assert.equal((await chama('/api/visao?data=2027-03-20', { cookie: sDono })).json.equipes[0].proxima_semana_sem_escala, true);

  // feriado de Sexta-feira Santa aparece na visão
  assert.equal((await chama('/api/visao?data=2027-03-26', { cookie: sDono })).json.feriado, 'Sexta-feira Santa');

  // ---- histórico ----
  const hist = (await chama('/api/historico', { cookie: sCont, conta: contaId })).json;
  assert.ok(hist.some(h => /Lançou férias para Ana/.test(h.acao) && h.quem === 'Bruno Dono'));
  assert.ok(hist.some(h => /Cadastrou Gabi/.test(h.acao) && h.quem === 'Gil Gestor'));
  assert.ok(hist.some(h => /Baixou o fechamento de 03\/2027/.test(h.acao) && h.quem === 'Carla Contadora'));

  // dono remove o acesso do contador: perde na hora
  const membros = (await chama('/api/membros', { cookie: sDono })).json;
  await chama(`/api/membros/${membros.find(m => m.email === emails.cont).id}`, { method: 'DELETE', cookie: sDono });
  assert.equal((await chama('/api/equipes', { cookie: sCont, conta: contaId })).status, 403);

  await pool.query('delete from usuarios where email = any($1)', [Object.values(emails)]);
});
