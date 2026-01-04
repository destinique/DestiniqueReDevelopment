import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError, map, delay } from 'rxjs/operators';

export interface BannerImage {
  title: string;
  photosURL: string;
  status: number;
}

interface RegisterUserData {
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  email: string;
  mobile: string;
  subscribe?: number;
  roles?: number;
  status?: number;
}

interface ResetPasswordRequest {
  email: string;
}

interface ResetPasswordResponse {
  status: string;
  message?: string;
}

interface loadProfileApiResponse {
  status: 'success' | 'error';
  message: string;
  data?: any;
  code: number;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CrudService {
  private readonly baseUrl = 'https://api.destinique.com/api-user/';
  private destinationAPIUrl = "https://api.destinique.com/api-user/get_destination_data.php";

  constructor(private http: HttpClient) {}

  // Registration method
  registerUser(userData: RegisterUserData): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(`${this.baseUrl}register.php`, userData, {
      headers: headers,
      observe: 'response'
    }).pipe(
      map(response => response.body),
      catchError((error: HttpErrorResponse) => throwError(() => error))
    );
  }

  requestReset(email: string): Observable<ResetPasswordResponse> {
    const requestData: ResetPasswordRequest = { email };
    return this.http
      .post<ResetPasswordResponse>(this.baseUrl + "request_reset_password.php", requestData)
      .pipe(
        // Retry 2 times with 1 second delay between attempts
        retry({
          count: 2,
          delay: 1000 // 1 second delay
        }),
        map((response: ResetPasswordResponse) => {
          return response;
        })
      );
  }

  // Other methods remain the same...
  getBannerImages(): Observable<BannerImage[]> {
    return this.http.get<BannerImage[]>(`${this.baseUrl}getAllBannerImages.php`);
  }

  getPropertyDetails(id: string | number): Observable<any> {
    try {
      const currentUserStr = localStorage.getItem("currentUser");

      if (!currentUserStr) {
        return this.makeUnauthenticatedRequest(id);
      }

      const userData = JSON.parse(currentUserStr);

      if (!userData?.token) {
        console.warn('User data exists but token is missing');
        return this.makeUnauthenticatedRequest(id);
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userData.token}`
      };

      return this.http.get(`${this.baseUrl}showPropertyDetails.php?propId=${id}`, { headers });
    } catch (error) {
      console.error('Error processing authentication:', error);
      return this.makeUnauthenticatedRequest(id);
    }
  }

  private makeUnauthenticatedRequest(id: string | number): Observable<any> {
    return this.http.get(`${this.baseUrl}showPropertyDetails.php?propId=${id}`);
  }

  getDestinationData(): Observable<any> {
    return this.http.get(this.destinationAPIUrl);
  }

  getAllPublishedFeebacks(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl + "getAllPublishedFeebacks.php");
  }

  getAllPublishedPromotions(id: string | number): Observable<any[]> {
    const headers: any = {'Content-Type': 'application/json'};
    const currentUser = localStorage.getItem("currentUser");

    if (currentUser) {
      headers.Authorization = 'Bearer ' + JSON.parse(currentUser).token;
    }

    if (id) {
      return this.http.get<any[]>(`${this.baseUrl}getPromotions.php?id=${id}`, { headers });
    } else {
      return this.http.get<any[]>(`${this.baseUrl}getPromotions.php`, { headers });
    }
  }

  registerInquiries(name: string, email: string, phone: string, message: string) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(
      `${this.baseUrl}inquiries_register.php`,
      { name, email, phone, message },
      { headers }
    ).pipe(
      map((user: any) => user)
    );
  }

  // Method to load user profile - accepts token as parameter
  loadProfileDetails(token: string): Observable<loadProfileApiResponse> {
    // Validate token
    if (!token || token.trim() === '') {
      return throwError(() => new Error('Invalid authentication token provided.'));
    }

    // Create headers with Authorization
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    // Option 1: Send token in Authorization header (Recommended)
    return this.http.get<loadProfileApiResponse>(
      `${this.baseUrl}get_profile_details.php`,
      { headers }
    ).pipe(
      retry({
        count: 1,
        delay: 1000
      }),
      map((response: loadProfileApiResponse) => {
        // Log successful response (optional)
        console.log('Profile data loaded successfully:', response);
        return response;
      }),
      catchError((error) => this.handleProfileError(error, token))
    );

    // Option 2: If your API expects token as query parameter
    // return this.http.get<loadProfileApiResponse>(
    //   `${this.baseUrl}get_profile_details.php?token=${token}`,
    //   { headers: new HttpHeaders({'Content-Type': 'application/json'}) }
    // ).pipe(...)
  }

  // Enhanced error handler for profile requests
  private handleProfileError(error: HttpErrorResponse, token: string): Observable<never> {
    let errorMessage = 'An error occurred while loading profile.';
    let userFriendlyMessage = 'Failed to load profile. Please try again.';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client error: ${error.error.message}`;
    }
    else {
      // Server-side error
      errorMessage = `Server error: ${error.status} - ${error.message}`;

      // Custom messages based on status codes
      switch (error.status) {
        case 0:
          userFriendlyMessage = 'Network error. Please check your internet connection.';
          break;
        case 400:
          userFriendlyMessage = 'Invalid request. Please try again.';
          break;
        case 401:
          userFriendlyMessage = 'Session expired. Please login again.';
          break;
        case 403:
          userFriendlyMessage = 'Access denied. You do not have permission.';
          break;
        case 404:
          userFriendlyMessage = 'Profile not found.';
          break;
        case 500:
          userFriendlyMessage = 'Server error. Please try again later.';
          break;
      }
    }

    // Log token details (masked for security)
    const maskedToken = token.length > 10
      ? `${token.substring(0, 10)}...${token.substring(token.length - 4)}`
      : '***';
    console.error(`Profile loading error (Token: ${maskedToken}):`, errorMessage);

    // Return a structured error response
    return throwError(() => ({
      originalError: error,
      message: userFriendlyMessage,
      status: error.status,
      timestamp: new Date().toISOString()
    }));
  }
}
