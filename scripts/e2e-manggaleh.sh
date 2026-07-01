#!/usr/bin/env bash
# Run the e2e suite DIRECTLY against a live manggaleh tenant (no mock fallback).
#
# Loads ./.env.e2e if present (tenant, publishable key, test accounts, and — for
# the stateful specs — MANGGALEH_SERVICE_KEY). Then routes the browser's API
# calls through the localhost relay so they reach manggaleh even from a
# restricted-egress sandbox (harmless in a normal environment).
#
#   cp .env.e2e.example .env.e2e   # fill in, then:
#   npm run test:e2e:manggaleh     # or: bash scripts/e2e-manggaleh.sh <files…>
set -euo pipefail

[ -f .env.e2e ] && { set -a; . ./.env.e2e; set +a; }

: "${VITE_MANGGALEH_TENANT:?set VITE_MANGGALEH_TENANT (e.g. realief-expert)}"
: "${VITE_MANGGALEH_API_KEY:?set VITE_MANGGALEH_API_KEY (publishable key mgpk_…)}"

export VITE_USE_MANGGALEH=true
export VITE_MANGGALEH_ENV="${VITE_MANGGALEH_ENV:-dev}"

# Point the app at the relay; the relay forwards to the real API.
RELAY_PORT="${E2E_RELAY_PORT:-8788}"
export E2E_RELAY_TARGET="${VITE_MANGGALEH_BASE_URL:-https://api.manggaleh.com}"
export VITE_MANGGALEH_BASE_URL="http://localhost:${RELAY_PORT}"

if ! curl -sf -o /dev/null "http://127.0.0.1:${RELAY_PORT}/"; then
  echo "starting manggaleh relay on :${RELAY_PORT} -> ${E2E_RELAY_TARGET}"
  setsid node scripts/e2e-manggaleh-relay.mjs >/tmp/e2e-manggaleh-relay.log 2>&1 &
  sleep 1
fi

echo "running e2e against manggaleh tenant '${VITE_MANGGALEH_TENANT}/${VITE_MANGGALEH_ENV}'"
exec npx playwright test "$@"
