/** @jsxImportSource react */
import { useState, useMemo } from 'react';
import type { ProcessedBookstore } from '../../types/bookstore';
import type { StoreFilters } from './StoreSearch';
import StoreMap from '../map/StoreMap';
import StoreSearch from './StoreSearch';
import StoreDetails from './StoreDetails';
import { searchStores } from '../../lib/search';

interface StoreMapViewProps {
  stores: ProcessedBookstore[];
}

export default function StoreMapView({ stores }: StoreMapViewProps) {
  const [filteredStores, setFilteredStores] = useState<ProcessedBookstore[]>(stores);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<StoreFilters>({
    hasWebsite: false,
    minRating: 0,
    province: '',
    maxDistance: null,
    openWeekends: false,
  });
  const [selectedStore, setSelectedStore] = useState<ProcessedBookstore | null>(null);
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(false);

  // Filter stores based on search and filters
  const updateFilteredStores = async (query: string, storeFilters: StoreFilters) => {
    try {
      const results = await searchStores(stores, query, storeFilters);
      setFilteredStores(results);
    } catch (error) {
      console.error('Error filtering stores:', error);
      setFilteredStores(stores);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    await updateFilteredStores(query, filters);
  };

  const handleFilterChange = async (newFilters: StoreFilters) => {
    setFilters(newFilters);
    await updateFilteredStores(searchQuery, newFilters);
  };

  const handleStoreSelect = (store: ProcessedBookstore) => {
    setSelectedStore(store);
  };

  const handleCloseDetails = () => {
    setSelectedStore(null);
  };

  const toggleSearchCollapse = () => {
    setIsSearchCollapsed(!isSearchCollapsed);
  };

  // Memoize the filtered stores count for performance
  const filteredCount = useMemo(() => filteredStores.length, [filteredStores]);
  const totalCount = useMemo(() => stores.length, [stores]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Search Panel - Collapsible on mobile */}
      <div className={`bg-white border-b border-gray-200 transition-all duration-300 ${isSearchCollapsed ? 'h-16' : 'h-auto'} relative z-20`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with toggle button */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Bookstore Map
              </h2>
              <div className="text-sm text-gray-600">
                Showing {filteredCount} of {totalCount} stores
              </div>
            </div>
            
            {/* View Toggle - Hidden on mobile when search is collapsed */}
            <div className={`hidden sm:flex gap-2 ${isSearchCollapsed ? 'md:flex' : ''}`}>
              <a 
                href="/" 
                className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List View
              </a>
              <span className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Map View
              </span>
            </div>
            
            {/* Toggle button for mobile */}
            <button
              onClick={toggleSearchCollapse}
              className="md:hidden bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={isSearchCollapsed ? 'Show search filters' : 'Hide search filters'}
            >
              <svg 
                className={`w-5 h-5 text-gray-600 transform transition-transform ${isSearchCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Search and Filters - Collapsible */}
          <div className={`transition-all duration-300 overflow-hidden ${isSearchCollapsed ? 'max-h-0 pb-0' : 'max-h-96 pb-4'}`}>
            <StoreSearch
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
              stores={stores}
            />
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <StoreMap
          stores={filteredStores}
          selectedStore={selectedStore}
          onStoreSelect={handleStoreSelect}
          height="100%"
          className="w-full h-full"
        />

        {/* Quick Stats Overlay */}
        <div className="absolute top-4 left-4 z-10 bg-white px-4 py-2 rounded-lg shadow-md">
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="font-semibold text-gray-900">{filteredCount}</span>
              <span className="text-gray-600 ml-1">
                store{filteredCount !== 1 ? 's' : ''} shown
              </span>
            </div>
            {filteredCount !== totalCount && (
              <div className="text-xs text-gray-500">
                of {totalCount} total
              </div>
            )}
          </div>
        </div>

        {/* Reset Filters Button - Show when filters are active */}
        {(searchQuery || filters.province || filters.hasWebsite || filters.minRating > 0 || filters.maxDistance || filters.openWeekends) && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <button
              onClick={() => {
                setSearchQuery('');
                const resetFilters: StoreFilters = {
                  hasWebsite: false,
                  minRating: 0,
                  province: '',
                  maxDistance: null,
                  openWeekends: false,
                };
                setFilters(resetFilters);
                updateFilteredStores('', resetFilters);
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-sm font-medium">Clear Filters</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Store Details Modal */}
      {selectedStore && (
        <StoreDetails
          store={selectedStore}
          isOpen={!!selectedStore}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
} 