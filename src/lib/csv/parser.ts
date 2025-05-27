import fs from 'fs';
import Papa from 'papaparse';
import { BookstoreSchema, type BookstoreData } from '../../types/bookstore';

export interface ParseResult {
  records: BookstoreData[];
  errors: string[];
}

// Parse the working_hours string into individual day hours
function parseWorkingHours(workingHoursStr: string): Record<string, string> {
  const defaultHours = {
    mon_hours: '',
    tue_hours: '',
    wed_hours: '',
    thu_hours: '',
    fri_hours: '',
    sat_hours: '',
    sun_hours: ''
  };

  if (!workingHoursStr || workingHoursStr.trim() === '') {
    return defaultHours;
  }

  try {
    // Remove the outer braces and split by comma
    const cleanStr = workingHoursStr.replace(/^{|}$/g, '').trim();
    
    if (!cleanStr) {
      return defaultHours;
    }
    
    const dayEntries = cleanStr.split(',');
    
    const dayMap: Record<string, string> = {};
    
    dayEntries.forEach(entry => {
      const trimmed = entry.trim();
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const day = trimmed.substring(0, colonIndex).trim().toLowerCase();
        const hours = trimmed.substring(colonIndex + 1).trim();
        
        // Map day names to our column format
        switch (day) {
          case 'monday':
            dayMap.mon_hours = hours;
            break;
          case 'tuesday':
            dayMap.tue_hours = hours;
            break;
          case 'wednesday':
            dayMap.wed_hours = hours;
            break;
          case 'thursday':
            dayMap.thu_hours = hours;
            break;
          case 'friday':
            dayMap.fri_hours = hours;
            break;
          case 'saturday':
            dayMap.sat_hours = hours;
            break;
          case 'sunday':
            dayMap.sun_hours = hours;
            break;
        }
      }
    });
    
    return {
      mon_hours: dayMap.mon_hours || '',
      tue_hours: dayMap.tue_hours || '',
      wed_hours: dayMap.wed_hours || '',
      thu_hours: dayMap.thu_hours || '',
      fri_hours: dayMap.fri_hours || '',
      sat_hours: dayMap.sat_hours || '',
      sun_hours: dayMap.sun_hours || ''
    };
  } catch (error) {
    console.warn('Failed to parse working hours:', workingHoursStr, error);
    return defaultHours;
  }
}

function mapCsvToSchema(row: any): Partial<BookstoreData> {
  // Parse the working_hours column to get individual day hours
  const parsedHours = parseWorkingHours(row.working_hours || '');
  
  return {
    name: row.name || '',
    description: row.description || '',
    address: row.street || '',
    city: row.city || '',
    province: row.state || '',
    zip: row.postal_code || '',
    phone: row.phone || '',
    website: row.site || '',
    email: '', // Not in CSV
    lat: (parseFloat(row.latitude) || 0).toString(),
    lng: (parseFloat(row.longitude) || 0).toString(),
    rating: (parseFloat(row.rating) || 0).toString(),
    num_reviews: (parseInt(row.reviews) || 0).toString(),
    price_level: (parseInt(row.price_level) || 0).toString(),
    place_id: row.place_id || '',
    place_url: row.location_link || '',
    photos_url: row.photo || '',
    status: row.business_status || '',
    // Use parsed hours instead of individual columns
    mon_hours: parsedHours.mon_hours,
    tue_hours: parsedHours.tue_hours,
    wed_hours: parsedHours.wed_hours,
    thu_hours: parsedHours.thu_hours,
    fri_hours: parsedHours.fri_hours,
    sat_hours: parsedHours.sat_hours,
    sun_hours: parsedHours.sun_hours
  };
}

export async function parseBookstores(filePath: string): Promise<ParseResult> {
  try {
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim()
    });

    const records: BookstoreData[] = [];
    const errors: string[] = [];

    parseResult.data.forEach((row: any, index: number) => {
      try {
        const mappedData = mapCsvToSchema(row);
        const validatedData = BookstoreSchema.parse(mappedData);
        records.push(validatedData);
      } catch (error) {
        const errorMessage = `Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMessage);
        console.warn(errorMessage);
      }
    });

    return { records, errors };
  } catch (error) {
    throw new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 