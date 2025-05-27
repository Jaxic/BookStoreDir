/** @jsxImportSource react */
import { useState, useMemo } from 'react';
import type { ProcessedBookstore } from '../../types/bookstore';
import StoreCard from './StoreCard';

interface StoreListProps {
  stores: ProcessedBookstore[];
  onStoreClick?: (store: ProcessedBookstore) => void;
}

const INITIAL_DISPLAY_COUNT = 12; // Show 12 stores initially (4 rows of 3)
const LOAD_MORE_COUNT = 9; // Load 9 more stores each time (3 rows of 3)

export default function StoreList({ stores, onStoreClick }: StoreListProps) {
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);
  const storeCount = stores.length;

  // Memoize displayed stores to prevent unnecessary recalculations
  const displayedStores = useMemo(() => {
    return stores.slice(0, displayCount);
  }, [stores, displayCount]);

  const hasMoreStores = displayCount < storeCount;

  const handleLoadMore = () => {
    setDisplayCount(prev => Math.min(prev + LOAD_MORE_COUNT, storeCount));
  };

  // Reset display count when stores change (e.g., new search/filter)
  useMemo(() => {
    setDisplayCount(INITIAL_DISPLAY_COUNT);
  }, [stores]);

  if (storeCount === 0) {
    return (
      <section 
        id="search-results"
        className="text-center py-12"
        aria-live="polite"
        aria-label="Search results"
      >
        <svg 
          className="mx-auto h-12 w-12 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <h2 className="mt-2 text-sm font-medium text-gray-900">No bookstores found</h2>
        <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters to find bookstores in your area.</p>
      </section>
    );
  }

  return (
    <section 
      id="search-results"
      aria-live="polite"
      aria-label="Search results"
    >
      {/* Results summary for screen readers */}
      <div className="sr-only" aria-live="polite">
        {storeCount === 1 
          ? "Found 1 bookstore" 
          : `Found ${storeCount} bookstores`
        }
      </div>
      
      {/* Visual results summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {storeCount === 1 
            ? "Showing 1 bookstore" 
            : `Showing ${displayedStores.length} of ${storeCount} bookstores`
          }
        </p>
      </div>

      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        role="list"
        aria-label="Bookstore results"
      >
        {displayedStores.map((store) => (
          <div key={store.place_id} role="listitem">
            <StoreCard 
              store={store} 
              onClick={() => onStoreClick?.(store)}
            />
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMoreStores && (
        <div className="mt-8 text-center">
          <button
            onClick={handleLoadMore}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            aria-label={`Load ${Math.min(LOAD_MORE_COUNT, storeCount - displayCount)} more bookstores`}
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Load More ({storeCount - displayCount} remaining)
          </button>
        </div>
      )}
    </section>
  );
} 