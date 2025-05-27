/**
 * Convert a string to a URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove special characters except hyphens
    .replace(/[^\w\-]+/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/\-\-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Generate a unique slug for a bookstore
 */
export function generateStoreSlug(storeName: string, city?: string, province?: string): string {
  let slug = slugify(storeName);
  
  // If we have city and province, add them for uniqueness
  if (city && province) {
    const citySlug = slugify(city);
    const provinceSlug = slugify(province);
    slug = `${slug}-${citySlug}-${provinceSlug}`;
  }
  
  return slug;
}

/**
 * Create a mapping of store slugs to store data for reverse lookup
 */
export function createSlugMapping(stores: any[]): Map<string, any> {
  const slugMap = new Map();
  
  stores.forEach(store => {
    const slug = generateStoreSlug(store.name, store.city, store.province);
    slugMap.set(slug, store);
  });
  
  return slugMap;
} 