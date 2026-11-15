# Gera a Calculadora de Custo da 5x2 (.xlsx com fórmulas, funciona no Excel e no Google Planilhas).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comum import pasta, zipa
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, Protection
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule, CellIsRule
from openpyxl.comments import Comment

OUT = pasta('calculadora')
NOME = 'Calculadora-de-Custo-da-5x2.xlsx'
AVISO = 'Estimativa para tomar decisão. Os percentuais de encargos são aproximados: confira com o seu contador.'

F = lambda **k: Font(name='Arial', **{'size': 10, 'color': '1F2A3A', **k})
fill = lambda c: PatternFill('solid', fgColor=c)
AZUL, ESC, CLARO, ENTRADA, CINZA, VERDE_CL, AMAR = '1351B4', '071D41', 'E8F0FC', 'FFF6CC', 'F3F5F8', 'E3F4E5', 'FFCD07'
fino = Side(style='thin', color='C9D1DD'); B = Border(left=fino, right=fino, top=fino, bottom=fino)
borda_ent = Side(style='thin', color='E0B800'); BE = Border(left=borda_ent, right=borda_ent, top=borda_ent, bottom=borda_ent)
LIVRE = Protection(locked=False)
MOEDA = '"R$" #,##0.00'; HORAS = '0.0" h"'; PCT = '0.00%'

wb = Workbook()

# ------------------------------------------------------------------ Comece aqui
wi = wb.active; wi.title = 'Comece aqui'
wi.sheet_view.showGridLines = False
wi.column_dimensions['A'].width = 3; wi.column_dimensions['B'].width = 6; wi.column_dimensions['C'].width = 92
wi['B2'] = 'Calculadora de Custo da 5x2'; wi['B2'].font = F(bold=True, size=20, color=ESC)
wi['B3'] = 'Quanto a escala 5x2 muda o custo da sua equipe, e se compensa mais fazer hora extra ou contratar.'; wi['B3'].font = F(size=11, color='5B6676')
passos = [
    ('1', 'Abra a aba Calculadora. Preencha só as células amarelas: elas são as únicas que dá para editar.'),
    ('2', 'Escolha o regime da empresa (Simples Nacional ou Lucro Presumido / Real). Os encargos mudam sozinhos.'),
    ('3', 'Preencha os dias e horários em que a empresa abre e quantas pessoas precisam estar trabalhando ao mesmo tempo em cada dia.'),
    ('4', 'Liste os funcionários com o salário e as horas por semana de hoje (na 6x1, normalmente 44).'),
    ('5', 'Pronto: veja quantas horas faltam por semana, o custo de cobrir com hora extra, o custo de contratar e a comparação 6x1 x 5x2.'),
]
r = 5
for n, t in passos:
    wi.cell(row=r, column=2, value=n).font = F(bold=True, size=14, color='FFFFFF'); wi.cell(row=r, column=2).fill = fill(AZUL)
    wi.cell(row=r, column=2).alignment = Alignment(horizontal='center', vertical='center')
    wi.cell(row=r, column=3, value=t).font = F(size=11); wi.cell(row=r, column=3).alignment = Alignment(vertical='center', wrap_text=True, indent=1)
    wi.row_dimensions[r].height = 30; r += 2
wi.cell(row=r, column=2, value='O que a calculadora considera').font = F(bold=True, size=12, color=AZUL); r += 1
for t in ['Limite da nova lei (EC 141/2026): 42 horas por semana de 15/12/2026 a 14/12/2027 e 40 horas por semana a partir de 15/12/2027. O salário não muda.',
          'Valor da hora = salário ÷ (horas por semana x 5). Com menos horas e o mesmo salário, a hora fica mais cara.',
          'Hora extra: adicional de 50% (você pode mudar), mais o reflexo no descanso semanal, no 13º e nas férias, e os encargos. No máximo 2 horas a mais por dia por pessoa (CLT, art. 59).',
          'Novo funcionário: salário + encargos (INSS da empresa, RAT, terceiros, FGTS, 13º, férias + 1/3) + benefícios por mês.',
          'Simples Nacional: a maioria das empresas do comércio e serviços não paga o INSS da empresa sobre a folha. Se a sua empresa é do Anexo IV (ex.: limpeza, vigilância, obras), escolha Lucro Presumido / Real.',
          'Mês = 52 semanas ÷ 12 = 4,33 semanas.']:
    wi.cell(row=r, column=2, value='•').font = F(bold=True, color=AZUL); wi.cell(row=r, column=2).alignment = Alignment(horizontal='right', vertical='top')
    wi.cell(row=r, column=3, value=t).alignment = Alignment(wrap_text=True, vertical='top', indent=1); wi.row_dimensions[r].height = 30; r += 1
r += 1
wi.cell(row=r, column=2, value='O exemplo').font = F(bold=True, size=12, color=AZUL); r += 1
wi.cell(row=r, column=3, value='A planilha já vem com um mercado de bairro com 8 funcionários. Troque pelos seus números: as contas se refazem na hora. No Google Planilhas, use Arquivo > Importar (ou abra pelo Google Drive).').alignment = Alignment(wrap_text=True, indent=1)
wi.row_dimensions[r].height = 30; r += 2
wi.cell(row=r, column=3, value=AVISO).font = F(italic=True, size=9, color='5B6676')
wi.protection.sheet = True
wi.merge_cells('B2:C2'); wi.merge_cells('B3:C3')
wi.page_setup.paperSize = wi.PAPERSIZE_A4; wi.page_setup.fitToWidth = 1; wi.page_setup.fitToHeight = 1; wi.sheet_properties.pageSetUpPr.fitToPage = True

# ------------------------------------------------------------------ Calculadora
ws = wb.create_sheet('Calculadora')
ws.sheet_view.showGridLines = False
for col, w in zip('ABCDEFGHI', [2, 40, 15, 15, 15, 15, 15, 2, 2]): ws.column_dimensions[col].width = w


def titulo_bloco(row, texto, sub=None):
    ws.merge_cells(f'B{row}:G{row}')
    c = ws[f'B{row}']; c.value = texto; c.font = F(bold=True, size=12, color='FFFFFF'); c.fill = fill(AZUL)
    c.alignment = Alignment(vertical='center', indent=1); ws.row_dimensions[row].height = 22
    for col in 'CDEFG': ws[f'{col}{row}'].fill = fill(AZUL)
    if sub:
        ws.merge_cells(f'B{row+1}:G{row+1}'); ws[f'B{row+1}'] = sub; ws[f'B{row+1}'].font = F(size=9, color='5B6676', italic=True)


def rotulo(cel, txt, **k):
    ws[cel] = txt; ws[cel].font = F(**k); ws[cel].alignment = Alignment(vertical='center', wrap_text=True)


def entrada(cel, val, fmt=None):
    c = ws[cel]; c.value = val; c.fill = fill(ENTRADA); c.border = BE; c.protection = LIVRE; c.font = F(bold=True, color='3A2E00')
    c.alignment = Alignment(horizontal='center', vertical='center')
    if fmt: c.number_format = fmt


def calc(cel, formula, fmt=None, negrito=False, cor='1F2A3A', fundo=None):
    c = ws[cel]; c.value = formula; c.border = B; c.font = F(bold=negrito, color=cor); c.alignment = Alignment(horizontal='center', vertical='center')
    if fmt: c.number_format = fmt
    if fundo: c.fill = fill(fundo)


ws.merge_cells('B1:G1'); ws['B1'] = 'Calculadora de Custo da 5x2'; ws['B1'].font = F(bold=True, size=18, color=ESC); ws.row_dimensions[1].height = 30
ws.merge_cells('B2:G2'); ws['B2'] = 'Preencha só as células amarelas. O resto é calculado.'; ws['B2'].font = F(size=10, color='5B6676')

# --- 1. empresa
titulo_bloco(4, '1. Sua empresa')
rotulo('B5', 'Nome da empresa'); ws.merge_cells('C5:E5'); entrada('C5', 'Mercado Bom Preço (exemplo)')
for col in 'DE': ws[f'{col}5'].fill = fill(ENTRADA); ws[f'{col}5'].border = BE
rotulo('B6', 'Regime tributário'); ws.merge_cells('C6:E6'); entrada('C6', 'Simples Nacional')
for col in 'DE': ws[f'{col}6'].fill = fill(ENTRADA); ws[f'{col}6'].border = BE
dv = DataValidation(type='list', formula1='"Simples Nacional,Lucro Presumido / Real"', allow_blank=False, showDropDown=False)
dv.error = 'Escolha uma das opções da lista.'; dv.errorTitle = 'Regime'; ws.add_data_validation(dv); dv.add('C6')
rotulo('B7', 'Salário de um novo funcionário (R$ por mês)'); entrada('C7', 1750, MOEDA)
rotulo('B8', 'Benefícios por funcionário (VT, VR... R$ por mês)'); entrada('C8', 280, MOEDA)
rotulo('B9', 'Adicional da hora extra'); entrada('C9', 0.5, '0%')
rotulo('D7', '  ← o salário que você pagaria para quem entrar', size=9, color='5B6676'); ws.merge_cells('D7:G7')
rotulo('D9', '  ← mínimo da lei: 50%. Veja a sua convenção.', size=9, color='5B6676'); ws.merge_cells('D9:G9')

# --- 2. funcionamento
titulo_bloco(11, '2. Dias e horários de funcionamento', 'Para cada dia: quantas horas a empresa fica aberta e quantas pessoas precisam estar trabalhando ao mesmo tempo. Dia fechado: deixe 0.')
for j, h in enumerate(['Dia', 'Horas aberta', 'Pessoas ao mesmo tempo', 'Horas de trabalho']):
    c = ws.cell(row=13, column=2 + j, value=h); c.font = F(bold=True, size=9, color=ESC); c.fill = fill(CLARO); c.border = B
    c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
ws.row_dimensions[13].height = 28
dias = [('Segunda', 13, 4), ('Terça', 13, 4), ('Quarta', 13, 4), ('Quinta', 13, 4), ('Sexta', 13, 4), ('Sábado', 13, 5), ('Domingo', 6, 3)]
for i, (d, h, p) in enumerate(dias):
    r = 14 + i
    rotulo(f'B{r}', d); ws[f'B{r}'].border = B
    entrada(f'C{r}', h, '0.0'); entrada(f'D{r}', p, '0')
    calc(f'E{r}', f'=C{r}*D{r}', HORAS)
calc('B21', 'Total que a empresa precisa por semana', negrito=True, cor=ESC); ws['B21'].alignment = Alignment(horizontal='left', indent=0, vertical='center')
calc('C21', '=COUNTIF(C14:C20,">0")&" dias abertos"', cor='5B6676')
calc('D21', '', None); calc('E21', '=SUM(E14:E20)', HORAS, negrito=True, cor='FFFFFF', fundo=AZUL)
for col in 'BCD': ws[f'{col}21'].fill = fill(CLARO)
dvh = DataValidation(type='decimal', operator='between', formula1='0', formula2='24'); dvh.error = 'De 0 a 24 horas.'; ws.add_data_validation(dvh); dvh.add('C14:C20')
dvp = DataValidation(type='whole', operator='between', formula1='0', formula2='500'); dvp.error = 'Número de pessoas de 0 a 500.'; ws.add_data_validation(dvp); dvp.add('D14:D20')

# --- 3. funcionários
titulo_bloco(23, '3. Funcionários', 'Um por linha (até 30). Horas por semana hoje: na 6x1 costuma ser 44. Quem trabalha meio período, coloque as horas reais.')
cab = ['Nome', 'Salário mensal', 'Horas/semana hoje', 'Horas na 5x2 (42h)', 'Horas na 5x2 (40h)', 'Valor da hora hoje']
for j, h in enumerate(cab):
    c = ws.cell(row=25, column=2 + j, value=h); c.font = F(bold=True, size=9, color=ESC); c.fill = fill(CLARO); c.border = B
    c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
ws.row_dimensions[25].height = 28
equipe = [('Joana (encarregada)', 2900, 44), ('Paulo (açougueiro)', 2400, 44), ('Rita (caixa)', 1750, 44), ('Marcos (caixa)', 1750, 44),
          ('Luana (caixa)', 1750, 44), ('Carlos (repositor)', 1800, 44), ('Bruno (repositor)', 1800, 44), ('Sônia (padaria)', 1950, 44)]
F0, F1 = 26, 55
for i in range(30):
    r = F0 + i
    nome, sal, hrs = equipe[i] if i < len(equipe) else (None, None, None)
    entrada(f'B{r}', nome); ws[f'B{r}'].alignment = Alignment(horizontal='left', vertical='center', indent=1); ws[f'B{r}'].font = F(color='3A2E00')
    entrada(f'C{r}', sal, MOEDA); entrada(f'D{r}', hrs, '0')
    calc(f'E{r}', f'=IF(OR(C{r}="",D{r}=""),"",MIN(D{r},Parametros!$C$5))', '0', cor='5B6676')
    calc(f'F{r}', f'=IF(OR(C{r}="",D{r}=""),"",MIN(D{r},Parametros!$D$5))', '0', cor='5B6676')
    calc(f'G{r}', f'=IF(OR(C{r}="",D{r}="",D{r}=0),"",C{r}/(D{r}*5))', MOEDA, cor='5B6676')
dvs = DataValidation(type='decimal', operator='between', formula1='0', formula2='1000000'); dvs.error = 'Digite o salário em reais, só o número.'; ws.add_data_validation(dvs); dvs.add(f'C{F0}:C{F1}')
dvd = DataValidation(type='decimal', operator='between', formula1='0', formula2='44'); dvd.error = 'Horas por semana de 0 a 44.'; ws.add_data_validation(dvd); dvd.add(f'D{F0}:D{F1}')
R = F1 + 1  # 56 totais
calc(f'B{R}', '=COUNT(C26:C55)&" funcionários"', negrito=True, cor=ESC); ws[f'B{R}'].alignment = Alignment(horizontal='left', vertical='center')
calc(f'C{R}', '=SUM(C26:C55)', MOEDA, negrito=True); calc(f'D{R}', '=SUM(D26:D55)', HORAS, negrito=True)
calc(f'E{R}', '=SUM(E26:E55)', HORAS, negrito=True); calc(f'F{R}', '=SUM(F26:F55)', HORAS, negrito=True)
calc(f'G{R}', '=IF(D56=0,"",C56/(D56*5))', MOEDA, negrito=True)
for col in 'BCDEFG': ws[f'{col}{R}'].fill = fill(CLARO)
ws[f'G{R}'].comment = Comment('Média ponderada: soma dos salários dividida pela soma das horas do mês.', 'Calculadora')

# --- 4. resultado (6x1 hoje x 5x2 42h x 5x2 40h)
titulo_bloco(58, '4. Resultado: 6x1 hoje x 5x2', 'Cada coluna mostra a mesma equipe e a mesma necessidade de horas, com o limite de horas de cada fase da lei.')
for j, h in enumerate(['', '6x1 hoje', '5x2 a partir de 15/12/2026', '5x2 a partir de 15/12/2027']):
    c = ws.cell(row=60, column=2 + j, value=h or None); c.font = F(bold=True, size=9, color='FFFFFF' if h else ESC); c.border = B
    c.fill = fill(ESC if h else 'FFFFFF'); c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
ws.row_dimensions[60].height = 30
COL = {'C': ('D', 'Parametros!$B$5'), 'D': ('E', 'Parametros!$C$5'), 'E': ('F', 'Parametros!$D$5')}  # coluna do resultado -> (coluna de horas da equipe, limite)
linhas = [
    ('Limite de horas por semana', lambda c, h, L: f'={L}', '0" h"'),
    ('Folgas por semana, por pessoa', lambda c, h, L: '=1' if c == 'C' else '=2', '0'),
    ('Horas por dia, no limite da semana', lambda c, h, L: f'={L}/6/24' if c == 'C' else f'={L}/5/24', '[h]:mm'),
    ('Horas que a empresa precisa por semana', lambda c, h, L: '=$E$21', HORAS),
    ('Horas que a equipe cobre por semana', lambda c, h, L: f'={h}56', HORAS),
    ('Horas que faltam por semana', lambda c, h, L: f'=MAX(0,{c}64-{c}65)', HORAS),
    ('Valor médio da hora (sem encargos)', lambda c, h, L: f'=IF({h}56=0,0,$C$56/({h}56*5))', MOEDA),
    ('Folha de salários por mês', lambda c, h, L: '=$C$56', MOEDA),
    ('Folha com encargos e benefícios por mês', lambda c, h, L: '=$C$56*(1+Parametros!$C$19)+COUNT($C$26:$C$55)*$C$8', MOEDA),
    ('Cobrir com hora extra: custo por mês', lambda c, h, L: f'={c}66*Parametros!$C$22*{c}67*(1+$C$9)*Parametros!$C$24', MOEDA),
    ('Hora extra possível por semana (máx. 2h/dia)', lambda c, h, L: f'=COUNT($C$26:$C$55)*{"6" if c == "C" else "5"}*2', HORAS),
    ('Pessoas a contratar para cobrir', lambda c, h, L: f'=IF({c}66=0,0,ROUNDUP({c}66/{c}61,0))', '0'),
    ('Contratar: custo por mês', lambda c, h, L: f'={c}72*($C$7*(1+Parametros!$C$19)+$C$8)', MOEDA),
    ('Melhor opção', lambda c, h, L: f'=IF({c}66=0,"Não falta hora",IF({c}66>{c}71,"Contratar (hora extra não cobre)",IF({c}70<{c}73,"Hora extra (por enquanto)","Contratar")))', None),
    ('Custo da opção escolhida por mês', lambda c, h, L: f'=IF({c}66=0,0,IF({c}66>{c}71,{c}73,MIN({c}70,{c}73)))', MOEDA),
    ('Custo total por mês', lambda c, h, L: f'={c}69+{c}75', MOEDA),
    ('Diferença por mês em relação a hoje', lambda c, h, L: f'={c}76-$C$76', MOEDA),
    ('Diferença por ano', lambda c, h, L: f'={c}77*12', MOEDA),
]
for i, (nome, f, fmt) in enumerate(linhas):
    r = 61 + i
    rotulo(f'B{r}', nome); ws[f'B{r}'].border = B
    destaque = r in (66, 74, 76, 77)
    if destaque: ws[f'B{r}'].font = F(bold=True, color=ESC)
    for c, (h, L) in COL.items():
        calc(f'{c}{r}', f(c, h, L), fmt, negrito=destaque, cor=ESC if destaque else '1F2A3A')
        if r in (76,): ws[f'{c}{r}'].fill = fill(CLARO)
    ws.row_dimensions[r].height = 18
for c in 'CDE':
    ws[f'{c}74'].alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
ws.row_dimensions[74].height = 30
ws.conditional_formatting.add('C66:E66', CellIsRule(operator='greaterThan', formula=['0'], font=Font(name='Arial', bold=True, color='B42318'), fill=fill('FDECEC')))
ws.conditional_formatting.add('C66:E66', CellIsRule(operator='equal', formula=['0'], font=Font(name='Arial', bold=True, color='168821'), fill=fill(VERDE_CL)))
ws.conditional_formatting.add('C74:E74', FormulaRule(formula=['LEFT(C74,8)="Contrata"'], font=Font(name='Arial', bold=True, color='071D41'), fill=fill('FFF1B8')))
ws.conditional_formatting.add('C74:E74', FormulaRule(formula=['LEFT(C74,4)="Hora"'], font=Font(name='Arial', bold=True, color='071D41'), fill=fill('E8F0FC')))
ws.conditional_formatting.add('C74:E74', FormulaRule(formula=['LEFT(C74,4)="Não "'], font=Font(name='Arial', bold=True, color='168821'), fill=fill(VERDE_CL)))
ws.conditional_formatting.add('D77:E78', CellIsRule(operator='greaterThan', formula=['0'], font=Font(name='Arial', bold=True, color='B42318')))

ws.merge_cells('B79:G79'); ws['B79'] = 'Na 5x2 de 42h, cada pessoa faria 8h24 por dia: isso só vale com acordo coletivo. Sem ele, o limite prático já é 40h (5 dias de 8h).'
ws['B79'].font = F(size=9, italic=True, color='5B6676'); ws['B79'].alignment = Alignment(wrap_text=True, vertical='center'); ws.row_dimensions[79].height = 26
# --- 5. resumo em texto
titulo_bloco(80, '5. Em resumo')
ws.merge_cells('B81:G81'); ws.merge_cells('B82:G82'); ws.merge_cells('B83:G83'); ws.merge_cells('B84:G84')
ws['B81'] = ('="Na 5x2 de 42h, faltam "&FIXED(D66,1)&" horas por semana. Na de 40h (a partir de 15/12/2027), faltam "&FIXED(E66,1)&" horas."')
ws['B82'] = ('="Hora extra para cobrir as 40h: R$ "&FIXED(E70,0)&" por mês. Contratar "&E72&" pessoa(s): R$ "&FIXED(E73,0)&" por mês."')
ws['B83'] = ('="Novo funcionário custa R$ "&FIXED($C$7*(1+Parametros!$C$19)+$C$8,0)&" por mês com encargos e benefícios ("&TEXT(Parametros!$C$19,"0%")&" de encargos no "&$C$6&")."')
ws['B84'] = '="Hora extra todo dia vira custo fixo e risco trabalhista. Se a falta é de todo dia, contratar costuma ser o caminho mais seguro."'
for r in range(81, 85):
    ws[f'B{r}'].font = F(size=10.5, bold=r < 83, color=ESC if r < 83 else '1F2A3A'); ws[f'B{r}'].alignment = Alignment(wrap_text=True, vertical='center', indent=1)
    ws.row_dimensions[r].height = 30
ws.merge_cells('B86:G86'); ws['B86'] = AVISO; ws['B86'].font = F(italic=True, size=9, color='5B6676')
ws.freeze_panes = 'A3'
ws.protection.sheet = True; ws.protection.formatColumns = False; ws.protection.formatRows = False
ws.page_setup.paperSize = ws.PAPERSIZE_A4; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
ws.sheet_properties.pageSetUpPr.fitToPage = True; ws.print_area = 'A1:H86'
ws.row_breaks.append(__import__('openpyxl').worksheet.pagebreak.Break(id=57))

# ------------------------------------------------------------------ Parâmetros (encargos)
wp = wb.create_sheet('Parametros')
wp.sheet_view.showGridLines = False
for col, w in zip('ABCDE', [42, 18, 18, 18, 60]): wp.column_dimensions[col].width = w
wp['A1'] = 'Parâmetros e encargos'; wp['A1'].font = F(bold=True, size=16, color=ESC)
wp['A2'] = 'Já vem preenchido com valores de referência. Mude só se o seu contador passar outros números (células amarelas).'; wp['A2'].font = F(size=9.5, color='5B6676')
for j, h in enumerate(['Limite de horas por semana', '6x1 hoje', '5x2 (15/12/2026)', '5x2 (15/12/2027)']):
    c = wp.cell(row=4, column=1 + j, value=h); c.font = F(bold=True, size=9, color='FFFFFF'); c.fill = fill(AZUL); c.border = B; c.alignment = Alignment(horizontal='center', wrap_text=True)
wp['A5'] = 'Horas por semana'; wp['A5'].border = B
for col, v in zip('BCD', [44, 42, 40]):
    c = wp[f'{col}5']; c.value = v; c.border = B; c.alignment = Alignment(horizontal='center'); c.font = F(bold=True)
wp['E5'] = 'EC 141/2026: 42h a partir de 15/12/2026 e 40h a partir de 15/12/2027.'; wp['E5'].font = F(size=9, color='5B6676')

for j, h in enumerate(['Encargo (sobre o salário)', 'Simples Nacional', 'Lucro Presumido / Real', 'Usado agora', 'O que é']):
    c = wp.cell(row=7, column=1 + j, value=h); c.font = F(bold=True, size=9, color='FFFFFF'); c.fill = fill(AZUL); c.border = B; c.alignment = Alignment(horizontal='center', wrap_text=True)
enc = [
    ('INSS da empresa (patronal)', 0, 0.20, 'Simples (Anexos I, II, III e V): já vem no DAS. Lucro Presumido / Real: 20%.'),
    ('RAT / SAT (risco de acidente)', 0, 0.02, 'De 1% a 3%, conforme a atividade. Pergunte ao contador.'),
    ('Terceiros (Sistema S, salário-educação)', 0, 0.058, 'Em média 5,8%. No Simples já vem no DAS.'),
    ('FGTS', 0.08, 0.08, '8% para todos os regimes.'),
    ('13º salário', 1 / 12, 1 / 12, '1 salário por ano ÷ 12 meses.'),
    ('Férias + 1/3', (1 / 12) * (4 / 3), (1 / 12) * (4 / 3), '1 salário + 1/3 por ano ÷ 12 meses.'),
]
for i, (n, s, l, o) in enumerate(enc):
    r = 8 + i
    wp[f'A{r}'] = n; wp[f'A{r}'].border = B; wp[f'A{r}'].font = F()
    for col, v in (('B', s), ('C', l)):
        c = wp[f'{col}{r}']; c.value = v; c.number_format = PCT; c.fill = fill(ENTRADA); c.border = BE; c.protection = LIVRE; c.alignment = Alignment(horizontal='center'); c.font = F(bold=True, color='3A2E00')
    c = wp[f'D{r}']; c.value = f'=IF(Calculadora!$C$6="Simples Nacional",B{r},C{r})'; c.number_format = PCT; c.border = B; c.alignment = Alignment(horizontal='center'); c.font = F(bold=True)
    wp[f'E{r}'] = o; wp[f'E{r}'].font = F(size=9, color='5B6676'); wp[f'E{r}'].alignment = Alignment(wrap_text=True)
wp['A14'] = 'Encargos que incidem sobre 13º e férias'; wp['A14'].border = B
wp['D14'] = '=(D12+D13)*(D8+D9+D10+D11)'; wp['D14'].number_format = PCT; wp['D14'].border = B; wp['D14'].alignment = Alignment(horizontal='center'); wp['D14'].font = F(bold=True)
wp['E14'] = 'INSS, RAT, terceiros e FGTS também são pagos sobre o 13º e as férias.'; wp['E14'].font = F(size=9, color='5B6676')
wp['A16'] = 'Resumo'; wp['A16'].font = F(bold=True, size=12, color=AZUL)
wp['A17'] = 'Encargos diretos (INSS, RAT, terceiros, FGTS)'; wp['C17'] = '=SUM(D8:D11)'
wp['A18'] = '13º, férias + 1/3 e encargos sobre eles'; wp['C18'] = '=D12+D13+D14'
wp['A19'] = 'Total de encargos sobre o salário'; wp['C19'] = '=C17+C18'
wp['A21'] = 'Hora extra'; wp['A21'].font = F(bold=True, size=12, color=AZUL)
wp['A22'] = 'Semanas por mês'; wp['C22'] = '=52/12'
wp['A23'] = 'Reflexo no descanso semanal (DSR)'; wp['C23'] = 1 / 6
wp['A24'] = 'Fator da hora extra (DSR, 13º, férias e encargos)'; wp['C24'] = '=(1+C23)*(1+D12+D13)*(1+C17)'
wp['E23'] = 'Hora extra feita todo mês reflete no descanso semanal remunerado. 1/6 é a média usada; confira com o contador.'
wp['E24'] = 'Quanto custa, de verdade, cada R$ 1 de hora extra paga.'
for r in (17, 18, 19, 22, 23, 24):
    c = wp[f'C{r}']; c.border = B; c.alignment = Alignment(horizontal='center'); c.font = F(bold=True)
    c.number_format = '0.00' if r in (22, 24) else PCT
    wp[f'A{r}'].border = B
wp['C19'].fill = fill(CLARO); wp['C19'].font = F(bold=True, color=ESC)
wp['C23'].fill = fill(ENTRADA); wp['C23'].border = BE; wp['C23'].protection = LIVRE
for r in (23, 24): wp[f'E{r}'].font = F(size=9, color='5B6676'); wp[f'E{r}'].alignment = Alignment(wrap_text=True)
wp['A27'] = AVISO; wp['A27'].font = F(italic=True, size=9, color='5B6676')
wp.protection.sheet = True
wp.page_setup.paperSize = wp.PAPERSIZE_A4; wp.page_setup.orientation = 'landscape'; wp.page_setup.fitToWidth = 1; wp.page_setup.fitToHeight = 1; wp.sheet_properties.pageSetUpPr.fitToPage = True

wb.active = 1
caminho = os.path.join(OUT, NOME)
wb.save(caminho)
zipa(OUT, os.path.join(OUT, 'Calculadora-de-Custo-da-5x2.zip'), [NOME])
print(caminho)
