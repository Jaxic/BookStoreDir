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
  const options = {
    keys: ['name', 'address', 'city', 'province'],
    threshold: 0.3,
    includeScore: true,
  };
  fuse = new Fuse(stores, options);
  
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
}

export function getSearchSuggestions(stores: ProcessedBookstore[], query: string): string[] {
  if (!query) return [];
  
  const results = fuse.search(query);
  return results
    .slice(0, 5)
    .map(result => result.item.name);
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
    return { lat: cachedUserLocation.lat, lng: cachedUserLocation.lng };
  }
  
  // Get fresh location
  if (!navigator.geolocation) {
    return null;
  }
  
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve, 
        reject,
        { 
          timeout: 10000, // 10 second timeout
          maximumAge: 300000, // Accept 5-minute-old position
          enableHighAccuracy: false // Faster, less battery drain
        }
      );
    });
    
    cachedUserLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: Date.now()
    };
    
    return { lat: cachedUserLocation.lat, lng: cachedUserLocation.lng };
  } catch (error) {
    console.error('Error getting user location:', error);
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
  // Get user location first if distance filter is active
  let userLocation: { lat: number; lng: number } | null = null;
  if (filters.maxDistance) {
    userLocation = await getCachedLocation();
  }

  // Start with all stores or search results
  let results = query
    ? fuse.search(query).map(result => result.item)
    : [...stores];

  // Apply filters with optimized functions
  results = results.filter(store => {
    // Basic filters
    if (filters.hasWebsite && !store.website) return false;
    
    // Rating filter with cached values
    if (filters.minRating > 0) {
      const rating = getCachedRating(store);
      if (rating < filters.minRating) return false;
    }

    // Province filter
    if (filters.province && store.province !== filters.province) return false;

    // Distance filter
    if (filters.maxDistance && userLocation) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        parseFloat(store.lat),
        parseFloat(store.lng)
      );
      if (distance > filters.maxDistance) return false;
    }

    // Hours filters with cached results
    if (filters.openWeekends && !isOpenWeekends(store)) return false;

    return true;
  });

  return results;
}

// Utility function to clear caches if needed
export function clearSearchCache() {
  weekendStatusCache.clear();
  ratingCache.clear();
  cachedUserLocation = null;
} 