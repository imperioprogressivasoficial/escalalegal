// Sua Escala 5x2 — Word (.docx) e PowerPoint (.pptx) da escala, montados à mão (sem biblioteca), no navegador e no Node.
// Entrada (dados): { empresa, unidade, periodo, semanas: [{ titulo, dias: ['Seg 16/11', ...], feriados: [bool x7],
//   linhas: [{ nome, cels: [{ txt, tipo }] }], total: ['4 (mín. 2)', ...] }] }  — tipo: 'T' trabalha, 'F' folga, 'A' ausência, 'X' fechado
(function (root) {
  const esc = t => String(t ?? '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  const COR = { T: ['E8F0FB', '1351B4'], F: ['FFCD07', '4A3A00'], A: ['ECE7FB', '4B2A9A'], X: ['F3F5F8', '9AA3B2'] };
  const NS = 'http://schemas.openxmlformats.org';
  const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const RODAPE = 'Escala dentro da EC 141/2026 · Sua Escala 5x2';

  // ---------------- Word ----------------
  function arquivosDocx(d) {
    const W = 'w';
    const run = (txt, { b, cor, tam } = {}) => `<w:r><w:rPr>${b ? '<w:b/>' : ''}${cor ? `<w:color w:val="${cor}"/>` : ''}${tam ? `<w:sz w:val="${tam}"/>` : ''}<w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:t xml:space="preserve">${esc(txt)}</w:t></w:r>`;
    const par = (conteudo, { centro, antes = 0, depois = 80 } = {}) => `<w:p><w:pPr><w:spacing w:before="${antes}" w:after="${depois}"/>${centro ? '<w:jc w:val="center"/>' : ''}</w:pPr>${conteudo}</w:p>`;
    const cel = (txt, larg, { fundo, cor, b, centro = true } = {}) => `<w:tc><w:tcPr><w:tcW w:w="${larg}" w:type="dxa"/>${fundo ? `<w:shd w:val="clear" w:color="auto" w:fill="${fundo}"/>` : ''}<w:vAlign w:val="center"/></w:tcPr>${par(run(txt, { b, cor, tam: 18 }), { centro, depois: 0 })}</w:tc>`;
    const borda = s => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="DFE3EA"/>`;
    const blocos = d.semanas.map((s, i) => {
      const larg = [2800, ...Array(7).fill(1750)];
      const cab = `<w:tr><w:trPr><w:tblHeader/></w:trPr>${cel('Colaborador', larg[0], { b: true, centro: false })}${s.dias.map((t, k) => cel(t + (s.feriados[k] ? ' · feriado' : ''), larg[k + 1], { b: true, cor: s.feriados[k] ? '8A5A00' : '0C1B33' })).join('')}</w:tr>`;
      const corpo = s.linhas.map(l => `<w:tr>${cel(l.nome, larg[0], { b: true, centro: false })}${l.cels.map((c, k) => cel(c.txt, larg[k + 1], { fundo: COR[c.tipo]?.[0], cor: COR[c.tipo]?.[1], b: c.tipo === 'F' })).join('')}</w:tr>`).join('');
      const tot = s.total ? `<w:tr>${cel('Trabalhando (mínimo)', larg[0], { b: true, centro: false })}${s.total.map((t, k) => cel(t, larg[k + 1], { cor: '168821' })).join('')}</w:tr>` : '';
      return `${i ? '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' : ''}
        ${par(run(d.empresa, { b: true, tam: 32, cor: '0C1B33' }), { depois: 40 })}
        ${par(run(`${d.unidade} · ${s.titulo}`, { tam: 22, cor: '566173' }), { depois: 160 })}
        <w:tbl><w:tblPr><w:tblW w:w="${larg.reduce((a, b) => a + b, 0)}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(borda).join('')}</w:tblBorders><w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/></w:tblCellMar></w:tblPr>
        <w:tblGrid>${larg.map(x => `<w:gridCol w:w="${x}"/>`).join('')}</w:tblGrid>${cab}${corpo}${tot}</w:tbl>
        ${par(run('Legenda: ', { b: true, tam: 18 }) + run('Trabalha · FOLGA · ausência (férias, atestado, falta) · Fechado', { tam: 18, cor: '566173' }), { antes: 160 })}`;
    }).join('');
    const doc = `${XML}<w:document xmlns:w="${NS}/wordprocessingml/2006/main" xmlns:r="${NS}/officeDocument/2006/relationships"><w:body>${blocos}
      <w:sectPr><w:footerReference w:type="default" r:id="rId1"/><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="360" w:footer="360" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const rodape = `${XML}<w:ftr xmlns:w="${NS}/wordprocessingml/2006/main">${par(run(RODAPE, { tam: 16, cor: '566173' }), { centro: true, depois: 0 })}</w:ftr>`;
    return [
      { nome: '[Content_Types].xml', texto: `${XML}<Types xmlns="${NS}/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>` },
      { nome: '_rels/.rels', texto: `${XML}<Relationships xmlns="${NS}/package/2006/relationships"><Relationship Id="rId1" Type="${NS}/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>` },
      { nome: 'word/_rels/document.xml.rels', texto: `${XML}<Relationships xmlns="${NS}/package/2006/relationships"><Relationship Id="rId1" Type="${NS}/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>` },
      { nome: 'word/document.xml', texto: doc },
      { nome: 'word/footer1.xml', texto: rodape },
    ];
  }

  // ---------------- PowerPoint (16:9, um slide por semana; equipes grandes viram mais de um slide) ----------------
  const CX = 12192000, CY = 6858000;
  function slideXml(d, s, linhas, parte) {
    const x0 = 457200, y0 = 1180000, larg = CX - 2 * x0;
    const colNome = Math.round(larg * 0.22), colDia = Math.floor((larg - colNome) / 7);
    const nl = linhas.length + 1 + (s.total ? 1 : 0), alt = Math.min(520000, Math.floor((CY - y0 - 520000) / nl));
    const tam = alt >= 420000 ? 1400 : alt >= 320000 ? 1100 : 900;
    const tc = (txt, { fundo, cor = '0C1B33', b } = {}) => `<a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="pt-BR" sz="${tam}"${b ? ' b="1"' : ''} dirty="0"><a:solidFill><a:srgbClr val="${cor}"/></a:solidFill><a:latin typeface="Arial"/></a:rPr><a:t>${esc(txt)}</a:t></a:r></a:p></a:txBody><a:tcPr anchor="ctr" marL="45720" marR="45720" marT="22860" marB="22860">${fundo ? `<a:solidFill><a:srgbClr val="${fundo}"/></a:solidFill>` : '<a:noFill/>'}</a:tcPr></a:tc>`;
    const tr = cels => `<a:tr h="${alt}">${cels}</a:tr>`;
    const linhasTab = [tr(tc('Colaborador', { b: true }) + s.dias.map((t, k) => tc(t + (s.feriados[k] ? ' · fer.' : ''), { b: true, cor: s.feriados[k] ? '8A5A00' : '0C1B33' })).join('')),
      ...linhas.map(l => tr(tc(l.nome, { b: true }) + l.cels.map(c => tc(c.txt, { fundo: COR[c.tipo]?.[0], cor: COR[c.tipo]?.[1], b: c.tipo === 'F' })).join(''))),
      ...(s.total ? [tr(tc('Trabalhando (mín.)', { b: true }) + s.total.map(t => tc(t, { cor: '168821' })).join(''))] : [])];
    const caixa = (id, nome, x, y, w, h, txt, tamTxt, cor, b) => `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${nome}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="0" rIns="0" tIns="0" bIns="0"/><a:lstStyle/><a:p><a:r><a:rPr lang="pt-BR" sz="${tamTxt}"${b ? ' b="1"' : ''} dirty="0"><a:solidFill><a:srgbClr val="${cor}"/></a:solidFill><a:latin typeface="Arial"/></a:rPr><a:t>${esc(txt)}</a:t></a:r></a:p></p:txBody></p:sp>`;
    return `${XML}<p:sld xmlns:a="${NS}/drawingml/2006/main" xmlns:r="${NS}/officeDocument/2006/relationships" xmlns:p="${NS}/presentationml/2006/main"><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>
      ${caixa(2, 'Titulo', x0, 360000, larg, 480000, `${d.empresa} · ${d.unidade}`, 2600, '0C1B33', true)}
      ${caixa(3, 'Semana', x0, 820000, larg, 300000, s.titulo + (parte ? ` (${parte})` : ''), 1500, '566173')}
      <p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="4" name="Escala"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="${x0}" y="${y0}"/><a:ext cx="${colNome + colDia * 7}" cy="${alt * nl}"/></p:xfrm>
      <a:graphic><a:graphicData uri="${NS}/drawingml/2006/table"><a:tbl><a:tblPr firstRow="1"/><a:tblGrid><a:gridCol w="${colNome}"/>${`<a:gridCol w="${colDia}"/>`.repeat(7)}</a:tblGrid>${linhasTab.join('')}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>
      ${caixa(5, 'Rodape', x0, CY - 380000, larg, 260000, RODAPE, 1100, '566173')}
    </p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
  }
  const TEMA = `${XML}<a:theme xmlns:a="${NS}/drawingml/2006/main" name="Sua Escala"><a:themeElements><a:clrScheme name="Sua Escala"><a:dk1><a:srgbClr val="0C1B33"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="071D41"/></a:dk2><a:lt2><a:srgbClr val="F3F5F8"/></a:lt2><a:accent1><a:srgbClr val="1351B4"/></a:accent1><a:accent2><a:srgbClr val="168821"/></a:accent2><a:accent3><a:srgbClr val="FFCD07"/></a:accent3><a:accent4><a:srgbClr val="4B2A9A"/></a:accent4><a:accent5><a:srgbClr val="C4161C"/></a:accent5><a:accent6><a:srgbClr val="566173"/></a:accent6><a:hlink><a:srgbClr val="1351B4"/></a:hlink><a:folHlink><a:srgbClr val="4B2A9A"/></a:folHlink></a:clrScheme>
<a:fontScheme name="Sua Escala"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>
<a:fmtScheme name="Sua Escala"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;
  function arquivosPptx(d) {
    const POR = 16; // colaboradores por slide
    const slides = [];
    d.semanas.forEach(s => {
      const partes = Math.max(1, Math.ceil(s.linhas.length / POR));
      for (let p = 0; p < partes; p++) slides.push(slideXml(d, s, s.linhas.slice(p * POR, (p + 1) * POR), partes > 1 ? `${p + 1} de ${partes}` : ''));
    });
    const rel = (id, tipo, alvo) => `<Relationship Id="${id}" Type="${NS}/officeDocument/2006/relationships/${tipo}" Target="${alvo}"/>`;
    const rels = itens => `${XML}<Relationships xmlns="${NS}/package/2006/relationships">${itens.join('')}</Relationships>`;
    const sp0 = `<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>`;
    const pml = `xmlns:a="${NS}/drawingml/2006/main" xmlns:r="${NS}/officeDocument/2006/relationships" xmlns:p="${NS}/presentationml/2006/main"`;
    const arquivos = [
      { nome: '[Content_Types].xml', texto: `${XML}<Types xmlns="${NS}/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>${slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('')}</Types>` },
      { nome: '_rels/.rels', texto: rels([rel('rId1', 'officeDocument', 'ppt/presentation.xml')]) },
      { nome: 'ppt/presentation.xml', texto: `${XML}<p:presentation ${pml} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 3}"/>`).join('')}</p:sldIdLst><p:sldSz cx="${CX}" cy="${CY}"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>` },
      { nome: 'ppt/_rels/presentation.xml.rels', texto: rels([rel('rId1', 'slideMaster', 'slideMasters/slideMaster1.xml'), rel('rId2', 'theme', 'theme/theme1.xml'), ...slides.map((_, i) => rel(`rId${i + 3}`, 'slide', `slides/slide${i + 1}.xml`))]) },
      { nome: 'ppt/slideMasters/slideMaster1.xml', texto: `${XML}<p:sldMaster ${pml}>${sp0}<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>` },
      { nome: 'ppt/slideMasters/_rels/slideMaster1.xml.rels', texto: rels([rel('rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml'), rel('rId2', 'theme', '../theme/theme1.xml')]) },
      { nome: 'ppt/slideLayouts/slideLayout1.xml', texto: `${XML}<p:sldLayout ${pml} type="blank" preserve="1">${sp0}<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>` },
      { nome: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels', texto: rels([rel('rId1', 'slideMaster', '../slideMasters/slideMaster1.xml')]) },
      { nome: 'ppt/theme/theme1.xml', texto: TEMA },
      ...slides.flatMap((x, i) => [{ nome: `ppt/slides/slide${i + 1}.xml`, texto: x }, { nome: `ppt/slides/_rels/slide${i + 1}.xml.rels`, texto: rels([rel('rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml')]) }]),
    ];
    return arquivos;
  }

  // ---------------- zip (sem compressão, como o .xlsx) ----------------
  const TAB = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = TAB[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zipBytes(arquivos) {
    const enc = new TextEncoder(), partes = [], central = []; let off = 0;
    for (const a of arquivos) {
      const nome = enc.encode(a.nome), dados = enc.encode(a.texto), crc = crc32(dados);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(12, 0x21, true);
      h.setUint32(14, crc, true); h.setUint32(18, dados.length, true); h.setUint32(22, dados.length, true); h.setUint16(26, nome.length, true);
      partes.push(new Uint8Array(h.buffer), nome, dados);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(14, 0x21, true);
      c.setUint32(16, crc, true); c.setUint32(20, dados.length, true); c.setUint32(24, dados.length, true); c.setUint16(28, nome.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), nome);
      off += 30 + nome.length + dados.length;
    }
    const tamC = central.reduce((s, b) => s + b.length, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, arquivos.length, true); e.setUint16(10, arquivos.length, true); e.setUint32(12, tamC, true); e.setUint32(16, off, true);
    const todos = [...partes, ...central, new Uint8Array(e.buffer)], saida = new Uint8Array(todos.reduce((s, b) => s + b.length, 0));
    let p = 0; for (const b of todos) { saida.set(b, p); p += b.length; }
    return saida;
  }

  const api = { arquivosDocx, arquivosPptx, zipBytes, crc32 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Ooxml = api;
})(typeof window !== 'undefined' ? window : globalThis);
