#!/bin/bash

# Production cleanup script for pm2 environment
# This script inherits environment variables from the pm2 process

echo "🚀 Starting Production Cleanup Script..."
echo "📊 Environment Check:"
echo "  NODE_ENV: ${NODE_ENV:-not set}"
echo "  STRAPI_API_TOKEN: ${STRAPI_API_TOKEN:0:20}... (${#STRAPI_API_TOKEN} chars)"
echo "  PUBLIC_URL: ${PUBLIC_URL:-not set}"

# Check if we're running under pm2
if [ -n "$PM2_HOME" ]; then
    echo "  PM2 detected: YES"
else
    echo "  PM2 detected: NO"
fi

echo ""
echo "🔍 Running environment debug first..."
node scripts/debug-production-env.js

echo ""
echo "🧹 Running production cleanup..."
node scripts/production-cleanup.js

echo ""
echo "✅ Production cleanup script completed!" 