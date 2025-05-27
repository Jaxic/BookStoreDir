import { z } from 'zod';

export interface GoogleReview {
  author: string;
  rating: number;
  time: string;
  text: string;
}

// Define the Zod schema for bookstore data validation
export const BookstoreSchema = z.object({
  // Basic Info
  name: z.string(),
  address: z.string(),
  city: z.string(),
  province: z.string(),
  zip: z.string(),
  phone: z.string().optional(),
  website: z.string().optional(),
  email: z.string().optional(),
  
  // Location
  lat: z.string(),
  lng: z.string(),
  
  // Business Data
  rating: z.string().optional(),
  num_reviews: z.string().optional(),
  price_level: z.string().optional(),
  
  // Google Integration
  place_id: z.string(),
  place_url: z.string().optional(),
  photos_url: z.string().optional(),
  street_view: z.string().optional(),
  
  // Status and Hours
  status: z.string().optional(),
  mon_hours: z.string().optional(),
  tue_hours: z.string().optional(),
  wed_hours: z.string().optional(),
  thu_hours: z.string().optional(),
  fri_hours: z.string().optional(),
  sat_hours: z.string().optional(),
  sun_hours: z.string().optional(),
  
  // Reviews
  review1_author: z.string().optional(),
  review1_rating: z.string().optional(),
  review1_time: z.string().optional(),
  review1_text: z.string().optional(),
  review2_author: z.string().optional(),
  review2_rating: z.string().optional(),
  review2_time: z.string().optional(),
  review2_text: z.string().optional(),
  review3_author: z.string().optional(),
  review3_rating: z.string().optional(),
  review3_time: z.string().optional(),
  review3_text: z.string().optional(),
  review4_author: z.string().optional(),
  review4_rating: z.string().optional(),
  review4_time: z.string().optional(),
  review4_text: z.string().optional(),
  review5_author: z.string().optional(),
  review5_rating: z.string().optional(),
  review5_time: z.string().optional(),
  review5_text: z.string().optional(),
});

// Export the type inferred from the schema
export type BookstoreData = z.infer<typeof BookstoreSchema>;

// Interface for processed bookstore data with additional fields
export interface ProcessedBookstore {
  place_id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  zip: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  rating?: number;
  photos_url?: string;
  hours?: {
    [key: string]: string[];
  };
  price_level?: number;
  types?: string[];
}