// Gestão da empresa: equipes, funcionários, escalas, ocorrências (férias, atestado, falta...),
// acesso de gestor e contador, visão geral, fechamento do mês e histórico.
//
// "Conta" = a empresa (o usuário dono). Quem entra pode ser o dono, um gestor (edita tudo)
// ou o contador (só consulta e baixa relatórios). O front manda a conta escolhida no cabeçalho x-conta.
const crypto = require('crypto');
const { gerarEscala, SETORES, OCORRENCIAS, COD_NOME, DIAS, feriado, somaDias } = require('./public/scheduler.js');

const TIPOS = Object.keys(OCORRENCIAS);
const COD_AUSENCIA = new Set(Object.values(OCORRENCIAS).map(o => o.cod).filter(Boolean));
const dataValida = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) && !isNaN(Date.parse(v)) ? String(v) : null;
const diasEntre = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const hojeBR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10); // horário de Brasília
const PAPEL_NOME = { dono: 'Dono', gestor: 'Gestor', contador: 'Contador' };

module.exports = function gestao({ app, q, pool, erro, limpa, logado, limite, LIBERAR_TUDO, CHECKOUT_URL, criaLink, fila, modelo, APP_URL, rodapeSuporte }) {
  // ---------- conta e permissões ----------
  const naConta = erro(async (req, res, next) => {
    const cid = +req.get('x-conta') || req.u.id;
    if (cid === req.u.id) {
      req.conta = { id: req.u.id, papel: 'dono', liberado: req.u.acesso_liberado || LIBERAR_TUDO === '1', empresa: req.u.empresa };
      return next();
    }
    const { rows } = await q(`select m.papel, u.acesso_liberado, u.empresa from membros m join usuarios u on u.id=m.conta_id
      where m.conta_id=$1 and m.usuario_id=$2`, [cid, req.u.id]);
    if (!rows[0]) return res.status(403).json({ erro: 'Você não tem acesso a esta empresa.', trocar_conta: true });
    req.conta = { id: cid, papel: rows[0].papel, liberado: rows[0].acesso_liberado || LIBERAR_TUDO === '1', empresa: rows[0].empresa };
    next();
  });
  const edita = (req, res, next) => req.conta.papel === 'contador'
    ? res.status(403).json({ erro: 'Seu acesso é de consulta. Peça ao dono da empresa para fazer essa alteração.' }) : next();
  const soDono = (req, res, next) => req.conta.papel === 'dono'
    ? next() : res.status(403).json({ erro: 'Só o dono da empresa pode gerenciar os acessos.' });
  const pago = (req, res, next) => req.conta.liberado
    ? next() : res.status(402).json({ erro: 'O acesso desta empresa ainda não foi liberado. Conclua o pagamento para gerar escalas.', checkout: CHECKOUT_URL });
  const L = [logado, naConta], LE = [logado, naConta, edita];

  const minhaEquipe = erro(async (req, res, next) => {
    const { rows } = await q('select * from equipes where id=$1 and usuario_id=$2', [+req.params.id || 0, req.conta.id]);
    if (!rows[0]) return res.status(404).json({ erro: 'Equipe não encontrada.' });
    req.equipe = rows[0]; next();
  });
  const auditar = (req, acao) => q('insert into auditoria (conta_id, usuario_id, acao) values ($1,$2,$3)', [req.conta.id, req.u.id, String(acao).slice(0, 300)])
    .catch(e => console.error('auditoria:', e.message));

  // ---------- ocorrências na escala ----------
  // ocorrências de dia inteiro dos funcionários no período [de, ate]
  async function ocorrenciasDe(ids, de, ate) {
    if (!ids.length) return [];
    const { rows } = await q(`select id, funcionario_id, tipo, inicio, fim from ocorrencias
      where funcionario_id = any($1) and tipo <> 'banco_horas' and inicio <= $3 and fim >= $2`, [ids, de, ate]);
    return rows;
  }
  // mapa "funcionarioId|data" -> código
  function mapaOcorrencias(ocs) {
    const m = new Map();
    for (const o of ocs) {
      const cod = OCORRENCIAS[o.tipo]?.cod;
      if (!cod) continue;
      for (let d = o.inicio; d <= o.fim; d = somaDias(d, 1)) m.set(o.funcionario_id + '|' + d, cod);
    }
    return m;
  }
  // aplica as ocorrências atuais sobre a escala salva (uma ocorrência lançada depois aparece na hora)
  function sobrepor(escala, mapa) {
    const dados = escala.dados.map((sem, s) => sem.map((dias, f) => dias.map((c, d) => {
      const fid = escala.funcionarios[f]?.id, data = somaDias(escala.inicio, s * 7 + d);
      const oc = fid && mapa.get(fid + '|' + data);
      if (oc && escala.abertos[d]) return oc;
      return COD_AUSENCIA.has(c) ? 'T' : c; // ocorrência apagada: volta a trabalhar
    })));
    return { ...escala, dados };
  }
  async function escalasComOcorrencias(escalas) {
    if (!escalas.length) return escalas;
    const ids = [...new Set(escalas.flatMap(e => e.funcionarios.map(f => f.id)))];
    const de = escalas.reduce((a, e) => (e.inicio < a ? e.inicio : a), escalas[0].inicio);
    const ate = escalas.reduce((a, e) => { const f = somaDias(e.inicio, e.semanas * 7 - 1); return f > a ? f : a; }, de);
    const mapa = mapaOcorrencias(await ocorrenciasDe(ids, de, ate));
    return escalas.map(e => sobrepor(e, mapa));
  }

  // ---------- conta: empresas que a pessoa acessa ----------
  app.get('/api/contas', logado, erro(async (req, res) => {
    const { rows } = await q(`select m.conta_id id, coalesce(u.empresa, u.nome) empresa, m.papel from membros m
      join usuarios u on u.id=m.conta_id where m.usuario_id=$1 order by u.empresa`, [req.u.id]);
    res.json([{ id: req.u.id, empresa: req.u.empresa || req.u.nome, papel: 'dono' }, ...rows]);
  }));
  app.get('/api/conta', L, (req, res) => res.json({ ...req.conta, papel_nome: PAPEL_NOME[req.conta.papel] }));

  // ---------- equipes ----------
  function validaEquipe(b) {
    const setor = SETORES[b.setor] ? b.setor : 'varejo';
    const abertos = Array.isArray(b.abertos) && b.abertos.length === 7 ? b.abertos.map(x => (x ? 1 : 0)) : SETORES[setor].abertos;
    const minimo = Array.isArray(b.minimo) && b.minimo.length === 7 ? b.minimo.map(x => Math.max(0, Math.min(200, Math.round(+x) || 0))) : SETORES[setor].minimo;
    return { nome: limpa(b.nome, 80) || SETORES[setor].nome, setor, abertos, minimo };
  }
  app.get('/api/equipes', L, erro(async (req, res) => {
    const { rows } = await q(`select e.*, (select count(*)::int from funcionarios f where f.equipe_id=e.id and f.ativo) total,
      (select max(criado_em) from escalas s where s.equipe_id=e.id) ultima from equipes e where usuario_id=$1 order by e.id`, [req.conta.id]);
    res.json(rows);
  }));
  app.post('/api/equipes', LE, erro(async (req, res) => {
    const e = validaEquipe(req.body || {});
    const { rows: n } = await q('select count(*)::int c from equipes where usuario_id=$1', [req.conta.id]);
    if (n[0].c >= 50) return res.status(400).json({ erro: 'Limite de 50 equipes por conta.' });
    const { rows } = await q('insert into equipes (usuario_id, nome, setor, abertos, minimo) values ($1,$2,$3,$4,$5) returning *',
      [req.conta.id, e.nome, e.setor, JSON.stringify(e.abertos), JSON.stringify(e.minimo)]);
    auditar(req, `Criou a equipe ${e.nome}`);
    res.json(rows[0]);
  }));
  app.put('/api/equipes/:id', LE, minhaEquipe, erro(async (req, res) => {
    const e = validaEquipe({ ...req.equipe, ...req.body });
    const { rows } = await q('update equipes set nome=$1, setor=$2, abertos=$3, minimo=$4 where id=$5 returning *',
      [e.nome, e.setor, JSON.stringify(e.abertos), JSON.stringify(e.minimo), req.equipe.id]);
    auditar(req, `Alterou dias e cobertura da equipe ${e.nome}`);
    res.json(rows[0]);
  }));
  app.delete('/api/equipes/:id', LE, minhaEquipe, erro(async (req, res) => {
    await q('delete from equipes where id=$1', [req.equipe.id]);
    auditar(req, `Excluiu a equipe ${req.equipe.nome}`);
    res.json({ ok: true });
  }));

  // ---------- funcionários ----------
  const fixos = v => [...new Set((Array.isArray(v) ? v : []).map(Number).filter(d => Number.isInteger(d) && d >= 0 && d < 7))].slice(0, 2);
  const dadosFunc = f => ({
    nome: limpa(f.nome, 60), cargo: limpa(f.cargo, 60), folga_fixa: fixos(f.folga_fixa),
    matricula: limpa(f.matricula, 30) || null, admissao: dataValida(f.admissao), telefone: limpa(f.telefone, 20).replace(/\D/g, '') || null,
  });
  app.get('/api/equipes/:id/funcionarios', L, minhaEquipe, erro(async (req, res) => {
    const { rows } = await q('select * from funcionarios where equipe_id=$1 and ativo order by nome', [req.equipe.id]);
    res.json(rows);
  }));
  app.get('/api/funcionarios', L, erro(async (req, res) => {
    const { rows } = await q(`select f.id, f.nome, f.cargo, f.matricula, e.id equipe_id, e.nome equipe from funcionarios f
      join equipes e on e.id=f.equipe_id where e.usuario_id=$1 and f.ativo order by e.nome, f.nome`, [req.conta.id]);
    res.json(rows);
  }));
  app.post('/api/equipes/:id/funcionarios', LE, minhaEquipe, erro(async (req, res) => {
    const lista = (Array.isArray(req.body) ? req.body : [req.body]).filter(f => limpa(f?.nome));
    if (!lista.length) return res.status(400).json({ erro: 'Informe o nome do funcionário.' });
    const { rows: n } = await q('select count(*)::int c from funcionarios where equipe_id=$1 and ativo', [req.equipe.id]);
    if (n[0].c + lista.length > 200) return res.status(400).json({ erro: 'Limite de 200 funcionários por equipe.' });
    const { rows } = await q(`insert into funcionarios (equipe_id, nome, cargo, folga_fixa, matricula, admissao, telefone)
      select $1, x.nome, x.cargo, x.folga_fixa, x.matricula, x.admissao, x.telefone
      from jsonb_to_recordset($2::jsonb) as x(nome text, cargo text, folga_fixa jsonb, matricula text, admissao date, telefone text) returning *`,
    [req.equipe.id, JSON.stringify(lista.map(dadosFunc))]);
    auditar(req, `Cadastrou ${rows.length === 1 ? rows[0].nome : rows.length + ' funcionários'} em ${req.equipe.nome}`);
    res.json(rows);
  }));
  app.put('/api/funcionarios/:fid', LE, erro(async (req, res) => {
    const b = req.body || {};
    if (!limpa(b.nome)) return res.status(400).json({ erro: 'Informe o nome do funcionário.' });
    const f = dadosFunc(b);
    const { rows } = await q(`update funcionarios f set nome=$1, cargo=$2, folga_fixa=$3, matricula=$4, admissao=$5, telefone=$6 from equipes e
      where f.id=$7 and f.equipe_id=e.id and e.usuario_id=$8 returning f.*`,
    [f.nome, f.cargo, JSON.stringify(f.folga_fixa), f.matricula, f.admissao, f.telefone, +req.params.fid || 0, req.conta.id]);
    if (!rows[0]) return res.status(404).json({ erro: 'Funcionário não encontrado.' });
    auditar(req, `Editou o cadastro de ${f.nome}`);
    res.json(rows[0]);
  }));
  app.delete('/api/funcionarios/:fid', LE, erro(async (req, res) => {
    const { rows } = await q(`update funcionarios f set ativo=false from equipes e where f.id=$1 and f.equipe_id=e.id and e.usuario_id=$2
      returning f.nome`, [+req.params.fid || 0, req.conta.id]);
    if (rows[0]) auditar(req, `Removeu ${rows[0].nome}`);
    res.json({ ok: true });
  }));

  // ---------- escalas ----------
  app.post('/api/equipes/:id/escalas', LE, pago, minhaEquipe, limite(30), erro(async (req, res) => {
    const { rows: fs } = await q('select id, nome, cargo, folga_fixa from funcionarios where equipe_id=$1 and ativo order by nome', [req.equipe.id]);
    if (!fs.length) return res.status(400).json({ erro: 'Cadastre pelo menos um funcionário antes de gerar a escala.' });
    const semanas = Math.max(1, Math.min(8, Math.round(+req.body?.semanas) || 4));
    const inicio = dataValida(req.body?.inicio) || hojeBR();
    const travado = await mesFechadoEntre(req.conta.id, inicio, somaDias(inicio, semanas * 7 - 1));
    if (travado) return res.status(409).json({ erro: erroFechado(travado) });
    // férias, atestados etc. já lançados entram no cálculo
    const mapa = mapaOcorrencias(await ocorrenciasDe(fs.map(f => f.id), inicio, somaDias(inicio, semanas * 7 - 1)));
    const ausencias = Array.from({ length: semanas }, (_, s) => fs.map(f => Array.from({ length: 7 }, (_, d) =>
      mapa.get(f.id + '|' + somaDias(inicio, s * 7 + d)) || null)));
    const r = gerarEscala({ funcionarios: fs.map(f => ({ nome: f.nome, fixo: f.folga_fixa })), abertos: req.equipe.abertos, minimo: req.equipe.minimo, semanas, ausencias });
    const { rows } = await q(`insert into escalas (equipe_id, inicio, semanas, funcionarios, abertos, minimo, dados, alertas)
      values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
    [req.equipe.id, inicio, semanas, JSON.stringify(fs.map(f => ({ id: f.id, nome: f.nome, cargo: f.cargo }))),
      JSON.stringify(req.equipe.abertos), JSON.stringify(req.equipe.minimo), JSON.stringify(r.escala), JSON.stringify(r.alertas)]);
    auditar(req, `Gerou escala de ${semanas} semana(s) para ${req.equipe.nome} a partir de ${inicio.split('-').reverse().join('/')}`);
    res.json((await escalasComOcorrencias(rows))[0]);
  }));
  app.get('/api/equipes/:id/escalas', L, minhaEquipe, erro(async (req, res) => {
    const { rows } = await q('select * from escalas where equipe_id=$1 order by criado_em desc limit 20', [req.equipe.id]);
    res.json(await escalasComOcorrencias(rows));
  }));
  // ajuste manual de uma célula (trabalha <-> folga)
  app.patch('/api/escalas/:eid', LE, erro(async (req, res) => {
    const { semana, funcionario, dia } = req.body || {};
    if (![semana, funcionario, dia].every(Number.isInteger) || dia < 0 || dia > 6) return res.status(400).json({ erro: 'Célula inválida.' });
    const client = await pool.connect();
    try {
      await client.query('begin');
      const { rows } = await client.query(`select s.*, e.nome equipe from escalas s join equipes e on e.id=s.equipe_id
        where s.id=$1 and e.usuario_id=$2 for update`, [+req.params.eid || 0, req.conta.id]);
      if (!rows[0]) { await client.query('rollback'); return res.status(404).json({ erro: 'Escala não encontrada.' }); }
      const esc = rows[0], d = esc.dados;
      if (!Array.isArray(d[semana]?.[funcionario])) { await client.query('rollback'); return res.status(400).json({ erro: 'Célula inválida.' }); }
      const fid = esc.funcionarios[funcionario]?.id, data = somaDias(esc.inicio, semana * 7 + dia);
      const travado = await mesFechadoEntre(req.conta.id, data, data);
      if (travado) { await client.query('rollback'); return res.status(409).json({ erro: erroFechado(travado) }); }
      const oc = await ocorrenciasDe([fid], data, data);
      if (oc.length) {
        await client.query('rollback');
        return res.status(409).json({ erro: `Esse dia tem ${OCORRENCIAS[oc[0].tipo].nome.toLowerCase()} lançado. Remova a ocorrência para mudar.` });
      }
      const novo = d[semana][funcionario][dia] === 'F' ? 'T' : 'F';
      d[semana][funcionario][dia] = novo;
      await client.query('update escalas set dados=$1 where id=$2', [JSON.stringify(d), esc.id]);
      await client.query('commit');
      auditar(req, `Ajustou a escala de ${esc.equipe}: ${esc.funcionarios[funcionario]?.nome} ${novo === 'F' ? 'folga' : 'trabalha'} em ${data.split('-').reverse().join('/')}`);
      res.json({ ok: true, dados: (await escalasComOcorrencias([{ ...esc, dados: d }]))[0].dados });
    } catch (e) { await client.query('rollback').catch(() => {}); throw e; } finally { client.release(); }
  }));

  // ---------- ocorrências ----------
  app.get('/api/ocorrencias', L, erro(async (req, res) => {
    const de = dataValida(req.query.de) || somaDias(hojeBR(), -60), ate = dataValida(req.query.ate) || somaDias(hojeBR(), 120);
    const { rows } = await q(`select o.*, f.nome funcionario, f.cargo, e.id equipe_id, e.nome equipe, u.nome criado_por_nome
      from ocorrencias o join funcionarios f on f.id=o.funcionario_id join equipes e on e.id=f.equipe_id
      left join usuarios u on u.id=o.criado_por
      where e.usuario_id=$1 and o.inicio <= $3 and o.fim >= $2 and ($4::int is null or e.id=$4) and ($5::int is null or f.id=$5)
      order by o.inicio desc, f.nome limit 1000`, [req.conta.id, de, ate, +req.query.equipe || null, +req.query.funcionario || null]);
    res.json(rows);
  }));
  app.post('/api/ocorrencias', LE, limite(60), erro(async (req, res) => {
    const b = req.body || {};
    const tipo = TIPOS.includes(b.tipo) ? b.tipo : null;
    if (!tipo) return res.status(400).json({ erro: 'Escolha o tipo da ocorrência.' });
    const inicio = dataValida(b.inicio), fim = tipo === 'banco_horas' ? inicio : (dataValida(b.fim) || inicio);
    if (!inicio) return res.status(400).json({ erro: 'Informe a data.' });
    if (fim < inicio) return res.status(400).json({ erro: 'A data final é antes da inicial.' });
    if (diasEntre(inicio, fim) > 366) return res.status(400).json({ erro: 'Período longo demais (máximo 1 ano).' });
    let horas = null;
    if (tipo === 'banco_horas') {
      horas = Math.round(parseFloat(String(b.horas).replace(',', '.')) * 100) / 100;
      if (!horas || Math.abs(horas) > 200) return res.status(400).json({ erro: 'Informe as horas (positivo = crédito, negativo = desconto).' });
    }
    const travado = await mesFechadoEntre(req.conta.id, inicio, fim);
    if (travado) return res.status(409).json({ erro: erroFechado(travado) });
    const { rows: fr } = await q(`select f.id, f.nome from funcionarios f join equipes e on e.id=f.equipe_id
      where f.id=$1 and e.usuario_id=$2 and f.ativo`, [+b.funcionario_id || 0, req.conta.id]);
    if (!fr[0]) return res.status(404).json({ erro: 'Funcionário não encontrado.' });
    if (tipo !== 'banco_horas') {
      const conflito = await ocorrenciasDe([fr[0].id], inicio, fim);
      if (conflito.length) {
        const c = conflito[0];
        return res.status(409).json({ erro: `${fr[0].nome} já tem ${OCORRENCIAS[c.tipo].nome.toLowerCase()} de ${c.inicio.split('-').reverse().join('/')} a ${c.fim.split('-').reverse().join('/')}.` });
      }
    }
    const { rows } = await q(`insert into ocorrencias (funcionario_id, tipo, inicio, fim, horas, obs, criado_por)
      values ($1,$2,$3,$4,$5,$6,$7) returning *`, [fr[0].id, tipo, inicio, fim, horas, limpa(b.obs, 300) || null, req.u.id]);
    const periodo = inicio === fim ? inicio.split('-').reverse().join('/') : `${inicio.split('-').reverse().join('/')} a ${fim.split('-').reverse().join('/')}`;
    auditar(req, `Lançou ${OCORRENCIAS[tipo].nome.toLowerCase()}${horas ? ` (${horas > 0 ? '+' : ''}${horas}h)` : ''} para ${fr[0].nome}: ${periodo}`);
    res.json(rows[0]);
  }));
  app.delete('/api/ocorrencias/:oid', LE, erro(async (req, res) => {
    const { rows: o } = await q(`select o.inicio, o.fim from ocorrencias o join funcionarios f on f.id=o.funcionario_id join equipes e on e.id=f.equipe_id
      where o.id=$1 and e.usuario_id=$2`, [+req.params.oid || 0, req.conta.id]);
    const travado = o[0] && await mesFechadoEntre(req.conta.id, o[0].inicio, o[0].fim);
    if (travado) return res.status(409).json({ erro: erroFechado(travado) });
    const { rows } = await q(`delete from ocorrencias o using funcionarios f, equipes e
      where o.id=$1 and f.id=o.funcionario_id and e.id=f.equipe_id and e.usuario_id=$2 returning o.tipo, o.inicio, f.nome`, [+req.params.oid || 0, req.conta.id]);
    if (!rows[0]) return res.status(404).json({ erro: 'Ocorrência não encontrada.' });
    auditar(req, `Apagou ${OCORRENCIAS[rows[0].tipo]?.nome.toLowerCase()} de ${rows[0].nome} (${rows[0].inicio.split('-').reverse().join('/')})`);
    res.json({ ok: true });
  }));

  // ---------- visão geral (hoje e próximos 7 dias) ----------
  // escala vigente de cada funcionário em cada dia: a gerada por último que cobre o dia
  async function vigentes(contaId, de, ate, equipeId) {
    const { rows } = await q(`select s.*, e.nome equipe from escalas s join equipes e on e.id=s.equipe_id
      where e.usuario_id=$1 and s.inicio <= $3 and s.inicio + s.semanas * 7 > $2::date and ($4::int is null or e.id=$4)
      order by s.criado_em desc`, [contaId, de, ate, equipeId || null]);
    const escalas = await escalasComOcorrencias(rows);
    const cel = new Map(); // "fid|data" -> código
    const cob = new Map(); // "equipeId|data" -> escala usada no dia
    for (const e of escalas) { // da mais nova para a mais velha: a primeira que preencher fica
      e.dados.forEach((sem, s) => sem.forEach((dias, f) => dias.forEach((c, d) => {
        const data = somaDias(e.inicio, s * 7 + d), fid = e.funcionarios[f]?.id;
        if (data < de || data > ate || !fid) return;
        const k = fid + '|' + data;
        if (!cel.has(k)) cel.set(k, e.abertos[d] ? c : 'F');
      })));
      for (let i = 0; i < e.semanas * 7; i++) { const k = e.equipe_id + '|' + somaDias(e.inicio, i); if (!cob.has(k)) cob.set(k, e); }
    }
    return { cel, cob };
  }

  app.get('/api/visao', L, erro(async (req, res) => {
    const hoje = dataValida(req.query.data) || hojeBR(), fim = somaDias(hoje, 6);
    const [{ rows: equipes }, { rows: funcs }] = await Promise.all([
      q('select * from equipes where usuario_id=$1 order by id', [req.conta.id]),
      q(`select f.id, f.nome, f.cargo, f.equipe_id from funcionarios f join equipes e on e.id=f.equipe_id
        where e.usuario_id=$1 and f.ativo order by f.nome`, [req.conta.id]),
    ]);
    const { cel, cob } = await vigentes(req.conta.id, hoje, somaDias(hoje, 13));
    const mapaOc = mapaOcorrencias(await ocorrenciasDe(funcs.map(f => f.id), hoje, fim));
    const out = equipes.map(e => {
      const fe = funcs.filter(f => f.equipe_id === e.id);
      const dias = Array.from({ length: 7 }, (_, i) => {
        const data = somaDias(hoje, i), dow = (new Date(data + 'T12:00:00Z').getUTCDay() + 6) % 7;
        const tem = cob.has(e.id + '|' + data);
        const presentes = fe.filter(f => (cel.get(f.id + '|' + data) || (tem ? '' : null)) === 'T').length;
        return { data, dia: DIAS[dow], aberto: !!e.abertos[dow], minimo: e.minimo[dow], presentes: tem ? presentes : null, feriado: feriado(data) };
      });
      const st = f => cel.get(f.id + '|' + hoje) || mapaOc.get(f.id + '|' + hoje) || null;
      const semEscala = [7, 8, 9, 10, 11, 12, 13].filter(i => !cob.has(e.id + '|' + somaDias(hoje, i))).length;
      return {
        id: e.id, nome: e.nome, total: fe.length, dias,
        hoje: {
          trabalham: fe.filter(f => st(f) === 'T').map(f => ({ nome: f.nome, cargo: f.cargo })),
          folgam: fe.filter(f => st(f) === 'F').map(f => ({ nome: f.nome })),
          ausentes: fe.filter(f => COD_NOME[st(f)]).map(f => ({ nome: f.nome, motivo: COD_NOME[st(f)] })),
        },
        proxima_semana_sem_escala: semEscala >= 7,
      };
    });
    const { rows: ocs } = await q(`select o.tipo, o.inicio, o.fim, o.horas, f.nome funcionario, e.nome equipe from ocorrencias o
      join funcionarios f on f.id=o.funcionario_id join equipes e on e.id=f.equipe_id
      where e.usuario_id=$1 and o.fim >= $2 and o.inicio <= $3 and o.tipo <> 'banco_horas' order by o.inicio limit 50`, [req.conta.id, hoje, somaDias(hoje, 30)]);
    res.json({ data: hoje, feriado: feriado(hoje), equipes: out, ocorrencias: ocs });
  }));

  // ---------- fechamento do mês (para o contador) ----------
  const mesValido = m => (/^\d{4}-(0[1-9]|1[0-2])$/.test(m || '') ? m : null);
  const fimDoMes = de => somaDias(somaDias(de, 32).slice(0, 7) + '-01', -1);
  const mesBR = m => m.split('-').reverse().join('/');

  // números do mês por funcionário, calculados das escalas vigentes + ocorrências
  async function calcularFechamento(contaId, mes, equipeId) {
    const de = mes + '-01', ate = fimDoMes(de);
    const { rows: funcs } = await q(`select f.id, f.nome, f.cargo, f.matricula, f.admissao, f.ativo, e.id equipe_id, e.nome equipe
      from funcionarios f join equipes e on e.id=f.equipe_id where e.usuario_id=$1 and ($2::int is null or e.id=$2)
      and (f.ativo or exists (select 1 from ocorrencias o where o.funcionario_id=f.id and o.fim >= $3 and o.inicio <= $4))
      order by e.nome, f.nome`, [contaId, equipeId || null, de, ate]);
    const { cel } = await vigentes(contaId, de, ate, equipeId);
    const { rows: banco } = await q(`select funcionario_id,
        sum(horas) filter (where inicio between $2 and $3 and horas > 0) credito,
        sum(horas) filter (where inicio between $2 and $3 and horas < 0) debito,
        sum(horas) total
      from ocorrencias where funcionario_id = any($1) and tipo='banco_horas' and inicio <= $3 group by funcionario_id`, [funcs.map(f => f.id), de, ate]);
    const mapaOc = mapaOcorrencias(await ocorrenciasDe(funcs.map(f => f.id), de, ate));
    const bancoDe = Object.fromEntries(banco.map(b => [b.funcionario_id, b]));
    const dias = []; for (let d = de; d <= ate; d = somaDias(d, 1)) dias.push({ data: d, dia: DIAS[(new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7], feriado: feriado(d) });
    const linhas = funcs.map(f => {
      const c = { trabalhados: 0, folgas: 0, domingos: 0, feriados: 0, faltas: 0, atestado: 0, ferias: 0, afastamento: 0, folga_extra: 0, sem_escala: 0 };
      const codigos = dias.map(({ data, dia, feriado: fer }) => {
        const v = cel.get(f.id + '|' + data) || mapaOc.get(f.id + '|' + data) || '';
        if (v === 'T') { c.trabalhados++; if (dia === 'Dom') c.domingos++; if (fer) c.feriados++; }
        else if (v === 'F') c.folgas++;
        else if (v === 'X') c.faltas++;
        else if (v === 'M') c.atestado++;
        else if (v === 'V') c.ferias++;
        else if (v === 'L') c.afastamento++;
        else if (v === 'E') c.folga_extra++;
        else c.sem_escala++;
        return v;
      });
      const b = bancoDe[f.id] || {};
      const credito = +b.credito || 0, debito = -(+b.debito || 0);
      return { ...f, ...c, horas_credito: credito, horas_debito: debito, banco_mes: Math.round((credito - debito) * 100) / 100, banco_saldo: +b.total || 0, codigos };
    });
    return { mes, de, ate, dias, linhas };
  }

  // mês fechado: devolve os números congelados no fechamento
  async function fechamentoDoMes(contaId, mes, equipeId) {
    const { rows } = await q(`select f.dados, f.fechado_em, u.nome fechado_por from fechamentos f left join usuarios u on u.id=f.fechado_por
      where f.conta_id=$1 and f.mes=$2`, [contaId, mes]);
    if (rows[0]) {
      const d = rows[0].dados;
      return { ...d, linhas: equipeId ? d.linhas.filter(l => l.equipe_id === equipeId) : d.linhas, fechado: { em: rows[0].fechado_em, por: rows[0].fechado_por } };
    }
    return { ...(await calcularFechamento(contaId, mes, equipeId)), fechado: null };
  }
  // trava: algum dia do período está num mês fechado?
  async function mesFechadoEntre(contaId, de, ate) {
    const { rows } = await q(`select mes from fechamentos where conta_id=$1 and mes between $2 and $3 order by mes limit 1`, [contaId, de.slice(0, 7), ate.slice(0, 7)]);
    return rows[0]?.mes || null;
  }
  const erroFechado = mes => `O mês ${mesBR(mes)} já foi fechado e entregue ao contador. Peça ao dono para reabrir antes de alterar.`;

  // eventos da folha: o que cada código de rubrica recebe
  const EVENTOS = [
    { k: 'faltas', nome: 'Faltas', un: 'dias' },
    { k: 'atestado', nome: 'Atestado médico', un: 'dias' },
    { k: 'domingos', nome: 'Domingos trabalhados', un: 'dias' },
    { k: 'feriados', nome: 'Feriados trabalhados', un: 'dias' },
    { k: 'horas_credito', nome: 'Horas extras (banco, crédito)', un: 'horas' },
    { k: 'horas_debito', nome: 'Horas a descontar (banco, débito)', un: 'horas' },
    { k: 'ferias', nome: 'Férias', un: 'dias' },
    { k: 'afastamento', nome: 'Afastamento', un: 'dias' },
    { k: 'folga_extra', nome: 'Folgas extras', un: 'dias' },
    { k: 'trabalhados', nome: 'Dias trabalhados', un: 'dias' },
  ];
  const numBR = v => String(Math.round(v * 100) / 100).replace('.', ',');
  const celCsv = v => { const s = String(v ?? ''); return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

  function csvCompleto(f) {
    const leg = { T: 'T', F: 'F', X: 'FALTA', M: 'ATEST', V: 'FÉRIAS', L: 'AFAST', E: 'F.EXTRA', '': '' };
    const cab = ['Equipe', 'Matrícula', 'Funcionário', 'Cargo', 'Dias trabalhados', 'Folgas', 'Domingos trabalhados', 'Feriados trabalhados',
      'Faltas', 'Atestado (dias)', 'Férias (dias)', 'Afastamento (dias)', 'Folgas extras', 'Horas extras (banco)', 'Horas a descontar (banco)',
      'Banco de horas no mês', 'Saldo banco de horas', 'Dias sem escala', ...f.dias.map(d => d.data.slice(8) + '/' + d.data.slice(5, 7))];
    const corpo = f.linhas.map(l => [l.equipe, l.matricula, l.nome, l.cargo, l.trabalhados, l.folgas, l.domingos, l.feriados, l.faltas, l.atestado,
      l.ferias, l.afastamento, l.folga_extra, numBR(l.horas_credito || 0), numBR(l.horas_debito || 0), numBR(l.banco_mes), numBR(l.banco_saldo), l.sem_escala,
      ...l.codigos.map(c => leg[c])].map(celCsv).join(';'));
    return '﻿' + [cab.join(';'), ...corpo].join('\r\n');
  }
  // arquivo de eventos para importar na folha: uma linha por funcionário x evento com quantidade
  function arquivoEventos(f, codigos, layout) {
    const comp = f.mes.slice(5) + '/' + f.mes.slice(0, 4), linhas = [];
    for (const l of f.linhas) for (const ev of EVENTOS) {
      const cod = String(codigos?.[ev.k] || '').trim(), qtd = +l[ev.k] || 0;
      if (!cod || !qtd) continue;
      linhas.push(layout === 'simples' ? [l.matricula || '', cod, numBR(qtd)].join(';')
        : [comp, l.matricula, l.nome, cod, ev.nome, numBR(qtd), ev.un].map(celCsv).join(';'));
    }
    return layout === 'simples' ? linhas.join('\r\n') + (linhas.length ? '\r\n' : '')
      : '﻿' + ['Competência;Matrícula;Funcionário;Código do evento;Evento;Quantidade;Unidade', ...linhas].join('\r\n');
  }
  async function configDe(contaId) {
    const { rows } = await q('select * from empresa_config where conta_id=$1', [contaId]);
    return rows[0] || { eventos: {} };
  }
  async function enviarFechamento(res, contaId, mes, equipeId, formato, layout) {
    const f = await fechamentoDoMes(contaId, mes, equipeId);
    if (formato === 'csv') return res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="fechamento-${mes}.csv"` }).send(csvCompleto(f));
    if (formato === 'eventos') {
      const cfg = await configDe(contaId), txt = layout === 'simples';
      return res.set({ 'Content-Type': `${txt ? 'text/plain' : 'text/csv'}; charset=utf-8`, 'Content-Disposition': `attachment; filename="eventos-folha-${mes}.${txt ? 'txt' : 'csv'}"` })
        .send(arquivoEventos(f, cfg.eventos, layout));
    }
    res.json(f);
  }

  app.get('/api/relatorio', L, erro(async (req, res) => {
    const mes = mesValido(req.query.mes) || hojeBR().slice(0, 7);
    if (req.query.formato === 'csv' || req.query.formato === 'eventos') auditar(req, `Baixou ${req.query.formato === 'eventos' ? 'o arquivo de eventos da folha' : 'o fechamento'} de ${mesBR(mes)}`);
    if (req.query.formato) return enviarFechamento(res, req.conta.id, mes, +req.query.equipe || null, req.query.formato, req.query.layout);
    const f = await fechamentoDoMes(req.conta.id, mes, +req.query.equipe || null);
    const cfg = await configDe(req.conta.id);
    res.json({ ...f, empresa: cfg.razao_social || req.conta.empresa, cnpj: cfg.cnpj || null,
      eventos_configurados: EVENTOS.filter(e => cfg.eventos?.[e.k]).length, sem_matricula: f.linhas.filter(l => !l.matricula).length });
  }));

  // fechar o mês: congela os números, trava alterações e avisa o contador
  app.get('/api/fechamentos', L, erro(async (req, res) => {
    const { rows } = await q(`select f.mes, f.fechado_em, u.nome fechado_por from fechamentos f left join usuarios u on u.id=f.fechado_por
      where f.conta_id=$1 order by f.mes desc limit 36`, [req.conta.id]);
    res.json(rows);
  }));
  app.post('/api/fechamentos', LE, erro(async (req, res) => {
    const mes = mesValido(req.body?.mes);
    if (!mes) return res.status(400).json({ erro: 'Mês inválido.' });
    if (mes > hojeBR().slice(0, 7)) return res.status(400).json({ erro: 'Não dá para fechar um mês que ainda não começou.' });
    const f = await calcularFechamento(req.conta.id, mes, null);
    const { rowCount } = await q(`insert into fechamentos (conta_id, mes, fechado_por, dados) values ($1,$2,$3,$4) on conflict do nothing`,
      [req.conta.id, mes, req.u.id, JSON.stringify(f)]);
    if (!rowCount) return res.status(409).json({ erro: `O mês ${mesBR(mes)} já está fechado.` });
    auditar(req, `Fechou o mês ${mesBR(mes)} e enviou ao contador`);
    // avisa os contadores da empresa
    const { rows: conts } = await q(`select u.email, u.nome from membros m join usuarios u on u.id=m.usuario_id where m.conta_id=$1 and m.papel='contador'`, [req.conta.id]);
    const empresa = req.conta.empresa || req.u.nome;
    for (const c of conts) {
      await fila.enfileirar(c.email, `Fechamento de ${mesBR(mes)} da ${empresa} está pronto`, modelo({
        titulo: `Fechamento de ${mesBR(mes)} pronto para a folha`,
        paragrafos: [`${req.u.nome} fechou o mês ${mesBR(mes)} da ${empresa}.`, `São ${f.linhas.length} funcionário(s). Dias trabalhados, folgas, domingos e feriados trabalhados, faltas, atestados, férias e banco de horas já estão no sistema.`,
          'Entre para baixar a planilha completa ou o arquivo de eventos para importar na folha.'],
        botao: 'Abrir o fechamento', link: `${APP_URL}/app#fechamento`, rodape: rodapeSuporte,
      }));
    }
    res.json({ ok: true, contadores_avisados: conts.length });
  }));
  app.delete('/api/fechamentos/:mes', L, soDono, erro(async (req, res) => {
    const mes = mesValido(req.params.mes);
    const { rowCount } = await q('delete from fechamentos where conta_id=$1 and mes=$2', [req.conta.id, mes]);
    if (rowCount) auditar(req, `Reabriu o mês ${mesBR(mes)}`);
    res.json({ ok: true });
  }));

  // ---------- configurações da empresa e integração ----------
  app.get('/api/empresa', L, erro(async (req, res) => {
    const c = await configDe(req.conta.id);
    res.json({ razao_social: c.razao_social || '', cnpj: c.cnpj || '', eventos: c.eventos || {}, catalogo: EVENTOS,
      api: c.api_prefixo ? { prefixo: c.api_prefixo, criado_em: c.api_criado_em } : null, api_url: `${APP_URL}/api/v1` });
  }));
  // dono e contador (quem conhece as rubricas) podem mexer; gestor não
  app.put('/api/empresa', L, erro(async (req, res) => {
    if (req.conta.papel === 'gestor') return res.status(403).json({ erro: 'Só o dono ou o contador alteram as configurações da empresa.' });
    const b = req.body || {}, atual = await configDe(req.conta.id);
    const eventos = {};
    for (const e of EVENTOS) { const v = limpa(b.eventos?.[e.k], 20); if (v) eventos[e.k] = v; }
    const cnpj = limpa(b.cnpj, 20).replace(/\D/g, '');
    if (cnpj && cnpj.length !== 14) return res.status(400).json({ erro: 'CNPJ precisa ter 14 números.' });
    // o contador só mexe nos códigos; razão social e CNPJ ficam com o dono
    const dono = req.conta.papel === 'dono';
    await q(`insert into empresa_config (conta_id, razao_social, cnpj, eventos) values ($1,$2,$3,$4)
      on conflict (conta_id) do update set razao_social=excluded.razao_social, cnpj=excluded.cnpj, eventos=excluded.eventos, atualizado_em=now()`,
    [req.conta.id, dono ? limpa(b.razao_social, 120) || null : atual.razao_social || null, dono ? cnpj || null : atual.cnpj || null, JSON.stringify(eventos)]);
    auditar(req, 'Alterou as configurações da empresa e os códigos da folha');
    res.json({ ok: true });
  }));
  // chave da API para o sistema da contabilidade (aparece uma vez só)
  app.post('/api/empresa/chave', L, soDono, erro(async (req, res) => {
    const chave = 'el_' + crypto.randomBytes(24).toString('base64url');
    await q(`insert into empresa_config (conta_id, api_prefixo, api_hash, api_criado_em) values ($1,$2,$3,now())
      on conflict (conta_id) do update set api_prefixo=excluded.api_prefixo, api_hash=excluded.api_hash, api_criado_em=now()`,
    [req.conta.id, chave.slice(0, 7) + '…' + chave.slice(-4), hashChave(chave)]);
    auditar(req, 'Gerou uma chave de integração nova (a anterior parou de funcionar)');
    res.json({ chave });
  }));
  app.delete('/api/empresa/chave', L, soDono, erro(async (req, res) => {
    await q('update empresa_config set api_prefixo=null, api_hash=null, api_criado_em=null where conta_id=$1', [req.conta.id]);
    auditar(req, 'Desligou a chave de integração');
    res.json({ ok: true });
  }));

  // ---------- API de integração (sistema contábil, n8n, planilhas) ----------
  // Authorization: Bearer el_...
  const hashChave = c => crypto.createHash('sha256').update(c).digest('hex');
  const integracao = erro(async (req, res, next) => {
    const chave = (req.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    if (!/^el_[\w-]{20,}$/.test(chave)) return res.status(401).json({ erro: 'Envie a chave no cabeçalho Authorization: Bearer el_...' });
    const { rows } = await q(`select c.conta_id, coalesce(c.razao_social, u.empresa) empresa, c.cnpj from empresa_config c
      join usuarios u on u.id=c.conta_id where c.api_hash=$1`, [hashChave(chave)]);
    if (!rows[0]) return res.status(401).json({ erro: 'Chave inválida ou desligada.' });
    req.integ = rows[0]; next();
  });
  const I = [limite(60), integracao];
  app.get('/api/v1/empresa', I, (req, res) => res.json({ empresa: req.integ.empresa, cnpj: req.integ.cnpj }));
  app.get('/api/v1/fechamento', I, erro(async (req, res) => {
    const mes = mesValido(req.query.mes);
    if (!mes) return res.status(400).json({ erro: 'Informe ?mes=AAAA-MM' });
    return enviarFechamento(res, req.integ.conta_id, mes, +req.query.equipe || null, req.query.formato, req.query.layout);
  }));
  app.get('/api/v1/fechamentos', I, erro(async (req, res) => {
    const { rows } = await q('select mes, fechado_em from fechamentos where conta_id=$1 order by mes desc limit 36', [req.integ.conta_id]);
    res.json(rows);
  }));
  app.get('/api/v1/funcionarios', I, erro(async (req, res) => {
    const { rows } = await q(`select f.id, f.matricula, f.nome, f.cargo, f.admissao, f.ativo, e.id equipe_id, e.nome equipe
      from funcionarios f join equipes e on e.id=f.equipe_id where e.usuario_id=$1 order by e.nome, f.nome`, [req.integ.conta_id]);
    res.json(rows);
  }));
  app.get('/api/v1/ocorrencias', I, erro(async (req, res) => {
    const de = dataValida(req.query.de) || somaDias(hojeBR(), -31), ate = dataValida(req.query.ate) || hojeBR();
    const { rows } = await q(`select o.id, o.tipo, o.inicio, o.fim, o.horas, o.obs, f.matricula, f.nome funcionario, e.nome equipe
      from ocorrencias o join funcionarios f on f.id=o.funcionario_id join equipes e on e.id=f.equipe_id
      where e.usuario_id=$1 and o.inicio <= $3 and o.fim >= $2 order by o.inicio`, [req.integ.conta_id, de, ate]);
    res.json(rows);
  }));

  // ---------- link da escala para os funcionários (só leitura, sem login) ----------
  app.post('/api/equipes/:id/link', LE, minhaEquipe, erro(async (req, res) => {
    let token = req.equipe.link_token;
    if (!token || req.body?.novo) {
      token = crypto.randomBytes(12).toString('base64url');
      await q('update equipes set link_token=$1 where id=$2', [token, req.equipe.id]);
      auditar(req, `${req.equipe.link_token ? 'Trocou' : 'Criou'} o link da escala de ${req.equipe.nome} para os funcionários`);
    }
    res.json({ link: `${APP_URL}/e/${token}` });
  }));
  app.delete('/api/equipes/:id/link', LE, minhaEquipe, erro(async (req, res) => {
    await q('update equipes set link_token=null where id=$1', [req.equipe.id]);
    auditar(req, `Desligou o link da escala de ${req.equipe.nome}`);
    res.json({ ok: true });
  }));
  app.get('/api/publico/escala/:token', limite(60), erro(async (req, res) => {
    const { rows } = await q(`select e.*, coalesce(c.razao_social, u.empresa) empresa from equipes e join usuarios u on u.id=e.usuario_id
      left join empresa_config c on c.conta_id=e.usuario_id where e.link_token=$1`, [String(req.params.token || '').slice(0, 40)]);
    const e = rows[0];
    if (!e) return res.status(404).json({ erro: 'Link desligado ou inválido. Peça um novo ao seu gestor.' });
    const hoje = hojeBR(), dow = (new Date(hoje + 'T12:00:00Z').getUTCDay() + 6) % 7, de = somaDias(hoje, -dow), ate = somaDias(de, 27);
    const { rows: fs } = await q('select id, nome, cargo from funcionarios where equipe_id=$1 and ativo order by nome', [e.id]);
    const { cel } = await vigentes(e.usuario_id, de, ate, e.id);
    const dias = Array.from({ length: 28 }, (_, i) => { const d = somaDias(de, i); return { data: d, dia: DIAS[i % 7], aberto: !!e.abertos[i % 7], feriado: feriado(d) }; });
    res.json({ empresa: e.empresa, equipe: e.nome, hoje, dias,
      pessoas: fs.map(f => ({ nome: f.nome, cargo: f.cargo, dias: dias.map(d => cel.get(f.id + '|' + d.data) || '') })) });
  }));

  // ---------- histórico ----------
  app.get('/api/historico', L, erro(async (req, res) => {
    const { rows } = await q(`select a.id, a.criado_em, a.acao, coalesce(u.nome, 'Sistema') quem from auditoria a
      left join usuarios u on u.id=a.usuario_id where a.conta_id=$1 order by a.id desc limit 300`, [req.conta.id]);
    res.json(rows);
  }));

  // ---------- acessos: gestor e contador ----------
  app.get('/api/membros', L, soDono, erro(async (req, res) => {
    const { rows } = await q(`select m.id, m.papel, m.criado_em, u.nome, u.email, u.senha_hash is not null ativo, u.ultimo_acesso
      from membros m join usuarios u on u.id=m.usuario_id where m.conta_id=$1 order by m.criado_em`, [req.conta.id]);
    res.json(rows);
  }));
  app.post('/api/membros', L, soDono, limite(20), erro(async (req, res) => {
    const email = limpa(req.body?.email, 160).toLowerCase(), nome = limpa(req.body?.nome);
    const papel = ['gestor', 'contador'].includes(req.body?.papel) ? req.body.papel : 'contador';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ erro: 'Informe um e-mail válido.' });
    if (email === req.u.email) return res.status(400).json({ erro: 'Esse é o seu próprio e-mail.' });
    const { rows: n } = await q('select count(*)::int c from membros where conta_id=$1', [req.conta.id]);
    if (n[0].c >= 20) return res.status(400).json({ erro: 'Limite de 20 acessos por empresa.' });
    let { rows: [u] } = await q('select * from usuarios where email=$1', [email]);
    if (!u) ({ rows: [u] } = await q(`insert into usuarios (nome, email, origem) values ($1,$2,'convite')
      on conflict (email) do update set email=excluded.email returning *`, [nome || email.split('@')[0], email]));
    await q(`insert into membros (conta_id, usuario_id, papel) values ($1,$2,$3)
      on conflict (conta_id, usuario_id) do update set papel=excluded.papel`, [req.conta.id, u.id, papel]);
    const empresa = req.conta.empresa || req.u.nome;
    const link = u.senha_hash ? `${APP_URL}/app` : await criaLink(u.id, 24 * 14);
    await fila.enfileirar(email, `${req.u.nome} liberou seu acesso à escala da ${empresa}`, modelo({
      titulo: `Você tem acesso à escala da ${empresa}`,
      paragrafos: [
        `${req.u.nome} liberou seu acesso como ${PAPEL_NOME[papel].toLowerCase()} no Escala Legal.`,
        papel === 'contador' ? 'Você pode ver as escalas, folgas, férias, atestados e baixar o fechamento do mês em planilha.' : 'Você pode montar e ajustar escalas, lançar férias, atestados e faltas.',
        u.senha_hash ? 'Entre com o seu e-mail e senha de sempre e escolha a empresa no menu.' : 'Clique no botão para criar sua senha. O link vale 14 dias.',
      ],
      botao: u.senha_hash ? 'Entrar no Escala Legal' : 'Criar minha senha', link, rodape: rodapeSuporte,
    }));
    auditar(req, `Deu acesso de ${PAPEL_NOME[papel].toLowerCase()} para ${email}`);
    res.json({ ok: true, link: u.senha_hash ? null : link });
  }));
  app.patch('/api/membros/:mid', L, soDono, erro(async (req, res) => {
    const papel = ['gestor', 'contador'].includes(req.body?.papel) ? req.body.papel : null;
    if (!papel) return res.status(400).json({ erro: 'Papel inválido.' });
    const { rows } = await q(`update membros m set papel=$1 from usuarios u where m.id=$2 and m.conta_id=$3 and u.id=m.usuario_id returning u.email`,
      [papel, +req.params.mid || 0, req.conta.id]);
    if (!rows[0]) return res.status(404).json({ erro: 'Acesso não encontrado.' });
    auditar(req, `Mudou ${rows[0].email} para ${PAPEL_NOME[papel].toLowerCase()}`);
    res.json({ ok: true });
  }));
  app.delete('/api/membros/:mid', L, soDono, erro(async (req, res) => {
    const { rows } = await q(`delete from membros m using usuarios u where m.id=$1 and m.conta_id=$2 and u.id=m.usuario_id returning u.email`,
      [+req.params.mid || 0, req.conta.id]);
    if (rows[0]) auditar(req, `Removeu o acesso de ${rows[0].email}`);
    res.json({ ok: true });
  }));
};
