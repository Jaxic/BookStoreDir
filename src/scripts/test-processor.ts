import { parseBookstores } from '../lib/csv/parser';
import { processBookstore } from '../lib/processors/bookstore';
import type { ProcessedBookstore } from '../types/bookstore';
import path from 'path';

async function main() {
  try {
    const csvPath = path.join(process.cwd(), 'src', 'data', 'bookstores.csv');
    const { records } = await parseBookstores(csvPath);
    
    // Process the first bookstore as a sample
    const sampleBookstore = records[0];
    const processed: ProcessedBookstore = processBookstore(sampleBookstore);
    
    // Print the processed data
    console.log('Sample Processed Bookstore:');
    console.log('---------------------------');
    console.log('Basic Info:');
    console.log(`Name: ${processed.name}`);
    console.log(`Formatted Address: ${processed.formattedAddress}`);
    console.log(`Phone: ${processed.phone || 'N/A'}`);
    console.log(`Website: ${processed.website || 'N/A'}`);
    
    console.log('\nLocation:');
    if (processed.coordinates) {
      console.log(`Coordinates: (${processed.coordinates.lat}, ${processed.coordinates.lng})`);
    }
    
    console.log('\nRating Info:');
    if (processed.ratingInfo) {
      console.log(`Rating: ${processed.ratingInfo.rating}`);
      console.log(`Number of Reviews: ${processed.ratingInfo.numReviews}`);
      console.log('\nSample Review:');
      if (processed.ratingInfo.reviews.length > 0) {
        const review = processed.ratingInfo.reviews[0];
        console.log(`Author: ${review.author}`);
        console.log(`Rating: ${review.rating}`);
        console.log(`Time: ${review.time}`);
        console.log(`Text: ${review.text}`);
      } else {
        console.log('No reviews available');
      }
    } else {
      console.log('No rating information available');
    }
    
    console.log('\nBusiness Hours:');
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
    days.forEach(day => {
      console.log(`${day.charAt(0).toUpperCase() + day.slice(1)}: ${processed.hours[day] || 'Closed'}`);
    });
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

main(); 