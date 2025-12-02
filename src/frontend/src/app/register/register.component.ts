import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { authClient } from '../services/auth-client';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  consent = false;
  error = '';
  loading = false;

  constructor(private router: Router) {}

  async onSubmit() {
    if (!this.consent) {
      this.error = 'You must agree to the data policy and terms of use';
      return;
    }

    this.error = '';
    this.loading = true;

    try {
      const result = await authClient.signUp.email({
        email: this.email,
        password: this.password,
        name: this.name,
      });

      if (result.error) {
        this.error = result.error.message || 'Registration failed';
        return;
      }

      // Redirect to dashboard after successful registration
      this.router.navigate(['/dashboard']);
    } catch (err) {
      this.error = 'An unexpected error occurred';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }
}
