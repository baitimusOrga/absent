import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { getAuthClient, initAuthClient } from './auth-client';
import { FRONTEND_CONFIG } from '../config/frontend-config';

export interface User {
  id: string;
  email: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();
  private authClient;

  constructor() {
    const config = inject(FRONTEND_CONFIG);
    this.authClient = initAuthClient(config.apiUrl);
    this.checkSession();
  }

  async checkSession(): Promise<void> {
    try {
      const session = await this.authClient.getSession();
      if (session?.data?.user) {
        this.currentUserSubject.next(session.data.user as User);
      } else {
        this.currentUserSubject.next(null);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      this.currentUserSubject.next(null);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const session = await this.authClient.getSession();
      const isAuth = !!session?.data?.user;
      if (isAuth && !this.currentUserSubject.value && session.data) {
        this.currentUserSubject.next(session.data.user as User);
      }
      return isAuth;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.authClient.signOut();
      this.currentUserSubject.next(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getClient() {
    return this.authClient;
  }
}
