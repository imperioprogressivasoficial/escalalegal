// Suporte: dúvidas frequentes (app/suporte/faq.js), assistente de IA no n8n e chamados para o dono.
//
//   GET  /suporte/faq.js           a base de dúvidas para o widget (app/public/suporte.js)
//   POST /api/suporte/mensagem     conversa com o assistente (logado). O servidor junta o contexto
//                                  (nome, empresa, papel, tela, situação do acesso) e chama o webhook do n8n
//                                  (SUPORTE_N8N_URL) com o cabeçalho x-suporte-token (SUPORTE_N8N_TOKEN).
//                                  Nunca vai senha, token, e-mail ou cookie para o n8n.
//   POST /api/suporte/chamado      "Falar com o suporte no WhatsApp": registra o chamado e devolve o link wa.me
//   GET  /api/suporte/contato      link wa.me sem dados (para quem não entrou na conta)
//   GET/PATCH /api/admin/suporte   chamados no /admin
//
// Atendimento no site (visitante sem login: página de vendas, ajuda, obrigado e blog):
//   GET  /suporte/faq-vendas.js      dúvidas de quem vai comprar
//   POST /api/atendimento/mensagem   mesma IA no n8n com modo "vendas". Só da nossa página (Origin/Referer do domínio
//                                    ou do blog), limite por IP por hora, mensagem curta e campo isca (website) contra robôs.
//   POST /api/atendimento/chamado    "Falar com uma pessoa no WhatsApp": chamado com origem 'site' e o link wa.me
//
// Chamado = uma linha por conversa (conversa_id único): repetir a escalada só atualiza resumo e conversa.
const path = require('path');
const FAQ = require('./suporte/faq.js');
const ARQ_FAQ = { 'faq.js': 'faq.js', 'faq-vendas.js': 'faq-vendas.js' };

const PEDE_PESSOA = /\b(falar|conversar|atendimento)\s+(com\s+)?(uma?\s+)?(pessoa|humano|atendente|algu[eé]m|suporte|dono)\b|\batendente\b|\bhumano\b/i;
const ASSUNTO_SENSIVEL = /reembols|estorn|chargeback|cobran[cç]a|cobrad[oa] duas|nota fiscal|\bbug\b|travou|n[aã]o funciona|sumi[ur]|perdi (os|as|a|o|meus|minhas)|apag(ou|aram) (tudo|os dados|a escala)/i;

module.exports = function suporte({ app, q, erro, limpa, logado, limite, admin, LIBERAR_TUDO, seg, E = process.env }) {
  const numeroZap = () => String(E.SUPORTE_WHATSAPP || '5571993357290').replace(/\D/g, '');
  const linkZap = texto => `https://wa.me/${numeroZap()}${texto ? '?text=' + encodeURIComponent(texto) : ''}`;

  // ---------- a base de dúvidas para o navegador ----------
  app.get(['/suporte/faq.js', '/suporte/faq-vendas.js'], (req, res) => {
    res.type('application/javascript').set('Cache-Control', 'public, max-age=600');
    res.sendFile(path.join(__dirname, 'suporte', ARQ_FAQ[path.basename(req.path)]));
  });

  // ---------- quem está perguntando (a empresa vem do x-conta, como na gestão) ----------
  const contexto = erro(async (req, res, next) => {
    const cid = +req.get('x-conta') || req.u.id;
    let papel = 'dono', empresa = req.u.empresa, liberado = req.u.acesso_liberado;
    if (cid !== req.u.id) {
      const { rows } = await q(`select m.papel, u.empresa, u.acesso_liberado from membros m join usuarios u on u.id=m.conta_id
        where m.conta_id=$1 and m.usuario_id=$2`, [cid, req.u.id]);
      if (!rows[0]) return res.status(403).json({ erro: 'Você não tem acesso a esta empresa.' });
      papel = rows[0].papel; empresa = rows[0].empresa;
      liberado = papel === 'dono' ? req.u.acesso_liberado : rows[0].acesso_liberado;
    }
    req.sup = { conta_id: cid, papel, empresa: empresa || '', liberado: !!liberado || LIBERAR_TUDO === '1' };
    next();
  });

  // limite por pessoa (além do limite por IP): SUPORTE_MAX_HORA mensagens por hora
  const usos = new Map();
  const porHora = (req, res, next) => {
    const max = +E.SUPORTE_MAX_HORA || 40, agora = Date.now();
    const h = (usos.get(req.u.id) || []).filter(t => agora - t < 3600e3);
    if (h.length >= max) return res.status(429).json({ erro: 'Você mandou muitas mensagens em pouco tempo. Tente de novo mais tarde ou fale com o suporte no WhatsApp.', escalar: true });
    h.push(agora); usos.set(req.u.id, h); next();
  };
  setInterval(() => { const a = Date.now(); for (const [k, h] of usos) if (!h.length || a - h[h.length - 1] > 3600e3) usos.delete(k); }, 10 * 60_000).unref();

  const idConversa = v => /^[\w-]{8,64}$/.test(String(v || '')) ? String(v) : null;
  const TELA = v => limpa(v, 60).replace(/[^\w/#-]/g, '');
  // conversa que o widget manda (só texto, tamanho limitado)
  const conversaDe = lista => (Array.isArray(lista) ? lista : []).slice(-30)
    .map(m => ({ de: m?.de === 'assistente' ? 'assistente' : 'cliente', texto: limpa(m?.texto, 2000) })).filter(m => m.texto);

  async function registraChamado(req, { conversa_id, resumo, conversa, origem }) {
    const { rows } = await q(`insert into suporte_chamados (conversa_id, usuario_id, conta_id, resumo, conversa, tela, origem)
      values ($1,$2,$3,$4,$5,$6,$7)
      on conflict (conversa_id) do update set resumo=coalesce(nullif(excluded.resumo,''), suporte_chamados.resumo),
        conversa=case when jsonb_array_length(excluded.conversa) > 0 then excluded.conversa else suporte_chamados.conversa end,
        origem=case when excluded.origem='whatsapp' then 'whatsapp' else suporte_chamados.origem end,
        status='aberto', atualizado_em=now()
      returning id`, [`u${req.u.id}-${conversa_id}`, req.u.id, req.sup.conta_id, limpa(resumo, 600), JSON.stringify(conversa || []), TELA(req.body?.tela), origem]);
    return rows[0]?.id || null;
  }

  // resposta do n8n: aceita {resposta,...}, {output:{...}}, [ {...} ] ou texto
  function leResposta(j) {
    if (Array.isArray(j)) j = j[0];
    if (j && typeof j.output === 'object' && j.output) j = j.output;
    if (j && typeof j.output === 'string') { try { j = JSON.parse(j.output); } catch { j = { resposta: j.output }; } }
    const resposta = limpa(j?.resposta, 3000);
    if (!resposta) return null;
    return { resposta, resolvido: j.resolvido === true || j.resolvido === 'true', escalar: j.escalar === true || j.escalar === 'true', resumo: limpa(j.resumo, 600) };
  }

  // chama o webhook do n8n; null se não estiver configurado, cair ou responder fora do formato
  async function perguntaN8n(corpo) {
    const URL_N8N = E.SUPORTE_N8N_URL;
    if (!URL_N8N) return null;
    try {
      const resp = await fetch(URL_N8N, {
        method: 'POST', signal: AbortSignal.timeout(+E.SUPORTE_N8N_TIMEOUT_MS || 45_000),
        headers: { 'Content-Type': 'application/json', 'x-suporte-token': E.SUPORTE_N8N_TOKEN || '' },
        body: JSON.stringify(corpo),
      });
      if (resp.ok) return leResposta(await resp.json().catch(() => null));
      console.error('suporte n8n: HTTP', resp.status);
    } catch (e) { console.error('suporte n8n:', e.message); }
    return null;
  }

  app.post('/api/suporte/mensagem', logado, limite(20), contexto, porHora, erro(async (req, res) => {
    const b = req.body || {};
    const conversa_id = idConversa(b.conversa_id), mensagem = limpa(b.mensagem, 1500);
    if (!conversa_id) return res.status(400).json({ erro: 'Conversa inválida. Recarregue a página.' });
    if (!mensagem) return res.status(400).json({ erro: 'Escreva a sua dúvida.' });
    const conversa = [...conversaDe(b.historico), { de: 'cliente', texto: mensagem }];
    const pedePessoa = PEDE_PESSOA.test(mensagem);
    let r = await perguntaN8n({
      modo: 'suporte', conversa_id: `u${req.u.id}-${conversa_id}`, mensagem,
      contexto: { nome: req.u.nome || '', empresa: req.sup.empresa, papel: req.sup.papel, tela: TELA(b.tela) || 'inicio', acesso: req.sup.liberado ? 'pago e liberado' : 'pagamento pendente' },
    });
    if (!r) r = { resposta: 'O assistente não está disponível agora. Fale com o suporte no WhatsApp: uma pessoa responde por lá.', resolvido: false, escalar: true, resumo: '', indisponivel: true };
    if (pedePessoa || ASSUNTO_SENSIVEL.test(mensagem)) r.escalar = true;
    if (r.escalar) r.resolvido = false;
    conversa.push({ de: 'assistente', texto: r.resposta });
    if (r.escalar) r.chamado = await registraChamado(req, { conversa_id, resumo: r.resumo || mensagem, conversa, origem: 'assistente' });
    res.json(r);
  }));

  // o cliente toca em "Falar com o suporte no WhatsApp": registra e devolve o link com a mensagem pronta
  app.post('/api/suporte/chamado', logado, limite(10), contexto, erro(async (req, res) => {
    const b = req.body || {};
    const conversa_id = idConversa(b.conversa_id);
    if (!conversa_id) return res.status(400).json({ erro: 'Conversa inválida. Recarregue a página.' });
    const conversa = conversaDe(b.historico);
    const resumo = limpa(b.resumo, 600) || [...conversa].reverse().find(m => m.de === 'cliente')?.texto?.slice(0, 600) || '';
    const id = await registraChamado(req, { conversa_id, resumo, conversa, origem: 'whatsapp' });
    const texto = ['Olá! Preciso de ajuda com a Sua Escala 5x2.',
      `Nome: ${req.u.nome || '-'}`, `Empresa: ${req.sup.empresa || '-'}`, `E-mail: ${req.u.email}`,
      resumo ? `Dúvida: ${resumo}` : '', id ? `Chamado nº ${id}` : ''].filter(Boolean).join('\n');
    res.json({ ok: true, chamado: id, link: linkZap(texto) });
  }));
  app.get('/api/suporte/contato', limite(30), (_req, res) => res.json({ link: linkZap('Olá! Preciso de ajuda com a Sua Escala 5x2.') }));

  // ---------- atendimento no site (sem login) ----------
  const doSite = seg ? seg.soDaNossaPagina : (_req, _res, next) => next();
  const visitas = new Map();
  const porIpHora = (chave, padrao) => (req, res, next) => {
    const max = +E[chave] || padrao, agora = Date.now(), k = chave + ' ' + req.ip;
    const h = (visitas.get(k) || []).filter(t => agora - t < 3600e3);
    if (h.length >= max) return res.status(429).json({ erro: 'Muitas mensagens em pouco tempo. Fale com a gente no WhatsApp.', escalar: true });
    h.push(agora); visitas.set(k, h); next();
  };
  setInterval(() => { const a = Date.now(); for (const [k, h] of visitas) if (!h.length || a - h[h.length - 1] > 3600e3) visitas.delete(k); }, 10 * 60_000).unref();
  const PAGINA = v => limpa(v, 80).replace(/[^\w/#.-]/g, '') || '/';
  async function chamadoSite({ conversa_id, resumo, conversa, pagina }) {
    const { rows } = await q(`insert into suporte_chamados (conversa_id, usuario_id, conta_id, resumo, conversa, tela, origem)
      values ($1, null, null, $2, $3, $4, 'site')
      on conflict (conversa_id) do update set resumo=coalesce(nullif(excluded.resumo,''), suporte_chamados.resumo),
        conversa=case when jsonb_array_length(excluded.conversa) > 0 then excluded.conversa else suporte_chamados.conversa end,
        status='aberto', atualizado_em=now()
      where suporte_chamados.usuario_id is null
      returning id`, [`site-${conversa_id}`, limpa(resumo, 600), JSON.stringify(conversa || []), PAGINA(pagina)]);
    return rows[0]?.id || null;
  }
  const RESPOSTA_ISCA = { resposta: 'Obrigado pela mensagem. Fale com a gente no WhatsApp.', resolvido: false, escalar: true, resumo: '' };

  app.post('/api/atendimento/mensagem', doSite, porIpHora('ATENDIMENTO_MAX_HORA', 20), erro(async (req, res) => {
    const b = req.body || {};
    if (String(b.website || '').trim()) return res.json(RESPOSTA_ISCA); // campo isca: só robô preenche
    const conversa_id = idConversa(b.conversa_id), mensagem = limpa(b.mensagem, 800);
    if (!conversa_id) return res.status(400).json({ erro: 'Conversa inválida. Recarregue a página.' });
    if (!mensagem) return res.status(400).json({ erro: 'Escreva a sua dúvida.' });
    const conversa = [...conversaDe(b.historico).slice(-12), { de: 'cliente', texto: mensagem }];
    let r = await perguntaN8n({ modo: 'vendas', conversa_id: `site-${conversa_id}`, mensagem, contexto: { pagina: PAGINA(b.pagina) } });
    if (!r) r = { resposta: 'O atendimento automático não está disponível agora. Fale com a gente no WhatsApp: uma pessoa responde por lá.', resolvido: false, escalar: true, resumo: '', indisponivel: true };
    if (PEDE_PESSOA.test(mensagem)) r.escalar = true;
    if (r.escalar) r.resolvido = false;
    conversa.push({ de: 'assistente', texto: r.resposta });
    if (r.escalar) r.chamado = await chamadoSite({ conversa_id, resumo: r.resumo || mensagem, conversa, pagina: b.pagina });
    res.json(r);
  }));
  app.post('/api/atendimento/chamado', doSite, porIpHora('ATENDIMENTO_CHAMADOS_HORA', 10), erro(async (req, res) => {
    const b = req.body || {};
    if (String(b.website || '').trim()) return res.json({ ok: true, link: linkZap('Vim pelo site, tenho uma dúvida.') });
    const conversa_id = idConversa(b.conversa_id);
    if (!conversa_id) return res.status(400).json({ erro: 'Conversa inválida. Recarregue a página.' });
    const conversa = conversaDe(b.historico);
    const resumo = limpa(b.resumo, 300) || [...conversa].reverse().find(m => m.de === 'cliente')?.texto?.slice(0, 300) || '';
    const id = await chamadoSite({ conversa_id, resumo, conversa, pagina: b.pagina });
    res.json({ ok: true, chamado: id, link: linkZap(`Vim pelo site, tenho uma dúvida: ${resumo || '...'}`) });
  }));

  // ---------- /admin ----------
  app.get('/api/admin/suporte', admin, erro(async (req, res) => {
    const status = ['aberto', 'fechado'].includes(req.query.status) ? req.query.status : null;
    const { rows } = await q(`select c.id, c.criado_em, c.atualizado_em, c.status, c.resumo, c.conversa, c.tela, c.origem,
        u.nome, u.email, u.whatsapp, coalesce(e.empresa, e.nome) empresa
      from suporte_chamados c left join usuarios u on u.id=c.usuario_id left join usuarios e on e.id=c.conta_id
      where ($1::text is null or c.status=$1) order by (c.status='aberto') desc, c.atualizado_em desc limit 500`, [status]);
    const { rows: n } = await q("select count(*) filter (where status='aberto')::int abertos, count(*)::int total from suporte_chamados");
    res.json({ ...n[0], whatsapp: numeroZap(), n8n: !!E.SUPORTE_N8N_URL, chamados: rows });
  }));
  app.patch('/api/admin/suporte/:id', admin, erro(async (req, res) => {
    const status = req.body?.status === 'fechado' ? 'fechado' : 'aberto';
    const { rowCount } = await q('update suporte_chamados set status=$1, atualizado_em=now() where id=$2', [status, +req.params.id || 0]);
    if (!rowCount) return res.status(404).json({ erro: 'Chamado não encontrado.' });
    res.json({ ok: true, status });
  }));

  return { FAQ, leResposta, PEDE_PESSOA, ASSUNTO_SENSIVEL };
};
