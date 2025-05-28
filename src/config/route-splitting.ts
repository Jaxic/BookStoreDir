/**
 * Route-based Code Splitting Configuration
 * Defines how routes should be split and loaded
 */

export interface RouteConfig {
  path: string;
  component: string;
  preload?: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dependencies: string[];
}

export const routeConfigs: RouteConfig[] = [
  {
    path: '/',
    component: 'index',
    preload: true,
    priority: 'critical',
    dependencies: ['react', 'map-components'],
  },
  {
    path: '/stores',
    component: 'stores',
    preload: true,
    priority: 'high',
    dependencies: ['react', 'search-utils'],
  },
  {
    path: '/stores/[slug]',
    component: 'store-detail',
    preload: false,
    priority: 'medium',
    dependencies: ['react'],
  },
  {
    path: '/map',
    component: 'map',
    preload: false,
    priority: 'medium',
    dependencies: ['react', 'map-components'],
  },
];

// Chunk configuration for manual splitting
export const chunkConfig = {
  // Critical chunks (loaded immediately)
  critical: {
    'app-core': ['react', 'react-dom'],
    'astro-core': ['astro'],
  },
  
  // High priority chunks (preloaded)
  high: {
    'map-vendor': ['leaflet', 'leaflet.markercluster', 'maplibre-gl', 'react-map-gl'],
    'search-utils': ['fuse.js'],
  },
  
  // Medium priority chunks (loaded on demand)
  medium: {
    'csv-utils': ['papaparse', 'csv-parse'],
    'validation-utils': ['zod', 'ajv', 'ajv-formats'],
  },
  
  // Low priority chunks (lazy loaded)
  low: {
    'diff-utils': ['diff', 'jsondiffpatch'],
    'dev-utils': ['tsx', 'typescript'],
  },
};

// Preload strategy
export const preloadStrategy = {
  // Preload on page load
  immediate: ['app-core', 'astro-core'],
  
  // Preload on user interaction
  onInteraction: ['map-vendor'],
  
  // Preload on viewport
  onViewport: ['search-utils'],
  
  // Preload on idle
  onIdle: ['csv-utils', 'validation-utils'],
};

export default {
  routeConfigs,
  chunkConfig,
  preloadStrategy,
};
