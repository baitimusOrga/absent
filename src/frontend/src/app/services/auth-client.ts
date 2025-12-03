import { createAuthClient } from 'better-auth/client';

// This will be set by the auth service after config loads
let authClientInstance: ReturnType<typeof createAuthClient> | null = null;

export const initAuthClient = (apiUrl: string) => {
  if (!authClientInstance) {
    console.log('Initializing auth client with API URL:', apiUrl);
    authClientInstance = createAuthClient({
      baseURL: apiUrl,
    });
  }
  return authClientInstance;
};

export const getAuthClient = () => {
  if (!authClientInstance) {
    // Fallback initialization with config or localhost
    const apiUrl = typeof window !== 'undefined' && (window as any).__FRONTEND_CONFIG__?.apiUrl
      ? (window as any).__FRONTEND_CONFIG__.apiUrl
      : 'http://localhost:3000';
    return initAuthClient(apiUrl);
  }
  return authClientInstance;
};
