import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  async onSubmit() {
    this.error = '';
    this.loading = true;

    try {
      const authClient = this.authService.getClient();
      const result = await authClient.signIn.email({
        email: this.email,
        password: this.password,
      });

      if (result.error) {
        this.error = result.error.message || 'Login failed';
        return;
      }

      // Redirect to dashboard after successful login
      this.router.navigate(['/dashboard']);
    } catch (err) {
      this.error = 'An unexpected error occurred';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }
}
