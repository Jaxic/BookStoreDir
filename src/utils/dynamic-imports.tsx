/**
 * Dynamic Import Utilities
 * Advanced utilities for code splitting and lazy loading
 */

import { lazy, Suspense, ComponentType, ReactElement } from 'react';

// Loading component for suspense fallbacks
export const LoadingSpinner = ({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}></div>
    </div>
  );
};

// Error boundary for lazy components
export class LazyComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: ReactElement },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center text-red-600">
          <p>Failed to load component. Please refresh the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for lazy loading with error boundary
export function withLazyLoading<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactElement
) {
  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <LazyComponentErrorBoundary fallback={fallback}>
        <Suspense fallback={fallback || <LoadingSpinner />}>
          <LazyComponent {...props} />
        </Suspense>
      </LazyComponentErrorBoundary>
    );
  };
}

// Preload utility for critical components
export function preloadComponent(importFn: () => Promise<any>): void {
  // Preload on idle or after a delay
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => importFn());
  } else {
    setTimeout(() => importFn(), 100);
  }
}

// Route-based preloading
export function preloadRoute(routePath: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = routePath;
  document.head.appendChild(link);
}

// Intersection observer for component preloading
export function useIntersectionPreload(
  ref: React.RefObject<HTMLElement>,
  importFn: () => Promise<any>,
  options: IntersectionObserverInit = {}
) {
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          preloadComponent(importFn);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', ...options }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, importFn]);
}

// Bundle size analyzer (development only)
export const analyzeBundleSize = (componentName: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Loading component: ${componentName}`);
    
    // Measure performance
    const start = performance.now();
    return () => {
      const end = performance.now();
      console.log(`${componentName} loaded in ${(end - start).toFixed(2)}ms`);
    };
  }
  return () => {};
};

export default {
  LoadingSpinner,
  LazyComponentErrorBoundary,
  withLazyLoading,
  preloadComponent,
  preloadRoute,
  useIntersectionPreload,
  analyzeBundleSize,
};
