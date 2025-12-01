import { AsyncPipe, JsonPipe, NgIf } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { catchError, map, startWith } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { environment } from '../environments/environment';

type HealthStatus = {
  status: string;
  uptime: number;
  timestamp: string;
  environment: string;
};

type HealthQuery =
  | { state: 'loading' }
  | { state: 'error' }
  | { state: 'ready'; payload: HealthStatus };

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HttpClientModule, AsyncPipe, JsonPipe, NgIf],
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
      map((payload) => ({
        state: 'ready' as const,
        payload: {
          ...payload,
          timestamp: new Date(payload.timestamp).toLocaleString(),
        },
      })),
      startWith({ state: 'loading' } as HealthQuery),
      catchError(() => of({ state: 'error' } as HealthQuery))
    );
}
