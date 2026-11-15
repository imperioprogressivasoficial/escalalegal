// Sua Escala 5x2 — notificações do app (sino no topo).
// Cada notificação é da conta (empresa) e, se precisar, de um papel: 'dono' (dono e gerente) ou 'contador'.
// "chave" evita repetir o mesmo aviso (ex.: lei:30, fechar:2026-11, escala:12:2026-11-16:2026-11-15).
// Parte é criada na hora (escala montada, falta lançada, mês fechado) e parte quando o sino é aberto
// (contagem da lei, mês para fechar, escala não enviada, contador entrou, material liberado).
const { CATALOGO } = require('./extras.js');

const hojeBR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const LEI = '2026-12-15';
const papelDe = req => (req.conta.papel === 'contador' ? 'contador' : 'dono');

module.exports = function notificacoes({ app, q, erro, L }) {
  async function notificar(contaId, { tipo, titulo, texto = null, link = null, chave = null, papel = null }) {
    if (!contaId || !tipo || !titulo) return;
    await q(`insert into notificacoes (conta_id, papel, tipo, titulo, texto, link, chave) values ($1,$2,$3,$4,$5,$6,$7)
      on conflict (conta_id, chave) where chave is not null do nothing`,
    [contaId, papel, tipo, String(titulo).slice(0, 160), texto && String(texto).slice(0, 400), link, chave]).catch(e => console.error('notificação:', e.message));
  }

  // avisos que dependem do dia ou do estado da conta: criados quando o sino é consultado (a chave não deixa repetir)
  async function pendentes(req) {
    if (req.conta.papel === 'contador') return;
    const c = req.conta.id, hoje = hojeBR();
    const dias = Math.round((Date.parse(LEI) - Date.parse(hoje)) / 864e5);
    const marco = [30, 7, 1].find((m, i, a) => dias <= m && dias > (a[i + 1] ?? 0));
    if (marco) await notificar(c, { tipo: 'lei', titulo: dias === 1 ? 'Amanhã a escala 5x2 passa a valer' : `Faltam ${dias} dias para a escala 5x2 valer`,
      texto: 'A partir de 15/12/2026: 2 folgas por semana e limite de 42 horas.', link: 'aula', chave: `lei:${marco}` });
    const { rows: [e] } = await q(`select (select count(*)::int from equipes where usuario_id=$1) unidades,
        (select escala_enviada_em from empresa_config where conta_id=$1) enviada,
        (select count(*)::int from equipes where usuario_id=$1 and link_token is not null) links,
        (select count(*)::int from fechamentos where conta_id=$1 and mes=$2) fechado`, [c, hoje.slice(0, 7)]);
    if (e.unidades) {
      const d = new Date(hoje + 'T12:00:00Z'), ultimo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
      if (d.getUTCDate() >= ultimo - 2 && !e.fechado) await notificar(c, { tipo: 'fechar', papel: 'dono', titulo: 'O mês está acabando: hora de fechar',
        texto: 'Feche o mês para o contador receber os dias trabalhados, faltas e feriados.', link: 'fechamento', chave: `fechar:${hoje.slice(0, 7)}` });
      if (!e.enviada && !e.links) {
        const seg = new Date(d); seg.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
        await notificar(c, { tipo: 'enviar', papel: 'dono', titulo: 'A equipe ainda não recebeu a escala',
          texto: 'Mande no grupo do WhatsApp, em PDF ou pelo link onde cada um vê a própria folga.', link: 'tabela', chave: `enviar:${seg.toISOString().slice(0, 10)}` });
      }
    }
    const { rows: conts } = await q(`select u.id, u.nome from membros m join usuarios u on u.id=m.usuario_id
      where m.conta_id=$1 and m.papel='contador' and u.senha_hash is not null`, [c]);
    for (const x of conts) await notificar(c, { tipo: 'contador', papel: 'dono', titulo: `${x.nome || 'Seu contador'} entrou no app`,
      texto: 'O contador já vê a escala e o fechamento do mês.', link: 'acessos', chave: `contador:${x.id}` });
    const { rows: ex } = await q(`select distinct x.extra from extras_compras x join usuarios u on lower(u.email)=lower(x.email)
      where u.id=$1 and x.status='aprovada'`, [c]).catch(() => ({ rows: [] }));
    for (const x of ex) await notificar(c, { tipo: 'material', papel: 'dono', titulo: `${CATALOGO[x.extra]?.nome || 'Material'} liberado`,
      texto: 'Já dá para baixar em Seus materiais.', link: 'materiais', chave: `extra:${x.extra}` });
  }

  app.get('/api/notificacoes', L, erro(async (req, res) => {
    await pendentes(req);
    const { rows } = await q(`select id, tipo, titulo, texto, link, lida, criado_em from notificacoes
      where conta_id=$1 and (papel is null or papel=$2) order by criado_em desc, id desc limit 40`, [req.conta.id, papelDe(req)]);
    res.json({ itens: rows, nao_lidas: rows.filter(r => !r.lida).length });
  }));
  app.post('/api/notificacoes/lidas', L, erro(async (req, res) => {
    await q('update notificacoes set lida=true where conta_id=$1 and (papel is null or papel=$2) and not lida', [req.conta.id, papelDe(req)]);
    res.json({ ok: true });
  }));
  app.post('/api/notificacoes/:id/lida', L, erro(async (req, res) => {
    const { rowCount } = await q('update notificacoes set lida=true where id=$1 and conta_id=$2 and (papel is null or papel=$3)',
      [+req.params.id || 0, req.conta.id, papelDe(req)]);
    if (!rowCount) return res.status(404).json({ erro: 'Notificação não encontrada.' });
    res.json({ ok: true });
  }));

  return { notificar };
};
