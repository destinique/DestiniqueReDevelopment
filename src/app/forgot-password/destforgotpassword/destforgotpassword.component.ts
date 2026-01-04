import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CrudService } from 'src/app/shared/services/crud.service';
import { StorageService } from 'src/app/shared/services/storage.service'; // Import StorageService
import { ToastrService } from "ngx-toastr";
import { NgxSpinnerService } from "ngx-spinner";
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';

interface ResetPasswordResponse {
  status: string;
  message?: string;
}

@Component({
  selector: 'app-destforgotpassword',
  templateUrl: './destforgotpassword.component.html',
  styleUrls: ['./destforgotpassword.component.scss']
})
export class DestforgotpasswordComponent implements OnInit {
  RequestResetForm!: FormGroup;
  submitted = false;
  successMessage = '';
  isLoading = false;

  constructor(
    private crudService: CrudService,
    private spinner: NgxSpinnerService,
    private toast: ToastrService,
    private formBuilder: FormBuilder,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.RequestResetForm = this.formBuilder.group({
      emailOrUsername: ['', [Validators.required, Validators.email]]
    });
  }

  // Method to trigger login modal via window event
  openLoginModal(): void {
    // Use StorageService to check browser environment
    if (this.storageService.isBrowser() && typeof window !== 'undefined') {
      const event = new CustomEvent('open-login-modal');
      window.dispatchEvent(event);
    }
  }

  // Check if specific control has specific error
  hasError(controlName: string, errorName: string): boolean {
    const control = this.RequestResetForm.get(controlName);
    if (!control) return false;
    return control.hasError(errorName) && (control.touched || this.submitted);
  }

  // Check if control is invalid and should show error
  showError(controlName: string): boolean {
    const control = this.RequestResetForm.get(controlName);
    if (!control) return false;
    return control.invalid && (control.touched || this.submitted);
  }

  postrequestresetdata(): void {
    this.submitted = true;
    this.successMessage = '';

    // Stop if form is invalid
    if (this.RequestResetForm.invalid) {
      this.markFormGroupTouched(this.RequestResetForm);
      return;
    }

    this.isLoading = true;
    this.spinner.show();

    const email = this.RequestResetForm.value.emailOrUsername.trim();

    // Using CrudService to post data
    this.crudService.requestReset(email)
      .pipe(
        catchError(error => {
          return this.handleError(error);
        }),
        finalize(() => {
          this.spinner.hide();
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response: ResetPasswordResponse) => {
          this.handleSuccess(response);
        }
      });
  }

  private handleSuccess(response: ResetPasswordResponse): void {
    if (response.status === 'Done') {
      this.successMessage = 'Password reset link has been sent to your email!';
      this.toast.success('Reset link sent successfully! Please check your email.', 'Success', {
        timeOut: 5000,
        progressBar: true,
        closeButton: true
      });

      // Reset form
      this.RequestResetForm.reset();
      this.submitted = false;

      // Clear success message after 10 seconds
      setTimeout(() => {
        this.successMessage = '';
      }, 10000);
    } else {
      // Handle cases where status is not 'Done' but still 200 OK
      this.toast.error(
        response.status || 'Failed to send reset link. Please try again.',
        'Error',
        {
          timeOut: 5000,
          progressBar: true,
          closeButton: true
        }
      );
    }
  }

  private handleError(error: any) {
    console.error('Password reset error:', error);

    // Handle different error status codes
    let errorMessage = 'An error occurred. Please try again later.';

    if (error.status === 0) {
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (error.status === 400) {
      errorMessage = 'Invalid email format. Please enter a valid email address.';
    } else if (error.status === 404) {
      errorMessage = 'Account not found. Please check your email address.';
    } else if (error.status === 429) {
      errorMessage = 'Too many attempts. Please try again in 15 minutes.';
    } else if (error.status === 500) {
      // Extract message from backend response
      if (error.error && error.error.status) {
        errorMessage = error.error.status;
      } else {
        errorMessage = 'Server error. Please try again later.';
      }
    }

    this.toast.error(errorMessage, 'Error', {
      timeOut: 5000,
      progressBar: true,
      closeButton: true
    });

    return throwError(() => new Error(errorMessage));
  }

  // Helper method to mark all form controls as touched
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  // Method to resend reset link (if needed)
  resendResetLink(): void {
    if (this.RequestResetForm.valid) {
      this.postrequestresetdata();
    } else {
      this.toast.warning('Please enter a valid email address first.', 'Warning');
    }
  }

  // Clear form and messages
  clearForm(): void {
    this.RequestResetForm.reset();
    this.submitted = false;
    this.successMessage = '';
    this.toast.info('Form cleared.', 'Info', {
      timeOut: 3000
    });
  }
}
