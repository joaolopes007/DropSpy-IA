/**
 * Utility functions for formatting values used across the application.
 */

/**
 * Formats a number as Brazilian Real (BRL).
 * @param value The numeric value to format
 * @returns A formatted currency string (e.g., "R$ 1.234,56")
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Formats a date string or object into Brazilian date format (DD/MM/YYYY).
 * @param date The date to format
 * @returns A formatted date string
 */
export const formatDate = (date: string | number | Date): string => {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
};

/**
 * Formats a number with a thousands separator.
 * @param value The value to format
 * @returns A formatted number string (e.g., "1.234")
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};
