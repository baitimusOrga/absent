import { Routes } from '@angular/router';
import { HealthComponent } from './health/health.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', component: HomeComponent },
	{ path: 'health', component: HealthComponent },
	{ path: '**', redirectTo: '' }
];
