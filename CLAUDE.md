# Escala Legal

SaaS que gera a escala 5x2 (EC 141/2026, fim da 6x1) para empresas. Vendido por R$ 47, pagamento único, com tráfego pago.

## Estrutura
- `app/server.js`: API Express + Postgres (`pg`). Sessão por cookie assinado (HMAC, com `sessao_v` para derrubar sessões ao trocar senha), senha com scrypt assíncrono. Sem ORM.
- `app/pagamento.js`: interpreta o webhook de qualquer checkout (Kiwify, Hotmart, Eduzz, Cakto, Ticto, JSON simples) → liberar / bloquear / ignorar.
- `app/email.js`: fila de e-mails no Postgres (tabela `emails`) com nova tentativa; SMTP via nodemailer.
- `app/db/schema.sql`: tabelas `usuarios`, `equipes`, `funcionarios`, `escalas`, `compras`, `leads`, `pagamentos_eventos`, `acesso_tokens`, `emails`. Roda a cada boot (idempotente: só `create if not exists` / `add column if not exists`).
- `app/public/obrigado.html`: página pós-compra.
- `app/test/`: `npm test` (node:test). O teste de fluxo precisa de `DATABASE_URL`.
- `deploy/instalar.sh` / `deploy/atualizar.sh`: instalação e atualização no VPS (detecta Traefik, Caddy ou outro proxy).
- `app/public/scheduler.js`: motor da escala (roda no navegador e no Node). Regras: 2 folgas/semana, cobertura mínima por dia, folgas consecutivas quando possível, rodízio de domingo, folga fixa.
- `app/public/index.html`: página de vendas. Botões de compra abrem um modal que salva o lead (`/api/leads`) e redireciona para `CHECKOUT_URL`.
- `app/public/app.html`: o app (SPA em JS puro): login/cadastro, equipes, funcionários, dias e cobertura, gerar/ajustar/imprimir escala.
- `app/views/admin.html`: painel `/admin` (Basic Auth) para liberar/bloquear clientes.
- `docker-compose.yml`: app + Postgres + backup diário (+ Caddy opcional). Deploy no VPS do Bruno em `/opt/escalalegal`.

## Regras de negócio
- Gerar escala exige `acesso_liberado` (pago). Compra aprovada no webhook (`POST /api/webhook/pagamento?token=WEBHOOK_TOKEN`) cria a conta sem senha e envia por e-mail o link `/app?acesso=TOKEN` para criar a senha (token guardado só como hash, uso único). Reembolso/chargeback bloqueia. Todo evento fica em `pagamentos_eventos`.
- Cadastro com e-mail de conta comprada e sem senha não cria conta: reenvia o link (evita sequestro da compra).
- Cada empresa só vê as próprias equipes (checar `usuario_id` em toda rota).

## Estilo
- Português do Brasil em toda a interface e na copy.
- Visual: branco, azul (#1351b4), verde (#168821), amarelo (#ffcd07), degradês no hero. Fontes Archivo (títulos) e Public Sans (texto). Mascote: Zé Folga (`app/public/img/mascote.svg`).
- O dono não quer nada com cara de IA: nada de ícones genéricos, copy curta e direta, fotos de pessoas reais quando houver.

## Rodar local
```bash
cd app && npm install
DATABASE_URL=postgres://... SESSION_SECRET=x ADMIN_PASS=x WEBHOOK_TOKEN=x LIBERAR_TUDO=1 node server.js
```
