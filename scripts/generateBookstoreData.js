import { promises as fs } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateBookstoreData() {
  try {
    // Read the CSV file
    const csvPath = join(dirname(__dirname), 'src', 'data', 'bookstores.csv');
    const csvContent = await fs.readFile(csvPath, 'utf-8');

    // Parse CSV data
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    // Process the records into the correct format
    const bookstores = records.map((record, index) => ({
      id: String(index + 1),
      name: record.name || '',
      address: record.full_address || record.street || '',
      city: record.city || '',
      province: record.state || '',
      postalCode: record.postal_code || '',
      phone: record.phone || '',
      website: record.site || '',
      lat: record.latitude || '0',
      lng: record.longitude || '0',
      rating: record.rating || '0',
      reviews: record.reviews || '0',
      image: record.photo || '/images/default-bookstore.jpg',
      category: record.category || 'Used Book Store',
      description: record.description || '',
      price_level: '$', // Default price level since not in CSV
      business_status: record.business_status || 'OPERATIONAL',
      // Map hours from CSV format
      mon_hours: record.mon_hours || 'Closed',
      tue_hours: record.tues_hours || 'Closed',
      wed_hours: record.wed_hours || 'Closed',
      thu_hours: record.thur_hours || 'Closed',
      fri_hours: record.fri_hours || 'Closed',
      sat_hours: record.sat_hours || 'Closed',
      sun_hours: record.sun_hours || 'Closed'
    }));

    // Create the output data structure
    const outputData = {
      success: true,
      data: bookstores
    };

    // Ensure the public/data directory exists
    const outputDir = join(dirname(__dirname), 'public', 'data');
    await fs.mkdir(outputDir, { recursive: true });

    // Write the JSON file
    const outputPath = join(outputDir, 'bookstores.json');
    await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2));

    console.log(`Generated ${bookstores.length} bookstore records`);
    console.log(`Data written to: ${outputPath}`);
  } catch (error) {
    console.error('Error generating bookstore data:', error);
    process.exit(1);
  }
}

generateBookstoreData(); 