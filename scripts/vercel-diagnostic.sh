#!/usr/bin/env bash
set -u
mkdir -p /tmp/nummi-build
set +e
npx tsc --noEmit > /tmp/nummi-build/tsc.txt 2>&1
set -e
curl -sS -X POST "https://uqisolhdsvzjmdvohbki.supabase.co/functions/v1/build-diagnostics" \
  -H "x-build-token: 3Tj2ycUpB4QYHtbogvCJMnQh7hjNJAh80KvK55DFpvw" \
  -H "x-build-source: vercel-pr6" \
  --data-binary @/tmp/nummi-build/tsc.txt >/dev/null || true
npx vite build
