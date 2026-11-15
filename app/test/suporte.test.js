// Suporte: base de dúvidas, assistente (n8n simulado), limite de mensagens, chamados e /admin.
const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const FAQ = require('../suporte/faq.js');
const { prompt } = require('../suporte/prompt.js');

test('dúvidas frequentes: hierarquia, rotas do app e busca', () => {
  assert.ok(FAQ.CATEGORIAS.length >= 8);
  assert.ok(FAQ.total() >= 35);
  const ids = new Set();
  const ROTAS = /^(inicio|comecar|escala(\/(semana|pessoa|mes|publicar))?|colaboradores(\/ausencias)?|fechamento(\/contabilidade)?|mais|funcionamento|unidades|empresa|conta|aula(\/\d+)?|materiais|instalar|indique|contador)$/;
  for (const c of FAQ.CATEGORIAS) for (const q of c.perguntas) {
    assert.ok(!ids.has(q.id), 'id repetido: ' + q.id); ids.add(q.id);
    assert.match(q.ir, ROTAS, q.id);
    assert.ok(q.p && q.r && q.botao, q.id);
    assert.doesNotMatch(q.r, /[\u{1F300}-\u{1FAFF}]/u, 'sem emoji: ' + q.id);
  }
  assert.equal(FAQ.buscar('como troco a folga')[0].id, 'trocar-folga');
  assert.equal(FAQ.buscar('reembolso')[0].id, 'reembolso');
  assert.equal(FAQ.buscar('ferias')[0].categoria, 'colaboradores');
  assert.deepEqual(FAQ.buscar('   '), []);
  // o prompt leva a base inteira e não tem chaves (o n8n trata { } como modelo)
  const p = prompt();
  for (const c of FAQ.CATEGORIAS) assert.ok(p.includes('## ' + c.nome));
  assert.doesNotMatch(p, /[{}]/);
});

const pular = !process.env.DATABASE_URL && 'defina DATABASE_URL para rodar';
process.env.WEBHOOK_TOKEN ||= 'tk-teste';
process.env.ADMIN_PASS ||= 'adm-teste';
process.env.SESSION_SECRET ||= 'segredo-teste';
process.env.SUPORTE_MAX_HORA = '9';
process.env.SUPORTE_N8N_TOKEN = 'token-do-n8n';
process.env.SUPORTE_WHATSAPP = '5571993357290';

test('assistente, limite, chamados e /admin', { skip: pular }, async t => {
  // n8n de mentira: guarda o que recebeu e responde conforme a mensagem
  const recebidos = [];
  const n8n = http.createServer((req, res) => {
    let corpo = ''; req.on('data', c => corpo += c);
    req.on('end', () => {
      const b = JSON.parse(corpo); recebidos.push({ headers: req.headers, body: b });
      if (req.headers['x-suporte-token'] !== 'token-do-n8n') { res.writeHead(401); return res.end('{}'); }
      if (/quebrado/.test(b.mensagem)) { res.writeHead(500); return res.end('erro'); }
      const escalar = /sumiu|ajuda humana/.test(b.mensagem);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(/lista/.test(b.mensagem)
        ? [{ output: { resposta: 'Formato em lista.', resolvido: true, escalar: false, resumo: '' } }]
        : { resposta: escalar ? 'Vou chamar o suporte.' : 'Na Escala, toque no nome da pessoa.', resolvido: !escalar, escalar, resumo: escalar ? 'Escala sumiu da tela' : '' }));
    });
  });
  await new Promise(r => n8n.listen(0, r));
  process.env.SUPORTE_N8N_URL = `http://127.0.0.1:${n8n.address().port}/webhook/suporte-teste`;

  const { app, migrar, pool } = require('../server.js');
  await migrar();
  const srv = app.listen(0);
  const base = `http://127.0.0.1:${srv.address().port}`;
  t.after(async () => { srv.close(); n8n.close(); await pool.end(); });
  const chama = async (url, { method = 'GET', body, cookie, headers = {} } = {}) => {
    const r = await fetch(base + url, { method, redirect: 'manual', headers: { 'Content-Type': 'application/json', ...(cookie && { cookie }), ...headers }, body: body && JSON.stringify(body) });
    const tipo = r.headers.get('content-type') || '';
    return { status: r.status, headers: r.headers, json: tipo.includes('json') ? await r.json() : null, texto: tipo.includes('json') ? '' : await r.text(), cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
  };
  const q = (s, p) => pool.query(s, p).then(r => r.rows);
  const adm = { authorization: 'Basic ' + Buffer.from('admin:' + process.env.ADMIN_PASS).toString('base64') };
  const suf = Date.now(), email = `suporte${suf}@teste.com`;

  // a base para o widget é pública
  let r = await chama('/suporte/faq.js');
  assert.equal(r.status, 200); assert.match(r.headers.get('content-type'), /javascript/); assert.match(r.texto, /SuporteFAQ/);

  // sem login: 401 e nada vai para o n8n
  r = await chama('/api/suporte/mensagem', { method: 'POST', body: { conversa_id: 'conversa-sem-login', mensagem: 'oi' } });
  assert.equal(r.status, 401); assert.equal(recebidos.length, 0);
  // contato público: só o link, sem dados
  r = await chama('/api/suporte/contato');
  assert.match(r.json.link, /^https:\/\/wa\.me\/5571993357290\?text=/);

  // cliente com compra aprovada cria a senha
  await chama(`/api/webhook/pagamento?token=${process.env.WEBHOOK_TOKEN}`, { method: 'POST', body: { order_id: `S${suf}`, order_status: 'paid', webhook_event_type: 'order_approved', Customer: { email, full_name: 'Maria Suporte' } } });
  const token = /acesso=([\w-]+)/.exec((await q("select texto from emails where para=$1 order by id limit 1", [email]))[0].texto)[1];
  const cookie = (await chama('/api/senha/definir', { method: 'POST', body: { token, senha: 'senha123', empresa: 'Mercado da Maria' } })).cookie;
  assert.ok(cookie);
  const eu = (await q('select id from usuarios where email=$1', [email]))[0];

  // outro site não pode mandar mensagem (Origin)
  r = await chama('/api/suporte/mensagem', { method: 'POST', cookie, headers: { origin: 'https://site-copiado.com' }, body: { conversa_id: 'conversa-origem', mensagem: 'oi' } });
  assert.equal(r.status, 403);
  // dados inválidos
  assert.equal((await chama('/api/suporte/mensagem', { method: 'POST', cookie, body: { conversa_id: 'x', mensagem: 'oi' } })).status, 400);
  assert.equal((await chama('/api/suporte/mensagem', { method: 'POST', cookie, body: { conversa_id: 'conversa-vazia', mensagem: '  ' } })).status, 400);
  // empresa de outra pessoa
  assert.equal((await chama('/api/suporte/mensagem', { method: 'POST', cookie, headers: { 'x-conta': '999999999' }, body: { conversa_id: 'conversa-outra', mensagem: 'oi' } })).status, 403);

  // 1) dúvida resolvida: contexto certo, sem senha/e-mail/cookie, sem chamado
  r = await chama('/api/suporte/mensagem', { method: 'POST', cookie, body: { conversa_id: 'conversa-um-123', mensagem: 'Como troco a folga?', tela: 'escala/semana' } });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { resposta: 'Na Escala, toque no nome da pessoa.', resolvido: true, escalar: false, resumo: '' });
  const ultimo = recebidos.at(-1);
  assert.equal(ultimo.headers['x-suporte-token'], 'token-do-n8n');
  assert.equal(ultimo.body.conversa_id, `u${eu.id}-conversa-um-123`);
  assert.deepEqual(ultimo.body.contexto, { nome: 'Maria Suporte', empresa: 'Mercado da Maria', papel: 'dono', tela: 'escala/semana', acesso: 'pago e liberado' });
  const enviado = JSON.stringify(ultimo.body);
  assert.doesNotMatch(enviado, /senha123|@teste\.com|sid=|tk-teste/);
  assert.equal((await q('select 1 from suporte_chamados where usuario_id=$1', [eu.id])).length, 0);

  // resposta do n8n em outro formato (lista com output) também serve
  r = await chama('/api/suporte/mensagem', { method: 'POST', cookie, body: { conversa_id: 'conversa-um-123', mensagem: 'responde em lista' } });
  assert.equal(r.json.resposta, 'Formato em lista.');

  // 2) o assistente escala: chamado salvo com a conversa; repetir não duplica
  const historico = [{ de: 'cliente', texto: 'Como troco a folga?' }, { de: 'assistente', texto: 'Na Escala, toque no nome da pessoa.' }];
  r = await chama('/api/suporte/mensagem', { method: 'POST', cookie, body: { conversa_id: 'conversa-dois-456', mensagem: 'A escala sumiu da tela', historico, tela: 'escala' } });
  assert.equal(r.json.escalar, true); assert.equal(r.json.resolvido, false); assert.ok(r.json.chamado);
  let ch = await q('select * from suporte_chamados where usuario_id=$1', [eu.id]);
  assert.equal(ch.length, 1);
  assert.deepEqual([ch[0].status, ch[0].resumo, ch[0].tela, ch[0].origem, ch[0].conta_id], ['aberto', 'Escala sumiu da tela', 'escala', 'assistente', eu.id]);
  assert.deepEqual(ch[0].conversa.map(m => m.de), ['cliente', 'assistente', 'cliente', 'assistente']);
  r = await chama('/api/suporte/mensagem', { method: 'POST', cookie, body: { conversa_id: 'conversa-dois-456', mensagem: 'quero ajuda humana', historico } });
  assert.equal(r.json.chamado, ch[0].id);
  assert.equal((await q('select count(*)::int n from suporte_chamados where usuario_id=$1', [eu.id]))[0].n, 1);

  // pedir uma pessoa ou falar de reembolso escala mesmo que a IA não escale
  r = await chama('/api/suporte/mensagem', { method: 'POST', cookie, body: { conversa_id: 'conversa-tres-789', mensagem: 'Quero falar com uma pessoa' } });
  assert.equal(r.json.escalar, true);

  // 3) n8n fora do ar: resposta de reserva que leva ao WhatsApp
  r = await chama('/api/suporte/mensagem', { method: 'POST', cookie, body: { conversa_id: 'conversa-quatro-1', mensagem: 'isto está quebrado' } });
  assert.equal(r.status, 200); assert.equal(r.json.escalar, true); assert.equal(r.json.indisponivel, true);

  // 4) limite por pessoa (SUPORTE_MAX_HORA=9): a 10ª mensagem na hora é recusada
  r = await chama('/api/suporte/mensagem', { method: 'POST', cookie, body: { conversa_id: 'conversa-cinco-1', mensagem: 'mais uma' } });
  assert.equal(r.status, 200);
  const antes = recebidos.length;
  r = await chama('/api/suporte/mensagem', { method: 'POST', cookie, body: { conversa_id: 'conversa-cinco-1', mensagem: 'passou do limite' } });
  assert.equal(r.status, 429); assert.equal(r.json.escalar, true); assert.equal(recebidos.length, antes);

  // 5) "Falar com o suporte no WhatsApp": link com nome, empresa, e-mail e dúvida; mesmo chamado
  r = await chama('/api/suporte/chamado', { method: 'POST', cookie, body: { conversa_id: 'conversa-dois-456', historico, resumo: 'Escala sumiu da tela' } });
  assert.equal(r.json.chamado, ch[0].id);
  const texto = decodeURIComponent(new URL(r.json.link).searchParams.get('text'));
  assert.match(r.json.link, /^https:\/\/wa\.me\/5571993357290\?/);
  for (const parte of ['Maria Suporte', 'Mercado da Maria', email, 'Escala sumiu da tela', `Chamado nº ${ch[0].id}`]) assert.ok(texto.includes(parte), parte);
  // sem conversa com o assistente, o botão também registra
  r = await chama('/api/suporte/chamado', { method: 'POST', cookie, body: { conversa_id: 'conversa-direta-1', historico: [{ de: 'cliente', texto: 'Preciso de nota fiscal' }] } });
  assert.ok(r.json.chamado);
  ch = await q("select resumo, origem from suporte_chamados where conversa_id=$1", [`u${eu.id}-conversa-direta-1`]);
  assert.deepEqual(ch[0], { resumo: 'Preciso de nota fiscal', origem: 'whatsapp' });
  assert.equal((await chama('/api/suporte/chamado', { method: 'POST', body: { conversa_id: 'conversa-direta-1' } })).status, 401);

  // 6) /admin: lista, fecha e reabre
  assert.equal((await chama('/api/admin/suporte')).status, 401);
  r = await chama('/api/admin/suporte?status=aberto', { headers: adm });
  const meus = r.json.chamados.filter(c => c.email === email);
  assert.equal(meus.length, 4); // assistente escalou (2), n8n fora do ar (1) e o botão direto (1) assert.equal(r.json.whatsapp, '5571993357290'); assert.equal(r.json.n8n, true);
  const id = meus.find(c => c.resumo === 'Escala sumiu da tela').id;
  assert.equal((await chama(`/api/admin/suporte/${id}`, { method: 'PATCH', headers: adm, body: { status: 'fechado' } })).json.status, 'fechado');
  r = await chama('/api/admin/suporte?status=fechado', { headers: adm });
  assert.ok(r.json.chamados.some(c => c.id === id && c.empresa === 'Mercado da Maria'));
  // nova escalada na mesma conversa reabre o chamado
  await chama('/api/suporte/chamado', { method: 'POST', cookie, body: { conversa_id: 'conversa-dois-456', historico } });
  assert.equal((await q('select status from suporte_chamados where id=$1', [id]))[0].status, 'aberto');
  assert.equal((await chama('/api/admin/suporte/999999999', { method: 'PATCH', headers: adm, body: { status: 'fechado' } })).status, 404);
});
