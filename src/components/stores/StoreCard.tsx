/** @jsxImportSource react */
import { useState } from 'react';
import type { ProcessedBookstore } from '../../types/bookstore';
import { isStoreOpen } from '../../utils/storeHours';
import { getStoreImage } from '../../utils/images';

interface StoreCardProps {
  store: ProcessedBookstore;
  onClick: () => void;
}

export default function StoreCard({ store, onClick }: StoreCardProps) {
  const [imageError, setImageError] = useState(false);
  const isOpen = isStoreOpen(store);

  // Handle image loading error
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageError ? getStoreImage(null) : getStoreImage(store.photos_url)}
          alt={`${store.name} storefront`}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-sm font-medium ${
          isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {isOpen ? 'Open' : 'Closed'}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{store.name}</h3>
        <p className="text-gray-600 text-sm mb-2">
          {store.address}, {store.city}, {store.province} {store.zip}
        </p>
        {store.rating && (
          <div className="flex items-center mb-2">
            <span className="text-yellow-500 mr-1">★</span>
            <span className="text-sm text-gray-600">{store.rating}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {store.website && (
            <a
              href={store.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              Website
            </a>
          )}
          {store.phone && (
            <a
              href={`tel:${store.phone}`}
              className="text-blue-600 hover:text-blue-800 text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {store.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
} 