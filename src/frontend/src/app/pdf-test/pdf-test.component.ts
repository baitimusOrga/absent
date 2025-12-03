import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-pdf-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-test.component.html',
  styleUrls: ['./pdf-test.component.css']
})
export class PdfTestComponent {
  private authService = inject(AuthService);
  
  isLoading = false;
  response: any = null;
  error: string | null = null;

  async testPdfEndpoint() {
    this.isLoading = true;
    this.error = null;
    this.response = null;

    try {
      const response = await this.authService.authenticatedFetch('/pdf');
      
      if (!response.ok) {
        const errorData = await response.json();
        this.error = errorData.message || `Error: ${response.status}`;
      } else {
        this.response = await response.json();
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error occurred';
    } finally {
      this.isLoading = false;
    }
  }
}
