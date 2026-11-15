// Sua Escala 5x2 — setores da unidade (açougue, frente de caixa, cozinha...).
// Cada setor tem o próprio mínimo por dia; o motor garante esse mínimo com as mesmas regras por pessoa
// (2 folgas, domingo no rodízio, folga fixa). Unidade sem setor continua como antes.
// GET    /api/equipes/:id/setores          lista (com quantos colaboradores em cada)
// POST   /api/equipes/:id/setores          { nome, minimo? } ou { setores: [{ nome, minimo?, cargo? }] }
// (o quiz manda os setores junto no /api/onboarding: um por função, já com quem tem o cargo)
// PUT    /api/setores/:sid                 { nome?, minimo?, ordem? }
// DELETE /api/setores/:sid                 os colaboradores ficam sem setor
// PUT    /api/funcionarios/:fid/setor      { setor_id | null }
const fs = require('fs');
const path = require('path');

const SQL = fs.readFileSync(path.join(__dirname, 'db', 'setores.sql'), 'utf8');
const limpa = s => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);
// mínimo por dia: número (vale para todo dia) ou [7]; 0 a 50
function minimoValido(m) {
  if (m === undefined || m === null || m === '') return null;
  const arr = Array.isArray(m) ? m : Array(7).fill(m);
  if (arr.length !== 7) return null;
  return arr.map(x => Math.max(0, Math.min(50, Math.round(+x) || 0)));
}
// setores -> grupos do motor (gerarEscala): quem está no setor e o mínimo dele em cada dia
function gruposDosSetores(funcionarios, setores) {
  return (setores || []).filter(s => (s.minimo || []).some(x => x > 0)).map(s => ({
    nome: s.nome, setor_id: s.id, minimo: s.minimo,
    membros: funcionarios.map((f, i) => f.setor_id === s.id ? i : -1).filter(i => i >= 0),
  }));
}
// o que, nos setores, muda a escala (para refazer as semanas futuras quando muda)
const assinatura = setores => [...(setores || [])].sort((a, b) => a.id - b.id).map(s => [s.id, s.minimo || null]);

module.exports = function setores({ app, q, erro, L, LE, minhaEquipe, auditar }) {
  let pronto = null;
  const garante = () => (pronto ||= q(SQL).catch(e => { pronto = null; throw e; }));
  const daEquipe = async equipeId => { await garante(); return (await q('select * from setores where equipe_id=$1 order by ordem, id', [equipeId])).rows; };
  const normaliza = l => (Array.isArray(l) ? l : []).map(s => ({ nome: limpa(s?.nome), minimo: minimoValido(s?.minimo), cargo: limpa(s?.cargo) })).filter(s => s.nome).slice(0, 30);
  // cria vários de uma vez; quem tem o cargo e ainda não tem setor entra nele (o quiz cria um setor por função)
  async function criaLote(equipeId, lista, desde = 0) {
    await garante();
    const criados = [];
    for (const [k, s] of normaliza(lista).entries()) {
      const { rows: [n] } = await q('insert into setores (equipe_id, nome, ordem, minimo) values ($1,$2,$3,$4) returning *', [equipeId, s.nome, desde + k, s.minimo && JSON.stringify(s.minimo)]);
      if (s.cargo) await q('update funcionarios set setor_id=$1 where equipe_id=$2 and ativo and setor_id is null and lower(cargo)=lower($3)', [n.id, equipeId, s.cargo]);
      criados.push(n);
    }
    return criados;
  }
  const meuSetor = async (req, res) => {
    await garante();
    const { rows } = await q('select s.*, e.nome equipe from setores s join equipes e on e.id=s.equipe_id where s.id=$1 and e.usuario_id=$2', [+req.params.sid || 0, req.conta.id]);
    if (!rows[0]) { res.status(404).json({ erro: 'Setor não encontrado.' }); return null; }
    return rows[0];
  };

  app.get('/api/equipes/:id/setores', L, minhaEquipe, erro(async (req, res) => {
    await garante();
    const { rows } = await q(`select s.*, (select count(*)::int from funcionarios f where f.setor_id=s.id and f.ativo) pessoas
      from setores s where s.equipe_id=$1 order by s.ordem, s.id`, [req.equipe.id]);
    res.json(rows);
  }));
  app.post('/api/equipes/:id/setores', LE, minhaEquipe, erro(async (req, res) => {
    await garante();
    const lista = normaliza(Array.isArray(req.body?.setores) ? req.body.setores : [req.body || {}]);
    if (!lista.length) return res.status(400).json({ erro: 'Dê um nome ao setor. Ex.: Açougue, Frente de caixa.' });
    const { rows: [{ c }] } = await q('select count(*)::int c from setores where equipe_id=$1', [req.equipe.id]);
    if (c + lista.length > 30) return res.status(400).json({ erro: 'Limite de 30 setores por unidade.' });
    const criados = await criaLote(req.equipe.id, lista, c);
    auditar(req, `Criou ${criados.length === 1 ? 'o setor ' + criados[0].nome : criados.length + ' setores'} em ${req.equipe.nome}`);
    res.json(Array.isArray(req.body?.setores) ? criados : criados[0]);
  }));
  app.put('/api/setores/:sid', LE, erro(async (req, res) => {
    const s = await meuSetor(req, res); if (!s) return;
    const b = req.body || {}, nome = b.nome === undefined ? s.nome : limpa(b.nome);
    if (!nome) return res.status(400).json({ erro: 'Dê um nome ao setor.' });
    const minimo = b.minimo === undefined ? s.minimo : minimoValido(b.minimo);
    const ordem = Number.isInteger(b.ordem) ? b.ordem : s.ordem;
    const { rows: [n] } = await q('update setores set nome=$1, minimo=$2, ordem=$3 where id=$4 returning *', [nome, minimo && JSON.stringify(minimo), ordem, s.id]);
    auditar(req, `Alterou o setor ${nome} (${s.equipe})`);
    res.json(n);
  }));
  app.delete('/api/setores/:sid', LE, erro(async (req, res) => {
    const s = await meuSetor(req, res); if (!s) return;
    await q('delete from setores where id=$1', [s.id]);
    auditar(req, `Apagou o setor ${s.nome} (${s.equipe})`);
    res.json({ ok: true });
  }));
  app.put('/api/funcionarios/:fid/setor', LE, erro(async (req, res) => {
    await garante();
    const sid = req.body?.setor_id == null || req.body.setor_id === '' ? null : +req.body.setor_id;
    const { rows: [f] } = await q('select f.id, f.nome, f.equipe_id from funcionarios f join equipes e on e.id=f.equipe_id where f.id=$1 and e.usuario_id=$2', [+req.params.fid || 0, req.conta.id]);
    if (!f) return res.status(404).json({ erro: 'Colaborador não encontrado.' });
    if (sid !== null) {
      const { rows } = await q('select nome from setores where id=$1 and equipe_id=$2', [sid, f.equipe_id]);
      if (!rows[0]) return res.status(400).json({ erro: 'Esse setor não é desta unidade.' });
    }
    await q('update funcionarios set setor_id=$1 where id=$2', [sid, f.id]);
    res.json({ ok: true, setor_id: sid });
  }));
  return { garante, daEquipe, criaLote };
};
module.exports.gruposDosSetores = gruposDosSetores;
module.exports.assinatura = assinatura;
module.exports.minimoValido = minimoValido;
