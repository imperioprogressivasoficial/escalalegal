// Sua Escala 5x2 — o site público: metas de busca e compartilhamento, robots.txt, sitemap.xml, llms.txt,
// rastreio (Meta Pixel, Google Analytics 4, Google Tag Manager) com aviso de cookies (LGPD), página 404
// e a compra enviada direto do servidor para a Meta (API de Conversões), que não depende do navegador.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = function site({ app, APP_URL, PRODUCAO, seg }) {
  const E = process.env;
  const PIXEL = /^\d+$/.test(E.META_PIXEL_ID || '') ? E.META_PIXEL_ID : '';
  const GA = /^G-[A-Z0-9]+$/i.test(E.GA_ID || '') ? E.GA_ID : '';
  const GTM = /^GTM-[A-Z0-9]+$/i.test(E.GTM_ID || '') ? E.GTM_ID : '';
  const CAPI = PIXEL && E.META_CAPI_TOKEN ? E.META_CAPI_TOKEN : '';
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

> Sistema brasileiro que monta a escala de trabalho 5x2 das empresas dentro da nova lei (Emenda Constitucional 141/2026, que acabou com a escala 6x1). A pessoa responde umas perguntas (tipo de negócio, dias que abre, quantas pessoas precisa e quem trabalha) e a escala sai pronta. Pagamento único de R$ ${PRECO.toFixed(2).replace('.', ',')}.

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
  // Só carrega Pixel/Analytics/GTM depois do "Aceitar" (modo de consentimento do Google começa negado).
  // o rastreio também confere o domínio: uma cópia que puxa este arquivo do nosso servidor volta para o site real
  const guardaJs = seg && seg.guarda() ? seg.guarda().replace(/^<script[^>]*>|<\/script>$/g, '') + '\n' : '';
  const rastreio = () => `${guardaJs}(function(){
var C=${JSON.stringify({ pixel: PIXEL, ga: GA, gtm: GTM, capi: !!CAPI })};
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;
var fila=[],ok=false,K='consentimento',ativo=C.pixel||C.ga||C.gtm;
window.rastrear=function(ev,d){if(!ativo)return;if(ok)envia(ev,d);else fila.push([ev,d])};
window.preferenciasCookies=function(){try{localStorage.removeItem(K)}catch(e){}aviso()};
if(ativo)gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
function s(src){var t=document.createElement('script');t.async=true;t.src=src;document.head.appendChild(t)}
function carrega(){if(ok||!ativo)return;ok=true;
gtag('consent','update',{ad_storage:'granted',analytics_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});
if(C.gtm){dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});s('https://www.googletagmanager.com/gtm.js?id='+C.gtm)}
if(C.ga){s('https://www.googletagmanager.com/gtag/js?id='+C.ga);gtag('js',new Date());gtag('config',C.ga)}
if(C.pixel){!function(f,b,e,v,n,t,x){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;x=b.getElementsByTagName(e)[0];x.parentNode.insertBefore(t,x)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',C.pixel);fbq('track','PageView')}
fila.forEach(function(e){envia(e[0],e[1])});fila=[]}
var GA4={Lead:'generate_lead',InitiateCheckout:'begin_checkout',Purchase:'purchase',CompleteRegistration:'sign_up',ViewContent:'view_item'};
function envia(ev,d){d=d||{};if(window.fbq&&!(ev==='Purchase'&&C.capi))fbq('track',ev,d);if(C.ga||C.gtm)gtag('event',GA4[ev]||ev,{value:d.value,currency:d.currency});dataLayer.push({event:'escala_'+ev})}
function aviso(){if(document.getElementById('avisoCookies'))return;var a=document.createElement('div');a.id='avisoCookies';a.setAttribute('role','dialog');a.setAttribute('aria-label','Cookies');
a.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483000;max-width:520px;margin:0 auto;background:rgba(12,27,51,.97);backdrop-filter:blur(10px);color:#e6edf7;border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:18px 20px;font:500 15px/1.5 system-ui,sans-serif;box-shadow:0 24px 60px rgba(0,0,0,.45);transform:translateY(30px);opacity:0;transition:transform .5s cubic-bezier(.16,1,.3,1),opacity .5s';
a.innerHTML='<b style="display:block;font-size:16px;color:#fff;margin-bottom:4px">Este site usa cookies</b>Eles ajudam a medir as visitas e melhorar os anúncios. Você escolhe. <a href="/privacidade#cookies" style="color:#9fc2ff">Saiba mais</a><div style="display:flex;gap:8px;margin-top:14px"><button data-c="sim" style="flex:1.4;border:0;border-radius:12px;padding:12px;font:700 15px system-ui;background:linear-gradient(135deg,#2bc443,#168821);color:#fff;cursor:pointer">Aceitar cookies</button><button data-c="nao" style="flex:1;border:1px solid #5a6a85;border-radius:12px;padding:12px;font:700 15px system-ui;background:transparent;color:#e6edf7;cursor:pointer">Só os necessários</button></div>';
setTimeout(function(){a.style.transform='none';a.style.opacity='1'},400);
a.onclick=function(e){var b=e.target.closest('button');if(!b)return;try{localStorage.setItem(K,b.dataset.c)}catch(x){}a.remove();if(b.dataset.c==='sim')carrega()};
(document.body?document.body.appendChild(a):document.addEventListener('DOMContentLoaded',function(){document.body.appendChild(a)}))}
var v=null;try{v=localStorage.getItem(K)}catch(e){}
if(v==='sim')carrega();else if(v!=='nao')aviso();
})();`;
  app.get(['/rastreio.js', '/pixel.js'], (_req, res) => res.type('application/javascript').set('Cache-Control', 'public, max-age=600').send(rastreio()));

  // ---------- compra direto do servidor para a Meta (não perde venda por bloqueador de anúncio) ----------
  const h256 = v => crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');
  async function compraMeta({ email, nome, whatsapp, transacao }) {
    if (!CAPI) return;
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
  return { compraMeta, naoEncontrado };
};
