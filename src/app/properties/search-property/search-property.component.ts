// search-property.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { NgxSpinnerService } from "ngx-spinner";
import { FormBuilder, FormGroup } from '@angular/forms';
import { SearchStateService } from 'src/app/shared/services/search-state.service';
import { GoogleMapsService, PlacePrediction, PlaceDetails } from 'src/app/shared/services/google-maps.service';
import { Subject, from } from 'rxjs';
import { debounceTime, filter, switchMap, takeUntil, catchError, tap, map, distinctUntilChanged } from 'rxjs/operators';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router'; // Add this import
import { NgbDateStruct, NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-search-property',
  templateUrl: './search-property.component.html',
  styleUrls: ['./search-property.component.scss']
})
export class SearchPropertyComponent implements OnInit, OnDestroy {
  // ========== FORM PROPERTIES ==========
  searchForm: FormGroup;

  // ========== GOOGLE PLACES PROPERTIES ==========
  @ViewChild('destinationInput', { static: false }) destinationInput!: ElementRef<HTMLInputElement>;
  placePredictions: PlacePrediction[] = [];
  showPredictions = false;
  selectedPredictionIndex = -1;
  /** Set when user selects from Places dropdown; prevents blur from overwriting with basic location. */

  private lastSelectedPlaceAddress: string | null = null;
  private destroy$ = new Subject<void>();

  // DATEPICKER
  @ViewChild('searchCalendarInput', { static: false }) searchCalendarInput!: ElementRef<HTMLInputElement>;
  @ViewChild('searchDp') searchDp!: NgbInputDatepicker;
  searchFromDate: NgbDateStruct | null = null;
  searchToDate: NgbDateStruct | null = null;
  hoveredDate: NgbDateStruct | null = null;

  // ========== DROPDOWN OPTIONS ==========
  readonly bedroomOptions = [
    { value: 0, label: 'BEDROOMS' },
    { value: 1, label: '1+' },
    { value: 2, label: '2+' },
    { value: 3, label: '3+' },
    { value: 4, label: '4+' },
    { value: 5, label: '5+' },
    { value: 6, label: '6+' },
    { value: 7, label: '7+' },
    { value: 8, label: '8+' },
    { value: 9, label: '9+' },
    { value: 10, label: '10+' },
    { value: 11, label: '11+' },
    { value: 12, label: '12+' },
    { value: 13, label: '13+' },
    { value: 14, label: '14+' },
    { value: 15, label: '15+' }
  ];

  readonly guestOptions = [
    { value: 0, label: 'GUESTS' },
    { value: 1, label: '1+' },
    { value: 2, label: '2+' },
    { value: 3, label: '3+' },
    { value: 4, label: '4+' },
    { value: 5, label: '5+' },
    { value: 6, label: '6+' },
    { value: 7, label: '7+' },
    { value: 8, label: '8+' },
    { value: 9, label: '9+' },
    { value: 10, label: '10+' },
    { value: 11, label: '11+' },
    { value: 12, label: '12+' },
    { value: 13, label: '13+' },
    { value: 14, label: '14+' },
    { value: 15, label: '15+' }
  ];

  constructor(
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private searchState: SearchStateService,
    private googleMapsService: GoogleMapsService,
    private route: ActivatedRoute
  ) {
    // Initialize reactive form with default values
    this.searchForm = this.fb.group({
      destination: [''],
      searchCalender: [''],
      bedrooms: [0],
      guests: [0]
    });
  }

  // ========== LIFECYCLE HOOKS ==========
  ngOnInit(): void {
    // Set up Google Places autocomplete subscription
    this.setupDestinationInputSubscription();

    //Set up bedrooms/guests change listeners
    this.setupNumericFiltersSubscription();

    // Initialize form with current search state (if any)
    this.initializeFormFromState();

    // Sync bedrooms dropdown when state changes (e.g. from advanced-search Apply)
    this.syncBedroomsFromState();

    // Check for URL parameters
    this.initializeFromUrl();

     // Note: PropertyListComponent subscribes to state$ and calls the API; no duplicate search here.
  }

  /**
   * Initialize search from URL parameters (for bookmarking/sharing)
   */
  private initializeFromUrl(): void {
    this.route.queryParams.subscribe(params => {
      if (Object.keys(params).length > 0) {
        console.log('🔍 URL Parameters detected:', params);
        this.searchState.initializeFromUrlParams(params);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== FORM INITIALIZATION ==========
  /**
   * Sync form with current search state from SearchStateService
   * This ensures form reflects any pre-existing filters
   */
  private initializeFormFromState(): void {
    const state = this.searchState.currentState;

    // Set bedroom filter: state.minBedrooms (undefined → 0 for "BEDROOMS" / Any)
    this.searchForm.patchValue({ bedrooms: state.minBedrooms ?? 0 }, { emitEvent: false });

    // Set guest filter if exists
    if (state.minGuests) {
      this.searchForm.patchValue({ guests: state.minGuests }, { emitEvent: false });
    }

    // 🔥 Set date range if exists
    if (state.checkIn && state.checkOut) {
      const checkIn = new Date(state.checkIn);
      const checkOut = new Date(state.checkOut);

      this.searchFromDate = {
        year: checkIn.getFullYear(),
        month: checkIn.getMonth() + 1,
        day: checkIn.getDate()
      };

      this.searchToDate = {
        year: checkOut.getFullYear(),
        month: checkOut.getMonth() + 1,
        day: checkOut.getDate()
      };

      this.updateSearchCalendarField();
    }
    // Note: Location is handled separately via structured object
    // We don't set destination text from state to avoid sync issues
  }

  // ========== GOOGLE PLACES AUTCOMPLETE ==========
  /**
   * Sets up reactive subscription for destination input changes
   * Triggers Google Places API calls with debounce
   */
  private setupDestinationInputSubscription(): void {
    const destinationControl = this.searchForm.get('destination');
    if (!destinationControl) return;

    destinationControl.valueChanges
      .pipe(
        debounceTime(300), // Wait 300ms after user stops typing
        tap(() => this.selectedPredictionIndex = -1), // Reset selection
        filter((value: string | null): value is string => {
          // Show predictions only for valid inputs
          if (!value || value.trim().length < 2) {
            this.hidePredictions();
            return false;
          }
          return true;
        }),
        switchMap((value: string) => {
          // Get predictions from Google Places API
          return from(this.getPlacePredictions(value.trim())).pipe(
            catchError((error) => {
              console.error('Error getting place predictions:', error);
              this.hidePredictions();
              return of(null);
            })
          );
        }),
        takeUntil(this.destroy$) // Clean up on component destroy
      )
      .subscribe();
  }

  /**
   * Loads Google Maps API on demand when user interacts with destination field
   * This prevents unnecessary API loading until actually needed
   */
  async onDestinationFocus(): Promise<void> {
    if (!this.googleMapsService.isApiLoaded()) {
      try {
        await this.googleMapsService.loadGoogleMaps();
      } catch (error) {
        console.error('Failed to load Google Maps API:', error);
      }
    }
  }

  /**
   * Fetches place predictions from Google Places API
   * @param input User's typed destination input
   */
  private async getPlacePredictions(input: string): Promise<void> {
    // Ensure Google Maps API is loaded
    if (!this.googleMapsService.isApiLoaded()) {
      await this.onDestinationFocus();
    }

    try {
      const predictions = await this.googleMapsService.getPlacePredictions(input);
      this.placePredictions = predictions;
      this.showPredictions = predictions.length > 0;
    } catch (error) {
      console.error('Error getting place predictions:', error);
      this.hidePredictions();
    }
  }

  /**
   * Handles user selection from place predictions dropdown
   * Gets full place details and updates search state
   */
  async onPlaceSelected(prediction: PlacePrediction): Promise<void> {
    this.hidePredictions();

    try {
      // Get structured place details (city, state, coordinates, etc.)
      const placeDetails = await this.googleMapsService.getPlaceDetails(prediction.place_id);

      // Update form with formatted address (visual only)
      this.searchForm.get('destination')?.setValue(placeDetails.formatted_address, { emitEvent: false });

      // Remember we selected from dropdown so blur does not overwrite with basic location

      this.lastSelectedPlaceAddress = placeDetails.formatted_address;

      // Update search state with structured location data
      this.updateSearchStateWithLocation(placeDetails);

    } catch (error) {
      console.error('Error getting place details:', error);
      // Fallback: use prediction description as text
      this.searchForm.get('destination')?.setValue(prediction.description, { emitEvent: false });
      this.lastSelectedPlaceAddress = prediction.description;
      this.updateSearchStateWithBasicLocation(prediction.description);
    }
  }

  /**
   * Updates SearchStateService with structured location data from Google Places
   */
  private updateSearchStateWithLocation(placeDetails: PlaceDetails): void {
    const locationData = {
      text: placeDetails.formatted_address,
      city: placeDetails.city || '',
      state: placeDetails.state || '',
      country: placeDetails.country || '',
      latitude: placeDetails.latitude ?? undefined,
      longitude: placeDetails.longitude ?? undefined,
      placeId: placeDetails.place_id || undefined
    };

    this.searchState.updateLocation(locationData);
  }

  /**
   * Updates SearchStateService with basic location when full details aren't available
   */
  private updateSearchStateWithBasicLocation(text: string): void {
    const locationData = {
      text: text,
      city: '',
      state: '',
      country: '',
      latitude: undefined,
      longitude: undefined,
      placeId: undefined
    };

    this.searchState.updateLocation(locationData);
  }

  /**
   * Update SearchStateService with selected date range
   */
  private updateDateRangeInState(): void {
    if (this.searchFromDate && this.searchToDate) {
      const checkIn = new Date(
        this.searchFromDate.year,
        this.searchFromDate.month - 1,
        this.searchFromDate.day
      );
      const checkOut = new Date(
        this.searchToDate.year,
        this.searchToDate.month - 1,
        this.searchToDate.day
      );

      this.searchState.updateDates(checkIn, checkOut);
    } else {
      this.searchState.updateDates(undefined, undefined);
    }
  }

  /**
   * Handles keyboard navigation in predictions dropdown
   */
  onDestinationKeyDown(event: KeyboardEvent): void {
    if (!this.showPredictions || this.placePredictions.length === 0) return;

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

  /**
   * Hides predictions dropdown when user clicks outside.
   * Only update state with basic location when user typed manually (did not select from dropdown).
   * If they selected from dropdown, lastSelectedPlaceAddress matches and we skip to avoid overwriting city/state/lat/long.
   */

  onDestinationBlur(): void {
   setTimeout(() => {
      this.hidePredictions();

      const destinationValue = (this.searchForm.get('destination')?.value ?? '').trim();
      if (!destinationValue) {
        this.lastSelectedPlaceAddress = null;
        return;
      }
      // Do not overwrite structured location when user just selected from Places dropdown
      if (destinationValue === this.lastSelectedPlaceAddress) {
        return;
      }
      // User typed manually (or changed the field after selection) — update state with text only
      this.updateSearchStateWithBasicLocation(destinationValue);
      this.lastSelectedPlaceAddress = null;
    }, 200);
  }

  /**
   * Hides predictions dropdown and resets selection
   */
  private hidePredictions(): void {
    this.showPredictions = false;
    this.placePredictions = [];
    this.selectedPredictionIndex = -1;
  }

  // ==========================
  // DATEPICKER RANGE HANDLING
  // ==========================
  private getActiveDateForCalendar(): NgbDateStruct {
    if (this.searchFromDate) {
      return this.searchFromDate;
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
  }

  openCalendar(): void {
    if (!this.searchDp) return;

    // Determine the date to navigate to: start of range or today
    const activeDate = this.searchFromDate || this.getTodayDate();

    // Update the input field with the full range
    this.updateSearchCalendarField();

    // Open the calendar first
    this.searchDp.open();

    // Delay slightly to ensure calendar is rendered, then navigate
    setTimeout(() => {
      this.searchDp.navigateTo(activeDate);
    }, 0);
  }


  /** Utility to get today's date in NgbDateStruct */
  private getTodayDate(): NgbDateStruct {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
  }

  onSearchDateSelect(date: NgbDateStruct): void {
    if (!this.searchFromDate || (this.searchFromDate && this.searchToDate)) {
      // Start new range
      this.searchFromDate = date;
      this.searchToDate = null;
      this.hoveredDate = null;
    } else if (this.isAfter(date, this.searchFromDate)) {
      // Complete the range
      this.searchToDate = date;
      this.hoveredDate = null;
      this.searchDp.close();
      // 🔥 UPDATE SEARCH STATE IMMEDIATELY
      this.updateDateRangeInState();
    } else {
      // Picked earlier date: reset start
      this.searchFromDate = date;
      this.hoveredDate = null;
    }

    this.updateSearchCalendarField();
  }

  onDayHover(date: NgbDateStruct): void {
    this.hoveredDate = date;
  }

  onDayHoverLeave(): void {
    this.hoveredDate = null;
  }

  private isBefore(a: NgbDateStruct, b: NgbDateStruct): boolean {
    return new Date(a.year, a.month - 1, a.day) < new Date(b.year, b.month - 1, b.day);
  }

  private isInHoverMode(): boolean {
    return !!(
      this.searchFromDate &&
      !this.searchToDate &&
      this.hoveredDate &&
      !this.isBefore(this.hoveredDate, this.searchFromDate) &&
      !this.isSame(this.hoveredDate, this.searchFromDate)
    );
  }

  isHoverRangeStart(date: NgbDateStruct): boolean {
    return this.isInHoverMode() && !!this.searchFromDate && this.isSame(date, this.searchFromDate);
  }

  isHoverRangeEnd(date: NgbDateStruct): boolean {
    return this.isInHoverMode() && !!this.hoveredDate && this.isSame(date, this.hoveredDate);
  }

  isInHoverRange(date: NgbDateStruct): boolean {
    if (!this.isInHoverMode() || !this.searchFromDate || !this.hoveredDate) return false;
    const d = new Date(date.year, date.month - 1, date.day);
    const from = new Date(this.searchFromDate.year, this.searchFromDate.month - 1, this.searchFromDate.day);
    const to = new Date(this.hoveredDate.year, this.hoveredDate.month - 1, this.hoveredDate.day);
    return d > from && d < to;
  }

  isRangeStart(date: NgbDateStruct): boolean {
    return !!this.searchFromDate && this.isSame(date, this.searchFromDate) && !this.isHoverRangeStart(date);
  }

  isRangeEnd(date: NgbDateStruct): boolean {
    return !!this.searchToDate && this.isSame(date, this.searchToDate);
  }

  private updateSearchCalendarField(): void {
    let value = '';

    if (this.searchFromDate && this.searchToDate) {
      value = `${this.formatDate(this.searchFromDate)} - ${this.formatDate(this.searchToDate)}`;
    } else if (this.searchFromDate) {
      value = `${this.formatDate(this.searchFromDate)}`;
    }

    // Update form control
    this.searchForm.get('searchCalender')?.setValue(value);

    // Update the visible input
    if (this.searchCalendarInput) {
      this.searchCalendarInput.nativeElement.value = value;
    }
  }

  private formatDate(d: NgbDateStruct): string {
    return `${String(d.month).padStart(2, '0')}/${String(d.day).padStart(2, '0')}/${d.year}`;
  }

  private isAfter(a: NgbDateStruct, b: NgbDateStruct): boolean {
    return new Date(a.year, a.month - 1, a.day) >
      new Date(b.year, b.month - 1, b.day);
  }

  isSearchInRange(date: NgbDateStruct): boolean {
    return !!(
      this.searchFromDate &&
      this.searchToDate &&
      new Date(date.year, date.month - 1, date.day) >= new Date(this.searchFromDate.year, this.searchFromDate.month - 1, this.searchFromDate.day) &&
      new Date(date.year, date.month - 1, date.day) <= new Date(this.searchToDate.year, this.searchToDate.month - 1, this.searchToDate.day)
    );
  }

  private isSame(a: NgbDateStruct | null, b: NgbDateStruct | null): boolean {
    return !!a && !!b && a.year === b.year && a.month === b.month && a.day === b.day;
  }

  isPastDate(date: NgbDateStruct): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date.year, date.month - 1, date.day) < today;
  }

  // ========== FORM ACTIONS ==========
  /**
   * Handles form submission - updates search state with all form values
   */
  onSubmit(): void {
    // Sync dates if both selected
    if (this.searchFromDate && this.searchToDate) {
      this.updateDateRangeInState();
    }

    // Sync destination if user typed and didn't blur
    const dest = (this.searchForm.get('destination')?.value ?? '').trim();
    if (dest && dest !== this.lastSelectedPlaceAddress) {
      this.updateSearchStateWithBasicLocation(dest);
    }

    this.searchState.updatePagination(1);
    this.spinner.show();
  }

  /**
   * Resets form and clears all search filters.
   * Uses resetAll() for a single state emission (one API call).
   */
  onReset(): void {
    // Reset form with emitEvent: false to prevent valueChanges from firing multiple state updates
    this.searchForm.reset(
      {
        destination: '',
        searchCalender: '',
        bedrooms: 0,
        guests: 0
      },
      { emitEvent: false }
    );

    // Reset date picker values (component state)
    this.searchFromDate = null;
    this.searchToDate = null;
    this.hoveredDate = null;

    // Clear Google Places predictions and "selected from dropdown" flag
    this.lastSelectedPlaceAddress = null;
    this.hidePredictions();

    // Single state reset → one API call
    this.searchState.resetAll();
  }

  /**
   * Sets up reactive subscriptions for bedrooms and guests dropdowns
   * Updates SearchStateService immediately when values change
   */
  private setupNumericFiltersSubscription(): void {
    // Bedrooms change listener
    this.searchForm.get('bedrooms')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: number) => {
        this.updateBedroomsInState(value);
      });

    // Guests change listener
    this.searchForm.get('guests')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: number) => {
        this.updateGuestsInState(value);
      });
  }

  /**
   * Subscribe to state$ and keep bedrooms dropdown in sync when state changes
   * (e.g. when user uses + / - in advanced-search and clicks Apply Filter)
   */
  private syncBedroomsFromState(): void {
    this.searchState.state$
      .pipe(
        map(state => state.minBedrooms ?? 0),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.searchForm.patchValue({ bedrooms: value }, { emitEvent: false });
      });
  }

  /**
   * Update SearchStateService with bedrooms value
   */
  private updateBedroomsInState(value: number): void {
    if (value > 0) {
      this.searchState.updateNumericFilter('minBedrooms', value);
    } else {
      this.searchState.updateNumericFilter('minBedrooms', undefined);
    }
  }

  /**
   * Update SearchStateService with guests value
   */
  private updateGuestsInState(value: number): void {
    if (value > 0) {
      this.searchState.updateNumericFilter('minGuests', value);
    } else {
      this.searchState.updateNumericFilter('minGuests', undefined);
    }
  }

  // ========== UTILITY METHODS ==========
  /**
   * TrackBy function for Angular ngFor optimization
   * Uses unique place_id for better rendering performance
   */
  trackByPlaceId(index: number, prediction: PlacePrediction): string {
    return prediction.place_id;
  }
}
