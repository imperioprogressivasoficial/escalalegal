// Sua Escala 5x2 — dados da empresa pelo CNPJ (Receita Federal, via BrasilAPI; se falhar, CNPJ.ws).
// Devolve só o que o cadastro usa. O segmento sai do CNAE principal; o porte, de MEI/ME/EPP.
const config = { fetch: (...a) => globalThis.fetch(...a), timeout: 6000 };

// CNAE principal (7 dígitos) -> segmento da escala (SETORES em scheduler.js)
function segmentoDoCnae(cnae) {
  const c = String(cnae || '').replace(/\D/g, ''), p4 = c.slice(0, 4);
  if (['4711', '4712'].includes(p4)) return 'mercado';
  if (p4 === '4771') return 'farmacia';
  if (p4 === '5611') return 'restaurante';
  if (['1091', '4721'].includes(p4)) return 'padaria';
  if (p4 === '9602') return 'salao';
  if (p4 === '8630') return 'clinica';
  if (p4 === '9313') return 'academia';
  if (p4 === '4731') return 'posto';
  if (p4 === '8011') return 'seguranca';
  if (c.startsWith('47')) return 'varejo';
  return 'outro';
}
function porteDe(texto, mei) {
  if (mei) return 'mei';
  const t = String(texto || '').toLowerCase();
  if (t.includes('micro')) return 'me';
  if (t.includes('pequeno')) return 'epp';
  if (t.includes('demais') || t.includes('média') || t.includes('grande')) return 'media';
  return null;
}
const so = v => String(v ?? '').trim();
const juntaEndereco = (tipo, rua, num, bairro, compl) => {
  const r = [so(tipo), so(rua)].filter(Boolean).join(' ');
  return [r && (so(num) ? `${r}, ${so(num)}` : r), so(compl), so(bairro)].filter(Boolean).join(' - ') || null;
};
const titulo = t => so(t).toLowerCase().replace(/(^|\s)\S/g, x => x.toUpperCase());

function deBrasilApi(d) {
  const tel = so(d.ddd_telefone_1).replace(/\D/g, '');
  return {
    razao_social: so(d.razao_social) || null, nome_fantasia: so(d.nome_fantasia) || null,
    cep: so(d.cep).replace(/\D/g, '') || null, uf: so(d.uf).toUpperCase() || null, cidade: d.municipio ? titulo(d.municipio) : null,
    endereco: juntaEndereco(d.descricao_tipo_de_logradouro, d.logradouro, d.numero, d.bairro, d.complemento),
    porte: porteDe(d.porte, d.opcao_pelo_mei === true), cnae: so(d.cnae_fiscal) || null, segmento: segmentoDoCnae(d.cnae_fiscal),
    telefone: tel.length >= 10 ? tel : null, situacao: so(d.descricao_situacao_cadastral).toUpperCase() || null,
  };
}
function deCnpjWs(d) {
  const e = d.estabelecimento || {}, tel = `${so(e.ddd1)}${so(e.telefone1)}`.replace(/\D/g, '');
  return {
    razao_social: so(d.razao_social) || null, nome_fantasia: so(e.nome_fantasia) || null,
    cep: so(e.cep).replace(/\D/g, '') || null, uf: so(e.estado?.sigla).toUpperCase() || null, cidade: e.cidade?.nome ? titulo(e.cidade.nome) : null,
    endereco: juntaEndereco(e.tipo_logradouro, e.logradouro, e.numero, e.bairro, e.complemento),
    porte: porteDe(d.porte?.descricao, /^s/i.test(so(d.simples?.mei))), cnae: so(e.atividade_principal?.id) || null, segmento: segmentoDoCnae(e.atividade_principal?.id),
    telefone: tel.length >= 10 ? tel : null, situacao: so(e.situacao_cadastral).toUpperCase() || null,
  };
}

// null = não achou em nenhuma das duas
async function buscaCnpj(cnpj) {
  const fontes = [
    [`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, deBrasilApi],
    [`https://publica.cnpj.ws/cnpj/${cnpj}`, deCnpjWs],
  ];
  for (const [url, mapa] of fontes) {
    try {
      const r = await config.fetch(url, { signal: AbortSignal.timeout(config.timeout), headers: { accept: 'application/json' } });
      if (!r.ok) continue;
      const d = mapa(await r.json());
      if (d.razao_social) return d;
    } catch { /* fora do ar ou demorou: tenta a próxima */ }
  }
  return null;
}

module.exports = { buscaCnpj, segmentoDoCnae, porteDe, config };
