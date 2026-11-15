// Sua Escala 5x2 — ajuda e atendimento: dúvidas frequentes, assistente de IA e WhatsApp.
// Dois modos, mesmo visual:
//  - app (padrão): botão "Ajuda", base /suporte/faq.js, conversa em /api/suporte/* (logado, usa o x-conta da empresa aberta).
//    Abre por window.abrirSuporte({ categoria }) e pelos endereços #ajuda, #ajuda/<categoria>, #ajuda/assistente.
//  - site (data-modo="site" no <script>): botão "Fale com a gente" para visitantes (vendas, ajuda, obrigado, blog),
//    base /suporte/faq-vendas.js, conversa em /api/atendimento/* (sem login). Abre também por #fale-conosco.
//    Eventos: rastrear('Contact') ao abrir e rastrear('Lead') no WhatsApp (o rastreio.js só envia depois do aceite de cookies).
(function () {
  'use strict';
  if (window.abrirSuporte) return;
  const d = document;
  const SITE = (d.currentScript && d.currentScript.dataset.modo === 'site') || window.SUPORTE_MODO === 'site';
  const M = SITE ? {
    chave: 'sp-site-', faq: '/suporte/faq-vendas.js?v=1', global: 'SuporteFAQVendas', fab: 'Fale com a gente', fabAria: 'Fale com a gente: dúvidas e atendimento',
    tit: 'Fale com a gente', sub: 'Dúvidas sobre a Sua Escala 5x2', titChat: 'Atendimento', busca: 'Busque: preço, garantia, Pix, contador…',
    conversar: 'Conversar com o atendimento', ola: 'Olá! Tire aqui suas dúvidas sobre a Sua Escala 5x2: como funciona, preço, garantia e a nova lei.',
    zapTexto: 'Uma pessoa da nossa equipe responde pelo WhatsApp. A mensagem já vai pronta com a sua dúvida.', zapBotao: 'Falar com uma pessoa no WhatsApp',
    mensagem: '/api/atendimento/mensagem', chamado: '/api/atendimento/chamado', max: 800,
  } : {
    chave: 'sp-', faq: '/suporte/faq.js?v=1', global: 'SuporteFAQ', fab: 'Ajuda', fabAria: 'Ajuda: dúvidas frequentes e suporte',
    tit: 'Ajuda', sub: 'Dúvidas frequentes da Sua Escala 5x2', titChat: 'Assistente', busca: 'Busque: trocar folga, férias, contador…',
    conversar: 'Conversar com o assistente', ola: 'Olá! Sou o assistente da Sua Escala 5x2. Escreva a sua dúvida sobre o app ou a nova lei.',
    zapTexto: 'Uma pessoa do suporte continua o atendimento pelo WhatsApp. A mensagem já vai pronta com o seu nome, a empresa e a dúvida.', zapBotao: 'Falar com o suporte no WhatsApp',
    mensagem: '/api/suporte/mensagem', chamado: '/api/suporte/chamado', max: 1500,
  };
  const rastrear = ev => { try { if (typeof window.rastrear === 'function') window.rastrear(ev); } catch {} };
  const tira = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lerSessao = k => { try { return sessionStorage.getItem(k); } catch { return null; } };
  const gravarSessao = (k, v) => { try { sessionStorage.setItem(k, v); } catch {} };
  const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 12)).replace(/[^\w-]/g, '');

  // ícone do app (o Zé Folga) no botão de ajuda, embutido para funcionar no site, no blog e no app
  const ICONE = 'data:image/webp;base64,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';

  // ---------- estilo (cores e fontes da marca) ----------
  const css = `
.sp-fab{position:fixed;right:18px;bottom:calc(18px + var(--sp-baixo,0px) + env(safe-area-inset-bottom));z-index:70;display:inline-flex;align-items:center;gap:8px;border:0;border-radius:999px;background:#1351b4;color:#fff;font:700 15px/1 'Public Sans',system-ui,sans-serif;padding:12px 18px 12px 12px;box-shadow:0 10px 26px -8px rgba(7,29,65,.55);cursor:pointer;transition:transform .15s ease,background .15s ease}
.sp-fab:hover{background:#0f449a}.sp-fab:active{transform:scale(.97)}
.sp-fab:focus-visible,.sp-p button:focus-visible,.sp-p input:focus-visible,.sp-p textarea:focus-visible,.sp-p a:focus-visible{outline:3px solid #ffcd07;outline-offset:2px}
.sp-fab img{display:block;width:30px;height:30px;border-radius:9px;flex:none}
.sp-fab[hidden],.sp-aberto .sp-fab,body:has(dialog[open]) .sp-fab{display:none}
.sp-fundo{position:fixed;inset:0;z-index:2147483100;background:rgba(7,29,65,.45);opacity:0;transition:opacity .2s ease}
.sp-aberto .sp-fundo{opacity:1}
.sp-p{position:fixed;z-index:2147483101;right:18px;bottom:18px;width:400px;max-width:calc(100vw - 32px);height:min(640px,calc(100vh - 36px));display:flex;flex-direction:column;background:#fff;color:#0c1b33;border-radius:18px;box-shadow:0 30px 70px -20px rgba(2,10,30,.55);font:15px/1.5 'Public Sans',system-ui,sans-serif;overflow:hidden;transform:translateY(12px);opacity:0;transition:transform .22s cubic-bezier(.2,.8,.2,1),opacity .18s ease}
.sp-aberto .sp-p{transform:none;opacity:1}
.sp-topo{display:flex;align-items:center;gap:10px;padding:14px 14px 14px 18px;background:#071d41;color:#fff}
.sp-topo h2{margin:0;font:800 1.15rem/1.1 'Archivo',system-ui,sans-serif;font-stretch:88%;color:#fff;flex:1}
.sp-topo small{display:block;font:500 .8rem/1.3 'Public Sans',system-ui,sans-serif;opacity:.8;margin-top:3px}
.sp-ico{flex:none;display:grid;place-items:center;width:40px;height:40px;border:0;border-radius:12px;background:rgba(255,255,255,.12);color:#fff;font:700 1.35rem/1 system-ui;cursor:pointer}
.sp-ico[hidden]{display:none}
.sp-ico.txt{width:auto;padding:0 12px;font-size:.85rem}
.sp-corpo{flex:1;overflow-y:auto;padding:16px 16px 8px;overscroll-behavior:contain}
.sp-busca{width:100%;box-sizing:border-box;border:1.5px solid #dfe3ea;border-radius:12px;padding:12px 14px;font:inherit;color:#0c1b33;background:#f3f5f8}
.sp-busca:focus{background:#fff;border-color:#1351b4}
.sp-tit{margin:18px 0 8px;font:700 .78rem/1 'Public Sans',system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:#56617a}
.sp-cat{border:1px solid #dfe3ea;border-radius:14px;margin-bottom:8px;overflow:hidden;background:#fff}
.sp-cat>button,.sp-q>button{width:100%;display:flex;align-items:center;gap:10px;text-align:left;border:0;background:none;font:inherit;color:#0c1b33;cursor:pointer;padding:13px 14px}
.sp-cat>button b{display:block;font:700 1rem/1.25 'Public Sans',system-ui,sans-serif}
.sp-cat>button small{display:block;color:#56617a;font-size:.83rem;margin-top:2px}
.sp-cat>button span:first-child{flex:1}
.sp-seta{flex:none;color:#1351b4;font-weight:800;transition:transform .2s ease}
[aria-expanded=true]>.sp-seta{transform:rotate(90deg)}
.sp-lista{border-top:1px solid #eef1f5;background:#fafbfd}
.sp-q{border-bottom:1px solid #eef1f5}.sp-q:last-child{border-bottom:0}
.sp-q>button{padding:11px 14px;font-weight:600;font-size:.95rem}
.sp-q>button span:first-child{flex:1}
.sp-r{padding:0 14px 14px;color:#3d4a5c;font-size:.93rem}
.sp-r p{margin:0 0 10px}
.sp-acoes{display:flex;flex-wrap:wrap;gap:8px}
.sp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:12px;padding:11px 16px;min-height:44px;font:700 .95rem/1.2 'Public Sans',system-ui,sans-serif;cursor:pointer;background:#1351b4;color:#fff;text-decoration:none}
.sp-btn.verde{background:#168821}.sp-btn.sec{background:#fff;color:#0c1b33;border:1.5px solid #dfe3ea}
.sp-btn.cheio{width:100%}
.sp-btn[disabled]{opacity:.6;cursor:default}
.sp-nao{margin:16px 0 8px;padding:16px;border-radius:14px;background:#e8f0fb}
.sp-nao p{margin:0 0 10px;color:#0c1b33;font-weight:600}
.sp-vazio{color:#56617a;margin:14px 2px}
.sp-chat{display:flex;flex-direction:column;gap:10px}
.sp-m{max-width:86%;padding:10px 13px;border-radius:16px;white-space:pre-wrap;word-wrap:break-word;font-size:.95rem}
.sp-m.cli{align-self:flex-end;background:#1351b4;color:#fff;border-bottom-right-radius:5px}
.sp-m.ass{align-self:flex-start;background:#f3f5f8;color:#0c1b33;border-bottom-left-radius:5px}
.sp-m.aviso{align-self:stretch;max-width:none;background:#fff5c2;color:#5a4500}
.sp-dig{align-self:flex-start;display:flex;gap:5px;padding:14px 16px;border-radius:16px;background:#f3f5f8}
.sp-dig i{width:7px;height:7px;border-radius:50%;background:#56617a;animation:spPisca 1s infinite ease-in-out}
.sp-dig i:nth-child(2){animation-delay:.15s}.sp-dig i:nth-child(3){animation-delay:.3s}
@keyframes spPisca{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
.sp-zap{margin-top:6px;padding:14px;border:1.5px solid #168821;border-radius:14px;background:#e3f5e1}
.sp-zap p{margin:0 0 10px;font-size:.92rem;color:#0c1b33}
.sp-pe{border-top:1px solid #dfe3ea;padding:10px 12px calc(10px + env(safe-area-inset-bottom));display:flex;gap:8px;align-items:flex-end;background:#fff}
.sp-pe textarea{flex:1;resize:none;border:1.5px solid #dfe3ea;border-radius:12px;padding:11px 12px;font:inherit;max-height:120px;min-height:44px;box-sizing:border-box}
.sp-pe textarea:focus{border-color:#1351b4;outline:0}
.sp-link{background:none;border:0;padding:6px 0;color:#1351b4;font:700 .88rem/1.2 'Public Sans',system-ui,sans-serif;cursor:pointer;text-decoration:underline}
.sp-hp{position:absolute!important;left:-9999px;width:1px;height:1px;opacity:0}
.sp-cta{margin-top:4px}
.sp-topo-acoes{display:flex;flex-direction:column;align-items:center;gap:2px;margin-bottom:12px}
.sp-topo-acoes .sp-link{font-size:.85rem}
.sp-nao .sp-link{display:block;margin:10px auto 0}
.sp-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media(max-width:640px){
  .sp-fab{padding:0;width:52px;height:52px;justify-content:center;right:14px;bottom:calc(14px + var(--sp-baixo,0px) + env(safe-area-inset-bottom))}
  .sp-fab{background:transparent;width:58px;height:58px;border-radius:17px}.sp-fab:hover{background:transparent}
  .sp-fab img{width:58px;height:58px;border-radius:17px}
  .sp-fab span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
  body.modo-foco .sp-fab{bottom:calc(96px + var(--sp-baixo,0px) + env(safe-area-inset-bottom))}
  .sp-p{left:0;right:0;bottom:0;width:auto;max-width:none;height:min(88vh,calc(100dvh - 40px));border-radius:22px 22px 0 0;transform:translateY(40px)}
  .sp-topo{padding-top:16px}
  .sp-topo small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sp-corpo{padding:12px 14px 8px}
  .sp-tit{margin-top:12px}
  .sp-topo::before{content:"";position:absolute;left:50%;top:6px;width:40px;height:4px;margin-left:-20px;border-radius:4px;background:rgba(255,255,255,.35)}
}
@media(prefers-reduced-motion:reduce){.sp-p,.sp-fundo,.sp-fab,.sp-seta{transition:none}.sp-dig i{animation:none}}
`;

  // celular/toque: nada de foco automático em campo de texto (o teclado pularia na frente da tela)
  const TOQUE = (window.matchMedia && matchMedia('(pointer:coarse)').matches) || window.innerWidth <= 640;
  const focaCampo = el => { if (el && !TOQUE) el.focus({ preventScroll: true }); };

  // ---------- estado ----------
  let FAQ = null, carregando = null, painel = null, anterior = null;
  let tela = 'faq', abertaCat = null, abertaQ = null, busca = '';
  let conversaId = lerSessao(M.chave + 'conversa') || novoId();
  let msgs = []; try { msgs = JSON.parse(lerSessao(M.chave + 'msgs') || '[]'); } catch { msgs = []; }
  let ocupado = false, mostrarZap = false, resumoAtual = '', contou = false;
  const salvaConversa = () => { gravarSessao(M.chave + 'conversa', conversaId); gravarSessao(M.chave + 'msgs', JSON.stringify(msgs.slice(-30))); };

  function carregaFaq() {
    if (FAQ) return Promise.resolve(FAQ);
    if (window[M.global]) return Promise.resolve(FAQ = window[M.global]);
    return carregando || (carregando = new Promise((ok, falha) => {
      const s = d.createElement('script'); s.src = M.faq; s.async = true;
      s.onload = () => ok(FAQ = window[M.global]); s.onerror = () => { carregando = null; falha(new Error('Não foi possível carregar a ajuda.')); };
      d.head.appendChild(s);
    }));
  }
  const contaAtual = () => {
    if (SITE) return '';
    try { if (typeof conta !== 'undefined' && conta && conta.id) return conta.id; } catch {}
    try { return localStorage.getItem('conta') || ''; } catch { return ''; }
  };
  async function api(url, corpo) {
    const h = { 'Content-Type': 'application/json' }, c = contaAtual();
    if (c) h['x-conta'] = c;
    const r = await fetch(url, { method: corpo ? 'POST' : 'GET', headers: h, body: corpo ? JSON.stringify(corpo) : undefined, credentials: 'same-origin' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.erro || 'Não foi possível falar com o suporte agora.'); e.status = r.status; e.dados = j; throw e; }
    return j;
  }
  const telaAtual = () => (location.hash.slice(1) || (location.pathname.startsWith('/app') ? 'inicio' : location.pathname.replace(/^\//, ''))).slice(0, 60);
  const naApp = () => location.pathname === '/app' || location.pathname.startsWith('/app/');
  function irPara(rota) {
    fechar();
    if (naApp()) { if (location.hash === '#' + rota) window.dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = rota; }
    else location.href = '/app#' + rota;
  }

  // site: endereço no domínio principal (do blog vai para o site), mantendo utm, ind e os ids de clique da página
  const PARAMS = /^(utm_\w+|ind|src|sck|fbclid|gclid|wbraid|gbraid|ttclid)$/;
  function linkSite(caminho) {
    const h = location.hostname, base = /^blog\./.test(h) ? `${location.protocol}//${h.slice(5)}${location.port ? ':' + location.port : ''}` : location.origin;
    const u = new URL(caminho, base);
    new URLSearchParams(location.search).forEach((v, k) => { if (PARAMS.test(k) && !u.searchParams.has(k)) u.searchParams.set(k, v); });
    return u.href;
  }
  const isca = () => painel?.p.querySelector('.sp-hp')?.value || '';

  // ---------- montar o botão e o painel ----------
  function monta() {
    if (d.getElementById('sp-estilo')) return;
    const st = d.createElement('style'); st.id = 'sp-estilo'; st.textContent = css; d.head.appendChild(st);
    const fab = d.createElement('button');
    fab.type = 'button'; fab.className = 'sp-fab'; fab.id = 'spFab';
    fab.setAttribute('aria-haspopup', 'dialog'); fab.setAttribute('aria-controls', 'spPainel');
    fab.innerHTML = `<img src="${ICONE}" alt="" width="30" height="30"><span>${M.fab}</span>`;
    fab.setAttribute('aria-label', M.fabAria);
    fab.onclick = () => abrir();
    d.body.appendChild(fab);
    // o aviso de cookies e a barra fixa de compra (#fixo, página de vendas no celular) ficam embaixo: o botão sobe junto
    const vigiados = new Set();
    const ro = window.ResizeObserver ? new ResizeObserver(() => ajustaBaixo()) : null;
    const mo = new MutationObserver(() => ajustaBaixo());
    let pedido = 0;
    const ajustaBaixo = () => {
      let alto = 0;
      for (const el of [d.getElementById('avisoCookies'), d.getElementById('fixo')]) {
        if (!el) continue;
        if (!vigiados.has(el)) { vigiados.add(el); ro?.observe(el); mo.observe(el, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] }); el.addEventListener('transitionend', () => ajustaBaixo()); }
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (r.height && r.right > innerWidth - 90 && r.top < innerHeight) alto = Math.max(alto, innerHeight - r.top); // só conta o que passa por baixo do botão
      }
      d.documentElement.style.setProperty('--sp-baixo', alto ? alto + 'px' : '0px');
    };
    ajustaBaixo();
    new MutationObserver(ajustaBaixo).observe(d.body, { childList: true });
    addEventListener('resize', ajustaBaixo);
    addEventListener('scroll', () => { cancelAnimationFrame(pedido); pedido = requestAnimationFrame(ajustaBaixo); }, { passive: true });
  }

  function criaPainel() {
    const fundo = d.createElement('div'); fundo.className = 'sp-fundo'; fundo.onclick = () => fechar();
    const p = d.createElement('div');
    p.className = 'sp-p'; p.id = 'spPainel';
    p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); p.setAttribute('aria-labelledby', 'spTit');
    p.innerHTML = `<div class="sp-topo"><button type="button" class="sp-ico" id="spVoltar" aria-label="Voltar às dúvidas frequentes" hidden>‹</button>
      <h2 id="spTit">${M.tit}<small id="spSub">${M.sub}</small></h2>
      <button type="button" class="sp-ico txt" id="spNova" hidden>Nova conversa</button>
      <button type="button" class="sp-ico" id="spFechar" aria-label="Fechar">×</button></div>
      <div class="sp-corpo" id="spCorpo"></div><div id="spPe"></div><div class="sp-sr" aria-live="polite" id="spVivo"></div>`;
    d.body.append(fundo, p);
    p.querySelector('#spFechar').onclick = () => fechar();
    p.querySelector('#spVoltar').onclick = () => { tela = 'faq'; desenha(); focaCampo(p.querySelector('.sp-busca')); };
    p.querySelector('#spNova').onclick = () => { conversaId = novoId(); msgs = []; mostrarZap = false; resumoAtual = ''; salvaConversa(); desenha(); };
    p.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); fechar(); }
      if (e.key === 'Tab') { // foco preso no painel
        const f = [...p.querySelectorAll('button:not([hidden]):not([disabled]),a[href],input,textarea')].filter(x => x.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && d.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && d.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    painel = { fundo, p };
  }

  async function abrir(op = {}) {
    monta();
    if (!painel) criaPainel();
    anterior = d.activeElement;
    if (op.categoria) { abertaCat = op.categoria; tela = 'faq'; busca = ''; }
    if (op.conversa) tela = 'chat';
    if (SITE && !contou) { contou = true; rastrear('Contact'); }
    d.documentElement.classList.add('sp-aberto');
    painel.fundo.hidden = painel.p.hidden = false;
    requestAnimationFrame(() => d.body.classList.add('sp-aberto'));
    try { await carregaFaq(); } catch (e) { painel.p.querySelector('#spCorpo').innerHTML = `<p class="sp-vazio">${esc(e.message)}</p>`; return; }
    desenha();
    const campo = tela === 'chat' ? painel.p.querySelector('textarea') : (op.categoria ? null : painel.p.querySelector('.sp-busca'));
    const cat = op.categoria ? painel.p.querySelector(`[data-cat="${CSS.escape(op.categoria)}"]`) : null;
    if (campo && !TOQUE) campo.focus({ preventScroll: true }); else (cat || painel.p.querySelector('#spFechar')).focus({ preventScroll: true });
  }
  function fechar() {
    if (!painel || painel.p.hidden) return;
    d.body.classList.remove('sp-aberto'); d.documentElement.classList.remove('sp-aberto');
    painel.fundo.hidden = painel.p.hidden = true;
    if (anterior && anterior.focus && d.contains(anterior)) anterior.focus({ preventScroll: true });
    else d.getElementById('spFab')?.focus({ preventScroll: true });
  }

  // ---------- dúvidas frequentes ----------
  function htmlPergunta(q) {
    const aberta = abertaQ === q.id;
    return `<div class="sp-q"><button type="button" data-q="${esc(q.id)}" aria-expanded="${aberta}" aria-controls="spr-${esc(q.id)}"><span>${esc(q.p)}</span><span class="sp-seta" aria-hidden="true">›</span></button>
      ${aberta ? `<div class="sp-r" id="spr-${esc(q.id)}"><p>${esc(q.r)}</p><div class="sp-acoes">${SITE
        ? `<a class="sp-btn" href="${esc(linkSite(q.ir))}" data-link>${esc(q.botao)}</a>`
        : `<button type="button" class="sp-btn" data-ir="${esc(q.ir)}">Ir para a tela: ${esc(q.botao)}</button>`}</div></div>` : ''}</div>`;
  }
  function desenhaFaq() {
    const corpo = painel.p.querySelector('#spCorpo');
    const achados = busca.trim() ? FAQ.buscar(busca) : null;
    let h = `<div class="sp-topo-acoes"><button type="button" class="sp-btn cheio" id="spConversar">${M.conversar}</button>${SITE ? `<button type="button" class="sp-link" id="spZapDireto">${M.zapBotao}</button>` : ''}</div>`;
    h += `<label class="sp-sr" for="spBusca">Buscar nas dúvidas frequentes</label><input id="spBusca" class="sp-busca" type="search" placeholder="${M.busca}" value="${esc(busca)}" autocomplete="off" enterkeyhint="search">`;
    if (achados) {
      h += `<p class="sp-tit">${achados.length ? 'Resultados' : 'Nada encontrado'}</p>`;
      h += achados.length ? `<div class="sp-cat"><div class="sp-lista" style="border:0">${achados.map(htmlPergunta).join('')}</div></div>` : `<p class="sp-vazio">Não achamos essa dúvida na lista. ${SITE ? 'O atendimento' : 'O assistente'} pode ajudar.</p>`;
    } else {
      h += '<p class="sp-tit">Dúvidas frequentes</p>' + FAQ.CATEGORIAS.map(c => {
        const ab = abertaCat === c.id;
        return `<div class="sp-cat"><button type="button" data-cat="${esc(c.id)}" aria-expanded="${ab}" aria-controls="spc-${esc(c.id)}"><span><b>${esc(c.nome)}</b><small>${esc(c.resumo)}</small></span><span class="sp-seta" aria-hidden="true">›</span></button>
          ${ab ? `<div class="sp-lista" id="spc-${esc(c.id)}">${c.perguntas.map(htmlPergunta).join('')}</div>` : ''}</div>`;
      }).join('');
    }
    corpo.innerHTML = h;
    const inp = corpo.querySelector('#spBusca');
    inp.oninput = () => { busca = inp.value; abertaQ = null; const pos = inp.selectionStart; desenhaFaq(); const n = painel.p.querySelector('#spBusca'); n.focus(); n.setSelectionRange(pos, pos); };
    corpo.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { abertaCat = abertaCat === b.dataset.cat ? null : b.dataset.cat; abertaQ = null; desenhaFaq(); painel.p.querySelector(`[data-cat="${CSS.escape(b.dataset.cat)}"]`).focus(); });
    corpo.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { abertaQ = abertaQ === b.dataset.q ? null : b.dataset.q; desenhaFaq(); painel.p.querySelector(`[data-q="${CSS.escape(b.dataset.q)}"]`).focus(); });
    corpo.querySelectorAll('[data-ir]').forEach(b => b.onclick = e => { e.stopPropagation(); irPara(b.dataset.ir); });
    corpo.querySelectorAll('[data-link]').forEach(a => a.addEventListener('click', () => fechar()));
    corpo.querySelector('#spZapDireto')?.addEventListener('click', () => abreZap());
    corpo.querySelector('#spConversar').onclick = () => {
      tela = 'chat';
      if (!msgs.length && busca.trim()) painel.rascunho = busca.trim();
      desenha(); focaCampo(painel.p.querySelector('textarea'));
    };
  }

  // ---------- conversa com o assistente ----------
  function desenhaChat() {
    const corpo = painel.p.querySelector('#spCorpo');
    const inicio = `<div class="sp-m ass">${esc(M.ola)}</div>`;
    const cta = SITE && msgs.some(m => m.de === 'assistente') && !ocupado ? `<a class="sp-btn cheio sp-cta" href="${esc(linkSite('/#preco'))}" data-link>Quero a Sua Escala 5x2 · R$ 97</a>` : '';
    corpo.innerHTML = `<div class="sp-chat" id="spChat" role="log" aria-label="Conversa com o assistente">${inicio}${msgs.map(m => `<div class="sp-m ${m.de === 'cliente' ? 'cli' : m.aviso ? 'aviso' : 'ass'}">${esc(m.texto)}</div>`).join('')}
      ${ocupado ? '<div class="sp-dig" aria-hidden="true"><i></i><i></i><i></i></div>' : ''}
      ${cta}
      ${mostrarZap ? `<div class="sp-zap"><p>${esc(M.zapTexto)}</p><button type="button" class="sp-btn verde cheio" id="spZap">${esc(M.zapBotao)}</button></div>` : ''}
      ${!mostrarZap && !ocupado && msgs.length ? '<button type="button" class="sp-link" id="spPessoa">Prefiro falar com uma pessoa</button>' : ''}</div>`;
    const pe = painel.p.querySelector('#spPe');
    if (!pe.firstChild) {
      pe.innerHTML = `<form class="sp-pe" id="spForm"><label class="sp-sr" for="spTexto">Sua mensagem</label><textarea id="spTexto" rows="1" maxlength="${M.max}" placeholder="Escreva a sua dúvida" enterkeyhint="send"></textarea>${SITE ? '<input class="sp-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' : ''}<button class="sp-btn" id="spEnviar">Enviar</button></form>`;
      const ta = pe.querySelector('textarea');
      if (painel.rascunho) { ta.value = painel.rascunho; painel.rascunho = ''; }
      ta.oninput = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; };
      ta.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); pe.querySelector('form').requestSubmit(); } };
      pe.querySelector('form').onsubmit = e => { e.preventDefault(); enviar(ta.value); };
    }
    pe.querySelector('#spEnviar').disabled = ocupado;
    corpo.querySelector('#spZap')?.addEventListener('click', abreZap);
    corpo.querySelectorAll('[data-link]').forEach(a => a.addEventListener('click', () => fechar()));
    corpo.querySelector('#spPessoa')?.addEventListener('click', () => { mostrarZap = true; desenha(); painel.p.querySelector('#spZap')?.focus(); });
    corpo.scrollTop = corpo.scrollHeight;
  }
  const vivo = t => { const v = painel.p.querySelector('#spVivo'); v.textContent = ''; setTimeout(() => { v.textContent = t; }, 50); };

  async function enviar(texto) {
    texto = String(texto || '').trim();
    if (!texto || ocupado) return;
    const ta = painel.p.querySelector('#spTexto'); ta.value = ''; ta.style.height = '';
    const historico = msgs.filter(m => !m.aviso).slice(-12).map(m => ({ de: m.de, texto: m.texto }));
    msgs.push({ de: 'cliente', texto }); ocupado = true; salvaConversa(); desenha(); vivo('O assistente está escrevendo.');
    try {
      const r = await api(M.mensagem, SITE ? { conversa_id: conversaId, mensagem: texto, historico, pagina: location.pathname, website: isca() }
        : { conversa_id: conversaId, mensagem: texto, historico, tela: telaAtual() });
      msgs.push({ de: 'assistente', texto: r.resposta });
      if (r.escalar) { mostrarZap = true; resumoAtual = r.resumo || texto; }
      vivo(r.resposta);
    } catch (e) {
      const txt = !SITE && e.status === 401 ? 'Entre na sua conta para conversar com o assistente. Se não consegue entrar, fale com o suporte no WhatsApp.' : e.message;
      msgs.push({ de: 'assistente', texto: txt, aviso: true }); mostrarZap = true; vivo(txt);
    }
    ocupado = false; salvaConversa(); desenha();
    if (!mostrarZap) painel.p.querySelector('#spTexto')?.focus();
  }

  async function abreZap() {
    const b = painel.p.querySelector('#spZap'); if (b) { b.disabled = true; b.textContent = 'Abrindo o WhatsApp…'; }
    // abre a janela já no clique (bloqueio de pop-up) e coloca o endereço quando o servidor responder
    const jan = window.open('', '_blank');
    if (SITE) rastrear('Lead');
    let link = '';
    try {
      const historico = msgs.filter(m => !m.aviso).map(m => ({ de: m.de, texto: m.texto }));
      link = (await api(M.chamado, SITE ? { conversa_id: conversaId, historico, resumo: resumoAtual, pagina: location.pathname, website: isca() }
        : { conversa_id: conversaId, historico, resumo: resumoAtual, tela: telaAtual() })).link;
    } catch {
      try { link = (await api('/api/suporte/contato')).link; } catch {}
    }
    if (link && jan) { try { jan.opener = null; } catch {} jan.location.href = link; }
    else if (link) location.href = link;
    else if (jan) jan.close();
    if (b) { b.disabled = false; b.textContent = M.zapBotao; }
  }

  function desenha() {
    const p = painel.p, chat = tela === 'chat';
    p.querySelector('#spVoltar').hidden = !chat;
    p.querySelector('#spNova').hidden = !chat || !msgs.length;
    p.querySelector('#spTit').firstChild.textContent = chat ? M.titChat : M.tit;
    p.querySelector('#spSub').textContent = chat ? 'Responde na hora. Se precisar, chama uma pessoa.' : M.sub;
    if (!chat) p.querySelector('#spPe').innerHTML = '';
    chat ? desenhaChat() : desenhaFaq();
  }

  // ---------- abrir por endereço (#ajuda ou #ajuda/categoria) ----------
  // o app troca rota desconhecida por #inicio no mesmo evento: lê o endereço do próprio evento (newURL)
  function peloEndereco(e) {
    const hash = e && e.newURL ? new URL(e.newURL).hash : location.hash;
    const m = SITE ? /^#(?:fale-conosco|atendimento)(?:\/([\w-]+))?$/.exec(hash) : /^#ajuda(?:\/([\w-]+))?$/.exec(hash);
    if (!m) return;
    abrir(m[1] === 'assistente' ? { conversa: true } : m[1] ? { categoria: m[1] } : {});
  }
  const hashInicial = location.hash;
  window.abrirSuporte = op => abrir(op || {});
  window.fecharSuporte = fechar;
  addEventListener('hashchange', peloEndereco);
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', () => { monta(); peloEndereco({ newURL: location.href.split('#')[0] + hashInicial }); });
  else { monta(); peloEndereco(); }
})();
