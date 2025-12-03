/**
 * Authentication configuration module
 */

import { requireEnv, parseCsv } from './env';

export interface AuthConfig {
  secret: string;
  url: string;
  trustedOrigins: string[];
  google: {
    clientId: string;
    clientSecret: string;
  };
}

/**
 * Load and validate authentication configuration
 */
export const loadAuthConfig = (): AuthConfig => {
  return {
    secret: requireEnv('BETTER_AUTH_SECRET'),
    url: requireEnv('BETTER_AUTH_URL'),
    trustedOrigins: parseCsv(process.env.CORS_ORIGIN),
    google: {
      clientId: requireEnv('GOOGLE_CLIENT_ID'),
      clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
    },
  };
};
