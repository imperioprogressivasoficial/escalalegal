# Escala Legal

SaaS que gera a escala 5x2 (EC 141/2026, fim da 6x1) para empresas. Vendido por R$ 47, pagamento único, com tráfego pago.

## Estrutura
- `app/server.js`: API Express + Postgres (`pg`). Sessão por cookie assinado (HMAC, com `sessao_v` para derrubar sessões ao trocar senha), senha com scrypt assíncrono. Sem ORM.
- `app/gestao.js`: rotas da gestão (unidades = tabela `equipes`, funcionários, escalas, ocorrências, visão geral, fechamento, acessos, histórico, dados da empresa, `/api/onboarding`, `/api/contador`, link público `/e/:token`). Conta = empresa do dono; papel vem do cabeçalho `x-conta` (dono, gestor edita, contador só lê e baixa). Não existe integração externa/API: o contador usa o próprio app.
- `app/public/app.js`: todo o JS do app (primeiro acesso guiado, análise, espaço do contador, menu de celular).
- `app/public/ajuda.html`: ajuda e a lei (EC 141/2026, Lei 10.101, Lei 605/49, CLT, MEI). Atualizar se a lei mudar.
- `app/public/escala.html`: página do funcionário (link da equipe, só leitura, sem login).
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
- `deploy/hostinger/docker-compose.yml`: compose usado no Docker Manager da Hostinger (VPS 1969277, Traefik em modo host, dados em `/opt/escalalegal-dados`). Publicar = recriar o projeto `escalalegal` (vps_docker_create com o conteúdo deste arquivo) com `REF` = commit novo. O Docker Manager não faz build: o container baixa o código do GitHub no commit REF ao iniciar.
- `docker-compose.yml`: app + Postgres + backup diário (+ Caddy opcional). Deploy no VPS do Bruno em `/opt/escalalegal`.

## Regras de negócio
- Gerar escala exige `acesso_liberado` (pago). Compra aprovada no webhook (`POST /api/webhook/pagamento?token=WEBHOOK_TOKEN`) cria a conta sem senha e envia por e-mail o link `/app?acesso=TOKEN` para criar a senha (token guardado só como hash, uso único). Reembolso/chargeback bloqueia. Todo evento fica em `pagamentos_eventos`.
- Cadastro com e-mail de conta comprada e sem senha não cria conta: reenvia o link (evita sequestro da compra).
- Cada empresa só vê as próprias equipes (checar `req.conta.id` em toda rota de gestão; nunca `req.u.id`).
- Ocorrências (férias, atestado, falta, afastamento, folga extra, banco de horas) entram na geração e aparecem por cima da escala salva na leitura.
- Mês fechado (`fechamentos`) congela os números (snapshot) e bloqueia gerar/ajustar escala e lançar/apagar ocorrência no mês. Só o dono reabre. Fechar avisa os contadores por e-mail.
- Na interface é sempre "unidade" (loja, filial, setor); no banco continua `equipes`.
- A escala se adapta ao segmento (`SETORES` em `scheduler.js`: mercado, farmácia, loja, restaurante, padaria, salão, clínica, academia, posto, escritório, portaria, outro). Cada um traz dias, horário, mínimo, funções e `criticas` (função que não pode faltar no dia, ex.: farmacêutico — Lei 13.021/2014). O motor recebe `grupos` (quem tem o cargo da crítica) e garante o mínimo. Domingo: comércio 1 a cada 3 semanas (Lei 10.101), demais 1 a cada 7 (Portaria MTP 671/2021, art. 58). 12x36 não é gerada: só aviso.
- Dono sem unidade cai no primeiro acesso guiado (`#comecar`): empresa (porte MEI/ME/EPP, UF, cidade, feriados da cidade) → unidade (dias, mínimo, horas/dia) → pessoas → gera a escala e mostra a análise (`Escala.analisar`, em `scheduler.js`).
- Limite semanal pela data (`limiteSemanal`): 44h até 15/12/2026, 42h até 15/12/2027, 40h depois. Feriados: nacionais + estaduais (`ESTADUAIS`) + municipais informados pela empresa.
- Contador pode se cadastrar sozinho (`tipo: 'contador'`) e vê as empresas que o liberaram no Espaço do contador.

## Estilo
- Português do Brasil em toda a interface e na copy.
- Visual: branco, azul (#1351b4), verde (#168821), amarelo (#ffcd07), degradês no hero. Fontes Archivo (títulos) e Public Sans (texto). Mascote: Zé Folga (`app/public/img/mascote.svg`).
- O dono não quer nada com cara de IA: nada de ícones genéricos, copy curta e direta, fotos de pessoas reais quando houver.

## Rodar local
```bash
cd app && npm install
DATABASE_URL=postgres://... SESSION_SECRET=x ADMIN_PASS=x WEBHOOK_TOKEN=x LIBERAR_TUDO=1 node server.js
```
