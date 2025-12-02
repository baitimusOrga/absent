import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { authClient } from './auth-client';

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

  constructor() {
    this.checkSession();
  }

  async checkSession(): Promise<void> {
    try {
      const session = await authClient.getSession();
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
      const session = await authClient.getSession();
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
      await authClient.signOut();
      this.currentUserSubject.next(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
