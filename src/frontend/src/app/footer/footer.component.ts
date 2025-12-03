import { Component, inject } from '@angular/core';
import { FRONTEND_CONFIG } from '../config/frontend-config';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
	private readonly config = inject(FRONTEND_CONFIG);
	readonly currentYear = new Date().getFullYear();
	readonly appName = this.config.appName;
}
