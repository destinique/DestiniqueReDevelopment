// services/auth.service.ts (basic version)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface User {
  id: number;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  token: string;
  email: string;
  name: string;
  role: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'https://api.destinique.com/api-user/';
  private authSubject = new BehaviorSubject<User | null>(null);
  authState$ = this.authSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http
      .post<any>(this.apiUrl + "login.php", { username, password })
      .pipe(
        tap((response: any) => {
          if (response.user && response.token) {
            this.authSubject.next(response.user);
            localStorage.setItem('auth_token', response.token);
          }
        })
      );

      /*
      map((user) => {
        if (user.status != "inactive") {
          // store user details and jwt token in local storage to keep user logged in between page refreshes
          localStorage.setItem("currentUser", JSON.stringify(user));
          // alert(JSON.stringify(user));
          this.currentUserSubject.next(user);
          //localStorage.setItem('currentUser', user.token);
        }
        return user;
      })
      */
  }

  loginBAK(email: string, password: string): Observable<any> {
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
    return this.http.post(`${this.apiUrl}/logout.php`, {})
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
