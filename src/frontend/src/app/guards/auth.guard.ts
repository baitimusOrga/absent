import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await authService.isAuthenticated();

  if (!isAuthenticated) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  return true;
};

export const loginGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await authService.isAuthenticated();

  if (isAuthenticated) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
