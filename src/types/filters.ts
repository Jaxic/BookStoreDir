export interface StoreFilters {
  openNow: boolean;
  hasWebsite: boolean;
  minRating: number;
  maxDistance: number | null;
  priceLevel: string | null;
  province: string | null;
  openLate: boolean;
  openWeekends: boolean;
}

export default StoreFilters; 