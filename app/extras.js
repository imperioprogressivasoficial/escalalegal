// Materiais extras vendidos como order bump no checkout (Kiwify): Kit RH, Calculadora e Plaquinhas.
// Os arquivos ficam em app/extras/ (fora de public): só baixa quem comprou, pela rota autenticada.
//
// Webhook: a Kiwify manda um webhook por pedido. O bump pode chegar como pedido separado (Product = o bump)
// ou dentro do pedido principal (lista de produtos / order bumps). classificaPedido() olha os dois jeitos:
//   - pedido só de extras  -> registra o extra, NÃO cria conta nem libera o app
//   - pedido do app        -> segue o fluxo normal e também registra os extras que vierem junto
// Reembolso/chargeback de um extra tira só aquele extra.
const path = require('path');
const fs = require('fs');

const PASTA = path.join(__dirname, 'extras');
const PRODUTO_PRINCIPAL = String(process.env.KIWIFY_PRODUTO_ID || '6f254d50-e0a4-11f1-9205-439bc5ce1992').toLowerCase();

const CATALOGO = {
  kit_rh: {
    nome: 'Kit RH da 5x2', preco: 37, frase: { seu: 'Seu', o: 'O', esta: 'está', liberado: 'liberado' }, pasta: 'kit-rh',
    ids: [process.env.KIWIFY_KIT_RH_ID || '7d899720-e0a9-11f1-9205-439bc5ce1992', 'dr2f74k'],
    porNome: /kit\s*(de\s*|do\s*)?rh/i,
    checkout: 'https://pay.kiwify.com.br/dr2f74k',
    resumo: 'Termo aditivo da mudança de jornada, comunicado para a equipe, acordo de banco de horas, aviso para o quadro, folha de ponto e checklist da nova lei.',
    arquivos: [
      ['Kit-RH-da-5x2-completo.zip', 'Kit completo (todos os arquivos)'],
      ['LEIA-ME.pdf', 'Leia-me: como usar cada arquivo'],
      ['01-Termo-aditivo-mudanca-de-jornada-6x1-para-5x2.docx', 'Termo aditivo ao contrato (6x1 para 5x2)'],
      ['02-Comunicado-para-a-equipe.docx', 'Comunicado para a equipe'],
      ['03-Acordo-de-compensacao-banco-de-horas.docx', 'Acordo de compensação de horas (banco de horas)'],
      ['04-Aviso-aos-empregados-nova-jornada.pdf', 'Aviso aos empregados (para imprimir)'],
      ['04-Aviso-aos-empregados-nova-jornada.docx', 'Aviso aos empregados (editável)'],
      ['05-Folha-de-ponto-mensal.xlsx', 'Folha de ponto mensal (planilha)'],
      ['05-Folha-de-ponto-mensal.pdf', 'Folha de ponto mensal (para imprimir)'],
      ['06-Checklist-de-adequacao-a-nova-lei.pdf', 'Checklist de adequação à nova lei'],
    ],
  },
  calculadora: {
    nome: 'Calculadora de Custo da 5x2', preco: 27, frase: { seu: 'Sua', o: 'A', esta: 'está', liberado: 'liberada' }, pasta: 'calculadora',
    ids: [process.env.KIWIFY_CALC_ID || '7ed59f20-e0a9-11f1-9ed5-1d1ad40effc1', 'ref1qgh'],
    porNome: /calculadora/i,
    checkout: 'https://pay.kiwify.com.br/Ref1Qgh',
    resumo: 'Planilha para Excel e Google Planilhas: quantas horas faltam por semana, se sai mais barato hora extra ou contratar, e a comparação 6x1 x 5x2 com encargos.',
    arquivos: [
      ['Calculadora-de-Custo-da-5x2.xlsx', 'Calculadora de Custo da 5x2 (Excel e Google Planilhas)'],
    ],
  },
  plaquinhas: {
    nome: 'Plaquinhas de Aviso da Escala', preco: 19, frase: { seu: 'Suas', o: 'As', esta: 'estão', liberado: 'liberadas' }, pasta: 'plaquinhas',
    ids: [process.env.KIWIFY_PLAQUINHAS_ID || 'e8736ed0-e0a9-11f1-9ed5-1d1ad40effc1', '8vf4bas'],
    porNome: /plaquinha|placas?\s+de\s+aviso/i,
    checkout: 'https://pay.kiwify.com.br/8VF4Bas',
    resumo: 'Quadro da escala da semana para o mural, aviso de folga, horário de funcionamento e aviso aos clientes. Em A4 e A3, prontos para imprimir, e editáveis para pôr a sua logo.',
    arquivos: [
      ['Plaquinhas-de-Aviso-da-Escala-completo.zip', 'Todas as plaquinhas (A4, A3 e editáveis)'],
      ['LEIA-ME.pdf', 'Leia-me: como imprimir'],
      ['01-Quadro-da-escala-da-semana-A4.pdf', 'Quadro da escala da semana (A4)'],
      ['01-Quadro-da-escala-da-semana-A3.pdf', 'Quadro da escala da semana (A3)'],
      ['01-Quadro-da-escala-da-semana-editavel.pptx', 'Quadro da escala da semana (editável)'],
      ['02-Aviso-de-folga-A4.pdf', 'Aviso de folga (A4)'],
      ['02-Aviso-de-folga-A3.pdf', 'Aviso de folga (A3)'],
      ['02-Aviso-de-folga-editavel.pptx', 'Aviso de folga (editável)'],
      ['03-Horario-de-funcionamento-A4.pdf', 'Horário de funcionamento (A4)'],
      ['03-Horario-de-funcionamento-A3.pdf', 'Horário de funcionamento (A3)'],
      ['03-Horario-de-funcionamento-editavel.pptx', 'Horário de funcionamento (editável)'],
      ['04-Aviso-aos-clientes-escala-5x2-A4.pdf', 'Aviso aos clientes (A4)'],
      ['04-Aviso-aos-clientes-escala-5x2-A3.pdf', 'Aviso aos clientes (A3)'],
      ['04-Aviso-aos-clientes-escala-5x2-editavel.pptx', 'Aviso aos clientes (editável)'],
    ],
  },
};
const CHAVES = Object.keys(CATALOGO);
const ehExtra = k => typeof k === 'string' && Object.hasOwn(CATALOGO, k);
const TIPOS = {
  pdf: 'application/pdf', zip: 'application/zip',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

// ---------- leitura do pedido ----------
const PAI_PRODUTO = /product|produto|bump|item|offer|oferta/i;
// Junta as referências de produto do corpo: { id, nome } (Kiwify: Product.product_id/product_name; listas de bumps/itens).
function referencias(corpo) {
  const refs = [];
  (function anda(o, pai, prof) {
    if (!o || typeof o !== 'object' || prof > 6) return;
    if (Array.isArray(o)) { for (const x of o) anda(x, pai, prof + 1); return; }
    const s = k => (typeof o[k] === 'string' || typeof o[k] === 'number') ? String(o[k]) : '';
    const noPai = PAI_PRODUTO.test(pai);
    const id = s('product_id') || s('productId') || s('produto_id') || (noPai ? s('id') || s('ucode') : '');
    const nome = s('product_name') || s('productName') || s('produto_nome') || (noPai ? s('name') || s('nome') || s('title') || s('titulo') : '');
    if (id || nome) refs.push({ id: id.trim().toLowerCase(), nome: nome.trim() });
    for (const [k, v] of Object.entries(o)) if (v && typeof v === 'object') anda(v, k, prof + 1);
  })(corpo, '', 0);
  return refs;
}
function extraDe(ref) {
  for (const k of CHAVES) if (ref.id && CATALOGO[k].ids.some(i => i.toLowerCase() === ref.id)) return k;
  if (ref.id && ref.id === PRODUTO_PRINCIPAL) return null;
  for (const k of CHAVES) if (ref.nome && CATALOGO[k].porNome.test(ref.nome)) return k;
  return null;
}
// { extras: ['kit_rh', ...], soExtras: true se o pedido não traz o app (só bumps) }
function classificaPedido(corpo) {
  const refs = referencias(corpo && typeof corpo === 'object' ? corpo : {});
  const marcados = refs.map(extraDe);
  const extras = [...new Set(marcados.filter(Boolean))];
  const soExtras = extras.length > 0 && marcados.every(Boolean);
  return { extras, soExtras };
}

// ---------- arquivos ----------
// nome do arquivo só vale se estiver na lista do extra (nada de caminho vindo do usuário)
function arquivoPermitido(extra, arquivo) {
  if (!ehExtra(extra) || typeof arquivo !== 'string') return null;
  const c = CATALOGO[extra];
  const achado = c.arquivos.find(([n]) => n === arquivo);
  if (!achado) return null;
  const caminho = path.join(PASTA, c.pasta, achado[0]);
  if (!caminho.startsWith(path.join(PASTA, c.pasta) + path.sep)) return null;
  return caminho;
}
const tamanho = c => { try { return fs.statSync(c).size; } catch { return null; } };

module.exports = function extras({ app, q, erro, limpa, logado, fila, modelo, APP_URL, rodapeSuporte, admin, emailValido }) {
  const primeiroNome = n => String(n || '').trim().split(/\s+/)[0] || '';

  async function avisaLiberado(email, extra) {
    const c = CATALOGO[extra];
    const { rows } = await q('select nome from usuarios where email=$1', [email]);
    const oi = primeiroNome(rows[0]?.nome) ? `Olá, ${primeiroNome(rows[0]?.nome)}!` : 'Olá!';
    const f = c.frase;
    await fila.enfileirar(email, `Sua Escala 5x2: ${c.nome} ${f.liberado}`, modelo({
      titulo: `${f.seu} ${c.nome} ${f.esta} ${f.liberado}`,
      paragrafos: [oi, `Obrigado pela compra. ${f.o} ${c.nome} já ${f.esta} dentro do app, em Seus materiais.`,
        'Entre com o seu e-mail e senha e baixe quando quiser, quantas vezes precisar. Se ainda não criou a senha, use o link do e-mail de boas-vindas.'],
      botao: 'Abrir Seus materiais', link: `${APP_URL}/app#materiais`, rodape: rodapeSuporte,
    }));
  }

  // compra aprovada de extras: registra e avisa por e-mail (só na primeira vez)
  async function liberar(email, lista, { transacao, origem }) {
    const novos = [];
    for (const extra of lista) {
      if (!ehExtra(extra)) continue;
      const { rows } = await q(`insert into extras_compras (email, extra, transacao, status, origem) values ($1,$2,$3,'aprovada',$4)
        on conflict (email, extra) do update set status='aprovada', atualizado_em=now(),
          transacao=coalesce(nullif(excluded.transacao,''), extras_compras.transacao), origem=excluded.origem
        returning (xmax = 0) inserido, (select status from extras_compras e where e.email=$1 and e.extra=$2) antes`,
      [email, extra, transacao || null, origem || null]);
      if (rows[0].inserido || rows[0].antes !== 'aprovada') novos.push(extra);
    }
    for (const extra of novos) await avisaLiberado(email, extra).catch(e => console.error('e-mail extra:', e.message));
    return novos;
  }
  // reembolso/chargeback: tira só os extras desta transação (ou sem código de transação)
  async function revogar(email, lista, transacao) {
    if (!lista.length) return [];
    const { rows } = await q(`update extras_compras set status='reembolsada', atualizado_em=now()
      where email=$1 and extra = any($2) and status='aprovada' and ($3::text is null or transacao is null or transacao=$3) returning extra`,
    [email, lista, transacao || null]);
    return rows.map(r => r.extra);
  }
  // reembolso do pedido do app: o bump que veio dentro do mesmo pedido sai junto
  async function revogarDaTransacao(email, transacao) {
    if (!transacao) return [];
    const { rows } = await q(`update extras_compras set status='reembolsada', atualizado_em=now()
      where email=$1 and transacao=$2 and status='aprovada' returning extra`, [email, transacao]);
    return rows.map(r => r.extra);
  }

  // e-mails cujos extras valem para quem está logado: o próprio e, se ele trabalha numa empresa (gestor), o dono dela
  async function emailsDoDono(req) {
    const emails = [req.u.email];
    const cid = +req.get('x-conta') || +req.query.conta; // link de download não manda cabeçalho: vem em ?conta=
    if (cid && cid !== req.u.id) {
      const { rows } = await q(`select u.email from membros m join usuarios u on u.id=m.conta_id
        where m.conta_id=$1 and m.usuario_id=$2 and m.papel='gestor'`, [cid, req.u.id]);
      if (rows[0]?.email && !/@empresa\.invalid$/i.test(rows[0].email)) emails.push(rows[0].email);
    }
    return emails;
  }
  async function comprados(req) {
    const { rows } = await q(`select distinct extra from extras_compras where email = any($1) and status='aprovada'`, [await emailsDoDono(req)]);
    return new Set(rows.map(r => r.extra));
  }

  app.get('/api/extras', logado, erro(async (req, res) => {
    const tem = await comprados(req);
    res.json(CHAVES.map(k => {
      const c = CATALOGO[k], comprou = tem.has(k);
      return {
        extra: k, nome: c.nome, preco: c.preco, resumo: c.resumo, comprado: comprou,
        checkout: comprou ? null : c.checkout,
        arquivos: comprou ? c.arquivos.map(([arquivo, titulo]) => ({
          arquivo, titulo, tipo: arquivo.split('.').pop(), bytes: tamanho(path.join(PASTA, c.pasta, arquivo)),
          url: `/api/extras/${k}/${encodeURIComponent(arquivo)}`,
        })) : [],
      };
    }));
  }));

  app.get('/api/extras/:extra/:arquivo', logado, erro(async (req, res) => {
    const { extra, arquivo } = req.params;
    const caminho = arquivoPermitido(extra, arquivo);
    if (!caminho) return res.status(404).json({ erro: 'Arquivo não encontrado.' });
    if (!(await comprados(req)).has(extra)) return res.status(403).json({ erro: 'Este material ainda não foi comprado.', checkout: CATALOGO[extra].checkout });
    if (!tamanho(caminho)) return res.status(404).json({ erro: 'Arquivo não encontrado.' });
    res.set('Cache-Control', 'private, no-store');
    res.set('Content-Type', TIPOS[arquivo.split('.').pop()] || 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${arquivo}"`);
    res.sendFile(caminho);
  }));

  // admin: liberar (ou tirar) um extra na mão
  app.post('/api/admin/extras', admin, erro(async (req, res) => {
    const email = limpa(req.body?.email, 160).toLowerCase(), extra = String(req.body?.extra || '');
    if (!emailValido(email)) return res.status(400).json({ erro: 'E-mail inválido.' });
    if (!ehExtra(extra)) return res.status(400).json({ erro: `Extra inválido. Use: ${CHAVES.join(', ')}.` });
    if (req.body?.remover) {
      const r = await revogar(email, [extra], null);
      return res.json({ ok: true, removido: r.length > 0 });
    }
    const novos = await liberar(email, [extra], { origem: 'manual' });
    res.json({ ok: true, ja_tinha: !novos.length });
  }));

  return { liberar, revogar, revogarDaTransacao, classificaPedido };
};
module.exports.CATALOGO = CATALOGO;
module.exports.classificaPedido = classificaPedido;
module.exports.arquivoPermitido = arquivoPermitido;
