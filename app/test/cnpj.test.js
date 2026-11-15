// Dados da empresa pelo CNPJ: mapeamento das duas fontes, reserva quando a primeira falha e a rota com cache (sem rede: fetch falso).
const test = require('node:test');
const assert = require('node:assert');
const Cnpj = require('../cnpj.js');

const pular = !process.env.DATABASE_URL && 'defina DATABASE_URL para rodar';
process.env.WEBHOOK_TOKEN ||= 'tk-teste';
process.env.ADMIN_PASS ||= 'adm-teste';
process.env.SESSION_SECRET ||= 'segredo-teste';

const BRASILAPI = {
  razao_social: 'BOM PRECO COMERCIO DE ALIMENTOS LTDA', nome_fantasia: 'MERCADINHO BOM PRECO', cep: '01310100', uf: 'SP', municipio: 'SAO PAULO',
  descricao_tipo_de_logradouro: 'AVENIDA', logradouro: 'PAULISTA', numero: '1000', bairro: 'BELA VISTA', complemento: '',
  porte: 'MICRO EMPRESA', opcao_pelo_mei: false, cnae_fiscal: 4712100, ddd_telefone_1: '1133334444', descricao_situacao_cadastral: 'ATIVA',
};
const CNPJWS = {
  razao_social: 'DROGARIA CENTRAL LTDA', porte: { descricao: 'Empresa de Pequeno Porte' }, simples: { mei: 'Não' },
  estabelecimento: { nome_fantasia: 'DROGARIA CENTRAL', cep: '40000000', logradouro: 'Rua Chile', numero: '10', bairro: 'Centro', tipo_logradouro: 'Rua',
    cidade: { nome: 'Salvador' }, estado: { sigla: 'BA' }, atividade_principal: { id: '4771701' }, ddd1: '71', telefone1: '32221111', situacao_cadastral: 'Baixada' },
};
const resposta = (ok, corpo) => Promise.resolve({ ok, json: () => Promise.resolve(corpo) });

test('CNAE vira segmento e porte vira MEI/ME/EPP', () => {
  assert.equal(Cnpj.segmentoDoCnae('4711302'), 'mercado'); assert.equal(Cnpj.segmentoDoCnae(4771701), 'farmacia');
  assert.equal(Cnpj.segmentoDoCnae('5611201'), 'restaurante'); assert.equal(Cnpj.segmentoDoCnae('1091101'), 'padaria');
  assert.equal(Cnpj.segmentoDoCnae('4781400'), 'varejo'); assert.equal(Cnpj.segmentoDoCnae('8011101'), 'seguranca');
  assert.equal(Cnpj.segmentoDoCnae('6201501'), 'outro');
  assert.equal(Cnpj.porteDe('MICRO EMPRESA', false), 'me'); assert.equal(Cnpj.porteDe('Empresa de Pequeno Porte'), 'epp');
  assert.equal(Cnpj.porteDe('MICRO EMPRESA', true), 'mei'); assert.equal(Cnpj.porteDe('DEMAIS'), 'media');
});

test('BrasilAPI primeiro, CNPJ.ws de reserva, nada se as duas falham', async t => {
  const orig = Cnpj.config.fetch; t.after(() => { Cnpj.config.fetch = orig; });
  const chamadas = [];
  Cnpj.config.fetch = url => { chamadas.push(url); return url.includes('brasilapi') ? resposta(true, BRASILAPI) : resposta(false, {}); };
  const a = await Cnpj.buscaCnpj('11222333000181');
  assert.equal(a.razao_social, 'BOM PRECO COMERCIO DE ALIMENTOS LTDA'); assert.equal(a.nome_fantasia, 'MERCADINHO BOM PRECO');
  assert.equal(a.segmento, 'mercado'); assert.equal(a.porte, 'me'); assert.equal(a.cidade, 'Sao Paulo'); assert.equal(a.uf, 'SP');
  assert.equal(a.endereco, 'AVENIDA PAULISTA, 1000 - BELA VISTA'); assert.equal(a.telefone, '1133334444'); assert.equal(a.situacao, 'ATIVA');
  assert.equal(chamadas.length, 1);
  // BrasilAPI fora do ar: usa o CNPJ.ws
  Cnpj.config.fetch = url => url.includes('brasilapi') ? Promise.reject(new Error('timeout')) : resposta(true, CNPJWS);
  const b = await Cnpj.buscaCnpj('11222333000181');
  assert.equal(b.razao_social, 'DROGARIA CENTRAL LTDA'); assert.equal(b.segmento, 'farmacia'); assert.equal(b.porte, 'epp');
  assert.equal(b.uf, 'BA'); assert.equal(b.cidade, 'Salvador'); assert.equal(b.telefone, '7132221111'); assert.equal(b.situacao, 'BAIXADA');
  Cnpj.config.fetch = () => resposta(false, {});
  assert.equal(await Cnpj.buscaCnpj('11222333000181'), null);
});

test('rota /api/cnpj: precisa entrar, confere o CNPJ e guarda o resultado', { skip: pular }, async t => {
  const { app, migrar, pool } = require('../server.js');
  await migrar();
  const srv = app.listen(0), base = `http://127.0.0.1:${srv.address().port}`;
  const orig = Cnpj.config.fetch; let n = 0;
  Cnpj.config.fetch = () => { n++; return resposta(true, BRASILAPI); };
  const email = `cnpj${Date.now()}@t.com`;
  t.after(async () => { Cnpj.config.fetch = orig; await pool.query('delete from usuarios where email=$1', [email]).catch(() => {}); srv.close(); await pool.end(); });
  const chama = async (url, o = {}) => { const r = await fetch(base + url, { method: o.method || 'GET', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.8.0.' + (Math.random() * 250 | 0), ...(o.cookie && { cookie: o.cookie }) }, body: o.body && JSON.stringify(o.body) }); return { status: r.status, json: await r.json().catch(() => null), cookie: (r.headers.get('set-cookie') || '').split(';')[0] }; };
  assert.equal((await chama('/api/cnpj/11222333000181')).status, 401);
  await chama(`/api/webhook/pagamento?token=${process.env.WEBHOOK_TOKEN}`, { method: 'POST', body: { email } });
  const tk = /acesso=([\w-]+)/.exec((await pool.query('select texto from emails where para=$1', [email])).rows[0].texto)[1];
  const s = (await chama('/api/senha/definir', { method: 'POST', body: { token: tk, senha: 'senha123' } })).cookie;
  assert.equal((await chama('/api/cnpj/11222333000180', { cookie: s })).status, 400);
  const r = await chama('/api/cnpj/11.222.333%2F0001-81', { cookie: s });
  assert.equal(r.status, 200, JSON.stringify(r.json)); assert.equal(r.json.segmento, 'mercado');
  await chama('/api/cnpj/11222333000181', { cookie: s });
  assert.equal(n, 1, 'a segunda vez vem do cache');
});
