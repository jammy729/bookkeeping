#!/usr/bin/env bash
set -euo pipefail

APP="bookkeeping-jammy"
BRANCH="${1:-main}"

echo "Deploying $BRANCH to $APP..."
GIT_COMMIT=$(git rev-parse --short HEAD)
echo "Commit: $GIT_COMMIT"

fly deploy --remote-only --build-arg GIT_COMMIT="$GIT_COMMIT" -a "$APP"

echo ""
echo "Deployed! Checking health..."
sleep 5
curl -s "https://$APP.fly.dev/api/health" | python3 -m json.tool 2>/dev/null || curl -s "https://$APP.fly.dev/api/health"
