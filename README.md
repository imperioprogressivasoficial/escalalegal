# Escala Legal — gerador de escala 5x2

Pacote para o VPS com três partes:

- `/`: página de vendas (R$ 47).
- `/app`: o app web. A empresa cria a conta, cadastra equipes e funcionários, gera a escala 5x2, ajusta com um clique, imprime e copia para o WhatsApp.
- `/admin`: painel com os clientes. Daqui você libera ou bloqueia o acesso na mão.

O gerador só funciona para contas com **acesso liberado**, ou seja, depois do pagamento.

## Subir no VPS

1. No DNS, crie um registro **A** do subdomínio apontando para o IP do VPS.
2. Envie a pasta e configure:
   ```bash
   scp escala-legal.zip root@SEU_IP:/opt/ && ssh root@SEU_IP
   cd /opt && unzip escala-legal.zip && cd escala5x2
   cp .env.example .env && nano .env   # domínio, senhas, token e link do checkout
   ```
3. Suba os serviços:
   - **O VPS já tem proxy (Traefik ou Nginx do n8n):** rode `docker compose up -d --build` e aponte o proxy para `127.0.0.1:3010`. O HTTPS é obrigatório, porque o login usa cookie seguro.
   - **As portas 80 e 443 estão livres:** rode `docker compose --profile caddy up -d --build`. O Caddy gera o HTTPS sozinho.
4. Teste:
   - `https://SEU_DOMINIO/api/health` deve responder `{"ok":true}`.
   - `https://SEU_DOMINIO/app` deve abrir a tela de criar conta.

## Liberar o acesso depois do pagamento

Configure no checkout (ou num fluxo do n8n) um webhook de **compra aprovada** para:

```
POST https://SEU_DOMINIO/api/webhook/pagamento?token=SEU_WEBHOOK_TOKEN
{ "email": "email-do-comprador@exemplo.com" }
```

O webhook também entende os formatos `buyer.email`, `customer.email` e `data.buyer.email`.

- Se a pessoa já tem conta, o acesso é liberado na hora.
- Se ainda não tem, a compra fica registrada. Quando ela criar a conta com o mesmo e-mail, o acesso já vem liberado.

Mande o comprador para `https://SEU_DOMINIO/app?cadastro` na página de obrigado e no e-mail de acesso.

Para testar sem pagamento, use `LIBERAR_TUDO=1` no `.env`. Volte para `0` antes de vender.

## Manutenção

```bash
docker compose logs -f app                                     # logs
docker compose exec db pg_dump -U escala escala > backup.sql   # backup
docker compose up -d --build                                   # atualizar depois de trocar arquivos
```

As fotos de pessoas da página de vendas ainda são espaços reservados, marcados com `class="foto"` em `app/public/index.html`. Para trocar, coloque um `<img src="/img/arquivo.jpg" alt="...">` no lugar do `<span>`.
