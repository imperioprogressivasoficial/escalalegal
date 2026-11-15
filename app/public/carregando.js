// Carregando com o Zé Folga: abre o app dando tchau e corre enquanto o app busca dados.
// Window.Carregando.svg('tchau'|'correndo') devolve o desenho; Carregando.inicio/fim controlam a tela de abertura.
(function () {
  var AZUL = '#1351b4', ESC = '#071d41', VERDE = '#168821', AMAR = '#ffcd07';
  function ze(modo) {
    var correndo = modo === 'correndo';
    var bracos = correndo
      ? '<g class="zc-bd"><path d="M40 120 C24 130 18 146 22 160" fill="none" stroke="' + ESC + '" stroke-width="13" stroke-linecap="round"/><circle cx="22" cy="164" r="11" fill="#fff" stroke="' + ESC + '" stroke-width="5"/></g>'
      + '<g class="zc-be"><path d="M180 120 C196 110 204 94 200 80" fill="none" stroke="' + ESC + '" stroke-width="13" stroke-linecap="round"/><circle cx="199" cy="75" r="11" fill="#fff" stroke="' + ESC + '" stroke-width="5"/></g>'
      : '<g class="zc-aceno"><path d="M40 120 C22 104 18 82 24 66" fill="none" stroke="' + ESC + '" stroke-width="13" stroke-linecap="round"/><circle cx="25" cy="60" r="12" fill="#fff" stroke="' + ESC + '" stroke-width="5"/></g>'
      + '<path d="M180 128 C196 136 204 150 202 164" fill="none" stroke="' + ESC + '" stroke-width="13" stroke-linecap="round"/><circle cx="202" cy="168" r="11" fill="#fff" stroke="' + ESC + '" stroke-width="5"/>';
    var pernas = correndo
      ? '<g class="zc-pe"><rect x="80" y="200" width="16" height="40" rx="8" fill="' + ESC + '"/><rect x="70" y="230" width="32" height="12" rx="6" fill="#0c1b33"/></g>'
      + '<g class="zc-pd"><rect x="124" y="200" width="16" height="40" rx="8" fill="' + ESC + '"/><rect x="118" y="230" width="32" height="12" rx="6" fill="#0c1b33"/></g>'
      : '<rect x="80" y="206" width="16" height="36" rx="8" fill="' + ESC + '"/><rect x="124" y="206" width="16" height="36" rx="8" fill="' + ESC + '"/>'
      + '<rect x="70" y="232" width="32" height="12" rx="6" fill="#0c1b33"/><rect x="118" y="232" width="32" height="12" rx="6" fill="#0c1b33"/>';
    var vento = correndo ? '<g class="zc-vento" stroke="' + AZUL + '" stroke-width="6" stroke-linecap="round" opacity=".55"><path d="M2 96h18"/><path d="M-6 128h22"/><path d="M4 160h14"/></g>' : '';
    return '<svg class="ze-anim ze-' + (correndo ? 'correndo' : 'tchau') + '" viewBox="-12 14 236 246" aria-hidden="true">'
      + '<ellipse class="zc-sombra" cx="110" cy="250" rx="58" ry="7" fill="' + ESC + '" opacity=".14"/>'
      + vento + '<g class="zc-corpo">' + pernas + bracos
      + '<rect x="34" y="40" width="152" height="176" rx="24" fill="#fff" stroke="' + ESC + '" stroke-width="6"/>'
      + '<path d="M34 64a24 24 0 0 1 24-24h104a24 24 0 0 1 24 24v18H34z" fill="' + AZUL + '" stroke="' + ESC + '" stroke-width="6" stroke-linejoin="round"/>'
      + '<rect x="70" y="24" width="12" height="32" rx="6" fill="' + ESC + '"/><rect x="138" y="24" width="12" height="32" rx="6" fill="' + ESC + '"/>'
      + '<text x="110" y="72" text-anchor="middle" font-family="Archivo,Arial,sans-serif" font-weight="800" font-size="17" fill="#fff" letter-spacing="1">5x2</text>'
      + '<g class="zc-olhos"><ellipse cx="86" cy="112" rx="9" ry="11" fill="' + ESC + '"/><ellipse cx="134" cy="112" rx="9" ry="11" fill="' + ESC + '"/>'
      + '<circle cx="89" cy="108" r="3" fill="#fff"/><circle cx="137" cy="108" r="3" fill="#fff"/></g>'
      + '<rect x="58" y="126" width="22" height="14" rx="5" fill="' + AMAR + '"/><rect x="140" y="126" width="22" height="14" rx="5" fill="' + AMAR + '"/>'
      + '<path d="M94 136 Q110 152 126 136" fill="none" stroke="' + ESC + '" stroke-width="5" stroke-linecap="round"/>'
      + '<path d="M86 168 L110 180 L134 168" fill="none" stroke="' + ESC + '" stroke-width="5" stroke-linejoin="round"/>'
      + '<path d="M110 180 L101 190 L106 214 L110 220 L114 214 L119 190 Z" fill="' + VERDE + '" stroke="' + ESC + '" stroke-width="4" stroke-linejoin="round"/>'
      + '</g></svg>';
  }

  var css = ''
    + '.ze-anim{display:block;overflow:visible}'
    + '.ze-anim *{transform-box:fill-box}'
    + '.ze-tchau .zc-corpo{animation:zcPula 1.6s ease-in-out infinite;transform-origin:50% 100%}'
    + '.ze-tchau .zc-aceno{animation:zcAceno .55s ease-in-out infinite alternate;transform-origin:100% 100%}'
    + '.ze-tchau .zc-olhos{animation:zcPisca 3.2s infinite;transform-origin:50% 50%}'
    + '.ze-correndo .zc-corpo{animation:zcTrote .36s ease-in-out infinite alternate;transform-origin:50% 100%}'
    + '.ze-correndo .zc-pe{animation:zcPerna .36s ease-in-out infinite alternate;transform-origin:50% 0}'
    + '.ze-correndo .zc-pd{animation:zcPerna .36s ease-in-out infinite alternate-reverse;transform-origin:50% 0}'
    + '.ze-correndo .zc-bd{animation:zcBraco .36s ease-in-out infinite alternate;transform-origin:100% 0}'
    + '.ze-correndo .zc-be{animation:zcBraco .36s ease-in-out infinite alternate-reverse;transform-origin:0 100%}'
    + '.ze-correndo .zc-vento{animation:zcVento .5s linear infinite}'
    + '.ze-correndo .zc-sombra{animation:zcSombra .36s ease-in-out infinite alternate;transform-origin:50% 50%}'
    + '@keyframes zcPula{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}'
    + '@keyframes zcAceno{from{transform:rotate(-38deg)}to{transform:rotate(4deg)}}'
    + '@keyframes zcPisca{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}'
    + '@keyframes zcTrote{from{transform:translateY(0) rotate(4deg)}to{transform:translateY(-10px) rotate(7deg)}}'
    + '@keyframes zcPerna{from{transform:rotate(-28deg)}to{transform:rotate(28deg)}}'
    + '@keyframes zcBraco{from{transform:rotate(-30deg)}to{transform:rotate(30deg)}}'
    + '@keyframes zcVento{from{transform:translateX(10px);opacity:.7}to{transform:translateX(-14px);opacity:0}}'
    + '@keyframes zcSombra{from{transform:scaleX(1)}to{transform:scaleX(.8)}}'
    // abertura do app
    + '#zeAbertura{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#fff;transition:opacity .35s}'
    + '#zeAbertura .ze-anim{width:120px;height:auto}'
    + '#zeAbertura p{margin:0;font:700 17px Archivo,Arial,sans-serif;color:' + ESC + '}'
    + '#zeAbertura.some{opacity:0;pointer-events:none}'
    + '[data-tema="escuro"] #zeAbertura{background:#0b1220}[data-tema="escuro"] #zeAbertura p{color:#e8eef8}'
    + '@media(prefers-color-scheme:dark){[data-tema="auto"] #zeAbertura{background:#0b1220}[data-tema="auto"] #zeAbertura p{color:#e8eef8}}'
    // espera de dados: pílula com o Zé correndo
    + '#zeEspera{position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom));z-index:9998;display:flex;align-items:center;gap:10px;'
    + 'padding:8px 16px 8px 10px;border-radius:999px;background:#fff;box-shadow:0 6px 24px rgba(7,29,65,.18);border:1px solid #dfe3ea;'
    + 'font:600 14px "Public Sans",Arial,sans-serif;color:' + ESC + ';transform:translate(-50%,20px);opacity:0;transition:.25s;pointer-events:none}'
    + '#zeEspera.on{transform:translate(-50%,0);opacity:1}'
    + '#zeEspera .ze-anim{width:34px;height:auto}'
    + '[data-tema="escuro"] #zeEspera{background:#16213a;color:#e8eef8;border-color:#2a3a5c}'
    + '@media(prefers-reduced-motion:reduce){.ze-anim *{animation:none!important}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var pendentes = 0;
  // abertura: o Zé dá tchau enquanto o app carrega
  var abertura = document.getElementById('zeAbertura');
  var inicioAb = Date.now();
  function fim() {
    if (!abertura) return;
    var el = abertura; abertura = null;
    setTimeout(function () { el.classList.add('some'); setTimeout(function () { el.remove(); }, 400); }, Math.max(0, 700 - (Date.now() - inicioAb)));
  }
  if (abertura) {
    abertura.innerHTML = ze('tchau') + '<p>Oi! Já estou abrindo…</p>';
    // some quando a primeira tela aparece (ou no máximo em 8 s)
    // pronto = tela de entrada à vista, ou o app à vista sem nenhuma busca pendente
    var pronto = function () { return document.querySelector('#telaEntrada:not(.hide)') || (document.querySelector('#telaApp:not(.hide)') && pendentes === 0); };
    window.__zePronto = function () { if (abertura && pronto()) fim(); };
    var obs = new MutationObserver(function () { if (pronto()) { obs.disconnect(); fim(); } });
    obs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class', 'hidden'], childList: true });
    window.addEventListener('load', function () { setTimeout(function () { if (pronto()) fim(); }, 300); });
    setTimeout(fim, 8000);
  }

  // espera: se uma busca na API demora mais de 0,5 s, aparece o Zé correndo
  var timer = null, pilula = null;
  function mostra() {
    if (!pilula) { pilula = document.createElement('div'); pilula.id = 'zeEspera'; pilula.setAttribute('role', 'status'); pilula.innerHTML = ze('correndo') + '<span>Só um instante…</span>'; document.body.appendChild(pilula); }
    requestAnimationFrame(function () { pilula.classList.add('on'); });
  }
  function esconde() { clearTimeout(timer); timer = null; if (pilula) pilula.classList.remove('on'); }
  var fetchOriginal = window.fetch;
  window.fetch = function (url, opts) {
    var u = typeof url === 'string' ? url : (url && url.url) || '';
    var conta = /^\/api\//.test(u) && !/\/api\/(evento|suporte|notificacoes|atendimento)/.test(u);
    if (!conta) return fetchOriginal.apply(this, arguments);
    pendentes++; if (!timer && !abertura) timer = setTimeout(mostra, 500);
    var acaba = function () { if (--pendentes <= 0) { pendentes = 0; esconde(); if (window.__zePronto) setTimeout(window.__zePronto, 120); } };
    return fetchOriginal.apply(this, arguments).then(function (r) { acaba(); return r; }, function (e) { acaba(); throw e; });
  };

  window.Carregando = { svg: ze, fim: fim };
})();
