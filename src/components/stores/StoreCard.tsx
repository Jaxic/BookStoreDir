/** @jsxImportSource react */
import { useState, type KeyboardEvent, memo, useMemo } from 'react';
import type { ProcessedBookstore } from '../../types/bookstore';
import { getImageFallbacks } from '../../utils/images';

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
  


  // Handle image loading error by trying next fallback
  const handleImageError = () => {
    const nextIndex = currentImageIndex + 1;
    if (nextIndex < fallbackImages.length) {
      setCurrentImageIndex(nextIndex);
      setCurrentImageSrc(fallbackImages[nextIndex]);
    }
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
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="w-full bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden transform hover:scale-[1.02] cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label={`View details for ${store.name}`}
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={currentImageSrc}
          alt={`${store.name} storefront`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={handleImageError}
          loading="lazy"
        />

      </div>

      {/* Content Section */}
      <div className="p-4 text-left">
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
                <svg
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(store.ratingInfo?.rating || 0)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {formatRating(store.ratingInfo)}
            </span>
            <span className="text-xs text-gray-500">
              {formatNumReviews(store.ratingInfo)}
            </span>
          </div>
        )}

        {/* Contact Info */}
        <div className="flex gap-3">
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