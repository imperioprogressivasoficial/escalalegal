const test = require('node:test');
const assert = require('node:assert');
const { gerarEscala, SETORES } = require('../public/scheduler.js');

test('toda pessoa tem exatamente 2 folgas por semana em todos os setores', () => {
  for (const [nome, s] of Object.entries(SETORES)) {
    for (const n of [1, 3, 7, 15, 40]) {
      const funcionarios = Array.from({ length: n }, (_, i) => ({ nome: 'F' + i, fixo: i === 0 ? [2] : [] }));
      const { escala } = gerarEscala({ funcionarios, abertos: s.abertos, minimo: s.minimo, semanas: 4 });
      assert.equal(escala.length, 4, nome);
      for (const semana of escala) for (const f of semana) {
        assert.equal(f.length, 7);
        assert.equal(f.filter(c => c === 'F').length, 2, `${nome} com ${n} pessoas`);
      }
    }
  }
});

test('equipe com gente suficiente cobre o mínimo todos os dias', () => {
  const s = SETORES.varejo;
  const funcionarios = Array.from({ length: 8 }, (_, i) => ({ nome: 'F' + i }));
  const { escala } = gerarEscala({ funcionarios, abertos: s.abertos, minimo: s.minimo, semanas: 4 });
  for (const semana of escala) for (let d = 0; d < 7; d++) {
    assert.ok(semana.filter(f => f[d] === 'T').length >= s.minimo[d], `dia ${d}`);
  }
});

test('gera 200 funcionários x 8 semanas rápido', () => {
  const t0 = Date.now();
  gerarEscala({ funcionarios: Array.from({ length: 200 }, (_, i) => ({ nome: 'F' + i })), abertos: SETORES.varejo.abertos, minimo: SETORES.varejo.minimo, semanas: 8 });
  assert.ok(Date.now() - t0 < 2000);
});
