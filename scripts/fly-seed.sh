#!/usr/bin/env bash
set -euo pipefail

APP="bookkeeping-jammy"

echo "Seeding database on $APP..."
fly ssh console -a "$APP" -C "/bin/sh -c 'cd /app/backend && node dist/seed.js'"
echo ""
echo "Done! Seed created test user: test@example.com / Test123!"
