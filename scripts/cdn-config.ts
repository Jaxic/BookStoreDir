#!/usr/bin/env node

/**
 * CDN Configuration and Management System
 * 
 * This script provides comprehensive CDN configuration for the BookStore Directory application.
 * It supports multiple CDN providers and optimizes content delivery for better performance.
 */

import * as fs from 'fs';
import * as path from 'path';

interface CDNProvider {
  name: string;
  endpoint: string;
  regions: string[];
  features: string[];
  config: CDNConfig;
}

interface CDNConfig {
  // Cache settings
  cache: {
    static: {
      ttl: number; // Time to live in seconds
      headers: Record<string, string>;
    };
    dynamic: {
      ttl: number;
      headers: Record<string, string>;
    };
    images: {
      ttl: number;
      headers: Record<string, string>;
      optimization: {
        webp: boolean;
        avif: boolean;
        quality: number;
        progressive: boolean;
      };
    };
  };
  
  // Compression settings
  compression: {
    gzip: boolean;
    brotli: boolean;
    minLevel: number;
    types: string[];
  };
  
  // Security settings
  security: {
    https: boolean;
    hsts: boolean;
    cors: {
      enabled: boolean;
      origins: string[];
      methods: string[];
    };
  };
  
  // Performance settings
  performance: {
    http2: boolean;
    http3: boolean;
    prefetch: boolean;
    preload: string[];
  };
}

class CDNManager {
  private providers: Map<string, CDNProvider> = new Map();
  private activeProvider: string = 'cloudflare';
  private buildPath: string = './dist';
  
  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize CDN provider configurations
   */
  private initializeProviders(): void {
    // Cloudflare CDN Configuration
    this.providers.set('cloudflare', {
      name: 'Cloudflare',
      endpoint: 'https://cdn.bookstore-directory.com',
      regions: ['global'],
      features: ['edge-caching', 'image-optimization', 'brotli', 'http3'],
      config: {
        cache: {
          static: {
            ttl: 31536000, // 1 year
            headers: {
              'Cache-Control': 'public, max-age=31536000, immutable',
              'Expires': new Date(Date.now() + 31536000000).toUTCString(),
            }
          },
          dynamic: {
            ttl: 300, // 5 minutes
            headers: {
              'Cache-Control': 'public, max-age=300, s-maxage=3600',
            }
          },
          images: {
            ttl: 2592000, // 30 days
            headers: {
              'Cache-Control': 'public, max-age=2592000, immutable',
            },
            optimization: {
              webp: true,
              avif: true,
              quality: 85,
              progressive: true,
            }
          }
        },
        compression: {
          gzip: true,
          brotli: true,
          minLevel: 6,
          types: [
            'text/html',
            'text/css',
            'text/javascript',
            'application/javascript',
            'application/json',
            'image/svg+xml',
            'application/xml',
            'text/xml'
          ]
        },
        security: {
          https: true,
          hsts: true,
          cors: {
            enabled: true,
            origins: ['https://bookstore-directory.com', 'https://www.bookstore-directory.com'],
            methods: ['GET', 'HEAD', 'OPTIONS']
          }
        },
        performance: {
          http2: true,
          http3: true,
          prefetch: true,
          preload: [
            '/assets/css/main.css',
            '/assets/js/main.js',
            '/assets/fonts/inter.woff2'
          ]
        }
      }
    });

    // AWS CloudFront Configuration
    this.providers.set('cloudfront', {
      name: 'AWS CloudFront',
      endpoint: 'https://d1234567890.cloudfront.net',
      regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
      features: ['edge-caching', 'lambda-edge', 'real-time-logs'],
      config: {
        cache: {
          static: {
            ttl: 31536000,
            headers: {
              'Cache-Control': 'public, max-age=31536000, immutable',
            }
          },
          dynamic: {
            ttl: 300,
            headers: {
              'Cache-Control': 'public, max-age=300',
            }
          },
          images: {
            ttl: 2592000,
            headers: {
              'Cache-Control': 'public, max-age=2592000',
            },
            optimization: {
              webp: true,
              avif: false,
              quality: 80,
              progressive: true,
            }
          }
        },
        compression: {
          gzip: true,
          brotli: true,
          minLevel: 6,
          types: [
            'text/html',
            'text/css',
            'text/javascript',
            'application/javascript',
            'application/json'
          ]
        },
        security: {
          https: true,
          hsts: true,
          cors: {
            enabled: true,
            origins: ['*'],
            methods: ['GET', 'HEAD']
          }
        },
        performance: {
          http2: true,
          http3: false,
          prefetch: false,
          preload: []
        }
      }
    });

    // Vercel Edge Network Configuration
    this.providers.set('vercel', {
      name: 'Vercel Edge Network',
      endpoint: 'https://bookstore-directory.vercel.app',
      regions: ['global'],
      features: ['edge-functions', 'image-optimization', 'analytics'],
      config: {
        cache: {
          static: {
            ttl: 31536000,
            headers: {
              'Cache-Control': 'public, max-age=31536000, immutable',
            }
          },
          dynamic: {
            ttl: 0,
            headers: {
              'Cache-Control': 'public, max-age=0, s-maxage=86400',
            }
          },
          images: {
            ttl: 31536000,
            headers: {
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
            optimization: {
              webp: true,
              avif: true,
              quality: 75,
              progressive: true,
            }
          }
        },
        compression: {
          gzip: true,
          brotli: true,
          minLevel: 6,
          types: ['text/*', 'application/javascript', 'application/json']
        },
        security: {
          https: true,
          hsts: true,
          cors: {
            enabled: true,
            origins: ['*'],
            methods: ['GET', 'HEAD', 'OPTIONS']
          }
        },
        performance: {
          http2: true,
          http3: true,
          prefetch: true,
          preload: ['/assets/css/main.css']
        }
      }
    });
  }

  /**
   * Generate CDN configuration files
   */
  async generateConfigurations(): Promise<void> {
    console.log('🚀 Generating CDN configurations...\n');

    // Create CDN config directory
    const configDir = './config/cdn';
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Generate configurations for each provider
    for (const [key, provider] of this.providers) {
      await this.generateProviderConfig(key, provider, configDir);
    }

    // Generate deployment scripts
    await this.generateDeploymentScripts(configDir);

    // Generate performance monitoring configuration
    await this.generateMonitoringConfig(configDir);

    console.log('✅ CDN configurations generated successfully!\n');
  }

  /**
   * Generate provider-specific configuration
   */
  private async generateProviderConfig(
    key: string, 
    provider: CDNProvider, 
    configDir: string
  ): Promise<void> {
    const config = {
      provider: provider.name,
      endpoint: provider.endpoint,
      regions: provider.regions,
      features: provider.features,
      ...provider.config
    };

    // Write JSON configuration
    const configPath = path.join(configDir, `${key}.json`);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Generate provider-specific deployment script
    const deployScript = this.generateDeployScript(key, provider);
    const scriptPath = path.join(configDir, `deploy-${key}.sh`);
    fs.writeFileSync(scriptPath, deployScript);
    
    // Make script executable (Unix systems)
    try {
      fs.chmodSync(scriptPath, '755');
    } catch (error) {
      // Ignore on Windows
    }

    console.log(`   📄 Generated ${provider.name} configuration`);
  }

  /**
   * Generate deployment script for a provider
   */
  private generateDeployScript(key: string, provider: CDNProvider): string {
    return `#!/bin/bash

# ${provider.name} Deployment Script
# Generated automatically by CDN Manager

set -e

echo "🚀 Deploying to ${provider.name}..."

# Build the application
echo "📦 Building application..."
npm run build

# Optimize assets
echo "🔧 Optimizing assets..."
npm run optimize:assets

# Upload to CDN
echo "📤 Uploading to ${provider.name}..."

${this.generateUploadCommands(key, provider)}

# Purge cache
echo "🧹 Purging CDN cache..."
${this.generateCachePurgeCommands(key, provider)}

# Verify deployment
echo "✅ Verifying deployment..."
${this.generateVerificationCommands(key, provider)}

echo "🎉 Deployment to ${provider.name} completed successfully!"
`;
  }

  /**
   * Generate upload commands for a provider
   */
  private generateUploadCommands(key: string, provider: CDNProvider): string {
    switch (key) {
      case 'cloudflare':
        return `
# Cloudflare Pages deployment
npx wrangler pages publish dist --project-name=bookstore-directory

# Configure cache rules
npx wrangler pages deployment tail --project-name=bookstore-directory
`;

      case 'cloudfront':
        return `
# AWS S3 upload
aws s3 sync dist/ s3://bookstore-directory-bucket --delete --cache-control "max-age=31536000"

# CloudFront invalidation
aws cloudfront create-invalidation --distribution-id E1234567890 --paths "/*"
`;

      case 'vercel':
        return `
# Vercel deployment
npx vercel --prod --yes

# Configure edge functions
npx vercel env add CDN_PROVIDER ${key}
`;

      default:
        return `
# Generic deployment
echo "Manual deployment required for ${provider.name}"
echo "Upload dist/ directory to: ${provider.endpoint}"
`;
    }
  }

  /**
   * Generate cache purge commands
   */
  private generateCachePurgeCommands(key: string, provider: CDNProvider): string {
    switch (key) {
      case 'cloudflare':
        return `
# Purge Cloudflare cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/\${CLOUDFLARE_ZONE_ID}/purge_cache" \\
  -H "Authorization: Bearer \${CLOUDFLARE_API_TOKEN}" \\
  -H "Content-Type: application/json" \\
  --data '{"purge_everything":true}'
`;

      case 'cloudfront':
        return `
# CloudFront cache invalidation
aws cloudfront create-invalidation --distribution-id \${CLOUDFRONT_DISTRIBUTION_ID} --paths "/*"
`;

      case 'vercel':
        return `
# Vercel automatic cache invalidation
echo "Vercel handles cache invalidation automatically"
`;

      default:
        return `echo "Manual cache purge required for ${provider.name}"`;
    }
  }

  /**
   * Generate verification commands
   */
  private generateVerificationCommands(key: string, provider: CDNProvider): string {
    return `
# Test CDN endpoint
curl -I ${provider.endpoint}

# Check cache headers
curl -I ${provider.endpoint}/assets/css/main.css

# Verify image optimization
curl -I ${provider.endpoint}/images/default-bookstore.jpg

# Test compression
curl -H "Accept-Encoding: gzip, br" -I ${provider.endpoint}
`;
  }

  /**
   * Generate deployment scripts
   */
  private async generateDeploymentScripts(configDir: string): Promise<void> {
    // Main deployment script
    const mainScript = `#!/bin/bash

# Main CDN Deployment Script
# Deploys to the active CDN provider

set -e

PROVIDER=\${1:-${this.activeProvider}}

echo "🚀 Starting CDN deployment to \$PROVIDER..."

# Validate provider
if [ ! -f "config/cdn/\$PROVIDER.json" ]; then
  echo "❌ Provider configuration not found: \$PROVIDER"
  echo "Available providers:"
  ls config/cdn/*.json | sed 's/.*\\/\\([^.]*\\).json/  - \\1/'
  exit 1
fi

# Load configuration
echo "📋 Loading \$PROVIDER configuration..."
CONFIG=\$(cat config/cdn/\$PROVIDER.json)

# Run provider-specific deployment
echo "🔄 Running \$PROVIDER deployment..."
bash config/cdn/deploy-\$PROVIDER.sh

echo "✅ CDN deployment completed successfully!"
`;

    fs.writeFileSync(path.join(configDir, 'deploy.sh'), mainScript);

    // Performance test script
    const perfScript = `#!/bin/bash

# CDN Performance Testing Script

set -e

PROVIDER=\${1:-${this.activeProvider}}
ENDPOINT=\$(cat config/cdn/\$PROVIDER.json | grep '"endpoint"' | cut -d'"' -f4)

echo "🔍 Testing CDN performance for \$PROVIDER..."
echo "Endpoint: \$ENDPOINT"

# Test page load times
echo "📊 Testing page load times..."
curl -w "@config/cdn/curl-format.txt" -o /dev/null -s "\$ENDPOINT"

# Test asset delivery
echo "📦 Testing asset delivery..."
curl -w "@config/cdn/curl-format.txt" -o /dev/null -s "\$ENDPOINT/assets/css/main.css"

# Test image optimization
echo "🖼️ Testing image optimization..."
curl -w "@config/cdn/curl-format.txt" -o /dev/null -s "\$ENDPOINT/images/default-bookstore.jpg"

echo "✅ Performance testing completed!"
`;

    fs.writeFileSync(path.join(configDir, 'test-performance.sh'), perfScript);

    // Curl format file for performance testing
    const curlFormat = `     time_namelookup:  %{time_namelookup}s
        time_connect:  %{time_connect}s
     time_appconnect:  %{time_appconnect}s
    time_pretransfer:  %{time_pretransfer}s
       time_redirect:  %{time_redirect}s
  time_starttransfer:  %{time_starttransfer}s
                     ----------
          time_total:  %{time_total}s
         size_download: %{size_download} bytes
         speed_download: %{speed_download} bytes/sec
`;

    fs.writeFileSync(path.join(configDir, 'curl-format.txt'), curlFormat);

    console.log('   📜 Generated deployment scripts');
  }

  /**
   * Generate monitoring configuration
   */
  private async generateMonitoringConfig(configDir: string): Promise<void> {
    const monitoringConfig = {
      providers: Array.from(this.providers.keys()),
      activeProvider: this.activeProvider,
      monitoring: {
        uptime: {
          enabled: true,
          interval: 60, // seconds
          timeout: 10,
          endpoints: [
            '/',
            '/stores',
            '/map',
            '/assets/css/main.css',
            '/images/default-bookstore.jpg'
          ]
        },
        performance: {
          enabled: true,
          metrics: [
            'time_total',
            'time_starttransfer',
            'size_download',
            'speed_download'
          ],
          thresholds: {
            time_total: 2.0, // seconds
            time_starttransfer: 1.0,
            speed_download: 1000000 // bytes/sec (1MB/s)
          }
        },
        alerts: {
          enabled: true,
          channels: ['email', 'slack'],
          conditions: [
            'uptime < 99%',
            'time_total > 3s',
            'speed_download < 500000'
          ]
        }
      }
    };

    fs.writeFileSync(
      path.join(configDir, 'monitoring.json'),
      JSON.stringify(monitoringConfig, null, 2)
    );

    console.log('   📈 Generated monitoring configuration');
  }

  /**
   * Optimize build output for CDN delivery
   */
  async optimizeBuildOutput(): Promise<void> {
    console.log('🔧 Optimizing build output for CDN delivery...\n');

    if (!fs.existsSync(this.buildPath)) {
      console.log('❌ Build directory not found. Run "npm run build" first.');
      return;
    }

    // Add cache headers to HTML files
    await this.addCacheHeaders();

    // Generate resource hints
    await this.generateResourceHints();

    // Create asset manifest
    await this.createAssetManifest();

    console.log('✅ Build optimization completed!\n');
  }

  /**
   * Add cache headers to HTML files
   */
  private async addCacheHeaders(): Promise<void> {
    const htmlFiles = this.findFiles(this.buildPath, '.html');
    
    for (const file of htmlFiles) {
      let content = fs.readFileSync(file, 'utf-8');
      
      // Add cache control meta tag
      if (!content.includes('http-equiv="Cache-Control"')) {
        const cacheTag = '<meta http-equiv="Cache-Control" content="public, max-age=300">';
        content = content.replace('<head>', `<head>\n  ${cacheTag}`);
        fs.writeFileSync(file, content);
      }
    }

    console.log(`   📄 Added cache headers to ${htmlFiles.length} HTML files`);
  }

  /**
   * Generate resource hints for better loading
   */
  private async generateResourceHints(): Promise<void> {
    const provider = this.providers.get(this.activeProvider);
    if (!provider) return;

    const hints = [
      `<link rel="dns-prefetch" href="${provider.endpoint}">`,
      `<link rel="preconnect" href="${provider.endpoint}" crossorigin>`,
      ...provider.config.performance.preload.map(url => 
        `<link rel="preload" href="${provider.endpoint}${url}" as="${this.getAssetType(url)}">`
      )
    ];

    // Add hints to HTML files
    const htmlFiles = this.findFiles(this.buildPath, '.html');
    
    for (const file of htmlFiles) {
      let content = fs.readFileSync(file, 'utf-8');
      
      // Add resource hints
      const hintsHtml = hints.join('\n  ');
      content = content.replace('<head>', `<head>\n  ${hintsHtml}`);
      fs.writeFileSync(file, content);
    }

    console.log(`   🔗 Added resource hints to ${htmlFiles.length} HTML files`);
  }

  /**
   * Create asset manifest for cache management
   */
  private async createAssetManifest(): Promise<void> {
    const assets = this.findFiles(this.buildPath, ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.webp']);
    
    const manifest = {
      generated: new Date().toISOString(),
      provider: this.activeProvider,
      assets: assets.map(file => {
        const relativePath = path.relative(this.buildPath, file);
        const stat = fs.statSync(file);
        
        return {
          path: relativePath,
          size: stat.size,
          lastModified: stat.mtime.toISOString(),
          type: this.getAssetType(relativePath),
          cacheTTL: this.getCacheTTL(relativePath)
        };
      })
    };

    fs.writeFileSync(
      path.join(this.buildPath, 'asset-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    console.log(`   📋 Created asset manifest with ${assets.length} assets`);
  }

  /**
   * Helper methods
   */
  private findFiles(dir: string, extensions: string | string[]): string[] {
    const exts = Array.isArray(extensions) ? extensions : [extensions];
    const files: string[] = [];

    const scan = (currentDir: string): void => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scan(fullPath);
        } else if (exts.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    };

    scan(dir);
    return files;
  }

  private getAssetType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.css': return 'style';
      case '.js': return 'script';
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.webp':
      case '.avif': return 'image';
      case '.woff':
      case '.woff2': return 'font';
      default: return 'fetch';
    }
  }

  private getCacheTTL(filePath: string): number {
    const provider = this.providers.get(this.activeProvider);
    if (!provider) return 300;

    if (filePath.includes('/images/')) {
      return provider.config.cache.images.ttl;
    } else if (filePath.includes('/assets/')) {
      return provider.config.cache.static.ttl;
    } else {
      return provider.config.cache.dynamic.ttl;
    }
  }

  /**
   * Set active CDN provider
   */
  setProvider(provider: string): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Unknown CDN provider: ${provider}`);
    }
    this.activeProvider = provider;
    console.log(`✅ Active CDN provider set to: ${provider}`);
  }

  /**
   * List available providers
   */
  listProviders(): void {
    console.log('📋 Available CDN providers:\n');
    
    for (const [key, provider] of this.providers) {
      const active = key === this.activeProvider ? ' (active)' : '';
      console.log(`   ${provider.name}${active}`);
      console.log(`   └── Endpoint: ${provider.endpoint}`);
      console.log(`   └── Features: ${provider.features.join(', ')}\n`);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'generate';
  
  const cdnManager = new CDNManager();
  
  switch (command) {
    case 'generate':
      await cdnManager.generateConfigurations();
      break;
    case 'optimize':
      await cdnManager.optimizeBuildOutput();
      break;
    case 'set-provider':
      if (args[1]) {
        cdnManager.setProvider(args[1]);
      } else {
        console.error('Provider name required. Usage: npm run cdn:set-provider <provider>');
      }
      break;
    case 'list':
      cdnManager.listProviders();
      break;
    case 'help':
      console.log(`
CDN Configuration Tool

Usage:
  npm run cdn:generate     Generate CDN configurations
  npm run cdn:optimize     Optimize build output for CDN
  npm run cdn:set-provider Set active CDN provider
  npm run cdn:list         List available providers
  npm run cdn:help         Show this help message

Examples:
  npm run cdn:generate
  npm run cdn:set-provider cloudflare
  npm run cdn:optimize
      `);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "npm run cdn:help" for usage information');
      process.exit(1);
  }
}

// Run the main function
main().catch(console.error);

export { CDNManager }; 