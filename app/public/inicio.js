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
const CD_PASSOS = ['oi', 'empresa', 'porte', 'cnpj', 'responsavel', 'endereco', 'negocio', 'tamanho', 'origem'];
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
    const mei = cd.porte === 'mei';
    corpo = `<h1>Qual o <mark>CNPJ</mark>?</h1><p class="sub">Conferimos os números na hora. Vale o CNPJ novo, com letras.</p>
      <label for="cdCnpj">CNPJ</label><input id="cdCnpj" class="q-grande" value="${esc(cd.cnpj)}" placeholder="00.000.000/0000-00" inputmode="text" autocapitalize="characters" autocomplete="off" ${cd.sem_cnpj ? 'disabled' : ''}>
      <p class="q-valida" id="cdCnpjOk"></p>
      ${mei ? `<label class="q-check"><input type="checkbox" id="cdSemCnpj" ${cd.sem_cnpj ? 'checked' : ''}><span>Ainda não tenho CNPJ<small>Só para MEI que está abrindo agora</small></span></label>` : ''}`;
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
    inp.oninput = () => { const p = inp.selectionStart === inp.value.length; inp.value = Cadastro.mascaraCnpj(inp.value); if (p) inp.selectionStart = inp.selectionEnd = inp.value.length; cd.cnpj = inp.value; confere(); };
    confere(); if (!cd.sem_cnpj) foco('#cdCnpj');
    if ($('#cdSemCnpj')) $('#cdSemCnpj').onchange = e => { cd.sem_cnpj = e.target.checked; inp.disabled = cd.sem_cnpj; if (cd.sem_cnpj) { inp.value = ''; cd.cnpj = ''; } confere(); };
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
        ir('inicio');
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
let videoAulaApp = null; // a aula em vídeo do app só aparece quando o arquivo existir
const temVideoAula = () => videoAulaApp ??= fetch('/video/aula-app.mp4', { method: 'HEAD' }).then(r => r.ok).catch(() => false);
function fileira(id, titulo, cartoes, extra = '') {
  if (!cartoes.length) return '';
  return `<section class="nf-fila" aria-labelledby="${id}"><div class="nf-fila-topo"><h2 id="${id}">${titulo}</h2>${extra}</div>
    <div class="nf-trilho" role="list">${cartoes.join('')}</div></section>`;
}
const cartaoImg = ({ ir, href, img, tit, sub, etq, cls = '', acao, alvo }) => {
  const tag = href ? `a href="${esc(href)}"${alvo ? ' target="_blank" rel="noopener"' : ''}` : `button type="button" data-ir="${ir}"`;
  return `<${tag} class="nf-card ${cls}" role="listitem">
    <span class="nf-arte">${img}</span>
    <span class="nf-txt">${etq ? `<em class="nf-etq">${etq}</em>` : ''}<b>${tit}</b>${sub ? `<small>${sub}</small>` : ''}${acao ? `<span class="nf-acao">${acao}</span>` : ''}</span>
  </${href ? 'a' : 'button'}>`;
};
const foto = (src, alt = '') => `<img src="${src}" alt="${alt}" loading="lazy" decoding="async">`;
async function telaInicio() {
  const v = $('#v-inicio'), dono = conta.papel === 'dono', cont = conta.papel === 'contador';
  const [p, vis, extras, video] = await Promise.all([api('/api/inicio'), atual ? api('/api/visao').catch(() => null) : null,
    api('/api/extras').catch(() => []), temVideoAula()]);
  progresso = p;
  const hojeU = vis?.equipes?.find(e => e.id === atual?.id)?.hoje;
  // banners em imagem no topo (carrossel)
  const bannersImg = [
    { k: 'escala', ir: p.unidades ? 'escala' : 'comecar', alt: 'Sua escala 5x2 pronta em 2 minutos. Responda umas perguntas e a semana sai dentro da nova lei.' },
    { k: 'lei', ir: 'aula', alt: 'Entenda a nova lei em 3 minutos: 2 folgas por semana, 42 horas e o domingo, sem juridiquês.' },
    !cont && { k: 'enviar', ir: 'tabela', alt: 'Mande para a equipe por WhatsApp, PDF, Excel ou link. Cada funcionário vê a própria folga no celular.' },
    { k: 'kit', ir: 'materiais', alt: 'Kit RH, calculadora e plaquinhas: termo aditivo, folha de ponto e avisos prontos para imprimir.' },
    dono && { k: 'contador', ir: 'acessos', alt: 'Dê acesso grátis ao seu contador. Ele vê a escala, baixa tudo e fecha o mês.' },
  ].filter(Boolean);
  const carrosselImg = `<section class="bn-car" aria-roledescription="carrossel" aria-label="Destaques">
      <div class="bn-trilho" id="bnTrilho">${bannersImg.map((b, i) => `<a class="bn-item" href="#${b.ir}" data-ir="${b.ir}" aria-roledescription="slide" aria-label="${i + 1} de ${bannersImg.length}">
        <picture><source media="(max-width:760px)" srcset="/img/banners/${b.k}-cel.webp?v=1" width="1080" height="1240">
        <img src="/img/banners/${b.k}-pc.webp?v=1" alt="${esc(b.alt)}" width="1920" height="560" ${i ? 'loading="lazy"' : 'loading="eager" fetchpriority="high"'} decoding="async"></picture></a>`).join('')}</div>
      <div class="bn-pontos" id="bnPontos">${bannersImg.map((b, i) => `<button type="button" aria-label="Ver destaque ${i + 1} de ${bannersImg.length}" class="${i ? '' : 'on'}"></button>`).join('')}</div>
    </section>`;
  const quiz = dono && !p.unidades ? `<section class="ban-quiz" aria-labelledby="tQuiz">
      <div class="ban-quiz-txt"><span class="ban-etq">Próximo passo</span><h2 id="tQuiz">Monte a escala da sua equipe em 2 minutos</h2>
        <p>Só números: que dias abre, quantas pessoas em cada função, o horário e as folgas. A escala sai pronta, dentro da nova lei.</p>
        <button class="btn ban-btn" data-ir="comecar">Começar agora <span aria-hidden="true">→</span></button></div>
      <div class="ban-quiz-mock" aria-hidden="true">${DIAS.map((d, i) => `<i class="${i >= 5 ? 'f' : ''}"><small>${d}</small><em>${i >= 5 ? 'Folga' : 'Trabalha'}</em></i>`).join('')}</div>
    </section>` : '';
  // 1. continue de onde parou: o que falta primeiro, depois o que já dá para usar
  const passos = [
    dono && { ok: p.unidades > 0, ir: p.unidades ? 'resultado' : 'comecar', img: foto('/img/iphone-quiz.webp?v=20261115b'), tit: p.unidades ? 'O resultado da sua escala' : 'Montar a escala', sub: p.unidades ? 'O padrão por função, em números' : 'Umas perguntas, só números' },
    p.unidades > 0 && { ok: true, ir: 'escala', img: foto('/img/iphone-escala.webp?v=20261115b'), tit: 'Escala da semana', sub: hojeU ? `Hoje: ${hojeU.trabalham.length} trabalham, ${hojeU.folgam.length} folgam` : 'Quem trabalha e quem folga' },
    !cont && p.unidades > 0 && { ok: p.escala_enviada, ir: 'tabela', img: foto('/img/iphone-saidas.webp?v=20261115b'), tit: 'Mandar para a equipe', sub: 'WhatsApp, PDF, Excel ou link' },
    dono && p.unidades > 0 && { ok: p.contador, ir: 'acessos', img: foto('/img/mac-tabela.webp?v=20261115b'), tit: 'Convidar o contador', sub: 'Grátis: ele fecha o mês' },
    p.unidades > 0 && podeEditar() && { ok: false, ir: 'personalizar', img: `<span class="nf-num amarelo" aria-hidden="true">2</span>`, tit: 'Personalizar a escala', sub: 'Nomes, trocas, faltas e o mês', cls: 'perso' },
  ].filter(Boolean).sort((a, b) => a.ok - b.ok);
  const continuar = passos.map(x => cartaoImg({ ...x, cls: `largo ${x.cls || ''}`, etq: x.ok ? (x.ir === 'escala' || x.ir === 'resultado' ? 'Pronto' : 'Feito') : 'Próximo passo' }));
  // 2. aula da nova lei: o vídeo do app (quando existir) e as 8 lições
  const lic = typeof licoes === 'function' ? licoes() : [];
  const aula = [
    video && `<button type="button" class="nf-card video" role="listitem" data-video><span class="nf-arte"><img src="/video/aula-app.jpg?v=1" alt="" loading="lazy" decoding="async" class="nf-poster"><span class="nf-play" aria-hidden="true"></span></span>
      <span class="nf-txt"><em class="nf-etq">Vídeo</em><b>Como usar o app</b><small>Vídeo de 1 min, com legenda</small></span></button>`,
    ...lic.map((l, i) => cartaoImg({ ir: `aula/${i}`, img: `<span class="nf-num c${i % 4}" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>`, tit: esc(l.tit), sub: `Lição ${i + 1} de ${lic.length} · 1 min`, cls: 'aula' })),
  ].filter(Boolean);
  // 3. seus materiais (comprados: baixar; não comprados: preço e liberar)
  const CAPA = { kit_rh: ['Kit RH', 'Termo aditivo, comunicado e folha de ponto'], calculadora: ['Calculadora', 'Horas, custo e hora extra da 5x2'], plaquinhas: ['Plaquinhas', 'Avisos prontos para imprimir'] };
  const mats = (Array.isArray(extras) ? extras : []).map(x => cartaoImg({
    ...(x.comprado ? { ir: 'materiais' } : { href: x.checkout, alvo: true }),
    img: `<span class="nf-capa ${esc(x.extra)}" aria-hidden="true"><i></i><b>${esc(CAPA[x.extra]?.[0] || x.nome)}</b></span>`,
    tit: esc(x.nome), sub: esc(CAPA[x.extra]?.[1] || x.resumo || ''), cls: 'mat',
    etq: x.comprado ? 'Liberado' : '', acao: x.comprado ? 'Baixar' : `R$ ${Number(x.preco).toFixed(2).replace('.', ',')} · Liberar`,
  }));
  // 4. atalhos
  const atalhos = [
    ['escala', 'Escala', '/img/iphone-escala.webp'], ['pessoas', 'Equipe', '/img/iphone-quiz.webp'],
    !cont && ['tabela', 'Baixar ou enviar', '/img/iphone-saidas.webp'], [dono ? 'acessos' : 'fechamento', dono ? 'Contador' : 'Fechamento do mês', '/img/mac-tabela.webp'],
  ].filter(Boolean).map(([ir, tit, src]) => cartaoImg({ ir, img: foto(src + '?v=20261115b'), tit, cls: 'atalho' }));
  // um aviso só, e só o que não está nos banners
  const fechado = k => ler('banner_' + k) === '1';
  const aviso = !(typeof naTelaInicial === 'function' && naTelaInicial()) && !fechado('instalar')
    ? `<div class="ban-aviso ban-escuro nf-aviso" data-k="instalar"><div><b>Coloque o app na tela inicial</b><span>Abre como um aplicativo, direto no celular.</span></div>
      <div class="ban-acoes"><button class="btn pq" data-ir="instalar">Ver como</button><button class="ban-x" data-fechar="instalar" aria-label="Fechar aviso">×</button></div></div>` : '';
  recem = false;
  v.innerHTML = `<div class="nf">
    <header class="nf-oi"><p>Olá, <b>${esc(nomeCurto(eu.nome))}</b></p><h1>${esc(conta.empresa || 'Sua empresa')}</h1>
      <p class="nf-data">${dataLonga(hojeIso())}${atual ? ` · ${esc(atual.nome)}` : ''}${hojeU ? ` · <b data-conta="${hojeU.trabalham.length}">${hojeU.trabalham.length}</b> trabalham hoje` : ''}</p></header>
    ${quiz}${carrosselImg}${aviso}
    ${fileira('fContinuar', 'Continue de onde parou', continuar)}
    ${fileira('fAula', 'Aula da nova lei', aula, '<button class="nf-ver" data-ir="aula">Ver tudo</button>')}
    ${fileira('fMat', 'Seus materiais', mats, '<button class="nf-ver" data-ir="materiais">Ver tudo</button>')}
    ${fileira('fAtalhos', 'Atalhos', atalhos)}
  </div>`;
  ligaCarrosselImg(); animaContadores(v);
  $$('#v-inicio [data-fechar]').forEach(b => b.onclick = () => { gravar('banner_' + b.dataset.fechar, '1'); b.closest('.ban-aviso').remove(); });
  const bv = $('#v-inicio [data-video]');
  if (bv) bv.onclick = abreVideoAula;
}
function abreVideoAula() {
  {
    folha('<h2>Como usar o app</h2><video controls autoplay playsinline preload="none" poster="/video/aula-app.jpg?v=1" style="width:100%;border-radius:14px;margin-top:12px;background:#000"><source src="/video/aula-app.mp4?v=1" type="video/mp4"><track kind="captions" src="/video/aula-app.vtt?v=1" srclang="pt-BR" label="Português" default></video>');
    $('#folha').addEventListener('close', () => $('#folha video')?.pause(), { once: true });
  }
}

// escala mandada para a equipe (qualquer saída: WhatsApp, PDF, Excel, link...) marca o passo do progresso
let enviadaMarcada = false;
window.marcaEnviada = () => {
  if (enviadaMarcada || !podeEditar() || progresso?.escala_enviada) return;
  enviadaMarcada = true; api('/api/inicio/enviada', { method: 'POST' }).catch(() => { enviadaMarcada = false; });
};

// ================= menu lateral (computador) e gaveta (celular) =================
// O mesmo #lateral é a barra fixa no computador e, abaixo de 1024px, a gaveta que desliza da esquerda.
// Menu em grupos que abrem e fecham (sanfona). O grupo da tela atual abre sozinho; os que a pessoa abriu ficam salvos.
function itensMenu() {
  const mc = ehModoContador(), dono = conta.papel === 'dono', cont = conta.papel === 'contador', ed = podeEditar();
  const aprender = { g: 'aprender', t: 'Aprender', itens: [['@video', 'Aula do app (vídeo)'], ['aula', 'Aula da nova lei'], ['@ajuda', 'Ajuda']] };
  if (mc) return [['contador', 'Suas empresas'], aprender, { g: 'config', t: 'Configurações', itens: [['conta', 'Minha conta'], ['instalar', 'Colocar na tela inicial']] }];
  if (cont) return [
    { g: 'escala', t: 'Escala', itens: [['escala', 'Escala da semana'], ['tabela', 'Baixar ou imprimir']] },
    { g: 'equipe', t: 'Equipe', itens: [['ocorrencias', 'Férias e faltas']] },
    { g: 'painel', t: 'Painel', itens: [['fechamento', 'Fechamento do mês']] },
    aprender, ['materiais', 'Seus materiais'],
  ];
  const unidades = equipes.map(e => ['@un:' + e.id, e.nome]);
  if (ed) unidades.push(['comecar/unidade', '+ Nova unidade']);
  return [
    ['inicio', 'Início'],
    { g: 'escala', t: 'Escala', itens: [['escala', 'Escala da semana'], ['resultado', 'Resultado por função'], ...(ed ? [['personalizar', 'Personalizar a escala']] : []), ['tabela', 'Baixar, enviar ou imprimir']] },
    { g: 'equipe', t: 'Equipe', itens: [['pessoas', 'Pessoas'], ['ocorrencias', 'Férias e faltas']] },
    { g: 'painel', t: 'Painel', itens: [['fechamento', 'Fechar o mês'], ...(dono ? [['empresa/historico', 'Histórico']] : [])] },
    unidades.length && { g: 'unidades', t: 'Unidades', itens: unidades },
    { g: 'config', t: 'Configurações', itens: [...(dono ? [['empresa', 'Dados da empresa']] : []), ...(ed ? [['funcionamento', 'Funcionamento']] : []),
      ...(dono ? [['acessos', 'Acessos (contador e gerente)']] : []), ['@outra', 'Outra empresa'], ['instalar', 'Colocar na tela inicial'], ['indique', 'Indique para quem conhece'], ['conta', 'Minha conta']] },
    aprender, ['materiais', 'Seus materiais'],
  ].filter(Boolean);
}
const gruposAbertos = () => { try { return new Set(JSON.parse(ler('menuAberto') || '[]')); } catch { return new Set(); } };
function botaoMenu([r, t], sub) {
  const cls = sub ? 'lat-item sub' : 'lat-item';
  if (r === '@ajuda') return `<a class="${cls}" href="/ajuda">${esc(t)}</a>`;
  if (r === '@video') return `<button type="button" class="${cls}" data-acao="video">${esc(t)}</button>`;
  if (r === '@outra') return `<button type="button" class="${cls}" data-acao="outra">${esc(t)}</button>`;
  if (r.startsWith('@un:')) { const id = +r.slice(4); return `<button type="button" class="${cls} ${id === atual?.id ? 'atual' : ''}" data-unidade="${id}">${esc(t)}</button>`; }
  return `<button type="button" class="${cls}" data-ir="${r}" data-lat="${r.split('/')[0] === 'empresa' && r.includes('/') ? 'historico' : r}">${esc(t)}</button>`;
}
function pintaLateral() {
  const el = $('#lateral'); if (!el) return;
  const mc = ehModoContador(), abertos = gruposAbertos();
  const ini = (eu.nome || eu.email || '?').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
  const nav = itensMenu().map(x => Array.isArray(x) ? botaoMenu(x) : `<div class="lat-grupo ${abertos.has(x.g) ? 'aberto' : ''}" data-grupo="${x.g}">
      <button type="button" class="lat-g" aria-expanded="${abertos.has(x.g)}" aria-controls="lg-${x.g}"><span>${esc(x.t)}</span><i class="lat-chev" aria-hidden="true"></i></button>
      <div class="lat-sub" id="lg-${x.g}" role="group" aria-label="${esc(x.t)}" ${abertos.has(x.g) ? '' : 'inert'}><div class="lat-sub-in">${x.itens.map(i => botaoMenu(i, true)).join('')}</div></div></div>`).join('');
  el.innerHTML = `<div class="lat-emp"><small>${mc ? 'Escritório' : conta.papel === 'dono' ? 'Empresa' : 'Você é ' + PAPEL[conta.papel].toLowerCase()}</small><b>${esc(mc ? eu.nome : conta.empresa || 'Sua empresa')}</b>
      <div class="lat-quem so-gaveta"><i aria-hidden="true">${esc(ini)}</i><span><b>${esc(eu.nome || '')}</b><em>${esc(eu.email)}</em></span></div>
      <button type="button" class="gav-x so-gaveta" data-fecha-gaveta aria-label="Fechar o menu">×</button></div>
    <nav aria-label="Seções">${nav}</nav>
    <div class="lat-pe"><button type="button" class="lat-sair-btn" data-sair>Sair do app</button><span>${esc(eu.email)}</span></div>`;
}
function abreGrupo(g, abrir, salvar = true) {
  const el = $(`#lateral [data-grupo="${g}"]`); if (!el) return;
  el.classList.toggle('aberto', abrir);
  el.querySelector('.lat-g').setAttribute('aria-expanded', String(abrir));
  el.querySelector('.lat-sub').inert = !abrir;
  if (salvar) { const s = gruposAbertos(); abrir ? s.add(g) : s.delete(g); gravar('menuAberto', JSON.stringify([...s])); }
}
function marcaLateral(v, extra) {
  const mapa = { resultado: 'resultado', comecar: 'inicio', cadastro: 'inicio', mais: 'conta' };
  const alvo = v === 'empresa' && extra === 'historico' ? 'historico' : (mapa[v] || v);
  $$('#lateral [data-lat]').forEach(b => {
    const on = b.dataset.lat === alvo;
    b.classList.toggle('on', on);
    if (on) { b.setAttribute('aria-current', 'page'); const g = b.closest('.lat-grupo'); if (g && !g.classList.contains('aberto')) abreGrupo(g.dataset.grupo, true, false); }
    else b.removeAttribute('aria-current');
  });
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
    const g = e.target.closest('.lat-g'), un = e.target.closest('[data-unidade]'), acao = e.target.closest('[data-acao]')?.dataset.acao;
    if (e.target.closest('[data-fecha-gaveta]')) fechaGaveta();
    else if (e.target.closest('[data-sair]')) sair();
    else if (g) { const el = g.closest('.lat-grupo'); abreGrupo(el.dataset.grupo, !el.classList.contains('aberto')); }
    else if (un) trocaUnidade(+un.dataset.unidade);
    else if (acao === 'video') { fechaGaveta(); abreVideoAula(); }
    else if (acao === 'outra') { fechaGaveta(); folhaOutraEmpresa(); }
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

// ================= resultado do primeiro acesso (etapa 1) e personalizar (etapa 2) =================
// Etapa 1 (o que a compra entrega): o padrão da escala por função, só com números.
// Etapa 2 (personalizar): nomes, trocas, faltas, férias, mês. Separada para poder virar plano mensal depois:
// a liberação passa toda por podePersonalizar().
function podePersonalizar(c) { return !!c; } // hoje liberado para todos (preço do plano ainda não definido)
function cartaoPersonalizar(comResultado) {
  return `<section class="perso-cartao" aria-labelledby="tPerso"><span class="perso-ic" aria-hidden="true">2</span><div>
    <b id="tPerso">Personalizar a escala</b><p>Coloque os nomes, troque folgas, lance faltas, atestados e férias e veja o mês inteiro.</p>
    <div class="lado-bt"><button class="btn pq azul" data-ir="personalizar">Personalizar</button>${comResultado ? '<button class="btn pq sec" data-ir="resultado">Ver o resultado</button>' : ''}</div></div></section>`;
}
const ddmm = d => `${d.slice(8)}/${d.slice(5, 7)}`;
async function telaResultado() {
  const v = $('#v-resultado');
  if (!atual) return ir('inicio');
  v.innerHTML = esqueletoSemana();
  const seg0 = segundaDe(hojeIso());
  const r = await api(`/api/equipes/${atual.id}/semana?data=${seg0}`), e = r.escala;
  if (!e) { v.innerHTML = '<div class="vazio"><h2>A escala ainda não saiu</h2><p>Abra a escala da semana para ver o que falta.</p><button class="btn" data-ir="escala">Abrir a escala</button></div>'; return; }
  const sem = e.dados[r.semana] || e.dados[0], fs = e.funcionarios, ab = e.abertos;
  let funcoes = (atual.funcoes || []).filter(f => f.n > 0);
  if (!funcoes.length) { // unidade antiga, sem o quiz por função: agrupa pelo cargo
    const g = {}; fs.forEach(f => { const k = f.cargo || 'Equipe'; g[k] = (g[k] || 0) + 1; });
    funcoes = Object.entries(g).map(([nome, n]) => ({nome, n}));
  }
  const ds = Escala.domingoSemanasDe(atual.setor);
  const cards = funcoes.map(f => {
    const membros = fs.map((x, i) => (x.cargo || 'Equipe') === f.nome ? i : -1).filter(i => i >= 0);
    const porDia = DIAS.map((d, k) => ab[k] ? membros.filter(i => sem[i]?.[k] === 'T').length : null);
    const chips = [`<span>${plural(membros.length || f.n, 'pessoa', 'pessoas')}</span>`];
    if (f.dias) chips.push(`<span>${f.dias} dias por semana</span>`);
    if (f.entrada && f.saida) {
      const j = jornadaDe({...f, intervalo: f.intervalo || 0});
      chips.push(`<span class="v">${Escala.hm(j.dia / 60)} por dia · ${Escala.hm(j.semana)} por semana</span>`, `<span>${hora(f.entrada)} às ${hora(f.saida)}${f.intervalo ? `, ${Escala.hm(f.intervalo / 60)} de intervalo` : ''}</span>`);
    }
    const fo = f.folga || {modo: 'rodizio'};
    chips.push(`<span>Folgas: ${fo.modo === 'fixa' ? 'fixas em ' + fo.dias.map(d => DIAS[d]).join(' e ') : fo.modo === 'preferidos' ? 'de preferência ' + fo.dias.map(d => DIAS[d]).join(', ') : 'em rodízio'}</span>`);
    if (f.minimo) chips.push(`<span>Mínimo de ${f.minimo} por dia</span>`);
    const folgas = membros.slice(0, 8).map(i => `<span><b>${esc(fs[i].nome)}</b>: ${DIAS.filter((_, k) => sem[i]?.[k] === 'F' && ab[k]).join(' e ') || '—'}</span>`).join('') + (membros.length > 8 ? `<span>e mais ${membros.length - 8}</span>` : '');
    return `<article class="res-func"><h3>${esc(f.nome)}<small>${plural(membros.length || f.n, 'pessoa', 'pessoas')}</small></h3>
      <div class="res-chips">${chips.join('')}</div>
      <p class="dica">Trabalhando em cada dia, nesta semana</p>
      <div class="res-dia">${DIAS.map((d, k) => porDia[k] == null ? `<span class="x">${d}<b>–</b></span>` : `<span>${d}<b>${porDia[k]}</b></span>`).join('')}</div>
      <div class="res-folgas">${folgas}</div></article>`;
  }).join('');
  const domingo = ab[6] ? `<div class="cartao" style="margin-top:12px"><b>Domingo em rodízio</b><p style="margin-top:4px">${ds === 3 ? 'No comércio, cada um folga pelo menos 1 a cada 3 domingos (Lei 10.101).' : `Cada um folga pelo menos 1 a cada ${ds} domingos (Portaria MTP 671/2021).`}
    Nas próximas ${e.dados.length} semanas: ${e.dados.map((w, s) => `${ddmm(Escala.somaDias(e.inicio, s * 7 + 6))}, ${plural(w.filter(x => x[6] === 'F').length, 'folga', 'folgam')}`).join(' · ')}.</p></div>` : '';
  const ajustes = (e.ajustes || []).length ? `<div class="cartao" style="margin-top:12px"><b>Ajustes da lei do domingo</b><p class="dica" style="margin:4px 0 6px">Nessas semanas a folga escolhida deu lugar ao domingo, como manda a lei.</p>
    <ul class="res-folgas">${e.ajustes.slice(0, 5).map(a => `<li>${esc(a.texto)}</li>`).join('')}${e.ajustes.length > 5 ? `<li>e mais ${e.ajustes.length - 5}</li>` : ''}</ul></div>` : '';
  const a = Escala.analisar(e, opcoesAnalise(atual));
  const festa = window.escalaRecemGerada ? '<div class="res-ok" role="status"><svg viewBox="0 0 46 46" aria-hidden="true"><circle cx="23" cy="23" r="23"/><path d="M14 24l6 6 12-13"/></svg><b>Escala montada, dentro da lei</b></div>' : '';
  window.escalaRecemGerada = false;
  v.innerHTML = `<header class="res-topo">${festa}<span class="ban-etq">Etapa 1 · Resultado</span><h1>Sua escala 5x2 está pronta</h1>
      <p>O padrão da escala por função, em números. Tudo dentro da nova lei.</p>
      <div class="res-nums"><span><b data-conta="${fs.length}">${fs.length}</b> ${fs.length === 1 ? 'pessoa' : 'pessoas'}</span><span><b data-conta="${funcoes.length}">${funcoes.length}</b> ${funcoes.length === 1 ? 'função' : 'funções'}</span><span>2 folgas por semana</span>${ab[6] ? `<span>Domingo: 1 a cada ${ds}</span>` : ''}<span>Semana de ${ddmm(r.inicio)} a ${ddmm(Escala.somaDias(r.inicio, 6))}</span></div></header>
    <div class="res-acoes"><button class="btn" data-ir="escala">Ver a semana</button><button class="btn sec" data-ir="tabela">Baixar ou enviar</button></div>
    ${podeEditar() ? cartaoPersonalizar(false) : ''}
    <h2 class="res-tit">O padrão por função</h2><div class="res-funcs">${cards}</div>
    ${domingo}${ajustes}
    <h2 class="res-tit">A escala e a lei</h2><div class="cartao">${htmlAnalise(a)}</div>`;
  animaContadores(v);
}
function telaPersonalizar() {
  const v = $('#v-personalizar');
  const itens = [
    ['pessoas', 'Colocar os nomes da equipe', 'Troque "Caixa 1" pelo nome de cada um'],
    ['escala', 'Trocar folgas na semana', 'Toque no nome e mude o dia de folga'],
    ['ocorrencias', 'Faltas, atestados e férias', 'Lance e a escala se ajusta sozinha'],
    ['tabela', 'Escala da semana ou do mês', 'Em PDF, Excel, imagem ou no WhatsApp'],
    ['pessoas', 'Folga fixa de alguém', 'Para quem combinou um dia certo de folga'],
    ['funcionamento', 'Horário e mínimo por dia', 'Mude o funcionamento da unidade'],
  ];
  const liberado = podePersonalizar(conta);
  v.innerHTML = `<header class="res-topo"><span class="ban-etq">Etapa 2</span><h1>Personalizar a escala</h1>
      <p>A escala por números já está pronta. Aqui ela fica com a cara da sua equipe.</p></header>
    ${liberado ? `<ul class="perso-lista">${itens.map(([r, t, d]) => `<li><button data-ir="${r}"><span><b>${t}</b><small>${esc(d)}</small></span><span class="seta" aria-hidden="true">›</span></button></li>`).join('')}</ul>`
      : '<div class="cartao"><b>Disponível no plano mensal</b><p>Fale com a gente para liberar.</p></div>'}
    <p style="margin-top:16px"><button class="link" data-ir="resultado">‹ Ver o resultado por função</button></p>`;
}

// carrossel dos banners em imagem: arrasta (scroll-snap), pontos, passa sozinho a cada 6s
// (para com toque, mouse ou foco; não passa sozinho com movimento reduzido)
function ligaCarrosselImg() {
  const t = $('#bnTrilho'); if (!t) return;
  const pts = $$('#bnPontos button'), n = pts.length;
  const reduz = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const idx = () => Math.round(t.scrollLeft / t.clientWidth);
  t.classList.add('anima');
  const itens = [...t.children];
  const vai = i => t.scrollTo({ left: ((i + n) % n) * t.clientWidth, behavior: reduz() ? 'auto' : 'smooth' });
  const marca = () => { const i = idx(); itens.forEach((x, j) => x.classList.toggle('ativo', j === i)); pts.forEach((p, j) => { p.classList.toggle('on', j === i); p.setAttribute('aria-current', j === i ? 'true' : 'false'); }); };
  t.onscroll = () => { cancelAnimationFrame(t.raf); t.raf = requestAnimationFrame(marca); };
  marca();
  pts.forEach((p, j) => p.onclick = () => vai(j));
  clearInterval(ligaCarrosselImg.t);
  if (n < 2 || reduz()) return;
  let parado = false;
  const para = () => { parado = true; }, volta = () => { parado = false; };
  t.addEventListener('pointerenter', para); t.addEventListener('pointerleave', volta);
  t.addEventListener('touchstart', para, { passive: true }); t.addEventListener('touchend', () => setTimeout(volta, 4000));
  t.addEventListener('focusin', para); t.addEventListener('focusout', volta);
  ligaCarrosselImg.t = setInterval(() => {
    if (!document.body.contains(t)) return clearInterval(ligaCarrosselImg.t);
    if (!parado && !document.hidden) vai(idx() + 1);
  }, 6000);
}
