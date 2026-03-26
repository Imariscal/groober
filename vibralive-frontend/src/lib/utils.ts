import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Format a date to locale string
 * @param date ISO string or Date object
 * @param formatStr date-fns format string (default: dd/MM/yyyy HH:mm)
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, formatStr = 'dd/MM/yyyy HH:mm'): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatStr);
  } catch {
    return '-';
  }
}

/**
 * Format a date for a specific timezone
 * @param date ISO string or Date object
 * @param timeZone IANA timezone string (e.g., 'America/Mexico_City')
 * @param formatStr date-fns format string (default: dd/MM/yyyy HH:mm)
 * @returns Formatted date string in specified timezone
 */
export function formatDateInTimeZone(
  date: string | Date,
  timeZone: string,
  formatStr = 'dd/MM/yyyy HH:mm'
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatInTimeZone(dateObj, timeZone, formatStr);
  } catch {
    return '-';
  }
}

/**
 * Format a date to only show the date part
 * @param date ISO string or Date object
 * @returns Formatted date string (dd/MM/yyyy)
 */
export function formatDateOnly(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy');
}

/**
 * Format a date to only show the time part
 * @param date ISO string or Date object
 * @returns Formatted time string (HH:mm)
 */
export function formatTimeOnly(date: string | Date): string {
  return formatDate(date, 'HH:mm');
}

/**
 * Truncate text to specified length with ellipsis
 * @param text Text to truncate
 * @param length Maximum length
 * @returns Truncated text
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Capitalize first letter of a string
 * @param text Text to capitalize
 * @returns Capitalized text
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Check if a date is in the past
 * @param date ISO string or Date object
 * @returns boolean
 */
export function isPastDate(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
}

/**
 * Check if a date is today
 * @param date ISO string or Date object
 * @returns boolean
 */
export function isToday(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Get human-readable relative time (e.g., "2 hours ago")
 * @param date ISO string or Date object
 * @returns Human readable string
 */
export function getRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (seconds < 60) return 'Hace poco';
  if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} minutos`;
  if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} horas`;
  if (seconds < 2592000) return `Hace ${Math.floor(seconds / 86400)} días`;
  
  return formatDate(dateObj, 'dd MMM yyyy');
}

/**
 * Check if string is empty or undefined
 * @param value String value
 * @returns boolean
 */
export function isEmpty(value?: string | null): boolean {
  return !value || value.trim().length === 0;
}

/**
 * Merge multiple CSS classes
 * @param classes Class names to merge
 * @returns Merged class string
 */
export function mergeClasses(...classes: (string | undefined | null)[]): string {
  return classes.filter((c) => c && typeof c === 'string').join(' ');
}

/**
 * Deep clone an object
 * @param obj Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Get value from nested object using dot notation
 * @param obj Object to traverse
 * @param path Dot notation path (e.g., 'user.profile.name')
 * @returns Value at path or undefined
 */
export function getDeep(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

/**
 * Check if value is a valid email
 * @param email Email string
 * @returns boolean
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format currency value
 * @param value Number value
 * @param currency Currency code (default: 'USD')
 * @param locale Locale string (default: 'es-ES')
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  locale: string = 'es-ES'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Format number with decimals
 * @param value Number to format
 * @param decimals Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Sleep/delay for specified milliseconds
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
