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

// Interfaces
import { ContactUSFormData, ContactUSApiResponse } from 'src/app/shared/interfaces/contact-form.interface';
import { InquiryApiRequest, InquiryApiResponse } from 'src/app/shared/interfaces/inquiry-form.interface';

@Injectable({
  providedIn: 'root'
})
export class CrudService {
  private readonly baseUrl= 'https://api.destinique.com/api-user/';
  private readonly rateAppBaseUrl= 'https://api.destinique.com/ratesapp4website/';
  private readonly rateAppWithDetailsBaseUrl= 'https://api.destinique.com/ratesapp4website/index-debug.php';
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
      // retry({
      //   count: 1,
      //   delay: 1000
      // }),
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

  /**
   * Submit contact form data to the API
   * @param formData Contact form data
   * @returns Observable with API response
   */
  submitContactForm(formData: ContactUSFormData): Observable<ContactUSApiResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post<ContactUSApiResponse>(`${this.baseUrl}maincontactusregister_new.php`, formData, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  getRates(listId: string, sdate: string, edate: string, sleeps?: number): Observable<any> {
    // Build the URL with parameters
    let url = `${this.rateAppBaseUrl}?task=get_rate&list_id=${listId}&SDATE=${sdate}&EDATE=${edate}`;

    // Add sleeps parameter if provided
    if (sleeps && sleeps > 0) {
      url += `&sleeps=${sleeps}`;
    }

    console.log('Fetching rates from URL:', url);

    return this.http.get<any>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Failed to fetch rates.';

        if (error.error instanceof ErrorEvent) {
          errorMessage = `Client error: ${error.error.message}`;
        } else {
          errorMessage = `Server error: ${error.status} - ${error.message}`;
        }

        console.error('Rates API error:', errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  getRatesWithDetails(listId: string, sdate: string, edate: string, sleeps?: number): Observable<any> {
    // Build the URL with parameters
    let url = `${this.rateAppWithDetailsBaseUrl}?task=get_rate&list_id=${listId}&SDATE=${sdate}&EDATE=${edate}`;

    // Add sleeps parameter if provided
    if (sleeps && sleeps > 0) {
      url += `&sleeps=${sleeps}`;
    }

    console.log('Fetching rates from URL:', url);

    return this.http.get<any>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Failed to fetch rates.';

        if (error.error instanceof ErrorEvent) {
          errorMessage = `Client error: ${error.error.message}`;
        } else {
          errorMessage = `Server error: ${error.status} - ${error.message}`;
        }

        console.error('Rates API error:', errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Submit property inquiry form data to the API
   * @param formData Property inquiry form data
   * @returns Observable with API response
   */
  submitPropertyInquiryData(formData: InquiryApiRequest): Observable<InquiryApiResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // Clean up the data before sending
    const cleanedData = this.cleanInquiryData(formData);

    return this.http.post<InquiryApiResponse>(
      `${this.baseUrl}register_property_inquiry.php`,
      cleanedData,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Clean and format inquiry data before sending to API
   * @param data Raw inquiry data
   * @returns Cleaned data
   */
  private cleanInquiryData(data: InquiryApiRequest): Partial<InquiryApiRequest> {
    const cleanedData: Partial<InquiryApiRequest> = { ...data };

    // Remove empty optional fields
    if (!data.phone || data.phone.trim() === '') {
      delete cleanedData.phone;
    }

    if (!data.totalBudget || data.totalBudget.trim() === '') {
      delete cleanedData.totalBudget;
    }

    // Handle date logic
    if (data.datesNotProvided) {
      delete cleanedData.dateRange;
      delete cleanedData.checkin;
      delete cleanedData.checkout;
    } else {
      // If datesNotProvided is false but no dates are selected
      if (!data.dateRange || data.dateRange.trim() === '') {
        delete cleanedData.dateRange;
        delete cleanedData.checkin;
        delete cleanedData.checkout;
      }
    }

    // Ensure numeric fields are numbers
    cleanedData.totalGuests = Number(data.totalGuests) || 0;
    cleanedData.adults = Number(data.adults) || 0;
    cleanedData.kids = Number(data.kids) || 0;
    cleanedData.babies = Number(data.babies) || 0;
    cleanedData.listId = Number(data.listId) || 0;

    return cleanedData;
  }

  /**
   * Handle HTTP errors
   * @param error HttpErrorResponse
   * @returns Observable with error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 0) {
        // Network error
        errorMessage = 'Network error: Please check your internet connection';
      } else {
        // Server returned error
        if (error.error && error.error.message) {
          // Use server error message
          errorMessage = error.error.message;
        } else {
          errorMessage = `Server Error: ${error.status} ${error.statusText}`;
        }
      }
    }

    console.error('API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
