// Estado da jornada: onde a empresa está no caminho "gerar → publicar → identificar → contabilidade → fechar competência".
// Lido dos dados reais da conta (nunca de palpite). Usado por GET /api/jornada (app) e pelo assistente de suporte (contexto da IA).
//
//   etapa      chave do próximo passo (cadastro, gerar, colaboradores, publicar, identificar, contabilidade, sexo, fechar, em_dia,
//              aguardando, consultar, baixar)
//   proximo    { k, tit, txt, btn, ir, tela } ou null: UMA ação para o papel (dono, gestor, contador)
//   fatos      números e marcas que o app mostra ou esconde conforme a etapa
const sa = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
// "Repositor(a)" → "repositor"; "Garçom/Garçonete" → "garcom" (mesma regra do app: rotuloFuncao)
const rotulo = c => sa(String(c || '').replace(/\(a\)/gi, '').split('/')[0].replace(/\s+/g, ' ')) || 'pessoa';
// nome que ainda é só a função ("Caixa 1"): falta identificar o colaborador
const nomeGenerico = f => !!f.cargo && sa(f.nome).startsWith(rotulo(f.cargo));

const mesDe = d => d.toISOString().slice(0, 7);
function mesesRef(agora = new Date()) {
  const atual = mesDe(new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), 15)));
  const anterior = mesDe(new Date(Date.UTC(agora.getFullYear(), agora.getMonth() - 1, 15)));
  const ultimo = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate();
  return { atual, anterior, fimMes: agora.getDate() >= ultimo - 2, inicioMes: agora.getDate() <= 10 };
}

// tela = rota principal onde a ação acontece (o app esconde a faixa "Próximo passo" quando já está nela)
const PASSOS = {
  cadastro: { tit: 'Completar o cadastro da empresa', txt: 'Nome, CNPJ e endereço. Leva 2 minutos e aparece no fechamento.', btn: 'Completar cadastro', ir: 'cadastro', tela: 'cadastro' },
  gerar: { tit: 'Gerar escala', txt: 'Dias de funcionamento, funções e quantidade de colaboradores. A escala é gerada dentro da lei.', btn: 'Gerar escala', ir: 'comecar', tela: 'comecar' },
  colaboradores: { tit: 'Cadastrar colaboradores', txt: 'Com os colaboradores cadastrados, a escala é gerada na hora.', btn: 'Cadastrar colaboradores', ir: 'colaboradores', tela: 'colaboradores' },
  publicar: { tit: 'Publicar escala', txt: 'Compartilhe com a equipe por WhatsApp, link, PDF ou impressão.', btn: 'Publicar escala', ir: 'escala/publicar', tela: 'escala' },
  identificar: { tit: 'Identificar colaboradores', txt: 'Substitua "Caixa 1", "Caixa 2" pelo nome de cada colaborador.', btn: 'Identificar colaboradores', ir: 'colaboradores', tela: 'colaboradores' },
  contabilidade: { tit: 'Liberar acesso da contabilidade', txt: 'A contabilidade acompanha a escala e recebe o fechamento, sem custo adicional.', btn: 'Liberar acesso', ir: 'fechamento/contabilidade', tela: 'fechamento/contabilidade' },
  sexo: { tit: 'Informar o sexo dos colaboradores', txt: 'A lei pede um domingo de folga a cada 15 dias para as mulheres. Informe em cada colaborador.', btn: 'Informar agora', ir: 'colaboradores', tela: 'colaboradores' },
  fechar: { tit: 'Fechar competência', txt: 'Confira o mês de referência e envie para a contabilidade.', btn: 'Fechar competência', ir: 'fechamento', tela: 'fechamento' },
  aguardando: { tit: 'Aguardando a escala', txt: 'O dono da empresa ainda não montou a escala.', btn: 'Ver as aulas', ir: 'aula', tela: 'aula' },
  consultar: { tit: 'Acompanhar a competência', txt: 'A empresa ainda não fechou o mês. Os números podem mudar.', btn: 'Ver o fechamento', ir: 'fechamento', tela: 'fechamento' },
  baixar: { tit: 'Baixar o fechamento', txt: 'A competência do mês passado está fechada. Baixe a planilha.', btn: 'Ver o fechamento', ir: 'fechamento', tela: 'fechamento' },
};

async function jornada(q, contaId, papel = 'dono', agora = new Date()) {
  const m = mesesRef(agora);
  const { rows: [r] } = await q(`select
      (select cadastro_em from empresa_config where conta_id=$1) cadastro_em,
      (select escala_enviada_em from empresa_config where conta_id=$1) enviada_em,
      (select count(*)::int from equipes where usuario_id=$1) unidades,
      (select count(*)::int from equipes where usuario_id=$1 and link_token is not null) links,
      (select count(*)::int from equipes where usuario_id=$1 and (abertos->>6)::int = 1) abre_domingo,
      (select count(*)::int from escalas s join equipes e on e.id=s.equipe_id where e.usuario_id=$1) escalas,
      (select count(*)::int from membros where conta_id=$1 and papel='contador') contadores,
      (select count(*)::int from fechamentos where conta_id=$1 and mes=$2) fechado_ant,
      (select count(*)::int from fechamentos where conta_id=$1 and mes=$3) fechado_atual`, [contaId, m.anterior, m.atual]);
  const { rows: fs } = await q(`select f.nome, f.cargo, f.sexo from funcionarios f join equipes e on e.id=f.equipe_id where e.usuario_id=$1 and f.ativo`, [contaId]);
  const fatos = {
    papel, cadastro_ok: !!r.cadastro_em, unidades: r.unidades, colaboradores: fs.length, escala: r.escalas > 0,
    publicada: !!r.enviada_em || r.links > 0, sem_nome: fs.filter(nomeGenerico).length,
    sem_sexo: r.abre_domingo ? fs.filter(f => !f.sexo).length : 0, contador: r.contadores > 0,
    competencia_anterior: m.anterior, anterior_fechada: r.fechado_ant > 0, atual_fechada: r.fechado_atual > 0,
  };
  const dono = papel === 'dono', ed = papel !== 'contador';
  const fecharAgora = (m.inicioMes && !fatos.anterior_fechada) || (m.fimMes && !fatos.atual_fechada);
  let k;
  if (!ed) k = !fatos.escala ? 'aguardando' : fatos.anterior_fechada ? 'baixar' : 'consultar';
  else if (dono && !fatos.cadastro_ok && !fatos.unidades) k = 'cadastro';
  else if (!fatos.unidades) k = dono ? 'gerar' : 'aguardando';
  else if (!fatos.colaboradores) k = 'colaboradores';
  else if (!fatos.publicada) k = 'publicar';
  else if (fatos.sem_nome) k = 'identificar';
  else if (dono && !fatos.contador) k = 'contabilidade';
  else if (fecharAgora && fatos.escala) k = 'fechar';
  else if (fatos.sem_sexo) k = 'sexo';
  else k = 'em_dia';
  return { etapa: k, proximo: PASSOS[k] ? { k, ...PASSOS[k] } : null, fatos };
}

// texto curto para a IA (vai no contexto da mensagem ao n8n)
function resumoJornada(j) {
  const f = j.fatos, sn = v => v ? 'sim' : 'não';
  return [
    `etapa: ${j.etapa}`, j.proximo ? `próximo passo: ${j.proximo.tit} (botão "${j.proximo.btn}", tela #${j.proximo.ir})` : 'próximo passo: nenhum, está em dia',
    `unidades: ${f.unidades}`, `colaboradores: ${f.colaboradores}`, `escala gerada: ${sn(f.escala)}`, `escala publicada: ${sn(f.publicada)}`,
    `colaboradores sem nome (ex.: "Caixa 1"): ${f.sem_nome}`, `sem sexo informado: ${f.sem_sexo}`, `contabilidade com acesso: ${sn(f.contador)}`,
    `competência ${f.competencia_anterior} fechada: ${sn(f.anterior_fechada)}`,
  ].join('; ');
}

module.exports = { jornada, resumoJornada, nomeGenerico, PASSOS };
