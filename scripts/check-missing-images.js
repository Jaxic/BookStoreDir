import fs from 'fs';
import path from 'path';

// Read the images.ts file to extract the STORE_IMAGE_MAP
const imagesPath = path.join(process.cwd(), 'src', 'utils', 'images.ts');
const imagesContent = fs.readFileSync(imagesPath, 'utf8');

// Extract store names and their mapped files using a simpler approach
const lines = imagesContent.split('\n');
const entries = [];

let inMap = false;
for (const line of lines) {
  if (line.includes('const STORE_IMAGE_MAP')) {
    inMap = true;
    continue;
  }
  
  if (inMap && line.includes('};')) {
    break;
  }
  
  if (inMap && line.trim().includes(':')) {
    // Match lines like: 'Store Name': 'image_file.jpg',
    const match = line.trim().match(/^'([^']+)'\s*:\s*'([^']+)'/);
    if (match) {
      entries.push({ storeName: match[1], fileName: match[2] });
    }
  }
}

console.log(`Found ${entries.length} entries in STORE_IMAGE_MAP`);

// Check which files actually exist
const imagesDir = path.join(process.cwd(), 'public', 'images', 'StoreImages');
const existingFiles = fs.readdirSync(imagesDir);

console.log(`Found ${existingFiles.length} files in StoreImages directory`);

// Find missing files
const missingFiles = [];
const existingMappings = [];

entries.forEach(({ storeName, fileName }) => {
  if (existingFiles.includes(fileName)) {
    existingMappings.push({ storeName, fileName });
  } else {
    missingFiles.push({ storeName, fileName });
  }
});

console.log('\n=== ANALYSIS RESULTS ===');
console.log(`✅ Existing mappings: ${existingMappings.length}`);
console.log(`❌ Missing files: ${missingFiles.length}`);

if (missingFiles.length > 0) {
  console.log('\n=== MISSING FILES (causing 404s) ===');
  missingFiles.forEach(({ storeName, fileName }) => {
    console.log(`❌ ${storeName} → ${fileName}`);
  });
}

// Find unmapped files (files that exist but aren't referenced)
const mappedFiles = entries.map(e => e.fileName);
const unmappedFiles = existingFiles.filter(file => !mappedFiles.includes(file));

if (unmappedFiles.length > 0) {
  console.log(`\n=== UNMAPPED FILES (${unmappedFiles.length} files exist but aren't mapped) ===`);
  unmappedFiles.slice(0, 20).forEach(file => {
    console.log(`📂 ${file}`);
  });
  if (unmappedFiles.length > 20) {
    console.log(`... and ${unmappedFiles.length - 20} more`);
  }
}

console.log('\n=== SUMMARY ===');
console.log(`Total store images: ${existingFiles.length}`);
console.log(`Mapped correctly: ${existingMappings.length}`);
console.log(`Missing files (404s): ${missingFiles.length}`);
console.log(`Unmapped files: ${unmappedFiles.length}`); 