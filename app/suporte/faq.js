// Dúvidas frequentes da Sua Escala 5x2: a mesma base serve o widget de ajuda (navegador, em /suporte/faq.js)
// e o assistente de IA no n8n (texto do prompt, em textoParaPrompt()).
// Cada resposta descreve só o que o app faz hoje. Se uma tela mudar de nome ou de lugar, atualize aqui
// e cole o texto novo no prompt do agente no n8n (node suporte/prompt.js imprime o texto).
// "ir" é a rota do app (#rota) aberta pelo botão "Ir para a tela".
(function (raiz) {
  const CATEGORIAS = [
    {
      id: 'primeiros-passos', nome: 'Primeiros passos', resumo: 'Gerar escala e o primeiro acesso',
      perguntas: [
        { id: 'gerar-escala', p: 'Como gero a primeira escala?', ir: 'comecar', botao: 'Gerar escala',
          r: 'Em Início, toque em Gerar escala. O app faz uma pergunta por tela: tipo de negócio, nome da unidade, dias de funcionamento, horário, mínimo de pessoas por dia e quantos colaboradores há em cada função. No fim, a escala sai pronta para 4 semanas, com 2 folgas por semana para cada um, rodízio de domingo e o mínimo de cada dia respeitado.',
          palavras: 'primeira escala montar criar quiz perguntas comecar inicio' },
        { id: 'botao-gerar', p: 'Não acho o botão de gerar a escala da semana. Onde fica?', ir: 'escala', botao: 'Abrir a escala',
          r: 'Não existe botão para cada semana: a escala se gera sozinha. Ao abrir uma semana que ainda não tem escala, o app monta na hora. Quando você muda os colaboradores ou o funcionamento, as semanas futuras são refeitas automaticamente. A semana em curso nunca muda sozinha.',
          palavras: 'gerar semana nova proxima semana automatica refazer' },
        { id: 'cadastro-empresa', p: 'Preciso preencher os dados da empresa?', ir: 'empresa', botao: 'Dados da empresa',
          r: 'Sim, no primeiro acesso o app pede o cadastro da empresa: nome, CNPJ (os dados são buscados pelo CNPJ), porte, endereço, tipo de negócio e número de funcionários. Depois você altera tudo em Mais › Dados da empresa.',
          palavras: 'cnpj razao social cadastro empresa endereco porte mei' },
        { id: 'analise', p: 'O que significa o aviso "Escala dentro da lei" ou o aviso vermelho?', ir: 'escala', botao: 'Abrir a escala',
          r: 'No topo da escala aparece a análise da semana. Verde: tudo dentro da lei. Vermelho: algo precisa de atenção, como um dia com menos gente que o mínimo ou alguém sem domingo de folga há muito tempo. Toque no aviso para ver o detalhe e o que fazer.',
          palavras: 'aviso vermelho alerta analise dentro da lei problema falta gente' },
        { id: 'falta-gente', p: 'A escala diz que falta gente em um dia. O que faço?', ir: 'funcionamento', botao: 'Abrir Funcionamento',
          r: 'Com 2 folgas por semana, cada pessoa trabalha 5 dias. Se o mínimo de algum dia não fecha, você pode cadastrar mais colaboradores em Colaboradores, ou rever o mínimo de pessoas por dia em Mais › Funcionamento. Conta rápida: some o mínimo de cada dia aberto e divida por 5; esse é o número de pessoas necessário.',
          palavras: 'falta gente minimo descoberto pouca gente quantas pessoas preciso' },
        { id: 'tela-inicial', p: 'Dá para usar como aplicativo no celular?', ir: 'instalar', botao: 'Colocar na tela inicial',
          r: 'Sim. Em Mais › Colocar na tela inicial o app ganha um ícone no celular e abre como aplicativo. Não precisa baixar nada na loja.',
          palavras: 'aplicativo celular instalar icone tela inicial baixar' },
      ],
    },
    {
      id: 'escala', nome: 'Escala', resumo: 'Trocar folga, domingo, feriado e horas',
      perguntas: [
        { id: 'trocar-folga', p: 'Como troco a folga de alguém?', ir: 'escala', botao: 'Abrir a escala',
          r: 'Na Escala, toque no nome da pessoa no dia. Se ela folga nesse dia, escolha para qual dia a folga vai. Se ela trabalha, toque em Dar folga neste dia e escolha em que dia ela trabalha no lugar. A análise da lei se atualiza na hora.',
          palavras: 'trocar folga mudar folga dia trocar dia ajustar' },
        { id: 'modos', p: 'Como vejo a semana inteira ou as 4 semanas?', ir: 'escala/semana', botao: 'Ver a semana',
          r: 'No topo da Escala há os modos: Dia, Semana, Agenda, Colaborador e 4 semanas. Use as setas para ir à semana anterior ou à próxima.',
          palavras: 'ver semana mes 4 semanas tabela agenda colaborador visualizar' },
        { id: 'folga-fixa', p: 'Posso combinar uma folga fixa com alguém?', ir: 'colaboradores', botao: 'Abrir Colaboradores',
          r: 'Pode. Em Colaboradores, toque no colaborador e marque a folga fixa (ex.: sempre na segunda). A escala respeita e monta o resto em volta.',
          palavras: 'folga fixa sempre mesmo dia combinado' },
        { id: 'domingo', p: 'Como funciona o rodízio de domingo?', ir: 'aula/3', botao: 'Ver a aula de domingo',
          r: 'O app faz o rodízio sozinho. No comércio (mercado, farmácia, loja, restaurante, padaria, posto), cada pessoa folga no domingo pelo menos 1 vez a cada 3 semanas (Lei 10.101/2000). Nas demais atividades que abrem no domingo (salão, clínica, academia, portaria), pelo menos 1 vez a cada 7 semanas (Portaria MTP 671/2021). Mulheres folgam no domingo pelo menos a cada 15 dias, em qualquer atividade (CLT, art. 386): marque o Sexo no cadastro do colaborador (Colaboradores › toque no nome). A análise avisa se alguém passar do limite.',
          palavras: 'domingo rodizio 3 semanas 7 semanas folga domingo mulher mulheres sexo 15 dias art 386' },
        { id: 'feriado', p: 'Os feriados já estão na escala?', ir: 'empresa', botao: 'Dados da empresa',
          r: 'Os feriados nacionais e os do seu estado entram sozinhos. Os da sua cidade você informa uma vez em Mais › Dados da empresa, no campo Feriados da sua cidade (ex.: 24/06, 08/12). No feriado a unidade fica fechada e todos folgam. Se vocês abrem, vá em Mais › Funcionamento, na lista de Feriados do mês, e marque "A empresa abre neste feriado". Ali também dá para remover um feriado (vira dia normal) ou adicionar outro. Quem trabalha no feriado recebe o dia em dobro ou ganha outra folga (Lei 605/49), e os feriados trabalhados aparecem no fechamento.',
          palavras: 'feriado municipal cidade estadual nacional dobro abre fechado remover adicionar funcionamento' },
        { id: 'desfazer', p: 'Fiz uma mudança errada. Dá para desfazer?', ir: 'escala', botao: 'Abrir a escala',
          r: 'Sim. Depois de colocar ou tirar um colaborador, lançar ou apagar uma ausência, trocar uma folga ou mudar alguém de setor, aparece um aviso embaixo da tela com o botão Desfazer. Ele fica 8 segundos: toque e tudo volta como estava.',
          palavras: 'desfazer voltar errei engano apaguei sem querer' },
        { id: 'horas', p: 'Como mudo as horas por dia ou o horário de funcionamento?', ir: 'funcionamento', botao: 'Abrir Funcionamento',
          r: 'Em Mais › Funcionamento você ajusta o tipo de negócio, o horário de abrir e fechar, as horas por dia, os dias abertos e o mínimo de pessoas em cada dia. As semanas futuras são refeitas com o novo funcionamento.',
          palavras: 'horas por dia horario abrir fechar dias abertos minimo funcionamento jornada' },
        { id: 'semana-atual', p: 'Mudei a equipe e a semana atual não mudou. Está certo?', ir: 'escala', botao: 'Abrir a escala',
          r: 'Está. Para não bagunçar quem já está trabalhando, a semana em curso nunca é refeita sozinha. Pessoas novas entram a partir da semana seguinte. Se precisar mexer na semana atual, troque as folgas tocando no nome.',
          palavras: 'semana atual nao mudou pessoa nova entrou novo colaborador' },
        { id: '12x36', p: 'O app faz escala 12x36?', ir: 'aula', botao: 'Aulas e ajuda',
          r: 'Não. O app monta a 5x2 de até 8 horas por dia, que já fica dentro da nova lei. A 12x36 continua prevista na CLT por acordo ou convenção, mas dá em média 42h por semana, acima das 40h que valem a partir de 15/12/2027. Se a sua equipe é 12x36, confirme com o contador antes de mudar.',
          palavras: '12x36 plantao portaria vigilancia turno' },
      ],
    },
    {
      id: 'colaboradores', nome: 'Colaboradores e ausências', resumo: 'Cadastrar, folga fixa, falta, atestado e férias',
      perguntas: [
        { id: 'cadastrar', p: 'Como cadastro ou edito um colaborador?', ir: 'colaboradores', botao: 'Abrir Colaboradores',
          r: 'Em Colaboradores você vê a equipe da unidade. Toque em um colaborador para editar nome, função ou folga fixa, ou escreva o nome no campo Nome do novo colaborador para adicionar. A escala das próximas semanas já considera a mudança.',
          palavras: 'cadastrar colaborador funcionario novo editar nome funcao cargo excluir' },
        { id: 'ausencia', p: 'Como lanço falta, atestado ou férias?', ir: 'colaboradores/ausencias', botao: 'Ausências e férias',
          r: 'Dois caminhos: na Escala, toque no nome da pessoa no dia e escolha faltou, trouxe atestado ou Férias, afastamento ou outro; ou em Colaboradores › Ausências e férias, toque em Lançar ausência ou férias. Os tipos são férias, atestado, falta, afastamento, folga extra e banco de horas. Tudo aparece na escala e entra no fechamento do mês.',
          palavras: 'falta atestado ferias afastamento lancar ausencia banco de horas folga extra' },
        { id: 'ferias-escala', p: 'Quando lanço férias, a escala dos outros muda?', ir: 'colaboradores/ausencias', botao: 'Ausências e férias',
          r: 'Sim. Ao lançar férias ou afastamento, o app refaz a escala do período para manter o mínimo de cada dia com quem está trabalhando.',
          palavras: 'ferias refazer escala cobrir afastamento' },
        { id: 'apagar-ausencia', p: 'Lancei uma ausência errada. Como apago?', ir: 'colaboradores/ausencias', botao: 'Ausências e férias',
          r: 'Em Colaboradores › Ausências e férias, escolha o mês, encontre o lançamento e apague. Se a competência do mês já foi fechada, o dono precisa reabrir antes, em Fechamento.',
          palavras: 'apagar ausencia errada excluir falta corrigir' },
        { id: 'funcao-critica', p: 'Na farmácia, o farmacêutico precisa estar todo dia. O app garante?', ir: 'funcionamento', botao: 'Abrir Funcionamento',
          r: 'Garante. Em segmentos com função que não pode faltar (como farmacêutico na farmácia, Lei 13.021/2014), o app mantém o mínimo dessa função em cada dia. O mínimo por função fica em Mais › Funcionamento.',
          palavras: 'farmaceutico funcao obrigatoria critica farmacia' },
      ],
    },
    {
      id: 'publicar', nome: 'Publicar escala', resumo: 'WhatsApp, PDF, Excel, Word, PowerPoint e link',
      perguntas: [
        { id: 'publicar', p: 'Como mando a escala para a equipe?', ir: 'escala/publicar', botao: 'Publicar escala',
          r: 'Na Escala, toque em Publicar escala. Para a equipe: WhatsApp (a escala vira imagem), Link da equipe e Copiar texto. Em arquivos: PDF, Word, Excel, PowerPoint, Google Planilhas, Imagem, Imprimir e CSV. Tudo sai com 4 semanas a partir da semana aberta.',
          palavras: 'publicar enviar mandar whatsapp compartilhar equipe grupo' },
        { id: 'link-equipe', p: 'A equipe precisa baixar aplicativo ou ter senha?', ir: 'escala/publicar', botao: 'Publicar escala',
          r: 'Não. Em Publicar escala › Link da equipe você copia um link e manda no grupo. Cada pessoa abre no celular, escolhe o próprio nome e vê as folgas, sem login e sem instalar nada. O link é só de leitura.',
          palavras: 'link equipe baixar aplicativo senha funcionario ver folga' },
        { id: 'arquivos', p: 'Consigo baixar em PDF, Excel, Word ou PowerPoint?', ir: 'escala/publicar', botao: 'Publicar escala',
          r: 'Sim. Em Publicar escala: PDF para imprimir ou arquivar, Word para editar, Excel com as cores, PowerPoint para TV e mural, CSV para qualquer planilha e Imagem (JPG). Os arquivos são gerados no seu aparelho.',
          palavras: 'pdf excel word powerpoint pptx docx xlsx csv jpg imagem baixar arquivo' },
        { id: 'sheets', p: 'Como coloco a escala no Google Planilhas?', ir: 'escala/publicar', botao: 'Publicar escala',
          r: 'Em Publicar escala › Google Planilhas, toque no botão verde: ele copia a fórmula e abre uma planilha nova. Cole na célula A1. A planilha se atualiza sozinha quando você muda uma folga no app (o Google confere de hora em hora).',
          palavras: 'google planilhas sheets planilha atualiza sozinha importdata' },
        { id: 'imprimir', p: 'Como imprimo a escala para o mural?', ir: 'escala/publicar', botao: 'Publicar escala',
          r: 'Em Publicar escala, toque em Imprimir ou baixe o PDF. Também há o PowerPoint, pensado para TV e mural.',
          palavras: 'imprimir mural papel impressora quadro' },
      ],
    },
    {
      id: 'fechamento', nome: 'Fechamento e contabilidade', resumo: 'Fechar competência e acesso do contador',
      perguntas: [
        { id: 'fechar', p: 'O que é fechar a competência?', ir: 'fechamento', botao: 'Abrir Fechamento',
          r: 'É confirmar que o mês está conferido. Em Fechamento, escolha a competência (mês de referência) e a unidade e feche. Os números ficam congelados, ninguém altera mais escalas e ausências daquele mês e a contabilidade recebe um aviso por e-mail. Lá também dá para baixar a planilha e imprimir.',
          palavras: 'fechar mes competencia fechamento congelar contador aviso' },
        { id: 'reabrir', p: 'Fechei o mês e preciso corrigir. E agora?', ir: 'fechamento', botao: 'Abrir Fechamento',
          r: 'O dono da empresa reabre a competência em Fechamento. Depois de corrigir, feche de novo para avisar a contabilidade.',
          palavras: 'reabrir mes fechado corrigir erro competencia' },
        { id: 'contador', p: 'Como dou acesso ao meu contador?', ir: 'fechamento/contabilidade', botao: 'Acesso da contabilidade',
          r: 'Em Fechamento › Acesso da contabilidade, informe o e-mail e o nome do contador e escolha Contabilidade: consulta e baixa o fechamento. Não há custo adicional. O contador só consulta: nada do que ele abre altera os seus dados.',
          palavras: 'contador contabilidade acesso liberar escritorio' },
        { id: 'gerente', p: 'Posso dar acesso a um gerente?', ir: 'fechamento/contabilidade', botao: 'Acesso da contabilidade',
          r: 'Pode. Em Fechamento › Acesso da contabilidade, informe o e-mail e escolha Gerente: edita a escala e lança ausências. Só o dono gerencia os acessos.',
          palavras: 'gerente gestor acesso convidar funcionario editar' },
        { id: 'conta-contador', p: 'Sou contador. Como vejo as empresas dos meus clientes?', ir: 'contador', botao: 'Suas empresas',
          r: 'Crie sua conta grátis de contador na entrada do app (Sou contador). Cada cliente libera o seu e-mail em Acesso da contabilidade. No Espaço do contador você vê todas as empresas, as escalas, ausências e o fechamento de cada competência, com a planilha para Excel e Google Planilhas.',
          palavras: 'sou contador espaco do contador clientes escritorio cadastro gratis' },
      ],
    },
    {
      id: 'unidades', nome: 'Unidades e empresas', resumo: 'Várias lojas, filiais e CNPJs',
      perguntas: [
        { id: 'nova-unidade', p: 'Tenho duas lojas. Preciso pagar de novo?', ir: 'unidades', botao: 'Unidades e empresas',
          r: 'Não. Uma conta tem várias unidades (loja, filial ou setor), cada uma com os próprios colaboradores e a própria escala. Em Mais › Unidades e empresas, toque em Nova unidade.',
          palavras: 'duas lojas filial unidade setor nova loja pagar de novo' },
        { id: 'trocar-unidade', p: 'Como troco de unidade?', ir: 'unidades', botao: 'Unidades e empresas',
          r: 'Em Mais › Unidades e empresas, toque na unidade que quer abrir. A escala, os colaboradores e o fechamento passam a mostrar essa unidade.',
          palavras: 'trocar unidade mudar loja alternar' },
        { id: 'outra-empresa', p: 'Posso cadastrar outra empresa (outro CNPJ)?', ir: 'unidades', botao: 'Unidades e empresas',
          r: 'Pode, com o mesmo acesso. Em Mais › Unidades e empresas, toque em Cadastrar outra empresa. Depois você alterna entre as empresas na mesma tela.',
          palavras: 'outra empresa outro cnpj segunda empresa cliente' },
      ],
    },
    {
      id: 'conta', nome: 'Conta e pagamento', resumo: 'Acesso, senha, reembolso e comprovante',
      perguntas: [
        { id: 'acesso', p: 'Comprei e não recebi o acesso. O que faço?', ir: 'conta', botao: 'Minha conta',
          r: 'Depois da compra aprovada, o link para criar a senha chega no e-mail usado na compra. Olhe também o spam e as promoções. Se não chegou, na entrada do app toque em Esqueci minha senha e informe o e-mail da compra. Se ainda assim não chegar, fale com o suporte.',
          palavras: 'nao recebi acesso email compra link criar senha comprei' },
        { id: 'senha', p: 'Como troco ou recupero a senha?', ir: 'conta', botao: 'Minha conta',
          r: 'Para trocar: Mais › Minha conta › Trocar senha. Esqueceu: na entrada do app, toque em Esqueci minha senha; o link chega por e-mail em instantes (olhe o spam). Depois de várias tentativas erradas, o login fica bloqueado por 15 minutos.',
          palavras: 'senha esqueci trocar recuperar redefinir bloqueado login' },
        { id: 'liberar', p: 'Aparece "Falta liberar o acesso". Por quê?', ir: 'escala', botao: 'Abrir a escala',
          r: 'A escala só é gerada com o acesso pago liberado. Se você já pagou, o acesso é liberado assim que a plataforma de pagamento confirma o pagamento. Se pagou e continua aparecendo, fale com o suporte.',
          palavras: 'falta liberar acesso pago pagamento pendente bloqueado' },
        { id: 'preco', p: 'Tem mensalidade?', ir: 'conta', botao: 'Minha conta',
          r: 'Não. Custa R$ 97, sem mensalidade, com escalas quantas vezes quiser, várias empresas e unidades na mesma conta, acesso grátis para o contador e os gerentes e atualizações quando a lei mudar.',
          palavras: 'mensalidade preco quanto custa valor assinatura' },
        { id: 'reembolso', p: 'Como peço reembolso?', ir: 'conta', botao: 'Minha conta',
          r: 'Você tem 7 dias corridos a partir da compra para pedir o reembolso integral, sem precisar explicar o motivo. Peça pela plataforma de pagamento (pelo e-mail da compra) ou fale com o suporte. O dinheiro volta pelo mesmo meio do pagamento e o acesso é encerrado.',
          palavras: 'reembolso devolucao estorno cancelar garantia 7 dias arrependimento' },
        { id: 'nota', p: 'Preciso de nota fiscal ou comprovante da compra.', ir: 'conta', botao: 'Minha conta',
          r: 'O comprovante da compra é enviado pela plataforma de pagamento para o e-mail usado na compra. Para nota fiscal, fale com o suporte informando o e-mail da compra e os dados da empresa.',
          palavras: 'nota fiscal comprovante recibo nf' },
        { id: 'materiais', p: 'Onde baixo o Kit RH, a Calculadora ou as Plaquinhas?', ir: 'materiais', botao: 'Seus materiais',
          r: 'Em Mais › Seus materiais. Os materiais comprados aparecem para baixar; os outros mostram como comprar.',
          palavras: 'kit rh calculadora plaquinhas materiais extras baixar' },
        { id: 'encerrar', p: 'Quero encerrar a conta e apagar os dados.', ir: 'conta', botao: 'Minha conta',
          r: 'O encerramento da conta e a exclusão dos dados são feitos pelo suporte. Fale com a gente pelo WhatsApp do suporte.',
          palavras: 'encerrar conta apagar dados excluir lgpd' },
      ],
    },
    {
      id: 'lei', nome: 'A nova lei', resumo: 'EC 141/2026: o que mudou e quando',
      perguntas: [
        { id: 'o-que-mudou', p: 'O que mudou com a EC 141/2026?', ir: 'aula/0', botao: 'Ver a aula',
          r: 'A Emenda Constitucional 141/2026, promulgada em 16/10/2026, acaba com a escala 6x1 como regra geral: 2 folgas por semana para cada pessoa (uma de preferência no domingo), até 8 horas por dia e sem redução de salário. A regra vale a partir de 15/12/2026.',
          palavras: 'ec 141 emenda pec 6x1 fim mudou lei nova' },
        { id: 'limite-horas', p: 'Qual o limite de horas por semana?', ir: 'aula/2', botao: 'Ver a aula',
          r: '44h até 14/12/2026, 42h de 15/12/2026 a 14/12/2027 e 40h a partir de 15/12/2027. O que passar do limite é hora extra, com adicional mínimo de 50%, ou vai para o banco de horas, conforme a CLT. O caminho mais simples é 5 dias de 8h (40h), que já fica dentro do limite final.',
          palavras: 'limite horas semana 44 42 40 hora extra banco de horas' },
        { id: 'salario', p: 'Posso pagar menos porque a jornada diminuiu?', ir: 'aula/0', botao: 'Ver a aula',
          r: 'Não. A emenda proíbe reduzir o salário por causa da redução da jornada.',
          palavras: 'salario reduzir pagar menos' },
        { id: 'feriado-lei', p: 'Quem trabalha no feriado tem direito a quê?', ir: 'aula/4', botao: 'Ver a aula',
          r: 'Recebe o dia em dobro ou ganha outra folga (Lei 605/49, art. 9º). No comércio, abrir no feriado depende da convenção coletiva e da lei municipal (Lei 10.101, art. 6º-A).',
          palavras: 'feriado trabalhado dobro folga lei 605' },
        { id: 'descanso', p: 'Qual o descanso mínimo entre um dia e outro?', ir: 'aula/5', botao: 'Ver a aula',
          r: 'Pelo menos 11 horas entre o fim de um dia de trabalho e o começo do outro (CLT, art. 66). Em jornada de mais de 6h, o almoço tem de 1 a 2 horas (art. 71) e não conta nas 8h.',
          palavras: 'descanso 11 horas intervalo almoco interjornada' },
        { id: 'mei', p: 'A regra vale para MEI e microempresa?', ir: 'aula/6', botao: 'Ver a aula',
          r: 'Vale para todos os portes. A emenda prevê uma lei complementar com incentivos fiscais e de crédito para MEI, micro e pequenas empresas, mas essa lei ainda não existe. O MEI pode ter só 1 empregado registrado: ele folga 2 dias por semana e, nesses dias, quem cobre é o dono.',
          palavras: 'mei microempresa pequena empresa porte me epp' },
        { id: 'convencao', p: 'Minha convenção coletiva fala em 44 horas. Vale o quê?', ir: 'aula', botao: 'Aulas e ajuda',
          r: 'A Constituição está acima da convenção: cláusulas incompatíveis com a emenda perdem efeito. A compensação de horários continua possível por acordo ou convenção. Para saber como fica a sua categoria, fale com o seu contador ou com o sindicato.',
          palavras: 'convencao coletiva sindicato acordo 44 horas categoria' },
      ],
    },
  ];

  const tira = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  // busca simples: cada palavra digitada conta pontos onde aparece (pergunta vale mais)
  function buscar(texto, max = 8) {
    const termos = tira(texto).split(/[^a-z0-9]+/).filter(t => t.length > 1 && !PARADAS.has(t));
    if (!termos.length) return [];
    const res = [];
    for (const c of CATEGORIAS) for (const q of c.perguntas) {
      const p = tira(q.p), extra = tira(q.palavras), r = tira(q.r);
      let pts = 0;
      for (const t of termos) {
        if (p.includes(t)) pts += 3;
        if (extra.includes(t)) pts += 2;
        if (r.includes(t)) pts += 1;
      }
      if (pts) res.push({ pts, categoria: c.id, ...q });
    }
    return res.sort((a, b) => b.pts - a.pts).slice(0, max);
  }
  const PARADAS = new Set(['de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'um', 'uma', 'como', 'que', 'para', 'por', 'eu', 'meu', 'minha', 'se', 'os', 'as', 'ao', 'e', 'o', 'a', 'com', 'tem', 'ter', 'qual', 'onde', 'posso', 'faco']);

  // texto da base para o prompt do assistente
  function textoParaPrompt() {
    return CATEGORIAS.map(c => `## ${c.nome}\n` + c.perguntas.map(q => `P: ${q.p}\nR: ${q.r}\nTela: #${q.ir} (${q.botao})`).join('\n\n')).join('\n\n');
  }
  const total = () => CATEGORIAS.reduce((n, c) => n + c.perguntas.length, 0);

  const api = { CATEGORIAS, buscar, textoParaPrompt, total };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.SuporteFAQ = api;
})(typeof window !== 'undefined' ? window : globalThis);
