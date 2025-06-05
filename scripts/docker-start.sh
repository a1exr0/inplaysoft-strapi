#!/bin/sh

# Docker startup script with database optimization
set -e

echo "🐳 Starting Strapi in Docker..."

# Load production environment variables if .env.production exists
if [ -f ".env.production" ]; then
    echo "📋 Loading production environment variables..."
    export $(grep -v '^#' .env.production | xargs)
fi

# Ensure NODE_ENV is set to production
export NODE_ENV=production
echo "🌍 Environment: $NODE_ENV"

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
for i in $(seq 1 30); do
  if node -e "
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
    pool.query('SELECT 1').then(() => {
      console.log('Database connected');
      process.exit(0);
    }).catch(() => {
      process.exit(1);
    });
  " 2>/dev/null; then
    echo "✅ Database is ready!"
    break
  fi
  
  if [ $i -eq 30 ]; then
    echo "❌ Database connection timeout after 30 attempts"
    exit 1
  fi
  
  echo "⏳ Attempt $i/30 - Database not ready, waiting 2 seconds..."
  sleep 2
done

# Apply database optimizations (only on first run or when FORCE_OPTIMIZE=true)
if [ "$FORCE_OPTIMIZE" = "true" ] || [ ! -f "/app/.optimization-applied" ]; then
    echo "🔧 Applying database optimizations..."
    
    if node scripts/optimize-database.js; then
        echo "✅ Database optimization completed successfully!"
        touch /app/.optimization-applied
    else
        echo "⚠️ Database optimization failed, but continuing startup..."
    fi
else
    echo "⏭️ Database optimizations already applied (use FORCE_OPTIMIZE=true to reapply)"
fi

# Start Strapi
echo "🚀 Starting Strapi application..."
exec npm start 