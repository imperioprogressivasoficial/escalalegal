// Sua Escala 5x2 — cadastro da empresa: CNPJ (numérico e alfanumérico), máscaras, UF pelo CEP e as opções do formulário.
// Roda no navegador (window.Cadastro) e no Node (require), para a regra ser a mesma nos dois lados.
(function (raiz, fabrica) {
  const m = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = m; else raiz.Cadastro = m;
})(typeof self !== 'undefined' ? self : this, function () {
  const soCnpj = v => String(v ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 14);
  const soNum = v => String(v ?? '').replace(/\D/g, '');

  // CNPJ: 12 posições (números ou, desde julho de 2026, letras) + 2 dígitos verificadores (IN RFB 2.229/2024).
  // Cada caractere vale o código ASCII menos 48 (0-9 = 0-9, A = 17, B = 18...). Pesos de 2 a 9, da direita para a esquerda.
  function cnpjValido(v) {
    const c = soCnpj(v);
    if (!/^[0-9A-Z]{12}\d{2}$/.test(c) || /^(\d)\1{13}$/.test(c)) return false;
    const dv = n => {
      let s = 0, p = 2;
      for (let i = n - 1; i >= 0; i--) { s += (c.charCodeAt(i) - 48) * p; p = p === 9 ? 2 : p + 1; }
      const r = s % 11; return r < 2 ? 0 : 11 - r;
    };
    return dv(12) === +c[12] && dv(13) === +c[13];
  }
  function mascaraCnpj(v) {
    const c = soCnpj(v);
    return [c.slice(0, 2), c.slice(2, 5), c.slice(5, 8), c.slice(8, 12), c.slice(12, 14)]
      .reduce((t, p, i) => !p ? t : t + (i === 0 ? '' : i < 3 ? '.' : i === 3 ? '/' : '-') + p, '');
  }
  function mascaraTel(v) {
    const d = soNum(v).replace(/^55(?=\d{10,11}$)/, '').slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : '';
    const meio = d.length === 11 ? 7 : 6;
    return `(${d.slice(0, 2)}) ${d.slice(2, meio)}${d.length > meio ? '-' + d.slice(meio) : ''}`;
  }
  const mascaraCep = v => { const d = soNum(v).slice(0, 8); return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d; };

  // faixas de CEP dos Correios (5 primeiros números) -> estado. Funciona sem internet.
  const FAIXAS = [[1000, 19999, 'SP'], [20000, 28999, 'RJ'], [29000, 29999, 'ES'], [30000, 39999, 'MG'], [40000, 48999, 'BA'], [49000, 49999, 'SE'],
    [50000, 56999, 'PE'], [57000, 57999, 'AL'], [58000, 58999, 'PB'], [59000, 59999, 'RN'], [60000, 63999, 'CE'], [64000, 64999, 'PI'],
    [65000, 65999, 'MA'], [66000, 68899, 'PA'], [68900, 68999, 'AP'], [69000, 69299, 'AM'], [69300, 69399, 'RR'], [69400, 69899, 'AM'],
    [69900, 69999, 'AC'], [70000, 72799, 'DF'], [72800, 72999, 'GO'], [73000, 73699, 'DF'], [73700, 76799, 'GO'], [76800, 76999, 'RO'],
    [77000, 77999, 'TO'], [78000, 78899, 'MT'], [79000, 79999, 'MS'], [80000, 87999, 'PR'], [88000, 89999, 'SC'], [90000, 99999, 'RS']];
  function ufDoCep(v) {
    const d = soNum(v); if (d.length !== 8) return null;
    const n = +d.slice(0, 5), f = FAIXAS.find(([a, b]) => n >= a && n <= b);
    return f ? f[2] : null;
  }

  const PORTES = {
    mei: ['MEI', 'Microempreendedor individual. Pode ter 1 funcionário registrado.'],
    me: ['Microempresa (ME)', 'Faturamento de até R$ 360 mil por ano.'],
    epp: ['Empresa de Pequeno Porte (EPP)', 'Faturamento de até R$ 4,8 milhões por ano.'],
    media: ['Média ou grande', 'Faturamento acima de R$ 4,8 milhões por ano.'],
    nao_sei: ['Não sei', 'Confirmo depois com o contador.'],
  };
  const CARGOS = ['Dono(a) ou sócio(a)', 'Gerente', 'RH / departamento pessoal', 'Administrativo / financeiro', 'Outro'];
  const ORIGENS = {
    instagram: ['Instagram', 'Vi um post, reels ou anúncio'], facebook: ['Facebook', 'Vi um post ou anúncio'],
    indicacao: ['Indicação', 'Alguém me mandou o link'], google: ['Google', 'Pesquisei e encontrei'],
    contador: ['Meu contador', 'Ele me recomendou'], outro: ['Outro', 'YouTube, WhatsApp, evento...'],
  };

  // confere o cadastro completo. Devolve { erro, campo } ou { dados } normalizados.
  function confere(b) {
    b = b || {};
    const t = (v, max = 120) => String(v ?? '').trim().slice(0, max);
    const d = {
      nome: t(b.nome, 80), razao_social: t(b.razao_social), porte: PORTES[b.porte] ? b.porte : null,
      sem_cnpj: !!b.sem_cnpj && b.porte === 'mei', cnpj: soCnpj(b.cnpj) || null,
      responsavel: t(b.responsavel, 80), responsavel_cargo: t(b.responsavel_cargo, 60), telefone: soNum(b.telefone).replace(/^55(?=\d{10,11}$)/, '').slice(0, 11),
      cep: soNum(b.cep).slice(0, 8), endereco: t(b.endereco, 160) || null, uf: t(b.uf, 2).toUpperCase(), cidade: t(b.cidade, 80),
      segmento: t(b.segmento, 20), funcionarios_qtd: Math.round(+b.funcionarios_qtd), unidades_qtd: Math.round(+b.unidades_qtd),
      como_conheceu: ORIGENS[b.como_conheceu] ? b.como_conheceu : null, como_conheceu_outro: t(b.como_conheceu_outro, 80) || null,
    };
    if (d.sem_cnpj) d.cnpj = null;
    const falha = (campo, erro) => ({ campo, erro });
    if (!d.nome) return falha('nome', 'Escreva o nome fantasia (como os clientes conhecem a empresa).');
    if (!d.razao_social) return falha('razao_social', d.porte === 'mei' ? 'Escreva a razão social. No MEI, costuma ser o seu nome com o CPF.' : 'Escreva a razão social, como está no CNPJ.');
    if (!d.porte) return falha('porte', 'Escolha o porte da empresa.');
    if (!d.sem_cnpj && !d.cnpj) return falha('cnpj', 'Informe o CNPJ.');
    if (d.cnpj && !cnpjValido(d.cnpj)) return falha('cnpj', 'Esse CNPJ não confere. Veja se algum número ficou trocado.');
    if (!d.responsavel) return falha('responsavel', 'Escreva o nome do responsável.');
    if (!d.responsavel_cargo) return falha('responsavel_cargo', 'Escolha o cargo do responsável.');
    if (d.telefone.length < 10) return falha('telefone', 'Informe o telefone ou WhatsApp com DDD.');
    if (d.cep.length !== 8) return falha('cep', 'Informe o CEP com 8 números.');
    if (!d.uf || !/^[A-Z]{2}$/.test(d.uf)) return falha('uf', 'Escolha o estado.');
    if (!d.cidade) return falha('cidade', 'Escreva a cidade.');
    if (!d.segmento) return falha('segmento', 'Escolha o tipo de negócio.');
    if (!(d.funcionarios_qtd >= 1 && d.funcionarios_qtd <= 100000)) return falha('funcionarios_qtd', 'Quantos funcionários a empresa tem? Pelo menos 1.');
    if (!(d.unidades_qtd >= 1 && d.unidades_qtd <= 1000)) return falha('unidades_qtd', 'Quantas lojas ou unidades? Pelo menos 1.');
    if (!d.como_conheceu) return falha('como_conheceu', 'Conte como conheceu a Sua Escala 5x2.');
    return { dados: d };
  }

  return { cnpjValido, mascaraCnpj, mascaraTel, mascaraCep, ufDoCep, soCnpj, soNum, confere, PORTES, CARGOS, ORIGENS };
});
