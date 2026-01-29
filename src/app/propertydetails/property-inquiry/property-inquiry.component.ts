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
  NgbDate,
  NgbDateStruct
} from '@ng-bootstrap/ng-bootstrap';
import { InquiryBookingFormLabelData } from 'src/app/shared/interfaces/inquiry-booking-form-label-data-interface';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from "ngx-spinner";
import { ToastrService } from "ngx-toastr";
import { CrudService } from "src/app/shared/services/crud.service";
import { StorageService } from 'src/app/shared/services/storage.service';

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
  isMobile = false;
  isIOS = false;

  inquiryForm!: FormGroup;
  inquiryFormSubmitted = false;

  today!: NgbDateStruct;
  fromDate: NgbDateStruct | null = null;
  toDate: NgbDateStruct | null = null;
  isSubmitting = false;

  isSmsConsentCollapsed = true;
  isEmailConsentCollapsed = true;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private crudService: CrudService,
    private toast: ToastrService,
    private spinner: NgxSpinnerService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    const now = new Date();
    this.today = {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate()
    };

    if (this.storageService.isBrowser()){
      const userAgent = navigator.userAgent || navigator.vendor || (window as any)['opera'];
      this.isMobile = /android|iphone|ipad|ipod|opera mini|iemobile|wpdesktop/i.test(userAgent);
      this.isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    }

    this.buildForm();
    this.setupGuestAutoCalculation();
    this.setupAdultDependentControls();
    this.setupDatesCheckboxLogic();
    // Initialize with pre-filled dates if available
    this.initializeWithPrefilledDates();
  }

  /* ---------- Initialize with pre-filled dates ---------- */
  private initializeWithPrefilledDates(): void {
    const { scheckin, scheckout } = this.inquiryBookingFormLabelData;

    if (scheckin && scheckout) {
      // Parse the dates from the input
      const fromDate = this.parseDateString(scheckin);
      const toDate = this.parseDateString(scheckout);

      if (fromDate && toDate) {
        this.fromDate = fromDate;
        this.toDate = toDate;

        // Update form controls
        this.updateDateControlValue();
        this.updateApiDateFields();

        // Update the form control value
        const dateCtrl = this.inquiryForm.get('dateRange');
        dateCtrl?.markAsTouched();
        this.inquiryForm.updateValueAndValidity({ emitEvent: false });
      }
    } else if (scheckin) {
      // Only checkin date provided
      const fromDate = this.parseDateString(scheckin);
      if (fromDate) {
        this.fromDate = fromDate;
        this.updateDateControlValue();
        this.updateApiDateFields();
      }
    }

    // Initialize totalBudget if provided
    const totalBudget = this.inquiryBookingFormLabelData?.totalBudget;
    if (totalBudget !== undefined && totalBudget !== null && totalBudget !== '') {
      this.inquiryForm.get('totalBudget')?.setValue(totalBudget, { emitEvent: false });
    }
  }

  /* ---------- Parse date string to NgbDateStruct ---------- */
  private parseDateString(dateString: string): NgbDateStruct | null {
    if (!dateString) return null;

    try {
      // Try parsing as YYYY-MM-DD (API format)
      if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          return {
            year: parseInt(parts[0], 10),
            month: parseInt(parts[1], 10),
            day: parseInt(parts[2], 10)
          };
        }
      }

      // Try parsing as MM/DD/YYYY (display format)
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          return {
            year: parseInt(parts[2], 10),
            month: parseInt(parts[0], 10),
            day: parseInt(parts[1], 10)
          };
        }
      }

      // Try parsing as Date object
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return {
          year: date.getFullYear(),
          month: date.getMonth() + 1, // JavaScript months are 0-based
          day: date.getDate()
        };
      }
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
    }

    return null;
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
      dateRangeControl?.setErrors(null);
      return null;
    }

    // Check if date range has a value (handles strings, null, undefined, empty objects)
    if (!dateRangeValue || (typeof dateRangeValue === 'string' && dateRangeValue.trim() === '')) {
      return { dateRangeRequired: true };
    }

    return null;
  }

  /* ---------- Guest logic ---------- */
  private setupGuestAutoCalculation(): void {
    // Combine all three fields into a single subscription for better performance
    const guestFields = ['adults', 'kids', 'babies'];
    const guestControls = guestFields.map(field => this.inquiryForm.get(field));

    guestControls.forEach(control => {
      control?.valueChanges.subscribe(() => {
        const { adults, kids, babies } = this.inquiryForm.getRawValue();
        const total = Number(adults) + Number(kids) + Number(babies);
        this.inquiryForm.get('totalGuests')?.setValue(total, { emitEvent: false });
      });
    });
  }

  private setupAdultDependentControls(): void {
    const adultsCtrl = this.inquiryForm.get('adults');
    const kidsCtrl = this.inquiryForm.get('kids');
    const babiesCtrl = this.inquiryForm.get('babies');

    adultsCtrl?.valueChanges.subscribe(value => {
      const isPositive = Number(value) > 0;

      if (isPositive) {
        kidsCtrl?.enable({ emitEvent: false });
        babiesCtrl?.enable({ emitEvent: false });
      } else {
        kidsCtrl?.disable({ emitEvent: false });
        babiesCtrl?.disable({ emitEvent: false });
        kidsCtrl?.setValue(0, { emitEvent: false });
        babiesCtrl?.setValue(0, { emitEvent: false });
      }
    });
  }

  get calendarMonths(): number {
    return (this.isMobile || this.isIOS) ? 1 : 2;
  }

  /* ---------- Dates not provided checkbox ---------- */
  private setupDatesCheckboxLogic(): void {
    const dateCtrl = this.inquiryForm.get('dateRange');

    this.inquiryForm.get('datesNotProvided')?.valueChanges.subscribe(checked => {
      if (checked) {
        dateCtrl?.disable({ emitEvent: false });
        dateCtrl?.setValue('', { emitEvent: false });
        this.clearDateState();
      } else {
        dateCtrl?.enable({ emitEvent: false });
      }

      this.inquiryForm.updateValueAndValidity({ emitEvent: false });
    });
  }

  /* ---------- Datepicker selection ---------- */
  isPastDate(date: NgbDateStruct): boolean {
    if (!date || !this.today) return false;

    if (date.year < this.today.year) return true;
    if (date.year > this.today.year) return false;

    if (date.month < this.today.month) return true;
    if (date.month > this.today.month) return false;

    return date.day < this.today.day;
  }

  onDateSelection(date: NgbDateStruct) {
    if (
      this.inquiryForm.get('dateRange')?.disabled ||
      this.isPastDate(date)
    ) {
      return;
    }

    if (!this.fromDate || (this.fromDate && this.toDate)) {
      // Start new range
      this.fromDate = date;
      this.toDate = null;
    } else if (this.fromDate && !this.toDate) {
      // Complete the range
      if (this.isAfter(date, this.fromDate)) {
        this.toDate = date;
        this.closeDatepicker();
      } else {
        // If second date is before first, reset
        this.fromDate = date;
        this.toDate = null;
      }
    }

    this.updateFormWithDates();
  }

  private closeDatepicker(): void {
    setTimeout(() => {
      if (this.dpr?.isOpen()) {
        this.dpr.close();
      }
    }, 100);
  }

  private updateFormWithDates(): void {
    this.updateDateControlValue();
    this.updateApiDateFields();

    const dateCtrl = this.inquiryForm.get('dateRange');
    dateCtrl?.markAsTouched();
    this.inquiryForm.updateValueAndValidity({ emitEvent: false });
  }

  private updateDateControlValue(): void {
    const dateCtrl = this.inquiryForm.get('dateRange');
    let displayValue = '';

    if (this.fromDate && this.toDate) {
      displayValue = `${this.formatDate(this.fromDate)} - ${this.formatDate(this.toDate)}`;
    } else if (this.fromDate) {
      displayValue = this.formatDate(this.fromDate);
    }

    dateCtrl?.setValue(displayValue, { emitEvent: true });
  }

  private updateApiDateFields(): void {
    this.inquiryForm.get('checkin')?.setValue(
      this.fromDate ? this.toApiDate(this.fromDate) : null,
      { emitEvent: false }
    );
    this.inquiryForm.get('checkout')?.setValue(
      this.toDate ? this.toApiDate(this.toDate) : null,
      { emitEvent: false }
    );
  }

  private formatDate(date: NgbDateStruct): string {
    if (!date) return '';
    const month = date.month.toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    return `${month}/${day}/${date.year}`;
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

  private isSameDate(date1: NgbDateStruct, date2: NgbDateStruct): boolean {
    return date1 && date2 &&
      date1.year === date2.year &&
      date1.month === date2.month &&
      date1.day === date2.day;
  }

  private before(date1: NgbDateStruct, date2: NgbDateStruct): boolean {
    if (!date1 || !date2) return false;

    if (date1.year < date2.year) return true;
    if (date1.year > date2.year) return false;

    if (date1.month < date2.month) return true;
    if (date1.month > date2.month) return false;

    return date1.day < date2.day;
  }

  /* ---------- Range highlighting methods ---------- */
  isInRange(date: NgbDateStruct): boolean {
    if (!this.fromDate || !this.toDate) return false;

    const isAfterStart = this.isAfter(date, this.fromDate) || this.isSameDate(date, this.fromDate);
    const isBeforeEnd = this.before(date, this.toDate) || this.isSameDate(date, this.toDate);

    return isAfterStart && isBeforeEnd;
  }

  isRangeEdge(date: NgbDateStruct): boolean {
    if (!this.fromDate && !this.toDate) return false;
    return this.isSameDate(date, this.fromDate!) || this.isSameDate(date, this.toDate!);
  }

  // Add this method to highlight pre-filled dates
  isPrefilledDate(date: NgbDateStruct): boolean {
    const { scheckin, scheckout } = this.inquiryBookingFormLabelData;

    if (!scheckin && !scheckout) return false;

    const parsedCheckin = scheckin ? this.parseDateString(scheckin) : null;
    const parsedCheckout = scheckout ? this.parseDateString(scheckout) : null;

    const isCheckin = parsedCheckin ? this.isSameDate(date, parsedCheckin) : false;
    const isCheckout = parsedCheckout ? this.isSameDate(date, parsedCheckout) : false;

    return isCheckin || isCheckout;
  }

  private clearDateState(): void {
    this.fromDate = null;
    this.toDate = null;
    this.inquiryForm.get('checkin')?.setValue(null, { emitEvent: false });
    this.inquiryForm.get('checkout')?.setValue(null, { emitEvent: false });
  }

  clearDateSelection(): void {
    this.clearDateState();
    const dateCtrl = this.inquiryForm.get('dateRange');
    dateCtrl?.setValue('', { emitEvent: false });
    dateCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  /* ---------- Submit ---------- */
  submit(): void {
    this.inquiryFormSubmitted = true;

    if (this.inquiryForm.invalid) {
      this.inquiryForm.markAllAsTouched();
      return;
    }

    // Prevent multiple submissions
    if (this.isSubmitting) {
      return;
    }

    // Prepare API data
    const formData = this.inquiryForm.getRawValue();
    const apiRequest = {
      ...formData,
      listId: Number(this.inquiryBookingFormLabelData.listId),
      formLabel: this.inquiryBookingFormLabelData.formLabel
    };

    // Debug data in development
    this.debugFormData(apiRequest);

    // Set submitting state
    this.isSubmitting = true;

    // Show spinner
    this.spinner.show('propertyInquirySpinner', {
      type: 'ball-circus',
      bdColor: 'rgba(0,0,0,0.8)',
      color: '#fff',
      fullScreen: true
    });

    // Submit to API using CrudService
    this.crudService.submitPropertyInquiryData(apiRequest).subscribe({
      next: (response) => {
        this.spinner.hide('propertyInquirySpinner');
        this.isSubmitting = false;

        if (response.status === 'success') {
          // Show success toast
          this.toast.success(
            response.message || 'Your inquiry has been submitted successfully!',
            'Success',
            {
              timeOut: 5000,
              positionClass: 'toast-top-right',
              progressBar: true,
              closeButton: true
            }
          );

          // Close modal with success data
          this.activeModal.close({
            success: true,
            data: response,
            message: response.message
          });
        }
        else {
          // API returned error status
          this.toast.error(
            response.message || 'Failed to submit inquiry. Please try again.',
            'Error',
            {
              timeOut: 5000,
              positionClass: 'toast-top-right',
              progressBar: true,
              closeButton: true
            }
          );
        }
      },
      error: (error) => {
        this.spinner.hide('propertyInquirySpinner');
        this.isSubmitting = false;

        // Show error toast
        let errorMessage = 'An error occurred while submitting your inquiry.';

        if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        this.toast.error(
          errorMessage,
          'Submission Failed',
          {
            timeOut: 5000,
            positionClass: 'toast-top-right',
            progressBar: true,
            closeButton: true
          }
        );

        // Keep modal open for user to try again
        console.error('Error submitting inquiry:', error);
      }
    });
  }

  private debugFormData(apiData: any): void {
    if (!environment.production) {
      console.log('=== Form Submission Data ===');
      console.log('API Payload:', JSON.stringify(apiData, null, 2));
      console.log('Date Range:', apiData.dateRange);
      console.log('Check-in:', apiData.checkin);
      console.log('Check-out:', apiData.checkout);
    }
  }

  close(): void {
    if (this.isSubmitting) {
      this.toast.warning(
        'Please wait while we submit your inquiry...',
        'Submission in Progress',
        {
          timeOut: 3000,
          positionClass: 'toast-top-right'
        }
      );
      return;
    }
    this.activeModal.close();
  }
}
