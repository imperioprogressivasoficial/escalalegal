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

  // funcionarios: [{nome, fixo?: [idxDia,...] folgas fixas desejadas}]
  // abertos: [7] 1/0 ; minimo: [7] pessoas por dia ; semanas: n
  function gerarEscala({ funcionarios, abertos, minimo, semanas = 4 }) {
    const n = funcionarios.length;
    const alertas = [];
    const escala = []; // escala[s][f] = array 7 de 'T' | 'F'
    const domingosTrabalhados = funcionarios.map((_, i) => i % 3); // escalona o rodízio

    for (let s = 0; s < semanas; s++) {
      const semana = funcionarios.map(() => Array(7).fill('T'));
      const presentes = Array(7).fill(n);

      // dias fechados: todos folgam (conta como folga)
      const fechados = [];
      for (let d = 0; d < 7; d++) if (!abertos[d]) fechados.push(d);
      const folgasRestantes = funcionarios.map(() => 2);
      fechados.forEach(d => {
        for (let f = 0; f < n; f++) if (folgasRestantes[f] > 0) { semana[f][d] = 'F'; folgasRestantes[f]--; }
        presentes[d] = 0;
      });
      // se fecha mais de 2 dias, o resto já é folga extra
      if (fechados.length > 2) for (let f = 0; f < n; f++) fechados.forEach(d => semana[f][d] = 'F');

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
          if (!abertos[d] || semana[f][d] === 'F') continue;
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
          if (c.dias.some(d => semana[f][d] === 'F')) continue;
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

  const api = { DIAS, SETORES, gerarEscala };
  if (typeof module !== 'undefined') module.exports = api; else root.Escala = api;
})(this);
