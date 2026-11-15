# Gera o Kit RH da 5x2 em app/extras/kit-rh/.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comum import *
from docxutil import Modelo
from pdfutil import Pagina, cm, mm, A4, landscape, simpleSplit

OUT = pasta('kit-rh')
USO = ['Troque todos os campos marcados em amarelo pelos dados reais. Depois de preencher, tire o marcador amarelo (Página Inicial > Cor de realce > Sem cor).',
       'Apague este quadro antes de imprimir. Imprima em 2 vias: uma fica com a empresa e a outra com o empregado.']

# ------------------------------------------------------------------ 01 termo aditivo
m = Modelo('Termo aditivo ao contrato de trabalho', 'Alteração da jornada: da escala 6x1 para a escala 5x2')
m.quadro('Como usar este modelo', USO + ['Faça um termo para cada empregado que hoje trabalha em 6x1. Se a convenção coletiva da categoria trouxer regra própria sobre jornada ou escala, siga a convenção e ajuste o texto com o seu contador.'])
m.p('Pelo presente instrumento, de um lado **[RAZÃO SOCIAL DA EMPRESA]**, inscrita no CNPJ sob o nº [00.000.000/0000-00], com sede em [ENDEREÇO COMPLETO], neste ato representada por [NOME DO REPRESENTANTE], [CARGO DO REPRESENTANTE], doravante denominada **EMPREGADORA**; e, de outro lado, **[NOME COMPLETO DO EMPREGADO]**, inscrito(a) no CPF sob o nº [000.000.000-00], ocupante do cargo de [CARGO], admitido(a) em [DATA DE ADMISSÃO], doravante denominado(a) **EMPREGADO(A)**, resolvem firmar este Termo Aditivo ao Contrato Individual de Trabalho, nas condições abaixo.')
m.clausula('Considerações iniciais',
    'Considerando que a Emenda Constitucional nº 141/2026 alterou o art. 7º, incisos XIII e XV, da Constituição Federal, garantindo a cada trabalhador duas folgas por semana e limitando a jornada a 8 (oito) horas por dia e a 42 (quarenta e duas) horas por semana a partir de 15/12/2026, e a 40 (quarenta) horas por semana a partir de 15/12/2027, sem redução de salário;',
    'Considerando que as partes desejam adequar o contrato de trabalho à nova regra, de forma clara e por escrito;')
m.clausula('Cláusula 1ª - Objeto',
    'Este termo altera a jornada de trabalho do(a) EMPREGADO(A), que deixa a escala 6x1 (seis dias de trabalho e um de descanso) e passa a cumprir a escala 5x2 (cinco dias de trabalho e dois de descanso por semana), a partir de [DATA DE INÍCIO DA NOVA JORNADA].')
m.clausula('Cláusula 2ª - Jornada e horário',
    'A jornada passa a ser de [8] horas por dia, das [08h00] às [17h00], com intervalo de [1 hora] para repouso e alimentação, de [12h00] às [13h00], totalizando [40] horas por semana.',
    'A jornada semanal nunca passará do limite constitucional em vigor: 42 horas por semana de 15/12/2026 a 14/12/2027 e 40 horas por semana a partir de 15/12/2027. Entre o fim de uma jornada e o início da outra haverá, no mínimo, 11 horas de descanso (CLT, art. 66), e o intervalo para repouso e alimentação seguirá o art. 71 da CLT.')
m.clausula('Cláusula 3ª - Folgas semanais',
    'O(A) EMPREGADO(A) terá 2 (duas) folgas por semana, definidas da seguinte forma (marque uma opção):',
    '(   ) Folgas fixas, sempre em: [DIA DA SEMANA] e [DIA DA SEMANA].',
    '(   ) Folgas em escala de revezamento, divulgada no quadro de avisos e pelo link da escala com pelo menos [7] dias de antecedência.',
    'Uma das folgas cairá no domingo sempre que possível. No comércio, o descanso coincidirá com o domingo pelo menos uma vez a cada três semanas (Lei 10.101/2000, art. 6º). Nas demais atividades que funcionam aos domingos, será observada a regra aplicável à atividade e a convenção coletiva da categoria.')
m.clausula('Cláusula 4ª - Salário',
    'O salário do(a) EMPREGADO(A) fica mantido em R$ [0.000,00] ([VALOR POR EXTENSO]) por mês, sem nenhuma redução por causa da diminuição da jornada, conforme a Emenda Constitucional nº 141/2026. Ficam mantidos também os demais benefícios já pagos.')
m.clausula('Cláusula 5ª - Horas extras e feriados',
    'O trabalho além da jornada prevista neste termo será pago como hora extra, com adicional mínimo de 50% (cinquenta por cento), ou compensado por banco de horas, quando houver acordo de compensação firmado na forma do art. 59 da CLT.',
    'O trabalho em feriado será pago em dobro, salvo se a EMPREGADORA conceder outra folga (Lei 605/1949, art. 9º).')
m.clausula('Cláusula 6ª - Convenção coletiva',
    'Prevalecem as regras da convenção ou do acordo coletivo da categoria que sejam compatíveis com a Constituição Federal. Cláusulas que contrariem a Emenda Constitucional nº 141/2026 deixam de valer.')
m.clausula('Cláusula 7ª - Demais condições',
    'Todas as demais cláusulas e condições do contrato de trabalho continuam valendo, sem alteração. As partes declaram que leram e entenderam este termo e o assinam em 2 (duas) vias de igual teor, na presença das testemunhas abaixo.')
m.assinaturas([('[RAZÃO SOCIAL DA EMPRESA]', 'EMPREGADORA'), ('[NOME DO EMPREGADO]', 'EMPREGADO(A)'),
               ('Testemunha 1: [NOME]', 'CPF: [000.000.000-00]'), ('Testemunha 2: [NOME]', 'CPF: [000.000.000-00]')])
m.salvar(os.path.join(OUT, '01-Termo-aditivo-mudanca-de-jornada-6x1-para-5x2.docx'))

# ------------------------------------------------------------------ 02 comunicado para a equipe
m = Modelo('Comunicado para a equipe', 'Nossa escala muda para 5x2 a partir de [DATA DE INÍCIO]')
m.quadro('Como usar este modelo', ['Troque os campos em amarelo, apague este quadro e imprima. Leia o comunicado com a equipe numa reunião curta e peça para cada pessoa assinar a lista de ciência da página 2.',
                                   'Se preferir, mande o texto também no grupo da equipe. Guarde a lista assinada junto com os documentos de RH.'])
m.p('[CIDADE], [DIA] de [MÊS] de [ANO].', alinhar='left', depois=10)
m.p('Olá, equipe da [NOME DA EMPRESA].', alinhar='left', depois=8)
m.p('A partir de **[DATA DE INÍCIO]**, todos nós passamos a trabalhar na **escala 5x2**. A mudança vem da Emenda Constitucional nº 141/2026, que acabou com a escala 6x1 como regra geral no Brasil. Para a nossa equipe, isso quer dizer:')
for t in ['**2 folgas por semana** para cada pessoa. Ninguém trabalha 6 dias seguidos.',
          '**Até 8 horas por dia**, fora o intervalo do almoço. Na semana, o limite é de 42 horas a partir de 15/12/2026 e de 40 horas a partir de 15/12/2027.',
          '**O salário não muda.** A jornada fica menor e o salário continua o mesmo.',
          '**A loja continua aberta** nos mesmos dias e horários. Para isso, as folgas são em rodízio: cada pessoa folga em dias diferentes, para o atendimento nunca ficar descoberto.',
          '**Domingo de folga em rodízio.** Uma das folgas cai no domingo sempre que possível. [No comércio: cada pessoa folga pelo menos um domingo a cada três semanas.]',
          '**Hora extra só quando for combinada** com a gerência. O que passar da jornada é pago como hora extra ou vai para o banco de horas, se houver acordo assinado.']:
    m.item(t)
m.p('**Como saber as suas folgas:** a escala da semana fica no quadro de avisos [LOCAL DO QUADRO] e no link que vamos mandar no grupo. Abra no celular, escolha o seu nome e veja os seus dias. A escala é publicada com [7] dias de antecedência.', antes=6)
m.p('**Trocas de folga, faltas e atestados:** fale com [NOME DO RESPONSÁVEL] antes, pelo [TELEFONE OU WHATSAPP]. Toda troca precisa ser combinada para não deixar nenhum dia sem gente.')
m.p('Cada pessoa vai assinar um termo aditivo ao contrato com a nova jornada. Qualquer dúvida, é só perguntar.')
m.p('Obrigado a todos.', alinhar='left', antes=4, depois=22)
m.p('______________________________________', alinhar='left', depois=0)
m.p('[NOME DO RESPONSÁVEL]  ·  [CARGO]', alinhar='left', depois=0, negrito=True)
m.p('[NOME DA EMPRESA]', alinhar='left')
m.quebra()
p = m.d.add_paragraph(); m.texto(p, 'LISTA DE CIÊNCIA', tam=13, negrito=True)
m.p('Declaro que recebi e li o comunicado sobre a mudança da escala 6x1 para a escala 5x2 a partir de [DATA DE INÍCIO].', depois=8)
m.tabela(['Nº', 'Nome completo', 'Cargo', 'Data', 'Assinatura'], [[str(i), '', '', '', ''] for i in range(1, 19)], larguras=[1.0, 6.2, 3.2, 2.2, 4.0], altura=0.85)
m.salvar(os.path.join(OUT, '02-Comunicado-para-a-equipe.docx'))

# ------------------------------------------------------------------ 03 acordo de compensação / banco de horas
m = Modelo('Acordo individual de compensação de horas', 'Banco de horas por acordo individual escrito (CLT, art. 59)')
m.quadro('Antes de usar', ['Confira a convenção coletiva da sua categoria. Se ela proibir ou regular o banco de horas de outro jeito, siga a convenção.',
                           'No acordo individual escrito, as horas precisam ser compensadas em até 6 meses (CLT, art. 59, § 5º). Para prazos maiores, é preciso acordo ou convenção coletiva.',
                           'Troque os campos em amarelo, apague este quadro e imprima em 2 vias.'])
m.p('**EMPREGADORA:** [RAZÃO SOCIAL DA EMPRESA], CNPJ nº [00.000.000/0000-00], com sede em [ENDEREÇO COMPLETO], representada por [NOME DO REPRESENTANTE], [CARGO DO REPRESENTANTE].', alinhar='left')
m.p('**EMPREGADO(A):** [NOME COMPLETO DO EMPREGADO], CPF nº [000.000.000-00], cargo de [CARGO], admitido(a) em [DATA DE ADMISSÃO].', alinhar='left', depois=8)
m.p('As partes acima firmam este Acordo Individual de Compensação de Horas (banco de horas), com base no art. 59 da Consolidação das Leis do Trabalho (CLT), nas condições abaixo.')
m.clausula('Cláusula 1ª - Objeto',
    'As horas trabalhadas além da jornada contratual poderão ser compensadas com a diminuição da jornada em outro dia ou com folgas extras, em vez de pagas como hora extra, na forma deste acordo.')
m.clausula('Cláusula 2ª - Jornada de referência',
    'A jornada contratual do(a) EMPREGADO(A) é de [8] horas por dia e [40] horas por semana, na escala 5x2, com 2 folgas semanais, respeitado o limite constitucional em vigor (42 horas por semana de 15/12/2026 a 14/12/2027 e 40 horas por semana a partir de 15/12/2027).')
m.clausula('Cláusula 3ª - Limites',
    'As horas a mais não passarão de 2 (duas) por dia, e a jornada do dia não passará de 10 (dez) horas, já somadas as horas a mais (CLT, art. 59). Ficam mantidos o descanso mínimo de 11 horas entre uma jornada e outra (CLT, art. 66) e as 2 folgas semanais.')
m.clausula('Cláusula 4ª - Prazo de compensação',
    'As horas lançadas no banco serão compensadas em até [6] meses, contados do mês em que foram feitas. O prazo deste acordo nunca será maior que 6 (seis) meses (CLT, art. 59, § 5º).',
    'As horas que não forem compensadas dentro do prazo serão pagas como hora extra, com adicional mínimo de 50% (cinquenta por cento), na folha do mês seguinte ao fim do prazo.')
m.clausula('Cláusula 5ª - Como compensar',
    'A data da compensação será combinada entre as partes com antecedência mínima de [48 horas], de preferência emendando com as folgas da escala. A compensação será feita na proporção de 1 (uma) hora de descanso para cada hora trabalhada a mais[, ou conforme a convenção coletiva].')
m.clausula('Cláusula 6ª - Controle e extrato',
    'As horas de crédito e de débito serão registradas no controle de ponto. Todo mês a EMPREGADORA entregará ao(à) EMPREGADO(A) o extrato do banco de horas, com o saldo do período, que poderá ser conferido e assinado.')
m.clausula('Cláusula 7ª - Fim do contrato',
    'Se o contrato de trabalho terminar antes da compensação de todas as horas, as horas a favor do(a) EMPREGADO(A) serão pagas como hora extra, calculadas sobre o salário da data da rescisão (CLT, art. 59, § 3º).')
m.clausula('Cláusula 8ª - Vigência',
    'Este acordo vale de [DATA DE INÍCIO] a [DATA DE FIM], no prazo máximo de 6 (seis) meses, e pode ser renovado por escrito. Qualquer das partes pode encerrá-lo por escrito, com a compensação ou o pagamento do saldo existente.')
m.assinaturas([('[RAZÃO SOCIAL DA EMPRESA]', 'EMPREGADORA'), ('[NOME DO EMPREGADO]', 'EMPREGADO(A)'),
               ('Testemunha 1: [NOME]', 'CPF: [000.000.000-00]'), ('Testemunha 2: [NOME]', 'CPF: [000.000.000-00]')])
m.quebra()
p = m.d.add_paragraph(); m.texto(p, 'EXTRATO MENSAL DO BANCO DE HORAS', tam=13, negrito=True)
m.p('Empregado(a): [NOME DO EMPREGADO]   ·   Mês de referência: [MÊS/ANO]', alinhar='left', depois=8)
m.tabela(['Data', 'Horas a mais (crédito)', 'Horas compensadas (débito)', 'Motivo / observação', 'Saldo'], [['', '', '', '', ''] for _ in range(16)], larguras=[2.4, 3.2, 3.4, 5.0, 2.6], altura=0.8)
m.p('Saldo do mês: ________ horas    ·    Saldo acumulado: ________ horas    ·    Prazo para compensar até: ____/____/______', alinhar='left', antes=4, depois=20)
m.assinaturas([('[RAZÃO SOCIAL DA EMPRESA]', 'EMPREGADORA'), ('[NOME DO EMPREGADO]', 'EMPREGADO(A)')], local=False)
m.salvar(os.path.join(OUT, '03-Acordo-de-compensacao-banco-de-horas.docx'))

# ------------------------------------------------------------------ 04 aviso formal aos empregados (mural) - docx + pdf
m = Modelo('Aviso aos empregados', 'Nova jornada de trabalho e escala de revezamento das folgas')
m.quadro('Como usar este modelo', ['Preencha os campos em amarelo e a tabela com o horário de cada pessoa. Apague este quadro, imprima e fixe no quadro de avisos, em lugar que todos vejam.',
                                   'Quando o horário de alguém mudar, atualize e troque o aviso. A escala de folgas da semana fica ao lado (use a versão em PDF ou o link da escala).'])
m.p('A **[RAZÃO SOCIAL DA EMPRESA]**, CNPJ nº [00.000.000/0000-00], comunica a todos os empregados da unidade **[NOME DA UNIDADE]** que, a partir de **[DATA DE INÍCIO]**, a jornada de trabalho passa a seguir a escala 5x2, conforme a Emenda Constitucional nº 141/2026:')
for t in ['Cada empregado tem **2 (duas) folgas por semana**, em escala de revezamento.',
          'A jornada é de até **8 horas por dia**, e não passa de 42 horas por semana a partir de 15/12/2026 e de 40 horas por semana a partir de 15/12/2027.',
          'O salário não foi reduzido por causa da nova jornada.',
          'Uma das folgas cai no domingo sempre que possível, em rodízio. [No comércio: pelo menos um domingo de folga a cada três semanas (Lei 10.101/2000, art. 6º).]',
          'A escala de folgas de cada semana é afixada neste quadro com pelo menos [7] dias de antecedência.',
          'Trocas de folga precisam ser combinadas antes com [NOME DO RESPONSÁVEL].']:
    m.item(t)
m.p('**Horário de trabalho**', alinhar='left', antes=6, depois=4)
m.tabela(['Nome', 'Função', 'Entrada', 'Intervalo', 'Saída', 'Folgas na semana'], [['[NOME]', '[FUNÇÃO]', '[08h00]', '[12h00 às 13h00]', '[17h00]', '[revezamento]']] + [['', '', '', '', '', ''] for _ in range(9)],
         larguras=[4.4, 2.8, 1.8, 2.8, 1.8, 3.0], altura=0.72, tam=9)
m.p('[CIDADE], [DIA] de [MÊS] de [ANO].   Responsável: [NOME DO RESPONSÁVEL], [CARGO].', alinhar='left', antes=4)
m.salvar(os.path.join(OUT, '04-Aviso-aos-empregados-nova-jornada.docx'))

pg = Pagina(os.path.join(OUT, '04-Aviso-aos-empregados-nova-jornada.pdf'), 'Aviso aos empregados - nova jornada 5x2')
c = pg.c; W, H, M = pg.W, pg.H, pg.M
pg.etiqueta('Quadro de avisos')
pg.titulo('Aviso aos empregados', 28)
pg.par('Nova jornada de trabalho e escala de revezamento das folgas', 12.5, AZUL, TXT_B, depois=0.45 * cm)
# campos da empresa
y = pg.y - 0.55 * cm
pg.linha_campo('Empresa (razão social)', M, y, 10.6 * cm); pg.linha_campo('CNPJ', M + 11.2 * cm, y, W - 2 * M - 11.2 * cm)
y -= 1.15 * cm
pg.linha_campo('Unidade', M, y, 10.6 * cm); pg.linha_campo('Vale a partir de', M + 11.2 * cm, y, W - 2 * M - 11.2 * cm)
pg.y = y - 0.55 * cm
pg.par('A empresa comunica a todos os empregados que a jornada de trabalho passa a seguir a escala 5x2, conforme a Emenda Constitucional nº 141/2026:', 10.5, depois=0.2 * cm)
for t in ['Cada empregado tem 2 folgas por semana, em escala de revezamento.',
          'A jornada é de até 8 horas por dia, e não passa de 42 horas por semana a partir de 15/12/2026 e de 40 horas por semana a partir de 15/12/2027.',
          'O salário não foi reduzido por causa da nova jornada.',
          'Uma das folgas cai no domingo sempre que possível, em rodízio. No comércio, pelo menos um domingo de folga a cada três semanas (Lei 10.101/2000, art. 6º).',
          'A escala de folgas da semana é afixada neste quadro com antecedência. Trocas de folga são combinadas antes com o responsável.']:
    c.setFillColor(AZUL); c.circle(M + 0.12 * cm, pg.y - 0.27 * cm, 1.1 * mm, stroke=0, fill=1)
    pg.par(t, 10, x=M + 0.5 * cm, depois=0.1 * cm)
pg.y -= 0.3 * cm
pg.par('Horário de trabalho', 12.5, AZUL, TIT, depois=0.15 * cm)
cols = [('Nome', 5.2), ('Função', 3.1), ('Entrada', 1.9), ('Intervalo', 2.6), ('Saída', 1.9), ('Folgas', 2.7)]
x0 = M; tot = sum(w for _, w in cols); esc = (W - 2 * M) / (tot * cm)
hh = 0.72 * cm; y = pg.y
c.setFillColor(AZUL); c.rect(x0, y - hh, W - 2 * M, hh, stroke=0, fill=1)
x = x0
for n, w in cols:
    c.setFillColor(BRANCO); c.setFont(TXT_B, 8.8); c.drawString(x + 0.18 * cm, y - hh + 0.24 * cm, n); x += w * cm * esc
linhas = 15; lh = 0.74 * cm
for i in range(linhas):
    yy = y - hh - (i + 1) * lh
    if i % 2: c.setFillColor(HexColor('#f4f7fc')); c.rect(x0, yy, W - 2 * M, lh, stroke=0, fill=1)
c.setStrokeColor(CINZA_CL); c.setLineWidth(0.6)
for i in range(linhas + 1):
    c.line(x0, y - hh - i * lh, W - M, y - hh - i * lh)
x = x0
for n, w in cols:
    c.line(x, y, x, y - hh - linhas * lh); x += w * cm * esc
c.line(W - M, y, W - M, y - hh - linhas * lh)
pg.y = y - hh - linhas * lh - 0.95 * cm
pg.linha_campo('Local e data', M, pg.y, 7.5 * cm); pg.linha_campo('Responsável (nome e assinatura)', M + 8.3 * cm, pg.y, W - 2 * M - 8.3 * cm)
pg.salvar()

# ------------------------------------------------------------------ 05 folha de ponto (xlsx + pdf)
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, Protection
from openpyxl.worksheet.datavalidation import DataValidation
wb = Workbook(); ws = wb.active; ws.title = 'Folha de ponto'
F = lambda **k: Font(name='Arial', **k)
azul = PatternFill('solid', fgColor='1351B4'); claro = PatternFill('solid', fgColor='E8F0FC'); amarelo = PatternFill('solid', fgColor='FFF6CC'); cinza = PatternFill('solid', fgColor='F3F5F8')
fino = Side(style='thin', color='C9D1DD'); B = Border(left=fino, right=fino, top=fino, bottom=fino)
larg = [7, 7, 9, 10, 10, 9, 11, 10, 26, 16]
for i, w in enumerate(larg): ws.column_dimensions[chr(65 + i)].width = w
ws.merge_cells('A1:J1'); ws['A1'] = 'FOLHA DE PONTO MENSAL'; ws['A1'].font = F(bold=True, size=15, color='071D41')
ws.merge_cells('A2:J2'); ws['A2'] = 'Registro de entrada, intervalo e saída. Os campos em amarelo são para preencher.'; ws['A2'].font = F(size=9, color='5B6676')
ws.row_dimensions[1].height = 24
campos = [('A4', 'Empresa', 'C4:F4', '[NOME DA EMPRESA]'), ('G4', 'CNPJ', 'H4:J4', '[00.000.000/0000-00]'),
          ('A5', 'Empregado(a)', 'C5:F5', '[NOME DO EMPREGADO]'), ('G5', 'Cargo', 'H5:J5', '[CARGO]'),
          ('A6', 'Mês (1 a 12)', 'C6', 12), ('D6', 'Ano', 'E6', 2026), ('G6', 'Jornada/dia', 'H6', '08:00')]
for cel, rot, alvo, val in campos:
    ws[cel] = rot; ws[cel].font = F(bold=True, size=9, color='1F2A3A')
    if ':' in alvo: ws.merge_cells(alvo)
    if cel[0] == 'A' and ':' not in alvo: pass
    a = alvo.split(':')[0]
    ws[a] = val; ws[a].fill = amarelo; ws[a].font = F(size=10); ws[a].protection = Protection(locked=False)
    for row in ws[alvo] if ':' in alvo else [[ws[alvo]]]:
        for x in row: x.border = B; x.fill = amarelo; x.protection = Protection(locked=False)
ws.merge_cells('A4:B4'); ws.merge_cells('A5:B5'); ws.merge_cells('A6:B6')
from datetime import time
ws['H6'] = time(8, 0); ws['H6'].number_format = 'hh:mm'
ws.merge_cells('I6:J6'); ws['I6'] = 'Mês:'; ws['I6'].font = F(bold=True, size=9)
ws['I6'] = '=IF(AND(C6>=1,C6<=12),"Mês: "&CHOOSE(C6,"janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro")&" de "&E6,"Informe o mês de 1 a 12")'
ws['I6'].font = F(bold=True, size=9, color='1351B4')
cab = ['Dia', 'Semana', 'Entrada', 'Saída intervalo', 'Volta intervalo', 'Saída', 'Horas no dia', 'Horas a mais', 'Observação (folga, feriado, falta, atestado)', 'Rubrica']
for j, h in enumerate(cab):
    x = ws.cell(row=8, column=j + 1, value=h); x.fill = azul; x.font = F(bold=True, size=8.5, color='FFFFFF'); x.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True); x.border = B
ws.row_dimensions[8].height = 30
for n in range(1, 32):
    r = 8 + n
    ws.cell(row=r, column=1, value=f'=IF({n}<=DAY(EOMONTH(DATE($E$6,$C$6,1),0)),DATE($E$6,$C$6,{n}),"")').number_format = 'dd/mm'
    ws.cell(row=r, column=2, value=f'=IF(A{r}="","",CHOOSE(WEEKDAY(A{r}),"dom","seg","ter","qua","qui","sex","sáb"))')
    for col in range(3, 7):
        x = ws.cell(row=r, column=col); x.number_format = 'hh:mm'; x.protection = Protection(locked=False); x.fill = amarelo
    ws.cell(row=r, column=7, value=f'=IF(AND(C{r}<>"",F{r}<>""),MOD(F{r}-C{r},1)-IF(AND(D{r}<>"",E{r}<>""),MOD(E{r}-D{r},1),0),"")').number_format = '[h]:mm'
    ws.cell(row=r, column=8, value=f'=IF(G{r}="","",MAX(0,G{r}-$H$6))').number_format = '[h]:mm'
    for col in (9, 10): ws.cell(row=r, column=col).protection = Protection(locked=False); ws.cell(row=r, column=col).fill = amarelo
    for col in range(1, 11):
        x = ws.cell(row=r, column=col); x.border = B; x.font = F(size=9); x.alignment = Alignment(horizontal='center' if col < 9 else 'left', vertical='center')
        if col in (1, 2, 7, 8): x.fill = cinza if n % 2 == 0 else PatternFill(fill_type=None)
    ws.row_dimensions[r].height = 17
t = 40
ws.merge_cells(f'A{t}:F{t}'); ws[f'A{t}'] = 'Total do mês'; ws[f'A{t}'].font = F(bold=True, size=10); ws[f'A{t}'].alignment = Alignment(horizontal='right')
ws[f'G{t}'] = '=SUM(G9:G39)'; ws[f'H{t}'] = '=SUM(H9:H39)'
for col in 'GH':
    ws[f'{col}{t}'].number_format = '[h]:mm'; ws[f'{col}{t}'].font = F(bold=True, size=10, color='FFFFFF'); ws[f'{col}{t}'].fill = azul; ws[f'{col}{t}'].alignment = Alignment(horizontal='center')
ws[f'I{t}'] = '=COUNTIF(B9:B39,"dom")&" domingos no mês"'; ws[f'I{t}'].font = F(size=8.5, color='5B6676')
ws.merge_cells('A42:E42'); ws['A42'] = 'Assinatura do(a) empregado(a): ______________________'; ws['A42'].font = F(size=9)
ws.merge_cells('F42:J42'); ws['F42'] = 'Assinatura do responsável: ______________________'; ws['F42'].font = F(size=9)
ws.merge_cells('A44:J44'); ws['A44'] = AVISO + ' Estabelecimento com mais de 20 trabalhadores deve anotar entrada e saída (CLT, art. 74, § 2º).'
ws['A44'].font = F(italic=True, size=8, color='5B6676'); ws['A44'].alignment = Alignment(wrap_text=True); ws.row_dimensions[44].height = 26
ws.protection.sheet = True; ws.protection.formatColumns = False; ws.protection.formatRows = False
ws.page_setup.paperSize = ws.PAPERSIZE_A4; ws.page_setup.orientation = 'portrait'; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 1
ws.sheet_properties.pageSetUpPr.fitToPage = True; ws.print_area = 'A1:J44'
ws.page_margins.left = ws.page_margins.right = 0.4; ws.page_margins.top = ws.page_margins.bottom = 0.5
ws.freeze_panes = 'A9'
# instruções
wi = wb.create_sheet('Como usar')
wi.column_dimensions['A'].width = 100
linhas = [('Como usar a folha de ponto', True), ('', False),
          ('1. Preencha os campos em amarelo no alto: empresa, CNPJ, nome, cargo, mês (1 a 12), ano e a jornada do dia (ex.: 08:00).', False),
          ('2. As datas e os dias da semana aparecem sozinhos.', False),
          ('3. Digite os horários com dois pontos, por exemplo 08:00, 12:00, 13:00 e 17:00. As horas do dia e as horas a mais saem calculadas.', False),
          ('4. Na coluna Observação, escreva folga, feriado, falta, atestado ou férias quando for o caso.', False),
          ('5. No fim do mês, imprima, peça a assinatura do empregado e guarde. Mande uma cópia para o seu contador.', False),
          ('6. Faça uma cópia desta planilha para cada empregado (botão direito na aba > Mover ou copiar > Criar uma cópia).', False),
          ('', False), ('Prefere preencher à mão? Use o arquivo 05-Folha-de-ponto-mensal.pdf, pronto para imprimir.', False),
          ('', False), (AVISO, False)]
for i, (t, b) in enumerate(linhas, 1):
    wi.cell(row=i, column=1, value=t).font = F(bold=b, size=13 if b else 10, color='071D41' if b else '1F2A3A')
    wi.cell(row=i, column=1).alignment = Alignment(wrap_text=True)
wb.save(os.path.join(OUT, '05-Folha-de-ponto-mensal.xlsx'))

pg = Pagina(os.path.join(OUT, '05-Folha-de-ponto-mensal.pdf'), 'Folha de ponto mensal')
c = pg.c; W, H, M = pg.W, pg.H, pg.M
pg.y += 0.1 * cm
pg.titulo('Folha de ponto mensal', 19)
y = pg.y - 0.75 * cm
pg.linha_campo('Empresa', M, y, 10.4 * cm); pg.linha_campo('CNPJ', M + 11 * cm, y, W - 2 * M - 11 * cm)
y -= 1.0 * cm
pg.linha_campo('Empregado(a)', M, y, 10.4 * cm); pg.linha_campo('Cargo', M + 11 * cm, y, W - 2 * M - 11 * cm)
y -= 1.0 * cm
pg.linha_campo('Mês / ano', M, y, 4.6 * cm); pg.linha_campo('Horário contratual', M + 5.2 * cm, y, 5.2 * cm); pg.linha_campo('Intervalo', M + 11 * cm, y, W - 2 * M - 11 * cm)
y -= 0.55 * cm
cols = [('Dia', 1.0), ('Sem.', 1.2), ('Entrada', 1.9), ('Saída\nintervalo', 1.9), ('Volta\nintervalo', 1.9), ('Saída', 1.9), ('Horas\nextras', 1.6), ('Observação', 3.6), ('Rubrica', 2.6)]
esc = (W - 2 * M) / (sum(w for _, w in cols) * cm); hh = 0.82 * cm
c.setFillColor(AZUL); c.rect(M, y - hh, W - 2 * M, hh, stroke=0, fill=1)
x = M
for n, w in cols:
    ls = n.split('\n'); c.setFillColor(BRANCO); c.setFont(TXT_B, 7.6)
    for k, l in enumerate(ls):
        c.drawCentredString(x + w * cm * esc / 2, y - hh / 2 + (len(ls) - 1) * 4.3 - k * 8.6 - 2.6, l)
    x += w * cm * esc
lh = (y - hh - 3.15 * cm) / 31
for i in range(31):
    yy = y - hh - (i + 1) * lh
    if i % 2: c.setFillColor(HexColor('#f4f7fc')); c.rect(M, yy, W - 2 * M, lh, stroke=0, fill=1)
    c.setFillColor(TEXTO); c.setFont(TXT_SB, 8); c.drawCentredString(M + cols[0][1] * cm * esc / 2, yy + lh / 2 - 2.8, str(i + 1))
c.setStrokeColor(CINZA_CL); c.setLineWidth(0.55)
for i in range(32): c.line(M, y - hh - i * lh, W - M, y - hh - i * lh)
x = M
for n, w in cols: c.line(x, y, x, y - hh - 31 * lh); x += w * cm * esc
c.line(W - M, y, W - M, y - hh - 31 * lh)
yb = y - hh - 31 * lh - 0.95 * cm
pg.linha_campo('Total de horas extras no mês', M, yb, 5 * cm); pg.linha_campo('Assinatura do(a) empregado(a)', M + 5.8 * cm, yb, 5.4 * cm); pg.linha_campo('Assinatura do responsável', M + 12 * cm, yb, W - 2 * M - 12 * cm)
c.setFillColor(CINZA); c.setFont(TXT, 7); c.drawString(M, yb - 0.45 * cm, 'Estabelecimento com mais de 20 trabalhadores deve anotar a hora de entrada e de saída (CLT, art. 74, § 2º).')
pg.salvar()

# ------------------------------------------------------------------ 06 checklist
pg = Pagina(os.path.join(OUT, '06-Checklist-de-adequacao-a-nova-lei.pdf'), 'Checklist de adequação à nova lei (5x2)')
pg.etiqueta('Kit RH da 5x2')
pg.titulo('Checklist de adequação à nova lei', 25)
pg.par('Marque cada item conforme for resolvendo. A regra vale a partir de 15/12/2026 (42 horas por semana) e muda de novo em 15/12/2027 (40 horas por semana).', 10.5, CINZA, depois=0.3 * cm)
secoes = [
    ('1. Entender a regra', [
        ('Confirmar a data de início: 15/12/2026.', 'Emenda Constitucional nº 141/2026 (art. 7º, XIII e XV, da Constituição). Algumas fontes citam 15 ou 17 de dezembro; na dúvida, adiante-se.'),
        ('Ler a convenção coletiva da sua categoria.', 'Ela pode ter regras próprias. Cláusulas que contrariam a emenda deixam de valer.'),
        ('Ver quem fica de fora da regra.', 'Empregado com diploma de nível superior que ganha mais de 2,5 vezes o teto do INSS, salvo se a empresa decidir aplicar.'),
    ]),
    ('2. Fazer as contas', [
        ('Somar quantas horas de trabalho a loja precisa por semana.', 'Para cada dia aberto: horas abertas x pessoas ao mesmo tempo.'),
        ('Calcular quantas pessoas são necessárias.', 'Some o mínimo de pessoas de cada dia aberto e divida por 5. Ex.: 16 / 5 = 3,2, ou seja, 4 pessoas.'),
        ('Decidir entre hora extra e nova contratação.', 'Hora extra todo dia vira custo fixo e risco trabalhista. Compare com o custo de contratar.'),
    ]),
    ('3. Montar a escala 5x2', [
        ('2 folgas por semana para cada pessoa.', 'Folgas juntas sempre que o mínimo de cada dia permitir.'),
        ('No máximo 8 horas por dia e 42 horas por semana (40 horas a partir de 15/12/2027).', 'O almoço não entra nessas horas.'),
        ('Rodízio de domingo em dia.', 'Comércio: folga no domingo pelo menos 1 vez a cada 3 semanas (Lei 10.101/2000, art. 6º). Demais atividades: 1 a cada 7 semanas (Portaria MTP 671/2021, art. 58).'),
        ('11 horas de descanso entre um dia e outro.', 'CLT, art. 66. Quem fecha às 22h não abre às 8h do dia seguinte.'),
        ('Intervalo de 1 a 2 horas em jornada acima de 6 horas.', 'CLT, art. 71.'),
        ('Feriados: pagar em dobro ou dar outra folga.', 'Lei 605/1949, art. 9º. No comércio, abrir no feriado depende da convenção e da lei municipal (Lei 10.101/2000, art. 6º-A).'),
        ('Mulheres: conferir o revezamento quinzenal do domingo.', 'CLT, art. 386. Confirme com o contador como vale para a sua categoria.'),
    ]),
    ('4. Documentos', [
        ('Comunicado lido para a equipe e lista de ciência assinada.', 'Arquivo 02 do kit.'),
        ('Termo aditivo assinado por cada empregado que saiu da 6x1.', 'Arquivo 01 do kit, em 2 vias.'),
        ('Acordo de banco de horas assinado (se for usar).', 'Arquivo 03. Compensação em até 6 meses no acordo individual (CLT, art. 59, § 5º).'),
        ('Aviso aos empregados fixado no quadro de avisos.', 'Arquivo 04, com o horário de cada pessoa.'),
    ]),
    ('5. Ponto, folha e contador', [
        ('Registro de ponto funcionando.', 'Obrigatório para estabelecimento com mais de 20 trabalhadores (CLT, art. 74, § 2º). Arquivo 05 do kit.'),
        ('Salário mantido, sem redução.', 'A jornada diminui e o salário fica igual.'),
        ('Contador avisado da nova jornada.', 'Com o mesmo salário e menos horas, o valor da hora (e da hora extra) muda na folha.'),
        ('Escala de cada mês guardada.', 'Em fiscalização ou processo, a escala por escrito é a prova de que as folgas foram dadas.'),
    ]),
    ('6. Para 15/12/2027', [
        ('Revisar a escala para 40 horas por semana.', 'Quem montou 5 dias de 8h (40h) já está pronto. Quem usou 8h24 por dia (42h) precisa refazer.'),
    ]),
]
for s, itens in secoes:
    pg.secao(s)
    for t, sub in itens: pg.check(t, sub)
pg.salvar()

# ------------------------------------------------------------------ LEIA-ME
pg = Pagina(os.path.join(OUT, 'LEIA-ME.pdf'), 'Kit RH da 5x2 - leia-me')
pg.etiqueta('Kit RH da 5x2')
pg.titulo('Comece por aqui', 28)
pg.par('Este kit traz os documentos para levar a sua equipe da escala 6x1 para a 5x2 com tudo por escrito. Os arquivos .docx abrem no Word, no Google Docs e no LibreOffice. Os PDFs já estão prontos para imprimir em A4.', 10.5, depois=0.3 * cm)
pg.secao('Ordem sugerida')
arquivos = [
    ('06-Checklist-de-adequacao-a-nova-lei.pdf', 'Comece por ele. Lista tudo o que precisa estar resolvido até 15/12/2026, com a lei de cada item.'),
    ('02-Comunicado-para-a-equipe.docx', 'Texto para ler com a equipe e mandar no grupo, explicando a mudança sem juridiquês. A página 2 é a lista de ciência para cada um assinar.'),
    ('01-Termo-aditivo-mudanca-de-jornada-6x1-para-5x2.docx', 'Um para cada empregado. Registra a nova jornada, as 2 folgas semanais e que o salário não muda. Assinar em 2 vias, com 2 testemunhas.'),
    ('03-Acordo-de-compensacao-banco-de-horas.docx', 'Só se você for usar banco de horas. Acordo individual escrito, com compensação em até 6 meses. A página 2 é o extrato mensal.'),
    ('04-Aviso-aos-empregados-nova-jornada (.pdf e .docx)', 'Aviso formal para o quadro de avisos: a nova jornada e o horário de trabalho de cada pessoa. O PDF é para preencher à mão; o .docx, para digitar.'),
    ('05-Folha-de-ponto-mensal (.xlsx e .pdf)', 'Planilha com as horas do dia e as horas a mais calculadas, ou PDF para preencher à mão. Uma por empregado, por mês.'),
]
for nome, txt in arquivos:
    pg.precisa(1.6 * cm)
    pg.par(nome, 10.5, AZUL_ESC, TXT_B, depois=0.05 * cm)
    pg.par(txt, 9.6, CINZA, depois=0.3 * cm)
pg.secao('Como preencher')
for t in ['Nos arquivos .docx, os campos para trocar estão marcados em amarelo, entre colchetes: [NOME DA EMPRESA], [CNPJ], [NOME DO EMPREGADO] e assim por diante.',
          'Dica: no Word, use Localizar e substituir (Ctrl+U no Word em português, Ctrl+H nos outros) para trocar [NOME DA EMPRESA] de uma vez em todo o documento.',
          'Depois de preencher, tire o realce amarelo e apague o quadro azul "Como usar este modelo" antes de imprimir.',
          'Guarde uma via assinada de cada documento. Mande uma cópia para o seu contador.']:
    pg.c.setFillColor(AZUL); pg.c.circle(pg.M + 0.12 * cm, pg.y - 0.25 * cm, 1.1 * mm, stroke=0, fill=1)
    pg.par(t, 9.8, x=pg.M + 0.5 * cm, depois=0.12 * cm)
pg.secao('Importante')
pg.par('Estes documentos são modelos de referência, feitos com base na Emenda Constitucional nº 141/2026, na CLT (arts. 59, 66, 71, 74 e 386), na Lei 605/1949 e na Lei 10.101/2000. A convenção coletiva da sua categoria pode ter regras próprias. Confira com o seu contador ou advogado antes de assinar.', 9.8, depois=0.3 * cm)
pg.par('A escala de cada semana você monta e manda para a equipe no app Sua Escala 5x2.', 9.8, AZUL, TXT_B)
pg.salvar()

todos = sorted(f for f in os.listdir(OUT) if not f.endswith('.zip'))
zipa(OUT, os.path.join(OUT, 'Kit-RH-da-5x2-completo.zip'), todos)
print('\n'.join(todos))
