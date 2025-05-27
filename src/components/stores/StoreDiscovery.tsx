/** @jsxImportSource react */
import { useState, useEffect } from 'react';
import type { ProcessedBookstore } from '../../types/bookstore';
import StoreSearch, { type StoreFilters } from './StoreSearch';
import StoreList from './StoreList';
import StoreDetails from './StoreDetails';
import { isStoreOpen } from '../../utils/storeHours';

interface StoreDiscoveryProps {
  stores: ProcessedBookstore[];
}

export default function StoreDiscovery({ stores }: StoreDiscoveryProps) {
  const [filteredStores, setFilteredStores] = useState<ProcessedBookstore[]>(stores);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<StoreFilters>({
    openNow: false,
    hasWebsite: false,
    minRating: 0,
  });
  const [selectedStore, setSelectedStore] = useState<ProcessedBookstore | null>(null);

  useEffect(() => {
    let result = [...stores];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(store => 
        store.name?.toLowerCase().includes(query) ||
        store.formattedAddress?.toLowerCase().includes(query) || false
      );
    }

    // Apply filters
    if (filters.openNow) {
      result = result.filter(store => isStoreOpen(store));
    }

    if (filters.hasWebsite) {
      result = result.filter(store => !!store.website);
    }

    if (filters.minRating > 0) {
      result = result.filter(store => 
        store.ratingInfo && 
        store.ratingInfo.rating >= filters.minRating
      );
    }

    setFilteredStores(result);
  }, [stores, searchQuery, filters]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: StoreFilters) => {
    setFilters(newFilters);
  };

  const handleStoreClick = (store: ProcessedBookstore) => {
    setSelectedStore(store);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with search and filters */}
        <div className="lg:col-span-1">
          <StoreSearch 
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Main content area */}
        <div className="lg:col-span-3">
          <StoreList 
            stores={filteredStores}
            onStoreClick={handleStoreClick}
          />
        </div>
      </div>

      {/* Store details modal */}
      {selectedStore && (
        <StoreDetails
          store={selectedStore}
          isOpen={true}
          onClose={() => setSelectedStore(null)}
        />
      )}
    </div>
  );
} 