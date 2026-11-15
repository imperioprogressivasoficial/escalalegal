# Coisas comuns aos geradores dos materiais extras (Kit RH, Calculadora, Plaquinhas).
import os, re
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor

AQUI = os.path.dirname(os.path.abspath(__file__))
EXTRAS = os.path.normpath(os.path.join(AQUI, '..', '..', 'app', 'extras'))

AZUL = HexColor('#1351b4'); AZUL_ESC = HexColor('#071d41'); AZUL_CLARO = HexColor('#e8f0fc')
VERDE = HexColor('#168821'); AMARELO = HexColor('#ffcd07'); CINZA = HexColor('#5b6676')
CINZA_CL = HexColor('#dfe3ea'); TEXTO = HexColor('#1f2a3a'); BRANCO = HexColor('#ffffff')

AVISO = 'Modelo de referência. Confira com o seu contador ou advogado antes de assinar.'
AVISO_PLACA = 'Material de comunicação. As regras da escala seguem a EC 141/2026 e a convenção coletiva da sua categoria.'

for nome in ['Archivo-Bold', 'Archivo-ExtraBold', 'Archivo-Black', 'PublicSans-Regular', 'PublicSans-SemiBold', 'PublicSans-Bold', 'PublicSans-Italic']:
    pdfmetrics.registerFont(TTFont(nome, os.path.join(AQUI, 'fonts', nome + '.ttf')))
from reportlab.lib.fonts import addMapping
addMapping('PublicSans-Regular', 0, 0, 'PublicSans-Regular')
addMapping('PublicSans-Regular', 1, 0, 'PublicSans-Bold')
addMapping('PublicSans-Regular', 0, 1, 'PublicSans-Italic')
addMapping('PublicSans-Regular', 1, 1, 'PublicSans-Bold')

TIT = 'Archivo-ExtraBold'; TIT_PESADO = 'Archivo-Black'; TXT = 'PublicSans-Regular'; TXT_B = 'PublicSans-Bold'; TXT_SB = 'PublicSans-SemiBold'


def pasta(*p):
    d = os.path.join(EXTRAS, *p)
    os.makedirs(d, exist_ok=True)
    return d


def zipa(dir_origem, destino, arquivos):
    import zipfile
    with zipfile.ZipFile(destino, 'w', zipfile.ZIP_DEFLATED) as z:
        for a in arquivos:
            z.write(os.path.join(dir_origem, a), a)
