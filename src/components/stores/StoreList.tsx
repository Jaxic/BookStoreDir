/** @jsxImportSource react */
import type { ProcessedBookstore } from '../../types/bookstore';
import StoreCard from './StoreCard';

interface StoreListProps {
  stores: ProcessedBookstore[];
  onStoreClick?: (store: ProcessedBookstore) => void;
}

export default function StoreList({ stores, onStoreClick }: StoreListProps) {
  if (stores.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No bookstores found</h3>
        <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {stores.map((store) => (
        <StoreCard 
          key={store.place_id} 
          store={store} 
          onClick={() => onStoreClick?.(store)}
        />
      ))}
    </div>
  );
} 