// Word (.docx) e PowerPoint (.pptx) da escala: o zip abre, tem as partes obrigatórias e mostra nomes e dias.
const test = require('node:test');
const assert = require('node:assert');
const Ooxml = require('../public/ooxml.js');

// lê um zip sem compressão (o que o app gera): devolve { nome: texto }
function unzip(bytes) {
  const b = Buffer.from(bytes), saida = {};
  let p = 0;
  while (b.readUInt32LE(p) === 0x04034b50) {
    const metodo = b.readUInt16LE(p + 8), crc = b.readUInt32LE(p + 14), tam = b.readUInt32LE(p + 18), ln = b.readUInt16LE(p + 26), le = b.readUInt16LE(p + 28);
    assert.equal(metodo, 0);
    const nome = b.toString('utf8', p + 30, p + 30 + ln), dados = b.subarray(p + 30 + ln + le, p + 30 + ln + le + tam);
    assert.equal(Ooxml.crc32(dados), crc, `crc de ${nome}`);
    saida[nome] = dados.toString('utf8');
    p += 30 + ln + le + tam;
  }
  assert.equal(b.readUInt32LE(b.length - 22), 0x06054b50, 'fim do zip');
  return saida;
}
const semana = (titulo, n = 3) => ({
  titulo, dias: ['Seg 16/11', 'Ter 17/11', 'Qua 18/11', 'Qui 19/11', 'Sex 20/11', 'Sáb 21/11', 'Dom 22/11'], feriados: [0, 0, 0, 0, 1, 0, 0].map(Boolean),
  linhas: Array.from({ length: n }, (_, i) => ({ nome: i === 0 ? 'Ana & Cia <teste>' : `Caixa ${i}`, cels: ['T', 'T', 'F', 'F', 'T', 'T', i ? 'A' : 'X'].map(t => ({ txt: { T: 'Trabalha', F: 'FOLGA', A: 'Férias', X: 'Fechado' }[t], tipo: t })) })),
  total: Array(7).fill('2 (mín. 2)'),
});
const dados = { empresa: 'Mercadinho Bom Preço', unidade: 'Loja Centro', semanas: [semana('Semana de 16/11/2026 a 22/11/2026'), semana('Semana de 23/11/2026 a 29/11/2026')] };

test('docx: partes obrigatórias, paisagem, nomes, dias e rodapé da lei', () => {
  const z = unzip(Ooxml.zipBytes(Ooxml.arquivosDocx(dados)));
  for (const p of ['[Content_Types].xml', '_rels/.rels', 'word/document.xml', 'word/_rels/document.xml.rels', 'word/footer1.xml']) assert.ok(z[p], p);
  const doc = z['word/document.xml'];
  assert.match(z['[Content_Types].xml'], /wordprocessingml\.document\.main\+xml/);
  assert.match(doc, /w:orient="landscape"/);
  assert.match(doc, /Mercadinho Bom Preço/); assert.match(doc, /Loja Centro · Semana de 16\/11\/2026/);
  assert.match(doc, /Ana &amp; Cia &lt;teste&gt;/, 'nome escapado'); assert.match(doc, /Caixa 2/);
  for (const d of ['Seg 16/11', 'Dom 22/11']) assert.ok(doc.includes(d), d);
  assert.match(doc, /feriado/); assert.match(doc, /w:fill="FFCD07"/); assert.match(doc, /w:br w:type="page"/);
  assert.match(z['word/footer1.xml'], /EC 141\/2026/);
});

test('pptx: 16:9, um slide por semana (e mais se a equipe for grande)', () => {
  const z = unzip(Ooxml.zipBytes(Ooxml.arquivosPptx(dados)));
  for (const p of ['[Content_Types].xml', 'ppt/presentation.xml', 'ppt/slideMasters/slideMaster1.xml', 'ppt/slideLayouts/slideLayout1.xml', 'ppt/theme/theme1.xml', 'ppt/slides/slide1.xml', 'ppt/slides/slide2.xml', 'ppt/slides/_rels/slide1.xml.rels']) assert.ok(z[p], p);
  assert.ok(!z['ppt/slides/slide3.xml']);
  assert.match(z['ppt/presentation.xml'], /<p:sldSz cx="12192000" cy="6858000"\/>/);
  const s1 = z['ppt/slides/slide1.xml'];
  assert.match(s1, /Mercadinho Bom Preço · Loja Centro/); assert.match(s1, /Semana de 16\/11\/2026/);
  assert.match(s1, /Caixa 1/); assert.match(s1, /Qua 18\/11/); assert.match(s1, /<a:tbl>/);
  assert.match(z['ppt/slides/slide2.xml'], /Semana de 23\/11\/2026/);
  // 20 colaboradores numa semana: 2 slides
  const grande = Ooxml.arquivosPptx({ ...dados, semanas: [semana('Semana grande', 20)] }).filter(a => /^ppt\/slides\/slide\d+\.xml$/.test(a.nome));
  assert.equal(grande.length, 2); assert.match(grande[1].texto, /2 de 2/);
});
