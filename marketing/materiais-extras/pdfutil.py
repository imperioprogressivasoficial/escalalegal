# Ajudantes de PDF (reportlab) para os materiais impressos do Kit RH.
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm, mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit
from comum import *


class Pagina:
    """Página A4 com faixa azul no topo, título e rodapé com o aviso."""
    def __init__(self, caminho, titulo_doc, tamanho=A4, assunto='Kit RH da 5x2', aviso=AVISO):
        self.c = canvas.Canvas(caminho, pagesize=tamanho)
        self.c.setTitle(titulo_doc); self.c.setAuthor(''); self.c.setSubject(assunto); self.c.setCreator('')
        self.W, self.H = tamanho; self.M = 1.8 * cm; self.assunto = assunto; self.aviso = aviso; self.num = 0
        self.nova()

    def nova(self):
        if self.num: self.c.showPage()
        self.num += 1
        c = self.c
        c.setFillColor(AZUL); c.rect(0, self.H - 6 * mm, self.W, 6 * mm, stroke=0, fill=1)
        c.setFillColor(AMARELO); c.rect(0, self.H - 6 * mm, 3.2 * cm, 6 * mm, stroke=0, fill=1)
        # rodapé
        c.setStrokeColor(CINZA_CL); c.setLineWidth(0.6); c.line(self.M, 1.55 * cm, self.W - self.M, 1.55 * cm)
        c.setFillColor(CINZA); c.setFont('PublicSans-Italic', 7.6); c.drawString(self.M, 1.12 * cm, self.aviso)
        c.setFont(TXT, 7.6); c.drawRightString(self.W - self.M, 1.12 * cm, f'{self.assunto}  ·  {self.num}')
        self.y = self.H - 1.7 * cm

    def precisa(self, h):
        if self.y - h < 2.1 * cm: self.nova()

    def etiqueta(self, txt, cor=AZUL):
        self.c.setFillColor(cor); self.c.setFont(TXT_B, 8); self.c.drawString(self.M, self.y, txt.upper()); self.y -= 0.62 * cm

    def titulo(self, txt, tam=21, cor=AZUL_ESC, larg=None):
        larg = larg or self.W - 2 * self.M
        linhas = simpleSplit(txt, TIT, tam, larg)
        self.c.setFillColor(cor); self.c.setFont(TIT, tam)
        for l in linhas:
            self.c.drawString(self.M, self.y - tam * 0.8, l); self.y -= tam * 1.08
        self.y -= 0.2 * cm

    def par(self, txt, tam=10, cor=TEXTO, fonte=TXT, larg=None, x=None, entre=1.42, depois=0.28 * cm):
        x = self.M if x is None else x
        larg = larg or self.W - self.M - x
        linhas = simpleSplit(txt, fonte, tam, larg)
        self.precisa(len(linhas) * tam * entre)
        self.c.setFillColor(cor); self.c.setFont(fonte, tam)
        for l in linhas:
            self.c.drawString(x, self.y - tam, l); self.y -= tam * entre
        self.y -= depois

    def secao(self, txt, tam=12.5):
        self.precisa(1.6 * cm)
        self.y -= 0.25 * cm
        self.c.setFillColor(AZUL); self.c.setFont(TIT, tam); self.c.drawString(self.M, self.y - tam, txt)
        self.y -= tam + 0.3 * cm

    def caixa_check(self, x, y, s=3.6 * mm):
        self.c.setStrokeColor(AZUL); self.c.setLineWidth(1.1); self.c.roundRect(x, y, s, s, 0.7 * mm, stroke=1, fill=0)

    def check(self, txt, sub=None, tam=10):
        larg = self.W - 2 * self.M - 0.9 * cm
        l1 = simpleSplit(txt, TXT_SB, tam, larg); l2 = simpleSplit(sub, TXT, tam - 1.3, larg) if sub else []
        h = len(l1) * tam * 1.38 + len(l2) * (tam - 1.3) * 1.4 + 0.28 * cm
        self.precisa(h)
        self.caixa_check(self.M, self.y - tam * 0.95)
        self.c.setFillColor(TEXTO); self.c.setFont(TXT_SB, tam)
        for l in l1:
            self.c.drawString(self.M + 0.75 * cm, self.y - tam * 0.9, l); self.y -= tam * 1.38
        self.c.setFillColor(CINZA); self.c.setFont(TXT, tam - 1.3)
        for l in l2:
            self.c.drawString(self.M + 0.75 * cm, self.y - (tam - 1.3) * 0.9, l); self.y -= (tam - 1.3) * 1.4
        self.y -= 0.28 * cm

    def linha_campo(self, rotulo, x, y, larg, tam=9):
        self.c.setFillColor(CINZA); self.c.setFont(TXT, tam - 1.5); self.c.drawString(x, y + 0.42 * cm, rotulo)
        self.c.setStrokeColor(HexColor('#9aa6b8')); self.c.setLineWidth(0.7); self.c.line(x, y, x + larg, y)

    def salvar(self):
        self.c.save()
