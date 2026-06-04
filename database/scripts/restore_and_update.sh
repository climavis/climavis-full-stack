#!/usr/bin/env bash
set -euo pipefail

# Restaura un snapshot de PostgreSQL y luego actualiza solo datos faltantes.
# Uso:
#   ./database/scripts/restore_and_update.sh /ruta/climavis_latest.dump
# Variables opcionales:
#   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS

DUMP_PATH="${1:-}"

if [[ -z "$DUMP_PATH" ]]; then
  echo "Uso: $0 /ruta/climavis_latest.dump"
  exit 1
fi

if [[ ! -f "$DUMP_PATH" ]]; then
  echo "Snapshot no encontrado: $DUMP_PATH"
  exit 1
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-climavis}"
DB_USER="${DB_USER:-climavis}"
DB_PASS="${DB_PASS:-climavis_secret}"

export PGPASSWORD="$DB_PASS"

echo "[1/2] Restaurando snapshot en ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
pg_restore \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --clean \
  --if-exists \
  "$DUMP_PATH"

echo "[2/2] Actualizando datos desde la última fecha disponible"
python database/scripts/import_historico.py --only-latest

echo "Listo: BD restaurada y actualizada."