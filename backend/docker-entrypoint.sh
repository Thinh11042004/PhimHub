#!/bin/sh
set -e

# Force install if requested
if [ "${FORCE_NPM_INSTALL}" = "true" ]; then
  echo "FORCE_NPM_INSTALL=true -> reinstalling production dependencies..."
  if [ -f package-lock.json ]; then
    npm ci --omit=dev --no-audit --no-fund
  else
    npm install --omit=dev --no-audit --no-fund
  fi
fi

# If node_modules absent, install (production only)
if [ ! -d ./node_modules ] || [ ! -d ./node_modules/.bin ]; then
  echo "node_modules not found, installing production dependencies..."
  if [ -f package-lock.json ]; then
    npm ci --omit=dev --no-audit --no-fund
  else
    npm install --omit=dev --no-audit --no-fund
  fi
fi

# Run auto-import in background if enabled
if [ "${AUTO_IMPORT}" = "true" ]; then
  echo "🚀 Auto-import enabled, starting background import process..."
  chmod +x scripts/auto-import.sh
  scripts/auto-import.sh &
fi

# Start the app
exec node dist/index.js