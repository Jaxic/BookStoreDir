#!/bin/bash

# AWS CloudFront Deployment Script
# Generated automatically by CDN Manager

set -e

echo "🚀 Deploying to AWS CloudFront..."

# Build the application
echo "📦 Building application..."
npm run build

# Optimize assets
echo "🔧 Optimizing assets..."
npm run optimize:assets

# Upload to CDN
echo "📤 Uploading to AWS CloudFront..."


# AWS S3 upload
aws s3 sync dist/ s3://bookstore-directory-bucket --delete --cache-control "max-age=31536000"

# CloudFront invalidation
aws cloudfront create-invalidation --distribution-id E1234567890 --paths "/*"


# Purge cache
echo "🧹 Purging CDN cache..."

# CloudFront cache invalidation
aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} --paths "/*"


# Verify deployment
echo "✅ Verifying deployment..."

# Test CDN endpoint
curl -I https://d1234567890.cloudfront.net

# Check cache headers
curl -I https://d1234567890.cloudfront.net/assets/css/main.css

# Verify image optimization
curl -I https://d1234567890.cloudfront.net/images/default-bookstore.jpg

# Test compression
curl -H "Accept-Encoding: gzip, br" -I https://d1234567890.cloudfront.net


echo "🎉 Deployment to AWS CloudFront completed successfully!"
