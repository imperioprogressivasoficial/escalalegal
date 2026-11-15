// Sua Escala 5x2 — foto de perfil. O navegador já manda a foto cortada em 256x256 (WebP); aqui só confere e guarda.
// PUT /api/eu/foto (corpo = a imagem, até 200 KB, WebP/JPEG/PNG conferido pelos primeiros bytes)
// DELETE /api/eu/foto
// GET /api/usuarios/:id/foto (só a própria pessoa ou quem está na mesma empresa)
const fs = require('fs');
const path = require('path');
const express = require('express');

const MAX = 200 * 1024;
const SQL = fs.readFileSync(path.join(__dirname, 'db', 'foto.sql'), 'utf8');

// tipo pela assinatura do arquivo, nunca pelo cabeçalho
function tipoDaImagem(b) {
  if (!b || b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

module.exports = function foto({ app, q, erro, logado }) {
  let pronto = null; // garante as colunas antes do primeiro uso (o schema principal roda antes, no boot)
  const garante = () => (pronto ||= q(SQL).catch(e => { pronto = null; throw e; }));
  const corpo = express.raw({ type: () => true, limit: MAX });
  const recebe = (req, res, next) => corpo(req, res, err => {
    if (err) return res.status(err.type === 'entity.too.large' ? 413 : 400).json({ erro: err.type === 'entity.too.large' ? 'A foto passa de 200 KB.' : 'Não foi possível ler a foto.' });
    next();
  });

  app.put('/api/eu/foto', logado, recebe, erro(async (req, res) => {
    const b = Buffer.isBuffer(req.body) ? req.body : null;
    if (!b || !b.length) return res.status(400).json({ erro: 'Envie a foto.' });
    if (b.length > MAX) return res.status(413).json({ erro: 'A foto passa de 200 KB.' });
    const tipo = tipoDaImagem(b);
    if (!tipo) return res.status(415).json({ erro: 'Use uma foto em WebP, JPEG ou PNG.' });
    await garante();
    const { rows: [u] } = await q('update usuarios set foto=$1, foto_tipo=$2, foto_em=now() where id=$3 returning foto_em', [b, tipo, req.u.id]);
    res.json({ ok: true, foto_em: u.foto_em });
  }));

  app.delete('/api/eu/foto', logado, erro(async (req, res) => {
    await garante();
    await q('update usuarios set foto=null, foto_tipo=null, foto_em=null where id=$1', [req.u.id]);
    res.json({ ok: true });
  }));

  // para o próprio app saber se mostra a foto ou as iniciais (e qual versão)
  app.get('/api/eu/foto/info', logado, erro(async (req, res) => {
    await garante();
    const { rows: [u] } = await q('select foto_em from usuarios where id=$1 and foto is not null', [req.u.id]);
    res.json({ foto_em: u?.foto_em || null });
  }));

  app.get('/api/usuarios/:id/foto', logado, erro(async (req, res) => {
    const id = +req.params.id || 0, eu = req.u.id;
    await garante();
    // a própria pessoa, o dono da empresa onde ela trabalha, alguém que trabalha na empresa dela, ou colegas da mesma empresa
    const { rows: [u] } = await q(`select foto, foto_tipo, foto_em from usuarios where id=$1 and foto is not null and (
        $1 = $2
        or exists (select 1 from membros where (conta_id=$1 and usuario_id=$2) or (conta_id=$2 and usuario_id=$1))
        or exists (select 1 from membros a join membros b on a.conta_id=b.conta_id where a.usuario_id=$1 and b.usuario_id=$2))`, [id, eu]);
    if (!u) return res.status(404).json({ erro: 'Sem foto.' });
    const etag = `"f${new Date(u.foto_em).getTime()}"`;
    res.set({ 'Cache-Control': 'private, max-age=86400', ETag: etag });
    if (req.get('if-none-match') === etag) return res.status(304).end();
    res.type(u.foto_tipo).send(u.foto);
  }));
  return { garante };
};
module.exports.tipoDaImagem = tipoDaImagem;
