import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FRONTEND_CONFIG } from '../config/frontend-config';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  private readonly config = inject(FRONTEND_CONFIG);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  
  menuOpen = false;
  readonly appName = this.config.appName;
  isLoggedIn = false;
  isAdmin = false;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.isAdmin = user?.role === 'admin';
    });
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.closeMenu();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}
