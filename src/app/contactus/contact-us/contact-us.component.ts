import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { LoadSpinnerService } from 'src/app/shared/services/load-spinner.service';
import { StorageService } from 'src/app/shared/services/storage.service';
import { CrudService } from "src/app/shared/services/crud.service";
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';
import { GoogleMapsService, PlacePrediction } from 'src/app/shared/services/google-maps.service';
import { Subject, from } from 'rxjs';
import { debounceTime, filter, switchMap, takeUntil, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

// Interfaces
import { ContactUSFormData, ContactUSApiResponse } from 'src/app/shared/interfaces/contact-form.interface';

// Add this import if not already imported
// import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})
export class ContactUsComponent implements OnInit, AfterViewInit, OnDestroy {
  contactForm: FormGroup;

  isSmsConsentCollapsed = true;
  isEmailConsentCollapsed = true;

  isLoading = false;
  hasError = false;
  errorMessage = '';
  isSubmitting = false;
  isSpinnerVisible = false;

  //accommodation type options array
  accommodationOptions = [
    { value: 'Private Home', label: 'Private Home' },
    { value: 'Condo', label: 'Condo' },
    { value: 'Resort', label: 'Resort' },
    { value: 'Villa', label: 'Villa' }
  ];

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

  // Datepicker configurations - CHANGED theme-blue to theme-default
  bsConfig = {
    dateInputFormat: 'MM/DD/YYYY',
    containerClass: 'theme-default', // Changed from theme-blue
    showWeekNumbers: false,
    isAnimated: true,
    adaptivePosition: true,
    customTodayClass: 'custom-today-class',
    showClearButton: true,
    displayMonths: 1
  };

  departureConfig = {
    dateInputFormat: 'MM/DD/YYYY',
    containerClass: 'theme-default', // Changed from theme-blue
    showWeekNumbers: false,
    isAnimated: true,
    adaptivePosition: true,
    customTodayClass: 'custom-today-class',
    showClearButton: true,
    displayMonths: 1
  };

  // Track arrival date for minDate logic
  arrivalDate: Date | null = null;
  departureMinDate: Date | undefined = undefined;

  // Google Places Autocomplete
  @ViewChild('destinationInput', { static: false }) destinationInput!: ElementRef<HTMLInputElement>;
  placePredictions: PlacePrediction[] = [];
  showPredictions = false;
  selectedPredictionIndex = -1;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private crudService: CrudService,
    private storageService: StorageService,
    private toast: ToastrService,
    private loadSpinner: LoadSpinnerService,
    private localeService: BsLocaleService,
    private googleMapsService: GoogleMapsService
  ) {
    this.contactForm = this.createForm();
    this.localeService.use('en-gb');
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.loadSpinner.show();
    this.setupDestinationInputSubscription();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.isLoading = false;
      this.loadSpinner.hide();
    }, 200);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDestinationInputSubscription(): void {
    const destinationControl = this.contactForm.get('desDestination');
    if (!destinationControl) {
      return;
    }

    destinationControl.valueChanges
      .pipe(
        debounceTime(300),
        tap(() => this.selectedPredictionIndex = -1),
        filter((value: string | null): value is string => {
          if (!value || value.trim().length < 2) {
            this.placePredictions = [];
            this.showPredictions = false;
            return false;
          }
          return true;
        }),
        switchMap((value: string) => {
          return from(this.getPlacePredictions(value.trim())).pipe(
            catchError((error) => {
              console.error('Error getting place predictions:', error);
              this.placePredictions = [];
              this.showPredictions = false;
              return of(null);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  // ========== GOOGLE PLACES AUTCOMPLETE METHODS ==========

  // Load Google Maps API on demand when user focuses/clicks on input
  async onDestinationFocus(): Promise<void> {
    if (!this.googleMapsService.isApiLoaded()) {
      try {
        await this.googleMapsService.loadGoogleMaps();
      } catch (error) {
        console.error('Failed to load Google Maps API:', error);
      }
    }
  }

  // Get place predictions from Google Places API
  private async getPlacePredictions(input: string): Promise<void> {
    if (!this.googleMapsService.isApiLoaded()) {
      await this.onDestinationFocus();
    }

    try {
      const predictions = await this.googleMapsService.getPlacePredictions(input);
      this.placePredictions = predictions;
      this.showPredictions = predictions.length > 0;
    } catch (error) {
      console.error('Error getting place predictions:', error);
      this.placePredictions = [];
      this.showPredictions = false;
    }
  }

  // Handle selection of a place from predictions
  async onPlaceSelected(prediction: PlacePrediction): Promise<void> {
    // Hide predictions immediately
    this.hidePredictions();
    
    try {
      const placeDetails = await this.googleMapsService.getPlaceDetails(prediction.place_id);
      // Set value without emitting event to prevent dropdown from reappearing
      this.contactForm.get('desDestination')?.setValue(placeDetails.formatted_address, { emitEvent: false });
      this.contactForm.get('desDestination')?.markAsTouched();
    } catch (error) {
      console.error('Error getting place details:', error);
      this.contactForm.get('desDestination')?.setValue(prediction.description, { emitEvent: false });
    }
  }

  // Hide predictions dropdown (reusable method)
  private hidePredictions(): void {
    this.showPredictions = false;
    this.placePredictions = [];
    this.selectedPredictionIndex = -1;
  }

  // Handle keyboard navigation
  onDestinationKeyDown(event: KeyboardEvent): void {
    if (!this.showPredictions || this.placePredictions.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedPredictionIndex = Math.min(
          this.selectedPredictionIndex + 1,
          this.placePredictions.length - 1
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedPredictionIndex = Math.max(this.selectedPredictionIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedPredictionIndex >= 0 && this.selectedPredictionIndex < this.placePredictions.length) {
          this.onPlaceSelected(this.placePredictions[this.selectedPredictionIndex]);
        }
        break;
      case 'Escape':
        this.hidePredictions();
        break;
    }
  }

  // Handle click outside to close predictions
  onDestinationBlur(): void {
    setTimeout(() => {
      this.hidePredictions();
      this.markFieldAsTouched('desDestination');
    }, 200);
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Required fields
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9]{10,12}$/)]],
      desDestination: [''],
      arrival: [''],
      departure: [''],
      totalGuests: ['1', [Validators.required, Validators.min(1)]],
      budgets: [''],
      // accomTypeSelect: ['', Validators.required],
      accomTypeSelect: this.fb.array([], Validators.required),

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
    if (date) {
      this.arrivalDate = date;
      this.departureMinDate = date;

      // Clear departure if invalid
      const departureDate = this.contactForm.get('departure')?.value;
      if (departureDate && new Date(departureDate) < date) {
        this.contactForm.patchValue({ departure: null });
      }
    } else {
      this.departureMinDate = undefined;
      this.arrivalDate = null;
    }
  }

  // Handle manual date input
  onArrivalBlur(): void {
    const arrivalDate = this.contactForm.get('arrival')?.value;
    if (arrivalDate) {
      this.onArrivalDateChange(new Date(arrivalDate));
    }
  }

  // Validate departure date
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
    this.departureMinDate = undefined;
    this.arrivalDate = null;
  }

  clearDepartureDate(): void {
    this.contactForm.patchValue({ departure: null });
  }

// Add method to handle accommodation type selection
  onAccommodationTypeChange(event: any, value: string): void {
    const accomArray = this.contactForm.get('accomTypeSelect') as FormArray;

    if (event.target.checked) {
      // Add the value to the array
      accomArray.push(this.fb.control(value));
    } else {
      // Remove the value from the array
      const index = accomArray.controls.findIndex(x => x.value === value);
      if (index >= 0) {
        accomArray.removeAt(index);
      }
    }
  }

  // Check if an accommodation type is selected
  isAccommodationSelected(value: string): boolean {
    const accomArray = this.contactForm.get('accomTypeSelect') as FormArray;
    return accomArray.controls.some(control => control.value === value);
  }

  // Get selected accommodation types as a string for display
  getSelectedAccommodations(): string {
    const accomArray = this.contactForm.get('accomTypeSelect') as FormArray;
    return accomArray.value.join(', ');
  }

  // Clear all accommodation selections
  clearAccommodationSelections(): void {
    const accomArray = this.contactForm.get('accomTypeSelect') as FormArray;
    while (accomArray.length !== 0) {
      accomArray.removeAt(0);
    }
  }

  // Update the validation for accommodation type
  isAccommodationTypeInvalid(): boolean {
    const field = this.contactForm.get('accomTypeSelect');
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  getAccommodationTypeError(): string {
    const field = this.contactForm.get('accomTypeSelect');
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return 'Please select at least one accommodation type';
    }
    return '';
  }


  onSubmit(): void {
    this.validateDepartureDate();

    if (this.contactForm.invalid) {
      this.showErrorToast('Please enter valid values for all required fields', 'Missing Required Fields');
      this.markFormGroupTouched(this.contactForm);
      return;
    }

    this.isSpinnerVisible = true;
    this.isLoading = true;
    this.isSubmitting = true;

    this.loadSpinner.show();

    const loadingToast = this.toast.info('Submitting contact form data...', '', {
      disableTimeOut: true,
      closeButton: false
    });

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
      // accomType: [this.contactForm.value.accomTypeSelect],
      accomType: this.contactForm.value.accomTypeSelect || [],
      checkArray: this.contactForm.value.checkArray || [],
      checkArray2: this.contactForm.value.checkArray2 || []
    };

    this.crudService.submitContactForm(formData).subscribe({
      next: (response: ContactUSApiResponse) => {
        this.handleSubmissionComplete();
        this.toast.clear(loadingToast.toastId);
        this.handleApiResponse(response);
      },
      error: (error: Error) => {
        this.handleSubmissionComplete();
        this.toast.clear(loadingToast.toastId);
        this.handleError(error);
      }
    });
  }

  resetForm(showToast: boolean = true): void {
    // Reset form values
    this.contactForm.reset({
      totalGuests: '1',
      adults: '1',
      kids: '0',
      babies: '0',
      rooms: '1',
      proximity: 'Not applicable'
    });

    // Clear checkbox arrays
    this.clearFormArray(this.contactForm.get('checkArray') as FormArray);
    this.clearFormArray(this.contactForm.get('checkArray2') as FormArray);

    // NEW: Clear accommodation type array
    this.clearFormArray(this.contactForm.get('accomTypeSelect') as FormArray);

    // Reset component state
    this.isLoading = false;
    this.hasError = false;
    this.errorMessage = '';
    this.isSpinnerVisible = false;
    this.isSubmitting = false;

    // Reset form state
    this.contactForm.markAsPristine();
    this.contactForm.markAsUntouched();

    // Reset datepicker state
    this.arrivalDate = null;
    this.departureMinDate = undefined;

    if (showToast) {
      this.toast.info('Form has been reset', 'Reset Complete', {
        timeOut: 2000,
        progressBar: true,
        closeButton: true
      });
    }
  }

  // Helper methods
  private formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  private clearFormArray(formArray: FormArray): void {
    while (formArray.length !== 0) {
      formArray.removeAt(0);
    }
  }

  private handleSubmissionComplete(): void {
    this.isSubmitting = false;
    this.isLoading = false;
    this.isSpinnerVisible = false;
    this.loadSpinner.hide();
  }

  // Checkbox handling
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

  isCheckboxChecked(controlName: string, value: string): boolean {
    const formArray = this.contactForm.get(controlName) as FormArray;
    return formArray?.controls.some(control => control.value === value) || false;
  }

  // Form validation
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  markFieldAsTouched(fieldName: string): void {
    this.contactForm.get(fieldName)?.markAsTouched();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      switch(fieldName) {
        case 'firstName': return 'First name is required';
        case 'lastName': return 'Last name is required';
        case 'email': return 'Email address is required';
        case 'totalGuests': return 'Total guests is required';
        case 'accomTypeSelect': return 'Accommodation type preference is required';
        default: return 'This field is required';
      }
    }

    if (field.errors['email']) return 'Please enter a valid email address';
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters required`;
    if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;

    if (field.errors['pattern'] && fieldName === 'phone') {
      return 'Phone number must be 10-12 digits (numbers only)';
    }

    if (field.errors['dateRange']) {
      return field.errors['dateRange'];
    }

    return '';
  }

  // Test submission
  testSubmit(): void {
    this.isSpinnerVisible = true;
    this.loadSpinner.show();

    const loadingToast = this.toast.info('Submitting test data...', '', {
      disableTimeOut: true,
      closeButton: false
    });

    const testData: ContactUSFormData = {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
      phone: "5551234567",
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
      addNotes: "We are celebrating our anniversary and would like a room with ocean view."
    };

    this.crudService.submitContactForm(testData).subscribe({
      next: (response: ContactUSApiResponse) => {
        this.loadSpinner.hide();
        this.isSpinnerVisible = false;
        this.toast.clear(loadingToast.toastId);
        this.handleApiResponse(response);
      },
      error: (error: Error) => {
        this.loadSpinner.hide();
        this.isSpinnerVisible = false;
        this.toast.clear(loadingToast.toastId);
        this.handleError(error);
      }
    });
  }

  // API response handling
  private handleApiResponse(response: ContactUSApiResponse): void {
    if (response.status === 'success') {
      this.showSuccessToast(response);
      setTimeout(() => {
        this.resetForm(false);
      }, 2000);
    } else {
      this.showErrorToast(
        response.message || 'An error occurred while submitting the form.',
        'Submission Failed'
      );
    }
  }

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
  }

  private showSuccessToast(response: ContactUSApiResponse): void {
    let message = `<strong>${response.message}</strong>`;

    if (response.inquiry_id) {
      message += `<br><small>Reference ID: ${response.inquiry_id}</small>`;
    }

    if (response.emails_sent) {
      const emailStatus = [];
      if (response.emails_sent.user) emailStatus.push('✓ User email');
      else emailStatus.push('✗ User email');

      if (response.emails_sent.admin) emailStatus.push('✓ Admin email');
      else emailStatus.push('✗ Admin email');

      message += `<br><small>${emailStatus.join(' | ')}</small>`;
    }

    this.toast.success(message, 'Success! ✓', {
      timeOut: 5000,
      progressBar: true,
      closeButton: true,
      positionClass: 'toast-top-right',
      enableHtml: true,
      tapToDismiss: true
    });
  }

  private showErrorToast(message: string, title: string = 'Error'): void {
    this.toast.error(message, title, {
      timeOut: 5000,
      progressBar: true,
      closeButton: true,
      positionClass: 'toast-top-right',
      tapToDismiss: true
    });
  }

  get loadingText(): string {
    if (this.hasError) return 'Failed to load Contact Form';
    if (this.isSubmitting) return 'Please wait while the form is being submitted...';
    if (this.isLoading) return 'Loading contact form, please wait...';
    return 'Contact Form';
  }
}
