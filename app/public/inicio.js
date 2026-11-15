// Sua Escala 5x2 — área do cliente: cadastro completo da empresa (logo depois da compra), tela inicial
// (boas-vindas, "Comece por aqui", progresso e atalhos), menu lateral no computador e a moldura do quiz.
// Usa as variáveis e funções do app.js ($, api, conta, eu, equipes, atual, funcs, ir...). Só define funções aqui.

// ---------- moldura do quiz: cartão, barra de progresso, contador de passos e painel com as respostas ----------
let quizDir = 1; // 1 = avançou, -1 = voltou (a animação entra do lado certo)
function quizMoldura({ etapa, num, total, minutos, corpo, botao, botaoDesligado, resumo, voltar = true, rodapeExtra = '' }) {
  const pct = Math.round(num / total * 100);
  return `<div class="quiz-wrap ${resumo ? 'com-resumo' : ''}">
    <div class="quiz-card">
      <div class="quiz-topo">${voltar ? '<button class="q-volta" id="qVolta" type="button">‹ Voltar</button>' : '<span></span>'}
        <span class="q-passo">Passo <b>${num}</b> de ${total}</span>${minutos ? `<span class="q-tempo">${minutos}</span>` : '<span></span>'}</div>
      <div class="q-barra" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
      <div class="quiz-q ${quizDir < 0 ? 'volta' : ''}">${etapa ? `<span class="q-etapa">${etapa}</span>` : ''}${corpo}</div>
      <p class="erro" id="wzErro" role="alert"></p>
      ${botao ? `<div class="q-rodape"><button class="btn q-continuar" id="qOk" type="button" ${botaoDesligado ? 'disabled' : ''}>${botao}<span aria-hidden="true" class="q-seta">→</span></button>${rodapeExtra}</div>` : rodapeExtra}
    </div>
    ${resumo ? `<aside class="quiz-resumo">${resumo}</aside>` : ''}
  </div>`;
}
const resumoLinhas = (tit, linhas, extra = '') => `<p class="qr-tit">${tit}</p><dl class="qr-lista">${linhas.map(([k, v]) =>
  `<div class="${v ? 'ok' : ''}"><dt>${k}</dt><dd>${v ? esc(v) : '<span>a preencher</span>'}</dd></div>`).join('')}</dl>${extra}`;
// opção grande: título + descrição curta + marcador
const opcao = (attr, val, tit, desc, on) => `<button type="button" class="q-op ${on ? 'on' : ''}" ${attr}="${esc(val)}" aria-pressed="${on ? 'true' : 'false'}"><span><b>${tit}</b>${desc ? `<small>${desc}</small>` : ''}</span><i class="q-marca" aria-hidden="true"></i></button>`;
// escolheu: marca, espera um instante (a pessoa vê a escolha) e segue
function escolheESegue(botoes, aoEscolher, seguir) {
  botoes.forEach(b => b.onclick = () => {
    botoes.forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    aoEscolher(b);
    const ok = $('#qOk'); if (ok) ok.disabled = false;
    clearTimeout(escolheESegue.t); escolheESegue.t = setTimeout(seguir, 280);
  });
}

// ---------- cartões dos segmentos (foto real só se existir em /img/segmentos, com crédito) ----------
const SEG_CURTO = { mercado: 'Mercado', farmacia: 'Farmácia', varejo: 'Loja', restaurante: 'Restaurante e bar', padaria: 'Padaria e confeitaria',
  salao: 'Salão e barbearia', clinica: 'Clínica e consultório', academia: 'Academia e estúdio', posto: 'Posto de combustível',
  escritorio: 'Escritório e serviços', seguranca: 'Portaria e limpeza', outro: 'Outro negócio' };
const SEG_DESC = { mercado: 'Caixa e reposição todo dia', farmacia: 'Farmacêutico garantido, por lei', varejo: 'Roupas, calçados, shopping',
  restaurante: 'Cozinha garantida no pico', padaria: 'Padeiro todo dia, abre cedo', salao: 'Sexta e sábado mais cheios',
  clinica: 'Recepção garantida', academia: 'Instrutor o dia todo', posto: 'Frentista na pista o tempo todo',
  escritorio: 'Segunda a sexta, 5x2 pronta', seguranca: 'Posto coberto todo dia', outro: 'Você ajusta dias e horários' };
const SEG_COR = { mercado: 'azul', farmacia: 'verde', varejo: 'noite', restaurante: 'sol', padaria: 'sol', salao: 'azul', clinica: 'verde',
  academia: 'noite', posto: 'sol', escritorio: 'azul', seguranca: 'noite', outro: 'cinza' };
const SEG_FOTO = { varejo: 'loja', seguranca: 'portaria' }; // nome do arquivo da foto quando difere da chave
let creditosFotos = null; // só carrega fotos se /img/segmentos/creditos.json existir
function carregaCreditos() {
  if (creditosFotos) return creditosFotos;
  creditosFotos = fetch('/img/segmentos/creditos.json?v=1').then(r => r.ok ? r.json() : {}).catch(() => ({}));
  return creditosFotos;
}
function cartoesSegmento(sel, fotos = {}) {
  return `<div class="q-segs">${SEG_ORDEM.map(k => {
    const s = seg(k), f = SEG_FOTO[k] || k, cr = fotos[f];
    const semana = s.abertos.map((a, i) => `<i class="${a ? 'a' : ''}">${'STQQSSD'[i]}</i>`).join('');
    const dias = s.abertos.filter(Boolean).length;
    return `<button type="button" class="q-seg cor-${SEG_COR[k]} ${sel === k ? 'on' : ''} ${cr ? 'com-foto' : ''}" data-seg="${k}" aria-pressed="${sel === k}">
      <span class="q-seg-faixa">${cr ? `<img src="/img/segmentos/${f}.webp?v=1" alt="" loading="lazy" onerror="this.closest('.q-seg').classList.remove('com-foto');this.nextElementSibling?.remove();this.remove()"><small class="q-credito">Foto: ${esc(cr.credito || '')}</small>` : ''}
        <span class="q-seg-sem">${semana}</span><span class="q-seg-tag">${dias === 7 ? 'Todo dia' : dias + ' dias'} · ${hora(s.abre)}–${hora(s.fecha)}</span></span>
      <span class="q-seg-corpo"><b>${esc(SEG_CURTO[k])}</b><small>${esc(SEG_DESC[k])}</small></span><i class="q-marca" aria-hidden="true"></i></button>`;
  }).join('')}</div>`;
}
// liga os cartões e, se houver fotos com crédito, redesenha com elas
function ligaSegmentos(sel, escolher) {
  const liga = () => escolheESegue($$('[data-seg]'), b => escolher(b.dataset.seg, false), () => escolher(null, true));
  liga();
  carregaCreditos().then(fotos => {
    if (!Object.keys(fotos || {}).length || !$('.q-segs')) return;
    $('.q-segs').outerHTML = cartoesSegmento(sel(), fotos); liga();
  });
}

// ================= cadastro completo da empresa =================
let cd = null, cdI = 0;
const CD_PASSOS = ['oi', 'cnpj', 'empresa', 'porte', 'responsavel', 'endereco', 'negocio', 'tamanho', 'origem'];
const cdChave = () => 'cadastro:' + conta.id;
async function telaCadastro() {
  $('#v-cadastro').innerHTML = '<p class="dica" style="text-align:center;padding:40px">Carregando…</p>';
  const c = await api('/api/empresa');
  let rascunho = {}; try { rascunho = JSON.parse(ler(cdChave()) || '{}'); } catch {}
  cd = {
    nome: c.nome || '', razao_social: c.razao_social || '', porte: c.porte || '', cnpj: c.cnpj ? Cadastro.mascaraCnpj(c.cnpj) : '', sem_cnpj: !!c.sem_cnpj,
    responsavel: c.responsavel || eu.nome || '', responsavel_cargo: c.responsavel_cargo || '', telefone: Cadastro.mascaraTel(c.telefone || eu.whatsapp || ''),
    cep: c.cep ? Cadastro.mascaraCep(c.cep) : '', endereco: c.endereco || '', uf: c.uf || '', cidade: c.cidade || '',
    segmento: c.segmento || '', funcionarios_qtd: c.funcionarios_qtd || '', unidades_qtd: c.unidades_qtd || 1,
    como_conheceu: c.como_conheceu || '', como_conheceu_outro: c.como_conheceu_outro || '', ...rascunho,
  };
  cdI = c.cadastro_em ? 1 : 0; quizDir = 1;
  cdDesenha();
}
function cdResumo() {
  const P = Cadastro.PORTES, O = Cadastro.ORIGENS;
  return resumoLinhas('Ficha da empresa', [
    ['Nome fantasia', cd.nome], ['Razão social', cd.razao_social], ['Porte', P[cd.porte]?.[0]],
    ['CNPJ', cd.sem_cnpj ? 'Ainda não tem' : cd.cnpj], ['Responsável', cd.responsavel && cd.responsavel_cargo ? `${cd.responsavel} · ${cd.responsavel_cargo}` : cd.responsavel],
    ['Telefone', cd.telefone], ['Cidade', cd.cidade && cd.uf ? `${cd.cidade}/${cd.uf}` : ''], ['Negócio', cd.segmento && SEG_CURTO[cd.segmento]],
    ['Funcionários', cd.funcionarios_qtd ? String(cd.funcionarios_qtd) : ''], ['Unidades', cd.unidades_qtd ? String(cd.unidades_qtd) : ''],
    ['Conheceu por', O[cd.como_conheceu]?.[0]],
  ], '<p class="qr-nota">Esses dados aparecem no fechamento que vai para o contador. Você muda depois em Dados da empresa.</p>');
}
function cdDesenha() {
  const id = CD_PASSOS[cdI], total = CD_PASSOS.length - 1, num = cdI;
  gravar(cdChave(), JSON.stringify(cd));
  const campo = (idc, rot, val, extra = '') => `<label for="${idc}">${rot}</label><input id="${idc}" value="${esc(val)}" ${extra}>`;
  let corpo = '', botao = 'Continuar', etapa = '', desl = false;
  if (id === 'oi') {
    $('#v-cadastro').innerHTML = `<div class="quiz-wrap"><div class="quiz-card quiz-oi">
      <span class="q-selo">Pagamento confirmado</span>
      <h1>Boas-vindas, ${esc(nomeCurto(eu.nome))}! Agora o <mark>cadastro da empresa</mark>.</h1>
      <p>São 8 passos rápidos. Com esses dados a escala sai do jeito do seu negócio e o fechamento vai certinho para o contador.</p>
      <ol class="oi-passos"><li><b>1</b>Cadastro da empresa<small>uns 2 minutos</small></li><li><b>2</b>Funcionamento e equipe<small>uns 2 minutos</small></li><li><b>3</b>Escala pronta<small>dentro da nova lei</small></li></ol>
      <div class="q-rodape"><button class="btn q-continuar" id="qOk" type="button">Começar o cadastro<span aria-hidden="true" class="q-seta">→</span></button></div>
    </div></div>`;
    $('#qOk').onclick = () => { quizDir = 1; cdI = 1; cdDesenha(); };
    return;
  }
  if (id === 'empresa') {
    etapa = 'Empresa';
    corpo = `<h1>Como se chama a sua <mark>empresa</mark>?</h1><p class="sub">O nome fantasia é o que aparece para a equipe. A razão social é a do CNPJ.</p>
      ${campo('cdNome', 'Nome fantasia', cd.nome, 'placeholder="Ex.: Mercadinho Bom Preço" autocomplete="organization"')}
      ${campo('cdRazao', 'Razão social', cd.razao_social, 'placeholder="Ex.: Bom Preço Comércio de Alimentos LTDA"')}`;
  } else if (id === 'porte') {
    etapa = 'Empresa';
    corpo = `<h1>Qual o <mark>porte</mark> da empresa?</h1><p class="sub">Está no cartão do CNPJ. Se não souber, escolha "Não sei".</p>
      <div class="q-ops">${Object.entries(Cadastro.PORTES).map(([k, [n, d]]) => opcao('data-porte', k, n, d, cd.porte === k)).join('')}</div>`;
    desl = !cd.porte;
  } else if (id === 'cnpj') {
    etapa = 'Empresa';
    corpo = `<h1>Qual o <mark>CNPJ</mark>?</h1><p class="sub">Com o CNPJ, os dados da empresa são preenchidos pela Receita Federal. Vale o CNPJ novo, com letras.</p>
      <label for="cdCnpj">CNPJ</label><input id="cdCnpj" class="q-grande" value="${esc(cd.cnpj)}" placeholder="00.000.000/0000-00" inputmode="text" autocapitalize="characters" autocomplete="off" ${cd.sem_cnpj ? 'disabled' : ''}>
      <p class="q-valida" id="cdCnpjOk"></p><div id="cdCnpjDados" aria-live="polite"></div>
      <label class="q-check"><input type="checkbox" id="cdSemCnpj" ${cd.sem_cnpj ? 'checked' : ''}><span>Ainda não tenho CNPJ<small>Só para MEI que está abrindo agora</small></span></label>`;
  } else if (id === 'responsavel') {
    etapa = 'Contato';
    corpo = `<h1>Quem é o <mark>responsável</mark>?</h1><p class="sub">A pessoa que a gente procura se precisar falar da conta.</p>
      ${campo('cdResp', 'Nome do responsável', cd.responsavel, 'autocomplete="name"')}
      <label>Cargo</label><div class="q-chips-op">${Cadastro.CARGOS.map(x => `<button type="button" data-cargo="${esc(x)}" class="${cd.responsavel_cargo === x ? 'on' : ''}">${esc(x)}</button>`).join('')}</div>
      ${campo('cdTel', 'Telefone ou WhatsApp', cd.telefone, 'inputmode="tel" autocomplete="tel" placeholder="(71) 99999-9999"')}`;
  } else if (id === 'endereco') {
    etapa = 'Endereço';
    corpo = `<h1>Onde fica a <mark>empresa</mark>?</h1><p class="sub">Pelo CEP a gente já coloca os feriados do seu estado e da sua cidade.</p>
      <label for="cdCep">CEP</label><div class="q-cep"><input id="cdCep" class="q-grande" value="${esc(cd.cep)}" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000"><span id="cdCepSt" class="dica"></span></div>
      <div id="cdEndBox" class="${cd.uf ? '' : 'hide'}">
        <div class="lado-uf"><div><label for="cdUf">Estado</label><select id="cdUf"><option value="">—</option>${Escala.UFS.map(u => `<option ${cd.uf === u ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
        <div>${campo('cdCidade', 'Cidade', cd.cidade, 'autocomplete="address-level2"')}</div></div>
        ${campo('cdEnd', 'Endereço (rua, número, bairro) — se quiser', cd.endereco, 'autocomplete="street-address"')}
      </div>
      <p class="dica" style="margin-top:10px"><button type="button" class="link" id="cdSemCep">Não sei o CEP</button></p>`;
  } else if (id === 'negocio') {
    etapa = 'Seu negócio';
    corpo = `<h1>Qual é o seu <mark>negócio</mark>?</h1><p class="sub">Cada negócio tem suas regras de escala. A gente já traz os dias, o horário e as funções certas.</p>
      ${cartoesSegmento(cd.segmento)}`;
    desl = !cd.segmento;
  } else if (id === 'tamanho') {
    etapa = 'Seu negócio';
    corpo = `<h1>Quantas <mark>pessoas</mark> trabalham na empresa?</h1><p class="sub">Conte os funcionários de todas as lojas. Aproximado está bom.</p>
      <div class="q-numeros">
        <div class="q-num"><span>Funcionários</span><div class="contador-mais"><button type="button" data-n="funcionarios_qtd" data-d="-1" aria-label="Menos">−</button><input id="cdFunc" inputmode="numeric" value="${esc(cd.funcionarios_qtd)}" placeholder="0" aria-label="Funcionários"><button type="button" data-n="funcionarios_qtd" data-d="1" aria-label="Mais">+</button></div></div>
        <div class="q-num"><span>Lojas ou unidades</span><div class="contador-mais"><button type="button" data-n="unidades_qtd" data-d="-1" aria-label="Menos">−</button><input id="cdUnid" inputmode="numeric" value="${esc(cd.unidades_qtd)}" aria-label="Unidades"><button type="button" data-n="unidades_qtd" data-d="1" aria-label="Mais">+</button></div><small>filiais, setores ou lojas com escala própria</small></div>
      </div>`;
  } else if (id === 'origem') {
    etapa = 'Último passo';
    corpo = `<h1>Como você conheceu a <mark>Sua Escala 5x2</mark>?</h1><p class="sub">Ajuda a gente a chegar em mais empresários como você.</p>
      <div class="q-ops duas">${Object.entries(Cadastro.ORIGENS).map(([k, [n, d]]) => opcao('data-origem', k, n, d, cd.como_conheceu === k)).join('')}</div>
      <div id="cdOutroBox" class="${cd.como_conheceu === 'outro' ? '' : 'hide'}">${campo('cdOutro', 'Onde?', cd.como_conheceu_outro, 'placeholder="Ex.: grupo de WhatsApp da associação"')}</div>`;
    botao = 'Salvar e montar a escala';
  }
  const restam = total - num + 1, min = Math.max(1, Math.round(restam * 15 / 60));
  $('#v-cadastro').innerHTML = quizMoldura({ etapa, num, total, minutos: `~${min} min`, corpo, botao, botaoDesligado: desl, resumo: cdResumo() });
  window.scrollTo(0, 0);
  const erro = m => { $('#wzErro').textContent = m; };
  const prox = () => { quizDir = 1; cdI = Math.min(cdI + 1, CD_PASSOS.length - 1); cdDesenha(); };
  $('#qVolta').onclick = () => { quizDir = -1; if (cdI <= 1) return conta.cadastro_ok ? ir(equipes.length ? 'inicio' : 'comecar') : (cdI = 0, cdDesenha()); cdI--; cdDesenha(); };
  const ok = fn => { if ($('#qOk')) $('#qOk').onclick = fn; $$('#v-cadastro input:not([type=checkbox])').forEach(i => i.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); fn(); } })); };
  const foco = s => { const x = $(s); if (x && matchMedia('(min-width: 700px)').matches) x.focus(); };
  if (id === 'empresa') {
    foco('#cdNome');
    ok(() => {
      cd.nome = $('#cdNome').value.trim(); cd.razao_social = $('#cdRazao').value.trim();
      if (!cd.nome) return erro('Escreva o nome fantasia.'), $('#cdNome').focus();
      if (!cd.razao_social) return erro('Escreva a razão social, como está no CNPJ. No MEI, costuma ser o seu nome.'), $('#cdRazao').focus();
      prox();
    });
  }
  if (id === 'porte') { escolheESegue($$('[data-porte]'), b => { cd.porte = b.dataset.porte; if (cd.porte !== 'mei') cd.sem_cnpj = false; }, prox); ok(prox); }
  if (id === 'cnpj') {
    const inp = $('#cdCnpj'), st = $('#cdCnpjOk');
    const confere = () => {
      const v = Cadastro.soCnpj(inp.value);
      st.className = 'q-valida';
      if (cd.sem_cnpj) st.textContent = '';
      else if (v.length < 14) st.textContent = v.length ? `${14 - v.length} caracteres faltando` : '';
      else if (Cadastro.cnpjValido(v)) { st.textContent = 'CNPJ confere'; st.classList.add('ok'); }
      else { st.textContent = 'Esse CNPJ não confere. Veja se algum número ficou trocado.'; st.classList.add('ruim'); }
    };
    // CNPJ válido: busca os dados na Receita e preenche o que ainda estiver em branco (tudo continua editável nos próximos passos)
    const busca = async () => {
      const v = Cadastro.soCnpj(inp.value), box = $('#cdCnpjDados');
      if (cd.sem_cnpj || v.length < 14 || !Cadastro.cnpjValido(v) || busca.ultimo === v) return;
      busca.ultimo = v; box.innerHTML = '<p class="dica">Buscando dados do CNPJ…</p>';
      try {
        const d = await api('/api/cnpj/' + v);
        if (Cadastro.soCnpj(inp.value) !== v) return;
        const poe = (k, val) => { if (val && !cd[k]) cd[k] = val; };
        poe('razao_social', d.razao_social); poe('nome', d.nome_fantasia || d.razao_social); poe('porte', d.porte);
        poe('cep', d.cep ? Cadastro.mascaraCep(d.cep) : ''); poe('uf', d.uf); poe('cidade', d.cidade); poe('endereco', d.endereco);
        if (d.segmento && d.segmento !== 'outro') poe('segmento', d.segmento);
        poe('telefone', d.telefone ? Cadastro.mascaraTel(d.telefone) : '');
        gravar(cdChave(), JSON.stringify(cd));
        box.innerHTML = `<div class="nota ok"><b>${esc(d.nome_fantasia || d.razao_social)}</b><br>Dados preenchidos pela Receita Federal. Confira e altere se precisar.</div>`
          + (d.situacao && d.situacao !== 'ATIVA' ? `<div class="nota">Situação cadastral na Receita: <b>${esc(d.situacao)}</b>. Confira se é o CNPJ certo.</div>` : '');
        const r = $('.quiz-resumo'); if (r) r.innerHTML = cdResumo();
      } catch { box.innerHTML = '<p class="dica">Não encontramos os dados deste CNPJ agora. Preencha nos próximos passos.</p>'; }
    };
    inp.oninput = () => { const p = inp.selectionStart === inp.value.length; inp.value = Cadastro.mascaraCnpj(inp.value); if (p) inp.selectionStart = inp.selectionEnd = inp.value.length; cd.cnpj = inp.value; confere(); busca(); };
    confere(); busca(); if (!cd.sem_cnpj) foco('#cdCnpj');
    $('#cdSemCnpj').onchange = e => { cd.sem_cnpj = e.target.checked; inp.disabled = cd.sem_cnpj; if (cd.sem_cnpj) { inp.value = ''; cd.cnpj = ''; cd.porte = 'mei'; $('#cdCnpjDados').innerHTML = ''; } confere(); };
    ok(() => {
      if (cd.sem_cnpj) return prox();
      if (!Cadastro.cnpjValido(inp.value)) return erro(Cadastro.soCnpj(inp.value).length < 14 ? 'Complete o CNPJ.' : 'Esse CNPJ não confere. Veja se algum número ficou trocado.'), inp.focus();
      prox();
    });
  }
  if (id === 'responsavel') {
    $$('[data-cargo]').forEach(b => b.onclick = () => { cd.responsavel_cargo = b.dataset.cargo; $$('[data-cargo]').forEach(x => x.classList.toggle('on', x === b)); const r = $('.quiz-resumo'); if (r) r.innerHTML = cdResumo(); });
    $('#cdTel').oninput = e => { e.target.value = Cadastro.mascaraTel(e.target.value); };
    ok(() => {
      cd.responsavel = $('#cdResp').value.trim(); cd.telefone = $('#cdTel').value;
      if (!cd.responsavel) return erro('Escreva o nome do responsável.');
      if (!cd.responsavel_cargo) return erro('Escolha o cargo.');
      if (Cadastro.soNum(cd.telefone).length < 10) return erro('Coloque o telefone com DDD.'), $('#cdTel').focus();
      prox();
    });
  }
  if (id === 'endereco') {
    const inp = $('#cdCep'), st = $('#cdCepSt');
    const abre = () => $('#cdEndBox').classList.remove('hide');
    let ultimo = '';
    const busca = async () => {
      const d = Cadastro.soNum(inp.value); if (d.length !== 8 || d === ultimo) return; ultimo = d;
      const uf = Cadastro.ufDoCep(d);
      if (!uf) { st.textContent = 'CEP não encontrado'; return; }
      st.textContent = 'Procurando…'; abre(); $('#cdUf').value = uf; cd.uf = uf;
      try {
        const r = await api('/api/cep/' + d);
        $('#cdUf').value = cd.uf = r.uf;
        if (r.cidade) { $('#cdCidade').value = cd.cidade = r.cidade; st.textContent = `${r.cidade}/${r.uf}`; } else { st.textContent = r.uf; $('#cdCidade').focus(); }
        if (r.endereco && !$('#cdEnd').value) $('#cdEnd').value = r.endereco + ', ';
      } catch { st.textContent = uf; }
    };
    inp.oninput = () => { inp.value = Cadastro.mascaraCep(inp.value); cd.cep = inp.value; busca(); };
    $('#cdSemCep').onclick = () => { window.open('https://buscacepinter.correios.com.br/', '_blank', 'noopener'); abre(); };
    foco('#cdCep');
    ok(() => {
      cd.cep = inp.value; cd.uf = $('#cdUf').value; cd.cidade = $('#cdCidade').value.trim(); cd.endereco = $('#cdEnd').value.trim().replace(/,\s*$/, '');
      if (Cadastro.soNum(cd.cep).length !== 8) return erro('Coloque o CEP com 8 números.'), inp.focus();
      abre();
      if (!cd.uf) return erro('Escolha o estado.');
      if (!cd.cidade) return erro('Escreva a cidade.'), $('#cdCidade').focus();
      prox();
    });
  }
  if (id === 'negocio') { ligaSegmentos(() => cd.segmento, (k, seguir) => { if (k) cd.segmento = k; if (seguir) prox(); }); ok(prox); }
  if (id === 'tamanho') {
    const mapa = { funcionarios_qtd: '#cdFunc', unidades_qtd: '#cdUnid' };
    $$('[data-n]').forEach(b => b.onclick = () => { const i = $(mapa[b.dataset.n]); i.value = Math.max(b.dataset.n === 'unidades_qtd' ? 1 : 0, (+i.value || 0) + +b.dataset.d); });
    $$('.q-num input').forEach(i => i.oninput = () => { i.value = i.value.replace(/\D/g, '').slice(0, 6); });
    ok(() => {
      cd.funcionarios_qtd = +$('#cdFunc').value || 0; cd.unidades_qtd = +$('#cdUnid').value || 0;
      if (cd.funcionarios_qtd < 1) return erro('Quantos funcionários? Pelo menos 1.'), $('#cdFunc').focus();
      if (cd.unidades_qtd < 1) return erro('Quantas lojas ou unidades? Pelo menos 1.');
      prox();
    });
  }
  if (id === 'origem') {
    $$('[data-origem]').forEach(b => b.onclick = () => {
      cd.como_conheceu = b.dataset.origem; $$('[data-origem]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      $('#cdOutroBox').classList.toggle('hide', cd.como_conheceu !== 'outro'); if (cd.como_conheceu === 'outro') $('#cdOutro').focus();
    });
    ok(async () => {
      if (!cd.como_conheceu) return erro('Escolha uma opção.');
      cd.como_conheceu_outro = $('#cdOutro').value.trim();
      const b = $('#qOk'); b.disabled = true;
      try {
        await api('/api/empresa/cadastro', { method: 'POST', body: cd });
        gravar(cdChave(), '');
        conta = await api('/api/conta'); eu = await api('/api/eu'); pintaTopo();
        window.rastrear?.('CompleteRegistration');
        toast('Cadastro da empresa salvo.');
        ir(equipes.length ? 'inicio' : 'comecar');
      } catch (err) {
        b.disabled = false;
        // volta para o passo do campo com problema
        const passo = { nome: 'empresa', razao_social: 'empresa', porte: 'porte', cnpj: 'cnpj', responsavel: 'responsavel', responsavel_cargo: 'responsavel', telefone: 'responsavel',
          cep: 'endereco', uf: 'endereco', cidade: 'endereco', segmento: 'negocio', funcionarios_qtd: 'tamanho', unidades_qtd: 'tamanho' }[err.campo];
        if (passo) { quizDir = -1; cdI = CD_PASSOS.indexOf(passo); cdDesenha(); }
        $('#wzErro').textContent = err.message;
      }
    });
  }
}

// ================= tela inicial (área do cliente) =================
let progresso = null;
const MOCK_NOMES = () => { const n = (funcs || []).map(f => nomeCurto(f.nome)).filter(Boolean); return n.length >= 4 ? n : ['Ana', 'Bruno', 'Carla', 'Diego', 'Eva']; };
function slidesApp() {
  const n = MOCK_NOMES(), un = atual?.nome || conta.empresa || 'Sua loja';
  const chip = (t, c) => `<span class="mk-nome ${c}">${esc(t)}</span>`;
  return [
    { tit: 'Veja a semana', txt: 'Abriu o app, está lá: quem trabalha e quem folga em cada dia. A escala se monta sozinha.', ir: 'escala', btn: 'Abrir a semana',
      mock: `<div class="mk-dias">${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => { const dt = soma(segundaDe(hojeIso()), i); return `<span class="${dt === hojeIso() ? 'on' : ''}">${d}<b>${+dt.slice(8)}</b></span>`; }).join('')}</div>
        <div class="mk-grupo"><small>Trabalham</small>${chip(n[0], 'T')}${chip(n[1], 'T')}${chip(n[2], 'T')}</div><div class="mk-grupo"><small>Folgam</small>${chip(n[3], 'F')}</div>` },
    { tit: 'Toque no nome', txt: 'Para trocar a folga de dia ou lançar falta, atestado e férias. A escala se ajusta.', ir: 'escala', btn: 'Experimentar',
      mock: `<div class="mk-folha"><b>${esc(n[0])} trabalha na terça</b><span>Dar folga neste dia</span><span>${esc(n[0])} faltou</span><span>${esc(n[0])} trouxe atestado</span></div>` },
    { tit: 'Baixe ou envie', txt: 'PDF, Excel, imagem para o WhatsApp ou impressão para o mural. Tudo pronto, com a parte da lei.', ir: 'tabela', btn: 'Ver as opções',
      mock: `<div class="mk-saidas">${['whatsapp', 'pdf', 'excel', 'sheets', 'jpg', 'imprimir'].map(f => `<span><img src="/img/formatos/${f}.svg?v=20261115b" alt="" width="34" height="34"></span>`).join('')}</div>` },
    { tit: 'Link da equipe', txt: 'Mande um link no grupo. Cada funcionário toca no próprio nome e vê as folgas, sem instalar nada.', ir: 'tabela', btn: 'Mandar o link',
      mock: `<div class="mk-link"><small>${esc(un)} · escala</small>${n.slice(0, 3).map((x, i) => `<div><b>${esc(x)}</b><span>Folga ${['sáb e dom', 'seg e ter', 'qua e qui'][i]}</span></div>`).join('')}</div>` },
    { tit: 'Seu contador', txt: 'Dê acesso ao contador. Ele vê faltas, atestados e baixa o fechamento do mês sem você mandar planilha.', ir: conta.papel === 'dono' ? 'acessos' : 'fechamento', btn: conta.papel === 'dono' ? 'Dar acesso' : 'Ver o fechamento',
      mock: `<div class="mk-tab"><div class="h"><span>Pessoa</span><span>Dias</span><span>Faltas</span></div>${n.slice(0, 3).map((x, i) => `<div><span>${esc(x)}</span><span>${[22, 21, 22][i]}</span><span>${[0, 1, 0][i]}</span></div>`).join('')}</div>` },
  ];
}
// Área de membros no estilo "streaming": topo escuro com os banners, e no máximo 4 fileiras de cartões que arrastam.
// Área de membros no estilo streaming, enxuta: faixa de banners, UM cartão de próximo passo e duas fileiras (Aulas, Seus materiais).
function fileira(id, titulo, cartoes, extra = '') {
  if (!cartoes.length) return '';
  return `<section class="nf-fila" aria-labelledby="${id}"><div class="nf-fila-topo"><h2 id="${id}">${titulo}</h2>${extra}</div>
    <div class="nf-trilho" role="list">${cartoes.join('')}</div></section>`;
}
// capa 16:9 (o título já está na imagem); embaixo, só um subtítulo curto
const capa = (arq, eager = false) => `<img src="/img/capas/${arq}.webp?v=1" alt="" width="960" height="540" ${eager ? '' : 'loading="lazy"'} decoding="async">`;
const cartaoImg = ({ ir, href, img, tit, sub, cls = '', alvo }) => {
  const tag = href ? `a href="${esc(href)}"${alvo ? ' target="_blank" rel="noopener"' : ''}` : `button type="button" data-ir="${ir}"`;
  return `<${tag} class="nf-card ${cls}" role="listitem" aria-label="${esc(tit)}${sub ? ' · ' + esc(sub) : ''}">
    <span class="nf-arte capa">${img}</span>${sub ? `<span class="nf-txt"><small>${esc(sub)}</small></span>` : ''}</${href ? 'a' : 'button'}>`;
};
const CAPA_MAT = { kit_rh: 'mat-kit', calculadora: 'mat-calc', plaquinhas: 'mat-placas' };
const reais = v => 'R$ ' + Number(v).toFixed(2).replace('.', ',');
// a ordem do próximo passo: gerar → publicar → identificar → contabilidade → fechar competência
function proximoPasso(p) {
  const dono = conta.papel === 'dono', ed = podeEditar();
  const auto = funcs.some(f => f.cargo && !cargoVisivel(f));
  const d = new Date(), fimMes = d.getDate() >= new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - 2;
  if (!p.unidades) return dono ? { k: 'gerar', tit: 'Gerar escala', txt: 'Dias de funcionamento, funções e quantidade de colaboradores. A escala é gerada dentro da lei.', btn: 'Gerar escala', ir: 'comecar' } : null;
  if (ed && !p.escala_enviada) return { k: 'publicar', tit: 'Publicar escala', txt: 'Compartilhe com a equipe por WhatsApp, link, PDF ou impressão.', btn: 'Publicar escala', ir: 'escala/publicar' };
  if (ed && auto) return { k: 'identificar', tit: 'Identificar colaboradores', txt: 'Substitua "Caixa 1", "Caixa 2" pelo nome de cada colaborador.', btn: 'Identificar colaboradores', ir: 'colaboradores' };
  if (dono && !p.contador) return { k: 'contabilidade', tit: 'Liberar acesso da contabilidade', txt: 'A contabilidade acompanha a escala e recebe o fechamento, sem custo adicional.', btn: 'Liberar acesso', ir: 'fechamento/contabilidade' };
  if (ed && fimMes) return { k: 'fechar', tit: 'Fechar competência', txt: 'Confira o mês de referência e envie para a contabilidade.', btn: 'Fechar competência', ir: 'fechamento' };
  return null;
}
async function telaInicio() {
  const v = $('#v-inicio'), dono = conta.papel === 'dono', cont = conta.papel === 'contador';
  const [p, extras] = await Promise.all([api('/api/inicio'), api('/api/extras').catch(() => [])]);
  progresso = p;
  // faixa de banners em imagem
  const bannersImg = [
    { k: 'escala', ir: p.unidades ? 'escala' : 'comecar', alt: 'Sua escala 5x2 pronta em 2 minutos. Responda umas perguntas e a semana sai dentro da nova lei.' },
    { k: 'lei', ir: 'aula', alt: 'Aulas: a nova lei em poucos minutos.' },
    !cont && { k: 'enviar', ir: 'escala/publicar', alt: 'Publique a escala por WhatsApp, PDF, Excel ou link. Cada colaborador vê as próprias folgas no celular.' },
    { k: 'kit', ir: 'materiais', alt: 'Kit RH, calculadora e plaquinhas: termo aditivo, folha de ponto e avisos prontos para imprimir.' },
    dono && { k: 'contador', ir: 'fechamento/contabilidade', alt: 'Acesso da contabilidade, sem custo: acompanha a escala e recebe o fechamento.' },
  ].filter(Boolean);
  let faixaFechada = false; try { faixaFechada = sessionStorage.getItem('faixaFechada') === '1'; } catch {}
  const carrosselImg = faixaFechada ? '' : `<section class="bn-car" aria-roledescription="carrossel" aria-label="Destaques">
      <div class="bn-trilho" id="bnTrilho">${bannersImg.map((b, i) => `<a class="bn-item" href="#${b.ir}" data-ir="${b.ir}" aria-roledescription="slide" aria-label="${i + 1} de ${bannersImg.length}">
        <picture><source media="(max-width:760px)" srcset="/img/banners/${b.k}-cel.webp?v=3" width="1200" height="400">
        <img src="/img/banners/${b.k}-pc.webp?v=3" alt="${esc(b.alt)}" width="2400" height="300" ${i ? 'loading="lazy"' : 'loading="eager" fetchpriority="high"'} decoding="async"></picture></a>`).join('')}</div>
      <div class="bn-ctl"><span id="bnN" aria-live="polite">1/${bannersImg.length}</span><button type="button" id="bnAnt" aria-label="Destaque anterior">‹</button><button type="button" id="bnProx" aria-label="Próximo destaque">›</button><button type="button" class="bn-x" id="bnX" aria-label="Esconder os destaques">×</button></div>
    </section>`;
  // um cartão de próximo passo, com a capa do passo
  const ps = proximoPasso(p);
  const passo = ps ? `<section class="prox" aria-labelledby="tProx"><span class="prox-capa">${capa('passo-' + ps.k, true)}</span>
      <div class="prox-txt"><em class="nf-etq">Próximo passo</em><h2 id="tProx">${ps.tit}</h2><p>${ps.txt}</p><button class="btn" data-ir="${ps.ir}">${ps.btn} <span aria-hidden="true">→</span></button></div></section>` : '';
  // Aulas: o vídeo do app e as 8 da nova lei
  const lic = typeof licoes === 'function' ? licoes() : [];
  const aulas = [cartaoImg({ ir: 'aula/app', img: capa('aula-01'), tit: 'Aula 1: Como usar o app', sub: 'Vídeo · 1 min' }),
    ...lic.map((l, i) => cartaoImg({ ir: `aula/${i}`, img: capa('aula-' + String(i + 2).padStart(2, '0')), tit: `Aula ${i + 2}: ${l.tit.replace(/<[^>]+>/g, '')}`, sub: '1 min' }))];
  // Seus materiais (liberado: baixar; não liberado: preço)
  const mats = (Array.isArray(extras) ? extras : []).map(x => cartaoImg({
    ...(x.comprado ? { ir: 'materiais' } : { href: x.checkout, alvo: true }),
    img: capa(CAPA_MAT[x.extra] || 'mat-kit'), tit: x.nome, sub: x.comprado ? 'Liberado' : reais(x.preco) }));
  v.innerHTML = `<div class="nf">
    <header class="nf-oi"><p>Olá, <b>${esc(nomeCurto(eu.nome))}</b></p><h1>${esc(conta.empresa || 'Sua empresa')}</h1>
      <p class="nf-data">${dataLonga(hojeIso())}${atual ? ` · ${esc(atual.nome)}` : ''}</p></header>
    ${carrosselImg}${passo}
    ${fileira('fAula', 'Aulas', aulas, '<button class="nf-ver" data-ir="aula">Ver aulas</button>')}
    ${fileira('fMat', 'Seus materiais', mats, '<button class="nf-ver" data-ir="materiais">Ver todos</button>')}
  </div>`;
  ligaCarrosselImg(); animaContadores(v);
}
// escala mandada para a equipe (qualquer saída: WhatsApp, PDF, Excel, link...) marca o passo do progresso
let enviadaMarcada = false;
window.marcaEnviada = () => {
  if (enviadaMarcada || !podeEditar() || progresso?.escala_enviada) return;
  enviadaMarcada = true; api('/api/inicio/enviada', { method: 'POST' }).catch(() => { enviadaMarcada = false; });
};

// ================= menu lateral (computador) e gaveta (celular) =================
// O mesmo #lateral é a barra fixa no computador e, abaixo de 1024px, a gaveta que desliza da esquerda.
// Cinco itens, iguais nos dois: Início · Escala · Colaboradores · Fechamento · Mais.
function itensMenu() {
  const mc = ehModoContador(), cont = conta.papel === 'contador', dono = conta.papel === 'dono', ed = podeEditar();
  // grupo: [rota principal, título, subitens [[rota, título]]]
  const escala = ['escala', 'Escala', [['escala/semana', 'Semana'], ['escala', 'Dia'], ['escala/pessoa', 'Por colaborador'], ['escala/mes', 'Mês'], ['escala/agenda', 'Agenda'], ['escala/publicar', 'Publicar escala']]];
  const colab = ['colaboradores', 'Colaboradores', [['colaboradores', 'Lista'], ['colaboradores/ausencias', 'Ausências e férias']]];
  const fech = ['fechamento', 'Fechamento', [['fechamento', 'Fechar competência'], ...(dono ? [['fechamento/contabilidade', 'Acesso da contabilidade'], ['empresa/historico', 'Histórico']] : [])]];
  const config = ['configuracoes', 'Configurações', [...(!mc && ed ? [['funcionamento', 'Funcionamento']] : []), ['unidades', 'Unidades e empresas'], ...(dono ? [['empresa', 'Dados da empresa']] : []),
    ['conta', 'Minha conta'], ['instalar', 'Tela inicial']]];
  const principal = mc ? [['contador', 'Suas empresas']] : cont ? [fech, escala, colab] : [['inicio', 'Início'], escala, colab, fech];
  const recursos = [['aula', 'Aulas'], ['materiais', 'Seus materiais'], ...(mc || cont ? [] : [['indique', 'Indique para empresários']])];
  return { principal, recursos, config };
}
const gruposAbertos = () => { try { return new Set(JSON.parse(ler('menuAberto') || '[]')); } catch { return new Set(); } };
function pintaLateral() {
  const el = $('#lateral'); if (!el) return;
  const mc = ehModoContador(), { principal, recursos, config } = itensMenu(), abertos = gruposAbertos();
  const ini = (eu.nome || eu.email || '?').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
  const bt = ([r, t], cls = '') => `<button type="button" class="lat-item ${cls}" data-ir="${r}" data-lat="${r}">${t}</button>`;
  const item = x => {
    if (!Array.isArray(x[2])) return bt(x);
    const [r, t, subs] = x, aberto = abertos.has(r);
    return `<div class="lat-grupo ${aberto ? 'aberto' : ''}" data-grupo="${r}">
      <div class="lat-gl">${bt([r, t], 'lat-g')}<button type="button" class="lat-chevb" aria-expanded="${aberto}" aria-controls="lg-${r}" aria-label="Mostrar opções de ${t}"><i class="lat-chev" aria-hidden="true"></i></button></div>
      <div class="lat-sub" id="lg-${r}" role="group" aria-label="${t}" ${aberto ? '' : 'inert'}><div class="lat-sub-in">${subs.map(s => bt(s, 'sub')).join('')}</div></div></div>`;
  };
  el.innerHTML = `<div class="lat-emp"><img class="lat-logo" src="/img/logo-escuro-completo.webp?v=1" alt="" width="814" height="148"><small>${mc ? 'Escritório' : conta.papel === 'dono' ? 'Empresa' : 'Você é ' + PAPEL[conta.papel].toLowerCase()}</small><b>${esc(mc ? eu.nome : conta.empresa || 'Sua empresa')}</b>
      <div class="lat-quem so-gaveta"><i aria-hidden="true">${typeof meuAvatar === 'function' ? meuAvatar() : esc(ini)}</i><span><b>${esc(eu.nome || '')}</b><em>${esc(eu.email)}</em></span></div>
      <button type="button" class="gav-x so-gaveta" data-fecha-gaveta aria-label="Fechar o menu">×</button></div>
    <nav aria-label="Seções">${principal.map(item).join('')}
      <p class="lat-sec">Recursos</p>${recursos.map(item).join('')}</nav>
    <div class="lat-pe"><nav aria-label="Conta" class="lat-baixo">${item(config)}<button type="button" class="lat-item" data-ajuda>Central de ajuda</button></nav>
      <button type="button" class="lat-sair-btn" data-sair>Sair do app</button><span>${esc(eu.email)}</span></div>`;
}
function abreGrupo(g, abrir, salvar = true) {
  const el = $(`#lateral [data-grupo="${g}"]`); if (!el) return;
  el.classList.toggle('aberto', abrir);
  el.querySelector('.lat-chevb').setAttribute('aria-expanded', String(abrir));
  el.querySelector('.lat-sub').inert = !abrir;
  if (salvar) { const s = gruposAbertos(); abrir ? s.add(g) : s.delete(g); gravar('menuAberto', JSON.stringify([...s])); }
}
// destaca o item da tela atual (o subitem exato quando houver) e abre o grupo dela
function marcaLateral(v, extra) {
  const grupoDe = { funcionamento: 'configuracoes', unidades: 'configuracoes', empresa: extra === 'historico' ? 'fechamento' : 'configuracoes', conta: 'configuracoes', instalar: 'configuracoes', comecar: 'inicio', cadastro: 'inicio' };
  const exato = extra && extra !== 'dia' ? `${v}/${extra}` : v;
  const grupo = grupoDe[v] || v;
  $$('#lateral .lat-item').forEach(b => { b.classList.remove('on'); b.removeAttribute('aria-current'); });
  const sub = $(`#lateral .lat-item.sub[data-lat="${exato}"]`) || (grupoDe[v] ? $(`#lateral .lat-item.sub[data-lat="${v}"]`) : null);
  const alvo = sub || $(`#lateral .lat-item:not(.sub)[data-lat="${grupo}"]`);
  if (alvo) { alvo.classList.add('on'); alvo.setAttribute('aria-current', 'page'); }
  const g = $(`#lateral [data-grupo="${grupo}"]`);
  if (g) { g.querySelector('.lat-g').classList.add('dentro'); if (!g.classList.contains('aberto')) abreGrupo(grupo, true, false); }
}
// Mais › Unidades e empresas: trocar de unidade, criar unidade, trocar ou cadastrar empresa
function telaUnidades() {
  const v = $('#v-unidades'), ed = podeEditar(), mc = ehModoContador();
  const item = (attr, t, d) => `<li><button ${attr}><span>${t}${d ? `<small>${d}</small>` : ''}</span><span class="seta">›</span></button></li>`;
  v.innerHTML = `<button class="voltar" data-ir="configuracoes">‹ Configurações</button><h1>Unidades e empresas</h1>
    <p class="sub">Cada unidade tem os próprios colaboradores e a própria escala.</p>
    ${mc ? '' : `<p class="menu-tit">Unidades de ${esc(conta.empresa || 'sua empresa')}</p><ul class="menu">${equipes.map(e => item(`data-un="${e.id}"`, esc(e.nome), `${plural(+e.total || 0, 'colaborador', 'colaboradores')}${e.id === atual?.id ? ' · aberta agora' : ''}`)).join('')}
      ${ed ? item('data-ir="comecar/unidade"', 'Nova unidade', 'Outra loja, filial ou setor') : ''}</ul>`}
    <p class="menu-tit">Empresas</p><ul class="menu">${eu.contas.length > 1 ? eu.contas.map(c => item(`data-conta="${c.id}"`, esc(c.id === eu.id && eu.contador && !eu.empresa ? 'Meu escritório' : c.empresa || 'Minha empresa'), `${PAPEL[c.papel]}${c.id === conta.id ? ' · aberta agora' : ''}`)).join('') : ''}
      ${item('id="unOutra"', 'Cadastrar outra empresa', 'Outro CNPJ ou a empresa de um cliente')}</ul>`;
  $$('#v-unidades [data-un]').forEach(b => b.onclick = () => trocaUnidade(+b.dataset.un));
  $$('#v-unidades [data-conta]').forEach(b => b.onclick = () => { gravar('conta', b.dataset.conta); gravar('unidade', ''); location.hash = ''; location.reload(); });
  $('#unOutra').onclick = folhaOutraEmpresa;
}

const celular = matchMedia('(max-width: 1023.98px)');
let gavetaVolta = null;
const gavetaAberta = () => document.body.classList.contains('gaveta');
function gavetaEstado() {
  const g = $('#lateral'), aberta = gavetaAberta(), cel = celular.matches;
  g.inert = cel && !aberta;
  if (cel && aberta) { g.setAttribute('role', 'dialog'); g.setAttribute('aria-modal', 'true'); }
  else { g.removeAttribute('role'); g.removeAttribute('aria-modal'); }
  $('#btnMenu').setAttribute('aria-expanded', String(aberta));
  $('#btnMenu').setAttribute('aria-label', aberta ? 'Fechar o menu' : 'Abrir o menu');
  $('#principal').inert = cel && aberta;
}
function abreGaveta() {
  if (!celular.matches || document.body.classList.contains('modo-foco') || gavetaAberta()) return;
  gavetaVolta = document.activeElement;
  document.body.classList.add('gaveta'); gavetaEstado();
  const g = $('#lateral'); g.scrollTop = 0;
  (g.querySelector('nav [aria-current]') || g.querySelector('nav button'))?.focus({ preventScroll: true });
}
function fechaGaveta(devolveFoco = true) {
  if (!gavetaAberta()) return;
  document.body.classList.remove('gaveta');
  const g = $('#lateral'); g.style.transform = ''; g.classList.remove('arrastando'); $('#gavFundo').style.opacity = '';
  gavetaEstado();
  if (devolveFoco) {
    const volta = gavetaVolta && document.contains(gavetaVolta) && gavetaVolta.offsetParent && !g.contains(gavetaVolta) ? gavetaVolta : $('#btnMenu');
    volta.focus({ preventScroll: true });
  }
}
// liga a gaveta depois que app.js define $ e sair()
document.addEventListener('DOMContentLoaded', () => {
  $('#btnMenu').onclick = () => (gavetaAberta() ? fechaGaveta() : abreGaveta());
  $('#gavFundo').onclick = () => fechaGaveta();
  $('#lateral').addEventListener('click', e => {
    if (e.target.closest('[data-fecha-gaveta]')) fechaGaveta();
    else if (e.target.closest('[data-sair]')) sair();
    else if (e.target.closest('.lat-chevb')) { const g = e.target.closest('.lat-grupo'); abreGrupo(g.dataset.grupo, !g.classList.contains('aberto')); }
    else if (e.target.closest('.lat-g')) { const g = e.target.closest('.lat-grupo'); abreGrupo(g.dataset.grupo, true); }
    else if (e.target.closest('[data-ajuda]')) { fechaGaveta(); if (typeof window.abrirSuporte === 'function') window.abrirSuporte(); else location.href = '/ajuda'; }
  });
  // menu do usuário no topo (computador): Minha conta e Sair
  const bu = $('#btnUser'), mu = $('#menuUser');
  const fechaMu = () => { mu.hidden = true; bu.setAttribute('aria-expanded', 'false'); };
  bu.onclick = e => { e.stopPropagation(); const abre = mu.hidden; mu.hidden = !abre; bu.setAttribute('aria-expanded', String(abre)); if (abre) mu.querySelector('button')?.focus(); };
  document.addEventListener('click', e => { if (!mu.hidden && !mu.contains(e.target)) fechaMu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mu.hidden) { fechaMu(); bu.focus(); } });
  mu.addEventListener('click', e => { if (e.target.closest('[data-sair]')) sair(); fechaMu(); });
  celular.addEventListener('change', () => { if (!celular.matches) fechaGaveta(false); gavetaEstado(); });
  document.addEventListener('keydown', e => {
    if (!gavetaAberta()) return;
    if (e.key === 'Escape') { e.preventDefault(); fechaGaveta(); return; }
    if (e.key !== 'Tab') return;
    // foco preso dentro da gaveta
    const f = [...$('#lateral').querySelectorAll('button, a[href]')].filter(x => !x.disabled && x.offsetParent);
    if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
  });
  // arrastar para a esquerda fecha (a gaveta acompanha o dedo)
  (() => {
    let x0 = 0, y0 = 0, dx = 0, t0 = 0, modo = null;
    const g = $('#lateral'), fundo = $('#gavFundo');
    const comeca = e => { if (!gavetaAberta()) return; const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; dx = 0; t0 = Date.now(); modo = null; };
    const move = e => {
      if (!gavetaAberta() || modo === 'v') return;
      const t = e.touches[0], ddx = t.clientX - x0, ddy = t.clientY - y0;
      if (!modo) {
        if (Math.abs(ddx) < 8 && Math.abs(ddy) < 8) return;
        modo = Math.abs(ddx) > Math.abs(ddy) && ddx < 0 ? 'h' : 'v';
        if (modo === 'v') return;
        g.classList.add('arrastando');
      }
      dx = Math.min(0, ddx);
      g.style.transform = `translateX(${dx}px)`;
      fundo.style.opacity = String(Math.max(0, 1 + dx / g.offsetWidth));
      e.preventDefault();
    };
    const fim = () => {
      if (modo !== 'h') { modo = null; return; }
      modo = null; g.classList.remove('arrastando');
      if (dx < -g.offsetWidth * 0.3 || (dx < -30 && Date.now() - t0 < 250)) fechaGaveta();
      else { g.style.transform = ''; fundo.style.opacity = ''; }
    };
    [g, fundo].forEach(el => {
      el.addEventListener('touchstart', comeca, { passive: true });
      el.addEventListener('touchmove', move, { passive: false });
      el.addEventListener('touchend', fim);
      el.addEventListener('touchcancel', fim);
    });
  })();
  gavetaEstado();
});

// ---------- animações pequenas ----------
const semMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// números que contam até o valor (só o texto muda; nada de layout)
function animaContadores(raiz) {
  if (!raiz || semMovimento()) return;
  raiz.querySelectorAll('[data-conta]').forEach(el => {
    const alvo = +el.dataset.conta; if (!(alvo > 0)) return;
    const t0 = performance.now(), dur = Math.min(900, 400 + alvo * 30);
    const passo = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(alvo * e); if (k < 1) requestAnimationFrame(passo); };
    el.textContent = '0'; requestAnimationFrame(passo);
  });
}
// esqueleto com brilho enquanto a semana carrega
const esqueletoSemana = () => `<div class="esq" aria-busy="true" aria-label="Carregando a escala"><i style="--h:56px"></i>
  <div class="esq-dias">${'<i style="--h:56px"></i>'.repeat(7)}</div><i style="--h:22px;width:60%"></i>
  <i style="--h:120px"></i><i style="--h:90px"></i></div>`;

// ================= "Como a escala foi montada" (fica no fim da Escala) =================
// O padrão por função em números, o rodízio do domingo e os ajustes que a lei obrigou. A liberação futura passa por podePersonalizar().
function podePersonalizar(c) { return !!c; } // hoje liberado para todos (preço do plano ainda não definido)
const ddmm = d => `${d.slice(8)}/${d.slice(5, 7)}`;
function htmlComoMontada(e, si) {
  const sem = e.dados[si] || e.dados[0], fs = e.funcionarios, ab = e.abertos;
  let funcoes = (atual.funcoes || []).filter(f => f.n > 0);
  if (!funcoes.length) { // unidade antiga, sem o quiz por função: agrupa pelo cargo
    const g = {}; fs.forEach(f => { const k = f.cargo || 'Equipe'; g[k] = (g[k] || 0) + 1; });
    funcoes = Object.entries(g).map(([nome, n]) => ({nome, n}));
  }
  const ds = Escala.domingoSemanasDe(atual.setor);
  const cards = funcoes.map(f => {
    const membros = fs.map((x, i) => (x.cargo || 'Equipe') === f.nome ? i : -1).filter(i => i >= 0);
    const porDia = DIAS.map((d, k) => ab[k] ? membros.filter(i => sem[i]?.[k] === 'T').length : null);
    const chips = [`<span>${plural(membros.length || f.n, 'colaborador', 'colaboradores')}</span>`];
    if (f.dias) chips.push(`<span>${f.dias} dias por semana</span>`);
    if (f.entrada && f.saida) {
      const j = jornadaDe({...f, intervalo: f.intervalo || 0});
      chips.push(`<span class="v">${Escala.hm(j.dia / 60)} por dia · ${Escala.hm(j.semana)} por semana</span>`, `<span>${hora(f.entrada)} às ${hora(f.saida)}${f.intervalo ? `, ${Escala.hm(f.intervalo / 60)} de intervalo` : ''}</span>`);
    }
    const fo = f.folga || {modo: 'rodizio'};
    chips.push(`<span>Folgas: ${fo.modo === 'fixa' ? 'fixas em ' + fo.dias.map(d => DIAS[d]).join(' e ') : fo.modo === 'preferidos' ? 'de preferência ' + fo.dias.map(d => DIAS[d]).join(', ') : 'em rodízio'}</span>`);
    if (f.minimo) chips.push(`<span>Mínimo de ${f.minimo} por dia</span>`);
    return `<article class="res-func"><h3>${esc(f.nome)}<small>${plural(membros.length || f.n, 'colaborador', 'colaboradores')}</small></h3>
      <div class="res-chips">${chips.join('')}</div>
      <p class="dica">Trabalhando em cada dia, nesta semana</p>
      <div class="res-dia">${DIAS.map((d, k) => porDia[k] == null ? `<span class="x">${d}<b>–</b></span>` : `<span>${d}<b>${porDia[k]}</b></span>`).join('')}</div></article>`;
  }).join('');
  const domingo = ab[6] ? `<div class="cartao" style="margin-top:12px"><b>Domingo em rodízio</b><p style="margin-top:4px">${ds === 3 ? 'No comércio, cada colaborador folga pelo menos 1 a cada 3 domingos (Lei 10.101).' : `Cada colaborador folga pelo menos 1 a cada ${ds} domingos (Portaria MTP 671/2021).`}
    Nas próximas ${e.dados.length} semanas: ${e.dados.map((w, s) => `${ddmm(Escala.somaDias(e.inicio, s * 7 + 6))}, ${plural(w.filter(x => x[6] === 'F').length, 'folga', 'folgas')}`).join(' · ')}.</p></div>` : '';
  const ajustes = (e.ajustes || []).length ? `<div class="cartao" style="margin-top:12px"><b>Ajustes da lei do domingo</b><p class="dica" style="margin:4px 0 6px">Nessas semanas a folga escolhida deu lugar ao domingo, como determina a lei.</p>
    <ul class="res-folgas">${e.ajustes.slice(0, 5).map(a => `<li>${esc(a.texto)}</li>`).join('')}${e.ajustes.length > 5 ? `<li>e mais ${e.ajustes.length - 5}</li>` : ''}</ul></div>` : '';
  return `<details class="como"><summary>Como a escala foi montada</summary><div class="res-funcs">${cards}</div>${domingo}${ajustes}</details>`;
}

// carrossel dos banners em imagem: arrasta (scroll-snap), pontos, passa sozinho a cada 6s
// (para com toque, mouse ou foco; não passa sozinho com movimento reduzido)
function ligaCarrosselImg() {
  const t = $('#bnTrilho'); if (!t) return;
  const itens = [...t.children], n = itens.length;
  const reduz = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const idx = () => Math.round(t.scrollLeft / t.clientWidth);
  t.classList.add('anima');
  const vai = i => t.scrollTo({ left: ((i + n) % n) * t.clientWidth, behavior: reduz() ? 'auto' : 'smooth' });
  const marca = () => { const i = idx(); itens.forEach((x, j) => x.classList.toggle('ativo', j === i)); $('#bnN').textContent = `${i + 1}/${n}`; };
  t.onscroll = () => { cancelAnimationFrame(t.raf); t.raf = requestAnimationFrame(marca); };
  marca();
  $('#bnAnt').onclick = () => vai(idx() - 1);
  $('#bnProx').onclick = () => vai(idx() + 1);
  $('#bnX').onclick = () => { try { sessionStorage.setItem('faixaFechada', '1'); } catch {} clearInterval(ligaCarrosselImg.t); t.closest('.bn-car').remove(); };
  clearInterval(ligaCarrosselImg.t);
  if (n < 2 || reduz()) return;
  let parado = false;
  const caixa = t.closest('.bn-car'), para = () => { parado = true; }, volta = () => { parado = false; };
  caixa.addEventListener('pointerenter', para); caixa.addEventListener('pointerleave', volta);
  t.addEventListener('touchstart', para, { passive: true }); t.addEventListener('touchend', () => setTimeout(volta, 4000));
  caixa.addEventListener('focusin', para); caixa.addEventListener('focusout', volta);
  ligaCarrosselImg.t = setInterval(() => {
    if (!document.body.contains(t)) return clearInterval(ligaCarrosselImg.t);
    if (!parado && !document.hidden) vai(idx() + 1);
  }, 6000);
}

// ================= notificações (sino no topo) =================
let notifs = { itens: [], nao_lidas: 0 };
const quando = d => {
  const min = Math.round((Date.now() - new Date(d)) / 6e4);
  if (min < 1) return 'agora'; if (min < 60) return `há ${min} min`; if (min < 24 * 60) return `há ${Math.round(min / 60)} h`;
  if (min < 48 * 60) return 'ontem'; const x = new Date(d); return `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}`;
};
async function carregaNotificacoes() {
  if (!conta || document.hidden) return;
  try { notifs = await api('/api/notificacoes'); } catch { return; }
  pintaSino();
}
function pintaSino() {
  const n = notifs.nao_lidas, b = $('#sinoN');
  b.textContent = n > 9 ? '9+' : n; b.classList.toggle('hide', !n);
  $('#btnSino').setAttribute('aria-label', n ? `Notificações: ${n} ${n === 1 ? 'nova' : 'novas'}` : 'Notificações');
  $('#notTodas').classList.toggle('hide', !n);
  $('#notLista').innerHTML = notifs.itens.length ? notifs.itens.map(x => `<button type="button" class="not-item ${x.lida ? '' : 'nova'}" data-nid="${x.id}" data-link="${esc(x.link || '')}">
      <i aria-hidden="true"></i><b>${esc(x.titulo)}</b>${x.texto ? `<span>${esc(x.texto)}</span>` : ''}<small>${quando(x.criado_em)}${x.lida ? '' : ' · nova'}</small></button>`).join('')
    : '<p class="not-vazio">Nada por aqui ainda. Os avisos da sua escala aparecem aqui.</p>';
}
function abrePainelNot(abrir) {
  const p = $('#painelNot'), f = $('#notFundo');
  p.hidden = !abrir; f.hidden = !abrir; $('#btnSino').setAttribute('aria-expanded', String(abrir));
  if (abrir) { carregaNotificacoes(); (p.querySelector('.not-item') || $('#notTodas')).focus({ preventScroll: true }); }
}
document.addEventListener('DOMContentLoaded', () => {
  $('#btnSino').onclick = e => { e.stopPropagation(); abrePainelNot($('#painelNot').hidden); };
  $('#notFundo').onclick = () => abrePainelNot(false);
  document.addEventListener('click', e => { if (!$('#painelNot').hidden && !e.target.closest('.topo-sino')) abrePainelNot(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#painelNot').hidden) { abrePainelNot(false); $('#btnSino').focus(); } });
  $('#notTodas').onclick = async () => {
    await api('/api/notificacoes/lidas', { method: 'POST' }).catch(() => {});
    notifs.itens.forEach(x => x.lida = true); notifs.nao_lidas = 0; pintaSino();
  };
  $('#notLista').onclick = async e => {
    const b = e.target.closest('.not-item'); if (!b) return;
    const x = notifs.itens.find(i => i.id === +b.dataset.nid);
    if (x && !x.lida) { x.lida = true; notifs.nao_lidas = Math.max(0, notifs.nao_lidas - 1); pintaSino(); api(`/api/notificacoes/${x.id}/lida`, { method: 'POST' }).catch(() => {}); }
    abrePainelNot(false);
    if (b.dataset.link) ir(b.dataset.link);
  };
  setInterval(carregaNotificacoes, 90e3);
  document.addEventListener('visibilitychange', carregaNotificacoes);
});

// ================= foto de perfil (Mais › Minha conta) =================
// Corta no centro com zoom, reduz para 256x256 (WebP; JPEG se o navegador não gerar WebP) e manda para o servidor.
let fotoEm = null;
const iniciaisDe = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(x => x[0] || '').join('').toUpperCase() || '?';
const avatar = (id, nome, v) => `<span class="av"><b>${esc(iniciaisDe(nome))}</b>${v ? `<img src="/api/usuarios/${id}/foto?v=${encodeURIComponent(new Date(v).getTime())}" alt="" onerror="this.remove()">` : ''}</span>`;
const meuAvatar = () => avatar(eu.id, eu.nome || eu.email, fotoEm);
async function carregaFoto() {
  try { fotoEm = (await api('/api/eu/foto/info')).foto_em; } catch { fotoEm = null; }
  pintaAvatares();
}
function pintaAvatares() {
  if (!eu) return;
  if ($('#btnUser')) $('#btnUser').innerHTML = meuAvatar();
  const q = $('#lateral .lat-quem i'); if (q) q.innerHTML = meuAvatar();
  if ($('#fpAvatar')) { $('#fpAvatar').innerHTML = meuAvatar(); $('#fpTirar').classList.toggle('hide', !fotoEm); }
}
document.addEventListener('DOMContentLoaded', () => {
  let img = null;
  const cv = $('#fpCanvas'), ctx = cv.getContext('2d');
  const desenha = () => {
    if (!img) return;
    const z = +$('#fpZoom').value, esc0 = Math.max(256 / img.width, 256 / img.height) * z;
    const w = img.width * esc0, h = img.height * esc0;
    const sobra = Math.max(0, h - 256);
    ctx.clearRect(0, 0, 256, 256); ctx.drawImage(img, (256 - w) / 2, (256 - h) / 2 - (+$('#fpY').value) * sobra / 2, w, h);
  };
  $('#fpArquivo').onchange = () => {
    const f = $('#fpArquivo').files[0]; $('#fpErro').textContent = '';
    if (!f) return;
    if (!/^image\//.test(f.type)) { $('#fpErro').textContent = 'Escolha uma imagem.'; return; }
    const url = URL.createObjectURL(f), im = new Image();
    im.onload = () => { img = im; $('#fpZoom').value = 1; $('#fpY').value = im.height > im.width ? -0.6 : 0; $('#fpCorte').classList.remove('hide'); desenha(); URL.revokeObjectURL(url); };
    im.onerror = () => { $('#fpErro').textContent = 'Não foi possível abrir essa imagem.'; };
    im.src = url;
  };
  $('#fpZoom').oninput = desenha; $('#fpY').oninput = desenha;
  $('#fpCancelar').onclick = () => { img = null; $('#fpCorte').classList.add('hide'); $('#fpArquivo').value = ''; };
  const blob = (tipo, q) => new Promise(r => cv.toBlob(r, tipo, q));
  $('#fpSalvar').onclick = async () => {
    const b = $('#fpSalvar'); b.disabled = true; $('#fpErro').textContent = '';
    try {
      let arq = null;
      for (const q of [0.85, 0.7, 0.55]) { arq = await blob('image/webp', q); if (!arq || arq.type !== 'image/webp') break; if (arq.size <= 40 * 1024) break; }
      if (!arq || arq.type !== 'image/webp') arq = await blob('image/jpeg', 0.82);
      const r = await fetch('/api/eu/foto', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': arq.type }, body: arq });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro || 'Não foi possível salvar a foto.');
      fotoEm = j.foto_em; img = null; $('#fpCorte').classList.add('hide'); $('#fpArquivo').value = '';
      pintaAvatares(); toast('Foto salva.');
    } catch (err) { $('#fpErro').textContent = err.message; }
    b.disabled = false;
  };
  $('#fpTirar').onclick = async () => {
    if (!confirm('Remover a foto de perfil?')) return;
    await api('/api/eu/foto', { method: 'DELETE' }).catch(() => {});
    fotoEm = null; pintaAvatares(); toast('Foto removida.');
  };
});
