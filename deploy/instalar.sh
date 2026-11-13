#!/usr/bin/env bash
# Instala (ou atualiza) o Escala Legal no VPS. Rode como root:
#
#   git clone https://github.com/imperioprogressivasoficial/escalalegal /opt/escalalegal
#   cd /opt/escalalegal && bash deploy/instalar.sh escala.seudominio.com.br
#
# O que ele faz:
#   1. Instala o Docker, se faltar
#   2. Cria o .env com senhas fortes (só na primeira vez; nunca sobrescreve)
#   3. Escolhe o HTTPS: usa o Traefik que já existir no VPS (ex.: o do n8n) ou sobe o Caddy
#   4. Sobe app + banco + backup diário e confere se respondeu
set -euo pipefail
cd "$(dirname "$0")/.."

verde() { printf '\033[1;32m%s\033[0m\n' "$*"; }
amarelo() { printf '\033[1;33m%s\033[0m\n' "$*"; }
vermelho() { printf '\033[1;31m%s\033[0m\n' "$*"; }

[ "$(id -u)" = 0 ] || { vermelho "Rode como root (sudo bash deploy/instalar.sh)"; exit 1; }

# ---------- 1. Docker ----------
if ! command -v docker >/dev/null 2>&1; then
  amarelo "Instalando o Docker..."
  curl -fsSL https://get.docker.com | sh
fi
docker compose version >/dev/null 2>&1 || { vermelho "O plugin 'docker compose' não está instalado."; exit 1; }

# ---------- 2. .env ----------
aleatorio() { tr -dc 'A-Za-z0-9' </dev/urandom | head -c "${1:-40}"; }
if [ ! -f .env ]; then
  DOMINIO="${1:-}"
  [ -n "$DOMINIO" ] || read -rp "Domínio do app (ex.: escala.seudominio.com.br): " DOMINIO
  [ -n "$DOMINIO" ] || { vermelho "Informe o domínio."; exit 1; }
  cp .env.example .env
  sed -i "s|^DOMAIN=.*|DOMAIN=$DOMINIO|" .env
  sed -i "s|^DB_PASS=.*|DB_PASS=$(aleatorio 32)|" .env
  sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=$(aleatorio 64)|" .env
  sed -i "s|^ADMIN_PASS=.*|ADMIN_PASS=$(aleatorio 20)|" .env
  sed -i "s|^WEBHOOK_TOKEN=.*|WEBHOOK_TOKEN=$(aleatorio 40)|" .env
  chmod 600 .env
  verde ".env criado com senhas novas."
fi
# lê do .env sem executar nada (valores podem ter espaço, como o SMTP_FROM)
le() { grep -E "^$1=" .env | tail -1 | cut -d= -f2- | sed -e 's/^["'"'"']//' -e 's/["'"'"']$//' || true; }
DOMAIN=$(le DOMAIN); APP_PORT=$(le APP_PORT); ADMIN_USER=$(le ADMIN_USER); ADMIN_PASS=$(le ADMIN_PASS)
WEBHOOK_TOKEN=$(le WEBHOOK_TOKEN); SMTP_HOST=$(le SMTP_HOST); CHECKOUT_URL=$(le CHECKOUT_URL)
[ -n "$DOMAIN" ] || { vermelho "DOMAIN vazio no .env"; exit 1; }
mkdir -p backups

# ---------- 3. HTTPS ----------
PERFIL=""
TRAEFIK=$(docker ps --format '{{.Names}} {{.Image}}' | awk 'tolower($2) ~ /traefik/ {print $1; exit}')
if [ -n "$TRAEFIK" ]; then
  REDE=$(docker inspect "$TRAEFIK" -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' | awk '{print $1}')
  ARGS=$(docker inspect "$TRAEFIK" -f '{{join .Args " "}} {{join .Config.Cmd " "}}')
  RESOLVER=$(grep -oE 'certificatesresolvers\.[A-Za-z0-9_-]+\.acme' <<<"$ARGS" | head -1 | cut -d. -f2 || true)
  ENTRY=$(grep -oE 'entrypoints\.[A-Za-z0-9_-]+\.address=:443' <<<"$ARGS" | head -1 | cut -d. -f2 || true)
  RESOLVER=${RESOLVER:-mytlschallenge}; ENTRY=${ENTRY:-websecure}
  amarelo "Traefik encontrado ($TRAEFIK). Rede: $REDE, entrada: $ENTRY, certificado: $RESOLVER"
  cat > docker-compose.override.yml <<EOF
# Gerado pelo deploy/instalar.sh: publica o app pelo Traefik que já roda no VPS
services:
  app:
    networks: [default, proxy]
    labels:
      - traefik.enable=true
      - traefik.docker.network=$REDE
      - traefik.http.routers.escalalegal.rule=Host(\`$DOMAIN\`)
      - traefik.http.routers.escalalegal.entrypoints=$ENTRY
      - traefik.http.routers.escalalegal.tls=true
      - traefik.http.routers.escalalegal.tls.certresolver=$RESOLVER
      - traefik.http.services.escalalegal.loadbalancer.server.port=3000
networks:
  proxy:
    external: true
    name: $REDE
EOF
elif ss -ltn '( sport = :80 or sport = :443 )' 2>/dev/null | grep -q LISTEN; then
  rm -f docker-compose.override.yml
  amarelo "As portas 80/443 já estão em uso por outro programa (Nginx?)."
  amarelo "O app vai rodar em 127.0.0.1:${APP_PORT:-3010}. Aponte o $DOMAIN do seu proxy para lá (com HTTPS)."
else
  rm -f docker-compose.override.yml
  PERFIL="--profile caddy"
  verde "Portas 80/443 livres: o Caddy vai gerar o HTTPS sozinho."
fi

# ---------- 4. Subir ----------
docker compose $PERFIL up -d --build --remove-orphans
docker image prune -f >/dev/null 2>&1 || true

printf 'Aguardando o app responder'
for i in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:${APP_PORT:-3010}/api/health" >/dev/null 2>&1; then echo; verde "App no ar."; break; fi
  printf '.'; sleep 3
  [ "$i" = 40 ] && { echo; vermelho "O app não respondeu. Veja: docker compose logs --tail=80 app"; exit 1; }
done

IP=$(curl -fsS -4 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')
DNS=$(getent ahostsv4 "$DOMAIN" | awk '{print $1; exit}' || true)
[ "$DNS" = "$IP" ] || amarelo "Atenção: $DOMAIN aponta para '${DNS:-nada}', mas o IP deste VPS é $IP. Crie/ajuste o registro A no DNS."

echo
verde "===== Escala Legal instalado ====="
echo "Site:            https://$DOMAIN"
echo "App:             https://$DOMAIN/app"
echo "Obrigado:        https://$DOMAIN/obrigado   (página pós-compra do checkout)"
echo "Admin:           https://$DOMAIN/admin   usuário: ${ADMIN_USER:-admin}   senha: $ADMIN_PASS"
echo "Webhook compra:  https://$DOMAIN/api/webhook/pagamento?token=$WEBHOOK_TOKEN"
[ -n "${SMTP_HOST:-}" ] || amarelo "Falta configurar o e-mail (SMTP_* no .env) para o acesso chegar sozinho ao comprador."
[ -n "${CHECKOUT_URL:-}" ] || amarelo "Falta o CHECKOUT_URL no .env (link de pagamento)."
echo "Depois de editar o .env, rode de novo: bash deploy/instalar.sh"
