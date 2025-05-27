import { parseBookstores } from '../lib/csv/parser';
import type { ParsingError, ParsingResult } from '../lib/csv/parser';
import path from 'path';

async function main() {
  try {
    const csvPath = path.join(process.cwd(), 'src', 'data', 'bookstores.csv');
    const result: ParsingResult = await parseBookstores(csvPath);
    
    console.log(`Successfully parsed ${result.records.length} bookstores`);
    if (result.errors.length > 0) {
      console.log(`Found ${result.errors.length} errors:`);
      result.errors.forEach((error: ParsingError) => {
        console.log(`Row ${error.row}:`);
        if (error.data) {
          console.log('Row data:', error.data);
        }
        console.log('Error:', error.error);
        console.log('---');
      });
    }
  } catch (error) {
    console.error('Failed to parse CSV:', error instanceof Error ? error.message : error);
  }
}

main(); 