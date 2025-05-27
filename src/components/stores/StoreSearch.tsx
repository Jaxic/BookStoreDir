/** @jsxImportSource react */
import type { ChangeEvent, KeyboardEvent } from 'react';
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
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
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
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    setActiveSuggestionIndex(-1);
    onSearch(value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    onSearch(suggestion);
    searchInputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[activeSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
    }
  };

  const handleFilterChange = (key: keyof StoreFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchId = 'bookstore-search';
  const suggestionsId = 'search-suggestions';

  return (
    <div className="space-y-4">
      {/* Skip Link */}
      <a 
        href="#search-results" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to search results
      </a>

      {/* Search Input */}
      <div className="relative" role="search" aria-label="Search bookstores">
        <label htmlFor={searchId} className="sr-only">
          Search bookstores by name, location, or category
        </label>
        <input
          ref={searchInputRef}
          id={searchId}
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          placeholder="Search bookstores..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
          aria-autocomplete="list"
          aria-expanded={showSuggestions && suggestions.length > 0}
          aria-controls={showSuggestions ? suggestionsId : undefined}
          aria-activedescendant={
            activeSuggestionIndex >= 0 ? `suggestion-${activeSuggestionIndex}` : undefined
          }
          role="combobox"
        />
        
        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            ref={suggestionsRef} 
            id={suggestionsId}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg"
            role="listbox"
            aria-label="Search suggestions"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                id={`suggestion-${index}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                  index === activeSuggestionIndex ? 'bg-blue-50 text-blue-900' : ''
                }`}
                role="option"
                aria-selected={index === activeSuggestionIndex}
                tabIndex={-1}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters Section */}
      <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow">
        <legend className="sr-only">Filter bookstores</legend>
        
        {/* Basic Filters */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Filters</h3>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="openNow"
              checked={filters.openNow}
              onChange={e => handleFilterChange('openNow', e.target.checked)}
              className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="openNow" className="text-sm text-gray-700">Open Now</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hasWebsite"
              checked={filters.hasWebsite}
              onChange={e => handleFilterChange('hasWebsite', e.target.checked)}
              className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="hasWebsite" className="text-sm text-gray-700">Has Website</label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="openLate"
              checked={filters.openLate}
              onChange={e => handleFilterChange('openLate', e.target.checked)}
              className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="openLate" className="text-sm text-gray-700">Open Late (after 8 PM)</label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="openWeekends"
              checked={filters.openWeekends}
              onChange={e => handleFilterChange('openWeekends', e.target.checked)}
              className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="openWeekends" className="text-sm text-gray-700">Open on Weekends</label>
          </div>
        </div>

        {/* Rating and Price Filters */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Quality & Price</h3>
          <div>
            <label htmlFor="minRating" className="block text-sm font-medium text-gray-700">
              Minimum Rating
            </label>
            <select
              id="minRating"
              value={filters.minRating}
              onChange={e => handleFilterChange('minRating', Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2"
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2"
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
          <h3 className="text-sm font-medium text-gray-700 mb-2">Location</h3>
          <div>
            <label htmlFor="province" className="block text-sm font-medium text-gray-700">
              Province
            </label>
            <select
              id="province"
              value={filters.province}
              onChange={e => handleFilterChange('province', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2"
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2"
            >
              <option value="">Any Distance</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
            </select>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
