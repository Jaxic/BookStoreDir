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

// Simple extraction of store names that have mappings
const mappingMatches = imagesUtilContent.match(/'([^']+)':\s*'[^']+\.jpg'/g) || [];
const mappedStoreNames = mappingMatches.map(match => {
  const nameMatch = match.match(/'([^']+)':/);
  return nameMatch ? nameMatch[1] : null;
}).filter(Boolean);

console.log('=== IMAGE MAPPING VERIFICATION ===\n');

console.log(`Total stores in database: ${bookstoresData.data.length}`);
console.log(`Available store images: ${availableImages.length}`);
console.log(`Stores with mappings: ${mappedStoreNames.length}\n`);

// Check which stores have mappings
const storesWithMappings = [];
const storesWithoutMappings = [];

bookstoresData.data.forEach(store => {
  if (mappedStoreNames.includes(store.name)) {
    storesWithMappings.push(store.name);
  } else {
    storesWithoutMappings.push(store.name);
  }
});

console.log(`Stores with proper mappings: ${storesWithMappings.length}`);
console.log(`Stores without mappings: ${storesWithoutMappings.length}\n`);

// Show some examples of stores without mappings
console.log('Examples of stores without mappings:');
storesWithoutMappings.slice(0, 10).forEach(name => {
  console.log(`  - "${name}"`);
});

if (storesWithoutMappings.length > 10) {
  console.log(`  ... and ${storesWithoutMappings.length - 10} more`);
}

// Check for image files that might not be mapped
console.log('\n=== UNUSED IMAGE FILES ===');
const imageBaseNames = availableImages.map(img => img.replace('.jpg', ''));
const mappedImageNames = mappingMatches.map(match => {
  const imgMatch = match.match(/'([^']+\.jpg)'/);
  return imgMatch ? imgMatch[1].replace('.jpg', '') : null;
}).filter(Boolean);

const unusedImages = imageBaseNames.filter(baseName => !mappedImageNames.includes(baseName));
console.log(`Potentially unused images: ${unusedImages.length}`);
unusedImages.slice(0, 10).forEach(name => {
  console.log(`  - ${name}.jpg`);
});

if (unusedImages.length > 10) {
  console.log(`  ... and ${unusedImages.length - 10} more`);
} 