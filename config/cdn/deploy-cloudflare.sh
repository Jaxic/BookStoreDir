#!/bin/bash

# Cloudflare Deployment Script
# Generated automatically by CDN Manager

set -e

echo "🚀 Deploying to Cloudflare..."

# Build the application
echo "📦 Building application..."
npm run build

# Optimize assets
echo "🔧 Optimizing assets..."
npm run optimize:assets

# Upload to CDN
echo "📤 Uploading to Cloudflare..."


# Cloudflare Pages deployment
npx wrangler pages publish dist --project-name=bookstore-directory

# Configure cache rules
npx wrangler pages deployment tail --project-name=bookstore-directory


# Purge cache
echo "🧹 Purging CDN cache..."

# Purge Cloudflare cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'


# Verify deployment
echo "✅ Verifying deployment..."

# Test CDN endpoint
curl -I https://cdn.bookstore-directory.com

# Check cache headers
curl -I https://cdn.bookstore-directory.com/assets/css/main.css

# Verify image optimization
curl -I https://cdn.bookstore-directory.com/images/default-bookstore.jpg

# Test compression
curl -H "Accept-Encoding: gzip, br" -I https://cdn.bookstore-directory.com


echo "🎉 Deployment to Cloudflare completed successfully!"
