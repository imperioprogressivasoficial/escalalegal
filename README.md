# Escala Legal — gerador de escala 5x2

- `/`: página de vendas (R$ 47).
- `/app`: o app. A empresa monta equipes e funcionários, gera a escala 5x2, ajusta com um clique, imprime e copia para o WhatsApp.
- `/obrigado`: página pós-compra (configure no checkout como "página de obrigado").
- `/admin`: painel com clientes, liberação manual, link de acesso para mandar no WhatsApp e histórico de pagamentos.

## O que o sistema faz

| Quem | O que faz |
|---|---|
| **Dono** | Tudo: unidades, pessoas, escalas, férias/faltas/atestados, fechamento do mês, contador e gestores, dados da empresa. |
| **Gestor** | Monta escalas, cadastra funcionários, lança ocorrências e fecha o mês. Não mexe em acessos nem configurações. |
| **Contador** | Conta própria e grátis. Vê as empresas que o liberaram, sem alterar nada. Baixa a planilha do fechamento e recebe e-mail quando o mês é fechado. |
| **Funcionário** | Abre o link da equipe (sem login), escolhe o nome e vê as próprias folgas das próximas semanas. |

Ligação com a contabilidade: o contador entra no próprio app (Espaço do contador), vê todas as empresas que o liberaram, as escalas, férias e faltas, e o fechamento do mês (dias trabalhados, folgas, domingos e feriados trabalhados, faltas, atestados, férias, banco de horas, dia a dia), com planilha para baixar. Quando a empresa fecha o mês, ele recebe e-mail.

Primeiro acesso guiado: quem paga entra, responde 3 perguntas (empresa, local, pessoas) e sai com a escala de 4 semanas pronta e uma análise em linguagem simples. Ajuda completa sobre a lei em `/ajuda`.

## Como o acesso chega ao cliente

1. A pessoa paga no checkout.
2. A plataforma chama o webhook `/api/webhook/pagamento`.
3. O app cria a conta já liberada e manda um e-mail com o link **Criar minha senha** (o link vale 30 dias).
4. A pessoa cria a senha e já cai dentro do app.

Outros casos:

- **Reembolso ou chargeback:** o acesso é bloqueado sozinho.
- **Boleto gerado, Pix pendente ou cartão recusado:** o evento fica registrado e nada é liberado.
- **Pessoa que já tinha conta:** o gerador é liberado na conta dela e ela recebe um aviso por e-mail.
- **Esqueceu a senha:** usa o link "Esqueci minha senha" no login.
- **Pagou por fora (Pix direto, cortesia):** use "Liberar acesso na mão" no `/admin`.

O webhook entende **Kiwify, Hotmart, Eduzz, Cakto, Ticto, Clickmax** e qualquer JSON com `email`, sem configurar nada. Se o `N8N_WEBHOOK_URL` estiver preenchido, cada compra também vai para o n8n com o link de acesso, para mandar no WhatsApp.

## Publicar no VPS (primeira vez)

1. **DNS:** crie um registro **A** do domínio (ex.: `escala.seudominio.com.br`) apontando para o IP do VPS.
2. **No VPS, como root**, rode:
   ```bash
   git clone https://github.com/imperioprogressivasoficial/escalalegal /opt/escalalegal
   cd /opt/escalalegal && bash deploy/instalar.sh escala.seudominio.com.br
   ```
   O script instala o Docker se faltar e cria o `.env` com senhas fortes. Depois sobe app, banco e backup diário.

   Ele também escolhe sozinho como ligar o HTTPS:
   - **Já existe um Traefik no VPS** (ex.: o do n8n): publica o app por ele.
   - **As portas 80 e 443 estão livres:** sobe o Caddy, que gera o certificado sozinho.
   - **Outro proxy (Nginx) usa as portas:** avisa para você apontar o domínio para `127.0.0.1:3010`.

   No final, ele mostra a senha do `/admin` e a URL do webhook.
3. **Complete o `.env`** (`nano /opt/escalalegal/.env`):
   - `CHECKOUT_URL`: link do pagamento.
   - `SMTP_*`: e-mail que entrega o acesso. Na Hostinger: `smtp.hostinger.com`, porta `465`, com o e-mail e a senha da caixa.
   - `SUPORTE_WHATSAPP`: ex.: `5571999999999`.

   Depois rode de novo `bash deploy/instalar.sh`.
4. **Na plataforma de pagamento:**
   - **Webhook de vendas:** cole a URL que o instalador mostrou (`https://SEU_DOMINIO/api/webhook/pagamento?token=...`). Marque os eventos de compra aprovada, reembolso e chargeback.
   - **Página de obrigado:** `https://SEU_DOMINIO/obrigado`.
5. **Teste a liberação sem pagar:**
   ```bash
   curl -X POST "https://SEU_DOMINIO/api/webhook/pagamento?token=SEU_TOKEN" \
     -H 'Content-Type: application/json' -d '{"email":"seu-email@gmail.com","nome":"Teste"}'
   ```
   O e-mail deve chegar com o link. O evento aparece no `/admin`.

## Atualizar

```bash
bash /opt/escalalegal/deploy/atualizar.sh
```

O script baixa a versão nova do GitHub e reinicia sem perder dados.

**Deploy automático (recomendado):** em GitHub › Settings › Secrets and variables › Actions, crie os secrets `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` e `ADMIN_PASS`, e a variável `VPS_DOMINIO`. Todo push na `main` que passar nos testes é publicado sozinho. Na primeira vez, ele mesmo clona e instala em `/opt/escalalegal`. Os segredos nunca aparecem no log, que é público.

## Manutenção

```bash
cd /opt/escalalegal
docker compose ps                     # status (app e db devem estar "healthy")
docker compose logs -f --tail=100 app # logs
ls backups/                           # backups diários, guardados por 14 dias
# restaurar um backup:
gunzip -c backups/escala-AAAA-MM-DD_HHMM.sql.gz | docker compose exec -T db psql -U escala escala
```

Copie a pasta `backups/` para fora do VPS de vez em quando (Google Drive, outro servidor).

## Capacidade

Teste de carga numa máquina comum:

- **100 clientes ao mesmo tempo** fizeram tudo em paralelo, sem erro, em 1,5 s: comprar, criar senha, cadastrar 15 funcionários e gerar escala de 8 semanas.
- **Com 100 conexões simultâneas:** cerca de 1.500 escalas geradas por segundo e 2.500 leituras por segundo.

Um VPS de 1 vCPU e 2 GB aguenta com folga.

## Rodar local e testes

```bash
cd app && npm install
DATABASE_URL=postgres://... SESSION_SECRET=x ADMIN_PASS=x WEBHOOK_TOKEN=x LIBERAR_TUDO=1 node server.js
DATABASE_URL=postgres://... npm test   # unidade + fluxo completo compra→senha→escala→reembolso
```

Sem SMTP configurado, os e-mails aparecem no log do app (com o link).
