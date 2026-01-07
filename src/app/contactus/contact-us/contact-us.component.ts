import { Component, OnInit, AfterViewInit } from '@angular/core';
import { NgxSpinnerService } from "ngx-spinner";
import { StorageService } from 'src/app/shared/services/storage.service';
import { CrudService } from "src/app/shared/services/crud.service";
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';

// Interfaces
import { ContactUSFormData, ContactUSApiResponse } from 'src/app/shared/interfaces/contact-form.interface';

// import { IDropdownSettings } from "ng-multiselect-dropdown";

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})
export class ContactUsComponent implements OnInit, AfterViewInit {
  contactForm: FormGroup;

  // Form options (if using select/checkbox)
  accommodationTypes = ['Hotel', 'Villa', 'Resort', 'Apartment', 'Guest House'];
  amenities = ['Pool', 'Spa', 'WiFi', 'Gym', 'Parking', 'Restaurant'];
  services = ['Airport Transfer', 'Breakfast Included', 'All Inclusive', 'Room Service'];

  isSmsConsentCollapsed = true;
  isEmailConsentCollapsed = true;

  isLoading = false;
  hasError = false;
  errorMessage = '';
  isSubmitting = false;
  // Add a flag to track spinner visibility
  isSpinnerVisible = false;

  // View options for checkboxes
  viewOptions = [
    { value: 'Ocean View', label: 'Ocean View' },
    { value: 'Oceanfront View', label: 'Oceanfront View' },
    { value: 'Partial Ocean View', label: 'Partial Ocean View' },
    { value: 'Golf Course View', label: 'Golf Course View' },
    { value: 'Mountain View', label: 'Mountain View' },
    { value: 'Lake View', label: 'Lake View' },
    { value: 'Wood/Forest', label: 'Wood/Forest' },
    { value: 'Not Applicable', label: 'Not Applicable' }
  ];

  // Amenity options for checkboxes
  amenityOptions = [
    { value: 'Boat Slip Available', label: 'Boat Slip Available' },
    { value: 'Pet Friendly (For a Fee)', label: 'Pet Friendly (For a Fee)' },
    { value: 'Pool - Community', label: 'Pool - Community' },
    { value: 'Pool - Private', label: 'Pool - Private' },
    { value: 'Snowbird Rentals Accepted', label: 'Snowbird Rentals Accepted' },
    { value: 'Tennis Courts', label: 'Tennis Courts' },
    { value: 'Elevator in Unit', label: 'Elevator in Unit' },
    { value: 'Ground Floor', label: 'Ground Floor' },
    { value: 'Pool - Heated', label: 'Pool - Heated' },
    { value: 'Pickleball Courts', label: 'Pickleball Courts' },
    { value: 'Golf on Site', label: 'Golf on Site' },
    { value: 'Electric Vehicle Charger', label: 'Electric Vehicle Charger' },
    { value: 'Washer/Dryer', label: 'Washer/Dryer' }
  ];

  // Datepicker configurations for US format
  bsConfig = {
    dateInputFormat: 'MM/DD/YYYY', // US format
    containerClass: 'theme-blue', // Changed from theme-blue
    showWeekNumbers: false,
    isAnimated: true,
    adaptivePosition: true,
    customTodayClass: 'custom-today-class',
    showClearButton: true,
    displayMonths: 1
  };

  departureConfig = {
    dateInputFormat: 'MM/DD/YYYY', // US format
    containerClass: 'theme-blue', // Changed from theme-blue
    showWeekNumbers: false,
    isAnimated: true,
    adaptivePosition: true,
    customTodayClass: 'custom-today-class',
    showClearButton: true,
    displayMonths: 1
  };

  // Track arrival date separately for minDate logic
  arrivalDate: Date | null = null;
  // Option 1: Use minDate as a separate property in the template
  departureMinDate: Date | undefined = undefined;

  constructor(
    private fb: FormBuilder,
    private crudService: CrudService,
    private storageService: StorageService,
    private toast: ToastrService,
    public spinner: NgxSpinnerService,
    private localeService: BsLocaleService
  ) {
    this.contactForm = this.createForm();
    // Set locale
    this.localeService.use('en-gb');
  }

  ngOnInit(): void {
    // this.dropdownList = [
    //   { item_id: 1, item_text: "Private Home" },
    //   { item_id: 2, item_text: "Condo" },
    //   { item_id: 3, item_text: "Hotel/Resort" },
    //   { item_id: 4, item_text: "Town Home" },
    //   { item_id: 5, item_text: "Guest House" },
    //   { item_id: 6, item_text: "Mobile Home" },
    //   { item_id: 7, item_text: "Ski-in" },
    // ];
    // this.dropdownSettings = {
    //   idField: "item_id",
    //   textField: "item_text",
    // };

    this.isLoading = true;
    this.spinner.show();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.isLoading = false;
      this.spinner.hide();
    }, 200);
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Required fields
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,12}$/)]],
      desDestination: ['', Validators.required],
      arrival: ['', Validators.required],
      departure: ['', Validators.required],
      totalGuests: ['1', [Validators.required, Validators.min(1)]],
      budgets: ['', Validators.required],
      accomTypeSelect: ['', Validators.required],

      // Optional fields
      otherArea: [''],
      altDates: [''],
      adults: ['1', [Validators.min(0)]],
      kids: ['0', [Validators.min(0)]],
      babies: ['0', [Validators.min(0)]],
      rooms: ['1'],
      proximity: ['Not applicable'],
      addNotes: [''],

      // Checkbox arrays
      checkArray: this.fb.array([]),
      checkArray2: this.fb.array([])
    });
  }

  // Handle arrival date change
  onArrivalDateChange(date: Date): void {
    if (date){
      this.arrivalDate = date;
      this.departureMinDate = date;
      // Clear departure if invalid
      const departureDate = this.contactForm.get('departure')?.value;
      if (departureDate && new Date(departureDate) < date) {
        this.contactForm.patchValue({ departure: null });
      }
    }
    else {
      // If arrival date is cleared, also clear minDate
      this.departureMinDate = undefined;
    }
  }

  // Optional: Also handle when user types date manually
  onArrivalBlur(): void {
    const arrivalDate = this.contactForm.get('arrival')?.value;
    if (arrivalDate) {
      this.onArrivalDateChange(new Date(arrivalDate));
    }
  }

  // Custom validator for departure date
  validateDepartureDate(): void {
    const arrival = this.contactForm.get('arrival')?.value;
    const departure = this.contactForm.get('departure')?.value;

    if (arrival && departure && new Date(departure) < new Date(arrival)) {
      this.contactForm.get('departure')?.setErrors({
        dateRange: 'Departure date must be after arrival date'
      });
    } else {
      this.contactForm.get('departure')?.setErrors(null);
    }
  }

  clearArrivalDate(): void {
    this.contactForm.patchValue({ arrival: null });
    // Reset departure minDate
    this.departureMinDate = undefined;
    // Also update the arrival date tracker
    this.arrivalDate = null;
  }

  clearDepartureDate(): void {
    this.contactForm.patchValue({ departure: null });
  }

  /*
  // Helper to format date for display
  formatDateForDisplay(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  }
  */

  onSubmit(): void {
    // Add date validation before submission
    this.validateDepartureDate();

    if (this.contactForm.invalid) {
      this.showErrorToast('Please enter valid value for all the fields highlighted in red', 'Missing Required Fields/Invalid Data');
      this.markFormGroupTouched(this.contactForm);
      return;
    }

    // Set spinner flag and show spinner
    this.isSpinnerVisible = true;
    // Show spinner with custom message
    this.spinner.show(undefined, {
      type: 'ball-spin-clockwise',
      size: 'medium',
      bdColor: 'rgba(0, 0, 0, 0.8)',
      color: '#fff',
      fullScreen: true
    });

    // You can also show a loading toast if needed
    const loadingToast = this.toast.info('Submitting contact form data...', '', {
      disableTimeOut: true,
      closeButton: false
    });

    this.isLoading = true;
    this.isSubmitting = true;

    // Prepare form data for API
    const formData: ContactUSFormData = {
      firstName: this.contactForm.value.firstName,
      lastName: this.contactForm.value.lastName,
      email: this.contactForm.value.email,
      phone: this.contactForm.value.phone,
      desDestination: this.contactForm.value.desDestination,
      otherArea: this.contactForm.value.otherArea || undefined,
      arrival: this.formatDate(this.contactForm.value.arrival),
      departure: this.formatDate(this.contactForm.value.departure),
      totalGuests: parseInt(this.contactForm.value.totalGuests) || undefined,
      altDates: this.contactForm.value.altDates || undefined,
      budgets: this.contactForm.value.budgets,
      adults: parseInt(this.contactForm.value.adults) || undefined,
      kids: parseInt(this.contactForm.value.kids) || undefined,
      babies: parseInt(this.contactForm.value.babies) || undefined,
      rooms: parseInt(this.contactForm.value.rooms) || undefined,
      proximity: this.contactForm.value.proximity || undefined,
      addNotes: this.contactForm.value.addNotes || undefined,
      accomType: [this.contactForm.value.accomTypeSelect],
      checkArray: this.contactForm.value.checkArray || [],
      checkArray2: this.contactForm.value.checkArray2 || []
    };

    // Call the API
    this.crudService.submitContactForm(formData).subscribe({
      next: (response: ContactUSApiResponse) => {
        // Hide spinner and loading toast
        this.isSubmitting = false;
        this.isLoading = false;
        this.isSpinnerVisible = false;
        this.spinner.hide();
        this.toast.clear(loadingToast.toastId);
        this.handleApiResponse(response);
      },
      error: (error: Error) => {
        // Hide spinner and loading toast
        this.isSubmitting = false;
        this.isSpinnerVisible = false;
        this.isLoading = false;
        this.spinner.hide();
        this.toast.clear(loadingToast.toastId);
        this.handleError(error);
      }
    });
  }

  resetForm(showToast: boolean = true): void {
    // Reset the form to initial state
    this.contactForm.reset();

    // Set default values for required fields
    this.contactForm.patchValue({
      totalGuests: '1',
      adults: '1',
      kids: '0',
      babies: '0',
      rooms: '1',
      proximity: 'Not applicable'
    });

    // Clear FormArrays (checkboxes)
    const checkArray = this.contactForm.get('checkArray') as FormArray;
    const checkArray2 = this.contactForm.get('checkArray2') as FormArray;

    while (checkArray.length > 0) {
      checkArray.removeAt(0);
    }

    while (checkArray2.length > 0) {
      checkArray2.removeAt(0);
    }

    // Reset component state
    this.isLoading = false;
    this.hasError = false;
    this.errorMessage = '';
    this.isSpinnerVisible = false;
    // this.apiResponse = null;
    // this.isSubmitted = false;

    // Mark form as pristine and untouched
    this.contactForm.markAsPristine();
    this.contactForm.markAsUntouched();

    // Reset datepicker related properties
    this.arrivalDate = null;
    this.departureMinDate = undefined;

    if (showToast) {
      // Show success message (optional)
      this.toast.info('Form has been reset', 'Reset Complete', {
        timeOut: 2000,
        progressBar: true,
        closeButton: true
      });
    }
  }

  // Helper to format date from input
  private formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  }

  // Handle checkbox changes
  onCheckboxChange(event: any, controlName: string, value: string): void {
    const formArray = this.contactForm.get(controlName) as FormArray;

    if (event.target.checked) {
      formArray.push(this.fb.control(value));
    } else {
      const index = formArray.controls.findIndex(x => x.value === value);
      if (index >= 0) {
        formArray.removeAt(index);
      }
    }
  }

  // Check if checkbox is checked
  isCheckboxChecked(controlName: string, value: string): boolean {
    const formArray = this.contactForm.get(controlName) as FormArray;
    return formArray.controls.some(control => control.value === value);
  }

  getSelectedOptions(controlName: string): string[] {
    return this.contactForm.get(controlName)?.value || [];
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // In component
  markFieldAsTouched(fieldName: string): void {
    this.contactForm.get(fieldName)?.markAsTouched();
  }

  // Validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  // Update getFieldError to provide more specific messages
  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      switch(fieldName) {
        case 'firstName': return 'First name is required';
        case 'lastName': return 'Last name is required';
        case 'email': return 'Email address is required';
        case 'phone': return 'Phone number is required';
        case 'desDestination': return 'Desired destination is required';
        case 'arrival': return 'Arrival date is required';
        case 'departure': return 'Departure date is required';
        case 'totalGuests': return 'Total guests is required';
        case 'budgets': return 'Budget is required';
        case 'accomTypeSelect': return 'Accommodation type preference is required';
        default: return 'This field is required';
      }
    }

    if (field.errors['email']) return 'Please enter a valid email address';

    if (field.errors['minlength']) {
      const requiredLength = field.errors['minlength'].requiredLength;
      return `Minimum ${requiredLength} characters required`;
    }

    if (field.errors['min']) {
      const minValue = field.errors['min'].min;
      return `Minimum value is ${minValue}`;
    }

    if (field.errors['pattern']) {
      if (fieldName === 'phone') return 'Phone number must be 10-12 digits (numbers only)';
      return 'Invalid format';
    }

    return '';
  }

  testSubmit(): void {
    // Set spinner flag and show spinner
    this.isSpinnerVisible = true;
    // Show spinner with custom message
    this.spinner.show(undefined, {
      type: 'ball-spin-clockwise',
      size: 'medium',
      bdColor: 'rgba(0, 0, 0, 0.8)',
      color: '#fff',
      fullScreen: true
    });

    // You can also show a loading toast if needed
    const loadingToast = this.toast.info('Submitting contact form data...', '', {
      disableTimeOut: true,
      closeButton: false
    });

    // Prepare static test data
    const testData: ContactUSFormData = {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
      phone: "+1 (555) 123-4567",
      otherArea: "Additional area details",
      desDestination: "Maldives",
      arrival: "2024-06-15",
      departure: "2024-06-25",
      totalGuests: 4,
      altDates: "Flexible between June 10-20",
      budgets: "$5000-7000",
      adults: 2,
      kids: 1,
      babies: 1,
      rooms: 2,
      accomType: ["Hotel", "Villa"],
      proximity: "Beachfront",
      checkArray: ["Pool", "Spa", "WiFi"],
      checkArray2: ["Airport Transfer", "Breakfast Included"],
      addNotes: "We are celebrating our anniversary and would like a room with ocean view. Please include any special offers for honeymoon packages."
    };

    // Call the API
    this.crudService.submitContactForm(testData).subscribe({
      next: (response: ContactUSApiResponse) => {
        // Hide spinner and loading toast
        this.spinner.hide();
        this.isSpinnerVisible = false;
        this.toast.clear(loadingToast.toastId);

        this.handleApiResponse(response);
      },
      error: (error: Error) => {
        // Hide spinner and loading toast
        this.spinner.hide();
        this.isSpinnerVisible = false;
        this.toast.clear(loadingToast.toastId);

        this.handleError(error);
      }
    });
  }

  /**
   * Handle API success/error response
   */
  private handleApiResponse(response: ContactUSApiResponse): void {
    if (response.status === 'success') {
      this.showSuccessToast(response);
      // Reset form after 2 seconds, but don't show "reset" toast
      setTimeout(() => {
        this.resetForm(false);
      }, 2000);
    } else {
      this.showErrorToast(
        response.message || 'An error occurred while submitting the form.',
        'Submission Failed'
      );
    }

    // Log response for debugging
    console.log('API Response:', response);
  }

  /**
   * Handle HTTP/network errors
   */
  private handleError(error: Error): void {
    let errorMessage = 'An unknown error occurred';

    if (error.message.includes('Network error')) {
      errorMessage = 'Unable to connect to server. Please check your internet connection.';
    } else if (error.message.includes('Server Error')) {
      errorMessage = 'Server encountered an error. Please try again later.';
    } else {
      errorMessage = error.message;
    }

    this.showErrorToast(errorMessage, 'Connection Error');
    console.error('Error details:', error);
  }

  /**
   * Show success toast with formatted message
   */
  private showSuccessToast(response: ContactUSApiResponse): void {
    // Create detailed success message
    let title = 'Success! ✓';
    let message = `<strong>${response.message}</strong>`;

    // Add inquiry ID if available
    if (response.inquiry_id) {
      message += `<br><small>Reference ID: ${response.inquiry_id}</small>`;
    }

    // Add email status
    if (response.emails_sent) {
      const emailIcons = [];
      if (response.emails_sent.user) emailIcons.push('✓ User email');
      else emailIcons.push('✗ User email');

      if (response.emails_sent.admin) emailIcons.push('✓ Admin email');
      else emailIcons.push('✗ Admin email');

      message += `<br><small>${emailIcons.join(' | ')}</small>`;
    }

    this.toast.success(message, title, {
      timeOut: 5000,
      progressBar: true,
      closeButton: true,
      positionClass: 'toast-top-right',
      enableHtml: true,
      tapToDismiss: true
    });
  }

  /**
   * Show error toast
   */
  private showErrorToast(message: string, title: string = 'Error'): void {
    this.toast.error(message, title, {
      timeOut: 5000,
      progressBar: true,
      closeButton: true,
      positionClass: 'toast-top-right',
      enableHtml: false,
      tapToDismiss: true
    });
  }

  // Get loading text based on state
  get loadingText(): string {
    if (this.hasError) {
      return 'Failed to load Contactus Form';
    }
    else if (this.isSubmitting) {
      return 'Please wait while the form is being submitted...';
    }
    else if (this.isLoading) {
      return 'Loading contactus form, please wait...';
    }
    else{
      return 'Contactus Form';
    }
  }
}
