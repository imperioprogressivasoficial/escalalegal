// Fila de e-mails no Postgres. Se o SMTP cair, tenta de novo (até 8 vezes, com espera crescente).
const nodemailer = require('nodemailer');

const { SMTP_HOST, SMTP_PORT = '465', SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
const configurado = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
const transporte = configurado && nodemailer.createTransport({
  host: SMTP_HOST, port: +SMTP_PORT, secure: +SMTP_PORT === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  pool: true, maxConnections: 2, connectionTimeout: 15000, socketTimeout: 20000,
});
const remetente = SMTP_FROM || (SMTP_USER ? `Escala Legal <${SMTP_USER}>` : '');

const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function modelo({ titulo, paragrafos, botao, link, rodape }) {
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f3f5f8;font-family:Arial,Helvetica,sans-serif;color:#3d4a5c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f8;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #dfe3ea">
<tr><td style="background:#071d41;padding:18px 24px;font:800 22px Arial,sans-serif;color:#fff">Escala<span style="color:#7be08a">Legal</span></td></tr>
<tr><td style="padding:26px 24px 8px">
<h1 style="margin:0 0 14px;font:700 22px/1.25 Arial,sans-serif;color:#0c1b33">${esc(titulo)}</h1>
${paragrafos.map(p => `<p style="margin:0 0 12px;font-size:15px;line-height:1.55">${esc(p)}</p>`).join('')}
</td></tr>
<tr><td style="padding:8px 24px 22px"><a href="${esc(link)}" style="display:inline-block;background:#168821;color:#fff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:8px;font-size:16px">${esc(botao)}</a>
<p style="margin:16px 0 0;font-size:12px;color:#6b778a;word-break:break-all">Se o botão não abrir, copie este link: ${esc(link)}</p></td></tr>
${rodape ? `<tr><td style="padding:14px 24px;border-top:1px solid #dfe3ea;font-size:13px;color:#6b778a">${esc(rodape)}</td></tr>` : ''}
</table></td></tr></table></body></html>`;
  const texto = `${titulo}\n\n${paragrafos.join('\n\n')}\n\n${botao}: ${link}\n${rodape ? `\n${rodape}\n` : ''}`;
  return { html, texto };
}

function criaFila(q) {
  async function enfileirar(para, assunto, conteudo) {
    await q('insert into emails (para, assunto, html, texto) values ($1,$2,$3,$4)', [para, assunto, conteudo.html, conteudo.texto]);
    if (!configurado) console.log(`[e-mail] SMTP não configurado. Para ${para}: ${assunto}\n${conteudo.texto}`);
    else setImmediate(processar);
  }

  let rodando = false;
  async function processar() {
    if (!configurado || rodando) return;
    rodando = true;
    try {
      for (;;) {
        // pega um por vez, travando a linha (seguro mesmo com mais de uma instância)
        const { rows } = await q(`update emails set tentativas = tentativas + 1,
            proxima_em = now() + make_interval(mins => least(power(2, tentativas)::int, 240))
          where id = (select id from emails where enviado_em is null and tentativas < 8 and proxima_em <= now()
            order by id limit 1 for update skip locked) returning *`);
        const m = rows[0];
        if (!m) break;
        try {
          await transporte.sendMail({ from: remetente, to: m.para, subject: m.assunto, html: m.html, text: m.texto });
          await q('update emails set enviado_em = now(), erro = null where id = $1', [m.id]);
        } catch (e) {
          console.error(`[e-mail] falha para ${m.para} (tentativa ${m.tentativas}):`, e.message);
          await q('update emails set erro = $1 where id = $2', [String(e.message).slice(0, 300), m.id]);
        }
      }
    } catch (e) {
      console.error('[e-mail] fila:', e.message);
    } finally {
      rodando = false;
    }
  }
  const timer = setInterval(processar, 60_000);
  timer.unref();
  return { enfileirar, processar, configurado };
}

module.exports = { criaFila, modelo, smtpConfigurado: configurado };
