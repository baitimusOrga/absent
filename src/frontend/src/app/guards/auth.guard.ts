import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check cached auth state first (instant)
  const cachedAuth = authService.isAuthenticatedSync();
  
  if (cachedAuth) {
    return true;
  }

  // If no cache, check async with short timeout
  try {
    const isAuthenticated = await Promise.race([
      authService.isAuthenticated(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1000))
    ]);

    if (!isAuthenticated) {
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    return true;
  } catch (error) {
    router.navigate(['/login']);
    return false;
  }
};

export const loginGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Only check cached state - don't wait for async check
  // This allows instant access to login/register pages
  const isAuthenticated = authService.isAuthenticatedSync();

  if (isAuthenticated) {
    router.navigate(['/dashboard']);
    return false;
  }

  // Let user through immediately, check session in background
  authService.isAuthenticated().then(authenticated => {
    if (authenticated) {
      router.navigate(['/dashboard']);
    }
  });

  return true;
};
