// Sua Escala 5x2 — app (JS puro). Um mecanismo só: abriu, vê a semana. Quem trabalha, quem folga.
// Toca no nome para trocar a folga ou lançar falta. A escala se monta e se ajusta sozinha.
const DIAS = Escala.DIAS, SETORES = Escala.SETORES, COD = Escala.COD_NOME;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const br = d => d ? String(d).slice(0, 10).split('-').reverse().join('/') : '';
const dm = d => d.slice(8, 10) + '/' + d.slice(5, 7);
const soma = Escala.somaDias;
const DIA_LONGO = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const ROTULO = {ferias: 'Férias', atestado: 'Atestado', falta: 'Falta', afastamento: 'Afastamento', folga_extra: 'Folga extra', banco_horas: 'Banco de horas'};
const TIPOS = [
  ['falta', 'Faltou', 'sem avisar ou sem atestado'], ['atestado', 'Atestado', 'trouxe atestado médico'],
  ['ferias', 'Férias', 'a escala se refaz sozinha'], ['afastamento', 'Afastamento', 'INSS, licença'],
  ['folga_extra', 'Folga extra', 'compensação, banco'], ['banco_horas', 'Banco de horas', 'hora extra ou a menos']];
const CURTO = {T: 'T', F: 'F', V: 'FÉ', M: 'AT', X: 'FA', L: 'AF', E: 'FX'};
const PAPEL = {dono: 'Dono', gestor: 'Gerente', contador: 'Contador'};
const PORTES = {mei: ['MEI', 'até 1 funcionário'], me: ['Microempresa', 'ME'], epp: ['Pequena empresa', 'EPP'], media: ['Média ou grande', ''], nao_sei: ['Não sei', 'vejo depois']};
const SEG_ORDEM = ['mercado', 'farmacia', 'varejo', 'restaurante', 'padaria', 'salao', 'clinica', 'academia', 'posto', 'escritorio', 'seguranca', 'outro'];
const seg = k => SETORES[k] || SETORES.outro;

let eu = null, conta = null, equipes = [], atual = null, funcs = [], semana = null, semData = null, diaSel = null, modoEsc = 'dia', recem = false, modo = 'login', tipoCadastro = '';
const hojeIso = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const segundaDe = d => soma(d, -((new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7));
const mesAtual = () => hojeIso().slice(0, 7);
// a semana que importa: no sábado e no domingo já é a que vem (a atual está acabando)
const semanaInicial = () => { const h = hojeIso(), dow = new Date(h + 'T12:00:00').getDay(); return dow === 0 || dow === 6 ? segundaDe(soma(h, 7)) : segundaDe(h); };
const ler = k => { try { return localStorage.getItem(k); } catch { return null; } };
const gravar = (k, v) => { try { localStorage.setItem(k, v ?? ''); } catch {} };
const podeEditar = () => conta && conta.papel !== 'contador';
const ehModoContador = () => eu?.contador && conta?.id === eu.id && !eu.empresa;
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;
const dataLonga = d => { const x = new Date(d + 'T12:00:00'); return `${DIA_LONGO[(x.getDay() + 6) % 7]}, ${x.getDate()} de ${MES[x.getMonth()]}`; };
const nomeCurto = n => { const t = String(n || '').trim(); return /\s\d+$/.test(t) ? t : t.split(' ')[0]; };
const naDia = d => (d >= 5 ? 'no ' : 'na ') + DIA_LONGO[d].toLowerCase();
const hora = h => { const [a, b] = String(h || '').split(':'); return a ? `${+a}h${b && b !== '00' ? b : ''}` : ''; };

async function api(url, opts = {}) {
  const headers = {'Content-Type': 'application/json'};
  if (conta?.id) headers['x-conta'] = conta.id;
  const r = await fetch(url, {method: opts.method || 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined});
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (j.trocar_conta) { gravar('conta', ''); location.hash = ''; location.reload(); }
    const e = new Error(j.erro || 'Algo deu errado. Tente de novo.'); e.status = r.status; e.campo = j.campo; throw e;
  }
  return j;
}
// toast(msg, desfazer?): com desfazer, mostra o botão "Desfazer" por 8 s e chama a ação inversa
function toast(msg, desfazer) {
  $$('.toast').forEach(t => t.remove());
  const t = document.createElement('div'); t.className = 'toast' + (desfazer ? ' com-acao' : ''); t.setAttribute('role', 'status');
  const sp = document.createElement('span'); sp.textContent = msg; t.append(sp);
  if (desfazer) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'toast-desfazer'; b.textContent = 'Desfazer';
    b.onclick = async () => { b.disabled = true; t.remove(); try { await desfazer(); toast('Desfeito.'); } catch (err) { toast(err.message); } };
    t.append(b);
  }
  document.body.append(t); setTimeout(() => t.remove(), desfazer ? 8000 : 3600);
}
// feriados da empresa (estado, cidade) + escolhas da unidade (abre, removidos, extras)
const ctxU = () => ({...(conta?.ctx || {}), config: atual?.feriados_config || {}});
// unidade já com escala publicada ou em uso: mudar horário ou folga de quem já trabalha pede cuidado (CLT, art. 468)
function avisoArt468() {
  return new Promise(ok => {
    folha(`<h2>Antes de mudar</h2><div class="nota" style="margin-top:8px">Mudar um horário que o colaborador já pratica pode exigir acordo e não pode prejudicar o colaborador (CLT, art. 468). Confira o contrato e a convenção coletiva.</div>
      <button class="btn cheio" id="a468Ok" style="margin-top:14px">Continuar</button><button class="btn cheio sec" id="a468Nao" style="margin-top:8px">Cancelar</button>`);
    $('#a468Ok').onclick = () => ok(true); $('#a468Nao').onclick = () => { fechaFolha(); ok(false); };
  });
}
async function copiar(texto, msg) { try { await navigator.clipboard.writeText(texto); toast(msg); } catch { prompt('Copie:', texto); } }
function folha(html) { $('#folhaCorpo').innerHTML = html; const d = $('#folha'); if (!d.open) d.showModal(); d.scrollTop = 0; return d; }
const fechaFolha = () => $('#folha').close();

// ================= entrada =================
// só entra quem comprou: a conta da empresa nasce no pagamento aprovado (o acesso chega por e-mail).
// O contador é o único que cria conta aqui, de graça.
function modoEntrada(m) {
  modo = m;
  const cont = m === 'contador';
  $$('.so-cad').forEach(x => x.classList.toggle('hide', !cont));
  $$('.so-login').forEach(x => x.classList.toggle('hide', cont));
  $('#entTit').textContent = cont ? 'Conta de contador' : 'Entrar';
  $('#entSub').textContent = cont ? 'Grátis. Depois, cada cliente libera o acesso dele para o seu e-mail.' : 'Use o e-mail da compra e a senha que você criou.';
  $('#entradaTitulo').textContent = cont ? 'Seus clientes liberam o acesso e você vê escalas, faltas e o fechamento do mês num lugar só.' : 'A escala da sua equipe pronta em 2 minutos, dentro da nova lei.';
  $('#btnEntrar').textContent = cont ? 'Criar conta de contador' : 'Entrar';
  $('#cSenha').autocomplete = cont ? 'new-password' : 'current-password';
  $('#erroEntrada').textContent = '';
}
$('#btnSouContador').onclick = () => modoEntrada('contador');
$('#btnVoltaLogin').onclick = () => modoEntrada('login');
$('#formEntrada').onsubmit = async e => {
  e.preventDefault(); $('#erroEntrada').textContent = ''; $('#btnEntrar').disabled = true;
  try {
    if (modo === 'login') await api('/api/login', {method: 'POST', body: {email: $('#cEmail').value, senha: $('#cSenha').value}});
    else {
      let ref = ''; try { ref = JSON.parse(localStorage.getItem('ind') || 'null')?.c || ''; } catch {}
      await api('/api/cadastro', {method: 'POST', body: {tipo: 'contador', nome: $('#cNome').value, email: $('#cEmail').value, senha: $('#cSenha').value, ref}});
      window.rastrear?.('CompleteRegistration');
    }
    await iniciar();
  } catch (err) { $('#erroEntrada').textContent = err.message; }
  $('#btnEntrar').disabled = false;
};
$('#btnEsqueci').onclick = () => { $('#eqEmail').value = $('#cEmail').value; $('#erroEsqueci').textContent = ''; $('#dlgEsqueci').showModal(); };
$('#formEsqueci').onsubmit = async e => {
  if (e.submitter?.value !== 'ok') return;
  e.preventDefault(); $('#btnEsqueciEnviar').disabled = true; $('#erroEsqueci').textContent = '';
  try { await api('/api/senha/esqueci', {method: 'POST', body: {email: $('#eqEmail').value}}); $('#dlgEsqueci').close(); toast('Se o e-mail tiver conta, o link chega em instantes. Olhe também o spam.'); }
  catch (err) { $('#erroEsqueci').textContent = err.message; }
  $('#btnEsqueciEnviar').disabled = false;
};
const tokenAcesso = new URLSearchParams(location.search).get('acesso');
async function telaSenha() {
  $('#telaEntrada').classList.remove('hide'); $('#formEntrada').classList.add('hide'); $('#formSenha').classList.remove('hide');
  let t;
  try { t = await api('/api/senha/token?t=' + encodeURIComponent(tokenAcesso)); }
  catch (err) {
    $('#sTitulo').textContent = 'Link expirado'; $('#sTexto').textContent = err.message;
    $('#formSenha').querySelectorAll('label,input,#sDados,#btnSenha').forEach(x => x.classList.add('hide'));
    $('#formSenha').insertAdjacentHTML('beforeend', '<a class="btn cheio" style="margin-top:16px" href="/app">Ir para o login</a>');
    return;
  }
  $('#sTitulo').textContent = t.tem_senha ? 'Crie uma senha nova' : 'Falta só criar sua senha';
  $('#sTexto').innerHTML = `Conta: <b>${esc(t.email)}</b>`;
  if (!t.tem_senha && !t.convidado) $('#sTexto').innerHTML = `Pagamento confirmado. Sua conta: <b>${esc(t.email)}</b>`;
  $('#sNome').value = t.nome || '';
  $('#sDados').classList.toggle('hide', !!t.tem_senha);
  $('#formSenha').onsubmit = async e => {
    e.preventDefault(); $('#erroSenha').textContent = '';
    if ($('#sSenha').value !== $('#sSenha2').value) return $('#erroSenha').textContent = 'As duas senhas não são iguais.';
    $('#btnSenha').disabled = true;
    try {
      await api('/api/senha/definir', {method: 'POST', body: {token: tokenAcesso, senha: $('#sSenha').value, nome: $('#sNome').value}});
      history.replaceState(null, '', '/app'); $('#formSenha').classList.add('hide'); $('#formEntrada').classList.remove('hide');
      await iniciar();
    } catch (err) { $('#erroSenha').textContent = err.message; }
    $('#btnSenha').disabled = false;
  };
}

// ================= início =================
async function iniciar() {
  try { eu = await api('/api/eu'); } catch {
    $('#telaEntrada').classList.remove('hide'); $('#telaApp').classList.add('hide');
    const qs = new URLSearchParams(location.search);
    modoEntrada(qs.has('contador') ? 'contador' : 'login');
    return;
  }
  const salva = +ler('conta') || null;
  const escolhida = eu.contas.find(c => c.id === salva) || (!eu.empresa && !eu.contador && eu.contas[1]) || eu.contas[0];
  conta = {id: escolhida.id};
  conta = await api('/api/conta');
  gravar('conta', conta.id);
  document.body.classList.toggle('so-leitura', !podeEditar());
  $('#telaEntrada').classList.add('hide'); $('#telaApp').classList.remove('hide');
  pintaLateral();
  await carregaEquipes();
  rota();
  carregaNotificacoes();
  carregaFoto();
}
async function carregaEquipes() {
  if (ehModoContador()) { equipes = []; atual = null; return pintaTopo(); }
  equipes = await api('/api/equipes');
  atual = equipes.find(e => e.id === +ler('unidade')) || equipes[0] || null;
  if (atual) { gravar('unidade', atual.id); funcs = await api(`/api/equipes/${atual.id}/funcionarios`); }
  await carregaSetores();
  pintaTopo();
}
// ===== setores da unidade (Empresa > Unidade > Setores > Colaboradores) =====
let setoresU = [], setorSel = null; // setorSel: filtro da Escala e do Publicar (null = todos)
async function carregaSetores() {
  setoresU = atual && !ehModoContador() ? await api(`/api/equipes/${atual.id}/setores`).catch(() => []) : [];
  const s = +ler('setor:' + atual?.id) || null;
  setorSel = setoresU.some(x => x.id === s) ? s : null;
}
const setorDe = id => funcs.find(f => f.id === id)?.setor_id ?? null;
const naVisao = f => !setorSel || (!!f && setorDe(f.id) === setorSel);
const setorVisto = () => setoresU.find(s => s.id === setorSel) || null;
const minVisto = min => { const s = setorVisto(); return s ? (s.minimo || min.map(() => 0)) : min; };
const nomeVisao = () => atual.nome + (setorVisto() ? ' · ' + setorVisto().nome : '');
const minSetor = s => { const m = (s.minimo || []).filter((x, i) => atual?.abertos?.[i]); return m.length ? Math.max(...m) : 0; };
function chipsSetor() {
  if (!setoresU.length) return '';
  const chip = (id, t) => `<button type="button" data-setor="${id}" class="${(setorSel || '') == id ? 'on' : ''}" aria-pressed="${(setorSel || '') == id}">${esc(t)}</button>`;
  return `<div class="setor-chips" role="group" aria-label="Setor">${chip('', 'Todos')}${setoresU.map(s => chip(s.id, s.nome)).join('')}</div>`;
}
function ligaChipsSetor(redesenha) {
  $$('[data-setor]').forEach(b => b.onclick = () => { setorSel = +b.dataset.setor || null; gravar('setor:' + atual.id, setorSel || ''); redesenha(); });
}
function telaSetores() {
  const v = $('#v-setores'), ed = podeEditar(), sugest = (seg(atual?.setor).funcoes || []).filter(n => !setoresU.some(s => s.nome.toLowerCase() === n.toLowerCase())).slice(0, 5);
  if (!atual) return ir('comecar');
  v.innerHTML = `<button class="voltar" data-ir="configuracoes">‹ Configurações</button><h1>Setores</h1>
    <p class="sub">Divida ${esc(atual.nome)} em setores, como açougue ou frente de caixa. Cada setor tem o próprio mínimo por dia, e a escala garante esse número.</p>
    ${ed ? `<form class="add-pessoa" id="formSetor"><input id="setNome" placeholder="Nome do setor. Ex.: Açougue" maxlength="60" autocomplete="off"><button class="btn">Adicionar</button></form>
      ${sugest.length ? `<p class="setor-sug">Sugestões: ${sugest.map(n => `<button type="button" class="chip-sug" data-sug="${esc(n)}">+ ${esc(n)}</button>`).join('')}</p>` : ''}` : ''}
    <ul class="lista-p">${setoresU.length ? setoresU.map(s => `<li data-sid="${s.id}"><div><b>${esc(s.nome)}</b><small>${plural(s.pessoas || 0, 'colaborador', 'colaboradores')} · ${minSetor(s) ? `pelo menos ${minSetor(s)} por dia` : 'sem mínimo'}</small></div>${ed ? '<span class="seta">›</span>' : ''}</li>`).join('')
      : '<li style="cursor:default"><span class="dica">Nenhum setor. Sem setor, a escala vale para a unidade toda, como já é hoje.</span></li>'}</ul>
    ${setoresU.length ? '<p class="dica" style="margin-top:12px">Para colocar alguém em um setor, toque no colaborador em Colaboradores.</p><button class="btn sec cheio" data-ir="colaboradores" style="margin-top:8px">Ir para Colaboradores</button>' : ''}`;
  if (!ed) return;
  const cria = async nome => {
    try { await api(`/api/equipes/${atual.id}/setores`, {method: 'POST', body: {nome, minimo: atual.abertos.map(a => a ? 1 : 0)}}); await carregaSetores(); telaSetores(); toast(`Setor ${nome} criado. Agora coloque os colaboradores nele.`); }
    catch (err) { toast(err.message); }
  };
  $('#formSetor').onsubmit = e => { e.preventDefault(); const n = $('#setNome').value.trim(); if (!n) return $('#setNome').focus(); cria(n); };
  $$('[data-sug]').forEach(b => b.onclick = () => cria(b.dataset.sug));
  $$('#v-setores [data-sid]').forEach(li => li.onclick = () => folhaSetor(setoresU.find(s => s.id === +li.dataset.sid)));
}
function folhaSetor(s) {
  let n = minSetor(s);
  const total = s.pessoas || 0;
  folha(`<h2>${esc(s.nome)}</h2>
    <label for="stNome">Nome do setor</label><input id="stNome" value="${esc(s.nome)}" maxlength="60">
    <label>Pelo menos quantos trabalhando por dia?</label>
    <div class="jn-dias"><button type="button" id="stMenos" aria-label="Menos um">−</button><output id="stVal"><b>${n}</b></output><button type="button" id="stMais" aria-label="Mais um">+</button></div>
    <p class="dica" id="stDica"></p>
    <p class="erro" id="stErro"></p>
    <button class="btn cheio" id="stSalvar">Salvar</button>
    <button class="btn cheio perigo" id="stApagar" style="margin-top:8px">Apagar o setor</button>`);
  const mostra = () => { $('#stVal').innerHTML = `<b>${n}</b>`; $('#stMenos').disabled = n <= 0;
    $('#stDica').textContent = n === 0 ? 'Sem mínimo: o setor serve só para organizar e filtrar a escala.' : total && n > total ? `O setor tem ${plural(total, 'colaborador', 'colaboradores')}. Coloque mais gente nele ou diminua o mínimo.` : `Vale para todo dia que ${atual.nome} abre.`; };
  $('#stMenos').onclick = () => { n = Math.max(0, n - 1); mostra(); };
  $('#stMais').onclick = () => { n = Math.min(50, n + 1); mostra(); };
  mostra();
  $('#stSalvar').onclick = async () => {
    try { await api(`/api/setores/${s.id}`, {method: 'PUT', body: {nome: $('#stNome').value, minimo: atual.abertos.map(a => a ? n : 0)}}); fechaFolha(); await carregaSetores(); semana = null; telaSetores(); toast('Salvo. As próximas semanas já seguem o setor.'); }
    catch (err) { $('#stErro').textContent = err.message; }
  };
  $('#stApagar').onclick = async () => {
    if (!confirm(`Apagar o setor ${s.nome}? Os colaboradores continuam na unidade, só ficam sem setor.`)) return;
    try { await api(`/api/setores/${s.id}`, {method: 'DELETE'}); fechaFolha(); await carregaSetores(); funcs = await api(`/api/equipes/${atual.id}/funcionarios`); semana = null; telaSetores(); toast('Setor apagado.'); }
    catch (err) { $('#stErro').textContent = err.message; }
  };
}

function pintaTopo() {
  const sel = $('#selUnidade');
  sel.classList.toggle('hide', equipes.length < 2);
  sel.innerHTML = equipes.map(e => `<option value="${e.id}" ${e.id === atual?.id ? 'selected' : ''}>${esc(e.nome)}</option>`).join('');
  $('#topoQuem').classList.toggle('hide', equipes.length > 1);
  const ini = (eu.nome || eu.email || '?').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
  $('#btnUser').innerHTML = typeof meuAvatar === 'function' ? meuAvatar() : ini; $('#muNome').textContent = eu.nome || ''; $('#muEmail').textContent = eu.email || '';
  $('#topoQuem').textContent = ehModoContador() ? eu.nome : conta.papel === 'contador' ? (conta.empresa || '') : (atual?.nome || conta.empresa || '');
}
async function trocaUnidade(id) {
  atual = equipes.find(e => e.id === id) || atual; gravar('unidade', atual.id);
  funcs = await api(`/api/equipes/${atual.id}/funcionarios`); semana = null; await carregaSetores(); pintaTopo();
  if (location.hash === '#escala') rota(); else ir('escala');
}
$('#selUnidade').onchange = () => trocaUnidade(+$('#selUnidade').value);

// rotas: #inicio #escala[/semana|pessoa|mes|publicar] #colaboradores[/ausencias] #fechamento[/contabilidade] #mais #funcionamento #unidades #empresa #conta #aula #materiais #comecar #contador
window.onhashchange = () => rota();
const ir = h => { if (location.hash === '#' + h) rota(); else location.hash = h; };
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ir]'); if (b) { e.preventDefault(); if ($('#folha').open) fechaFolha(); ir(b.dataset.ir); if (b.dataset.foco) setTimeout(() => { const x = document.getElementById(b.dataset.foco); if (x) { x.scrollIntoView({block: 'center'}); x.focus({preventScroll: true}); } }, 300); }
  if (e.target.closest('[data-faltar]')) folhaFaltar();
});
// endereços antigos (links salvos, avisos, e-mails) -> os de agora
const ALIAS = { resultado: 'escala', personalizar: 'escala', tabela: 'escala/mes', ocorrencias: 'colaboradores/ausencias', pessoas: 'colaboradores',
  equipe: 'colaboradores', 'equipe/faltas': 'colaboradores/ausencias', mes: 'fechamento', 'mes/contador': 'fechamento/contabilidade', acessos: 'fechamento/contabilidade',
  loja: 'funcionamento', lojas: 'unidades', mais: 'configuracoes' };
// rota -> seção da página
const VISTA = { configuracoes: () => 'mais', colaboradores: x => x === 'ausencias' ? 'ocorrencias' : 'pessoas', fechamento: x => x === 'contabilidade' ? 'acessos' : 'fechamento' };
let rotaAtual = '';
async function rota() {
  if (!conta) return;
  let h = location.hash.slice(1) || '';
  const al = ALIAS[h] || ALIAS[h.split('/')[0]];
  if (al) { h = ALIAS[h] || al; history.replaceState(null, '', '#' + h); }
  let [v, extra] = h.split('/');
  // #ajuda é do suporte (suporte.js abre o painel pelo próprio evento): a tela atual fica onde está
  if (v === 'ajuda') { if (rotaAtual) { history.replaceState(null, '', '#' + rotaAtual); return; } history.replaceState(null, '', location.pathname + location.search); h = ''; [v, extra] = []; }
  const mc = ehModoContador(), dono = conta.papel === 'dono', cont = conta.papel === 'contador';
  if (mc && !['contador', 'conta', 'configuracoes', 'aula', 'instalar', 'materiais', 'unidades'].includes(v)) v = 'contador';
  if (!v) v = cont ? 'fechamento' : 'inicio';
  // dono sem unidade: primeiro o cadastro completo da empresa, depois o quiz da escala
  if (!mc && dono && !equipes.length && !conta.cadastro_ok && !['comecar', 'cadastro', 'conta'].includes(v)) v = 'cadastro';
  if (!mc && dono && !equipes.length && ['escala', 'colaboradores', 'funcionamento'].includes(v)) v = 'inicio';
  if (v === 'comecar' && dono && !conta.cadastro_ok && extra !== 'unidade') v = 'cadastro';
  if (v === 'fechamento' && extra === 'contabilidade' && !dono) extra = '';
  const vista = VISTA[v] ? VISTA[v](extra) : v;
  if (!document.getElementById('v-' + vista) || (['empresa', 'cadastro'].includes(v) && !dono)
    || (['comecar', 'funcionamento'].includes(v) && !podeEditar())) return ir(mc ? 'contador' : cont ? 'fechamento' : 'inicio');
  $$('.vista').forEach(x => x.classList.toggle('hide', x.id !== 'v-' + vista));
  fechaGaveta();
  ['cadastro', 'comecar'].forEach(k => { if (k !== v) $('#v-' + k).innerHTML = ''; }); // ids do quiz não se repetem
  const foco = ['comecar', 'cadastro'].includes(v); // quiz e cadastro: tela limpa, sem menu
  rotaAtual = extra ? `${v}/${extra}` : v;
  pintaLateral(); marcaLateral(v, extra);
  pintaAbas(v, extra);
  $('#principal').classList.toggle('larga', ['fechamento', 'contador', 'inicio'].includes(v) || (v === 'escala' && ['mes', 'semana', 'agenda'].includes(extra)));
  $('#principal').classList.toggle('quiz-pg', foco);
  document.body.classList.toggle('modo-foco', foco);
  document.body.classList.toggle('ini-escuro', v === 'inicio');
  window.scrollTo(0, 0);
  try {
    if (v === 'comecar') wizInicio(extra === 'unidade');
    else if (v === 'cadastro') await telaCadastro();
    else if (v === 'inicio') await telaInicio();
    else if (v === 'escala') { modoEsc = ['semana', 'agenda', 'pessoa', 'mes'].includes(extra) ? extra : 'dia'; await telaEscala(); if (extra === 'publicar') folhaExportar(); }
    else if (vista === 'pessoas') telaPessoas();
    else if (vista === 'ocorrencias') await telaOcorrencias();
    else if (vista === 'fechamento') await telaFechamento();
    else if (vista === 'acessos') await telaAcessos();
    else if (v === 'aula') { if (extra === undefined || extra === '') telaAulas(); else { aulaI = extra === 'app' || isNaN(+extra) ? 0 : Math.max(0, +extra) + 1; telaAula(); } }
    else if (v === 'materiais') await renderizarMateriais($('#v-materiais'));
    else if (v === 'instalar') telaInstalar();
    else if (v === 'indique') await telaIndique();
    else if (v === 'configuracoes') { telaConfig(); if (extra === 'aparencia') $('#aparencia')?.scrollIntoView({ block: 'start' }); }
    else if (v === 'unidades') telaUnidades();
    else if (v === 'setores') telaSetores();
    else if (v === 'funcionamento') desenhaConfig();
    else if (v === 'contador') await telaContador();
    else if (v === 'empresa') { await telaEmpresa(); if (extra === 'historico') $('#listaHist')?.scrollIntoView({block: 'start'}); }
    else if (v === 'conta') telaConta();
  } catch (err) { toast(err.message); }
}
// abas no topo de Colaboradores (colaboradores | ausências) e de Fechamento (competência | contabilidade)
function pintaAbas(v, extra) {
  const abas = { colaboradores: [['colaboradores', 'Colaboradores'], ['colaboradores/ausencias', 'Ausências e férias']],
    fechamento: conta.papel === 'dono' ? [['fechamento', 'Fechar competência'], ['fechamento/contabilidade', 'Acesso da contabilidade']] : [] }[v];
  $$('[data-abas]').forEach(el => {
    const lista = el.dataset.abas === v ? abas || [] : [];
    el.innerHTML = lista.length > 1 ? lista.map(([r, t]) => `<button type="button" data-ir="${r}" class="${r === (extra ? v + '/' + extra : v) ? 'on' : ''}" ${r === (extra ? v + '/' + extra : v) ? 'aria-current="page"' : ''}>${t}</button>`).join('') : '';
  });
}

// ================= primeiro acesso: quiz (uma pergunta por tela) =================
// Vem depois do cadastro da empresa: o tipo de negócio já vem de lá. Monta a unidade, a equipe e a escala.
let wz = null;
function wizInicio(soUnidade) {
  const base = soUnidade ? (atual?.setor || '') : (conta.segmento || '');
  wz = {i: 0, soUnidade, setor: base, temSegmento: !soUnidade && !!conta.segmento, funcoes: [],
    nomeUn: soUnidade ? '' : (conta.empresa || '')};
  aplicaSetor(base || 'outro');
  if (!base) wz.setor = '';
  quizDir = 1;
  wizDesenha();
}
function aplicaSetor(k) {
  const s = seg(k); wz.setor = k;
  wz.un = {abertos: [...s.abertos], minimo: [...s.minimo], abre: s.abre, fecha: s.fecha, horas_dia: 8, criticas: s.criticas.map(c => ({...c, minimo: [...c.minimo]}))};
  // funções do segmento, a que não pode faltar primeiro. A equipe é contada por função, sem digitar nomes.
  const crit = s.criticas.map(c => c.nome), resto = (s.funcoes || []).filter(f => !crit.includes(f));
  wz.funcoes = [...crit, ...resto].map(nome => ({nome, n: 0, critica: crit.includes(nome)}));
  if (!wz.funcoes.length) wz.funcoes = [{nome: 'Funcionário(a)', n: 0, critica: false}];
}
// "Caixa 1" com cargo Caixa: o nome já diz a função, não repete embaixo
const cargoVisivel = f => f?.cargo && !semAcentoWz(f.nome).startsWith(semAcentoWz(rotuloFuncao(f.cargo))) ? f.cargo : '';
const totalWz = () => wz.funcoes.reduce((a, f) => a + f.n, 0);
// "Repositor(a)" vira "Repositor 1", "Garçom/Garçonete" vira "Garçom 1"; o cargo fica com o nome inteiro da função
const rotuloFuncao = f => f.replace(/\(a\)/gi, '').split('/')[0].replace(/\s+/g, ' ').trim() || 'Pessoa';
const artigo = s => ['farmácia', 'clínica', 'academia', 'padaria', 'loja'].includes(s.local) ? 'a' : 'o';
const comPessoas = () => wz.funcoes.map((f, i) => [f, i]).filter(([f]) => f.n > 0);
// a lista de perguntas muda conforme as respostas: cada função com gente tem a jornada e as folgas
function perguntas() {
  const q = [];
  if (wz.soUnidade || !wz.temSegmento) q.push('negocio');
  if (wz.soUnidade || (conta.unidades_qtd || 1) > 1) q.push('nome');
  q.push('dias', 'funcoes');
  if (comPessoas().length >= 2) q.push('setores');
  if (wz.ajustar) comPessoas().forEach(([, i]) => q.push('jornada:' + i, 'folgas:' + i));
  return q;
}
const DIAS_OP = [['1111111', 'Todo dia', 'De segunda a domingo'], ['1111110', 'Segunda a sábado', 'Fecha no domingo'], ['1111100', 'Segunda a sexta', 'Fecha sábado e domingo']];
const semAcentoWz = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
function linhaFuncao(f, i) {
  const r = esc(rotuloFuncao(f.nome));
  return `<div class="fn-linha ${f.critica ? 'crit' : ''} ${f.n ? 'tem' : ''}" data-i="${i}">
    <b class="fn-nome">${esc(f.nome)}</b>${f.critica ? '<small class="fn-tag">Não pode faltar no dia</small>' : ''}
    <div class="fn-passo"><button type="button" data-menos aria-label="Uma pessoa a menos em ${r}" ${f.n ? '' : 'disabled'}>−</button>
      <input type="number" inputmode="numeric" pattern="[0-9]*" min="0" max="200" value="${f.n}" aria-label="Pessoas em ${r}">
      <button type="button" data-mais aria-label="Uma pessoa a mais em ${r}">+</button></div>
  </div>`;
}

// ---- jornada: horas dentro da lei ----
const minDe = t => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
const horaDe = m => `${String(Math.floor(((m % 1440) + 1440) % 1440 / 60)).padStart(2, '0')}:${String(((m % 60) + 60) % 60).padStart(2, '0')}`;
const fmtMin = m => m < 60 ? `${m} minutos` : Escala.hm(m / 60);
// limite que vale para a escala que está sendo montada (olha 60 dias à frente: a lei muda em 15/12/2026 e 15/12/2027)
const limiteWz = () => Escala.limiteSemanal(soma(hojeIso(), 60));
function jornadaDe(f) {
  let bruto = minDe(f.saida) - minDe(f.entrada); if (bruto <= 0) bruto += 1440;
  const dia = Math.max(0, bruto - f.intervalo), semana = dia * f.dias / 60, lim = limiteWz();
  const bloqueia = [], avisa = [];
  if (semana > lim) bloqueia.push(`Passa de ${lim}h por semana. Diminua ${fmtMin(Math.ceil((semana - lim) * 60 / f.dias / 5) * 5)} por dia${f.dias > 1 ? ' ou tire um dia' : ''}.`);
  if (dia > 600) bloqueia.push('Passa de 10h por dia, o máximo mesmo com hora extra (CLT, art. 59).');
  if (dia > 360 && f.intervalo < 60) bloqueia.push('Mais de 6h por dia precisa de pelo menos 1h de intervalo para almoço (CLT, art. 71).');
  else if (dia > 240 && dia <= 360 && f.intervalo < 15) bloqueia.push('De 4h a 6h por dia precisa de 15 minutos de intervalo (CLT, art. 71).');
  if (!bloqueia.length && dia > 480) avisa.push('Mais de 8h por dia só com acordo de compensação de horas. O simples é 8h por dia.');
  if (f.intervalo > 120) avisa.push('Intervalo acima de 2h só com acordo escrito.');
  const hoje = Escala.limiteSemanal(hojeIso());
  if (!bloqueia.length && lim < hoje && semana > lim - 0.01 && semana <= lim) avisa.push(`No limite: a partir de ${lim === 42 ? '15/12/2026' : '15/12/2027'} são ${lim}h por semana.`);
  return {dia, semana, lim, bloqueia, avisa};
}
// sugestão dentro da lei: 5 dias, 8h por dia (40h, já no limite final), 1h de almoço, começando quando abre
function sugereFuncao(f) {
  if (f.dias) return;
  f.dias = 5; f.intervalo = 60; f.entrada = wz.un.abre || '08:00'; f.saida = horaDe(minDe(f.entrada) + 8 * 60 + 60);
  f.folga = {modo: 'rodizio', dias: []}; f.minMudou = false; f.minimo = minimoSugerido(f);
}
const abertosN = () => wz.un.abertos.filter(Boolean).length || 1;
const minimoMax = f => Math.floor(f.n * f.dias / abertosN());
function minimoSugerido(f) {
  // deixa folga para o rodízio do domingo e as preferências: não sugere o máximo apertado
  const cap = Math.floor(Math.max(0, f.n * f.dias - Math.ceil(f.n / 2)) / abertosN()), c = wz.un.criticas.find(x => x.nome === f.nome);
  if (f.critica) return Math.max(1, Math.min(cap, c ? Math.max(...c.minimo) : 1));
  return Math.min(cap, 1);
}
const intervalos = [[15, '15 min'], [30, '30 min'], [60, '1h'], [90, '1h30'], [120, '2h']];

function wizResumo() {
  const u = wz.un, n = totalWz(), pad = u.abertos.join('');
  const dias = DIAS_OP.find(o => o[0] === pad)?.[1] || DIAS.filter((_, i) => u.abertos[i]).join(', ');
  const fs = comPessoas().map(([f]) => f);
  const extra = fs.length ? `<ul class="qr-funcs">${fs.map(f => `<li><b>${esc(f.nome)}</b><span>${plural(f.n, 'pessoa', 'pessoas')}${f.dias ? ` · ${f.dias} dias · ${Escala.hm(jornadaDe(f).dia / 60)}` : ''}</span></li>`).join('')}</ul>
    <p class="qr-nota">Cada um com 2 folgas por semana, dentro da nova lei.</p>` : '';
  return resumoLinhas('Sua escala', [
    ['Negócio', wz.setor ? SEG_CURTO[wz.setor] : ''], ['Unidade', wz.nomeUn], ['Abre', wz.i > perguntas().indexOf('dias') ? dias : ''],
    ['Equipe', n ? plural(n, 'pessoa', 'pessoas') : ''],
  ], extra);
}
function wizDesenha() {
  const lista = perguntas(), cheio = lista[wz.i] || '', [id, fiStr] = cheio.split(':');
  // contagem fixa: os passos de ajuste (jornada e folgas) não entram no total
  const base = lista.filter(x => !x.includes(':')), ajuste = lista.filter(x => x.includes(':'));
  const total = base.length, num = cheio.includes(':') ? total : base.indexOf(cheio) + 1;
  const s = seg(wz.setor || 'outro'), u = wz.un, fi = +fiStr, f = wz.funcoes[fi];
  const local = `${artigo(s)} ${esc(s.local)}`;
  let corpo = '', botao = 'Continuar', etapa = '', desl = false;
  if (id === 'oi') {
    $('#v-comecar').innerHTML = `<div class="quiz-wrap"><div class="quiz-card quiz-oi">
      <span class="q-selo">Cadastro salvo</span><img src="/img/mascote.svg?v=20261115b" alt="" class="oi-masc">
      <h1>Agora a <mark>escala 5x2</mark> ${wz.nomeUn ? `da ${esc(wz.nomeUn)}` : 'da sua equipe'}.</h1>
      <p>Só números: que dias abre, quantas pessoas em cada função, o horário e as folgas. A escala sai pronta, dentro da nova lei.</p>
      <ul class="q-chips"><li>Sem digitar nomes</li><li>Uns 2 minutos</li><li>Sem planilha</li></ul>
      <div class="q-rodape"><button class="btn q-continuar" id="qOk" type="button">Começar<span aria-hidden="true" class="q-seta">→</span></button></div>
    </div></div>`;
    $('#qOk').onclick = () => { quizDir = 1; wz.i = 1; wizDesenha(); };
    return;
  }
  const ultima = wz.i === lista.length - 1;
  if (id === 'negocio') {
    etapa = 'Seu negócio';
    corpo = `<h1>${wz.soUnidade ? 'Que tipo de <mark>negócio</mark> é esta unidade?' : 'Qual é o seu <mark>negócio</mark>?'}</h1>
      <p class="sub">Cada negócio tem suas regras. A gente já traz os dias, o horário e as funções certas.</p>${cartoesSegmento(wz.setor)}`;
    desl = !wz.setor;
  } else if (id === 'nome') {
    etapa = 'Unidade';
    corpo = `<h1>Qual o <mark>nome</mark> ${wz.soUnidade ? 'desta unidade' : 'da primeira unidade'}?</h1>
      <p class="sub">${wz.soUnidade ? 'Para você saber de qual escala está falando.' : `Você disse que tem ${conta.unidades_qtd} lojas ou unidades. Comece por uma; as outras você cria depois.`}</p>
      <label for="qTxt">Nome da unidade</label><input id="qTxt" class="q-grande" value="${esc(wz.nomeUn)}" placeholder="Ex.: Loja Centro" autocomplete="off">`;
  } else if (id === 'dias') {
    etapa = 'Funcionamento';
    const pad = u.abertos.join(''), igual = DIAS_OP.some(o => o[0] === pad);
    const comum = DIAS_OP.find(o => o[0] === s.abertos.join(''))?.[1].toLowerCase();
    corpo = `<h1>Que <mark>dias</mark> ${local} abre?</h1><p class="sub">${comum ? `${esc(SEG_CURTO[wz.setor] || 'Seu negócio')} costuma abrir ${comum}.` : 'Escolha os dias de funcionamento.'}</p>
      <div class="q-ops">${DIAS_OP.map(([k, n, d]) => opcao('data-dias', k, n, d, pad === k)).join('')}${opcao('id', 'qOutros', 'Outros dias', 'Escolher um por um', !igual)}</div>
      <div id="qDiasBox" class="${igual ? 'hide' : ''}" style="margin-top:14px"><div class="dias-conf">${DIAS.map((d, i) => `<div><button type="button" class="tg ${u.abertos[i] ? 'on' : ''}" data-ab="${i}">${d}</button></div>`).join('')}</div></div>`;
  } else if (id === 'funcoes') {
    etapa = 'Colaboradores';
    corpo = `<h1>Quais <mark>funções</mark> existem e quantos colaboradores em cada?</h1><p class="sub">Inclua todos os turnos. Sem nomes, apenas os números.</p>
      <div class="fn-lista">${wz.funcoes.map((x, i) => linhaFuncao(x, i)).join('')}</div>
      <div class="fn-nova hide" id="fnNovaBox"><input id="fnNova" maxlength="40" placeholder="Ex.: Entregador" autocomplete="off" aria-label="Nome da função"><button type="button" class="btn pq azul" id="fnNovaOk">Adicionar</button></div>
      <div class="fn-rodape"><button type="button" class="link" id="fnOutra">+ Outra função</button><p class="fn-total" aria-live="polite"><b id="fnTotal">${totalWz()}</b> ${totalWz() === 1 ? 'pessoa' : 'pessoas'}</p></div>
      <p class="dica">A escala sai com "Caixa 1", "Caixa 2"... Depois você pode trocar pelos nomes, se quiser.</p><div id="qConta"></div>
      <p class="fn-ajustar"><button type="button" class="link" id="qAjustar">Ajustar horário e folgas antes</button><small>Opcional. A sugestão já está dentro da lei: 5 dias, 8h por dia, folgas em rodízio.</small></p>`;
    botao = comPessoas().length >= 2 ? 'Continuar' : 'Gerar escala';
  } else if (id === 'setores') {
    etapa = 'Setores';
    const fs2 = comPessoas().map(([x]) => { sugereFuncao(x); return x; });
    wz.setores ||= {sim: false, fora: []};
    corpo = `<h1>Sua unidade tem <mark>setores</mark>?</h1>
      <p class="sub">Com setores, cada um tem o próprio mínimo por dia e você vê a escala de cada setor separada.</p>
      <div class="q-ops">${opcao('data-temset', 'nao', 'Não, uma escala só', 'A equipe toda junta', !wz.setores.sim)}${opcao('data-temset', 'sim', 'Sim, um setor por função', fs2.map(x => rotuloFuncao(x.nome)).join(', '), wz.setores.sim)}</div>
      <div id="qSetBox" class="${wz.setores.sim ? '' : 'hide'}"><p class="jn-tit">Setores (toque para tirar)</p>
        <div class="fg-dias q-setores">${fs2.map(x => `<button type="button" data-qset="${esc(x.nome)}" class="${wz.setores.fora.includes(x.nome) ? '' : 'on'}" aria-pressed="${!wz.setores.fora.includes(x.nome)}">${esc(x.nome)}<small>mín. ${x.minimo}/dia</small></button>`).join('')}</div>
        <p class="dica">Dá para mudar nomes, mínimos e quem está em cada setor depois, em Configurações.</p></div>`;
    botao = ultima ? 'Gerar escala' : 'Continuar';
  } else if (id === 'jornada') {
    sugereFuncao(f);
    etapa = esc(rotuloFuncao(f.nome));
    const j = jornadaDe(f);
    corpo = `<h1>Como é a jornada de <mark>${esc(rotuloFuncao(f.nome).toLowerCase())}</mark>?</h1>
      <p class="sub">${plural(f.n, 'pessoa', 'pessoas')}. A sugestão já está dentro da lei. Ajuste se for diferente.</p>
      <p class="jn-tit">Dias de trabalho por semana</p>
      <div class="jn-dias"><button type="button" id="jnMenos" aria-label="Um dia a menos" ${f.dias <= 1 ? 'disabled' : ''}>−</button>
        <output id="jnDias"><b>${f.dias}</b> ${f.dias === 1 ? 'dia' : 'dias'}</output>
        <button type="button" id="jnMais" aria-label="Um dia a mais" ${f.dias >= 5 ? 'disabled' : ''}>+</button></div>
      <p class="dica">Máximo da nova lei: 5 dias, com 2 folgas por semana.</p>
      <p class="jn-tit">Horário</p>
      <div class="jn-hora"><div><label for="jnEnt">Entrada</label><input id="jnEnt" type="time" value="${f.entrada}"></div>
        <div><label for="jnSai">Saída</label><input id="jnSai" type="time" value="${f.saida}"></div>
        <div><label for="jnInt">Intervalo</label><select id="jnInt">${intervalos.map(([m, t]) => `<option value="${m}" ${m === f.intervalo ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>
      <div id="jnConta" aria-live="polite">${contaJornada(j)}</div>`;
    desl = j.bloqueia.length > 0;
  } else if (id === 'folgas') {
    etapa = esc(rotuloFuncao(f.nome));
    const fo = f.folga, max = fo.modo === 'fixa' ? Math.min(2, 7 - f.dias) : 7 - f.dias;
    const dom = u.abertos[6] ? `<p class="nota info jn-dom"><b>Domingo:</b> a lei garante folga em 1 a cada ${Escala.domingoSemanasDe(wz.setor || 'outro')} domingos. O app cuida disso sozinho.</p>` : '';
    corpo = `<h1>Quais dias de folga são melhores para <mark>${esc(rotuloFuncao(f.nome).toLowerCase())}</mark>?</h1>
      <p class="sub">Quem decide é você. A escala segue a sua escolha dentro da lei: ${7 - f.dias} folgas por semana para cada um.</p>
      <div class="q-ops">${opcao('data-modo', 'rodizio', 'Deixar o app escolher', 'Rodízio justo entre todos. Recomendado.', fo.modo === 'rodizio')}
        ${opcao('data-modo', 'preferidos', 'Prefiro alguns dias', 'O app dá a folga nesses dias sempre que der', fo.modo === 'preferidos')}
        ${opcao('data-modo', 'fixa', 'Folga fixa, igual para todos', `Todos de ${esc(rotuloFuncao(f.nome).toLowerCase())} folgam nos mesmos dias`, fo.modo === 'fixa')}</div>
      <div id="fgDiasBox" class="${fo.modo === 'rodizio' ? 'hide' : ''}"><p class="jn-tit">Escolha até ${max} ${max === 1 ? 'dia' : 'dias'}</p>
        <div class="fg-dias">${DIAS.map((d, i) => `<button type="button" data-fg="${i}" class="${fo.dias.includes(i) ? 'on' : ''}" aria-pressed="${fo.dias.includes(i)}" ${u.abertos[i] ? '' : 'disabled'}>${d}</button>`).join('')}</div></div>
      ${dom}
      <p class="jn-tit">Pelo menos quantos de ${esc(rotuloFuncao(f.nome).toLowerCase())} trabalhando por dia?</p>
      <div class="jn-dias"><button type="button" id="mnMenos" aria-label="Menos um">−</button><output id="mnVal"><b>${f.minimo}</b></output><button type="button" id="mnMais" aria-label="Mais um">+</button></div>
      <div id="fgConta" aria-live="polite"></div>`;
    botao = ultima ? 'Gerar escala' : 'Continuar';
  }
  const restam = total - num + 1;
  const pular = (id === 'jornada' || id === 'folgas') && comPessoas().some(([, i]) => i > fi)
    ? '<p class="q-cancelar"><button class="link" id="qSugestao" type="button">Usar a sugestão para as outras funções</button></p>' : '';
  if (cheio.includes(':')) etapa = `Ajuste ${ajuste.indexOf(cheio) + 1} de ${ajuste.length} · ${etapa}`;
  $('#v-comecar').innerHTML = quizMoldura({etapa, num, total, minutos: `~${Math.max(1, Math.round(restam * 12 / 60))} min`, corpo, botao, botaoDesligado: desl, resumo: wizResumo(),
    rodapeExtra: (wz.soUnidade && wz.i === 0 ? '<p class="q-cancelar"><button class="link" data-ir="unidades">Cancelar</button></p>' : '') + pular});
  const prox = () => { quizDir = 1; if (wz.i >= perguntas().length - 1) return wizGerar(); wz.i++; wizDesenha(); };
  const erro = m => { $('#wzErro').textContent = m; };
  $('#qVolta').onclick = () => { quizDir = -1; if (wz.i === 0) return ir(wz.soUnidade ? 'unidades' : 'inicio'); wz.i--; wizDesenha(); };
  const ok = fn => { const b = $('#qOk'); if (b) b.onclick = fn; const t = $('#qTxt'); if (t) { if (matchMedia('(min-width: 700px)').matches) t.focus(); t.onkeydown = ev => { if (ev.key === 'Enter') { ev.preventDefault(); fn(); } }; } };
  if ($('#qSugestao')) $('#qSugestao').onclick = () => {
    if (id === 'jornada' && jornadaDe(f).bloqueia.length) return erro('Ajuste o horário desta função antes.');
    comPessoas().forEach(([x]) => sugereFuncao(x)); wizGerar();
  };
  if (id === 'negocio') {
    ligaSegmentos(() => wz.setor, (k, seguir) => { if (k && k !== wz.setor) aplicaSetor(k); if (seguir) prox(); });
    ok(() => wz.setor ? prox() : erro('Escolha o tipo de negócio.'));
  }
  if (id === 'nome') ok(() => {
    const v = $('#qTxt').value.trim();
    if (!v) return erro('Dê um nome. Ex.: Loja Centro.');
    wz.nomeUn = v; prox();
  });
  if (id === 'dias') {
    const aplica = pad => { u.abertos = pad.split('').map(Number); u.minimo = u.minimo.map((m, i) => u.abertos[i] ? (m || Math.max(...u.minimo, 1)) : 0); u.criticas.forEach(c => c.minimo = c.minimo.map((m, i) => u.abertos[i] ? (m || Math.max(...c.minimo, 1)) : 0)); };
    escolheESegue($$('[data-dias]'), b => { aplica(b.dataset.dias); $('#qDiasBox').classList.add('hide'); $('#qOutros').classList.remove('on'); }, prox);
    $('#qOutros').onclick = () => { $('#qDiasBox').classList.remove('hide'); $$('.q-op').forEach(x => x.classList.toggle('on', x.id === 'qOutros')); };
    $$('[data-ab]').forEach(b => b.onclick = () => { const i = +b.dataset.ab, p = [...u.abertos]; p[i] = p[i] ? 0 : 1; aplica(p.join('')); b.classList.toggle('on'); });
    ok(() => { if (!u.abertos.some(Boolean)) return erro('Marque pelo menos um dia.'); prox(); });
  }
  const contagem = () => {
    const n = totalWz(), minDia = Math.max(1, comPessoas().reduce((a, [x]) => { const d = x.dias || 5, cap = Math.floor(Math.max(0, x.n * d - Math.ceil(x.n / 2)) / abertosN()); return a + (x.critica ? Math.max(1, Math.min(cap, Math.max(...(u.criticas.find(c => c.nome === x.nome)?.minimo || [1])))) : Math.min(cap, 1)); }, 0));
    const totalMin = u.abertos.filter(Boolean).length * minDia, precisa = Math.ceil(totalMin / 5);
    let html = '';
    if (n) html += n >= precisa ? `<div class="nota ok">${plural(n, 'pessoa', 'pessoas')}. Dá para cobrir todos os dias com 2 folgas por semana para cada um.</div>`
      : `<div class="nota">${plural(n, 'pessoa', 'pessoas')}. Para cobrir todos os dias precisa de ${precisa}. A escala sai, mas alguns dias ficam com menos gente.</div>`;
    const c = u.criticas[0], fc = c && wz.funcoes.find(x => x.critica && x.nome === c.nome);
    if (n && fc) {
      const prec = Math.ceil(c.minimo.reduce((a, m) => a + m, 0) / 5);
      if (fc.n < prec) html += `<div class="nota">Para ter ${esc(rotuloFuncao(c.nome).toLowerCase())} todo dia, precisa de ${prec}. Você colocou ${fc.n}.</div>`;
    }
    if (n > 200) html += '<div class="nota">Até 200 pessoas por unidade. Divida em mais de uma unidade.</div>';
    if (conta.porte === 'mei' && n > 1) html += '<div class="nota">MEI pode ter só 1 funcionário registrado. Confira com a contabilidade.</div>';
    if ($('#qConta')) $('#qConta').innerHTML = html;
    const r = $('.quiz-resumo'); if (r) r.innerHTML = wizResumo();
  };
  if (id === 'funcoes') {
    const tot = () => { const t = totalWz(); $('#fnTotal').textContent = t; $('#fnTotal').nextSibling.textContent = t === 1 ? ' pessoa' : ' pessoas'; contagem(); };
    const poe = (i, v) => {
      const x = wz.funcoes[i], antes = x.n; x.n = Math.max(0, Math.min(200, Math.round(+v) || 0));
      if (x.n !== antes && x.dias && !x.minMudou) x.minimo = minimoSugerido(x);
      const l = $(`.fn-linha[data-i="${i}"]`), inp = l.querySelector('input');
      if (document.activeElement !== inp || inp.value !== '') inp.value = x.n;
      l.classList.toggle('tem', x.n > 0); l.querySelector('[data-menos]').disabled = !x.n;
      tot();
    };
    const liga = l => {
      const i = +l.dataset.i, inp = l.querySelector('input');
      l.querySelector('[data-menos]').onclick = () => poe(i, wz.funcoes[i].n - 1);
      l.querySelector('[data-mais]').onclick = () => poe(i, wz.funcoes[i].n + 1);
      inp.oninput = () => poe(i, inp.value);
      inp.onblur = () => { inp.value = wz.funcoes[i].n; };
      inp.onfocus = () => inp.select();
      inp.onkeydown = ev => { if (ev.key === 'Enter') { ev.preventDefault(); inp.blur(); } };
    };
    $$('.fn-linha').forEach(liga);
    $('#fnOutra').onclick = () => { $('#fnNovaBox').classList.remove('hide'); $('#fnOutra').classList.add('hide'); $('#fnNova').focus(); };
    const adiciona = () => {
      const nome = $('#fnNova').value.replace(/\s+/g, ' ').trim().slice(0, 40);
      if (!nome) return $('#fnNova').focus();
      let i = wz.funcoes.findIndex(x => semAcentoWz(x.nome) === semAcentoWz(nome));
      if (i < 0) {
        wz.funcoes.push({nome, n: 1, critica: false}); i = wz.funcoes.length - 1;
        $('.fn-lista').insertAdjacentHTML('beforeend', linhaFuncao(wz.funcoes[i], i)); liga($(`.fn-linha[data-i="${i}"]`));
      } else poe(i, wz.funcoes[i].n + 1);
      $('#fnNova').value = ''; $('#fnNovaBox').classList.add('hide'); $('#fnOutra').classList.remove('hide');
      tot(); $(`.fn-linha[data-i="${i}"] [data-mais]`).focus();
    };
    $('#fnNovaOk').onclick = adiciona;
    $('#fnNova').onkeydown = ev => { if (ev.key === 'Enter') { ev.preventDefault(); adiciona(); } };
    contagem();
    const confere = () => { if (!totalWz()) { erro('Coloque pelo menos uma pessoa em alguma função.'); return false; } if (totalWz() > 200) { erro('Até 200 pessoas por unidade.'); return false; } return true; };
    ok(() => { if (!confere()) return; wz.ajustar = false; comPessoas().forEach(([x]) => sugereFuncao(x)); if (perguntas().includes('setores')) prox(); else wizGerar(); });
    $('#qAjustar').onclick = () => { if (!confere()) return; wz.ajustar = true; prox(); };
  }
  if (id === 'setores') {
    $$('[data-temset]').forEach(b => b.onclick = () => { wz.setores.sim = b.dataset.temset === 'sim'; $$('[data-temset]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); $('#qSetBox').classList.toggle('hide', !wz.setores.sim); });
    $$('[data-qset]').forEach(b => b.onclick = () => { const n = b.dataset.qset, k = wz.setores.fora.indexOf(n); if (k >= 0) wz.setores.fora.splice(k, 1); else wz.setores.fora.push(n); b.classList.toggle('on', k >= 0); b.setAttribute('aria-pressed', k >= 0); });
    ok(() => { if (wz.setores.sim && comPessoas().every(([x]) => wz.setores.fora.includes(x.nome))) return erro('Deixe pelo menos um setor ou escolha "Não".'); prox(); });
  }
  if (id === 'jornada') {
    const atualiza = () => {
      const j = jornadaDe(f);
      $('#jnConta').innerHTML = contaJornada(j);
      $('#qOk').disabled = j.bloqueia.length > 0;
      $('#jnDias').innerHTML = `<b>${f.dias}</b> ${f.dias === 1 ? 'dia' : 'dias'}`;
      $('#jnMenos').disabled = f.dias <= 1; $('#jnMais').disabled = f.dias >= 5;
      const r = $('.quiz-resumo'); if (r) r.innerHTML = wizResumo();
    };
    const muda = () => { if (!f.minMudou) f.minimo = minimoSugerido(f); f.folga.dias = f.folga.dias.slice(0, 7 - f.dias); };
    $('#jnMenos').onclick = () => { f.dias = Math.max(1, f.dias - 1); muda(); atualiza(); };
    $('#jnMais').onclick = () => { f.dias = Math.min(5, f.dias + 1); muda(); atualiza(); };
    $('#jnEnt').oninput = () => { if ($('#jnEnt').value) { f.entrada = $('#jnEnt').value; atualiza(); } };
    $('#jnSai').oninput = () => { if ($('#jnSai').value) { f.saida = $('#jnSai').value; atualiza(); } };
    $('#jnInt').onchange = () => { f.intervalo = +$('#jnInt').value; atualiza(); };
    ok(() => { const j = jornadaDe(f); if (j.bloqueia.length) return erro(j.bloqueia[0]); prox(); });
  }
  if (id === 'folgas') {
    const fo = f.folga;
    const confere = () => {
      const max = fo.modo === 'fixa' ? Math.min(2, 7 - f.dias) : 7 - f.dias, cap = minimoMax(f);
      let h = '';
      if (fo.modo !== 'rodizio' && !fo.dias.length) h += `<div class="nota">Toque nos dias de folga (até ${max}).</div>`;
      if (fo.modo === 'fixa' && f.minimo > 0 && fo.dias.length) h += `<div class="nota">Com a mesma folga para todos, ${fo.dias.map(d => DIAS[d]).join(' e ')} fica sem ninguém de ${esc(rotuloFuncao(f.nome).toLowerCase())}. Escolha "Prefiro alguns dias" ou zere o mínimo.</div>`;
      if (fo.modo !== 'rodizio' && u.abertos[6] && !fo.dias.includes(6) && fo.dias.length) h += `<div class="nota info">No domingo de folga obrigatório, um desses dias vira domingo naquela semana. Fica tudo dentro da lei.</div>`;
      if (f.minimo > cap) h += `<div class="nota">Com ${plural(f.n, 'pessoa', 'pessoas')} trabalhando ${f.dias} dias, dá para ter no máximo ${cap} por dia todos os dias.</div>`;
      $('#fgConta').innerHTML = h;
      $('#mnVal').innerHTML = `<b>${f.minimo}</b>`;
      $('#mnMenos').disabled = f.minimo <= (f.critica ? 1 : 0); $('#mnMais').disabled = f.minimo >= f.n;
    };
    $$('[data-modo]').forEach(b => b.onclick = () => {
      fo.modo = b.dataset.modo; $$('[data-modo]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      const max = fo.modo === 'fixa' ? Math.min(2, 7 - f.dias) : 7 - f.dias;
      fo.dias = fo.modo === 'rodizio' ? [] : fo.dias.slice(0, max);
      $('#fgDiasBox').classList.toggle('hide', fo.modo === 'rodizio');
      $('#fgDiasBox .jn-tit').textContent = `Escolha até ${max} ${max === 1 ? 'dia' : 'dias'}`;
      $$('[data-fg]').forEach(x => { const on = fo.dias.includes(+x.dataset.fg); x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
      confere();
    });
    $$('[data-fg]').forEach(b => b.onclick = () => {
      const d = +b.dataset.fg, max = fo.modo === 'fixa' ? Math.min(2, 7 - f.dias) : 7 - f.dias, k = fo.dias.indexOf(d);
      if (k >= 0) fo.dias.splice(k, 1); else { if (fo.dias.length >= max) fo.dias.shift(); fo.dias.push(d); }
      fo.dias.sort((a, b2) => a - b2);
      $$('[data-fg]').forEach(x => { const on = fo.dias.includes(+x.dataset.fg); x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
      confere();
    });
    $('#mnMenos').onclick = () => { f.minimo = Math.max(f.critica ? 1 : 0, f.minimo - 1); f.minMudou = true; confere(); };
    $('#mnMais').onclick = () => { f.minimo = Math.min(f.n, f.minimo + 1); f.minMudou = true; confere(); };
    confere();
    ok(() => {
      if (fo.modo !== 'rodizio' && !fo.dias.length) return erro('Escolha os dias de folga ou deixe o app escolher.');
      if (fo.modo === 'fixa' && f.minimo > 0) return erro(`Com folga fixa igual para todos, o dia fica sem ninguém de ${rotuloFuncao(f.nome).toLowerCase()}.`);
      prox();
    });
  }
  window.scrollTo(0, 0);
}
function contaJornada(j) {
  const ok = !j.bloqueia.length;
  return `<div class="jn-total ${ok ? (j.avisa.length ? 'atencao' : 'ok') : 'ruim'}"><b>${Escala.hm(j.dia / 60)} por dia · ${Escala.hm(j.semana)} por semana</b>
    <span>${ok ? `Dentro do limite de ${j.lim}h por semana${j.lim < Escala.limiteSemanal(hojeIso()) ? ' que vale a partir de 15/12/2026' : ''}.` : esc(j.bloqueia[0])}</span></div>
    ${j.bloqueia.slice(1).concat(j.avisa).map(t => `<div class="nota">${esc(t)}</div>`).join('')}`;
}
// monta o que vai para o servidor: unidade (com o mínimo por função) e as pessoas "Caixa 1", "Caixa 2"...
function dadosDoQuiz() {
  const u = wz.un, s = seg(wz.setor || 'outro'), fs = comPessoas().map(([f]) => { sugereFuncao(f); return f; });
  const mins = fs.map(f => f.minimo).reduce((a, m) => a + m, 0);
  const minimo = u.abertos.map(a => a ? Math.max(1, mins) : 0);
  const criticas = fs.filter(f => f.minimo > 0).map(f => {
    const base = s.criticas.find(c => c.nome === f.nome);
    return {nome: f.nome, chave: semAcentoWz(rotuloFuncao(f.nome)).slice(0, 20), cargo: f.nome, minimo: u.abertos.map(a => a ? f.minimo : 0), explica: base?.explica || ''};
  });
  const semanaMax = Math.max(...fs.map(f => jornadaDe(f).semana));
  const entradas = fs.map(f => minDe(f.entrada)), saidas = fs.map(f => { const e = minDe(f.entrada); let x = minDe(f.saida); if (x <= e) x += 1440; return x; });
  const funcoes = fs.map(f => ({nome: f.nome, n: f.n, dias: f.dias, entrada: f.entrada, saida: f.saida, intervalo: f.intervalo, folga: {modo: f.folga.modo, dias: f.folga.dias}, minimo: f.minimo, critica: !!f.critica}));
  const pessoas = fs.flatMap(f => Array.from({length: f.n}, (_, i) => ({nome: `${rotuloFuncao(f.nome)} ${i + 1}`, cargo: f.nome, dias_semana: f.dias,
    entrada: f.entrada, saida: f.saida, intervalo_min: f.intervalo,
    folga_fixa: f.folga.modo === 'fixa' ? f.folga.dias.slice(0, 2) : [], folga_pref: f.folga.modo === 'preferidos' ? f.folga.dias : []}))).slice(0, 200);
  const setores = wz.setores?.sim && fs.length >= 2 ? fs.filter(f => !wz.setores.fora.includes(f.nome)).map(f => ({nome: f.nome, cargo: f.nome, minimo: u.abertos.map(a => a ? f.minimo : 0)})) : [];
  return {setores, unidade: {...u, nome: wz.nomeUn || conta.empresa || 'Minha unidade', setor: wz.setor || 'outro', minimo, criticas, funcoes,
    abre: horaDe(Math.min(...entradas)), fecha: horaDe(Math.min(Math.max(...saidas), 1439)), horas_dia: Math.round(semanaMax / 5 * 60) / 60}, pessoas};
}
async function wizGerar() {
  const {unidade, pessoas, setores} = dadosDoQuiz();
  $('#v-comecar').innerHTML = `<div class="quiz-wrap"><div class="quiz-card quiz-oi montando"><img src="/img/mascote.svg?v=20261115b" alt="" class="oi-masc pulando"><h1>Gerando a escala…</h1>
    <p>Distribuindo as folgas de ${plural(pessoas.length, 'colaborador', 'colaboradores')} dentro da lei.</p><div class="q-barra carregando"><i></i></div></div></div>`;
  const espera = new Promise(r => setTimeout(r, 1400));
  try {
    const [r] = await Promise.all([api('/api/onboarding', {method: 'POST', body: {unidade, pessoas, setores, inicio: semanaInicial(), semanas: 4}}), espera]);
    conta = await api('/api/conta');
    gravar('unidade', r.equipe.id); await carregaEquipes();
    if (!r.escala) return telaPagar(r.checkout);
    semData = semanaInicial(); diaSel = null; window.escalaRecemGerada = true; ir('escala');
  } catch (err) {
    wz.i = perguntas().length - 1; wizDesenha(); $('#wzErro').textContent = err.message;
  }
}
function telaPagar(checkout) {
  $('#v-comecar').innerHTML = `<div class="vazio quiz-oi"><img src="/img/mascote.svg" alt=""><h1>Tudo pronto!</h1>
    <p>Sua equipe está salva. Falta só liberar o acesso para a escala aparecer.</p>
    ${checkout ? `<a class="btn cheio" href="${esc(checkout)}" target="_blank" rel="noopener">Liberar por R$ 97</a>` : '<p class="dica">Fale com o suporte para liberar.</p>'}
    <p class="dica">Depois de pagar, volte aqui.</p></div>`;
}

// ================= escala (tela principal) =================
const opcoesAnalise = (eq, e) => ({horasDia: +eq.horas_dia || 8, ctx: ctxU(), criticas: eq.criticas || [], domingoSemanas: Escala.domingoSemanasDe(eq.setor), abre: eq.abre, fecha: eq.fecha});
// sexo vem do cadastro atual (escalas antigas não guardavam) e os domingos seguidos de antes da semana entram na conta
const comSexo = fs => fs.map(f => ({...f, sexo: f.sexo || funcs.find(x => x.id === f.id)?.sexo || null}));
function domingosAntes(e, s) {
  return e.funcionarios.map((_, i) => { let c = 0; for (let k = s - 1; k >= 0 && e.abertos[6] && e.dados[k]?.[i]?.[6] === 'T'; k--) c++; return c; });
}
const fatiaSemana = () => { const e = semana.escala; return {...e, funcionarios: comSexo(e.funcionarios), inicio: semData, semanas: 1, dados: [semanaDados()]}; };
const analiseSemana = () => Escala.analisar(fatiaSemana(), {...opcoesAnalise(atual), domingosAntes: domingosAntes(semana.escala, semana.semana)});
// avaliador: quando a escala não fecha, a conta em palavras simples e onde corrigir
function htmlAvaliador() {
  if (!podeEditar()) return '';
  const itens = Escala.avaliar(fatiaSemana(), opcoesAnalise(atual));
  if (!itens.length) return '';
  return `<div class="cartao avaliador" role="region" aria-label="Por que a escala não fecha"><h3>Por que a escala não fecha</h3>
    <ul>${itens.map(i => `<li><b>${esc(i.titulo)}</b><span>${esc(i.texto)}</span></li>`).join('')}</ul>
    <div class="av-acoes"><button class="btn" data-ir="funcionamento" data-foco="cfDias">Ajustar mínimo por dia</button><button class="btn sec" data-ir="colaboradores" data-foco="addNome">Adicionar colaborador</button><button class="btn sec" data-ir="funcionamento">Ver funcionamento</button></div></div>`;
}
$('#semAnt').onclick = () => { recem = false; semData = soma(semData, modoEsc === 'mes' ? -28 : -7); diaSel = null; telaEscala(); };
$('#semProx').onclick = () => { recem = false; semData = soma(semData, modoEsc === 'mes' ? 28 : 7); diaSel = null; telaEscala(); };
function tituloSemana(seg) {
  const fim = soma(seg, 6), a = new Date(seg + 'T12:00:00'), b = new Date(fim + 'T12:00:00');
  return a.getMonth() === b.getMonth() ? `${a.getDate()} a ${b.getDate()} de ${MES[b.getMonth()]}` : `${a.getDate()} de ${MES[a.getMonth()].slice(0, 3)} a ${b.getDate()} de ${MES[b.getMonth()].slice(0, 3)}`;
}
async function telaEscala() {
  if (!atual) {
    $('#escAviso').innerHTML = ''; $('.sem-nav').classList.add('hide');
    $('#escCorpo').innerHTML = `<div class="vazio"><img src="/img/mascote.svg" alt=""><h2>Nenhuma unidade ainda</h2><p>${conta.papel === 'dono' ? '' : 'O dono da empresa ainda não montou a escala.'}</p>${conta.papel === 'dono' ? '<button class="btn" data-ir="comecar">Começar</button>' : ''}</div>`;
    return;
  }
  $('.sem-nav').classList.remove('hide');
  const hoje = hojeIso(), segHoje = segundaDe(hoje);
  if (!semData) semData = semanaInicial();
  $('#semTit').textContent = modoEsc === 'mes' ? `${br(semData)} a ${br(soma(semData, 27))}` : tituloSemana(semData);
  $('#escModos').innerHTML = [['dia', 'Dia'], ['semana', 'Semana'], ['agenda', 'Agenda'], ['pessoa', 'Colaborador'], ['mes', 'Mês']].map(([k, t]) => `<button type="button" data-ir="escala${k === 'dia' ? '' : '/' + k}" class="${modoEsc === k ? 'on' : ''}" ${modoEsc === k ? 'aria-current="page"' : ''}>${t}</button>`).join('');
  $('#semSub').textContent = modoEsc === 'mes' ? '4 semanas' : semData === segHoje ? 'Esta semana' : semData === soma(segHoje, 7) ? 'Semana que vem' : semData === soma(segHoje, -7) ? 'Semana passada' : '';
  $('#escCorpo').innerHTML = esqueletoSemana();
  const pedido = semData;
  const r = await api(`/api/equipes/${atual.id}/semana?data=${semData}`);
  if (pedido !== semData) return; // trocou de semana enquanto carregava
  semana = r;
  let aviso = '';
  if (window.escalaRecemGerada && r.escala) aviso = `<div class="res-ok claro" role="status"><svg viewBox="0 0 46 46" aria-hidden="true"><circle cx="23" cy="23" r="23"/><path d="M14 24l6 6 12-13"/></svg><div><b>Escala gerada, dentro da lei.</b><span>Toque em um nome para trocar a folga. Quando estiver certa, publique para a equipe.</span></div></div>`;
  window.escalaRecemGerada = false;
  if (r.novos) aviso += `<div class="aviso azul">${plural(r.novos, 'pessoa nova entra', 'pessoas novas entram')} na escala a partir de ${br(soma(semData, 7))}. Esta semana fica como estava.</div>`;
  $('#escAviso').innerHTML = aviso;
  if (!r.escala) {
    const m = {
      sem_pessoas: `<div class="vazio"><img src="/img/mascote.svg" alt=""><h2>Cadastre os colaboradores</h2><p>Com os colaboradores cadastrados, a escala é gerada na hora.</p>${podeEditar() ? '<button class="btn" data-ir="colaboradores">Cadastrar colaboradores</button>' : ''}</div>`,
      nao_pago: `<div class="vazio"><img src="/img/mascote.svg" alt=""><h2>Falta liberar o acesso</h2><p>Sua equipe está salva. Libere e a escala aparece na hora.</p>${r.checkout && conta.papel === 'dono' ? `<a class="btn cheio" href="${esc(r.checkout)}" target="_blank" rel="noopener">Liberar por R$ 97</a>` : '<p class="dica">O dono da empresa precisa liberar o acesso.</p>'}</div>`,
      passado: '<div class="vazio"><h2>Sem escala nesta semana</h2><p>Essa semana já passou e não tinha escala no sistema.</p></div>',
      sem_escala: `<div class="vazio"><h2>Sem escala nesta semana</h2><p>${podeEditar() ? 'Não foi possível gerar esta semana. Se a competência já foi fechada, reabra em Fechamento.' : 'A empresa ainda não montou a escala desta semana.'}</p></div>`,
    };
    $('#escCorpo').innerHTML = m[r.motivo] || m.sem_escala;
    return;
  }
  const e = r.escala, s = r.semana;
  if (modoEsc === 'mes') return desenhaMes();
  if (diaSel === null) { const i = semData === segHoje ? (new Date(hoje + 'T12:00:00').getDay() + 6) % 7 : e.abertos.findIndex(Boolean); diaSel = Math.max(0, i); }
  desenhaSemana();
}
// grade de uma semana (colaborador x dia); toque numa célula muda o dia daquela pessoa
function gradeSemana(w, comToque = true) {
  return `<div class="cartao tab-sem"><div class="rolagem" tabindex="0" role="region" aria-label="Semana de ${dm(w.inicio)}"><table class="tabela-escala">
    <thead><tr><th></th>${DIAS.map((d, i) => { const data = soma(w.inicio, i), f = Escala.feriado(data, ctxU()); return `<th class="${f ? 'fer' : ''}">${d}<small>${dm(data)}${f ? ' · feriado' : ''}</small></th>`; }).join('')}</tr></thead>
    <tbody>${w.linhas.map((l, f) => !naVisao(w.funcionarios[f]) ? '' : `<tr><td>${esc(w.funcionarios[f].nome)}</td>${l.map((c, d) => `<td class="${!w.abertos[d] ? 'fc' : COD[c] ? 'A' : c}" ${comToque && podeEditar() && w.abertos[d] ? `data-cel="${f}:${d}" role="button" tabindex="0"` : ''}>${esc(rotuloCel(c, w.abertos[d]))}</td>`).join('')}</tr>`).join('')}
    <tr class="tot"><td>Trabalhando (mínimo)</td>${DIAS.map((_, d) => { if (!w.abertos[d]) return '<td>–</td>'; const p = w.linhas.filter((x, f) => naVisao(w.funcionarios[f]) && x[d] === 'T').length; return `<td class="${p >= w.minimo[d] ? 'ok' : 'baixo'}">${p} (mín. ${w.minimo[d]})</td>`; }).join('')}</tr>
    </tbody></table></div></div>`;
}
async function desenhaMes() {
  $('#escCorpo').innerHTML = esqueletoSemana();
  const sems = await carregaPeriodo();
  if (!sems.length) { $('#escCorpo').innerHTML = '<div class="vazio"><h2>Ainda não há escala neste período</h2></div>'; return; }
  $('#escCorpo').innerHTML = `${chipsSetor()}${sems.map(w => `<h3 class="mes-sem">Semana de ${dm(w.inicio)} a ${dm(fimSemana(w))}</h3>${gradeSemana(w, false)}`).join('')}
    <div class="acoes-esc"><button class="btn" id="btnExportar">Publicar escala</button></div>${htmlPrejuizo(resumoPeriodo(sems))}`;
  $('#btnExportar').onclick = () => folhaExportar();
  ligaChipsSetor(desenhaMes);
}
function semanaDados() { const e = semana.escala; return e.dados[semana.semana]; }
function desenhaSemana() {
  const e = semana.escala, s = semana.semana, sem = semanaDados(), hoje = hojeIso(), ed = podeEditar();
  // a lei nesta semana
  const a = analiseSemana(), ferF = d => e.abertos[d] && Escala.feriadoFechado(soma(semData, d), ctxU());
  const minV = minVisto(e.minimo), vis = sem.map((_, f) => f).filter(f => naVisao(e.funcionarios[f])), trab = d => vis.filter(f => sem[f][d] === 'T').length;
  const furos = DIAS.map((_, d) => e.abertos[d] && !ferF(d) && trab(d) < minV[d]).filter(Boolean).length;
  const status = !a.problemas ? `<button class="status ok" id="btnAnalise"><span class="ic">✓</span><span>Escala dentro da lei<small>Toque para ver os detalhes</small></span></button>`
    : `<button class="status ruim" id="btnAnalise"><span class="ic">!</span><span>${esc(a.resumo)}<small>${furos ? `${plural(furos, 'dia fica', 'dias ficam')} com menos gente. ` : ''}Toque para ver o que fazer</small></span></button>`;
  const pills = DIAS.map((d, i) => {
    const data = soma(semData, i), p = trab(i), fer = Escala.feriado(data, ctxU());
    const falta = e.abertos[i] && !ferF(i) && p < minV[i];
    return `<button data-dia="${i}" class="${i === diaSel ? 'on' : ''} ${data === hoje ? 'hoje' : ''} ${e.abertos[i] ? '' : 'fechado'}"><small>${d}</small><b>${data.slice(8)}</b>${falta ? '<i></i>' : fer ? '<i class="fer"></i>' : ''}</button>`;
  }).join('');
  let corpo;
  if (modoEsc === 'agenda') corpo = htmlAgenda(e, sem);
  else if (modoEsc === 'semana') corpo = gradeSemana({inicio: semData, funcionarios: e.funcionarios, abertos: e.abertos, minimo: minV, linhas: sem});
  else if (modoEsc === 'pessoa') {
    corpo = `<ul class="pp">${e.funcionarios.map((f, fi) => {
      if (!naVisao(f)) return '';
      const dias = sem[fi], folgas = dias.map((c, d) => c === 'F' && e.abertos[d] ? DIA_LONGO[d].toLowerCase() : null).filter(Boolean);
      const fora = [...new Set(dias.map(c => COD[c]).filter(Boolean))];
      return `<li data-pessoa="${fi}"><div class="top"><b>${esc(f.nome)}</b><span class="folga">${fora.length ? esc(fora.join(', ')) : folgas.length ? 'Folga ' + folgas.join(' e ') : 'Sem folga'}</span></div>
        <div class="sem">${dias.map((c, d) => `<span class="c-${e.abertos[d] ? c : '0'}">${DIAS[d].slice(0, 3)}<br>${!e.abertos[d] ? '–' : c === 'T' ? 'trab.' : c === 'F' ? 'folga' : CURTO[c]}</span>`).join('')}</div></li>`;
    }).join('')}</ul>`;
  } else {
    const d = diaSel, data = soma(semData, d), fer = Escala.feriado(data, ctxU());
    if (!e.abertos[d]) corpo = `<div class="dia-tit"><h2>${dataLonga(data)}</h2></div><div class="grupo"><p class="vazio-grupo">Fechado neste dia. Ninguém trabalha.</p></div>`;
    else {
      const grupo = cod => sem.map((x, f) => ({x: x[d], f})).filter(o => naVisao(e.funcionarios[o.f]) && (cod === 'A' ? COD[o.x] : o.x === cod));
      const T = grupo('T'), F = grupo('F'), A = grupo('A');
      const btn = (o, cls) => `<button class="nome ${cls}" data-f="${o.f}">${esc(e.funcionarios[o.f]?.nome)}${cls === 'A' ? `<small>${esc(COD[o.x])}</small>` : cargoVisivel(e.funcionarios[o.f]) ? `<small>${esc(cargoVisivel(e.funcionarios[o.f]))}</small>` : ''}</button>`;
      corpo = `<div class="dia-tit"><h2>${dataLonga(data)}</h2><span class="${T.length >= minV[d] ? 'ok' : 'baixo'}">${T.length} trabalhando · mínimo ${minV[d]}</span></div>
        ${fer ? (ferF(d) ? `<div class="nota info" style="margin:0 0 10px">Feriado: <b>${esc(fer)}</b>. A unidade fecha e todos folgam. Para abrir, marque em Funcionamento.</div>`
          : `<div class="nota" style="margin:0 0 10px">Feriado: <b>${esc(fer)}</b>. A unidade abre: quem trabalha hoje recebe em dobro ou ganha outra folga (Lei 605/49).</div>`) : ''}
        ${!ferF(d) && T.length < minV[d] ? `<div class="nota" style="margin:0 0 10px">Falta gente${setorVisto() ? ' em ' + esc(setorVisto().nome) : ''}: precisa de pelo menos ${minV[d]} trabalhando.${ed ? ' Toque em quem folga para trocar.' : ''}</div>` : ''}
        <div class="grupo T"><h3>Trabalham <em>${T.length}</em></h3><div class="nomes">${T.map(o => btn(o, 'T')).join('') || '<span class="vazio-grupo">Ninguém</span>'}</div></div>
        <div class="grupo F"><h3>Folgam <em>${F.length}</em></h3><div class="nomes">${F.map(o => btn(o, 'F')).join('') || '<span class="vazio-grupo">Ninguém</span>'}</div></div>
        ${A.length ? `<div class="grupo A"><h3>Não vêm <em>${A.length}</em></h3><div class="nomes">${A.map(o => btn(o, 'A')).join('')}</div></div>` : ''}`;
    }
  }
  $('#escCorpo').innerHTML = `${status}${a.problemas ? htmlAvaliador() : ''}${chipsSetor()}${modoEsc === 'dia' ? `<div class="dias">${pills}</div>` : ''}${corpo}
    <div class="acoes-esc"><button class="btn" id="btnExportar">Publicar escala</button>${ed ? '<button class="btn sec" data-faltar>Lançar ausência</button>' : ''}</div>
    ${htmlComoMontada(e, s)}`;
  $$('[data-dia]').forEach(b => b.onclick = () => { diaSel = +b.dataset.dia; desenhaSemana(); });
  ligaChipsSetor(desenhaSemana);
  $('#btnAnalise').onclick = () => folhaAnalise();
  $('#btnExportar').onclick = () => folhaExportar();
  if (ed) {
    $$('#escCorpo [data-f]').forEach(b => b.onclick = () => folhaPessoaDia(+b.dataset.f, diaSel));
    $$('#escCorpo [data-pessoa]').forEach(li => li.onclick = () => folhaPessoaSemana(+li.dataset.pessoa));
    if (modoEsc === 'agenda') ligaAgenda();
    $$('#escCorpo [data-cel]').forEach(td => td.onclick = () => { const [f, d] = td.dataset.cel.split(':').map(Number); diaSel = d; folhaPessoaDia(f, d); });
  }
}

// --- folhas de ação ---
function htmlAnalise(a) {
  const ic = i => i.ok === true ? '<span class="ic ok">✓</span>' : i.ok === false ? '<span class="ic ruim">!</span>' : '<span class="ic info">i</span>';
  return `<div class="diag-topo ${a.problemas ? 'ruim' : 'ok'}"><img src="/img/mascote.svg" alt=""><div><b>${esc(a.resumo)}</b>
    ${plural(a.n, 'pessoa', 'pessoas')} · ${Escala.hm(a.horasSemana)} por semana cada</div></div>
    <ul class="diag">${a.itens.map(i => `<li>${ic(i)}<div><b>${esc(i.titulo)}</b><span>${esc(i.texto)}</span></div></li>`).join('')}</ul>`;
}
function folhaAnalise() {
  folha(`<h2>Esta semana e a lei</h2>${htmlAnalise(analiseSemana())}
    <button class="btn cheio sec" data-ir="aula/0" style="margin-top:12px">Ver as aulas da nova lei</button>`);
}
async function trocaCelulas(pares, msg, desfazendo) {
  const eid = semana.escala.id, sem = semana.semana;
  const troca = async () => { let dados; for (const [f, d] of pares) dados = (await api(`/api/escalas/${eid}`, {method: 'PATCH', body: {semana: sem, funcionario: f, dia: d}})).dados; return dados; };
  try {
    const dados = await troca();
    if (semana?.escala?.id === eid) { semana.escala.dados = dados; $('#escAviso').innerHTML = ''; }
    fechaFolha(); if (location.hash.startsWith('#escala')) desenhaSemana();
    // a troca é o próprio inverso: trocar de novo as mesmas células volta como estava
    if (!desfazendo) toast(msg, async () => { const d = await troca(); if (semana?.escala?.id === eid) { semana.escala.dados = d; desenhaSemana(); } });
  } catch (err) { toast(err.message); }
}
function folhaPessoaDia(f, d) {
  const e = semana.escala, sem = semanaDados(), c = sem[f][d], nome = e.funcionarios[f].nome, n1 = nomeCurto(nome);
  const data = soma(semData, d), quando = `${naDia(d)} (${dm(data)})`;
  const outros = cod => sem[f].map((x, i) => x === cod && e.abertos[i] && i !== d ? i : -1).filter(i => i >= 0);
  const botoesDias = (lista, acao) => `<div class="dias-escolha">${lista.map(i => `<button data-${acao}="${i}">${DIA_LONGO[i]}<small>${dm(soma(semData, i))}</small></button>`).join('')}</div>`;
  if (COD[c]) {
    return folha(`<h2>${esc(nome)}</h2><p style="margin-top:6px">${esc(COD[c])} ${quando}.</p>
      <div class="opcoes-grandes"><button data-ir="colaboradores/ausencias">Ver ou apagar o que foi lançado<small>Ausências e férias do mês</small></button></div>`);
  }
  if (c === 'F') {
    const trab = outros('T');
    folha(`<h2>${esc(n1)} folga ${quando}</h2><p style="margin-top:6px">Para qual dia você quer mudar a folga?</p>
      ${trab.length ? botoesDias(trab, 'para') : '<p class="dica" style="margin-top:12px">Não tem outro dia para trocar nesta semana.</p>'}`);
    $$('[data-para]').forEach(b => b.onclick = () => trocaCelulas([[f, d], [f, +b.dataset.para]], `Pronto. ${n1} agora folga ${DIA_LONGO[+b.dataset.para].toLowerCase()}.`));
    return;
  }
  const folgas = outros('F');
  folha(`<h2>${esc(n1)} trabalha ${quando}</h2>
    <div class="opcoes-grandes">
      <button id="fpFolga">Dar folga neste dia<small>A folga de outro dia vira trabalho</small></button>
      <button id="fpFalta">${esc(n1)} faltou<small>Fica marcado como falta</small></button>
      <button id="fpAtestado">${esc(n1)} trouxe atestado</button>
      <button id="fpMais">Férias, afastamento ou outro</button>
    </div>`);
  $('#fpFolga').onclick = () => {
    if (!folgas.length) return trocaCelulas([[f, d]], `${n1} folga ${DIA_LONGO[d].toLowerCase()}.`);
    folha(`<h2>Dar folga para ${esc(n1)} ${quando}</h2><p style="margin-top:6px">Em troca, ${esc(n1)} trabalha em qual dia?</p>${botoesDias(folgas, 'de')}`);
    $$('[data-de]').forEach(b => b.onclick = () => trocaCelulas([[f, d], [f, +b.dataset.de]], `Pronto. ${n1} folga ${DIA_LONGO[d].toLowerCase()} e trabalha ${DIA_LONGO[+b.dataset.de].toLowerCase()}.`));
  };
  const fid = e.funcionarios[f].id;
  $('#fpFalta').onclick = () => salvaOcorrencia({funcionario_id: fid, tipo: 'falta', inicio: data, fim: data}, `Falta de ${n1} lançada.`);
  $('#fpAtestado').onclick = () => folhaDatas(fid, nome, 'atestado', data);
  $('#fpMais').onclick = () => folhaTipo(fid, nome, data);
}
function folhaPessoaSemana(f) {
  const e = semana.escala, nome = e.funcionarios[f].nome;
  folha(`<h2>${esc(nome)}</h2><p style="margin-top:6px">Toque no dia que quer mudar.</p>${`<div class="dias-escolha">${DIAS.map((d, i) => e.abertos[i] ? `<button data-dd="${i}">${DIA_LONGO[i]}<small>${semanaDados()[f][i] === 'T' ? 'trabalha' : semanaDados()[f][i] === 'F' ? 'folga' : esc(COD[semanaDados()[f][i]] || '')}</small></button>` : '').join('')}</div>`}`);
  $$('[data-dd]').forEach(b => b.onclick = () => folhaPessoaDia(f, +b.dataset.dd));
}
function folhaFaltar() {
  if (!podeEditar()) return;
  if (!funcs.length) return toast('Coloque sua equipe primeiro.');
  folha(`<h2>Lançar ausência</h2><p class="dica" style="margin-top:4px">Escolha o colaborador.</p><div class="opcoes-grandes">${funcs.map(f => `<button data-quem="${f.id}">${esc(f.nome)}${cargoVisivel(f) ? `<small>${esc(cargoVisivel(f))}</small>` : ''}</button>`).join('')}</div>`);
  $$('[data-quem]').forEach(b => b.onclick = () => { const f = funcs.find(x => x.id === +b.dataset.quem); folhaTipo(f.id, f.nome, diaSel !== null && semData ? soma(semData, diaSel) : hojeIso()); });
}
function folhaTipo(fid, nome, data) {
  folha(`<h2>O que aconteceu com ${esc(nomeCurto(nome))}?</h2><div class="tipos">${TIPOS.map(([k, n, d]) => `<button data-tipo="${k}">${n}<small>${d}</small></button>`).join('')}</div>`);
  $$('[data-tipo]').forEach(b => b.onclick = () => folhaDatas(fid, nome, b.dataset.tipo, data));
}
function folhaDatas(fid, nome, tipo, data) {
  const banco = tipo === 'banco_horas', n1 = nomeCurto(nome);
  folha(`<h2>${ROTULO[tipo]} de ${esc(n1)}</h2>
    <div class="lado"><div><label for="odIni">${banco ? 'Dia' : 'De'}</label><input id="odIni" type="date" value="${data}"></div>
    ${banco ? '<div><label for="odHoras">Horas</label><input id="odHoras" inputmode="decimal" placeholder="2 ou -1,5"></div>' : `<div><label for="odFim">Até</label><input id="odFim" type="date" value="${data}"></div>`}</div>
    ${banco ? '<p class="dica" style="margin-top:6px">Positivo = fez hora extra. Negativo = saiu mais cedo.</p>' : ''}
    ${tipo === 'ferias' || tipo === 'afastamento' ? '<p class="dica" style="margin-top:8px">A escala das próximas semanas se refaz sozinha para cobrir.</p>' : ''}
    <p class="erro" id="odErro"></p>
    <button class="btn cheio" id="odSalvar">Salvar</button>`);
  if (!banco) $('#odIni').onchange = () => { if ($('#odFim').value < $('#odIni').value) $('#odFim').value = $('#odIni').value; };
  $('#odSalvar').onclick = () => salvaOcorrencia({funcionario_id: fid, tipo, inicio: $('#odIni').value, fim: banco ? $('#odIni').value : $('#odFim').value, horas: banco ? $('#odHoras').value : undefined},
    `${ROTULO[tipo]} de ${n1} lançad${['falta', 'ferias'].includes(tipo) ? 'a' : 'o'}.`, $('#odErro'));
}
// férias e afastamento mudam as próximas semanas: refaz (também ao desfazer)
async function refazPorOcorrencia(o) {
  if (!['ferias', 'afastamento'].includes(o.tipo)) return {};
  const f = funcs.find(x => x.id === o.funcionario_id), eqId = o.equipe_id || f?.equipe_id || atual.id;
  return api(`/api/equipes/${eqId}/refazer`, {method: 'POST', body: {de: o.inicio, ate: o.fim}}).catch(() => ({}));
}
const recarregaOcorrencia = () => { semana = null; if (location.hash.startsWith('#colaboradores/ausencias')) telaOcorrencias(); else if (location.hash.startsWith('#escala') || !location.hash) telaEscala(); };
async function salvaOcorrencia(body, msg, elErro) {
  try {
    const oc = await api('/api/ocorrencias', {method: 'POST', body});
    const r = await refazPorOcorrencia(body);
    fechaFolha(); toast(msg + (r.refeito ? ' A escala das próximas semanas foi refeita.' : ''), async () => {
      await api(`/api/ocorrencias/${oc.id}`, {method: 'DELETE'}); await refazPorOcorrencia(body); recarregaOcorrencia();
    });
    recarregaOcorrencia();
  } catch (err) { if (elErro) elErro.textContent = err.message; else toast(err.message); }
}

// ================= equipe =================
function telaPessoas() {
  if (!atual) return ir('comecar');
  const fs = seg(atual.setor).funcoes;
  $('#pesSub').textContent = `${plural(funcs.length, 'colaborador', 'colaboradores')} em ${atual.nome}. Toque em um colaborador para editar nome, função ou folga fixa.`;
  const linha = f => `<li data-fid="${f.id}"><div><b>${esc(f.nome)}</b><small>${[f.cargo && !cargoVisivel(f) ? f.cargo + ' · toque para identificar' : f.cargo, f.folga_fixa.length ? 'folga fixa ' + f.folga_fixa.map(d => DIAS[d]).join(' e ') : ''].filter(Boolean).map(esc).join(' · ') || (fs.length ? 'Toque para escolher a função' : '')}</small></div><span class="seta">›</span></li>`;
  // com setores: um bloco por setor (e "Sem setor" no fim)
  const blocos = setoresU.length ? [...setoresU.map(s => [s.nome, funcs.filter(f => f.setor_id === s.id)]), ['Sem setor', funcs.filter(f => !setoresU.some(s => s.id === f.setor_id))]].filter(([, l]) => l.length) : [[null, funcs]];
  $('#listaP').innerHTML = funcs.length ? blocos.map(([t, l]) => (t ? `<li class="lista-sec" aria-hidden="true">${esc(t)} <em>${l.length}</em></li>` : '') + l.map(linha).join('')).join('')
    + (setoresU.length || !podeEditar() ? '' : '<li class="lista-sec-link"><button type="button" class="link" data-ir="setores">Dividir em setores (opcional)</button></li>')
    : '<li style="cursor:default"><span class="dica">Ninguém ainda. Escreva o primeiro nome acima.</span></li>';
  $$('[data-fid]').forEach(li => li.onclick = () => folhaFunc(funcs.find(x => x.id === +li.dataset.fid)));
}
$('#formAdd').onsubmit = async e => {
  e.preventDefault();
  const nome = $('#addNome').value.trim(); if (!nome) return $('#addNome').focus();
  try {
    const [novo] = await api(`/api/equipes/${atual.id}/funcionarios`, {method: 'POST', body: [{nome, cargo: ''}]});
    $('#addNome').value = ''; funcs = await api(`/api/equipes/${atual.id}/funcionarios`); telaPessoas();
    toast(`${nomeCurto(nome)} entrou na equipe. Aparece na escala a partir de ${br(soma(segundaDe(hojeIso()), 7))}.`, async () => {
      await api(`/api/funcionarios/${novo.id}`, {method: 'DELETE'}); funcs = funcs.filter(x => x.id !== novo.id); semana = null; telaPessoas();
    });
  } catch (err) { toast(err.message); }
};
function folhaFunc(f) {
  const fs = seg(atual.setor).funcoes, fixa = [...f.folga_fixa];
  folha(`<h2>${esc(f.nome)}</h2>
    <label for="efNome">Nome</label><input id="efNome" value="${esc(f.nome)}">
    <label for="efCargo">Função</label>${fs.length ? `<select id="efCargo"><option value="">—</option>${[...new Set([...fs, f.cargo].filter(Boolean))].map(x => `<option ${x === f.cargo ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>` : `<input id="efCargo" value="${esc(f.cargo || '')}" placeholder="Ex.: Atendente">`}
    ${setoresU.length ? `<label for="efSetor">Setor</label><select id="efSetor"><option value="">Sem setor</option>${setoresU.map(s => `<option value="${s.id}" ${s.id === f.setor_id ? 'selected' : ''}>${esc(s.nome)}</option>`).join('')}</select>` : ''}
    <label for="efSexo">Sexo</label><select id="efSexo"><option value="">Não informar</option><option value="F" ${f.sexo === 'F' ? 'selected' : ''}>Feminino</option><option value="M" ${f.sexo === 'M' ? 'selected' : ''}>Masculino</option></select>
    <p class="dica" style="margin-top:4px">Usado só para o revezamento de domingo previsto em lei.</p>
    <div class="lado"><div><label for="efEnt">Entrada</label><input id="efEnt" type="time" value="${esc(f.entrada || '')}"></div><div><label for="efSai">Saída</label><input id="efSai" type="time" value="${esc(f.saida || '')}"></div></div>
    <label>Folga fixa (só se vocês combinaram)</label><div class="dias-chip" id="efFixa"></div>
    <details style="margin-top:14px"><summary class="link">Mais dados (para a contabilidade)</summary>
      <label for="efMat">Matrícula</label><input id="efMat" value="${esc(f.matricula || '')}">
      <div class="lado"><div><label for="efAdm">Admissão</label><input id="efAdm" type="date" value="${f.admissao ? String(f.admissao).slice(0, 10) : ''}"></div><div><label for="efTel">WhatsApp</label><input id="efTel" inputmode="tel" value="${esc(f.telefone || '')}"></div></div>
    </details>
    <p class="erro" id="efErro"></p>
    <button class="btn cheio" id="efSalvar">Salvar</button>
    <button class="btn cheio perigo" id="efTirar" style="margin-top:8px">Tirar ${esc(nomeCurto(f.nome))} da equipe</button>`);
  const chips = () => {
    $('#efFixa').innerHTML = DIAS.map((d, i) => `<button type="button" data-d="${i}" class="${fixa.includes(i) ? 'on' : ''}">${d}</button>`).join('');
    $$('#efFixa button').forEach(b => b.onclick = () => { const d = +b.dataset.d, i = fixa.indexOf(d); if (i >= 0) fixa.splice(i, 1); else { if (fixa.length >= 2) fixa.shift(); fixa.push(d); } chips(); });
  };
  chips();
  $('#efSalvar').onclick = async () => {
    const body = {nome: $('#efNome').value, cargo: $('#efCargo').value, matricula: $('#efMat').value, admissao: $('#efAdm').value, telefone: $('#efTel').value, folga_fixa: fixa,
      sexo: $('#efSexo').value || null, entrada: $('#efEnt').value || null, saida: $('#efSai').value || null};
    // quem já trabalha com a escala publicada: mudar horário ou folga fixa pede cuidado (CLT, art. 468). No primeiro cadastro, não avisa.
    const mudou = (f.entrada && body.entrada !== f.entrada) || (f.saida && body.saida !== f.saida) || [...f.folga_fixa].sort().join() !== [...fixa].sort().join();
    if (mudou && atual.publicada && !await avisoArt468()) return;
    const setorNovo = $('#efSetor') ? +$('#efSetor').value || null : f.setor_id ?? null, setorAntes = f.setor_id ?? null;
    try {
      await api(`/api/funcionarios/${f.id}`, {method: 'PUT', body});
      if (setorNovo !== setorAntes) { await api(`/api/funcionarios/${f.id}/setor`, {method: 'PUT', body: {setor_id: setorNovo}}); await carregaSetores(); semana = null; }
      fechaFolha(); funcs = await api(`/api/equipes/${atual.id}/funcionarios`); telaPessoas();
      if (setorNovo !== setorAntes) toast(`${nomeCurto(body.nome)} mudou de setor.`, async () => {
        await api(`/api/funcionarios/${f.id}/setor`, {method: 'PUT', body: {setor_id: setorAntes}}); await carregaSetores(); semana = null; funcs = await api(`/api/equipes/${atual.id}/funcionarios`); telaPessoas();
      });
      else toast('Salvo.');
    } catch (err) { if ($('#efErro')) $('#efErro').textContent = err.message; else toast(err.message); }
  };
  $('#efTirar').onclick = async () => {
    try {
      await api(`/api/funcionarios/${f.id}`, {method: 'DELETE'}); fechaFolha(); funcs = funcs.filter(x => x.id !== f.id); semana = null; telaPessoas();
      toast(`${nomeCurto(f.nome)} saiu da equipe.`, async () => { await api(`/api/funcionarios/${f.id}/reativar`, {method: 'POST'}); funcs = await api(`/api/equipes/${atual.id}/funcionarios`); semana = null; telaPessoas(); });
    } catch (err) { $('#efErro').textContent = err.message; }
  };
}

async function sair() {
  if (!confirm('Sair da sua conta?')) return;
  await api('/api/sair', {method: 'POST'}).catch(() => {}); gravar('conta', ''); location.href = '/app';
}

// ================= mais =================
// ===== aparência: claro, escuro ou automático (segue o aparelho). A escolha fica no aparelho. =====
const TEMAS = [['claro', 'Claro', 'Fundo branco'], ['escuro', 'Escuro', 'Fundo escuro, cansa menos a vista à noite'], ['auto', 'Automático', 'Segue o celular ou o computador']];
const temaAtual = () => { const t = ler('tema'); return TEMAS.some(x => x[0] === t) ? t : 'claro'; };
const temaEscuro = () => { const t = temaAtual(); return t === 'escuro' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches); };
const SOL = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>';
const LUA = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>';
function aplicaTema(t) {
  gravar('tema', t);
  if (t === 'claro') delete document.documentElement.dataset.tema; else document.documentElement.dataset.tema = t;
  pintaTemaUI();
}
function pintaTemaUI() {
  const b = $('#muTema');
  if (b) b.innerHTML = temaEscuro() ? `${SOL}<span>Modo claro</span>` : `${LUA}<span>Modo escuro</span>`;
  $$('[data-escolhe-tema]').forEach(x => x.setAttribute('aria-checked', String(x.dataset.escolheTema === temaAtual())));
}
document.addEventListener('click', e => {
  const op = e.target.closest('[data-escolhe-tema]');
  if (op) { aplicaTema(op.dataset.escolheTema); return; }
  if (e.target.closest('#muTema')) aplicaTema(temaEscuro() ? 'claro' : 'escuro');
});
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', pintaTemaUI); } catch {}
document.addEventListener('DOMContentLoaded', pintaTemaUI);

function telaConfig() {
  const mc = ehModoContador(), dono = conta.papel === 'dono', ed = podeEditar();
  const item = (ir, t, d) => `<li><button data-ir="${ir}"><span>${t}${d ? `<small>${d}</small>` : ''}</span><span class="seta">›</span></button></li>`;
  let h = '<ul class="menu">';
  if (!mc && ed) h += item('funcionamento', 'Funcionamento', atual ? `${hora(atual.abre)} às ${hora(atual.fecha)} · dias e mínimo por dia` : 'Dias, horário e mínimo por dia');
  h += item('unidades', 'Unidades e empresas', mc ? 'Trocar de empresa' : `${plural(equipes.length, 'unidade', 'unidades')} · trocar, criar ou cadastrar outra empresa`);
  if (!mc && atual) h += item('setores', 'Setores', setoresU.length ? `${setoresU.map(s => esc(s.nome)).slice(0, 3).join(', ')}${setoresU.length > 3 ? '…' : ''} · mínimo por setor` : 'Opcional: açougue, frente de caixa, cozinha...');
  if (dono) h += item('empresa', 'Dados da empresa', 'CNPJ, endereço, feriados e histórico');
  h += '</ul><ul class="menu">';
  h += item('conta', 'Minha conta e foto de perfil', esc(eu.email));
  if (!naTelaInicial()) h += item('instalar', 'Colocar na tela inicial', 'Abre como aplicativo no celular');
  h += '</ul>';
  h += `<h2 class="cfg-tit" id="aparencia">Aparência</h2><div class="tema-op" role="radiogroup" aria-label="Aparência">${TEMAS.map(([v, t, d]) =>
    `<button type="button" role="radio" data-escolhe-tema="${v}" aria-checked="${v === temaAtual()}"><i class="tema-mini ${v}" aria-hidden="true"></i><b>${t}</b><small>${d}</small></button>`).join('')}</div>`;
  $('#maisTit').textContent = 'Configurações';
  $('#maisCorpo').innerHTML = h;
}

// ================= funcionamento =================
let cfg = null;
function desenhaConfig() {
  if (!atual) return ir('comecar');
  const fc = atual.feriados_config || {};
  cfg = {abertos: [...atual.abertos], minimo: [...atual.minimo], criticas: (atual.criticas || []).map(c => ({...c, minimo: [...c.minimo]})),
    feriados_config: {abre: [...(fc.abre || [])], removidos: [...(fc.removidos || [])], extras: (fc.extras || []).map(x => ({...x}))}};
  ferMes = hojeIso().slice(0, 7);
  $('#cfSetor').innerHTML = SEG_ORDEM.map(k => `<option value="${k}">${esc(seg(k).nome)}</option>`).join('');
  $('#cfNome').value = atual.nome; $('#cfSetor').value = atual.setor; $('#cfHoras').value = +atual.horas_dia || 8;
  $('#cfAbre').value = atual.abre || seg(atual.setor).abre; $('#cfFecha').value = atual.fecha || seg(atual.setor).fecha;
  diasConfig();
}
function diasConfig() {
  $('#cfDias').innerHTML = DIAS.map((d, i) => `<div><button type="button" class="tg ${cfg.abertos[i] ? 'on' : ''}" data-i="${i}">${d}</button><input type="number" min="0" max="200" value="${cfg.minimo[i]}" data-m="${i}" aria-label="Mínimo ${d}" ${cfg.abertos[i] ? '' : 'disabled'}></div>`).join('');
  $$('#cfDias .tg').forEach(b => b.onclick = () => { const i = +b.dataset.i; cfg.abertos[i] = cfg.abertos[i] ? 0 : 1; if (!cfg.abertos[i]) { cfg.minimo[i] = 0; cfg.criticas.forEach(c => c.minimo[i] = 0); } else if (!cfg.minimo[i]) cfg.minimo[i] = 1; diasConfig(); });
  $$('#cfDias input').forEach(inp => inp.oninput = () => cfg.minimo[+inp.dataset.m] = +inp.value || 0);
  $('#cfCriticas').innerHTML = cfg.criticas.map((c, ci) => `<label>Mínimo de ${esc(c.nome.toLowerCase())} em cada dia</label><div class="dias-conf">${DIAS.map((d, i) => `<div><span class="dia-rot">${d}</span><input type="number" min="0" max="50" value="${c.minimo[i]}" data-cc="${ci}" data-ci="${i}" aria-label="${DIA_LONGO[i]}: mínimo de ${esc(c.nome.toLowerCase())}" ${cfg.abertos[i] ? '' : 'disabled'}></div>`).join('')}</div><p class="dica" style="margin-top:6px">${esc(c.explica || '')}</p>`).join('');
  $$('[data-cc]').forEach(inp => inp.oninput = () => cfg.criticas[+inp.dataset.cc].minimo[+inp.dataset.ci] = +inp.value || 0);
  feriadosConfig();
}
// feriados do mês: cada um com "A empresa abre neste feriado" (sem marcar = fechada, todos folgam), Remover e Adicionar outro
let ferMes = null;
const TIPO_FER = {nacional: 'Nacional', estadual: 'Estadual', municipal: 'Municipal', extra: 'Adicionado por você'};
function feriadosConfig() {
  const el = $('#cfFeriados'); if (!el) return;
  const fc = cfg.feriados_config, ctx = {...conta.ctx, config: fc}, de = ferMes + '-01', ate = soma(soma(de, 32).slice(0, 7) + '-01', -1);
  const lista = Escala.feriadosEntre(de, ate, ctx), [a, m] = ferMes.split('-').map(Number);
  const diaSem = d => DIA_LONGO[(new Date(d + 'T12:00:00').getDay() + 6) % 7].toLowerCase();
  el.innerHTML = `<label style="margin-top:18px">Feriados</label>
    <div class="fer-nav"><button type="button" class="link" id="ferAnt" aria-label="Mês anterior">‹</button><b>${MES[m - 1]} de ${a}</b><button type="button" class="link" id="ferProx" aria-label="Próximo mês">›</button></div>
    <p class="dica" style="margin-top:4px">Sem marcar, a unidade fecha no feriado e todos folgam.</p>
    <ul class="fer-lista">${lista.map(f => `<li class="${f.removido ? 'removido' : ''}"><div><b>${dm(f.data)} · ${esc(f.nome)}</b><small>${diaSem(f.data)} · ${TIPO_FER[f.tipo]}${f.removido ? ' · tratado como dia normal' : ''}</small>
      ${f.removido ? '' : `<label class="ck"><input type="checkbox" data-fer-abre="${f.data}" ${f.abre ? 'checked' : ''}> A empresa abre neste feriado</label>`}</div>
      <button type="button" class="link ${f.removido ? '' : 'perigo'}" data-fer-${f.removido ? 'volta' : 'tira'}="${f.data}">${f.removido ? 'Voltar' : 'Remover'}</button></li>`).join('') || '<li><span class="dica">Nenhum feriado neste mês.</span></li>'}</ul>
    ${lista.some(f => f.abre && !f.removido) ? '<div class="nota" style="margin-top:8px">Quem trabalha no feriado recebe em dobro ou ganha outra folga (Lei 605/49).</div>' : ''}
    <details class="fer-add"><summary class="link">Adicionar outro feriado</summary>
      <div class="lado"><div><label for="ferData">Data</label><input id="ferData" type="date" value="${de}"></div><div><label for="ferNome">Nome</label><input id="ferNome" placeholder="Ex.: Padroeiro da cidade"></div></div>
      <button type="button" class="btn sec" id="ferAdd" style="margin-top:8px">Adicionar</button></details>`;
  const tira = (l, d) => { const i = l.indexOf(d); if (i >= 0) l.splice(i, 1); };
  $('#ferAnt').onclick = () => { ferMes = soma(de, -1).slice(0, 7); feriadosConfig(); };
  $('#ferProx').onclick = () => { ferMes = soma(de, 32).slice(0, 7); feriadosConfig(); };
  $$('[data-fer-abre]').forEach(c => c.onchange = () => { const d = c.dataset.ferAbre; tira(fc.abre, d); if (c.checked) fc.abre.push(d); feriadosConfig(); });
  $$('[data-fer-tira]').forEach(b => b.onclick = () => { const d = b.dataset.ferTira, ex = fc.extras.findIndex(x => x.data === d); tira(fc.abre, d);
    if (ex >= 0) fc.extras.splice(ex, 1); else fc.removidos.push(d); feriadosConfig(); });
  $$('[data-fer-volta]').forEach(b => b.onclick = () => { tira(fc.removidos, b.dataset.ferVolta); feriadosConfig(); });
  $('#ferAdd').onclick = () => {
    const d = $('#ferData').value, nome = $('#ferNome').value.trim();
    if (!d) return $('#ferData').focus();
    tira(fc.removidos, d); fc.extras = fc.extras.filter(x => x.data !== d); fc.extras.push({data: d, nome: nome || 'Feriado'});
    ferMes = d.slice(0, 7); feriadosConfig();
  };
}
$('#cfSetor').onchange = () => { const s = seg($('#cfSetor').value); cfg = {abertos: [...s.abertos], minimo: [...s.minimo], criticas: s.criticas.map(c => ({...c, minimo: [...c.minimo]}))}; $('#cfAbre').value = s.abre; $('#cfFecha').value = s.fecha; diasConfig(); };
$('#btnSalvarCfg').onclick = async () => {
  // mudar as horas de quem já trabalha com a escala publicada: aviso do art. 468 da CLT
  if (atual.publicada && Math.abs((+$('#cfHoras').value || 8) - (+atual.horas_dia || 8)) > 0.01 && !await avisoArt468()) return;
  if ($('#folha').open) fechaFolha();
  try {
    const e = await api(`/api/equipes/${atual.id}`, {method: 'PUT', body: {...cfg, nome: $('#cfNome').value, setor: $('#cfSetor').value, horas_dia: $('#cfHoras').value, abre: $('#cfAbre').value, fecha: $('#cfFecha').value}});
    await carregaEquipes(); atual = equipes.find(x => x.id === e.id) || atual; pintaTopo(); semana = null;
    toast('Salvo. A escala das próximas semanas se ajusta sozinha.'); ir('escala');
  } catch (err) { toast(err.message); }
};
$('#btnExcluir').onclick = async () => {
  if (!confirm(`Excluir "${atual.nome}" com toda a equipe e as escalas? Não dá para desfazer.`)) return;
  await api(`/api/equipes/${atual.id}`, {method: 'DELETE'}); gravar('unidade', ''); await carregaEquipes(); ir('escala');
};

// ================= férias e faltas =================
const limitesMes = m => { const de = m + '-01'; return [de, soma(soma(soma(de, 32).slice(0, 7) + '-01', 0), -1)]; };
$('#ocMes').onchange = () => telaOcorrencias();
async function telaOcorrencias() {
  if (!$('#ocMes').value) $('#ocMes').value = mesAtual();
  const [de, ate] = limitesMes($('#ocMes').value);
  const lista = await api(`/api/ocorrencias?de=${de}&ate=${ate}`);
  const dias = o => o.tipo === 'banco_horas' ? `${+o.horas > 0 ? '+' : ''}${String(+o.horas).replace('.', ',')}h` : plural(Math.round((Date.parse(o.fim) - Date.parse(o.inicio)) / 864e5) + 1, 'dia', 'dias');
  $('#ocLista').innerHTML = lista.length ? lista.map(o => `<li><div><b>${esc(o.funcionario)}</b> <span class="tipo tipo-${o.tipo}">${esc(ROTULO[o.tipo])}</span><br>
      <span class="dica">${o.inicio === o.fim ? br(o.inicio) : br(o.inicio) + ' a ' + br(o.fim)} · ${dias(o)}${equipes.length > 1 ? ' · ' + esc(o.equipe) : ''}</span></div>
      ${podeEditar() ? `<button class="link perigo" data-del-oc="${o.id}">Apagar</button>` : ''}</li>`).join('')
    : '<li><span class="dica">Nada lançado neste mês.</span></li>';
  $$('[data-del-oc]').forEach(b => b.onclick = async () => {
    const o = lista.find(x => String(x.id) === b.dataset.delOc);
    try {
      await api(`/api/ocorrencias/${o.id}`, {method: 'DELETE'}); await refazPorOcorrencia(o); telaOcorrencias();
      const volta = {funcionario_id: o.funcionario_id, equipe_id: o.equipe_id, tipo: o.tipo, inicio: String(o.inicio).slice(0, 10), fim: String(o.fim).slice(0, 10), horas: o.horas ?? undefined, obs: o.obs || undefined};
      toast(`${ROTULO[o.tipo]} de ${nomeCurto(o.funcionario)} apagad${['falta', 'ferias'].includes(o.tipo) ? 'a' : 'o'}.`, async () => { await api('/api/ocorrencias', {method: 'POST', body: volta}); await refazPorOcorrencia(volta); telaOcorrencias(); });
    } catch (err) { toast(err.message); }
  });
}

// ================= fechamento do mês =================
let fech = null;
['#fechMes', '#fechEq'].forEach(s => $(s).onchange = () => telaFechamento());
async function telaFechamento() {
  if (!$('#fechMes').value) { const d = new Date(); $('#fechMes').value = d.getDate() <= 10 ? new Date(d.getFullYear(), d.getMonth() - 1, 15).toISOString().slice(0, 7) : mesAtual(); }
  const v = $('#fechEq').value;
  $('#fechEq').innerHTML = '<option value="">Todas as unidades</option>' + equipes.map(e => `<option value="${e.id}">${esc(e.nome)}</option>`).join('');
  $('#fechEq').value = v; $('#fechEq').closest('div').classList.toggle('hide', equipes.length < 2);
  fech = await api(`/api/relatorio?mes=${$('#fechMes').value}${$('#fechEq').value ? '&equipe=' + $('#fechEq').value : ''}`);
  const nomeMes = new Date(fech.de + 'T12:00:00').toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'});
  $('#fechSub').textContent = `${fech.empresa || ''}${fech.cnpj ? ' · CNPJ ' + Cadastro.mascaraCnpj(fech.cnpj) : ''} · ${nomeMes}`;
  const nomeMesCurto = $('#fechMes').value.split('-').reverse().join('/'), futuro = $('#fechMes').value > mesAtual();
  $('#fechStatus').innerHTML = fech.fechado
    ? `<div class="status-mes"><div><span class="selo fechado">Competência fechada</span></div><p class="dica">Fechado em ${new Date(fech.fechado.em).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'})}${fech.fechado.por ? ' por ' + esc(fech.fechado.por) : ''}. Os números não mudam mais.</p>${conta.papel === 'dono' ? '<button class="btn sec" id="btnReabrir">Reabrir competência</button>' : ''}</div>`
    : `<div class="status-mes"><div><span class="selo aberto">Competência aberta</span></div><p class="dica">${futuro ? 'Este mês ainda não começou.' : conta.papel === 'contador' ? 'A empresa ainda não fechou esta competência. Os números podem mudar.' : 'No fim do mês, confira e feche a competência. A contabilidade recebe um aviso e os números ficam guardados.'}</p>${podeEditar() && !futuro ? '<button class="btn" id="btnFecharMes">Fechar competência</button>' : ''}</div>`;
  if ($('#btnFecharMes')) $('#btnFecharMes').onclick = async () => {
    if (!confirm(`Fechar a competência ${nomeMesCurto}? A contabilidade é avisada e as escalas do mês não mudam mais.`)) return;
    try { const r = await api('/api/fechamentos', {method: 'POST', body: {mes: $('#fechMes').value}}); toast(r.contadores_avisados ? 'Competência fechada. A contabilidade foi avisada.' : 'Competência fechada. Libere o acesso da contabilidade para ela receber o fechamento.'); telaFechamento(); }
    catch (err) { toast(err.message); }
  };
  if ($('#btnReabrir')) $('#btnReabrir').onclick = async () => {
    if (!confirm(`Reabrir a competência ${nomeMesCurto}? Depois de corrigir, feche de novo para avisar a contabilidade.`)) return;
    await api('/api/fechamentos/' + $('#fechMes').value, {method: 'DELETE'}); toast('Competência reaberta.'); telaFechamento();
  };
  $('#fechAvisos').innerHTML = '';
  const L = fech.linhas;
  if (!L.length) { $('#fechResumo').innerHTML = '<p class="dica">Ninguém neste mês.</p>'; $('#fechEspelho').innerHTML = ''; return; }
  const n = v => v ? `<b>${v}</b>` : '<span class="dica">0</span>';
  const h = v => v ? `<b>${v > 0 ? '+' : ''}${String(v).replace('.', ',')}h</b>` : '<span class="dica">0</span>';
  $('#fechResumo').innerHTML = `<table class="tab"><thead><tr><th>Colaborador</th>${equipes.length > 1 ? '<th>Unidade</th>' : ''}<th class="n">Trabalhou</th><th class="n">Folgas</th><th class="n">Domingos</th><th class="n">Feriados</th><th class="n">Faltas</th><th class="n">Atestado</th><th class="n">Férias</th><th class="n">Afast.</th><th class="n">Banco</th></tr></thead><tbody>
    ${L.map(l => `<tr><td><b>${esc(l.nome)}</b>${l.matricula ? ` <span class="dica">${esc(l.matricula)}</span>` : ''}</td>${equipes.length > 1 ? `<td>${esc(l.equipe)}</td>` : ''}
      <td class="n">${n(l.trabalhados)}</td><td class="n">${n(l.folgas)}</td><td class="n">${n(l.domingos)}</td><td class="n">${n(l.feriados)}</td><td class="n">${n(l.faltas)}</td><td class="n">${n(l.atestado)}</td>
      <td class="n">${n(l.ferias)}</td><td class="n">${n(l.afastamento)}</td><td class="n">${h(l.banco_mes)}</td></tr>`).join('')}</tbody></table>
    <p class="dica" style="margin-top:10px">Domingos e feriados = dias trabalhados. Feriado trabalhado: pagar em dobro ou dar outra folga (Lei 605/49).</p>`;
  $('#fechEspelho').innerHTML = `<table class="espelho"><thead><tr><th>Colaborador</th>${fech.dias.map(d => `<th class="${d.dia === 'Dom' ? 'dom' : ''} ${d.feriado ? 'fer' : ''}" title="${d.feriado ? esc(d.feriado) : ''}">${d.data.slice(8)}<br>${d.dia.slice(0, 1)}</th>`).join('')}</tr></thead><tbody>
    ${L.map(l => `<tr><td>${esc(l.nome)}</td>${l.codigos.map((c, i) => `<td class="${c ? 'c-' + c : ''} ${fech.dias[i].dia === 'Dom' && !c ? 'dom' : ''}">${CURTO[c] || ''}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
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

// ================= espaço do contador =================
async function telaContador() {
  const r = await api('/api/contador');
  const mAnt = r.mes_anterior.split('-').reverse().join('/');
  const mAt = r.mes_atual.split('-').reverse().join('/');
  $('#contSub').textContent = r.empresas.length ? `${plural(r.empresas.length, 'empresa liberou', 'empresas liberaram')} acesso para você.` : '';
  if (!r.empresas.length) {
    $('#contEmpresas').innerHTML = `<div class="cartao vazio"><img src="/img/mascote.svg" alt=""><h2>Nenhuma empresa ainda</h2>
      <p>Peça para o seu cliente abrir a Sua Escala 5x2, ir em <b>Fechamento › Acesso da contabilidade</b> e colocar o e-mail <b>${esc(eu.email)}</b>.</p>
      <p class="dica">Assim que ele liberar, a empresa aparece aqui.</p></div>`;
    return;
  }
  $('#contEmpresas').innerHTML = `<div class="empresas">${r.empresas.map(e => `<article class="cartao emp-card">
      <h3>${esc(e.nome_fantasia || e.empresa)}</h3>
      <p class="meta">${e.cnpj ? 'CNPJ ' + esc(Cadastro.mascaraCnpj(e.cnpj)) + ' · ' : ''}${esc(e.porte_nome || '')}${e.uf ? ' · ' + esc(e.uf) : ''}</p>
      <div class="linha-st"><span>Pessoas</span><b>${e.funcionarios} em ${plural(e.unidades, 'unidade', 'unidades')}</b></div>
      <div class="linha-st"><span>Competência ${mAt}</span>${e.fechado_atual ? '<span class="selo fechado">Fechada</span>' : '<span class="selo aberto">Em aberto</span>'}</div>
      ${e.criada_mes && e.criada_mes > r.mes_anterior ? '' : `<div class="linha-st"><span>Competência ${mAnt}</span>${e.fechado_ant ? '<span class="selo fechado">Fechada</span>' : '<span class="selo aberto">Aguardando</span>'}</div>
      <div class="linha-st"><span>Faltas e atestados em ${mAnt}</span><b>${e.faltas_atestados_ant}</b></div>`}
      <div class="acoes">${e.fechado_atual ? `<button class="btn pq" data-abrir="${e.id}" data-mes="${r.mes_atual}">Baixar fechamento de ${mAt}</button>` : ''}${!(e.criada_mes && e.criada_mes > r.mes_anterior) && (e.fechado_ant || !e.fechado_atual) ? `<button class="btn ${e.fechado_atual ? 'sec ' : ''}pq" data-abrir="${e.id}" data-mes="${r.mes_anterior}">${e.fechado_ant ? 'Baixar fechamento' : 'Fechamento'} de ${mAnt}</button>` : ''}<button class="btn sec pq" data-abrir="${e.id}">Ver a escala</button></div>
    </article>`).join('')}</div>`;
  $$('[data-abrir]').forEach(b => b.onclick = () => {
    gravar('conta', b.dataset.abrir); gravar('unidade', '');
    if (b.dataset.mes) try { sessionStorage.setItem('fechMes', b.dataset.mes); } catch {}
    location.hash = b.dataset.mes ? 'fechamento' : 'escala'; location.reload();
  });
}

// ================= acessos =================
async function telaAcessos() {
  const m = await api('/api/membros');
  $('#listaMembros').innerHTML = m.map(x => `<li><div><span class="m-av">${avatar(x.usuario_id, x.nome, x.foto_em)}</span><b>${esc(x.nome)}</b> · ${esc(x.email)}</div>
      <div class="form-linha"><div><select data-papel="${x.id}"><option value="contador" ${x.papel === 'contador' ? 'selected' : ''}>Contador</option><option value="gestor" ${x.papel === 'gestor' ? 'selected' : ''}>Gerente</option></select></div>
      <div style="flex:0 0 auto">${x.ativo ? '<span class="badge-ok">Ativo</span>' : '<span class="badge-esp">Ainda não entrou</span>'}</div>
      <div style="flex:0 0 auto"><button class="link perigo" data-rm="${x.id}">Tirar acesso</button></div></div></li>`).join('');
  $$('[data-papel]').forEach(s => s.onchange = async () => { try { await api(`/api/membros/${s.dataset.papel}`, {method: 'PATCH', body: {papel: s.value}}); toast('Alterado.'); } catch (err) { toast(err.message); } });
  $$('[data-rm]').forEach(b => b.onclick = async () => { if (!confirm('Tirar o acesso? A pessoa deixa de ver a empresa na hora.')) return; await api(`/api/membros/${b.dataset.rm}`, {method: 'DELETE'}); telaAcessos(); });
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

// ================= empresa =================
async function telaEmpresa() {
  const [c, h] = await Promise.all([api('/api/empresa'), api('/api/historico')]);
  $('#emAviso').innerHTML = c.cadastro_em ? '' : '<div class="aviso amarelo">Falta completar o cadastro da empresa. <button class="link" data-ir="cadastro">Completar passo a passo ›</button></div>';
  $('#emNome').value = c.nome; $('#emRazao').value = c.razao_social; $('#emCidade').value = c.cidade;
  $('#emCnpj').value = Cadastro.mascaraCnpj(c.cnpj); $('#emCnpjOk').textContent = '';
  $('#emPorte').innerHTML = Object.entries(Cadastro.PORTES).map(([k, [n, d]]) => `<label><input type="radio" name="emPorte" value="${k}" ${c.porte === k ? 'checked' : ''}>${n}<small>${d}</small></label>`).join('');
  $('#emUf').innerHTML = '<option value="">—</option>' + c.ufs.map(u => `<option ${c.uf === u ? 'selected' : ''}>${u}</option>`).join('');
  $('#emFer').value = c.feriados_locais.map(md => md.slice(3) + '/' + md.slice(0, 2)).join(', ');
  $('#emResp').value = c.responsavel; $('#emTel').value = Cadastro.mascaraTel(c.telefone);
  $('#emCargo').innerHTML = '<option value="">—</option>' + [...new Set([...Cadastro.CARGOS, c.responsavel_cargo].filter(Boolean))].map(x => `<option ${x === c.responsavel_cargo ? 'selected' : ''}>${esc(x)}</option>`).join('');
  $('#emCep').value = Cadastro.mascaraCep(c.cep); $('#emEnd').value = c.endereco;
  $('#emSeg').innerHTML = '<option value="">—</option>' + SEG_ORDEM.map(k => `<option value="${k}" ${c.segmento === k ? 'selected' : ''}>${esc(seg(k).nome)}</option>`).join('');
  $('#emFunc').value = c.funcionarios_qtd || ''; $('#emUnid').value = c.unidades_qtd || '';
  $('#emOrigem').innerHTML = '<option value="">—</option>' + Object.entries(Cadastro.ORIGENS).map(([k, [n]]) => `<option value="${k}" ${c.como_conheceu === k ? 'selected' : ''}>${n}</option>`).join('');
  $('#emOrigemOutro').value = c.como_conheceu_outro; $('#emOrigemOutroBox').classList.toggle('hide', c.como_conheceu !== 'outro');
  $('#listaHist').innerHTML = h.length ? `<table class="tab"><tbody>${h.slice(0, 60).map(x => `<tr><td class="dica" style="white-space:nowrap">${new Date(x.criado_em).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'})}</td><td>${esc(x.quem)}: ${esc(x.acao)}</td></tr>`).join('')}</tbody></table>`
    : '<p class="dica">Nada registrado ainda.</p>';
}
$('#emCnpj').oninput = e => {
  e.target.value = Cadastro.mascaraCnpj(e.target.value);
  const v = Cadastro.soCnpj(e.target.value), st = $('#emCnpjOk');
  st.className = 'q-valida ' + (v.length === 14 ? (Cadastro.cnpjValido(v) ? 'ok' : 'ruim') : '');
  st.textContent = v.length === 14 ? (Cadastro.cnpjValido(v) ? 'CNPJ confere' : 'Esse CNPJ não confere') : '';
};
$('#emTel').oninput = e => { e.target.value = Cadastro.mascaraTel(e.target.value); };
$('#emCep').oninput = async e => {
  e.target.value = Cadastro.mascaraCep(e.target.value);
  const d = Cadastro.soNum(e.target.value); if (d.length !== 8) return;
  try { const r = await api('/api/cep/' + d); $('#emUf').value = r.uf; if (r.cidade) $('#emCidade').value = r.cidade; if (r.endereco && !$('#emEnd').value) $('#emEnd').value = r.endereco + ', '; } catch {}
};
$('#emOrigem').onchange = () => $('#emOrigemOutroBox').classList.toggle('hide', $('#emOrigem').value !== 'outro');
$('#formEmpresa').onsubmit = async e => {
  e.preventDefault(); $('#erroEmpresa').textContent = '';
  try {
    await api('/api/empresa', {method: 'PUT', body: {nome: $('#emNome').value, razao_social: $('#emRazao').value, cnpj: $('#emCnpj').value, porte: $('input[name=emPorte]:checked')?.value,
      uf: $('#emUf').value, cidade: $('#emCidade').value, feriados_locais: $('#emFer').value, responsavel: $('#emResp').value, responsavel_cargo: $('#emCargo').value,
      telefone: $('#emTel').value, cep: $('#emCep').value, endereco: $('#emEnd').value.replace(/,\s*$/, ''), segmento: $('#emSeg').value,
      funcionarios_qtd: $('#emFunc').value, unidades_qtd: $('#emUnid').value, como_conheceu: $('#emOrigem').value, como_conheceu_outro: $('#emOrigemOutro').value}});
    conta = await api('/api/conta'); pintaTopo(); pintaLateral(); toast('Dados da empresa salvos.');
  } catch (err) { $('#erroEmpresa').textContent = err.message; }
};

// ================= minha conta =================
function telaConta() { pintaAvatares(); $('#contaEmail').textContent = eu.email; $('#mcNome').value = eu.nome || ''; $('#mcZap').value = eu.whatsapp || ''; }
$('#formConta').onsubmit = async e => {
  e.preventDefault();
  try { await api('/api/eu', {method: 'PUT', body: {nome: $('#mcNome').value, whatsapp: $('#mcZap').value}}); eu = await api('/api/eu'); toast('Salvo.'); } catch (err) { toast(err.message); }
};
$('#formTrocaSenha').onsubmit = async e => {
  e.preventDefault(); $('#erroSenhaConta').textContent = '';
  try { await api('/api/eu/senha', {method: 'POST', body: {atual: $('#mcAtual').value, nova: $('#mcNova').value}}); $('#mcAtual').value = $('#mcNova').value = ''; toast('Senha trocada.'); }
  catch (err) { $('#erroSenhaConta').textContent = err.message; }
};

try { const m = sessionStorage.getItem('fechMes'); if (m) { $('#fechMes').value = m; sessionStorage.removeItem('fechMes'); } } catch {}
if (tokenAcesso) telaSenha(); else iniciar();

// ================= Agenda: a semana como uma agenda (colunas por dia, eixo de horas, turnos em blocos) =================
let agFiltro = new Set(); // funções escondidas na legenda
const AG_COR = [['#1351b4', '#e8f0fb'], ['#168821', '#e3f5e1'], ['#8a6400', '#fff5c2'], ['#4b2a9a', '#ece7fb'], ['#0b7a8a', '#dff4f6'], ['#c2571a', '#fde9dc'], ['#566173', '#eef1f5']];
const minDia = t => { const [h, m] = String(t || '').split(':').map(Number); return isNaN(h) ? null : h * 60 + (m || 0); };
const hhmm = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
function turnoDe(fid) {
  const f = funcs.find(x => x.id === fid) || {}, fn = (atual.funcoes || []).find(x => x.nome === f.cargo) || {};
  let ini = minDia(f.entrada || fn.entrada || atual.abre) ?? 480, fim = minDia(f.saida || fn.saida);
  const intervalo = +(f.intervalo_min ?? fn.intervalo ?? 60) || 0;
  if (fim == null) fim = ini + Math.round((+atual.horas_dia || 8) * 60) + intervalo;
  if (fim <= ini) fim += 1440;
  return { ini, fim: Math.min(fim, ini + 16 * 60), intervalo };
}
function htmlAgenda(e, sem) {
  const hoje = hojeIso(), funcoes = [...new Set(e.funcionarios.map(f => f.cargo || 'Equipe'))];
  const cor = c => AG_COR[funcoes.indexOf(c) % AG_COR.length];
  const visiveis = e.funcionarios.map((f, i) => ({ ...f, i, cargo: f.cargo || 'Equipe' })).filter(f => !agFiltro.has(f.cargo) && naVisao(f));
  const turnos = visiveis.map(f => ({ ...f, ...turnoDe(f.id) }));
  const h0 = Math.floor(Math.min(...turnos.map(t => t.ini), 24 * 60) / 60) * 60, h1 = Math.ceil(Math.max(...turnos.map(t => t.fim), h0 + 60) / 60) * 60;
  const PX = 22; // pixels por 30 min
  const y = m => (m - h0) / 30 * PX, alt = (h1 - h0) / 30 * PX;
  const eixo = [];
  for (let m = h0; m < h1; m += 60) eixo.push(`<span style="top:${y(m)}px">${hhmm(m)}</span>`);
  const colunas = DIAS.map((d, k) => {
    const data = soma(semData, k), fer = Escala.feriado(data, ctxU());
    const cab = `<div class="ag-cab ${data === hoje ? 'hoje' : ''}"><small>${d}</small><b>${Number(data.slice(8))}</b>${fer ? `<em title="${esc(fer)}">feriado</em>` : ''}</div>`;
    if (!e.abertos[k]) return { cab, dia: '<p class="ag-folgas">Fechado</p>', blocos: '<div class="ag-fechado">Fechado</div>' };
    const folgas = turnos.filter(t => sem[t.i][k] === 'F').map(t => esc(t.nome));
    const doDia = turnos.filter(t => sem[t.i][k] === 'T' || COD[sem[t.i][k]]).sort((a, b) => a.ini - b.ini || a.fim - b.fim);
    // turnos que se sobrepõem ficam lado a lado (como na agenda do Google)
    let grupo = [], fimGrupo = -1;
    const fecha = () => { const n = Math.max(...grupo.map(t => t.lane)) + 1; grupo.forEach(t => t.n = n); grupo = []; };
    const fins = []; doDia.forEach(t => { if (t.ini >= fimGrupo && grupo.length) { fecha(); fins.length = 0; } let l = fins.findIndex(f => f <= t.ini); if (l < 0) { l = fins.length; fins.push(0); } fins[l] = t.fim; t.lane = l; grupo.push(t); fimGrupo = Math.max(fimGrupo, t.fim); });
    if (grupo.length) fecha();
    const blocos = doDia.map(t => {
      const c = sem[t.i][k], ausente = COD[c], [forte, claro] = cor(t.cargo), meio = t.ini + Math.round((t.fim - t.ini - t.intervalo) / 2);
      const rotulo = `${t.nome}, ${t.cargo}, ${hhmm(t.ini % 1440)} às ${hhmm(t.fim % 1440)}${ausente ? ', ' + COD[c] : ''}`;
      const pausa = t.intervalo && !ausente ? `<i class="ag-pausa" style="top:${y(meio) - y(t.ini)}px;height:${t.intervalo / 30 * PX}px"></i>` : '';
      const n = t.n, estreito = n >= 3;
      return `<button type="button" class="ag-bloco ${ausente ? 'ausente' : ''} ${estreito ? 'estreito' : ''}" data-ag="${t.i}:${k}" aria-label="${esc(rotulo)}" title="${esc(rotulo)}"
        style="top:${y(t.ini)}px;height:${Math.max(18, y(t.fim) - y(t.ini))}px;left:calc(${t.lane} * 100% / ${n});width:calc(100% / ${n} - 3px);--forte:${forte};--claro:${claro}">
        ${pausa}<b>${esc(estreito ? iniciaisDe(t.nome) : t.nome)}</b><small>${ausente ? esc(COD[c]) : `${hhmm(t.ini % 1440)}–${hhmm(t.fim % 1440)}`}</small></button>`;
    }).join('');
    return { cab, dia: `<p class="ag-folgas">${folgas.length ? `<b>Folga:</b> ${folgas.join(', ')}` : ''}</p>`, blocos };
  });
  const linhas = []; for (let m = h0; m < h1; m += 30) linhas.push(`<i class="${m % 60 ? 'meia' : ''}" style="top:${y(m)}px"></i>`);
  const segHoje = segundaDe(hoje);
  return `<div class="ag-topo"><button type="button" class="btn sec pq" id="agHoje" ${semData === segHoje ? 'disabled' : ''}>Hoje</button>
      <div class="ag-legenda" role="group" aria-label="Filtrar por função">${funcoes.map(c => `<button type="button" data-agf="${esc(c)}" aria-pressed="${!agFiltro.has(c)}" class="${agFiltro.has(c) ? 'off' : ''}" style="--forte:${cor(c)[0]};--claro:${cor(c)[1]}">${esc(c)}</button>`).join('')}</div></div>
    <div class="ag" style="--alt:${alt}px">
      <div class="ag-grade">
        <div class="ag-canto"></div>${colunas.map(c => c.cab).join('')}
        <div class="ag-canto dia">Dia todo</div>${colunas.map(c => `<div class="ag-diatodo">${c.dia}</div>`).join('')}
        <div class="ag-eixo">${eixo.join('')}</div>${colunas.map((c, k) => `<div class="ag-col ${soma(semData, k) === hoje ? 'hoje' : ''}"><div class="ag-linhas">${linhas.join('')}</div>${c.blocos}</div>`).join('')}
      </div></div>`;
}
function ligaAgenda() {
  $$('#escCorpo [data-ag]').forEach(b => b.onclick = () => { const [f, d] = b.dataset.ag.split(':').map(Number); diaSel = d; if (podeEditar()) folhaPessoaDia(f, d); });
  $$('#escCorpo [data-agf]').forEach(b => b.onclick = () => { const c = b.dataset.agf; agFiltro.has(c) ? agFiltro.delete(c) : agFiltro.add(c); if (agFiltro.size >= new Set(semana.escala.funcionarios.map(f => f.cargo || 'Equipe')).size) agFiltro.delete(c); desenhaSemana(); });
  const h = $('#agHoje'); if (h) h.onclick = () => { semData = segundaDe(hojeIso()); diaSel = null; telaEscala(); };
  // no celular, começa no dia de hoje (3 dias por tela, arrasta para os lados)
  const g = $('#escCorpo .ag'), hoje = $('#escCorpo .ag-col.hoje');
  if (g && hoje && g.scrollWidth > g.clientWidth) g.scrollLeft = Math.max(0, hoje.offsetLeft - g.querySelector('.ag-eixo').offsetWidth);
}
