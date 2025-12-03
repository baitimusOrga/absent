import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser, UserStatistics, UserSession } from '../services/admin.service';

type ModalType = 'ban' | 'role' | 'details' | 'create' | 'bulkBan' | 'bulkRole' | null;

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  // User data
  allUsers: AdminUser[] = [];
  filteredUsers: AdminUser[] = [];
  displayedUsers: AdminUser[] = [];
  
  // Statistics
  statistics: UserStatistics | null = null;
  
  // UI state
  loading = false;
  error = '';
  
  // Search and filters
  searchTerm = '';
  filterRole = '';
  filterStatus = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  pageSizes = [10, 25, 50, 100];
  totalPages = 1;
  
  // Sorting
  sortColumn: keyof AdminUser | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Bulk selection
  selectedUserIds = new Set<string>();
  selectAll = false;
  
  // Modals
  showModal = false;
  modalType: ModalType = null;
  selectedUser: AdminUser | null = null;
  userSessions: UserSession[] = [];
  
  // Form data
  banReason = '';
  banDays = 7;
  newRole = 'user';
  bulkRole = 'user';
  bulkBanReason = '';
  bulkBanDays = 7;
  
  // Create user form
  newUserEmail = '';
  newUserPassword = '';
  newUserName = '';
  newUserRole = 'user';

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    this.error = '';
    try {
      await Promise.all([
        this.loadUsers(),
        this.loadStatistics()
      ]);
    } catch (err) {
      this.error = 'Failed to load data';
      console.error(err);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async loadUsers() {
    this.allUsers = await this.adminService.listUsers();
    this.applyFilters();
  }

  async loadStatistics() {
    this.statistics = await this.adminService.getStatistics();
  }

  applyFilters() {
    let filtered = [...this.allUsers];
    
    // Search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.email.toLowerCase().includes(term) || 
        u.name.toLowerCase().includes(term)
      );
    }
    
    // Filter by role
    if (this.filterRole) {
      filtered = filtered.filter(u => (u.role || 'user') === this.filterRole);
    }
    
    // Filter by status
    if (this.filterStatus === 'active') {
      filtered = filtered.filter(u => !u.banned);
    } else if (this.filterStatus === 'banned') {
      filtered = filtered.filter(u => u.banned);
    } else if (this.filterStatus === 'verified') {
      filtered = filtered.filter(u => u.emailVerified);
    } else if (this.filterStatus === 'unverified') {
      filtered = filtered.filter(u => !u.emailVerified);
    }
    
    this.filteredUsers = filtered;
    this.applySorting();
  }

  applySorting() {
    if (!this.sortColumn) {
      this.applyPagination();
      return;
    }
    
    const sorted = [...this.filteredUsers].sort((a, b) => {
      const aVal = a[this.sortColumn as keyof AdminUser];
      const bVal = b[this.sortColumn as keyof AdminUser];
      
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      
      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        comparison = aVal === bVal ? 0 : aVal ? 1 : -1;
      } else {
        comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
    
    this.filteredUsers = sorted;
    this.applyPagination();
  }

  applyPagination() {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.displayedUsers = this.filteredUsers.slice(start, end);
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.applyPagination();
  }

  sortBy(column: keyof AdminUser) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyPagination();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyPagination();
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.applyPagination();
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Bulk selection
  toggleSelectAll() {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.displayedUsers.forEach(u => this.selectedUserIds.add(u.id));
    } else {
      this.selectedUserIds.clear();
    }
  }

  toggleUserSelection(userId: string) {
    if (this.selectedUserIds.has(userId)) {
      this.selectedUserIds.delete(userId);
    } else {
      this.selectedUserIds.add(userId);
    }
    this.selectAll = this.displayedUsers.length > 0 && 
      this.displayedUsers.every(u => this.selectedUserIds.has(u.id));
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUserIds.has(userId);
  }

  get selectedCount(): number {
    return this.selectedUserIds.size;
  }

  clearSelection() {
    this.selectedUserIds.clear();
    this.selectAll = false;
  }

  // Modals
  openModal(type: ModalType, user?: AdminUser) {
    this.selectedUser = user || null;
    this.modalType = type;
    this.showModal = true;
    
    if (type === 'role' && user) {
      this.newRole = user.role || 'user';
    } else if (type === 'ban') {
      this.banReason = '';
      this.banDays = 7;
    } else if (type === 'create') {
      this.newUserEmail = '';
      this.newUserPassword = '';
      this.newUserName = '';
      this.newUserRole = 'user';
    } else if (type === 'bulkBan') {
      this.bulkBanReason = '';
      this.bulkBanDays = 7;
    } else if (type === 'bulkRole') {
      this.bulkRole = 'user';
    } else if (type === 'details' && user) {
      this.loadUserDetails(user.id);
    }
  }

  closeModal() {
    this.showModal = false;
    this.selectedUser = null;
    this.modalType = null;
    this.userSessions = [];
  }

  async loadUserDetails(userId: string) {
    try {
      this.userSessions = await this.adminService.listUserSessions(userId);
    } catch (err) {
      console.error('Failed to load user sessions:', err);
    }
  }

  // User actions
  async banUser() {
    if (!this.selectedUser) return;
    this.loading = true;
    try {
      await this.adminService.banUser(this.selectedUser.id, this.banReason, this.banDays);
      this.closeModal();
      await this.loadData();
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
      await this.loadData();
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
      await this.loadData();
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
      await this.loadData();
    } catch (err) {
      this.error = 'Failed to delete user';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async createUser() {
    if (!this.newUserEmail || !this.newUserPassword || !this.newUserName) {
      this.error = 'All fields are required';
      return;
    }
    
    this.loading = true;
    try {
      await this.adminService.createUser(
        this.newUserEmail,
        this.newUserPassword,
        this.newUserName,
        this.newUserRole
      );
      this.closeModal();
      await this.loadData();
    } catch (err) {
      this.error = 'Failed to create user';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async revokeSession(sessionId: string) {
    this.loading = true;
    try {
      await this.adminService.revokeSession(sessionId);
      if (this.selectedUser) {
        await this.loadUserDetails(this.selectedUser.id);
      }
    } catch (err) {
      this.error = 'Failed to revoke session';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async revokeAllSessions(userId: string) {
    if (!confirm('Revoke all sessions for this user?')) return;
    this.loading = true;
    try {
      await this.adminService.revokeAllUserSessions(userId);
      await this.loadUserDetails(userId);
    } catch (err) {
      this.error = 'Failed to revoke sessions';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  // Bulk actions
  async bulkBan() {
    if (this.selectedCount === 0) return;
    this.loading = true;
    try {
      await this.adminService.bulkBanUsers(
        Array.from(this.selectedUserIds),
        this.bulkBanReason,
        this.bulkBanDays
      );
      this.closeModal();
      this.clearSelection();
      await this.loadData();
    } catch (err) {
      this.error = 'Failed to ban users';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async bulkUnban() {
    if (this.selectedCount === 0) return;
    if (!confirm(`Unban ${this.selectedCount} users?`)) return;
    this.loading = true;
    try {
      await this.adminService.bulkUnbanUsers(Array.from(this.selectedUserIds));
      this.clearSelection();
      await this.loadData();
    } catch (err) {
      this.error = 'Failed to unban users';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async bulkChangeRole() {
    if (this.selectedCount === 0) return;
    this.loading = true;
    try {
      await this.adminService.bulkSetRole(Array.from(this.selectedUserIds), this.bulkRole);
      this.closeModal();
      this.clearSelection();
      await this.loadData();
    } catch (err) {
      this.error = 'Failed to change roles';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async bulkDelete() {
    if (this.selectedCount === 0) return;
    if (!confirm(`Delete ${this.selectedCount} users? This cannot be undone.`)) return;
    this.loading = true;
    try {
      await this.adminService.bulkDeleteUsers(Array.from(this.selectedUserIds));
      this.clearSelection();
      await this.loadData();
    } catch (err) {
      this.error = 'Failed to delete users';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  // Export
  exportCSV() {
    const csv = this.adminService.exportToCSV(this.filteredUsers);
    const filename = `users_${new Date().toISOString().split('T')[0]}.csv`;
    this.adminService.downloadFile(csv, filename, 'text/csv');
  }

  exportJSON() {
    const json = this.adminService.exportToJSON(this.filteredUsers);
    const filename = `users_${new Date().toISOString().split('T')[0]}.json`;
    this.adminService.downloadFile(json, filename, 'application/json');
  }
}
