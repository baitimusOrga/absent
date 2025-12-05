import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { getAuthClient, initAuthClient } from './auth-client';
import { FRONTEND_CONFIG } from '../config/frontend-config';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  emailVerified?: boolean;
  schulnetzCalendarUrl?: string;
  fullname?: string;
  school?: string;
  berufsbildner?: string;
  berufsbildnerEmail?: string;
  berufsbildnerPhoneNumber?: string;
  dateOfBirth?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();
  private authClient: any;
  private sessionCheckPromise: Promise<void> | null = null;
  private isInitialized = false;
  private config = inject(FRONTEND_CONFIG);

  private ensureAuthClient() {
    if (!this.authClient) {
      this.authClient = initAuthClient(this.config.apiUrl);
    }
    return this.authClient;
  }

  async checkSession(): Promise<void> {
    if (this.sessionCheckPromise) {
      return this.sessionCheckPromise;
    }

    this.sessionCheckPromise = (async () => {
      try {
        const client = this.ensureAuthClient();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 3000)
        );
        
        const session = await Promise.race([
          client.getSession(),
          timeoutPromise
        ]);
        
        if (session?.data?.user) {
          this.currentUserSubject.next(session.data.user as User);
        } else {
          this.currentUserSubject.next(null);
        }
        this.isInitialized = true;
      } catch (error) {
        console.error(error);
        this.currentUserSubject.next(null);
        this.isInitialized = true;
      } finally {
        this.sessionCheckPromise = null;
      }
    })();

    return this.sessionCheckPromise;
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.checkSession();
    }
    return this.currentUserSubject.value !== null;
  }

  isAuthenticatedSync(): boolean {
    return this.currentUserSubject.value !== null;
  }

  async logout(): Promise<void> {
    const client = this.ensureAuthClient();
    await client.signOut();
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getClient() {
    return this.ensureAuthClient();
  }

  async refreshSession(): Promise<void> {
    this.isInitialized = false;
    await this.checkSession();
  }

  getAuthHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  async authenticatedFetch(url: string, options?: RequestInit): Promise<Response> {
    const client = this.ensureAuthClient();
    const fullUrl = url.startsWith('http') ? url : `${this.config.apiUrl}${url}`;
    
    await client.getSession();
    
    const headers = new Headers(options?.headers);
    headers.set('Content-Type', 'application/json');
    
    return fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include',
    });
  }
}