/**
 * CORS configuration module
 */

import { parseBoolean, parseCsv, requireEnv } from './env';
import { InternalServerError } from '../utils/errors';

export interface CorsConfig {
  enabled: boolean;
  allowList: string[];
}

/**
 * Load and validate CORS configuration
 */
export const loadCorsConfig = (): CorsConfig => {
  const corsEnabled = parseBoolean(requireEnv('CORS_ENABLED'), 'CORS_ENABLED');
  const allowList = parseCsv(process.env.CORS_ORIGIN);

  if (corsEnabled && allowList.length === 0) {
    throw new InternalServerError(
      'CORS_ORIGIN must contain at least one entry when CORS_ENABLED is true'
    );
  }

  return {
    enabled: corsEnabled,
    allowList,
  };
};
