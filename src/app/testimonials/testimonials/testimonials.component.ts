import { Component, OnInit } from '@angular/core';
import { CrudService } from "src/app/shared/crud.service";
import { NgxSpinnerService } from "ngx-spinner";

@Component({
  selector: 'app-testimonials',
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss']
})
export class TestimonialsComponent implements OnInit {
  allFeedbacks: any = [];
  isSmsConsentCollapsed = true;
  isEmailConsentCollapsed = true;

  constructor(private crudService: CrudService,
              private spinner: NgxSpinnerService) {
  }

  ngOnInit() {
    this.spinner.show();
    /*
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
    */
  }

  ngAfterViewInit() {
      this.getAllFeedbacks();
  }

  public setTitle(newTitle: string) {
      // this.titleService.setTitle(newTitle);
  }

  getAllFeedbacks() {
    this.crudService
      .getAllPublishedFeebacks()
      .toPromise()
      .then((data) => {
        this.allFeedbacks = data;
        this.spinner.hide();
      });
  }

  /*
  gotohome() {
    this.toggle = false;
  }

  get f() {
    return this.registerForm.controls;
  }

  postregisterdata() {
    this.submitted = true;
    if (this.registerForm.valid) {
      this.loading = true;

      this.service
        .registerFeedback(
          this.f.name.value,
          this.f.email.value,
          this.f.phone.value,
          this.f.message.value
        )
        .pipe(first())
        .toPromise()
        .then(
          (data) => {
            if (data.status != "Done") {
              this.toast.error(data.status);
              this.loading = false;
            } else {
              this.toast.success("Feedback has been successfully submitted.");
              this.loading = false;
              this.onReset();
            }
          },
          (error) => {
            this.toast.error(error);
            this.loading = false;
          }
        );
    } else {
      this.toast.error("Something went wrong! Verify the entered information.");
      this.loading = false;
    }
  }

  onReset() {
    this.submitted = false;
    this.registerForm.reset();
  }
  */
}

/*
export function phoneNumberValidator(
  control: AbstractControl
): { [key: string]: any } | null {
  const valid = /^\d+$/.test(control.value);
  return valid
    ? null
    : { invalidNumber: { valid: false, value: control.value } };
}
*/
