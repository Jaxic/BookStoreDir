/** @jsxImportSource react */
import { useState, useEffect } from 'react';
import type { ProcessedBookstore } from '../../types/bookstore';
import StoreSearch, { type StoreFilters } from './StoreSearch';
import StoreList from './StoreList';
import StoreDetails from './StoreDetails';
import { isStoreOpen } from '../../utils/storeHours';
import { searchStores, initializeSearch } from '../../lib/search';

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
    province: '',
    priceLevel: '',
    maxDistance: null,
    openLate: false,
    openWeekends: false,
  });
  const [selectedStore, setSelectedStore] = useState<ProcessedBookstore | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize search when component mounts
  useEffect(() => {
    initializeSearch(stores);
  }, [stores]);

  // Update filtered stores when search query or filters change
  useEffect(() => {
    let isMounted = true;

    const updateSearch = async () => {
      setIsSearching(true);
      try {
        const results = await searchStores(stores, searchQuery, filters);
        if (isMounted) {
          setFilteredStores(results);
        }
      } catch (error) {
        console.error('Error searching stores:', error);
        if (isMounted) {
          setFilteredStores(stores); // Fallback to all stores on error
        }
      } finally {
        if (isMounted) {
          setIsSearching(false);
        }
      }
    };

    updateSearch();

    return () => {
      isMounted = false;
    };
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

  const handleCloseDetails = () => {
    setSelectedStore(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <StoreSearch 
        onSearch={handleSearch} 
        onFilterChange={handleFilterChange}
        stores={stores}
      />
      <div className="mt-6">
        {isSearching ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <StoreList stores={filteredStores} onStoreClick={handleStoreClick} />
        )}
      </div>
      {selectedStore && (
        <StoreDetails
          store={selectedStore}
          isOpen={isStoreOpen(selectedStore)}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
} 