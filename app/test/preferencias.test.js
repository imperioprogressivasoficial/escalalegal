// Folgas que o dono escolhe (preferidas ou fixas) e a lei do domingo, que sempre vence.
const test = require('node:test');
const assert = require('node:assert');
const E = require('../public/scheduler.js');

const todoDia = [1, 1, 1, 1, 1, 1, 1], semMinimo = [0, 0, 0, 0, 0, 0, 0];
const domingosSeguidos = (escala, f) => { let max = 0, c = 0; escala.forEach(s => { if (s[f][6] === 'T') { c++; max = Math.max(max, c); } else c = 0; }); return max; };

test('folga preferida é respeitada, menos quando a lei do domingo obriga', () => {
  const fs = Array.from({ length: 6 }, (_, i) => ({ nome: 'Caixa ' + (i + 1), pref: [0, 1] }));
  const { escala, ajustes } = E.gerarEscala({ funcionarios: fs, abertos: todoDia, minimo: semMinimo, semanas: 9, domingoSemanas: 3 });
  fs.forEach((_, f) => {
    assert.ok(domingosSeguidos(escala, f) < 3, 'nunca 3 domingos seguidos');
    escala.forEach((s, w) => {
      assert.equal(s[f].filter(c => c === 'F').length, 2, '2 folgas por semana');
      if (s[f][6] === 'F') assert.ok(s[f][0] === 'F' || s[f][1] === 'F', `semana ${w + 1}: domingo + um dia preferido`);
      else assert.deepEqual([s[f][0], s[f][1]], ['F', 'F'], `semana ${w + 1}: folga nos dias preferidos`);
    });
  });
  assert.ok(ajustes.length > 0 && /domingo \(lei\)/.test(ajustes[0].texto));
});

test('folga fixa cede ao domingo obrigatório e fica registrado', () => {
  const fs = [{ nome: 'A', fixo: [2, 3] }, { nome: 'B', fixo: [2, 3] }, { nome: 'C' }];
  const { escala, ajustes } = E.gerarEscala({ funcionarios: fs, abertos: todoDia, minimo: semMinimo, semanas: 6, domingoSemanas: 3 });
  [0, 1].forEach(f => {
    assert.ok(domingosSeguidos(escala, f) < 3);
    escala.forEach(s => {
      if (s[f][6] === 'F') assert.equal(s[f][2] === 'F' || s[f][3] === 'F', true);
      else { assert.equal(s[f][2], 'F'); assert.equal(s[f][3], 'F'); }
    });
  });
  assert.ok(ajustes.some(a => a.nome === 'A') && ajustes.some(a => a.nome === 'B'));
});

test('dias de trabalho por semana: 4 dias dá 3 folgas', () => {
  const fs = [{ nome: 'A', dias: 4 }, { nome: 'B' }, { nome: 'C', dias: 9 }];
  const { escala } = E.gerarEscala({ funcionarios: fs, abertos: todoDia, minimo: semMinimo, semanas: 3, domingoSemanas: 7 });
  escala.forEach(s => {
    assert.equal(s[0].filter(c => c === 'F').length, 3);
    assert.equal(s[1].filter(c => c === 'F').length, 2);
    assert.equal(s[2].filter(c => c === 'F').length, 2, 'nunca mais de 5 dias');
  });
});

test('função com cargo exato: "Fiscal de caixa" não conta como Caixa', () => {
  const fs = [{ nome: 'Caixa 1', cargo: 'Caixa' }, { nome: 'Fiscal 1', cargo: 'Fiscal de caixa' }];
  const [g] = E.gruposDaUnidade(fs, [{ nome: 'Caixa', chave: 'caixa', cargo: 'Caixa', minimo: [1, 1, 1, 1, 1, 1, 1] }]);
  assert.deepEqual(g.membros, [0]);
  const [antigo] = E.gruposDaUnidade(fs, [{ nome: 'Caixa', chave: 'caixa', minimo: [1, 1, 1, 1, 1, 1, 1] }]);
  assert.deepEqual(antigo.membros, [0, 1], 'sem cargo, vale a chave (unidades antigas)');
  assert.equal(E.hm(8.4), '8h24'); assert.equal(E.hm(42), '42h');
});
