import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidatorFn,
  ValidationErrors
} from '@angular/forms';
import {
  NgbActiveModal,
  NgbInputDatepicker,
  NgbDateStruct
} from '@ng-bootstrap/ng-bootstrap';
import { InquiryBookingFormLabelData } from 'src/app/shared/interfaces/inquiry-booking-form-label-data-interface';

const MAX_GUEST_COUNT = 500;
const MAX_BUDGET = 999999999;

/* ---------- Guest count validator ---------- */
export const guestCountValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const adults = Number(control.get('adults')?.value || 0);
  const kids = Number(control.get('kids')?.value || 0);
  const babies = Number(control.get('babies')?.value || 0);
  const totalGuests = Number(control.get('totalGuests')?.value || 0);

  if (!totalGuests) return null;
  return adults + kids + babies === totalGuests
    ? null
    : { guestCountMismatch: true };
};

@Component({
  selector: 'app-property-inquiry',
  templateUrl: './property-inquiry.component.html',
  styleUrls: ['./property-inquiry.component.scss']
})
export class PropertyInquiryComponent implements OnInit {
  @Input() inquiryBookingFormLabelData!: InquiryBookingFormLabelData;
  @ViewChild('dpr') dpr!: NgbInputDatepicker;

  inquiryForm!: FormGroup;
  inquiryFormSubmitted = false;

  fromDate: NgbDateStruct | null = null;
  toDate: NgbDateStruct | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.setupGuestAutoCalculation();
    this.setupAdultDependentControls();
    this.setupDatesCheckboxLogic();
  }

  /* ---------- Build Form ---------- */
  private buildForm(): void {
    this.inquiryForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.maxLength(200)]],
        phone: ['', Validators.maxLength(15)],
        email: ['', [Validators.required, Validators.email]],
        dateRange: ['', [Validators.required]],
        datesNotProvided: [false],
        checkin: [''],
        checkout: [''],

        totalBudget: [
          '',
          [
            Validators.pattern(/^\d+(\.\d{1,2})?$/),
            Validators.min(0),
            Validators.max(MAX_BUDGET)
          ]
        ],

        totalGuests: [{ value: 1, disabled: true }],
        adults: [1, [Validators.min(1), Validators.max(MAX_GUEST_COUNT)]],
        kids: [{ value: 0, disabled: true }],
        babies: [{ value: 0, disabled: true }],

        message: ['', [Validators.required, Validators.maxLength(2000)]]
      },
      {
        validators: [guestCountValidator, this.dateRangeWithCheckboxValidator.bind(this)]
      }
    );
  }

  /* ---------- Custom validator for date range with checkbox ---------- */
  private dateRangeWithCheckboxValidator(group: AbstractControl): ValidationErrors | null {
    const datesNotProvided = group.get('datesNotProvided')?.value;
    const dateRangeControl = group.get('dateRange');
    const dateRangeValue = dateRangeControl?.value;

    if (datesNotProvided) {
      // Clear validation errors when checkbox is checked
      dateRangeControl?.setErrors(null);
      return null;
    }

    // Checkbox is not checked, so date range is required
    // Simple truthy check that works for strings, objects, arrays, etc.
    if (!dateRangeValue) {
      return { dateRangeRequired: true };
    }

    // Additional check for empty strings
    if (typeof dateRangeValue === 'string' && dateRangeValue.trim() === '') {
      return { dateRangeRequired: true };
    }

    return null;
  }

  /* ---------- Guest logic ---------- */
  private setupGuestAutoCalculation(): void {
    ['adults', 'kids', 'babies'].forEach(field => {
      this.inquiryForm.get(field)?.valueChanges.subscribe(() => {
        const { adults, kids, babies } = this.inquiryForm.getRawValue();
        const total = Number(adults) + Number(kids) + Number(babies);
        this.inquiryForm
          .get('totalGuests')
          ?.setValue(total, { emitEvent: false });
      });
    });
  }

  private setupAdultDependentControls(): void {
    const adultsCtrl = this.inquiryForm.get('adults');
    const kidsCtrl = this.inquiryForm.get('kids');
    const babiesCtrl = this.inquiryForm.get('babies');

    adultsCtrl?.valueChanges.subscribe(value => {
      if (Number(value) > 0) {
        kidsCtrl?.enable({ emitEvent: false });
        babiesCtrl?.enable({ emitEvent: false });
      } else {
        kidsCtrl?.disable({ emitEvent: false });
        babiesCtrl?.disable({ emitEvent: false });
        kidsCtrl?.setValue(0);
        babiesCtrl?.setValue(0);
      }
    });
  }

  /* ---------- Dates not provided checkbox ---------- */
  /* ---------- Dates not provided checkbox ---------- */
  private setupDatesCheckboxLogic(): void {
    const dateCtrl = this.inquiryForm.get('dateRange');

    this.inquiryForm.get('datesNotProvided')?.valueChanges.subscribe(checked => {
      if (checked) {
        // Disable the control programmatically
        dateCtrl?.disable({ emitEvent: false });
        dateCtrl?.setValue('');
        this.fromDate = null;
        this.toDate = null;
        // this.hoveredDate = null;
        this.inquiryForm.get('checkin')?.setValue(null);
        this.inquiryForm.get('checkout')?.setValue(null);
      } else {
        // Enable the control programmatically
        dateCtrl?.enable({ emitEvent: false });
      }

      // Trigger validation update
      this.inquiryForm.updateValueAndValidity();
    });
  }

  /* ---------- Datepicker selection ---------- */
  onDateSelection(date: NgbDateStruct) {
    if (!this.fromDate || (this.fromDate && this.toDate)) {
      // Start new range
      this.fromDate = date;
      this.toDate = null;
    } else if (this.fromDate && !this.toDate) {
      // Complete the range
      if (this.isAfter(date, this.fromDate)) {
        this.toDate = date;
        // Close datepicker after selecting both dates
        setTimeout(() => {
          if (this.dpr && this.dpr.isOpen()) {
            this.dpr.close();
          }
        }, 100);
      } else {
        // If second date is before first, reset
        this.fromDate = date;
        this.toDate = null;
      }
    }

    // Update the form control value
    this.updateDateControlValue();

    // Update API fields
    this.updateApiDateFields();

    // Mark as touched and validate
    const dateCtrl = this.inquiryForm.get('dateRange');
    dateCtrl?.markAsTouched();
    this.inquiryForm.updateValueAndValidity();
  }

  private updateDateControlValue(): void {
    const dateCtrl = this.inquiryForm.get('dateRange');
    let displayValue = '';

    if (this.fromDate && this.toDate) {
      displayValue = `${this.formatDate(this.fromDate)} - ${this.formatDate(this.toDate)}`;
    } else if (this.fromDate) {
      displayValue = this.formatDate(this.fromDate);
    }

    // Ensure we're setting a string value
    dateCtrl?.setValue(displayValue, { emitEvent: true });

    // Debug log to see what's being set
    console.log('Date control set to:', displayValue, 'Type:', typeof displayValue);
  }

  private updateApiDateFields(): void {
    this.inquiryForm.get('checkin')?.setValue(
      this.fromDate ? this.toApiDate(this.fromDate) : null
    );
    this.inquiryForm.get('checkout')?.setValue(
      this.toDate ? this.toApiDate(this.toDate) : null
    );
  }

  private formatDate(date: NgbDateStruct): string {
    if (!date) return '';
    const month = date.month.toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    const year = date.year.toString();
    return `${month}/${day}/${year}`;
  }

  private toApiDate(d: NgbDateStruct): string {
    return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
  }

  private isAfter(date1: NgbDateStruct, date2: NgbDateStruct): boolean {
    if (!date1 || !date2) return false;

    if (date1.year > date2.year) return true;
    if (date1.year < date2.year) return false;

    if (date1.month > date2.month) return true;
    if (date1.month < date2.month) return false;

    return date1.day > date2.day;
  }

  clearDateSelection(): void {
    this.fromDate = null;
    this.toDate = null;
    const dateCtrl = this.inquiryForm.get('dateRange');
    dateCtrl?.setValue('');
    this.inquiryForm.get('checkin')?.setValue(null);
    this.inquiryForm.get('checkout')?.setValue(null);
    dateCtrl?.updateValueAndValidity();
  }

  // Add this method to your component
  get dateRangeDisplay(): string {
    return this.inquiryForm?.get('dateRange')?.value || '';
  }

  /* ---------- Submit ---------- */
  submit(): void {
    this.inquiryFormSubmitted = true;

    if (this.inquiryForm.invalid) {
      this.inquiryForm.markAllAsTouched();
      return;
    }

    // Get the form data
    const formData = this.inquiryForm.getRawValue();

    // Prepare API data
    const apiData = {
      ...formData,
      listId: this.inquiryBookingFormLabelData.listId,
      formLabel: this.inquiryBookingFormLabelData.formLabel
    };

    // Debug: Show what will be sent to API
    this.showFormDataPreview(formData);

    // Submit to API
    this.activeModal.close(apiData);
  }

  private showFormDataPreview(formData: any): void {
    const preview = `
    ========== FORM DATA PREVIEW ==========
    Name: ${formData.name}
    Email: ${formData.email}
    Phone: ${formData.phone || '(not provided)'}
    Date Range: ${formData.dateRange || '(not provided)'}
    Dates Not Provided: ${formData.datesNotProvided ? 'YES' : 'NO'}
    Check-in (API): ${formData.checkin || 'N/A'}
    Check-out (API): ${formData.checkout || 'N/A'}
    Total Budget: ${formData.totalBudget || '(not specified)'}
    Guests - Total: ${formData.totalGuests}
    Guests - Adults: ${formData.adults}
    Guests - Kids: ${formData.kids}
    Guests - Babies: ${formData.babies}
    Message: ${formData.message.substring(0, 100)}${formData.message.length > 100 ? '...' : ''}
    =======================================
  `;
    console.log(preview);
  }

  close(): void {
    this.activeModal.close();
  }
}
