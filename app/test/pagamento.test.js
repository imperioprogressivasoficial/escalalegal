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

// corpo como a Kiwify manda de verdade (webhook "Compra aprovada", "Reembolso" e "Chargeback")
function kiwify(evento, status, extra = {}) {
  return {
    order_id: '7f3c2a1e-4b5d-4c6e-9f80-1a2b3c4d5e6f', order_ref: 'Xy8KpQ2', order_status: status, product_type: 'membership',
    payment_method: 'credit_card', store_id: 'Ab12Cd34', payment_merchant_id: 48213371, installments: 1, card_type: 'mastercard',
    card_last4digits: '4242', card_rejection_reason: null, boleto_URL: null, boleto_barcode: null, boleto_expiry_date: null,
    pix_code: null, pix_expiration: null, sale_type: 'producer', created_at: '2026-11-15 10:02', updated_at: '2026-11-15 10:03',
    approved_date: status === 'paid' ? '2026-11-15 10:03' : null, refunded_at: status === 'refunded' ? '2026-11-20 09:00' : null,
    webhook_event_type: evento,
    Product: { product_id: 'b1c2d3e4-0000-4000-8000-000000000097', product_name: 'Sua Escala 5x2' },
    Customer: { full_name: 'Maria Aparecida dos Santos', first_name: 'Maria', email: 'Maria.Santos@Mercadinho.com.br', mobile: '+5571988887777',
      CPF: '12345678909', ip: '200.150.10.20', instagram: '@mercadinho', street: 'Rua da Paz', number: '100', complement: '', neighborhood: 'Centro',
      city: 'Salvador', state: 'BA', zipcode: '40010000' },
    Commissions: { charge_amount: 9700, product_base_price: 9700, product_base_price_currency: 'BRL', kiwify_fee: 870, settlement_amount: 8830,
      my_commission: 8830, currency: 'BRL', commissioned_stores: [{ id: 'Ab12Cd34', type: 'producer', custom_name: 'Bruno', email: 'bruno@produtor.com', value: '8830' }] },
    TrackingParameters: { src: null, sck: null, utm_source: 'instagram', utm_medium: 'paid', utm_campaign: 'escala5x2', utm_content: null, utm_term: null },
    Subscription: null, subscription_id: null, access_url: null,
    ...extra,
  };
}
test('Kiwify: corpo real de compra aprovada, reembolso e chargeback', () => {
  const ok = p(kiwify('order_approved', 'paid'));
  assert.deepEqual([ok.acao, ok.email, ok.nome, ok.whatsapp, ok.transacao, ok.plataforma],
    ['liberar', 'maria.santos@mercadinho.com.br', 'Maria Aparecida dos Santos', '71988887777', '7f3c2a1e-4b5d-4c6e-9f80-1a2b3c4d5e6f', 'kiwify']);
  // o e-mail do produtor (comissões) nunca é confundido com o do comprador
  assert.notEqual(ok.email, 'bruno@produtor.com');
  const reemb = p(kiwify('order_refunded', 'refunded'));
  assert.equal(reemb.acao, 'bloquear'); assert.equal(reemb.transacao, ok.transacao);
  assert.equal(p(kiwify('chargeback', 'chargedback')).acao, 'bloquear');
  assert.equal(p(kiwify('billet_created', 'waiting_payment', { payment_method: 'boleto' })).acao, 'ignorar');
  assert.equal(p(kiwify('pix_created', 'waiting_payment', { payment_method: 'pix' })).acao, 'ignorar');
  assert.equal(p(kiwify('order_rejected', 'refused', { card_rejection_reason: 'insufficient_funds' })).acao, 'ignorar');
  assert.equal(p(kiwify('abandoned_cart', 'abandoned')).acao, 'ignorar');
});
