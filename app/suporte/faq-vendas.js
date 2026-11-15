// Dúvidas de quem ainda não comprou (site, ajuda, obrigado e blog): a mesma estrutura de faq.js.
// Tudo tirado da página de vendas (public/index.html), dos termos e da ajuda. Preço: sempre "R$ 97".
// "ir" é um endereço do site (o widget mantém utm e ind ao abrir). O texto vai também para o prompt de vendas no n8n.
(function (raiz) {
  const CATEGORIAS = [
    {
      id: 'produto', nome: 'O que é', resumo: 'Como funciona e para quem é',
      perguntas: [
        { id: 'o-que-e', p: 'O que é a Sua Escala 5x2?', ir: '/#como', botao: 'Ver como funciona',
          r: 'Um app que monta a escala 5x2 da sua empresa dentro da nova lei (EC 141/2026). Você responde umas perguntas sobre o seu negócio e quem trabalha com você, e a escala sai pronta: duas folgas para cada um, nenhum dia abaixo do mínimo de pessoas e rodízio de domingo.',
          palavras: 'o que e app sistema produto escala 5x2' },
        { id: 'como-funciona', p: 'Como funciona?', ir: '/#como', botao: 'Ver como funciona',
          r: 'É como um quiz, uma pergunta por tela: tipo de negócio, dias que abre, quantas pessoas precisa por dia e quem trabalha. Leva uns 2 minutos. A escala sai para 4 semanas e você baixa ou manda para a equipe.',
          palavras: 'como funciona passo a passo quiz perguntas minutos' },
        { id: 'celular', p: 'Precisa instalar alguma coisa?', ir: '/#app', botao: 'Ver o app por dentro',
          r: 'Não. Funciona no navegador do celular e do computador. Se quiser, dá para colocar o app na tela inicial do celular, sem baixar em loja.',
          palavras: 'instalar baixar celular computador aplicativo navegador' },
        { id: 'negocios', p: 'Serve para o meu tipo de negócio?', ir: '/ajuda#segmentos', botao: 'Ver os tipos de negócio',
          r: '12 tipos de negócio já vêm configurados com os dias, o horário, o mínimo de pessoas e as regras de cada um: mercado, farmácia, loja, restaurante, padaria, posto, salão, clínica, academia, escritório, portaria e outros. Na farmácia, por exemplo, o sistema garante farmacêutico todos os dias.',
          palavras: 'negocio loja mercado farmacia restaurante salao clinica academia posto padaria escritorio portaria serve' },
        { id: 'sem-lei', p: 'Não entendo de lei nem de computador. Consigo usar?', ir: '/#como', botao: 'Ver como funciona',
          r: 'Consegue. É uma pergunta por tela, no celular. A escala já sai dentro da lei, e quem quiser entender tem uma aula curta e sem juridiquês dentro do app.',
          palavras: 'nao entendo dificil facil lei computador' },
        { id: 'ponto', p: 'Faz ponto ou folha de pagamento?', ir: '/#duvidas', botao: 'Ver as dúvidas',
          r: 'Não. Organiza quem trabalha e quem folga em cada dia. Ponto, banco de horas e folha seguem com o seu contador.',
          palavras: 'ponto folha de pagamento holerite salario calculo' },
      ],
    },
    {
      id: 'preco', nome: 'Preço e pagamento', resumo: 'R$ 97, formas de pagamento e garantia',
      perguntas: [
        { id: 'quanto-custa', p: 'Quanto custa?', ir: '/#preco', botao: 'Ver o preço',
          r: 'R$ 97. Você monta a escala de quantas equipes precisar, em quantas lojas e empresas tiver, sem mensalidade.',
          palavras: 'quanto custa preco valor mensalidade 97' },
        { id: 'pagamento', p: 'Quais as formas de pagamento?', ir: '/#preco', botao: 'Ver o preço',
          r: 'Cartão de crédito, em até 12x, e Pix. A compra é feita no checkout seguro da plataforma de pagamento.',
          palavras: 'pagamento pix cartao credito parcelar parcelado 12x boleto' },
        { id: 'garantia', p: 'E se não servir para mim?', ir: '/termos#reembolso', botao: 'Ver a garantia',
          r: 'Você tem 7 dias de garantia a partir da compra. Pediu, recebe o dinheiro de volta, sem precisar explicar o motivo.',
          palavras: 'garantia reembolso devolucao 7 dias nao gostar arrependimento' },
        { id: 'acesso', p: 'Como recebo o acesso?', ir: '/#preco', botao: 'Ver o preço',
          r: 'O acesso chega no seu e-mail logo depois do pagamento aprovado, com o link para criar a sua senha. Olhe também o spam.',
          palavras: 'acesso receber email chega quando senha comprei' },
      ],
    },
    {
      id: 'uso', nome: 'Equipe e formatos', resumo: 'WhatsApp, PDF, Excel, contador e várias lojas',
      perguntas: [
        { id: 'formatos', p: 'Em quais formatos sai a escala?', ir: '/#formatos', botao: 'Ver os formatos',
          r: 'WhatsApp (a tabela vai como imagem), PDF, Word, Excel, PowerPoint, Google Planilhas, imagem, CSV, texto, imprimir e um link onde cada funcionário vê a própria folga.',
          palavras: 'formatos whatsapp pdf excel word powerpoint planilha link imagem csv imprimir' },
        { id: 'equipe', p: 'Como a equipe vê a escala?', ir: '/#formatos', botao: 'Ver os formatos',
          r: 'Você manda no grupo do WhatsApp ou envia o link da equipe: cada funcionário toca no nome e vê a própria folga, sem instalar nada e sem senha.',
          palavras: 'equipe funcionario ver folga grupo link' },
        { id: 'contador', p: 'Meu contador pode acessar?', ir: '/ajuda#contador', botao: 'Ver o acesso do contador',
          r: 'Pode, de graça. O contador ganha acesso para ver a escala, baixar a planilha e acompanhar o fechamento do mês. O acesso dele é só de consulta.',
          palavras: 'contador contabilidade acesso gratis escritorio' },
        { id: 'unidades', p: 'Tenho mais de uma loja. Preciso pagar de novo?', ir: '/#preco', botao: 'Ver o preço',
          r: 'Não. Uma conta tem várias unidades e empresas: cada loja, filial ou setor com a própria equipe e a própria escala.',
          palavras: 'duas lojas filial unidades empresas cnpj varias' },
        { id: 'muda-equipe', p: 'E quando alguém entra, sai ou tira férias?', ir: '/#app', botao: 'Ver o app por dentro',
          r: 'A equipe fica salva e a escala se ajusta sozinha quando alguém entra, sai ou tira férias. Faltas e atestados também são lançados no app.',
          palavras: 'ferias falta atestado entra sai novo funcionario ajusta' },
      ],
    },
    {
      id: 'lei', nome: 'A nova lei', resumo: 'O que muda e quando',
      perguntas: [
        { id: 'quando', p: 'Quando a 5x2 começa a valer?', ir: '/#lei', botao: 'Ver as datas',
          r: 'Duas folgas por semana e limite de 42 horas a partir de 15/12/2026. O limite cai para 40 horas em 15/12/2027. A Emenda Constitucional 141/2026 foi promulgada em 16/10/2026.',
          palavras: 'quando comeca vale data 15 dezembro 42 horas 40 horas prazo' },
        { id: 'o-que-muda', p: 'O que muda na prática?', ir: '/ajuda#lei', botao: 'Ler a ajuda da lei',
          r: 'Cada pessoa passa a ter 2 folgas por semana, uma delas de preferência no domingo, até 8 horas por dia e sem redução de salário. A loja pode continuar abrindo todos os dias: muda o rodízio das folgas.',
          palavras: 'o que muda 6x1 fim duas folgas salario domingo' },
        { id: 'mei', p: 'Minha empresa é pequena. Vale para mim?', ir: '/ajuda#porte', botao: 'Ler sobre MEI e pequenas',
          r: 'Vale para toda empresa com funcionário CLT, do MEI à grande. A emenda promete incentivos para MEI e pequenas empresas por uma lei futura, mas não tira a obrigação das duas folgas.',
          palavras: 'mei microempresa pequena empresa porte me epp vale para mim' },
        { id: 'domingo', p: 'Posso abrir no domingo?', ir: '/ajuda#domingo', botao: 'Ler sobre domingo',
          r: 'Pode. A lei limita a jornada de cada pessoa, não o horário da loja. No comércio, cada pessoa folga no domingo pelo menos 1 vez a cada 3 semanas, e o app faz esse rodízio sozinho.',
          palavras: 'domingo abrir feriado rodizio' },
      ],
    },
    {
      id: 'contato', nome: 'Falar com a gente', resumo: 'Atendimento e compra já feita',
      perguntas: [
        { id: 'pessoa', p: 'Quero falar com uma pessoa.', ir: '/#preco', botao: 'Ver o preço',
          r: 'Escreva no assistente abaixo ou toque em "Falar com uma pessoa no WhatsApp". A mensagem já vai pronta com a sua dúvida.',
          palavras: 'falar pessoa atendente whatsapp contato suporte humano telefone' },
        { id: 'ja-comprei', p: 'Já comprei e não recebi o acesso.', ir: '/app', botao: 'Abrir o app',
          r: 'O link para criar a senha vai para o e-mail usado na compra (olhe o spam). Se não achar, abra o app, toque em Esqueci minha senha e informe esse e-mail. Se ainda assim não chegar, fale com a gente no WhatsApp.',
          palavras: 'ja comprei nao recebi acesso email senha comprei' },
      ],
    },
  ];

  const tira = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const PARADAS = new Set(['de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'um', 'uma', 'como', 'que', 'para', 'por', 'eu', 'meu', 'minha', 'se', 'os', 'as', 'ao', 'e', 'o', 'a', 'com', 'tem', 'ter', 'qual', 'quais', 'onde', 'posso', 'faco']);
  function buscar(texto, max = 8) {
    const termos = tira(texto).split(/[^a-z0-9]+/).filter(t => t.length > 1 && !PARADAS.has(t));
    if (!termos.length) return [];
    const res = [];
    for (const c of CATEGORIAS) for (const q of c.perguntas) {
      const p = tira(q.p), extra = tira(q.palavras), r = tira(q.r);
      let pts = 0;
      for (const t of termos) { if (p.includes(t)) pts += 3; if (extra.includes(t)) pts += 2; if (r.includes(t)) pts += 1; }
      if (pts) res.push({ pts, categoria: c.id, ...q });
    }
    return res.sort((a, b) => b.pts - a.pts).slice(0, max);
  }
  const textoParaPrompt = () => CATEGORIAS.map(c => `## ${c.nome}\n` + c.perguntas.map(q => `P: ${q.p}\nR: ${q.r}`).join('\n\n')).join('\n\n');
  const total = () => CATEGORIAS.reduce((n, c) => n + c.perguntas.length, 0);

  const api = { CATEGORIAS, buscar, textoParaPrompt, total };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.SuporteFAQVendas = api;
})(typeof window !== 'undefined' ? window : globalThis);
