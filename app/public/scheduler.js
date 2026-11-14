// Motor de escala 5x2 — roda no navegador e no servidor (Node).
// Regras: 5 dias trabalhados + 2 folgas por semana, cobertura mínima por dia,
// folgas preferencialmente consecutivas, rodízio de domingo (folga dominical
// pelo menos 1x a cada 3 semanas — regra do comércio).
(function (root) {
  const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  // Segmentos: cada um já vem com dias, horário, mínimo por dia, funções, a função que não pode faltar
  // e a regra de domingo. comercio=true -> folga no domingo a cada 3 semanas (Lei 10.101/2000, art. 6º);
  // demais atividades -> a cada 7 semanas (Portaria MTP 671/2021, art. 58).
  const SETORES = {
    mercado: { nome: 'Mercado / supermercado', local: 'mercado', comercio: true, abertos: [1,1,1,1,1,1,1], minimo: [4,4,4,4,5,6,4], abre: '07:00', fecha: '21:00',
      funcoes: ['Caixa', 'Repositor(a)', 'Açougue', 'Hortifrúti', 'Fiscal de caixa', 'Gerente'],
      criticas: [{ nome: 'Caixa', chave: 'caixa', minimo: [2,2,2,2,2,3,2], explica: 'Sem caixa não tem venda: a escala garante esse número de caixas todo dia aberto.' }],
      dicas: ['Sexta e sábado costumam pedir mais gente no caixa.', 'Açougue e padaria internos podem ser cadastrados como funções.'] },
    farmacia: { nome: 'Farmácia / drogaria', local: 'farmácia', comercio: true, abertos: [1,1,1,1,1,1,1], minimo: [3,3,3,3,3,3,2], abre: '07:00', fecha: '22:00',
      funcoes: ['Farmacêutico(a)', 'Balconista', 'Caixa', 'Gerente'],
      criticas: [{ nome: 'Farmacêutico(a)', chave: 'farmac', minimo: [2,2,2,2,2,2,2], explica: 'A farmácia só pode funcionar com farmacêutico presente durante todo o horário (Lei 13.021/2014, art. 6º). Se abre mais de 9h por dia, são 2 farmacêuticos por dia, um em cada turno.' }],
      dicas: ['Marque quem é farmacêutico: a escala nunca deixa um dia sem.'] },
    varejo: { nome: 'Loja (roupas, calçados, shopping)', local: 'loja', comercio: true, abertos: [1,1,1,1,1,1,1], minimo: [2,2,2,2,3,4,3], abre: '10:00', fecha: '22:00',
      funcoes: ['Vendedor(a)', 'Caixa', 'Estoquista', 'Gerente'], criticas: [],
      dicas: ['Loja de shopping abre 12h: conte as pessoas dos dois turnos no mínimo de cada dia.'] },
    restaurante: { nome: 'Restaurante / lanchonete / bar', local: 'restaurante', comercio: true, abertos: [1,1,1,1,1,1,1], minimo: [3,3,3,4,5,5,5], abre: '11:00', fecha: '23:00',
      funcoes: ['Cozinha', 'Garçom/Garçonete', 'Caixa', 'Auxiliar de cozinha', 'Gerente'],
      criticas: [{ nome: 'Cozinha', chave: 'cozinh', minimo: [1,1,1,1,2,2,2], explica: 'Sem cozinheiro o restaurante não abre: a escala garante gente na cozinha todo dia.' }],
      dicas: ['Fim de semana é o pico: o mínimo já vem maior de sexta a domingo.'] },
    padaria: { nome: 'Padaria / confeitaria', local: 'padaria', comercio: true, abertos: [1,1,1,1,1,1,1], minimo: [3,3,3,3,3,4,4], abre: '06:00', fecha: '20:00',
      funcoes: ['Padeiro(a)', 'Confeiteiro(a)', 'Balconista', 'Caixa'],
      criticas: [{ nome: 'Padeiro(a)', chave: 'padeir', minimo: [1,1,1,1,1,1,1], explica: 'Sem padeiro não tem pão: a escala garante pelo menos um por dia.' }],
      dicas: ['Quem faz o pão de madrugada precisa de 11h de descanso até o próximo turno.'] },
    salao: { nome: 'Salão de beleza / barbearia / estética', local: 'salão', comercio: false, abertos: [1,1,1,1,1,1,0], minimo: [2,2,2,2,3,4,0], abre: '09:00', fecha: '19:00',
      funcoes: ['Cabeleireiro(a)', 'Manicure', 'Esteticista', 'Barbeiro', 'Recepção'], criticas: [],
      dicas: ['Sexta e sábado são os dias mais cheios.'] },
    clinica: { nome: 'Clínica / consultório / laboratório', local: 'clínica', comercio: false, abertos: [1,1,1,1,1,1,0], minimo: [2,2,2,2,2,1,0], abre: '07:00', fecha: '19:00',
      funcoes: ['Recepção', 'Técnico(a) de enfermagem', 'Auxiliar', 'Atendimento'],
      criticas: [{ nome: 'Recepção', chave: 'recep', minimo: [1,1,1,1,1,1,0], explica: 'Alguém precisa receber os pacientes todo dia que a clínica abre.' }],
      dicas: ['Plantão 12x36 é outra escala: veja o aviso na Ajuda.'], aviso12x36: true },
    academia: { nome: 'Academia / estúdio', local: 'academia', comercio: false, abertos: [1,1,1,1,1,1,0], minimo: [3,3,3,3,3,2,0], abre: '06:00', fecha: '22:00',
      funcoes: ['Professor(a)/instrutor(a)', 'Recepção', 'Limpeza'],
      criticas: [{ nome: 'Professor(a)/instrutor(a)', chave: 'profess', minimo: [2,2,2,2,2,1,0], explica: 'Precisa de profissional de educação física acompanhando os alunos o dia todo.' }],
      dicas: ['Academia abre 16h por dia: conte os dois turnos no mínimo.'] },
    posto: { nome: 'Posto de combustível', local: 'posto', comercio: true, abertos: [1,1,1,1,1,1,1], minimo: [4,4,4,4,4,4,4], abre: '06:00', fecha: '22:00',
      funcoes: ['Frentista', 'Caixa', 'Loja de conveniência', 'Gerente'],
      criticas: [{ nome: 'Frentista', chave: 'frentist', minimo: [3,3,3,3,3,3,3], explica: 'A pista precisa de frentista o tempo todo que o posto está aberto.' }],
      dicas: ['Posto 24 horas precisa de 3 turnos de 8h, e quem trabalha de madrugada tem adicional noturno.'] },
    escritorio: { nome: 'Escritório / serviços', local: 'escritório', comercio: false, abertos: [1,1,1,1,1,0,0], minimo: [1,1,1,1,1,0,0], abre: '08:00', fecha: '18:00',
      funcoes: ['Administrativo', 'Atendimento', 'Financeiro', 'Gerente'], criticas: [],
      dicas: ['Escritório de segunda a sexta já folga sábado e domingo: a 5x2 vem pronta.'] },
    seguranca: { nome: 'Portaria / segurança / limpeza', local: 'posto de trabalho', comercio: false, abertos: [1,1,1,1,1,1,1], minimo: [2,2,2,2,2,2,2], abre: '07:00', fecha: '23:00',
      funcoes: ['Porteiro(a)', 'Vigilante', 'Auxiliar de limpeza', 'Supervisor(a)'], criticas: [],
      dicas: ['Muita portaria usa 12x36: veja o aviso.'], aviso12x36: true },
    outro: { nome: 'Outro tipo de negócio', local: 'local', comercio: true, abertos: [1,1,1,1,1,1,0], minimo: [2,2,2,2,2,2,0], abre: '08:00', fecha: '18:00',
      funcoes: [], criticas: [], dicas: [] },
  };
  const semAcento = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const casaFuncao = (cargo, chave) => !!chave && semAcento(cargo).includes(semAcento(chave));
  const domingoSemanasDe = setor => (SETORES[setor] || SETORES.outro).comercio ? 3 : 7;
  // horas que o local fica aberto por dia (ex.: '07:00' a '22:00' -> 15)
  function horasAberto(abre, fecha) {
    const m = t => { const [h, mi] = String(t || '').split(':').map(Number); return (h || 0) * 60 + (mi || 0); };
    if (!abre || !fecha) return null;
    let d = m(fecha) - m(abre); if (d <= 0) d += 24 * 60;
    return Math.round(d / 6) / 10;
  }

  // Ocorrências que tiram a pessoa do dia. Código de 1 letra guardado na célula da escala.
  const OCORRENCIAS = {
    ferias:      { cod: 'V', nome: 'Férias',      dia: true },
    atestado:    { cod: 'M', nome: 'Atestado',    dia: true },
    falta:       { cod: 'X', nome: 'Falta',       dia: true },
    afastamento: { cod: 'L', nome: 'Afastamento', dia: true },
    folga_extra: { cod: 'E', nome: 'Folga extra', dia: true },
    banco_horas: { cod: '',  nome: 'Banco de horas', dia: false },
  };
  const COD_NOME = Object.fromEntries(Object.values(OCORRENCIAS).filter(o => o.cod).map(o => [o.cod, o.nome]));

  // Feriados nacionais (lei 662/1949, 6.802/1980 e 14.759/2023) + Sexta-feira Santa
  function pascoa(ano) {
    const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(ano, mes - 1, dia));
  }
  const iso = d => d.toISOString().slice(0, 10);
  function feriados(ano) {
    const sexta = pascoa(ano); sexta.setUTCDate(sexta.getUTCDate() - 2);
    return {
      [`${ano}-01-01`]: 'Confraternização Universal', [iso(sexta)]: 'Sexta-feira Santa', [`${ano}-04-21`]: 'Tiradentes',
      [`${ano}-05-01`]: 'Dia do Trabalho', [`${ano}-09-07`]: 'Independência', [`${ano}-10-12`]: 'Nossa Senhora Aparecida',
      [`${ano}-11-02`]: 'Finados', [`${ano}-11-15`]: 'Proclamação da República', [`${ano}-11-20`]: 'Consciência Negra',
      [`${ano}-12-25`]: 'Natal',
    };
  }
  // Feriados estaduais (data magna / leis estaduais). Feriados municipais a empresa informa.
  const ESTADUAIS = {
    AC: { '06-15': 'Aniversário do Acre' }, AL: { '09-16': 'Emancipação de Alagoas' }, AP: { '09-13': 'Criação do Amapá' },
    AM: { '09-05': 'Elevação do Amazonas' }, BA: { '07-02': 'Independência da Bahia' }, CE: { '03-25': 'Data Magna do Ceará' },
    MA: { '07-28': 'Adesão do Maranhão' }, MS: { '10-11': 'Criação do Mato Grosso do Sul' }, PA: { '08-15': 'Adesão do Pará' },
    PB: { '08-05': 'Fundação da Paraíba' }, PE: { '03-06': 'Data Magna de Pernambuco' }, PI: { '10-19': 'Dia do Piauí' },
    PR: { '12-19': 'Emancipação do Paraná' }, RJ: { '04-23': 'São Jorge' }, RN: { '10-03': 'Mártires de Cunhaú e Uruaçu' },
    RO: { '01-04': 'Criação de Rondônia' }, RR: { '10-05': 'Criação de Roraima' }, RS: { '09-20': 'Revolução Farroupilha' },
    SE: { '07-08': 'Emancipação de Sergipe' }, SP: { '07-09': 'Revolução Constitucionalista' }, TO: { '10-05': 'Criação do Tocantins' },
  };
  const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
  const cacheFer = {};
  // ctx (opcional): { uf: 'BA', locais: ['06-24', '12-08'] }  -> soma feriados do estado e da cidade
  function feriado(dataIso, ctx) {
    const nac = (cacheFer[dataIso.slice(0, 4)] ||= feriados(+dataIso.slice(0, 4)))[dataIso];
    if (nac) return nac;
    const md = dataIso.slice(5);
    if (ctx?.uf && ESTADUAIS[ctx.uf]?.[md]) return ESTADUAIS[ctx.uf][md];
    if (ctx?.locais?.includes(md)) return 'Feriado municipal';
    return null;
  }
  // Limite de horas por semana (EC 141/2026): 44h até 15/12/2026, 42h até 15/12/2027, 40h depois.
  function limiteSemanal(dataIso) { return dataIso < '2026-12-16' ? 44 : dataIso < '2027-12-16' ? 42 : 40; }
  // data (AAAA-MM-DD) + n dias
  function somaDias(dataIso, n) { const d = new Date(dataIso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return iso(d); }

  // funcionarios: [{nome, fixo?: [idxDia,...] folgas fixas desejadas}]
  // abertos: [7] 1/0 ; minimo: [7] pessoas por dia ; semanas: n
  // ausencias (opcional): ausencias[s][f][d] = código da ocorrência (férias, atestado...) ou null
  // grupos (opcional): [{ nome, membros: [índices], minimo: [7] }] -> função que não pode faltar no dia
  // domingoSemanas: folga no domingo pelo menos 1 vez a cada N semanas (3 comércio, 7 demais)
  function gerarEscala({ funcionarios, abertos, minimo, semanas = 4, ausencias, grupos = [], domingoSemanas = 3 }) {
    const n = funcionarios.length;
    const alertas = [];
    const escala = []; // escala[s][f] = array 7 de 'T' | 'F'
    const domingosTrabalhados = funcionarios.map((_, i) => i % domingoSemanas); // escalona o rodízio
    const gruposDe = funcionarios.map((_, f) => grupos.map((g, gi) => g.membros.includes(f) ? gi : -1).filter(gi => gi >= 0));

    for (let s = 0; s < semanas; s++) {
      const semana = funcionarios.map((_, f) => Array.from({ length: 7 }, (_, d) => ausencias?.[s]?.[f]?.[d] || 'T'));
      const presentes = Array.from({ length: 7 }, (_, d) => semana.filter(x => x[d] === 'T').length);
      const presG = grupos.map(g => Array.from({ length: 7 }, (_, d) => g.membros.filter(f => semana[f][d] === 'T').length));
      const folgaEm = (f, d) => { semana[f][d] = 'F'; presentes[d]--; gruposDe[f].forEach(gi => presG[gi][d]--); };
      // sobra no dia d se f folgar: o menor entre a sobra do dia e a sobra de cada função de f
      const sobra = (f, d) => Math.min(presentes[d] - 1 - minimo[d], ...gruposDe[f].map(gi => presG[gi][d] - 1 - (grupos[gi].minimo[d] || 0)));

      // dias fechados: todos folgam (conta como folga)
      const fechados = [];
      for (let d = 0; d < 7; d++) if (!abertos[d]) fechados.push(d);
      // quem está ausente parte da semana tem menos dias para folgar (férias na semana toda = sem folga)
      const folgasRestantes = semana.map(x => Math.min(2, x.filter(c => c === 'T').length));
      fechados.forEach(d => {
        for (let f = 0; f < n; f++) if (folgasRestantes[f] > 0 && semana[f][d] === 'T') { folgaEm(f, d); folgasRestantes[f]--; }
        presentes[d] = 0;
      });
      // se fecha mais de 2 dias, o resto já é folga extra
      if (fechados.length > 2) for (let f = 0; f < n; f++) fechados.forEach(d => { if (semana[f][d] === 'T') semana[f][d] = 'F'; });

      // ordem: quem trabalhou mais domingos escolhe primeiro (rodízio)
      const ordem = [...Array(n).keys()].sort((a, b) =>
        domingosTrabalhados[b] - domingosTrabalhados[a] || ((a + s) % n) - ((b + s) % n));

      for (const f of ordem) {
        let falta = folgasRestantes[f];
        if (falta <= 0) continue;
        const fixos = (funcionarios[f].fixo || []).filter(d => abertos[d] && semana[f][d] === 'T');
        fixos.slice(0, falta).forEach(d => { folgaEm(f, d); falta--; });
        if (falta <= 0) continue;

        const precisaDomingo = abertos[6] && domingosTrabalhados[f] >= domingoSemanas - 1;
        // avalia pares consecutivos primeiro, depois dias soltos
        const candidatos = [];
        for (let d = 0; d < 7; d++) {
          if (!abertos[d] || semana[f][d] !== 'T') continue;
          const folga = sobra(f, d);
          candidatos.push({ dias: [d], folga });
          const d2 = (d + 1) % 7;
          if (falta >= 2 && d2 !== 0 && abertos[d2] && semana[f][d2] === 'T') {
            candidatos.push({ dias: [d, d2], folga: Math.min(folga, sobra(f, d2)) + 0.5 });
          }
        }
        const pontua = c => c.folga + (precisaDomingo && c.dias.includes(6) && c.folga >= 0 ? 100 : 0) + (c.dias.length === falta ? 0.3 : 0);
        candidatos.sort((a, b) => pontua(b) - pontua(a));
        for (const c of candidatos) {
          if (falta <= 0) break;
          if (c.dias.length > falta) continue;
          if (c.dias.some(d => semana[f][d] !== 'T')) continue;
          c.dias.forEach(d => { folgaEm(f, d); falta--; });
        }
      }

      for (let f = 0; f < n; f++) {
        if (abertos[6] && semana[f][6] === 'T') domingosTrabalhados[f]++; else domingosTrabalhados[f] = 0;
        if (domingosTrabalhados[f] >= domingoSemanas) alertas.push(`Semana ${s + 1}: ${funcionarios[f].nome} chega a ${domingoSemanas} domingos seguidos sem folga.`);
      }
      for (let d = 0; d < 7; d++) if (abertos[d] && presentes[d] < minimo[d])
        alertas.push(`Semana ${s + 1}, ${DIAS[d]}: ${presentes[d]} pessoa(s) para mínimo de ${minimo[d]}.`);
      grupos.forEach((g, gi) => { for (let d = 0; d < 7; d++) if (abertos[d] && presG[gi][d] < (g.minimo[d] || 0))
        alertas.push(`Semana ${s + 1}, ${DIAS[d]}: ${presG[gi][d]} de ${g.minimo[d]} em ${g.nome}.`); });
      escala.push(semana);
    }

    const total = minimo.reduce((a, m, d) => a + (abertos[d] ? m : 0), 0);
    const necessarios = Math.ceil(total / 5);
    if (n < necessarios) alertas.unshift(`Equipe pequena: para essa cobertura você precisa de pelo menos ${necessarios} pessoas trabalhando 5x2.`);
    return { escala, alertas, necessarios };
  }


  // funções obrigatórias da unidade -> grupos para o motor (quem tem o cargo que casa com a chave)
  function gruposDaUnidade(funcionarios, criticas) {
    return (criticas || []).map(c => ({ nome: c.nome, chave: c.chave, minimo: c.minimo || [0, 0, 0, 0, 0, 0, 0],
      membros: funcionarios.map((f, i) => casaFuncao(f.cargo, c.chave) ? i : -1).filter(i => i >= 0) }));
  }

  // Diagnóstico da escala em linguagem simples: o que está certo e o que precisa de atenção.
  // e: { inicio, semanas, funcionarios:[{nome}], abertos, minimo, dados }, opts: { horasDia, ctx (feriados), comercio }
  function analisar(e, opts = {}) {
    const horasDia = +opts.horasDia || 8, n = e.funcionarios.length, itens = [];
    const totalMin = e.minimo.reduce((a, m, d) => a + (e.abertos[d] ? m : 0), 0);
    const necessarios = Math.ceil(totalMin / 5);
    const diasAbertos = e.abertos.filter(Boolean).length;
    // 1. gente suficiente
    const pess = k => `${k} ${k === 1 ? 'pessoa' : 'pessoas'}`, pl = (k, um, varios) => `${k} ${k === 1 ? um : varios}`;
    if (n >= necessarios) itens.push({ ok: true, titulo: 'Gente suficiente', texto: `Com ${pess(n)} trabalhando 5 dias, dá para cobrir o mínimo que você definiu (precisa de ${necessarios}).` });
    else itens.push({ ok: false, titulo: `Falta${necessarios - n > 1 ? 'm' : ''} ${necessarios - n} pessoa${necessarios - n > 1 ? 's' : ''}`, texto: `Para cobrir o mínimo de todos os dias com folgas de 2 dias, são precisas ${necessarios} pessoas. Você tem ${n}. Reduza o mínimo de algum dia ou contrate.` });
    // 2. cobertura dia a dia
    const furos = [];
    e.dados.forEach((sem, s) => { for (let d = 0; d < 7; d++) if (e.abertos[d]) { const p = sem.filter(x => x[d] === 'T').length; if (p < e.minimo[d]) furos.push({ data: somaDias(e.inicio, s * 7 + d), presentes: p, minimo: e.minimo[d] }); } });
    itens.push(furos.length
      ? { ok: false, titulo: `${pl(furos.length, 'dia', 'dias')} abaixo do mínimo`, texto: furos.slice(0, 4).map(f => `${f.data.slice(8)}/${f.data.slice(5, 7)}: ${f.presentes} de ${f.minimo}`).join(' · ') + (furos.length > 4 ? ' · …' : ''), dias: furos }
      : { ok: true, titulo: 'Todos os dias cobertos', texto: 'Nenhum dia fica com menos gente que o mínimo.' });
    // 3. duas folgas por semana
    const semDuas = [];
    e.dados.forEach((sem, s) => sem.forEach((f, i) => { const livres = f.filter(c => c === 'F').length, fora = f.filter(c => COD_NOME[c]).length; if (livres < 2 && fora < 5) semDuas.push(`${e.funcionarios[i]?.nome} (semana ${s + 1})`); }));
    itens.push(semDuas.length ? { ok: false, titulo: 'Folga faltando', texto: `Sem as 2 folgas da semana: ${semDuas.slice(0, 3).join(', ')}${semDuas.length > 3 ? '…' : ''}. Ajuste clicando no dia.` }
      : { ok: true, titulo: '2 folgas por semana para todos', texto: 'Ninguém trabalha mais de 5 dias na semana.' });
    // 4. domingo (comércio: 1 a cada 3 semanas; demais: 1 a cada 7)
    const ds = +opts.domingoSemanas || 3;
    if (e.abertos[6]) {
      const seguidos = e.funcionarios.map((f, i) => { let max = 0, c = 0; e.dados.forEach(sem => { if (sem[i]?.[6] === 'T') { c++; max = Math.max(max, c); } else c = 0; }); return { nome: f.nome, max }; });
      const ruim = seguidos.filter(x => x.max >= ds);
      const regra = ds === 3 ? 'No comércio, a folga no domingo deve cair pelo menos 1 vez a cada 3 semanas (Lei 10.101).' : `Nesta atividade, a folga deve cair no domingo pelo menos 1 vez a cada ${ds} semanas (Portaria MTP 671/2021).`;
      itens.push(ruim.length ? { ok: false, titulo: 'Domingo seguido demais', texto: `${ruim.map(x => x.nome).join(', ')} ${ruim.length === 1 ? 'trabalha' : 'trabalham'} ${ds} domingos seguidos. ${regra}` }
        : { ok: true, titulo: 'Rodízio de domingo em dia', texto: regra.replace('deve cair', 'cai') });
    }
    // 4b. função que não pode faltar (farmacêutico, caixa, cozinha...)
    for (const c of opts.criticas || []) {
      const membros = e.funcionarios.map((f, i) => casaFuncao(f.cargo, c.chave) ? i : -1).filter(i => i >= 0);
      if (!membros.length) { itens.push({ ok: false, titulo: `Ninguém marcado como ${c.nome}`, texto: `${c.explica || ''} Em Pessoas, edite e coloque a função ${c.nome} em quem faz esse trabalho.`.trim() }); continue; }
      const faltas = [];
      e.dados.forEach((sem, s) => { for (let d = 0; d < 7; d++) if (e.abertos[d] && (c.minimo?.[d] || 0) > 0) { const p = membros.filter(i => sem[i]?.[d] === 'T').length; if (p < c.minimo[d]) faltas.push(`${somaDias(e.inicio, s * 7 + d).slice(8)}/${somaDias(e.inicio, s * 7 + d).slice(5, 7)}: ${p} de ${c.minimo[d]}`); } });
      itens.push(faltas.length
        ? { ok: false, titulo: `${c.nome}: falta em ${pl(faltas.length, 'dia', 'dias')}`, texto: `${faltas.slice(0, 4).join(' · ')}${faltas.length > 4 ? ' · …' : ''}. ${pess(membros.length)} com essa função. ${c.explica || ''}` }
        : { ok: true, titulo: `${c.nome} em todos os dias`, texto: `${pess(membros.length)} com essa função, cobrindo o mínimo de cada dia. ${c.explica || ''}` });
    }
    // 5. horas por semana (EC 141/2026)
    const lim = limiteSemanal(e.inicio), semanais = Math.round(horasDia * 5 * 10) / 10;
    const limFim = limiteSemanal(somaDias(e.inicio, e.semanas * 7 - 1));
    const limMin = Math.min(lim, limFim);
    if (horasDia > 8) itens.push({ ok: false, titulo: `${String(horasDia).replace('.', ',')}h por dia passa de 8h`, texto: `Com 5 dias, são ${String(semanais).replace('.', ',')}h na semana. Acima de 8h por dia só com acordo ou convenção coletiva. O jeito simples é 8h por dia = 40h.` });
    else if (semanais > limMin) itens.push({ ok: false, titulo: `${String(semanais).replace('.', ',')}h por semana passa do limite`, texto: `O limite no período é ${limMin}h por semana.` });
    else itens.push({ ok: true, titulo: `${String(semanais).replace('.', ',')}h por semana`, texto: semanais <= 40
      ? 'Já dentro do limite final de 40h da nova lei. Não vai precisar mudar em 2027.'
      : `Dentro do limite de ${limMin}h deste período. A partir de 16/12/2027 o limite cai para 40h.` });
    // 5b. horário de funcionamento x jornada
    const ha = horasAberto(opts.abre, opts.fecha);
    if (ha && ha > horasDia + 1) {
      const turnos = Math.ceil(ha / (horasDia + 1));
      itens.push({ ok: null, titulo: `Aberto ${String(ha).replace('.', ',')}h por dia: ${turnos} turnos`, texto: `Cada pessoa trabalha ${String(horasDia).replace('.', ',')}h mais o almoço, então ninguém cobre o dia todo. O mínimo de cada dia precisa somar as pessoas de todos os turnos, e entre um dia e outro cada um precisa de 11h de descanso (CLT, art. 66).` });
    }
    // 6. feriados
    const fer = [];
    for (let i = 0; i < e.semanas * 7; i++) { const data = somaDias(e.inicio, i), nome = feriado(data, opts.ctx); if (nome && e.abertos[i % 7]) fer.push({ data, nome, trabalham: e.dados[Math.floor(i / 7)].filter(x => x[i % 7] === 'T').length }); }
    if (fer.length) itens.push({ ok: null, titulo: `${pl(fer.length, 'feriado', 'feriados')} no período`, texto: fer.map(f => `${f.data.slice(8)}/${f.data.slice(5, 7)} ${f.nome}: ${f.trabalham} trabalhando`).join(' · ') + '. Quem trabalha no feriado recebe em dobro ou ganha outra folga (Lei 605/49). No comércio, abrir em feriado depende da convenção coletiva.' });
    const problemas = itens.filter(x => x.ok === false).length;
    return { itens, problemas, necessarios, n, diasAbertos, horasSemana: semanais, limite: limMin,
      resumo: problemas ? `${pl(problemas, 'ponto', 'pontos')} para ajustar antes de publicar a escala.` : 'Escala dentro da regra: pode publicar para a equipe.' };
  }

  const api = { DIAS, SETORES, OCORRENCIAS, COD_NOME, UFS, ESTADUAIS, gerarEscala, feriado, feriados, somaDias, limiteSemanal, analisar, casaFuncao, domingoSemanasDe, horasAberto, gruposDaUnidade };
  if (typeof module !== 'undefined') module.exports = api; else root.Escala = api;
})(this);
