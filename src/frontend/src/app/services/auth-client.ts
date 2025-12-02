import { createAuthClient } from 'better-auth/client';

// Get API URL from window config or fallback
const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    const config = (window as any).__FRONTEND_CONFIG__;
    if (config?.apiUrl) {
      console.log('Using API URL from config:', config.apiUrl);
      return config.apiUrl;
    }
    console.warn('Config not found, using fallback');
  }
  return 'http://localhost:3000';
};

// Create client with current API URL
export const authClient = createAuthClient({
  baseURL: getApiUrl(),
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;
