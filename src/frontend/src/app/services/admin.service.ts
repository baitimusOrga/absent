import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  emailVerified: boolean;
  createdAt: string;
  banned?: boolean;
  banReason?: string;
  banExpiresAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private authService: AuthService) {}

  private getClient() {
    return this.authService.getClient();
  }

  async listUsers(): Promise<AdminUser[]> {
    try {
      const client = this.getClient();
      const response = await client.admin.listUsers();
      console.log('Admin listUsers response:', response);
      
      // Better Auth returns { data: { users: [], total: number }, error: null }
      if (response.data?.users && Array.isArray(response.data.users)) {
        return response.data.users;
      }
      
      console.warn('Unexpected response structure:', response);
      return [];
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  }

  async setUserRole(userId: string, role: string): Promise<void> {
    try {
      const client = this.getClient();
      await client.admin.setRole({ userId, role });
    } catch (error) {
      console.error('Error setting user role:', error);
      throw error;
    }
  }

  async banUser(userId: string, reason?: string, expiresInDays?: number): Promise<void> {
    try {
      const client = this.getClient();
      const banExpiresAt = expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : undefined;
      
      await client.admin.banUser({ userId, banReason: reason, banExpiresAt });
    } catch (error) {
      console.error('Error banning user:', error);
      throw error;
    }
  }

  async unbanUser(userId: string): Promise<void> {
    try {
      const client = this.getClient();
      await client.admin.unbanUser({ userId });
    } catch (error) {
      console.error('Error unbanning user:', error);
      throw error;
    }
  }

  async removeUser(userId: string): Promise<void> {
    try {
      const client = this.getClient();
      await client.admin.removeUser({ userId });
    } catch (error) {
      console.error('Error removing user:', error);
      throw error;
    }
  }
}
