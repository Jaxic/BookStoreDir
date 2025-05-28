#!/bin/bash

# Main CDN Deployment Script
# Deploys to the active CDN provider

set -e

PROVIDER=${1:-cloudflare}

echo "🚀 Starting CDN deployment to $PROVIDER..."

# Validate provider
if [ ! -f "config/cdn/$PROVIDER.json" ]; then
  echo "❌ Provider configuration not found: $PROVIDER"
  echo "Available providers:"
  ls config/cdn/*.json | sed 's/.*\/\([^.]*\).json/  - \1/'
  exit 1
fi

# Load configuration
echo "📋 Loading $PROVIDER configuration..."
CONFIG=$(cat config/cdn/$PROVIDER.json)

# Run provider-specific deployment
echo "🔄 Running $PROVIDER deployment..."
bash config/cdn/deploy-$PROVIDER.sh

echo "✅ CDN deployment completed successfully!"
