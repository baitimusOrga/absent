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

interface PdfRequestData {
    date: string;
    type: 'krankheit' | 'ferien';
    reason: string;
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
  
  // Wizard State
  currentStep = 1;
  pdfData: PdfRequestData = {
      date: '',
      type: 'krankheit',
      reason: ''
  };
  
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
    private cdr: ChangeDetectorRef
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
      
      this.authService.refreshSession().catch(err => console.error('Session refresh error:', err));
      
      setTimeout(() => {
          this.isEditing = false;
          this.saveMessage = '';
          this.cdr.detectChanges();
      }, 1000);
      
    } catch (error) {
      this.saveMessage = 'Fehler beim Speichern des Profils';
      console.error('Save error:', error);
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }



  // --- PDF Workflow Logic ---

  openPdfWorkflow(): void {
    this.showPdfWorkflow = true;
    this.currentStep = 1;
    this.saveMessage = '';
    // Reset form defaults
    this.pdfData = {
        date: new Date().toISOString().split('T')[0], // Default to today
        type: 'krankheit',
        reason: ''
    };
  }

  closePdfWorkflow(): void {
    this.showPdfWorkflow = false;
  }

  nextStep(): void {
      if (this.currentStep < 2) {
          this.currentStep++;
      }
  }

  prevStep(): void {
      if (this.currentStep > 1) {
          this.currentStep--;
      }
  }

  async generatePdf(): Promise<void> {
      this.isSaving = true;
      this.saveMessage = '';

      try {
        // Map internal types to backend expected values
        const formType = this.pdfData.type === 'krankheit' ? 'Entschuldigung' : 'Urlaubsgesuch';

        // Construct the payload matching pdf-test.component.ts structure
        const payload = {
            datumDerAbsenz: this.pdfData.date,
            begruendung: this.pdfData.reason, // Backend expects 'begruendung'
            formType: formType,
            school: this.user?.school,
            missedLessons: [], // Empty initially, handled by backend calendar fetch
            useShortNames: false
        };

        // Use authenticatedFetch to ensure session cookies/headers are sent
        const response = await this.authService.authenticatedFetch('/pdf/fill', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || errorData.message || 'PDF Generation failed');
        }

        // Create a blob from the response
        const blob = await response.blob();
        
        // Create a temporary link to download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Try to get filename from headers, fallback to default
        a.download = `${formType}_${this.pdfData.date}.pdf`; 
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        this.closePdfWorkflow();

      } catch (error) {
          console.error('PDF Generation Error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
          this.saveMessage = `Fehler: ${errorMessage}`;
      } finally {
          this.isSaving = false;
          this.cdr.detectChanges();
      }
  }
}