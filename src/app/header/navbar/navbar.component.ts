import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from "@angular/router";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { UserLoginComponent } from '../../login/user-login/user-login.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { UserRoleService } from 'src/app/shared/services/user-role.service';
import { StorageService } from 'src/app/shared/services/storage.service'; // Add this import
import { CrudService } from "src/app/shared/services/crud.service";
import { NgxSpinnerService } from "ngx-spinner";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  userName = '';
  userInitial = '';
  userRole: number | null = null;
  userFullName = '';
  isMenuCollapsed = true;
  private authSubscription: Subscription | null = null;
  private roleSubscription: Subscription | null = null;
  public propertyNumber: any;

  constructor(
    private router: Router,
    private crudService: CrudService,
    private modalService: NgbModal,
    private authService: AuthService,
    private userRoleService: UserRoleService,
    private storageService: StorageService, // Add this
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

          // Check if we're in browser before accessing window
          if (this.storageService.isBrowser() && window.location.href.includes('/property/')) {
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

    // Only add event listener in browser environment
    // Listen for the custom event to open login modal
    if (this.storageService.isBrowser() && typeof window !== 'undefined') {
      window.addEventListener('open-login-modal', this.openLoginModal.bind(this));
    }
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.roleSubscription) {
      this.roleSubscription.unsubscribe();
    }

    if (this.storageService.isBrowser() && typeof window !== 'undefined') {
      // Clean up the event listener when component is destroyed
      window.removeEventListener('open-login-modal', this.openLoginModal.bind(this));
    }
  }

  private checkInitialAuthState(): void {
    // Use AuthService to get token (it uses StorageService internally)
    const token = this.authService.getToken();

    if (token) {
      this.isLoggedIn = true;

      // Get user data from AuthService
      const user = this.authService.getCurrentUserFromStorage();
      if (user) {
        this.userName = user.email || user.username;
        this.userFullName = user.name || `${user.firstName} ${user.lastName}` || user.email;
        this.userInitial = this.userFullName.charAt(0).toUpperCase();
      }

      // Get role from StorageService
      const userRole = this.storageService.getItem('user_role');
      if (userRole) {
        const roleNumber = Number(userRole);
        if (!isNaN(roleNumber)) {
          this.userRole = roleNumber;
          this.userRoleService.setRole(this.userRole);
        }
      }
    }
  }

  private clearAuthData(): void {
    // Clear auth state through services
    this.isLoggedIn = false;
    this.userName = '';
    this.userFullName = '';
    this.userInitial = '';
    this.userRole = null;

    // Clear role via service
    this.userRoleService.setRole(null);
  }

  closeMobileMenu(): void {
    // Use StorageService to check if we're in browser
    if (this.storageService.isBrowser() && window.innerWidth < 1200) {
      this.isMenuCollapsed = true;
    }
  }

  openLoginModal(): void {
    this.closeMobileMenu();
    const modalRef = this.modalService.open(UserLoginComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      windowClass: 'destinique-login-dialog'
    });

    modalRef.shown.subscribe(() => {
      // Check if we're in browser before DOM manipulation
      if (this.storageService.isBrowser()) {
        const modalElement = document.querySelector('.destinique-login-dialog .modal-dialog');
        if (modalElement) {
          modalElement.id = 'destinique-login-modal';
        }
      }
    });
  }

  openRegisterModal(): void {
    this.closeMobileMenu();
    this.router.navigate(['/register']);
  }

  openProfile(): void {
    this.closeMobileMenu();
    this.router.navigate(['/my-profile']);
  }

  openForgotPasswordModal(): void {
    this.closeMobileMenu();
    console.log('Open forgot password modal - implement this');
  }

  logout(): void {
    this.closeMobileMenu();

    // Check if we're in browser before showing confirm dialog
    if (this.storageService.isBrowser() && confirm('Are you sure you want to logout?')) {
      this.spinner.show();

      this.authService.logout().subscribe({
        next: () => {
          this.clearAuthData();

          this.spinner.hide();
          this.toast.success('You have been logged out successfully.', 'Logged Out', {
            timeOut: 3000,
            positionClass: 'toast-top-right'
          });

          this.router.navigate(['/']);
        },
        error: (error) => {
          this.spinner.hide();
          console.error('Logout error:', error);

          this.clearAuthData();

          this.toast.error('There was an error logging out.', 'Error', {
            timeOut: 3000,
            positionClass: 'toast-top-right'
          });
        }
      });
    } else if (!this.storageService.isBrowser()) {
      // On server side, just clear the data
      this.clearAuthData();
      this.toast.info('Logged out', 'Info');
    }
  }

  hasRole(requiredRole: number): boolean {
    return this.userRole === requiredRole;
  }

  isAdmin(): boolean {
    return this.userRole === 1 || this.userRole === 2;
  }
}
