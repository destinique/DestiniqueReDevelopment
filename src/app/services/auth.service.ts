// services/auth.service.ts (basic version)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface User {
  id: number;
  email: string;
  name: string;
  role: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'YOUR_API_ENDPOINT';
  private authSubject = new BehaviorSubject<User | null>(null);
  authState$ = this.authSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response: any) => {
          if (response.user && response.token) {
            this.authSubject.next(response.user);
            localStorage.setItem('auth_token', response.token);
          }
        })
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {})
      .pipe(
        tap(() => {
          this.authSubject.next(null);
          localStorage.removeItem('auth_token');
        })
      );
  }

  validateToken(token: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/validate`, { token });
  }
}
