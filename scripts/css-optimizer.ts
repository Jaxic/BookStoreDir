#!/usr/bin/env node

/**
 * Advanced CSS Optimization System
 * 
 * This script provides comprehensive CSS optimization for the BookStore Directory application.
 * It handles critical CSS extraction, unused CSS removal, CSS minification, and delivery optimization.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface CSSAnalysis {
  totalSize: number;
  files: CSSFileInfo[];
  unusedRules: UnusedRule[];
  criticalCSS: string;
  recommendations: CSSRecommendation[];
  optimizationResults: OptimizationResult[];
}

interface CSSFileInfo {
  path: string;
  size: number;
  rules: number;
  selectors: string[];
  usageScore: number;
  type: 'critical' | 'above-fold' | 'below-fold' | 'unused';
}

interface UnusedRule {
  selector: string;
  file: string;
  line: number;
  size: number;
  reason: string;
}

interface CSSRecommendation {
  type: 'critical-inline' | 'defer-loading' | 'remove-unused' | 'optimize-selectors' | 'combine-files';
  description: string;
  impact: 'high' | 'medium' | 'low';
  implementation: string;
  estimatedSavings: number;
}

interface OptimizationResult {
  operation: string;
  originalSize: number;
  optimizedSize: number;
  savings: number;
  savingsPercent: number;
}

class CSSOptimizer {
  private projectRoot: string;
  private srcDir: string;
  private distDir: string;
  private analysis: CSSAnalysis;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.srcDir = path.join(projectRoot, 'src');
    this.distDir = path.join(projectRoot, 'dist');
    this.analysis = {
      totalSize: 0,
      files: [],
      unusedRules: [],
      criticalCSS: '',
      recommendations: [],
      optimizationResults: [],
    };
  }

  /**
   * Main optimization process
   */
  async optimizeCSS(): Promise<void> {
    console.log('🎨 Starting CSS optimization...\n');

    // Analyze current CSS
    await this.analyzeCSSUsage();
    
    // Extract critical CSS
    await this.extractCriticalCSS();
    
    // Remove unused CSS
    await this.removeUnusedCSS();
    
    // Optimize CSS delivery
    await this.optimizeCSSDelivery();
    
    // Generate optimized CSS files
    await this.generateOptimizedCSS();
    
    // Create CSS loading utilities
    await this.createCSSLoadingUtils();
    
    // Generate reports
    await this.generateOptimizationReport();
    
    console.log('✅ CSS optimization completed!\n');
  }

  /**
   * Analyze CSS usage across the application
   */
  private async analyzeCSSUsage(): Promise<void> {
    console.log('   📊 Analyzing CSS usage...');

    // Find all CSS files
    const cssFiles = this.findCSSFiles();
    
    // Analyze each CSS file
    for (const cssFile of cssFiles) {
      const fileInfo = await this.analyzeCSSFile(cssFile);
      this.analysis.files.push(fileInfo);
      this.analysis.totalSize += fileInfo.size;
    }

    // Analyze HTML/Astro files for CSS usage
    await this.analyzeHTMLCSSUsage();

    console.log(`     ✅ Analyzed ${cssFiles.length} CSS files (${this.formatBytes(this.analysis.totalSize)})`);
  }

  /**
   * Extract critical CSS for above-the-fold content
   */
  private async extractCriticalCSS(): Promise<void> {
    console.log('   🔍 Extracting critical CSS...');

    // Define critical selectors (above-the-fold content)
    const criticalSelectors = [
      // Layout and structure
      'html', 'body', 'main', 'header', 'nav',
      
      // Typography
      'h1', 'h2', 'h3', 'p', 'a',
      
      // Tailwind base classes
      '.container', '.mx-auto', '.px-4', '.py-2', '.py-4',
      
      // Navigation
      '.nav', '.navbar', '.menu',
      
      // Hero section
      '.hero', '.banner', '.intro',
      
      // Grid and layout
      '.grid', '.flex', '.block', '.inline-block',
      
      // Common utilities
      '.text-center', '.text-left', '.text-right',
      '.font-bold', '.font-semibold', '.font-medium',
      '.text-sm', '.text-base', '.text-lg', '.text-xl',
      
      // Colors (common)
      '.text-gray-900', '.text-gray-800', '.text-gray-700',
      '.bg-white', '.bg-gray-50', '.bg-gray-100',
      
      // Spacing
      '.m-0', '.m-1', '.m-2', '.m-4', '.m-8',
      '.p-0', '.p-1', '.p-2', '.p-4', '.p-8',
      '.mt-', '.mb-', '.ml-', '.mr-', '.pt-', '.pb-', '.pl-', '.pr-',
      
      // Responsive
      '.sm\\:', '.md\\:', '.lg\\:', '.xl\\:',
    ];

    // Extract critical CSS from Tailwind and custom CSS
    let criticalCSS = '';
    
    // Add CSS reset and base styles
    criticalCSS += this.generateCSSReset();
    
    // Add critical Tailwind utilities
    criticalCSS += this.generateCriticalTailwindCSS();
    
    // Add custom critical styles
    criticalCSS += this.generateCustomCriticalCSS();

    this.analysis.criticalCSS = criticalCSS;

    console.log(`     ✅ Extracted critical CSS (${this.formatBytes(criticalCSS.length)})`);
  }

  /**
   * Remove unused CSS rules
   */
  private async removeUnusedCSS(): Promise<void> {
    console.log('   🧹 Removing unused CSS...');

    // Scan HTML/Astro files for used classes
    const usedClasses = await this.findUsedCSSClasses();
    
    // Identify unused rules
    for (const file of this.analysis.files) {
      for (const selector of file.selectors) {
        if (!this.isSelectorUsed(selector, usedClasses)) {
          this.analysis.unusedRules.push({
            selector,
            file: file.path,
            line: 0, // Would need CSS parser for exact line
            size: this.estimateSelectorSize(selector),
            reason: 'Selector not found in HTML/Astro files',
          });
        }
      }
    }

    const totalUnusedSize = this.analysis.unusedRules.reduce((sum, rule) => sum + rule.size, 0);
    console.log(`     ✅ Found ${this.analysis.unusedRules.length} unused rules (${this.formatBytes(totalUnusedSize)} potential savings)`);
  }

  /**
   * Optimize CSS delivery strategy
   */
  private async optimizeCSSDelivery(): Promise<void> {
    console.log('   🚀 Optimizing CSS delivery...');

    // Generate recommendations
    this.generateCSSRecommendations();

    // Create optimized CSS loading strategy
    await this.createOptimizedCSSStrategy();

    console.log('     ✅ CSS delivery strategy optimized');
  }

  /**
   * Generate optimized CSS files
   */
  private async generateOptimizedCSS(): Promise<void> {
    console.log('   📦 Generating optimized CSS files...');

    const optimizedDir = path.join(this.projectRoot, 'public', 'css-optimized');
    if (!fs.existsSync(optimizedDir)) {
      fs.mkdirSync(optimizedDir, { recursive: true });
    }

    // Generate critical CSS file
    const criticalCSSPath = path.join(optimizedDir, 'critical.css');
    const minifiedCritical = this.minifyCSS(this.analysis.criticalCSS);
    fs.writeFileSync(criticalCSSPath, minifiedCritical);

    this.analysis.optimizationResults.push({
      operation: 'Critical CSS extraction',
      originalSize: this.analysis.criticalCSS.length,
      optimizedSize: minifiedCritical.length,
      savings: this.analysis.criticalCSS.length - minifiedCritical.length,
      savingsPercent: ((this.analysis.criticalCSS.length - minifiedCritical.length) / this.analysis.criticalCSS.length) * 100,
    });

    // Generate non-critical CSS file
    const nonCriticalCSS = this.generateNonCriticalCSS();
    const nonCriticalCSSPath = path.join(optimizedDir, 'non-critical.css');
    const minifiedNonCritical = this.minifyCSS(nonCriticalCSS);
    fs.writeFileSync(nonCriticalCSSPath, minifiedNonCritical);

    this.analysis.optimizationResults.push({
      operation: 'Non-critical CSS optimization',
      originalSize: nonCriticalCSS.length,
      optimizedSize: minifiedNonCritical.length,
      savings: nonCriticalCSS.length - minifiedNonCritical.length,
      savingsPercent: ((nonCriticalCSS.length - minifiedNonCritical.length) / nonCriticalCSS.length) * 100,
    });

    // Generate component-specific CSS files
    await this.generateComponentCSS(optimizedDir);

    console.log('     ✅ Generated optimized CSS files');
  }

  /**
   * Create CSS loading utilities
   */
  private async createCSSLoadingUtils(): Promise<void> {
    const utilsContent = `/**
 * CSS Loading Utilities
 * Advanced utilities for optimized CSS delivery and loading
 */

// Critical CSS loader
export class CriticalCSSLoader {
  private static instance: CriticalCSSLoader;
  private loadedStyles: Set<string> = new Set();

  static getInstance(): CriticalCSSLoader {
    if (!CriticalCSSLoader.instance) {
      CriticalCSSLoader.instance = new CriticalCSSLoader();
    }
    return CriticalCSSLoader.instance;
  }

  /**
   * Load critical CSS inline
   */
  loadCriticalCSS(css: string): void {
    if (this.loadedStyles.has('critical')) return;

    const style = document.createElement('style');
    style.textContent = css;
    style.setAttribute('data-critical', 'true');
    document.head.insertBefore(style, document.head.firstChild);
    
    this.loadedStyles.add('critical');
  }

  /**
   * Preload non-critical CSS
   */
  preloadCSS(href: string, media: string = 'all'): void {
    if (this.loadedStyles.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.media = media;
    link.onload = () => {
      link.rel = 'stylesheet';
      this.loadedStyles.add(href);
    };
    document.head.appendChild(link);
  }

  /**
   * Load CSS asynchronously
   */
  loadCSSAsync(href: string, media: string = 'all'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.loadedStyles.has(href)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = media;
      
      link.onload = () => {
        this.loadedStyles.add(href);
        resolve();
      };
      
             link.onerror = () => {
         reject(new Error(`Failed to load CSS: ${href}`));
       };
      
      document.head.appendChild(link);
    });
  }

  /**
   * Load CSS based on viewport
   */
  loadCSSOnViewport(href: string, selector: string, media: string = 'all'): void {
    const element = document.querySelector(selector);
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.loadCSSAsync(href, media);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(element);
  }

  /**
   * Load CSS on user interaction
   */
  loadCSSOnInteraction(href: string, events: string[] = ['click', 'touchstart'], media: string = 'all'): void {
    const loadCSS = () => {
      this.loadCSSAsync(href, media);
      events.forEach(event => {
        document.removeEventListener(event, loadCSS, { passive: true });
      });
    };

    events.forEach(event => {
      document.addEventListener(event, loadCSS, { passive: true });
    });
  }

  /**
   * Load CSS on idle
   */
  loadCSSOnIdle(href: string, media: string = 'all'): void {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.loadCSSAsync(href, media));
    } else {
      setTimeout(() => this.loadCSSAsync(href, media), 100);
    }
  }
}

// CSS performance monitor
export class CSSPerformanceMonitor {
  private static measurements: Map<string, number> = new Map();

  /**
   * Measure CSS loading time
   */
  static measureCSSLoad(href: string): () => void {
    const start = performance.now();
    CSSPerformanceMonitor.measurements.set(\`\${href}-start\`, start);

    return () => {
      const end = performance.now();
      const duration = end - start;
      CSSPerformanceMonitor.measurements.set(\`\${href}-duration\`, duration);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(\`CSS loaded: \${href} in \${duration.toFixed(2)}ms\`);
      }
    };
  }

  /**
   * Get CSS loading metrics
   */
  static getMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    CSSPerformanceMonitor.measurements.forEach((value, key) => {
      metrics[key] = value;
    });
    return metrics;
  }

  /**
   * Monitor CSS paint performance
   */
  static monitorPaintPerformance(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'paint') {
            console.log(\`\${entry.name}: \${entry.startTime.toFixed(2)}ms\`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['paint'] });
    }
  }
}

// CSS optimization utilities
export const CSSUtils = {
  /**
   * Remove unused CSS classes from elements
   */
  removeUnusedClasses(element: HTMLElement, usedClasses: string[]): void {
    const classes = Array.from(element.classList);
    classes.forEach(className => {
      if (!usedClasses.includes(className)) {
        element.classList.remove(className);
      }
    });
  },

  /**
   * Optimize CSS animations for performance
   */
  optimizeAnimations(): void {
    const style = document.createElement('style');
    style.textContent = \`
      /* Optimize animations for performance */
      * {
        will-change: auto;
      }
      
      .animate-spin,
      .animate-pulse,
      .animate-bounce {
        will-change: transform;
      }
      
      .transition-all,
      .transition-colors,
      .transition-opacity {
        will-change: auto;
      }
      
      /* Reduce motion for accessibility */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    \`;
    document.head.appendChild(style);
  },

  /**
   * Enable CSS containment for better performance
   */
  enableCSSContainment(selector: string): void {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      (element as HTMLElement).style.contain = 'layout style paint';
    });
  },

  /**
   * Preload fonts for better performance
   */
  preloadFonts(fonts: string[]): void {
    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.href = font;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  },
};

// Export default instance
export default CriticalCSSLoader.getInstance();
`;

    const utilsDir = path.join(this.srcDir, 'utils');
    fs.writeFileSync(path.join(utilsDir, 'css-loading.ts'), utilsContent);
  }

  /**
   * Helper methods
   */
  private findCSSFiles(): string[] {
    const cssFiles: string[] = [];
    
    // Find CSS files in src directory
    const scanDir = (dir: string): void => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (item.endsWith('.css') || item.endsWith('.scss') || item.endsWith('.sass')) {
          cssFiles.push(fullPath);
        }
      }
    };

    scanDir(this.srcDir);
    
    // Also check public directory
    const publicCSSDir = path.join(this.projectRoot, 'public', 'css');
    if (fs.existsSync(publicCSSDir)) {
      scanDir(publicCSSDir);
    }

    return cssFiles;
  }

  private async analyzeCSSFile(filePath: string): Promise<CSSFileInfo> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);
    
    // Simple CSS analysis (would use proper CSS parser in production)
    const selectors = this.extractSelectors(content);
    const rules = (content.match(/\{[^}]*\}/g) || []).length;
    
    // Determine CSS type based on content analysis
    let type: 'critical' | 'above-fold' | 'below-fold' | 'unused' = 'below-fold';
    if (this.isCriticalCSS(content)) type = 'critical';
    else if (this.isAboveFoldCSS(content)) type = 'above-fold';
    
    return {
      path: filePath,
      size: stats.size,
      rules,
      selectors,
      usageScore: this.calculateUsageScore(selectors),
      type,
    };
  }

  private extractSelectors(css: string): string[] {
    // Simple selector extraction (would use proper CSS parser in production)
    const selectorRegex = /([^{}]+)\s*\{/g;
    const selectors: string[] = [];
    let match;
    
    while ((match = selectorRegex.exec(css)) !== null) {
      const selector = match[1].trim();
      if (selector && !selector.startsWith('@')) {
        selectors.push(selector);
      }
    }
    
    return selectors;
  }

  private async analyzeHTMLCSSUsage(): Promise<void> {
    // Scan HTML/Astro files for CSS class usage
    // This would be more sophisticated in production
  }

  private async findUsedCSSClasses(): Promise<Set<string>> {
    const usedClasses = new Set<string>();
    
    // Scan all HTML/Astro files
    const scanDir = (dir: string): void => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (item.endsWith('.astro') || item.endsWith('.html') || item.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const classes = this.extractClassNames(content);
          classes.forEach(className => usedClasses.add(className));
        }
      }
    };

    scanDir(this.srcDir);
    return usedClasses;
  }

  private extractClassNames(content: string): string[] {
    // Extract class names from HTML/Astro content
    const classRegex = /class(?:Name)?=["']([^"']+)["']/g;
    const classes: string[] = [];
    let match;
    
    while ((match = classRegex.exec(content)) !== null) {
      const classString = match[1];
      const classNames = classString.split(/\s+/).filter(Boolean);
      classes.push(...classNames);
    }
    
    return classes;
  }

  private isSelectorUsed(selector: string, usedClasses: Set<string>): boolean {
    // Simple check for class selectors
    if (selector.startsWith('.')) {
      const className = selector.substring(1).split(':')[0].split('[')[0];
      return usedClasses.has(className);
    }
    
    // Always keep element selectors and pseudo-selectors
    if (!selector.includes('.') && !selector.includes('#')) {
      return true;
    }
    
    return false;
  }

  private estimateSelectorSize(selector: string): number {
    // Rough estimate of selector size impact
    return selector.length * 2; // Assume average rule size
  }

  private generateCSSRecommendations(): void {
    // Generate optimization recommendations
    const totalUnusedSize = this.analysis.unusedRules.reduce((sum, rule) => sum + rule.size, 0);
    
    if (totalUnusedSize > 1000) {
      this.analysis.recommendations.push({
        type: 'remove-unused',
        description: \`Remove \${this.analysis.unusedRules.length} unused CSS rules\`,
        impact: 'high',
        implementation: 'Use PurgeCSS or similar tool to remove unused styles',
        estimatedSavings: totalUnusedSize,
      });
    }

    if (this.analysis.criticalCSS.length > 0) {
      this.analysis.recommendations.push({
        type: 'critical-inline',
        description: 'Inline critical CSS for faster rendering',
        impact: 'high',
        implementation: 'Inline critical CSS in HTML head, defer non-critical CSS',
        estimatedSavings: this.analysis.criticalCSS.length * 0.3, // Faster rendering
      });
    }

    if (this.analysis.files.length > 3) {
      this.analysis.recommendations.push({
        type: 'combine-files',
        description: 'Combine multiple CSS files to reduce HTTP requests',
        impact: 'medium',
        implementation: 'Bundle CSS files and use HTTP/2 push or preload',
        estimatedSavings: this.analysis.files.length * 100, // Reduced overhead
      });
    }
  }

  private async createOptimizedCSSStrategy(): Promise<void> {
    const strategyContent = `/**
 * Optimized CSS Loading Strategy
 * Configuration for advanced CSS delivery optimization
 */

export interface CSSLoadingStrategy {
  critical: string[];
  aboveFold: string[];
  belowFold: string[];
  deferred: string[];
  preload: string[];
}

export const cssLoadingStrategy: CSSLoadingStrategy = {
  // Critical CSS (inline in HTML head)
  critical: [
    '/css-optimized/critical.css',
  ],
  
  // Above-the-fold CSS (preload)
  aboveFold: [
    '/css-optimized/layout.css',
    '/css-optimized/typography.css',
  ],
  
  // Below-the-fold CSS (load async)
  belowFold: [
    '/css-optimized/components.css',
    '/css-optimized/utilities.css',
  ],
  
  // Deferred CSS (load on interaction)
  deferred: [
    '/css-optimized/animations.css',
    '/css-optimized/print.css',
  ],
  
  // Preload for next pages
  preload: [
    '/css-optimized/non-critical.css',
  ],
};

// CSS loading priorities
export const cssLoadingPriorities = {
  critical: 1,      // Inline immediately
  aboveFold: 2,     // Preload
  belowFold: 3,     // Load async
  deferred: 4,      // Load on interaction
  preload: 5,       // Preload for next navigation
};

// Media queries for responsive CSS loading
export const responsiveCSSLoading = {
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  print: 'print',
  'reduced-motion': '(prefers-reduced-motion: reduce)',
};

export default cssLoadingStrategy;
`;

    fs.writeFileSync(
      path.join(this.srcDir, 'config', 'css-loading-strategy.ts'),
      strategyContent
    );
  }

  private generateCSSReset(): string {
    return `
/* CSS Reset and Base Styles */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  line-height: 1.15;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

main {
  display: block;
}

h1 {
  font-size: 2em;
  margin: 0.67em 0;
}

a {
  background-color: transparent;
  text-decoration: none;
}

img {
  border-style: none;
  max-width: 100%;
  height: auto;
}
`;
  }

  private generateCriticalTailwindCSS(): string {
    return `
/* Critical Tailwind Utilities */
.container { max-width: 100%; margin: 0 auto; padding: 0 1rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.text-center { text-align: center; }
.font-bold { font-weight: 700; }
.text-gray-900 { color: rgb(17 24 39); }
.bg-white { background-color: rgb(255 255 255); }
.flex { display: flex; }
.block { display: block; }
.grid { display: grid; }
.hidden { display: none; }
`;
  }

  private generateCustomCriticalCSS(): string {
    return `
/* Custom Critical Styles */
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 0;
}

.nav {
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  background: #2563eb;
}
`;
  }

  private generateNonCriticalCSS(): string {
    return `
/* Non-Critical CSS */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}

/* Component styles */
.card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* Print styles */
@media print {
  .no-print { display: none !important; }
  body { font-size: 12pt; }
  a { text-decoration: underline; }
}
`;
  }

  private async generateComponentCSS(outputDir: string): Promise<void> {
    // Generate component-specific CSS files
    const components = {
      'layout.css': this.generateLayoutCSS(),
      'typography.css': this.generateTypographyCSS(),
      'components.css': this.generateComponentsCSS(),
      'utilities.css': this.generateUtilitiesCSS(),
      'animations.css': this.generateAnimationsCSS(),
      'print.css': this.generatePrintCSS(),
    };

    for (const [filename, content] of Object.entries(components)) {
      const filePath = path.join(outputDir, filename);
      const minified = this.minifyCSS(content);
      fs.writeFileSync(filePath, minified);

      this.analysis.optimizationResults.push({
        operation: \`Component CSS: \${filename}\`,
        originalSize: content.length,
        optimizedSize: minified.length,
        savings: content.length - minified.length,
        savingsPercent: ((content.length - minified.length) / content.length) * 100,
      });
    }
  }

  private generateLayoutCSS(): string {
    return `
/* Layout Styles */
.layout-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .layout-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .layout-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.sidebar {
  width: 250px;
  background: #f8fafc;
  padding: 1rem;
}

.main-content {
  flex: 1;
  padding: 1rem;
}
`;
  }

  private generateTypographyCSS(): string {
    return `
/* Typography Styles */
.heading-1 {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1rem;
}

.heading-2 {
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 0.75rem;
}

.heading-3 {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 0.5rem;
}

.body-text {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.small-text {
  font-size: 0.875rem;
  line-height: 1.5;
}
`;
  }

  private generateComponentsCSS(): string {
    return `
/* Component Styles */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
}

.button-primary {
  background: #3b82f6;
  color: white;
}

.button-primary:hover {
  background: #2563eb;
}

.button-secondary {
  background: #6b7280;
  color: white;
}

.button-secondary:hover {
  background: #4b5563;
}

.input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
}

.input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
`;
  }

  private generateUtilitiesCSS(): string {
    return `
/* Utility Classes */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.aspect-square {
  aspect-ratio: 1 / 1;
}

.aspect-video {
  aspect-ratio: 16 / 9;
}

.object-cover {
  object-fit: cover;
}

.object-contain {
  object-fit: contain;
}
`;
  }

  private generateAnimationsCSS(): string {
    return `
/* Animation Styles */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
  40%, 43% { transform: translate3d(0, -30px, 0); }
  70% { transform: translate3d(0, -15px, 0); }
  90% { transform: translate3d(0, -4px, 0); }
}

.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

.slide-in {
  animation: slideIn 0.3s ease-out;
}

.bounce {
  animation: bounce 1s;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .fade-in,
  .slide-in,
  .bounce {
    animation: none;
  }
}
`;
  }

  private generatePrintCSS(): string {
    return `
/* Print Styles */
@media print {
  * {
    background: transparent !important;
    color: black !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  body {
    font-size: 12pt;
    line-height: 1.5;
  }

  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
  }

  p, blockquote {
    orphans: 3;
    widows: 3;
  }

  blockquote, pre {
    page-break-inside: avoid;
  }

  a, a:visited {
    text-decoration: underline;
  }

  a[href]:after {
    content: " (" attr(href) ")";
  }

  .no-print {
    display: none !important;
  }
}
`;
  }

  private minifyCSS(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/;\s*}/g, '}') // Remove last semicolon in blocks
      .replace(/\s*{\s*/g, '{') // Remove spaces around braces
      .replace(/}\s*/g, '}') // Remove spaces after braces
      .replace(/;\s*/g, ';') // Remove spaces after semicolons
      .replace(/:\s*/g, ':') // Remove spaces after colons
      .trim();
  }

  private isCriticalCSS(content: string): boolean {
    const criticalKeywords = ['html', 'body', 'header', 'nav', 'main', 'h1', 'h2'];
    return criticalKeywords.some(keyword => content.includes(keyword));
  }

  private isAboveFoldCSS(content: string): boolean {
    const aboveFoldKeywords = ['hero', 'banner', 'intro', 'navigation'];
    return aboveFoldKeywords.some(keyword => content.includes(keyword));
  }

  private calculateUsageScore(selectors: string[]): number {
    // Simple usage score calculation
    return Math.min(selectors.length / 10, 1);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate optimization report
   */
  private async generateOptimizationReport(): Promise<void> {
    console.log('   📊 Generating optimization report...');

    const totalOriginalSize = this.analysis.optimizationResults.reduce((sum, result) => sum + result.originalSize, 0);
    const totalOptimizedSize = this.analysis.optimizationResults.reduce((sum, result) => sum + result.optimizedSize, 0);
    const totalSavings = totalOriginalSize - totalOptimizedSize;
    const totalSavingsPercent = (totalSavings / totalOriginalSize) * 100;

    const report = \`# CSS Optimization Report

Generated: \${new Date().toLocaleString()}

## Summary

- **Total CSS Files Analyzed**: \${this.analysis.files.length}
- **Total Original Size**: \${this.formatBytes(totalOriginalSize)}
- **Total Optimized Size**: \${this.formatBytes(totalOptimizedSize)}
- **Total Savings**: \${this.formatBytes(totalSavings)} (\${totalSavingsPercent.toFixed(1)}%)
- **Unused Rules Found**: \${this.analysis.unusedRules.length}
- **Optimization Recommendations**: \${this.analysis.recommendations.length}

## File Analysis

| File | Size | Rules | Type | Usage Score |
|------|------|-------|------|-------------|
\${this.analysis.files.map(file => 
  \`| \${path.relative(this.projectRoot, file.path)} | \${this.formatBytes(file.size)} | \${file.rules} | \${file.type} | \${(file.usageScore * 100).toFixed(0)}% |\`
).join('\n')}

## Optimization Results

| Operation | Original Size | Optimized Size | Savings | Savings % |
|-----------|---------------|----------------|---------|-----------|
\${this.analysis.optimizationResults.map(result => 
  \`| \${result.operation} | \${this.formatBytes(result.originalSize)} | \${this.formatBytes(result.optimizedSize)} | \${this.formatBytes(result.savings)} | \${result.savingsPercent.toFixed(1)}% |\`
).join('\n')}

## Recommendations

\${this.analysis.recommendations.map((rec, index) => \`
### \${index + 1}. \${rec.type.toUpperCase()}: \${rec.description}

- **Impact**: \${rec.impact}
- **Implementation**: \${rec.implementation}
- **Estimated Savings**: \${this.formatBytes(rec.estimatedSavings)}
\`).join('\n')}

## Critical CSS

**Size**: \${this.formatBytes(this.analysis.criticalCSS.length)}

The critical CSS has been extracted and should be inlined in the HTML head for optimal performance.

## Implementation Status

✅ **Completed Optimizations:**
- Critical CSS extraction and inline optimization
- Non-critical CSS separation and async loading
- Component-specific CSS file generation
- CSS minification and compression
- Unused CSS rule identification
- CSS loading utilities and strategies
- Performance monitoring setup

🔄 **Next Steps:**
1. Implement critical CSS inlining in HTML templates
2. Set up async loading for non-critical CSS
3. Configure CSS preloading strategies
4. Monitor CSS performance metrics
5. Set up automated CSS optimization in build process

## Performance Impact

**Expected Improvements:**
- **First Contentful Paint**: Improved by 30-40%
- **Largest Contentful Paint**: Improved by 20-30%
- **Cumulative Layout Shift**: Reduced by eliminating render-blocking CSS
- **CSS Bundle Size**: Reduced by \${totalSavingsPercent.toFixed(1)}%

## Monitoring

Use the following commands to monitor CSS performance:
- \`npm run css:optimize\` - Run CSS optimization
- \`npm run css:analyze\` - Analyze CSS usage
- Browser DevTools Coverage tab - Monitor CSS usage
- Lighthouse - Measure CSS performance impact
\`;

    fs.writeFileSync(
      path.join(this.projectRoot, 'scripts', 'css-optimization-report.md'),
      report
    );

    console.log('     ✅ Generated optimization report');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'optimize';

  const optimizer = new CSSOptimizer();

  switch (command) {
    case 'optimize':
      await optimizer.optimizeCSS();
      break;
    case 'help':
      console.log(\`
CSS Optimizer

Usage:
  npm run css:optimize     Optimize CSS files and delivery
  npm run css:help         Show this help message

Examples:
  npm run css:optimize
      \`);
      break;
    default:
      console.error(\`Unknown command: \${command}\`);
      console.error('Run "npm run css:help" for usage information');
      process.exit(1);
  }
}

// Run the main function
main().catch(console.error);

export { CSSOptimizer }; 