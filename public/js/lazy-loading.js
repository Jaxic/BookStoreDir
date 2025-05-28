/**
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
const lazyLoadingStyles = `
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
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = lazyLoadingStyles;
document.head.appendChild(styleSheet);
