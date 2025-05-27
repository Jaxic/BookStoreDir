import type { ProcessedBookstore } from '../types/bookstore';
import Fuse from 'fuse.js';
import type { StoreFilters } from '../components/stores/StoreSearch';

let fuse: Fuse<ProcessedBookstore>;

export function initializeSearch(stores: ProcessedBookstore[]) {
  const options = {
    keys: ['name', 'address', 'city', 'province'],
    threshold: 0.3,
    includeScore: true,
  };
  fuse = new Fuse(stores, options);
}

export function getSearchSuggestions(stores: ProcessedBookstore[], query: string): string[] {
  if (!query) return [];
  
  const results = fuse.search(query);
  return results
    .slice(0, 5)
    .map(result => result.item.name);
}



function isOpenWeekends(store: ProcessedBookstore): boolean {
  const satHours = store.hours.saturday;
  const sunHours = store.hours.sunday;
  
  return Boolean((satHours && satHours !== 'Closed') || (sunHours && sunHours !== 'Closed'));
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
  if (filters.maxDistance && navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  }

  // Start with all stores or search results
  let results = query
    ? fuse.search(query).map(result => result.item)
    : [...stores];

  // Apply filters
  results = results.filter(store => {
    // Basic filters
    if (filters.hasWebsite && !store.website) return false;
    
    // Rating filter with proper type handling
    if (filters.minRating > 0) {
      const rating = store.ratingInfo?.rating;
      if (!rating || isNaN(rating) || rating < filters.minRating) return false;
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

    // Hours filters
    if (filters.openWeekends && !isOpenWeekends(store)) return false;

    return true;
  });

  return results;
} 