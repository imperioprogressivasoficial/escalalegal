# Ajudantes para montar os modelos .docx do Kit RH (Word / Google Docs / LibreOffice).
import re
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_COLOR_INDEX, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

AZUL = RGBColor(0x13, 0x51, 0xb4); AZUL_ESC = RGBColor(0x07, 0x1d, 0x41)
CINZA = RGBColor(0x5b, 0x66, 0x76); TEXTO = RGBColor(0x1f, 0x2a, 0x3a)
FONTE = 'Arial'
CAMPO = re.compile(r'(\[[^\]]+\])')
AVISO = 'Modelo de referência. Confira com o seu contador ou advogado antes de assinar.'


def _fonte(run, tam=None, cor=None, negrito=None, italico=None):
    run.font.name = FONTE
    run._element.rPr.rFonts.set(qn('w:eastAsia'), FONTE)
    if tam: run.font.size = Pt(tam)
    if cor is not None: run.font.color.rgb = cor
    if negrito is not None: run.bold = negrito
    if italico is not None: run.italic = italico


def borda_baixo(par, cor='1351B4', tam=12, espaco=4):
    pPr = par._p.get_or_add_pPr()
    b = OxmlElement('w:pBdr'); e = OxmlElement('w:bottom')
    for k, v in {'w:val': 'single', 'w:sz': str(tam), 'w:space': str(espaco), 'w:color': cor}.items(): e.set(qn(k), v)
    b.append(e); pPr.append(b)


def sombra(celula, cor):
    tcPr = celula._tc.get_or_add_tcPr()
    s = OxmlElement('w:shd'); s.set(qn('w:val'), 'clear'); s.set(qn('w:color'), 'auto'); s.set(qn('w:fill'), cor); tcPr.append(s)


def bordas_tabela(tabela, cor='C9D1DD', tam=4):
    tblPr = tabela._tbl.tblPr
    b = OxmlElement('w:tblBorders')
    for lado in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
        e = OxmlElement(f'w:{lado}')
        for k, v in {'w:val': 'single', 'w:sz': str(tam), 'w:space': '0', 'w:color': cor}.items(): e.set(qn(k), v)
        b.append(e)
    tblPr.append(b)


def sem_bordas(tabela):
    tblPr = tabela._tbl.tblPr
    b = OxmlElement('w:tblBorders')
    for lado in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
        e = OxmlElement(f'w:{lado}'); e.set(qn('w:val'), 'nil'); b.append(e)
    tblPr.append(b)


def margem_celula(celula, cm=0.25):
    tcPr = celula._tc.get_or_add_tcPr()
    m = OxmlElement('w:tcMar')
    for lado in ['top', 'left', 'bottom', 'right']:
        e = OxmlElement(f'w:{lado}'); e.set(qn('w:w'), str(int(cm * 567))); e.set(qn('w:type'), 'dxa'); m.append(e)
    tcPr.append(m)


def numero_pagina(par):
    for tipo, txt in [('begin', None), (None, 'PAGE'), ('end', None)]:
        r = par.add_run(); _fonte(r, 8, CINZA)
        if tipo:
            f = OxmlElement('w:fldChar'); f.set(qn('w:fldCharType'), tipo); r._r.append(f)
        else:
            t = OxmlElement('w:instrText'); t.set(qn('xml:space'), 'preserve'); t.text = txt; r._r.append(t)


class Modelo:
    def __init__(self, titulo, subtitulo=None, rodape_doc='Kit RH da 5x2'):
        self.d = Document()
        sec = self.d.sections[0]
        sec.page_width, sec.page_height = Cm(21), Cm(29.7)
        sec.left_margin = sec.right_margin = Cm(2.2)
        sec.top_margin = Cm(2.0); sec.bottom_margin = Cm(2.0)
        sec.header_distance = Cm(1.0); sec.footer_distance = Cm(0.9)
        st = self.d.styles['Normal']
        st.font.name = FONTE; st.font.size = Pt(10.5); st.font.color.rgb = TEXTO
        st.element.rPr.rFonts.set(qn('w:eastAsia'), FONTE)
        st.paragraph_format.space_after = Pt(6); st.paragraph_format.line_spacing = 1.18
        # cabeçalho: dados da empresa (campos para preencher)
        h = sec.header.paragraphs[0]
        self.texto(h, '[NOME DA EMPRESA]  ·  CNPJ [00.000.000/0000-00]', tam=8.5, cor=CINZA)
        borda_baixo(h, 'C9D1DD', 4, 6)
        # rodapé: aviso + página
        f = sec.footer.paragraphs[0]
        self.texto(f, AVISO, tam=8, cor=CINZA, italico=True)
        f2 = sec.footer.add_paragraph(); f2.paragraph_format.space_after = Pt(0)
        self.texto(f2, f'{rodape_doc}  ·  página ', tam=8, cor=CINZA)
        numero_pagina(f2)
        # título
        p = self.d.add_paragraph(); p.paragraph_format.space_after = Pt(2)
        self.texto(p, titulo.upper(), tam=15, cor=AZUL_ESC, negrito=True)
        if subtitulo:
            p = self.d.add_paragraph(); p.paragraph_format.space_after = Pt(4)
            self.texto(p, subtitulo, tam=10.5, cor=AZUL, negrito=True)
        borda_baixo(p, '1351B4', 14, 4)
        self.d.add_paragraph().paragraph_format.space_after = Pt(0)

    def texto(self, par, txt, tam=None, cor=None, negrito=None, italico=None, campos=True):
        """Escreve o texto; trechos [ASSIM] saem marcados em amarelo para preencher. **negrito** também."""
        for i, bloco in enumerate(txt.split('**') if campos else [txt]):
            neg = True if i % 2 else negrito
            for parte in (CAMPO.split(bloco) if campos else [bloco]):
                if not parte: continue
                r = par.add_run(parte); _fonte(r, tam, cor, neg, italico)
                if campos and CAMPO.fullmatch(parte): r.font.highlight_color = WD_COLOR_INDEX.YELLOW
        return par

    def p(self, txt, alinhar='justify', tam=None, depois=6, antes=0, negrito=None, cor=None, recuo=None):
        par = self.d.add_paragraph()
        par.alignment = {'justify': WD_ALIGN_PARAGRAPH.JUSTIFY, 'center': WD_ALIGN_PARAGRAPH.CENTER, 'left': WD_ALIGN_PARAGRAPH.LEFT, 'right': WD_ALIGN_PARAGRAPH.RIGHT}[alinhar]
        par.paragraph_format.space_after = Pt(depois); par.paragraph_format.space_before = Pt(antes)
        if recuo: par.paragraph_format.left_indent = Cm(recuo)
        return self.texto(par, txt, tam=tam, negrito=negrito, cor=cor)

    def clausula(self, titulo, *paragrafos):
        par = self.d.add_paragraph(); par.paragraph_format.space_before = Pt(8); par.paragraph_format.space_after = Pt(3)
        par.paragraph_format.keep_with_next = True
        self.texto(par, titulo, tam=10.5, cor=AZUL, negrito=True)
        for t in paragrafos:
            self.p(t)

    def item(self, txt, marcador='•', recuo=0.6):
        par = self.d.add_paragraph(); par.paragraph_format.left_indent = Cm(recuo); par.paragraph_format.first_line_indent = Cm(-0.4)
        par.paragraph_format.space_after = Pt(3)
        r = par.add_run(marcador + '  '); _fonte(r, None, AZUL, True)
        return self.texto(par, txt)

    def quadro(self, titulo, linhas, cor='E8F0FC', borda='1351B4'):
        """Quadro de orientação (ex.: 'Como usar este modelo'). Apague antes de imprimir."""
        t = self.d.add_table(rows=1, cols=1); t.alignment = WD_TABLE_ALIGNMENT.CENTER
        bordas_tabela(t, borda, 6)
        c = t.cell(0, 0); sombra(c, cor); margem_celula(c, 0.3)
        par = c.paragraphs[0]; par.paragraph_format.space_after = Pt(3)
        self.texto(par, titulo, tam=9.5, cor=AZUL_ESC, negrito=True)
        for l in linhas:
            q = c.add_paragraph(); q.paragraph_format.space_after = Pt(2)
            self.texto(q, l, tam=9)
        self.d.add_paragraph().paragraph_format.space_after = Pt(2)

    def tabela(self, cabecalho, linhas, larguras=None, cab_cor='1351B4', tam=9.5, altura=None):
        t = self.d.add_table(rows=1 + len(linhas), cols=len(cabecalho)); t.alignment = WD_TABLE_ALIGNMENT.CENTER
        bordas_tabela(t)
        for j, h in enumerate(cabecalho):
            c = t.cell(0, j); sombra(c, cab_cor); margem_celula(c, 0.15)
            self.texto(c.paragraphs[0], h, tam=tam, cor=RGBColor(255, 255, 255), negrito=True)
        for i, l in enumerate(linhas, 1):
            for j, v in enumerate(l):
                c = t.cell(i, j); margem_celula(c, 0.15)
                c.paragraphs[0].paragraph_format.space_after = Pt(0)
                self.texto(c.paragraphs[0], v, tam=tam)
            if altura:
                from docx.shared import Cm as _Cm
                t.rows[i].height = _Cm(altura)
        if larguras:
            t.autofit = False
            for j, w in enumerate(larguras): t.columns[j].width = Cm(w)
            for row in t.rows:
                for j, w in enumerate(larguras): row.cells[j].width = Cm(w)
        self.d.add_paragraph().paragraph_format.space_after = Pt(2)
        return t

    def assinaturas(self, nomes, local=True):
        if local:
            self.p('[CIDADE] - [UF], [DIA] de [MÊS] de [ANO].', alinhar='left', antes=10, depois=18)
        pares = [nomes[i:i + 2] for i in range(0, len(nomes), 2)]
        for par_nomes in pares:
            t = self.d.add_table(rows=1, cols=2); sem_bordas(t)
            for j, (nome, sub) in enumerate(par_nomes):
                c = t.cell(0, j); c.width = Cm(8.3)
                a = c.paragraphs[0]; a.alignment = WD_ALIGN_PARAGRAPH.CENTER; a.paragraph_format.space_before = Pt(26); a.paragraph_format.space_after = Pt(0)
                self.texto(a, '_' * 38, cor=CINZA, campos=False)
                b = c.add_paragraph(); b.alignment = WD_ALIGN_PARAGRAPH.CENTER; b.paragraph_format.space_after = Pt(0)
                self.texto(b, nome, tam=9.5, negrito=True)
                s = c.add_paragraph(); s.alignment = WD_ALIGN_PARAGRAPH.CENTER
                self.texto(s, sub, tam=8.5, cor=CINZA)

    def quebra(self):
        self.d.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

    def salvar(self, caminho):
        self.d.core_properties.author = ''
        self.d.core_properties.title = ''
        self.d.save(caminho)
