import { AsyncPipe, DecimalPipe, NgIf, UpperCasePipe } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { catchError, map, startWith } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { environment } from '../environments/environment';

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
  selector: 'app-root',
  imports: [HttpClientModule, AsyncPipe, NgIf, UpperCasePipe, DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
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
          timestamp: new Date(payload.timestamp).toLocaleString(),
        },
      })),
      startWith<HealthQuery>({ state: 'loading' }),
      catchError(() => of<HealthQuery>({ state: 'error' }))
    );
}
