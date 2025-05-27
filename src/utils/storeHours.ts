import type { ProcessedBookstore } from '../types/bookstore';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

/**
 * Parse time string in format "HH:MM" or "HH:MM AM/PM" to minutes since midnight
 */
function parseTimeToMinutes(timeStr: string): number {
  // Add null check
  if (!timeStr || typeof timeStr !== 'string') {
    throw new Error('Invalid time string');
  }

  // Clean the time string
  const cleanTimeStr = timeStr.trim();
  
  // Handle special cases
  if (cleanTimeStr.toLowerCase().includes('24 hours') || cleanTimeStr.toLowerCase() === 'open 24 hours') {
    return 0; // Return 0 for start of day (24 hour stores are always open)
  }
  
  if (cleanTimeStr.toLowerCase() === 'closed') {
    throw new Error('Store is closed');
  }

  // Handle just numbers (like "12" for noon) - improved logic
  if (/^\d{1,2}$/.test(cleanTimeStr)) {
    const hours = parseInt(cleanTimeStr);
    if (hours >= 1 && hours <= 12) {
      // Assume PM for numbers 1-12 to be safe (most common case)
      return hours === 12 ? 12 * 60 : (hours + 12) * 60;
    } else if (hours >= 13 && hours <= 23) {
      // 24-hour format
      return hours * 60;
    } else if (hours === 0) {
      // Midnight
      return 0;
    }
    // If hours is outside valid range, fall through to error
  }

  // Handle time formats like "10a.m." or "5:30p.m."
  let timeMatch = cleanTimeStr.match(/(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?/i);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2] || '0');
    const period = timeMatch[3].toLowerCase();
    
    if (isNaN(hours) || isNaN(minutes) || hours < 1 || hours > 12 || minutes >= 60) {
      throw new Error('Invalid time values');
    }
    
    let totalMinutes = hours * 60 + minutes;
    
    // Handle PM times
    if (period === 'p' && hours !== 12) {
      totalMinutes += 12 * 60;
    }
    // Handle 12 AM
    if (period === 'a' && hours === 12) {
      totalMinutes = minutes;
    }
    
    return totalMinutes;
  }

  // Handle 24-hour format like "14:30"
  timeMatch = cleanTimeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    
    if (isNaN(hours) || isNaN(minutes) || hours >= 24 || minutes >= 60) {
      throw new Error('Invalid time values');
    }
    
    return hours * 60 + minutes;
  }

  // If no format matches, throw an error
  throw new Error(`Unrecognized time format: ${cleanTimeStr}`);
}

/**
 * Check if the store is currently open based on its hours
 */
export function isStoreOpen(store: ProcessedBookstore): boolean {
  try {
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

    // Check for 24-hour operation
    if (todayHours.toLowerCase().includes('open 24 hours') || todayHours.toLowerCase().includes('24 hours')) {
      return true;
    }

    // Parse hours range - handle different separators and strip day prefixes
    let hoursOnly = todayHours;
    
    // Remove day prefixes like "Sunday: " or "Mon: "
    const dayPrefixMatch = hoursOnly.match(/^[a-zA-Z]+day?:\s*(.+)$/i);
    if (dayPrefixMatch) {
      hoursOnly = dayPrefixMatch[1];
    }
    
    // Handle different separators
    const hoursParts = hoursOnly.split(/–|—|-/).map(t => t.trim());
    
    if (hoursParts.length !== 2) {
      console.warn(`Invalid hours format for store ${store.name}: ${todayHours}`);
      return false;
    }
    
    const [openTime, closeTime] = hoursParts;
    
    const openMinutes = parseTimeToMinutes(openTime);
    const closeMinutes = parseTimeToMinutes(closeTime);

    // Handle cases where closing time is on the next day
    if (closeMinutes < openMinutes) {
      return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    }

    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  } catch (error) {
    console.error(`Error parsing hours for store ${store.name}:`, error);
    // Don't log every error, just return false for stores with unparseable hours
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