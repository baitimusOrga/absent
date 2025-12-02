import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser } from '../services/admin.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  users: AdminUser[] = [];
  loading = false;
  error = '';
  selectedUser: AdminUser | null = null;
  showModal = false;
  modalType: 'ban' | 'role' | null = null;
  banReason = '';
  banDays = 7;
  newRole = 'user';

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    this.loading = true;
    this.error = '';
    try {
      this.users = await this.adminService.listUsers();
      console.log('Users loaded:', this.users);
    } catch (err) {
      this.error = 'Failed to load users';
      console.error(err);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  openModal(type: 'ban' | 'role', user: AdminUser) {
    this.selectedUser = user;
    this.modalType = type;
    this.showModal = true;
    if (type === 'role') {
      this.newRole = user.role || 'user';
    } else {
      this.banReason = '';
      this.banDays = 7;
    }
  }

  closeModal() {
    this.showModal = false;
    this.selectedUser = null;
    this.modalType = null;
  }

  async banUser() {
    if (!this.selectedUser) return;
    this.loading = true;
    try {
      await this.adminService.banUser(this.selectedUser.id, this.banReason, this.banDays);
      this.closeModal();
      await this.loadUsers();
    } catch (err) {
      this.error = 'Failed to ban user';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async unbanUser(userId: string) {
    this.loading = true;
    try {
      await this.adminService.unbanUser(userId);
      await this.loadUsers();
    } catch (err) {
      this.error = 'Failed to unban user';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async changeRole() {
    if (!this.selectedUser) return;
    this.loading = true;
    try {
      await this.adminService.setUserRole(this.selectedUser.id, this.newRole);
      this.closeModal();
      await this.loadUsers();
    } catch (err) {
      this.error = 'Failed to change role';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async deleteUser(userId: string) {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    this.loading = true;
    try {
      await this.adminService.removeUser(userId);
      await this.loadUsers();
    } catch (err) {
      this.error = 'Failed to delete user';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }
}
