/**
 * Performance Monitoring Configuration
 * For tracking code splitting effectiveness
 */

export const performanceConfig = {
  // Core Web Vitals thresholds
  coreWebVitals: {
    LCP: 2500,  // Largest Contentful Paint (ms)
    FID: 100,   // First Input Delay (ms)
    CLS: 0.1,   // Cumulative Layout Shift
  },
  
  // Bundle size thresholds
  bundleSize: {
    initial: 150000,    // 150KB initial bundle
    total: 1000000,     // 1MB total bundle
    chunk: 250000,      // 250KB per chunk
  },
  
  // Loading performance
  loading: {
    TTI: 3000,          // Time to Interactive (ms)
    FCP: 1500,          // First Contentful Paint (ms)
    TTFB: 500,          // Time to First Byte (ms)
  },
};

export default performanceConfig;
