/** @jsxImportSource react */
import type { ChangeEvent } from 'react';
import { useState } from 'react';

interface StoreSearchProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: StoreFilters) => void;
}

export interface StoreFilters {
  openNow: boolean;
  hasWebsite: boolean;
  minRating: number;
}

export default function StoreSearch({ onSearch, onFilterChange }: StoreSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<StoreFilters>({
    openNow: false,
    hasWebsite: false,
    minRating: 0,
  });

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleFilterChange = (filterKey: keyof StoreFilters, value: boolean | number) => {
    const newFilters = {
      ...filters,
      [filterKey]: value,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search bookstores..."
            className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-gray-900 text-base transition duration-150 ease-in-out"
          />
        </div>
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Refine Results</h3>
        
        <div className="space-y-3">
          {/* Open Now Filter */}
          <div className="flex items-center justify-between">
            <label htmlFor="openNow" className="flex items-center cursor-pointer group">
              <div className="mr-3">
                <svg className="h-5 w-5 text-gray-500 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm text-gray-700 group-hover:text-gray-900">Open Now</span>
            </label>
            <button
              role="switch"
              aria-checked={filters.openNow}
              onClick={() => handleFilterChange('openNow', !filters.openNow)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                filters.openNow ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  filters.openNow ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Has Website Filter */}
          <div className="flex items-center justify-between">
            <label htmlFor="hasWebsite" className="flex items-center cursor-pointer group">
              <div className="mr-3">
                <svg className="h-5 w-5 text-gray-500 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <span className="text-sm text-gray-700 group-hover:text-gray-900">Has Website</span>
            </label>
            <button
              role="switch"
              aria-checked={filters.hasWebsite}
              onClick={() => handleFilterChange('hasWebsite', !filters.hasWebsite)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                filters.hasWebsite ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  filters.hasWebsite ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Minimum Rating Filter */}
          <div>
            <label htmlFor="minRating" className="flex items-center text-sm text-gray-700 mb-2 group">
              <div className="mr-3">
                <svg className="h-5 w-5 text-gray-500 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <span className="group-hover:text-gray-900">Minimum Rating</span>
            </label>
            <select
              id="minRating"
              value={filters.minRating}
              onChange={(e) => handleFilterChange('minRating', Number(e.target.value))}
              className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition duration-150 ease-in-out"
            >
              <option value={0}>Any Rating</option>
              <option value={3}>3+ Stars</option>
              <option value={4}>4+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
