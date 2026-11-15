// Sua Escala 5x2 — a aula da nova lei, uma lição por tela (igual ao quiz).
// Cada lição: o que diz a lei, um exemplo que se vê, o que muda no seu negócio e uma pergunta rápida para fixar.
let aulaI = 0;
const miniLinha = (nome, dias) => `<div class="ml"><b>${nome}</b>${dias.map((c, i) => `<i class="${c}">${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}</i>`).join('')}</div>`;
function licoes() {
  const s = seg(atual?.setor || conta?.segmento || 'outro'), ds = Escala.domingoSemanasDe(atual?.setor || 'outro');
  const h = +(atual?.horas_dia) || 8, lim = Escala.limiteSemanal(hojeIso());
  const negocio = s.nome.split(' /')[0].toLowerCase();
  return [
    {tit: 'O que mudou', texto: 'A Emenda Constitucional 141/2026 acabou com a escala 6x1. Desde a mudança, ninguém trabalha 6 dias seguidos: cada pessoa tem <b>2 folgas por semana</b>, sem reduzir o salário.',
      exemplo: `<p class="ex-tit">Antes e depois, numa semana</p>${miniLinha('6x1', ['t', 't', 't', 't', 't', 't', 'f'])}${miniLinha('5x2', ['t', 't', 't', 't', 't', 'f', 'f'])}`,
      pratica: 'Passa a valer em <b>15 de dezembro de 2026</b>. Toda empresa com funcionário em 6x1 precisa refazer a escala.',
      p: 'Uma pessoa pode trabalhar de segunda a sábado e folgar só no domingo?', op: ['Pode', 'Não pode'], certa: 1,
      exp: 'Não pode mais. São 2 folgas por semana para cada pessoa.'},
    {tit: 'As 2 folgas', texto: 'As 2 folgas são por semana e para cada pessoa. A lei pede que <b>uma delas caia no domingo sempre que possível</b>. Quando dá, as duas folgas ficam juntas, que a equipe prefere.',
      exemplo: `<p class="ex-tit">Folgas juntas e espalhadas</p>${miniLinha('Ana', ['t', 't', 't', 't', 't', 'f', 'f'])}${miniLinha('Bruno', ['f', 't', 't', 'f', 't', 't', 't'])}<p class="ex-nota">As duas formas valem. Juntas é melhor para quem trabalha.</p>`,
      pratica: 'Quem abre todos os dias continua abrindo. O que muda é o rodízio: cada um folga em dias diferentes para o dia nunca ficar vazio.',
      p: 'A loja pode abrir 7 dias com todo mundo em 5x2?', op: ['Pode', 'Não pode'], certa: 0,
      exp: 'Pode. A lei limita a jornada de cada pessoa, não o horário da loja. É só fazer o rodízio de folgas.'},
    {tit: 'As horas', texto: `Até <b>8 horas por dia</b>. Por semana, o limite é <b>${lim}h</b> agora${lim > 40 ? ` e cai até <b>40h</b> em 15/12/2027` : ''}. Hora a mais é hora extra, paga com no mínimo 50% a mais, ou vai para o banco de horas.`,
      exemplo: `<div class="ex-conta"><span>${String(h).replace('.', ',')}h</span><small>por dia</small><em>×</em><span>5</span><small>dias</small><em>=</em><span class="ok">${String(h * 5).replace('.', ',')}h</span><small>por semana</small></div>`,
      pratica: `Com ${String(h).replace('.', ',')}h por dia, cada pessoa trabalha ${String(h * 5).replace('.', ',')}h na semana${h * 5 <= 40 ? ': já dentro do limite final de 40h.' : '. Revise com o contador: passa do limite.'} O almoço não conta nessas horas.`,
      p: 'Uma pessoa que trabalha 9h em um dia faz hora extra?', op: ['Sim', 'Não'], certa: 0,
      exp: 'Sim. Passou de 8h no dia, a hora a mais é extra (ou banco de horas, se houver acordo).'},
    {tit: 'Domingo', texto: s.comercio
      ? 'No comércio, o domingo de folga de cada pessoa tem que cair <b>pelo menos 1 vez a cada 3 semanas</b> (Lei 10.101). O trabalho no domingo também depende da lei da sua cidade.'
      : `No seu tipo de negócio, a folga cai no domingo <b>pelo menos 1 vez a cada ${ds} semanas</b> (Portaria do Ministério do Trabalho). A convenção da sua categoria pode exigir mais.`,
      exemplo: `<p class="ex-tit">Rodízio de domingo em 3 semanas</p>${miniLinha('Sem. 1', ['t', 't', 't', 't', 't', 'f', 'f'])}${miniLinha('Sem. 2', ['t', 'f', 't', 't', 'f', 't', 't'])}${miniLinha('Sem. 3', ['f', 't', 't', 'f', 't', 't', 't'])}<p class="ex-nota">Domingo de folga na semana 1: depois, só pode repetir trabalho em 2 domingos.</p>`,
      pratica: 'Para mulheres, a CLT (art. 386) prevê folga no domingo em rodízio de 15 dias. Pergunte ao seu contador se vale para a sua categoria.',
      p: s.comercio ? 'No comércio, alguém pode trabalhar 4 domingos seguidos?' : 'Precisa dar folga no domingo de tempos em tempos?', op: ['Sim', 'Não'], certa: s.comercio ? 1 : 0,
      exp: s.comercio ? 'Não. No comércio, a cada 3 semanas a folga tem que cair no domingo.' : `Precisa. Pelo menos 1 domingo de folga a cada ${ds} semanas.`},
    {tit: 'Feriado', texto: 'Quem trabalha no feriado <b>recebe o dia em dobro ou ganha outra folga</b> na semana (Lei 605/49). No comércio, abrir no feriado depende da convenção coletiva e da lei da cidade.',
      exemplo: `<div class="ex-fer"><b>20/11</b><span>Consciência Negra</span><p>4 pessoas trabalham no feriado = <b>4 dias para pagar em dobro</b> ou 4 folgas para dar.</p></div>`,
      pratica: 'É aqui que mais se perde dinheiro sem perceber. A Sua Escala 5x2 marca os feriados e conta quantos dias foram trabalhados neles.',
      p: 'Trabalhou no feriado e não ganhou folga. O que a empresa deve?', op: ['Nada', 'O dia em dobro'], certa: 1,
      exp: 'O dia em dobro. Ou, no lugar disso, uma folga em outro dia.'},
    {tit: 'Descanso entre um dia e outro', texto: 'Entre o fim de um dia de trabalho e o começo do outro, a pessoa descansa <b>pelo menos 11 horas</b> (CLT, art. 66). Em jornada de mais de 6h, o almoço tem de 1 a 2 horas (art. 71).',
      exemplo: `<div class="ex-hora"><span>Fecha a loja<b>22h</b></span><em>11h de descanso</em><span>Pode voltar<b>9h</b></span></div>`,
      pratica: 'Quem fecha à noite não pode abrir cedo no dia seguinte. Combine os turnos pensando nisso.',
      p: 'Quem saiu às 22h pode entrar às 7h no dia seguinte?', op: ['Pode', 'Não pode'], certa: 1,
      exp: 'Não pode: são só 9 horas de descanso. O mínimo é 11.'},
    {tit: 'MEI, micro e pequena empresa', texto: 'A regra vale para <b>todos os tamanhos de empresa</b>. A emenda permite uma lei com transição para micro e pequenas empresas, mas ela ainda não existe. Até lá, vale a regra geral.',
      exemplo: '<div class="ex-fer"><b>MEI</b><span>só 1 funcionário</span><p>Ele folga 2 dias por semana. Nesses dias, quem cobre é o dono.</p></div>',
      pratica: 'Se sair uma regra especial para o seu porte, a Sua Escala 5x2 avisa.',
      p: 'Microempresa está fora da nova regra?', op: ['Está fora', 'Vale também'], certa: 1,
      exp: 'Vale também. A transição para micro e pequena empresa ainda não existe.'},
    {tit: 'Onde a empresa perde dinheiro', texto: 'Quase sempre é no detalhe: <b>feriado trabalhado sem pagar em dobro</b>, <b>hora extra todo dia</b>, alguém <b>sem domingo de folga</b> por semanas e <b>escala que não existe no papel</b>. Isso vira multa e processo trabalhista.',
      exemplo: '<ul class="ex-lista"><li>Feriado trabalhado: pague em dobro ou dê folga</li><li>Escala por escrito, guardada: é a sua prova</li><li>Rodízio de domingo em dia</li><li>Hora extra só de vez em quando</li></ul>',
      pratica: 'A escala que você baixa aqui (PDF ou Excel) fica guardada como prova de que a empresa seguiu a lei. Mande também para o seu contador.',
      p: 'Guardar a escala por escrito ajuda a empresa?', op: ['Ajuda', 'Não faz diferença'], certa: 0,
      exp: 'Ajuda. Em uma fiscalização ou processo, a escala por escrito mostra que as folgas foram dadas.'},
  ];
}
function telaAula() {
  const L = licoes(), total = L.length;
  if (aulaI >= total) {
    $('#v-aula').innerHTML = `<div class="quiz"><div class="vazio quiz-oi"><img src="/img/mascote.svg" alt=""><h1>Pronto! Você já sabe o principal.</h1>
      <p>A Sua Escala 5x2 já monta a escala seguindo tudo isso: 2 folgas, horas, domingo e feriado.</p></div>
      <button class="btn cheio" data-ir="escala">Ver minha escala</button>
      <p style="text-align:center;margin-top:14px"><a class="link" href="/ajuda">Ler a ajuda completa</a> · <button class="link" id="aulaDeNovo">Ver a aula de novo</button></p></div>`;
    $('#aulaDeNovo').onclick = () => { aulaI = 0; telaAula(); };
    return;
  }
  const l = L[aulaI];
  $('#v-aula').innerHTML = `<div class="quiz">
    <div class="quiz-topo"><button class="link" id="aulaVolta">‹ ${aulaI ? 'Voltar' : 'Sair'}</button><span>Lição ${aulaI + 1} de ${total}</span></div>
    <div class="passos"><span class="on" style="flex:${aulaI + 1}"></span><span style="flex:${Math.max(total - aulaI - 1, 0.0001)}"></span></div>
    <div class="quiz-q aula">
      <p class="aula-etq">A nova lei, sem juridiquês</p>
      <h1>${l.tit}</h1>
      <p class="aula-txt">${l.texto}</p>
      <div class="aula-ex">${l.exemplo}</div>
      <div class="nota info"><b>Na prática:</b> ${l.pratica}</div>
      <div class="aula-teste"><p><b>Teste rápido:</b> ${esc(l.p)}</p><div class="lado">${l.op.map((o, i) => `<button class="btn sec" data-r="${i}">${esc(o)}</button>`).join('')}</div><div id="aulaResp"></div></div>
    </div>
    <button class="btn cheio fixo-baixo" id="aulaProx">${aulaI === total - 1 ? 'Terminar' : 'Próxima lição'}</button></div>`;
  $$('[data-r]').forEach(b => b.onclick = () => {
    const ok = +b.dataset.r === l.certa;
    $$('[data-r]').forEach(x => { x.disabled = true; x.classList.toggle('certa', +x.dataset.r === l.certa); x.classList.toggle('errada', x === b && !ok); });
    $('#aulaResp').innerHTML = `<div class="nota ${ok ? 'ok' : ''}">${ok ? 'Isso! ' : 'Quase. '}${esc(l.exp)}</div>`;
  });
  $('#aulaVolta').onclick = () => { if (!aulaI) return ir(podeEditar() ? 'escala' : 'mais'); aulaI--; telaAula(); };
  $('#aulaProx').onclick = () => { aulaI++; telaAula(); window.scrollTo(0, 0); };
  window.scrollTo(0, 0);
}
