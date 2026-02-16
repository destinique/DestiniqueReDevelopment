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
import { Subject, from } from 'rxjs';
import { debounceTime, filter, switchMap, takeUntil, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { CrudService } from 'src/app/shared/services/crud.service';
import { GoogleMapsService, PlacePrediction, PlaceDetails } from 'src/app/shared/services/google-maps.service';
import { SearchStateService } from 'src/app/shared/services/search-state.service';
import { LocationData } from 'src/app/shared/interfaces/search-state.interface';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss']
})
export class BannerComponent implements OnInit, AfterViewInit, OnDestroy {
  placeholderImage = 'assets/website_images/home/banner/placeholder.webp';

  slides: string[] = [];
  activeSlideIndex = 0;
  slideDuration = 9000;
  isPaused = false;

  loadedSlides: boolean[] = [];
  isApiLoaded = false;

  kenBurnsClasses = [
    'kb-zoom-in-left',
    'kb-zoom-in-right',
    'kb-zoom-in-top',
    'kb-zoom-in-bottom'
  ];

  slideAnimations: string[] = [];

  touchStartX = 0;
  touchEndX = 0;
  private sliderInterval: any;

  @ViewChildren('kbSlide') slideElements!: QueryList<ElementRef>;
  @ViewChild('destinationInput', { static: false }) destinationInput!: ElementRef<HTMLInputElement>;

  // Google Places Autocomplete (same pattern as SearchProperty)
  isLoadingAutocomplete = false;
  showPredictions = false;
  placePredictions: PlacePrediction[] = [];
  selectedPredictionIndex = -1;
  /** Prevents blur from overwriting when user selected from dropdown */
  private lastSelectedPlaceAddress: string | null = null;
  /** Stores selected location for Search button (only updated on selection, not on blur) */
  selectedLocation: LocationData | null = null;

  searchForm: FormGroup;
  private destroy$ = new Subject<void>();

  // Google Maps delayed load
  private scriptLoaded = false;
  private delayedLoadTimeout: any;
  private userInteractedBeforeDelay = false;
  private isDelayedLoadInProgress = false;

  constructor(
    private ngZone: NgZone,
    private fb: FormBuilder,
    private router: Router,
    private toast: ToastrService,
    private crudService: CrudService,
    private googleMapsService: GoogleMapsService,
    private searchState: SearchStateService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.searchForm = this.fb.group({
      destination: ['']
    });
  }

  ngOnInit(): void {
    this.fetchSlides();
    this.setupDestinationInputSubscription();
    this.initializeFormFromState();
    this.startDelayedLoading();
  }

  ngAfterViewInit(): void {
    this.setupDestinationInputListeners();
  }

  ngOnDestroy(): void {
    clearInterval(this.sliderInterval);
    clearTimeout(this.delayedLoadTimeout);
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== SYNC FROM SEARCH STATE ==========
  private initializeFormFromState(): void {
    const state = this.searchState.currentState;
    if (state.location?.text) {
      this.searchForm.patchValue({ destination: state.location.text }, { emitEvent: false });
      this.lastSelectedPlaceAddress = state.location.text;
      this.selectedLocation = state.location;
    }
  }

  // ========== REACTIVE DESTINATION INPUT (same as SearchProperty) ==========
  private setupDestinationInputSubscription(): void {
    const destinationControl = this.searchForm.get('destination');
    if (!destinationControl) return;

    destinationControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        tap(() => (this.selectedPredictionIndex = -1)),
        filter((value: string | null): value is string => {
          if (!value || value.trim().length < 2) {
            this.hidePredictions();
            return false;
          }
          return true;
        }),
        switchMap((value: string) =>
          from(this.getPlacePredictions(value.trim())).pipe(
            catchError((error) => {
              console.error('Error getting place predictions:', error);
              this.hidePredictions();
              return of(null);
            })
          )
        )
      )
      .subscribe();
  }

  private async getPlacePredictions(input: string): Promise<void> {
    if (!this.googleMapsService.isApiLoaded()) {
      await this.onDestinationFocus();
    }
    try {
      const predictions = await this.googleMapsService.getPlacePredictions(input);
      this.placePredictions = predictions;
      this.showPredictions = predictions.length > 0;
    } catch {
      this.hidePredictions();
    }
  }

  async onDestinationFocus(): Promise<void> {
    if (!this.userInteractedBeforeDelay) {
      this.userInteractedBeforeDelay = true;
      clearTimeout(this.delayedLoadTimeout);
      this.isDelayedLoadInProgress = false;
    }
    if (!this.googleMapsService.isApiLoaded()) {
      try {
        await this.loadGoogleMapsScript();
      } catch (error) {
        console.error('Failed to load Google Maps API:', error);
      }
    }
    if (this.placePredictions.length > 0) {
      this.showPredictions = true;
    }
  }

  onDestinationBlur(): void {
    setTimeout(() => {
      this.hidePredictions();

      const value = (this.searchForm.get('destination')?.value ?? '').trim();
      if (!value) {
        this.lastSelectedPlaceAddress = null;
        return;
      }
      if (value === this.lastSelectedPlaceAddress) {
        return;
      }
      // User typed manually — clear selectedLocation so Search uses text-only
      this.selectedLocation = null;
      this.lastSelectedPlaceAddress = null;
    }, 200);
  }

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

  trackByPlaceId(_index: number, p: PlacePrediction): string {
    return p.place_id;
  }

  async onPlaceSelected(prediction: PlacePrediction): Promise<void> {
    this.hidePredictions();

    try {
      const placeDetails = await this.googleMapsService.getPlaceDetails(prediction.place_id);

      this.searchForm
        .get('destination')
        ?.setValue(placeDetails.formatted_address, { emitEvent: false });
      this.lastSelectedPlaceAddress = placeDetails.formatted_address;

      this.selectedLocation = this.placeDetailsToLocationData(placeDetails);
      this.destinationInput?.nativeElement?.focus();
    } catch (error) {
      console.error('Error getting place details:', error);
      this.searchForm
        .get('destination')
        ?.setValue(prediction.description, { emitEvent: false });
      this.lastSelectedPlaceAddress = prediction.description;
      this.selectedLocation = {
        text: prediction.description,
        city: '',
        state: '',
        country: ''
      };
    }
  }

  private placeDetailsToLocationData(d: PlaceDetails): LocationData {
    const text = d.formatted_address || d.name || '';
    const city = d.city || this.extractCityName(d);
    return {
      text,
      city,
      state: d.state || '',
      country: d.country || '',
      latitude: d.latitude,
      longitude: d.longitude,
      placeId: d.place_id
    };
  }

  private extractCityName(d: PlaceDetails): string {
    if (d.city) return d.city;
    for (const c of d.address_components || []) {
      if (
        c.types?.includes('locality') ||
        c.types?.includes('postal_town') ||
        c.types?.includes('administrative_area_level_2')
      ) {
        return c.long_name;
      }
    }
    return d.name || d.formatted_address?.split(',')[0] || '';
  }

  private hidePredictions(): void {
    this.showPredictions = false;
    this.placePredictions = [];
    this.selectedPredictionIndex = -1;
  }

  // ========== GOOGLE MAPS DELAYED LOAD ==========
  private setupDestinationInputListeners(): void {
    const input = this.destinationInput?.nativeElement;
    if (!input) return;

    const trackUserInteraction = () => {
      if (!this.userInteractedBeforeDelay) {
        this.userInteractedBeforeDelay = true;
        clearTimeout(this.delayedLoadTimeout);
        this.isDelayedLoadInProgress = false;
        if (!this.scriptLoaded && !this.googleMapsService.isApiLoaded()) {
          this.loadGoogleMapsScript();
        }
      }
    };

    ['focus', 'touchstart', 'input', 'click'].forEach((ev) =>
      input.addEventListener(ev, trackUserInteraction, { passive: true })
    );
  }

  private startDelayedLoading(): void {
    if (this.delayedLoadTimeout) clearTimeout(this.delayedLoadTimeout);
    this.delayedLoadTimeout = setTimeout(() => {
      this.isDelayedLoadInProgress = true;
      if (!this.scriptLoaded && !this.userInteractedBeforeDelay) {
        this.loadGoogleMapsScript();
      }
      this.isDelayedLoadInProgress = false;
    }, 6000);
  }

  private async loadGoogleMapsScript(): Promise<void> {
    if (this.scriptLoaded || this.googleMapsService.isApiLoaded()) return;

    this.isLoadingAutocomplete = true;
    try {
      await this.googleMapsService.loadGoogleMaps();
      this.scriptLoaded = true;
    } catch (error) {
      console.error('Failed to load Google Maps:', error);
      const input = this.destinationInput?.nativeElement;
      if (input) input.setAttribute('list', 'city-suggestions-fallback');
    } finally {
      this.isLoadingAutocomplete = false;
    }
  }

  // ========== SEARCH (update state + navigate on button click only) ==========
  search(): void {
    const destValue = (this.searchForm.get('destination')?.value ?? '').trim();

    if (this.selectedLocation && this.isDefinedAndNotEmpty(this.selectedLocation.city)) {
      this.updateStateAndNavigateWithLocation(this.selectedLocation);
    } else if (this.isDefinedAndNotEmpty(destValue)) {
      this.updateStateAndNavigateWithTextOnly(destValue);
    } else {
      this.toast.error('Please enter or select a city', 'Validation Error', {
        tapToDismiss: true,
        timeOut: 3000,
        positionClass: 'toast-top-center'
      });
    }
  }

  private updateStateAndNavigateWithLocation(location: LocationData): void {
    this.searchState.updateLocation(location);
    this.searchState.updatePagination(1);

    const cityParam = this.buildCityParam(location);
    const queryParams = this.buildQueryParams(location);
    this.router.navigate(['/properties', cityParam], { queryParams });
  }

  private updateStateAndNavigateWithTextOnly(text: string): void {
    const location: LocationData = {
      text,
      city: text.split(',')[0]?.trim() || text,
      state: '',
      country: ''
    };
    this.searchState.updateLocation(location);
    this.searchState.updatePagination(1);
    this.router.navigate(['/properties', text]);
  }

  private buildCityParam(location: LocationData): string {
    // Use full formatted address when available (e.g. "Destin, FL 32541, USA")
    if (location.text && location.text.includes(',')) {
      return location.text;
    }
    const parts: string[] = [];
    if (location.city) parts.push(location.city);
    const isUS =
      location.country === 'United States' || location.country === 'United States of America';
    const isCA = location.country === 'Canada';
    const isUK = location.country === 'United Kingdom';
    if ((isUS || isCA) && location.state) {
      parts.push(this.getStateCode(location.state) || location.state);
    } else if (location.state && location.country) {
      parts.push(location.state);
    }
    if (location.country) {
      if (isUS) parts.push('USA');
      else if (isUK) parts.push('UK');
      else if (isCA) parts.push('CA');
      else parts.push(this.getCountryCode(location.country) || location.country);
    }
    return parts.length > 0 ? parts.join(', ') : location.text || location.city || '';
  }

  private buildQueryParams(location: LocationData): Record<string, string> {
    const q: Record<string, string> = {};
    if (location.latitude != null) q['latitude'] = String(location.latitude);
    if (location.longitude != null) q['longitude'] = String(location.longitude);
    if (location.state) q['state'] = location.state;
    if (location.country) q['country'] = location.country;
    if (location.placeId) q['placeId'] = location.placeId;
    return q;
  }

  private isDefinedAndNotEmpty(value: any): boolean {
    return value !== undefined && value !== null && value !== '';
  }

  private getStateCode(name: string): string {
    const map: Record<string, string> = {
      alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
      colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
      hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS',
      kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD', massachusetts: 'MA',
      michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT',
      nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
      'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
      ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI',
      'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX',
      utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
      wisconsin: 'WI', wyoming: 'WY'
    };
    return map[name.toLowerCase()] || '';
  }

  private getCountryCode(name: string): string {
    const map: Record<string, string> = {
      'United States': 'USA', 'United States of America': 'USA', 'United Kingdom': 'UK',
      'Great Britain': 'UK', Canada: 'CA', Australia: 'AU', Germany: 'DE', France: 'FR',
      Italy: 'IT', Spain: 'ES', Japan: 'JP', China: 'CN', India: 'IN', Brazil: 'BR',
      Mexico: 'MX', Netherlands: 'NL', Switzerland: 'CH', Sweden: 'SE', Norway: 'NO'
    };
    return map[name] || '';
  }

  stopBackgroundAnimationSelect(event: Event): void {
    event.stopPropagation();
  }

  // ========== SLIDER ==========
  slidesToShow(): string[] {
    return this.slides.length === 0 ? [this.placeholderImage] : this.slides;
  }

  fetchSlides(): void {
    this.crudService.getBannerImages().subscribe({
      next: (data) => {
        const activeSlides = data.filter((d: any) => d.status === 1);
        this.slides = activeSlides.map((d: any) => d.photosURL);
        this.loadedSlides = this.slides.map((_, i) => i === 0);
        this.slideAnimations = this.slides.map(
          () => this.kenBurnsClasses[Math.floor(Math.random() * this.kenBurnsClasses.length)]
        );
        this.isApiLoaded = true;
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => {
            this.lazyLoadUpcomingSlides();
            this.startSlider();
          });
        }
      },
      error: (err) => console.error('Failed to fetch banner images', err)
    });
  }

  startSlider(): void {
    this.ngZone.runOutsideAngular(() => {
      this.sliderInterval = setInterval(() => {
        if (!this.isPaused) this.ngZone.run(() => this.nextSlide());
      }, this.slideDuration);
    });
  }

  nextSlide(): void {
    const nextIndex = (this.activeSlideIndex + 1) % this.slides.length;
    this.loadSlide(nextIndex);
    this.loadSlide((nextIndex + 1) % this.slides.length);
    this.activeSlideIndex = nextIndex;
    this.preloadNextSlides(this.activeSlideIndex);
  }

  prevSlide(): void {
    const prevIndex = (this.activeSlideIndex - 1 + this.slides.length) % this.slides.length;
    this.loadSlide(prevIndex);
    this.loadSlide((prevIndex - 1 + this.slides.length) % this.slides.length);
    this.activeSlideIndex = prevIndex;
    this.preloadNextSlides(this.activeSlideIndex);
  }

  pauseSlider(): void { this.isPaused = true; }
  resumeSlider(): void { this.isPaused = false; }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
    const d = this.touchEndX - this.touchStartX;
    if (d > 50) this.prevSlide();
    else if (d < -50) this.nextSlide();
  }

  private loadSlide(index: number): void {
    if (
      !isPlatformBrowser(this.platformId) ||
      !this.slides.length ||
      index < 0 ||
      index >= this.slides.length ||
      this.loadedSlides[index]
    )
      return;
    const img = document.createElement('img');
    img.src = this.slides[index];
    img.onload = () => (this.loadedSlides[index] = true);
  }

  private preloadNextSlides(current: number): void {
    [1, 2].forEach((i) => this.loadSlide((current + i) % this.slides.length));
  }

  private lazyLoadUpcomingSlides(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const idx = Number((e.target as HTMLElement).getAttribute('data-index'));
          if (e.isIntersecting) {
            this.loadSlide(idx);
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    this.slideElements?.forEach((el, i) => {
      if (!this.loadedSlides[i]) observer.observe(el.nativeElement);
    });
  }
}
