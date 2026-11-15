const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { promisify } = require('util');
const { gerarEscala, SETORES } = require('./public/scheduler.js');
const { interpretaPagamento } = require('./pagamento.js');
const { criaFila, modelo } = require('./email.js');
const Cadastro = require('./public/cadastro.js');

const {
  DATABASE_URL, SESSION_SECRET, ADMIN_USER = 'admin', ADMIN_PASS, WEBHOOK_TOKEN, N8N_WEBHOOK_URL, META_PIXEL_ID,
  CHECKOUT_URL = '', LIBERAR_TUDO, PORT = 3000, DOMAIN, SUPORTE_WHATSAPP = '', TRUST_PROXY = '1', NODE_ENV,
  PRECO = '97', COMISSAO_PERCENT = '0',
} = process.env;
// indicação: o link de indicação só registra quem indicou. Comissão desligada (COMISSAO_PERCENT=0); se um dia ligar, paga COMISSAO_PERCENT % do PRECO por compra aprovada
const VALOR_COMISSAO = Math.round((+String(PRECO).replace(',', '.') || 97) * (+COMISSAO_PERCENT || 0)) / 100;
const PRODUCAO = NODE_ENV === 'production';
const APP_URL = (process.env.APP_URL || (DOMAIN ? `https://${DOMAIN}` : `http://localhost:${PORT}`)).replace(/\/$/, '');
// blog e gerador grátis no subdomínio (mesmo app, separado pelo Host): BLOG_DOMAIN ou blog.DOMAIN
const BLOG_HOST = String(process.env.BLOG_DOMAIN || (DOMAIN ? `blog.${String(DOMAIN).replace(/^www\./, '')}` : '')).toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
const BLOG_URL = BLOG_HOST ? (process.env.BLOG_URL || (DOMAIN ? `https://${BLOG_HOST}` : `http://${BLOG_HOST}:${PORT}`)).replace(/\/$/, '') : '';
const SEGREDO = SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!SESSION_SECRET) console.warn('AVISO: SESSION_SECRET vazio. Todo reinício vai deslogar os clientes.');
if (PRODUCAO && LIBERAR_TUDO === '1') console.warn('AVISO: LIBERAR_TUDO=1 em produção. Qualquer pessoa gera escala sem pagar.');

require('pg').types.setTypeParser(1082, v => v); // datas como texto AAAA-MM-DD
const pool = new Pool({
  connectionString: DATABASE_URL, max: 15, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 8_000,
  options: '-c statement_timeout=15000',
});
pool.on('error', e => console.error('postgres:', e.message));
const q = (sql, p) => pool.query(sql, p);
const fila = criaFila(q);

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', /^\d+$/.test(TRUST_PROXY) ? +TRUST_PROXY : TRUST_PROXY);
// cabeçalhos de segurança (CSP, anti-iframe, HSTS), copiadores de página, imagens em outro domínio e origem da API
const seg = require('./seguranca.js')({ DOMAIN, APP_URL, PRODUCAO, BLOG_HOST });
app.use(seg.cabecalhos);
app.use(seg.bloqueiaCopiadores);
app.use(seg.protegeArquivos);
app.use(seg.confereOrigem);
// blog + gerador grátis (só responde no Host do blog; o resto segue para o app)
const blog = require('./blog')({ APP_URL, BLOG_URL, BLOG_HOST, PRODUCAO, seg });
app.use(blog.rotas);
// endereço antigo (ou www): páginas vão para o domínio principal. API e webhook seguem funcionando onde chegarem.
// O host do blog nunca é redirecionado.
app.use((req, res, next) => {
  const host = String(req.hostname || '').toLowerCase();
  if (DOMAIN && host && host !== DOMAIN && host !== BLOG_HOST && host.includes('.') && !/^[\d.]+$/.test(host) && req.method === 'GET' && !req.path.startsWith('/api/'))
    return res.redirect(301, `https://${DOMAIN}${req.originalUrl}`);
  next();
});
app.use(express.json({ limit: '300kb' }));
// ---------- limite por IP ----------
const hits = new Map();
const limite = (max = 20, janela = 60_000) => (req, res, next) => {
  const k = req.ip + ' ' + req.baseUrl + req.route?.path, now = Date.now();
  const h = (hits.get(k) || []).filter(t => now - t < janela);
  if (h.length >= max) return res.status(429).json({ erro: 'Muitas tentativas. Aguarde um pouco e tente de novo.' });
  h.push(now); hits.set(k, h); next();
};
// site público (metas, robots, sitemap, llms, rastreio, 404) antes dos arquivos estáticos
const site = require('./site.js')({ app, APP_URL, BLOG_URL, PRODUCAO, seg, q, limite });
app.use('/img', express.static(path.join(__dirname, 'public', 'img'), { maxAge: '7d' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], maxAge: PRODUCAO ? '10m' : 0 }));

const limpa = (v, max = 120) => String(v ?? '').trim().slice(0, max);
const emailValido = e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
const enviar = (url, corpo) => url && fetch(url, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo), signal: AbortSignal.timeout(8000),
}).catch(e => console.error('webhook n8n:', e.message));
const erro = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(e => {
  console.error(req.method, req.path, e);
  if (!res.headersSent) res.status(500).json({ erro: 'Erro inesperado. Tente de novo.' });
});

// ---------- tentativas erradas (senha do login, troca de senha e /admin) ----------
// Conta só as falhas: depois de N erros em 15 minutos, bloqueia aquela chave (e-mail ou IP) por 15 minutos.
const falhas = new Map();
const JANELA_FALHAS = 15 * 60_000;
const contaFalhas = k => (falhas.get(k) || []).filter(t => Date.now() - t < JANELA_FALHAS);
const travado = (k, max) => contaFalhas(k).length >= max;
const falhou = k => { const h = contaFalhas(k); h.push(Date.now()); falhas.set(k, h.slice(-100)); };
const acertou = k => falhas.delete(k);
const MAX_POR_EMAIL = 8, MAX_POR_IP = 30, MAX_ADMIN = 10;
setInterval(() => {
  const now = Date.now();
  for (const [k, h] of hits) if (!h.length || now - h[h.length - 1] > 15 * 60_000) hits.delete(k);
  for (const [k, h] of falhas) if (!h.length || now - h[h.length - 1] > JANELA_FALHAS) falhas.delete(k);
}, 5 * 60_000).unref();

// ---------- senha e sessão ----------
const scrypt = promisify(crypto.scrypt);
async function hashSenha(senha) {
  const sal = crypto.randomBytes(16).toString('hex');
  return sal + ':' + (await scrypt(senha, sal, 64)).toString('hex');
}
const SAL_FALSO = crypto.randomBytes(16).toString('hex');
async function confereSenha(senha, salvo) {
  const [sal, h] = String(salvo || '').split(':');
  if (!sal || !h) { await scrypt(String(senha), SAL_FALSO, 64); return false; } // mesmo tempo com ou sem conta
  const teste = await scrypt(senha, sal, 64);
  return crypto.timingSafeEqual(teste, Buffer.from(h, 'hex'));
}
const assina = v => crypto.createHmac('sha256', SEGREDO).update(v).digest('base64url');
const iguais = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
const DIAS_SESSAO = 30;
function criaSessao(res, u) {
  const exp = Date.now() + DIAS_SESSAO * 864e5, v = `${u.id}.${u.sessao_v || 0}.${exp}`;
  res.setHeader('Set-Cookie', `sid=${v}.${assina(v)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DIAS_SESSAO * 86400}${PRODUCAO ? '; Secure' : ''}`);
}
function leSessao(req) {
  const m = /(?:^|;\s*)sid=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return null;
  const [id, ver, exp, sig] = m[1].split('.');
  if (!id || !sig || !(+exp > Date.now()) || !iguais(sig, assina(`${id}.${ver}.${exp}`))) return null;
  return { id: +id, v: +ver };
}
const logado = erro(async (req, res, next) => {
  const s = leSessao(req);
  if (!s) return res.status(401).json({ erro: 'Entre na sua conta.' });
  const { rows } = await q('select id, nome, empresa, email, whatsapp, acesso_liberado, sessao_v from usuarios where id=$1', [s.id]);
  if (!rows[0] || rows[0].sessao_v !== s.v) return res.status(401).json({ erro: 'Entre na sua conta.' });
  req.u = rows[0]; next();
});
// ---------- links de acesso (criar / redefinir senha) ----------
const hashToken = t => crypto.createHash('sha256').update(t).digest('hex');
async function criaLink(usuarioId, horas) {
  const token = crypto.randomBytes(32).toString('base64url');
  await q('insert into acesso_tokens (token_hash, usuario_id, expira_em) values ($1,$2, now() + make_interval(hours => $3))',
    [hashToken(token), usuarioId, horas]);
  return `${APP_URL}/app?acesso=${token}`;
}
async function tokenValido(token) {
  if (!/^[\w-]{20,80}$/.test(String(token || ''))) return null;
  const { rows } = await q(`select t.token_hash, u.id, u.nome, u.empresa, u.email, u.whatsapp, u.senha_hash is not null tem_senha,
    exists (select 1 from membros m where m.usuario_id=u.id) convidado
    from acesso_tokens t join usuarios u on u.id=t.usuario_id
    where t.token_hash=$1 and t.usado_em is null and t.expira_em > now()`, [hashToken(token)]);
  return rows[0] || null;
}
const primeiroNome = n => String(n || '').trim().split(/\s+/)[0] || '';
const rodapeSuporte = SUPORTE_WHATSAPP ? `Dúvidas? Fale com a gente no WhatsApp: https://wa.me/${SUPORTE_WHATSAPP.replace(/\D/g, '')}` : '';

async function enviaBoasVindas(u) {
  const link = await criaLink(u.id, 24 * 30);
  const oi = primeiroNome(u.nome) ? `Olá, ${primeiroNome(u.nome)}!` : 'Olá!';
  await fila.enfileirar(u.email, 'Sua Escala 5x2: seu acesso chegou', modelo({
    titulo: 'Pagamento confirmado. Seu acesso está liberado.',
    paragrafos: [oi, 'Clique no botão abaixo para criar sua senha e montar a escala 5x2 da sua equipe.', 'Depois, é só entrar com este e-mail e a senha que você criar.'],
    botao: 'Criar minha senha', link, rodape: rodapeSuporte,
  }));
  return link;
}
async function enviaLiberado(u) {
  await fila.enfileirar(u.email, 'Sua Escala 5x2: seu acesso foi liberado', modelo({
    titulo: 'Pagamento confirmado. O gerador de escala já está liberado.',
    paragrafos: [primeiroNome(u.nome) ? `Olá, ${primeiroNome(u.nome)}!` : 'Olá!', 'Entre com seu e-mail e senha para gerar a escala 5x2.'],
    botao: 'Entrar na Sua Escala 5x2', link: `${APP_URL}/app`, rodape: rodapeSuporte,
  }));
}
// no login e no cadastro: no máximo um link a cada 2 minutos por conta (evita encher a caixa de alguém)
async function enviaRedefinirSemRepetir(u) {
  const { rows } = await q("select 1 from acesso_tokens where usuario_id=$1 and criado_em > now() - interval '2 minutes' limit 1", [u.id]);
  if (!rows[0]) await enviaRedefinir(u);
}
async function enviaRedefinir(u) {
  const link = await criaLink(u.id, 24);
  await fila.enfileirar(u.email, u.senha_hash ? 'Redefinir sua senha da Sua Escala 5x2' : 'Crie sua senha da Sua Escala 5x2', modelo({
    titulo: u.senha_hash ? 'Vamos criar uma senha nova' : 'Crie sua senha',
    paragrafos: ['Recebemos um pedido para acessar sua conta. O link vale por 24 horas.', 'Se não foi você, ignore este e-mail. Nada muda na sua conta.'],
    botao: u.senha_hash ? 'Criar senha nova' : 'Criar minha senha', link, rodape: rodapeSuporte,
  }));
}

// Compra aprovada: libera conta existente ou cria a conta (sem senha) e manda o link por e-mail.
// código de indicação: vem do link (?ind=CODIGO) pelo checkout (src/sck/utm) ou pelo formulário da página de vendas
const codigoInd = v => { const m = /(?:^|[^a-z0-9])ind[_-]?([a-z0-9]{4,16})\b/i.exec(String(v || '')); return m ? m[1].toLowerCase() : null; };
function refDoPayload(obj, prof = 0) {
  if (!obj || typeof obj !== 'object' || prof > 5) return null;
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && /^(src|sck|utm_campaign|utm_content|utm_source|ref|ind)$/i.test(k)) { const c = codigoInd(v); if (c) return c; }
    if (v && typeof v === 'object') { const c = refDoPayload(v, prof + 1); if (c) return c; }
  }
  return null;
}
async function registraIndicacao(email, comprador, codigo) {
  if (!VALOR_COMISSAO) return;
  if (!codigo) { const { rows } = await q("select ref from leads where lower(email)=$1 and ref is not null order by id desc limit 1", [email]); codigo = rows[0]?.ref; }
  if (!codigo && comprador.indicado_por) { const { rows } = await q('select ref_codigo from usuarios where id=$1', [comprador.indicado_por]); codigo = rows[0]?.ref_codigo; }
  if (!codigo) return;
  const { rows: af } = await q('select id from usuarios where ref_codigo=$1', [codigo]);
  if (!af[0] || af[0].id === comprador.id) return;
  await q('update usuarios set indicado_por=coalesce(indicado_por,$1) where id=$2', [af[0].id, comprador.id]);
  await q(`insert into comissoes (afiliado_id, comprador_email, valor) values ($1,$2,$3)
    on conflict (comprador_email) do update set status='devida', criado_em=now() where comissoes.status='cancelada'`, [af[0].id, email, VALOR_COMISSAO]);
}
async function liberarCompra({ email, nome, whatsapp, transacao, origem, ref }) {
  await q(`insert into compras (email, origem, nome, transacao, whatsapp, status) values ($1,$2,$3,$4,$5,'aprovada')
    on conflict (email) do update set status='aprovada', atualizado_em=now(), whatsapp=coalesce(nullif(excluded.whatsapp,''), compras.whatsapp),
      transacao=coalesce(nullif(excluded.transacao,''), compras.transacao), nome=coalesce(nullif(excluded.nome,''), compras.nome)`,
  [email, origem, nome || null, transacao || null, whatsapp || null]);
  const { rows } = await q('select * from usuarios where email=$1', [email]);
  let u = rows[0], novo = false, link = null;
  if (!u) {
    const r = await q(`insert into usuarios (nome, email, whatsapp, acesso_liberado, liberado_em, origem) values ($1,$2,$3,true,now(),$4)
      on conflict (email) do nothing returning *`, [nome || email.split('@')[0], email, whatsapp || null, origem]);
    if (r.rows[0]) { u = r.rows[0]; novo = true; } else u = (await q('select * from usuarios where email=$1', [email])).rows[0];
  }
  const jaTinha = u.acesso_liberado && !novo;
  if (!u.acesso_liberado) await q('update usuarios set acesso_liberado=true, liberado_em=now() where id=$1', [u.id]);
  if (whatsapp && !u.whatsapp) await q('update usuarios set whatsapp=$1 where id=$2', [whatsapp, u.id]);
  if (origem !== 'manual') await registraIndicacao(email, u, ref).catch(e => console.error('indicação:', e.message));
  if (!jaTinha) {
    if (!u.senha_hash) link = await enviaBoasVindas(u);
    else await enviaLiberado(u);
    if (origem !== 'manual') site.compraMeta({ email, nome: u.nome || nome, whatsapp: u.whatsapp, transacao }).catch(e => console.error('Meta:', e.message));
    enviar(N8N_WEBHOOK_URL, { evento: 'compra_aprovada', nome: u.nome, email, whatsapp: u.whatsapp || null, conta_nova: novo, link_acesso: link || `${APP_URL}/app` });
  }
  return { usuario_id: u.id, conta_nova: novo, ja_estava_liberado: jaTinha, link };
}

// ---------- conta ----------
app.get('/api/config', (_req, res) => res.json({ checkout: CHECKOUT_URL, setores: SETORES, suporte: SUPORTE_WHATSAPP.replace(/\D/g, ''), comissao: VALOR_COMISSAO }));

app.post('/api/cadastro', limite(8), erro(async (req, res) => {
  const b = req.body || {};
  const nome = limpa(b.nome), empresa = limpa(b.empresa), email = limpa(b.email, 160).toLowerCase();
  const whatsapp = limpa(b.whatsapp, 20).replace(/\D/g, ''), senha = String(b.senha || '');
  const contador = b.tipo === 'contador';
  if (!nome || (!empresa && !contador)) return res.status(400).json({ erro: contador ? 'Informe seu nome.' : 'Informe seu nome e o nome da empresa.' });
  if (!emailValido(email)) return res.status(400).json({ erro: 'Informe um e-mail válido.' });
  if (senha.length < 6 || senha.length > 200) return res.status(400).json({ erro: 'A senha precisa ter pelo menos 6 caracteres.' });
  const { rows: existe } = await q('select id, nome, email, senha_hash from usuarios where email=$1', [email]);
  if (existe[0]) {
    if (!existe[0].senha_hash) { // comprou antes de criar a conta: a senha é criada pelo link do e-mail
      await enviaRedefinirSemRepetir(existe[0]);
      return res.status(409).json({ erro: 'Este e-mail já tem acesso comprado. Enviamos um link para você criar sua senha. Confira sua caixa de entrada e o spam.' });
    }
    return res.status(409).json({ erro: 'Este e-mail já tem conta. Use "Entrar".' });
  }
  const { rows: compra } = await q("select 1 from compras where email=$1 and status='aprovada'", [email]);
  // conta de empresa só nasce de uma compra aprovada (o webhook cria a conta e manda o link de criar a senha).
  // Contador continua se cadastrando sozinho: é grátis e só vê as empresas que liberarem o acesso para ele.
  if (!contador && !compra[0] && LIBERAR_TUDO !== '1')
    return res.status(403).json({ erro: 'A conta da empresa é criada depois da compra. Assim que o pagamento é aprovado, o acesso chega no seu e-mail. Já comprou? Use "Esqueci minha senha" com o e-mail da compra.', comprar: '/' });
  try {
    const { rows } = await q(`insert into usuarios (nome, empresa, email, whatsapp, senha_hash, acesso_liberado, liberado_em, origem, ultimo_acesso)
      values ($1,$2,$3,$4,$5,$6, case when $6 then now() end, $7, now()) returning id, sessao_v`,
    [nome, empresa || null, email, whatsapp, await hashSenha(senha), !!compra[0], contador ? 'contador' : 'cadastro']);
    const ind = codigoInd('ind_' + limpa(b.ref, 20));
    if (ind) await q('update usuarios set indicado_por=(select id from usuarios where ref_codigo=$1 and id<>$2) where id=$2', [ind, rows[0].id]).catch(() => {});
    criaSessao(res, rows[0]);
    enviar(N8N_WEBHOOK_URL, { evento: contador ? 'cadastro_contador' : 'cadastro', nome, empresa, email, whatsapp, pago: !!compra[0] });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ erro: 'Este e-mail já tem conta. Use "Entrar".' });
    throw e;
  }
}));

app.post('/api/login', limite(10), erro(async (req, res) => {
  const email = limpa(req.body?.email, 160).toLowerCase(), senha = String(req.body?.senha || '').slice(0, 200);
  const kEmail = 'login:' + email, kIp = 'login-ip:' + req.ip;
  if (travado(kEmail, MAX_POR_EMAIL) || travado(kIp, MAX_POR_IP))
    return res.status(429).json({ erro: 'Muitas tentativas com senha errada. Espere 15 minutos ou use "Esqueci minha senha".' });
  const { rows } = await q('select id, nome, email, senha_hash, sessao_v from usuarios where email=$1', [email]);
  const u = rows[0];
  if (u && !u.senha_hash) {
    await enviaRedefinirSemRepetir(u);
    return res.status(401).json({ erro: 'Você ainda não criou sua senha. Enviamos um link para o seu e-mail agora.' });
  }
  if (!(await confereSenha(senha, u?.senha_hash)) || !u) {
    falhou(kEmail); falhou(kIp);
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  }
  acertou(kEmail);
  q('update usuarios set ultimo_acesso=now() where id=$1', [u.id]).catch(() => {});
  criaSessao(res, u); res.json({ ok: true });
}));

app.post('/api/sair', (_req, res) => { res.setHeader('Set-Cookie', `sid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${PRODUCAO ? '; Secure' : ''}`); res.json({ ok: true }); });
app.get('/api/eu', logado, erro(async (req, res) => {
  const { sessao_v, ...u } = req.u;
  const { rows } = await q(`select m.conta_id id, coalesce(c.empresa, c.nome) empresa, m.papel from membros m
    join usuarios c on c.id=m.conta_id where m.usuario_id=$1 order by c.empresa`, [u.id]);
  const { rows: o } = await q('select origem from usuarios where id=$1', [u.id]);
  res.json({ ...u, acesso_liberado: u.acesso_liberado || LIBERAR_TUDO === '1', checkout: CHECKOUT_URL,
    contador: o[0]?.origem === 'contador' || rows.some(r => r.papel === 'contador'),
    contas: [{ id: u.id, empresa: u.empresa || u.nome, papel: 'dono' }, ...rows] });
}));

// minha conta: nome, WhatsApp, nome da empresa (da própria conta) e senha
app.put('/api/eu', logado, erro(async (req, res) => {
  const b = req.body || {};
  const nome = limpa(b.nome) || req.u.nome, whatsapp = limpa(b.whatsapp, 20).replace(/\D/g, '') || null;
  const empresa = b.empresa === undefined ? req.u.empresa : (limpa(b.empresa) || req.u.empresa);
  await q('update usuarios set nome=$1, whatsapp=$2, empresa=$3 where id=$4', [nome, whatsapp, empresa, req.u.id]);
  res.json({ ok: true });
}));
app.post('/api/eu/senha', logado, limite(10), erro(async (req, res) => {
  const atual = String(req.body?.atual || ''), nova = String(req.body?.nova || '');
  const k = 'troca:' + req.u.id;
  if (travado(k, MAX_POR_EMAIL)) return res.status(429).json({ erro: 'Muitas tentativas com senha errada. Espere 15 minutos.' });
  const { rows } = await q('select senha_hash from usuarios where id=$1', [req.u.id]);
  if (!(await confereSenha(atual, rows[0].senha_hash))) { falhou(k); return res.status(400).json({ erro: 'A senha atual não confere.' }); }
  acertou(k);
  if (nova.length < 6 || nova.length > 200) return res.status(400).json({ erro: 'A senha nova precisa ter pelo menos 6 caracteres.' });
  // troca a senha e derruba as outras sessões (outros celulares/computadores)
  const { rows: u } = await q('update usuarios set senha_hash=$1, sessao_v=sessao_v+1 where id=$2 returning id, sessao_v', [await hashSenha(nova), req.u.id]);
  criaSessao(res, u[0]);
  res.json({ ok: true });
}));

// esqueci a senha: sempre responde igual (não revela se o e-mail existe)
app.post('/api/senha/esqueci', limite(5), erro(async (req, res) => {
  const email = limpa(req.body?.email, 160).toLowerCase();
  if (!emailValido(email)) return res.status(400).json({ erro: 'Informe um e-mail válido.' });
  const { rows } = await q(`select u.id, u.nome, u.email, u.senha_hash from usuarios u where u.email=$1
    and not exists (select 1 from acesso_tokens t where t.usuario_id=u.id and t.criado_em > now() - interval '2 minutes')`, [email]);
  if (rows[0]) await enviaRedefinir(rows[0]);
  res.json({ ok: true });
}));
app.get('/api/senha/token', limite(20), erro(async (req, res) => {
  const t = await tokenValido(req.query.t);
  if (!t) return res.status(404).json({ erro: 'Este link expirou ou já foi usado. Peça um novo em "Esqueci minha senha".' });
  res.json({ email: t.email, nome: t.nome, empresa: t.empresa, whatsapp: t.whatsapp, tem_senha: t.tem_senha, convidado: t.convidado });
}));
app.post('/api/senha/definir', limite(10), erro(async (req, res) => {
  const b = req.body || {};
  const t = await tokenValido(b.token);
  if (!t) return res.status(404).json({ erro: 'Este link expirou ou já foi usado. Peça um novo em "Esqueci minha senha".' });
  const senha = String(b.senha || '');
  if (senha.length < 6 || senha.length > 200) return res.status(400).json({ erro: 'A senha precisa ter pelo menos 6 caracteres.' });
  const nome = limpa(b.nome) || t.nome, empresa = limpa(b.empresa) || t.empresa;
  const whatsapp = limpa(b.whatsapp, 20).replace(/\D/g, '') || t.whatsapp;
  // o nome da empresa e o resto do cadastro vêm logo depois, no cadastro completo da empresa (dentro do app)
  const { rowCount } = await q('update acesso_tokens set usado_em=now() where token_hash=$1 and usado_em is null', [t.token_hash]);
  if (!rowCount) return res.status(404).json({ erro: 'Este link já foi usado.' });
  const { rows } = await q(`update usuarios set senha_hash=$1, nome=$2, empresa=$3, whatsapp=$4, sessao_v=sessao_v+1, ultimo_acesso=now()
    where id=$5 returning id, sessao_v`, [await hashSenha(senha), nome, empresa, whatsapp, t.id]);
  await q('update acesso_tokens set usado_em=now() where usuario_id=$1 and usado_em is null', [t.id]);
  criaSessao(res, rows[0]);
  res.json({ ok: true });
}));

// CEP -> estado (sempre, pelas faixas dos Correios) e cidade/endereço (ViaCEP, quando responde)
const ceps = new Map();
app.get('/api/cep/:cep', logado, limite(40), erro(async (req, res) => {
  const cep = String(req.params.cep || '').replace(/\D/g, '');
  const uf = Cadastro.ufDoCep(cep);
  if (!uf) return res.status(400).json({ erro: 'CEP não encontrado. Confira os 8 números.' });
  if (ceps.has(cep)) return res.json(ceps.get(cep));
  let r = { cep, uf, cidade: null, endereco: null };
  try {
    const v = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout(3500) }).then(x => x.ok ? x.json() : null);
    if (v && !v.erro && v.uf) {
      r = { cep, uf: v.uf, cidade: v.localidade || null, endereco: [v.logradouro, v.bairro].filter(Boolean).join(', ') || null };
      if (ceps.size > 5000) ceps.clear();
      ceps.set(cep, r);
    }
  } catch { /* sem internet ou ViaCEP fora: fica só o estado, a pessoa escreve a cidade */ }
  res.json(r);
}));

// ---------- gestão: equipes, funcionários, escalas, ocorrências, acessos, relatórios ----------
require('./gestao.js')({ app, q, pool, erro, limpa, logado, limite, LIBERAR_TUDO, CHECKOUT_URL, criaLink, fila, modelo, APP_URL, rodapeSuporte, VALOR_COMISSAO });

// ---------- pagamento: webhook do checkout ----------
// URL para colar na plataforma (Kiwify, Hotmart, Eduzz, Cakto, Ticto, Clickmax, n8n...):
//   https://SEU_DOMINIO/api/webhook/pagamento?token=WEBHOOK_TOKEN
// Também aceita o token no cabeçalho "x-webhook-token" ou "Authorization: Bearer ...".
app.post('/api/webhook/pagamento', express.urlencoded({ extended: true, limit: '300kb' }), erro(async (req, res) => {
  const recebido = req.query.token || req.get('x-webhook-token') || (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!WEBHOOK_TOKEN || !iguais(recebido, WEBHOOK_TOKEN)) return res.status(401).json({ erro: 'Token inválido.' });
  const p = interpretaPagamento(req.body, req.headers);
  const registra = (acao, extra) => q('insert into pagamentos_eventos (email, acao, evento, plataforma, payload) values ($1,$2,$3,$4,$5)',
    [p.email || null, acao, p.evento || null, p.plataforma, JSON.stringify({ ...req.body, ...extra })]).catch(e => console.error('evento pagamento:', e.message));

  if (!emailValido(p.email)) {
    await registra('erro', { _motivo: 'sem e-mail' });
    // 200 para a plataforma não ficar reenviando um evento que nunca vai ter e-mail (ex.: teste vazio)
    return res.json({ ok: false, erro: 'E-mail do comprador não encontrado no corpo.' });
  }
  // order bumps (Kit RH, Calculadora, Plaquinhas): pedido só de extras não cria conta nem libera o app
  const pedido = extrasMod.classificaPedido(req.body);
  if (pedido.soExtras) {
    if (p.acao === 'ignorar') { await registra('ignorar', { _extras: pedido.extras }); return res.json({ ok: true, acao: 'ignorar', evento: p.evento, extras: pedido.extras }); }
    if (p.acao === 'bloquear') {
      const removidos = await extrasMod.revogar(p.email, pedido.extras, p.transacao);
      await registra('bloquear', { _extras: pedido.extras });
      return res.json({ ok: true, acao: 'bloquear', extras: pedido.extras, extras_removidos: removidos });
    }
    const novos = await extrasMod.liberar(p.email, pedido.extras, { transacao: p.transacao, origem: p.plataforma });
    await registra('liberar', { _extras: pedido.extras });
    return res.json({ ok: true, acao: 'liberar', extras: pedido.extras, extras_novos: novos });
  }
  if (p.acao === 'ignorar') { await registra('ignorar'); return res.json({ ok: true, acao: 'ignorar', evento: p.evento }); }
  if (p.acao === 'bloquear') {
    const { rows } = await q('select transacao from compras where email=$1', [p.email]);
    // só tira o acesso se o reembolso for da mesma compra (quando as duas têm código)
    if (rows[0]?.transacao && p.transacao && rows[0].transacao !== p.transacao) {
      await registra('ignorar', { _motivo: 'reembolso de outra transação' });
      return res.json({ ok: true, acao: 'ignorar', motivo: 'outra transação' });
    }
    await q("update compras set status='reembolsada', atualizado_em=now() where email=$1", [p.email]);
    const { rowCount } = await q('update usuarios set acesso_liberado=false, liberado_em=null where email=$1', [p.email]);
    await q("update comissoes set status='cancelada' where comprador_email=$1 and status='devida'", [p.email]);
    // bumps que vieram no mesmo pedido saem junto
    if (pedido.extras.length) await extrasMod.revogar(p.email, pedido.extras, p.transacao);
    await extrasMod.revogarDaTransacao(p.email, p.transacao);
    await registra('bloquear');
    enviar(N8N_WEBHOOK_URL, { evento: 'compra_reembolsada', email: p.email });
    return res.json({ ok: true, acao: 'bloquear', conta_bloqueada: rowCount > 0 });
  }
  const r = await liberarCompra({ email: p.email, nome: p.nome, whatsapp: p.whatsapp, transacao: p.transacao, origem: p.plataforma, ref: refDoPayload(req.body) || codigoInd(req.query.ref) });
  const extrasNovos = pedido.extras.length ? await extrasMod.liberar(p.email, pedido.extras, { transacao: p.transacao, origem: p.plataforma }) : [];
  await registra('liberar', pedido.extras.length ? { _extras: pedido.extras } : undefined);
  const { link, ...resto } = r;
  res.json({ ok: true, acao: 'liberar', ...resto, ...(pedido.extras.length && { extras: pedido.extras, extras_novos: extrasNovos }) });
}));

// ---------- leads (formulário da página de vendas) ----------
app.post('/api/leads', seg.soDaNossaPagina, limite(10), erro(async (req, res) => {
  const b = req.body || {};
  if (b.origem === 'blog-gerador') return leadDoGerador(req, res, b);
  const nome = limpa(b.nome), whatsapp = limpa(b.whatsapp, 20).replace(/\D/g, '');
  if (!nome || whatsapp.length < 10) return res.status(400).json({ erro: 'Informe nome e WhatsApp com DDD.' });
  const utm = b.utm && typeof b.utm === 'object' && !Array.isArray(b.utm)
    ? Object.fromEntries(Object.entries(b.utm).slice(0, 10).map(([k, v]) => [limpa(k, 40), limpa(v, 200)])) : {};
  const { rows } = await q('insert into leads (nome, empresa, whatsapp, email, setor, funcionarios, utm, ip, ref) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id',
    [nome, limpa(b.empresa), whatsapp, limpa(b.email, 160).toLowerCase(), limpa(b.setor, 40), Math.max(0, Math.min(100000, +b.funcionarios || 0)), utm, req.ip, codigoInd('ind_' + limpa(b.ref, 20))]);
  enviar(N8N_WEBHOOK_URL, { evento: 'lead', id: rows[0].id, nome, whatsapp, email: limpa(b.email, 160), empresa: limpa(b.empresa) });
  res.json({ ok: true });
}));

// gerador grátis do blog: só o e-mail, com autorização expressa (LGPD), e a escala da semana vai por e-mail
async function leadDoGerador(req, res, b) {
  const email = limpa(b.email, 160).toLowerCase();
  if (!emailValido(email)) return res.status(400).json({ erro: 'Informe um e-mail válido.' });
  if (b.consentimento !== true) return res.status(400).json({ erro: 'Marque a caixa autorizando o envio da escala por e-mail.' });
  const utm = b.utm && typeof b.utm === 'object' && !Array.isArray(b.utm)
    ? Object.fromEntries(Object.entries(b.utm).slice(0, 10).map(([k, v]) => [limpa(k, 40), limpa(v, 200)])) : {};
  const e = b.escala && typeof b.escala === 'object' ? b.escala : {};
  const inicio = /^\d{4}-\d{2}-\d{2}$/.test(e.inicio || '') ? e.inicio : null;
  const linhas = (Array.isArray(e.linhas) ? e.linhas : []).slice(0, 10)
    .map(l => ({ nome: limpa(l?.nome, 40), dias: limpa(l?.dias, 7).toUpperCase().replace(/[^TF-]/g, '') }))
    .filter(l => l.nome && l.dias.length === 7);
  const novidades = b.novidades === true;
  await q(`insert into leads (nome, empresa, whatsapp, email, setor, funcionarios, utm, ip, ref, origem, consentimento_em, novidades, escala)
    values ($1,'','',$2,$3,$4,$5,$6,$7,'blog-gerador',now(),$8,$9)`,
    ['Gerador grátis', email, limpa(b.setor, 40), linhas.length, utm, req.ip, codigoInd('ind_' + limpa(b.ref, 20)), novidades, { inicio, linhas }]);
  if (linhas.length && inicio) {
    const D = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'], br = d => d.slice(8) + '/' + d.slice(5, 7);
    const fim = new Date(inicio + 'T12:00:00Z'); fim.setUTCDate(fim.getUTCDate() + 6);
    const site = `${APP_URL}/?utm_source=blog&utm_medium=email&utm_campaign=gerador#preco`;
    await fila.enfileirar(email, `Sua escala 5x2 da semana de ${br(inicio)}`, modelo({
      titulo: `Escala 5x2 da semana de ${br(inicio)} a ${br(fim.toISOString().slice(0, 10))}`,
      paragrafos: [
        ...linhas.map(l => { const f = [...l.dias].map((c, i) => c === 'F' ? D[i] : '').filter(Boolean); return `${l.nome}: folga ${f.join(' e ') || '—'}`; }),
        'Feita no gerador grátis do blog Sua Escala 5x2: 1 semana, sem nomes. Confira com o seu contador.',
        'Quer o mês inteiro, com os nomes, faltas, férias, envio pelo WhatsApp e acesso do contador? A Sua Escala 5x2 completa faz tudo isso.',
      ],
      botao: 'Conhecer a versão completa', link: site,
      rodape: 'Você recebeu este e-mail porque pediu a escala no gerador grátis.' + (novidades ? '' : ' Não vamos mandar outros e-mails sem a sua autorização.'),
    }));
  }
  enviar(N8N_WEBHOOK_URL, { evento: 'lead', origem: 'blog-gerador', email, novidades });
  res.json({ ok: true });
}

// ---------- admin ----------
function adminAuth(req, res, next) {
  const k = 'admin:' + req.ip;
  if (travado(k, MAX_ADMIN)) return res.status(429).type('text/plain').send('Muitas tentativas erradas. Espere 15 minutos.');
  const cab = req.headers.authorization || '';
  const [u, ...resto] = Buffer.from(cab.split(' ')[1] || '', 'base64').toString().split(':');
  if (ADMIN_PASS && iguais(u, ADMIN_USER) && iguais(resto.join(':'), ADMIN_PASS)) return next();
  if (cab) { falhou(k); console.warn('admin: senha errada de', req.ip); }
  res.set('WWW-Authenticate', 'Basic realm="admin", charset="UTF-8"').status(401).send('Acesso restrito');
}
const admin = [limite(120), adminAuth];
// materiais extras (order bumps): /api/extras, download e /api/admin/extras
const extrasMod = require('./extras.js')({ app, q, erro, limpa, logado, fila, modelo, APP_URL, rodapeSuporte, admin, emailValido });
// suporte: dúvidas frequentes, assistente de IA (n8n) e chamados no /admin
require('./suporte.js')({ app, q, erro, limpa, logado, limite, admin, LIBERAR_TUDO });
// API de Conversões da Meta: o token fica guardado no banco (nunca volta para a tela)
app.get('/api/admin/meta', admin, erro(async (_req, res) => {
  const t = await site.tokenMeta();
  res.json({ pixel: site.PIXEL, token_configurado: !!t, pelo_env: !!process.env.META_CAPI_TOKEN });
}));
app.put('/api/admin/meta', admin, erro(async (req, res) => {
  const token = String(req.body?.token || '').trim();
  if (token && !/^[A-Za-z0-9_-]{40,600}$/.test(token)) return res.status(400).json({ erro: 'Esse token não parece um token da Meta.' });
  if (token) await q(`insert into config (chave, valor) values ('meta_capi_token', $1) on conflict (chave) do update set valor=$1, atualizado_em=now()`, [token]);
  else await q("delete from config where chave='meta_capi_token'");
  site.limpaCacheMeta();
  res.json({ ok: true, token_configurado: !!token });
}));
app.post('/api/admin/meta/teste', admin, erro(async (req, res) => res.json(await site.testeMeta(String(req.body?.codigo || '').replace(/[^\w]/g, '').slice(0, 40)))));
app.get('/admin', admin, (_req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));
app.get('/api/admin/clientes', admin, erro(async (_req, res) => {
  const { rows } = await q(`select u.id, u.criado_em, u.nome, u.empresa, u.email, u.whatsapp, u.acesso_liberado, u.liberado_em,
    u.origem, u.ultimo_acesso, u.senha_hash is not null tem_senha,
    c.razao_social, c.cnpj, c.porte, c.segmento, c.cidade, c.uf, c.telefone, c.responsavel, c.responsavel_cargo,
    c.funcionarios_qtd, c.unidades_qtd, c.como_conheceu, c.como_conheceu_outro, c.cadastro_em,
    (select count(*)::int from equipes e where e.usuario_id=u.id) equipes,
    (select count(*)::int from escalas s join equipes e on e.id=s.equipe_id where e.usuario_id=u.id) escalas,
    (select array_agg(x.extra order by x.extra) from extras_compras x where x.email=u.email and x.status='aprovada') extras
    from usuarios u left join empresa_config c on c.conta_id=u.id
    where u.origem is distinct from 'empresa_extra' order by u.criado_em desc limit 5000`);
  res.json(rows);
}));
app.patch('/api/admin/clientes/:id', admin, erro(async (req, res) => {
  const liberar = !!req.body?.acesso_liberado;
  const { rows } = await q('select * from usuarios where id=$1', [+req.params.id || 0]);
  if (!rows[0]) return res.status(404).json({ erro: 'Cliente não encontrado.' });
  if (liberar) await liberarCompra({ email: rows[0].email, nome: rows[0].nome, origem: 'manual' });
  else await q('update usuarios set acesso_liberado=false, liberado_em=null where id=$1', [rows[0].id]);
  res.json({ ok: true });
}));
// indicações: quanto cada afiliado tem a receber (só conta como liberado para pagar depois dos 7 dias de garantia)
app.get('/api/admin/indicacoes', admin, erro(async (_req, res) => {
  const { rows } = await q(`select u.id, u.nome, u.email, u.whatsapp, u.pix, u.ref_codigo,
      count(*) filter (where c.status<>'cancelada')::int vendas,
      coalesce(sum(c.valor) filter (where c.status='devida' and c.criado_em < now() - interval '7 days'), 0) liberado,
      coalesce(sum(c.valor) filter (where c.status='devida' and c.criado_em >= now() - interval '7 days'), 0) na_garantia,
      coalesce(sum(c.valor) filter (where c.status='paga'), 0) pago
    from comissoes c join usuarios u on u.id=c.afiliado_id group by u.id order by liberado desc, vendas desc`);
  res.json({ valor_por_venda: VALOR_COMISSAO, afiliados: rows });
}));
app.post('/api/admin/indicacoes/:id/pagar', admin, erro(async (req, res) => {
  const { rows } = await q(`update comissoes set status='paga', pago_em=now() where afiliado_id=$1 and status='devida'
    and criado_em < now() - interval '7 days' returning valor`, [+req.params.id || 0]);
  res.json({ ok: true, pagas: rows.length, total: rows.reduce((t, r) => t + +r.valor, 0) });
}));

// liberar alguém que pagou por fora (Pix direto, cortesia)
app.post('/api/admin/acessos', admin, erro(async (req, res) => {
  const email = limpa(req.body?.email, 160).toLowerCase();
  if (!emailValido(email)) return res.status(400).json({ erro: 'E-mail inválido.' });
  const r = await liberarCompra({ email, nome: limpa(req.body?.nome), origem: 'manual' });
  res.json({ ok: true, ...r });
}));
// gera um link novo de criar/redefinir senha (para mandar no WhatsApp) e, se pedir, manda por e-mail
app.post('/api/admin/clientes/:id/link', admin, erro(async (req, res) => {
  const { rows } = await q('select * from usuarios where id=$1', [+req.params.id || 0]);
  if (!rows[0]) return res.status(404).json({ erro: 'Cliente não encontrado.' });
  if (req.body?.email) { await (rows[0].senha_hash ? enviaRedefinir(rows[0]) : enviaBoasVindas(rows[0])); return res.json({ ok: true, enviado: true }); }
  res.json({ ok: true, link: await criaLink(rows[0].id, 72) });
}));
app.get('/api/admin/resumo', admin, erro(async (_req, res) => {
  const [eventos, emails] = await Promise.all([
    q('select id, criado_em, email, acao, evento, plataforma from pagamentos_eventos order by id desc limit 100'),
    q(`select count(*) filter (where enviado_em is not null)::int enviados,
      count(*) filter (where enviado_em is null and tentativas < 8)::int pendentes,
      count(*) filter (where enviado_em is null and tentativas >= 8)::int falharam,
      (select erro from emails where erro is not null order by id desc limit 1) ultimo_erro from emails`),
  ]);
  res.json({ eventos: eventos.rows, emails: { ...emails.rows[0], smtp: fila.configurado }, webhook: `${APP_URL}/api/webhook/pagamento?token=SEU_WEBHOOK_TOKEN` });
}));

app.get('/api/health', erro(async (_req, res) => { await q('select 1'); res.json({ ok: true }); }));
app.get('/e/:token', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'escala.html')));
app.get(['/app', '/app/*'], (_req, res) => res.sendFile(path.join(__dirname, 'public', 'app.html')));
app.use(site.naoEncontrado);
app.use((err, req, res, _next) => { // JSON inválido, corpo grande demais etc.
  if (err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'Corpo da requisição inválido.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ erro: 'Dados grandes demais.' });
  console.error(req.method, req.path, err);
  res.status(500).json({ erro: 'Erro inesperado. Tente de novo.' });
});

async function migrar() {
  const sql = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
  for (let i = 0; i < 30; i++) {
    try { await q(sql); return; } catch (e) { console.log('aguardando banco...', e.message); await new Promise(r => setTimeout(r, 2000)); }
  }
  throw new Error('Banco indisponível');
}

process.on('unhandledRejection', e => console.error('unhandledRejection:', e));
if (require.main === module) {
  migrar().then(() => {
    const server = app.listen(PORT, () => console.log(`Sua Escala 5x2 rodando na porta ${PORT} (${APP_URL})`));
    server.keepAliveTimeout = 65_000; server.headersTimeout = 66_000;
    fila.processar();
    const parar = sinal => {
      console.log(`${sinal}: encerrando...`);
      server.close(() => pool.end().then(() => process.exit(0)));
      setTimeout(() => process.exit(0), 10_000).unref();
    };
    process.on('SIGTERM', parar); process.on('SIGINT', parar);
  }).catch(e => { console.error(e); process.exit(1); });
}

module.exports = { app, migrar, pool };
