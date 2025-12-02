import { InjectionToken } from '@angular/core';

export interface FrontendConfig {
  production: boolean;
  appName: string;
  version: string;
  apiUrl: string;
}

let cachedConfig: FrontendConfig | null = null;

export const FRONTEND_CONFIG = new InjectionToken<FrontendConfig>('FRONTEND_CONFIG');

export const setFrontendConfig = (config: FrontendConfig) => {
  cachedConfig = config;
};

export const FRONTEND_CONFIG_PROVIDER = {
  provide: FRONTEND_CONFIG,
  useFactory: () => {
    if (!cachedConfig) {
      throw new Error('Frontend configuration has not finished loading.');
    }

    return cachedConfig;
  },
};
