import { promises as fs } from 'fs';
import { join } from 'path';
import type { BookstoreData } from '../types/bookstore';

/**
 * Load bookstore data from the JSON file
 */
export async function loadBookstoreData(): Promise<BookstoreData[]> {
  try {
    const filePath = join(process.cwd(), 'public', 'data', 'bookstores.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Handle both formats: { success: true, data: [...] } and direct array
    if (data.success && Array.isArray(data.data)) {
      return data.data.map(transformBookstore);
    } else if (Array.isArray(data)) {
      return data.map(transformBookstore);
    } else {
      throw new Error('Invalid bookstore data format');
    }
  } catch (error) {
    console.error('Failed to load bookstore data:', error);
    return [];
  }
}

/**
 * Transform bookstore data from JSON format to BookstoreData format
 */
function transformBookstore(store: any): BookstoreData {
  return {
    name: store.name || '',
    description: store.description || '',
    address: store.address || '',
    city: store.city || '',
    province: store.province || '',
    zip: store.postalCode || '',
    phone: store.phone || '',
    website: store.website || '',
    email: '', // Not available in current data
    lat: store.lat || '0',
    lng: store.lng || '0',
    rating: store.rating || '0',
    num_reviews: store.reviews || '0',
    price_level: getPriceLevel(store.price_level),
    place_id: store.id || '',
    place_url: '', // Not available in current data
    photos_url: store.image || '',
    status: store.business_status || 'OPERATIONAL',
    mon_hours: store.mon_hours || '',
    tue_hours: store.tue_hours || '',
    wed_hours: store.wed_hours || '',
    thu_hours: store.thu_hours || '',
    fri_hours: store.fri_hours || '',
    sat_hours: store.sat_hours || '',
    sun_hours: store.sun_hours || ''
  };
}

/**
 * Convert price level to standard format
 */
function getPriceLevel(priceLevel: any): string {
  if (typeof priceLevel === 'string') {
    return priceLevel;
  }
  
  // Convert number to dollar signs
  const level = parseInt(priceLevel as string) || 1;
  return '$'.repeat(Math.max(1, Math.min(4, level)));
}

/**
 * Cache for bookstore data to avoid repeated file reads
 */
let cachedBookstores: BookstoreData[] | null = null;

/**
 * Get cached bookstore data or load it if not cached
 */
export async function getBookstoreData(): Promise<BookstoreData[]> {
  if (cachedBookstores === null) {
    cachedBookstores = await loadBookstoreData();
  }
  return cachedBookstores;
} 