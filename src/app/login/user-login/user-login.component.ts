import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/shared/services/auth.service';
import { UserRoleService } from 'src/app/shared/services/user-role.service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ToastrService } from "ngx-toastr";

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.scss']
})
export class UserLoginComponent implements OnInit{
  loginForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  isSmsConsentCollapsed = true;
  isEmailConsentCollapsed = true;

  constructor(
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userRoleService: UserRoleService,
    private router: Router,
    private toast: ToastrService
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
      // smsConsent: [true],
      // emailConsent: [true]
    });
  }

  ngOnInit(): void {
    // Reset any previous error messages
    this.errorMessage = '';
  }

  get formControls() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    this.toast.clear();
    // Reset messages
    this.errorMessage = '';
    this.successMessage = '';

    // Mark all fields as touched to trigger validation messages
    this.loginForm.markAllAsTouched();

    // Check if form is valid
    if (this.loginForm.invalid) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    // Check if consents are checked (if required)
    /*
    if (!this.loginForm.value.smsConsent || !this.loginForm.value.emailConsent) {
      this.errorMessage = 'Please accept both SMS and Email consents to continue.';
      return;
    }
    */

    this.isSubmitting = true;
    const { username, password } = this.loginForm.value;

    this.authService.login(username, password)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          console.log('Login response:', response); // Keep for debugging

          // Check if login was successful based on status field
          if (response.status === 'Successful login.' && response.token) {
            // Successfully logged in
            this.successMessage = 'Login successful!';
            /*
            // Create a user object from the response (optional, for AuthService)
            const userData = {
              id: response.id,
              username: response.user, // Using 'user' from response
              firstName: response.firstname,
              lastName: response.lastname,
              email: response.email,
              mobile: response.mobile,
              token: response.token,
              role: response.role, // Now we have the role field!
              expireAt: response.expireAt
            };

            console.log('User data extracted:', userData); // Debug

            // Optional: Update AuthService with user data
            // You might want to update AuthService to handle this structure
            // this.authService.setCurrentUser(userData);
            // Store token and basic user info in localStorage
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('user_id', response.id.toString());
            localStorage.setItem('user_name', `${response.firstname} ${response.lastname}`);
            localStorage.setItem('user_role', response.role.toString());
            */
            // Update user role in UserRoleService
            this.userRoleService.setRole(response.role);

            // Close modal after short delay
            setTimeout(() => {
              this.activeModal.close({
                success: true,
                message: 'login_success',
                user: response.user
              });
              // Optional: Navigate to dashboard or home
              this.router.navigate(['/']);
            }, 1000);
          }
          else if (response.status == "inactive") {
            this.errorMessage = username +' is currently inactive. Please contact admin';
            this.toast.error(
              username +' is currently inactive. Please contact admin',
              'Inactive User Found',
              {
                tapToDismiss: true,
                timeOut: 0,
                positionClass: 'toast-top-center'
              }
            );
          }
          else {
            // Even though HTTP status might be 200, the login failed
            this.errorMessage = response.status || 'Login failed. Please try again.';
          }
        },
        error: (error) => {
          this.toast.error(
            'Invalid username or password!',
            'LOGIN FAILED',
            {
              tapToDismiss: true,
              timeOut: 0,
              positionClass: 'toast-top-center'
            }
          );
          console.error('Login error details:', error);
          // Check if error has response data
          if (error.error && error.error.status) {
            // API returned 400 with error message like "Login failed."
            this.errorMessage = error.error.status;
          }
          else if (error.status === 401 || error.status === 400) {
            this.errorMessage = 'Invalid username or password.';
          }
          else if (error.status === 0) {
            this.errorMessage = 'Network error. Please check your connection.';
          }
          else if (error.status === 500) {
            this.errorMessage = 'Server error. Please try again later.';
          }
          else {
            this.errorMessage = error.error?.message || 'An error occurred during login. Please try again.';
          }

        }
      });
  }

  onRegisterClick(): void {
    this.activeModal.dismiss('register_clicked');
    // You can navigate to register page or open register modal
    this.router.navigate(['/register']);
  }

  onRecoverClick(): void {
    this.activeModal.dismiss('recover_clicked');
    // You can navigate to password recovery page or open recovery modal
    this.router.navigate(['/destinique-forgotpassword']);
  }
}
