/** @jsxImportSource react */
import { useState, type KeyboardEvent, memo, useMemo } from 'react';
import type { ProcessedBookstore } from '../../types/bookstore';
import { getImageFallbacks } from '../../utils/images';
import { useLazyLoad } from '../../hooks/useLazyLoad';
import ImageSkeleton from '../ui/ImageSkeleton';

interface StoreCardProps {
  store: ProcessedBookstore;
  onClick: () => void;
}

function StoreCard({ store, onClick }: StoreCardProps) {
  // Get image fallbacks using store name (prioritizes local store images)
  const fallbackImages = useMemo(() => 
    getImageFallbacks(store.photos_url, store.name), 
    [store.photos_url, store.name]
  );
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImageSrc, setCurrentImageSrc] = useState(fallbackImages[0]);
  
  // Lazy loading hook
  const { elementRef, isVisible, isLoaded, handleImageLoad, handleImageError: onImageError } = useLazyLoad<HTMLButtonElement>({
    rootMargin: '200px 0px', // Start loading 200px before entering viewport
    threshold: 0.1
  });

  // Handle image loading error by trying next fallback
  const handleImageError = () => {
    const nextIndex = currentImageIndex + 1;
    if (nextIndex < fallbackImages.length) {
      setCurrentImageIndex(nextIndex);
      setCurrentImageSrc(fallbackImages[nextIndex]);
    }
    onImageError(); // Also call the lazy load error handler
  };

  const handleClick = () => {
    onClick();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  const handleLinkClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const formatRating = (ratingInfo: any) => {
    if (!ratingInfo?.rating) return 'No rating';
    return `${ratingInfo.rating.toFixed(1)}`;
  };

  const formatNumReviews = (ratingInfo: any) => {
    if (!ratingInfo?.numReviews) return '';
    return `(${ratingInfo.numReviews} reviews)`;
  };

  return (
    <button
      ref={elementRef}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="w-full h-full bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden transform hover:scale-[1.02] cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex flex-col"
      aria-label={`View details for ${store.name}`}
    >
      {/* Image Section - Fixed height for consistency */}
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        {!isVisible ? (
          // Show skeleton while not in viewport
          <ImageSkeleton className="w-full h-full" />
        ) : !isLoaded ? (
          // Show skeleton while image is loading
          <>
            <ImageSkeleton className="w-full h-full" />
            <img
              src={currentImageSrc}
              alt={`${store.name} storefront`}
              className="w-full h-full object-cover opacity-0 absolute inset-0"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </>
        ) : (
          // Show actual image when loaded
          <img
            src={currentImageSrc}
            alt={`${store.name} storefront`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
          />
        )}
      </div>

      {/* Content Section - Flexible height to fill remaining space */}
      <div className="p-4 text-left flex-1 flex flex-col justify-between">
        <div className="flex-1">
          {/* Store Name */}
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {store.name}
          </h3>

          {/* Description */}
          {store.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {store.description}
            </p>
          )}

          {/* Location */}
          <p className="text-sm text-gray-500 mb-2 line-clamp-1">
            {store.city}, {store.province}
          </p>

          {/* Rating */}
          {store.ratingInfo && (
            <div className="flex items-center gap-1 mb-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <img
                    key={i}
                    src="/images/logo.png"
                    alt="Born Again Books logo"
                    className={`w-4 h-4 ${i < Math.floor(store.ratingInfo?.rating || 0) ? '' : 'opacity-30'}`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {formatRating(store.ratingInfo)}
              </span>
              {formatNumReviews(store.ratingInfo)}
            </div>
          )}
        </div>

        {/* Contact Info - Pinned to bottom */}
        <div className="flex gap-3 mt-auto pt-2">
          {store.website && (
            <a
              href={store.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleLinkClick}
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              aria-label={`Visit ${store.name} website`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="text-xs">Website</span>
            </a>
          )}
          {store.phone && (
            <a
              href={`tel:${store.phone}`}
              onClick={handleLinkClick}
              className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
              aria-label={`Call ${store.name} at ${store.phone}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-xs">Phone</span>
            </a>
          )}
        </div>
      </div>
    </button>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(StoreCard, (prevProps, nextProps) => {
  // Custom comparison function to optimize re-renders
  return (
    prevProps.store.place_id === nextProps.store.place_id &&
    prevProps.store.name === nextProps.store.name &&
    prevProps.store.status === nextProps.store.status &&
    prevProps.onClick === nextProps.onClick
  );
}); 