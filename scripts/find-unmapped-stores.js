import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the bookstores data
const bookstoresData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/bookstores.json'), 'utf8'));

// Read available images
const storeImagesDir = path.join(__dirname, '../public/images/StoreImages');
const availableImages = fs.readdirSync(storeImagesDir).filter(file => file.endsWith('.jpg'));

// Extract the STORE_IMAGE_MAP from images.ts
const imagesUtilPath = path.join(__dirname, '../src/utils/images.ts');
const imagesUtilContent = fs.readFileSync(imagesUtilPath, 'utf8');

// Extract existing mappings
const mappingMatches = imagesUtilContent.match(/'([^']+)':\s*'[^']+\.jpg'/g) || [];
const existingMappings = new Map();
mappingMatches.forEach(match => {
  const nameMatch = match.match(/'([^']+)':\s*'([^']+\.jpg)'/);
  if (nameMatch) {
    existingMappings.set(nameMatch[1], nameMatch[2]);
  }
});

console.log('=== COMPREHENSIVE IMAGE MAPPING ANALYSIS ===\n');
console.log(`Total stores in database: ${bookstoresData.data.length}`);
console.log(`Available store images: ${availableImages.length}`);
console.log(`Currently mapped stores: ${existingMappings.size}\n`);

// Function to normalize names for matching
function normalize(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Function to convert store name to expected filename
function nameToFilename(storeName) {
  return storeName
    .replace(/'/g, '') // Remove apostrophes
    .replace(/[^a-zA-Z0-9\s\-]/g, '') // Keep only letters, numbers, spaces, and hyphens
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/-/g, '_') // Replace hyphens with underscores
    + '.jpg';
}

// Find unmapped stores that have potential image files
const unmappedStores = [];
const suggestedMappings = [];

bookstoresData.data.forEach(store => {
  const storeName = store.name;
  
  // Skip if already mapped
  if (existingMappings.has(storeName)) {
    return;
  }
  
  // Try to find a matching image file
  const expectedFilename = nameToFilename(storeName);
  const normalizedStoreName = normalize(storeName);
  
  // Look for exact filename match
  let matchingImage = availableImages.find(img => img === expectedFilename);
  
  // If not found, try normalized matching
  if (!matchingImage) {
    matchingImage = availableImages.find(img => {
      const normalizedImg = normalize(img.replace('.jpg', ''));
      return normalizedImg === normalizedStoreName;
    });
  }
  
  // If not found, try partial matching
  if (!matchingImage) {
    matchingImage = availableImages.find(img => {
      const normalizedImg = normalize(img.replace('.jpg', ''));
      return normalizedImg.includes(normalizedStoreName) || 
             normalizedStoreName.includes(normalizedImg);
    });
  }
  
  if (matchingImage) {
    suggestedMappings.push({
      storeName: storeName,
      imageFile: matchingImage,
      confidence: matchingImage === expectedFilename ? 'high' : 'medium'
    });
  } else {
    unmappedStores.push(storeName);
  }
});

console.log(`Stores that can be mapped: ${suggestedMappings.length}`);
console.log(`Stores without obvious image matches: ${unmappedStores.length}\n`);

// Generate TypeScript mapping code
console.log('=== SUGGESTED MAPPINGS TO ADD ===\n');
suggestedMappings.forEach(mapping => {
  console.log(`  '${mapping.storeName}': '${mapping.imageFile}',`);
});

console.log('\n=== STORES WITHOUT OBVIOUS MATCHES ===');
unmappedStores.slice(0, 10).forEach(name => {
  console.log(`  - "${name}"`);
});

if (unmappedStores.length > 10) {
  console.log(`  ... and ${unmappedStores.length - 10} more`);
}

// Find unused images
const usedImages = new Set(Array.from(existingMappings.values()));
suggestedMappings.forEach(mapping => usedImages.add(mapping.imageFile));

const unusedImages = availableImages.filter(img => !usedImages.has(img));
console.log(`\n=== UNUSED IMAGES (${unusedImages.length}) ===`);
unusedImages.slice(0, 15).forEach(img => {
  console.log(`  - ${img}`);
});

if (unusedImages.length > 15) {
  console.log(`  ... and ${unusedImages.length - 15} more`);
} 