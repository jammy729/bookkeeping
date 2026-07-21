#!/usr/bin/env bash
set -euo pipefail

APP="bookkeeping-jammy"

echo "Connecting to $APP..."
fly ssh console -a "$APP"
