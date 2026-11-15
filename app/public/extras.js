// Sua Escala 5x2 — colocar o app na tela inicial, indique para quem conhece e outra empresa.

// ---------- app na tela inicial (PWA) ----------
let pedidoInstalar = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); pedidoInstalar = e; });
window.addEventListener('appinstalled', () => { gravar('instalado', '1'); toast('Pronto! O ícone está na sua tela inicial.'); });
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
const naTelaInicial = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const ehIphone = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const ehAndroid = () => /android/i.test(navigator.userAgent);
const ehCelular = () => ehIphone() || ehAndroid();
const ICO_COMPARTILHAR = '<svg viewBox="0 0 24 24" width="22" height="22" style="vertical-align:-5px"><path d="M12 3v12M7.5 7.5L12 3l4.5 4.5" fill="none" stroke="#1351b4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2" fill="none" stroke="#1351b4" stroke-width="2" stroke-linecap="round"/></svg>';
const ICO_PONTOS = '<b style="font-size:1.3rem;letter-spacing:-1px;vertical-align:-2px">⋮</b>';
function telaInstalar() {
  const v = $('#v-instalar');
  const passos = l => `<ol class="passos-inst">${l.map((t, i) => `<li><b>${i + 1}</b><span>${t}</span></li>`).join('')}</ol>`;
  let corpo;
  if (naTelaInicial()) corpo = '<div class="nota ok" style="font-size:1rem">Já está na sua tela inicial. Você está usando como aplicativo.</div>';
  else if (pedidoInstalar) corpo = `<p class="sub">Um toque e o ícone aparece junto dos seus aplicativos.</p><button class="btn cheio" id="btnInstalar">Colocar na tela inicial</button>`;
  else if (ehIphone()) corpo = `<p class="sub">No iPhone, use o Safari:</p>${passos([`Toque no botão <b>Compartilhar</b> ${ICO_COMPARTILHAR}, na barra de baixo do Safari.`, 'Role a lista e toque em <b>Adicionar à Tela de Início</b>.', 'Toque em <b>Adicionar</b>, no canto de cima.'])}
    <p class="dica">Se abriu o link pelo WhatsApp ou Instagram, toque nos três pontinhos e escolha <b>Abrir no Safari</b> antes.</p>`;
  else if (ehAndroid()) corpo = `<p class="sub">No Android, use o Chrome:</p>${passos([`Toque nos três pontinhos ${ICO_PONTOS}, no canto de cima.`, 'Toque em <b>Adicionar à tela inicial</b> ou <b>Instalar app</b>.', 'Confirme em <b>Instalar</b> ou <b>Adicionar</b>.'])}
    <p class="dica">Se abriu o link pelo WhatsApp ou Instagram, toque nos três pontinhos e escolha <b>Abrir no Chrome</b> antes.</p>`;
  else corpo = `<p class="sub">No computador, use o Chrome ou o Edge:</p>${passos(['Clique no ícone de instalar, no fim da barra de endereço (um monitor com uma seta).', 'Clique em <b>Instalar</b>.'])}
    <p class="dica">No celular é ainda melhor: abra este endereço no celular e volte aqui em Configurações › Colocar na tela inicial.</p>`;
  v.innerHTML = `<button class="voltar" data-ir="configuracoes">‹ Configurações</button>
    <div class="inst-topo"><img src="/img/icone-192.png?v=20261115b" alt="" width="84" height="84"><div><h1>Coloque o app na tela inicial</h1><p class="dica">Abre como aplicativo, sem baixar em loja e sem ocupar espaço.</p></div></div>
    ${corpo}`;
  if ($('#btnInstalar')) $('#btnInstalar').onclick = async () => { pedidoInstalar.prompt(); const r = await pedidoInstalar.userChoice.catch(() => ({})); pedidoInstalar = null; if (r.outcome === 'accepted') gravar('instalado', '1'); telaInstalar(); };
}
// aviso na escala, só no celular e só até a pessoa instalar ou dispensar
function avisoInstalar() {
  if (naTelaInicial() || !ehCelular() || ler('instalado') || ler('instalarDispensado')) return '';
  return `<div class="aviso azul aviso-inst"><img src="/img/icone-192.png?v=20261115b" alt="" width="44" height="44"><span>Coloque o app na tela inicial do celular, como um aplicativo.</span>
    <div class="lado" style="margin-top:10px;width:100%"><button class="btn pq" data-ir="instalar">Ver como</button><button class="btn pq sec" id="dispInstalar">Agora não</button></div></div>`;
}
document.addEventListener('click', e => { if (e.target.id === 'dispInstalar') { gravar('instalarDispensado', '1'); e.target.closest('.aviso').remove(); } });

// ---------- indique para quem conhece ----------
async function telaIndique() {
  const v = $('#v-indique');
  v.innerHTML = '<p class="dica" style="text-align:center;padding:30px">Carregando…</p>';
  const r = await api('/api/indicacao');
  const msg = `Toda empresa vai ter que mudar a escala para a 5x2 até 15 de dezembro. Achei um app que monta a escala dentro da nova lei em 2 minutos, respondendo umas perguntas. Vale a pena: ${r.link}`;
  v.innerHTML = `    <h1>Indique para quem conhece</h1>
    <p class="sub">Toda empresa com funcionário vai precisar da escala nova. Ajude outros empresários: o dono da loja vizinha, o grupo da associação, os amigos.</p>
    <a class="btn cheio btn-zap" style="margin-top:16px" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener"><img src="/img/formatos/whatsapp-branco.svg?v=20261115b" alt="" width="26" height="26">Mandar no WhatsApp</a>
    ${navigator.share ? '<button class="btn cheio sec" id="indOutros" style="margin-top:8px">Mandar de outro jeito</button>' : ''}
    <label style="margin-top:18px">Ou copie o link</label>
    <div class="ind-link"><input readonly value="${esc(r.link)}" onclick="this.select()"><button class="btn pq sec" id="indCopiar">Copiar</button></div>`;
  $('#indCopiar').onclick = () => copiar(r.link, 'Link copiado.');
  if ($('#indOutros')) $('#indOutros').onclick = () => navigator.share({text: msg}).catch(() => {});
}

// ---------- outra empresa ----------
function folhaOutraEmpresa() {
  folha(`<h2>Cadastrar outra empresa</h2>
    <p style="margin-top:6px">Outro CNPJ, uma empresa da família ou a empresa de um cliente. Cada uma tem as suas lojas, a sua equipe e a sua escala.</p>
    <label for="oeNome">Nome da empresa</label><input id="oeNome" placeholder="Ex.: Padaria Pão Quente" autocomplete="off">
    <p class="erro" id="oeErro"></p>
    <button class="btn cheio" id="oeCriar">Criar e montar a escala</button>`);
  $('#oeNome').focus();
  const criar = async () => {
    try {
      const r = await api('/api/empresas', {method: 'POST', body: {nome: $('#oeNome').value}});
      gravar('conta', r.id); gravar('unidade', ''); location.hash = 'comecar'; location.reload();
    } catch (err) { $('#oeErro').textContent = err.message; }
  };
  $('#oeCriar').onclick = criar;
  $('#oeNome').onkeydown = e => { if (e.key === 'Enter') criar(); };
}
