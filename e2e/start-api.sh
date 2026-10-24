#!/bin/sh
# Fresh database + Worker for the end-to-end tests.
set -e
cd "$(dirname "$0")/.."
STATE=worker/.wrangler-e2e
rm -rf "$STATE"
npx wrangler d1 migrations apply alerta --local --config worker/wrangler.e2e.toml --persist-to "$STATE" > /dev/null
JWKS=$(node -e "console.log(JSON.stringify(require('./e2e/google-test-key.json').jwks))")
exec npx wrangler dev --config worker/wrangler.e2e.toml --port 8790 --persist-to "$STATE" \
  --var "APP_URL:http://localhost:4180" --var "GOOGLE_TEST_JWKS:$JWKS"
