// Default bookstore image showing a row of books on wooden shelves
export const DEFAULT_STORE_IMAGE = "/images/default-bookstore.jpg";

/**
 * Mapping of store names to their corresponding image filenames
 * This maps the store names from the CSV to the actual image files
 */
const STORE_IMAGE_MAP: Record<string, string> = {
  // Exact matches from CSV data
  'La petite bouquinerie': 'La_petite_bouquinerie.jpg',
  'Friends of the Ottawa Public Library': 'Friends_of_the_Ottawa_Public_Library.jpg',
  'Librairie Vincent Legendre': 'Librairie_Vincent_Legendre.jpg',
  'Country Life Books': 'Country_Life_Books.jpg',
  'Bellwoods Books': 'Bellwoods_Books.jpg',
  'JMC books': 'JMC_books.jpg',
  'Faustroll et fils, disques fins et livres choisis': 'Faustroll_et_fils_disques_fins_et_livres_choisis.jpg',
  'SG Livres Usagés': 'SG_Livres_Usages.jpg',
  'Librairie Le Chat Lit': 'Librairie_Le_Chat_Lit.jpg',
  'Well Read Books': 'Well_Read_Books.jpg',
  'Nikkei Japanese Bookstore': 'Nikkei_Japanese_Bookstore.jpg',
  'Second Chance Reads': 'Second_Chance_Reads.jpg',
  'Reeve & Clarke Books ( ABAC / ILAB )': 'Reeve_Clarke_Books_ABAC_ILAB.jpg',
  'Minotavros Books': 'Minotavros_Books.jpg',
  'librairie vilsy': 'librairie_vilsy.jpg',
  'Contact Editions Inc': 'Contact_Editions_Inc.jpg',
  'Bjarne Tokerud Bookseller Inc.': 'Bjarne_Tokerud_Bookseller_Inc.jpg',
  'Attica Mea Used Books': 'Attica_Mea_Used_Books.jpg',
  'Les trois boucs': 'Les_trois_boucs.jpg',
  'Hidden Treasures': 'Hidden_Treasures.jpg',
  'Grenville\'s Books & Art': 'Grenvilles_Books_Art.jpg',
  'Lire à rabais': 'Lire_a_rabais.jpg',
  'CornerHouse Books': 'CornerHouse_Books.jpg',
  'B.D. Livres Anciens': 'BD_Livres_Anciens.jpg',
  'Cherished Books': 'Cherished_Books.jpg',
  'Geoffrey Cates Books': 'Geoffrey_Cates_Books.jpg',
  'OakTree Free Book Exchange': 'OakTree_Free_Book_Exchange.jpg',
  'Patty\'s Book Room': 'Pattys_Book_Room.jpg',
  'Second Editions': 'Second_Editions.jpg',
  'Bouquinerie 4 Saisons': 'Bouquinerie_4_Saisons.jpg',
  'CAVITY Curiosity Shop': 'CAVITY_Curiosity_Shop.jpg',
  'Bookends': 'Bookends.jpg',
  'Juniper Books': 'Juniper_Books.jpg',
  'The Printed Word': 'The_Printed_Word.jpg',
  'The Scribe Bookstore': 'The_Scribe_Bookstore.jpg',
  'The Odd Book': 'The_Odd_Book.jpg',
  'Red Cart Books': 'Red_Cart_Books.jpg',
  'Peryton Books': 'Peryton_Books.jpg',
  'Les Mots Passants Inc.': 'Les_Mots_Passants_Inc.jpg',
  'Kingfisher Quality Used Books': 'Kingfisher_Quality_Used_Books.jpg',
  'Hollywood Canteen': 'Hollywood_Canteen.jpg',
  'Bearly Used Books': 'Bearly_Used_Books.jpg',
  'TORN PAGES': 'TORN_PAGES.jpg',
  'Literacy Quesnel Society': 'Literacy_Quesnel_Society.jpg',
  'The River Trading Company': 'The_River_Trading_Company.jpg',
  'By the Books PTBO': 'By_the_Books_PTBO.jpg',
  'Nuggets Used Books': 'Nuggets_Used_Books.jpg',
  'Book Lovers': 'Book_Lovers.jpg',
  'Forest Books & Media': 'Forest_Books_Media.jpg',
  'Bookcase The': 'Bookcase_The.jpg',
  
  // Additional mappings that might exist in the image folder
  'TimelessLegacy': 'TimelessLegacy.jpg',
  'Rising Trout Sporting Books': 'Rising_Trout_Sporting_Books.jpg',
  'Paper Chase Antiques': 'Paper_Chase_Antiques.jpg',
  'Old Crow Antique Book Shoppe Ltd.': 'Old_Crow_Antique_Book_Shoppe_Ltd.jpg',
  'Mind Finds Used Books': 'Mind_Finds_Used_Books.jpg',
  'MarilynKDP': 'MarilynKDP.jpg',
  'Marie Livres': 'Marie_Livres.jpg',
  'Mapguru - Vancouver Map Store': 'Mapguru_Vancouver_Map_Store.jpg',
  'Light of East Books': 'Light_of_East_Books.jpg',
  'Legends Comics And Books': 'Legends_Comics_And_Books.jpg',
  'Kestrel Books': 'Kestrel_Books.jpg',
  'Island Books Plus': 'Island_Books_Plus.jpg',
  'Highbury Book Store': 'Highbury_Book_Store.jpg',
  'Hager Books Ltd': 'Hager_Books_Ltd.jpg',
  'GoodMinds.com': 'GoodMinds_com.jpg',
  'Friesen\'s': 'Friesens.jpg',
  'Four Winds Books Ltd': 'Four_Winds_Books_Ltd.jpg',
  'Elephant Books': 'Elephant_Books.jpg',
  'Dawson Book Shoppe': 'Dawson_Book_Shoppe.jpg',
  'Cosmic Comics & Entertainment': 'Cosmic_Comics_Entertainment.jpg',
  'Comic Readers': 'Comic_Readers.jpg',
  'Clio\'s': 'Clios.jpg',
  'Chapter One Book Store': 'Chapter_One_Book_Store.jpg',
  'Chapters Indigo Store': 'Chapters_Indigo_Store.jpg',
  'Cavendish Figurines and Books': 'Cavendish_Figurines_and_Books.jpg',
  'BookLore Ltd.': 'BookLore_Ltd.jpg',
  'Bookmark': 'Bookmark.jpg',
  'Bookcity Kamloops': 'Bookcity_Kamloops.jpg',
  'Bethel Gospel Chapel Bookstore': 'Bethel_Gospel_Chapel_Bookstore.jpg',
  'Ancient to Future': 'Ancient_to_Future.jpg',
  'Agora Books & Music': 'Agora_Books_Music.jpg'
};

/**
 * Normalize store name for matching (remove spaces, punctuation, convert to lowercase)
 */
function normalizeStoreName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Find the best matching image for a store name using fuzzy matching
 */
function findBestImageMatch(storeName: string): string | null {
  // Try exact match first
  if (STORE_IMAGE_MAP[storeName]) {
    return STORE_IMAGE_MAP[storeName];
  }

  // Try normalized matching
  const normalizedInput = normalizeStoreName(storeName);
  
  for (const [mapName, imageName] of Object.entries(STORE_IMAGE_MAP)) {
    const normalizedMapName = normalizeStoreName(mapName);
    if (normalizedMapName === normalizedInput) {
      return imageName;
    }
  }

  // Try partial matching (if store name contains or is contained in mapped name)
  for (const [mapName, imageName] of Object.entries(STORE_IMAGE_MAP)) {
    const normalizedMapName = normalizeStoreName(mapName);
    if (normalizedMapName.includes(normalizedInput) || normalizedInput.includes(normalizedMapName)) {
      return imageName;
    }
  }

  return null;
}

/**
 * Get store image URL based on store name
 */
export function getStoreImageByName(storeName: string): string {
  const imageFilename = findBestImageMatch(storeName);
  
  if (imageFilename) {
    return `/images/StoreImages/${imageFilename}`;
  }
  
  // Return a curated fallback image if no match found
  return getFallbackImage(storeName);
}

/**
 * Get a curated fallback image based on store name or type
 */
function getFallbackImage(storeName: string = ''): string {
  const fallbackImages = [
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center&auto=format&q=80', // Classic bookstore
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center&auto=format&q=80', // Cozy reading corner
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=300&fit=crop&crop=center&auto=format&q=80', // Old books
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop&crop=center&auto=format&q=80', // Library shelves
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=300&fit=crop&crop=center&auto=format&q=80'  // Open book
  ];
  
  // Use store name to determine a consistent fallback
  const hash = storeName.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
  const index = Math.abs(hash) % fallbackImages.length;
  
  return fallbackImages[index];
}

/**
 * Get multiple fallback images for progressive loading
 */
export function getImageFallbacks(photosUrl?: string, storeName?: string): string[] {
  const fallbacks: string[] = [];
  
  // If we have a store name, try to get the specific store image first
  if (storeName) {
    const storeImage = getStoreImageByName(storeName);
    fallbacks.push(storeImage);
  }
  
  // Add Google Photos URL as secondary fallback (though likely won't work)
  if (photosUrl && photosUrl.trim() !== '') {
    fallbacks.push(photosUrl);
  }
  
  // Add generic fallback images
  fallbacks.push(getFallbackImage(storeName || 'default'));
  
  // Add final fallback
  fallbacks.push('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center&auto=format&q=80');
  
  // Remove duplicates while preserving order
  return [...new Set(fallbacks)];
}

/**
 * Legacy function for backward compatibility
 */
export function getStoreImage(photosUrl?: string): string {
  return getImageFallbacks(photosUrl)[0];
} 