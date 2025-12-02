import { createAuthClient } from 'better-auth/client';

// Lazy initialization - creates client when first accessed
let authClientInstance: ReturnType<typeof createAuthClient> | null = null;

const getAuthClient = () => {
  if (!authClientInstance) {
    const apiUrl = typeof window !== 'undefined' && (window as any).__FRONTEND_CONFIG__?.apiUrl
      ? (window as any).__FRONTEND_CONFIG__.apiUrl
      : 'http://localhost:3000';
    
    authClientInstance = createAuthClient({
      baseURL: apiUrl,
    });
  }
  return authClientInstance;
};

export const authClient = new Proxy({} as ReturnType<typeof createAuthClient>, {
  get(target, prop) {
    return getAuthClient()[prop as keyof ReturnType<typeof createAuthClient>];
  }
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;
