import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgxSpinnerService } from "ngx-spinner";
import { StorageService } from 'src/app/shared/services/storage.service';
import { CrudService } from "src/app/shared/services/crud.service";
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

// Interface for component's user data
interface UserProfile {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  fullname: string;
  email: string;
  mobile: string;
  role: string;
  created_at: string;
  updated_at: string;
  formattedCreatedAt?: string;
  formattedUpdatedAt?: string;
}

@Component({
  selector: 'app-viewprofile',
  templateUrl: './viewprofile.component.html',
  styleUrls: ['./viewprofile.component.scss']
})
export class ViewprofileComponent implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null;
  isLoading = false;
  hasError = false;
  errorMessage = '';

  // Store the subscription for cleanup
  private profileSubscription: Subscription | null = null;

  isSmsConsentCollapsed = true;
  isEmailConsentCollapsed = true;

  constructor(
    private crudService: CrudService,
    private storageService: StorageService,
    private toast: ToastrService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    // this.spinner.show();
    // this.spinner.hide();
    this.loadProfileDetails();
  }

  ngOnDestroy(): void {
    // Clean up subscription to prevent memory leaks
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
  }

  // Method to load profile details - gets token from StorageService and passes to CrudService
  loadProfileDetails(): void {
    // Get token from StorageService
    const token = this.storageService.getItem('auth_token');

    // Check if token exists
    if (!token) {
      this.handleNoToken();
      return;
    }

    // Validate token format (basic check)
    if (!this.isValidTokenFormat(token)) {
      this.handleInvalidToken(token);
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.spinner.show();

    // Load profile data from API - pass token as argument
    this.profileSubscription = this.crudService.loadProfileDetails(token).subscribe({
      next: (response) => {
        this.handleProfileSuccess(response);
      },
      error: (error) => {
        this.handleProfileError(error);
      },
      complete: () => {
        this.isLoading = false;
        this.spinner.hide();
      }
    });
  }

  private handleNoToken(): void {
    this.hasError = true;
    this.errorMessage = 'You are not logged in. Please login to view your profile.';
    this.toast.error(this.errorMessage, 'Authentication Required');

    // Clear any potentially corrupted auth data
    this.clearAuthData();
  }

  private handleInvalidToken(token: string): void {
    this.hasError = true;
    this.errorMessage = 'Invalid authentication token format. Please login again.';
    this.toast.error(this.errorMessage, 'Token Error');

    // Log token issue (masked for security)
    const maskedToken = token.length > 10
      ? `${token.substring(0, 10)}...${token.substring(token.length - 4)}`
      : '***';
    console.error(`Invalid token format detected: ${maskedToken}`);

    // Clear corrupted token
    this.clearAuthData();
  }

  private isValidTokenFormat(token: string): boolean {
    // Basic JWT token format validation
    // A typical JWT has 3 parts separated by dots: header.payload.signature
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Check if it looks like a JWT (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Check if parts are not empty
    if (!parts[0] || !parts[1] || !parts[2]) {
      return false;
    }

    // Optional: Add more specific JWT validation if needed
    // For now, basic length check
    return token.length > 30; // JWT tokens are typically longer than 30 chars
  }

  private handleProfileSuccess(response: any): void {
    if (response.status === 'success' && response.data) {
      // Transform the API response data
      this.userProfile = this.transformProfileData(response.data);

      // Show success message
      this.toast.success('Profile loaded successfully!', 'Success', {
        timeOut: 3000,
        progressBar: true
      });

      console.log('Profile data loaded:', {
        username: this.userProfile?.username,
        id: this.userProfile?.id
      });
    } else {
      // Handle API success status but no data
      this.hasError = true;
      this.errorMessage = response.message || 'Failed to load profile data.';
      this.toast.error(this.errorMessage, 'Error');
    }
  }

  private handleProfileError(error: any): void {
    this.isLoading = false;
    this.hasError = true;

    // Extract error message
    if (error.message) {
      this.errorMessage = error.message;
    } else if (error.originalError?.error?.message) {
      this.errorMessage = error.originalError.error.message;
    } else {
      this.errorMessage = 'An unexpected error occurred while loading your profile.';
    }

    // Show error toast
    this.toast.error(this.errorMessage, 'Error', {
      timeOut: 5000,
      progressBar: true,
      closeButton: true
    });

    console.error('Profile loading error:', error);

    // If it's an authentication error (401), clear local storage
    if (error.status === 401 || error.message.includes('expired') || error.message.includes('login')) {
      this.clearAuthData();
    }
  }

  private transformProfileData(apiData: any): UserProfile {
    // Transform the API data to match our component interface
    return {
      id: apiData.id || 0,
      username: apiData.username || '',
      firstname: apiData.firstname || '',
      lastname: apiData.lastname || '',
      fullname: `${apiData.firstname || ''} ${apiData.lastname || ''}`.trim(),
      email: apiData.email || '',
      mobile: apiData.mobile || '',
      role: this.getRoleName(apiData.role),
      created_at: apiData.created_at || '',
      updated_at: apiData.updated_at || '',
      formattedCreatedAt: this.formatDate(apiData.created_at),
      formattedUpdatedAt: this.formatDate(apiData.updated_at)
    };
  }

  private getRoleName(roleId: number): string {
    // Map role IDs to role names
    const roles: { [key: number]: string } = {
      1: 'Administrator',
      2: 'Manager',
      3: 'User',
      4: 'Guest'
      // Add more roles as needed
    };
    return roles[roleId] || `Role ${roleId}`;
  }

  private formatDate(dateString: string): string {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  private clearAuthData(): void {
    // Clear all auth-related storage
    this.storageService.removeItem('auth_token');
    this.storageService.removeItem('currentUser');
    this.storageService.removeItem('user_role');
    this.storageService.removeItem('user_id');
    this.storageService.removeItem('user_name');

    this.toast.info('Please login again to continue.', 'Session Expired');

    // You can optionally redirect to login page here
    // setTimeout(() => {
    //   this.router.navigate(['/login']);
    // }, 2000);
  }

  // Method to refresh profile data
  refreshProfile(): void {
    this.loadProfileDetails();
  }

  // Public method to get current token (useful for debugging)
  getCurrentToken(): string | null {
    return this.storageService.getItem('auth_token');
  }

  // Check if profile data is loaded
  get isProfileLoaded(): boolean {
    return !!this.userProfile && !this.isLoading && !this.hasError;
  }

  // Get loading text based on state
  get loadingText(): string {
    if (this.isLoading) {
      return 'Loading your profile...';
    }
    if (this.hasError) {
      return 'Failed to load profile';
    }
    return 'Profile';
  }
}
