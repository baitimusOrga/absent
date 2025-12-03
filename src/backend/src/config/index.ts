/**
 * Central configuration module
 * Aggregates all configuration from different modules
 */

import 'dotenv/config';
import type { DatabaseConfig } from './database.config';
import type { CorsConfig } from './cors.config';
import type { AuthConfig } from './auth.config';
import type { RuntimeMetadata } from './metadata.config';
import { loadDatabaseConfig } from './database.config';
import { loadCorsConfig } from './cors.config';
import { loadAuthConfig } from './auth.config';
import { loadMetadata, ensureProcessMetadata as setProcessMetadata } from './metadata.config';
import { requireEnv, parseNumber, validateEnvironment } from './env';
import { logger } from '../utils/logger';

/**
 * Complete application configuration
 */
export interface AppConfig {
  nodeEnv: string;
  host: string;
  port: number;
  cors: CorsConfig;
  metadata: RuntimeMetadata;
  database: DatabaseConfig;
  auth: AuthConfig;
}

/**
 * List of required environment variables
 */
const REQUIRED_ENV_VARS = [
  'NODE_ENV',
  'HOST',
  'PORT',
  'APP_NAME',
  'APP_VERSION',
  'MONGO_URI',
  'MONGO_DB',
  'CORS_ENABLED',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
];

/**
 * Load and validate complete application configuration
 */
export const loadAppConfig = (): AppConfig => {
  try {
    // Validate all required environment variables
    validateEnvironment(REQUIRED_ENV_VARS);

    const config: AppConfig = {
      nodeEnv: requireEnv('NODE_ENV'),
      host: requireEnv('HOST'),
      port: parseNumber(process.env.PORT, 'PORT'),
      cors: loadCorsConfig(),
      metadata: loadMetadata(),
      database: loadDatabaseConfig(),
      auth: loadAuthConfig(),
    };

    logger.info('Application configuration loaded successfully', {
      environment: config.nodeEnv,
      host: config.host,
      port: config.port,
    });

    return config;
  } catch (error) {
    logger.error('Failed to load application configuration', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Export metadata helper
 */
export const ensureProcessMetadata = setProcessMetadata;

/**
 * Export sub-config loaders
 */
export { loadDatabaseConfig } from './database.config';
export { loadCorsConfig } from './cors.config';
export { loadAuthConfig } from './auth.config';
export { loadMetadata } from './metadata.config';

/**
 * Export sub-configurations
 */
export type { DatabaseConfig, CorsConfig, AuthConfig, RuntimeMetadata };
