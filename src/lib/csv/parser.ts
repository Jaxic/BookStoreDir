import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import { bookstoreSchema } from './schema';
import type { BookstoreData } from '../../types/bookstore';

export interface ParsingError {
  row: number;
  error: string;
  data?: Partial<BookstoreData>;
}

export interface ParsingResult {
  records: BookstoreData[];
  errors: ParsingError[];
}

function mapCsvToSchema(row: any): Partial<BookstoreData> {
  return {
    name: row.name,
    address: row.street,
    city: row.city,
    province: row.state,
    zip: row.postal_code,
    phone: row.phone,
    website: row.site,
    email: '', // Not in CSV
    lat: row.latitude,
    lng: row.longitude,
    rating: row.rating,
    num_reviews: row.reviews,
    price_level: '', // Not in CSV
    place_id: row.place_id,
    place_url: row.location_link,
    photos_url: row.photo,
    street_view: row.street_view,
    status: row.business_status,
    mon_hours: row.mon_hours,
    tue_hours: row.tues_hours,
    wed_hours: row.wed_hours,
    thu_hours: row.thur_hours,
    fri_hours: row.fri_hours,
    sat_hours: row.sat_hours,
    sun_hours: row.sun_hours,
    review1_author: row.review_1_author,
    review1_rating: row.review_1_rating,
    review1_time: row.review_1_time,
    review1_text: row.review_1_text,
    review2_author: row.review_2_author,
    review2_rating: row.review_2_rating,
    review2_time: row.review_2_time,
    review2_text: row.review_2_text,
    review3_author: row.review_3_author,
    review3_rating: row.review_3_rating,
    review3_time: row.review_3_time,
    review3_text: row.review_3_text,
    review4_author: row.review_4_author,
    review4_rating: row.review_4_rating,
    review4_time: row.review_4_time,
    review4_text: row.review_4_text,
    review5_author: row.review_5_author,
    review5_rating: row.review_5_rating,
    review5_time: row.review_5_time,
    review5_text: row.review_5_text,
  };
}

export async function parseBookstores(filePath: string): Promise<ParsingResult> {
  const records: BookstoreData[] = [];
  const errors: ParsingError[] = [];
  let rowNumber = 0;

  return new Promise((resolve, reject) => {
    createReadStream(filePath)
      .pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
        })
      )
      .on('data', (row) => {
        rowNumber++;
        try {
          const mappedData = mapCsvToSchema(row);
          const validatedData = bookstoreSchema.parse(mappedData);
          records.push(validatedData);
        } catch (error) {
          errors.push({
            row: rowNumber,
            error: error instanceof Error ? error.message : 'Unknown error',
            data: row,
          });
        }
      })
      .on('end', () => {
        resolve({ records, errors });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
} 