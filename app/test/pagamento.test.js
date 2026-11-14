const test = require('node:test');
const assert = require('node:assert');
const { interpretaPagamento: p } = require('../pagamento.js');

test('JSON simples libera', () => {
  const r = p({ email: 'Ana@Loja.com ' });
  assert.equal(r.acao, 'liberar'); assert.equal(r.email, 'ana@loja.com');
});

test('Kiwify: aprovado, pendente, reembolso e chargeback', () => {
  const base = { order_id: 'k1', Customer: { email: 'k@x.com', full_name: 'Kátia Lima' } };
  const ok = p({ ...base, webhook_event_type: 'order_approved', order_status: 'paid' });
  assert.deepEqual([ok.acao, ok.email, ok.nome, ok.transacao, ok.plataforma], ['liberar', 'k@x.com', 'Kátia Lima', 'k1', 'kiwify']);
  assert.equal(p({ ...base, webhook_event_type: 'billet_created', order_status: 'waiting_payment' }).acao, 'ignorar');
  assert.equal(p({ ...base, webhook_event_type: 'pix_created', order_status: 'waiting_payment' }).acao, 'ignorar');
  assert.equal(p({ ...base, webhook_event_type: 'order_refunded', order_status: 'refunded' }).acao, 'bloquear');
  assert.equal(p({ ...base, webhook_event_type: 'chargeback', order_status: 'chargedback' }).acao, 'bloquear');
  assert.equal(p({ ...base, webhook_event_type: 'order_rejected', order_status: 'refused' }).acao, 'ignorar');
});

test('Hotmart v2', () => {
  const corpo = ev => ({ event: ev, data: { buyer: { email: 'h@x.com', name: 'Hugo' }, purchase: { transaction: 'HP1', status: ev.replace('PURCHASE_', '') } } });
  const ok = p(corpo('PURCHASE_APPROVED'), { 'x-hotmart-hottok': 'abc' });
  assert.deepEqual([ok.acao, ok.email, ok.nome, ok.transacao, ok.plataforma], ['liberar', 'h@x.com', 'Hugo', 'HP1', 'hotmart']);
  assert.equal(p(corpo('PURCHASE_COMPLETE')).acao, 'liberar');
  assert.equal(p(corpo('PURCHASE_BILLET_PRINTED')).acao, 'ignorar');
  assert.equal(p(corpo('PURCHASE_CANCELED')).acao, 'ignorar');
  assert.equal(p(corpo('PURCHASE_REFUNDED')).acao, 'bloquear');
  assert.equal(p(corpo('PURCHASE_CHARGEBACK')).acao, 'bloquear');
  assert.equal(p(corpo('PURCHASE_PROTEST')).acao, 'ignorar');
});

test('Cakto, Ticto e formatos em português', () => {
  assert.equal(p({ event: 'purchase_approved', data: { customer: { email: 'c@x.com' } } }).acao, 'liberar');
  assert.equal(p({ status: 'authorized', customer: { email: 't@x.com' } }).acao, 'liberar');
  assert.equal(p({ status: 'waiting_payment', customer: { email: 't@x.com' } }).acao, 'ignorar');
  assert.equal(p({ status: 'pago', cliente: { email: 'p@x.com' } }).acao, 'liberar');
  assert.equal(p({ status: 'Aprovado', comprador: { email: 'p@x.com' } }).acao, 'liberar');
  assert.equal(p({ status: 'pagamento_pendente', cliente: { email: 'p@x.com' } }).acao, 'ignorar');
  assert.equal(p({ status: 'unpaid', email: 'p@x.com' }).acao, 'ignorar');
  assert.equal(p({ evento: 'reembolso', email: 'p@x.com' }).acao, 'bloquear');
});

test('acha e-mail em qualquer lugar, preferindo o do comprador', () => {
  const r = p({ status: 'paid', produtor: { email: 'dono@x.com' }, pedido: { comprador_dados: { email: 'comp@x.com' } } });
  assert.equal(r.email, 'comp@x.com');
  assert.equal(p({ status: 'paid' }).email, '');
});
