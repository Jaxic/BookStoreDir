/** @jsxImportSource react */
import { useState } from 'react';
import type { ProcessedBookstore } from '../../types/bookstore';

interface StoreCardProps {
  store: ProcessedBookstore;
  onClick: () => void;
}

export default function StoreCard({ store, onClick }: StoreCardProps) {
  const [imageError, setImageError] = useState(false);
  const isOpen = store.status !== 'CLOSED' && store.status !== 'TEMPORARILY_CLOSED';

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
          src={imageError ? 'https://placehold.co/400x300?text=No+Image' : store.photos_url}
          alt={`${store.name} storefront`}
          className="w-full h-full object-cover"
          onError={handleImageError}
          loading="lazy"
        />
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-sm font-medium ${
          isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {isOpen ? 'Open' : 'Closed'}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 truncate">{store.name}</h3>
        {store.ratingInfo && (
          <div className="flex items-center mb-2">
            <span className="text-yellow-400 mr-1">★</span>
            <span className="text-gray-700">{store.ratingInfo.rating.toFixed(1)}</span>
          </div>
        )}
        <p className="text-gray-600 text-sm mb-2 truncate">{store.formattedAddress}</p>
        {store.phone && (
          <p className="text-gray-600 text-sm mb-2">
            {store.phone}
          </p>
        )}
        {store.website && (
          <a
            href={store.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm block truncate"
            onClick={(e) => e.stopPropagation()}
          >
            Visit Website
          </a>
        )}
      </div>
    </div>
  );
} 