#!/usr/bin/env bash
# Princípio XII: dados simulados nunca chegam à produção.
# Falha se o build de produção do front-end contiver o MSW ou o service worker dele.
set -euo pipefail

DIST="${1:-apps/web/dist}"

if [ ! -d "$DIST" ]; then
  echo "Build não encontrado em $DIST. Rode 'make build-web' antes." >&2
  exit 2
fi

# Padrões específicos do MSW (não só "msw", que pode aparecer por acaso num hash de nome de arquivo).
PADROES=(-e 'mockServiceWorker' -e '\[MSW\]' -e 'msw/browser' -e 'setupWorker')

if grep -rIl "${PADROES[@]}" "$DIST" >/dev/null 2>&1 \
  || find "$DIST" -name 'mockServiceWorker.js' | grep -q .; then
  echo "ERRO: o build de produção contém código de dados simulados (MSW):" >&2
  grep -rIl "${PADROES[@]}" "$DIST" >&2 || true
  find "$DIST" -name 'mockServiceWorker.js' >&2
  exit 1
fi

echo "OK: nenhum dado simulado no build de produção ($DIST)."
