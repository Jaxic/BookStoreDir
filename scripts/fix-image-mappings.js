import fs from 'fs';
import path from 'path';

// Read the images.ts file
const imagesPath = path.join(process.cwd(), 'src', 'utils', 'images.ts');
const imagesContent = fs.readFileSync(imagesPath, 'utf8');

// Get existing files
const imagesDir = path.join(process.cwd(), 'public', 'images', 'StoreImages');
const existingFiles = fs.readdirSync(imagesDir);

console.log(`Found ${existingFiles.length} files in StoreImages directory`);

// Manual corrections based on analysis
const corrections = {
  'SG Livres Usagés': null, // Remove - no matching file
  'Reeve & Clarke Books ( ABAC / ILAB )': null, // Remove - no matching file
  'Lire à rabais': 'Lire_à_rabais.jpg', // Fix mapping to existing file
  'B.D. Livres Anciens': 'B.D._Livres_Anciens.jpg', // Fix mapping to existing file
  'BackPages Books': null, // Remove - no matching file
  'Bent Trees Books': null, // Remove - no matching file
  'Books & Things': null, // Remove - no matching file
  'Books On The Grand': null, // Remove - no matching file
  'Borealis Books': null, // Remove - no matching file
  'Boutique aux livres anciens (le marchant de feuilles)': null, // Remove - no matching file
  'Brighton Books': null, // Remove - no matching file
  'Britton Books': null, // Remove - no matching file
  'Carrefour des Livres': null, // Remove - no matching file
  'Catherine Mitchell Antique Maps': null, // Remove - no matching file
  'Chatham-Kent Book Exchange': null, // Remove - no matching file
  'Cheap Thrills Records and Books': null, // Remove - no matching file
  'Classic Bookshop': null, // Remove - no matching file
  'Daniadown Books': null, // Remove - no matching file
  'De la Page écrite': null, // Remove - no matching file
  'Deer Park United Church Book Sale': null, // Remove - no matching file
  'Dunbar Books': null, // Remove - no matching file
  'Houle Jean-Marie livres rares': null, // Remove - no matching file
  'J. Patrick McGahern Books Inc.': null, // Remove - no matching file
  'Kelley & Associates Rare Books': null, // Remove - no matching file
  'Librairie A to Z': null, // Remove - no matching file
  'Librairie Alpha': null, // Remove - no matching file
  'Librairie Aux deux etages inc.': null, // Remove - no matching file
  'Librairie bibliomania': null, // Remove - no matching file
  'Librairie générale française': null, // Remove - no matching file
  'Librairie Médiaspaul': null, // Remove - no matching file
  'Librairie Michelle Houle-Lachance': null, // Remove - no matching file
  'Librairie Père Delorme': null, // Remove - no matching file
  'Librairie Pour Tous': null, // Remove - no matching file
  'Librairie Raffin': null, // Remove - no matching file
  'Nicolas Malais - Libraire Antiquaire': null, // Remove - no matching file
  'Pêle-Mêle Livres': null, // Remove - no matching file
  'Re-Read Books': null, // Remove - no matching file
  'Recycled Reading': null, // Remove - no matching file
  'Russell Books Ltd': null, // Remove - no matching file
  'Safari Books': null, // Remove - no matching file
  'Seekers Books & Coffee': null, // Remove - no matching file
  'Talisman Books and Gallery': null, // Remove - no matching file
  'The Book Exchange': null, // Remove - no matching file
  'The Book Gallery': null, // Remove - no matching file
  'The BookShelf': null, // Remove - no matching file
  'The Reading Garden': null, // Remove - no matching file
  'Ulysses Travel Bookshop': null, // Remove - no matching file
};

// Process the images.ts file line by line
const lines = imagesContent.split('\n');
const fixedLines = [];

for (const line of lines) {
  let fixed = line;
  
  // Check if this line contains a mapping we need to fix
  for (const [storeName, newMapping] of Object.entries(corrections)) {
    const escapedStoreName = storeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^(\\s*)'${escapedStoreName}'\\s*:\\s*'[^']*',?\\s*$`);
    
    if (regex.test(line.trim())) {
      if (newMapping === null) {
        console.log(`❌ Removing: ${storeName}`);
        fixed = null; // Mark for removal
      } else {
        console.log(`✅ Fixing: ${storeName} → ${newMapping}`);
        fixed = `  '${storeName}': '${newMapping}',`;
      }
      break;
    }
  }
  
  if (fixed !== null) {
    fixedLines.push(fixed);
  }
}

// Write the fixed content back
const fixedContent = fixedLines.join('\n');
fs.writeFileSync(imagesPath, fixedContent);

console.log('\n✅ Fixed image mappings! Removed invalid mappings and corrected existing ones.');
console.log('This should eliminate most 404 errors from missing store images.'); 