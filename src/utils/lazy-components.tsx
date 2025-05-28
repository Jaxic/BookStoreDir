/**
 * Lazy-loaded Map Components
 * Dynamically imported map components for better performance
 */

import { withLazyLoading } from '../utils/dynamic-imports';

// Lazy load the main map component
export const LazyStoreMapFixed = withLazyLoading(
  () => import('../components/map/StoreMapFixed'),
  <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">
    <div className="text-gray-500">Loading interactive map...</div>
  </div>
);

// Lazy load the MapGL component
export const LazyStoreMapGL = withLazyLoading(
  () => import('../components/map/StoreMapGL'),
  <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">
    <div className="text-gray-500">Loading MapGL...</div>
  </div>
);

// Lazy load the simple map component
export const LazySimpleMap = withLazyLoading(
  () => import('../components/map/SimpleMap'),
  <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">
    <div className="text-gray-500">Loading map...</div>
  </div>
);

// Preload map components on hover
export const preloadMapComponents = () => {
  import('../components/map/StoreMapFixed');
  import('../components/map/StoreMapGL');
};

export default {
  LazyStoreMapFixed,
  LazyStoreMapGL,
  LazySimpleMap,
  preloadMapComponents,
};
