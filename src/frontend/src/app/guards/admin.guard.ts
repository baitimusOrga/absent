import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Ensure auth is loaded before checking
  const isAuthenticated = await authService.isAuthenticated();
  if (!isAuthenticated) {
    router.navigate(['/login']);
    return false;
  }

  const user = authService.getCurrentUser();
  
  if (!user || user.role !== 'admin') {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
