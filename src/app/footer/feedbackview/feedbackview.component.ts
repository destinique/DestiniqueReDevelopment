import { Component, OnInit } from "@angular/core";
import {FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors} from '@angular/forms';
import { ToastrService } from "ngx-toastr";
import { CrudService } from "src/app/shared/crud.service";
import { first } from "rxjs/operators";

@Component({
  selector: 'app-feedbackview',
  templateUrl: './feedbackview.component.html',
  styleUrls: ['./feedbackview.component.scss']
})

export class FeedbackviewComponent implements OnInit {
    registerForm!: FormGroup;
    toggle = false;
    submitted = false;
    phoneNumber = "^d{3}-d{3}-d{4}$";
    loading = false;

    isSmsConsentCollapsed = true;
    isEmailConsentCollapsed = true;

    constructor(
      private formBuilder: FormBuilder,
      private toast: ToastrService,
      private crudService: CrudService,
    ) {
    }

    ngOnInit() {
        this.initializeForm();
    }

    initializeForm(): void {
      this.registerForm = this.formBuilder.group({
        name: ["", Validators.required],
        email: [
          "",
          [
            Validators.required,
            Validators.minLength(10),
            Validators.maxLength(80),
            Validators.email,
          ],
        ],
        phone: [""],
        message: ["", Validators.required],
      });
    }

    get f() { return this.registerForm.controls; }

    postregisterdata() {
      this.submitted = true;
      // Stop if form is invalid
      if (this.registerForm.invalid) {
        this.markAllAsTouched();
        return;
      }

      if (this.registerForm.valid) {
        this.loading = true;

        this.crudService
          .registerInquiries(
            this.f['name'].value,
            this.f['email'].value,
            this.f['phone'].value,
            this.f['message'].value
          )
          .pipe(first())
          .toPromise()
          .then(
            (data) => {
              if (data.status != "Done") {
                this.toast.error(data.status);
                this.loading = false;
              } else {
                this.toast.success(
                  "Inquiry has been successfully submitted. Our agent will contact you."
                );
                this.loading = false;
                this.onReset();
                Object.keys(this.registerForm.controls).forEach(key => {
                  this.registerForm.get(key)?.setErrors(null);
                });
                this.toggle = true;
              }
            },
            (error) => {
              this.toast.error(error);
              this.loading = false;
            }
          );
      }
      else {
        this.toast.error(
          "Something went wrong!, Please verify the entered information. "
        );
      }
    }

    markAllAsTouched(): void {
      Object.values(this.registerForm.controls).forEach(control => {
        control.markAsTouched();
      });
    }

    gotohome() {
      this.toggle = false;
    }

    onReset() {
      this.submitted = false;
      this.registerForm.reset();
    }
}
