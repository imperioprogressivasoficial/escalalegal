// Lê o webhook de qualquer checkout (Kiwify, Hotmart, Eduzz, Cakto, Ticto, Clickmax,
// n8n ou um JSON simples) e decide o que fazer com o acesso do comprador.
//
// Resultado: { acao: 'liberar' | 'bloquear' | 'ignorar', email, nome, transacao, evento, plataforma }
//   liberar  -> compra aprovada: cria/libera a conta e envia o acesso
//   bloquear -> reembolso ou chargeback: tira o acesso
//   ignorar  -> boleto gerado, Pix pendente, carrinho abandonado, recusado etc.

const PALAVRAS_BLOQUEIO = /refund|reembols|charge_?d?_?back|estorn|disput/i;
const PALAVRAS_APROVADO = /approv|aprovad|(?<![a-z])paid|(?<![a-z])pag[oa](?![a-z])|(?<![a-z])complete|conclu[ií]d|succeed|authoriz|autoriz|venda_realizada/i;

function pega(obj, caminho) {
  return caminho.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function primeiro(obj, caminhos) {
  for (const c of caminhos) {
    const v = pega(obj, c);
    if (v != null && v !== '' && typeof v !== 'object') return String(v);
  }
  return '';
}

// Procura um campo "email" em qualquer nível (limite de profundidade).
// Prefere o que estiver dentro de buyer/customer/cliente/comprador.
function achaEmail(obj) {
  const achados = [];
  (function anda(o, preferido, prof) {
    if (!o || typeof o !== 'object' || prof > 6) return;
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string' && /^e-?mail$/i.test(k) && v.includes('@')) achados.push({ v, preferido });
      else if (v && typeof v === 'object') anda(v, preferido || /buyer|customer|client|comprador|cliente|usuario|user|contact|lead/i.test(k), prof + 1);
    }
  })(obj, false, 0);
  return (achados.find(a => a.preferido) || achados[0])?.v || '';
}

function detectaPlataforma(b, headers = {}) {
  if (headers['x-hotmart-hottok'] || b.hottok || (b.event && b.data?.purchase)) return 'hotmart';
  if (b.webhook_event_type || b.Customer || b.order_status) return 'kiwify';
  if (b.trans_cod || b.edz_cli_email || pega(b, 'data.buyer') && b.event?.startsWith?.('myeduzz')) return 'eduzz';
  if (b.secret && b.event && b.data?.customer) return 'cakto';
  if (b.token && b.status && b.customer) return 'ticto';
  return b.plataforma || b.origem || 'checkout';
}

function interpretaPagamento(body, headers = {}) {
  const b = body && typeof body === 'object' ? body : {};

  const email = (primeiro(b, [
    'email', 'buyer.email', 'customer.email', 'Customer.email', 'data.buyer.email', 'data.customer.email',
    'cliente.email', 'comprador.email', 'data.email', 'edz_cli_email', 'cus_email', 'contact.email',
  ]) || achaEmail(b)).trim().toLowerCase().slice(0, 160);

  const nome = primeiro(b, [
    'nome', 'name', 'buyer.name', 'customer.name', 'Customer.full_name', 'Customer.name', 'data.buyer.name',
    'data.customer.name', 'cliente.nome', 'comprador.nome', 'edz_cli_rsocial', 'cus_name', 'contact.name',
  ]).trim().slice(0, 120);

  const transacao = primeiro(b, [
    'transacao', 'transaction', 'data.purchase.transaction', 'order_id', 'order.id', 'data.id', 'trans_cod',
    'sale_id', 'data.sale.id', 'id',
  ]).slice(0, 120);

  const sinais = [
    'event', 'evento', 'webhook_event_type', 'type', 'trigger', 'status', 'order_status', 'sale_status',
    'payment_status', 'data.status', 'data.purchase.status', 'trans_status', 'order.status',
  ].map(c => pega(b, c)).filter(v => v != null && v !== '' && typeof v !== 'object').map(String);
  const evento = sinais.join(' ').slice(0, 200);
  const plataforma = String(detectaPlataforma(b, headers)).slice(0, 40);

  let acao;
  if (PALAVRAS_BLOQUEIO.test(evento)) acao = 'bloquear';
  else if (PALAVRAS_APROVADO.test(evento)) acao = 'liberar';
  else if (!sinais.length) acao = 'liberar'; // JSON simples { "email": "..." } (n8n, painel, testes)
  else acao = 'ignorar';

  return { acao, email, nome, transacao, evento, plataforma };
}

module.exports = { interpretaPagamento };
