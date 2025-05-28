#!/bin/bash

# Vercel Edge Network Deployment Script
# Generated automatically by CDN Manager

set -e

echo "🚀 Deploying to Vercel Edge Network..."

# Build the application
echo "📦 Building application..."
npm run build

# Optimize assets
echo "🔧 Optimizing assets..."
npm run optimize:assets

# Upload to CDN
echo "📤 Uploading to Vercel Edge Network..."


# Vercel deployment
npx vercel --prod --yes

# Configure edge functions
npx vercel env add CDN_PROVIDER vercel


# Purge cache
echo "🧹 Purging CDN cache..."

# Vercel automatic cache invalidation
echo "Vercel handles cache invalidation automatically"


# Verify deployment
echo "✅ Verifying deployment..."

# Test CDN endpoint
curl -I https://bookstore-directory.vercel.app

# Check cache headers
curl -I https://bookstore-directory.vercel.app/assets/css/main.css

# Verify image optimization
curl -I https://bookstore-directory.vercel.app/images/default-bookstore.jpg

# Test compression
curl -H "Accept-Encoding: gzip, br" -I https://bookstore-directory.vercel.app


echo "🎉 Deployment to Vercel Edge Network completed successfully!"
