import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

interface MissedLesson {
  anzahlLektionen: string;
  wochentagUndDatum: string;
  fach: string;
  lehrperson: string;
}

@Component({
  selector: 'app-pdf-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pdf-test.component.html',
  styleUrls: ['./pdf-test.component.css']
})
export class PdfTestComponent {
  private authService = inject(AuthService);
  
  isLoading = false;
  statusResponse: any = null;
  error: string | null = null;
  
  // Form data
  formData = {
    datumDerAbsenz: this.getTodayDate(),
    begruendung: '',
    formType: 'Entschuldigung' as 'Entschuldigung' | 'Urlaubsgesuch',
    missedLessons: [] as MissedLesson[],
    useShortNames: false
  };

  async testStatus() {
    this.isLoading = true;
    this.error = null;
    this.statusResponse = null;

    try {
      const response = await this.authService.authenticatedFetch('/pdf/status');
      
      if (!response.ok) {
        const errorData = await response.json();
        this.error = errorData.message || `Error: ${response.status}`;
      } else {
        this.statusResponse = await response.json();
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error occurred';
    } finally {
      this.isLoading = false;
    }
  }
  
  async generatePdf() {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await this.authService.authenticatedFetch('/pdf/fill', {
        method: 'POST',
        body: JSON.stringify(this.formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        this.error = errorData.error || `Error: ${response.status}`;
      } else {
        // Download the PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.formData.formType}_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.statusResponse = { success: true, message: 'PDF generated successfully!' };
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error occurred';
    } finally {
      this.isLoading = false;
    }
  }
  
  addLesson() {
    this.formData.missedLessons.push({
      anzahlLektionen: '',
      wochentagUndDatum: '',
      fach: '',
      lehrperson: ''
    });
  }
  
  removeLesson(index: number) {
    this.formData.missedLessons.splice(index, 1);
  }
  
  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}
