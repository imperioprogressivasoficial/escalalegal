# Gera as Plaquinhas de Aviso da Escala: PDFs A4 e A3 prontos para imprimir + versões editáveis (.pptx).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comum import *
from reportlab.lib.pagesizes import A4, A3, landscape
from reportlab.lib.units import cm, mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit

OUT = pasta('plaquinhas')
LINHA = HexColor('#9aa6b8'); FUNDO = HexColor('#f4f7fc'); VERDE_CL = HexColor('#e3f4e5')
DIAS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']


def logo_area(c, x, y, w, h, escuro=False):
    """Espaço livre para colar/desenhar a logo e escrever o nome da empresa."""
    c.setDash(3, 3); c.setLineWidth(0.8); c.setStrokeColor(HexColor('#b8c3d4') if not escuro else HexColor('#5d7fb8'))
    c.roundRect(x, y, w, h, 2.5 * mm, stroke=1, fill=0); c.setDash()
    c.setFillColor(HexColor('#b8c3d4') if not escuro else HexColor('#8aa3cc')); c.setFont(TXT, 7)
    c.drawCentredString(x + w / 2, y + h / 2 - 2.5, 'logo e nome da empresa')


def faixa_topo(c, W, H, m, altura):
    c.setFillColor(AZUL); c.roundRect(m, H - m - altura, W - 2 * m, altura, 4 * mm, stroke=0, fill=1)


def rodape(c, W, m, texto=AVISO_PLACA):
    c.setFillColor(CINZA); c.setFont(TXT, 6.8); c.drawCentredString(W / 2, m - 5 * mm + 2 * mm, texto)


def texto_quebrado(c, txt, x, y, larg, fonte, tam, cor, entre=1.3, centro=False):
    c.setFillColor(cor); c.setFont(fonte, tam)
    for l in simpleSplit(txt, fonte, tam, larg):
        (c.drawCentredString(x + larg / 2, y, l) if centro else c.drawString(x, y, l)); y -= tam * entre
    return y


# ---------------------------------------------------------------- 1. quadro da escala da semana (paisagem)
def quadro_semana(c, W, H):
    m = 12 * mm
    faixa_topo(c, W, H, m, 34 * mm)
    logo_area(c, m + 6 * mm, H - m - 30 * mm, 52 * mm, 25 * mm, escuro=True)
    c.setFillColor(BRANCO); c.setFont(TIT_PESADO, 31); c.drawString(m + 66 * mm, H - m - 17 * mm, 'Escala da semana')
    c.setFillColor(HexColor('#c9d8f0')); c.setFont(TXT_SB, 11.5); c.drawString(m + 66 * mm, H - m - 26 * mm, '2 folgas por semana para cada pessoa. Marque F na folga.')
    # campo da semana
    bx = W - m - 86 * mm; by = H - m - 27 * mm
    c.setFillColor(BRANCO); c.roundRect(bx, by, 80 * mm, 20 * mm, 3 * mm, stroke=0, fill=1)
    c.setFillColor(AZUL); c.setFont(TXT_B, 8); c.drawString(bx + 5 * mm, by + 14 * mm, 'SEMANA')
    c.setFillColor(AZUL_ESC); c.setFont(TXT_SB, 13); c.drawString(bx + 5 * mm, by + 5 * mm, 'de ____/____  a  ____/____')
    # grade
    gx, gy0 = m, H - m - 42 * mm
    gw = W - 2 * m; col_nome = 70 * mm; cw = (gw - col_nome) / 7
    hh = 11 * mm; linhas = 12; lh = (gy0 - hh - (m + 17 * mm)) / linhas
    c.setFillColor(AZUL_ESC); c.roundRect(gx, gy0 - hh, gw, hh, 2.5 * mm, stroke=0, fill=1)
    c.rect(gx, gy0 - hh, gw, hh / 2, stroke=0, fill=1)
    c.setFillColor(BRANCO); c.setFont(TXT_B, 11); c.drawString(gx + 5 * mm, gy0 - hh + 3.8 * mm, 'NOME')
    for i, d in enumerate(DIAS):
        x = gx + col_nome + i * cw
        if d == 'DOM':
            c.setFillColor(AMARELO); c.rect(x, gy0 - hh, cw, hh, stroke=0, fill=1); c.setFillColor(AZUL_ESC)
        else:
            c.setFillColor(BRANCO)
        c.setFont(TIT, 14); c.drawCentredString(x + cw / 2, gy0 - hh + 3.6 * mm, d)
    for r in range(linhas):
        y = gy0 - hh - (r + 1) * lh
        if r % 2: c.setFillColor(FUNDO); c.rect(gx, y, gw, lh, stroke=0, fill=1)
    # coluna de domingo levemente marcada
    c.setFillColor(HexColor('#fff8d6')); c.rect(gx + col_nome + 6 * cw, gy0 - hh - linhas * lh, cw, linhas * lh, stroke=0, fill=1)
    c.setStrokeColor(CINZA_CL); c.setLineWidth(0.8)
    for r in range(linhas + 1):
        y = gy0 - hh - r * lh; c.line(gx, y, gx + gw, y)
    for i in range(8):
        x = gx + col_nome + i * cw; c.line(x, gy0 - hh, x, gy0 - hh - linhas * lh)
    c.line(gx, gy0 - hh, gx, gy0 - hh - linhas * lh)
    # legenda
    ly = m + 8 * mm
    itens = [('F', 'Folga', VERDE, BRANCO), ('FE', 'Férias', AZUL, BRANCO), ('AT', 'Atestado', HexColor('#e8eaef'), AZUL_ESC), ('FT', 'Falta', HexColor('#e8eaef'), AZUL_ESC)]
    x = gx
    c.setFillColor(AZUL_ESC); c.setFont(TXT_B, 9.5); c.drawString(x, ly + 1 * mm, 'LEGENDA'); x += 22 * mm
    for sig, nome, fundo, cor in itens:
        c.setFillColor(fundo); c.roundRect(x, ly - 1 * mm, 10 * mm, 6.5 * mm, 1.5 * mm, stroke=0, fill=1)
        c.setFillColor(cor); c.setFont(TXT_B, 9.5); c.drawCentredString(x + 5 * mm, ly + 1 * mm, sig)
        c.setFillColor(TEXTO); c.setFont(TXT, 9.5); c.drawString(x + 12.5 * mm, ly + 1 * mm, nome); x += 12.5 * mm + c.stringWidth(nome, TXT, 9.5) + 9 * mm
    c.setFillColor(CINZA); c.setFont(TXT, 9); c.drawRightString(gx + gw, ly + 1 * mm, 'Trocas de folga: combine antes com o responsável.')
    rodape(c, W, m)


# ---------------------------------------------------------------- 2. aviso de folga (retrato)
def aviso_folga(c, W, H):
    m = 12 * mm
    logo_area(c, W / 2 - 35 * mm, H - m - 30 * mm, 70 * mm, 26 * mm)
    y = H - m - 40 * mm
    c.setFillColor(AZUL); c.roundRect(m, y - 62 * mm, W - 2 * m, 62 * mm, 5 * mm, stroke=0, fill=1)
    c.setFillColor(AMARELO); c.roundRect(W / 2 - 20 * mm, y - 13 * mm, 40 * mm, 8 * mm, 4 * mm, stroke=0, fill=1)
    c.setFillColor(AZUL_ESC); c.setFont(TXT_B, 10); c.drawCentredString(W / 2, y - 10.3 * mm, 'AVISO DE FOLGA')
    c.setFillColor(BRANCO); c.setFont(TIT_PESADO, 46); c.drawCentredString(W / 2, y - 33 * mm, 'Hoje estou')
    c.drawCentredString(W / 2, y - 51 * mm, 'de folga')
    y -= 78 * mm
    def campo(rot, y, tam=11):
        c.setFillColor(AZUL); c.setFont(TXT_B, tam); c.drawString(m + 6 * mm, y + 3 * mm, rot.upper())
        c.setStrokeColor(LINHA); c.setLineWidth(1); c.line(m + 6 * mm, y - 12 * mm, W - m - 6 * mm, y - 12 * mm)
        return y - 36 * mm
    y = campo('Nome', y)
    y = campo('Volto no dia', y)
    y = campo('Quem atende no meu lugar', y)
    c.setFillColor(FUNDO); c.roundRect(m, m + 6 * mm, W - 2 * m, 34 * mm, 4 * mm, stroke=0, fill=1)
    texto_quebrado(c, 'Aqui todo mundo tem 2 folgas por semana, em rodízio. Assim a equipe descansa e o atendimento continua todos os dias.',
                   m + 12 * mm, m + 27 * mm, W - 2 * m - 24 * mm, TXT_SB, 13, AZUL_ESC, 1.4, centro=True)
    rodape(c, W, m)


# ---------------------------------------------------------------- 3. horário de funcionamento (retrato)
def horario(c, W, H):
    m = 12 * mm
    faixa_topo(c, W, H, m, 58 * mm)
    logo_area(c, W / 2 - 32 * mm, H - m - 26 * mm, 64 * mm, 21 * mm, escuro=True)
    c.setFillColor(HexColor('#c9d8f0')); c.setFont(TXT_B, 11); c.drawCentredString(W / 2, H - m - 37 * mm, 'HORÁRIO DE')
    c.setFillColor(BRANCO); c.setFont(TIT_PESADO, 34); c.drawCentredString(W / 2, H - m - 51 * mm, 'Funcionamento')
    y = H - m - 70 * mm
    nomes = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo', 'Feriados']
    lh = 21 * mm
    for i, d in enumerate(nomes):
        yy = y - i * lh
        if i % 2 == 0: c.setFillColor(FUNDO); c.roundRect(m, yy - lh + 3 * mm, W - 2 * m, lh - 2 * mm, 3 * mm, stroke=0, fill=1)
        base = yy - lh / 2 + 0.5 * mm
        c.setFillColor(AZUL_ESC if d != 'Feriados' else AZUL); c.setFont(TIT, 17); c.drawString(m + 7 * mm, base, d)
        c.setFillColor(CINZA); c.setFont(TXT_SB, 12)
        x1 = m + 62 * mm
        c.drawString(x1, base, 'das'); c.setStrokeColor(LINHA); c.setLineWidth(1); c.line(x1 + 10 * mm, base - 1.5 * mm, x1 + 42 * mm, base - 1.5 * mm)
        c.drawString(x1 + 47 * mm, base, 'às'); c.line(x1 + 56 * mm, base - 1.5 * mm, x1 + 88 * mm, base - 1.5 * mm)
        c.setFont(TXT, 9); c.drawString(W - m - 22 * mm, base, '(   ) fechado')
    yb = y - len(nomes) * lh - 3 * mm
    texto_quebrado(c, 'Nossa equipe trabalha na escala 5x2, com 2 folgas por semana em rodízio. O horário de atendimento continua o mesmo.',
                   m + 10 * mm, yb - 6 * mm, W - 2 * m - 20 * mm, TXT_SB, 11.5, AZUL, 1.35, centro=True)
    rodape(c, W, m, 'Preencha com caneta permanente ou imprima a versão editável já preenchida.')


# ---------------------------------------------------------------- 4. aviso aos clientes (retrato)
def clientes(c, W, H):
    m = 12 * mm
    logo_area(c, W / 2 - 35 * mm, H - m - 30 * mm, 70 * mm, 26 * mm)
    y = H - m - 44 * mm
    c.setFillColor(AMARELO); c.roundRect(W / 2 - 30 * mm, y - 2 * mm, 60 * mm, 8.5 * mm, 4.2 * mm, stroke=0, fill=1)
    c.setFillColor(AZUL_ESC); c.setFont(TXT_B, 10); c.drawCentredString(W / 2, y + 0.7 * mm, 'AVISO AOS CLIENTES')
    y -= 22 * mm
    c.setFillColor(AZUL_ESC); c.setFont(TIT_PESADO, 37)
    for l in ['Nossa equipe agora', 'trabalha na']:
        c.drawCentredString(W / 2, y, l); y -= 15 * mm
    c.setFillColor(AZUL); c.setFont(TIT_PESADO, 74); c.drawCentredString(W / 2, y - 16 * mm, 'escala 5x2'); y -= 33 * mm
    c.setStrokeColor(AMARELO); c.setLineWidth(3); c.line(W / 2 - 20 * mm, y, W / 2 + 20 * mm, y); y -= 14 * mm
    y = texto_quebrado(c, 'Cada pessoa da nossa equipe agora tem 2 folgas por semana. É a nova lei, e a gente apoia: equipe descansada atende melhor.',
                       m + 16 * mm, y, W - 2 * m - 32 * mm, TXT, 15.5, TEXTO, 1.45, centro=True)
    y -= 12 * mm
    # 3 garantias
    caixas = [('Mesmos dias', 'e horários de atendimento'), ('Folgas em rodízio', 'para nunca faltar gente'), ('O mesmo cuidado', 'com você de sempre')]
    bw = (W - 2 * m - 2 * 6 * mm) / 3; bh = 34 * mm
    for i, (a, b) in enumerate(caixas):
        x = m + i * (bw + 6 * mm)
        c.setFillColor(FUNDO); c.roundRect(x, y - bh, bw, bh, 4 * mm, stroke=0, fill=1)
        c.setFillColor(VERDE); c.roundRect(x + bw / 2 - 6 * mm, y - 8 * mm, 12 * mm, 2 * mm, 1 * mm, stroke=0, fill=1)
        c.setFillColor(AZUL_ESC); c.setFont(TIT, 13.5); c.drawCentredString(x + bw / 2, y - 16.5 * mm, a)
        c.setFillColor(CINZA); c.setFont(TXT, 10); c.drawCentredString(x + bw / 2, y - 23 * mm, b)
    y -= bh + 20 * mm
    c.setFillColor(AZUL_ESC); c.setFont(TIT, 20); c.drawCentredString(W / 2, y, 'Obrigado pela preferência.')
    y -= 22 * mm
    c.setStrokeColor(LINHA); c.setLineWidth(1); c.line(W / 2 - 50 * mm, y, W / 2 + 50 * mm, y)
    c.setFillColor(CINZA); c.setFont(TXT, 8); c.drawCentredString(W / 2, y - 5 * mm, 'nome da empresa')
    rodape(c, W, m)


PLACAS = [
    ('01-Quadro-da-escala-da-semana', 'Quadro da escala da semana', quadro_semana, True),
    ('02-Aviso-de-folga', 'Aviso de folga', aviso_folga, False),
    ('03-Horario-de-funcionamento', 'Horário de funcionamento', horario, False),
    ('04-Aviso-aos-clientes-escala-5x2', 'Aviso aos clientes: escala 5x2', clientes, False),
]
gerados = []
for nome, titulo, fn, paisagem in PLACAS:
    for formato, tam in (('A4', A4), ('A3', A3)):
        base = landscape(A4) if paisagem else A4
        pag = landscape(tam) if paisagem else tam
        arq = f'{nome}-{formato}.pdf'
        c = canvas.Canvas(os.path.join(OUT, arq), pagesize=pag)
        c.setTitle(titulo); c.setAuthor(''); c.setCreator(''); c.setSubject('Plaquinhas de Aviso da Escala')
        k = pag[0] / base[0]
        c.scale(k, k)  # A3 = o mesmo desenho do A4, ampliado (vetorial)
        fn(c, *base)
        c.showPage(); c.save(); gerados.append(arq)

# ---------------------------------------------------------------- versões editáveis (.pptx: PowerPoint, Google Apresentações, Keynote)
from pptx import Presentation
from pptx.util import Mm, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.dml import MSO_LINE_DASH_STYLE

R = lambda h: RGBColor.from_string(h)
FONTE = 'Arial'


def caixa(sl, x, y, w, h, cor=None, forma=MSO_SHAPE.ROUNDED_RECTANGLE, raio=0.06, linha=None, tracejado=False):
    s = sl.shapes.add_shape(forma, Mm(x), Mm(y), Mm(w), Mm(h))
    if forma == MSO_SHAPE.ROUNDED_RECTANGLE: s.adjustments[0] = raio
    if cor: s.fill.solid(); s.fill.fore_color.rgb = R(cor)
    else: s.fill.background()
    if linha:
        s.line.color.rgb = R(linha); s.line.width = Pt(1)
        if tracejado: s.line.dash_style = MSO_LINE_DASH_STYLE.DASH
    else: s.line.fill.background()
    s.shadow.inherit = False
    st = s._element.find('{http://schemas.openxmlformats.org/presentationml/2006/main}style')
    if st is not None: s._element.remove(st)
    return s


def texto(sl, x, y, w, h, linhas, alinhar=PP_ALIGN.LEFT, ancora=MSO_ANCHOR.TOP):
    """linhas: lista de (texto, tamanho, cor, negrito)."""
    tb = sl.shapes.add_textbox(Mm(x), Mm(y), Mm(w), Mm(h)); tf = tb.text_frame; tf.word_wrap = True
    tf.margin_left = tf.margin_right = Mm(1); tf.margin_top = tf.margin_bottom = Mm(0.5); tf.vertical_anchor = ancora
    for i, (t, tam, cor, neg) in enumerate(linhas):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph(); p.alignment = alinhar
        r = p.add_run(); r.text = t; r.font.size = Pt(tam); r.font.color.rgb = R(cor); r.font.bold = neg; r.font.name = FONTE
    return tb


def logo_pptx(sl, x, y, w, h, escuro=False):
    s = caixa(sl, x, y, w, h, 'FFFFFF' if not escuro else None, linha='9AA6B8' if not escuro else 'C9D8F0', tracejado=True)
    tf = s.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
    r = p.add_run(); r.text = 'Coloque aqui a sua logo'; r.font.size = Pt(11); r.font.bold = True; r.font.name = FONTE; r.font.color.rgb = R('5B6676' if not escuro else 'FFFFFF')
    p2 = tf.add_paragraph(); p2.alignment = PP_ALIGN.CENTER
    r = p2.add_run(); r.text = 'Inserir > Imagem. Depois apague esta caixa.'; r.font.size = Pt(8); r.font.name = FONTE; r.font.color.rgb = R('8A96A8' if not escuro else 'C9D8F0')


def nova_apres(paisagem):
    pr = Presentation()
    pr.slide_width, pr.slide_height = (Mm(297), Mm(210)) if paisagem else (Mm(210), Mm(297))
    return pr, pr.slides.add_slide(pr.slide_layouts[6])


def pptx_semana():
    pr, sl = nova_apres(True); W, H, m = 297, 210, 12
    caixa(sl, m, m, W - 2 * m, 34, '1351B4', raio=0.12)
    logo_pptx(sl, m + 6, m + 4.5, 52, 25, escuro=True)
    texto(sl, m + 64, m + 6, 120, 14, [('Escala da semana', 30, 'FFFFFF', True)])
    texto(sl, m + 64, m + 21, 130, 8, [('2 folgas por semana para cada pessoa. Marque F na folga.', 11, 'C9D8F0', False)])
    caixa(sl, W - m - 86, m + 7, 80, 20, 'FFFFFF', raio=0.15)
    texto(sl, W - m - 82, m + 9, 74, 16, [('SEMANA', 8, '1351B4', True), ('de ____/____  a  ____/____', 13, '071D41', True)])
    linhas = 12
    tab = sl.shapes.add_table(linhas + 1, 8, Mm(m), Mm(m + 42), Mm(W - 2 * m), Mm(11 + linhas * 9.0)).table
    tab.columns[0].width = Mm(70)
    for j in range(1, 8): tab.columns[j].width = Mm((W - 2 * m - 70) / 7)
    for i in range(linhas + 1):
        tab.rows[i].height = Mm(11 if i == 0 else 9.0)
        for j in range(8):
            cel = tab.cell(i, j); cel.fill.solid()
            if i == 0: cel.fill.fore_color.rgb = R('FFCD07' if j == 7 else '071D41')
            else: cel.fill.fore_color.rgb = R('FFF8D6' if j == 7 else ('F4F7FC' if i % 2 == 0 else 'FFFFFF'))
            tf = cel.text_frame; p = tf.paragraphs[0]; p.alignment = PP_ALIGN.LEFT if j == 0 else PP_ALIGN.CENTER
            cel.vertical_anchor = MSO_ANCHOR.MIDDLE
            t = ('NOME' if j == 0 else DIAS[j - 1]) if i == 0 else ''
            r = p.add_run(); r.text = t; r.font.name = FONTE; r.font.size = Pt(12 if i == 0 else 12); r.font.bold = i == 0
            r.font.color.rgb = R('071D41' if (i == 0 and j == 7) or i > 0 else 'FFFFFF')
    texto(sl, m, H - m - 12, W - 2 * m, 7, [('LEGENDA:   F = Folga    FE = Férias    AT = Atestado    FT = Falta          Trocas de folga: combine antes com o responsável.', 10, '1F2A3A', False)])
    texto(sl, m, H - 9, W - 2 * m, 5, [(AVISO_PLACA, 7, '5B6676', False)], PP_ALIGN.CENTER)
    return pr


def pptx_folga():
    pr, sl = nova_apres(False); W, H, m = 210, 297, 12
    logo_pptx(sl, W / 2 - 35, m + 4, 70, 26)
    caixa(sl, m, m + 40, W - 2 * m, 62, '1351B4', raio=0.08)
    caixa(sl, W / 2 - 20, m + 45, 40, 8, 'FFCD07', raio=0.5)
    texto(sl, W / 2 - 20, m + 45.5, 40, 7, [('AVISO DE FOLGA', 10, '071D41', True)], PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
    texto(sl, m, m + 58, W - 2 * m, 40, [('Hoje estou', 44, 'FFFFFF', True), ('de folga', 44, 'FFFFFF', True)], PP_ALIGN.CENTER)
    y = m + 116
    for rot in ['NOME', 'VOLTO NO DIA', 'QUEM ATENDE NO MEU LUGAR']:
        texto(sl, m + 6, y, W - 2 * m - 12, 7, [(rot, 11, '1351B4', True)])
        texto(sl, m + 6, y + 7, W - 2 * m - 12, 10, [('[escreva aqui]', 18, '1F2A3A', False)])
        ln = sl.shapes.add_connector(1, Mm(m + 6), Mm(y + 18), Mm(W - m - 6), Mm(y + 18)); ln.line.color.rgb = R('9AA6B8'); ln.line.width = Pt(1)
        st = ln._element.find('{http://schemas.openxmlformats.org/presentationml/2006/main}style')
        if st is not None: ln._element.remove(st)
        y += 36
    caixa(sl, m, H - m - 6 - 34, W - 2 * m, 34, 'F4F7FC', raio=0.1)
    texto(sl, m + 12, H - m - 6 - 25, W - 2 * m - 24, 30, [('Aqui todo mundo tem 2 folgas por semana, em rodízio. Assim a equipe descansa e o atendimento continua todos os dias.', 13, '071D41', True)], PP_ALIGN.CENTER)
    texto(sl, m, H - 9, W - 2 * m, 5, [(AVISO_PLACA, 7, '5B6676', False)], PP_ALIGN.CENTER)
    return pr


def pptx_horario():
    pr, sl = nova_apres(False); W, H, m = 210, 297, 12
    caixa(sl, m, m, W - 2 * m, 58, '1351B4', raio=0.08)
    logo_pptx(sl, W / 2 - 32, m + 5, 64, 21, escuro=True)
    texto(sl, m, m + 31, W - 2 * m, 24, [('HORÁRIO DE', 11, 'C9D8F0', True), ('Funcionamento', 32, 'FFFFFF', True)], PP_ALIGN.CENTER)
    y = m + 70
    for i, d in enumerate(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo', 'Feriados']):
        if i % 2 == 0: caixa(sl, m, y + 1, W - 2 * m, 17.5, 'F4F7FC', raio=0.15)
        texto(sl, m + 7, y + 5, 55, 10, [(d, 17, '071D41' if d != 'Feriados' else '1351B4', True)])
        texto(sl, m + 62, y + 5.5, W - 2 * m - 66, 10, [('das  08h00  às  18h00', 15, '1F2A3A', False)])
        y += 19.5
    texto(sl, m + 10, y + 4, W - 2 * m - 20, 20, [('Nossa equipe trabalha na escala 5x2, com 2 folgas por semana em rodízio. O horário de atendimento continua o mesmo.', 11.5, '1351B4', True)], PP_ALIGN.CENTER)
    texto(sl, m, H - 9, W - 2 * m, 5, [('Troque os horários de exemplo pelos da sua empresa. Dia fechado: escreva "fechado".', 7, '5B6676', False)], PP_ALIGN.CENTER)
    return pr


def pptx_clientes():
    pr, sl = nova_apres(False); W, H, m = 210, 297, 12
    logo_pptx(sl, W / 2 - 35, m + 4, 70, 26)
    caixa(sl, W / 2 - 30, m + 42, 60, 8.5, 'FFCD07', raio=0.5)
    texto(sl, W / 2 - 30, m + 42.5, 60, 7.5, [('AVISO AOS CLIENTES', 10, '071D41', True)], PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
    texto(sl, m, m + 56, W - 2 * m, 30, [('Nossa equipe agora', 34, '071D41', True), ('trabalha na', 34, '071D41', True)], PP_ALIGN.CENTER)
    texto(sl, m, m + 88, W - 2 * m, 30, [('escala 5x2', 66, '1351B4', True)], PP_ALIGN.CENTER)
    texto(sl, m + 16, m + 128, W - 2 * m - 32, 30, [('Cada pessoa da nossa equipe agora tem 2 folgas por semana. É a nova lei, e a gente apoia: equipe descansada atende melhor.', 14, '1F2A3A', False)], PP_ALIGN.CENTER)
    bw = (W - 2 * m - 12) / 3
    for i, (a, b) in enumerate([('Mesmos dias', 'e horários de atendimento'), ('Folgas em rodízio', 'para nunca faltar gente'), ('O mesmo cuidado', 'com você de sempre')]):
        x = m + i * (bw + 6)
        caixa(sl, x, m + 166, bw, 30, 'F4F7FC', raio=0.12)
        texto(sl, x, m + 174, bw, 18, [(a, 13, '071D41', True), (b, 10, '5B6676', False)], PP_ALIGN.CENTER)
    texto(sl, m, m + 212, W - 2 * m, 12, [('Obrigado pela preferência.', 20, '071D41', True)], PP_ALIGN.CENTER)
    texto(sl, m, m + 232, W - 2 * m, 12, [('[NOME DA EMPRESA]', 16, '1351B4', True)], PP_ALIGN.CENTER)
    texto(sl, m, H - 9, W - 2 * m, 5, [(AVISO_PLACA, 7, '5B6676', False)], PP_ALIGN.CENTER)
    return pr


ed = []
for (nome, _, _, _), fn in zip(PLACAS, [pptx_semana, pptx_folga, pptx_horario, pptx_clientes]):
    arq = f'{nome}-editavel.pptx'; fn().save(os.path.join(OUT, arq)); ed.append(arq)

# LEIA-ME
from pdfutil import Pagina
pg = Pagina(os.path.join(OUT, 'LEIA-ME.pdf'), 'Plaquinhas de Aviso da Escala - leia-me', assunto='Plaquinhas de Aviso da Escala', aviso='Material de comunicação para imprimir e deixar na loja.')
pg.etiqueta('Plaquinhas de Aviso da Escala')
pg.titulo('Comece por aqui', 28)
pg.par('São 4 plaquinhas para deixar na loja, cada uma em A4 e A3, prontas para imprimir. Todas têm um espaço livre no alto para a logo e o nome da empresa.', 10.5, depois=0.3 * cm)
pg.secao('As plaquinhas')
for n, t in [('01 - Quadro da escala da semana', 'Para o mural da equipe. Escreva os nomes e marque F nos dias de folga. Dica: plastifique e use caneta para quadro branco; assim dá para apagar toda semana.'),
             ('02 - Aviso de folga', 'Para o balcão ou a bancada de quem está de folga. Ótimo para salão, clínica e barbearia, onde o cliente procura um profissional.'),
             ('03 - Horário de funcionamento', 'Para a porta ou a vitrine. Mostra que a loja continua aberta nos mesmos horários.'),
             ('04 - Aviso aos clientes', 'Explica, de um jeito positivo, que a equipe agora trabalha na escala 5x2.')]:
    pg.par(n, 10.5, AZUL_ESC, TXT_B, depois=0.05 * cm); pg.par(t, 9.6, CINZA, depois=0.3 * cm)
pg.secao('Como imprimir')
for t in ['Arquivos terminados em -A4.pdf: impressora comum, papel A4 (folha sulfite). Imprima em "tamanho real" ou "100%", sem "ajustar à página".',
          'Arquivos terminados em -A3.pdf: o dobro do tamanho, para a vitrine. Leve a uma gráfica rápida ou copiadora.',
          'Quer a logo impressa? Abra o arquivo -editavel.pptx no PowerPoint ou no Google Apresentações, troque a caixa "Coloque aqui a sua logo" pela sua imagem, escreva o nome da empresa e salve como PDF.',
          'Sem impressora colorida? Todas ficam legíveis em preto e branco.']:
    pg.c.setFillColor(AZUL); pg.c.circle(pg.M + 0.12 * cm, pg.y - 0.25 * cm, 1.1 * mm, stroke=0, fill=1)
    pg.par(t, 9.8, x=pg.M + 0.5 * cm, depois=0.12 * cm)
pg.par('A escala de cada semana você monta no app Sua Escala 5x2 e manda para a equipe pelo link. O quadro serve para quem prefere ver no mural.', 9.8, AZUL, TXT_B, depois=0)
pg.salvar()

todos = sorted(f for f in os.listdir(OUT) if not f.endswith('.zip'))
zipa(OUT, os.path.join(OUT, 'Plaquinhas-de-Aviso-da-Escala-completo.zip'), todos)
print('\n'.join(todos))
