import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  isEditing = false;
  isSaving = false;
  saveMessage = '';
  
  // Edit form fields
  editForm = {
    schulnetzCalendarUrl: '',
    school: '',
    berufsbildner: '',
    berufsbildnerEmail: '',
    berufsbildnerPhoneNumber: ''
  };

  schools = ['BBZW', 'BBZG'];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.loadFormData();
      }
    });
  }

  loadFormData(): void {
    if (this.user) {
      this.editForm = {
        schulnetzCalendarUrl: this.user.schulnetzCalendarUrl || '',
        school: this.user.school || '',
        berufsbildner: this.user.berufsbildner || '',
        berufsbildnerEmail: this.user.berufsbildnerEmail || '',
        berufsbildnerPhoneNumber: this.user.berufsbildnerPhoneNumber || ''
      };
    }
  }

  startEditing(): void {
    this.isEditing = true;
    this.saveMessage = '';
    this.loadFormData();
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.saveMessage = '';
    this.loadFormData();
  }

  async saveProfile(): Promise<void> {
    this.isSaving = true;
    this.saveMessage = '';
    
    try {
      const client = this.authService.getClient();
      await client.updateUser(this.editForm);
      
      this.saveMessage = 'Profile saved successfully!';
      this.isEditing = false;
      
      // Refresh session to get updated user data
      this.authService.refreshSession().catch(err => console.error('Session refresh error:', err));
      
    } catch (error) {
      this.saveMessage = 'Failed to save profile';
      console.error('Save error:', error);
    }
    
    // Always reset saving state
    this.isSaving = false;
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}
