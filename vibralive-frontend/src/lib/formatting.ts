/**
 * Formatting utilities for currency, numbers, and text
 * 
 * ⚠️ IMPORTANTE: For date/time formatting with timezone awareness, use datetime-tz.ts
 * This file contains only NON-timezone-dependent formatters (currency, etc.)
 */

/**
 * Format a number as currency (USD by default)
 */
export function formatCurrency(
  value: number | null | undefined,
  currency = 'USD'
): string {
  if (value === null || value === undefined) return '$0.00';

  const formatter = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(value);
}

/**
 * Format a number as percentage
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0%';
  return `${(value * 100).toFixed(2)}%`;
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0';
  
  return new Intl.NumberFormat('es-ES').format(value);
}

/**
 * Truncate text to a specific length
 */
export function truncateText(text: string | null | undefined, length = 50): string {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '-';
  
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format based on length
  if (digits.length === 10) {
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, '+1 ($1) $2-$3');
  }
  
  return phone;
}
