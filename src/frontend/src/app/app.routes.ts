import { Routes } from '@angular/router';
import { HealthComponent } from './health/health.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard, loginGuard } from './guards/auth.guard';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', component: HomeComponent },
	{ path: 'health', component: HealthComponent },
	{ path: 'login', component: LoginComponent, canActivate: [loginGuard] },
	{ path: 'register', component: RegisterComponent, canActivate: [loginGuard] },
	{ path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
	{ path: '**', redirectTo: '' }
];
