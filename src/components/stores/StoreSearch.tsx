/** @jsxImportSource react */
import type { ChangeEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import { getSearchSuggestions } from '../../lib/search';
import type { ProcessedBookstore } from '../../types/bookstore';

interface StoreSearchProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: StoreFilters) => void;
  stores: ProcessedBookstore[];
}

export interface StoreFilters {
  openNow: boolean;
  hasWebsite: boolean;
  minRating: number;
  province: string;
  priceLevel: string;
  maxDistance: number | null;
  openLate: boolean;
  openWeekends: boolean;
}

const PROVINCES = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Nova Scotia',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Northwest Territories',
  'Nunavut',
  'Yukon'
];

const PRICE_LEVELS = [
  { value: '', label: 'Any Price' },
  { value: '$', label: 'Budget ($)' },
  { value: '$$', label: 'Moderate ($$)' },
  { value: '$$$', label: 'Expensive ($$$)' }
];

export default function StoreSearch({ onSearch, onFilterChange, stores }: StoreSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState<StoreFilters>({
    openNow: false,
    hasWebsite: false,
    minRating: 0,
    province: '',
    priceLevel: '',
    maxDistance: null,
    openLate: false,
    openWeekends: false
  });
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery) {
      const newSuggestions = getSearchSuggestions(stores, searchQuery);
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, stores]);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true);
    onSearch(value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  const handleFilterChange = (key: keyof StoreFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search bookstores..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div ref={suggestionsRef} className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow">
        {/* Basic Filters */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="openNow"
              checked={filters.openNow}
              onChange={e => handleFilterChange('openNow', e.target.checked)}
              className="rounded text-blue-600"
            />
            <label htmlFor="openNow">Open Now</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hasWebsite"
              checked={filters.hasWebsite}
              onChange={e => handleFilterChange('hasWebsite', e.target.checked)}
              className="rounded text-blue-600"
            />
            <label htmlFor="hasWebsite">Has Website</label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="openLate"
              checked={filters.openLate}
              onChange={e => handleFilterChange('openLate', e.target.checked)}
              className="rounded text-blue-600"
            />
            <label htmlFor="openLate">Open Late (after 8 PM)</label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="openWeekends"
              checked={filters.openWeekends}
              onChange={e => handleFilterChange('openWeekends', e.target.checked)}
              className="rounded text-blue-600"
            />
            <label htmlFor="openWeekends">Open on Weekends</label>
          </div>
        </div>

        {/* Rating and Price Filters */}
        <div className="space-y-4">
          <div>
            <label htmlFor="minRating" className="block text-sm font-medium text-gray-700">
              Minimum Rating
            </label>
            <select
              id="minRating"
              value={filters.minRating}
              onChange={e => handleFilterChange('minRating', Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value={0}>Any Rating</option>
              <option value={3}>3+ Stars</option>
              <option value={4}>4+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
            </select>
          </div>

          <div>
            <label htmlFor="priceLevel" className="block text-sm font-medium text-gray-700">
              Price Level
            </label>
            <select
              id="priceLevel"
              value={filters.priceLevel}
              onChange={e => handleFilterChange('priceLevel', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {PRICE_LEVELS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location Filters */}
        <div className="space-y-4">
          <div>
            <label htmlFor="province" className="block text-sm font-medium text-gray-700">
              Province
            </label>
            <select
              id="province"
              value={filters.province}
              onChange={e => handleFilterChange('province', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Provinces</option>
              {PROVINCES.map(province => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="maxDistance" className="block text-sm font-medium text-gray-700">
              Maximum Distance (km)
            </label>
            <select
              id="maxDistance"
              value={filters.maxDistance || ''}
              onChange={e => handleFilterChange('maxDistance', e.target.value ? Number(e.target.value) : null)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Any Distance</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
