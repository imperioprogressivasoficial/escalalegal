# Sua Escala 5x2

SaaS que gera a escala 5x2 (EC 141/2026, fim da 6x1) para empresas. Vendido por R$ 97, com tráfego pago.

## Estrutura
- `app/server.js`: API Express + Postgres (`pg`). Sessão por cookie assinado (HMAC, com `sessao_v` para derrubar sessões ao trocar senha), senha com scrypt assíncrono. Sem ORM.
- `app/gestao.js`: rotas da gestão (unidades = tabela `equipes`, funcionários, escalas, ocorrências, visão geral, fechamento, acessos, histórico, dados da empresa, `/api/onboarding`, `/api/contador`, link público `/e/:token`). Conta = empresa do dono; papel vem do cabeçalho `x-conta` (dono, gestor edita, contador só lê e baixa). Não existe integração externa/API: o contador usa o próprio app.
- `app/public/app.js`: todo o JS do app. Mecanismo único: a tela principal é a semana (quem trabalha, quem folga, quem não vem). Toca no nome → troca a folga ou lança falta/atestado/férias. Barra de baixo: Escala | Equipe | Mais. Primeiro acesso em formato de quiz: uma pergunta por tela (negócio, nome, estado, cidade, porte, dias, horário, mínimo, pessoas e, se o segmento exigir, quem tem a função obrigatória).
- Escala sem botão "Gerar": `GET /api/equipes/:id/semana` monta sozinha a semana que não tem escala e refaz as semanas futuras quando a equipe ou o funcionamento muda (a semana em curso nunca é refeita sozinha). Férias/afastamento chamam `POST /api/equipes/:id/refazer`.
- `app/public/ajuda.html`: ajuda e a lei (EC 141/2026, Lei 10.101, Lei 605/49, CLT, MEI). Atualizar se a lei mudar.
- `app/public/escala.html`: página do funcionário (link da equipe, só leitura, sem login).
- `app/seguranca.js`: cabeçalhos (CSP com Google Fonts, rastreio e vturb; `frame-ancestors 'none'`, HSTS em produção), bloqueio de copiadores de página (HTTrack, Wget, Scrapy... só nas páginas; curl e buscadores liberados), imagens barradas quando puxadas por outro domínio, Origin conferido em todo POST/PUT/PATCH/DELETE da API (menos o webhook) e `/api/leads` só do nosso domínio, e o guarda anticlone (script no `<head>` e no `/rastreio.js`: fora do DOMAIN/`DOMINIOS_PERMITIDOS` manda para o site real levando `ind`/utm) com marca d'água (`data-se`). Ao incluir um serviço externo novo na página, libere o domínio na CSP.
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

- `app/public/exportar.js`: a tabela pronta (`#tabela`) e as saídas: WhatsApp (imagem), PDF, Excel .xlsx, CSV, Google Planilhas (`=IMPORTDATA` do link `/api/publico/planilha/:token`), JPG, texto, link da equipe, imprimir. Tudo gerado no aparelho, sem biblioteca.
- `app/public/aula.js`: aula da nova lei (`#aula`), 8 lições com exemplo e teste rápido.
- `app/public/extras.js`: colocar na tela inicial (PWA: `manifest.webmanifest`, `sw.js`, `#instalar`), Indique para quem conhece (`#indique`) e cadastrar outra empresa.
- Logos dos formatos em `app/public/img/formatos/`: logos oficiais baixados do Wikimedia Commons (WhatsApp, Adobe Acrobat para PDF, Excel 2025, Google Planilhas, Google Fotos para imagem); CSV, link, texto, imprimir e tela inicial são desenhos próprios. Prints do app na página de vendas sempre dentro das molduras oficiais da Apple (Apple Design Resources: iPhone 17 Pro Cosmic Orange e MacBook Pro M5 14" Space Black), em `img/iphone-*.webp` e `img/mac-*.webp`.
- `app/site.js`: site público. Injeta no `<!--HEAD-->` de index/ajuda/privacidade/termos/obrigado: canonical, Open Graph (`img/og.png`), Twitter, verificação Google/Meta e JSON-LD (SoftwareApplication, Organization, FAQPage tirado dos `<details>`). Troca `{{EMPRESA_*}}`, `{{CONTATO}}`, `{{PRECO}}`, `{{ANO}}`. Serve `robots.txt`, `sitemap.xml`, `llms.txt`, `/rastreio.js` (Meta Pixel, GA4, GTM só depois do "Aceitar" no aviso de cookies; modo de consentimento do Google começa negado; `window.rastrear(evento)`), a compra pela API de Conversões da Meta (`META_CAPI_TOKEN`) e a página 404.
- Prints das notícias reais da EC 141/2026 em `app/public/img/noticias/` (carrossel com 3 notícias na seção `#noticias` da página de vendas, com link para a fonte). A regra vale a partir de 15/12/2026 (Agência Brasil); 40h a partir de 15/12/2027.
- `app/public/privacidade.html` e `termos.html` (reembolso em `#reembolso`, regras da indicação em `#indique`).
- `marketing/video/`: vídeo em motion (Reels) e o projeto para gerar de novo.

## Regras de negócio
- Gerar escala exige `acesso_liberado` (pago). Compra aprovada no webhook (`POST /api/webhook/pagamento?token=WEBHOOK_TOKEN`) cria a conta sem senha e envia por e-mail o link `/app?acesso=TOKEN` para criar a senha (token guardado só como hash, uso único). Reembolso/chargeback bloqueia. Todo evento fica em `pagamentos_eventos`.
- Cadastro com e-mail de conta comprada e sem senha não cria conta: reenvia o link (evita sequestro da compra).
- Convite de acesso só devolve o link de criar senha quando a conta nasceu naquele convite; conta que já existia recebe só por e-mail.
- Login: 8 senhas erradas por e-mail (ou 30 por IP) em 15 min travam por 15 min; /admin trava o IP depois de 10 erros.
- Cada empresa só vê as próprias equipes (checar `req.conta.id` em toda rota de gestão; nunca `req.u.id`).
- Ocorrências (férias, atestado, falta, afastamento, folga extra, banco de horas) entram na geração e aparecem por cima da escala salva na leitura.
- Mês fechado (`fechamentos`) congela os números (snapshot) e bloqueia gerar/ajustar escala e lançar/apagar ocorrência no mês. Só o dono reabre. Fechar avisa os contadores por e-mail.
- Na interface é sempre "unidade" (loja, filial, setor); no banco continua `equipes`.
- A escala se adapta ao segmento (`SETORES` em `scheduler.js`: mercado, farmácia, loja, restaurante, padaria, salão, clínica, academia, posto, escritório, portaria, outro). Cada um traz dias, horário, mínimo, funções e `criticas` (função que não pode faltar no dia, ex.: farmacêutico — Lei 13.021/2014). O motor recebe `grupos` (quem tem o cargo da crítica) e garante o mínimo. Domingo: comércio 1 a cada 3 semanas (Lei 10.101), demais 1 a cada 7 (Portaria MTP 671/2021, art. 58). 12x36 não é gerada: só aviso.
- Dono sem unidade cai no primeiro acesso guiado (`#comecar`): empresa (porte MEI/ME/EPP, UF, cidade, feriados da cidade) → unidade (dias, mínimo, horas/dia) → pessoas → gera a escala e mostra a análise (`Escala.analisar`, em `scheduler.js`).
- Limite semanal pela data (`limiteSemanal`): 44h até 14/12/2026, 42h de 15/12/2026 a 14/12/2027, 40h a partir de 15/12/2027. Feriados: nacionais + estaduais (`ESTADUAIS`) + municipais informados pela empresa.
- Várias empresas na mesma conta: empresa extra = usuário sem login (`origem='empresa_extra'`, e-mail `@empresa.invalid`) e quem criou entra como `membros.papel='dono'`; vale o acesso pago de quem criou. Não aparece no /admin.
- Indique para quem conhece: cada cliente tem `usuarios.ref_codigo` e o link `/?ind=CODIGO` para mandar a outros empresários. Sem comissão (`COMISSAO_PERCENT=0`); o link só registra quem indicou (`leads.ref`, `usuarios.indicado_por`). O mecanismo de comissão (`comissoes`, /admin) continua no código, desligado.
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
