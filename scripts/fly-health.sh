#!/usr/bin/env bash
set -euo pipefail

APP="bookkeeping-jammy"

echo "Health check for $APP..."
echo ""
echo "=== Backend API ==="
curl -s "https://$APP.fly.dev/api/health" | python3 -m json.tool 2>/dev/null || curl -s "https://$APP.fly.dev/api/health"
echo ""
echo ""
echo "=== Full Health Page ==="
curl -s "https://$APP.fly.dev/health" | grep -oP '(?<=<span class="detail-value" id=")[^"]*">[^<]*' | sed 's/">/  /' || echo "(open https://$APP.fly.dev/health in browser)"
