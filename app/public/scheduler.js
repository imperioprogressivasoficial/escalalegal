// Motor de escala 5x2 — roda no navegador e no servidor (Node).
// Regras: 5 dias trabalhados + 2 folgas por semana, cobertura mínima por dia,
// folgas preferencialmente consecutivas, rodízio de domingo (folga dominical
// pelo menos 1x a cada 3 semanas — regra do comércio).
(function (root) {
  const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const SETORES = {
    varejo:      { nome: 'Varejo / Loja de shopping', abertos: [1,1,1,1,1,1,1], minimo: [2,2,2,2,3,4,3], turnos: ['10:00–18:20', '13:40–22:00'] },
    restaurante: { nome: 'Restaurante / Lanchonete',  abertos: [1,1,1,1,1,1,1], minimo: [2,2,2,3,4,4,4], turnos: ['10:00–16:00', '16:00–23:00'] },
    farmacia:    { nome: 'Farmácia',                  abertos: [1,1,1,1,1,1,1], minimo: [2,2,2,2,2,2,2], turnos: ['07:00–15:00', '14:00–22:00'] },
    salao:       { nome: 'Salão / Clínica / Estética',abertos: [1,1,1,1,1,1,0], minimo: [2,2,2,2,3,4,0], turnos: ['09:00–17:20', '12:00–20:20'] },
    escritorio:  { nome: 'Escritório / Administrativo',abertos: [1,1,1,1,1,0,0], minimo: [1,1,1,1,1,0,0], turnos: ['08:00–17:00'] },
    seguranca:   { nome: 'Portaria / Segurança',      abertos: [1,1,1,1,1,1,1], minimo: [1,1,1,1,1,1,1], turnos: ['07:00–15:00', '15:00–23:00'] },
  };

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
  const cacheFer = {};
  const feriado = dataIso => (cacheFer[dataIso.slice(0, 4)] ||= feriados(+dataIso.slice(0, 4)))[dataIso] || null;
  // data (AAAA-MM-DD) + n dias
  function somaDias(dataIso, n) { const d = new Date(dataIso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return iso(d); }

  // funcionarios: [{nome, fixo?: [idxDia,...] folgas fixas desejadas}]
  // abertos: [7] 1/0 ; minimo: [7] pessoas por dia ; semanas: n
  // ausencias (opcional): ausencias[s][f][d] = código da ocorrência (férias, atestado...) ou null
  function gerarEscala({ funcionarios, abertos, minimo, semanas = 4, ausencias }) {
    const n = funcionarios.length;
    const alertas = [];
    const escala = []; // escala[s][f] = array 7 de 'T' | 'F'
    const domingosTrabalhados = funcionarios.map((_, i) => i % 3); // escalona o rodízio

    for (let s = 0; s < semanas; s++) {
      const semana = funcionarios.map((_, f) => Array.from({ length: 7 }, (_, d) => ausencias?.[s]?.[f]?.[d] || 'T'));
      const presentes = Array.from({ length: 7 }, (_, d) => semana.filter(x => x[d] === 'T').length);

      // dias fechados: todos folgam (conta como folga)
      const fechados = [];
      for (let d = 0; d < 7; d++) if (!abertos[d]) fechados.push(d);
      // quem está ausente parte da semana tem menos dias para folgar (férias na semana toda = sem folga)
      const folgasRestantes = semana.map(x => Math.min(2, x.filter(c => c === 'T').length));
      fechados.forEach(d => {
        for (let f = 0; f < n; f++) if (folgasRestantes[f] > 0 && semana[f][d] === 'T') { semana[f][d] = 'F'; folgasRestantes[f]--; }
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
        fixos.slice(0, falta).forEach(d => { semana[f][d] = 'F'; presentes[d]--; falta--; });
        if (falta <= 0) continue;

        const precisaDomingo = abertos[6] && domingosTrabalhados[f] >= 2;
        // avalia pares consecutivos primeiro, depois dias soltos
        const candidatos = [];
        for (let d = 0; d < 7; d++) {
          if (!abertos[d] || semana[f][d] !== 'T') continue;
          const folga = presentes[d] - 1 - minimo[d];
          candidatos.push({ dias: [d], folga });
          const d2 = (d + 1) % 7;
          if (falta >= 2 && d2 !== 0 && abertos[d2] && semana[f][d2] === 'T') {
            candidatos.push({ dias: [d, d2], folga: Math.min(folga, presentes[d2] - 1 - minimo[d2]) + 0.5 });
          }
        }
        const pontua = c => c.folga + (precisaDomingo && c.dias.includes(6) && c.folga >= 0 ? 100 : 0) + (c.dias.length === falta ? 0.3 : 0);
        candidatos.sort((a, b) => pontua(b) - pontua(a));
        for (const c of candidatos) {
          if (falta <= 0) break;
          if (c.dias.length > falta) continue;
          if (c.dias.some(d => semana[f][d] !== 'T')) continue;
          c.dias.forEach(d => { semana[f][d] = 'F'; presentes[d]--; falta--; });
        }
      }

      for (let f = 0; f < n; f++) {
        if (abertos[6] && semana[f][6] === 'T') domingosTrabalhados[f]++; else domingosTrabalhados[f] = 0;
        if (domingosTrabalhados[f] >= 3) alertas.push(`Semana ${s + 1}: ${funcionarios[f].nome} vai para o 3º domingo seguido sem folga (comércio exige folga dominical a cada 3 semanas).`);
      }
      for (let d = 0; d < 7; d++) if (abertos[d] && presentes[d] < minimo[d])
        alertas.push(`Semana ${s + 1}, ${DIAS[d]}: ${presentes[d]} pessoa(s) para mínimo de ${minimo[d]}.`);
      escala.push(semana);
    }

    const total = minimo.reduce((a, m, d) => a + (abertos[d] ? m : 0), 0);
    const necessarios = Math.ceil(total / 5);
    if (n < necessarios) alertas.unshift(`Equipe pequena: para essa cobertura você precisa de pelo menos ${necessarios} pessoas trabalhando 5x2.`);
    return { escala, alertas, necessarios };
  }

  const api = { DIAS, SETORES, OCORRENCIAS, COD_NOME, gerarEscala, feriado, feriados, somaDias };
  if (typeof module !== 'undefined') module.exports = api; else root.Escala = api;
})(this);
