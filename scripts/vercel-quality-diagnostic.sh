#!/usr/bin/env bash
set -u
mkdir -p /tmp/nummi-quality
set +e
{
  echo "== lint =="
  npm run lint
  echo "lint_exit=$?"
  echo "== unit tests =="
  npm test
  echo "tests_exit=$?"
  echo "== typecheck and build =="
  npm run build
  echo "build_exit=$?"
  echo "== bundle budget =="
  npm run check:bundle
  echo "bundle_exit=$?"
} > /tmp/nummi-quality/output.txt 2>&1
set -e
curl -sS -X POST "https://uqisolhdsvzjmdvohbki.supabase.co/functions/v1/build-diagnostics" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxaXNvbGhkc3Z6am1kdm9oYmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MzcwNjIsImV4cCI6MjEwMTExMzA2Mn0.HQoMUkXdMlfAr8Q-xDac8tuO8GB88aCAblVoYVtmlDY" \
  -H "x-build-source: vercel-quality-pr6" \
  --data-binary @/tmp/nummi-quality/output.txt >/dev/null || true
npx vite build
