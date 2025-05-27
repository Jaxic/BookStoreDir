/** @jsxImportSource react */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { ProcessedBookstore } from '../../types/bookstore';
import { getImageFallbacks } from '../../utils/images';

interface StoreDetailsProps {
  store: ProcessedBookstore;
  isOpen: boolean;
  onClose: () => void;
}

export default function StoreDetails({ store, isOpen, onClose }: StoreDetailsProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  // Get image fallbacks using store name (prioritizes local store images)
  const fallbackImages = getImageFallbacks(store.photos_url, store.name);
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

  // Reset image when store changes
  useEffect(() => {
    const newFallbacks = getImageFallbacks(store.photos_url, store.name);
    setCurrentImageIndex(0);
    setCurrentImageSrc(newFallbacks[0]);
  }, [store.photos_url, store.name]);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    } else {
      previousFocusRef.current?.focus();
    }

    return () => {
      if (!isOpen && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  // Handle escape key and outside clicks
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape as any);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape as any);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const formatAddress = () => {
    return `${store.address}, ${store.city}, ${store.province} ${store.zip}`;
  };

  const formatHours = () => {
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return daysOfWeek.map((day, index) => {
      const hours = store.hours[day as keyof typeof store.hours];
      return {
        day: dayLabels[index],
        hours: hours || 'Closed'
      };
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start rounded-t-lg">
          <div>
            <h2 
              id="store-modal-title" 
              className="text-2xl font-bold text-gray-900 mb-1"
            >
              {store.name}
            </h2>
            <p className="text-gray-600">{formatAddress()}</p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Image and Basic Info */}
            <div>
              {/* Store Image */}
              <div className="mb-6">
                <img
                  src={currentImageSrc}
                  alt={`${store.name} storefront`}
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                  onError={handleImageError}
                />
              </div>

              {/* Rating */}
              {store.ratingInfo && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${
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
                    <span className="text-lg font-semibold text-gray-900">
                      {store.ratingInfo.rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({store.ratingInfo.numReviews} reviews)
                    </span>
                  </div>
                </div>
              )}

              {/* Description */}
              {store.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-600 leading-relaxed">{store.description}</p>
                </div>
              )}
            </div>

            {/* Right Column - Hours and Contact */}
            <div>
              {/* Contact Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-900">{formatAddress()}</span>
                  </div>
                  
                  {store.phone && (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a 
                        href={`tel:${store.phone}`}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {store.phone}
                      </a>
                    </div>
                  )}
                  
                  {store.website && (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <a 
                        href={store.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Hours */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hours</h3>
                <div className="space-y-2">
                  {formatHours().map(({ day, hours }) => (
                    <div key={day} className="flex justify-between items-center py-1">
                      <span className="text-gray-600 font-medium">{day}</span>
                      <span className={`text-sm ${hours === 'Closed' ? 'text-red-600' : 'text-gray-900'}`}>
                        {hours}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          {store.ratingInfo?.reviews && store.ratingInfo.reviews.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h3>
              <div className="space-y-4">
                {store.ratingInfo.reviews.slice(0, 3).map((review, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-900">{review.author}</span>
                      <span className="ml-2 text-sm text-gray-500">{review.time}</span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 