import {
  Component,
  OnInit,
  HostListener,
  AfterViewInit,
  ViewChild,
  ViewChildren,
  QueryList,
  ElementRef,
  NgZone,
  Inject,
  PLATFORM_ID,
  OnDestroy
} from "@angular/core";
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { CrudService, BannerImage } from 'src/app/shared/crud.service';
import { GoogleMapsService, PlacePrediction } from '../../services/google-maps.service';

declare const google: any;
// Add interface for location data
export interface LocationData {
  city: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  placeId?: string;
  zipCode?: string; // Add if you need postal code
}

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss']
})
export class BannerComponent implements OnInit, AfterViewInit, OnDestroy {
  placeholderImage = 'assets/website_images/home/banner/placeholder.webp';

  slides: string[] = [];
  activeSlideIndex = 0;
  slideDuration = 9000; // Slide interval
  isPaused = false;

  // Track which slides are loaded
  loadedSlides: boolean[] = [];
  isApiLoaded = false; // track if API data has arrived

  kenBurnsClasses = [
    'kb-zoom-in-left',
    'kb-zoom-in-right',
    'kb-zoom-in-top',
    'kb-zoom-in-bottom'
  ];

  slideAnimations: string[] = [];

  // Swipe support
  touchStartX = 0;
  touchEndX = 0;
  private sliderInterval: any;

  @ViewChildren('kbSlide') slideElements!: QueryList<ElementRef>;
  @ViewChild('cityInput', { static: false }) cityInput!: ElementRef;

  // Google Places Autocomplete properties
  isLoadingAutocomplete = false;
  showPredictions = false;
  placePredictions: PlacePrediction[] = [];
  selectedCityName = '';

  searchForm: FormGroup;
  private destroy$ = new Subject<void>();
  private searchInput$ = new Subject<string>();

  // Update component properties
  selectedLocation: LocationData | null = null;

  // Track loading states
  private scriptLoaded = false;
  private delayedLoadTimeout: any;
  private userInteractedBeforeDelay= false;

  private isDelayedLoadInProgress = false;

  constructor(
    private ngZone: NgZone,
    private fb: FormBuilder,
    private router: Router,
    private toast: ToastrService,
    private crudService: CrudService,
    private googleMapsService: GoogleMapsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.searchForm = this.fb.group({
      City: ['']
    });
  }

  ngOnInit(): void {
    this.fetchSlides();
    // Setup search input stream with debounce
    this.setupSearchStream();

    // Start delayed loading (3 seconds after page load)
    this.startDelayedLoading();
  }

  ngAfterViewInit() {
    this.setupCityInput();
  }

  ngOnDestroy() {
    clearInterval(this.sliderInterval);
    clearTimeout(this.delayedLoadTimeout); // Clear the timeout
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   *
   * How It Works:
   * Scenario 1: User doesn't interact for 3 seconds
   *
   *     Page loads → Timer starts (3 seconds)
   *
   *     After 3 seconds → Google Maps loads automatically
   *
   *     User clicks input later → Script already loaded, ready to use
   *
   * Scenario 2: User interacts before 3 seconds
   *
   *     Page loads → Timer starts (3 seconds)
   *
   *     User clicks/taps/inputs before 3 seconds → Timer cancelled
   *
   *     Google Maps loads immediately
   *
   *     Autocomplete works right away
   *
   * Scenario 3: Script already loaded
   *
   *     Any interaction → Uses already loaded script
   *
   *     No duplicate loading
   *
   * Benefits:
   *
   *     Better performance - Delays non-critical third-party script
   *
   *     Good UX - Script loads before user might need it
   *
   *     Fallback - User interaction overrides the delay
   *
   *     No duplicate loads - Smart state management
   *
   */


  // ========== GOOGLE MAPS LOADING STRATEGY ==========
  private startDelayedLoading() {
    // Clear any existing timeout
    if (this.delayedLoadTimeout) {
      clearTimeout(this.delayedLoadTimeout);
    }

    // Set 3-second delayed load
    this.delayedLoadTimeout = setTimeout(() => {
      console.log('⏰ Loading Google Maps after 3-second delay...');
      this.isDelayedLoadInProgress = true;
      this.loadGoogleMapsIfNotLoaded();
    }, 3000); // 3 seconds
  }

  private loadCallId = 0;
  private loadGoogleMapsIfNotLoaded() {
    // Guard against multiple calls
    if (this.scriptLoaded) return;

    const callId = ++this.loadCallId;
    console.log(`🔍 loadGoogleMapsIfNotLoaded() called #${callId}`, {
      scriptLoaded: this.scriptLoaded,
      userInteracted: this.userInteractedBeforeDelay,
      delayedLoadInProgress: this.isDelayedLoadInProgress
    });

    // Only load if not already loaded, user hasn't interacted, AND delayed load is in progress
    if (!this.scriptLoaded && !this.userInteractedBeforeDelay && this.isDelayedLoadInProgress) {
      console.log(`⏰ [Call #${callId}] Loading Google Maps after 3-second delay...`);
      this.loadGoogleMapsScript();
      this.isDelayedLoadInProgress = false; // Reset flag
    }
    else {
      console.log(`⏹️ [Call #${callId}] Skipping load - conditions not met`);
    }
  }

  private setupSearchStream() {
    this.searchInput$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300), // Wait 300ms after user stops typing
        distinctUntilChanged(), // Only emit if value changed
        switchMap(query => {
          if (!query || query.length < 2) {
            this.placePredictions = [];
            this.showPredictions = false;
            return [];
          }

          // Only fetch predictions if Google Maps is loaded
          if (this.scriptLoaded || this.googleMapsService.isApiLoaded()) {
            return this.fetchPlacePredictions(query);
          }

          return [];
        })
      )
      .subscribe();
  }

  private setupCityInput() {
    const input = this.cityInput?.nativeElement;
    if (!input) return;

    // Track user interaction
    const trackUserInteraction = () => {
      if (!this.userInteractedBeforeDelay) {
        this.userInteractedBeforeDelay = true;
        console.log('👆 User interacted before delay, loading immediately...');

        // Cancel the delayed load
        clearTimeout(this.delayedLoadTimeout);
        this.isDelayedLoadInProgress = false; // Reset flag

        // Load immediately
        if (!this.scriptLoaded) {
          this.loadGoogleMapsScript();
        }
      }
    };

    // Add interaction listeners
    const events = ['focus', 'touchstart', 'input', 'click'];
    events.forEach(event => {
      input.addEventListener(event, trackUserInteraction, { passive: true });
    });

    /*
    let firstInteractionHandled = false;

    const handleFirstInteraction = () => {
      if (!firstInteractionHandled && !this.scriptLoaded) {
        firstInteractionHandled = true;
        console.log('🔄 Loading Google Maps on first user interaction...');
        this.loadGoogleMapsScript();
        this.scriptLoaded = true;

        // Clean up one-time listeners
        input.removeEventListener('focus', handleFirstInteraction);
        input.removeEventListener('touchstart', handleFirstInteraction);
        input.removeEventListener('input', handleFirstKeystroke);
      }
    };

    const handleFirstKeystroke = () => {
      handleFirstInteraction();
    };

    // Set up one-time listeners
    input.addEventListener('focus', handleFirstInteraction);
    input.addEventListener('touchstart', handleFirstInteraction, { passive: true });
    input.addEventListener('input', handleFirstKeystroke);
    */

    // Handle Enter key for predictions (always active)
    input.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' && this.showPredictions && this.placePredictions.length > 0) {
        event.preventDefault();
        if (this.placePredictions[0]) {
          this.selectPrediction(this.placePredictions[0]);
        }
      }
    });
  }

  // Event handler methods for template
  onCityInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;

    // Track user interaction
    if (!this.userInteractedBeforeDelay && value.length > 0) {
      this.userInteractedBeforeDelay = true;
      clearTimeout(this.delayedLoadTimeout);

      if (!this.scriptLoaded) {
        this.loadGoogleMapsScript();
        // this.scriptLoaded = true;
      }
    }

    this.searchInput$.next(value);
  }

  onCityFocus() {
    // Only manage UI, not loading
    // Track user interaction
    if (!this.userInteractedBeforeDelay) {
      this.userInteractedBeforeDelay = true;
      clearTimeout(this.delayedLoadTimeout);

      if (!this.scriptLoaded) {
        this.loadGoogleMapsScript();
      }
    }

    if (this.placePredictions.length > 0) {
      this.showPredictions = true;
    }
  }

  onCityBlur() {
    setTimeout(() => {
      this.showPredictions = false;
    }, 200);
  }

  private async loadGoogleMapsScript() {
    // Prevent multiple loads
    if (this.scriptLoaded || this.googleMapsService.isApiLoaded()) {
      return;
    }

    this.isLoadingAutocomplete = true;

    try {
      await this.googleMapsService.loadGoogleMaps();
      this.scriptLoaded = true;
      console.log('Google Maps script loaded for predictions');
    } catch (error) {
      console.error('Failed to load Google Maps:', error);
      // Fallback: Use the datalist that's already in your template
      const input = this.cityInput?.nativeElement;
      if (input) {
        input.setAttribute('list', 'city-suggestions-fallback');
      }
    } finally {
      this.isLoadingAutocomplete = false;
    }
  }

  private async fetchPlacePredictions(query: string): Promise<void> {
    try {
      const predictions = await this.googleMapsService.getPlacePredictions(query);
      this.placePredictions = predictions;
      this.showPredictions = predictions.length > 0;
    } catch (error) {
      console.error('Error fetching predictions:', error);
      this.placePredictions = [];
      this.showPredictions = false;
    }
  }

  // Update selectPrediction method
  async selectPrediction(prediction: PlacePrediction) {
    try {
      this.isLoadingAutocomplete = true;

      // Get full place details with structured data
      const placeDetails = await this.googleMapsService.getPlaceDetails(prediction.place_id);

      // Create location data object
      this.selectedLocation = {
        city: placeDetails.city || this.extractCityName(placeDetails),
        state: placeDetails.state,
        country: placeDetails.country,
        latitude: placeDetails.latitude,
        longitude: placeDetails.longitude,
        formattedAddress: placeDetails.formatted_address,
        placeId: placeDetails.place_id,
        zipCode: placeDetails.zipCode // Add zip code
      };

      // Update form with city name
      const displayCity = placeDetails.city || placeDetails.name;
      this.selectedCityName = displayCity;
      this.searchForm.patchValue({ City: displayCity });

      // Log all data
      console.log('Selected location:', this.selectedLocation);
      console.log('Coordinates:', placeDetails.latitude, placeDetails.longitude);
      console.log('City:', placeDetails.city);
      console.log('State:', placeDetails.state);
      console.log('Country:', placeDetails.country);

      // Hide predictions
      this.showPredictions = false;
      this.placePredictions = [];

      // Focus back to input
      this.cityInput.nativeElement.focus();

    } catch (error) {
      console.error('Error getting place details:', error);
      // Fallback
      this.searchForm.patchValue({ City: prediction.structured_formatting.main_text });
    } finally {
      this.isLoadingAutocomplete = false;
    }
  }

  private extractCityName(placeDetails: any): string {
    // First try to get from extracted city
    if (placeDetails.city) return placeDetails.city;

    // Fallback to locality
    for (const component of placeDetails.address_components || []) {
      if (component.types.includes('locality') ||
        component.types.includes('postal_town') ||
        component.types.includes('administrative_area_level_2')) {
        return component.long_name;
      }
    }

    // Fallback to place name
    return placeDetails.name || placeDetails.formatted_address?.split(',')[0] || '';
  }

  // Form submission
  /*
  search() {
    const city = this.searchForm.get('City')?.value?.trim();

    if (!city) {
      this.toast.error(
        'Please enter or select a city',
        'Validation Error',
        {
          tapToDismiss: true,
          timeOut: 3000,
          positionClass: 'toast-top-center'
        }
      );
      return;
    }

    console.log('Searching for:', city);

    // Navigate to search results
    this.router.navigate(['/search'], {
      queryParams: { city }
    });
  }
  */

  // Form submission
  search() {
    // Check if we have valid location data
    if (this.selectedLocation && this.isDefinedAndNotEmpty(this.selectedLocation.city)) {
      this.navigateWithLocationData();
    } else {
      // Try to use form value
      const cityValue = this.searchForm.get('City')?.value?.trim();

      if (this.isDefinedAndNotEmpty(cityValue)) {
        // Simple navigation with just city name
        this.router.navigate(['/properties', encodeURIComponent(cityValue)]);
      } else {
        // No city provided
        this.toast.error(
          'Please enter or select a city',
          'Validation Error',
          {
            tapToDismiss: true,
            timeOut: 3000,
            positionClass: 'toast-top-center'
          }
        );
      }
    }
  }

  private navigateWithLocationData() {
    if (!this.selectedLocation || !this.selectedLocation.city) {
      this.navigateWithCityOnly();
      return;
    }

    // Build the city parameter WITHOUT extra encoding
    const cityParam = this.buildCityParam(this.selectedLocation);
    // cityParam = "Destin, 32541, FL" (with spaces)

    // Build query parameters
    const queryParams = this.buildQueryParams(this.selectedLocation);
    // queryParams = {
    //   Latitude: "30.389606",
    //   Longitude: "-86.48362340000001",
    //   Country: "United States",  // No encoding here
    //   State: "Florida",
    //   ZipCode: "32541",
    //   placeId: "ChIJt_RAyXlDkYgRMkxYRtuLpBc"
    // }

    // Angular router will handle encoding automatically
    this.router.navigate(['/properties', cityParam], { queryParams });
  }

  private navigateWithCityOnly() {
    const city = this.searchForm.get('City')?.value?.trim();

    if (!this.isDefinedAndNotEmpty(city)) {
      this.toast.error(
        'Please enter or select a city',
        'Validation Error',
        {
          tapToDismiss: true,
          timeOut: 3000,
          positionClass: 'toast-top-center'
        }
      );
      return;
    }

    // Simple navigation with just city
    this.router.navigate(['/properties', encodeURIComponent(city)]);
  }

  // Build city parameter for URL path
  private buildCityParam(location: LocationData): string {
    if (!location.city) return '';

    const parts = [location.city];

    // Check country
    const isUS= location.country && location.country === 'United States' || location.country === 'United States of America';
    const isCA= location.country && location.country === 'Canada';
    const isUK= location.country && location.country === 'United Kingdom';

    // For US/Canada: Add state/province
    if ((isUS || isCA) && location.state) {
      const stateCode = this.getStateCode(location.state);
      const statePart = stateCode || location.state;

      // Add ZIP/Postal code if available
      if (location.zipCode) {
        parts.push(`${statePart} ${location.zipCode}`);
      } else {
        parts.push(statePart);
      }
    }
    // For other countries with states/regions
    else if (location.state && location.country) {
      parts.push(location.state);
    }

    // Add country code
    if (location.country) {
      if (isUS) {
        parts.push('USA');
      } else if (isUK) {
        parts.push('UK');
      } else if (isCA) {
        parts.push('CA');
      } else {
        const countryCode = this.getCountryCode(location.country);
        parts.push(countryCode || location.country);
      }
    }

    return parts.join(', ');
  }

  private shouldAddCountry(location: LocationData): boolean {
    // Add country if:
    // 1. Country exists
    // 2. Not USA (for USA we already have state)
    // 3. Or USA but no state
    return !!location.country &&
      (location.country !== 'United States' || !location.state);
  }

  // Build query parameters object
  // Remove any .replace(/%20/g, '+') calls
  private buildQueryParams(location: LocationData): any {
    const queryParams: any = {};

    if (location.latitude != null) {
      queryParams.Latitude = location.latitude.toString();
    }

    if (location.longitude != null) {
      queryParams.Longitude = location.longitude.toString();
    }

    // Just assign the values - Angular will encode them
    if (location.country) {
      queryParams.Country = location.country; // "United States"
    }

    if (location.state) {
      queryParams.State = location.state; // "Florida"
    }

    if (location.zipCode) {
      queryParams.ZipCode = location.zipCode;
    }

    if (location.placeId) {
      queryParams.placeId = location.placeId;
    }

    return queryParams;
  }

  // Helper method to check if value is defined and not empty
  isDefinedAndNotEmpty(value: any): boolean {
    return value !== undefined && value !== null && value !== '';
  }

  // Helper to get US state codes
  private getStateCode(stateName: string): string {
    const normalizedStateName = stateName.toLowerCase();
    const usStateCodes: { [key: string]: string } = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
      'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
      'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
      'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
      'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
      'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
      'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
      'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
      'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
      'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
      'Wisconsin': 'WI', 'Wyoming': 'WY'
    };

    const canadianProvinces: { [key: string]: string } = {
      'Alberta': 'AB', 'British Columbia': 'BC', 'Manitoba': 'MB',
      'New Brunswick': 'NB', 'Newfoundland and Labrador': 'NL',
      'Northwest Territories': 'NT', 'Nova Scotia': 'NS', 'Nunavut': 'NU',
      'Ontario': 'ON', 'Prince Edward Island': 'PE', 'Quebec': 'QC',
      'Saskatchewan': 'SK', 'Yukon': 'YT'
    };

    return usStateCodes[normalizedStateName] || canadianProvinces[normalizedStateName] || '';
  }

  // Helper to get country codes
  private getCountryCode(countryName: string): string {
    const countryCodes: { [key: string]: string } = {
      'United States': 'USA',
      'United States of America': 'USA',
      'United Kingdom': 'UK',
      'Great Britain': 'UK',
      'Canada': 'CA',
      'Australia': 'AU',
      'Germany': 'DE',
      'France': 'FR',
      'Italy': 'IT',
      'Spain': 'ES',
      'Japan': 'JP',
      'China': 'CN',
      'India': 'IN',
      'Brazil': 'BR',
      'Mexico': 'MX',
      'Netherlands': 'NL',
      'Switzerland': 'CH',
      'Sweden': 'SE',
      'Norway': 'NO',
      'Denmark': 'DK',
      'Finland': 'FI',
      'Russia': 'RU',
      'South Korea': 'KR',
      'Singapore': 'SG',
      'New Zealand': 'NZ'
    };

    return countryCodes[countryName] || '';
  }

  // Utility methods
  stopBackgroundAnimationSelect(event: Event) {
    event.stopPropagation();
  }

  // ========== SLIDER METHODS (UNCHANGED) ==========

  // Returns slides to display: placeholder if API not loaded yet
  slidesToShow(): string[] {
    if (this.slides.length === 0) {
      return [this.placeholderImage]; // show placeholder first
    }
    return this.slides;
  }

  fetchSlides() {
    this.crudService.getBannerImages()
      .subscribe({
        next: (data) => {
          // Only use active slides (status === 1)
          const activeSlides = data.filter(d => d.status === 1);
          this.slides = activeSlides.map(d => d.photosURL);
          this.loadedSlides = this.slides.map((_, i) => i === 0); // only first slide loaded

          // 🎯 Assign random Ken Burns direction per slide
          this.slideAnimations = this.slides.map(
            () => this.kenBurnsClasses[
              Math.floor(Math.random() * this.kenBurnsClasses.length)
              ]
          );
          this.isApiLoaded = true;

          // ✅ Start ONLY after slides exist
          if (isPlatformBrowser(this.platformId)) {
            setTimeout(() => {
              this.lazyLoadUpcomingSlides();
              this.startSlider();
            });
          }
        },
        error: (err) => {
          console.error('Failed to fetch banner images', err);
        }
      });
  }

  // Start slider interval outside Angular to reduce change detection load
  startSlider() {
    //if (this.slides.length <= 1) return;
    this.ngZone.runOutsideAngular(() => {
      this.sliderInterval = setInterval(() => {
        if (!this.isPaused) {
          this.ngZone.run(() => this.nextSlide());
        }
      }, this.slideDuration);
    });
  }

  nextSlide() {
    const nextIndex = (this.activeSlideIndex + 1) % this.slides.length;

    // Load the next slide immediately for smooth transition
    this.loadSlide(nextIndex);

    // Also preload the one after next (optional for even smoother UX)
    const afterNext = (nextIndex + 1) % this.slides.length;
    this.loadSlide(afterNext);

    this.activeSlideIndex = nextIndex;
    this.preloadNextSlides(this.activeSlideIndex);
  }

  prevSlide() {
    const prevIndex = (this.activeSlideIndex - 1 + this.slides.length) % this.slides.length;

    // Load previous slide
    this.loadSlide(prevIndex);

    // Also preload the slide before previous
    const beforePrev = (prevIndex - 1 + this.slides.length) % this.slides.length;
    this.loadSlide(beforePrev);

    this.activeSlideIndex = prevIndex;
    this.preloadNextSlides(this.activeSlideIndex);
  }

  pauseSlider() { this.isPaused = true; }
  resumeSlider() { this.isPaused = false; }

  // Swipe support
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) { this.touchStartX = event.changedTouches[0].screenX; }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    const distance = this.touchEndX - this.touchStartX;
    if (distance > 50) this.prevSlide();
    else if (distance < -50) this.nextSlide();
  }

  // Lazy load a slide just in time
  private loadSlide(index: number) {
    if (
      !isPlatformBrowser(this.platformId) ||
      !this.slides.length ||
      index < 0 ||
      index >= this.slides.length ||
      !this.slides[index]
    ) {
      return;
    }

    if (this.loadedSlides[index]) return;

    if (!this.loadedSlides[index]) {
      const img = document.createElement('img');
      img.src = this.slides[index];
      img.onload = () => this.loadedSlides[index] = true;
    }
  }

  private preloadNextSlides(currentIndex: number) {
    const next1 = (currentIndex + 1) % this.slides.length;
    const next2 = (currentIndex + 2) % this.slides.length;

    [next1, next2].forEach(idx => this.loadSlide(idx));
  }

  // Optional: preload the next 1–2 slides for smooth animation
  private lazyLoadUpcomingSlides() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const idx = Number(entry.target.getAttribute('data-index'));
        if (entry.isIntersecting) {
          this.loadSlide(idx);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    this.slideElements.forEach((el, i) => {
      if (!this.loadedSlides[i]) observer.observe(el.nativeElement);
    });
  }
}
