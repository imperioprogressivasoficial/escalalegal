// Sua Escala 5x2 — "Seus materiais": Kit RH, Calculadora e Plaquinhas (order bumps do checkout).
// Arquivo independente. Uso: renderizarMateriais(document.getElementById('v-materiais'))
// Comprou: botões de baixar cada arquivo. Não comprou: o que vem e o botão para o checkout.
(function () {
  const CSS = `
.mat{display:grid;gap:16px}
.mat-topo h1{margin:0 0 4px;font:800 1.6rem/1.15 var(--display,"Archivo",Arial,sans-serif);color:var(--tinta,#0c1b33)}
.mat-topo p{margin:0;color:var(--mut,#566173)}
.mat-card{background:#fff;border:1px solid var(--linha,#dfe3ea);border-radius:14px;overflow:hidden}
.mat-cab{display:flex;gap:14px;align-items:flex-start;padding:18px 18px 14px}
.mat-capa{flex:none;width:52px;height:64px;border-radius:6px;background:var(--azul,#1351b4);position:relative;box-shadow:0 6px 14px -8px rgba(7,29,65,.6)}
.mat-capa::before{content:"";position:absolute;left:0;right:0;top:0;height:9px;background:var(--amarelo,#ffcd07);border-radius:6px 6px 0 0}
.mat-capa span{position:absolute;left:6px;right:6px;bottom:7px;color:#fff;font:800 .62rem/1.1 var(--display,"Archivo",Arial,sans-serif);text-transform:uppercase}
.mat-cab h2{margin:0;font:800 1.15rem/1.2 var(--display,"Archivo",Arial,sans-serif);color:var(--tinta,#0c1b33)}
.mat-cab p{margin:4px 0 0;color:var(--texto,#3d4a5c);font-size:.93rem;line-height:1.45}
.mat-selo{display:inline-block;margin-top:8px;font-size:.75rem;font-weight:800;padding:3px 9px;border-radius:99px;background:var(--verde-claro,#e3f5e1);color:var(--verde,#168821)}
.mat-lista{list-style:none;margin:0;padding:0;border-top:1px solid var(--linha,#dfe3ea)}
.mat-lista li{border-bottom:1px solid var(--linha,#dfe3ea)}.mat-lista li:last-child{border-bottom:0}
.mat-lista a{display:flex;align-items:center;gap:12px;padding:12px 18px;text-decoration:none;color:var(--tinta,#0c1b33);font-weight:600;font-size:.94rem}
.mat-lista a:hover{background:var(--cinza,#f3f5f8)}
.mat-lista a.mat-tudo{background:var(--azul-claro,#e8f0fb);font-weight:800}
.mat-logo{flex:none;width:30px;height:30px;object-fit:contain}
.mat-formatos{display:flex;gap:8px;margin-top:10px}.mat-formatos img{width:22px;height:22px;object-fit:contain}
.mat-tipo{flex:none;width:40px;text-align:center;font:800 .62rem/1 var(--corpo,system-ui,sans-serif);padding:4px 0;border-radius:5px;color:var(--mut,#566173);background:var(--cinza,#f3f5f8);letter-spacing:.03em}

.mat-nome{flex:1;min-width:0}.mat-nome small{display:block;color:var(--mut,#566173);font-weight:500;font-size:.78rem}
.mat-baixar{flex:none;color:var(--azul,#1351b4);font-weight:800;font-size:.85rem}
.mat-oferta{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding:14px 18px;border-top:1px solid var(--linha,#dfe3ea);background:var(--cinza,#f3f5f8)}
.mat-preco{font:800 1.25rem/1 var(--display,"Archivo",Arial,sans-serif);color:var(--tinta,#0c1b33)}
.mat-preco small{display:block;font:500 .75rem var(--corpo,system-ui,sans-serif);color:var(--mut,#566173);margin-top:3px}
.mat-comprar{display:inline-block;background:var(--verde,#168821);color:#fff;text-decoration:none;font-weight:800;padding:11px 18px;border-radius:10px}
.mat-nota{font-size:.82rem;color:var(--mut,#566173);margin:0}
.mat-erro{background:var(--vermelho-claro,#fde0e0);color:var(--vermelho,#c4161c);padding:12px 14px;border-radius:10px}
@media (max-width:520px){.mat-cab{padding:16px 14px 12px}.mat-lista a{padding:12px 14px}.mat-oferta{padding:14px}.mat-comprar{width:100%;text-align:center}}`;
  const QUERO = { kit_rh: 'Quero o Kit RH', calculadora: 'Quero a Calculadora', plaquinhas: 'Quero as Plaquinhas' };
  const CAPA = { kit_rh: 'Kit RH', calculadora: 'Calcu&shy;ladora', plaquinhas: 'Plaqui&shy;nhas' };
  // logos oficiais dos formatos (img/formatos: Word, Excel, PowerPoint e PDF do Wikimedia Commons; ZIP é desenho próprio)
  const LOGO = { pdf: 'pdf', docx: 'word', xlsx: 'excel', pptx: 'powerpoint', zip: 'zip' };
  const FORMATOS = { kit_rh: [['word', 'Word'], ['excel', 'Excel'], ['pdf', 'PDF']], calculadora: [['excel', 'Excel'], ['sheets', 'Google Planilhas']], plaquinhas: [['pdf', 'PDF'], ['powerpoint', 'PowerPoint']] };
  const logos = k => (FORMATOS[k] || []).map(([f, n]) => `<img src="/img/formatos/${f}.svg?v=1" alt="${n}" title="${n}" width="22" height="22" loading="lazy">`).join('');
  const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const kb = b => !b ? '' : b > 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  const reais = v => 'R$ ' + Number(v).toFixed(2).replace('.', ',');
  const contaId = () => { try { return typeof conta !== 'undefined' && conta && conta.id ? conta.id : null; } catch { return null; } };

  function estilo() {
    if (document.getElementById('mat-css')) return;
    const s = document.createElement('style'); s.id = 'mat-css'; s.textContent = CSS; document.head.append(s);
  }

  function cartao(x, cid) {
    const capa = `<div class="mat-capa" aria-hidden="true"><span>${CAPA[x.extra] || ''}</span></div>`;
    const cab = `<div class="mat-cab">${capa}<div><h2>${esc(x.nome)}</h2><p>${esc(x.resumo)}</p><span class="mat-formatos">${logos(x.extra)}</span>${x.comprado ? '<span class="mat-selo">Liberado para você</span>' : ''}</div></div>`;
    if (x.comprado) {
      const q = cid ? `?conta=${encodeURIComponent(cid)}` : '';
      const itens = x.arquivos.map(a => `<li><a class="${a.tipo === 'zip' ? 'mat-tudo' : ''}" href="${esc(a.url + q)}" download="${esc(a.arquivo)}">
        <img class="mat-logo" src="/img/formatos/${LOGO[a.tipo] || 'zip'}.svg?v=1" alt="" width="30" height="30" loading="lazy"><span class="mat-tipo ${esc(a.tipo)}">${esc(a.tipo.toUpperCase())}</span>
        <span class="mat-nome">${esc(a.titulo)}${a.bytes ? `<small>${kb(a.bytes)}</small>` : ''}</span>
        <span class="mat-baixar">Baixar</span></a></li>`).join('');
      return `<article class="mat-card">${cab}<ul class="mat-lista">${itens}</ul></article>`;
    }
    return `<article class="mat-card">${cab}<div class="mat-oferta"><div class="mat-preco">${reais(x.preco)}<small>pagamento único, acesso na hora</small></div>
      <a class="mat-comprar" href="${esc(x.checkout)}" target="_blank" rel="noopener">${esc(QUERO[x.extra] || 'Quero este material')}</a></div></article>`;
  }

  async function renderizarMateriais(container) {
    if (!container) return;
    estilo();
    container.innerHTML = '<div class="mat"><p class="mat-nota">Carregando seus materiais...</p></div>';
    const cid = contaId();
    let lista;
    try {
      const r = await fetch('/api/extras', { credentials: 'same-origin', headers: cid ? { 'x-conta': String(cid) } : {} });
      if (r.status === 401) { location.href = '/app'; return; }
      if (!r.ok) throw new Error();
      lista = await r.json();
    } catch {
      container.innerHTML = '<div class="mat"><div class="mat-erro">Não deu para carregar os materiais. Confira a internet e tente de novo.</div></div>';
      return;
    }
    const tem = lista.filter(x => x.comprado), falta = lista.filter(x => !x.comprado);
    container.innerHTML = `<div class="mat">
      <div class="mat-topo"><h1>Seus materiais</h1><p>${tem.length ? 'Baixe quando quiser, quantas vezes precisar.' : 'Materiais prontos para usar junto com a sua escala.'}</p></div>
      ${tem.map(x => cartao(x, cid)).join('')}
      ${falta.length && tem.length ? '<p class="mat-nota" style="margin-top:6px">Também pode ajudar:</p>' : ''}
      ${falta.map(x => cartao(x, cid)).join('')}
      <p class="mat-nota">Os modelos são de referência. Confira com o seu contador ou advogado antes de assinar.</p>
    </div>`;
    return lista;
  }

  window.renderizarMateriais = renderizarMateriais;
})();
