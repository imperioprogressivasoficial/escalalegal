// Proteção do site: cabeçalhos de segurança (CSP, anti-iframe, HSTS), bloqueio de copiadores de página
// (HTTrack, Wget e afins), proteção das imagens contra uso em outro domínio, conferência da origem nas
// chamadas da API e o "guarda" que manda de volta para o domínio real uma cópia da página aberta em outro lugar.
//
// O guarda roda no navegador: segura uma cópia ingênua (salvar página, clonador, HTTrack), mas não impede quem
// copiar e editar o HTML à mão. A canonical, a marca d'água e os logs ajudam a provar a autoria.
const crypto = require('crypto');

module.exports = function seguranca({ DOMAIN, APP_URL, PRODUCAO, BLOG_HOST = '', E = process.env }) {
  // ---------- domínios permitidos (o principal, www, o blog e os extras) ----------
  const hostDe = u => { try { return new URL(u).hostname.toLowerCase(); } catch { return ''; } };
  const extras = String(E.DOMINIOS_PERMITIDOS || '').split(/[\s,]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
  const principal = (DOMAIN || hostDe(APP_URL) || '').toLowerCase();
  const PERMITIDOS = [...new Set([principal, hostDe(APP_URL), ...extras, ...extras.map(h => h.startsWith('www.') ? h.slice(4) : 'www.' + h),
    principal && !principal.startsWith('www.') ? 'www.' + principal : '', String(BLOG_HOST).toLowerCase(), 'localhost', '127.0.0.1'].filter(Boolean))];
  const hostPermitido = h => { h = String(h || '').toLowerCase().replace(/:\d+$/, ''); return PERMITIDOS.includes(h); };
  // o guarda só liga com domínio configurado (em desenvolvimento sem DOMAIN fica desligado)
  const GUARDA_LIGADO = !!principal && E.ANTICLONE !== '0';

  // marca d'água: identifica a página original em qualquer cópia
  const MARCA = crypto.createHash('sha256').update('sua-escala-5x2|' + (APP_URL || principal)).digest('hex').slice(0, 20);

  // ---------- guarda anticlone (inline, levemente embaralhado) ----------
  // Os domínios vão codificados (base64 invertido) para um "localizar e trocar" do domínio não desligar o guarda.
  const cod = s => Buffer.from(s).toString('base64').split('').reverse().join('');
  const destino = (APP_URL || `https://${principal}`).replace(/\/$/, '');
  function guarda() {
    if (!GUARDA_LIGADO) return '';
    const lista = PERMITIDOS.map(cod);
    return `<script data-g="${MARCA}">(function(w,d){try{var a=${JSON.stringify(lista)},l=w.location,h=(l.hostname||'').toLowerCase(),o=0,i;`
      + `for(i=0;i<a.length;i++)if(atob(a[i].split('').reverse().join(''))===h)o=1;w.__se5x2=o;if(o&&l.protocol!=='file:')return;`
      + `var q=new URLSearchParams(l.search),k=new URLSearchParams(),c=['ind','src','sck','fbclid','gclid','wbraid','gbraid','ttclid'];`
      + `q.forEach(function(v,n){if(n.indexOf('utm_')===0||c.indexOf(n)>=0)k.set(n,v)});var s=k.toString();`
      + `d.documentElement.style.display='none';l.replace(atob(${JSON.stringify(cod(destino))}.split('').reverse().join(''))+'/'+(s?'?'+s:''))}catch(e){}})(window,document);</script>`;
  }

  // ---------- Content-Security-Policy ----------
  // O que as páginas carregam: Google Fonts, rastreio (Meta Pixel, GA4, GTM, Google Ads) depois do "Aceitar" e o player do vídeo (vturb/ConverteAI).
  const GOOGLE = 'https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.google.com https://www.google.com.br https://*.doubleclick.net https://www.googleadservices.com https://pagead2.googlesyndication.com';
  const META = 'https://connect.facebook.net https://www.facebook.com https://*.facebook.com';
  const VTURB = 'https://scripts.converteai.net https://cdn.converteai.net https://images.converteai.net https://*.converteai.net https://license.vturb.com https://*.vturb.com https://*.vturb.com.br https://*.vturb.net';
  const CSP = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${GOOGLE} ${META} ${VTURB}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    `img-src 'self' data: blob: ${GOOGLE} ${META} ${VTURB}`,
    `connect-src 'self' ${GOOGLE} ${META} ${VTURB}`,
    `media-src 'self' blob: data: ${VTURB}`,
    "worker-src 'self' blob:",
    `frame-src https://www.googletagmanager.com https://www.facebook.com https://td.doubleclick.net ${VTURB}`,
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(PRODUCAO ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
  const CSP_CABECALHO = E.CSP_SO_RELATORIO === '1' ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';

  function cabecalhos(req, res, next) {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'X-Permitted-Cross-Domain-Policies': 'none',
      [CSP_CABECALHO]: CSP,
    });
    if (PRODUCAO) res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
    next();
  }

  // ---------- copiadores de página ----------
  // Buscadores e prévias de link (Googlebot, Bingbot, facebookexternalhit, WhatsApp, Telegram...) continuam liberados.
  // curl fica liberado (testes e conferência do deploy). A API não é afetada.
  const COPIADORES = /httrack|webcopier|web\s?copier|webzip|teleport\s?pro|offline\s?explorer|sitesucker|websucker|webreaper|website\s?extractor|web\s?downloader|webstripper|webwhacker|offline\s?navigator|blackwidow|grab-?site|cyotek|getright|go!zilla|wget|scrapy|python-requests|python-urllib|python-httpx|aiohttp|go-http-client|node-fetch|axios\/|okhttp|libwww-perl|lwp-|java\/|htmlparser|clonador|site-?cloner|pagecloner|copier/i;
  const ROBOTS_BLOQUEADOS = ['HTTrack', 'WebCopier', 'WebZIP', 'Teleport', 'TeleportPro', 'Offline Explorer', 'SiteSucker', 'WebReaper', 'WebStripper', 'Wget', 'Scrapy', 'BlackWidow', 'Cyotek'];
  const ehCopiador = ua => COPIADORES.test(String(ua || ''));
  function bloqueiaCopiadores(req, res, next) {
    if (req.path.startsWith('/api/') || req.path === '/robots.txt') return next();
    if (ehCopiador(req.get('user-agent'))) return res.status(403).type('text/plain').send('Acesso negado.');
    next();
  }

  // ---------- imagens e vídeo usados direto em outro domínio (cópia que aponta para os nossos arquivos) ----------
  const REFERER_OK = /(^|\.)(google|bing|yahoo|duckduckgo|yandex|facebook|instagram|whatsapp|fbcdn|linkedin|twitter|x|pinterest|telegram|outlook|live|office)\.(com|com\.br|net|org|me)$/i;
  const SEMPRE = /^\/img\/(og\.png|icone-[\w-]+\.png|apple-touch-icon\.png|mascote\.svg|favicon[\w.-]*)$/;
  function protegeArquivos(req, res, next) {
    if (!GUARDA_LIGADO || !/^\/(img|video)\//.test(req.path) || SEMPRE.test(req.path)) return next();
    const ref = req.get('referer');
    if (!ref) return next();
    const h = hostDe(ref);
    if (!h || hostPermitido(h) || h === String(req.hostname || '').toLowerCase() || REFERER_OK.test(h)) return next();
    res.status(403).type('text/plain').send('Arquivo da Sua Escala 5x2.');
  }

  // ---------- origem das chamadas que mudam dados ----------
  // Navegador sempre manda Origin em POST/PUT/PATCH/DELETE. Se veio de outro site, recusa (CSRF e formulário clonado).
  // O webhook de pagamento fica de fora (vem do servidor do checkout e tem token).
  function origemDe(req) {
    const o = req.get('origin') || req.get('referer');
    if (!o || o === 'null') return o === 'null' ? false : null;
    const h = hostDe(o);
    if (!h) return false;
    const proprio = [String(req.get('host') || '').toLowerCase().replace(/:\d+$/, ''), String(req.hostname || '').toLowerCase()];
    return hostPermitido(h) || proprio.includes(h);
  }
  function confereOrigem(req, res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || !req.path.startsWith('/api/') || req.path.startsWith('/api/webhook/')) return next();
    if (origemDe(req) === false) return res.status(403).json({ erro: 'Origem não permitida.' });
    next();
  }
  // leads: só do formulário da nossa página (exige Origin ou Referer do nosso domínio)
  function soDaNossaPagina(req, res, next) {
    if (origemDe(req) !== true) return res.status(403).json({ erro: 'Origem não permitida.' });
    next();
  }

  return { PERMITIDOS, hostPermitido, MARCA, guarda, CSP, cabecalhos, bloqueiaCopiadores, protegeArquivos, confereOrigem, soDaNossaPagina, ROBOTS_BLOQUEADOS, ehCopiador };
};
