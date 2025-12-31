import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { UserLoginComponent } from '../../login/user-login/user-login.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { UserRoleService } from 'src/app/shared/services/user-role.service';
import { CrudService } from "src/app/shared/services/crud.service";
import { NgxSpinnerService } from "ngx-spinner";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  // Authentication state
  isLoggedIn = false;
  userName = '';
  userInitial = '';
  userRole: number | null = null;
  userFullName = '';

  // Add this for mobile menu collapse
  isMenuCollapsed = true;

  // Subscriptions
  private authSubscription: Subscription | null = null;
  private roleSubscription: Subscription | null = null;
  // public userLoggedIn = true;

  //search form in the header menu
  public propertyNumber: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private crudService: CrudService,
    private modalService: NgbModal,
    private authService: AuthService,
    private userRoleService: UserRoleService,
    private spinner: NgxSpinnerService,
    private toast: ToastrService
  ) {}

  showSuccess() {
    this.toast.success('Operation completed!', 'Success');
  }

  showError() {
    this.toast.error('Something went wrong!', 'Error');
  }

  showWarning() {
    this.toast.warning('Please check your input', 'Warning');
  }

  showInfo() {
    this.toast.info('New update available', 'Information');
  }

  search() {
    const propertyId = parseInt(this.propertyNumber.trim());
    // Validate input
    if (isNaN(propertyId)) {
      this.toast.error('Please enter a valid Property ID number', 'Invalid Input');
      return;
    }

    if (propertyId <= 0) {
      this.toast.error('Please enter a valid positive Property ID', 'Invalid Input');
      return;
    }

    this.spinner.show();

    this.crudService.getPropertyDetails(propertyId).subscribe({
      next: (resp: any) => {
        this.spinner.hide();

        if (resp?.length > 0) {
          const listId = resp[0].list_id;
          /*
          // check if the url is on /property/ then reload
          if (window.location.href.includes('/property/')){
            this.router.navigateByUrl("/property/" + resp[0].list_id);
            setTimeout(() => {
              window.location.replace(window.location.href);
            }, 0);
          }
          else{
            this.router.navigateByUrl("/property/" + resp[0].list_id);
          }
          */

          if (window.location.href.includes('/property/')) {
            this.router.navigate(['/property', listId]).then(() => {
              window.location.reload();
            });
          } else {
            this.router.navigate(['/property', listId]);
          }
        } else {
          this.showPropertyError();
        }
      },
      error: () => {
        this.spinner.hide();
        this.showPropertyError();
      }
    });
  }

  private showPropertyError() {
    this.toast.error(
      'This property is no longer online. Please call 850-312-5400 for further assistance',
      'Property Not Found',
      {
        tapToDismiss: true,
        timeOut: 0,
        positionClass: 'toast-top-center'
      }
    );
  }

  ngOnInit(): void {
    // Subscribe to authentication state changes
    this.authSubscription = this.authService.authState$.subscribe(user => {
      this.isLoggedIn = !!user;
      if (user) {
        this.userName = user.username || user.email;
        this.userFullName = user.name || `${user.firstName} ${user.lastName}` || user.email;
        this.userInitial = this.userFullName.charAt(0).toUpperCase();
      } else {
        this.userName = '';
        this.userFullName = '';
        this.userInitial = '';
      }
    });

    // Subscribe to role changes
    this.roleSubscription = this.userRoleService.role$.subscribe(role => {
      console.log('Navbar: Role updated to:', role);
      this.userRole = role;
    });

    // Check initial auth state
    this.checkInitialAuthState();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.roleSubscription) {
      this.roleSubscription.unsubscribe();
    }
  }

  private checkInitialAuthState(): void {
    // Check localStorage for existing auth data
    const token = localStorage.getItem('auth_token');
    const userRole = localStorage.getItem('user_role');
    const userData = localStorage.getItem('currentUser');

    if (token) {
      // If we have a token, consider user logged in
      this.isLoggedIn = true;

      if (userData) {
        try {
          const user = JSON.parse(userData);
          this.userName = user.email || user.username;
          this.userFullName = user.name || `${user.firstName} ${user.lastName}` || user.email;
          this.userInitial = this.userFullName.charAt(0).toUpperCase();
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }

      // Set role if available
      if (userRole) {
        this.userRole = Number(userRole);
        // Also update UserRoleService
        this.userRoleService.setRole(this.userRole);
      }

      // Optional: Validate token with backend
      // this.validateToken(token);
    }
  }

  private validateToken(token: string): void {
    this.authService.validateToken(token).subscribe({
      next: (user) => {
        // Token is valid
        this.isLoggedIn = true;
        this.userName = user.username || user.email;
        this.userFullName = user.name || `${user.firstName} ${user.lastName}` || user.email;
        this.userInitial = this.userFullName.charAt(0).toUpperCase();

        // Update UserRoleService if needed
        if (user.role) {
          this.userRoleService.setRole(user.role);
        }
      },
      error: () => {
        // Token invalid, clear everything
        this.clearAuthData();
      }
    });
  }

  private clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');

    this.isLoggedIn = false;
    this.userName = '';
    this.userFullName = '';
    this.userInitial = '';
    this.userRole = null;

    // Also clear from services
    this.userRoleService.setRole(null);
    // AuthService should also clear its state
    // this.authService.logoutLocally();
  }

  // Close mobile menu when clicking links (for mobile view)
  closeMobileMenu(): void {
    if (window.innerWidth < 1200) {
      this.isMenuCollapsed = true;
    }
  }

  // Open login modal
  openLoginModal(): void {
    this.closeMobileMenu(); // Close mobile menu if open
    const modalRef = this.modalService.open(UserLoginComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      windowClass: 'destinique-login-dialog'
    });

    // After modal is rendered
    modalRef.shown.subscribe(() => {
      const modalElement = document.querySelector('.destinique-login-dialog .modal-dialog');
      if (modalElement) {
        modalElement.id = 'destinique-login-modal';
      }
    });
  }

// Open registration modal
  openRegisterModal(): void {
    this.closeMobileMenu();
    // You can create a RegisterComponent similar to UserLoginComponent
    // For now, navigate to register page
    this.router.navigate(['/register']);
  }

  // Navigate to profile
  openProfile(): void {
    this.closeMobileMenu();
    this.router.navigate(['/my-profile']);
  }

  // Open forgot password modal
  openForgotPasswordModal(): void {
    this.closeMobileMenu(); // Close mobile menu if open
    console.log('Open forgot password modal - implement this');
  }

  // Logout user
  logout(): void {
    this.closeMobileMenu();

    // Show confirmation dialog
    if (confirm('Are you sure you want to logout?')) {
      this.spinner.show();

      this.authService.logout().subscribe({
        next: () => {
          // Clear local data
          this.clearAuthData();

          this.spinner.hide();
          this.toast.success('You have been logged out successfully.', 'Logged Out', {
            timeOut: 3000,
            positionClass: 'toast-top-right'
          });

          // Redirect to home page
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.spinner.hide();
          console.error('Logout error:', error);

          // Even if server logout fails, clear local data
          this.clearAuthData();

          this.toast.error('There was an error logging out.', 'Error', {
            timeOut: 3000,
            positionClass: 'toast-top-right'
          });
        }
      });
    }
  }

  // Check if user has specific role
  hasRole(requiredRole: number): boolean {
    return this.userRole === requiredRole;
  }

  // Check if user is admin (assuming role 1 or 3 are admin)
  isAdmin(): boolean {
    return this.userRole === 1 || this.userRole === 3;
  }
}
