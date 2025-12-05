import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
  banned?: boolean;
  banReason?: string;
  banExpiresAt?: string;
  image?: string;
  sessions?: UserSession[];
  accounts?: UserAccount[];
  schulnetzCalendarUrl?: string;
  school?: string;
  berufsbildner?: string;
  berufsbildnerEmail?: string;
  berufsbildnerPhoneNumber?: string;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: string;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  unverifiedUsers: number;
  usersToday: number;
  usersThisWeek: number;
  usersThisMonth: number;
  usersByRole: { role: string; count: number }[];
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
      
      if (response.data?.users && Array.isArray(response.data.users)) {
        return response.data.users;
      }
      return [];
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async setUserRole(userId: string, role: string): Promise<void> {
    const client = this.getClient();
    await client.admin.setRole({ userId, role });
  }

  async banUser(userId: string, reason?: string, expiresInDays?: number): Promise<void> {
    const client = this.getClient();
    const banExpiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined;
    
    await client.admin.banUser({ userId, banReason: reason, banExpiresAt });
  }

  async unbanUser(userId: string): Promise<void> {
    const client = this.getClient();
    await client.admin.unbanUser({ userId });
  }

  async removeUser(userId: string): Promise<void> {
    const client = this.getClient();
    await client.admin.removeUser({ userId });
  }

  async createUser(email: string, password: string, name: string, role: string = 'user'): Promise<AdminUser> {
    const client = this.getClient();
    const response = await client.admin.createUser({
      email,
      password,
      name,
      role,
      emailVerified: false
    });
    return response.data;
  }

  async getUserDetails(userId: string): Promise<AdminUser> {
    const client = this.getClient();
    const response = await client.admin.listUsers();
    const user = response.data?.users?.find((u: AdminUser) => u.id === userId);
    if (!user) throw new Error('User not found');
    return user;
  }

  async listUserSessions(userId: string): Promise<UserSession[]> {
    try {
      const client = this.getClient();
      const response = await client.admin.listSessions({ userId });
      return response.data?.sessions || [];
    } catch {
      return [];
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    const client = this.getClient();
    await client.admin.revokeSession({ sessionId });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const client = this.getClient();
    await client.admin.revokeUserSessions({ userId });
  }

  async getStatistics(): Promise<UserStatistics> {
    const users = await this.listUsers();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => !u.banned).length,
      bannedUsers: users.filter(u => u.banned).length,
      unverifiedUsers: users.filter(u => !u.emailVerified).length,
      usersToday: users.filter(u => new Date(u.createdAt) >= today).length,
      usersThisWeek: users.filter(u => new Date(u.createdAt) >= weekAgo).length,
      usersThisMonth: users.filter(u => new Date(u.createdAt) >= monthAgo).length,
      usersByRole: this.groupByRole(users)
    };
  }

  private groupByRole(users: AdminUser[]): { role: string; count: number }[] {
    const roleMap = new Map<string, number>();
    users.forEach(u => {
      const role = u.role || 'user';
      roleMap.set(role, (roleMap.get(role) || 0) + 1);
    });
    return Array.from(roleMap.entries()).map(([role, count]) => ({ role, count }));
  }

  async bulkBanUsers(userIds: string[], reason?: string, expiresInDays?: number): Promise<void> {
    await Promise.all(userIds.map(id => this.banUser(id, reason, expiresInDays)));
  }

  async bulkUnbanUsers(userIds: string[]): Promise<void> {
    await Promise.all(userIds.map(id => this.unbanUser(id)));
  }

  async bulkSetRole(userIds: string[], role: string): Promise<void> {
    await Promise.all(userIds.map(id => this.setUserRole(id, role)));
  }

  async bulkDeleteUsers(userIds: string[]): Promise<void> {
    await Promise.all(userIds.map(id => this.removeUser(id)));
  }

  exportToCSV(users: AdminUser[]): string {
    const headers = ['Email', 'Name', 'Role', 'Verified', 'Banned', 'Created At'];
    const rows = users.map(u => [
      u.email,
      u.name,
      u.role || 'user',
      u.emailVerified ? 'Yes' : 'No',
      u.banned ? 'Yes' : 'No',
      new Date(u.createdAt).toLocaleString()
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  exportToJSON(users: AdminUser[]): string {
    return JSON.stringify(users, null, 2);
  }

  downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}