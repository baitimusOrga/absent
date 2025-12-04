import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';

interface EditFormState {
    schulnetzCalendarUrl: string;
    fullname: string;
    school: string;
    berufsbildner: string;
    berufsbildnerEmail: string;
    berufsbildnerPhoneNumber: string;
    dateOfBirth: string;
    [key: string]: string;
}

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
  showPdfWorkflow = false;
  
  editForm: EditFormState = {
    schulnetzCalendarUrl: '',
    fullname: '',
    school: '',
    berufsbildner: '',
    berufsbildnerEmail: '',
    berufsbildnerPhoneNumber: '',
    dateOfBirth: ''
  };

  schools = ['BBZW', 'BBZG'];

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef // Injected to force UI updates
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
      let dateOfBirth = '';
      if (this.user.dateOfBirth) {
        const date = new Date(this.user.dateOfBirth);
        dateOfBirth = date.toISOString().split('T')[0];
      }
      
      this.editForm = {
        schulnetzCalendarUrl: this.user.schulnetzCalendarUrl || '',
        fullname: this.user.fullname || '',
        school: this.user.school || '',
        berufsbildner: this.user.berufsbildner || '',
        berufsbildnerEmail: this.user.berufsbildnerEmail || '',
        berufsbildnerPhoneNumber: this.user.berufsbildnerPhoneNumber || '',
        dateOfBirth: dateOfBirth
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
      
      this.saveMessage = 'Profil erfolgreich gespeichert!';
      
      // Refresh session quietly
      this.authService.refreshSession().catch(err => console.error('Session refresh error:', err));
      
      // Close form after delay
      setTimeout(() => {
          this.isEditing = false;
          this.saveMessage = '';
          this.cdr.detectChanges(); // Update view when closing form
      }, 1000);
      
    } catch (error) {
      this.saveMessage = 'Fehler beim Speichern des Profils';
      console.error('Save error:', error);
    } finally {
      // FORCE reset of saving state and FORCE UI update
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  openPdfWorkflow(): void {
    this.showPdfWorkflow = true;
  }

  closePdfWorkflow(): void {
    this.showPdfWorkflow = false;
  }
}