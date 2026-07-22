#!/usr/bin/env bash
set -euo pipefail

echo "=== Neon Database Setup ==="
echo ""
echo "1. Go to https://neon.tech and sign up (free)"
echo "2. Create a new project (any name, e.g. 'bookkeeping')"
echo "3. Copy the connection string from the dashboard"
echo "   It looks like: postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/bookkeeping?sslmode=require"
echo ""
echo "4. In Render dashboard (https://dashboard.render.com):"
echo "   - Go to your bookkeeping-api service"
echo "   - Go to Environment tab"
echo "   - Add env var: DATABASE_URL = <your neon connection string>"
echo "   - Add env var: FRONTEND_URL = <your vercel url, e.g. https://bookkeeping.vercel.app>"
echo ""
echo "5. Redeploy the Render service"
echo ""
echo "Done! Your app is now live."
