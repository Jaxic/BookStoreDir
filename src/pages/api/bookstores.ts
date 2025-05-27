import type { APIRoute } from 'astro';
import { parse } from 'csv-parse/sync';
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { ProcessedBookstore } from '../../types/bookstore';

export const GET: APIRoute = async () => {
  try {
    // Read the CSV file
    const csvPath = join(process.cwd(), 'src', 'data', 'bookstores.csv');
    const csvContent = await readFile(csvPath, 'utf-8');

    // Parse CSV data
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    // Process the records into the correct format
    const bookstores: ProcessedBookstore[] = records.map((record: any) => ({
      id: record.id || String(Math.random()),
      name: record.name || '',
      address: record.address || '',
      city: record.city || '',
      province: record.province || '',
      postalCode: record.postal_code || '',
      phone: record.phone || '',
      website: record.website || '',
      email: record.email || '',
      hours: record.hours ? JSON.parse(record.hours) : {},
      rating: parseFloat(record.rating) || 0,
      priceLevel: parseInt(record.price_level) || 1,
      latitude: parseFloat(record.latitude) || 0,
      longitude: parseFloat(record.longitude) || 0,
      imageUrl: record.image_url || '/images/default-bookstore.jpg',
      description: record.description || '',
      specialties: record.specialties ? record.specialties.split(',').map((s: string) => s.trim()) : [],
      features: record.features ? record.features.split(',').map((f: string) => f.trim()) : []
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: bookstores
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error processing bookstores:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to process bookstore data'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}; 