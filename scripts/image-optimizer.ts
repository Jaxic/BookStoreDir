#!/usr/bin/env node

/**
 * Image Optimization and Lazy Loading System
 * 
 * This script provides comprehensive image optimization for the BookStore Directory application.
 * It handles compression, format conversion, responsive images, and lazy loading implementation.
 */

import * as fs from 'fs';
import * as path from 'path';

// Import imagemin modules with any types to avoid TypeScript issues
// @ts-ignore
import imagemin from 'imagemin';
// @ts-ignore
import imageminWebp from 'imagemin-webp';
// @ts-ignore
import imageminAvif from 'imagemin-avif';
// @ts-ignore
import imageminMozjpeg from 'imagemin-mozjpeg';
// @ts-ignore
import imageminPngquant from 'imagemin-pngquant';

interface ImageOptimizationConfig {
  // Input/Output directories
  inputDir: string;
  outputDir: string;
  
  // Quality settings
  quality: {
    jpeg: number;
    webp: number;
    avif: number;
    png: number;
  };
  
  // Responsive image breakpoints
  breakpoints: number[];
  
  // Format settings
  formats: {
    original: boolean;
    webp: boolean;
    avif: boolean;
  };
  
  // Lazy loading settings
  lazyLoading: {
    enabled: boolean;
    placeholder: 'blur' | 'color' | 'svg';
    placeholderColor: string;
    threshold: string; // CSS selector or 'viewport'
  };
}

interface OptimizedImage {
  original: string;
  optimized: {
    [format: string]: {
      [size: string]: string;
    };
  };
  metadata: {
    originalSize: number;
    optimizedSizes: { [format: string]: number };
    dimensions: { width: number; height: number };
    aspectRatio: number;
  };
}

class ImageOptimizer {
  private config: ImageOptimizationConfig;
  private optimizedImages: Map<string, OptimizedImage> = new Map();
  
  constructor(config?: Partial<ImageOptimizationConfig>) {
    this.config = {
      inputDir: './public/images/Raw',
      outputDir: './public/images/optimized',
      quality: {
        jpeg: 85,
        webp: 80,
        avif: 75,
        png: 90,
      },
      breakpoints: [320, 640, 768, 1024, 1280, 1920],
      formats: {
        original: true,
        webp: true,
        avif: true,
      },
      lazyLoading: {
        enabled: true,
        placeholder: 'blur',
        placeholderColor: '#f3f4f6',
        threshold: 'viewport',
      },
      ...config,
    };
  }

  /**
   * Main optimization process
   */
  async optimizeImages(): Promise<void> {
    console.log('🖼️ Starting image optimization process...\n');

    // Create output directory
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }

    // Find all images
    const images = this.findImages(this.config.inputDir);
    console.log(`📸 Found ${images.length} images to optimize\n`);

    // Process each image
    for (const imagePath of images) {
      await this.processImage(imagePath);
    }

    // Generate responsive image components
    await this.generateResponsiveComponents();

    // Generate lazy loading utilities
    await this.generateLazyLoadingUtils();

    // Generate image manifest
    await this.generateImageManifest();

    // Generate optimization report
    await this.generateOptimizationReport();

    console.log('✅ Image optimization completed successfully!\n');
  }

  /**
   * Process a single image
   */
  private async processImage(imagePath: string): Promise<void> {
    const relativePath = path.relative(this.config.inputDir, imagePath);
    const fileName = path.parse(relativePath).name;
    const ext = path.parse(relativePath).ext.toLowerCase();

    console.log(`   🔄 Processing: ${relativePath}`);

    // Skip if not an image
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      return;
    }

    // Get original image metadata
    const originalStats = fs.statSync(imagePath);
    const originalSize = originalStats.size;

    // Create output directory for this image
    const imageOutputDir = path.join(this.config.outputDir, path.dirname(relativePath));
    if (!fs.existsSync(imageOutputDir)) {
      fs.mkdirSync(imageOutputDir, { recursive: true });
    }

    const optimizedImage: OptimizedImage = {
      original: relativePath,
      optimized: {},
      metadata: {
        originalSize,
        optimizedSizes: {},
        dimensions: { width: 0, height: 0 },
        aspectRatio: 0,
      },
    };

    // Get image dimensions (simplified - in production, use a proper image library)
    try {
      const dimensions = await this.getImageDimensions(imagePath);
      optimizedImage.metadata.dimensions = dimensions;
      optimizedImage.metadata.aspectRatio = dimensions.width / dimensions.height;
    } catch (error) {
      console.warn(`     ⚠️ Could not get dimensions for ${relativePath}`);
    }

    // Optimize in different formats
    if (this.config.formats.original) {
      await this.optimizeOriginalFormat(imagePath, imageOutputDir, fileName, ext, optimizedImage);
    }

    if (this.config.formats.webp) {
      await this.optimizeToWebP(imagePath, imageOutputDir, fileName, optimizedImage);
    }

    if (this.config.formats.avif) {
      await this.optimizeToAVIF(imagePath, imageOutputDir, fileName, optimizedImage);
    }

    // Generate responsive variants
    await this.generateResponsiveVariants(imagePath, imageOutputDir, fileName, optimizedImage);

    this.optimizedImages.set(relativePath, optimizedImage);
    console.log(`     ✅ Optimized: ${relativePath}`);
  }

  /**
   * Optimize in original format
   */
  private async optimizeOriginalFormat(
    imagePath: string,
    outputDir: string,
    fileName: string,
    ext: string,
    optimizedImage: OptimizedImage
  ): Promise<void> {
    const outputPath = path.join(outputDir, `${fileName}${ext}`);
    
    try {
      if (ext === '.jpg' || ext === '.jpeg') {
        await imagemin([imagePath], {
          destination: outputDir,
          plugins: [
            imageminMozjpeg({
              quality: this.config.quality.jpeg,
              progressive: true,
            }),
          ],
        });
      } else if (ext === '.png') {
        await imagemin([imagePath], {
          destination: outputDir,
          plugins: [
            imageminPngquant({
              quality: [0.6, this.config.quality.png / 100],
            }),
          ],
        });
      }

      if (fs.existsSync(outputPath)) {
        const optimizedStats = fs.statSync(outputPath);
        optimizedImage.optimized[ext.slice(1)] = { original: outputPath };
        optimizedImage.metadata.optimizedSizes[ext.slice(1)] = optimizedStats.size;
      }
    } catch (error) {
      console.warn(`     ⚠️ Failed to optimize ${fileName}${ext}:`, error);
    }
  }

  /**
   * Optimize to WebP format
   */
  private async optimizeToWebP(
    imagePath: string,
    outputDir: string,
    fileName: string,
    optimizedImage: OptimizedImage
  ): Promise<void> {
    const outputPath = path.join(outputDir, `${fileName}.webp`);
    
    try {
      await imagemin([imagePath], {
        destination: outputDir,
        plugins: [
          imageminWebp({
            quality: this.config.quality.webp,
            method: 6, // Best compression
          }),
        ],
      });

      if (fs.existsSync(outputPath)) {
        const optimizedStats = fs.statSync(outputPath);
        optimizedImage.optimized.webp = { original: outputPath };
        optimizedImage.metadata.optimizedSizes.webp = optimizedStats.size;
      }
    } catch (error) {
      console.warn(`     ⚠️ Failed to create WebP for ${fileName}:`, error);
    }
  }

  /**
   * Optimize to AVIF format
   */
  private async optimizeToAVIF(
    imagePath: string,
    outputDir: string,
    fileName: string,
    optimizedImage: OptimizedImage
  ): Promise<void> {
    const outputPath = path.join(outputDir, `${fileName}.avif`);
    
    try {
      await imagemin([imagePath], {
        destination: outputDir,
        plugins: [
          imageminAvif({
            quality: this.config.quality.avif,
            speed: 2, // Balance between speed and compression
          }),
        ],
      });

      if (fs.existsSync(outputPath)) {
        const optimizedStats = fs.statSync(outputPath);
        optimizedImage.optimized.avif = { original: outputPath };
        optimizedImage.metadata.optimizedSizes.avif = optimizedStats.size;
      }
    } catch (error) {
      console.warn(`     ⚠️ Failed to create AVIF for ${fileName}:`, error);
    }
  }

  /**
   * Generate responsive variants (simplified - would use Sharp in production)
   */
  private async generateResponsiveVariants(
    imagePath: string,
    outputDir: string,
    fileName: string,
    optimizedImage: OptimizedImage
  ): Promise<void> {
    // For now, we'll create placeholder entries for responsive variants
    // In a full implementation, you'd use Sharp to resize images
    
    for (const format of Object.keys(optimizedImage.optimized)) {
      optimizedImage.optimized[format] = {
        ...optimizedImage.optimized[format],
        ...this.config.breakpoints.reduce((acc, breakpoint) => {
          acc[`${breakpoint}w`] = optimizedImage.optimized[format].original;
          return acc;
        }, {} as Record<string, string>),
      };
    }
  }

  /**
   * Get image dimensions (simplified implementation)
   */
  private async getImageDimensions(imagePath: string): Promise<{ width: number; height: number }> {
    // This is a simplified implementation
    // In production, use a proper image library like Sharp
    return { width: 800, height: 600 }; // Placeholder
  }

  /**
   * Find all images in directory
   */
  private findImages(dir: string): string[] {
    const images: string[] = [];
    const extensions = ['.jpg', '.jpeg', '.png', '.webp'];

    const scan = (currentDir: string): void => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.includes('optimized')) {
          scan(fullPath);
        } else if (extensions.some(ext => item.toLowerCase().endsWith(ext))) {
          images.push(fullPath);
        }
      }
    };

    scan(dir);
    return images;
  }

  /**
   * Generate responsive image components
   */
  private async generateResponsiveComponents(): Promise<void> {
    console.log('   📱 Generating responsive image components...');

    // Astro component for responsive images
    const astroComponent = `---
// ResponsiveImage.astro
// Responsive image component with lazy loading and modern format support

export interface Props {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  class?: string;
  priority?: boolean;
}

const {
  src,
  alt,
  width,
  height,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  loading = 'lazy',
  class: className = '',
  priority = false,
} = Astro.props;

// Generate srcset for different formats and sizes
const generateSrcSet = (baseSrc: string, format: string) => {
  const breakpoints = [320, 640, 768, 1024, 1280, 1920];
  const baseName = baseSrc.replace(/\\.[^/.]+$/, '');
  const optimizedPath = baseSrc.replace('/images/', '/images/optimized/');
  
  return breakpoints
    .map(bp => \`\${optimizedPath.replace(/\\.[^/.]+$/, '')}.\${format} \${bp}w\`)
    .join(', ');
};

const baseName = src.replace(/\\.[^/.]+$/, '');
const optimizedPath = src.replace('/images/', '/images/optimized/');
---

<picture class={className}>
  <!-- AVIF format (best compression) -->
  <source
    srcset={generateSrcSet(src, 'avif')}
    sizes={sizes}
    type="image/avif"
  />
  
  <!-- WebP format (good compression, wide support) -->
  <source
    srcset={generateSrcSet(src, 'webp')}
    sizes={sizes}
    type="image/webp"
  />
  
  <!-- Fallback to original format -->
  <img
    src={optimizedPath}
    alt={alt}
    width={width}
    height={height}
    loading={priority ? 'eager' : loading}
    decoding="async"
    class="responsive-image"
    style="aspect-ratio: auto;"
  />
</picture>

<style>
  .responsive-image {
    width: 100%;
    height: auto;
    object-fit: cover;
    transition: opacity 0.3s ease;
  }
  
  .responsive-image[loading="lazy"] {
    opacity: 0;
  }
  
  .responsive-image.loaded {
    opacity: 1;
  }
  
  /* Blur placeholder effect */
  .responsive-image.loading {
    filter: blur(5px);
    transform: scale(1.05);
  }
</style>

<script>
  // Lazy loading intersection observer
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          
          // Load the image
          img.onload = () => {
            img.classList.remove('loading');
            img.classList.add('loaded');
          };
          
          // Stop observing this image
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    // Observe all lazy images
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      img.classList.add('loading');
      imageObserver.observe(img);
    });
  }
</script>
`;

    fs.writeFileSync('./src/components/ResponsiveImage.astro', astroComponent);

    // React component for responsive images
    const reactComponent = `import React, { useState, useRef, useEffect } from 'react';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  width,
  height,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  loading = 'lazy',
  className = '',
  priority = false,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px 0px', threshold: 0.01 }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority]);

  const generateSrcSet = (baseSrc: string, format: string) => {
    const breakpoints = [320, 640, 768, 1024, 1280, 1920];
    const optimizedPath = baseSrc.replace('/images/', '/images/optimized/');
    const baseName = optimizedPath.replace(/\\.[^/.]+$/, '');
    
    return breakpoints
      .map(bp => \`\${baseName}.\${format} \${bp}w\`)
      .join(', ');
  };

  const optimizedPath = src.replace('/images/', '/images/optimized/');

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    onError?.();
  };

  return (
    <picture className={className}>
      {isInView && (
        <>
          {/* AVIF format */}
          <source
            srcSet={generateSrcSet(src, 'avif')}
            sizes={sizes}
            type="image/avif"
          />
          
          {/* WebP format */}
          <source
            srcSet={generateSrcSet(src, 'webp')}
            sizes={sizes}
            type="image/webp"
          />
        </>
      )}
      
      {/* Fallback image */}
      <img
        ref={imgRef}
        src={isInView ? optimizedPath : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={\`responsive-image \${isLoaded ? 'loaded' : 'loading'}\`}
        style={{
          width: '100%',
          height: 'auto',
          objectFit: 'cover',
          transition: 'opacity 0.3s ease, filter 0.3s ease',
          opacity: isLoaded ? 1 : 0,
          filter: isLoaded ? 'none' : 'blur(5px)',
        }}
      />
    </picture>
  );
};

export default ResponsiveImage;
`;

    fs.writeFileSync('./src/components/ResponsiveImage.tsx', reactComponent);
    console.log('     ✅ Generated responsive image components');
  }

  /**
   * Generate lazy loading utilities
   */
  private async generateLazyLoadingUtils(): Promise<void> {
    console.log('   ⚡ Generating lazy loading utilities...');

    const lazyLoadingScript = `/**
 * Lazy Loading Utilities
 * Advanced lazy loading with intersection observer and progressive enhancement
 */

class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private images: Set<HTMLImageElement> = new Set();

  constructor() {
    this.init();
  }

  private init(): void {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      this.loadAllImages();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );

    this.observeImages();
  }

  private observeImages(): void {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    lazyImages.forEach((img) => {
      if (img instanceof HTMLImageElement) {
        this.images.add(img);
        this.observer?.observe(img);
        
        // Add loading class for CSS transitions
        img.classList.add('lazy-loading');
      }
    });
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        this.loadImage(img);
        this.observer?.unobserve(img);
        this.images.delete(img);
      }
    });
  }

  private loadImage(img: HTMLImageElement): void {
    // Handle responsive images with picture element
    const picture = img.closest('picture');
    if (picture) {
      const sources = picture.querySelectorAll('source');
      sources.forEach((source) => {
        if (source.dataset.srcset) {
          source.srcset = source.dataset.srcset;
          source.removeAttribute('data-srcset');
        }
      });
    }

    // Load the main image
    if (img.dataset.src) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    }

    // Handle srcset
    if (img.dataset.srcset) {
      img.srcset = img.dataset.srcset;
      img.removeAttribute('data-srcset');
    }

    // Add loaded class when image loads
    img.onload = () => {
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');
      
      // Dispatch custom event
      img.dispatchEvent(new CustomEvent('lazyloaded', {
        bubbles: true,
        detail: { img }
      }));
    };

    // Handle errors
    img.onerror = () => {
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-error');
      
      // Try to load a fallback image
      if (img.dataset.fallback) {
        img.src = img.dataset.fallback;
      }
    };
  }

  private loadAllImages(): void {
    // Fallback: load all images immediately
    this.images.forEach((img) => this.loadImage(img));
  }

  // Public method to add new images dynamically
  public observeNewImages(): void {
    this.observeImages();
  }

  // Public method to disconnect observer
  public disconnect(): void {
    this.observer?.disconnect();
    this.images.clear();
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new LazyImageLoader();
  });
} else {
  new LazyImageLoader();
}

// Export for manual usage
window.LazyImageLoader = LazyImageLoader;

// CSS for lazy loading effects
const lazyLoadingStyles = \`
  .lazy-loading {
    opacity: 0;
    filter: blur(5px);
    transform: scale(1.05);
    transition: opacity 0.3s ease, filter 0.3s ease, transform 0.3s ease;
  }

  .lazy-loaded {
    opacity: 1;
    filter: none;
    transform: scale(1);
  }

  .lazy-error {
    opacity: 0.5;
    filter: grayscale(100%);
  }

  /* Placeholder styles */
  .image-placeholder {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }

  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Responsive image base styles */
  .responsive-image {
    width: 100%;
    height: auto;
    object-fit: cover;
  }

  /* Progressive enhancement for modern browsers */
  @supports (aspect-ratio: 1) {
    .responsive-image {
      aspect-ratio: attr(width) / attr(height);
    }
  }
\`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = lazyLoadingStyles;
document.head.appendChild(styleSheet);
`;

    fs.writeFileSync('./public/js/lazy-loading.js', lazyLoadingScript);
    console.log('     ✅ Generated lazy loading utilities');
  }

  /**
   * Generate image manifest
   */
  private async generateImageManifest(): Promise<void> {
    console.log('   📋 Generating image manifest...');

    const manifest = {
      generated: new Date().toISOString(),
      totalImages: this.optimizedImages.size,
      totalOriginalSize: 0,
      totalOptimizedSize: 0,
      compressionRatio: 0,
      images: Array.from(this.optimizedImages.entries()).map(([path, data]) => {
        const totalOptimized = Object.values(data.metadata.optimizedSizes).reduce((sum, size) => sum + size, 0);
        return {
          path,
          originalSize: data.metadata.originalSize,
          optimizedSizes: data.metadata.optimizedSizes,
          totalOptimizedSize: totalOptimized,
          compressionRatio: ((data.metadata.originalSize - totalOptimized) / data.metadata.originalSize * 100).toFixed(2),
          dimensions: data.metadata.dimensions,
          aspectRatio: data.metadata.aspectRatio,
          formats: Object.keys(data.optimized),
        };
      }),
    };

    // Calculate totals
    manifest.totalOriginalSize = manifest.images.reduce((sum, img) => sum + img.originalSize, 0);
    manifest.totalOptimizedSize = manifest.images.reduce((sum, img) => sum + img.totalOptimizedSize, 0);
    manifest.compressionRatio = ((manifest.totalOriginalSize - manifest.totalOptimizedSize) / manifest.totalOriginalSize * 100);

    fs.writeFileSync(
      path.join(this.config.outputDir, 'image-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    console.log('     ✅ Generated image manifest');
  }

  /**
   * Generate optimization report
   */
  private async generateOptimizationReport(): Promise<void> {
    console.log('   📊 Generating optimization report...');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(this.config.outputDir, 'image-manifest.json'), 'utf-8')
    );

    const report = `# Image Optimization Report

Generated: ${new Date().toLocaleString()}

## Summary

- **Total Images Processed**: ${manifest.totalImages}
- **Original Total Size**: ${this.formatBytes(manifest.totalOriginalSize)}
- **Optimized Total Size**: ${this.formatBytes(manifest.totalOptimizedSize)}
- **Space Saved**: ${this.formatBytes(manifest.totalOriginalSize - manifest.totalOptimizedSize)}
- **Compression Ratio**: ${manifest.compressionRatio.toFixed(2)}%

## Configuration

- **JPEG Quality**: ${this.config.quality.jpeg}%
- **WebP Quality**: ${this.config.quality.webp}%
- **AVIF Quality**: ${this.config.quality.avif}%
- **PNG Quality**: ${this.config.quality.png}%
- **Formats Generated**: ${Object.entries(this.config.formats).filter(([, enabled]) => enabled).map(([format]) => format).join(', ')}
- **Responsive Breakpoints**: ${this.config.breakpoints.join(', ')}px

## Individual Images

| Image | Original Size | Optimized Size | Savings | Formats |
|-------|---------------|----------------|---------|---------|
${manifest.images.map((img: any) => 
  `| ${img.path} | ${this.formatBytes(img.originalSize)} | ${this.formatBytes(img.totalOptimizedSize)} | ${img.compressionRatio}% | ${img.formats.join(', ')} |`
).join('\n')}

## Recommendations

${this.generateRecommendations(manifest)}

## Implementation

To use the optimized images in your application:

1. **Astro Components**: Use \`<ResponsiveImage>\` component
2. **React Components**: Use \`ResponsiveImage\` React component  
3. **Manual HTML**: Include the lazy loading script and use proper picture elements
4. **CDN Integration**: Configure your CDN to serve optimized images with proper cache headers

## Performance Impact

- **Reduced Bandwidth**: ${this.formatBytes(manifest.totalOriginalSize - manifest.totalOptimizedSize)} less data transfer
- **Faster Load Times**: Estimated ${this.estimateLoadTimeImprovement(manifest.compressionRatio)}% improvement
- **Better Core Web Vitals**: Improved LCP and CLS scores
- **Mobile Performance**: Significant improvement on slower connections
`;

    fs.writeFileSync(
      path.join(this.config.outputDir, 'optimization-report.md'),
      report
    );

    console.log('     ✅ Generated optimization report');
  }

  /**
   * Helper methods
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private generateRecommendations(manifest: any): string {
    const recommendations = [];

    if (manifest.compressionRatio < 30) {
      recommendations.push('- Consider increasing compression quality settings for better file size reduction');
    }

    if (manifest.images.some((img: any) => img.originalSize > 1000000)) {
      recommendations.push('- Some images are very large (>1MB). Consider resizing before optimization');
    }

    if (!this.config.formats.avif) {
      recommendations.push('- Enable AVIF format for even better compression (up to 50% smaller than WebP)');
    }

    if (this.config.breakpoints.length < 4) {
      recommendations.push('- Add more responsive breakpoints for better device coverage');
    }

    return recommendations.length > 0 ? recommendations.join('\n') : '- Configuration looks optimal!';
  }

  private estimateLoadTimeImprovement(compressionRatio: number): number {
    // Rough estimation based on compression ratio
    return Math.min(compressionRatio * 0.8, 70); // Cap at 70% improvement
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'optimize';

  const optimizer = new ImageOptimizer();

  switch (command) {
    case 'optimize':
      await optimizer.optimizeImages();
      break;
    case 'help':
      console.log(`
Image Optimization Tool

Usage:
  npm run images:optimize     Optimize all images
  npm run images:help         Show this help message

Examples:
  npm run images:optimize
      `);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "npm run images:help" for usage information');
      process.exit(1);
  }
}

// Run the main function
main().catch(console.error);

export { ImageOptimizer }; 