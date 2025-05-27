/** @jsxImportSource react */
import { useEffect, useRef } from 'react';
import type { ProcessedBookstore } from '../../types/bookstore';
import { getStoreImage } from '../../utils/images';

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

  const formattedAddress = `${store.address}, ${store.city}, ${store.province} ${store.zip}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose} />

        {/* Modal panel */}
        <div 
          ref={modalRef}
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
        >
          {/* Store Image */}
          <div className="relative h-64 sm:h-72">
            <img
              src={getStoreImage(store.photos_url)}
              alt={`${store.name} storefront`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
              aria-label="Close"
            >
              <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-2xl leading-6 font-semibold text-gray-900 mb-4">
                  {store.name}
                </h3>

                <p className="text-gray-600 mb-4">
                  {formattedAddress}
                </p>

                {/* Rating and Price Level */}
                <div className="flex items-center mb-4">
                  {store.rating && (
                    <div className="flex items-center">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span className="text-gray-600">{store.rating}</span>
                    </div>
                  )}
                  {store.price_level && (
                    <div className="text-gray-600 ml-2">
                      {'$'.repeat(store.price_level)}
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  {store.website && (
                    <a
                      href={store.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 block"
                    >
                      Visit Website
                    </a>
                  )}
                  {store.phone && (
                    <a
                      href={`tel:${store.phone}`}
                      className="text-blue-600 hover:text-blue-800 block"
                    >
                      {store.phone}
                    </a>
                  )}
                </div>

                {/* Store Types */}
                {store.types && store.types.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900">Categories</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {store.types.map((type) => (
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
  );
} 