/**
 * Database configuration module
 */

import { requireEnv } from './env';

export interface DatabaseConfig {
  uri: string;
  dbName: string;
  connectionTimeout: number;
  maxRetries: number;
  retryDelay: number;
}

/**
 * Load and validate database configuration
 */
export const loadDatabaseConfig = (): DatabaseConfig => {
  return {
    uri: requireEnv('MONGO_URI'),
    dbName: requireEnv('MONGO_DB'),
    connectionTimeout: 10000, // 10 seconds
    maxRetries: 3,
    retryDelay: 1000, // 1 second
  };
};
