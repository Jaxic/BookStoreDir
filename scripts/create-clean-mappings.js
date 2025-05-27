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
const existingMappings = new Set();
mappingMatches.forEach(match => {
  const nameMatch = match.match(/'([^']+)':\s*'([^']+\.jpg)'/);
  if (nameMatch) {
    existingMappings.add(nameMatch[1]);
  }
});

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

// Find new mappings (only stores that aren't already mapped)
const newMappings = [];

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
    newMappings.push({
      storeName: storeName,
      imageFile: matchingImage
    });
  }
});

console.log('=== NEW MAPPINGS TO ADD (NO DUPLICATES) ===\n');
newMappings.forEach(mapping => {
  // Escape single quotes in store names
  const escapedName = mapping.storeName.replace(/'/g, "\\'");
  console.log(`  '${escapedName}': '${mapping.imageFile}',`);
});

console.log(`\nTotal new mappings: ${newMappings.length}`);
console.log(`Currently mapped stores: ${existingMappings.size}`);
console.log(`Total after adding: ${existingMappings.size + newMappings.length}`); 