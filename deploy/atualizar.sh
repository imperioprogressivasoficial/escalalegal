#!/usr/bin/env bash
# Baixa a versão nova do GitHub e reinicia sem perder dados. Rode no VPS:
#   bash /opt/escalalegal/deploy/atualizar.sh
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only
exec bash deploy/instalar.sh
