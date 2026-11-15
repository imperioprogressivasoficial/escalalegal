// Sua Escala 5x2 — a tabela pronta e as saídas: ver, PDF, Excel (.xlsx), imagem (JPG), WhatsApp e texto.
// Tudo é gerado no próprio aparelho, sem biblioteca de fora. Usa as variáveis do app.js (atual, conta, semana, semData...).

// ---------- o período: 4 semanas a partir da semana aberta ----------
async function carregaPeriodo(n = 4) {
  const sems = [];
  for (let k = 0; k < n; k++) {
    const d = soma(semData, 7 * k);
    const r = k === 0 && semana?.inicio === semData ? semana : await api(`/api/equipes/${atual.id}/semana?data=${d}`);
    if (!r.escala) break;
    const e = r.escala;
    sems.push({inicio: d, funcionarios: e.funcionarios, abertos: e.abertos, minimo: e.minimo, linhas: e.dados[r.semana]});
  }
  return sems;
}
const rotuloCel = (c, aberto) => !aberto ? 'Fechado' : c === 'T' ? 'Trabalha' : c === 'F' ? 'FOLGA' : (COD[c] || '');
const fimSemana = w => soma(w.inicio, 6);

// ---------- a lei e o prejuízo: o que o dono precisa saber ----------
function resumoPeriodo(sems) {
  const pessoas = new Map(); let ferTrab = 0;
  const feriados = [];
  for (const w of sems) {
    for (let d = 0; d < 7; d++) { const f = Escala.feriado(soma(w.inicio, d), conta.ctx); if (f && w.abertos[d]) feriados.push({data: soma(w.inicio, d), nome: f}); }
    w.funcionarios.forEach((f, i) => {
      const p = pessoas.get(f.id) || {nome: f.nome, folgas: 0, dom: 0, fer: 0, dias: 0};
      w.linhas[i].forEach((c, d) => {
        if (!w.abertos[d]) return;
        if (c === 'F') p.folgas++;
        if (c === 'T') { p.dias++; if (d === 6) p.dom++; if (Escala.feriado(soma(w.inicio, d), conta.ctx)) { p.fer++; ferTrab++; } }
      });
      pessoas.set(f.id, p);
    });
  }
  // análise da lei nas semanas seguidas com a mesma equipe
  const ids = w => w.funcionarios.map(f => f.id).join(',');
  const mesma = []; for (const w of sems) { if (mesma.length && ids(w) !== ids(mesma[0])) break; mesma.push(w); }
  const a = mesma.length ? Escala.analisar({inicio: mesma[0].inicio, semanas: mesma.length, funcionarios: mesma[0].funcionarios, abertos: mesma[0].abertos, minimo: mesma[0].minimo, dados: mesma.map(w => w.linhas)}, opcoesAnalise(atual)) : null;
  const s = seg(atual.setor), ds = Escala.domingoSemanasDe(atual.setor), lim = Escala.limiteSemanal(sems[0].inicio);
  const h = +atual.horas_dia || 8;
  const regras = [
    'Cada pessoa tem 2 folgas por semana. Ninguém trabalha 6 dias seguidos (Emenda 141/2026).',
    `${String(h).replace('.', ',')}h por dia, ${String(h * 5).replace('.', ',')}h por semana. O limite agora é ${lim}h${lim > 40 ? ` e cai para ${lim === 44 ? '42h em 15/12/2026 e 40h em 15/12/2027' : '40h em 15/12/2027'}` : ''}. Sem reduzir salário.`,
    `Domingo: cada pessoa folga pelo menos 1 domingo a cada ${ds} semanas${s.comercio ? ' (comércio, Lei 10.101)' : ' (Portaria do Ministério do Trabalho)'}.`,
    'Feriado trabalhado: pague o dia em dobro ou dê outra folga na mesma semana (Lei 605/49).',
    'Entre um dia e outro, a pessoa descansa pelo menos 11 horas (CLT, art. 66).',
  ];
  const problemas = a ? a.itens.filter(i => i.ok === false) : [];
  return {pessoas: [...pessoas.values()], ferTrab, feriados, regras, problemas, ok: !problemas.length};
}

function htmlPrejuizo(r) {
  return `<div class="cartao prejuizo">
    <div class="diag-topo ${r.ok ? 'ok' : 'ruim'}"><img src="/img/mascote.svg?v=20261115b" alt=""><div><b>${r.ok ? 'Essa escala está dentro da lei' : `${plural(r.problemas.length, 'ponto precisa', 'pontos precisam')} de atenção`}</b>Como ela funciona para você não ter prejuízo</div></div>
    ${r.problemas.length ? `<ul class="diag">${r.problemas.map(i => `<li><span class="ic ruim">!</span><div><b>${esc(i.titulo)}</b><span>${esc(i.texto)}</span></div></li>`).join('')}</ul>` : ''}
    <ul class="diag" style="margin-top:8px">${r.regras.map(t => `<li><span class="ic ok">✓</span><div><span>${esc(t)}</span></div></li>`).join('')}</ul>
    ${r.feriados.length ? `<div class="nota" style="margin-top:12px"><b>Feriados no período:</b> ${r.feriados.map(f => `${dm(f.data)} (${esc(f.nome)})`).join(', ')}. ${r.ferTrab ? `São ${plural(r.ferTrab, 'dia trabalhado', 'dias trabalhados')} em feriado: pague em dobro ou dê outra folga.` : 'Ninguém trabalha nesses dias.'}</div>` : ''}
    <h3 style="margin:16px 0 8px">Cada colaborador no período</h3>
    <div class="rolagem"><table class="tab"><thead><tr><th>Colaborador</th><th class="n">Trabalhou</th><th class="n">Folgas</th><th class="n">Domingos</th><th class="n">Feriados</th></tr></thead>
    <tbody>${r.pessoas.map(p => `<tr><td><b>${esc(p.nome)}</b></td><td class="n">${p.dias}</td><td class="n">${p.folgas}</td><td class="n">${p.dom}</td><td class="n">${p.fer ? `<b style="color:#8a5a00">${p.fer}</b>` : 0}</td></tr>`).join('')}</tbody></table></div>
  </div>`;
}

// ---------- folha: baixar ou enviar ----------
// cada saída: código, selo do formato, título e para que serve
const SAIDAS = {
  zap: ['WhatsApp', 'WhatsApp', 'A escala como imagem'],
  link: ['LINK', 'Link da equipe', 'Cada colaborador vê as próprias folgas'],
  copiar: ['TEXTO', 'Copiar texto', 'Para colar em qualquer mensagem'],
  pdf: ['PDF', 'PDF', 'Para imprimir ou arquivar'],
  xlsx: ['XLSX', 'Excel', 'Planilha com as cores'],
  csv: ['CSV', 'CSV', 'Abre em qualquer planilha'],
  sheets: ['SHEETS', 'Google Planilhas', 'Na sua planilha, sempre atualizada'],
  jpg: ['JPG', 'Imagem', 'Foto da tabela'],
  imprimir: ['IMPRIMIR', 'Imprimir', 'Para o mural'],
};
function botoesExportar() {
  const LOGO = {zap: 'whatsapp', link: 'link', copiar: 'texto', pdf: 'pdf', xlsx: 'excel', csv: 'csv', sheets: 'sheets', jpg: 'jpg', imprimir: 'imprimir'};
  const ed = podeEditar(), tile = k => `<button class="tile" data-x="${k}"><img class="logo" src="/img/formatos/${LOGO[k]}.svg?v=20261115b" alt=""><span><b>${SAIDAS[k][1]}</b><small>${SAIDAS[k][2]}</small></span></button>`;
  return `<p class="saida-tit">Compartilhar com a equipe</p><div class="tiles">${['zap', ...(ed ? ['link'] : []), 'copiar'].map(tile).join('')}</div>
    <p class="saida-tit">Arquivos e contabilidade</p><div class="tiles">${['pdf', 'xlsx', ...(ed ? ['sheets'] : []), 'jpg', 'imprimir', 'csv'].map(tile).join('')}</div>`;
}
function folhaExportar() {
  folha(`<h2>Publicar e compartilhar</h2><p style="margin-top:4px" class="dica">4 semanas a partir de ${dm(semData)}, com o resumo da lei.</p>
    <button class="previa" data-ir="escala/mes"><img id="previaImg" alt="Prévia da escala"><span>Ver as 4 semanas ›</span></button>
    ${botoesExportar()}`);
  ligaExportar(null);
  // prévia: a primeira semana como imagem, para a pessoa ver o que vai mandar
  carregaPeriodo(1).then(s => s.length && canvasDaEscala(s, false)).then(cv => { if (cv && $('#previaImg')) $('#previaImg').src = cv.toDataURL('image/jpeg', .7); }).catch(() => {});
}
async function folhaSheets() {
  const {link} = await api(`/api/equipes/${atual.id}/link`, {method: 'POST', body: {}});
  const url = link.replace('/e/', '/api/publico/planilha/'), formula = `=IMPORTDATA("${url}")`;
  folha(`<h2>Escala no Google Planilhas</h2>
    <p style="margin-top:6px">A escala vai para uma planilha sua e <b>se atualiza sozinha</b> quando você mudar alguma folga aqui.</p>
    <ol class="passos-sheets"><li>Toque no botão verde. Ele copia a escala e abre uma planilha nova.</li><li>Na planilha, toque na primeira célula (A1).</li><li>Cole (no celular: segure o dedo na célula e toque em <b>Colar</b>).</li></ol>
    <button class="btn cheio" id="shAbrir">Copiar e abrir o Google Planilhas</button>
    <p class="dica" style="margin-top:12px">O Google confere a escala de hora em hora. Quem tiver o link vê a escala, como no link da equipe.</p>
    <details style="margin-top:10px"><summary class="link">Ver o que vai ser colado</summary><input readonly value="${esc(formula)}" style="margin-top:8px;font-size:.85rem" onclick="this.select()"></details>`);
  $('#shAbrir').onclick = async () => {
    try { await navigator.clipboard.writeText(formula); } catch { prompt('Copie e cole na célula A1:', formula); }
    window.open('https://sheets.new', '_blank', 'noopener');
    $('#shAbrir').textContent = 'Copiado! Agora cole na célula A1';
  };
}
function ligaExportar(semsProntas) {
  $$('[data-x]').forEach(b => b.onclick = async () => {
    const tipo = b.dataset.x, txt = b.innerHTML;
    window.marcaEnviada?.(); // conta como escala enviada no progresso da tela inicial
    if (tipo === 'link') return folhaLink();
    if (tipo === 'sheets') { try { return await folhaSheets(); } catch (err) { return toast(err.message); } }
    const sm = b.querySelector('small'), antes = sm?.textContent; b.disabled = true; if (sm) sm.textContent = 'Preparando…';
    try {
      const sems = semsProntas || await carregaPeriodo();
      if (!sems.length) throw new Error('Ainda não tem escala para baixar.');
      const nome = `escala-${slug(atual.nome)}-${sems[0].inicio}`;
      if (tipo === 'pdf') baixar(await pdfDaEscala(sems), nome + '.pdf');
      else if (tipo === 'xlsx') baixar(xlsxDaEscala(sems), nome + '.xlsx');
      else if (tipo === 'csv') baixar(csvDaEscala(sems), nome + '.csv');
      else if (tipo === 'jpg') baixar(await jpgDaEscala(sems), nome + '.jpg');
      else if (tipo === 'copiar') await copiar(textoDaEscala(sems), 'Copiado. Cole no WhatsApp ou onde quiser.');
      else if (tipo === 'imprimir') { if ($('#folha').open) fechaFolha(); imprimirSems(sems); }
      else if (tipo === 'zap') await enviaZap(sems, nome);
      if (['pdf', 'xlsx', 'csv', 'jpg'].includes(tipo)) toast('Baixado. Olhe na pasta de downloads.');
    } catch (err) { toast(err.message); }
    b.disabled = false; if (sm) sm.textContent = antes;
  });
}
// link da equipe: cada colaborador abre, toca no próprio nome e vê as folgas
async function folhaLink() {
  try {
    const {link} = await api(`/api/equipes/${atual.id}/link`, {method: 'POST', body: {}});
    const msg = `Escala da equipe: ${link}\nAbra o link e toque no seu nome para ver suas folgas.`;
    if (navigator.share) { try { await navigator.share({text: msg}); return; } catch (e) { if (e.name === 'AbortError') return; } }
    folha(`<h2>Link da equipe</h2><p style="margin-top:6px">Cada colaborador abre o link, toca no próprio nome e vê as folgas. Não é preciso instalar nada.</p>
      <div class="opcoes-grandes"><a class="btn cheio btn-zap" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener"><img src="/img/formatos/whatsapp-branco.svg" alt="" width="26" height="26">Enviar no WhatsApp</a>
      <button id="lkCopiar">Copiar o link</button></div><button class="link" id="lkVolta" style="margin-top:12px">‹ Outras formas de publicar</button>`);
    $('#lkCopiar').onclick = () => copiar(msg, 'Link copiado. Cole no grupo da equipe.');
    $('#lkVolta').onclick = folhaExportar;
  } catch (err) { toast(err.message); }
}
const slug = t => String(t || 'escala').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'escala';
function baixar(blob, nome) {
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = nome; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
async function enviaZap(sems, nome) {
  const blob = await jpgDaEscala(sems), arq = new File([blob], nome + '.jpg', {type: 'image/jpeg'});
  const texto = `Escala de ${atual.nome}: ${br(sems[0].inicio)} a ${br(fimSemana(sems[sems.length - 1]))}`;
  if (navigator.canShare?.({files: [arq]})) { try { await navigator.share({files: [arq], text: texto}); return; } catch (e) { if (e.name === 'AbortError') return; } }
  baixar(blob, nome + '.jpg');
  window.open(`https://wa.me/?text=${encodeURIComponent(texto + '\n\n' + textoDaEscala(sems))}`, '_blank', 'noopener');
  toast('A imagem foi baixada. No WhatsApp, anexe a imagem ou mande o texto.');
}
function textoDaEscala(sems) {
  let t = `*${atual.nome} — Escala*\n`;
  for (const w of sems) {
    t += `\n*Semana de ${dm(w.inicio)} a ${dm(fimSemana(w))}*\n`;
    w.linhas.forEach((l, f) => {
      const folgas = l.map((c, d) => c === 'F' && w.abertos[d] ? `${DIAS[d].toLowerCase()} ${dm(soma(w.inicio, d))}` : null).filter(Boolean);
      const fora = [...new Set(l.map(c => COD[c]).filter(Boolean))];
      t += `${w.funcionarios[f].nome}: ${folgas.length ? 'folga ' + folgas.join(' e ') : 'sem folga'}${fora.length ? ` (${fora.join(', ').toLowerCase()})` : ''}\n`;
    });
  }
  return t + '\nFeita na Sua Escala 5x2, dentro da nova lei.';
}
function imprimirSems(sems) {
  $('#areaImpressao').innerHTML = sems.map(w => `<h2>${esc(atual.nome)} · semana de ${br(w.inicio)} a ${br(fimSemana(w))}</h2><table><thead><tr><th></th>${DIAS.map((d, i) => `<th>${d} ${dm(soma(w.inicio, i))}</th>`).join('')}</tr></thead><tbody>
    ${w.linhas.map((l, f) => `<tr><td>${esc(w.funcionarios[f].nome)}</td>${l.map((c, d) => `<td class="${w.abertos[d] ? c : ''}">${!w.abertos[d] ? '–' : c === 'T' ? '' : c === 'F' ? 'FOLGA' : esc(COD[c] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`).join('')
    + '<p style="font-size:.8rem">Trabalha = em branco. FOLGA = dia de folga. Feito na Sua Escala 5x2, dentro da nova lei.</p>';
  window.print();
}

// ---------- imagem (canvas): usada no JPG, no PDF e no WhatsApp ----------
const COR = {T: ['#e8f0fb', '#1351b4'], F: ['#ffcd07', '#4a3a00'], A: ['#ece7fb', '#4b2a9a'], fc: ['#f3f5f8', '#9aa3b2']};
function desenhaBloco(ctx, x0, y0, W, w) {
  const nomeW = 250, colW = (W - nomeW) / 7, linH = 46;
  let y = y0;
  ctx.fillStyle = '#0c1b33'; ctx.font = '800 26px Archivo, Arial, sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText(`Semana de ${dm(w.inicio)} a ${dm(fimSemana(w))}`, x0, y + 18); y += 48;
  ctx.font = '700 17px "Public Sans", Arial, sans-serif'; ctx.textAlign = 'center';
  DIAS.forEach((d, i) => {
    const data = soma(w.inicio, i), f = Escala.feriado(data, conta.ctx), cx = x0 + nomeW + colW * i + colW / 2;
    ctx.fillStyle = f ? '#8a5a00' : '#3d4a5c'; ctx.fillText(d, cx, y + 12);
    ctx.font = '500 14px "Public Sans", Arial, sans-serif'; ctx.fillText(dm(data) + (f ? ' feriado' : ''), cx, y + 32); ctx.font = '700 17px "Public Sans", Arial, sans-serif';
  });
  y += 48;
  w.linhas.forEach((l, f) => {
    ctx.fillStyle = f % 2 ? '#ffffff' : '#fafbfc'; ctx.fillRect(x0, y, W, linH);
    ctx.fillStyle = '#0c1b33'; ctx.textAlign = 'left'; ctx.font = '700 18px "Public Sans", Arial, sans-serif';
    let nome = w.funcionarios[f].nome; while (ctx.measureText(nome).width > nomeW - 16 && nome.length > 3) nome = nome.slice(0, -2) + '…';
    ctx.fillText(nome, x0 + 8, y + linH / 2);
    l.forEach((c, d) => {
      const k = !w.abertos[d] ? 'fc' : COD[c] ? 'A' : c, [fundo, tinta] = COR[k] || COR.T, cx = x0 + nomeW + colW * d;
      ctx.fillStyle = fundo; arred(ctx, cx + 4, y + 5, colW - 8, linH - 10, 8);
      ctx.fillStyle = tinta; ctx.textAlign = 'center'; ctx.font = `${c === 'F' ? 800 : 600} 16px "Public Sans", Arial, sans-serif`;
      ctx.fillText(rotuloCel(c, w.abertos[d]), cx + colW / 2, y + linH / 2);
    });
    y += linH;
  });
  ctx.font = '700 15px "Public Sans", Arial, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#6b778a'; ctx.fillText('Trabalhando (mín.)', x0 + 8, y + 20);
  DIAS.forEach((_, d) => {
    if (!w.abertos[d]) return; const p = w.linhas.filter(x => x[d] === 'T').length, ok = p >= w.minimo[d];
    ctx.fillStyle = ok ? '#168821' : '#c4161c'; ctx.textAlign = 'center'; ctx.fillText(`${p} (mín. ${w.minimo[d]})`, x0 + nomeW + colW * d + colW / 2, y + 20);
  });
  return y + 40 - y0;
}
function arred(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.fill(); }
function quebra(ctx, texto, larg) { const palavras = texto.split(' '), linhas = []; let l = ''; for (const p of palavras) { const t = l ? l + ' ' + p : p; if (ctx.measureText(t).width > larg && l) { linhas.push(l); l = p; } else l = t; } if (l) linhas.push(l); return linhas; }
async function canvasDaEscala(sems, comLei = true) {
  try { await Promise.all(['800 26px Archivo', '700 18px "Public Sans"', '500 14px "Public Sans"'].map(f => document.fonts.load(f))); } catch {}
  const W = 1240, M = 40, esc2 = 2, r = resumoPeriodo(sems);
  const medir = document.createElement('canvas').getContext('2d'); medir.font = '500 17px "Public Sans", Arial, sans-serif';
  const leiLinhas = comLei ? [...(r.problemas.length ? r.problemas.map(p => '! ' + p.titulo) : ['✓ Dentro da lei']), ...r.regras.map(t => '• ' + t),
    ...(r.ferTrab ? [`• Neste período: ${plural(r.ferTrab, 'dia trabalhado', 'dias trabalhados')} em feriado. Pague em dobro ou dê outra folga.`] : [])].flatMap(t => quebra(medir, t, W - 2 * M)) : [];
  const altBlocos = sems.map(w => 48 + 48 + w.linhas.length * 46 + 40 + 30);
  const H = 90 + altBlocos.reduce((a, b) => a + b, 0) + (comLei ? 50 + leiLinhas.length * 26 : 0) + 50;
  const cv = document.createElement('canvas'); cv.width = W * esc2; cv.height = H * esc2;
  const ctx = cv.getContext('2d'); ctx.scale(esc2, esc2);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#071d41'; ctx.fillRect(0, 0, W, 70);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.font = '800 26px Archivo, Arial, sans-serif';
  ctx.fillStyle = '#fff'; ctx.fillText('SuaEscala', M, 35); const lx = M + ctx.measureText('SuaEscala').width; ctx.fillStyle = '#7be08a'; ctx.fillText('5x2', lx, 35);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.font = '700 20px "Public Sans", Arial, sans-serif'; ctx.fillText(atual.nome, W - M, 35);
  let y = 90;
  sems.forEach((w, i) => { desenhaBloco(ctx, M, y, W - 2 * M, w); y += altBlocos[i]; });
  if (comLei) {
    ctx.fillStyle = r.ok ? '#e3f5e1' : '#fff5c2'; arred(ctx, M - 10, y - 6, W - 2 * M + 20, 50 + leiLinhas.length * 26, 14);
    ctx.textAlign = 'left'; ctx.fillStyle = '#0c1b33'; ctx.font = '800 22px Archivo, Arial, sans-serif'; ctx.fillText('Como funciona para você não ter prejuízo', M, y + 18); y += 46;
    ctx.font = '500 17px "Public Sans", Arial, sans-serif'; ctx.fillStyle = '#3d4a5c';
    leiLinhas.forEach(l => { ctx.fillText(l, M, y); y += 26; });
  }
  ctx.textAlign = 'center'; ctx.fillStyle = '#6b778a'; ctx.font = '500 14px "Public Sans", Arial, sans-serif';
  ctx.fillText(`Feita em ${br(hojeIso())} na Sua Escala 5x2 · suaescala5x2.com.br`, W / 2, H - 22);
  return cv;
}
const jpgBlob = cv => new Promise(res => cv.toBlob(res, 'image/jpeg', 0.9));
async function jpgDaEscala(sems) { return jpgBlob(await canvasDaEscala(sems)); }

// ---------- PDF: uma página por semana + a página da lei (feito à mão, sem biblioteca) ----------
async function pdfDaEscala(sems) {
  const paginas = [];
  for (const w of sems) paginas.push(await canvasDaEscala([w], false));
  paginas.push(await canvasLei(sems));
  const imgs = [];
  for (const cv of paginas) imgs.push({bytes: new Uint8Array(await (await jpgBlob(cv)).arrayBuffer()), w: cv.width, h: cv.height});
  return pdfDeJpegs(imgs);
}
async function canvasLei(sems) {
  const r = resumoPeriodo(sems), W = 1240, M = 40, esc2 = 2;
  const medir = document.createElement('canvas').getContext('2d'); medir.font = '500 18px "Public Sans", Arial, sans-serif';
  const linhas = [...r.problemas.flatMap(p => quebra(medir, `! ${p.titulo}: ${p.texto}`, W - 2 * M)), ...r.regras.flatMap(t => quebra(medir, '✓ ' + t, W - 2 * M))];
  const H = 140 + linhas.length * 28 + 70 + r.pessoas.length * 34 + 60;
  const cv = document.createElement('canvas'); cv.width = W * esc2; cv.height = H * esc2;
  const ctx = cv.getContext('2d'); ctx.scale(esc2, esc2); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillStyle = '#0c1b33'; ctx.font = '800 30px Archivo, Arial, sans-serif'; ctx.fillText(r.ok ? 'Essa escala está dentro da lei' : 'Pontos de atenção na escala', M, 50);
  ctx.font = '500 18px "Public Sans", Arial, sans-serif'; ctx.fillStyle = '#6b778a'; ctx.fillText(`${atual.nome} · ${br(sems[0].inicio)} a ${br(fimSemana(sems[sems.length - 1]))}`, M, 88);
  let y = 130; ctx.fillStyle = '#3d4a5c';
  linhas.forEach(l => { ctx.fillStyle = l.startsWith('!') ? '#c4161c' : '#3d4a5c'; ctx.fillText(l, M, y); y += 28; });
  y += 30; ctx.font = '700 17px "Public Sans", Arial, sans-serif'; ctx.fillStyle = '#6b778a';
  const cols = [['Pessoa', M], ['Dias trabalhados', 520], ['Folgas', 720], ['Domingos trab.', 860], ['Feriados trab.', 1040]];
  cols.forEach(([t, x]) => ctx.fillText(t, x, y)); y += 34;
  ctx.font = '500 17px "Public Sans", Arial, sans-serif';
  r.pessoas.forEach((p, i) => { if (i % 2 === 0) { ctx.fillStyle = '#f6f7f9'; ctx.fillRect(M - 6, y - 16, W - 2 * M + 12, 32); } ctx.fillStyle = '#0c1b33'; [p.nome, p.dias, p.folgas, p.dom, p.fer].forEach((v, k) => ctx.fillText(String(v), cols[k][1], y)); y += 34; });
  return cv;
}
function pdfDeJpegs(imgs) {
  const enc = new TextEncoder(), partes = [], offs = []; let pos = 0;
  const add = x => { const b = typeof x === 'string' ? enc.encode(x) : x; partes.push(b); pos += b.length; };
  const obj = (num, corpo) => { offs[num] = pos; add(`${num} 0 obj\n`); corpo(); add('\nendobj\n'); };
  const n = imgs.length, P = [842, 595], m = 24;
  add('%PDF-1.4\n');
  obj(1, () => add('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => add(`<< /Type /Pages /Kids [${imgs.map((_, i) => `${3 + 3 * i} 0 R`).join(' ')}] /Count ${n} >>`));
  imgs.forEach((im, i) => {
    const sc = Math.min((P[0] - 2 * m) / im.w, (P[1] - 2 * m) / im.h), w = im.w * sc, h = im.h * sc, x = (P[0] - w) / 2, y = P[1] - m - h;
    obj(3 + 3 * i, () => add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${P[0]} ${P[1]}] /Resources << /XObject << /Im${i} ${5 + 3 * i} 0 R >> >> /Contents ${4 + 3 * i} 0 R >>`));
    const cs = `q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im${i} Do Q`;
    obj(4 + 3 * i, () => add(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`));
    obj(5 + 3 * i, () => { add(`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>\nstream\n`); add(im.bytes); add('\nendstream'); });
  });
  const xref = pos, total = 3 + 3 * n;
  add(`xref\n0 ${total}\n0000000000 65535 f \n`);
  for (let k = 1; k < total; k++) add(String(offs[k]).padStart(10, '0') + ' 00000 n \n');
  add(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(partes, {type: 'application/pdf'});
}

// ---------- Excel (.xlsx): planilha de verdade, com cores (zip feito à mão) ----------
const xmlEsc = t => String(t ?? '').replace(/[<>&"]/g, c => ({'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;'}[c]));
const colL = i => String.fromCharCode(65 + i);
function xlsxDaEscala(sems) {
  const r = resumoPeriodo(sems), linhas = []; let n = 0;
  const linha = cels => { n++; linhas.push(`<row r="${n}">${cels.map((c, i) => c == null ? '' : typeof c.v === 'number' ? `<c r="${colL(i)}${n}" s="${c.s || 0}"><v>${c.v}</v></c>` : `<c r="${colL(i)}${n}" t="inlineStr" s="${c.s || 0}"><is><t xml:space="preserve">${xmlEsc(c.v)}</t></is></c>`).join('')}</row>`); };
  const t = (v, s) => ({v, s});
  linha([t(`${atual.nome} — Escala ${br(sems[0].inicio)} a ${br(fimSemana(sems[sems.length - 1]))}`, 2)]);
  linha([t('Feita na Sua Escala 5x2, dentro da nova lei (Emenda 141/2026).', 0)]);
  for (const w of sems) {
    linha([]); linha([t(`Semana de ${dm(w.inicio)} a ${dm(fimSemana(w))}`, 1)]);
    linha([t('Pessoa', 6), ...DIAS.map((d, i) => { const data = soma(w.inicio, i), f = Escala.feriado(data, conta.ctx); return t(`${d} ${dm(data)}${f ? ' (feriado)' : ''}`, 6); })]);
    w.linhas.forEach((l, f) => linha([t(w.funcionarios[f].nome, 7), ...l.map((c, d) => t(rotuloCel(c, w.abertos[d]), !w.abertos[d] ? 8 : c === 'F' ? 3 : c === 'T' ? 4 : 5))]));
    linha([t('Trabalhando (mínimo)', 7), ...DIAS.map((_, d) => w.abertos[d] ? t(`${w.linhas.filter(x => x[d] === 'T').length} (mín. ${w.minimo[d]})`, 6) : t('–', 8))]);
  }
  linha([]); linha([t('Como funciona para você não ter prejuízo', 2)]);
  linha([t(r.ok ? 'Essa escala está dentro da lei.' : `${plural(r.problemas.length, 'ponto precisa', 'pontos precisam')} de atenção:`, 1)]);
  r.problemas.forEach(p => linha([t(`! ${p.titulo}: ${p.texto}`, 0)]));
  r.regras.forEach(x => linha([t('• ' + x, 0)]));
  if (r.ferTrab) linha([t(`• Neste período: ${plural(r.ferTrab, 'dia trabalhado', 'dias trabalhados')} em feriado. Pague em dobro ou dê outra folga.`, 0)]);
  linha([]); linha([t('Pessoa', 6), t('Dias trabalhados', 6), t('Folgas', 6), t('Domingos trabalhados', 6), t('Feriados trabalhados', 6)]);
  r.pessoas.forEach(p => linha([t(p.nome, 7), t(p.dias, 6), t(p.folgas, 6), t(p.dom, 6), t(p.fer, 6)]));
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="28" customWidth="1"/><col min="2" max="8" width="16" customWidth="1"/></cols><sheetData>${linhas.join('')}</sheetData><pageSetup orientation="landscape" fitToWidth="1"/></worksheet>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font></fonts>
<fills count="6"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFFCD07"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8F0FB"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFECE7FB"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF3F5F8"/></patternFill></fill></fills>
<borders count="2"><border/><border><left style="thin"><color rgb="FFDFE3EA"/></left><right style="thin"><color rgb="FFDFE3EA"/></right><top style="thin"><color rgb="FFDFE3EA"/></top><bottom style="thin"><color rgb="FFDFE3EA"/></bottom></border></borders>
<cellStyleXfs count="1"><xf/></cellStyleXfs>
<cellXfs count="9"><xf/><xf fontId="1" applyFont="1"/><xf fontId="2" applyFont="1"/>
<xf fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
<xf fillId="3" borderId="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
<xf fillId="4" borderId="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
<xf fontId="1" borderId="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
<xf fontId="1" borderId="1" applyFont="1" applyBorder="1"/>
<xf fillId="5" borderId="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf></cellXfs>
</styleSheet>`;
  const ns = 'http://schemas.openxmlformats.org';
  return zipar([
    {nome: '[Content_Types].xml', texto: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="${ns}/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`},
    {nome: '_rels/.rels', texto: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${ns}/package/2006/relationships"><Relationship Id="rId1" Type="${ns}/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
    {nome: 'xl/workbook.xml', texto: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="${ns}/spreadsheetml/2006/main" xmlns:r="${ns}/officeDocument/2006/relationships"><sheets><sheet name="Escala" sheetId="1" r:id="rId1"/></sheets></workbook>`},
    {nome: 'xl/_rels/workbook.xml.rels', texto: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${ns}/package/2006/relationships"><Relationship Id="rId1" Type="${ns}/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${ns}/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`},
    {nome: 'xl/styles.xml', texto: styles},
    {nome: 'xl/worksheets/sheet1.xml', texto: sheet},
  ], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}
const TAB_CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = TAB_CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zipar(arquivos, tipo) {
  const enc = new TextEncoder(), partes = [], central = []; let off = 0;
  for (const a of arquivos) {
    const nome = enc.encode(a.nome), dados = enc.encode(a.texto), crc = crc32(dados);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, 0, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true); h.setUint32(18, dados.length, true); h.setUint32(22, dados.length, true);
    h.setUint16(26, nome.length, true); h.setUint16(28, 0, true);
    partes.push(new Uint8Array(h.buffer), nome, dados);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
    c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, dados.length, true); c.setUint32(24, dados.length, true);
    c.setUint16(28, nome.length, true); c.setUint32(42, off, true);
    central.push(new Uint8Array(c.buffer), nome);
    off += 30 + nome.length + dados.length;
  }
  const tamC = central.reduce((s, b) => s + b.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, arquivos.length, true); e.setUint16(10, arquivos.length, true); e.setUint32(12, tamC, true); e.setUint32(16, off, true);
  return new Blob([...partes, ...central, new Uint8Array(e.buffer)], {type: tipo});
}

// ---------- CSV: separado por ponto e vírgula, com BOM, para o Excel brasileiro abrir certo ----------
function csvDaEscala(sems) {
  const c = v => `"${String(v ?? '').replace(/"/g, '""')}"`, L = [];
  for (const w of sems) {
    L.push(['Semana', 'Pessoa', ...DIAS.map((d, i) => `${d} ${dm(soma(w.inicio, i))}${Escala.feriado(soma(w.inicio, i), conta.ctx) ? ' (feriado)' : ''}`)]);
    w.linhas.forEach((l, f) => L.push([`${dm(w.inicio)} a ${dm(fimSemana(w))}`, w.funcionarios[f].nome, ...l.map((x, d) => rotuloCel(x, w.abertos[d]))]));
    L.push([]);
  }
  return new Blob(['\ufeff' + L.map(l => l.map(c).join(';')).join('\r\n')], {type: 'text/csv;charset=utf-8'});
}
