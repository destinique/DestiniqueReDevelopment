import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from "ngx-toastr";
import { NgxSpinnerService } from "ngx-spinner";
import { AuthService } from 'src/app/shared/services/auth.service';
import { CrudService } from 'src/app/shared/services/crud.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-user-register',
  templateUrl: './user-register.component.html',
  styleUrls: ['./user-register.component.scss']
})
export class UserRegisterComponent implements OnInit {
  isSmsConsentCollapsed = true;
  isEmailConsentCollapsed = true;

  registerForm!: FormGroup;
  isSubmitting = false;
  showPassword = false;
  showConfirmPassword = false;
  hasInteractedWithForm = false;

  // Server-side error flags
  serverErrors = {
    username: '',
    email: '',
    mobile: '',
    general: ''
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toast: ToastrService,
    private spinner: NgxSpinnerService,
    private authService: AuthService,
    private crudService: CrudService
  ) {}

  ngOnInit(): void {
    this.initForm();

    // Track form interaction
    this.registerForm.valueChanges.subscribe(() => {
      this.hasInteractedWithForm = true;
      // Clear server errors when user starts typing
      this.clearServerErrors();
    });
  }

  private initForm(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern('^[a-zA-Z0-9._-]+$')
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(254)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        this.passwordValidator.bind(this)
      ]],
      confirmPassword: ['', [Validators.required]],
      mobile: ['', [
        Validators.required,
        Validators.pattern('^[0-9]{10,15}$')
      ]],
      smsConsent: [true],
      emailConsent: [true],
      agreeToTerms: [false, Validators.requiredTrue]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (password && confirmPassword && password === confirmPassword) {
      control.get('confirmPassword')?.setErrors(null);
    }

    return null;
  }

  private passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';

    if (!value) {
      return null;
    }

    const errors: any = {};

    if (value.length < 6) {
      errors.minLength = { requiredLength: 6, actualLength: value.length };
    }

    const hasLetter = /[a-zA-Z]/.test(value);
    if (!hasLetter) {
      errors.noLetter = true;
    }

    const hasNumber = /\d/.test(value);
    if (!hasNumber) {
      errors.noNumber = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  // Form field getters
  get f() { return this.registerForm.controls; }

  // Clear all server errors
  private clearServerErrors(): void {
    this.serverErrors = {
      username: '',
      email: '',
      mobile: '',
      general: ''
    };
  }

  // Set server error on specific field
  private setServerError(field: keyof typeof this.serverErrors, message: string): void {
    this.serverErrors[field] = message;
  }

  // Get error message including server errors
  getFieldError(fieldName: string): string {
    // Check for server errors first
    const serverError = this.serverErrors[fieldName as keyof typeof this.serverErrors];
    if (serverError) {
      return serverError;
    }

    // Use special method for password
    if (fieldName === 'password') {
      return this.getPasswordErrorMessage();
    }

    const field = this.registerForm.get(fieldName);

    if (!field || !field.errors || !field.touched) {
      return '';
    }

    const errors = field.errors;

    if (errors['required']) {
      if (fieldName === 'agreeToTerms' && this.hasInteractedWithForm) {
        return 'You must agree to the terms and conditions';
      }
      return 'This field is required';
    } else if (errors['minlength'] || errors['minLength']) {
      const requiredLength = errors['minlength']?.requiredLength || errors['minLength']?.requiredLength;
      return `Minimum ${requiredLength} characters required`;
    } else if (errors['maxlength']) {
      return `Maximum ${errors['maxlength'].requiredLength} characters allowed`;
    } else if (errors['email']) {
      return 'Please enter a valid email address';
    } else if (errors['pattern']) {
      if (fieldName === 'username') {
        return 'Username can only contain letters, numbers, dots, hyphens, and underscores';
      } else if (fieldName === 'mobile') {
        return 'Please enter a valid phone number (10-15 digits)';
      }
    } else if (errors['passwordMismatch']) {
      return 'Passwords do not match';
    }

    return 'Invalid value';
  }

  getPasswordErrorMessage(): string {
    const passwordControl = this.registerForm.get('password');

    if (!passwordControl || !passwordControl.errors || !passwordControl.touched) {
      return '';
    }

    const errors = passwordControl.errors;

    if (errors['required']) {
      return 'Password is required';
    } else if (errors['minLength']) {
      return `Minimum ${errors['minLength'].requiredLength} characters required`;
    } else if (errors['noLetter']) {
      return 'Password must contain at least one letter';
    } else if (errors['noNumber']) {
      return 'Password must contain at least one number';
    }

    return 'Invalid password format';
  }

  onSubmit(): void {
    this.hasInteractedWithForm = true;
    this.clearServerErrors();
    this.markFormGroupTouched(this.registerForm);

    if (this.registerForm.invalid) {
      if (!this.registerForm.value.agreeToTerms) {
        this.toast.error('You must agree to the Terms of Service and Privacy Policy', 'Terms Required');
      } else {
        this.toast.error('Please fix all errors in the form', 'Form Error');
      }
      return;
    }

    this.isSubmitting = true;
    this.spinner.show();

    const formData = this.registerForm.value;

    // Prepare data matching your PHP backend expectations
    const registrationData = {
      username: formData.username,
      password: formData.password, // PHP will hash with sha1
      firstname: formData.firstName,
      lastname: formData.lastName,
      email: formData.email,
      mobile: formData.mobile,
      subscribe: formData.emailConsent ? 1 : 0
      // Note: Removed roles and status as your PHP doesn't expect them
    };

    this.crudService.registerUser(registrationData).subscribe({
      next: (response: any) => {
        this.spinner.hide();
        this.isSubmitting = false;

        // Your PHP returns { "status": "Done" } on success
        if (response && response.status === 'Done') {
          this.toast.success('Registration successful! You can now login.', 'Success');

          // Auto-login after registration
          this.autoLoginAfterRegistration(formData.username, formData.password);

          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        } else if (response && response.status === 'Unable to register the user.') {
          // Handle server response with error message
          this.handleServerResponse(response);
        } else {
          // Handle unexpected response
          this.serverErrors.general = 'Unexpected response from server';
          this.toast.error('Unexpected response from server', 'Error');
        }
      },
      error: (error: HttpErrorResponse) => {
        this.spinner.hide();
        this.isSubmitting = false;
        this.handleHttpError(error);
      }
    });
  }

  private handleHttpError(error: HttpErrorResponse): void {
    console.error('HTTP Error:', error);

    // Clear previous server errors
    this.clearServerErrors();

    if (error.status === 409) {
      // Conflict - duplicate entry
      this.handleDuplicateError(error.error || error);
    } else if (error.status === 400) {
      // Bad request
      this.handleBadRequestError(error.error || error);
    } else if (error.status === 0) {
      // Network error
      this.serverErrors.general = 'Network error. Please check your connection.';
      this.toast.error('Network error. Please check your connection.', 'Connection Error');
    } else if (error.status === 500) {
      // Server error
      this.serverErrors.general = 'Server error. Please try again later.';
      this.toast.error('Server error. Please try again later.', 'Server Error');
    } else {
      // Other server errors
      const errorMessage = error.error?.message || error.message || 'Registration failed. Please try again.';
      this.serverErrors.general = errorMessage;
      this.toast.error(errorMessage, 'Registration Error');
    }
  }

  private handleServerResponse(response: any): void {
    // Handle non-HTTP error responses (when server returns 200 but with error)
    if (response.status === 'Unable to register the user.') {
      this.serverErrors.general = 'Registration failed. Please try again.';
      this.toast.error('Registration failed. Please try again.', 'Error');
    } else if (response.message) {
      this.serverErrors.general = response.message;
      this.toast.error(response.message, 'Error');
    } else {
      this.serverErrors.general = 'Unknown error occurred';
      this.toast.error('Unknown error occurred', 'Error');
    }
  }

  private handleDuplicateError(error: any): void {
    const errorMessage = error.message || 'Duplicate entry found';
    const field = error.field; // Your PHP returns 'field' property

    if (field === 'username') {
      this.setServerError('username', 'This username is already taken. Please choose another one.');
      this.toast.error('This username is already taken', 'Username Taken');
    } else if (field === 'email') {
      this.setServerError('email', 'This email address is already registered. Please use a different email or try logging in.');
      this.toast.error('This email is already registered', 'Email Exists');
    } else {
      // Generic duplicate error
      this.serverErrors.general = errorMessage;
      this.toast.error(errorMessage, 'Duplicate Entry');
    }
  }

  private handleBadRequestError(error: any): void {
    const errorMessage = error.message || 'Please check your information and try again.';

    // Check if there are specific field errors
    if (error.errors) {
      // Handle multiple validation errors
      if (error.errors.username) {
        this.setServerError('username', error.errors.username);
      }
      if (error.errors.email) {
        this.setServerError('email', error.errors.email);
      }
      if (error.errors.mobile) {
        this.setServerError('mobile', error.errors.mobile);
      }
    } else {
      this.serverErrors.general = errorMessage;
    }

    this.toast.error(errorMessage, 'Validation Error');
  }

  private autoLoginAfterRegistration(username: string, password: string): void {
    this.authService.login(username, password).subscribe({
      next: (response) => {
        console.log('Auto-login successful after registration');
      },
      error: (error) => {
        console.log('Auto-login failed, user will need to login manually');
      }
    });
  }

  onReset(): void {
    this.registerForm.reset({
      smsConsent: true,
      emailConsent: true,
      agreeToTerms: false
    });
    this.markFormGroupUntouched(this.registerForm);
    this.hasInteractedWithForm = false;
    this.clearServerErrors();
  }

  onCancel(): void {
    this.router.navigate(['/']);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Helper methods
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private markFormGroupUntouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsUntouched();
      if (control instanceof FormGroup) {
        this.markFormGroupUntouched(control);
      }
    });
  }

  // Additional helper method to check if field has server error
  hasServerError(fieldName: string): boolean {
    return !!this.serverErrors[fieldName as keyof typeof this.serverErrors];
  }

  // Method to check if field should show error state
// Method to check if field should show error state
  shouldShowError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    const hasServerError = this.hasServerError(fieldName);

    // Convert field?.errors to boolean by checking if it's truthy
    const hasFieldErrors = !!field?.errors;

    return (field?.touched && hasFieldErrors) || hasServerError;
  }

  // Method to get field CSS classes
  getFieldClasses(fieldName: string): any {
    return {
      'is-invalid': this.shouldShowError(fieldName),
      'is-valid': this.registerForm.get(fieldName)?.valid && this.registerForm.get(fieldName)?.touched
    };
  }
}
