// services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { StorageService } from "src/app/shared/services/storage.service";

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
  name?: string;
}

interface ResetPasswordResponse {
  status: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'https://api.destinique.com/api-user/';
  private authSubject = new BehaviorSubject<User | null>(null);
  authState$ = this.authSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {
    this.initializeFromStorage();
  }

  private initializeFromStorage(): void {
    const userData = this.storageService.getItem('currentUser');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.authSubject.next(user);
      } catch (e) {
        console.error('Error parsing user data from localStorage:', e);
      }
    }
  }

  register(firstname: string, lastname: string, username: string, email: string, mobile: string, password: string) {
    return this.http
      .post<any>(this.apiUrl + "register.php", {
        firstname,
        lastname,
        username,
        email,
        mobile,
        password
      })
      .pipe(
        tap((user) => {
          return user;
        })
      );
  }

  login(username: string, password: string) {
    return this.http
      .post<any>(this.apiUrl + "login.php", { username, password })
      .pipe(
        tap((response: any) => {
          if (response.user && response.token) {
            response.username = response.user;
            response.name = `${response.firstname} ${response.lastname}`;
            if (response.status != "inactive") {
              // Store using StorageService (handles SSR automatically)
              this.storageService.setItem("currentUser", JSON.stringify(response));
              this.storageService.setItem('auth_token', response.token);
              this.storageService.setItem('user_id', response.id.toString());
              this.storageService.setItem('user_name', `${response.firstname} ${response.lastname}`);
              this.storageService.setItem('user_role', response.role.toString());
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
          // Clear all auth-related storage
          this.storageService.removeItem('auth_token');
          this.storageService.removeItem('currentUser');
          this.storageService.removeItem('user_role');
          this.storageService.removeItem('user_id');
          this.storageService.removeItem('user_name');
          this.authSubject.next(null);
        })
      );
  }

  validateToken(token: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}validate.php`, { token })
      .pipe(catchError(this.handleError));
  }

  // Get token safely
  getToken(): string | null {
    try {
      // Try to get from currentUser first
      const currentUserStr = this.storageService.getItem('currentUser');

      if (currentUserStr) {
        const userData = JSON.parse(currentUserStr);

        // Check multiple possible token property names
        const token = userData?.token ||
          userData?.accessToken ||
          userData?.jwt ||
          userData?.authToken;

        if (token) {
          return token;
        }
      }

      // Fallback to legacy auth_token storage
      return this.storageService.getItem('auth_token');

    } catch (error) {
      console.error('Error retrieving authentication token:', error);
      return null;
    }
  }

  // Get current user from storage
  getCurrentUserFromStorage(): User | null {
    const userData = this.storageService.getItem('currentUser');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // Optional: Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.authSubject.getValue();
  }

  ValidPasswordToken(resettoken: string): Observable<ResetPasswordResponse> {
    return this.http
      .post<ResetPasswordResponse>(this.apiUrl + "verify_reset_password_token.php", {
        resettoken,
      })
      .pipe(
        map((response: ResetPasswordResponse) => response),
        catchError(this.handleError)
      );
  }

  responseReset(resettoken: string, newPassword: string): Observable<ResetPasswordResponse> {
    return this.http
      .post<ResetPasswordResponse>(this.apiUrl + "response_reset_password.php", {
        resettoken,
        newPassword,
      })
      .pipe(
        map((response: ResetPasswordResponse) => response),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;

      // Custom messages based on status codes
      if (error.status === 404) {
        errorMessage = 'Resource not found.';
      } else if (error.status === 500) {
        errorMessage = 'Internal server error. Please try again later.';
      }
    }

    console.error('AuthService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

}
