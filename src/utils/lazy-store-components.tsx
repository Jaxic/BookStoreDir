/**
 * Lazy-loaded Store Components
 * Dynamically imported store-related components
 */

import { withLazyLoading } from '../utils/dynamic-imports';

// Lazy load store search functionality
export const LazyStoreSearch = withLazyLoading(
  () => import('../components/stores/StoreSearch'),
  <div className="h-12 bg-gray-100 animate-pulse rounded-md"></div>
);

// Lazy load store filters
export const LazyStoreFilters = withLazyLoading(
  () => import('../components/stores/StoreFilters'),
  <div className="h-20 bg-gray-100 animate-pulse rounded-md"></div>
);

// Lazy load store details modal
export const LazyStoreDetailsModal = withLazyLoading(
  () => import('../components/stores/StoreDetailsModal'),
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg">Loading store details...</div>
  </div>
);

export default {
  LazyStoreSearch,
  LazyStoreFilters,
  LazyStoreDetailsModal,
};
