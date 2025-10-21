#!/usr/bin/env bash
set -euo pipefail

: "${DB_HOST:=sqlserver}"
: "${DB_PORT:=1433}"
: "${DB_USER:=sa}"
: "${DB_PASS:=PhimHub123!}"
: "${DB_NAME:=PhimHub}"
: "${SLEEP_SECONDS:=10}"
: "${MAX_RETRIES:=40}"
: "${RETRY_DELAY:=5}"

BACPAC_PATH="/data/db.bacpac"

if [ ! -f "$BACPAC_PATH" ]; then
  echo "[db-seed] BACPAC not found at $BACPAC_PATH"
  exit 0
fi

# Give SQL Server some time to start
if [ "$SLEEP_SECONDS" -gt 0 ]; then
  echo "[db-seed] Sleeping for $SLEEP_SECONDS seconds before starting import..."
  sleep "$SLEEP_SECONDS"
fi

attempt=1
while [ "$attempt" -le "$MAX_RETRIES" ]; do
  echo "[db-seed] Import attempt $attempt/$MAX_RETRIES"
  if sqlpackage \
    /Action:Import \
    /SourceFile:"$BACPAC_PATH" \
    /TargetServerName:"${DB_HOST},${DB_PORT}" \
    /TargetDatabaseName:"${DB_NAME}" \
    /TargetUser:"${DB_USER}" \
    /TargetPassword:"${DB_PASS}" \
    /TargetTrustServerCertificate:True \
    /Diagnostics:True; then
    echo "[db-seed] Import finished successfully."
    exit 0
  fi

  echo "[db-seed] Import failed. Retrying in ${RETRY_DELAY}s..."
  sleep "$RETRY_DELAY"
  attempt=$((attempt + 1))

done

echo "[db-seed] Reached max retries ($MAX_RETRIES). Continuing without blocking the stack."
exit 0
