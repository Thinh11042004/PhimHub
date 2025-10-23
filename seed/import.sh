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
: "${BACPAC_PATH:=/data/db.bacpac}"
: "${DROP_EXISTING:=true}"

if [ ! -f "$BACPAC_PATH" ]; then
  echo "[db-seed] BACPAC not found at $BACPAC_PATH"
  exit 0
fi

# Give SQL Server some time to start
if [ "$SLEEP_SECONDS" -gt 0 ]; then
  echo "[db-seed] Sleeping for $SLEEP_SECONDS seconds before starting import..."
  sleep "$SLEEP_SECONDS"
fi

# Optionally drop the existing DB to satisfy sqlpackage requirement for empty target
maybe_drop_db() {
  if [ "${DROP_EXISTING}" != "true" ]; then
    echo "[db-seed] DROP_EXISTING=false, will not drop target database if it exists."
    return 0
  fi

  echo "[db-seed] Ensuring target database '$DB_NAME' is empty by dropping if exists..."
  /usr/local/bin/sqlcmd -C -S "${DB_HOST},${DB_PORT}" -U "${DB_USER}" -P "${DB_PASS}" -b -Q "
    IF DB_ID(N'$DB_NAME') IS NOT NULL
    BEGIN
      ALTER DATABASE [$DB_NAME] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
      DROP DATABASE [$DB_NAME];
    END
  " && echo "[db-seed] Drop-if-exists completed (or database not present)." || {
    echo "[db-seed] Warning: drop-if-exists encountered an error, continuing...";
  }
}

attempt=1
while [ "$attempt" -le "$MAX_RETRIES" ]; do
  echo "[db-seed] Import attempt $attempt/$MAX_RETRIES"

  maybe_drop_db

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
