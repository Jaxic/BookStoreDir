/** @jsxImportSource react */
import { useEffect, useRef } from 'react';
import type { ProcessedBookstore } from '../../types/bookstore';

interface StoreDetailsProps {
  store: ProcessedBookstore;
  isOpen: boolean;
  onClose: () => void;
}

export default function StoreDetails({ store, isOpen, onClose }: StoreDetailsProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const {
    name,
    formattedAddress,
    ratingInfo,
    website,
    phone,
    status,
    hours,
    photos,
    priceLevel,
    types,
  } = store;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose} />

        {/* Modal panel */}
        <div 
          ref={modalRef}
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content */}
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-2xl leading-6 font-semibold text-gray-900" id="modal-title">
                  {name}
                </h3>

                {/* Main details */}
                <div className="mt-4">
                  <p className="text-gray-600">{formattedAddress}</p>
                  
                  {/* Rating and price level */}
                  <div className="flex items-center mt-2 space-x-4">
                    {ratingInfo && (
                      <div className="flex items-center">
                        <span className="text-yellow-500">★</span>
                        <span className="ml-1">{ratingInfo.rating}</span>
                        <span className="text-gray-500 ml-1">({ratingInfo.numReviews} reviews)</span>
                      </div>
                    )}
                    {priceLevel && (
                      <div className="text-gray-600">
                        {'$'.repeat(priceLevel)}
                      </div>
                    )}
                  </div>

                  {/* Status and hours */}
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900">Hours of Operation</h4>
                    {hours && (
                      <div className="mt-2 space-y-1">
                        {Object.entries(hours).map(([day, timeRange]) => (
                          <div key={day} className="flex justify-between text-sm">
                            <span className="capitalize">{day}</span>
                            <span className="text-gray-600">{timeRange || 'Closed'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Contact information */}
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900">Contact Information</h4>
                    <div className="mt-2 space-y-2">
                      {website && (
                        <a
                          href={website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 block"
                        >
                          Visit Website
                        </a>
                      )}
                      {phone && (
                        <a
                          href={`tel:${phone}`}
                          className="text-blue-600 hover:text-blue-800 block"
                        >
                          {phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Store types */}
                  {types && types.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900">Categories</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {types.map((type: string) => (
                          <span
                            key={type}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {type.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 