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

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetUserId?: string;
  targetUserEmail?: string;
  details?: any;
  createdAt: string;
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

  async createUser(email: string, password: string, name: string, role: string = 'user'): Promise<AdminUser> {
    try {
      const client = this.getClient();
      const response = await client.admin.createUser({
        email,
        password,
        name,
        role,
        emailVerified: false
      });
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserDetails(userId: string): Promise<AdminUser> {
    try {
      const client = this.getClient();
      // Better Auth may not have a dedicated endpoint, so we'll get from list
      const response = await client.admin.listUsers();
      const user = response.data?.users?.find((u: AdminUser) => u.id === userId);
      if (!user) throw new Error('User not found');
      return user;
    } catch (error) {
      console.error('Error getting user details:', error);
      throw error;
    }
  }

  async listUserSessions(userId: string): Promise<UserSession[]> {
    try {
      const client = this.getClient();
      const response = await client.admin.listSessions({ userId });
      return response.data?.sessions || [];
    } catch (error) {
      console.error('Error listing user sessions:', error);
      return [];
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    try {
      const client = this.getClient();
      await client.admin.revokeSession({ sessionId });
    } catch (error) {
      console.error('Error revoking session:', error);
      throw error;
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      const client = this.getClient();
      await client.admin.revokeUserSessions({ userId });
    } catch (error) {
      console.error('Error revoking user sessions:', error);
      throw error;
    }
  }

  async getStatistics(): Promise<UserStatistics> {
    try {
      const users = await this.listUsers();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const stats: UserStatistics = {
        totalUsers: users.length,
        activeUsers: users.filter(u => !u.banned).length,
        bannedUsers: users.filter(u => u.banned).length,
        unverifiedUsers: users.filter(u => !u.emailVerified).length,
        usersToday: users.filter(u => new Date(u.createdAt) >= today).length,
        usersThisWeek: users.filter(u => new Date(u.createdAt) >= weekAgo).length,
        usersThisMonth: users.filter(u => new Date(u.createdAt) >= monthAgo).length,
        usersByRole: this.groupByRole(users)
      };

      return stats;
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }

  private groupByRole(users: AdminUser[]): { role: string; count: number }[] {
    const roleMap = new Map<string, number>();
    users.forEach(u => {
      const role = u.role || 'user';
      roleMap.set(role, (roleMap.get(role) || 0) + 1);
    });
    return Array.from(roleMap.entries()).map(([role, count]) => ({ role, count }));
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    try {
      // Note: Better Auth may not have audit logs built-in
      // This would need custom implementation on the backend
      // For now, return empty array
      console.warn('Audit logs not implemented in Better Auth');
      return [];
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }

  // Bulk actions
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

  // Export functions
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

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
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
