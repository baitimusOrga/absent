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
  styleUrl: './dashboard.component.css' //
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  isEditing = false;
  isSaving = false;
  saveMessage = '';
  showPdfWorkflow = false;
  
  // Wizard State
  // Step 0 = Missing Info, Step 1 = Date, Step 2 = Details
  currentStep = 1; 
  
  pdfData: PdfRequestData = {
      date: '',
      type: 'krankheit',
      reason: ''
  };
  showCalendarHelp = false;
  toggleCalendarHelp(): void {
    this.showCalendarHelp = !this.showCalendarHelp;
  }
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
      // We don't load form data automatically here to avoid overwriting 
      // if the user is typing in the modal, but we ensure defaults are available.
      if (user && !this.isEditing && !this.showPdfWorkflow) {
        this.resetEditForm();
      }
    });
  }

  // Helper to sync form with current user data
  resetEditForm(): void {
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

  // --- Profile Editing (Right Column) ---

  startEditing(): void {
    this.isEditing = true;
    this.saveMessage = '';
    this.resetEditForm();
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.saveMessage = '';
    this.resetEditForm();
  }

  async saveProfile(): Promise<void> {
    await this.performProfileUpdate();
    this.isEditing = false;
  }

  // Refactored update logic to be reusable
  async performProfileUpdate(): Promise<void> {
    this.isSaving = true;
    this.saveMessage = '';
    
    try {
      const client = this.authService.getClient();
      await client.updateUser(this.editForm);
      
      this.saveMessage = 'Profil erfolgreich gespeichert!';
      
      await this.authService.refreshSession();
      
      // Update local user object immediately for UI reactivity
      this.user = { ...this.user!, ...this.editForm };
      
      setTimeout(() => {
          this.saveMessage = '';
          this.cdr.detectChanges();
      }, 1500);
      
    } catch (error) {
      this.saveMessage = 'Fehler beim Speichern';
      console.error('Save error:', error);
      throw error; // Re-throw so caller knows it failed
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  // --- PDF Workflow Logic ---

  // Check if critical fields are missing
  get missingRequiredFields(): boolean {
      if (!this.user) return true;
      // Define which fields are mandatory for PDF generation
      return !this.user.fullname || !this.user.school || !this.user.schulnetzCalendarUrl;
  }

  openPdfWorkflow(): void {
    this.showPdfWorkflow = true;
    this.saveMessage = '';
    
    // Check requirements
    if (this.missingRequiredFields) {
        this.currentStep = 0; // Go to "Setup" step
        this.resetEditForm(); // Pre-fill form with what we have
    } else {
        this.currentStep = 1; // Go to "Date" step
    }

    // Reset PDF specific data
    this.pdfData = {
        date: new Date().toISOString().split('T')[0],
        type: 'krankheit',
        reason: ''
    };
  }

  closePdfWorkflow(): void {
    this.showPdfWorkflow = false;
  }

  // Special handler for Step 0 (Saving missing info)
  async saveMissingInfoAndContinue(): Promise<void> {
      try {
          await this.performProfileUpdate();
          // If successful, move to step 1
          this.currentStep = 1;
          this.saveMessage = ''; // Clear success message from update
      } catch (e) {
          // Error is handled in performProfileUpdate (sets saveMessage)
      }
  }

  nextStep(): void {
      if (this.currentStep < 2) {
          this.currentStep++;
      }
  }

  prevStep(): void {
      if (this.currentStep > 1) {
          this.currentStep--;
      } else if (this.currentStep === 1 && this.missingRequiredFields) {
          // If they came from Step 0, going back from Step 1 should take them to Step 0?
          // Or we treat Step 0 as a blocker they passed. 
          // Let's treat Step 1 as the first logical step once data is set.
          this.closePdfWorkflow(); 
      }
  }

  async generatePdf(): Promise<void> {
      this.isSaving = true;
      this.saveMessage = '';

      try {
        const formType = this.pdfData.type === 'krankheit' ? 'Entschuldigung' : 'Urlaubsgesuch';

        const payload = {
            datumDerAbsenz: this.pdfData.date,
            begruendung: this.pdfData.reason,
            formType: formType,
            school: this.user?.school,
            missedLessons: [],
            useShortNames: false
        };

        const response = await this.authService.authenticatedFetch('/pdf/fill', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();  
            throw new Error(errorData.error || errorData.message || 'PDF Generation failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formType}_${this.pdfData.date}.pdf`; 
        document.body.appendChild(a);
        a.click();
        
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