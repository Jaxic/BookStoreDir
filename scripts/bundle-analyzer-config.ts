/**
 * Bundle Analyzer Configuration
 * For analyzing bundle sizes and optimization opportunities
 */

export const bundleAnalyzerConfig = {
  // Vite bundle analyzer plugin configuration
  analyzerMode: 'static',
  reportFilename: 'bundle-report.html',
  openAnalyzer: false,
  generateStatsFile: true,
  statsFilename: 'bundle-stats.json',
  
  // Size thresholds for warnings
  thresholds: {
    warning: 500000, // 500KB
    error: 1000000,  // 1MB
  },
  
  // Chunk analysis
  chunkAnalysis: {
    maxChunks: 20,
    maxChunkSize: 250000, // 250KB
    minChunkSize: 10000,  // 10KB
  },
};

export default bundleAnalyzerConfig;
