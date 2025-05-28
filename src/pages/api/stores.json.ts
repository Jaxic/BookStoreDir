import { parseBookstores } from '../../lib/csv/parser';
import { processBookstore } from '../../lib/processors/bookstore';
import type { APIRoute } from 'astro';
import path from 'path';

export const GET: APIRoute = async ({ url }) => {
  const csvPath = path.join(process.cwd(), 'src', 'data', 'bookstores.csv');
  const { records } = await parseBookstores(csvPath);
  let stores = records.map(processBookstore);

  // Filtering
  const search = url.searchParams.get('search')?.toLowerCase() || '';
  const city = url.searchParams.get('city')?.toLowerCase() || '';
  const province = url.searchParams.get('province')?.toLowerCase() || '';

  if (search) {
    stores = stores.filter(store => store.name.toLowerCase().includes(search));
  }
  if (city) {
    stores = stores.filter(store => store.city?.toLowerCase().includes(city));
  }
  if (province) {
    stores = stores.filter(store => store.province?.toLowerCase().includes(province));
  }

  // Pagination
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const limit = parseInt(url.searchParams.get('limit') || '12', 10);
  const total = stores.length;
  const paged = stores.slice(offset, offset + limit);

  return new Response(
    JSON.stringify({ stores: paged, total }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}; 