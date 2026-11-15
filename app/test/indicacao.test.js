// Indique e ganhe (comissão por compra indicada) e várias empresas na mesma conta.
const test = require('node:test');
const assert = require('node:assert');

const pular = !process.env.DATABASE_URL && 'defina DATABASE_URL para rodar';
process.env.WEBHOOK_TOKEN ||= 'tk-teste';
process.env.ADMIN_PASS ||= 'adm-teste';
process.env.SESSION_SECRET ||= 'segredo-teste';

test('indicação vira comissão, reembolso cancela; empresa extra usa o acesso de quem criou', { skip: pular }, async t => {
  const { app, migrar, pool } = require('../server.js');
  await migrar();
  const srv = app.listen(0), base = `http://127.0.0.1:${srv.address().port}`;
  t.after(async () => { srv.close(); await pool.end(); });
  const chama = async (url, o = {}) => { const r = await fetch(base + url, { method: o.method || 'GET', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.8.0.' + (Math.random() * 250 | 0), ...(o.cookie && { cookie: o.cookie }), ...(o.h || {}) }, body: o.body && JSON.stringify(o.body) }); return { status: r.status, json: await r.json().catch(() => null), cookie: (r.headers.get('set-cookie') || '').split(';')[0] }; };
  const webhook = body => chama(`/api/webhook/pagamento?token=${process.env.WEBHOOK_TOKEN}`, { method: 'POST', body });
  const adm = { authorization: 'Basic ' + Buffer.from('admin:' + process.env.ADMIN_PASS).toString('base64') };
  const id = Date.now();

  // quem indica: cliente com conta
  const a = (await chama('/api/cadastro', { method: 'POST', body: { nome: 'Ana', empresa: 'Loja Ana', email: `ana${id}@t.com`, senha: 'senha123' } })).cookie;
  const ind = (await chama('/api/indicacao', { cookie: a })).json;
  assert.match(ind.codigo, /^[a-z0-9]{6,7}$/); assert.ok(ind.link.endsWith('/?ind=' + ind.codigo)); assert.ok(ind.valor_por_venda > 0);
  assert.equal((await chama('/api/indicacao', { cookie: a })).json.codigo, ind.codigo, 'o código não muda');
  await chama('/api/indicacao/pix', { method: 'PUT', cookie: a, body: { pix: 'ana@pix.com' } });

  // 1) indicado pelo formulário da página de vendas (lead com o código) e compra aprovada
  const b = `bruno${id}@t.com`;
  await chama('/api/leads', { method: 'POST', body: { nome: 'Bruno', whatsapp: '71999990000', email: b, ref: ind.codigo } });
  await webhook({ email: b, nome: 'Bruno' });
  // 2) indicado pelo rastreio do checkout (sck=ind_CODIGO), sem passar pelo formulário
  const c = `carla${id}@t.com`;
  await webhook({ email: c, nome: 'Carla', TrackingParameters: { sck: 'ind_' + ind.codigo } });
  // 3) sem indicação
  await webhook({ email: `diego${id}@t.com` });
  let r = (await chama('/api/indicacao', { cookie: a })).json;
  assert.equal(r.vendas, 2); assert.equal(+r.a_receber, 2 * ind.valor_por_venda); assert.equal(r.pix, 'ana@pix.com');

  // reembolso antes de pagar: cancela a comissão
  await webhook({ email: c, evento: 'refunded', status: 'refunded' });
  r = (await chama('/api/indicacao', { cookie: a })).json;
  assert.equal(r.vendas, 1); assert.equal(+r.a_receber, ind.valor_por_venda);

  // admin vê o afiliado (a comissão fica na garantia por 7 dias antes de liberar para pagar)
  const lista = (await chama('/api/admin/indicacoes', { h: adm })).json;
  const ana = lista.afiliados.find(x => x.email === `ana${id}@t.com`);
  assert.equal(ana.vendas, 1); assert.equal(+ana.na_garantia, ind.valor_por_venda); assert.equal(+ana.liberado, 0);
  await pool.query("update comissoes set criado_em=now() - interval '8 days' where afiliado_id=$1", [ana.id]);
  const pg = (await chama(`/api/admin/indicacoes/${ana.id}/pagar`, { method: 'POST', h: adm })).json;
  assert.equal(pg.pagas, 1);
  r = (await chama('/api/indicacao', { cookie: a })).json;
  assert.equal(+r.a_receber, 0); assert.equal(+r.recebido, ind.valor_por_venda);
  // ninguém ganha comissão por si mesmo
  await chama('/api/leads', { method: 'POST', body: { nome: 'Ana', whatsapp: '71999990000', email: `ana${id}@t.com`, ref: ind.codigo } });
  await webhook({ email: `ana${id}@t.com` });
  assert.equal((await chama('/api/indicacao', { cookie: a })).json.vendas, 1);

  // várias empresas: Ana (agora paga) cria outra empresa e é dona dela, com o mesmo acesso
  const e = (await chama('/api/empresas', { method: 'POST', cookie: a, body: { nome: 'Padaria da Ana' } })).json;
  assert.ok(e.id);
  const eu = (await chama('/api/eu', { cookie: a })).json;
  assert.ok(eu.contas.some(x => x.id === e.id && x.papel === 'dono' && x.empresa === 'Padaria da Ana'));
  const cta = (await chama('/api/conta', { cookie: a, h: { 'x-conta': String(e.id) } })).json;
  assert.equal(cta.papel, 'dono'); assert.equal(cta.liberado, true);
  const un = (await chama('/api/onboarding', { method: 'POST', cookie: a, h: { 'x-conta': String(e.id) }, body: { unidade: { nome: 'Padaria', setor: 'padaria' }, pessoas: ['Eva', 'Fabi', 'Gil', 'Hugo', 'Iara', 'João'].map(nome => ({ nome })) } })).json;
  assert.ok(un.escala, 'gera escala na empresa extra');
  // a empresa extra não aparece como cliente no admin
  const clientes = (await chama('/api/admin/clientes', { h: adm })).json;
  assert.ok(!clientes.some(x => x.empresa === 'Padaria da Ana'));
});
