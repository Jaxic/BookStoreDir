#!/bin/bash

# CDN Performance Testing Script

set -e

PROVIDER=${1:-cloudflare}
ENDPOINT=$(cat config/cdn/$PROVIDER.json | grep '"endpoint"' | cut -d'"' -f4)

echo "🔍 Testing CDN performance for $PROVIDER..."
echo "Endpoint: $ENDPOINT"

# Test page load times
echo "📊 Testing page load times..."
curl -w "@config/cdn/curl-format.txt" -o /dev/null -s "$ENDPOINT"

# Test asset delivery
echo "📦 Testing asset delivery..."
curl -w "@config/cdn/curl-format.txt" -o /dev/null -s "$ENDPOINT/assets/css/main.css"

# Test image optimization
echo "🖼️ Testing image optimization..."
curl -w "@config/cdn/curl-format.txt" -o /dev/null -s "$ENDPOINT/images/default-bookstore.jpg"

echo "✅ Performance testing completed!"
