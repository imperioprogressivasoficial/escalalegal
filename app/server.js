const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { gerarEscala, SETORES } = require('./public/scheduler.js');

const {
  DATABASE_URL, SESSION_SECRET = crypto.randomBytes(32).toString('hex'),
  ADMIN_USER = 'admin', ADMIN_PASS, WEBHOOK_TOKEN, N8N_WEBHOOK_URL, META_PIXEL_ID,
  CHECKOUT_URL = '', LIBERAR_TUDO, PORT = 3000,
} = process.env;

require('pg').types.setTypeParser(1082, v => v); // datas como texto AAAA-MM-DD
const pool = new Pool({ connectionString: DATABASE_URL });
const q = (sql, p) => pool.query(sql, p);
const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '300kb' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

const limpa = (v, max = 120) => String(v ?? '').trim().slice(0, max);
const enviar = (url, corpo) => url && fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) }).catch(e => console.error('webhook:', e.message));

// ---------- limite por IP ----------
const hits = new Map();
const limite = (max = 20) => (req, res, next) => {
  const k = req.ip + req.path, now = Date.now();
  const h = (hits.get(k) || []).filter(t => now - t < 60_000);
  if (h.length >= max) return res.status(429).json({ erro: 'Muitas tentativas. Aguarde 1 minuto.' });
  h.push(now); hits.set(k, h); next();
};

// ---------- senha e sessão ----------
function hashSenha(senha) {
  const sal = crypto.randomBytes(16).toString('hex');
  return sal + ':' + crypto.scryptSync(senha, sal, 64).toString('hex');
}
function confereSenha(senha, salvo) {
  const [sal, h] = String(salvo).split(':');
  if (!sal || !h) return false;
  const teste = crypto.scryptSync(senha, sal, 64);
  return crypto.timingSafeEqual(teste, Buffer.from(h, 'hex'));
}
const assina = v => crypto.createHmac('sha256', SESSION_SECRET).update(v).digest('base64url');
function criaSessao(res, id) {
  const exp = Date.now() + 30 * 864e5, v = `${id}.${exp}`;
  res.setHeader('Set-Cookie', `sid=${v}.${assina(v)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 86400}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}
function leSessao(req) {
  const m = /(?:^|;\s*)sid=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return null;
  const [id, exp, sig] = m[1].split('.');
  if (!id || !sig || +exp < Date.now()) return null;
  const esperado = assina(`${id}.${exp}`);
  if (sig.length !== esperado.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(esperado))) return null;
  return +id;
}
async function logado(req, res, next) {
  const id = leSessao(req);
  if (!id) return res.status(401).json({ erro: 'Entre na sua conta.' });
  const { rows } = await q('select id, nome, empresa, email, acesso_liberado from usuarios where id=$1', [id]);
  if (!rows[0]) return res.status(401).json({ erro: 'Entre na sua conta.' });
  req.u = rows[0]; next();
}
const pago = (req, res, next) => (req.u.acesso_liberado || LIBERAR_TUDO === '1')
  ? next() : res.status(402).json({ erro: 'Seu acesso ainda não foi liberado. Conclua o pagamento para gerar escalas.', checkout: CHECKOUT_URL });

async function minhaEquipe(req, res, next) {
  const { rows } = await q('select * from equipes where id=$1 and usuario_id=$2', [+req.params.id, req.u.id]);
  if (!rows[0]) return res.status(404).json({ erro: 'Equipe não encontrada.' });
  req.equipe = rows[0]; next();
}
const erro = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(e => { console.error(e); res.status(500).json({ erro: 'Erro inesperado. Tente de novo.' }); });

// ---------- conta ----------
app.get('/api/config', (_req, res) => res.json({ checkout: CHECKOUT_URL, setores: SETORES }));

app.post('/api/cadastro', limite(8), erro(async (req, res) => {
  const b = req.body || {};
  const nome = limpa(b.nome), empresa = limpa(b.empresa), email = limpa(b.email, 160).toLowerCase();
  const whatsapp = limpa(b.whatsapp, 20).replace(/\D/g, ''), senha = String(b.senha || '');
  if (!nome || !empresa) return res.status(400).json({ erro: 'Informe seu nome e o nome da empresa.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ erro: 'Informe um e-mail válido.' });
  if (senha.length < 6) return res.status(400).json({ erro: 'A senha precisa ter pelo menos 6 caracteres.' });
  const { rows: compra } = await q('select 1 from compras where email=$1', [email]);
  try {
    const { rows } = await q(`insert into usuarios (nome, empresa, email, whatsapp, senha_hash, acesso_liberado, liberado_em)
      values ($1,$2,$3,$4,$5,$6, case when $6 then now() end) returning id`, [nome, empresa, email, whatsapp, hashSenha(senha), !!compra[0]]);
    criaSessao(res, rows[0].id);
    enviar(N8N_WEBHOOK_URL, { evento: 'cadastro', nome, empresa, email, whatsapp });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ erro: 'Este e-mail já tem conta. Use "Entrar".' });
    throw e;
  }
}));

app.post('/api/login', limite(10), erro(async (req, res) => {
  const email = limpa(req.body?.email, 160).toLowerCase();
  const { rows } = await q('select id, senha_hash from usuarios where email=$1', [email]);
  if (!rows[0] || !confereSenha(String(req.body?.senha || ''), rows[0].senha_hash))
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  criaSessao(res, rows[0].id); res.json({ ok: true });
}));

app.post('/api/sair', (_req, res) => { res.setHeader('Set-Cookie', 'sid=; Path=/; Max-Age=0'); res.json({ ok: true }); });
app.get('/api/eu', logado, (req, res) => res.json({ ...req.u, acesso_liberado: req.u.acesso_liberado || LIBERAR_TUDO === '1', checkout: CHECKOUT_URL }));

// ---------- equipes ----------
function validaEquipe(b) {
  const setor = SETORES[b.setor] ? b.setor : 'varejo';
  const abertos = Array.isArray(b.abertos) && b.abertos.length === 7 ? b.abertos.map(x => (x ? 1 : 0)) : SETORES[setor].abertos;
  const minimo = Array.isArray(b.minimo) && b.minimo.length === 7 ? b.minimo.map(x => Math.max(0, Math.min(200, +x || 0))) : SETORES[setor].minimo;
  return { nome: limpa(b.nome, 80) || SETORES[setor].nome, setor, abertos, minimo };
}
app.get('/api/equipes', logado, erro(async (req, res) => {
  const { rows } = await q(`select e.*, (select count(*)::int from funcionarios f where f.equipe_id=e.id and f.ativo) total,
    (select max(criado_em) from escalas s where s.equipe_id=e.id) ultima from equipes e where usuario_id=$1 order by e.id`, [req.u.id]);
  res.json(rows);
}));
app.post('/api/equipes', logado, erro(async (req, res) => {
  const e = validaEquipe(req.body || {});
  const { rows: n } = await q('select count(*)::int c from equipes where usuario_id=$1', [req.u.id]);
  if (n[0].c >= 50) return res.status(400).json({ erro: 'Limite de 50 equipes por conta.' });
  const { rows } = await q('insert into equipes (usuario_id, nome, setor, abertos, minimo) values ($1,$2,$3,$4,$5) returning *',
    [req.u.id, e.nome, e.setor, JSON.stringify(e.abertos), JSON.stringify(e.minimo)]);
  res.json(rows[0]);
}));
app.put('/api/equipes/:id', logado, minhaEquipe, erro(async (req, res) => {
  const e = validaEquipe({ ...req.equipe, ...req.body });
  const { rows } = await q('update equipes set nome=$1, setor=$2, abertos=$3, minimo=$4 where id=$5 returning *',
    [e.nome, e.setor, JSON.stringify(e.abertos), JSON.stringify(e.minimo), req.equipe.id]);
  res.json(rows[0]);
}));
app.delete('/api/equipes/:id', logado, minhaEquipe, erro(async (req, res) => {
  await q('delete from equipes where id=$1', [req.equipe.id]); res.json({ ok: true });
}));

// ---------- funcionários ----------
const fixos = v => (Array.isArray(v) ? v : []).map(Number).filter(d => d >= 0 && d < 7).slice(0, 2);
app.get('/api/equipes/:id/funcionarios', logado, minhaEquipe, erro(async (req, res) => {
  const { rows } = await q('select * from funcionarios where equipe_id=$1 and ativo order by nome', [req.equipe.id]);
  res.json(rows);
}));
app.post('/api/equipes/:id/funcionarios', logado, minhaEquipe, erro(async (req, res) => {
  const lista = (Array.isArray(req.body) ? req.body : [req.body]).filter(f => limpa(f?.nome));
  const { rows: n } = await q('select count(*)::int c from funcionarios where equipe_id=$1 and ativo', [req.equipe.id]);
  if (!lista.length) return res.status(400).json({ erro: 'Informe o nome do funcionário.' });
  if (n[0].c + lista.length > 200) return res.status(400).json({ erro: 'Limite de 200 funcionários por equipe.' });
  const novos = [];
  for (const f of lista) {
    const { rows } = await q('insert into funcionarios (equipe_id, nome, cargo, folga_fixa) values ($1,$2,$3,$4) returning *',
      [req.equipe.id, limpa(f.nome, 60), limpa(f.cargo, 60), JSON.stringify(fixos(f.folga_fixa))]);
    novos.push(rows[0]);
  }
  res.json(novos);
}));
app.put('/api/funcionarios/:fid', logado, erro(async (req, res) => {
  const { rows } = await q(`update funcionarios f set nome=$1, cargo=$2, folga_fixa=$3 from equipes e
    where f.id=$4 and f.equipe_id=e.id and e.usuario_id=$5 returning f.*`,
    [limpa(req.body.nome, 60), limpa(req.body.cargo, 60), JSON.stringify(fixos(req.body.folga_fixa)), +req.params.fid, req.u.id]);
  if (!rows[0]) return res.status(404).json({ erro: 'Funcionário não encontrado.' });
  res.json(rows[0]);
}));
app.delete('/api/funcionarios/:fid', logado, erro(async (req, res) => {
  await q('update funcionarios f set ativo=false from equipes e where f.id=$1 and f.equipe_id=e.id and e.usuario_id=$2', [+req.params.fid, req.u.id]);
  res.json({ ok: true });
}));

// ---------- escalas ----------
app.post('/api/equipes/:id/escalas', logado, pago, minhaEquipe, erro(async (req, res) => {
  const { rows: fs_ } = await q('select id, nome, cargo, folga_fixa from funcionarios where equipe_id=$1 and ativo order by nome', [req.equipe.id]);
  if (!fs_.length) return res.status(400).json({ erro: 'Cadastre pelo menos um funcionário antes de gerar a escala.' });
  const semanas = Math.max(1, Math.min(8, +req.body?.semanas || 4));
  const inicio = /^\d{4}-\d{2}-\d{2}$/.test(req.body?.inicio || '') ? req.body.inicio : new Date().toISOString().slice(0, 10);
  const r = gerarEscala({ funcionarios: fs_.map(f => ({ nome: f.nome, fixo: f.folga_fixa })), abertos: req.equipe.abertos, minimo: req.equipe.minimo, semanas });
  const { rows } = await q(`insert into escalas (equipe_id, inicio, semanas, funcionarios, abertos, minimo, dados, alertas)
    values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
    [req.equipe.id, inicio, semanas, JSON.stringify(fs_.map(f => ({ id: f.id, nome: f.nome, cargo: f.cargo }))),
      JSON.stringify(req.equipe.abertos), JSON.stringify(req.equipe.minimo), JSON.stringify(r.escala), JSON.stringify(r.alertas)]);
  res.json(rows[0]);
}));
app.get('/api/equipes/:id/escalas', logado, minhaEquipe, erro(async (req, res) => {
  const { rows } = await q('select * from escalas where equipe_id=$1 order by criado_em desc limit 20', [req.equipe.id]);
  res.json(rows);
}));
// ajuste manual de uma célula (trabalha <-> folga)
app.patch('/api/escalas/:eid', logado, erro(async (req, res) => {
  const { rows } = await q('select s.* from escalas s join equipes e on e.id=s.equipe_id where s.id=$1 and e.usuario_id=$2', [+req.params.eid, req.u.id]);
  if (!rows[0]) return res.status(404).json({ erro: 'Escala não encontrada.' });
  const { semana, funcionario, dia } = req.body || {};
  const d = rows[0].dados;
  if (!d[semana]?.[funcionario] || !(dia >= 0 && dia < 7)) return res.status(400).json({ erro: 'Célula inválida.' });
  d[semana][funcionario][dia] = d[semana][funcionario][dia] === 'F' ? 'T' : 'F';
  await q('update escalas set dados=$1 where id=$2', [JSON.stringify(d), rows[0].id]);
  res.json({ ok: true, dados: d });
}));

// ---------- liberação após pagamento ----------
// O checkout (Clickmax, Kiwify, Hotmart...) ou o n8n chama:
// POST /api/webhook/pagamento?token=WEBHOOK_TOKEN  body: { "email": "cliente@email.com" }
app.post('/api/webhook/pagamento', erro(async (req, res) => {
  if (!WEBHOOK_TOKEN || req.query.token !== WEBHOOK_TOKEN) return res.status(401).json({ erro: 'Token inválido.' });
  const b = req.body || {};
  const email = limpa(b.email || b.buyer?.email || b.customer?.email || b.data?.buyer?.email, 160).toLowerCase();
  if (!email.includes('@')) return res.status(400).json({ erro: 'E-mail não encontrado no corpo.' });
  await q('insert into compras (email, origem) values ($1,$2) on conflict (email) do nothing', [email, limpa(b.origem || 'checkout', 40)]);
  const { rowCount } = await q('update usuarios set acesso_liberado=true, liberado_em=now() where email=$1 and not acesso_liberado', [email]);
  res.json({ ok: true, conta_existente_liberada: rowCount > 0 });
}));

// ---------- leads (gerador grátis antigo, mantido) ----------
app.post('/api/leads', limite(10), erro(async (req, res) => {
  const b = req.body || {};
  const nome = limpa(b.nome), whatsapp = limpa(b.whatsapp, 20).replace(/\D/g, '');
  if (!nome || whatsapp.length < 10) return res.status(400).json({ erro: 'Informe nome e WhatsApp com DDD.' });
  const { rows } = await q(`insert into leads (nome, empresa, whatsapp, email, setor, funcionarios, utm, ip) values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
    [nome, limpa(b.empresa), whatsapp, limpa(b.email, 160), limpa(b.setor, 40), +b.funcionarios || 0, b.utm || {}, req.ip]);
  enviar(N8N_WEBHOOK_URL, { evento: 'lead', id: rows[0].id, nome, whatsapp });
  res.json({ ok: true });
}));

// ---------- admin ----------
function adminAuth(req, res, next) {
  const [u, p] = Buffer.from((req.headers.authorization || '').split(' ')[1] || '', 'base64').toString().split(':');
  if (ADMIN_PASS && u === ADMIN_USER && p === ADMIN_PASS) return next();
  res.set('WWW-Authenticate', 'Basic realm="admin"').status(401).send('Acesso restrito');
}
app.get('/admin', adminAuth, (_req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));
app.get('/api/admin/clientes', adminAuth, erro(async (_req, res) => {
  const { rows } = await q(`select u.id, u.criado_em, u.nome, u.empresa, u.email, u.whatsapp, u.acesso_liberado,
    (select count(*)::int from equipes e where e.usuario_id=u.id) equipes,
    (select count(*)::int from escalas s join equipes e on e.id=s.equipe_id where e.usuario_id=u.id) escalas
    from usuarios u order by u.criado_em desc limit 3000`);
  res.json(rows);
}));
app.patch('/api/admin/clientes/:id', adminAuth, erro(async (req, res) => {
  await q('update usuarios set acesso_liberado=$1, liberado_em=case when $1 then now() end where id=$2', [!!req.body.acesso_liberado, +req.params.id]);
  res.json({ ok: true });
}));

app.get('/pixel.js', (_req, res) => {
  res.type('application/javascript');
  if (!/^\d+$/.test(META_PIXEL_ID || '')) return res.send('');
  res.send(`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`);
});
app.get('/api/health', erro(async (_req, res) => { await q('select 1'); res.json({ ok: true }); }));
app.get(['/app', '/app/*'], (_req, res) => res.sendFile(path.join(__dirname, 'public', 'app.html')));

async function migrar() {
  const sql = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
  for (let i = 0; i < 30; i++) {
    try { await q(sql); return; } catch (e) { console.log('aguardando banco...', e.message); await new Promise(r => setTimeout(r, 2000)); }
  }
  throw new Error('Banco indisponível');
}
migrar().then(() => app.listen(PORT, () => console.log(`Escala Legal rodando na porta ${PORT}`)));
