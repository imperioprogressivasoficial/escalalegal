// Sua Escala 5x2 — o site público: metas de busca e compartilhamento, robots.txt, sitemap.xml, llms.txt,
// rastreio (Meta Pixel, Google Analytics 4, Google Tag Manager) com aviso de cookies (LGPD), página 404
// e a compra enviada direto do servidor para a Meta (API de Conversões), que não depende do navegador.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = function site({ app, APP_URL, BLOG_URL = '', PRODUCAO, seg, q, limite }) {
  const E = process.env;
  const PIXEL = /^\d+$/.test(E.META_PIXEL_ID || '') ? E.META_PIXEL_ID : '';
  const GA = /^G-[A-Z0-9]+$/i.test(E.GA_ID || '') ? E.GA_ID : '';
  const GTM = /^GTM-[A-Z0-9]+$/i.test(E.GTM_ID || '') ? E.GTM_ID : '';
  // Google Ads: conversão "gerou a escala" no gerador grátis do blog e "foi para o site pago" (rótulo próprio ou o mesmo)
  // a escolha dos cookies vale para o domínio principal e todos os subdomínios (www, blog): cookie em .DOMAIN
  const DOM_COOKIE = (() => { try { return new URL(APP_URL).hostname.replace(/^www\./, ''); } catch { return ''; } })();
  const AW = /^AW-\d+$/i.test(E.GOOGLE_ADS_ID || '') ? E.GOOGLE_ADS_ID : '';
  const rotulo = v => /^[\w-]{4,40}$/.test(v || '') ? v : '';
  const AW_GEROU = AW ? rotulo(E.GOOGLE_ADS_CONVERSAO) : '';
  const AW_CLIQUE = AW ? (rotulo(E.GOOGLE_ADS_CONVERSAO_CLIQUE) || AW_GEROU) : '';
  // token da API de Conversões: vem do .env ou do /admin (tabela config); guardado em cache por 1 minuto
  let capiCache = { t: '', em: 0 };
  async function tokenMeta() {
    if (!PIXEL) return '';
    if (E.META_CAPI_TOKEN) return E.META_CAPI_TOKEN;
    if (!q) return '';
    if (Date.now() - capiCache.em < 60000) return capiCache.t;
    try { const { rows } = await q("select valor from config where chave='meta_capi_token'"); capiCache = { t: rows[0]?.valor || '', em: Date.now() }; }
    catch { capiCache = { t: '', em: Date.now() }; }
    return capiCache.t;
  }
  const limpaCacheMeta = () => { capiCache = { t: '', em: 0 }; };
  const CAPI = PIXEL; // o navegador sempre manda o evento também para o servidor; o servidor só repassa se houver token
  const PRECO = +String(E.PRECO || '97').replace(',', '.') || 97;
  const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const zap = String(E.SUPORTE_WHATSAPP || '').replace(/\D/g, '');

  // dados da empresa no rodapé e nas políticas (preencha no .env)
  const empresa = {
    nome: E.EMPRESA_RAZAO_SOCIAL || 'Sua Escala 5x2',
    cnpj: E.EMPRESA_CNPJ || '',
    email: E.EMPRESA_EMAIL || '',
    cidade: E.EMPRESA_CIDADE || '',
  };
  const contato = [empresa.email && `<a href="mailto:${esc(empresa.email)}">${esc(empresa.email)}</a>`, zap && `<a href="https://wa.me/${zap}" target="_blank" rel="noopener">WhatsApp</a>`].filter(Boolean).join(' · ') || 'pelo e-mail de acesso';
  const linhaEmpresa = [esc(empresa.nome), empresa.cnpj && `CNPJ ${esc(empresa.cnpj)}`, empresa.cidade && esc(empresa.cidade)].filter(Boolean).join(' · ');

  // ---------- páginas com o cabeçalho completo ----------
  const PUB = path.join(__dirname, 'public');
  const PAGINAS = { '/': 'index.html', '/ajuda': 'ajuda.html', '/privacidade': 'privacidade.html', '/termos': 'termos.html', '/obrigado': 'obrigado.html' };
  const cache = new Map();
  function render(arq, rota) {
    if (PRODUCAO && cache.has(arq)) return cache.get(arq);
    let h = fs.readFileSync(path.join(PUB, arq), 'utf8');
    const titulo = (/<title>([^<]*)<\/title>/.exec(h) || [])[1] || 'Sua Escala 5x2';
    const desc = (/<meta name="description" content="([^"]*)"/.exec(h) || [])[1] || '';
    const indexavel = !/name="robots" content="noindex"/.test(h);
    const url = APP_URL + (rota === '/' ? '/' : rota);
    let head = `
<link rel="icon" href="/img/icone-192.png"><link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<meta property="og:type" content="website"><meta property="og:locale" content="pt_BR"><meta property="og:site_name" content="Sua Escala 5x2">
<meta property="og:title" content="${titulo}"><meta property="og:description" content="${desc}">
<meta property="og:image" content="${APP_URL}/img/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Sua Escala 5x2: responda umas perguntas e a escala 5x2 sai pronta, dentro da lei.">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${titulo}"><meta name="twitter:description" content="${desc}"><meta name="twitter:image" content="${APP_URL}/img/og.png">`;
    if (indexavel) head += `\n<link rel="canonical" href="${url}"><meta property="og:url" content="${url}">`;
    if (E.GOOGLE_SITE_VERIFICATION) head += `\n<meta name="google-site-verification" content="${esc(E.GOOGLE_SITE_VERIFICATION)}">`;
    if (E.META_DOMAIN_VERIFICATION) head += `\n<meta name="facebook-domain-verification" content="${esc(E.META_DOMAIN_VERIFICATION)}">`;
    if (rota === '/') head += `\n<script type="application/ld+json">${JSON.stringify(dadosEstruturados(h))}</script>`;
    // guarda anticlone primeiro (cópia em outro domínio volta para cá) e a marca d'água que identifica o original
    const marca = seg ? `<!-- Sua Escala 5x2 · original em ${APP_URL} · ${seg.MARCA} -->\n` : '';
    h = h.replace('<!--HEAD-->', marca + (seg ? seg.guarda() : '') + head)
      .replace(/<html(\s|>)/, `<html data-se="${seg ? seg.MARCA : ''}"$1`)
      .replaceAll('{{EMPRESA_LINHA}}', linhaEmpresa).replaceAll('{{EMPRESA_NOME}}', esc(empresa.nome))
      .replaceAll('{{EMPRESA_CNPJ}}', empresa.cnpj ? `, CNPJ ${esc(empresa.cnpj)}` : '').replaceAll('{{CONTATO}}', contato)
      .replaceAll('{{PRECO}}', PRECO.toFixed(2).replace('.', ',')).replaceAll('{{ANO}}', String(new Date().getFullYear())).replaceAll('{{SITE}}', APP_URL);
    cache.set(arq, h);
    return h;
  }
  // Google entende o produto, o preço e as perguntas frequentes
  function dadosEstruturados(h) {
    const faq = [...h.matchAll(/<details[^>]*><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)]
      .map(m => ({ '@type': 'Question', name: m[1].replace(/<[^>]+>/g, '').trim(), acceptedAnswer: { '@type': 'Answer', text: m[2].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() } }));
    return [
      { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Sua Escala 5x2', url: APP_URL + '/',
        applicationCategory: 'BusinessApplication', operatingSystem: 'Web, Android, iOS', inLanguage: 'pt-BR',
        description: 'Responda umas perguntas e receba a escala 5x2 da sua empresa dentro da nova lei (EC 141/2026), em PDF, Excel, CSV, Google Planilhas ou no WhatsApp.',
        image: APP_URL + '/img/og.png', offers: { '@type': 'Offer', price: PRECO.toFixed(2), priceCurrency: 'BRL', availability: 'https://schema.org/InStock' } },
      { '@context': 'https://schema.org', '@type': 'Organization', name: empresa.nome, url: APP_URL + '/', logo: APP_URL + '/img/icone-512.png',
        ...(empresa.email && { email: empresa.email }) },
      ...(faq.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq }] : []),
    ];
  }
  for (const [rota, arq] of Object.entries(PAGINAS)) {
    const rotas = rota === '/' ? ['/', '/index.html'] : [rota, rota + '.html'];
    app.get(rotas, (_req, res) => res.type('html').set('Cache-Control', PRODUCAO ? 'public, max-age=300' : 'no-store').send(render(arq, rota)));
  }
  app.get('/reembolso', (_req, res) => res.redirect(301, '/termos#reembolso'));
  app.get('/cookies', (_req, res) => res.redirect(301, '/privacidade#cookies'));

  // ---------- robots.txt, sitemap.xml, llms.txt ----------
  const naoCopiar = (seg ? seg.ROBOTS_BLOQUEADOS : []).map(b => `User-agent: ${b}\nDisallow: /\n\n`).join('');
  app.get('/robots.txt', (_req, res) => res.type('text/plain').send(naoCopiar +
    `User-agent: *\nAllow: /\nDisallow: /app\nDisallow: /admin\nDisallow: /api/\nDisallow: /e/\nDisallow: /obrigado\n\nSitemap: ${APP_URL}/sitemap.xml\n`));
  app.get('/sitemap.xml', (_req, res) => {
    const itens = [['/', 'index.html', '1.0'], ['/ajuda', 'ajuda.html', '0.8'], ['/privacidade', 'privacidade.html', '0.3'], ['/termos', 'termos.html', '0.3']];
    const xml = itens.map(([r, a, p]) => {
      const mod = fs.statSync(path.join(PUB, a)).mtime.toISOString().slice(0, 10);
      return `  <url><loc>${APP_URL}${r}</loc><lastmod>${mod}</lastmod><priority>${p}</priority></url>`;
    }).join('\n');
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xml}\n</urlset>\n`);
  });
  app.get('/llms.txt', (_req, res) => res.type('text/plain; charset=utf-8').send(`# Sua Escala 5x2

> Sistema brasileiro que monta a escala de trabalho 5x2 das empresas dentro da nova lei (Emenda Constitucional 141/2026, que acabou com a escala 6x1). A pessoa responde umas perguntas (tipo de negócio, dias que abre, quantas pessoas precisa e quem trabalha) e a escala sai pronta. Preço: R$ ${PRECO.toFixed(2).replace('.', ',')}.

## O que faz
- Monta a escala 5x2: 2 folgas por semana para cada pessoa, nenhum dia abaixo do mínimo de pessoas, rodízio de domingo (no comércio, 1 domingo de folga a cada 3 semanas, Lei 10.101) e aviso de feriado trabalhado (pago em dobro ou com outra folga, Lei 605/49).
- Se adapta a 12 tipos de negócio (mercado, farmácia, loja, restaurante, padaria, salão, clínica, academia, posto, escritório, portaria e outros). Na farmácia, garante farmacêutico todos os dias (Lei 13.021/2014).
- Entrega a escala em WhatsApp (imagem), PDF, Excel, CSV, Google Planilhas (que se atualiza sozinho), imagem JPG, texto e um link onde cada funcionário vê a própria folga.
- Lança férias, faltas e atestados, fecha o mês e dá acesso ao contador.
- Tem uma aula curta e sem juridiquês sobre a nova lei.
- Funciona no navegador e pode ser colocado na tela inicial do celular.

## Páginas
- [Página de vendas](${APP_URL}/): o que é, preço e perguntas frequentes.
- [Ajuda e a nova lei](${APP_URL}/ajuda): o que mudou, domingos, feriados, MEI e como funciona.
- [Política de privacidade](${APP_URL}/privacidade)
- [Termos de uso e reembolso](${APP_URL}/termos)

## Importante
- É uma ferramenta de organização de escalas, sem vínculo com o governo. Não substitui o contador ou o advogado.
- Garantia de 7 dias: reembolso integral se pedido dentro do prazo.
`));

  // ---------- rastreio com aviso de cookies ----------
  // Só carrega Pixel/Analytics/GTM/Google Ads depois do "Aceitar" (modo de consentimento do Google começa negado).
  // o rastreio também confere o domínio: uma cópia que puxa este arquivo do nosso servidor volta para o site real
  const guardaJs = seg && seg.guarda() ? seg.guarda().replace(/^<script[^>]*>|<\/script>$/g, '') + '\n' : '';
  const rastreio = () => `${guardaJs}(function(){
if(window.__rastreioIniciado)return;window.__rastreioIniciado=1; // carregado de novo (SPA): não repete o aviso nem o rastreio
var C=${JSON.stringify({ pixel: PIXEL, ga: GA, gtm: GTM, aw: AW, awg: AW_GEROU, awc: AW_CLIQUE, capi: !!CAPI, dom: /\./.test(DOM_COOKIE) && !/^[\d.]+$/.test(DOM_COOKIE) ? DOM_COOKIE : '' })};
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;
var fila=[],ok=false,K='consentimento',ativo=C.pixel||C.ga||C.gtm||C.aw;
window.rastrear=function(ev,d){if(!ativo)return;if(ok)envia(ev,d);else fila.push([ev,d])};
// escolha guardada uma vez: cookie de 1 ano no domínio e nos subdomínios + localStorage + sessão (se o armazenamento falhar, não volta na mesma visita)
var CK={sim:'aceito',nao:'necessarios'};
function dominio(){var h=location.hostname;return C.dom&&(h===C.dom||h.slice(-C.dom.length-1)==='.'+C.dom)?';domain=.'+C.dom:''}
function lerEscolha(){var c=ck(K);if(c==='aceito')return 'sim';if(c==='necessarios')return 'nao';var v=null;try{v=localStorage.getItem(K)}catch(e){}if(v!=='sim'&&v!=='nao'){try{v=sessionStorage.getItem(K)}catch(e){}}if(v!=='sim'&&v!=='nao')v=window.__cookiesEscolha||null;return v==='sim'||v==='nao'?v:null}
function guardaEscolha(v){window.__cookiesEscolha=v;try{document.cookie=K+'='+CK[v]+';max-age=31536000;path=/;SameSite=Lax'+dominio()+(location.protocol==='https:'?';Secure':'')}catch(e){}try{localStorage.setItem(K,v)}catch(e){}try{sessionStorage.setItem(K,v)}catch(e){}}
window.preferenciasCookies=function(){window.__cookiesEscolha=null;try{document.cookie=K+'=;max-age=0;path=/'+dominio()}catch(e){}try{localStorage.removeItem(K)}catch(e){}try{sessionStorage.removeItem(K)}catch(e){}aviso(true)};
if(ativo)gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
function s(src){var t=document.createElement('script');t.async=true;t.src=src;document.head.appendChild(t)}
function eid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,10)}
function ck(n){var r=document.cookie.match(new RegExp('(?:^|; )'+n+'=([^;]*)'));return r?decodeURIComponent(r[1]):''}
function srv(ev,id,d){if(!C.pixel)return;var go=function(){try{var u=new URLSearchParams(location.search),fb=u.get('fbclid'),fbc=ck('_fbc')||(fb?'fb.1.'+Date.now()+'.'+fb:'');fetch('/api/evento',{method:'POST',keepalive:true,credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({ev:ev,id:id,url:location.href,fbp:ck('_fbp'),fbc:fbc,value:d&&d.value,currency:d&&d.currency})}).catch(function(){})}catch(e){}};ev==='PageView'?setTimeout(go,1500):go()}
function carrega(){if(ok||!ativo)return;ok=true;
gtag('consent','update',{ad_storage:'granted',analytics_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});
if(C.gtm){dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});s('https://www.googletagmanager.com/gtm.js?id='+C.gtm)}
if(C.ga||C.aw){s('https://www.googletagmanager.com/gtag/js?id='+(C.ga||C.aw));gtag('js',new Date());if(C.ga)gtag('config',C.ga);if(C.aw)gtag('config',C.aw)}
if(C.pixel){!function(f,b,e,v,n,t,x){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;x=b.getElementsByTagName(e)[0];x.parentNode.insertBefore(t,x)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',C.pixel);var pv=eid();fbq('track','PageView',{},{eventID:pv});srv('PageView',pv)}
fila.forEach(function(e){envia(e[0],e[1])});fila=[]}
var GA4={Lead:'generate_lead',InitiateCheckout:'begin_checkout',Purchase:'purchase',CompleteRegistration:'sign_up',ViewContent:'view_item',GerouEscala:'gerou_escala',CliqueSitePago:'clique_site_pago'};
var META={PageView:1,ViewContent:1,Lead:1,InitiateCheckout:1,CompleteRegistration:1,AddPaymentInfo:1,Contact:1,Purchase:1},ADS={GerouEscala:C.awg,CliqueSitePago:C.awc};
function envia(ev,d){d=d||{};var id=eid();if(window.fbq)fbq(META[ev]?'track':'trackCustom',ev,d,{eventID:id});if(ev!=='Purchase'&&META[ev])srv(ev,id,d);if(C.ga||C.gtm)gtag('event',GA4[ev]||ev,{value:d.value,currency:d.currency});
if(C.aw&&ADS[ev])gtag('event','conversion',{send_to:C.aw+'/'+ADS[ev],value:d.value,currency:d.currency||'BRL',transport_type:'beacon'});dataLayer.push({event:'escala_'+ev})}
function aviso(forca){if(document.getElementById('avisoCookies')||(!forca&&lerEscolha()))return;var a=document.createElement('div');a.id='avisoCookies';a.setAttribute('role','dialog');a.setAttribute('aria-label','Cookies');
var css=document.createElement('style');css.textContent='#avisoCookies{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;background:rgba(12,27,51,.97);color:#e6edf7;border-top:1px solid rgba(255,255,255,.14);padding:10px 12px calc(10px + env(safe-area-inset-bottom));font:500 13px/1.35 system-ui,-apple-system,sans-serif;box-shadow:0 -10px 30px rgba(0,0,0,.25);transform:translateY(100%);transition:transform .35s cubic-bezier(.16,1,.3,1)}#avisoCookies.on{transform:none}#avisoCookies p{margin:0;flex:1 1 260px}#avisoCookies a{color:#9fc2ff}#avisoCookies div{display:flex;gap:8px;flex:1 1 100%}#avisoCookies button{flex:1;height:36px;border-radius:9px;font:700 14px system-ui,-apple-system,sans-serif;cursor:pointer;padding:0 12px}#avisoCookies .s{border:0;background:#168821;color:#fff}#avisoCookies .n{border:1px solid #5a6a85;background:transparent;color:#e6edf7}@media (min-width:640px){#avisoCookies{left:16px;right:auto;bottom:16px;max-width:380px;border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:12px 14px;transform:translateY(calc(100% + 24px))}}';
a.appendChild(css);
a.insertAdjacentHTML('beforeend','<p>Usamos cookies para medir visitas e anúncios. <a href="${APP_URL}/privacidade#cookies">Saiba mais</a></p><div><button type="button" class="s" data-c="sim">Aceitar</button><button type="button" class="n" data-c="nao">Só necessários</button></div>');
setTimeout(function(){a.classList.add('on')},400);
a.onclick=function(e){var b=e.target.closest('button');if(!b)return;guardaEscolha(b.dataset.c);a.remove();if(b.dataset.c==='sim')carrega()};
(document.body?document.body.appendChild(a):document.addEventListener('DOMContentLoaded',function(){document.body.appendChild(a)}))}
var v=lerEscolha();if(v)guardaEscolha(v);
if(v==='sim')carrega();else if(v!=='nao')aviso();
})();`;
  app.get(['/rastreio.js', '/pixel.js'], (_req, res) => res.type('application/javascript').set('Cache-Control', 'public, max-age=600').send(rastreio()));

  // ---------- compra direto do servidor para a Meta (não perde venda por bloqueador de anúncio) ----------
  const h256 = v => crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');
  async function compraMeta({ email, nome, whatsapp, transacao }) {
    if (E.META_COMPRA_SERVIDOR !== '1') return;
    const CAPI = await tokenMeta(); if (!CAPI) return;
    const fone = String(whatsapp || '').replace(/\D/g, '');
    const corpo = { data: [{ event_name: 'Purchase', event_time: Math.floor(Date.now() / 1000), action_source: 'website',
      event_id: 'compra_' + (transacao || h256(email)).toString().slice(0, 60), event_source_url: APP_URL + '/obrigado',
      user_data: { em: [h256(email)], ...(fone && { ph: [h256(fone.length <= 11 ? '55' + fone : fone)] }), ...(nome && { fn: [h256(String(nome).split(' ')[0])] }) },
      custom_data: { value: PRECO, currency: 'BRL', content_name: 'Sua Escala 5x2' } }],
      ...(E.META_TEST_EVENT_CODE && { test_event_code: E.META_TEST_EVENT_CODE }) };
    const r = await fetch(`https://graph.facebook.com/v21.0/${PIXEL}/events?access_token=${encodeURIComponent(CAPI)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo), signal: AbortSignal.timeout(8000) });
    if (!r.ok) console.error('Meta (API de Conversões):', r.status, (await r.text()).slice(0, 200));
  }

  // ---------- 404 ----------
  function naoEncontrado(req, res) {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return res.status(404).json({ erro: 'Rota não encontrada.' });
    res.status(404).type('html').send(fs.readFileSync(path.join(PUB, '404.html'), 'utf8'));
  }
  // ---------- eventos do navegador repassados pelo servidor (API de Conversões) ----------
  // só chegam aqui depois do "Aceitar cookies" (o rastreio só começa depois do aceite)
  const EVENTOS = new Set(['PageView', 'ViewContent', 'Lead', 'InitiateCheckout', 'CompleteRegistration', 'AddPaymentInfo', 'Contact']);
  const ip = req => String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
  async function eventoMeta(req, b) {
    const tk = await tokenMeta(); if (!tk) return;
    const url = String(b.url || '').slice(0, 500);
    if (url && !url.startsWith(APP_URL) && !(BLOG_URL && url.startsWith(BLOG_URL))) return; // só eventos do nosso domínio (e do blog)
    const user_data = { client_ip_address: ip(req), client_user_agent: String(req.headers['user-agent'] || '').slice(0, 400) };
    if (/^fb\.\d\.\d+\.[\w.-]+$/.test(b.fbp || '')) user_data.fbp = b.fbp;
    if (/^fb\.\d\.\d+\.[\w.-]+$/.test(b.fbc || '')) user_data.fbc = b.fbc;
    if (req.emailLogado) user_data.em = [h256(req.emailLogado)];
    const ev = { event_name: b.ev, event_time: Math.floor(Date.now() / 1000), event_id: String(b.id || '').slice(0, 60), action_source: 'website', event_source_url: url || APP_URL, user_data };
    if (b.value) ev.custom_data = { value: +b.value || PRECO, currency: b.currency || 'BRL', content_name: 'Sua Escala 5x2' };
    const r = await fetch(`https://graph.facebook.com/v21.0/${PIXEL}/events?access_token=${encodeURIComponent(tk)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [ev], ...(E.META_TEST_EVENT_CODE && { test_event_code: E.META_TEST_EVENT_CODE }) }), signal: AbortSignal.timeout(8000) });
    if (!r.ok) console.error('Meta (API de Conversões):', r.status, (await r.text()).slice(0, 200));
  }
  app.post('/api/evento', ...(limite ? [limite(240)] : []), (req, res) => {
    res.status(204).end();
    const b = req.body || {};
    if (!PIXEL || !EVENTOS.has(b.ev)) return;
    eventoMeta(req, b).catch(e => console.error('Meta:', e.message));
  });
  // teste do /admin: manda um PageView com o código de teste do Gerenciador de Eventos
  async function testeMeta(codigo) {
    const tk = await tokenMeta(); if (!tk) return { ok: false, erro: 'Token não configurado.' };
    const r = await fetch(`https://graph.facebook.com/v21.0/${PIXEL}/events?access_token=${encodeURIComponent(tk)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [{ event_name: 'PageView', event_time: Math.floor(Date.now() / 1000), event_id: 'teste_' + Date.now(), action_source: 'website', event_source_url: APP_URL + '/',
        user_data: { client_ip_address: '200.200.200.200', client_user_agent: 'Mozilla/5.0 (teste do painel)' } }], ...(codigo && { test_event_code: codigo }) }), signal: AbortSignal.timeout(8000) });
    const j = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, recebidos: j.events_received } : { ok: false, erro: j.error?.message || ('HTTP ' + r.status) };
  }
  return { compraMeta, naoEncontrado, tokenMeta, limpaCacheMeta, testeMeta, PIXEL };
};
