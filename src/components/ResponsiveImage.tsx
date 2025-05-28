import React, { useState, useRef, useEffect } from 'react';

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
    const baseName = optimizedPath.replace(/\.[^/.]+$/, '');
    
    return breakpoints
      .map(bp => `${baseName}.${format} ${bp}w`)
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
        className={`responsive-image ${isLoaded ? 'loaded' : 'loading'}`}
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
