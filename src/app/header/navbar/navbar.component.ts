// navbar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { UserLoginComponent } from '../../login/user-login/user-login.component';
import { AuthService } from '../../services/auth.service';
import { UserRoleService } from '../../services/user-role.service';

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

  // Add this for mobile menu collapse
  isMenuCollapsed = true;

  // Subscriptions
  private authSubscription: Subscription | null = null;
  private roleSubscription: Subscription | null = null;
  public userLoggedIn = true;

  constructor(
    private modalService: NgbModal,
    private authService: AuthService,
    private userRoleService: UserRoleService
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication state changes
    this.authSubscription = this.authService.authState$.subscribe(user => {
      this.isLoggedIn = !!user;
      if (user) {
        this.userName = user.name || user.email;
        this.userInitial = this.userName.charAt(0).toUpperCase();
      } else {
        this.userName = '';
        this.userInitial = '';
      }
    });

    // Subscribe to role changes
    this.roleSubscription = this.userRoleService.role$.subscribe(role => {
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
    // Check if user is already logged in (from localStorage)
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Optional: Validate token with backend
      this.authService.validateToken(token).subscribe({
        next: (user) => {
          // Token is valid, user is logged in
          this.isLoggedIn = true;
          this.userName = user.name || user.email;
          this.userInitial = this.userName.charAt(0).toUpperCase();
        },
        error: () => {
          // Token invalid, clear it
          localStorage.removeItem('auth_token');
        }
      });
    }
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
    this.closeMobileMenu(); // Close mobile menu if open
    console.log('Open register modal - implement this');
  }

  // Open forgot password modal
  openForgotPasswordModal(): void {
    this.closeMobileMenu(); // Close mobile menu if open
    console.log('Open forgot password modal - implement this');
  }

  // Logout user
  logout(): void {
    this.closeMobileMenu(); // Close mobile menu if open
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logout successful');
      },
      error: (error) => {
        console.error('Logout error:', error);
      }
    });
  }

  // Check if user has specific role
  hasRole(requiredRole: number): boolean {
    return this.userRole === requiredRole;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.userRole === 1 || this.userRole === 3;
  }
}
