/**
 * Application runtime metadata
 */

import { requireEnv, getEnv } from './env';

export interface RuntimeMetadata {
  name: string;
  version: string;
  environment: string;
}

/**
 * Load application metadata
 */
export const loadMetadata = (): RuntimeMetadata => {
  return {
    name: requireEnv('APP_NAME'),
    version: requireEnv('APP_VERSION'),
    environment: getEnv('NODE_ENV', 'development'),
  };
};

/**
 * Ensure process metadata environment variables are set
 */
export const ensureProcessMetadata = (metadata: RuntimeMetadata): void => {
  if (!process.env.APP_NAME) {
    process.env.APP_NAME = metadata.name;
  }

  if (!process.env.APP_VERSION) {
    process.env.APP_VERSION = metadata.version;
  }
};
