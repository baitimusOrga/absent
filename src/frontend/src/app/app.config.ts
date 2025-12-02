import { provideHttpClient, withFetch } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { FRONTEND_CONFIG_PROVIDER, type FrontendConfig, setFrontendConfig } from './config/frontend-config';

const fetchFrontendConfig = async (): Promise<void> => {
  const response = await fetch('/config/config.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load frontend config: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as Partial<FrontendConfig>;
  if (!payload || !payload.appName || !payload.version || !payload.apiUrl || typeof payload.production !== 'boolean') {
    throw new Error('Frontend config is missing required fields.');
  }

  setFrontendConfig(payload as FrontendConfig);
  
  // Make config available globally for auth-client
  (window as any).__FRONTEND_CONFIG__ = payload;
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({
      anchorScrolling: 'enabled',
      scrollPositionRestoration: 'enabled'
    })),
    provideHttpClient(withFetch()),
    FRONTEND_CONFIG_PROVIDER,
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => () => fetchFrontendConfig(),
    }
  ]
};
