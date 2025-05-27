import type { BookstoreData, ProcessedBookstore, GoogleReview } from '../../types/bookstore';

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
}

function processReview(
  author?: string,
  rating?: string,
  time?: string,
  text?: string
): GoogleReview | undefined {
  if (!author && !rating && !time && !text) return undefined;
  
  return {
    author: author || '',
    rating: parseNumber(rating) || 0,
    time: time || '',
    text: text || ''
  };
}

export function processBookstore(data: BookstoreData): ProcessedBookstore {
  // Process coordinates
  const latitude = parseNumber(data.lat);
  const longitude = parseNumber(data.lng);
  
  // Process rating and reviews
  const rating = parseNumber(data.rating);
  const numReviews = parseNumber(data.num_reviews);
  
  // Process Google reviews
  const reviews: GoogleReview[] = [];
  
  // Process each review if it exists
  for (let i = 1; i <= 5; i++) {
    const review = processReview(
      data[`review${i}_author` as keyof BookstoreData] as string,
      data[`review${i}_rating` as keyof BookstoreData] as string,
      data[`review${i}_time` as keyof BookstoreData] as string,
      data[`review${i}_text` as keyof BookstoreData] as string
    );
    if (review) reviews.push(review);
  }
  
  // Create formatted fields
  const formattedAddress = `${data.address}, ${data.city}, ${data.state} ${data.zip}`;
  
  // Process photo URL - ensure it's a valid URL or use a default
  const photoUrl = data.photos_url && data.photos_url.trim() !== '' 
    ? data.photos_url.trim()
    : 'https://placehold.co/400x300?text=No+Image';
  
  // Return processed data
  return {
    name: data.name,
    address: data.address,
    city: data.city,
    state: data.state,
    zip: data.zip,
    phone: data.phone || '',
    website: data.website || '',
    
    // Location data
    lat: data.lat,
    lng: data.lng,
    formattedAddress,
    coordinates: latitude !== undefined && longitude !== undefined 
      ? { lat: latitude, lng: longitude }
      : undefined,
      
    // Rating data
    ratingInfo: rating !== undefined
      ? {
          rating,
          numReviews: numReviews || 0,
          reviews
        }
      : undefined,
      
    // Hours data
    hours: {
      monday: data.mon_hours,
      tuesday: data.tue_hours,
      wednesday: data.wed_hours,
      thursday: data.thu_hours,
      friday: data.fri_hours,
      saturday: data.sat_hours,
      sunday: data.sun_hours
    },
    
    // Photo URL
    photos_url: photoUrl,
    
    // Status
    status: (data.status as ProcessedBookstore['status']) || 'OPERATIONAL'
  };
} 