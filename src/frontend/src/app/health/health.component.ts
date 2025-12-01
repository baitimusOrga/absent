import { AsyncPipe, DecimalPipe, NgIf, UpperCasePipe } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { environment } from '../../environments/environment';

type HealthStatus = {
  status: string;
  uptime: number;
  timestamp: string;
  environment: string;
};

type HealthQueryState = 'loading' | 'error' | 'ready';

type HealthQuery = {
  state: HealthQueryState;
  payload?: HealthStatus;
};

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [HttpClientModule, AsyncPipe, NgIf, UpperCasePipe, DecimalPipe],
  templateUrl: './health.component.html',
  styleUrl: './health.component.css'
})
export class HealthComponent {
  private readonly http = inject(HttpClient);

  protected readonly appName = environment.appName;
  protected readonly apiUrl = environment.apiUrl;

  protected readonly health$: Observable<HealthQuery> = this.http
    .get<HealthStatus>(`${this.apiUrl}/health`)
    .pipe(
      map<HealthStatus, HealthQuery>((payload) => ({
        state: 'ready' as const,
        payload: {
          ...payload,
          timestamp: new Date(payload.timestamp).toLocaleString()
        }
      })),
      startWith<HealthQuery>({ state: 'loading' }),
      catchError(() => of<HealthQuery>({ state: 'error' }))
    );
}
