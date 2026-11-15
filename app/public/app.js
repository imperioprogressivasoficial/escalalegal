// Sua Escala Blindada — app (JS puro). Um mecanismo só: abriu, vê a semana. Quem trabalha, quem folga.
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

let eu = null, conta = null, equipes = [], atual = null, funcs = [], semana = null, semData = null, diaSel = null, porPessoa = false, recem = false, modo = 'login', tipoCadastro = '';
const hojeIso = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const segundaDe = d => soma(d, -((new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7));
const mesAtual = () => hojeIso().slice(0, 7);
const ler = k => { try { return localStorage.getItem(k); } catch { return null; } };
const gravar = (k, v) => { try { localStorage.setItem(k, v ?? ''); } catch {} };
const podeEditar = () => conta && conta.papel !== 'contador';
const ehModoContador = () => eu?.contador && conta?.id === eu.id && !eu.empresa;
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;
const dataLonga = d => { const x = new Date(d + 'T12:00:00'); return `${DIA_LONGO[(x.getDay() + 6) % 7]}, ${x.getDate()} de ${MES[x.getMonth()]}`; };
const nomeCurto = n => String(n || '').split(' ')[0];
const naDia = d => (d >= 5 ? 'no ' : 'na ') + DIA_LONGO[d].toLowerCase();
const hora = h => { const [a, b] = String(h || '').split(':'); return a ? `${+a}h${b && b !== '00' ? b : ''}` : ''; };

async function api(url, opts = {}) {
  const headers = {'Content-Type': 'application/json'};
  if (conta?.id) headers['x-conta'] = conta.id;
  const r = await fetch(url, {method: opts.method || 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined});
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (j.trocar_conta) { gravar('conta', ''); location.hash = ''; location.reload(); }
    const e = new Error(j.erro || 'Algo deu errado. Tente de novo.'); e.status = r.status; throw e;
  }
  return j;
}
function toast(msg) { $$('.toast').forEach(t => t.remove()); const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.append(t); setTimeout(() => t.remove(), 3600); }
async function copiar(texto, msg) { try { await navigator.clipboard.writeText(texto); toast(msg); } catch { prompt('Copie:', texto); } }
function folha(html) { $('#folhaCorpo').innerHTML = html; const d = $('#folha'); if (!d.open) d.showModal(); d.scrollTop = 0; return d; }
const fechaFolha = () => $('#folha').close();

// ================= entrada =================
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
  $('#entradaTitulo').textContent = 'Seus clientes liberam o acesso e você vê escalas, faltas e o fechamento do mês num lugar só.';
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

// ================= início =================
async function iniciar() {
  try { eu = await api('/api/eu'); } catch {
    $('#telaEntrada').classList.remove('hide'); $('#telaApp').classList.add('hide');
    const qs = new URLSearchParams(location.search);
    if (qs.has('contador')) $('#btnSouContador').click(); else if (qs.has('cadastro')) modoEntrada('cadastro');
    return;
  }
  const salva = +ler('conta') || null;
  const escolhida = eu.contas.find(c => c.id === salva) || (!eu.empresa && !eu.contador && eu.contas[1]) || eu.contas[0];
  conta = {id: escolhida.id};
  conta = await api('/api/conta');
  gravar('conta', conta.id);
  document.body.classList.toggle('so-leitura', !podeEditar());
  $('#telaEntrada').classList.add('hide'); $('#telaApp').classList.remove('hide');
  // contador olhando um cliente: a 2ª aba vira o fechamento
  const nav = $('#navPessoas');
  if (conta.papel === 'contador') { nav.dataset.ir = 'fechamento'; nav.textContent = 'Fechamento'; }
  $('#barraBaixo').classList.toggle('hide', ehModoContador());
  await carregaEquipes();
  rota();
}
async function carregaEquipes() {
  if (ehModoContador()) { equipes = []; atual = null; return pintaTopo(); }
  equipes = await api('/api/equipes');
  atual = equipes.find(e => e.id === +ler('unidade')) || equipes[0] || null;
  if (atual) { gravar('unidade', atual.id); funcs = await api(`/api/equipes/${atual.id}/funcionarios`); }
  pintaTopo();
}
function pintaTopo() {
  const sel = $('#selUnidade');
  sel.classList.toggle('hide', equipes.length < 2);
  sel.innerHTML = equipes.map(e => `<option value="${e.id}" ${e.id === atual?.id ? 'selected' : ''}>${esc(e.nome)}</option>`).join('');
  $('#topoQuem').classList.toggle('hide', equipes.length > 1);
  $('#topoQuem').textContent = ehModoContador() ? eu.nome : conta.papel === 'contador' ? (conta.empresa || '') : (atual?.nome || conta.empresa || '');
}
$('#selUnidade').onchange = async () => {
  atual = equipes.find(e => e.id === +$('#selUnidade').value); gravar('unidade', atual.id);
  funcs = await api(`/api/equipes/${atual.id}/funcionarios`); semana = null; rota();
};

// rotas: #escala #pessoas #mais #comecar #funcionamento #ocorrencias #fechamento #contador #acessos #empresa #conta
window.onhashchange = () => rota();
const ir = h => { if (location.hash === '#' + h) rota(); else location.hash = h; };
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ir]'); if (b) { e.preventDefault(); if ($('#folha').open) fechaFolha(); ir(b.dataset.ir); }
  if (e.target.closest('[data-faltar]')) folhaFaltar();
});
async function rota() {
  if (!conta) return;
  let [v, extra] = (location.hash.slice(1) || '').split('/');
  const mc = ehModoContador();
  if (mc && !['contador', 'conta', 'mais', 'aula'].includes(v)) v = 'contador';
  if (!v) v = 'escala';
  if (conta.papel === 'dono' && !equipes.length && !['comecar', 'conta', 'mais', 'empresa', 'acessos', 'aula'].includes(v)) v = 'comecar';
  if (!document.getElementById('v-' + v) || (['acessos', 'empresa'].includes(v) && conta.papel !== 'dono')
    || (['comecar', 'pessoas', 'funcionamento'].includes(v) && !podeEditar())) v = mc ? 'contador' : 'escala';
  $$('.vista').forEach(x => x.classList.toggle('hide', x.id !== 'v-' + v));
  $$('#barraBaixo button').forEach(b => b.classList.toggle('on', b.dataset.ir === v || (v === 'funcionamento' && b.dataset.ir === 'mais') || (v === 'tabela' && b.dataset.ir === 'escala')));
  $('#principal').classList.toggle('larga', ['fechamento', 'contador', 'tabela'].includes(v));
  $('#barraBaixo').classList.toggle('hide', v === 'comecar' || v === 'aula' || mc);
  window.scrollTo(0, 0);
  try {
    if (v === 'comecar') wizInicio(extra === 'unidade');
    else if (v === 'escala') await telaEscala();
    else if (v === 'pessoas') telaPessoas();
    else if (v === 'tabela') await telaTabela();
    else if (v === 'aula') { aulaI = 0; telaAula(); }
    else if (v === 'mais') telaMais();
    else if (v === 'funcionamento') desenhaConfig();
    else if (v === 'ocorrencias') await telaOcorrencias();
    else if (v === 'fechamento') await telaFechamento();
    else if (v === 'contador') await telaContador();
    else if (v === 'acessos') await telaAcessos();
    else if (v === 'empresa') await telaEmpresa();
    else if (v === 'conta') telaConta();
  } catch (err) { toast(err.message); }
}

// ================= primeiro acesso: quiz (uma pergunta por tela) =================
let wz = null;
function wizInicio(soUnidade) {
  const base = soUnidade && atual ? atual.setor : '';
  wz = {i: 0, soUnidade, setor: base, empresa: {nome: conta.empresa || eu.empresa || '', porte: conta.porte || '', uf: conta.uf || '', cidade: ''},
    texto: '', marcados: new Set(), nomeUn: '', minMudou: false};
  if (base) aplicaSetor(base);
  wizDesenha();
}
function aplicaSetor(k) {
  const s = seg(k); wz.setor = k;
  wz.un = {abertos: [...s.abertos], minimo: [...s.minimo], abre: s.abre, fecha: s.fecha, horas_dia: 8, criticas: s.criticas.map(c => ({...c, minimo: [...c.minimo]}))};
}
const nomesWz = () => wz.texto.split('\n').map(l => l.replace(/^[\s\-•*\d.)]+/, '').trim()).filter(Boolean).slice(0, 200);
const artigo = s => ['farmácia', 'clínica', 'academia', 'padaria', 'loja'].includes(s.local) ? 'a' : 'o';
// a lista de perguntas muda conforme as respostas (ex.: farmácia pergunta quem é farmacêutico)
function perguntas() {
  const q = [];
  if (!wz.soUnidade) q.push('oi');
  q.push('negocio', 'nome');
  if (!wz.soUnidade) q.push('uf', 'cidade', 'porte');
  q.push('dias', 'horario', 'minimo', 'pessoas');
  if (wz.un?.criticas.length) q.push('critica');
  return q;
}
function wizDesenha() {
  const lista = perguntas(), id = lista[wz.i], total = lista.filter(x => x !== 'oi').length, num = lista.slice(0, wz.i + 1).filter(x => x !== 'oi').length;
  const s = seg(wz.setor || 'outro'), u = wz.un, e = wz.empresa;
  const topo = id === 'oi' ? '' : `<div class="quiz-topo"><button class="link" id="qVolta">‹ Voltar</button><span>${num} de ${total}</span></div>
    <div class="passos"><span class="on" style="flex:${num}"></span><span style="flex:${Math.max(total - num, 0.0001)}"></span></div>`;
  const continuar = (txt = 'Continuar') => `<button class="btn cheio fixo-baixo" id="qOk">${txt}</button>`;
  let h = '';
  if (id === 'oi') h = `<div class="vazio quiz-oi"><img src="/img/mascote.svg" alt=""><h1>Oi, ${esc(nomeCurto(eu.nome))}!</h1>
      <p>Vou montar a escala da sua equipe, já dentro da nova lei.</p><p><b>É só responder umas perguntas rápidas.</b> Leva uns 2 minutos.</p></div>${continuar('Começar')}`;
  else if (id === 'negocio') h = `<h1>${wz.soUnidade ? 'Que tipo de negócio é esta unidade?' : 'Qual é o seu negócio?'}</h1>
      <p class="sub">Cada negócio tem suas regras. Toque no seu.</p>
      <div class="segs">${SEG_ORDEM.map(k => `<button type="button" data-seg="${k}" class="${wz.setor === k ? 'on' : ''}"><b>${esc(seg(k).nome)}</b></button>`).join('')}</div>`;
  else if (id === 'nome') h = wz.soUnidade
    ? `<h1>Qual o nome desta unidade?</h1><p class="sub">Para você saber de qual escala está falando.</p><input id="qTxt" value="${esc(wz.nomeUn)}" placeholder="Ex.: Loja Shopping" autocomplete="off">${continuar()}`
    : `<h1>Qual o nome da sua empresa?</h1><p class="sub">Do jeito que sua equipe conhece.</p><input id="qTxt" value="${esc(e.nome)}" placeholder="Ex.: ${esc(s.nome.split(' /')[0])} Bom Preço" autocomplete="organization">${continuar()}`;
  else if (id === 'uf') h = `<h1>Em que estado fica?</h1><p class="sub">Para colocar os feriados do seu estado.</p>
      <div class="ufs">${Escala.UFS.map(x => `<button type="button" data-uf="${x}" class="${e.uf === x ? 'on' : ''}">${x}</button>`).join('')}</div>`;
  else if (id === 'cidade') h = `<h1>E a cidade?</h1><p class="sub">Se sua cidade tem feriado próprio, você coloca depois em Mais › Dados da empresa.</p>
      <input id="qTxt" value="${esc(e.cidade)}" placeholder="Ex.: Salvador" autocomplete="address-level2">${continuar()}`;
  else if (id === 'porte') h = `<h1>Qual o tamanho da empresa?</h1><p class="sub">Se não souber, toque em "Não sei". Seu contador sabe.</p>
      <div class="opcoes-grandes">${Object.entries(PORTES).filter(([k]) => k !== 'media').map(([k, [n, d]]) => `<button type="button" data-porte="${k}" class="${e.porte === k ? 'on' : ''}">${n}<small>${d}</small></button>`).join('')}</div>`;
  else if (id === 'dias') {
    const pad = u.abertos.join('');
    const op = [['1111111', 'Todo dia', 'de segunda a domingo'], ['1111110', 'Segunda a sábado', 'fecha no domingo'], ['1111100', 'Segunda a sexta', 'fecha sábado e domingo']];
    const igual = op.some(o => o[0] === pad);
    h = `<h1>Que dias ${artigo(s)} ${esc(s.local)} abre?</h1><p class="sub">${esc(s.nome.split(' /')[0])} costuma abrir ${op.find(o => o[0] === seg(wz.setor).abertos.join(''))?.[1].toLowerCase() || 'em dias variados'}.</p>
      <div class="opcoes-grandes">${op.map(([k, n, d]) => `<button type="button" data-dias="${k}" class="${pad === k ? 'on' : ''}">${n}<small>${d}</small></button>`).join('')}
      <button type="button" id="qOutros" class="${igual ? '' : 'on'}">Outros dias<small>escolher um por um</small></button></div>
      <div id="qDiasBox" class="${igual ? 'hide' : ''}" style="margin-top:12px"><div class="dias-conf">${DIAS.map((d, i) => `<div><button type="button" class="tg ${u.abertos[i] ? 'on' : ''}" data-ab="${i}">${d}</button></div>`).join('')}</div>${continuar()}</div>`;
  } else if (id === 'horario') h = `<h1>Abre às ${hora(u.abre)} e fecha às ${hora(u.fecha)}?</h1><p class="sub">É o horário mais comum. Se o seu for outro, toque em "Não".</p>
      <div class="lado"><button class="btn" id="qSim">Sim</button><button class="btn sec" id="qNao">Não</button></div>
      <div id="qHoraBox" class="hide" style="margin-top:14px"><div class="lado"><div><label for="qAbre" style="margin-top:0">Abre às</label><input id="qAbre" type="time" value="${u.abre}"></div><div><label for="qFecha" style="margin-top:0">Fecha às</label><input id="qFecha" type="time" value="${u.fecha}"></div></div>${continuar()}</div>`;
  else if (id === 'minimo') {
    const sug = Math.max(...seg(wz.setor).minimo), atualMin = wz.minMudou ? Math.max(...u.minimo) : sug;
    h = `<h1>Quantas pessoas precisam estar trabalhando por dia?</h1>
      <p class="sub">O mínimo para não deixar ${artigo(s)} ${esc(s.local)} descoberto, somando todos os turnos. Para ${esc(s.nome.split(' /')[0].toLowerCase())}, o comum é ${sug}.</p>
      <div class="contador-mais grande"><button type="button" id="qMenos" aria-label="Menos">−</button><output id="qMin">${atualMin}</output><button type="button" id="qMais" aria-label="Mais">+</button></div>
      <p class="dica" style="text-align:center;margin-top:6px">pessoas trabalhando, no mínimo</p>${continuar()}`;
  } else if (id === 'pessoas') h = `<h1>Quem trabalha com você?</h1><p class="sub">Escreva um nome por linha. Pode colar a lista do grupo do WhatsApp.</p>
      <textarea id="qPessoas" rows="8" placeholder="Ana&#10;Bruno&#10;Carla&#10;Diego">${esc(wz.texto)}</textarea><div id="qConta"></div>${continuar(u.criticas.length ? 'Continuar' : 'Montar minha escala')}`;
  else if (id === 'critica') {
    const c = u.criticas[0];
    h = `<h1>Quem é ${esc(c.nome.toLowerCase())}?</h1><p class="sub">${esc(c.explica)}</p>
      <div class="marcar">${nomesWz().map(x => `<button type="button" class="${wz.marcados.has(x) ? 'on' : ''}" data-m="${esc(x)}">${esc(x)}</button>`).join('')}</div><div id="qConta"></div>${continuar('Montar minha escala')}`;
  }
  $('#v-comecar').innerHTML = `<div class="quiz">${topo}<div class="quiz-q">${h}</div><p class="erro" id="wzErro"></p>
    ${wz.soUnidade && id === 'negocio' ? '<p style="text-align:center;margin-top:18px"><button class="link" data-ir="mais">Cancelar</button></p>' : ''}</div>`;
  const prox = () => { wz.i = Math.min(wz.i + 1, perguntas().length - 1); wizDesenha(); };
  const erro = m => { $('#wzErro').textContent = m; };
  if ($('#qVolta')) $('#qVolta').onclick = () => { if (wz.i === 0) return ir('mais'); wz.i--; wizDesenha(); };
  const ok = fn => { const b = $('#qOk'); if (b) b.onclick = fn; const t = $('#qTxt'); if (t) { t.focus(); t.onkeydown = ev => { if (ev.key === 'Enter') { ev.preventDefault(); fn(); } }; } };
  if (id === 'oi') ok(prox);
  if (id === 'negocio') $$('[data-seg]').forEach(b => b.onclick = () => { if (b.dataset.seg !== wz.setor) { aplicaSetor(b.dataset.seg); wz.minMudou = false; wz.marcados.clear(); } prox(); });
  if (id === 'nome') ok(() => {
    const v = $('#qTxt').value.trim();
    if (!v) return erro(wz.soUnidade ? 'Dê um nome. Ex.: Loja Shopping.' : 'Escreva o nome da empresa.');
    if (wz.soUnidade) wz.nomeUn = v; else e.nome = v; prox();
  });
  if (id === 'uf') $$('[data-uf]').forEach(b => b.onclick = () => { e.uf = b.dataset.uf; prox(); });
  if (id === 'cidade') ok(() => { e.cidade = $('#qTxt').value.trim(); prox(); });
  if (id === 'porte') $$('[data-porte]').forEach(b => b.onclick = () => {
    e.porte = b.dataset.porte;
    if (e.porte === 'mei') { $$('[data-porte]').forEach(x => x.classList.toggle('on', x === b)); $('#wzErro').innerHTML = ''; $('.quiz-q').insertAdjacentHTML('beforeend', `<div class="nota">MEI pode ter <b>só 1 funcionário</b> registrado. Ele folga 2 dias por semana e nesses dias quem cobre é você.</div>${continuar()}`); $('#qOk').onclick = prox; return; }
    prox();
  });
  if (id === 'dias') {
    const aplica = pad => { u.abertos = pad.split('').map(Number); u.minimo = u.minimo.map((m, i) => u.abertos[i] ? (m || Math.max(...u.minimo, 1)) : 0); u.criticas.forEach(c => c.minimo = c.minimo.map((m, i) => u.abertos[i] ? (m || Math.max(...c.minimo, 1)) : 0)); };
    $$('[data-dias]').forEach(b => b.onclick = () => { aplica(b.dataset.dias); prox(); });
    $('#qOutros').onclick = () => { $('#qDiasBox').classList.remove('hide'); $$('.opcoes-grandes button').forEach(x => x.classList.toggle('on', x.id === 'qOutros')); };
    $$('[data-ab]').forEach(b => b.onclick = () => { const i = +b.dataset.ab, p = [...u.abertos]; p[i] = p[i] ? 0 : 1; aplica(p.join('')); b.classList.toggle('on'); });
    ok(() => { if (!u.abertos.some(Boolean)) return erro('Marque pelo menos um dia.'); prox(); });
  }
  if (id === 'horario') {
    $('#qSim').onclick = prox;
    $('#qNao').onclick = () => { $('#qHoraBox').classList.remove('hide'); $('#qAbre').focus(); };
    ok(() => { u.abre = $('#qAbre').value || u.abre; u.fecha = $('#qFecha').value || u.fecha; prox(); });
  }
  if (id === 'minimo') {
    const set = v => { $('#qMin').textContent = Math.max(1, Math.min(200, v)); };
    $('#qMenos').onclick = () => set(+$('#qMin').textContent - 1);
    $('#qMais').onclick = () => set(+$('#qMin').textContent + 1);
    ok(() => {
      const v = +$('#qMin').textContent, base = seg(wz.setor).minimo;
      // manteve a sugestão: guarda o mínimo dia a dia do segmento (ex.: sábado com mais gente)
      if (v === Math.max(...base) && !wz.minMudou) u.minimo = base.map((m, i) => u.abertos[i] ? (m || v) : 0);
      else { u.minimo = u.minimo.map((_, i) => u.abertos[i] ? v : 0); wz.minMudou = true; }
      prox();
    });
  }
  const contagem = () => {
    const n = nomesWz().length, total = u.minimo.reduce((a, m, d) => a + (u.abertos[d] ? m : 0), 0), precisa = Math.ceil(total / 5);
    let html = '';
    if (n) html += n >= precisa ? `<div class="nota ok">${plural(n, 'pessoa', 'pessoas')}. Dá para cobrir todos os dias com 2 folgas por semana para cada um.</div>`
      : `<div class="nota">${plural(n, 'pessoa', 'pessoas')}. Para cobrir todos os dias precisa de ${precisa}. A escala sai, mas alguns dias ficam com menos gente.</div>`;
    const c = u.criticas[0];
    if (id === 'critica' && c) { const tem = nomesWz().filter(x => wz.marcados.has(x)).length, prec = Math.ceil(c.minimo.reduce((a, m) => a + m, 0) / 5); if (tem < prec) html = `<div class="nota">Para ter ${esc(c.nome.toLowerCase())} todo dia, precisa de ${prec}. Você marcou ${tem}.</div>`; else html = `<div class="nota ok">${plural(tem, 'marcado', 'marcados')}. Dá para ter ${esc(c.nome.toLowerCase())} todo dia.</div>`; }
    if (e.porte === 'mei' && n > 1) html += '<div class="nota">MEI pode ter só 1 funcionário registrado. Confira com seu contador.</div>';
    if ($('#qConta')) $('#qConta').innerHTML = html;
  };
  if (id === 'pessoas') {
    $('#qPessoas').oninput = () => { wz.texto = $('#qPessoas').value; contagem(); }; contagem(); $('#qPessoas').focus();
    ok(() => { if (!nomesWz().length) return erro('Escreva pelo menos um nome.'); if (u.criticas.length) prox(); else wizGerar(); });
  }
  if (id === 'critica') {
    $$('[data-m]').forEach(b => b.onclick = () => { const x = b.dataset.m; wz.marcados.has(x) ? wz.marcados.delete(x) : wz.marcados.add(x); b.classList.toggle('on'); contagem(); });
    contagem(); ok(() => wizGerar());
  }
  window.scrollTo(0, 0);
}
async function wizGerar() {
  const lista = nomesWz(), crit = wz.un.criticas[0];
  const nomeUn = wz.soUnidade ? wz.nomeUn : wz.empresa.nome;
  $('#v-comecar').innerHTML = `<div class="vazio quiz-oi"><img src="/img/mascote.svg" alt="" class="pulando"><h1>Montando sua escala…</h1><p>Distribuindo as folgas de ${plural(lista.length, 'pessoa', 'pessoas')} dentro da lei.</p></div>`;
  const espera = new Promise(r => setTimeout(r, 1200));
  try {
    const pessoas = lista.map(nome => ({nome, cargo: crit && wz.marcados.has(nome) ? crit.nome : ''}));
    const [r] = await Promise.all([api('/api/onboarding', {method: 'POST', body: {
      empresa: wz.soUnidade ? undefined : {...wz.empresa, porte: wz.empresa.porte || 'nao_sei', feriados_locais: ''},
      unidade: {...wz.un, nome: nomeUn, setor: wz.setor}, pessoas, inicio: segundaDe(hojeIso()), semanas: 4}}), espera]);
    conta = await api('/api/conta');
    if (!wz.soUnidade) eu = await api('/api/eu');
    gravar('unidade', r.equipe.id); await carregaEquipes();
    if (!r.escala) return telaPagar(r.checkout);
    recem = true; semData = segundaDe(hojeIso()); diaSel = null; ir('escala');
  } catch (err) {
    wz.i = perguntas().length - 1; wizDesenha(); $('#wzErro').textContent = err.message;
  }
}
function telaPagar(checkout) {
  $('#v-comecar').innerHTML = `<div class="vazio quiz-oi"><img src="/img/mascote.svg" alt=""><h1>Tudo pronto!</h1>
    <p>Sua equipe está salva. Falta só liberar o acesso para a escala aparecer.</p>
    ${checkout ? `<a class="btn cheio" href="${esc(checkout)}" target="_blank" rel="noopener">Liberar por R$ 47</a>` : '<p class="dica">Fale com o suporte para liberar.</p>'}
    <p class="dica">Pagamento único. Depois de pagar, volte aqui.</p></div>`;
}

// ================= escala (tela principal) =================
const opcoesAnalise = (eq, e) => ({horasDia: +eq.horas_dia || 8, ctx: conta.ctx, criticas: eq.criticas || [], domingoSemanas: Escala.domingoSemanasDe(eq.setor), abre: eq.abre, fecha: eq.fecha});
$('#semAnt').onclick = () => { recem = false; semData = soma(semData, -7); diaSel = null; telaEscala(); };
$('#semProx').onclick = () => { recem = false; semData = soma(semData, 7); diaSel = null; telaEscala(); };
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
  if (!semData) semData = segHoje;
  $('#semTit').textContent = tituloSemana(semData);
  $('#semSub').textContent = semData === segHoje ? 'Esta semana' : semData === soma(segHoje, 7) ? 'Semana que vem' : semData === soma(segHoje, -7) ? 'Semana passada' : '';
  $('#escCorpo').innerHTML = '<p class="dica" style="text-align:center;padding:30px">Carregando…</p>';
  const pedido = semData;
  const r = await api(`/api/equipes/${atual.id}/semana?data=${semData}`);
  if (pedido !== semData) return; // trocou de semana enquanto carregava
  semana = r;
  let aviso = '';
  if (recem && r.escala) aviso = `<div class="aviso verde">Pronto! Essa é a sua escala, dentro da lei. Toque em um nome para trocar a folga. Para baixar em PDF, Excel ou mandar no WhatsApp, toque em "Baixar ou enviar". <button class="link" data-ir="aula">Entenda a lei em 3 minutos ›</button></div>`;
  if (r.novos) aviso += `<div class="aviso azul">${plural(r.novos, 'pessoa nova entra', 'pessoas novas entram')} na escala a partir de ${br(soma(semData, 7))}. Esta semana fica como estava.</div>`;
  $('#escAviso').innerHTML = aviso;
  if (!r.escala) {
    const m = {
      sem_pessoas: `<div class="vazio"><img src="/img/mascote.svg" alt=""><h2>Coloque sua equipe</h2><p>Escreva quem trabalha com você e a escala aparece na hora.</p>${podeEditar() ? '<button class="btn" data-ir="pessoas">Colocar a equipe</button>' : ''}</div>`,
      nao_pago: `<div class="vazio"><img src="/img/mascote.svg" alt=""><h2>Falta liberar o acesso</h2><p>Sua equipe está salva. Libere e a escala aparece na hora.</p>${r.checkout && conta.papel === 'dono' ? `<a class="btn cheio" href="${esc(r.checkout)}" target="_blank" rel="noopener">Liberar por R$ 47</a>` : '<p class="dica">O dono da empresa precisa liberar o acesso.</p>'}</div>`,
      passado: '<div class="vazio"><h2>Sem escala nesta semana</h2><p>Essa semana já passou e não tinha escala no sistema.</p></div>',
      sem_escala: `<div class="vazio"><h2>Sem escala nesta semana</h2><p>${podeEditar() ? 'Não deu para montar esta semana. Se o mês já foi fechado, reabra em Mais › Fechar o mês.' : 'A empresa ainda não montou a escala desta semana.'}</p></div>`,
    };
    $('#escCorpo').innerHTML = m[r.motivo] || m.sem_escala;
    return;
  }
  const e = r.escala, s = r.semana;
  if (diaSel === null) { const i = semData === segHoje ? (new Date(hoje + 'T12:00:00').getDay() + 6) % 7 : e.abertos.findIndex(Boolean); diaSel = Math.max(0, i); }
  desenhaSemana();
}
function semanaDados() { const e = semana.escala; return e.dados[semana.semana]; }
function desenhaSemana() {
  const e = semana.escala, s = semana.semana, sem = semanaDados(), hoje = hojeIso(), ed = podeEditar();
  // a lei nesta semana
  const fatia = {...e, inicio: semData, semanas: 1, dados: [sem]};
  const a = Escala.analisar(fatia, opcoesAnalise(atual));
  const furos = DIAS.map((_, d) => e.abertos[d] && sem.filter(x => x[d] === 'T').length < e.minimo[d]).filter(Boolean).length;
  const status = !a.problemas ? `<button class="status ok" id="btnAnalise"><span class="ic">✓</span><span>Escala dentro da lei<small>Toque para ver os detalhes</small></span></button>`
    : `<button class="status ruim" id="btnAnalise"><span class="ic">!</span><span>${esc(a.resumo)}<small>${furos ? `${plural(furos, 'dia fica', 'dias ficam')} com menos gente. ` : ''}Toque para ver o que fazer</small></span></button>`;
  const pills = DIAS.map((d, i) => {
    const data = soma(semData, i), p = sem.filter(x => x[i] === 'T').length, fer = Escala.feriado(data, conta.ctx);
    const falta = e.abertos[i] && p < e.minimo[i];
    return `<button data-dia="${i}" class="${i === diaSel ? 'on' : ''} ${data === hoje ? 'hoje' : ''} ${e.abertos[i] ? '' : 'fechado'}"><small>${d}</small><b>${data.slice(8)}</b>${falta ? '<i></i>' : fer ? '<i class="fer"></i>' : ''}</button>`;
  }).join('');
  let corpo;
  if (porPessoa) {
    corpo = `<ul class="pp">${e.funcionarios.map((f, fi) => {
      const dias = sem[fi], folgas = dias.map((c, d) => c === 'F' && e.abertos[d] ? DIA_LONGO[d].toLowerCase() : null).filter(Boolean);
      const fora = [...new Set(dias.map(c => COD[c]).filter(Boolean))];
      return `<li data-pessoa="${fi}"><div class="top"><b>${esc(f.nome)}</b><span class="folga">${fora.length ? esc(fora.join(', ')) : folgas.length ? 'Folga ' + folgas.join(' e ') : 'Sem folga'}</span></div>
        <div class="sem">${dias.map((c, d) => `<span class="c-${e.abertos[d] ? c : '0'}">${DIAS[d].slice(0, 3)}<br>${!e.abertos[d] ? '–' : c === 'T' ? 'trab.' : c === 'F' ? 'folga' : CURTO[c]}</span>`).join('')}</div></li>`;
    }).join('')}</ul>`;
  } else {
    const d = diaSel, data = soma(semData, d), fer = Escala.feriado(data, conta.ctx);
    if (!e.abertos[d]) corpo = `<div class="dia-tit"><h2>${dataLonga(data)}</h2></div><div class="grupo"><p class="vazio-grupo">Fechado neste dia. Ninguém trabalha.</p></div>`;
    else {
      const grupo = cod => sem.map((x, f) => ({x: x[d], f})).filter(o => cod === 'A' ? COD[o.x] : o.x === cod);
      const T = grupo('T'), F = grupo('F'), A = grupo('A');
      const btn = (o, cls) => `<button class="nome ${cls}" data-f="${o.f}">${esc(e.funcionarios[o.f]?.nome)}${cls === 'A' ? `<small>${esc(COD[o.x])}</small>` : e.funcionarios[o.f]?.cargo ? `<small>${esc(e.funcionarios[o.f].cargo)}</small>` : ''}</button>`;
      corpo = `<div class="dia-tit"><h2>${dataLonga(data)}</h2><span class="${T.length >= e.minimo[d] ? 'ok' : 'baixo'}">${T.length} trabalhando · mínimo ${e.minimo[d]}</span></div>
        ${fer ? `<div class="nota" style="margin:0 0 10px">Feriado: <b>${esc(fer)}</b>. Quem trabalha hoje recebe em dobro ou ganha outra folga.</div>` : ''}
        ${T.length < e.minimo[d] ? `<div class="nota" style="margin:0 0 10px">Falta gente: precisa de pelo menos ${e.minimo[d]} trabalhando.${ed ? ' Toque em quem folga para trocar.' : ''}</div>` : ''}
        <div class="grupo T"><h3>Trabalham <em>${T.length}</em></h3><div class="nomes">${T.map(o => btn(o, 'T')).join('') || '<span class="vazio-grupo">Ninguém</span>'}</div></div>
        <div class="grupo F"><h3>Folgam <em>${F.length}</em></h3><div class="nomes">${F.map(o => btn(o, 'F')).join('') || '<span class="vazio-grupo">Ninguém</span>'}</div></div>
        ${A.length ? `<div class="grupo A"><h3>Não vêm <em>${A.length}</em></h3><div class="nomes">${A.map(o => btn(o, 'A')).join('')}</div></div>` : ''}`;
    }
  }
  $('#escCorpo').innerHTML = `${status}<div class="dias">${pills}</div>${corpo}
    <div class="acoes-esc"><button class="btn" id="btnExportar">Baixar ou enviar</button>${ed ? '<button class="btn sec" data-faltar>Alguém vai faltar?</button>' : '<button class="btn sec" data-ir="tabela">Ver a tabela</button>'}</div>
    <button class="btn sec cheio" data-ir="tabela" style="margin-top:8px">Ver a tabela pronta e a parte da lei</button>
    <button class="link ver-pessoa" id="btnModo">${porPessoa ? 'Ver dia por dia' : 'Ver a semana de cada pessoa'}</button>`;
  $$('[data-dia]').forEach(b => b.onclick = () => { diaSel = +b.dataset.dia; porPessoa = false; desenhaSemana(); });
  $('#btnModo').onclick = () => { porPessoa = !porPessoa; desenhaSemana(); };
  $('#btnAnalise').onclick = () => folhaAnalise();
  $('#btnExportar').onclick = () => folhaExportar();
  if (ed) {
    $$('#escCorpo [data-f]').forEach(b => b.onclick = () => folhaPessoaDia(+b.dataset.f, diaSel));
    $$('#escCorpo [data-pessoa]').forEach(li => li.onclick = () => folhaPessoaSemana(+li.dataset.pessoa));
  }
}

// --- folhas de ação ---
function htmlAnalise(a) {
  const ic = i => i.ok === true ? '<span class="ic ok">✓</span>' : i.ok === false ? '<span class="ic ruim">!</span>' : '<span class="ic info">i</span>';
  return `<div class="diag-topo ${a.problemas ? 'ruim' : 'ok'}"><img src="/img/mascote.svg" alt=""><div><b>${esc(a.resumo)}</b>
    ${plural(a.n, 'pessoa', 'pessoas')} · ${String(a.horasSemana).replace('.', ',')}h por semana cada</div></div>
    <ul class="diag">${a.itens.map(i => `<li>${ic(i)}<div><b>${esc(i.titulo)}</b><span>${esc(i.texto)}</span></div></li>`).join('')}</ul>`;
}
function folhaAnalise() {
  const e = semana.escala, fatia = {...e, inicio: semData, semanas: 1, dados: [semanaDados()]};
  folha(`<h2>Esta semana e a lei</h2>${htmlAnalise(Escala.analisar(fatia, opcoesAnalise(atual)))}
    <button class="btn cheio sec" data-ir="aula" style="margin-top:12px">Entender a lei em 3 minutos</button>`);
}
async function trocaCelulas(pares, msg) {
  try {
    let dados;
    for (const [f, d] of pares) dados = (await api(`/api/escalas/${semana.escala.id}`, {method: 'PATCH', body: {semana: semana.semana, funcionario: f, dia: d}})).dados;
    semana.escala.dados = dados; recem = false; $('#escAviso').innerHTML = ''; fechaFolha(); desenhaSemana(); toast(msg);
  } catch (err) { toast(err.message); }
}
function folhaPessoaDia(f, d) {
  const e = semana.escala, sem = semanaDados(), c = sem[f][d], nome = e.funcionarios[f].nome, n1 = nomeCurto(nome);
  const data = soma(semData, d), quando = `${naDia(d)} (${dm(data)})`;
  const outros = cod => sem[f].map((x, i) => x === cod && e.abertos[i] && i !== d ? i : -1).filter(i => i >= 0);
  const botoesDias = (lista, acao) => `<div class="dias-escolha">${lista.map(i => `<button data-${acao}="${i}">${DIA_LONGO[i]}<small>${dm(soma(semData, i))}</small></button>`).join('')}</div>`;
  if (COD[c]) {
    return folha(`<h2>${esc(nome)}</h2><p style="margin-top:6px">${esc(COD[c])} ${quando}.</p>
      <div class="opcoes-grandes"><button data-ir="ocorrencias">Ver ou apagar o que foi lançado<small>Férias, faltas e atestados do mês</small></button></div>`);
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
  folha(`<h2>Quem vai faltar?</h2><div class="opcoes-grandes">${funcs.map(f => `<button data-quem="${f.id}">${esc(f.nome)}${f.cargo ? `<small>${esc(f.cargo)}</small>` : ''}</button>`).join('')}</div>`);
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
async function salvaOcorrencia(body, msg, elErro) {
  try {
    await api('/api/ocorrencias', {method: 'POST', body});
    let extra = '';
    if (['ferias', 'afastamento'].includes(body.tipo)) {
      const f = funcs.find(x => x.id === body.funcionario_id), eqId = f?.equipe_id || atual.id;
      const r = await api(`/api/equipes/${eqId}/refazer`, {method: 'POST', body: {de: body.inicio, ate: body.fim}}).catch(() => ({}));
      if (r.refeito) extra = ' A escala das próximas semanas foi refeita.';
    }
    fechaFolha(); toast(msg + extra);
    if (location.hash.startsWith('#ocorrencias')) telaOcorrencias(); else telaEscala();
  } catch (err) { if (elErro) elErro.textContent = err.message; else toast(err.message); }
}
async function linkEquipe(id) {
  try {
    const {link} = await api(`/api/equipes/${id}/link`, {method: 'POST', body: {}});
    const msg = `Escala da equipe: ${link}\nAbra, toque no seu nome e veja suas folgas.`;
    if (navigator.share) { try { await navigator.share({text: msg}); return; } catch {} }
    folha(`<h2>Mandar para a equipe</h2><p style="margin-top:6px">Cada um abre o link, toca no próprio nome e vê as folgas. Não precisa instalar nada.</p>
      <div class="opcoes-grandes"><a class="btn cheio" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">Mandar no WhatsApp</a>
      <button id="lkCopiar">Copiar o link</button><button id="lkTexto">Copiar a escala em texto</button><button id="lkImprimir">Imprimir para o mural</button></div>`);
    $('#lkCopiar').onclick = () => copiar(msg, 'Link copiado. Cole no grupo da equipe.');
    $('#lkTexto').onclick = () => copiar(textoEscala(), 'Texto copiado. Cole no grupo da equipe.');
    $('#lkImprimir').onclick = () => { fechaFolha(); imprimir(); };
  } catch (err) { toast(err.message); }
}
function textoEscala() {
  const e = semana.escala;
  let t = `*${atual.nome} — Escala*\n`;
  for (let s = semana.semana; s < e.dados.length; s++) {
    t += `\n*Semana de ${dm(soma(e.inicio, s * 7))}*\n`;
    e.dados[s].forEach((dias, f) => {
      const folgas = dias.map((c, d) => c === 'F' && e.abertos[d] ? DIA_LONGO[d].toLowerCase() : null).filter(Boolean);
      const fora = [...new Set(dias.map(c => COD[c]).filter(Boolean))];
      t += `${e.funcionarios[f].nome}: ${folgas.length ? 'folga ' + folgas.join(' e ') : 'sem folga'}${fora.length ? ` (${fora.join(', ').toLowerCase()})` : ''}\n`;
    });
  }
  return t;
}
function imprimir() {
  if (!semana?.escala) return toast('Abra a escala primeiro.');
  const e = semana.escala;
  let h = '';
  for (let s = semana.semana; s < e.dados.length; s++) {
    const ini = soma(e.inicio, s * 7);
    h += `<h2>${esc(atual.nome)} · semana de ${br(ini)} a ${br(soma(ini, 6))}</h2><table><thead><tr><th></th>${DIAS.map((d, i) => `<th>${d} ${dm(soma(ini, i))}</th>`).join('')}</tr></thead><tbody>
      ${e.dados[s].map((dias, f) => `<tr><td>${esc(e.funcionarios[f].nome)}</td>${dias.map((c, d) => `<td class="${e.abertos[d] ? c : ''}">${!e.abertos[d] ? '–' : c === 'T' ? '' : c === 'F' ? 'FOLGA' : esc(COD[c] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  $('#areaImpressao').innerHTML = h; window.print();
}

// ================= equipe =================
function telaPessoas() {
  if (!atual) return ir('comecar');
  const fs = seg(atual.setor).funcoes;
  $('#pesSub').textContent = `${plural(funcs.length, 'pessoa', 'pessoas')} em ${atual.nome}. Toque em alguém para mudar o nome, a função ou tirar da equipe.`;
  $('#listaP').innerHTML = funcs.length ? funcs.map(f => `<li data-fid="${f.id}"><div><b>${esc(f.nome)}</b><small>${[f.cargo, f.folga_fixa.length ? 'folga fixa ' + f.folga_fixa.map(d => DIAS[d]).join(' e ') : ''].filter(Boolean).map(esc).join(' · ') || (fs.length ? 'Toque para escolher a função' : '')}</small></div><span class="seta">›</span></li>`).join('')
    : '<li style="cursor:default"><span class="dica">Ninguém ainda. Escreva o primeiro nome acima.</span></li>';
  $$('[data-fid]').forEach(li => li.onclick = () => folhaFunc(funcs.find(x => x.id === +li.dataset.fid)));
}
$('#formAdd').onsubmit = async e => {
  e.preventDefault();
  const nome = $('#addNome').value.trim(); if (!nome) return $('#addNome').focus();
  try {
    await api(`/api/equipes/${atual.id}/funcionarios`, {method: 'POST', body: [{nome, cargo: ''}]});
    $('#addNome').value = ''; funcs = await api(`/api/equipes/${atual.id}/funcionarios`); telaPessoas();
    toast(`${nomeCurto(nome)} entrou na equipe. Aparece na escala a partir de ${br(soma(segundaDe(hojeIso()), 7))}.`);
  } catch (err) { toast(err.message); }
};
function folhaFunc(f) {
  const fs = seg(atual.setor).funcoes, fixa = [...f.folga_fixa];
  folha(`<h2>${esc(f.nome)}</h2>
    <label for="efNome">Nome</label><input id="efNome" value="${esc(f.nome)}">
    <label for="efCargo">Função</label>${fs.length ? `<select id="efCargo"><option value="">—</option>${[...new Set([...fs, f.cargo].filter(Boolean))].map(x => `<option ${x === f.cargo ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>` : `<input id="efCargo" value="${esc(f.cargo || '')}" placeholder="Ex.: Atendente">`}
    <label>Folga fixa (só se vocês combinaram)</label><div class="dias-chip" id="efFixa"></div>
    <details style="margin-top:14px"><summary class="link">Mais dados (para o contador)</summary>
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
    try {
      await api(`/api/funcionarios/${f.id}`, {method: 'PUT', body: {nome: $('#efNome').value, cargo: $('#efCargo').value, matricula: $('#efMat').value, admissao: $('#efAdm').value, telefone: $('#efTel').value, folga_fixa: fixa}});
      fechaFolha(); funcs = await api(`/api/equipes/${atual.id}/funcionarios`); telaPessoas(); toast('Salvo.');
    } catch (err) { $('#efErro').textContent = err.message; }
  };
  $('#efTirar').onclick = async () => {
    if (!confirm(`Tirar ${f.nome} da equipe? Sai da escala a partir da semana que vem.`)) return;
    try { await api(`/api/funcionarios/${f.id}`, {method: 'DELETE'}); fechaFolha(); funcs = funcs.filter(x => x.id !== f.id); telaPessoas(); toast(`${nomeCurto(f.nome)} saiu da equipe.`); }
    catch (err) { $('#efErro').textContent = err.message; }
  };
}

// ================= mais =================
function telaMais() {
  const mc = ehModoContador(), dono = conta.papel === 'dono', ed = podeEditar();
  const item = (ir, t, d) => `<li><button data-ir="${ir}"><span>${t}${d ? `<small>${d}</small>` : ''}</span><span class="seta">›</span></button></li>`;
  let h = '';
  h += `<ul class="menu"><li><button data-ir="aula" class="menu-aula"><span>Aprenda a nova lei em 3 minutos<small>Sem juridiquês, com exemplos e teste rápido</small></span><span class="seta">›</span></button></li></ul>`;
  if (mc) h += `<ul class="menu" style="margin-top:8px">${item('contador', 'Suas empresas', 'Clientes que liberaram o acesso')}</ul>`;
  else {
    h += '<p class="menu-tit">Escala</p><ul class="menu">';
    if (ed) h += item('funcionamento', 'Horário e dias de funcionamento', atual ? `${hora(atual.abre)} às ${hora(atual.fecha)} · mínimo de pessoas por dia` : '');
    h += item('ocorrencias', 'Férias, faltas e atestados', 'Tudo o que foi lançado no mês');
    h += item('tabela', 'A tabela pronta', 'Baixar em PDF, Excel ou imagem, mandar no WhatsApp');
    h += '</ul><p class="menu-tit">Contador</p><ul class="menu">';
    h += item('fechamento', 'Fechar o mês', 'Dias trabalhados, faltas e planilha para a folha');
    if (dono) h += item('acessos', 'Dar acesso ao contador', 'Ele vê tudo sem você mandar planilha');
    h += '</ul><p class="menu-tit">Empresa</p><ul class="menu">';
    if (ed) h += item('comecar/unidade', 'Outra loja ou unidade', 'Cada uma tem sua equipe e sua escala');
    if (dono) h += item('empresa', 'Dados da empresa', 'Nome, CNPJ, cidade e feriados');
    h += '</ul>';
  }
  h += '<p class="menu-tit">Você</p><ul class="menu">';
  if (eu.contas.length > 1) h += `<li><button id="mTrocar"><span>Trocar de empresa<small>${esc(mc ? 'Meu escritório' : conta.empresa || '')}${conta.papel !== 'dono' ? ` · você é ${PAPEL[conta.papel].toLowerCase()}` : ''}</small></span><span class="seta">›</span></button></li>`;
  h += `<li><a href="/ajuda"><span>Ajuda e a nova lei<small>O que mudou e como funciona</small></span><span class="seta">›</span></a></li>`;
  h += item('conta', 'Minha conta', esc(eu.email));
  h += '<li><button id="mSair"><span>Sair</span><span class="seta">›</span></button></li></ul>';
  $('#maisTit').textContent = mc ? 'Opções' : 'Mais opções';
  $('#maisCorpo').innerHTML = h;
  if ($('#mTrocar')) $('#mTrocar').onclick = () => {
    folha(`<h2>Trocar de empresa</h2><div class="opcoes-grandes">${eu.contas.map(c => `<button data-conta="${c.id}">${esc(c.id === eu.id && eu.contador && !eu.empresa ? 'Meu escritório' : c.empresa || 'Minha empresa')}<small>${PAPEL[c.papel]}</small></button>`).join('')}</div>`);
    $$('[data-conta]').forEach(b => b.onclick = () => { gravar('conta', b.dataset.conta); gravar('unidade', ''); location.hash = ''; location.reload(); });
  };
  $('#mSair').onclick = async () => { await api('/api/sair', {method: 'POST'}); gravar('conta', ''); location.href = '/app'; };
}

// ================= funcionamento =================
let cfg = null;
function desenhaConfig() {
  if (!atual) return ir('comecar');
  cfg = {abertos: [...atual.abertos], minimo: [...atual.minimo], criticas: (atual.criticas || []).map(c => ({...c, minimo: [...c.minimo]}))};
  $('#cfSetor').innerHTML = SEG_ORDEM.map(k => `<option value="${k}">${esc(seg(k).nome)}</option>`).join('');
  $('#cfNome').value = atual.nome; $('#cfSetor').value = atual.setor; $('#cfHoras').value = +atual.horas_dia || 8;
  $('#cfAbre').value = atual.abre || seg(atual.setor).abre; $('#cfFecha').value = atual.fecha || seg(atual.setor).fecha;
  diasConfig();
}
function diasConfig() {
  $('#cfDias').innerHTML = DIAS.map((d, i) => `<div><button type="button" class="tg ${cfg.abertos[i] ? 'on' : ''}" data-i="${i}">${d}</button><input type="number" min="0" max="200" value="${cfg.minimo[i]}" data-m="${i}" aria-label="Mínimo ${d}" ${cfg.abertos[i] ? '' : 'disabled'}></div>`).join('');
  $$('#cfDias .tg').forEach(b => b.onclick = () => { const i = +b.dataset.i; cfg.abertos[i] = cfg.abertos[i] ? 0 : 1; if (!cfg.abertos[i]) { cfg.minimo[i] = 0; cfg.criticas.forEach(c => c.minimo[i] = 0); } else if (!cfg.minimo[i]) cfg.minimo[i] = 1; diasConfig(); });
  $$('#cfDias input').forEach(inp => inp.oninput = () => cfg.minimo[+inp.dataset.m] = +inp.value || 0);
  $('#cfCriticas').innerHTML = cfg.criticas.map((c, ci) => `<label>Mínimo de ${esc(c.nome.toLowerCase())} em cada dia</label><div class="dias-conf">${DIAS.map((d, i) => `<div><span class="dia-rot">${d}</span><input type="number" min="0" max="50" value="${c.minimo[i]}" data-cc="${ci}" data-ci="${i}" ${cfg.abertos[i] ? '' : 'disabled'}></div>`).join('')}</div><p class="dica" style="margin-top:6px">${esc(c.explica || '')}</p>`).join('');
  $$('[data-cc]').forEach(inp => inp.oninput = () => cfg.criticas[+inp.dataset.cc].minimo[+inp.dataset.ci] = +inp.value || 0);
}
$('#cfSetor').onchange = () => { const s = seg($('#cfSetor').value); cfg = {abertos: [...s.abertos], minimo: [...s.minimo], criticas: s.criticas.map(c => ({...c, minimo: [...c.minimo]}))}; $('#cfAbre').value = s.abre; $('#cfFecha').value = s.fecha; diasConfig(); };
$('#btnSalvarCfg').onclick = async () => {
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
    if (!confirm('Apagar? A pessoa volta para a escala nesses dias.')) return;
    try { await api(`/api/ocorrencias/${b.dataset.delOc}`, {method: 'DELETE'}); toast('Apagado.'); telaOcorrencias(); } catch (err) { toast(err.message); }
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
  $('#fechSub').textContent = `${fech.empresa || ''}${fech.cnpj ? ' · CNPJ ' + fech.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : ''} · ${nomeMes}`;
  const nomeMesCurto = $('#fechMes').value.split('-').reverse().join('/'), futuro = $('#fechMes').value > mesAtual();
  $('#fechStatus').innerHTML = fech.fechado
    ? `<div class="status-mes"><div><span class="selo fechado">Mês fechado</span></div><p class="dica">Fechado em ${new Date(fech.fechado.em).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'})}${fech.fechado.por ? ' por ' + esc(fech.fechado.por) : ''}. Os números não mudam mais.</p>${conta.papel === 'dono' ? '<button class="btn sec" id="btnReabrir">Reabrir o mês</button>' : ''}</div>`
    : `<div class="status-mes"><div><span class="selo aberto">Mês aberto</span></div><p class="dica">${futuro ? 'Este mês ainda não começou.' : conta.papel === 'contador' ? 'A empresa ainda não fechou este mês. Os números podem mudar.' : 'No fim do mês, confira e feche. O contador recebe um aviso e os números ficam guardados.'}</p>${podeEditar() && !futuro ? '<button class="btn" id="btnFecharMes">Fechar o mês e avisar o contador</button>' : ''}</div>`;
  if ($('#btnFecharMes')) $('#btnFecharMes').onclick = async () => {
    if (!confirm(`Fechar ${nomeMesCurto}? O contador é avisado e as escalas do mês não mudam mais.`)) return;
    try { const r = await api('/api/fechamentos', {method: 'POST', body: {mes: $('#fechMes').value}}); toast(r.contadores_avisados ? 'Mês fechado. Seu contador foi avisado.' : 'Mês fechado. Dica: dê acesso ao seu contador em Mais.'); telaFechamento(); }
    catch (err) { toast(err.message); }
  };
  if ($('#btnReabrir')) $('#btnReabrir').onclick = async () => {
    if (!confirm(`Reabrir ${nomeMesCurto}? Depois de corrigir, feche de novo para avisar o contador.`)) return;
    await api('/api/fechamentos/' + $('#fechMes').value, {method: 'DELETE'}); toast('Mês reaberto.'); telaFechamento();
  };
  $('#fechAvisos').innerHTML = '';
  const L = fech.linhas;
  if (!L.length) { $('#fechResumo').innerHTML = '<p class="dica">Ninguém neste mês.</p>'; $('#fechEspelho').innerHTML = ''; return; }
  const n = v => v ? `<b>${v}</b>` : '<span class="dica">0</span>';
  const h = v => v ? `<b>${v > 0 ? '+' : ''}${String(v).replace('.', ',')}h</b>` : '<span class="dica">0</span>';
  $('#fechResumo').innerHTML = `<table class="tab"><thead><tr><th>Pessoa</th>${equipes.length > 1 ? '<th>Unidade</th>' : ''}<th class="n">Trabalhou</th><th class="n">Folgas</th><th class="n">Domingos</th><th class="n">Feriados</th><th class="n">Faltas</th><th class="n">Atestado</th><th class="n">Férias</th><th class="n">Afast.</th><th class="n">Banco</th></tr></thead><tbody>
    ${L.map(l => `<tr><td><b>${esc(l.nome)}</b>${l.matricula ? ` <span class="dica">${esc(l.matricula)}</span>` : ''}</td>${equipes.length > 1 ? `<td>${esc(l.equipe)}</td>` : ''}
      <td class="n">${n(l.trabalhados)}</td><td class="n">${n(l.folgas)}</td><td class="n">${n(l.domingos)}</td><td class="n">${n(l.feriados)}</td><td class="n">${n(l.faltas)}</td><td class="n">${n(l.atestado)}</td>
      <td class="n">${n(l.ferias)}</td><td class="n">${n(l.afastamento)}</td><td class="n">${h(l.banco_mes)}</td></tr>`).join('')}</tbody></table>
    <p class="dica" style="margin-top:10px">Domingos e feriados = dias trabalhados. Feriado trabalhado: pagar em dobro ou dar outra folga (Lei 605/49).</p>`;
  $('#fechEspelho').innerHTML = `<table class="espelho"><thead><tr><th>Pessoa</th>${fech.dias.map(d => `<th class="${d.dia === 'Dom' ? 'dom' : ''} ${d.feriado ? 'fer' : ''}" title="${d.feriado ? esc(d.feriado) : ''}">${d.data.slice(8)}<br>${d.dia.slice(0, 1)}</th>`).join('')}</tr></thead><tbody>
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
  $('#contSub').textContent = r.empresas.length ? `${plural(r.empresas.length, 'empresa liberou', 'empresas liberaram')} acesso para você.` : '';
  if (!r.empresas.length) {
    $('#contEmpresas').innerHTML = `<div class="cartao vazio"><img src="/img/mascote.svg" alt=""><h2>Nenhuma empresa ainda</h2>
      <p>Peça para o seu cliente abrir a Sua Escala Blindada, ir em <b>Mais › Dar acesso ao contador</b> e colocar o e-mail <b>${esc(eu.email)}</b>.</p>
      <p class="dica">Assim que ele liberar, a empresa aparece aqui.</p></div>`;
    return;
  }
  $('#contEmpresas').innerHTML = `<div class="empresas">${r.empresas.map(e => `<article class="cartao emp-card">
      <h3>${esc(e.nome_fantasia || e.empresa)}</h3>
      <p class="meta">${e.cnpj ? 'CNPJ ' + esc(e.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')) + ' · ' : ''}${esc(e.porte_nome || '')}${e.uf ? ' · ' + esc(e.uf) : ''}</p>
      <div class="linha-st"><span>Pessoas</span><b>${e.funcionarios} em ${plural(e.unidades, 'unidade', 'unidades')}</b></div>
      <div class="linha-st"><span>Fechamento de ${mAnt}</span>${e.fechado_ant ? '<span class="selo fechado">Fechado</span>' : '<span class="selo aberto">Aguardando</span>'}</div>
      <div class="linha-st"><span>Faltas e atestados em ${mAnt}</span><b>${e.faltas_atestados_ant}</b></div>
      <div class="acoes"><button class="btn pq" data-abrir="${e.id}" data-mes="${r.mes_anterior}">Fechamento de ${mAnt}</button><button class="btn sec pq" data-abrir="${e.id}">Ver a escala</button></div>
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
  $('#listaMembros').innerHTML = m.map(x => `<li><div><b>${esc(x.nome)}</b> · ${esc(x.email)}</div>
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
  $('#emNome').value = c.nome; $('#emRazao').value = c.razao_social; $('#emCidade').value = c.cidade;
  $('#emCnpj').value = c.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  $('#emPorte').innerHTML = Object.entries(PORTES).map(([k, [n, d]]) => `<label><input type="radio" name="emPorte" value="${k}" ${c.porte === k ? 'checked' : ''}>${n}${d ? `<small>${d}</small>` : ''}</label>`).join('');
  $('#emUf').innerHTML = '<option value="">—</option>' + c.ufs.map(u => `<option ${c.uf === u ? 'selected' : ''}>${u}</option>`).join('');
  $('#emFer').value = c.feriados_locais.map(md => md.slice(3) + '/' + md.slice(0, 2)).join(', ');
  $('#listaHist').innerHTML = h.length ? `<table class="tab"><tbody>${h.slice(0, 60).map(x => `<tr><td class="dica" style="white-space:nowrap">${new Date(x.criado_em).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'})}</td><td>${esc(x.quem)}: ${esc(x.acao)}</td></tr>`).join('')}</tbody></table>`
    : '<p class="dica">Nada registrado ainda.</p>';
}
$('#formEmpresa').onsubmit = async e => {
  e.preventDefault(); $('#erroEmpresa').textContent = '';
  try {
    await api('/api/empresa', {method: 'PUT', body: {nome: $('#emNome').value, razao_social: $('#emRazao').value, cnpj: $('#emCnpj').value, porte: $('input[name=emPorte]:checked')?.value, uf: $('#emUf').value, cidade: $('#emCidade').value, feriados_locais: $('#emFer').value}});
    conta = await api('/api/conta'); pintaTopo(); toast('Dados da empresa salvos.');
  } catch (err) { $('#erroEmpresa').textContent = err.message; }
};

// ================= minha conta =================
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

try { const m = sessionStorage.getItem('fechMes'); if (m) { $('#fechMes').value = m; sessionStorage.removeItem('fechMes'); } } catch {}
if (tokenAcesso) telaSenha(); else iniciar();
