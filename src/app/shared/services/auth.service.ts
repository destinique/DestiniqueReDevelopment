// services/auth.service.ts (basic version)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  token: string;
  role: number;
  expireAt: number;
  // Optional: Add name for compatibility
  name?: string;
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
            response.username = response.user;
            response.name = `${response.firstname} ${response.lastname}`;
            if (response.status != "inactive") {
              // store user details and jwt token in local storage to keep user logged in between page refreshes
              localStorage.setItem("currentUser", JSON.stringify(response));
              localStorage.setItem('auth_token', response.token);
              localStorage.setItem('user_id', response.id.toString());
              localStorage.setItem('user_name', `${response.firstname} ${response.lastname}`);
              localStorage.setItem('user_role', response.role.toString());

              this.authSubject.next(response);
            }
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
