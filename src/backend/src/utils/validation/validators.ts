/**
 * Common validation utilities
 */

/**
 * Check if a value is a valid email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if a value is a valid date string (ISO 8601 or DD.MM.YYYY)
 */
export const isValidDate = (dateString: string): boolean => {
  // ISO 8601 format (YYYY-MM-DD)
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  // European format (DD.MM.YYYY)
  const europeanRegex = /^\d{2}\.\d{2}\.\d{4}$/;
  
  if (!isoRegex.test(dateString) && !europeanRegex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Check if a string is not empty after trimming
 */
export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Check if a value is a valid enum value
 */
export const isValidEnum = <T extends Record<string, string>>(
  value: unknown,
  enumObj: T
): value is T[keyof T] => {
  return Object.values(enumObj).includes(value as string);
};

/**
 * Sanitize string input (trim and remove extra spaces)
 */
export const sanitizeString = (value: string): string => {
  return value.trim().replace(/\s+/g, ' ');
};

/**
 * Validate array has minimum length
 */
export const hasMinLength = <T>(array: T[], minLength: number): boolean => {
  return Array.isArray(array) && array.length >= minLength;
};

/**
 * Validate array has maximum length
 */
export const hasMaxLength = <T>(array: T[], maxLength: number): boolean => {
  return Array.isArray(array) && array.length <= maxLength;
};
