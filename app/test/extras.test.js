// Materiais extras (order bumps): leitura do pedido, webhook e download só para quem comprou.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { classificaPedido, arquivoPermitido, CATALOGO } = require('../extras.js');

const PRINCIPAL = { product_id: '6f254d50-e0a4-11f1-9205-439bc5ce1992', product_name: 'Sua Escala 5x2' };
const KIT = { product_id: '7d899720-e0a9-11f1-9205-439bc5ce1992', product_name: 'Kit RH da 5x2' };
const CALC = { product_id: '7ed59f20-e0a9-11f1-9ed5-1d1ad40effc1', product_name: 'Calculadora de Custo da 5x2' };
const PLAQ = { product_id: 'e8736ed0-e0a9-11f1-9ed5-1d1ad40effc1', product_name: 'Plaquinhas de Aviso da Escala' };
const kiwify = (evento, status, order_id, email, Product, extra = {}) => ({
  order_id, order_status: status, webhook_event_type: evento, Product, Customer: { email, full_name: 'Teste Extra' },
  Commissions: { commissioned_stores: [{ custom_name: 'Bruno', email: 'bruno@produtor.com' }] }, TrackingParameters: { src: null }, ...extra,
});

test('pedido: só o bump, bump dentro do pedido principal e pedido comum', () => {
  assert.deepEqual(classificaPedido(kiwify('order_approved', 'paid', 'a', 'x@x.com', KIT)), { extras: ['kit_rh'], soExtras: true });
  assert.deepEqual(classificaPedido(kiwify('order_approved', 'paid', 'a', 'x@x.com', CALC)), { extras: ['calculadora'], soExtras: true });
  assert.deepEqual(classificaPedido(kiwify('order_approved', 'paid', 'a', 'x@x.com', PLAQ)), { extras: ['plaquinhas'], soExtras: true });
  assert.deepEqual(classificaPedido(kiwify('order_approved', 'paid', 'a', 'x@x.com', PRINCIPAL)), { extras: [], soExtras: false });
  // bumps dentro do pedido principal (formatos diferentes de lista)
  const junto = classificaPedido(kiwify('order_approved', 'paid', 'a', 'x@x.com', PRINCIPAL, { order_bumps: [KIT, { id: CALC.product_id, name: 'Calculadora de Custo da 5x2' }] }));
  assert.deepEqual([junto.extras.sort(), junto.soExtras], [['calculadora', 'kit_rh'], false]);
  const itens = classificaPedido({ status: 'paid', email: 'x@x.com', items: [{ id: 'outro', name: 'Sua Escala 5x2' }, { name: 'Plaquinhas de Aviso da Escala' }] });
  assert.deepEqual([itens.extras, itens.soExtras], [['plaquinhas'], false]);
  // pedido com 2 bumps e sem o app
  const dois = classificaPedido({ status: 'paid', email: 'x@x.com', products: [KIT, PLAQ] });
  assert.deepEqual([dois.extras.sort(), dois.soExtras], [['kit_rh', 'plaquinhas'], true]);
  // pelo nome, quando o id é outro (ex.: produto recriado)
  assert.deepEqual(classificaPedido({ status: 'paid', email: 'x@x.com', Product: { product_id: 'zzz', product_name: 'Kit RH da 5x2 - oferta' } }), { extras: ['kit_rh'], soExtras: true });
  // JSON simples e Hotmart do app continuam sendo o app
  assert.deepEqual(classificaPedido({ email: 'x@x.com' }), { extras: [], soExtras: false });
  assert.deepEqual(classificaPedido({ event: 'PURCHASE_APPROVED', data: { product: { id: 123, name: 'Sua Escala 5x2' }, buyer: { email: 'x@x.com' } } }), { extras: [], soExtras: false });
});

test('download: só arquivos da lista do extra, sem caminho', () => {
  assert.ok(arquivoPermitido('kit_rh', 'LEIA-ME.pdf'));
  assert.equal(arquivoPermitido('kit_rh', '../../server.js'), null);
  assert.equal(arquivoPermitido('kit_rh', '..%2F..%2Fserver.js'), null);
  assert.equal(arquivoPermitido('kit_rh', 'Calculadora-de-Custo-da-5x2.xlsx'), null); // é de outro extra
  assert.equal(arquivoPermitido('outro', 'LEIA-ME.pdf'), null);
  assert.equal(arquivoPermitido('__proto__', 'LEIA-ME.pdf'), null);
  // todo arquivo prometido existe de verdade
  for (const [k, c] of Object.entries(CATALOGO)) for (const [a] of c.arquivos) assert.ok(fs.statSync(arquivoPermitido(k, a)).size > 1000, `${k}/${a}`);
});

const pular = !process.env.DATABASE_URL && 'defina DATABASE_URL para rodar';
process.env.WEBHOOK_TOKEN ||= 'tk-teste';
process.env.ADMIN_PASS ||= 'adm-teste';
process.env.SESSION_SECRET ||= 'segredo-teste';

test('webhook dos extras e download só para quem comprou', { skip: pular }, async t => {
  const { app, migrar, pool } = require('../server.js');
  await migrar();
  const srv = app.listen(0);
  const base = `http://127.0.0.1:${srv.address().port}`;
  t.after(async () => { srv.close(); await pool.end(); });
  const chama = async (url, { method = 'GET', body, cookie, headers = {} } = {}) => {
    const r = await fetch(base + url, { method, redirect: 'manual', headers: { 'Content-Type': 'application/json', ...(cookie && { cookie }), ...headers }, body: body && JSON.stringify(body) });
    const tipo = r.headers.get('content-type') || '';
    return { status: r.status, headers: r.headers, json: tipo.includes('json') ? await r.json() : null, buf: tipo.includes('json') ? null : Buffer.from(await r.arrayBuffer()), cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
  };
  const webhook = body => chama(`/api/webhook/pagamento?token=${process.env.WEBHOOK_TOKEN}`, { method: 'POST', body });
  const q = (s, p) => pool.query(s, p).then(r => r.rows);
  const suf = Date.now();
  const so = `sobump${suf}@teste.com`, cli = `cliente${suf}@teste.com`;

  // 1) pedido só do Kit RH: registra o extra, não cria conta nem libera o app
  let r = await webhook(kiwify('order_approved', 'paid', `K${suf}`, so, KIT));
  assert.equal(r.json.acao, 'liberar'); assert.deepEqual(r.json.extras, ['kit_rh']); assert.deepEqual(r.json.extras_novos, ['kit_rh']);
  assert.equal(r.json.conta_nova, undefined);
  assert.equal((await q('select 1 from usuarios where email=$1', [so])).length, 0);
  assert.equal((await q('select 1 from compras where email=$1', [so])).length, 0);
  assert.deepEqual(await q('select extra, status, transacao from extras_compras where email=$1', [so]), [{ extra: 'kit_rh', status: 'aprovada', transacao: `K${suf}` }]);
  let mails = await q('select assunto, texto from emails where para=$1', [so]);
  assert.equal(mails.length, 1); assert.match(mails[0].texto, /Seus materiais/);
  // repetido: nada novo, nenhum e-mail a mais
  r = await webhook(kiwify('order_approved', 'paid', `K${suf}`, so, KIT));
  assert.deepEqual(r.json.extras_novos, []);
  assert.equal((await q('select 1 from emails where para=$1', [so])).length, 1);
  // Pix gerado do bump: ignora
  assert.equal((await webhook(kiwify('pix_created', 'waiting_payment', `K2${suf}`, so, CALC))).json.acao, 'ignorar');
  assert.equal((await q("select 1 from extras_compras where email=$1 and extra='calculadora'", [so])).length, 0);
  // o evento ficou registrado
  const ev = await q("select acao, payload->'_extras' extras from pagamentos_eventos where email=$1 order by id", [so]);
  assert.deepEqual(ev.map(e => e.acao), ['liberar', 'liberar', 'ignorar']); assert.deepEqual(ev[0].extras, ['kit_rh']);

  // 2) pedido do app com a Calculadora dentro; o Kit RH chega em outro pedido
  r = await webhook(kiwify('order_approved', 'paid', `P${suf}`, cli, PRINCIPAL, { order_bumps: [CALC] }));
  assert.equal(r.json.acao, 'liberar'); assert.equal(r.json.conta_nova, true); assert.deepEqual(r.json.extras, ['calculadora']);
  r = await webhook(kiwify('order_approved', 'paid', `B${suf}`, cli, KIT));
  assert.deepEqual(r.json.extras_novos, ['kit_rh']);
  const ativos = async e => (await q("select extra from extras_compras where email=$1 and status='aprovada' order by extra", [e])).map(x => x.extra);
  assert.deepEqual(await ativos(cli), ['calculadora', 'kit_rh']);

  // 3) reembolso do bump: tira só o Kit RH; o app e a Calculadora continuam
  r = await webhook(kiwify('order_refunded', 'refunded', `B${suf}`, cli, KIT));
  assert.equal(r.json.acao, 'bloquear'); assert.deepEqual(r.json.extras_removidos, ['kit_rh']);
  assert.equal((await q('select acesso_liberado from usuarios where email=$1', [cli]))[0].acesso_liberado, true);
  assert.deepEqual(await ativos(cli), ['calculadora']);
  // reembolso de outro pedido do bump (código diferente) não mexe em nada
  await webhook(kiwify('order_approved', 'paid', `K${suf}`, so, KIT));
  r = await webhook(kiwify('chargeback', 'chargedback', `OUTRO${suf}`, so, KIT));
  assert.deepEqual(r.json.extras_removidos, []);
  assert.deepEqual(await ativos(so), ['kit_rh']);

  // 4) login do cliente e download
  const token = /acesso=([\w-]+)/.exec((await q("select texto from emails where para=$1 and assunto like '%acesso chegou%'", [cli]))[0].texto)[1];
  const sessao = (await chama('/api/senha/definir', { method: 'POST', body: { token, senha: 'senha123', empresa: 'Loja Extra' } })).cookie;
  assert.ok(sessao);
  assert.equal((await chama('/api/extras')).status, 401);
  r = await chama('/api/extras', { cookie: sessao });
  const por = Object.fromEntries(r.json.map(x => [x.extra, x]));
  assert.deepEqual([por.calculadora.comprado, por.kit_rh.comprado, por.plaquinhas.comprado], [true, false, false]);
  assert.equal(por.kit_rh.checkout, 'https://pay.kiwify.com.br/dr2f74k'); assert.equal(por.kit_rh.arquivos.length, 0);
  assert.equal(por.plaquinhas.checkout, 'https://pay.kiwify.com.br/8VF4Bas');
  assert.equal(por.calculadora.arquivos[0].arquivo, 'Calculadora-de-Custo-da-5x2.xlsx');
  r = await chama(por.calculadora.arquivos[0].url, { cookie: sessao });
  assert.equal(r.status, 200); assert.match(r.headers.get('content-disposition'), /^attachment; filename="Calculadora-de-Custo-da-5x2.xlsx"/);
  assert.equal(r.buf.subarray(0, 2).toString(), 'PK');
  assert.equal((await chama(por.calculadora.arquivos[0].url)).status, 401); // sem login
  assert.equal((await chama('/api/extras/kit_rh/LEIA-ME.pdf', { cookie: sessao })).status, 403); // reembolsado
  assert.equal((await chama('/api/extras/plaquinhas/LEIA-ME.pdf', { cookie: sessao })).status, 403); // não comprou
  assert.equal((await chama('/api/extras/calculadora/..%2F..%2Fserver.js', { cookie: sessao })).status, 404);
  assert.equal((await chama('/api/extras/calculadora/LEIA-ME.pdf', { cookie: sessao })).status, 404);
  assert.equal((await chama('/api/extras/xyz/LEIA-ME.pdf', { cookie: sessao })).status, 404);
  assert.notEqual((await chama('/api/extras/calculadora/../../server.js', { cookie: sessao })).status, 200);
  // arquivos não ficam públicos
  assert.notEqual((await chama('/extras/calculadora/Calculadora-de-Custo-da-5x2.xlsx')).status, 200);

  // 5) admin libera as Plaquinhas na mão
  const auth = { authorization: 'Basic ' + Buffer.from('admin:' + process.env.ADMIN_PASS).toString('base64') };
  assert.equal((await chama('/api/admin/extras', { method: 'POST', body: { email: cli, extra: 'plaquinhas' } })).status, 401);
  assert.equal((await chama('/api/admin/extras', { method: 'POST', headers: auth, body: { email: cli, extra: 'nada' } })).status, 400);
  r = await chama('/api/admin/extras', { method: 'POST', headers: auth, body: { email: cli, extra: 'plaquinhas' } });
  assert.equal(r.json.ja_tinha, false);
  r = await chama('/api/extras/plaquinhas/01-Quadro-da-escala-da-semana-A4.pdf', { cookie: sessao });
  assert.equal(r.status, 200); assert.equal(r.buf.subarray(0, 4).toString(), '%PDF');
  const lista = (await chama('/api/admin/clientes', { headers: auth })).json.find(x => x.email === cli);
  assert.deepEqual(lista.extras, ['calculadora', 'plaquinhas']);
  r = await chama('/api/admin/extras', { method: 'POST', headers: auth, body: { email: cli, extra: 'plaquinhas', remover: true } });
  assert.equal(r.json.removido, true);
  assert.equal((await chama('/api/extras/plaquinhas/LEIA-ME.pdf', { cookie: sessao })).status, 403);

  // 6) reembolso do pedido do app: tira o acesso e a Calculadora que veio no mesmo pedido
  r = await webhook(kiwify('order_refunded', 'refunded', `P${suf}`, cli, PRINCIPAL, { order_bumps: [CALC] }));
  assert.equal(r.json.acao, 'bloquear'); assert.equal(r.json.conta_bloqueada, true);
  assert.deepEqual(await ativos(cli), []);
});
