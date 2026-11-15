// Sua Escala 5x2 — blog e gerador grátis no subdomínio (blog.DOMAIN), servidos pelo mesmo app e separados pelo Host.
// Tudo é montado aqui no servidor (sem CMS): os artigos ficam em artigos.js e o gerador roda no navegador
// com o mesmo motor do app (public/scheduler.js) e o gerador.js desta pasta.
const fs = require('fs');
const path = require('path');
const express = require('express');
const Escala = require('../public/scheduler.js');
const ARTIGOS = require('./artigos.js');

const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ld = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const slugDe = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const dataBr = d => `${+d.slice(8)} de ${MESES[+d.slice(5, 7) - 1]} de ${d.slice(0, 4)}`;
// atendimento (widget "Fale com a gente"): carrega depois da página, para não pesar no carregamento
const ATENDIMENTO = `<script>addEventListener('load',function(){setTimeout(function(){var s=document.createElement('script');s.src='/suporte.js?v=2';s.dataset.modo='site';document.body.appendChild(s)},1200)})</script>`;
const palavras = h => String(h).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

// Títulos do gerador que acompanham a palavra-chave do anúncio (?utm_term= ou ?kw=). Só textos fixos: nada do endereço vai para a página.
const TITULOS = [
  [/como\s*(fazer|montar|criar)/i, 'Como fazer escala 5x2: gere a sua grátis'],
  [/6\s*x\s*1|6x1|seis\s*por\s*um/i, 'Fim da 6x1: gere sua escala 5x2 grátis'],
  [/modelo|planilha|exemplo|excel/i, 'Modelo de escala 5x2 grátis, pronto na hora'],
  [/42\s*h|42\s*horas|40\s*h|40\s*horas/i, 'Escala 5x2 dentro das 42h, grátis'],
  [/domingo/i, 'Escala 5x2 com rodízio de domingo, grátis'],
];
const H1_PADRAO = 'Gere sua escala 5x2 grátis';
function h1Para(query = {}) {
  const termo = String(query.utm_term || query.kw || query.palavra || '').slice(0, 120);
  for (const [re, t] of TITULOS) if (re.test(termo)) return t;
  return H1_PADRAO;
}

// artigos completos: id nos H2, índice, tempo de leitura e título da aba com no máximo 60 caracteres
const LISTA = ARTIGOS.map(a => {
  const indice = [];
  const corpo = a.corpo.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, t) => { const id = slugDe(t); indice.push({ id, t: t.replace(/<[^>]+>/g, '') }); return `<h2 id="${id}">${t}</h2>`; });
  const aba = (a.titulo + ' | Blog Sua Escala 5x2').length <= 60 ? a.titulo + ' | Blog Sua Escala 5x2' : a.titulo;
  return { ...a, corpo, indice, aba, minutos: Math.max(3, Math.round(palavras(a.corpo) / 200)), palavras: palavras(a.corpo) };
}).sort((x, y) => y.publicado.localeCompare(x.publicado));
const POR_SLUG = new Map(LISTA.map(a => [a.slug, a]));

module.exports = function blog({ APP_URL, BLOG_URL, BLOG_HOST, PRODUCAO, seg }) {
  const SITE = APP_URL.replace(/^https?:\/\//, '');
  const ehBlog = req => !!BLOG_HOST && String(req.hostname || '').toLowerCase() === BLOG_HOST;
  // link para o site pago (página de vendas, direto no preço). O script da página leva junto ind/utm/gclid de quem chegou.
  const pago = (meio, campanha) => `${APP_URL}/?utm_source=blog&amp;utm_medium=${meio}&amp;utm_campaign=${encodeURIComponent(campanha)}#preco`;
  const v = PRODUCAO ? '20261115b' : String(Date.now());

  const CSS = fs.readFileSync(path.join(__dirname, 'blog.css'), 'utf8').replace(/\s*\n\s*/g, '\n');
  const JS_GERADOR = fs.readFileSync(path.join(__dirname, 'gerador.js'), 'utf8');
  // leva ind/utm/gclid de quem chegou (anúncio ou indicação) para os links do site pago e conta o clique (só com cookies aceitos)
  const JS_LINKS = `(function(){var K='blog_origem',p=new URLSearchParams(location.search),g={},novo=0;try{g=JSON.parse(sessionStorage.getItem(K)||'{}')||{}}catch(e){}
p.forEach(function(v,n){if(/^(utm_|ind$|gclid$|gbraid$|wbraid$|fbclid$|src$|sck$)/.test(n)){if(!novo){g={};novo=1}g[n]=String(v).slice(0,120)}});
try{if(novo)sessionStorage.setItem(K,JSON.stringify(g))}catch(e){}window.origemBlog=g;
window.linkPago=function(h){try{var u=new URL(h,location.href),k;if(Object.keys(g).some(function(n){return n.indexOf('utm_')===0}))[].slice.call(u.searchParams.keys()).filter(function(n){return n.indexOf('utm_')===0}).forEach(function(n){u.searchParams.delete(n)});for(k in g)u.searchParams.set(k,g[k]);return u.toString()}catch(e){return h}};
[].forEach.call(document.querySelectorAll('a[data-pago]'),function(a){a.href=linkPago(a.href)});
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-pago]');if(a&&window.rastrear)rastrear('CliqueSitePago')});})();`;

  // ---------- moldura de toda página ----------
  function pagina({ aba, desc, rota, og = '/img/blog/og-blog.jpg', ogAlt = 'Blog Sua Escala 5x2', tipo = 'website', dados = [], corpo, scripts = '', robots = 'index, follow, max-image-preview:large' }) {
    const url = BLOG_URL + rota, img = BLOG_URL + og;
    const marca = seg ? `<!-- Sua Escala 5x2 · original em ${BLOG_URL} · ${seg.MARCA} -->\n` : '';
    return `<!DOCTYPE html>
<html lang="pt-BR" data-se="${seg ? seg.MARCA : ''}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${marca}${seg ? seg.guarda() : ''}
<title>${esc(aba)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="${robots}">
<meta name="theme-color" content="#061533">
<link rel="canonical" href="${url}">
<link rel="icon" href="/img/icone-192.png"><link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<meta property="og:type" content="${tipo}"><meta property="og:locale" content="pt_BR"><meta property="og:site_name" content="Blog Sua Escala 5x2">
<meta property="og:title" content="${esc(aba)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${img}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(ogAlt)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(aba)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${img}">
${process.env.GOOGLE_SITE_VERIFICATION ? `<meta name="google-site-verification" content="${esc(process.env.GOOGLE_SITE_VERIFICATION)}">\n` : ''}${process.env.META_DOMAIN_VERIFICATION ? `<meta name="facebook-domain-verification" content="${esc(process.env.META_DOMAIN_VERIFICATION)}">\n` : ''}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..100,600..800&family=Public+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
${dados.map(ld).join('\n')}
</head>
<body>
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
<header class="topo"><div class="wrap">
  <a class="marca" href="/" aria-label="Blog Sua Escala 5x2, página inicial"><img src="/img/mascote.svg" width="30" height="35" alt=""><span>SuaEscala<b>5x2</b></span><em>· Blog</em></a>
  <nav aria-label="Principal"><a class="so-pc" href="/blog">Artigos</a><a class="so-pc" href="${APP_URL}/ajuda">A lei</a><a class="btn-topo" href="/gerador">Gerar escala grátis</a></nav>
</div></header>
<main id="conteudo">
${corpo}
</main>
<footer class="rodape"><div class="wrap">
  <div class="rd-marca"><a class="marca" href="/"><img src="/img/mascote.svg" width="30" height="35" alt="" loading="lazy"><span>SuaEscala<b>5x2</b></span><em>· Blog</em></a>
    <p>Conteúdo sobre a escala 5x2 e o fim da 6x1 para quem tem comércio, salão, restaurante ou farmácia. Feito pela equipe da Sua Escala 5x2.</p></div>
  <div><h2>Blog</h2><ul><li><a href="/gerador">Gerador de escala grátis</a></li><li><a href="/blog">Todos os artigos</a></li>${LISTA.slice(0, 3).map(a => `<li><a href="/blog/${a.slug}">${esc(a.curto || a.titulo)}</a></li>`).join('')}</ul></div>
  <div><h2>Sua Escala 5x2</h2><ul><li><a href="${pago('rodape', 'rodape')}" data-pago>Conhecer o app completo</a></li><li><a href="${APP_URL}/ajuda">Ajuda e a nova lei</a></li><li><a href="${APP_URL}/privacidade">Privacidade</a></li><li><a href="${APP_URL}/termos">Termos de uso</a></li><li><button type="button" class="link-cookies" onclick="window.preferenciasCookies&&preferenciasCookies()">Preferências de cookies</button></li></ul></div>
  <p class="rd-fim">Conteúdo informativo, sem vínculo com o governo. Confira sempre com o seu contador. © ${new Date().getFullYear()} Sua Escala 5x2</p>
</div></footer>
<script>${JS_LINKS}</script>
${scripts}<script src="/rastreio.js" defer></script>
${ATENDIMENTO}
</body>
</html>`;
  }

  // chamada para o app pago, igual em todo lugar
  const blocoPago = (meio, campanha) => `<aside class="pago" aria-labelledby="tPago-${meio}">
  <div class="pago-txt"><p class="etq etq-claro">Sua Escala 5x2 completa</p>
    <h2 id="tPago-${meio}">Quer o mês inteiro, com os nomes, faltas, férias, envio pelo WhatsApp e acesso do contador?</h2>
    <ul><li>4 semanas prontas, refeitas sozinhas quando a equipe muda</li><li>Nome de cada pessoa, folga fixa e férias</li><li>Link para a equipe ver a folga no celular</li><li>PDF, Excel, Google Planilhas e imagem para o WhatsApp</li><li>Espaço do contador com o mês fechado</li></ul>
    <a class="btn btn-amarelo" href="${pago(meio, campanha)}" data-pago>Conhecer por R$ 97</a></div>
  <img src="/img/iphone-escala.webp" width="675" height="1380" alt="Tela do app Sua Escala 5x2 com a escala da semana" loading="lazy" decoding="async">
</aside>`;
  const blocoGerador = `<aside class="cta-g"><img src="/img/mascote.svg" width="64" height="76" alt="" loading="lazy"><div><h2>Monte a semana da sua equipe agora</h2><p>Grátis, sem cadastro, até 10 pessoas. 2 folgas para cada um e domingo em rodízio.</p><a class="btn" href="/gerador">Gerar escala 5x2 grátis</a></div></aside>`;
  const cartao = a => `<article class="cartao"><a href="/blog/${a.slug}"><p class="etq">${esc(a.etiqueta)}</p><h3>${esc(a.titulo)}</h3><p>${esc(a.resumo)}</p><span class="cartao-mais">Ler em ${a.minutos} min</span></a></article>`;

  // ---------- gerador (início e /gerador) ----------
  const SET = Object.entries(Escala.SETORES);
  const FAQ_G = [
    ['O gerador de escala 5x2 é grátis mesmo?', 'É. Você monta uma semana para até 10 pessoas sem cadastro e sem pagar. Nada é salvo: tudo roda no seu navegador. Para o mês inteiro, com nomes, férias e faltas, existe a versão completa da Sua Escala 5x2, por R$ 97.'],
    ['A escala sai dentro da nova lei?', 'Sai com 2 folgas por semana para cada pessoa, no máximo 8 horas por dia e as horas da semana dentro do limite da data (42h a partir de 15/12/2026 e 40h a partir de 15/12/2027). No comércio, o domingo de folga entra em rodízio para cair pelo menos 1 vez a cada 3 semanas (Lei 10.101).'],
    ['Por que aparece "Caixa 1", "Caixa 2" e não o nome das pessoas?', 'A versão grátis não guarda nomes. Você imprime ou baixa a imagem e escreve os nomes à mão, ou usa a versão completa, onde cada pessoa tem o próprio nome e vê a folga pelo link.'],
    ['Posso usar para mais de uma semana?', 'A versão grátis gera uma semana por vez. Na semana seguinte o rodízio de domingo muda de pessoa, e quem controla isso é você. A versão completa monta as 4 semanas e segura o rodízio sozinha.'],
  ];
  function gerador(req, rota) {
    const h1 = h1Para(req.query);
    const hoje = new Date().toISOString().slice(0, 10);
    const dow = (new Date(hoje + 'T12:00:00Z').getUTCDay() + 6) % 7;
    const seg1 = Escala.somaDias(hoje, dow === 0 ? 0 : 7 - dow);
    const semanas = Array.from({ length: 8 }, (_, i) => Escala.somaDias(seg1, i * 7));
    const br = d => d.slice(8) + '/' + d.slice(5, 7);
    const inicio = rota === '/';
    const corpo = `<section class="hero-g"><div class="wrap g-grid">
  <div class="g-txt">
    <p class="etq etq-claro">Grátis · sem cadastro · nada fica salvo</p>
    <h1>${esc(h1)}</h1>
    <p class="sub">Responda 3 perguntas e veja a semana da sua equipe com <b>2 folgas para cada pessoa</b><span class="so-pc">, domingo em rodízio e as horas dentro da nova lei (EC 141/2026)</span>.</p>
    <ul class="g-lim" aria-label="Limites da versão grátis"><li>1 semana</li><li>Até 10 pessoas</li><li>Sem nomes</li><li>Imprimir ou baixar imagem</li></ul>
    <img class="g-masc" src="/img/mascote.svg" width="150" height="177" alt="Zé Folga, o mascote da Sua Escala 5x2">
  </div>
  <form id="gerador" class="g-card passo-1" novalidate data-site="${esc(SITE)}" data-pago="${pago('gerador', 'resultado')}" data-app="${esc(APP_URL)}">
    <ol class="g-passos" aria-label="Etapas"><li class="on">Dias</li><li>Equipe</li><li>Horário</li></ol>
    <fieldset data-p="1"><legend>Que tipo de negócio e que dias abre?</legend>
      <label for="gSetor">Tipo de negócio</label>
      <select id="gSetor">${SET.map(([k, s]) => `<option value="${k}"${k === 'varejo' ? ' selected' : ''}>${esc(s.nome)}</option>`).join('')}</select>
      <p class="g-rot" id="gDiasRot">Dias que abre</p>
      <div class="g-dias" role="group" aria-labelledby="gDiasRot">${Escala.DIAS.map((d, i) => `<button type="button" data-dia="${i}" aria-pressed="true">${d}</button>`).join('')}</div>
      <p class="g-dica" id="gDomingo"></p>
      <div class="g-nav"><button type="button" class="btn g-prox">Continuar</button></div>
    </fieldset>
    <fieldset data-p="2"><legend>Quantas pessoas em cada função?</legend>
      <p class="g-dica">Conte todo mundo, de todos os turnos. Ao lado, quantas dessa função precisam estar trabalhando por dia.</p>
      <div id="gFuncoes" class="g-funcoes"></div>
      <p class="g-total" aria-live="polite"><b id="gTotal">0</b> de 10 pessoas <span>(limite da versão grátis)</span></p>
      <div class="g-nav"><button type="button" class="link g-volta">Voltar</button><button type="button" class="btn g-prox">Continuar</button></div>
    </fieldset>
    <fieldset data-p="3"><legend>Horário e semana</legend>
      <div class="g-2"><div><label for="gAbre">Abre às</label><input id="gAbre" type="time" value="10:00"></div><div><label for="gFecha">Fecha às</label><input id="gFecha" type="time" value="22:00"></div></div>
      <label for="gHoras">Horas de trabalho por dia (fora o almoço)</label>
      <select id="gHoras"><option value="8">8h por dia · 40h na semana (recomendado)</option><option value="7">7h por dia · 35h na semana</option><option value="6">6h por dia · 30h na semana</option><option value="5">5h por dia · 25h na semana</option><option value="4">4h por dia · 20h na semana</option></select>
      <div class="g-2"><div><label for="gSemana">Semana</label><select id="gSemana">${semanas.map((s, i) => `<option value="${s}"${i ? '' : ' selected'}>${br(s)} a ${br(Escala.somaDias(s, 6))}</option>`).join('')}</select></div>
        <div><label for="gUf">Estado <small>(feriados)</small></label><select id="gUf"><option value="">Só nacionais</option>${Escala.UFS.map(u => `<option>${u}</option>`).join('')}</select></div></div>
      <div id="gFeriados" class="g-feriados"></div>
      <p class="g-dica" id="gLimite"></p>
      <div class="g-nav"><button type="button" class="link g-volta">Voltar</button><button type="submit" class="btn btn-gerar">Gerar minha escala grátis</button></div>
    </fieldset>
    <p class="g-erro" id="gErro" role="alert"></p>
  </form>
</div></section>
<section id="resultado" class="resultado wrap" hidden aria-live="polite"></section>
<section class="wrap faixa">
  <div class="tres">
    <div><b>1</b><h2>Dias e equipe</h2><p>Escolha os dias que abre e quantas pessoas tem em cada função. Sem digitar nomes.</p></div>
    <div><b>2</b><h2>A semana sai pronta</h2><p>Cada pessoa trabalha 5 dias e folga 2. O mínimo de gente por dia é respeitado.</p></div>
    <div><b>3</b><h2>Imprima ou baixe</h2><p>Cole no mural ou mande a imagem no grupo da equipe.</p></div>
  </div>
</section>
${inicio ? `<section class="wrap recentes"><div class="cab"><h2>Artigos sobre a escala 5x2</h2><a href="/blog">Ver todos</a></div><div class="cartoes">${LISTA.slice(0, 6).map(cartao).join('')}</div></section>` : `<section class="wrap recentes"><div class="cab"><h2>Para entender a nova lei</h2><a href="/blog">Ver todos os artigos</a></div><div class="cartoes">${['escala-5x2-fim-da-6x1', 'como-fazer-escala-5x2', 'domingo-escala-5x2-comercio'].map(s => POR_SLUG.get(s)).filter(Boolean).map(cartao).join('')}</div></section>`}
<section class="wrap duvidas"><h2>Perguntas frequentes</h2>${FAQ_G.map(([p, r]) => `<details><summary>${esc(p)}</summary><p>${esc(r)}</p></details>`).join('')}
<p class="aviso-info">Este conteúdo é informativo; confira com seu contador. A convenção coletiva da sua categoria pode ter regras próprias.</p></section>`;
    const dados = [
      { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Gerador de escala 5x2 grátis', url: BLOG_URL + rota, applicationCategory: 'BusinessApplication', operatingSystem: 'Web', inLanguage: 'pt-BR', isAccessibleForFree: true,
        description: 'Monte grátis uma semana de escala 5x2 para até 10 pessoas, com 2 folgas por semana, rodízio de domingo e as horas dentro da EC 141/2026.', offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
        publisher: { '@type': 'Organization', name: 'Sua Escala 5x2', url: APP_URL + '/' } },
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ_G.map(([p, r]) => ({ '@type': 'Question', name: p, acceptedAnswer: { '@type': 'Answer', text: r } })) },
      ...(inicio ? [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Blog Sua Escala 5x2', url: BLOG_URL + '/', inLanguage: 'pt-BR' }] : []),
    ];
    return pagina({ aba: inicio ? 'Escala 5x2 grátis: gerador e blog da nova lei' : 'Gerador de escala 5x2 grátis | Sua Escala 5x2', rota,
      desc: 'Gere grátis a escala 5x2 da sua equipe: responda 3 perguntas e veja a semana com 2 folgas para cada um, domingo em rodízio e as horas da EC 141/2026.',
      og: '/img/blog/og-gerador.jpg', ogAlt: 'Gerador de escala 5x2 grátis', dados, corpo,
      scripts: `<script src="/scheduler.js?v=${v}" defer></script>\n<script src="/gerador.js?v=${v}" defer></script>\n` });
  }

  // ---------- lista de artigos ----------
  function lista() {
    const corpo = `<section class="cab-blog"><div class="wrap"><nav class="trilha" aria-label="Você está em"><a href="/">Início</a><span aria-hidden="true">›</span><span aria-current="page">Blog</span></nav>
  <h1>Blog da escala 5x2</h1><p class="sub">O fim da 6x1 explicado sem juridiquês: folgas, domingo, feriado, horas e como montar a escala do seu negócio.</p></div></section>
<section class="wrap"><div class="cartoes lista">${LISTA.map(cartao).join('')}</div>${blocoGerador}</section>`;
    return pagina({ aba: 'Blog da escala 5x2: o fim da 6x1 sem juridiquês', rota: '/blog', corpo,
      desc: 'Artigos sobre a escala 5x2 e a EC 141/2026: como fazer a escala, domingo no comércio, jornada de 42h, feriados, banco de horas e exemplos por tipo de negócio.',
      dados: [
        { '@context': 'https://schema.org', '@type': 'Blog', name: 'Blog Sua Escala 5x2', url: BLOG_URL + '/blog', inLanguage: 'pt-BR',
          blogPost: LISTA.map(a => ({ '@type': 'BlogPosting', headline: a.titulo, url: `${BLOG_URL}/blog/${a.slug}`, datePublished: a.publicado, dateModified: a.atualizado })) },
        { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: BLOG_URL + '/' }, { '@type': 'ListItem', position: 2, name: 'Blog', item: BLOG_URL + '/blog' }] },
      ] });
  }

  // ---------- artigo ----------
  function artigo(a) {
    const url = `${BLOG_URL}/blog/${a.slug}`, og = `/img/blog/og-${a.slug}.jpg`;
    const rel = (a.relacionados || []).map(s => POR_SLUG.get(s)).filter(Boolean);
    const corpo = `<article class="artigo">
<header class="cab-art"><div class="wrap estreito">
  <nav class="trilha" aria-label="Você está em"><a href="/">Início</a><span aria-hidden="true">›</span><a href="/blog">Blog</a><span aria-hidden="true">›</span><span aria-current="page">${esc(a.curto || a.titulo)}</span></nav>
  <p class="etq">${esc(a.etiqueta)}</p>
  <h1>${esc(a.h1 || a.titulo)}</h1>
  <p class="sub">${esc(a.resumo)}</p>
  <p class="meta">Equipe Sua Escala 5x2 · <time datetime="${a.atualizado}">Atualizado em ${dataBr(a.atualizado)}</time> · ${a.minutos} min de leitura</p>
</div></header>
<div class="wrap estreito texto">
  <nav class="indice" aria-label="Neste artigo"><p>Neste artigo</p><ol>${a.indice.map(i => `<li><a href="#${i.id}">${esc(i.t)}</a></li>`).join('')}<li><a href="#perguntas">Perguntas frequentes</a></li></ol></nav>
  ${a.corpo}
  <section class="faq" aria-labelledby="perguntas"><h2 id="perguntas">Perguntas frequentes</h2>${a.faq.map(([p, r]) => `<details><summary>${esc(p)}</summary><p>${r}</p></details>`).join('')}</section>
  <p class="aviso-info">Este conteúdo é informativo; confira com seu contador. A convenção coletiva da sua categoria pode ter regras próprias. Base: ${esc(a.base)}.</p>
  ${blocoGerador}
  ${blocoPago('artigo', a.slug)}
  ${rel.length ? `<section class="relacionados"><h2>Leia também</h2><div class="cartoes">${rel.map(cartao).join('')}</div></section>` : ''}
</div>
</article>`;
    return pagina({ aba: a.aba, desc: a.descricao, rota: `/blog/${a.slug}`, og, ogAlt: a.titulo, tipo: 'article', corpo,
      dados: [
        { '@context': 'https://schema.org', '@type': 'Article', headline: a.titulo, description: a.descricao, image: [BLOG_URL + og], inLanguage: 'pt-BR',
          datePublished: a.publicado, dateModified: a.atualizado, wordCount: a.palavras, mainEntityOfPage: { '@type': 'WebPage', '@id': url },
          author: { '@type': 'Organization', name: 'Equipe Sua Escala 5x2', url: APP_URL + '/' },
          publisher: { '@type': 'Organization', name: 'Sua Escala 5x2', url: APP_URL + '/', logo: { '@type': 'ImageObject', url: APP_URL + '/img/icone-512.png' } } },
        { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: BLOG_URL + '/' }, { '@type': 'ListItem', position: 2, name: 'Blog', item: BLOG_URL + '/blog' },
          { '@type': 'ListItem', position: 3, name: a.titulo, item: url }] },
        { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: a.faq.map(([p, r]) => ({ '@type': 'Question', name: p, acceptedAnswer: { '@type': 'Answer', text: r.replace(/<[^>]+>/g, '') } })) },
      ] });
  }

  function naoAchou(res) {
    res.status(404).type('html').set('Cache-Control', 'no-store').send(pagina({ aba: 'Página não encontrada | Blog Sua Escala 5x2', rota: '/404', robots: 'noindex',
      desc: 'Esta página não existe.', corpo: `<section class="cab-blog"><div class="wrap"><h1>Esta página não existe</h1><p class="sub">O endereço pode ter mudado. Veja os artigos ou gere sua escala grátis.</p></div></section><section class="wrap"><div class="cartoes lista">${LISTA.slice(0, 3).map(cartao).join('')}</div>${blocoGerador}</section>` }));
  }

  // ---------- rotas (só no Host do blog) ----------
  const r = express.Router({ strict: false });
  const cache = new Map();
  const html = (chave, fn) => (req, res) => {
    const k = chave + (chave.startsWith('g:') ? h1Para(req.query) : '');
    let h = PRODUCAO && cache.get(k);
    if (!h) { h = fn(req); cache.set(k, h); }
    res.type('html').set('Cache-Control', PRODUCAO ? 'public, max-age=300' : 'no-store').send(h);
  };
  r.get('/', html('g:/', req => gerador(req, '/')));
  r.get(['/gerador', '/gerador/'], html('g:/gerador', req => gerador(req, '/gerador')));
  r.get('/blog', html('lista', lista));
  r.get('/blog/', (req, res) => res.redirect(301, '/blog'));
  r.get('/blog/:slug', (req, res) => {
    const a = POR_SLUG.get(String(req.params.slug).toLowerCase());
    if (!a) return naoAchou(res);
    html('a:' + a.slug, () => artigo(a))(req, res);
  });
  r.get('/gerador.js', (_req, res) => res.type('application/javascript').set('Cache-Control', PRODUCAO ? 'public, max-age=600' : 'no-store').send(JS_GERADOR));
  const naoCopiar = (seg ? seg.ROBOTS_BLOQUEADOS : []).map(b => `User-agent: ${b}\nDisallow: /\n\n`).join('');
  r.get('/robots.txt', (_req, res) => res.type('text/plain').send(`${naoCopiar}User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${BLOG_URL}/sitemap.xml\n`));
  r.get('/sitemap.xml', (_req, res) => {
    const hoje = LISTA.reduce((m, a) => a.atualizado > m ? a.atualizado : m, '2026-11-01');
    const itens = [['/', hoje, '1.0'], ['/gerador', hoje, '0.9'], ['/blog', hoje, '0.8'], ...LISTA.map(a => [`/blog/${a.slug}`, a.atualizado, '0.7'])];
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${itens.map(([u, d, p]) => `  <url><loc>${BLOG_URL}${u}</loc><lastmod>${d}</lastmod><priority>${p}</priority></url>`).join('\n')}\n</urlset>\n`);
  });
  // o que o blog usa do app (imagens, motor da escala, rastreio, API) segue normal; o resto das páginas do app fica no domínio principal
  const DO_APP = /^\/(api\/|img\/|rastreio\.js$|pixel\.js$|scheduler\.js$|suporte\.js$|suporte\/faq-vendas\.js$)/;
  r.use((req, res, next) => {
    if (DO_APP.test(req.path) || !['GET', 'HEAD'].includes(req.method)) return next();
    if (req.path.startsWith('/blog/')) return naoAchou(res);
    res.redirect(301, APP_URL + req.originalUrl);
  });

  return { rotas: (req, res, next) => (ehBlog(req) ? r(req, res, next) : next()), ehBlog, ARTIGOS: LISTA, h1Para };
};
module.exports.ARTIGOS = LISTA;
module.exports.h1Para = h1Para;
