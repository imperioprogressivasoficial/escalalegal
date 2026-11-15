// Sua Escala 5x2 — gerador grátis do blog. Roda no navegador (depois do /scheduler.js) e no Node (testes).
// Versão grátis, com limites claros: 1 semana, até 10 pessoas, sem nomes, sem salvar, até 8h por dia.
// A escala sai do mesmo motor do app: 2 folgas por semana, mínimo por dia e por função, rodízio de domingo.
(function (root) {
  var Escala = root.Escala || (typeof require === 'function' ? require('../public/scheduler.js') : null);
  var LIMITES = { pessoas: 10, semanas: 1, horasDia: 8 };
  var DIAS = Escala.DIAS;

  // "Repositor(a)" vira "Repositor", "Garçom/Garçonete" vira "Garçom"
  function rotulo(f) { return String(f || '').replace(/\(a\)/gi, '').split('/')[0].replace(/\s+/g, ' ').trim() || 'Pessoa'; }
  // segunda-feira da semana da data
  function segundaDe(iso) { var d = new Date(iso + 'T12:00:00Z'), w = (d.getUTCDay() + 6) % 7; return Escala.somaDias(iso, -w); }
  // o máximo de gente da função que dá para ter todo dia aberto, com cada um trabalhando 5 dias
  function viavel(n, abertos) {
    var k = abertos.filter(Boolean).length; if (!k || !n) return 0;
    return Math.min(n, Math.floor(n * Math.min(5, k) / k));
  }
  function br(iso) { return iso.slice(8) + '/' + iso.slice(5, 7); }

  // Pré-preenchido por segmento: a função que não pode faltar e mais uma, para gerar em 3 toques
  function padrao(setor) {
    var s = Escala.SETORES[setor] || Escala.SETORES.outro;
    var crit = s.criticas.map(function (c) { return c.nome; });
    var nomes = crit.concat((s.funcoes || []).filter(function (f) { return crit.indexOf(f) < 0; }));
    if (!nomes.length) nomes = ['Funcionário(a)'];
    var funcoes = nomes.map(function (nome, i) {
      return { nome: nome, n: i === 0 ? 3 : i === 1 ? 2 : 0, critica: crit.indexOf(nome) >= 0 };
    });
    return { setor: setor, abertos: s.abertos.slice(), abre: s.abre, fecha: s.fecha, funcoes: funcoes };
  }

  // o: { setor, abertos[7], funcoes:[{nome, n, minimo}], abre, fecha, horasDia, inicio, uf }
  function montar(o) {
    o = o || {};
    var setor = Escala.SETORES[o.setor] ? o.setor : 'outro', s = Escala.SETORES[setor];
    var abertos = (Array.isArray(o.abertos) && o.abertos.length === 7 ? o.abertos : s.abertos).map(function (a) { return a ? 1 : 0; });
    if (!abertos.some(Boolean)) return { erro: 'Escolha pelo menos um dia que abre.' };
    var funcoes = (Array.isArray(o.funcoes) ? o.funcoes : []).map(function (f) {
      return { nome: String(f.nome || 'Funcionário(a)').slice(0, 40), n: Math.max(0, Math.floor(+f.n || 0)), minimo: f.minimo == null ? null : Math.max(0, Math.floor(+f.minimo || 0)) };
    }).filter(function (f) { return f.n > 0; });
    var total = funcoes.reduce(function (a, f) { return a + f.n; }, 0);
    if (!total) return { erro: 'Coloque pelo menos uma pessoa na equipe.' };
    if (total > LIMITES.pessoas) return { erro: 'A versão grátis vai até ' + LIMITES.pessoas + ' pessoas. Para equipes maiores, use a versão completa.' };
    // até 8h por dia (EC 141/2026): acima disso a versão grátis não monta
    var horasDia = Math.min(LIMITES.horasDia, Math.max(1, +o.horasDia || 8));
    var inicio = /^\d{4}-\d{2}-\d{2}$/.test(o.inicio || '') ? segundaDe(o.inicio) : segundaDe(new Date().toISOString().slice(0, 10));
    var domingoSemanas = Escala.domingoSemanasDe(setor);

    var funcionarios = [], grupos = [];
    funcoes.forEach(function (f) {
      var membros = [];
      for (var i = 1; i <= f.n; i++) { membros.push(funcionarios.length); funcionarios.push({ nome: rotulo(f.nome) + ' ' + i, cargo: f.nome, dias: 5 }); }
      f.max = viavel(f.n, abertos);
      f.minimo = f.minimo == null ? f.max : Math.min(f.minimo, f.max);
      if (f.minimo > 0) {
        var base = s.criticas.filter(function (c) { return c.nome === f.nome; })[0];
        grupos.push({ nome: f.nome, cargo: f.nome, membros: membros, minimo: abertos.map(function (a) { return a ? f.minimo : 0; }), explica: base ? base.explica : '' });
      }
    });
    var soma = funcoes.reduce(function (a, f) { return a + f.minimo; }, 0);
    var minimo = abertos.map(function (a) { return a ? Math.max(1, soma) : 0; });
    // feriados da semana: sem marcar, a empresa fecha e todos folgam; o: feriados { abre, removidos, extras }
    var ctx = { uf: o.uf && Escala.UFS.indexOf(o.uf) >= 0 ? o.uf : null, config: o.feriados || {} };
    var r = Escala.gerarEscala({ funcionarios: funcionarios, abertos: abertos, minimo: minimo, semanas: LIMITES.semanas, grupos: grupos, domingoSemanas: domingoSemanas,
      feriadosFechados: Escala.diasFeriadoFechado(inicio, 1, ctx, abertos) });
    var semana = r.escala[0];
    var analise = Escala.analisar({ inicio: inicio, semanas: 1, funcionarios: funcionarios, abertos: abertos, minimo: minimo, dados: r.escala },
      { horasDia: horasDia, ctx: ctx, criticas: grupos, domingoSemanas: domingoSemanas, abre: o.abre, fecha: o.fecha });
    var dias = DIAS.map(function (nome, d) {
      var iso = Escala.somaDias(inicio, d);
      return { nome: nome, iso: iso, br: br(iso), aberto: !!abertos[d], feriado: Escala.feriado(iso, ctx), ferFechado: !!abertos[d] && Escala.feriadoFechado(iso, ctx) };
    });
    var linhas = funcionarios.map(function (f, i) { return { nome: f.nome, cargo: f.cargo, dias: semana[i].map(function (c, d) { return abertos[d] ? c : 'F'; }) }; });
    var presentes = dias.map(function (_, d) { return semana.filter(function (x) { return x[d] === 'T'; }).length; });
    var limite = Math.min(Escala.limiteSemanal(inicio), Escala.limiteSemanal(Escala.somaDias(inicio, 6)));
    // críticas da função (farmacêutico, caixa, cozinha...) que a equipe pequena não cobre
    var avisos = [];
    s.criticas.forEach(function (c) {
      var f = funcoes.filter(function (x) { return x.nome === c.nome; })[0];
      var precisa = Math.max.apply(null, c.minimo.map(function (m, d) { return abertos[d] ? m : 0; }));
      if (!f) avisos.push({ ok: false, titulo: 'Ninguém de ' + rotulo(c.nome).toLowerCase(), texto: c.explica });
      else if (f.minimo < Math.min(1, precisa)) avisos.push({ ok: false, titulo: f.n + ' de ' + rotulo(c.nome).toLowerCase() + ' não cobre todos os dias', texto: c.explica + ' Com 5 dias de trabalho por pessoa, você precisa de mais gente nessa função.' });
    });
    return {
      setor: setor, inicio: inicio, fim: Escala.somaDias(inicio, 6), semanas: 1, dias: dias, linhas: linhas, presentes: presentes, minimo: minimo,
      horasDia: horasDia, horasSemana: horasDia * 5, limite: limite, domingoSemanas: domingoSemanas, comercio: !!s.comercio,
      domingoFolgam: abertos[6] ? linhas.filter(function (l) { return l.dias[6] === 'F'; }).map(function (l) { return l.nome; }) : [],
      analise: analise, avisos: avisos,
      avaliador: Escala.avaliar({ inicio: inicio, funcionarios: funcionarios, abertos: abertos, minimo: minimo, dados: r.escala }, { ctx: ctx, criticas: grupos, domingoSemanas: domingoSemanas }), alertas: r.alertas, funcoes: funcoes, limites: LIMITES,
    };
  }

  var api = { LIMITES: LIMITES, montar: montar, padrao: padrao, viavel: viavel, rotulo: rotulo, segundaDe: segundaDe };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.GeradorGratis = api;
  if (typeof document === 'undefined') return;

  // ===================== tela =====================
  var $ = function (s) { return document.querySelector(s); };
  var form = $('#gerador'); if (!form) return;
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var st = padrao($('#gSetor').value), passo = 1, ultimo = null;
  var rastrear = function (ev, d) { if (window.rastrear) window.rastrear(ev, d); };

  function total() { return st.funcoes.reduce(function (a, f) { return a + f.n; }, 0); }
  function aplicaSetor(k) {
    st = padrao(k);
    $('#gAbre').value = st.abre; $('#gFecha').value = st.fecha;
    desenhaDias(); desenhaFuncoes();
  }
  function desenhaDias() {
    [].forEach.call(form.querySelectorAll('[data-dia]'), function (b) { b.setAttribute('aria-pressed', st.abertos[+b.dataset.dia] ? 'true' : 'false'); });
    var s = Escala.SETORES[st.setor] || Escala.SETORES.outro;
    $('#gDomingo').textContent = st.abertos[6]
      ? (s.comercio ? 'Abre no domingo: no comércio, cada pessoa folga pelo menos 1 domingo a cada 3 semanas (Lei 10.101). A escala já faz o rodízio.'
        : 'Abre no domingo: nesta atividade, a folga cai no domingo pelo menos 1 vez a cada 7 semanas (Portaria MTP 671/2021).')
      : 'Fechado no domingo: todo mundo folga no domingo e mais 1 dia na semana.';
  }
  function desenhaFuncoes() {
    var t = total(), s = Escala.SETORES[st.setor] || Escala.SETORES.outro;
    $('#gFuncoes').innerHTML = st.funcoes.map(function (f, i) {
      var max = viavel(f.n, st.abertos);
      if (f.minimo == null || f.auto) { f.minimo = max; f.auto = true; } else f.minimo = Math.min(f.minimo, max);
      var crit = s.criticas.filter(function (c) { return c.nome === f.nome; })[0];
      return '<div class="g-fn' + (f.n ? '' : ' vazio') + '"><div><b>' + esc(rotulo(f.nome)) + '</b>' + (crit ? '<span class="crit">Não pode faltar</span>' : '') + '</div>'
        + '<div class="passo"><button type="button" data-n="' + i + '" data-d="-1" aria-label="Menos uma pessoa em ' + esc(rotulo(f.nome)) + '"' + (f.n ? '' : ' disabled') + '>−</button>'
        + '<output aria-label="Pessoas em ' + esc(rotulo(f.nome)) + '">' + f.n + '</output>'
        + '<button type="button" data-n="' + i + '" data-d="1" aria-label="Mais uma pessoa em ' + esc(rotulo(f.nome)) + '"' + (t >= LIMITES.pessoas ? ' disabled' : '') + '>+</button></div>'
        + '<div class="min"><span>Trabalhando por dia, no mínimo</span><div class="passo"><button type="button" data-m="' + i + '" data-d="-1" aria-label="Mínimo menor"' + (f.minimo ? '' : ' disabled') + '>−</button>'
        + '<output>' + f.minimo + '</output><button type="button" data-m="' + i + '" data-d="1" aria-label="Mínimo maior"' + (f.minimo >= max ? ' disabled' : '') + '>+</button></div></div>'
        + (crit && f.n ? '<p class="explica">' + esc(crit.explica) + '</p>' : '') + '</div>';
    }).join('');
    $('#gTotal').textContent = t;
  }
  // feriados da semana escolhida: abre? remover? adicionar outro
  var fer = { abre: [], removidos: [], extras: [] };
  function desenhaFeriados() {
    var el = $('#gFeriados'); if (!el) return;
    var ini = $('#gSemana').value, lista = Escala.feriadosEntre(ini, Escala.somaDias(ini, 6), { uf: $('#gUf').value || null, config: fer }).filter(function (f) { return f.tipo !== 'facultativo'; });
    el.innerHTML = '<p class="g-dica">' + (lista.length ? 'Feriados nesta semana. Sem marcar, a empresa fecha e todos folgam.' : 'Nenhum feriado nesta semana.') + '</p>'
      + lista.map(function (f) {
        return '<div class="g-fer' + (f.removido ? ' removido' : '') + '"><b>' + br(f.data) + ' · ' + esc(f.nome) + '</b>'
          + (f.removido ? '<span> tratado como dia normal</span>' : '<label class="ck"><input type="checkbox" data-fabre="' + f.data + '"' + (f.abre ? ' checked' : '') + '> A empresa abre neste feriado</label>')
          + '<button type="button" class="link" data-f' + (f.removido ? 'volta' : 'tira') + '="' + f.data + '">' + (f.removido ? 'Voltar' : 'Remover') + '</button></div>';
      }).join('')
      + (lista.some(function (f) { return f.abre && !f.removido; }) ? '<p class="g-dica">Quem trabalha no feriado recebe em dobro ou ganha outra folga (Lei 605/49).</p>' : '')
      + '<details><summary class="link">Adicionar outro feriado</summary><div class="g-2"><div><label for="gFerData">Data</label><input id="gFerData" type="date" min="' + ini + '" max="' + Escala.somaDias(ini, 6) + '" value="' + ini + '"></div>'
      + '<div><label for="gFerNome">Nome</label><input id="gFerNome" placeholder="Ex.: Padroeiro"></div></div><button type="button" class="btn btn-sec" id="gFerAdd">Adicionar</button></details>';
  }
  function tiraDe(l, d) { var i = l.indexOf(d); if (i >= 0) l.splice(i, 1); }
  form.addEventListener('change', function (e) {
    var c = e.target; if (!c.dataset || c.dataset.fabre == null) return;
    tiraDe(fer.abre, c.dataset.fabre); if (c.checked) fer.abre.push(c.dataset.fabre); desenhaFeriados();
  });
  form.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.ftira) { var d = b.dataset.ftira; tiraDe(fer.abre, d); var ex = fer.extras.filter(function (x) { return x.data !== d; });
      if (ex.length < fer.extras.length) fer.extras = ex; else fer.removidos.push(d); desenhaFeriados(); }
    else if (b.dataset.fvolta) { tiraDe(fer.removidos, b.dataset.fvolta); desenhaFeriados(); }
    else if (b.id === 'gFerAdd') { var dt = $('#gFerData').value; if (!dt) return; tiraDe(fer.removidos, dt);
      fer.extras = fer.extras.filter(function (x) { return x.data !== dt; }); fer.extras.push({ data: dt, nome: $('#gFerNome').value.trim() || 'Feriado' }); desenhaFeriados(); }
  });
  function desenhaLimite() {
    desenhaFeriados();
    var ini = $('#gSemana').value, lim = Math.min(Escala.limiteSemanal(ini), Escala.limiteSemanal(Escala.somaDias(ini, 6))), h = +$('#gHoras').value;
    var ha = Escala.horasAberto($('#gAbre').value, $('#gFecha').value);
    $('#gLimite').textContent = 'Nesta semana o limite é ' + lim + 'h. Com ' + h + 'h por dia × 5 dias = ' + (h * 5) + 'h: dentro da lei.'
      + (ha && ha > h + 1 ? ' Aberto ' + Escala.hm(ha) + ' por dia: conte as pessoas de todos os turnos.' : '');
  }
  function vaiPara(p) {
    passo = p; form.className = 'g-card passo-' + p;
    [].forEach.call(form.querySelectorAll('.g-passos li'), function (li, i) { li.className = i + 1 === p ? 'on' : i + 1 < p ? 'feito' : ''; });
    $('#gErro').textContent = '';
    if (p === 2) desenhaFuncoes();
    if (p === 3) desenhaLimite();
    var leg = form.querySelector('[data-p="' + p + '"] legend');
    if (window.innerWidth < 900 && form.getBoundingClientRect().top < 0) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (leg) { leg.setAttribute('tabindex', '-1'); leg.focus({ preventScroll: true }); }
  }

  $('#gSetor').onchange = function () { aplicaSetor(this.value); };
  form.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.dia != null) { var d = +b.dataset.dia; st.abertos[d] = st.abertos[d] ? 0 : 1; st.funcoes.forEach(function (f) { f.auto = true; }); desenhaDias(); return; }
    if (b.dataset.n != null) { var f = st.funcoes[+b.dataset.n], nv = f.n + +b.dataset.d; if (nv >= 0 && (b.dataset.d < 0 || total() < LIMITES.pessoas)) { f.n = nv; f.auto = true; } desenhaFuncoes(); return; }
    if (b.dataset.m != null) { var g = st.funcoes[+b.dataset.m]; g.minimo = Math.max(0, g.minimo + +b.dataset.d); g.auto = false; desenhaFuncoes(); return; }
    if (b.classList.contains('g-volta')) return vaiPara(passo - 1);
    if (b.classList.contains('g-prox')) {
      if (passo === 1 && !st.abertos.some(Boolean)) { $('#gErro').textContent = 'Escolha pelo menos um dia que abre.'; return; }
      if (passo === 2 && !total()) { $('#gErro').textContent = 'Coloque pelo menos uma pessoa na equipe.'; return; }
      return vaiPara(passo + 1);
    }
  });
  ['gSemana', 'gHoras', 'gAbre', 'gFecha', 'gUf'].forEach(function (id) { $('#' + id).addEventListener('change', desenhaLimite); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var r = montar({ setor: st.setor, abertos: st.abertos, funcoes: st.funcoes, abre: $('#gAbre').value, fecha: $('#gFecha').value,
      horasDia: +$('#gHoras').value, inicio: $('#gSemana').value, uf: $('#gUf').value, feriados: fer });
    if (r.erro) { $('#gErro').textContent = r.erro; return; }
    ultimo = r; mostra(r);
    rastrear('GerouEscala', { pessoas: r.linhas.length, setor: r.setor });
  });

  function mostra(r) {
    var sec = $('#resultado'), s = Escala.SETORES[r.setor];
    var cab = r.dias.map(function (d) { return '<th scope="col"' + (d.feriado ? ' class="fer"' : '') + '>' + d.nome + '<small>' + d.br + (d.feriado ? ' · feriado' : '') + '</small></th>'; }).join('');
    var corpo = r.linhas.map(function (l) {
      return '<tr><th scope="row">' + esc(l.nome) + '</th>' + l.dias.map(function (c, d) {
        return '<td>' + (!r.dias[d].aberto || r.dias[d].ferFechado ? '<i class="c-x">' + (r.dias[d].ferFechado ? 'Feriado' : 'Fechado') + '</i>' : c === 'T' ? '<i class="c-t">Trabalha</i>' : '<i class="c-f">Folga</i>') + '</td>';
      }).join('') + '</tr>';
    }).join('');
    var pe = '<tr><th scope="row">Trabalhando</th>' + r.presentes.map(function (p, d) {
      var ab = r.dias[d].aberto && !r.dias[d].ferFechado;
      return '<td' + (ab && p < r.minimo[d] ? ' class="baixo"' : '') + '>' + (ab ? p + ' de ' + r.minimo[d] : '—') + '</td>';
    }).join('') + '</tr>';
    var itens = r.analise.itens.filter(function (x) { return !/^Rodízio de domingo|^Domingo seguido/.test(x.titulo); }); // 1 semana: o domingo vai no item próprio
    var checks = r.avisos.concat(itens).map(function (x) {
      return '<li class="' + (x.ok === false ? 'nao' : x.ok === null ? 'info' : '') + '"><b>' + esc(x.titulo) + '</b>' + esc(String(x.texto || '').replace(/ Ajuste clicando no dia\.| Em Pessoas, edite[^.]*\./g, '')) + '</li>';
    });
    if (r.dias[6].aberto) checks.splice(1, 0, '<li class="info"><b>Domingo desta semana</b>' + (r.domingoFolgam.length
      ? 'Folgam no domingo: ' + esc(r.domingoFolgam.join(', ')) + '. Na semana seguinte, o domingo de folga passa para outras pessoas: '
      : 'Ninguém folga neste domingo. Nas próximas semanas, o domingo de folga precisa entrar em rodízio: ')
      + (r.comercio ? 'no comércio, cada pessoa folga pelo menos 1 domingo a cada 3 semanas (Lei 10.101).' : 'nesta atividade, pelo menos 1 domingo a cada 7 semanas.')
      + ' Mulheres folgam no domingo pelo menos a cada 15 dias (CLT, art. 386): no app completo você marca quem é e a escala já faz isso.</li>');
    var aval = (r.avaliador || []).length ? '<div class="g-avaliador"><h3>Por que a escala não fecha</h3><ul>' + r.avaliador.map(function (i) { return '<li><b>' + esc(i.titulo) + '</b> ' + esc(i.texto) + '</li>'; }).join('')
      + '</ul><div class="acoes"><button type="button" class="btn" data-vai="2">Ajustar mínimo por dia</button><button type="button" class="btn btn-sec" data-vai="2">Adicionar colaborador</button><button type="button" class="btn btn-sec" data-vai="1">Ver funcionamento</button></div></div>' : '';
    sec.innerHTML = '<div class="res-cab"><div><h2>Sua escala 5x2 está pronta</h2><p>' + esc(s.nome) + ' · semana de ' + r.dias[0].br + ' a ' + r.dias[6].br + '/' + r.fim.slice(0, 4) + ' · ' + r.linhas.length + (r.linhas.length === 1 ? ' pessoa' : ' pessoas') + ' · ' + r.horasDia + 'h por dia</p></div>'
      + '<button type="button" class="link nao-imprime" id="gEditar">Mudar as respostas</button></div>'
      + aval + '<div class="tabela-g"><table><caption class="sr" style="position:absolute;left:-9999px">Escala 5x2 da semana</caption><thead><tr><th scope="col">Pessoa</th>' + cab + '</tr></thead><tbody>' + corpo + '</tbody><tfoot>' + pe + '</tfoot></table></div>'
      + '<div class="legenda"><span><i class="c-t"></i>Trabalha</span><span><i class="c-f"></i>Folga</span><span><i class="c-x"></i>Fechado</span><span>' + r.horasSemana + 'h na semana por pessoa · limite ' + r.limite + 'h</span></div>'
      + '<p class="marca-dagua">Feito grátis em ' + esc(form.dataset.site) + ' · confira com seu contador</p>'
      + '<ul class="checks">' + checks.join('') + '</ul>'
      + '<div class="acoes nao-imprime"><button type="button" class="btn btn-sec" id="gImprimir">Imprimir</button><button type="button" class="btn btn-sec" id="gPng">Baixar imagem</button></div>'
      + '<p class="gratis-nota nao-imprime">Versão grátis: 1 semana, até 10 pessoas, sem nomes e nada fica salvo. A imagem sai com a marca "feito em ' + esc(form.dataset.site) + '".</p>'
      + '<aside class="pago nao-imprime" aria-labelledby="tPagoG"><div class="pago-txt"><p class="etq etq-claro">Sua Escala 5x2 completa</p><h2 id="tPagoG">Quer o mês inteiro, com os nomes, faltas, férias, envio pelo WhatsApp e acesso do contador?</h2>'
      + '<ul><li>4 semanas prontas, com o rodízio de domingo seguro</li><li>Nome de cada pessoa, folga fixa e férias</li><li>Link para a equipe ver a folga no celular</li><li>PDF, Excel, Google Planilhas e imagem para o WhatsApp</li><li>Espaço do contador com o mês fechado</li></ul>'
      + '<a class="btn btn-amarelo" data-pago href="' + esc(window.linkPago ? linkPago(form.dataset.pago) : form.dataset.pago) + '">Conhecer por R$ 97</a></div>'
      + '<img src="/img/iphone-escala.webp" width="675" height="1380" alt="Tela do app Sua Escala 5x2 com a escala da semana" loading="lazy" decoding="async"></aside>'
      + '<form class="g-email nao-imprime" id="gEmail" novalidate><h3>Quer receber esta escala por e-mail?</h3><p>Opcional: você não precisa disso para usar o gerador.</p>'
      + '<label for="gMail">Seu e-mail</label><input id="gMail" type="email" autocomplete="email" inputmode="email" required>'
      + '<label class="ck"><input type="checkbox" id="gOk"> Autorizo a Sua Escala 5x2 a me enviar esta escala por e-mail.</label>'
      + '<label class="ck"><input type="checkbox" id="gNov"> Quero receber avisos sobre a nova lei. Posso cancelar quando quiser.</label>'
      + '<button class="btn" type="submit">Enviar para o meu e-mail</button><p class="g-erro" id="gMailErro" role="alert"></p>'
      + '<p class="mini">Usamos o e-mail só para o que você autorizou. Veja a <a href="' + esc(form.dataset.app) + '/privacidade">Política de privacidade</a>.</p></form>';
    sec.hidden = false;
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#gEditar').onclick = function () { form.scrollIntoView({ behavior: 'smooth', block: 'start' }); vaiPara(1); };
    [].forEach.call(sec.querySelectorAll('[data-vai]'), function (b) { b.onclick = function () { form.scrollIntoView({ behavior: 'smooth', block: 'start' }); vaiPara(+b.dataset.vai); }; });
    $('#gImprimir').onclick = function () { window.print(); };
    $('#gPng').onclick = function () { png(r); };
    $('#gEmail').onsubmit = function (e) { e.preventDefault(); enviaEmail(r); };
  }

  function enviaEmail(r) {
    var mail = $('#gMail').value.trim(), erro = $('#gMailErro');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { erro.textContent = 'Confira o e-mail.'; return; }
    if (!$('#gOk').checked) { erro.textContent = 'Marque a caixa autorizando o envio.'; return; }
    erro.textContent = '';
    var g = window.origemBlog || {}, utm = {};
    Object.keys(g).forEach(function (k) { if (k.indexOf('utm_') === 0) utm[k] = g[k]; });
    var b = $('#gEmail button'); b.disabled = true; b.textContent = 'Enviando…';
    fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
      body: JSON.stringify({ origem: 'blog-gerador', email: mail, consentimento: true, novidades: $('#gNov').checked, setor: r.setor, ref: g.ind || '', utm: utm,
        escala: { inicio: r.inicio, linhas: r.linhas.map(function (l) { return { nome: l.nome, dias: l.dias.join('') }; }) } }) })
      .then(function (x) { return x.json().then(function (j) { if (!x.ok) throw new Error(j.erro || 'Não deu certo. Tente de novo.'); }); })
      .then(function () { $('#gEmail').innerHTML = '<p class="ok">Pronto! A escala vai chegar no seu e-mail em alguns minutos.</p>'; rastrear('Lead', { origem: 'blog-gerador' }); })
      .catch(function (err) { erro.textContent = err.message; b.disabled = false; b.textContent = 'Enviar para o meu e-mail'; });
  }

  // imagem da semana (PNG), desenhada no aparelho, com a marca "feito em ..."
  function png(r) {
    var esq = 150, col = 92, alt = 46, topo = 120, n = r.linhas.length, W = esq + col * 7 + 40, H = topo + alt * (n + 2) + 70, k = 2;
    var c = document.createElement('canvas'); c.width = W * k; c.height = H * k;
    var x = c.getContext('2d'); x.scale(k, k);
    var F = function (p, w) { return (w || 600) + ' ' + p + 'px "Public Sans", system-ui, sans-serif'; };
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#061533'; x.fillRect(0, 0, W, 64);
    x.fillStyle = '#fff'; x.font = '800 24px "Archivo", Arial, sans-serif'; x.fillText('Escala 5x2', 20, 40);
    x.fillStyle = '#cfe0ff'; x.font = F(15); x.fillText('Semana de ' + r.dias[0].br + ' a ' + r.dias[6].br + '/' + r.fim.slice(0, 4) + ' · ' + r.horasDia + 'h por dia', 160, 40);
    r.dias.forEach(function (d, i) {
      var cx = esq + i * col + col / 2;
      x.textAlign = 'center'; x.fillStyle = '#0c1b33'; x.font = F(15, 800); x.fillText(d.nome, cx, topo - 26);
      x.fillStyle = d.feriado ? '#b3141a' : '#5b6678'; x.font = F(12); x.fillText(d.br + (d.feriado ? ' feriado' : ''), cx, topo - 10);
    });
    r.linhas.forEach(function (l, j) {
      var y = topo + j * alt;
      x.textAlign = 'left'; x.fillStyle = '#0c1b33'; x.font = F(15, 700); x.fillText(l.nome, 20, y + 29);
      l.dias.forEach(function (cel, i) {
        var fechado = !r.dias[i].aberto, cx = esq + i * col + 6;
        x.fillStyle = fechado ? '#eef1f5' : cel === 'T' ? '#e3f5e1' : '#fff3bf';
        x.beginPath(); if (x.roundRect) x.roundRect(cx, y + 7, col - 12, alt - 14, 8); else x.rect(cx, y + 7, col - 12, alt - 14); x.fill();
        x.fillStyle = fechado ? '#8a94a6' : cel === 'T' ? '#0f5e17' : '#6b5300'; x.font = F(13, 800); x.textAlign = 'center';
        x.fillText(fechado ? 'Fechado' : cel === 'T' ? 'Trabalha' : 'Folga', cx + (col - 12) / 2, y + 28);
      });
      x.fillStyle = '#dde4ef'; x.fillRect(20, y + alt - 1, W - 40, 1);
    });
    var yp = topo + n * alt;
    x.textAlign = 'left'; x.fillStyle = '#5b6678'; x.font = F(13, 700); x.fillText('Trabalhando', 20, yp + 28);
    r.presentes.forEach(function (p, i) { x.textAlign = 'center'; x.fillText(r.dias[i].aberto ? p + ' de ' + r.minimo[i] : '—', esq + i * col + col / 2, yp + 28); });
    x.textAlign = 'left'; x.fillStyle = '#5b6678'; x.font = F(13);
    x.fillText('2 folgas por semana para cada pessoa · ' + r.horasSemana + 'h na semana (limite ' + r.limite + 'h). Confira com seu contador.', 20, H - 46);
    x.textAlign = 'right'; x.fillStyle = '#1351b4'; x.font = F(13, 800); x.fillText('feito em ' + form.dataset.site, W - 20, H - 20);
    x.textAlign = 'left'; x.fillStyle = '#168821'; x.fillRect(0, H - 6, W / 3, 6); x.fillStyle = '#ffcd07'; x.fillRect(W / 3, H - 6, W / 3, 6); x.fillStyle = '#1351b4'; x.fillRect(2 * W / 3, H - 6, W / 3, 6);
    c.toBlob(function (b) {
      var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'escala-5x2-semana-' + r.inicio + '.png';
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    }, 'image/png');
  }

  aplicaSetor($('#gSetor').value);
})(typeof window !== 'undefined' ? window : this);
