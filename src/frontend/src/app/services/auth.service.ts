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

  constructor() {
    // Delay auth client initialization until it's needed
  }

  private ensureAuthClient() {
    if (!this.authClient) {
      this.authClient = initAuthClient(this.config.apiUrl);
    }
    return this.authClient;
  }

  async checkSession(): Promise<void> {
    // Return existing promise if already checking
    if (this.sessionCheckPromise) {
      return this.sessionCheckPromise;
    }

    // Create new promise for session check with timeout
    this.sessionCheckPromise = (async () => {
      try {
        const client = this.ensureAuthClient();
        
        // Add timeout to prevent hanging
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
        console.error('Error checking session:', error);
        this.currentUserSubject.next(null);
        this.isInitialized = true;
      } finally {
        this.sessionCheckPromise = null;
      }
    })();

    return this.sessionCheckPromise;
  }

  async isAuthenticated(): Promise<boolean> {
    // If not initialized yet, check session first
    if (!this.isInitialized) {
      await this.checkSession();
    }
    
    // Return cached value
    return this.currentUserSubject.value !== null;
  }

  // Check authentication synchronously from cache only
  isAuthenticatedSync(): boolean {
    return this.currentUserSubject.value !== null;
  }

  async logout(): Promise<void> {
    try {
      const client = this.ensureAuthClient();
      await client.signOut();
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
    return this.ensureAuthClient();
  }

  // Force refresh session from server
  async refreshSession(): Promise<void> {
    this.isInitialized = false;
    await this.checkSession();
  }

  // Get auth headers for authenticated requests
  getAuthHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  // Make authenticated request to backend
  async authenticatedFetch(url: string, options?: RequestInit): Promise<Response> {
    const client = this.ensureAuthClient();
    const fullUrl = url.startsWith('http') ? url : `${this.config.apiUrl}${url}`;
    
    // Get session token from better-auth
    const session = await client.getSession();
    
    const headers = new Headers(options?.headers);
    headers.set('Content-Type', 'application/json');
    
    // Better-auth automatically includes session cookie
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include', // Important for cookie-based auth
    });
    
    return response;
  }
}
