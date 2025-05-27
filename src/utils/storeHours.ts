import type { ProcessedBookstore } from '../types/bookstore';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

/**
 * Parse time string in format "HH:MM" or "HH:MM AM/PM" to minutes since midnight
 */
function parseTimeToMinutes(timeStr: string): number {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  
  let totalMinutes = hours * 60 + minutes;
  
  // Handle PM times
  if (period?.toUpperCase() === 'PM' && hours !== 12) {
    totalMinutes += 12 * 60;
  }
  // Handle 12 AM
  if (period?.toUpperCase() === 'AM' && hours === 12) {
    totalMinutes = minutes;
  }
  
  return totalMinutes;
}

/**
 * Check if the store is currently open based on its hours
 */
export function isStoreOpen(store: ProcessedBookstore): boolean {
  // If store is not operational, it's closed
  if (store.status !== 'OPERATIONAL') {
    return false;
  }

  // Get current day and time
  const now = new Date();
  const currentDay = DAYS[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Get today's hours
  const todayHours = store.hours[currentDay];
  
  // If no hours listed for today, assume closed
  if (!todayHours || todayHours.toLowerCase() === 'closed') {
    return false;
  }

  // Parse hours range
  const [openTime, closeTime] = todayHours.split('–').map(t => t.trim());
  
  try {
    const openMinutes = parseTimeToMinutes(openTime);
    const closeMinutes = parseTimeToMinutes(closeTime);

    // Handle cases where closing time is on the next day
    if (closeMinutes < openMinutes) {
      return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    }

    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  } catch (error) {
    console.error(`Error parsing hours for store ${store.name}:`, error);
    return false;
  }
}

/**
 * Get formatted hours for display
 */
export function getFormattedHours(hours: string | undefined): string {
  if (!hours || hours.toLowerCase() === 'closed') {
    return 'Closed';
  }
  return hours;
} 