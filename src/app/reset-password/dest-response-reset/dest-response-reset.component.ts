import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { AuthService } from "src/app/shared/services/auth.service";
import { LoadSpinnerService } from "src/app/shared/services/load-spinner.service";
import { catchError, finalize } from "rxjs/operators";
import { throwError } from "rxjs";

interface ResetPasswordResponse {
  status: string;
  message?: string;
}

@Component({
  selector: "app-dest-response-reset",
  templateUrl: "./dest-response-reset.component.html",
  styleUrls: ["./dest-response-reset.component.scss"],
})
export class DestResponseResetComponent implements OnInit {
  ResponseResetForm!: FormGroup;
  loading = false;
  submitted = false;
  resetToken: string = "";
  CurrentState: string = "Wait";
  isTokenVerified = false;
  tokenVerificationComplete = false; // Add this line

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastrService,
    private loadSpinner: LoadSpinnerService
  ) {
    this.route.params.subscribe((params) => {
      this.resetToken = params["resetToken"] || "";
      if (this.resetToken) {
        this.VerifyToken();
      } else {
        this.toast.error("Invalid reset link");
        this.router.navigate(["/destinique-forgotpassword"]);
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.ResponseResetForm = this.formBuilder.group(
      {
        resettoken: [this.resetToken],
        newPassword: [
          "",
          [
            Validators.required,
            Validators.minLength(6),
            Validators.pattern(
              // /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/
            ),
          ],
        ],
        confirmPassword: ["", [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator(),
      }
    );
  }

  get f() {
    return this.ResponseResetForm.controls;
  }

  getFormControl(controlName: string): AbstractControl | null {
    return this.ResponseResetForm.get(controlName);
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.getFormControl(controlName);
    return control
      ? control.hasError(errorName) && (control.touched || this.submitted)
      : false;
  }

  private passwordMatchValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const password = formGroup.get("newPassword")?.value;
      const confirmPassword = formGroup.get("confirmPassword")?.value;

      if (password !== confirmPassword) {
        formGroup.get("confirmPassword")?.setErrors({ mustMatch: true });
        return { mustMatch: true };
      } else {
        formGroup.get("confirmPassword")?.setErrors(null);
        return null;
      }
    };
  }

  VerifyToken(): void {
    if (!this.resetToken) {
      this.toast.error("Invalid reset token");
      this.CurrentState = "NotVerified";
      this.tokenVerificationComplete = true;
      return;
    }

    this.authService.ValidPasswordToken(this.resetToken).subscribe({
      next: (response: ResetPasswordResponse) => {
        this.tokenVerificationComplete = true;

        if (response.status === "Verified") {
          this.isTokenVerified = true;
          this.CurrentState = "Verified";
          const message = response.message || "Token verified. Please set your new password.";
          this.toast.success(message);
        } else {
          this.CurrentState = "NotVerified";
          this.isTokenVerified = false;
          const message = response.message || "Reset token is invalid or expired.";
          this.toast.error(message);
          setTimeout(() => {
            this.router.navigate(["/destinique-forgotpassword"]);
          }, 3000);
        }
      },
      error: (error) => {
        console.error("Token verification error:", error);
        this.tokenVerificationComplete = true;
        this.CurrentState = "NotVerified";
        this.isTokenVerified = false;
        const message = error.message || "Unable to verify reset token.";
        this.toast.error(message);
      },
    });
  }

  postresponseresetdata(): void {
    this.submitted = true;

    if (this.ResponseResetForm.invalid) {
      this.markFormGroupTouched(this.ResponseResetForm);
      return;
    }

    if (!this.isTokenVerified) {
      this.toast.error("Please verify your reset token first.");
      return;
    }

    this.loading = true;
    this.loadSpinner.show();

    const newPassword = this.f["newPassword"].value;

    this.authService
      .responseReset(this.resetToken, newPassword)
      .pipe(
        catchError((error) => {
          console.error("Reset password error:", error);
          const message = error.message || "Failed to reset password.";
          this.toast.error(message);
          return throwError(() => error);
        }),
        finalize(() => {
          this.loading = false;
          this.loadSpinner.hide();
        })
      )
      .subscribe({
        next: (response: ResetPasswordResponse) => {
          if (response.status === "Done") {
            const successMessage = response.message ||
              "Password successfully reset!";
            this.toast.success(successMessage);
            this.ResponseResetForm.reset();
            this.submitted = false;
            setTimeout(() => {
              this.router.navigate(["/"]);
            }, 3000);
          } else {
            const errorMessage = response.message || "Failed to reset password.";
            this.toast.error(errorMessage);
          }
        },
      });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  goToForgotPassword(): void {
    this.router.navigate(["/destinique-forgotpassword"]);
  }
}
