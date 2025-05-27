import type { BookstoreData } from '../types/bookstore';

// Province/state normalizations and mappings
const PROVINCE_NORMALIZATIONS: Record<string, string> = {
  'ON': 'Ontario',
  'Ontario': 'Ontario',
  'BC': 'British Columbia',
  'British Columbia': 'British Columbia',
  'AB': 'Alberta',
  'Alberta': 'Alberta',
  'QC': 'Quebec',
  'Quebec': 'Quebec',
  'NS': 'Nova Scotia',
  'Nova Scotia': 'Nova Scotia',
  'NB': 'New Brunswick',
  'New Brunswick': 'New Brunswick',
  'MB': 'Manitoba',
  'Manitoba': 'Manitoba',
  'SK': 'Saskatchewan',
  'Saskatchewan': 'Saskatchewan',
  'PE': 'Prince Edward Island',
  'Prince Edward Island': 'Prince Edward Island',
  'NL': 'Newfoundland and Labrador',
  'Newfoundland and Labrador': 'Newfoundland and Labrador',
  'NT': 'Northwest Territories',
  'Northwest Territories': 'Northwest Territories',
  'NU': 'Nunavut',
  'Nunavut': 'Nunavut',
  'YT': 'Yukon',
  'Yukon': 'Yukon'
};

const PROVINCE_ABBREVIATIONS: Record<string, string> = {
  'Ontario': 'ON',
  'British Columbia': 'BC',
  'Alberta': 'AB',
  'Quebec': 'QC',
  'Nova Scotia': 'NS',
  'New Brunswick': 'NB',
  'Manitoba': 'MB',
  'Saskatchewan': 'SK',
  'Prince Edward Island': 'PE',
  'Newfoundland and Labrador': 'NL',
  'Northwest Territories': 'NT',
  'Nunavut': 'NU',
  'Yukon': 'YT'
};

export interface GeographicLocation {
  province: string;
  provinceCode: string;
  city: string;
  storeCount: number;
}

export interface ProvinceInfo {
  name: string;
  code: string;
  cities: CityInfo[];
  totalStores: number;
}

export interface CityInfo {
  name: string;
  province: string;
  provinceCode: string;
  storeCount: number;
  slug: string;
}

/**
 * Normalize province name to full standard name
 */
export function normalizeProvince(province: string): string {
  const trimmed = province?.trim();
  return PROVINCE_NORMALIZATIONS[trimmed] || trimmed || 'Unknown';
}

/**
 * Get province abbreviation from full name
 */
export function getProvinceCode(province: string): string {
  const normalized = normalizeProvince(province);
  return PROVINCE_ABBREVIATIONS[normalized] || normalized;
}

/**
 * Create a URL-safe slug from a string
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Create a province slug
 */
export function createProvinceSlug(province: string): string {
  const normalized = normalizeProvince(province);
  return createSlug(normalized);
}

/**
 * Create a city slug
 */
export function createCitySlug(city: string): string {
  return createSlug(city);
}

/**
 * Extract all unique provinces from bookstore data
 */
export function extractProvinces(bookstores: BookstoreData[]): ProvinceInfo[] {
  const provinceMap = new Map<string, { cities: Map<string, number>, totalStores: number }>();

  bookstores.forEach(store => {
    const normalizedProvince = normalizeProvince(store.province);
    const city = store.city?.trim() || 'Unknown';

    if (!provinceMap.has(normalizedProvince)) {
      provinceMap.set(normalizedProvince, {
        cities: new Map(),
        totalStores: 0
      });
    }

    const provinceData = provinceMap.get(normalizedProvince)!;
    provinceData.totalStores++;
    
    const currentCityCount = provinceData.cities.get(city) || 0;
    provinceData.cities.set(city, currentCityCount + 1);
  });

  return Array.from(provinceMap.entries()).map(([provinceName, data]) => ({
    name: provinceName,
    code: getProvinceCode(provinceName),
    totalStores: data.totalStores,
    cities: Array.from(data.cities.entries()).map(([cityName, storeCount]) => ({
      name: cityName,
      province: provinceName,
      provinceCode: getProvinceCode(provinceName),
      storeCount,
      slug: createCitySlug(cityName)
    })).sort((a, b) => b.storeCount - a.storeCount || a.name.localeCompare(b.name))
  })).sort((a, b) => b.totalStores - a.totalStores || a.name.localeCompare(b.name));
}

/**
 * Extract all unique cities from bookstore data
 */
export function extractCities(bookstores: BookstoreData[]): CityInfo[] {
  const cityMap = new Map<string, { province: string, count: number }>();

  bookstores.forEach(store => {
    const normalizedProvince = normalizeProvince(store.province);
    const city = store.city?.trim() || 'Unknown';
    const cityKey = `${city}|${normalizedProvince}`;

    if (!cityMap.has(cityKey)) {
      cityMap.set(cityKey, {
        province: normalizedProvince,
        count: 0
      });
    }

    cityMap.get(cityKey)!.count++;
  });

  return Array.from(cityMap.entries()).map(([cityKey, data]) => {
    const [cityName] = cityKey.split('|');
    return {
      name: cityName,
      province: data.province,
      provinceCode: getProvinceCode(data.province),
      storeCount: data.count,
      slug: createCitySlug(cityName)
    };
  }).sort((a, b) => b.storeCount - a.storeCount || a.name.localeCompare(b.name));
}

/**
 * Get stores for a specific province
 */
export function getStoresByProvince(bookstores: BookstoreData[], province: string): BookstoreData[] {
  const normalizedProvince = normalizeProvince(province);
  return bookstores.filter(store => 
    normalizeProvince(store.province) === normalizedProvince
  );
}

/**
 * Get stores for a specific city in a province
 */
export function getStoresByCity(bookstores: BookstoreData[], province: string, city: string): BookstoreData[] {
  const normalizedProvince = normalizeProvince(province);
  return bookstores.filter(store => 
    normalizeProvince(store.province) === normalizedProvince &&
    store.city?.trim().toLowerCase() === city.trim().toLowerCase()
  );
}

/**
 * Find province by slug
 */
export function findProvinceBySlug(provinces: ProvinceInfo[], slug: string): ProvinceInfo | undefined {
  return provinces.find(province => 
    createProvinceSlug(province.name) === slug ||
    province.code.toLowerCase() === slug.toLowerCase()
  );
}

/**
 * Find city by slug within a province
 */
export function findCityBySlug(cities: CityInfo[], slug: string): CityInfo | undefined {
  return cities.find(city => city.slug === slug);
} 