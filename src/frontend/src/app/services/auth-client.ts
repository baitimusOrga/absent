import { createAuthClient } from 'better-auth/client';

// Get the API URL from the global config
const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    const config = (window as any).__FRONTEND_CONFIG__;
    if (config?.apiUrl) {
      return config.apiUrl;
    }
  }
  // Fallback for development
  return 'http://localhost:3000';
};

export const authClient = createAuthClient({
  baseURL: getApiUrl(),
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;
