import type { ProcessedBookstore } from '../types/bookstore';
import Fuse from 'fuse.js';
import type { StoreFilters } from '../components/stores/StoreSearch';

let fuse: Fuse<ProcessedBookstore>;

// Performance caches
const weekendStatusCache = new Map<string, boolean>();
const ratingCache = new Map<string, number>();
let cachedUserLocation: { lat: number; lng: number; timestamp: number } | null = null;
const LOCATION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function initializeSearch(stores: ProcessedBookstore[]) {
  if (!stores || stores.length === 0) {
    console.warn('initializeSearch called with empty stores array');
    return;
  }
  
  console.log(`Initializing search with ${stores.length} stores`);
  
  const options = {
    keys: ['name', 'address', 'city', 'province'],
    threshold: 0.3,
    includeScore: true,
  };
  
  try {
    fuse = new Fuse(stores, options);
    console.log('Fuse search initialized successfully');
    
    // Pre-populate caches for better performance
    stores.forEach(store => {
      const storeId = store.place_id || store.name;
      
      // Cache weekend status
      if (!weekendStatusCache.has(storeId)) {
        weekendStatusCache.set(storeId, isOpenWeekends(store));
      }
      
      // Cache rating
      if (!ratingCache.has(storeId) && store.ratingInfo?.rating) {
        const rating = store.ratingInfo.rating;
        if (!isNaN(rating)) {
          ratingCache.set(storeId, rating);
        }
      }
    });
    
    console.log(`Cached data for ${weekendStatusCache.size} stores`);
  } catch (error) {
    console.error('Error initializing search:', error);
  }
}

export function getSearchSuggestions(stores: ProcessedBookstore[], query: string): string[] {
  if (!query) return [];
  
  if (!fuse) {
    console.warn('Fuse not initialized, falling back to simple search for suggestions');
    return stores
      .filter(store => store.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
      .map(store => store.name);
  }
  
  const results = fuse.search(query);
  return results
    .slice(0, 5)
    .map(result => result.item.name);
}

// Simple search function for map view (text search only)
export async function searchStoresText(stores: ProcessedBookstore[], query: string): Promise<ProcessedBookstore[]> {
  console.log(`searchStoresText called with ${stores.length} stores, query: "${query}"`);
  
  if (!stores || stores.length === 0) {
    console.warn('searchStoresText called with empty stores array');
    return [];
  }
  
  // If no query, return all stores
  if (!query || !query.trim()) {
    console.log('No query provided, returning all stores');
    return stores;
  }
  
  // Ensure fuse is initialized
  if (!fuse) {
    console.log('Fuse not initialized, initializing now...');
    initializeSearch(stores);
  }
  
  // Perform search
  let results: ProcessedBookstore[];
  
  if (!fuse) {
    console.error('Fuse search not available, falling back to simple filter');
    results = stores.filter(store => 
      store.name.toLowerCase().includes(query.toLowerCase()) ||
      store.city.toLowerCase().includes(query.toLowerCase()) ||
      store.province.toLowerCase().includes(query.toLowerCase()) ||
      store.address.toLowerCase().includes(query.toLowerCase())
    );
  } else {
    results = fuse.search(query).map(result => result.item);
  }
  
  console.log(`Text search for "${query}" returned ${results.length} results`);
  
  // Ensure results have valid coordinates
  const validResults = results.filter(store => {
    const lat = parseFloat(store.lat);
    const lng = parseFloat(store.lng);
    const hasValidCoords = !isNaN(lat) && !isNaN(lng);
    if (!hasValidCoords) {
      console.warn(`Store ${store.name} has invalid coordinates: [${store.lat}, ${store.lng}]`);
    }
    return hasValidCoords;
  });
  
  console.log(`Filtered to ${validResults.length} stores with valid coordinates`);
  return validResults;
}

function isOpenWeekends(store: ProcessedBookstore): boolean {
  const storeId = store.place_id || store.name;
  
  // Check cache first
  if (weekendStatusCache.has(storeId)) {
    return weekendStatusCache.get(storeId)!;
  }
  
  // Calculate and cache result
  const satHours = store.hours.saturday;
  const sunHours = store.hours.sunday;
  const isOpen = Boolean((satHours && satHours !== 'Closed') || (sunHours && sunHours !== 'Closed'));
  
  weekendStatusCache.set(storeId, isOpen);
  return isOpen;
}

function getCachedRating(store: ProcessedBookstore): number {
  const storeId = store.place_id || store.name;
  
  // Check cache first
  if (ratingCache.has(storeId)) {
    return ratingCache.get(storeId)!;
  }
  
  // Calculate and cache result
  const rating = store.ratingInfo?.rating;
  if (rating && !isNaN(rating)) {
    ratingCache.set(storeId, rating);
    return rating;
  }
  
  return 0;
}

async function getCachedLocation(): Promise<{ lat: number; lng: number } | null> {
  // Check if cached location is still valid
  if (cachedUserLocation && (Date.now() - cachedUserLocation.timestamp) < LOCATION_CACHE_DURATION) {
    console.log('💾 Using cached user location:', cachedUserLocation);
    return { lat: cachedUserLocation.lat, lng: cachedUserLocation.lng };
  }
  
  // Get fresh location
  if (!navigator.geolocation) {
    console.log('❌ Geolocation not supported');
    return null;
  }
  
  try {
    console.log('🔄 Getting fresh user location...');
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve, 
        reject,
        { 
          timeout: 15000, // 15 second timeout
          maximumAge: 60000, // Accept 1-minute-old position for faster results
          enableHighAccuracy: false // Faster, less battery drain
        }
      );
    });
    
    cachedUserLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: Date.now()
    };
    
    console.log('✅ Got fresh user location:', cachedUserLocation);
    return { lat: cachedUserLocation.lat, lng: cachedUserLocation.lng };
  } catch (error) {
    console.error('❌ Error getting user location for distance filtering:', error);
    return null;
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function searchStores(stores: ProcessedBookstore[], query: string, filters: StoreFilters): Promise<ProcessedBookstore[]> {
  console.log(`searchStores called with ${stores.length} stores, query: "${query}", filters:`, filters);
  
  if (!stores || stores.length === 0) {
    console.warn('searchStores called with empty stores array');
    return [];
  }
  
  // Ensure fuse is initialized only once per session
  if (!fuse) {
    console.log('Fuse not initialized, initializing now...');
    initializeSearch(stores);
  }
  
  // Distance filtering removed - simpler approach with city-level zoom

  // Start with all stores or search results
  let results: ProcessedBookstore[];
  
  if (query && query.trim()) {
    if (!fuse) {
      console.error('Fuse search not available, falling back to simple filter');
      results = stores.filter(store => 
        store.name.toLowerCase().includes(query.toLowerCase()) ||
        store.city.toLowerCase().includes(query.toLowerCase()) ||
        store.province.toLowerCase().includes(query.toLowerCase())
      );
    } else {
      results = fuse.search(query).map(result => result.item);
    }
    console.log(`Text search for "${query}" returned ${results.length} results`);
  } else {
    results = [...stores];
    console.log(`No text search, starting with all ${results.length} stores`);
  }

  // Apply filters with optimized functions
  const filteredResults = results.filter(store => {
    // Validate store has required fields
    if (!store.lat || !store.lng || !store.name) {
      console.warn('Store missing required fields:', store);
      return false;
    }
    
    // Basic filters
    if (filters.hasWebsite && !store.website) return false;
    
    // Rating filter with cached values
    if (filters.minRating > 0) {
      const rating = getCachedRating(store);
      if (rating < filters.minRating) return false;
    }

    // Province filter
    if (filters.province && store.province !== filters.province) return false;

    // Distance filtering removed - users can manually zoom to explore areas

    // Hours filters with cached results
    if (filters.openWeekends && !isOpenWeekends(store)) return false;

    return true;
  });

  console.log(`After filtering: ${filteredResults.length} stores remaining`);
  return filteredResults;
}

// Utility function to clear caches if needed
export function clearSearchCache() {
  weekendStatusCache.clear();
  ratingCache.clear();
  cachedUserLocation = null;
} 