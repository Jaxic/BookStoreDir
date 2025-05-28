import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [
    tailwind({
      config: {
        content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
        mode: 'jit',
      }
    }),
    react({
      experimentalReactChildren: true,
    }),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    })
  ],
  output: 'static',
  
  build: {
    inlineStylesheets: 'auto',
    split: true,
    assets: 'assets',
  },

  vite: {
    build: {
      rollupOptions: {
        output: {
          // Advanced manual chunking strategy
          manualChunks: (id) => {
            // Core React dependencies
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            
            // Map-related dependencies
            if (id.includes('leaflet') || id.includes('maplibre') || id.includes('react-map-gl')) {
              return 'map-vendor';
            }
            
            // CSV and data processing
            if (id.includes('papaparse') || id.includes('csv-parse') || id.includes('fuse.js')) {
              return 'data-vendor';
            }
            
            // Validation and schema
            if (id.includes('zod') || id.includes('ajv')) {
              return 'validation-vendor';
            }
            
            // Diff and comparison utilities
            if (id.includes('diff') || id.includes('jsondiffpatch')) {
              return 'diff-vendor';
            }
            
            // Astro framework
            if (id.includes('astro')) {
              return 'astro-vendor';
            }
            
            // Node modules (other)
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            
            // Route-based splitting
            if (id.includes('/pages/stores/')) {
              return 'stores-page';
            }
            
            if (id.includes('/pages/map')) {
              return 'map-page';
            }
            
            // Component-based splitting
            if (id.includes('/components/map/')) {
              return 'map-components';
            }
            
            if (id.includes('/components/stores/')) {
              return 'store-components';
            }
          },
          
          // Optimized file naming for better caching
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `assets/js/${chunkInfo.name || facadeModuleId}-[hash].js`;
          },
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
              return `assets/images/[name]-[hash].${ext}`;
            }
            if (/.(css)$/i.test(assetInfo.name)) {
              return `assets/css/[name]-[hash].${ext}`;
            }
            return `assets/[ext]/[name]-[hash].${ext}`;
          },
        },
        
        // External dependencies that should not be bundled
        external: (id) => {
          // Keep large mapping libraries external for CDN loading
          if (id.includes('leaflet') && process.env.NODE_ENV === 'production') {
            return true;
          }
          return false;
        },
      },
      
      // Optimize dependencies
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'fuse.js',
          'papaparse'
        ],
        exclude: [
          // Exclude heavy map libraries from optimization
          'leaflet',
          'maplibre-gl',
        ],
      },
      
      // Advanced minification
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info'],
          passes: 2,
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
      },
      
      // Chunk size warnings
      chunkSizeWarningLimit: 500, // 500KB warning threshold
    },
    
    // CSS optimizations
    css: {
      devSourcemap: true,
      postcss: {
        plugins: [
          // Add PostCSS plugins for optimization
        ],
      },
    },
    
    // Development optimizations
    server: {
      fs: {
        allow: ['..'],
      },
    },
  },

  // Image optimization
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: 268402689,
      },
    },
  },

  // Advanced prefetch configuration
  prefetch: {
    prefetchAll: false, // Disable automatic prefetching
    defaultStrategy: 'viewport',
  },

  // Experimental features
  experimental: {
    // viewTransitions: true, // Moved to stable
    // optimizeHoistedScript: true, // Removed in newer versions
  },

  // Server configuration
  server: {
    compress: true,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },

  site: 'https://bookstore-directory.com',
  base: '/',
  
  security: {
    checkOrigin: true,
  },
});
