/**
 * Environment variable validation and parsing utilities
 */

import { InternalServerError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Parse a string environment variable to a number
 */
export const parseNumber = (value: string | undefined, key: string): number => {
  if (!value) {
    throw new InternalServerError(`Environment variable ${key} is required but not set`);
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new InternalServerError(`Environment variable ${key} must be a number. Received "${value}"`);
  }

  return parsed;
};

/**
 * Parse a comma-separated string to an array
 */
export const parseCsv = (value: string | undefined): string[] => {
  if (!value) return [];
  
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

/**
 * Parse a boolean environment variable
 */
export const parseBoolean = (value: string | undefined, key: string): boolean => {
  if (!value) {
    throw new InternalServerError(`Environment variable ${key} is required but not set`);
  }

  const normalized = value.trim().toLowerCase();
  if (normalized !== 'true' && normalized !== 'false') {
    throw new InternalServerError(
      `Environment variable ${key} must be either "true" or "false". Received "${value}"`
    );
  }

  return normalized === 'true';
};

/**
 * Require an environment variable
 */
export const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new InternalServerError(`Missing required environment variable: ${key}`);
  }

  return value;
};

/**
 * Get optional environment variable with default
 */
export const getEnv = (key: string, defaultValue: string): string => {
  return process.env[key] ?? defaultValue;
};

/**
 * Validate all required environment variables at startup
 */
export const validateEnvironment = (requiredVars: string[]): void => {
  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    const errorMsg = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error(errorMsg);
    throw new InternalServerError(errorMsg);
  }

  logger.info('Environment variables validated successfully');
};
