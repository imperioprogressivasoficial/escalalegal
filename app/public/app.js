// Escala Legal — app (JS puro). Telas: primeiro acesso guiado, início, unidade (escala, análise,
// pessoas, funcionamento), férias e faltas, fechamento, espaço do contador, acessos, empresa, minha conta.
const DIAS = Escala.DIAS, SETORES = Escala.SETORES, OC = Escala.OCORRENCIAS, COD = Escala.COD_NOME;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const br = d => d ? String(d).slice(0, 10).split('-').reverse().join('/') : '';
const dm = d => d.slice(8, 10) + '/' + d.slice(5, 7);
const ROTULO = {ferias: 'Férias', atestado: 'Atestado médico', falta: 'Falta', afastamento: 'Afastamento (INSS, licença)', folga_extra: 'Folga extra (compensação)', banco_horas: 'Banco de horas'};
const DICA = {ferias: 'A pessoa sai da escala nesses dias. Gere a escala de novo para redistribuir as folgas.', atestado: 'Os dias de atestado aparecem na escala e no fechamento.', falta: 'Falta sem justificativa. Vai para o fechamento do mês.', afastamento: 'INSS, licença maternidade etc. A pessoa sai da escala no período.', folga_extra: 'Folga além das 2 da semana (compensação de banco de horas, por exemplo).', banco_horas: 'Positivo = hora extra (crédito). Negativo = saiu mais cedo (débito).'};
const CURTO = {T: 'T', F: 'F', V: 'FÉ', M: 'AT', X: 'FA', L: 'AF', E: 'FX'};
const PAPEL = {dono: 'Dono', gestor: 'Gestor', contador: 'Contador'};
const PORTES = {mei: ['MEI', 'Microempreendedor individual'], me: ['ME', 'Microempresa'], epp: ['EPP', 'Empresa de pequeno porte'], media: ['Média ou grande', ''], nao_sei: ['Não sei', 'Pergunte ao contador depois']};
let eu = null, conta = null, equipes = [], atual = null, funcs = [], escalas = [], escalaAtual = null, semanaAtual = 0, modo = 'login', tipoCadastro = '';
const hojeIso = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const mesAtual = () => hojeIso().slice(0, 7);
const lerConta = () => { try { return +localStorage.getItem('conta') || null; } catch { return null; } };
const gravarConta = id => { try { localStorage.setItem('conta', id || ''); } catch {} };
const podeEditar = () => conta && conta.papel !== 'contador';
const ehModoContador = () => eu?.contador && conta?.id === eu.id && !eu.empresa;
const proxSegunda = () => { const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;

async function api(url, opts = {}) {
  const headers = {'Content-Type': 'application/json'};
  if (conta?.id) headers['x-conta'] = conta.id;
  const r = await fetch(url, {method: opts.method || 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined});
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (j.trocar_conta) { gravarConta(null); location.hash = ''; location.reload(); }
    const e = new Error(j.erro || 'Erro'); e.status = r.status; throw e;
  }
  return j;
}
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.append(t); setTimeout(() => t.remove(), 3400); }
const opcoesSetor = sel => sel.innerHTML = Object.entries(SETORES).map(([k, s]) => `<option value="${k}">${s.nome}</option>`).join('');
opcoesSetor($('#cfSetor'));
async function copiar(texto, msg) { try { await navigator.clipboard.writeText(texto); toast(msg); } catch { prompt('Copie:', texto); } }

// ---------- entrada ----------
function modoEntrada(m) {
  modo = m; $$('.abas button').forEach(x => x.classList.toggle('on', x.dataset.modo === m));
  $('.so-cad').classList.toggle('hide', m !== 'cadastro');
  $('.so-login').classList.toggle('hide', m !== 'login');
  $('.so-empresa').classList.toggle('hide', tipoCadastro === 'contador');
  $('.so-contador').classList.toggle('hide', tipoCadastro !== 'contador');
  $('#btnEntrar').textContent = m === 'login' ? 'Entrar' : tipoCadastro === 'contador' ? 'Criar conta de contador' : 'Criar conta';
  $('#cSenha').autocomplete = m === 'login' ? 'current-password' : 'new-password';
}
$$('.abas button').forEach(b => b.onclick = () => modoEntrada(b.dataset.modo));
$('#btnSouContador').onclick = () => {
  tipoCadastro = 'contador';
  $('#entradaTitulo').textContent = 'Os clientes liberam o acesso e você acompanha escalas, faltas e o fechamento do mês num lugar só.';
  modoEntrada('cadastro');
};
$('#formEntrada').onsubmit = async e => {
  e.preventDefault(); $('#erroEntrada').textContent = ''; $('#btnEntrar').disabled = true;
  try {
    if (modo === 'login') await api('/api/login', {method: 'POST', body: {email: $('#cEmail').value, senha: $('#cSenha').value}});
    else await api('/api/cadastro', {method: 'POST', body: {tipo: tipoCadastro, nome: $('#cNome').value, empresa: $('#cEmpresa').value, whatsapp: $('#cZap').value, email: $('#cEmail').value, senha: $('#cSenha').value}});
    await iniciar();
  } catch (err) { $('#erroEntrada').textContent = err.message; }
  $('#btnEntrar').disabled = false;
};
$('#btnSair').onclick = async () => { await api('/api/sair', {method: 'POST'}); gravarConta(null); location.href = '/app'; };
$('#btnEsqueci').onclick = () => { $('#eqEmail').value = $('#cEmail').value; $('#erroEsqueci').textContent = ''; $('#dlgEsqueci').showModal(); };
$('#formEsqueci').onsubmit = async e => {
  if (e.submitter?.value !== 'ok') return;
  e.preventDefault(); $('#btnEsqueciEnviar').disabled = true; $('#erroEsqueci').textContent = '';
  try { await api('/api/senha/esqueci', {method: 'POST', body: {email: $('#eqEmail').value}}); $('#dlgEsqueci').close(); toast('Se o e-mail tiver conta, o link chega em instantes. Confira também o spam.'); }
  catch (err) { $('#erroEsqueci').textContent = err.message; }
  $('#btnEsqueciEnviar').disabled = false;
};

// link do e-mail: criar / redefinir senha
const tokenAcesso = new URLSearchParams(location.search).get('acesso');
async function telaSenha() {
  $('#telaEntrada').classList.remove('hide'); $('#formEntrada').classList.add('hide'); $('#formSenha').classList.remove('hide');
  let t;
  try { t = await api('/api/senha/token?t=' + encodeURIComponent(tokenAcesso)); }
  catch (err) {
    $('#sTitulo').textContent = 'Link expirado'; $('#sTexto').textContent = err.message;
    $('#formSenha').querySelectorAll('label,input,#sDados,#btnSenha').forEach(x => x.classList.add('hide'));
    $('#formSenha').insertAdjacentHTML('beforeend', '<a class="btn" style="margin-top:16px" href="/app">Ir para o login</a>');
    return;
  }
  $('#sTitulo').textContent = t.tem_senha ? 'Crie uma senha nova' : 'Falta só criar sua senha';
  $('#sTexto').innerHTML = `Conta: <b>${esc(t.email)}</b>`;
  $('#sNome').value = t.nome || ''; $('#sEmpresa').value = t.empresa || ''; $('#sZap').value = t.whatsapp || '';
  $('#sDados').classList.toggle('hide', !!(t.tem_senha && (t.empresa || t.convidado)));
  $('#sEmpresaBox').classList.toggle('hide', !!t.convidado && !t.empresa);
  $('#formSenha').onsubmit = async e => {
    e.preventDefault(); $('#erroSenha').textContent = '';
    if ($('#sSenha').value !== $('#sSenha2').value) return $('#erroSenha').textContent = 'As duas senhas não são iguais.';
    $('#btnSenha').disabled = true;
    try {
      await api('/api/senha/definir', {method: 'POST', body: {token: tokenAcesso, senha: $('#sSenha').value, nome: $('#sNome').value, empresa: $('#sEmpresa').value, whatsapp: $('#sZap').value}});
      history.replaceState(null, '', '/app'); $('#formSenha').classList.add('hide'); $('#formEntrada').classList.remove('hide');
      await iniciar();
    } catch (err) { $('#erroSenha').textContent = err.message; }
    $('#btnSenha').disabled = false;
  };
}

// ---------- painel ----------
async function iniciar() {
  try { eu = await api('/api/eu'); } catch {
    $('#telaEntrada').classList.remove('hide'); $('#telaPainel').classList.add('hide');
    const qs = new URLSearchParams(location.search);
    if (qs.has('contador')) $('#btnSouContador').click(); else if (qs.has('cadastro')) modoEntrada('cadastro');
    return;
  }
  // empresa: a última escolhida; quem só foi convidado (sem empresa própria) cai na empresa de quem convidou
  const salva = lerConta();
  const escolhida = eu.contas.find(c => c.id === salva) || (!eu.empresa && !eu.contador && eu.contas[1]) || eu.contas[0];
  conta = {id: escolhida.id};
  conta = await api('/api/conta');
  gravarConta(conta.id);
  const mc = ehModoContador();
  document.body.classList.toggle('so-leitura', conta.papel === 'contador');
  $$('.so-dono').forEach(x => x.classList.toggle('hide', conta.papel !== 'dono' || mc));
  $$('.na-empresa').forEach(x => x.classList.toggle('hide', mc));
  $$('.so-contador-nav').forEach(x => x.classList.toggle('hide', !eu.contador));
  $('#contaSel').classList.toggle('hide', eu.contas.length < 2);
  $('#selConta').innerHTML = eu.contas.map(c => `<option value="${c.id}" ${c.id === conta.id ? 'selected' : ''}>${esc(c.id === eu.id && eu.contador && !eu.empresa ? 'Meu escritório' : c.empresa || 'Minha empresa')}${c.papel !== 'dono' ? ` (${PAPEL[c.papel]})` : ''}</option>`).join('');
  $('#selConta').onchange = () => { gravarConta(+$('#selConta').value); location.hash = ''; location.reload(); };
  $('#telaEntrada').classList.add('hide'); $('#telaPainel').classList.remove('hide');
  $('#nomeEmpresa').textContent = mc ? eu.nome : (conta.empresa || eu.empresa || eu.nome);
  $('#papelEu').innerHTML = conta.papel !== 'dono' ? ` <span class="papel">${PAPEL[conta.papel]}</span>` : mc ? ' <span class="papel">Contador</span>' : '';
  $('#avisoPag').classList.toggle('hide', conta.liberado || mc);
  $('#avisoPagTxt').textContent = conta.papel === 'dono' ? 'Seu acesso ainda não foi liberado. Conclua o pagamento para gerar as escalas.' : 'O acesso desta empresa ainda não foi liberado pelo dono.';
  if (eu.checkout) $('#btnPagar').href = eu.checkout;
  await carregaEquipes();
  rota();
}

// rotas: #visao, #comecar, #equipe/ID/aba, #ocorrencias, #fechamento, #contador, #acessos, #empresa, #conta
window.onhashchange = () => rota();
const ir = h => { document.body.classList.remove('menu-aberto'); if (location.hash === '#' + h) rota(); else location.hash = h; };
$('#btnMenu').onclick = () => document.body.classList.toggle('menu-aberto');
document.addEventListener('click', e => {
  if (document.body.classList.contains('menu-aberto') && !e.target.closest('#lateral') && !e.target.closest('#btnMenu')) document.body.classList.remove('menu-aberto');
  const b = e.target.closest('[data-ir]'); if (b) { e.preventDefault(); ir(b.dataset.ir); }
  if (e.target.closest('[data-ir-oc]')) abreDlgOc({funcionario_id: e.target.closest('[data-func]')?.dataset.func});
});
async function rota() {
  if (!conta) return;
  let [v, id, aba] = (location.hash.slice(1) || '').split('/');
  const mc = ehModoContador();
  if (mc && !['contador', 'conta'].includes(v)) v = 'contador';
  if (!v) v = conta.papel === 'dono' && !equipes.length ? 'comecar' : 'visao';
  // dono sem nenhuma unidade: sempre começa pelo primeiro acesso guiado
  if (conta.papel === 'dono' && !equipes.length && ['visao', 'equipe', 'ocorrencias', 'fechamento'].includes(v)) v = 'comecar';
  if (!document.getElementById('v-' + v) || (['acessos', 'empresa'].includes(v) && conta.papel !== 'dono') || (v === 'comecar' && !podeEditar())) v = 'visao';
  if (v === 'equipe' && !equipes.some(e => e.id === +id)) v = 'visao';
  $$('.vista').forEach(x => x.classList.toggle('hide', x.id !== 'v-' + v));
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.ir === v));
  $$('#listaEquipes button').forEach(b => b.classList.toggle('on', v === 'equipe' && +b.dataset.id === +id));
  window.scrollTo(0, 0);
  try {
    if (v === 'comecar') wizInicio(id === 'unidade' || equipes.length > 0);
    else if (v === 'visao') await telaVisao();
    else if (v === 'equipe') await abreEquipe(+id, aba);
    else if (v === 'ocorrencias') await telaOcorrencias();
    else if (v === 'fechamento') await telaFechamento();
    else if (v === 'contador') await telaContador();
    else if (v === 'acessos') await telaAcessos();
    else if (v === 'empresa') await telaEmpresa();
    else if (v === 'conta') telaConta();
  } catch (err) { toast(err.message); }
}
async function carregaEquipes() {
  if (ehModoContador()) { equipes = []; return; }
  equipes = await api('/api/equipes');
  $('#listaEquipes').innerHTML = equipes.map(e => `<li><button data-id="${e.id}" data-ir="equipe/${e.id}"><span>${esc(e.nome)}</span><small>${e.total}</small></button></li>`).join('');
}
$('#btnNova').onclick = () => ir('comecar/unidade');

// ---------- primeiro acesso guiado ----------
let wz = null;
function wizInicio(soUnidade) {
  wz = {passo: soUnidade ? 2 : 0, soUnidade, empresa: {nome: conta.empresa || eu.empresa || '', porte: conta.porte || '', uf: conta.uf || '', cidade: '', feriados_locais: ''},
    unidade: {nome: '', setor: 'varejo', abertos: [...SETORES.varejo.abertos], minimo: [...SETORES.varejo.minimo], horas_dia: 8}, pessoas: ''};
  wizDesenha();
}
const wizPessoas = () => wz.pessoas.split('\n').map(l => l.trim()).filter(Boolean).map(l => { const [nome, ...c] = l.split(/\s+[-–]\s+/); return {nome: nome.trim(), cargo: c.join(' - ').trim()}; });
function wizBarra() { const total = wz.soUnidade ? [2, 3] : [0, 1, 2, 3]; return `<div class="wiz-passos">${total.map(p => `<span class="${p <= wz.passo ? 'on' : ''}"></span>`).join('')}</div>`; }
function wizDesenha() {
  const w = $('#wiz'), u = wz.unidade;
  if (wz.passo === 0) {
    w.innerHTML = `${wizBarra()}<h1>Olá, ${esc((eu.nome || '').split(' ')[0])}! Vamos montar sua escala 5x2.</h1>
      <p class="sub">São 3 perguntas rápidas. No final, a escala sai pronta, já dentro da nova lei, com uma análise do que está certo e do que precisa de atenção.</p>
      <div class="cartao"><h3 class="sec-tit">O que mudou com o fim da 6x1 (EC 141/2026)</h3>
        <div class="lei-pontos">
          <div><b class="n">2</b><span><b>Duas folgas por semana</b> para cada pessoa, uma delas de preferência no domingo.</span></div>
          <div><b class="n">8h</b><span><b>Até 8 horas por dia.</b> O limite da semana cai para <b>42h</b> a partir de 16/12/2026 e para <b>40h</b> a partir de 16/12/2027. O salário não pode ser reduzido.</span></div>
          <div><b class="n">3</b><span>No comércio, cada pessoa continua precisando de <b>pelo menos 1 domingo de folga a cada 3 semanas</b> (Lei 10.101).</span></div>
        </div>
        <p class="dica">Detalhes e perguntas frequentes em <a href="/ajuda" target="_blank">Ajuda e a nova lei</a>.</p>
      </div>
      <div class="wiz-acoes"><span></span><button class="btn" id="wzProx">Começar</button></div>`;
  } else if (wz.passo === 1) {
    const e = wz.empresa;
    w.innerHTML = `${wizBarra()}<h1>Sua empresa</h1><p class="sub">Isso ajusta os feriados e as regras que valem para você.</p>
      <div class="cartao">
        <label for="wzNome" style="margin-top:0">Nome da empresa</label><input id="wzNome" value="${esc(e.nome)}" placeholder="Ex.: Império Progressivas">
        <label>Qual é o porte da empresa?</label>
        <div class="opcoes">${Object.entries(PORTES).map(([k, [n, d]]) => `<label><input type="radio" name="wzPorte" value="${k}" ${e.porte === k ? 'checked' : ''}>${n}${d ? `<small>${d}</small>` : ''}</label>`).join('')}</div>
        <div id="wzPorteNota"></div>
        <div class="form-linha" style="margin-top:12px">
          <div><label for="wzUf">Estado</label><select id="wzUf"><option value="">Escolha</option>${Escala.UFS.map(u => `<option ${e.uf === u ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
          <div style="flex:2 1 200px"><label for="wzCidade">Cidade</label><input id="wzCidade" value="${esc(e.cidade)}" placeholder="Ex.: Salvador"></div>
        </div>
        <label for="wzFer">Feriados da sua cidade (opcional)</label><input id="wzFer" value="${esc(e.feriados_locais)}" placeholder="Dia/mês. Ex.: 24/06, 08/12">
        <p class="dica" style="margin-top:6px">Feriados nacionais e do seu estado já entram sozinhos.</p>
        <p class="erro" id="wzErro"></p>
      </div>
      <div class="wiz-acoes"><button class="btn sec" id="wzVolta">Voltar</button><button class="btn" id="wzProx">Continuar</button></div>`;
    const nota = () => {
      const p = $('input[name=wzPorte]:checked')?.value;
      $('#wzPorteNota').innerHTML = p === 'mei' ? '<div class="nota">MEI pode ter <b>só 1 empregado</b> registrado (LC 123/2006). A escala funciona, mas com 1 pessoa não dá para abrir 6 ou 7 dias na semana: ela folga 2 dias e a loja fica sem ninguém nesses dias, a não ser que você mesmo cubra.</div>'
        : p === 'me' || p === 'epp' ? '<div class="nota info">A emenda permite uma lei complementar com transição própria para micro e pequenas empresas, que ainda não existe. Até lá, a regra vale igual para todos.</div>' : '';
    };
    $$('input[name=wzPorte]').forEach(i => i.onchange = nota); nota();
  } else if (wz.passo === 2) {
    w.innerHTML = `${wizBarra()}<h1>${wz.soUnidade ? 'Nova unidade' : 'Seu local de trabalho'}</h1><p class="sub">Loja, unidade, filial ou setor. Se você tem mais de um, cadastre o primeiro agora e os outros depois.</p>
      <div class="cartao">
        <label for="wzUn" style="margin-top:0">Como você chama este lugar?</label><input id="wzUn" value="${esc(u.nome)}" placeholder="Ex.: Loja Shopping Norte">
        <label for="wzSetor">Ramo</label><select id="wzSetor">${Object.entries(SETORES).map(([k, s]) => `<option value="${k}" ${u.setor === k ? 'selected' : ''}>${s.nome}</option>`).join('')}</select>
        <label>Em que dias abre, e quantas pessoas precisam estar trabalhando no mínimo em cada dia?</label>
        <div class="dias-conf" id="wzDias"></div>
        <p class="dica" style="margin-top:6px">Já preenchemos com o comum do seu ramo. Ajuste à sua realidade: é com esse mínimo que a escala é montada.</p>
        <div style="max-width:280px"><label for="wzHoras">Horas de trabalho por dia (sem o almoço)</label><input id="wzHoras" type="number" min="1" max="12" step="0.25" value="${u.horas_dia}"></div>
        <p class="dica" id="wzHorasDica" style="margin-top:6px"></p>
        <p class="erro" id="wzErro"></p>
      </div>
      <div class="wiz-acoes"><button class="btn sec" id="wzVolta">${wz.soUnidade ? 'Cancelar' : 'Voltar'}</button><button class="btn" id="wzProx">Continuar</button></div>`;
    const desenhaDias = () => {
      $('#wzDias').innerHTML = DIAS.map((d, i) => `<div><button type="button" class="tg ${u.abertos[i] ? 'on' : ''}" data-i="${i}">${d}</button><input type="number" min="0" max="200" value="${u.minimo[i]}" data-m="${i}" aria-label="Mínimo ${d}" ${u.abertos[i] ? '' : 'disabled'}></div>`).join('');
      $$('#wzDias .tg').forEach(b => b.onclick = () => { const i = +b.dataset.i; u.abertos[i] = u.abertos[i] ? 0 : 1; if (!u.abertos[i]) u.minimo[i] = 0; else if (!u.minimo[i]) u.minimo[i] = 1; desenhaDias(); });
      $$('#wzDias input').forEach(inp => inp.oninput = () => u.minimo[+inp.dataset.m] = Math.max(0, +inp.value || 0));
    };
    const dicaHoras = () => {
      const h = +String($('#wzHoras').value).replace(',', '.') || 0, sem = Math.round(h * 50) / 10;
      $('#wzHorasDica').textContent = h > 8 ? `${String(sem).replace('.', ',')}h por semana. Acima de 8h por dia só com acordo ou convenção coletiva.` : `${String(sem).replace('.', ',')}h por semana: ${sem <= 40 ? 'dentro do limite atual e do limite final de 40h.' : sem <= 42 ? 'dentro do limite de 42h, mas acima das 40h que valem a partir de 16/12/2027.' : 'acima do limite da nova lei.'}`;
    };
    $('#wzSetor').onchange = () => { u.setor = $('#wzSetor').value; u.abertos = [...SETORES[u.setor].abertos]; u.minimo = [...SETORES[u.setor].minimo]; desenhaDias(); };
    $('#wzHoras').oninput = dicaHoras;
    desenhaDias(); dicaHoras();
  } else if (wz.passo === 3) {
    w.innerHTML = `${wizBarra()}<h1>Quem trabalha em ${esc(u.nome)}?</h1><p class="sub">Uma pessoa por linha. Pode colar a lista do WhatsApp ou da planilha.</p>
      <div class="cartao">
        <textarea id="wzPessoas" rows="9" placeholder="Ana Souza&#10;Bruna Lima - gerente&#10;Carlos Henrique&#10;...">${esc(wz.pessoas)}</textarea>
        <div id="wzConta"></div>
        <p class="dica" style="margin-top:8px">Cargo é opcional: escreva depois de um traço. Matrícula, admissão e folga fixa você completa depois, se quiser.</p>
        <p class="erro" id="wzErro"></p>
      </div>
      <div class="wiz-acoes"><button class="btn sec" id="wzVolta">Voltar</button><button class="btn" id="wzProx">${conta.liberado ? 'Gerar minha escala' : 'Ver minha análise'}</button></div>`;
    const conta_ = () => {
      wz.pessoas = $('#wzPessoas').value;
      const n = wizPessoas().length, total = u.minimo.reduce((a, m, d) => a + (u.abertos[d] ? m : 0), 0), precisa = Math.ceil(total / 5);
      $('#wzConta').innerHTML = !n ? '' : `<p class="contagem">${plural(n, 'pessoa', 'pessoas')}.</p>` + (n >= precisa
        ? `<div class="nota info">Com esse mínimo por dia, você precisa de pelo menos ${precisa} pessoas na escala 5x2. Você tem ${n}: dá para cobrir todos os dias.</div>`
        : `<div class="nota">Com esse mínimo por dia, a escala 5x2 precisa de pelo menos ${precisa} pessoas e você tem ${n}. A escala vai sair, mas com dias abaixo do mínimo. A análise mostra quais.</div>`)
        + (wz.empresa.porte === 'mei' && n > 1 ? '<div class="nota">MEI pode ter só 1 empregado registrado. Confira com seu contador.</div>' : '');
    };
    $('#wzPessoas').oninput = conta_; conta_();
  }
  const prox = $('#wzProx'), volta = $('#wzVolta');
  if (volta) volta.onclick = () => { if (wz.soUnidade && wz.passo === 2) return ir(equipes[0] ? `equipe/${equipes[0].id}` : 'visao'); wz.passo--; wizDesenha(); };
  if (prox) prox.onclick = () => wizAvanca();
}
async function wizAvanca() {
  const erro = m => { $('#wzErro').textContent = m; };
  if (wz.passo === 1) {
    Object.assign(wz.empresa, {nome: $('#wzNome').value.trim(), porte: $('input[name=wzPorte]:checked')?.value || '', uf: $('#wzUf').value, cidade: $('#wzCidade').value.trim(), feriados_locais: $('#wzFer').value});
    if (!wz.empresa.nome) return erro('Informe o nome da empresa.');
    if (!wz.empresa.porte) return erro('Escolha o porte. Se não souber, marque "Não sei".');
  }
  if (wz.passo === 2) {
    wz.unidade.nome = $('#wzUn').value.trim(); wz.unidade.horas_dia = +String($('#wzHoras').value).replace(',', '.') || 8;
    if (!wz.unidade.nome) return erro('Dê um nome para o local. Ex.: Loja Centro.');
    if (!wz.unidade.abertos.some(Boolean)) return erro('Marque pelo menos um dia aberto.');
  }
  if (wz.passo === 3) {
    wz.pessoas = $('#wzPessoas').value;
    if (!wizPessoas().length) return erro('Escreva pelo menos uma pessoa.');
    return wizGerar();
  }
  wz.passo++; wizDesenha();
}
async function wizGerar() {
  const btn = $('#wzProx'); btn.disabled = true; btn.textContent = 'Montando sua escala…';
  try {
    const r = await api('/api/onboarding', {method: 'POST', body: {empresa: wz.soUnidade ? undefined : wz.empresa, unidade: wz.unidade, pessoas: wizPessoas(), inicio: proxSegunda(), semanas: 4}});
    conta = await api('/api/conta'); // feriados do estado/cidade recém salvos
    if (!wz.soUnidade) { eu = await api('/api/eu'); $('#nomeEmpresa').textContent = eu.empresa || eu.nome; }
    await carregaEquipes();
    wizResultado(r);
  } catch (err) { $('#wzErro').textContent = err.message; btn.disabled = false; btn.textContent = 'Tentar de novo'; }
}
function wizResultado(r) {
  const eq = r.equipe, n = wizPessoas().length;
  let corpo;
  if (r.escala) {
    const a = Escala.analisar(r.escala, {horasDia: +eq.horas_dia, ctx: conta.ctx});
    corpo = `<h1>Pronto! A escala de ${esc(eq.nome)} está montada.</h1>
      <p class="sub">${plural(n, 'pessoa', 'pessoas')}, 4 semanas a partir de ${br(r.escala.inicio)}. Veja o diagnóstico:</p>
      ${htmlAnalise(a)}
      <div class="wiz-acoes"><button class="btn sec" id="wzLink">Mandar para a equipe no WhatsApp</button><button class="btn" data-ir="equipe/${eq.id}">Ver a escala</button></div>
      <div class="cartao" style="margin-top:14px"><h3 class="sec-tit">Próximos passos</h3>
        <ul class="diag">
          <li><span class="ic info">1</span><div><b>Confira e ajuste</b><span>Na escala, clique em um dia para trocar trabalho e folga.</span></div></li>
          <li><span class="ic info">2</span><div><b>Mande para a equipe</b><span>Cada pessoa abre o link, escolhe o próprio nome e vê as folgas. Sem instalar nada.</span></div></li>
          <li><span class="ic info">3</span><div><b>Chame seu contador</b><span>Ele acompanha faltas, férias e o fechamento do mês sem você mandar planilha. <button class="link" data-ir="acessos">Dar acesso</button></span></div></li>
          ${equipes.length === 1 ? '<li><span class="ic info">4</span><div><b>Tem outra loja ou unidade?</b><span><button class="link" data-ir="comecar/unidade">Cadastrar outra unidade</button></span></div></li>' : ''}
        </ul></div>`;
  } else {
    const total = eq.minimo.reduce((s, m, d) => s + (eq.abertos[d] ? m : 0), 0), precisa = Math.ceil(total / 5);
    corpo = `<h1>Tudo pronto para gerar a escala de ${esc(eq.nome)}.</h1>
      <p class="sub">Seus dados estão salvos. Uma prévia do que encontramos:</p>
      <ul class="diag">
        <li><span class="ic ${n >= precisa ? 'ok' : 'ruim'}">${n >= precisa ? '✓' : '!'}</span><div><b>${n >= precisa ? 'Gente suficiente' : `Falta${precisa - n > 1 ? 'm' : ''} ${precisa - n} pessoa${precisa - n > 1 ? 's' : ''}`}</b><span>Com o mínimo que você definiu, a escala 5x2 precisa de ${precisa} pessoas. Você tem ${n}.</span></div></li>
      </ul>
      <div class="cartao" style="margin-top:14px"><h3 class="sec-tit">Libere o acesso para gerar a escala completa</h3>
        <p>Pagamento único de R$ 47. A escala de 4 semanas, a análise e o acesso do contador ficam liberados na hora.</p>
        <div class="acoes">${r.checkout ? `<a class="btn" href="${esc(r.checkout)}" target="_blank" rel="noopener">Liberar por R$ 47</a>` : ''}<button class="btn sec" data-ir="equipe/${eq.id}">Ver a unidade</button></div></div>`;
  }
  $('#wiz').innerHTML = corpo;
  if ($('#wzLink')) $('#wzLink').onclick = () => linkEquipe(eq.id);
}

// ---------- análise ----------
function htmlAnalise(a) {
  const ic = i => i.ok === true ? '<span class="ic ok">✓</span>' : i.ok === false ? '<span class="ic ruim">!</span>' : '<span class="ic info">i</span>';
  return `<div class="diag-topo ${a.problemas ? 'ruim' : 'ok'}"><img src="/img/mascote.svg" alt=""><div><b>${esc(a.resumo)}</b>
      ${plural(a.n, 'pessoa', 'pessoas')} · precisa de ${a.necessarios} · ${String(a.horasSemana).replace('.', ',')}h por semana</div></div>
    <ul class="diag">${a.itens.map(i => `<li>${ic(i)}<div><b>${esc(i.titulo)}</b><span>${esc(i.texto)}</span></div></li>`).join('')}</ul>`;
}
function desenhaAnalise() {
  const area = $('#areaAnalise');
  if (!escalaAtual) {
    const total = atual.minimo.reduce((s, m, d) => s + (atual.abertos[d] ? m : 0), 0), precisa = Math.ceil(total / 5);
    area.innerHTML = `<div class="cartao"><div class="numeros"><div><b>${funcs.length}</b><span>pessoas</span></div><div><b>${precisa}</b><span>precisa para cobrir o mínimo</span></div></div>
      <p>Gere a escala para ver a análise completa: cobertura dia a dia, folgas, domingos, horas e feriados.</p></div>`;
    return;
  }
  const a = Escala.analisar(escalaAtual, {horasDia: +atual.horas_dia || 8, ctx: conta.ctx});
  const folgasDom = escalaAtual.funcionarios.map((f, i) => ({nome: f.nome, dom: escalaAtual.dados.filter(s => s[i]?.[6] === 'F').length}));
  area.innerHTML = `${htmlAnalise(a)}
    <div class="cartao" style="margin-top:14px"><h3 class="sec-tit">Quem folga no domingo</h3>
      <p class="dica">Nas ${escalaAtual.semanas} semanas desta escala.</p>
      <div class="pessoas" style="margin-top:8px">${folgasDom.map(f => `<span class="pessoa">${esc(f.nome)}: ${plural(f.dom, 'domingo', 'domingos')}</span>`).join('')}</div>
    </div>`;
}

// ---------- início ----------
async function telaVisao() {
  const h = new Date().getHours();
  $('#vOla').textContent = `${h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'}, ${(eu.nome || '').split(' ')[0]}`;
  if (!equipes.length) { $('#vData').textContent = ''; $('#vEquipes').innerHTML = '<div class="cartao vazio"><img src="/img/mascote.svg" alt=""><h2>Nenhuma unidade ainda</h2><p>O dono da empresa ainda não cadastrou as unidades.</p></div>'; $('#vProx').innerHTML = ''; return; }
  const v = await api('/api/visao?data=' + hojeIso());
  const dt = new Date(v.data + 'T12:00:00').toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric', month: 'long'});
  $('#vData').textContent = dt.charAt(0).toUpperCase() + dt.slice(1) + (v.feriado ? ` · Feriado: ${v.feriado}` : '');
  const pessoas = (l, cls = '') => l.length ? `<div class="pessoas">${l.map(p => `<span class="pessoa ${cls}">${esc(p.nome)}${p.motivo ? ' · ' + esc(p.motivo) : ''}</span>`).join('')}</div>` : '<p class="dica" style="margin-top:4px">Ninguém</p>';
  $('#vEquipes').innerHTML = v.equipes.map(e => {
    const hoje = e.dias[0], semEscalaHoje = hoje.presentes === null;
    return `<article class="cartao">
      <div class="eq-top"><h3>${esc(e.nome)}</h3><button class="link" data-ir="equipe/${e.id}">Abrir</button></div>
      ${!e.total ? `<p class="dica" style="margin-top:10px">Ninguém cadastrado.</p><button class="btn pq edita" style="margin-top:10px" data-ir="equipe/${e.id}/funcionarios">Cadastrar pessoas</button>` : `
      <p class="grande">${semEscalaHoje ? '–' : e.hoje.trabalham.length}<small>${!hoje.aberto ? 'fechado hoje' : semEscalaHoje ? 'sem escala para hoje' : `trabalhando hoje · mínimo ${hoje.minimo}`}</small></p>
      <div class="semana7">${e.dias.map((d, i) => {
        const cls = !d.aberto ? 'd-fech' : d.presentes === null ? 'd-sem' : d.presentes >= d.minimo ? 'd-ok' : 'd-baixo';
        return `<div class="${cls} ${i === 0 ? 'd-hoje' : ''}" title="${br(d.data)}${d.feriado ? ' · ' + esc(d.feriado) : ''}">${d.dia}<b>${!d.aberto ? '–' : d.presentes === null ? '?' : d.presentes + '/' + d.minimo}</b>${d.feriado ? '<span class="fer-tag">feriado</span>' : ''}</div>`;
      }).join('')}</div>
      ${!semEscalaHoje ? `<p class="rotulo">Folgam hoje</p>${pessoas(e.hoje.folgam)}` : ''}
      ${e.hoje.ausentes.length ? `<p class="rotulo">Fora hoje</p>${pessoas(e.hoje.ausentes, 'aus')}` : ''}
      ${e.proxima_semana_sem_escala || semEscalaHoje ? `<div class="alerta-eq"><span>${semEscalaHoje ? 'Sem escala para esta semana.' : 'A próxima semana ainda não tem escala.'}</span><button class="btn pq edita" data-ir="equipe/${e.id}">Gerar</button></div>` : ''}`}
    </article>`;
  }).join('');
  $('#vProx').innerHTML = v.ocorrencias.length ? v.ocorrencias.map(o => `<li><span class="tipo tipo-${o.tipo}">${esc(ROTULO[o.tipo] || o.tipo)}</span> <b>${esc(o.funcionario)}</b><br><span class="dica">${esc(o.equipe)} · ${o.inicio === o.fim ? br(o.inicio) : br(o.inicio) + ' a ' + br(o.fim)}</span></li>`).join('')
    : '<li class="dica">Nenhuma férias, atestado ou afastamento lançado.</li>';
}

// ---------- unidade ----------
async function abreEquipe(id, aba) {
  atual = equipes.find(e => e.id === id) || equipes[0];
  $('#tEquipe').textContent = atual.nome;
  $('#tSetor').textContent = SETORES[atual.setor]?.nome || '';
  abreAba(aba || 'escala', false);
  [funcs, escalas] = await Promise.all([api(`/api/equipes/${atual.id}/funcionarios`), api(`/api/equipes/${atual.id}/escalas`)]);
  escalaAtual = escalas[0] || null; semanaAtual = 0;
  if (!$('#eInicio').value) $('#eInicio').value = proxSegunda();
  desenhaFuncs(); desenhaEscala(); desenhaConfig(); desenhaAnalise();
}
$$('.tabs button').forEach(b => b.onclick = () => abreAba(b.dataset.aba, true));
function abreAba(aba, mudaUrl) {
  if (!$(`[data-painel="${aba}"]`)) aba = 'escala';
  $$('.tabs button').forEach(x => x.classList.toggle('on', x.dataset.aba === aba));
  $$('[data-painel]').forEach(p => p.classList.toggle('hide', p.dataset.painel !== aba));
  if (mudaUrl && atual) history.replaceState(null, '', `#equipe/${atual.id}/${aba}`);
}

// ---------- pessoas ----------
function chipsFixa(el, sel) {
  el.innerHTML = DIAS.map((d, i) => `<button type="button" data-d="${i}" class="${sel.includes(i) ? 'on' : ''}">${d}</button>`).join('');
  el.querySelectorAll('button').forEach(b => b.onclick = () => {
    const d = +b.dataset.d, i = sel.indexOf(d);
    if (i >= 0) sel.splice(i, 1); else { if (sel.length >= 2) sel.shift(); sel.push(d); }
    chipsFixa(el, sel);
  });
}
$('#formFunc').onsubmit = async e => {
  e.preventDefault();
  const lista = $('#fNome').value.split('\n').map(l => l.trim()).filter(Boolean).map(l => { const [nome, ...c] = l.split(/\s+[-–]\s+/); return {nome, cargo: c.join(' - ')}; });
  if (!lista.length) return $('#fNome').focus();
  try {
    await api(`/api/equipes/${atual.id}/funcionarios`, {method: 'POST', body: lista});
    $('#fNome').value = '';
    funcs = await api(`/api/equipes/${atual.id}/funcionarios`); desenhaFuncs(); carregaContagem();
    toast(`${plural(lista.length, 'pessoa cadastrada', 'pessoas cadastradas')}. Gere a escala de novo para incluir.`);
  } catch (err) { toast(err.message); }
};
function desenhaFuncs() {
  $('#listaFunc').innerHTML = funcs.length ? funcs.map(f => `<li data-func="${f.id}">
    <div><b>${esc(f.nome)}</b> ${f.cargo ? `<small>· ${esc(f.cargo)}</small>` : ''}${f.matricula ? `<small> · matr. ${esc(f.matricula)}</small>` : ''}${f.folga_fixa.length ? ` <span class="tag">Folga fixa: ${f.folga_fixa.map(d => DIAS[d]).join(' e ')}</span>` : ''}</div>
    <div></div>
    <div class="edita" style="display:flex;gap:12px;flex-wrap:wrap"><button class="link" data-ir-oc>Falta/férias</button><button class="link" data-edit="${f.id}">Editar</button><button class="link perigo" data-del="${f.id}">Remover</button></div></li>`).join('')
    : `<li><span class="dica">Ninguém cadastrado ainda.</span></li>`;
  $$('[data-del]').forEach(b => b.onclick = async () => {
    const f = funcs.find(x => x.id === +b.dataset.del);
    if (!confirm(`Remover ${f.nome}? As escalas antigas continuam salvas.`)) return;
    await api(`/api/funcionarios/${f.id}`, {method: 'DELETE'});
    funcs = funcs.filter(x => x.id !== f.id); desenhaFuncs(); carregaContagem();
  });
  $$('[data-edit]').forEach(b => b.onclick = () => abreEditFunc(funcs.find(x => x.id === +b.dataset.edit)));
}
let editFixa = [], editId = null;
function abreEditFunc(f) {
  editId = f.id; editFixa = [...f.folga_fixa];
  $('#efNome').value = f.nome; $('#efCargo').value = f.cargo || ''; $('#efMat').value = f.matricula || '';
  $('#efAdm').value = f.admissao ? String(f.admissao).slice(0, 10) : ''; $('#efTel').value = f.telefone || ''; $('#efErro').textContent = '';
  chipsFixa($('#efFixa'), editFixa); $('#dlgFunc').showModal();
}
$('#formEditFunc').onsubmit = async e => {
  if (e.submitter?.value !== 'ok') return;
  e.preventDefault();
  try {
    await api(`/api/funcionarios/${editId}`, {method: 'PUT', body: {nome: $('#efNome').value, cargo: $('#efCargo').value, matricula: $('#efMat').value, admissao: $('#efAdm').value, telefone: $('#efTel').value, folga_fixa: editFixa}});
    $('#dlgFunc').close(); funcs = await api(`/api/equipes/${atual.id}/funcionarios`); desenhaFuncs(); toast('Salvo.');
  } catch (err) { $('#efErro').textContent = err.message; }
};
async function carregaContagem() {
  equipes = await api('/api/equipes');
  $$('#listaEquipes button').forEach(b => { const e = equipes.find(x => x.id === +b.dataset.id); if (e) b.querySelector('small').textContent = e.total; });
}

// ---------- funcionamento ----------
let cfg = null;
function desenhaConfig() {
  cfg = {nome: atual.nome, setor: atual.setor, abertos: [...atual.abertos], minimo: [...atual.minimo]};
  const ro = !podeEditar() ? 'disabled' : '';
  $('#cfNome').value = cfg.nome; $('#cfSetor').value = cfg.setor; $('#cfHoras').value = +atual.horas_dia || 8;
  $('#cfNome').disabled = $('#cfSetor').disabled = $('#cfHoras').disabled = !podeEditar();
  $('#cfDias').innerHTML = DIAS.map((d, i) => `<div><button type="button" class="tg ${cfg.abertos[i] ? 'on' : ''}" data-i="${i}" ${ro}>${d}</button><input type="number" min="0" max="200" value="${cfg.minimo[i]}" data-m="${i}" aria-label="Mínimo ${d}" ${cfg.abertos[i] && podeEditar() ? '' : 'disabled'}></div>`).join('');
  $$('#cfDias .tg').forEach(b => b.onclick = () => { const i = +b.dataset.i; cfg.abertos[i] = cfg.abertos[i] ? 0 : 1; b.classList.toggle('on'); $(`[data-m="${i}"]`).disabled = !cfg.abertos[i]; });
  $$('#cfDias input').forEach(inp => inp.oninput = () => cfg.minimo[+inp.dataset.m] = +inp.value || 0);
}
$('#cfSetor').onchange = () => { const s = SETORES[$('#cfSetor').value]; atual = {...atual, setor: $('#cfSetor').value, abertos: [...s.abertos], minimo: [...s.minimo]}; desenhaConfig(); };
$('#btnSalvarCfg').onclick = async () => {
  try {
    const e = await api(`/api/equipes/${atual.id}`, {method: 'PUT', body: {...cfg, nome: $('#cfNome').value, setor: $('#cfSetor').value, horas_dia: $('#cfHoras').value}});
    await carregaEquipes(); atual = equipes.find(x => x.id === e.id); $('#tEquipe').textContent = atual.nome; desenhaAnalise(); toast('Salvo. Gere a escala de novo para aplicar o novo mínimo.');
  } catch (err) { toast(err.message); }
};
$('#btnExcluir').onclick = async () => {
  if (!confirm(`Excluir "${atual.nome}" com todas as pessoas e escalas?`)) return;
  await api(`/api/equipes/${atual.id}`, {method: 'DELETE'}); atual = null; await carregaEquipes(); ir('visao');
};

// ---------- escala ----------
$('#btnGerar').onclick = async () => {
  if (!funcs.length) { abreAba('funcionarios', true); return toast('Cadastre as pessoas primeiro.'); }
  if (escalaAtual && $('#eInicio').value < Escala.somaDias(escalaAtual.inicio.slice(0, 10), escalaAtual.semanas * 7) && !confirm('Já existe escala para parte desse período. A nova substitui a anterior nesses dias (a antiga fica guardada). Continuar?')) return;
  $('#btnGerar').disabled = true;
  try {
    escalaAtual = await api(`/api/equipes/${atual.id}/escalas`, {method: 'POST', body: {inicio: $('#eInicio').value, semanas: +$('#eSemanas').value}});
    escalas.unshift(escalaAtual); semanaAtual = 0; desenhaEscala(); desenhaAnalise(); toast('Escala gerada. Férias e atestados já lançados foram respeitados.');
  } catch (err) { toast(err.message); if (err.status === 402) $('#avisoPag').classList.remove('hide'); }
  $('#btnGerar').disabled = false;
};
const dataDe = (inicio, s, d) => Escala.somaDias(inicio.slice(0, 10), s * 7 + d);
const ferDe = data => Escala.feriado(data, conta.ctx);
function tabelaSemana(e, s, editavel) {
  const sem = e.dados[s];
  return `<table class="esc"><thead><tr><th></th>${DIAS.map((d, i) => { const fer = ferDe(dataDe(e.inicio, s, i)); return `<th class="${fer ? 'fer' : ''}" ${fer ? `title="${esc(fer)}"` : ''}>${d}<small>${dm(dataDe(e.inicio, s, i))}${fer ? ' · feriado' : ''}</small></th>`; }).join('')}</tr></thead><tbody>
  ${sem.map((dias, f) => `<tr><td>${esc(e.funcionarios[f]?.nome)}${e.funcionarios[f]?.cargo ? `<small>${esc(e.funcionarios[f].cargo)}</small>` : ''}</td>
    ${dias.map((c, d) => !e.abertos[d] ? '<td class="X">fechado</td>'
      : COD[c] ? `<td class="A" title="${esc(COD[c])}">${esc(COD[c])}</td>`
      : `<td class="${c}" ${editavel ? `data-f="${f}" data-d="${d}" title="Clique para trocar"` : ''}>${c === 'F' ? 'Folga' : 'Trabalha'}</td>`).join('')}</tr>`).join('')}
  <tr class="tot"><td>Presentes / mínimo</td>${DIAS.map((_, d) => { if (!e.abertos[d]) return '<td class="X">—</td>'; const p = sem.filter(x => x[d] === 'T').length; return `<td class="${p >= e.minimo[d] ? 'ok' : 'baixo'}">${p} / ${e.minimo[d]}</td>`; }).join('')}</tr>
  </tbody></table>`;
}
// no celular: um cartão por dia, com quem trabalha, quem folga e quem está fora
function listaSemana(e, s, editavel) {
  const sem = e.dados[s];
  return DIAS.map((d, i) => {
    const data = dataDe(e.inicio, s, i), fer = ferDe(data);
    if (!e.abertos[i]) return `<div class="dia-card"><h4>${d} ${dm(data)} <small>fechado</small></h4></div>`;
    const grupo = cod => sem.map((x, f) => ({x: x[i], f})).filter(o => cod === 'A' ? COD[o.x] : o.x === cod);
    const p = grupo('T').length, chip = (o, cls) => `<button class="chip ${cls}" ${editavel && cls !== 'A' ? `data-f="${o.f}" data-d="${i}"` : ''}>${esc(e.funcionarios[o.f]?.nome)}${cls === 'A' ? ' · ' + esc(COD[o.x]) : ''}</button>`;
    return `<div class="dia-card"><h4><span>${d} ${dm(data)}${fer ? ` <small>· ${esc(fer)}</small>` : ''}</span><small class="${p >= e.minimo[i] ? 'ok' : 'baixo'}">${p} de ${e.minimo[i]}</small></h4>
      <div class="grupo"><b>Trabalham</b>${grupo('T').map(o => chip(o, 'T')).join('') || '—'}</div>
      <div class="grupo"><b>Folgam</b>${grupo('F').map(o => chip(o, 'F')).join('') || '—'}</div>
      ${grupo('A').length ? `<div class="grupo"><b>Fora</b>${grupo('A').map(o => chip(o, 'A')).join('')}</div>` : ''}</div>`;
  }).join('');
}
function desenhaEscala() {
  const a = $('#areaEscala');
  if (!escalaAtual) {
    a.innerHTML = `<div class="vazio"><img src="/img/mascote.svg" alt=""><h2>Nenhuma escala ainda</h2><p>${funcs.length ? (podeEditar() ? `${plural(funcs.length, 'pessoa', 'pessoas')}. Escolha a data de início e clique em <b>Gerar escala</b>.` : 'A empresa ainda não gerou a escala desta unidade.') : 'Cadastre as pessoas na aba <b>Pessoas</b>.'}</p></div>`;
    return;
  }
  const e = escalaAtual, editavel = podeEditar();
  const an = Escala.analisar(e, {horasDia: +atual.horas_dia || 8, ctx: conta.ctx});
  const fim = Escala.somaDias(e.inicio.slice(0, 10), e.semanas * 7 - 1);
  a.innerHTML = `
    <div class="resumo-escala ${an.problemas ? 'ruim' : 'ok'}"><span>${esc(an.resumo)}</span><button class="link" data-aba-ir="analise">Ver análise</button></div>
    <p class="dica" style="margin-bottom:10px">De ${br(e.inicio)} a ${br(fim)}</p>
    <div class="semanas">${e.dados.map((_, i) => `<button data-s="${i}" class="${i === semanaAtual ? 'on' : ''}">Semana ${i + 1}</button>`).join('')}</div>
    <div class="rolagem sem-print">${tabelaSemana(e, semanaAtual, editavel)}</div>
    <div class="dias-lista">${listaSemana(e, semanaAtual, editavel)}</div>
    <div class="hide todas-semanas">${e.dados.map((_, i) => `<div class="semana-print hide"><h3>${esc(atual.nome)} · Semana ${i + 1}</h3>${tabelaSemana(e, i, false)}</div>`).join('')}</div>
    <div class="legenda"><span><i style="background:var(--azul-claro)"></i>Trabalha</span><span><i style="background:var(--amarelo)"></i>Folga</span><span><i style="background:#ece7fb"></i>Férias, atestado, falta</span>${editavel ? '<span>Toque em um nome ou dia para trocar trabalho e folga.</span>' : ''}</div>
    <div class="acoes">${editavel ? '<button class="btn" id="btnLinkEq">Mandar para a equipe</button>' : ''}<button class="btn sec" id="btnZap">Copiar texto para o WhatsApp</button><button class="btn sec" id="btnImprimir">Imprimir</button></div>
    <p class="hist">Gerada em ${new Date(e.criado_em).toLocaleString('pt-BR')}</p>`;
  $$('[data-aba-ir]').forEach(b => b.onclick = () => abreAba(b.dataset.abaIr, true));
  $$('.semanas button').forEach(b => b.onclick = () => { semanaAtual = +b.dataset.s; desenhaEscala(); });
  $$('#areaEscala td.A').forEach(td => td.onclick = () => toast('Esse dia tem férias, atestado ou falta lançado. Para mudar, apague em "Férias e faltas".'));
  $$('#areaEscala [data-f]').forEach(td => td.onclick = async () => {
    try {
      const r = await api(`/api/escalas/${e.id}`, {method: 'PATCH', body: {semana: semanaAtual, funcionario: +td.dataset.f, dia: +td.dataset.d}});
      e.dados = r.dados; desenhaEscala(); desenhaAnalise();
    } catch (err) { toast(err.message); }
  });
  if ($('#btnLinkEq')) $('#btnLinkEq').onclick = () => linkEquipe(atual.id);
  $('#btnImprimir').onclick = () => { $('.todas-semanas').classList.remove('hide'); window.print(); $('.todas-semanas').classList.add('hide'); };
  $('#btnZap').onclick = () => {
    let t = `*${atual.nome} — Escala 5x2*\n`;
    e.dados.forEach((s, i) => { t += `\n*Semana ${i + 1}* (a partir de ${dm(dataDe(e.inicio, i, 0))})\n`;
      s.forEach((dias, f) => {
        const folgas = dias.map((c, d) => c === 'F' && e.abertos[d] ? DIAS[d] : null).filter(Boolean);
        const fora = [...new Set(dias.map(c => COD[c]).filter(Boolean))];
        t += `${e.funcionarios[f].nome}: ${folgas.length ? 'folga ' + folgas.join(' e ') : 'sem folga'}${fora.length ? ` (${fora.join(', ').toLowerCase()})` : ''}\n`;
      }); });
    copiar(t, 'Texto copiado. Cole no grupo da equipe.');
  };
}
async function linkEquipe(id) {
  try {
    const {link} = await api(`/api/equipes/${id}/link`, {method: 'POST', body: {}});
    const msg = `Escala da equipe: ${link}\nAbra, escolha seu nome e veja suas folgas.`;
    if (navigator.share) { try { await navigator.share({text: msg}); return; } catch {} }
    copiar(msg, 'Link copiado. Cole no grupo da equipe: cada um escolhe o nome e vê as folgas.');
  } catch (err) { toast(err.message); }
}

// ---------- férias e faltas ----------
$('#ocTipo').innerHTML = Object.keys(OC).map(k => `<option value="${k}">${ROTULO[k]}</option>`).join('');
$('#ocFiltroTipo').innerHTML = '<option value="">Todos</option>' + Object.keys(OC).map(k => `<option value="${k}">${ROTULO[k]}</option>`).join('');
function ajustaTipo() {
  const banco = $('#ocTipo').value === 'banco_horas';
  $('#ocFimBox').classList.toggle('hide', banco); $('#ocHorasBox').classList.toggle('hide', !banco);
  $('#ocLblIni').textContent = banco ? 'Dia' : 'De';
  $('#ocDica').textContent = DICA[$('#ocTipo').value] || '';
}
$('#ocTipo').onchange = ajustaTipo;
$('#ocIni').onchange = () => { if (!$('#ocFim').value || $('#ocFim').value < $('#ocIni').value) $('#ocFim').value = $('#ocIni').value; };
async function abreDlgOc({funcionario_id} = {}) {
  if (!podeEditar()) return;
  const lista = await api('/api/funcionarios');
  if (!lista.length) return toast('Cadastre pessoas primeiro.');
  const grupos = {}; lista.forEach(f => (grupos[f.equipe] ||= []).push(f));
  $('#ocFunc').innerHTML = Object.entries(grupos).map(([eq, fs]) => `<optgroup label="${esc(eq)}">${fs.map(f => `<option value="${f.id}">${esc(f.nome)}</option>`).join('')}</optgroup>`).join('');
  const pre = funcionario_id || (location.hash.startsWith('#equipe') && lista.find(f => f.equipe_id === atual?.id)?.id);
  if (pre) $('#ocFunc').value = pre;
  $('#ocIni').value = $('#ocFim').value = hojeIso(); $('#ocHoras').value = ''; $('#ocObs').value = ''; $('#ocErro').textContent = '';
  ajustaTipo(); $('#dlgOc').showModal();
}
$('#formOc').onsubmit = async e => {
  if (e.submitter?.value !== 'ok') return;
  e.preventDefault(); $('#btnOcSalvar').disabled = true; $('#ocErro').textContent = '';
  try {
    await api('/api/ocorrencias', {method: 'POST', body: {funcionario_id: +$('#ocFunc').value, tipo: $('#ocTipo').value, inicio: $('#ocIni').value, fim: $('#ocFim').value, horas: $('#ocHoras').value, obs: $('#ocObs').value}});
    $('#dlgOc').close(); toast('Lançado. Já aparece na escala e no fechamento.'); rota();
  } catch (err) { $('#ocErro').textContent = err.message; }
  $('#btnOcSalvar').disabled = false;
};
function opcoesEquipe(sel, todas = 'Todas') {
  const v = sel.value;
  sel.innerHTML = `<option value="">${todas}</option>` + equipes.map(e => `<option value="${e.id}">${esc(e.nome)}</option>`).join('');
  sel.value = v;
}
const limitesMes = m => { const de = m + '-01'; return [de, Escala.somaDias(Escala.somaDias(de, 32).slice(0, 7) + '-01', -1)]; };
async function telaOcorrencias() {
  if (!$('#ocMes').value) $('#ocMes').value = mesAtual();
  opcoesEquipe($('#ocFiltroEq'));
  const [de, ate] = limitesMes($('#ocMes').value);
  let lista = await api(`/api/ocorrencias?de=${de}&ate=${ate}${$('#ocFiltroEq').value ? '&equipe=' + $('#ocFiltroEq').value : ''}`);
  if ($('#ocFiltroTipo').value) lista = lista.filter(o => o.tipo === $('#ocFiltroTipo').value);
  const dias = o => o.tipo === 'banco_horas' ? `${+o.horas > 0 ? '+' : ''}${String(+o.horas).replace('.', ',')}h` : plural(Math.round((Date.parse(o.fim) - Date.parse(o.inicio)) / 864e5) + 1, 'dia', 'dias');
  $('#ocLista').innerHTML = lista.length ? `<table class="tab"><thead><tr><th>Pessoa</th><th>Unidade</th><th>Tipo</th><th>Período</th><th class="n">Dias / horas</th><th>Observação</th><th class="edita"></th></tr></thead><tbody>
    ${lista.map(o => `<tr><td><b>${esc(o.funcionario)}</b></td><td>${esc(o.equipe)}</td><td><span class="tipo tipo-${o.tipo}">${esc(ROTULO[o.tipo])}</span></td>
      <td>${o.inicio === o.fim ? br(o.inicio) : br(o.inicio) + ' a ' + br(o.fim)}</td><td class="n">${dias(o)}</td><td>${esc(o.obs || '')}</td>
      <td class="edita"><button class="link perigo" data-del-oc="${o.id}">Apagar</button></td></tr>`).join('')}</tbody></table>`
    : `<div class="vazio"><img src="/img/mascote.svg" alt=""><h2>Nada lançado neste mês</h2><p>Férias, atestados, faltas e banco de horas aparecem aqui.</p>${podeEditar() ? '<button class="btn" data-ir-oc>Lançar</button>' : ''}</div>`;
  $$('[data-del-oc]').forEach(b => b.onclick = async () => {
    if (!confirm('Apagar? A escala volta ao normal nesses dias.')) return;
    try { await api(`/api/ocorrencias/${b.dataset.delOc}`, {method: 'DELETE'}); toast('Apagado.'); telaOcorrencias(); } catch (err) { toast(err.message); }
  });
}
['#ocMes', '#ocFiltroEq', '#ocFiltroTipo'].forEach(s => $(s).onchange = () => telaOcorrencias());

// ---------- fechamento do mês ----------
let fech = null;
async function telaFechamento(mes) {
  if (mes) $('#fechMes').value = mes;
  if (!$('#fechMes').value) {
    const d = new Date(); // até o dia 10, abre no mês anterior (época de fechar a folha)
    $('#fechMes').value = d.getDate() <= 10 ? new Date(d.getFullYear(), d.getMonth() - 1, 15).toISOString().slice(0, 7) : mesAtual();
  }
  opcoesEquipe($('#fechEq'), 'Todas as unidades');
  fech = await api(`/api/relatorio?mes=${$('#fechMes').value}${$('#fechEq').value ? '&equipe=' + $('#fechEq').value : ''}`);
  const nomeMes = new Date(fech.de + 'T12:00:00').toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'});
  $('#fechSub').textContent = `${fech.empresa || ''}${fech.cnpj ? ' · CNPJ ' + fech.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : ''} · ${nomeMes}`;
  const nomeMesCurto = $('#fechMes').value.split('-').reverse().join('/'), futuro = $('#fechMes').value > mesAtual();
  $('#fechStatus').innerHTML = fech.fechado
    ? `<div class="status-mes"><div><span class="selo fechado">Mês fechado</span> <span class="dica">em ${new Date(fech.fechado.em).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'})}${fech.fechado.por ? ' por ' + esc(fech.fechado.por) : ''}. Números congelados: escalas, férias e faltas deste mês não mudam mais.</span></div>${conta.papel === 'dono' ? '<button class="btn sec pq" id="btnReabrir">Reabrir mês</button>' : ''}</div>`
    : `<div class="status-mes"><div><span class="selo aberto">Mês aberto</span> <span class="dica">${futuro ? 'Este mês ainda não começou.' : conta.papel === 'contador' ? 'A empresa ainda não fechou este mês. Os números podem mudar.' : 'Confira e feche o mês: o contador recebe o aviso e os números ficam congelados.'}</span></div>${podeEditar() && !futuro ? '<button class="btn pq" id="btnFecharMes">Fechar mês e avisar o contador</button>' : ''}</div>`;
  if ($('#btnFecharMes')) $('#btnFecharMes').onclick = async () => {
    const semEscala = fech.linhas.filter(l => l.sem_escala).length;
    if (semEscala && !confirm(`Atenção: ${plural(semEscala, 'pessoa tem', 'pessoas têm')} dias sem escala em ${nomeMesCurto}. Gere as escalas que faltam antes de fechar.\n\nFechar mesmo assim?`)) return;
    if (!confirm(`Fechar ${nomeMesCurto}? Os números ficam congelados, o contador é avisado e as escalas do mês não podem mais ser alteradas.`)) return;
    try { const r = await api('/api/fechamentos', {method: 'POST', body: {mes: $('#fechMes').value}}); toast(r.contadores_avisados ? 'Mês fechado. Seu contador foi avisado.' : 'Mês fechado. Dica: dê acesso ao seu contador.'); telaFechamento(); }
    catch (err) { toast(err.message); }
  };
  if ($('#btnReabrir')) $('#btnReabrir').onclick = async () => {
    if (!confirm(`Reabrir ${nomeMesCurto}? Depois de corrigir, feche de novo para avisar o contador.`)) return;
    await api('/api/fechamentos/' + $('#fechMes').value, {method: 'DELETE'}); toast('Mês reaberto.'); telaFechamento();
  };
  $('#fechAvisos').innerHTML = fech.sem_matricula && fech.linhas.length ? `<div class="alerta" style="margin-bottom:14px">${plural(fech.sem_matricula, 'pessoa está', 'pessoas estão')} sem matrícula. Se o contador usar matrícula, preencha em Unidade › Pessoas › Editar.</div>` : '';
  const L = fech.linhas;
  if (!L.length) { $('#fechResumo').innerHTML = '<p class="dica">Ninguém neste filtro.</p>'; $('#fechEspelho').innerHTML = ''; return; }
  const n = v => v ? `<b>${v}</b>` : '<span class="dica">0</span>';
  const h = v => v ? `<b>${v > 0 ? '+' : ''}${String(v).replace('.', ',')}h</b>` : '<span class="dica">0</span>';
  $('#fechResumo').innerHTML = `<table class="tab"><thead><tr><th>Pessoa</th><th>Unidade</th><th class="n">Trabalhados</th><th class="n">Folgas</th><th class="n">Domingos trab.</th><th class="n">Feriados trab.</th><th class="n">Faltas</th><th class="n">Atestado</th><th class="n">Férias</th><th class="n">Afast.</th><th class="n">Banco de horas</th><th class="n">Sem escala</th></tr></thead><tbody>
    ${L.map(l => `<tr><td><b>${esc(l.nome)}</b>${l.matricula ? ` <span class="dica">${esc(l.matricula)}</span>` : ''}</td><td>${esc(l.equipe)}</td>
      <td class="n">${n(l.trabalhados)}</td><td class="n">${n(l.folgas)}</td><td class="n">${n(l.domingos)}</td><td class="n">${n(l.feriados)}</td><td class="n">${n(l.faltas)}</td><td class="n">${n(l.atestado)}</td>
      <td class="n">${n(l.ferias)}</td><td class="n">${n(l.afastamento)}</td><td class="n">${h(l.banco_mes)}</td><td class="n">${l.sem_escala ? `<span class="badge-esp">${l.sem_escala}</span>` : n(0)}</td></tr>`).join('')}</tbody></table>
    <p class="dica" style="margin-top:10px">Feriado trabalhado: pagar em dobro ou dar outra folga (Lei 605/49). "Sem escala": dias do mês ainda sem escala gerada.</p>`;
  $('#fechEspelho').innerHTML = `<table class="espelho"><thead><tr><th>Pessoa</th>${fech.dias.map(d => `<th class="${d.dia === 'Dom' ? 'dom' : ''} ${d.feriado ? 'fer' : ''}" title="${d.feriado ? esc(d.feriado) : ''}">${d.data.slice(8)}<br>${d.dia.slice(0, 1)}</th>`).join('')}</tr></thead><tbody>
    ${L.map(l => `<tr><td>${esc(l.nome)}</td>${l.codigos.map((c, i) => `<td class="${c ? 'c-' + c : ''} ${fech.dias[i].dia === 'Dom' && !c ? 'dom' : ''}">${CURTO[c] || ''}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
['#fechMes', '#fechEq'].forEach(s => $(s).onchange = () => telaFechamento());
$('#btnImpFech').onclick = () => { document.body.classList.add('print-fech'); window.print(); document.body.classList.remove('print-fech'); };
$('#btnCsv').onclick = async () => {
  $('#btnCsv').disabled = true;
  try {
    const r = await fetch(`/api/relatorio?formato=csv&mes=${$('#fechMes').value}${$('#fechEq').value ? '&equipe=' + $('#fechEq').value : ''}`, {headers: {'x-conta': conta.id}});
    if (!r.ok) throw new Error('Não foi possível gerar a planilha.');
    const url = URL.createObjectURL(await r.blob()), a = document.createElement('a');
    a.href = url; a.download = `fechamento-${$('#fechMes').value}.csv`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Planilha baixada. Abre no Excel e no Google Planilhas.');
  } catch (err) { toast(err.message); }
  $('#btnCsv').disabled = false;
};

// ---------- espaço do contador ----------
async function telaContador() {
  const r = await api('/api/contador');
  const mAnt = r.mes_anterior.split('-').reverse().join('/');
  $('#contSub').textContent = r.empresas.length ? `${plural(r.empresas.length, 'empresa liberou', 'empresas liberaram')} acesso para você.` : 'Todas as empresas que liberarem acesso para você aparecem aqui.';
  if (!r.empresas.length) {
    $('#contEmpresas').innerHTML = `<div class="cartao vazio"><img src="/img/mascote.svg" alt=""><h2>Nenhuma empresa ainda</h2>
      <p>Peça para o seu cliente entrar no Escala Legal, abrir <b>Contador e gestores</b> e dar acesso para o e-mail <b>${esc(eu.email)}</b>.</p>
      <p class="dica">Assim que ele liberar, a empresa aparece aqui com as escalas, as faltas e o fechamento de cada mês.</p></div>`;
    return;
  }
  $('#contEmpresas').innerHTML = `<div class="empresas">${r.empresas.map(e => `<article class="cartao emp-card">
      <h3>${esc(e.nome_fantasia || e.empresa)}</h3>
      <p class="meta">${e.cnpj ? 'CNPJ ' + esc(e.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')) + ' · ' : ''}${esc(e.porte_nome || '')}${e.uf ? ' · ' + esc(e.uf) : ''}</p>
      <div class="linha-st"><span>Pessoas</span><b>${e.funcionarios} em ${plural(e.unidades, 'unidade', 'unidades')}</b></div>
      <div class="linha-st"><span>Fechamento de ${mAnt}</span>${e.fechado_ant ? '<span class="selo fechado">Fechado</span>' : '<span class="selo aberto">Aguardando a empresa</span>'}</div>
      <div class="linha-st"><span>Faltas e atestados em ${mAnt}</span><b>${e.faltas_atestados_ant}</b></div>
      <div class="acoes"><button class="btn pq" data-abrir="${e.id}" data-mes="${r.mes_anterior}">Ver fechamento de ${mAnt}</button><button class="btn sec pq" data-abrir="${e.id}">Ver escalas</button></div>
    </article>`).join('')}</div>`;
  $$('[data-abrir]').forEach(b => b.onclick = () => {
    gravarConta(+b.dataset.abrir);
    location.hash = b.dataset.mes ? 'fechamento' : 'visao';
    if (b.dataset.mes) try { sessionStorage.setItem('fechMes', b.dataset.mes); } catch {}
    location.reload();
  });
}

// ---------- contador e gestores ----------
async function telaAcessos() {
  const m = await api('/api/membros');
  $('#listaMembros').innerHTML = m.length ? `<table class="tab"><thead><tr><th>Nome</th><th>E-mail</th><th>Acesso</th><th>Situação</th><th></th></tr></thead><tbody>
    ${m.map(x => `<tr><td><b>${esc(x.nome)}</b></td><td>${esc(x.email)}</td>
      <td><select data-papel="${x.id}" style="width:auto"><option value="contador" ${x.papel === 'contador' ? 'selected' : ''}>Contador</option><option value="gestor" ${x.papel === 'gestor' ? 'selected' : ''}>Gestor</option></select></td>
      <td>${x.ativo ? '<span class="badge-ok">Ativo</span>' : '<span class="badge-esp">Ainda não criou a senha</span>'}</td>
      <td><button class="link perigo" data-rm="${x.id}">Remover</button></td></tr>`).join('')}</tbody></table>`
    : '<p class="dica">Ninguém além de você tem acesso. Comece pelo seu contador: ele recebe um e-mail e já entra vendo tudo.</p>';
  $$('[data-papel]').forEach(s => s.onchange = async () => { try { await api(`/api/membros/${s.dataset.papel}`, {method: 'PATCH', body: {papel: s.value}}); toast('Alterado.'); } catch (err) { toast(err.message); } });
  $$('[data-rm]').forEach(b => b.onclick = async () => { if (!confirm('Remover este acesso? A pessoa deixa de ver a empresa na hora.')) return; await api(`/api/membros/${b.dataset.rm}`, {method: 'DELETE'}); telaAcessos(); });
}
$('#formMembro').onsubmit = async e => {
  e.preventDefault(); $('#erroMembro').textContent = ''; $('#conviteBox').innerHTML = '';
  try {
    const email = $('#mEmail').value;
    const r = await api('/api/membros', {method: 'POST', body: {email, nome: $('#mNome').value, papel: $('#mPapel').value}});
    $('#conviteBox').innerHTML = `<div class="convite">Pronto. Mandamos o convite para <b>${esc(email)}</b>.${r.link ? ` Se preferir, mande o link no WhatsApp: <button type="button" class="link" id="btnCopiaConvite">Copiar link</button>` : ' A pessoa já tem conta e vê sua empresa ao entrar.'}</div>`;
    if (r.link) $('#btnCopiaConvite').onclick = () => copiar(r.link, 'Link copiado.');
    $('#mEmail').value = $('#mNome').value = ''; telaAcessos();
  } catch (err) { $('#erroMembro').textContent = err.message; }
};

// ---------- empresa ----------
async function telaEmpresa() {
  const [c, h] = await Promise.all([api('/api/empresa'), api('/api/historico')]);
  $('#emNome').value = c.nome; $('#emRazao').value = c.razao_social; $('#emCidade').value = c.cidade;
  $('#emCnpj').value = c.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  $('#emPorte').innerHTML = Object.entries(PORTES).map(([k, [n, d]]) => `<label><input type="radio" name="emPorte" value="${k}" ${c.porte === k ? 'checked' : ''}>${n}${d ? `<small>${d}</small>` : ''}</label>`).join('');
  $('#emUf').innerHTML = '<option value="">—</option>' + c.ufs.map(u => `<option ${c.uf === u ? 'selected' : ''}>${u}</option>`).join('');
  $('#emFer').value = c.feriados_locais.map(md => md.slice(3) + '/' + md.slice(0, 2)).join(', ');
  $('#listaHist').innerHTML = h.length ? `<table class="tab"><thead><tr><th>Quando</th><th>Quem</th><th>O quê</th></tr></thead><tbody>
    ${h.slice(0, 100).map(x => `<tr><td class="dica" style="white-space:nowrap">${new Date(x.criado_em).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'})}</td><td>${esc(x.quem)}</td><td>${esc(x.acao)}</td></tr>`).join('')}</tbody></table>`
    : '<p class="dica">Nada registrado ainda.</p>';
}
$('#formEmpresa').onsubmit = async e => {
  e.preventDefault(); $('#erroEmpresa').textContent = '';
  try {
    await api('/api/empresa', {method: 'PUT', body: {nome: $('#emNome').value, razao_social: $('#emRazao').value, cnpj: $('#emCnpj').value, porte: $('input[name=emPorte]:checked')?.value, uf: $('#emUf').value, cidade: $('#emCidade').value, feriados_locais: $('#emFer').value}});
    conta = await api('/api/conta'); $('#nomeEmpresa').textContent = conta.empresa || $('#emNome').value; toast('Dados da empresa salvos.');
  } catch (err) { $('#erroEmpresa').textContent = err.message; }
};

// ---------- minha conta ----------
function telaConta() { $('#contaEmail').textContent = eu.email; $('#mcNome').value = eu.nome || ''; $('#mcZap').value = eu.whatsapp || ''; }
$('#formConta').onsubmit = async e => {
  e.preventDefault();
  try { await api('/api/eu', {method: 'PUT', body: {nome: $('#mcNome').value, whatsapp: $('#mcZap').value}}); eu = await api('/api/eu'); toast('Salvo.'); } catch (err) { toast(err.message); }
};
$('#formTrocaSenha').onsubmit = async e => {
  e.preventDefault(); $('#erroSenhaConta').textContent = '';
  try { await api('/api/eu/senha', {method: 'POST', body: {atual: $('#mcAtual').value, nova: $('#mcNova').value}}); $('#mcAtual').value = $('#mcNova').value = ''; toast('Senha trocada.'); }
  catch (err) { $('#erroSenhaConta').textContent = err.message; }
};

// mês escolhido no espaço do contador
try { const m = sessionStorage.getItem('fechMes'); if (m) { $('#fechMes').value = m; sessionStorage.removeItem('fechMes'); } } catch {}
if (tokenAcesso) telaSenha(); else iniciar();
