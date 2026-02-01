#!/bin/sh
set -e

echo "🚀 Starting Songbird Frontend..."

if [ "$NODE_ENV" = "production" ]; then
  echo "📦 Production mode detected"

  if [ -f "/app/drizzle/meta/_journal.json" ]; then
    echo "🔄 Running database migrations..."
    cd /app
    npx drizzle-kit push || echo "⚠️  Migration warning (may be expected)"
  else
    echo "ℹ️  No migrations found, skipping..."
  fi
fi

echo "✅ Starting application..."
exec node server.js
