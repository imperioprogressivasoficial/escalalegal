// Artigos do blog (sem CMS). Cada um: slug, título (até 60 caracteres), descrição, corpo em HTML com H2,
// perguntas frequentes (viram FAQPage) e relacionados. Fatos da lei só os que já estão em public/ajuda.html e public/aula.js.
// Links internos: /gerador (gerador grátis) e /blog/<slug>.
module.exports = [
  {
    slug: 'escala-5x2-fim-da-6x1',
    titulo: 'Escala 5x2: o que muda com o fim da 6x1 (EC 141/2026)',
    curto: 'O que muda com o fim da 6x1',
    etiqueta: 'A nova lei',
    publicado: '2026-11-10', atualizado: '2026-11-15',
    descricao: 'A EC 141/2026 acabou com a escala 6x1. Veja o que muda: 2 folgas por semana, 8h por dia, 42h a partir de 15/12/2026 e 40h em 2027, sem reduzir salário.',
    resumo: 'Duas folgas por semana, no máximo 8 horas por dia e o limite semanal caindo de 44h para 42h e depois 40h. O que a emenda mudou e o que o dono do negócio precisa fazer agora.',
    base: 'EC 141/2026 (art. 7º da Constituição), Lei 10.101/2000, Lei 605/1949, CLT arts. 59-A, 66, 71 e 386, Lei Complementar 123/2006',
    corpo: `
<p>Durante décadas, a escala 6x1 foi o padrão do comércio brasileiro: seis dias de trabalho, uma folga, 44 horas por semana. Isso acabou. A <strong>Emenda Constitucional 141/2026</strong>, que veio da PEC 221/2019, foi promulgada pelo Congresso em 16 de outubro de 2026 e mudou o artigo 7º da Constituição. A escala 6x1 deixa de ser a regra geral, e quem tem funcionário precisa reorganizar a semana.</p>
<p>Este artigo explica, sem juridiquês, o que a emenda diz, quando cada parte começa a valer e o que muda na prática para quem tem loja, mercado, restaurante, salão ou farmácia. Se quiser ver como fica a sua equipe, o <a href="/gerador">gerador de escala 5x2 grátis</a> monta uma semana em poucos minutos.</p>

<h2>O que a EC 141/2026 diz, em quatro linhas</h2>
<ul>
<li><strong>2 folgas por semana</strong> para cada pessoa, uma delas de preferência no domingo.</li>
<li><strong>8 horas por dia</strong>, no máximo.</li>
<li><strong>42 horas por semana</strong> a partir de 15 de dezembro de 2026.</li>
<li><strong>40 horas por semana</strong> a partir de 15 de dezembro de 2027.</li>
</ul>
<p>E um ponto que não é detalhe: <strong>sem redução de salário</strong>. A jornada diminui e o salário continua o mesmo. A emenda proíbe pagar menos por causa da redução das horas.</p>

<h2>Quando começa a valer</h2>
<p>A mudança acontece em duas etapas. Dois meses depois da promulgação, o limite semanal cai de 44h para 42h. Um ano depois, cai para 40h. Na prática, as datas usadas são:</p>
<div class="rol"><table>
<thead><tr><th>Período</th><th>Limite por semana</th><th>Folgas por semana</th></tr></thead>
<tbody>
<tr><td>Até 14/12/2026</td><td>44h</td><td>Regra antiga</td></tr>
<tr><td>De 15/12/2026 a 14/12/2027</td><td>42h</td><td>2</td></tr>
<tr><td>A partir de 15/12/2027</td><td>40h</td><td>2</td></tr>
</tbody></table></div>
<p>Algumas fontes citam 15 ou 17 de dezembro como data de início, porque a contagem depende da publicação oficial. Na dúvida, adiante-se: monte a escala nova antes do dia 15.</p>

<h2>O que acontece com a 6x1 na prática</h2>
<p>Com duas folgas por semana, sobram cinco dias de trabalho. É por isso que a escala que substitui a 6x1 é a <strong>5x2</strong>. Veja como ficam as jornadas mais comuns:</p>
<div class="rol"><table>
<thead><tr><th>Jornada</th><th>Horas</th><th>Até 14/12/2026</th><th>15/12/2026 a 14/12/2027</th><th>A partir de 15/12/2027</th></tr></thead>
<tbody>
<tr><td>5 dias de 8h (5x2)</td><td>40h</td><td>Vale</td><td>Vale</td><td>Vale</td></tr>
<tr><td>5 dias de 8h24 (5x2)</td><td>42h</td><td>Só com acordo coletivo</td><td>Só com acordo coletivo</td><td>Não vale</td></tr>
<tr><td>6 dias de 7h20 (6x1)</td><td>44h</td><td>Ainda vale</td><td>Não vale</td><td>Não vale</td></tr>
<tr><td>6 dias de 6h40 (6x1)</td><td>40h</td><td>Ainda vale</td><td>Não vale: falta a 2ª folga</td><td>Não vale: falta a 2ª folga</td></tr>
</tbody></table></div>
<p>Repare na última linha. Não adianta só encurtar o dia e manter seis dias de trabalho: mesmo com 40 horas, a 6x1 continua irregular porque falta a segunda folga. A mudança é de <strong>dias</strong>, não só de horas.</p>
<div class="quadro"><p><strong>O caminho mais simples:</strong> 5 dias de 8 horas, 40 horas por semana. Já fica dentro do limite final de 2027 e você não precisa refazer a escala daqui a um ano.</p></div>

<h2>A loja pode continuar abrindo todos os dias?</h2>
<p>Pode. A emenda limita a jornada de cada pessoa, não o horário do negócio. Quem abre sete dias por semana continua abrindo. O que muda é a organização: cada funcionário folga em dias diferentes, num rodízio, para nenhum dia ficar vazio.</p>
<p>Isso tem uma consequência direta: para cobrir os mesmos dias com cada pessoa trabalhando cinco dias, muitas vezes é preciso mais gente. A conta rápida é simples: some o número mínimo de pessoas de cada dia aberto e divida por 5. Uma loja aberta 7 dias, com 2 pessoas por dia de segunda a sexta e 3 no sábado e no domingo, soma 16. Dividido por 5, dá 3,2. Ou seja, <strong>4 pessoas</strong>. O passo a passo completo está em <a href="/blog/como-fazer-escala-5x2">como fazer uma escala 5x2</a>.</p>

<h2>O que não mudou</h2>
<p>Várias regras da CLT continuam iguais e entram na escala nova:</p>
<ul>
<li><strong>Hora extra continua existindo.</strong> O que passar do limite é hora extra, com adicional mínimo de 50%, ou vai para o banco de horas, conforme a CLT. Veja <a href="/blog/banco-de-horas-hora-extra-5x2">banco de horas e hora extra na 5x2</a>.</li>
<li><strong>11 horas de descanso</strong> entre o fim de um dia e o começo do outro (CLT, art. 66). Quem fecha às 22h não pode abrir às 8h do dia seguinte.</li>
<li><strong>Intervalo de 1 a 2 horas</strong> para o almoço em jornada acima de 6 horas (CLT, art. 71). As 8 horas são de trabalho, fora o almoço.</li>
<li><strong>Domingo no comércio:</strong> a folga deve cair no domingo pelo menos 1 vez a cada 3 semanas (Lei 10.101/2000, art. 6º). Explicamos em <a href="/blog/domingo-escala-5x2-comercio">domingo na escala 5x2 do comércio</a>.</li>
<li><strong>Feriado trabalhado</strong> é pago em dobro ou compensado com outra folga (Lei 605/49, art. 9º). Detalhes em <a href="/blog/feriados-escala-5x2">feriados na escala 5x2</a>.</li>
</ul>
<p>A compensação de horários continua possível por acordo ou convenção coletiva. O que muda é que cláusulas que contrariam a emenda deixam de valer. Se a sua convenção fala em 44 horas, a Constituição está acima dela.</p>

<h2>Quem fica de fora</h2>
<p>A regra vale para empresas de todos os portes. Ficam de fora os servidores públicos e os empregados com diploma de nível superior que ganham mais de 2,5 vezes o teto do INSS, a não ser que o patrão decida aplicar a regra a eles também.</p>
<p>MEI, microempresa e pequena empresa <strong>não estão dispensados</strong>. A emenda prevê que uma lei complementar crie incentivos fiscais e de crédito para esses portes, ligados à manutenção dos empregos. Essa lei ainda não existe, e enquanto ela não sair vale a regra geral. Lembre que o MEI pode ter só 1 empregado registrado (Lei Complementar 123/2006): com uma pessoa só, ela folga 2 dias e, nesses dias, quem cobre é o dono.</p>

<h2>E a escala 12x36?</h2>
<p>A emenda não acabou com a 12x36, que continua prevista na CLT (art. 59-A) por acordo ou convenção. Mas a 12x36 dá em média 42 horas por semana, acima das 40 horas que valem a partir de 15/12/2027. A tendência é que cada categoria ajuste isso na convenção coletiva. A comparação completa está em <a href="/blog/escala-5x2-6x1-12x36">5x2, 6x1 e 12x36: as diferenças</a>.</p>

<h2>O que fazer agora, em 5 passos</h2>
<ol>
<li>Liste quem trabalha hoje em 6x1 e em quais dias o negócio abre.</li>
<li>Defina o mínimo de pessoas por dia, e por função quando uma função não pode faltar (caixa, farmacêutico, cozinha).</li>
<li>Faça a conta de quantas pessoas você precisa (soma dos mínimos ÷ 5).</li>
<li>Monte a escala 5x2 com 2 folgas para cada um e o rodízio de domingo. O <a href="/gerador">gerador grátis</a> faz uma semana para até 10 pessoas.</li>
<li>Mostre a escala para o seu contador antes de 15 de dezembro e guarde por escrito. Em uma fiscalização ou processo, a escala é a sua prova de que as folgas foram dadas.</li>
</ol>
`,
    faq: [
      ['A escala 6x1 acabou mesmo?', 'Como regra geral, sim. A EC 141/2026 garante 2 folgas por semana para cada pessoa. A partir de 15/12/2026, a 6x1 de 44 horas deixa de valer, e mesmo uma 6x1 de 40 horas fica irregular porque falta a segunda folga.'],
      ['Posso reduzir o salário porque a jornada diminuiu?', 'Não. A emenda proíbe reduzir o salário por causa da redução da jornada.'],
      ['Microempresa e MEI também precisam seguir?', 'Sim. A emenda prevê incentivos para MEI, micro e pequenas empresas por uma lei complementar que ainda não existe. Até ela sair, vale a regra geral para todos.'],
      ['Qual a jornada mais segura para montar agora?', '5 dias de 8 horas, 40 horas por semana. Já cabe no limite final de 2027. Você pode testar no <a href="/gerador">gerador de escala 5x2 grátis</a>.'],
    ],
    relacionados: ['como-fazer-escala-5x2', 'jornada-42-horas', 'escala-5x2-6x1-12x36'],
  },

  {
    slug: 'como-fazer-escala-5x2',
    titulo: 'Como fazer escala 5x2 passo a passo (com modelo grátis)',
    curto: 'Como fazer escala 5x2',
    etiqueta: 'Passo a passo',
    publicado: '2026-11-11', atualizado: '2026-11-15',
    descricao: 'Aprenda a fazer a escala 5x2 em 7 passos: dias abertos, mínimo por dia, conta de pessoas, 2 folgas, rodízio de domingo e feriados. Com modelo e gerador grátis.',
    resumo: 'Do zero até a escala pendurada no mural: os dias que abre, quanta gente precisa, como espalhar as folgas sem deixar dia descoberto e o rodízio do domingo. Com um exemplo pronto.',
    base: 'EC 141/2026, Lei 10.101/2000 (art. 6º), Lei 605/1949 (art. 9º), CLT arts. 66 e 71',
    corpo: `
<p>Fazer uma escala 5x2 parece simples: cada pessoa trabalha 5 dias e folga 2. O problema aparece quando você tenta encaixar todo mundo sem deixar a terça com uma pessoa só e o sábado com gente sobrando. Este guia mostra o caminho que funciona, do jeito que um dono de comércio faz no papel, e um exemplo pronto para copiar.</p>
<p>Se preferir pular a parte manual, o <a href="/gerador">gerador de escala 5x2 grátis</a> faz exatamente estes passos para uma semana e até 10 pessoas.</p>

<h2>Passo 1: anote os dias e o horário que o negócio abre</h2>
<p>Comece pelo funcionamento, não pelas pessoas. Marque os dias que abre e o horário de abrir e fechar. Isso define duas coisas: quantos dias precisam de cobertura e quantos turnos cada dia tem.</p>
<p>Cada pessoa trabalha no máximo 8 horas por dia, fora o almoço (que é de 1 a 2 horas em jornada acima de 6h, pela CLT, art. 71). Se a loja abre 12 horas, ninguém cobre o dia inteiro sozinho: são pelo menos dois turnos. Leve isso em conta no próximo passo.</p>

<h2>Passo 2: defina o mínimo de pessoas por dia</h2>
<p>Para cada dia aberto, pergunte: com quantas pessoas trabalhando o dia funciona? Some as pessoas de todos os turnos. Se uma função não pode faltar de jeito nenhum, anote o mínimo dela também. Exemplos comuns:</p>
<ul>
<li>Farmácia: farmacêutico presente durante todo o horário (Lei 13.021/2014, art. 6º).</li>
<li>Mercado: um número mínimo de caixas por dia.</li>
<li>Restaurante: alguém na cozinha todo dia que abre.</li>
</ul>
<p>Os detalhes de cada segmento estão em <a href="/blog/escala-5x2-farmacia-mercado-restaurante">escala 5x2 para farmácia, mercado e restaurante</a>.</p>

<h2>Passo 3: faça a conta de quantas pessoas você precisa</h2>
<p>Some o mínimo de todos os dias abertos e divida por 5, que é o número de dias que cada pessoa trabalha. Arredonde para cima.</p>
<div class="quadro"><p><strong>Exemplo:</strong> loja aberta 7 dias, com 2 pessoas por dia de segunda a sexta e 3 no sábado e no domingo.</p><p>2 + 2 + 2 + 2 + 2 + 3 + 3 = 16. Depois, 16 ÷ 5 = 3,2. Arredondando para cima: <strong>4 pessoas</strong>.</p></div>
<p>Se a conta der mais gente do que você tem, existem só dois caminhos: reduzir o mínimo de algum dia ou contratar. Pedir para alguém trabalhar o sexto dia não é mais opção.</p>

<h2>Passo 4: distribua as 2 folgas de cada pessoa</h2>
<p>Agora sim, as pessoas. Cada uma ganha 2 folgas na semana. Algumas dicas que poupam retrabalho:</p>
<ul>
<li><strong>Comece pelos dias com mais gente sobrando.</strong> Se segunda e terça têm movimento menor, é ali que as folgas cabem com folga.</li>
<li><strong>Junte as duas folgas quando der.</strong> Não é obrigatório, mas a equipe prefere e reduz pedido de troca.</li>
<li><strong>Folga fixa é permitida.</strong> Se combinou com alguém que ele folga sempre na segunda, respeite e monte o resto em volta.</li>
<li><strong>Confira o dia pela coluna, não pela linha.</strong> Depois de distribuir, conte quantas pessoas trabalham em cada dia e compare com o mínimo.</li>
</ul>

<h2>Passo 5: faça o rodízio de domingo</h2>
<p>Se abre no domingo, a folga de cada pessoa precisa cair no domingo de tempos em tempos. No comércio, pelo menos 1 vez a cada 3 semanas (Lei 10.101/2000, art. 6º). Nas demais atividades, pelo menos 1 vez a cada 7 semanas (Portaria MTP 671/2021, art. 58). O jeito mais fácil é dividir a equipe em 3 grupos e cada grupo folgar um domingo, em rodízio. Explicamos com exemplo em <a href="/blog/domingo-escala-5x2-comercio">domingo na escala 5x2 do comércio</a>.</p>

<h2>Passo 6: marque os feriados</h2>
<p>Confira se a semana tem feriado nacional, do seu estado ou da sua cidade. Quem trabalha no feriado recebe o dia em dobro ou ganha outra folga (Lei 605/49, art. 9º). No comércio, abrir no feriado depende da convenção coletiva e da lei da cidade. Veja <a href="/blog/feriados-escala-5x2">feriados na escala 5x2</a>.</p>

<h2>Passo 7: confira as horas e o descanso</h2>
<p>Multiplique as horas por dia por 5. Com 8 horas, dá 40 horas na semana, dentro do limite de 42h (de 15/12/2026 a 14/12/2027) e do limite final de 40h. Depois confira o descanso de 11 horas entre um dia e outro (CLT, art. 66): quem fecha às 22h só pode voltar às 9h.</p>

<h2>Modelo: escala 5x2 de uma loja com 4 pessoas</h2>
<p>Este é o exemplo do passo 3: loja aberta 7 dias, mínimo de 2 pessoas de segunda a sexta e 3 no fim de semana.</p>
<div class="rol"><table class="sem">
<thead><tr><th>Pessoa</th><th>Seg</th><th>Ter</th><th>Qua</th><th>Qui</th><th>Sex</th><th>Sáb</th><th>Dom</th></tr></thead>
<tbody>
<tr><td>Ana</td><td class="f">Folga</td><td class="f">Folga</td><td>T</td><td>T</td><td>T</td><td>T</td><td>T</td></tr>
<tr><td>Bruno</td><td>T</td><td>T</td><td class="f">Folga</td><td class="f">Folga</td><td>T</td><td>T</td><td>T</td></tr>
<tr><td>Carla</td><td>T</td><td>T</td><td>T</td><td class="f">Folga</td><td class="f">Folga</td><td>T</td><td>T</td></tr>
<tr><td>Diego</td><td>T</td><td>T</td><td>T</td><td>T</td><td>T</td><td class="f">Folga</td><td class="f">Folga</td></tr>
<tr><td><strong>Trabalhando</strong></td><td>3</td><td>3</td><td>3</td><td>2</td><td>3</td><td>3</td><td>3</td></tr>
</tbody></table></div>
<p>Todos têm 2 folgas, sempre juntas, e nenhum dia fica abaixo do mínimo. Diego folga no domingo nesta semana. Na semana seguinte, o domingo de folga passa para outra pessoa, e assim o rodízio garante que ninguém trabalhe mais de 2 domingos seguidos.</p>

<h2>Os erros mais comuns</h2>
<ul>
<li>Montar só uma semana e esquecer o rodízio de domingo nas seguintes.</li>
<li>Contar o almoço dentro das 8 horas.</li>
<li>Escalar quem fechou a loja à noite para abrir cedo no dia seguinte.</li>
<li>Deixar a escala só no grupo do WhatsApp. Guarde por escrito: é a sua prova numa fiscalização.</li>
</ul>
`,
    faq: [
      ['Quantas folgas tem a escala 5x2?', '2 folgas por semana para cada pessoa. A lei pede que uma delas caia no domingo sempre que possível.'],
      ['As duas folgas precisam ser juntas?', 'Não é obrigatório. Juntas é melhor para quem trabalha, e vale tentar sempre que o mínimo de cada dia permitir.'],
      ['Como calcular quantos funcionários preciso na 5x2?', 'Some o mínimo de pessoas de cada dia aberto e divida por 5. Arredonde para cima. Ex.: 16 ÷ 5 = 3,2, então 4 pessoas.'],
      ['Existe modelo de escala 5x2 grátis?', 'Sim. O <a href="/gerador">gerador de escala 5x2 grátis</a> monta a semana para até 10 pessoas, com rodízio de domingo, e você imprime ou baixa a imagem.'],
    ],
    relacionados: ['domingo-escala-5x2-comercio', 'escala-5x2-farmacia-mercado-restaurante', 'jornada-42-horas'],
  },

  {
    slug: 'domingo-escala-5x2-comercio',
    titulo: 'Domingo na escala 5x2 do comércio (Lei 10.101)',
    curto: 'Domingo no comércio',
    etiqueta: 'Domingo',
    publicado: '2026-11-12', atualizado: '2026-11-15',
    descricao: 'No comércio, a folga cai no domingo pelo menos 1 vez a cada 3 semanas (Lei 10.101). Veja como fazer o rodízio de domingo na escala 5x2, com exemplo para 6 pessoas.',
    resumo: 'Abrir no domingo continua permitido. O que a lei exige é que cada pessoa folgue no domingo de tempos em tempos. Como funciona o rodízio de 3 semanas e como montar sem errar.',
    base: 'EC 141/2026, Lei 10.101/2000 (arts. 6º e 6º-A), Portaria MTP 671/2021 (art. 58), CLT art. 386',
    corpo: `
<p>Uma dúvida aparece em quase toda conversa sobre o fim da 6x1: "E o domingo? Vou ter que fechar?" Não vai. A Emenda Constitucional 141/2026 limita a jornada de cada pessoa, não o horário do negócio. Mas o domingo tem regra própria no comércio, e ela fica ainda mais importante agora que cada pessoa tem 2 folgas por semana.</p>

<h2>O que a lei diz sobre o domingo</h2>
<p>A EC 141/2026 garante 2 folgas por semana para cada pessoa, <strong>uma delas de preferência no domingo</strong>. Para o comércio, continua valendo a Lei 10.101/2000, art. 6º, que diz duas coisas:</p>
<ul>
<li>o trabalho aos domingos no comércio depende da lei do município;</li>
<li>o descanso semanal deve coincidir com o domingo <strong>pelo menos uma vez a cada três semanas</strong>.</li>
</ul>
<p>Em outras palavras: ninguém do comércio pode trabalhar 3 domingos seguidos. No terceiro, a folga tem que cair no domingo.</p>

<h2>E quem não é comércio?</h2>
<p>Nas demais atividades que funcionam no domingo, como salão, clínica, academia ou portaria, a regra do Ministério do Trabalho (Portaria MTP 671/2021, art. 58) é de pelo menos <strong>1 domingo de folga a cada 7 semanas</strong>. A convenção coletiva da sua categoria pode exigir mais, então confira com o seu contador.</p>
<div class="rol"><table>
<thead><tr><th>Atividade</th><th>Domingo de folga, no mínimo</th><th>Base</th></tr></thead>
<tbody>
<tr><td>Comércio (loja, mercado, farmácia, restaurante, padaria, posto)</td><td>1 a cada 3 semanas</td><td>Lei 10.101/2000, art. 6º</td></tr>
<tr><td>Demais atividades (salão, clínica, academia, portaria)</td><td>1 a cada 7 semanas</td><td>Portaria MTP 671/2021, art. 58</td></tr>
<tr><td>Escritório de segunda a sexta</td><td>Todo domingo</td><td>Já fecha no fim de semana</td></tr>
</tbody></table></div>

<h2>Como fazer o rodízio de domingo em 3 semanas</h2>
<p>O jeito mais simples é dividir a equipe em <strong>três grupos</strong>. Em cada semana, um grupo folga no domingo. Depois de três semanas, todo mundo teve o seu domingo, e o ciclo recomeça.</p>
<p>Exemplo: uma loja com 6 pessoas que precisa de 4 trabalhando no domingo. Sobram 2 folgas de domingo por semana, então cada grupo tem 2 pessoas.</p>
<div class="rol"><table class="sem">
<thead><tr><th>Domingo</th><th>Grupo A (Ana, Bia)</th><th>Grupo B (Caio, Davi)</th><th>Grupo C (Eva, Fábio)</th></tr></thead>
<tbody>
<tr><td>Semana 1</td><td class="f">Folga</td><td>Trabalha</td><td>Trabalha</td></tr>
<tr><td>Semana 2</td><td>Trabalha</td><td class="f">Folga</td><td>Trabalha</td></tr>
<tr><td>Semana 3</td><td>Trabalha</td><td>Trabalha</td><td class="f">Folga</td></tr>
<tr><td>Semana 4</td><td class="f">Folga</td><td>Trabalha</td><td>Trabalha</td></tr>
</tbody></table></div>
<p>Repare que ninguém passa de 2 domingos seguidos trabalhando. A folga de domingo conta como uma das 2 folgas da semana. A outra cai em um dia de semana, de preferência colada: quem folga no domingo pode folgar também no sábado ou na segunda.</p>

<h2>Quando a conta do domingo não fecha</h2>
<p>Se o domingo é o dia de mais movimento, pode faltar gente para dar a folga de domingo a um terço da equipe. Faça a conta: com 6 pessoas e 5 precisando trabalhar no domingo, só 1 folga por domingo. Em 3 semanas, só 3 pessoas teriam o seu domingo, e as outras 3 passariam do limite.</p>
<p>Nesse caso, as saídas são: reduzir o mínimo de domingo, reforçar a equipe ou combinar turnos menores no domingo. Pedir para alguém trabalhar o terceiro domingo seguido não é uma delas.</p>

<h2>Mulheres: revezamento quinzenal</h2>
<p>A CLT (art. 386) prevê, para as mulheres, revezamento quinzenal que favoreça o descanso no domingo. Na prática, isso significa um domingo de folga a cada 15 dias. Confirme com o seu contador como isso se aplica à sua categoria antes de fechar a escala.</p>

<h2>Domingo e feriado não são a mesma coisa</h2>
<p>O domingo de folga é parte do descanso semanal. O feriado tem regra própria: quem trabalha no feriado recebe o dia em dobro ou ganha outra folga (Lei 605/49, art. 9º), e no comércio abrir no feriado depende da convenção coletiva e da lei municipal (Lei 10.101, art. 6º-A). Explicamos em <a href="/blog/feriados-escala-5x2">feriados na escala 5x2</a>.</p>

<h2>Como não esquecer</h2>
<p>O rodízio de domingo é o ponto que mais escapa em escala feita à mão, porque ele só aparece quando você olha três semanas juntas. Montando semana a semana, é fácil alguém emendar o terceiro domingo sem ninguém perceber, e isso vira passivo trabalhista.</p>
<p>O <a href="/gerador">gerador grátis</a> já monta a semana com o rodízio começado (um grupo folga no domingo). A versão completa da Sua Escala 5x2 monta as 4 semanas e avisa se alguém passaria do limite.</p>

<h2>Folga de domingo colada no sábado ou na segunda</h2>
<p>Na semana em que a pessoa folga no domingo, juntar a outra folga ao sábado ou à segunda dá um fim de semana de verdade, que é o que a equipe mais valoriza. Só confira se o sábado aguenta: em muito comércio, o sábado é o dia mais cheio. Nesse caso, a segunda-feira costuma ser a melhor dupla do domingo.</p>
<p>Quando entra alguém novo na equipe, comece o rodízio dele do zero: conte os domingos a partir do primeiro dia de trabalho.</p>
<p>Anote também quem folgou em qual domingo. Com o registro na mão, fica fácil provar o rodízio numa fiscalização e responder quando alguém disser que "nunca folga no domingo".</p>
`,
    faq: [
      ['O comércio pode abrir no domingo com a escala 5x2?', 'Pode. A emenda limita a jornada de cada pessoa, não o horário da loja. O trabalho aos domingos no comércio depende da lei do município (Lei 10.101/2000, art. 6º).'],
      ['De quanto em quanto tempo o funcionário do comércio folga no domingo?', 'Pelo menos 1 vez a cada 3 semanas. Ninguém pode trabalhar 3 domingos seguidos.'],
      ['A folga de domingo conta como uma das 2 folgas?', 'Conta. Na semana em que a pessoa folga no domingo, a outra folga cai em outro dia, de preferência colada ao domingo.'],
      ['E salão, clínica e academia?', 'Nas atividades que não são comércio, a folga deve cair no domingo pelo menos 1 vez a cada 7 semanas (Portaria MTP 671/2021, art. 58). A convenção pode exigir mais.'],
    ],
    relacionados: ['como-fazer-escala-5x2', 'feriados-escala-5x2', 'escala-5x2-farmacia-mercado-restaurante'],
  },

  {
    slug: 'jornada-42-horas',
    titulo: 'Jornada de 42 horas: como distribuir na semana',
    curto: 'Jornada de 42 horas',
    etiqueta: 'Horas',
    publicado: '2026-11-13', atualizado: '2026-11-15',
    descricao: 'De 15/12/2026 a 14/12/2027 o limite é 42h por semana, com no máximo 8h por dia. Veja como distribuir a jornada na escala 5x2 e por que 40h é o caminho mais seguro.',
    resumo: 'O limite de 42 horas vale por um ano e depois cai para 40. Com 8 horas por dia e 5 dias, a conta dá 40. O que fazer com as 2 horas de diferença, e quando não fazer nada.',
    base: 'EC 141/2026, CLT arts. 59-A, 66 e 71',
    corpo: `
<p>A Emenda Constitucional 141/2026 reduz o limite semanal de trabalho em duas etapas: de 44 horas para <strong>42 horas a partir de 15 de dezembro de 2026</strong>, e para <strong>40 horas a partir de 15 de dezembro de 2027</strong>. No meio disso, o limite de 8 horas por dia continua, e cada pessoa passa a ter 2 folgas por semana. Como encaixar tudo?</p>

<h2>A conta que manda: 8 horas × 5 dias</h2>
<p>Com 2 folgas por semana, sobram 5 dias de trabalho. Com o máximo de 8 horas por dia, a conta é direta:</p>
<div class="quadro"><p><strong>8h por dia × 5 dias = 40h por semana.</strong></p><p>Já fica abaixo do limite de 42h e igual ao limite final de 40h. É a jornada que não precisa mudar em 2027.</p></div>
<p>Por isso, para a maioria dos comércios, a pergunta "como distribuir 42 horas" tem uma resposta curta: <strong>não distribua 42, distribua 40</strong>. As 2 horas a mais só cabem com um dia acima de 8 horas, e isso já é exceção.</p>

<h2>Dá para fazer 42 horas na 5x2?</h2>
<p>Só com dias acima de 8 horas, por exemplo 5 dias de 8h24. E jornada acima de 8 horas por dia só vale com acordo ou convenção coletiva. Veja a comparação:</p>
<div class="rol"><table>
<thead><tr><th>Jornada</th><th>Horas</th><th>15/12/2026 a 14/12/2027</th><th>A partir de 15/12/2027</th></tr></thead>
<tbody>
<tr><td>5 dias de 8h</td><td>40h</td><td>Vale</td><td>Vale</td></tr>
<tr><td>5 dias de 8h24</td><td>42h</td><td>Só com acordo coletivo</td><td>Não vale</td></tr>
<tr><td>4 dias de 8h + 1 dia de 6h</td><td>38h</td><td>Vale</td><td>Vale</td></tr>
<tr><td>5 dias de 7h</td><td>35h</td><td>Vale</td><td>Vale</td></tr>
</tbody></table></div>
<p>Montar a escala em 42 horas significa refazer tudo em dezembro de 2027. Montar em 40 resolve de uma vez.</p>

<h2>Como distribuir o horário quando o negócio abre mais de 8 horas</h2>
<p>O desafio de verdade não são as horas de cada pessoa, e sim cobrir um horário de funcionamento maior que a jornada. Uma loja que abre das 10h às 22h fica 12 horas aberta. Com 8 horas de trabalho e 1 hora de almoço, cada pessoa cobre 9 horas do dia. Ninguém cobre o dia inteiro: são pelo menos dois turnos.</p>
<p>Um desenho comum:</p>
<div class="rol"><table>
<thead><tr><th>Turno</th><th>Entrada</th><th>Almoço</th><th>Saída</th><th>Trabalho</th></tr></thead>
<tbody>
<tr><td>Abertura</td><td>10h</td><td>1h</td><td>19h</td><td>8h</td></tr>
<tr><td>Fechamento</td><td>13h</td><td>1h</td><td>22h</td><td>8h</td></tr>
</tbody></table></div>
<p>Das 13h às 19h, os dois turnos se cruzam, o que ajuda a cobrir o almoço de todo mundo e o horário de pico. Na hora de definir o mínimo de pessoas por dia, some as pessoas dos dois turnos.</p>

<h2>Os três cuidados que derrubam uma escala</h2>
<ul>
<li><strong>11 horas de descanso</strong> entre o fim de um dia e o começo do outro (CLT, art. 66). Quem fecha às 22h só pode entrar às 9h do dia seguinte. Alternar abertura e fechamento todo dia costuma quebrar essa regra.</li>
<li><strong>Almoço fora das 8 horas.</strong> Em jornada acima de 6h, o intervalo é de 1 a 2 horas (CLT, art. 71) e não conta como trabalho.</li>
<li><strong>Hora extra de vez em quando, não todo dia.</strong> Passou de 8h no dia, a hora a mais é extra, com adicional mínimo de 50%, ou vai para o banco de horas. Veja <a href="/blog/banco-de-horas-hora-extra-5x2">banco de horas e hora extra na 5x2</a>.</li>
</ul>

<h2>Quem trabalha meio período</h2>
<p>Funcionário de 6 horas por dia em 5 dias faz 30 horas: dentro de qualquer limite. A regra das 2 folgas vale igual. Em jornada de até 6 horas, o intervalo de 1 a 2 horas do art. 71 não se aplica da mesma forma; confira o intervalo certo com o seu contador.</p>

<h2>E a semana que cruza o dia 15 de dezembro?</h2>
<p>A semana de 14 a 20 de dezembro de 2026 começa com o limite antigo e termina com o novo. Na dúvida, adiante-se: monte essa semana já no limite de 42 horas, ou melhor, já em 40. O <a href="/gerador">gerador grátis</a> mostra o limite de cada semana que você escolher.</p>

<h2>Resumo para o dono</h2>
<ol>
<li>Planeje 5 dias de 8 horas: 40 horas, dentro do limite até 2027 e depois dele.</li>
<li>Se o negócio abre mais de 9 horas, desenhe dois turnos e some os dois no mínimo de cada dia.</li>
<li>Respeite as 11 horas entre um dia e outro.</li>
<li>Deixe a hora extra para exceção e registre tudo.</li>
</ol>

<h2>Exemplo: uma semana de loja em dois turnos</h2>
<p>Uma loja de shopping aberta das 10h às 22h, todos os dias, com 6 pessoas. Três ficam no turno de abertura (10h às 19h) e três no de fechamento (13h às 22h). Cada uma trabalha 5 dias de 8 horas, 40 horas na semana, e folga 2 dias em rodízio.</p>
<p>Com as folgas espalhadas, cada turno tem pelo menos 2 pessoas em todos os dias. Para não quebrar as 11 horas de descanso, quem está no fechamento fica no fechamento a semana toda; a troca de turno acontece de uma semana para outra, sempre depois de uma folga. Assim ninguém sai às 22h e volta às 10h.</p>
`,
    faq: [
      ['A partir de quando vale a jornada de 42 horas?', 'A partir de 15 de dezembro de 2026, até 14 de dezembro de 2027. A partir de 15 de dezembro de 2027, o limite é 40 horas.'],
      ['Posso fazer 42 horas em 5 dias?', 'Só com dias acima de 8 horas (ex.: 8h24), e jornada acima de 8h por dia só vale com acordo ou convenção coletiva. A partir de 15/12/2027 isso deixa de caber no limite.'],
      ['O almoço conta nas 8 horas?', 'Não. As 8 horas são de trabalho. O intervalo de 1 a 2 horas em jornada acima de 6h fica de fora.'],
      ['Qual a jornada mais simples na escala 5x2?', '5 dias de 8 horas, 40 horas na semana. Monte a sua no <a href="/gerador">gerador de escala 5x2 grátis</a>.'],
    ],
    relacionados: ['banco-de-horas-hora-extra-5x2', 'escala-5x2-fim-da-6x1', 'como-fazer-escala-5x2'],
  },

  {
    slug: 'escala-5x2-farmacia-mercado-restaurante',
    titulo: 'Escala 5x2 para farmácia, mercado e restaurante',
    curto: 'Farmácia, mercado e restaurante',
    etiqueta: 'Por segmento',
    publicado: '2026-11-13', atualizado: '2026-11-15',
    descricao: 'Como montar a escala 5x2 em farmácia (farmacêutico todo dia), mercado (caixas) e restaurante (cozinha e fim de semana), com a conta de quantas pessoas cada um precisa.',
    resumo: 'Cada negócio tem uma função que não pode faltar: o farmacêutico, o caixa, a cozinha. Como garantir essa função todos os dias com cada pessoa folgando 2 dias, com contas prontas.',
    base: 'EC 141/2026, Lei 10.101/2000 (art. 6º), Lei 13.021/2014 (art. 6º), CLT art. 66',
    corpo: `
<p>A regra da escala 5x2 é igual para todo mundo: 2 folgas por semana, até 8 horas por dia e rodízio de domingo. O que muda de um negócio para outro é <strong>quem não pode faltar</strong>. Uma farmácia sem farmacêutico não abre. Um mercado sem caixa não vende. Um restaurante sem cozinha não serve. Este artigo mostra como montar a 5x2 em cada um desses três, com a conta de quantas pessoas você precisa.</p>
<p>Os três são comércio, então o domingo de folga de cada pessoa precisa cair pelo menos 1 vez a cada 3 semanas (Lei 10.101/2000, art. 6º). Veja <a href="/blog/domingo-escala-5x2-comercio">como fazer o rodízio de domingo</a>.</p>

<h2>A conta que vale para os três</h2>
<p>Primeiro a equipe toda, depois a função que não pode faltar. Para cada uma, some o mínimo de pessoas de cada dia aberto e divida por 5. Arredonde para cima. Faça a conta duas vezes: uma para a equipe inteira e outra só para a função crítica.</p>

<h2>Farmácia e drogaria</h2>
<p>A farmácia só pode funcionar com <strong>farmacêutico presente durante todo o horário</strong> (Lei 13.021/2014, art. 6º). Se abre mais de 9 horas por dia, isso significa 2 farmacêuticos por dia, um em cada turno, porque cada pessoa trabalha no máximo 8 horas.</p>
<div class="quadro"><p><strong>Exemplo:</strong> farmácia aberta das 7h às 22h, todos os dias. Precisa de 2 farmacêuticos por dia (um de manhã, um à tarde).</p><p>Farmacêuticos: 2 × 7 dias = 14. Dividido por 5 = 2,8. São <strong>3 farmacêuticos</strong>.</p><p>Equipe toda, com 3 pessoas por dia de segunda a sábado e 2 no domingo: 3×6 + 2 = 20. Dividido por 5 = <strong>4 pessoas</strong> no mínimo, incluindo os farmacêuticos.</p></div>
<p>O ponto de atenção é que, com só 2 farmacêuticos, a conta não fecha nos 7 dias: eles somam 10 dias de trabalho por semana, e a farmácia precisa de 14. Esse é o erro que mais aparece quando a farmácia sai da 6x1.</p>

<h2>Mercado e supermercado</h2>
<p>No mercado, a função crítica é o <strong>caixa</strong>. Sem caixa aberto, não há venda. E o movimento não é igual na semana: sexta e sábado pedem reforço.</p>
<div class="quadro"><p><strong>Exemplo:</strong> mercado aberto 7 dias, com mínimo de 4 pessoas de segunda a quinta e no domingo, 5 na sexta e 6 no sábado. Soma: 4×4 + 5 + 6 + 4 = 31. Dividido por 5 = 6,2. São <strong>7 pessoas</strong>.</p><p>Caixas: 2 por dia, 3 no sábado. Soma: 2×6 + 3 = 15. Dividido por 5 = <strong>3 caixas</strong>.</p></div>
<p>Dica: dê as folgas dos caixas primeiro, nos dias de menor movimento (geralmente segunda e terça). Depois encaixe repositores, açougue e hortifrúti em volta. Se o mercado tem mais de uma unidade, cada uma tem a sua escala e a sua conta.</p>

<h2>Restaurante, lanchonete e bar</h2>
<p>No restaurante, quem não pode faltar é a <strong>cozinha</strong>. E o pico é o contrário do escritório: sexta, sábado e domingo.</p>
<div class="quadro"><p><strong>Exemplo:</strong> restaurante aberto 7 dias, com 3 pessoas de segunda a quarta, 4 na quinta e 5 de sexta a domingo. Soma: 3×3 + 4 + 5×3 = 28. Dividido por 5 = 5,6. São <strong>6 pessoas</strong>.</p><p>Cozinha: 1 por dia de segunda a quinta e 2 de sexta a domingo. Soma: 4 + 6 = 10. Dividido por 5 = <strong>2 cozinheiros</strong>, com as folgas de ambos no começo da semana.</p></div>
<p>Restaurante que abre almoço e jantar costuma ter dois turnos. Atenção às 11 horas de descanso entre um dia e outro (CLT, art. 66): quem fecha o jantar à meia-noite não pode abrir o almoço às 10h do dia seguinte.</p>
<p>Como o fim de semana é o pico, o rodízio de domingo é o ponto mais difícil. Com 6 pessoas e 5 trabalhando no domingo, só 1 folga por domingo, e a conta de 3 semanas não fecha para todos. Reveja o mínimo de domingo ou reforce a equipe.</p>

<h2>Padaria e posto: duas notas rápidas</h2>
<ul>
<li><strong>Padaria:</strong> padeiro todo dia. Quem faz o pão de madrugada precisa das 11 horas de descanso até o próximo turno.</li>
<li><strong>Posto de combustível:</strong> frentistas na pista o dia todo. Posto 24 horas precisa de 3 turnos de 8 horas, e quem trabalha de madrugada tem adicional noturno.</li>
</ul>

<h2>Monte e confira</h2>
<p>O <a href="/gerador">gerador de escala 5x2 grátis</a> já vem com as funções de cada um desses negócios. Você escolhe "Farmácia", "Mercado" ou "Restaurante", diz quantas pessoas tem em cada função, e a escala sai garantindo a função que não pode faltar e avisando quando a equipe não cobre os dias.</p>

<h2>O que os três têm em comum</h2>
<p>Farmácia, mercado e restaurante são comércio. Então valem para os três: as 2 folgas por semana para cada pessoa, o limite de 8 horas por dia, o domingo de folga pelo menos 1 vez a cada 3 semanas, e o feriado trabalhado pago em dobro ou compensado com outra folga (Lei 605/49, art. 9º). Abrir no feriado, no comércio, depende da convenção coletiva e da lei da cidade.</p>
<p>A ordem para montar também é a mesma: primeiro as folgas da função que não pode faltar, depois o resto da equipe em volta. Assim você nunca descobre na quinta-feira que o único farmacêutico, caixa ou cozinheiro do dia está de folga.</p>
`,
    faq: [
      ['Quantos farmacêuticos preciso na escala 5x2?', 'Se a farmácia abre 7 dias e precisa de 1 farmacêutico por dia, são 7 ÷ 5 = 1,4, ou seja, 2. Se abre mais de 9 horas por dia, são 2 por dia: 14 ÷ 5 = 2,8, ou seja, 3 farmacêuticos.'],
      ['Mercado pode abrir no domingo na 5x2?', 'Pode, conforme a lei do município. Cada pessoa precisa folgar no domingo pelo menos 1 vez a cada 3 semanas (Lei 10.101/2000, art. 6º).'],
      ['Como dar folga no restaurante se o pico é no fim de semana?', 'Concentre as folgas de segunda a quinta e faça o rodízio de domingo em 3 grupos. Se o domingo precisa de quase todo mundo, a conta do rodízio não fecha: reveja o mínimo ou reforce a equipe.'],
      ['Existe gerador de escala para farmácia?', 'Sim. No <a href="/gerador">gerador grátis</a>, escolha "Farmácia / drogaria": a escala garante farmacêutico nos dias em que a equipe cobre e avisa quando não cobre.'],
    ],
    relacionados: ['como-fazer-escala-5x2', 'domingo-escala-5x2-comercio', 'feriados-escala-5x2'],
  },

  {
    slug: 'banco-de-horas-hora-extra-5x2',
    titulo: 'Banco de horas e hora extra na escala 5x2',
    curto: 'Banco de horas e hora extra',
    etiqueta: 'Horas',
    publicado: '2026-11-14', atualizado: '2026-11-15',
    descricao: 'Hora extra continua existindo na escala 5x2: adicional mínimo de 50% ou banco de horas, conforme a CLT. Veja quando conta como extra, como registrar e os erros que viram processo.',
    resumo: 'A nova lei não acabou com a hora extra nem com o banco de horas. Mas, com o limite menor, fica mais fácil passar dele sem perceber. Como controlar e o que registrar.',
    base: 'EC 141/2026, CLT arts. 66 e 71',
    corpo: `
<p>Com a escala 5x2 e o limite semanal caindo para 42 e depois 40 horas, muita gente pergunta: ainda dá para pedir hora extra? E o banco de horas, continua? A resposta curta é sim para os dois. A Emenda Constitucional 141/2026 mudou o limite, não acabou com as ferramentas para quando o dia aperta.</p>

<h2>O que conta como hora extra na 5x2</h2>
<p>Hora extra é o que passa do limite. Na escala 5x2 há dois limites para olhar:</p>
<ul>
<li><strong>No dia:</strong> passou de 8 horas de trabalho, a hora a mais é extra (ou vai para o banco de horas, se houver acordo).</li>
<li><strong>Na semana:</strong> passou do limite da data, é extra. São 42h de 15/12/2026 a 14/12/2027 e 40h a partir de 15/12/2027.</li>
</ul>
<p>O almoço não entra na conta. As 8 horas são de trabalho, e o intervalo de 1 a 2 horas em jornada acima de 6h fica de fora (CLT, art. 71).</p>
<div class="quadro"><p><strong>Exemplo:</strong> uma pessoa na 5x2 de 8 horas fica 2 horas a mais na sexta, por causa de um inventário. Ela trabalhou 10 horas naquele dia: são 2 horas extras, mesmo que a semana feche em 42 horas, porque o dia passou de 8.</p></div>

<h2>Quanto se paga</h2>
<p>A hora extra tem <strong>adicional mínimo de 50%</strong> sobre a hora normal. Se a hora normal de alguém vale R$ 10, a hora extra vale pelo menos R$ 15. A convenção coletiva da categoria pode prever um adicional maior, então confirme o percentual com o seu contador.</p>
<p>E um lembrete importante: o salário não pode ser reduzido por causa da redução da jornada. A emenda proíbe isso. Quem ganhava um salário por 44 horas continua ganhando o mesmo salário pelas novas horas.</p>

<h2>Banco de horas: continua valendo</h2>
<p>No lugar de pagar, a hora a mais pode ir para o banco de horas e virar folga depois, conforme a CLT. A compensação de horários continua possível por acordo ou convenção coletiva. O que mudou é que cláusulas que contrariam a emenda deixam de valer.</p>
<p>Na prática, o banco de horas funciona bem para picos previsíveis: inventário, Black Friday, Natal. A pessoa trabalha a mais naquela semana e folga a mais numa semana mais calma. O que não pode é o banco virar desculpa para uma 6x1 disfarçada, com alguém trabalhando 6 dias toda semana e "compensando" um dia que nunca chega.</p>
<p>A forma do banco (por acordo individual ou coletivo, e o prazo para compensar) depende do que a CLT e a sua convenção dizem. Defina isso com o seu contador antes de começar, e por escrito.</p>

<h2>Os erros que viram processo</h2>
<ul>
<li><strong>Hora extra todo dia.</strong> Se alguém precisa ficar uma hora a mais todos os dias, a escala está errada, não a pessoa. Falta gente ou o turno está mal desenhado.</li>
<li><strong>Sexto dia de trabalho chamado de hora extra.</strong> A segunda folga da semana é garantida. Trabalhar no dia de folga não é só hora extra: é tirar a folga.</li>
<li><strong>Quebrar as 11 horas de descanso.</strong> Ficar até mais tarde e voltar cedo no dia seguinte pode derrubar o descanso mínimo entre um dia e outro (CLT, art. 66).</li>
<li><strong>Não registrar.</strong> Banco de horas sem controle por escrito é palavra contra palavra. Numa fiscalização ou processo, quem não tem registro perde.</li>
<li><strong>Feriado trabalhado esquecido.</strong> Feriado não é hora extra comum: é pago em dobro ou compensado com outra folga (Lei 605/49, art. 9º). Veja <a href="/blog/feriados-escala-5x2">feriados na escala 5x2</a>.</li>
</ul>

<h2>Como a escala ajuda a não precisar de hora extra</h2>
<p>A melhor forma de controlar a hora extra é não precisar dela. Uma escala bem feita tem gente suficiente em cada dia, com folgas espalhadas nos dias mais calmos. Se você ainda não fez a conta de quantas pessoas precisa, ela está em <a href="/blog/como-fazer-escala-5x2">como fazer uma escala 5x2</a>: some o mínimo de cada dia e divida por 5. Para ver se a sua equipe cobre a semana sem hora extra, teste no <a href="/gerador">gerador de escala 5x2 grátis</a>.</p>
<p>Se o horário de funcionamento é maior que 9 horas, desenhe dois turnos em vez de esticar o dia de alguém. Mostramos um exemplo em <a href="/blog/jornada-42-horas">jornada de 42 horas</a>.</p>

<h2>O que registrar todo mês</h2>
<ol>
<li>A escala da semana, por escrito, guardada.</li>
<li>As horas extras de cada pessoa, com o dia e o motivo.</li>
<li>O saldo do banco de horas, quando houver acordo.</li>
<li>Os feriados trabalhados e como foram pagos ou compensados.</li>
<li>Faltas, atestados e férias.</li>
</ol>
<p>Mande isso para o seu contador no fechamento do mês. A versão completa da Sua Escala 5x2 junta tudo no fechamento e dá acesso de consulta ao contador.</p>

<h2>Um mês de exemplo</h2>
<p>Imagine uma loja com 5 pessoas na 5x2 de 8 horas. Em dezembro, com o movimento de Natal, a gerente pede 1 hora a mais por dia na semana de 21 a 24. Cada pessoa trabalha 4 dias de 9 horas naquela semana: são 4 horas a mais por pessoa, e 20 horas no total.</p>
<p>Há dois caminhos. Pagar como extra, com o adicional mínimo de 50% sobre a hora normal. Ou, se existe acordo de banco de horas, guardar essas 20 horas e devolver em folga em janeiro, quando o movimento cai. Nos dois casos, anote dia, pessoa e quantidade. E repare que, mesmo na semana mais cheia, ninguém trabalhou o sexto dia: as 2 folgas continuaram lá.</p>
`,
    faq: [
      ['Na escala 5x2 ainda existe hora extra?', 'Existe. O que passar do limite do dia (8h) ou da semana (42h ou 40h, conforme a data) é hora extra, com adicional mínimo de 50%, ou vai para o banco de horas, conforme a CLT.'],
      ['O banco de horas continua valendo depois da EC 141/2026?', 'Continua. A compensação de horários segue possível por acordo ou convenção coletiva. Cláusulas que contrariam a emenda deixam de valer.'],
      ['Posso pedir para o funcionário trabalhar na folga e pagar hora extra?', 'A segunda folga da semana é garantida pela emenda. Usar a folga como rotina para trabalhar o sexto dia descaracteriza a 5x2. Converse com o seu contador antes.'],
      ['Feriado trabalhado é hora extra?', 'Tem regra própria: o dia é pago em dobro ou compensado com outra folga (Lei 605/49, art. 9º).'],
    ],
    relacionados: ['jornada-42-horas', 'feriados-escala-5x2', 'escala-5x2-fim-da-6x1'],
  },

  {
    slug: 'feriados-escala-5x2',
    titulo: 'Feriados na escala 5x2: quem trabalha e quanto paga',
    curto: 'Feriados na escala 5x2',
    etiqueta: 'Feriados',
    publicado: '2026-11-14', atualizado: '2026-11-15',
    descricao: 'Feriado trabalhado na escala 5x2 é pago em dobro ou compensado com outra folga (Lei 605/49). Veja os feriados nacionais, estaduais e municipais e como montar a escala.',
    resumo: 'É no feriado que a empresa mais perde dinheiro sem perceber. Quem pode trabalhar, quanto se paga, o que muda no comércio e como deixar a escala pronta para o feriado.',
    base: 'Lei 605/1949 (art. 9º), Lei 10.101/2000 (art. 6º-A), EC 141/2026',
    corpo: `
<p>A escala 5x2 resolve as folgas da semana, mas o feriado tem regra própria. E é justamente nele que muita empresa perde dinheiro sem perceber: alguém trabalha no feriado, ninguém anota, o dia não é pago em dobro nem compensado, e isso aparece meses depois numa reclamação trabalhista. Este artigo mostra como deixar a escala pronta para os feriados.</p>

<h2>A regra: dobro ou outra folga</h2>
<p>Quem trabalha no feriado <strong>recebe o dia em dobro ou ganha outra folga</strong> (Lei 605/49, art. 9º). Uma das duas coisas tem que acontecer. Não existe a terceira opção de "trabalhou e ficou por isso mesmo".</p>
<div class="quadro"><p><strong>Exemplo:</strong> 20/11, Consciência Negra. Quatro pessoas trabalham no feriado. São <strong>4 dias para pagar em dobro</strong> ou 4 folgas para dar em outro dia.</p></div>
<p>Na hora de escolher entre pagar ou compensar, pense no caixa e na equipe: pagar em dobro mantém a escala como está; dar folga exige gente para cobrir o dia extra de descanso.</p>
<p>A folga compensatória do feriado é diferente das 2 folgas da semana. Se alguém trabalhou no feriado e a empresa escolheu compensar, essa pessoa ganha uma folga a mais, além das duas da 5x2.</p>

<h2>No comércio: abrir no feriado depende de autorização</h2>
<p>No comércio, trabalhar em feriado <strong>depende de autorização na convenção coletiva e da lei municipal</strong> (Lei 10.101/2000, art. 6º-A). Antes de escalar a equipe para o feriado, confirme duas coisas com o seu contador ou com o sindicato:</p>
<ol>
<li>se a convenção da sua categoria autoriza abrir naquele feriado;</li>
<li>se a lei da sua cidade permite o comércio aberto nesse dia.</li>
</ol>
<p>A convenção costuma trazer também condições extras para o feriado, como horário reduzido ou ajuda de custo. Confira antes de fechar a escala.</p>

<h2>Quais feriados entram na escala</h2>
<p>São três camadas, e as três contam:</p>
<h3>Nacionais</h3>
<div class="rol"><table>
<thead><tr><th>Data</th><th>Feriado</th></tr></thead>
<tbody>
<tr><td>1º de janeiro</td><td>Confraternização Universal</td></tr>
<tr><td>Sexta antes da Páscoa (muda todo ano)</td><td>Sexta-feira Santa</td></tr>
<tr><td>21 de abril</td><td>Tiradentes</td></tr>
<tr><td>1º de maio</td><td>Dia do Trabalho</td></tr>
<tr><td>7 de setembro</td><td>Independência</td></tr>
<tr><td>12 de outubro</td><td>Nossa Senhora Aparecida</td></tr>
<tr><td>2 de novembro</td><td>Finados</td></tr>
<tr><td>15 de novembro</td><td>Proclamação da República</td></tr>
<tr><td>20 de novembro</td><td>Consciência Negra</td></tr>
<tr><td>25 de dezembro</td><td>Natal</td></tr>
</tbody></table></div>
<h3>Estaduais</h3>
<p>Cada estado tem a sua data, como 2 de julho na Bahia, 9 de julho em São Paulo, 23 de abril no Rio de Janeiro e 20 de setembro no Rio Grande do Sul. No <a href="/gerador">gerador grátis</a>, escolha o estado e os feriados estaduais aparecem na semana.</p>
<h3>Municipais</h3>
<p>Aniversário da cidade, padroeiro e outros feriados da sua cidade. Esses você precisa informar. Datas como Carnaval e Corpus Christi não estão na lista nacional: dependendo da cidade, são feriado municipal ou ponto facultativo. Confira na prefeitura.</p>

<h2>Como montar a escala do feriado</h2>
<ol>
<li><strong>Decida se vai abrir.</strong> Se não abrir, todo mundo folga e o feriado não entra na conta das 2 folgas semanais.</li>
<li><strong>Se abrir, defina o mínimo do dia.</strong> Muitas vezes o feriado pede menos gente que um dia normal.</li>
<li><strong>Escolha quem trabalha com rodízio.</strong> Não deixe sempre as mesmas pessoas nos feriados. Anote quem trabalhou em cada um.</li>
<li><strong>Decida: dobro ou folga.</strong> Se for folga, já marque o dia na escala das semanas seguintes.</li>
<li><strong>Mande para o contador.</strong> Os feriados trabalhados precisam entrar no fechamento do mês.</li>
</ol>

<h2>Feriado no domingo</h2>
<p>Quando o feriado cai num domingo, as duas regras se somam: o rodízio de domingo do comércio (folga no domingo pelo menos 1 vez a cada 3 semanas, Lei 10.101, art. 6º) continua valendo, e quem trabalhar recebe o feriado em dobro ou ganha outra folga. Explicamos o domingo em <a href="/blog/domingo-escala-5x2-comercio">domingo na escala 5x2 do comércio</a>.</p>

<h2>Dezembro: atenção dobrada</h2>
<p>Em dezembro de 2026, três coisas acontecem juntas: o limite semanal cai para 42 horas no dia 15, as 2 folgas por semana passam a valer, e o Natal cai numa sexta-feira. Para o comércio, é o mês mais cheio do ano. Monte a escala de dezembro com antecedência, já na 5x2, e combine com a equipe quem trabalha no Natal e no Ano Novo.</p>
<p>Se a sua equipe vai fazer hora extra no fim de ano, veja também <a href="/blog/banco-de-horas-hora-extra-5x2">banco de horas e hora extra na 5x2</a>.</p>

<h2>Quanto custa esquecer um feriado</h2>
<p>Faça a conta do seu negócio. Uma loja com 6 pessoas que abre em 8 feriados no ano, com 4 pessoas por feriado, soma 32 dias trabalhados em feriado. Se nenhum foi pago em dobro nem compensado, são 32 dias que deveriam ter sido pagos em dobro ou trocados por folga, fora o que a convenção coletiva possa prever a mais. Num processo, isso aparece de uma vez, somando anos.</p>
<p>O controle é simples: no começo do mês, marque os feriados na escala. Depois de cada um, anote quem trabalhou e se vai ser pago em dobro ou compensado com folga. No fechamento do mês, mande a lista para o contador. A versão completa da Sua Escala 5x2 marca os feriados nacionais e os do seu estado sozinha, e os da cidade você informa uma vez.</p>
`,
    faq: [
      ['Quanto se paga para quem trabalha no feriado?', 'O dia em dobro, ou a empresa dá outra folga no lugar (Lei 605/49, art. 9º).'],
      ['O comércio pode abrir no feriado?', 'Depende de autorização na convenção coletiva e da lei municipal (Lei 10.101/2000, art. 6º-A). Confirme com o contador ou o sindicato.'],
      ['A folga do feriado conta como uma das 2 folgas da semana?', 'Não. Quem trabalhou no feriado e vai compensar ganha uma folga a mais, além das 2 folgas semanais da 5x2.'],
      ['Carnaval é feriado nacional?', 'Não está na lista de feriados nacionais. Dependendo da cidade, é feriado municipal ou ponto facultativo. Confira na prefeitura.'],
    ],
    relacionados: ['domingo-escala-5x2-comercio', 'banco-de-horas-hora-extra-5x2', 'como-fazer-escala-5x2'],
  },

  {
    slug: 'escala-5x2-6x1-12x36',
    titulo: 'Escala 5x2 x 6x1 x 12x36: as diferenças',
    curto: '5x2, 6x1 e 12x36',
    etiqueta: 'Comparação',
    publicado: '2026-11-15', atualizado: '2026-11-15',
    descricao: 'Compare a escala 5x2, a 6x1 e a 12x36: folgas, horas por semana e o que vale depois da EC 141/2026. Veja qual escala usar no seu negócio a partir de 15/12/2026.',
    resumo: 'Três escalas, três lógicas. O que cada uma significa, quantas horas dá por semana e qual continua valendo depois de 15 de dezembro de 2026 e de 15 de dezembro de 2027.',
    base: 'EC 141/2026, CLT art. 59-A, Lei 10.101/2000 (art. 6º)',
    corpo: `
<p>5x2, 6x1, 12x36. Os números parecem código, mas cada escala diz uma coisa simples: quantos dias (ou horas) se trabalha e quanto se descansa. Com a Emenda Constitucional 141/2026, uma delas deixou de ser regra geral, outra virou o padrão e a terceira ficou num meio-termo. Veja as diferenças.</p>

<h2>O que cada número significa</h2>
<ul>
<li><strong>6x1:</strong> seis dias de trabalho, um de folga. Era o padrão do comércio, com 44 horas por semana (6 dias de 7h20).</li>
<li><strong>5x2:</strong> cinco dias de trabalho, dois de folga. Com 8 horas por dia, dá 40 horas por semana.</li>
<li><strong>12x36:</strong> doze horas de trabalho seguidas de trinta e seis horas de descanso. Comum em portaria, vigilância e saúde.</li>
</ul>

<h2>Comparação lado a lado</h2>
<div class="rol"><table>
<thead><tr><th></th><th>6x1</th><th>5x2</th><th>12x36</th></tr></thead>
<tbody>
<tr><td>Folgas</td><td>1 por semana</td><td>2 por semana</td><td>36h depois de cada plantão</td></tr>
<tr><td>Horas por dia</td><td>7h20 (no padrão de 44h)</td><td>Até 8h</td><td>12h</td></tr>
<tr><td>Horas por semana</td><td>44h</td><td>40h (com 8h por dia)</td><td>Em média 42h</td></tr>
<tr><td>Até 14/12/2026</td><td>Ainda vale</td><td>Vale</td><td>Vale por acordo ou convenção</td></tr>
<tr><td>De 15/12/2026 a 14/12/2027</td><td>Não vale</td><td>Vale</td><td>Vale por acordo ou convenção (média de 42h)</td></tr>
<tr><td>A partir de 15/12/2027</td><td>Não vale</td><td>Vale</td><td>Acima das 40h: depende do ajuste da categoria</td></tr>
</tbody></table></div>

<h2>6x1: por que acabou</h2>
<p>A EC 141/2026 garante 2 folgas por semana para cada pessoa. A 6x1 tem só uma. Por isso, a partir de 15/12/2026, ela deixa de valer como regra geral, com qualquer carga horária. Mesmo uma 6x1 de 6 dias de 6h40, que dá 40 horas, fica irregular: falta a segunda folga.</p>
<p>Uma armadilha comum é tentar "salvar" a 6x1 encurtando o dia. Não funciona. A mudança da emenda é de dias de descanso, não só de horas.</p>

<h2>5x2: o novo padrão</h2>
<p>A 5x2 é a escala que nasce da regra das 2 folgas. Com 8 horas por dia, são 40 horas por semana: dentro do limite de 42h que vale de 15/12/2026 a 14/12/2027 e igual ao limite final de 40h. É a escala que não precisa ser refeita em 2027.</p>
<p>Na 5x2, o negócio pode continuar abrindo todos os dias. As folgas de cada pessoa caem em dias diferentes, num rodízio, e o domingo de folga entra a cada 3 semanas no comércio (Lei 10.101/2000, art. 6º). O passo a passo está em <a href="/blog/como-fazer-escala-5x2">como fazer uma escala 5x2</a>.</p>

<h2>12x36: continua, mas com um alerta</h2>
<p>A emenda não acabou com a 12x36. Ela continua prevista na CLT (art. 59-A), por acordo ou convenção coletiva. O alerta é a conta de horas: a 12x36 dá em média 42 horas por semana. Isso cabe no limite de 42h até 14/12/2027, mas fica acima das 40 horas que valem a partir de 15/12/2027.</p>
<p>A tendência é que cada categoria ajuste isso na convenção coletiva. Se a sua equipe é 12x36, não mude nada por conta própria: confirme com o seu contador e acompanhe a convenção da categoria.</p>

<h2>Qual escala usar no seu negócio</h2>
<div class="rol"><table>
<thead><tr><th>Negócio</th><th>Escala mais comum a partir de 15/12/2026</th></tr></thead>
<tbody>
<tr><td>Loja, mercado, farmácia, padaria, restaurante, posto</td><td>5x2, com rodízio de folgas e de domingo</td></tr>
<tr><td>Salão, clínica, academia</td><td>5x2, com domingo de folga pelo menos a cada 7 semanas quando abre no domingo</td></tr>
<tr><td>Escritório de segunda a sexta</td><td>5x2 já pronta: folga no sábado e no domingo</td></tr>
<tr><td>Portaria, vigilância, plantão de saúde</td><td>12x36 por acordo ou convenção, ou 5x2 de 8h. Confirme com o contador</td></tr>
</tbody></table></div>
<p>Os detalhes por segmento estão em <a href="/blog/escala-5x2-farmacia-mercado-restaurante">escala 5x2 para farmácia, mercado e restaurante</a>.</p>

<h2>E a 4x3?</h2>
<p>Quatro dias de trabalho e três de folga também respeitam as 2 folgas da emenda. Com 8 horas por dia, dá 32 horas por semana. É uma escolha possível para meio período ou para quem quer reduzir a jornada, mas não é exigida pela lei. Na versão completa da Sua Escala 5x2, dá para definir menos dias de trabalho por função.</p>

<h2>Resumo</h2>
<ul>
<li>A 6x1 deixa de valer a partir de 15/12/2026, com qualquer carga horária.</li>
<li>A 5x2 de 8 horas (40h) vale agora e depois de 2027.</li>
<li>A 12x36 continua por acordo ou convenção, mas passa das 40 horas a partir de 15/12/2027: acompanhe a sua categoria.</li>
</ul>
<p>Para ver a 5x2 da sua equipe, use o <a href="/gerador">gerador de escala 5x2 grátis</a>.</p>

<h2>Como fazer a troca da 6x1 para a 5x2 sem confusão</h2>
<p>A mudança de escala mexe com a rotina de todo mundo, então vale planejar a conversa e não só a planilha. Um roteiro que funciona:</p>
<ol>
<li><strong>Faça a conta antes de anunciar.</strong> Some o mínimo de pessoas de cada dia aberto e divida por 5. Se faltar gente, decida antes se vai contratar ou reduzir o mínimo de algum dia.</li>
<li><strong>Pergunte as preferências.</strong> Quem prefere folgar no começo da semana, quem precisa da segunda-feira livre, quem estuda à noite. Folga fixa combinada é permitida e ajuda a reter gente boa.</li>
<li><strong>Mostre a escala nova com antecedência.</strong> Pelo menos uma semana antes de 15 de dezembro. A equipe precisa se organizar com a família e o transporte.</li>
<li><strong>Explique o que não muda.</strong> O salário continua o mesmo: a emenda proíbe reduzir o salário por causa da redução da jornada.</li>
<li><strong>Guarde tudo por escrito.</strong> A escala impressa ou em PDF é a sua prova de que as folgas foram dadas.</li>
</ol>
`,
    faq: [
      ['Qual a diferença entre escala 5x2 e 6x1?', 'Na 6x1 se trabalha 6 dias e folga 1. Na 5x2 se trabalha 5 dias e folga 2. Com a EC 141/2026, a 6x1 deixa de valer como regra geral a partir de 15/12/2026.'],
      ['A escala 12x36 acabou?', 'Não. Continua prevista na CLT (art. 59-A), por acordo ou convenção. Mas dá em média 42 horas por semana, acima das 40 horas que valem a partir de 15/12/2027.'],
      ['6x1 com 40 horas vale?', 'Não. Mesmo com 40 horas, a 6x1 tem só uma folga, e a emenda garante 2 folgas por semana.'],
      ['Qual escala é mais segura agora?', '5x2 de 8 horas por dia, 40 horas por semana. Monte a sua no <a href="/gerador">gerador grátis</a>.'],
    ],
    relacionados: ['escala-5x2-fim-da-6x1', 'jornada-42-horas', 'como-fazer-escala-5x2'],
  },
];
