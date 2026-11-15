// "Só cadastra se pagar" e o cadastro completo da empresa no primeiro acesso.
const test = require('node:test');
const assert = require('node:assert');
const C = require('../public/cadastro.js');

const pular = !process.env.DATABASE_URL && 'defina DATABASE_URL para rodar';
process.env.WEBHOOK_TOKEN ||= 'tk-teste';
process.env.ADMIN_PASS ||= 'adm-teste';
process.env.SESSION_SECRET ||= 'segredo-teste';

test('CNPJ numérico e alfanumérico, máscaras e estado pelo CEP', () => {
  assert.ok(C.cnpjValido('11.222.333/0001-81'));
  assert.ok(C.cnpjValido('12ABC34501DE35')); // CNPJ alfanumérico (a partir de julho de 2026)
  assert.ok(C.cnpjValido('12.abc.345/01de-35'));
  assert.ok(!C.cnpjValido('11.222.333/0001-82'));
  assert.ok(!C.cnpjValido('00000000000000'));
  assert.ok(!C.cnpjValido('1122233300018'));
  assert.equal(C.mascaraCnpj('11222333000181'), '11.222.333/0001-81');
  assert.equal(C.mascaraCnpj('112223'), '11.222.3');
  assert.equal(C.mascaraTel('5571988887777'), '(71) 98888-7777');
  assert.equal(C.mascaraTel('7133334444'), '(71) 3333-4444');
  assert.equal(C.mascaraCep('40010000'), '40010-000');
  assert.deepEqual(['01310100', '20040002', '40010000', '70040010', '69900000', '90010000', '123'].map(C.ufDoCep), ['SP', 'RJ', 'BA', 'DF', 'AC', 'RS', null]);
});

const completo = {
  nome: 'Mercadinho Bom Preço', razao_social: 'Bom Preço Comércio de Alimentos LTDA', porte: 'me', cnpj: '11.222.333/0001-81',
  responsavel: 'Maria dos Santos', responsavel_cargo: 'Dono(a) ou sócio(a)', telefone: '(71) 98888-7777',
  cep: '40010-000', endereco: 'Rua da Paz, 100', uf: 'BA', cidade: 'Salvador', segmento: 'mercado', funcionarios_qtd: 12, unidades_qtd: 2, como_conheceu: 'instagram',
};

test('confere o cadastro: campos obrigatórios e CNPJ opcional só no MEI', () => {
  assert.ok(C.confere(completo).dados);
  assert.equal(C.confere({ ...completo, cnpj: '11.222.333/0001-80' }).campo, 'cnpj');
  assert.equal(C.confere({ ...completo, cnpj: '' }).campo, 'cnpj');
  assert.equal(C.confere({ ...completo, cnpj: '', sem_cnpj: true }).campo, 'cnpj', 'sem CNPJ só vale para MEI');
  assert.ok(C.confere({ ...completo, porte: 'mei', cnpj: '', sem_cnpj: true }).dados);
  for (const campo of ['nome', 'razao_social', 'porte', 'responsavel', 'responsavel_cargo', 'telefone', 'cep', 'cidade', 'segmento', 'funcionarios_qtd', 'unidades_qtd', 'como_conheceu'])
    assert.equal(C.confere({ ...completo, [campo]: '' }).campo, campo, campo);
});

test('só cria conta de empresa quem comprou; contador continua grátis; cadastro completo depois da senha', { skip: pular }, async t => {
  const { app, migrar, pool } = require('../server.js');
  await migrar();
  const srv = app.listen(0), base = `http://127.0.0.1:${srv.address().port}`;
  t.after(async () => { srv.close(); await pool.end(); });
  let ip = 0;
  const chama = async (url, { method = 'GET', body, cookie } = {}) => {
    const r = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `10.11.${(ip / 250) | 0}.${ip++ % 250}`, ...(cookie && { cookie }) }, body: body && JSON.stringify(body) });
    return { status: r.status, json: await r.json().catch(() => null), cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
  };
  const sx = Date.now(), comprador = `maria${sx}@mercadinho.com.br`, curioso = `curioso${sx}@t.com`, cont = `cont${sx}@t.com`;

  // 1) sem compra: não cria conta de dono
  let r = await chama('/api/cadastro', { method: 'POST', body: { nome: 'Curioso', empresa: 'Loja', email: curioso, senha: 'senha123' } });
  assert.equal(r.status, 403); assert.match(r.json.erro, /depois da compra/);
  assert.equal((await pool.query('select 1 from usuarios where email=$1', [curioso])).rowCount, 0);
  // contador: cadastro grátis
  r = await chama('/api/cadastro', { method: 'POST', body: { tipo: 'contador', nome: 'Carla', email: cont, senha: 'senha123' } });
  assert.equal(r.status, 200);

  // compra aprovada na Kiwify (corpo real): cria a conta sem senha, guarda o WhatsApp e manda o link
  r = await chama(`/api/webhook/pagamento?token=${process.env.WEBHOOK_TOKEN}`, { method: 'POST', body: {
    order_id: 'kw-' + sx, order_ref: 'Ab1', order_status: 'paid', webhook_event_type: 'order_approved', payment_method: 'pix',
    Product: { product_id: 'p1', product_name: 'Sua Escala 5x2' },
    Customer: { full_name: 'Maria dos Santos', first_name: 'Maria', email: comprador, mobile: '+5571988887777', CPF: '12345678909' },
    Commissions: { charge_amount: 9700, commissioned_stores: [{ type: 'producer', email: 'produtor@x.com' }] },
    TrackingParameters: { utm_source: 'instagram' } } });
  assert.equal(r.json.acao, 'liberar'); assert.equal(r.json.conta_nova, true);
  const { rows: [u] } = await pool.query('select whatsapp, senha_hash from usuarios where email=$1', [comprador]);
  assert.equal(u.whatsapp, '71988887777'); assert.equal(u.senha_hash, null);
  // tentar criar conta com o e-mail da compra não cria nada: reenvia o link
  assert.equal((await chama('/api/cadastro', { method: 'POST', body: { nome: 'X', empresa: 'X', email: comprador, senha: 'senha123' } })).status, 409);

  // cria a senha pelo link (sem precisar do nome da empresa: ele vem no cadastro completo)
  const { rows: [m] } = await pool.query('select texto from emails where para=$1 order by id limit 1', [comprador]);
  r = await chama('/api/senha/definir', { method: 'POST', body: { token: /acesso=([\w-]+)/.exec(m.texto)[1], senha: 'senha123', nome: 'Maria dos Santos' } });
  assert.equal(r.status, 200);
  const s = r.cookie;
  assert.equal((await chama('/api/conta', { cookie: s })).json.cadastro_ok, false);
  r = await chama('/api/inicio', { cookie: s });
  assert.deepEqual(r.json, { cadastro_ok: false, unidades: 0, pessoas: 0, escala_enviada: false, contador: false });

  // 2) cadastro completo: confere tudo no servidor
  r = await chama('/api/empresa/cadastro', { method: 'POST', cookie: s, body: { ...completo, cnpj: '11.222.333/0001-80' } });
  assert.equal(r.status, 400); assert.equal(r.json.campo, 'cnpj');
  r = await chama('/api/empresa/cadastro', { method: 'POST', cookie: s, body: { ...completo, telefone: '9999' } });
  assert.equal(r.status, 400); assert.equal(r.json.campo, 'telefone');
  r = await chama('/api/empresa/cadastro', { method: 'POST', cookie: s, body: { ...completo, segmento: 'nave_espacial' } });
  assert.equal(r.status, 400); assert.equal(r.json.campo, 'segmento');
  r = await chama('/api/empresa/cadastro', { method: 'POST', cookie: s, body: completo });
  assert.equal(r.status, 200);
  const conta = (await chama('/api/conta', { cookie: s })).json;
  assert.equal(conta.cadastro_ok, true); assert.equal(conta.empresa, 'Mercadinho Bom Preço'); assert.equal(conta.segmento, 'mercado'); assert.equal(conta.unidades_qtd, 2);
  const emp = (await chama('/api/empresa', { cookie: s })).json;
  assert.deepEqual([emp.nome, emp.razao_social, emp.cnpj, emp.porte, emp.telefone, emp.responsavel, emp.responsavel_cargo, emp.cep, emp.uf, emp.cidade, emp.funcionarios_qtd, emp.unidades_qtd, emp.como_conheceu],
    ['Mercadinho Bom Preço', 'Bom Preço Comércio de Alimentos LTDA', '11222333000181', 'me', '71988887777', 'Maria dos Santos', 'Dono(a) ou sócio(a)', '40010000', 'BA', 'Salvador', 12, 2, 'instagram']);
  // Dados da empresa: edita um campo sem perder o resto; CNPJ com dígito errado é barrado
  assert.equal((await chama('/api/empresa', { method: 'PUT', cookie: s, body: { cnpj: '11222333000182' } })).status, 400);
  assert.equal((await chama('/api/empresa', { method: 'PUT', cookie: s, body: { cnpj: '12.ABC.345/01DE-35', funcionarios_qtd: 15 } })).status, 200);
  const emp2 = (await chama('/api/empresa', { cookie: s })).json;
  assert.equal(emp2.cnpj, '12ABC34501DE35'); assert.equal(emp2.funcionarios_qtd, 15); assert.equal(emp2.responsavel, 'Maria dos Santos');

  // estado pelo CEP mesmo sem internet
  r = await chama('/api/cep/40010000', { cookie: s });
  assert.equal(r.status, 200); assert.equal(r.json.uf, 'BA');
  assert.equal((await chama('/api/cep/123', { cookie: s })).status, 400);

  // checklist da tela inicial acompanha o que foi feito
  r = await chama('/api/onboarding', { method: 'POST', cookie: s, body: { unidade: { nome: 'Loja Centro', setor: 'mercado' }, pessoas: ['Ana', 'Bia', 'Caio', 'Duda', 'Edu', 'Fábio'].map(nome => ({ nome })) } });
  assert.equal(r.status, 200);
  await chama('/api/inicio/enviada', { method: 'POST', cookie: s });
  await chama('/api/membros', { method: 'POST', cookie: s, body: { email: cont, papel: 'contador' } });
  r = await chama('/api/inicio', { cookie: s });
  assert.deepEqual(r.json, { cadastro_ok: true, unidades: 1, pessoas: 6, escala_enviada: true, contador: true });

  // /admin mostra o cadastro
  const adm = await fetch(base + '/api/admin/clientes', { headers: { authorization: 'Basic ' + Buffer.from('admin:' + process.env.ADMIN_PASS).toString('base64') } }).then(x => x.json());
  const linha = adm.find(x => x.email === comprador);
  assert.equal(linha.cnpj, '12ABC34501DE35'); assert.equal(linha.como_conheceu, 'instagram'); assert.equal(linha.funcionarios_qtd, 15);
});
