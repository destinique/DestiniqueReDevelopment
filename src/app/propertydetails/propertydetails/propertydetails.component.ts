import { Component, ViewChild, TemplateRef, ElementRef, OnInit, AfterViewInit, OnDestroy   } from '@angular/core';
import { PropertyImage } from 'src/app/shared/interfaces/property-image.interface';
import { PropertyImageHelper } from 'src/app/shared/helpers/property-image.helper';
import Swiper, { Navigation, Pagination, Thumbs, FreeMode } from 'swiper';
// Install Swiper modules
Swiper.use([Navigation, Pagination, Thumbs, FreeMode]);

import { TabsetComponent } from 'ngx-bootstrap/tabs';
import { Router, ActivatedRoute } from "@angular/router";
import { NgxSpinnerService } from "ngx-spinner";

import { NgbDate, NgbInputDatepicker, NgbCalendar, NgbDateStruct, NgbDateParserFormatter, NgbDatepickerNavigateEvent } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { AvailabilityService, DateAvailability } from 'src/app/shared/services/availability.service'; // Adjust path as needed
import { environment } from 'src/environments/environment';
import { GoogleMapsService } from 'src/app/shared/services/google-maps.service';

import { StorageService } from 'src/app/shared/services/storage.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { CrudService } from "src/app/shared/services/crud.service";
import { ToastrService } from "ngx-toastr";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

interface TabInfo {
  id: string;
  title: string;
}

@Component({
  selector: 'app-propertydetails',
  templateUrl: './propertydetails.component.html',
  styleUrls: [
    '../../../../node_modules/swiper/swiper-bundle.min.css',
    './propertydetails.component.scss']
})
export class PropertydetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('propertyTabs', { static: false }) propertyTabs?: TabsetComponent;
  @ViewChild('mainSwiper', { static: false }) mainSwiperRef!: ElementRef;
  @ViewChild('thumbSwiper', { static: false }) thumbSwiperRef!: ElementRef;
  @ViewChild('ratesShow') ratesShowTpl!: TemplateRef<any>;
  @ViewChild('rateNotAvailable') rateNotAvailableTpl!: TemplateRef<any>;
  @ViewChild('zeroRate') zeroRateTpl!: TemplateRef<any>;

  mainSwiper: any;
  thumbSwiper: any;
  images: PropertyImage[] = [];
  currentSlide: number = 0;

  propertyDetailData: any;
  listId: any; //Getting Product id from URL
  propertyId: string;
  bedroomCt: any;
  bathroomCt: any;
  sleepsCt: any;
  amenity: any;

  currentTab = 'overview';

  // Tab configuration
  readonly tabs: TabInfo[] = [
    { id: 'overview', title: 'OVERVIEW' },
    { id: 'amenities', title: 'AMENITIES' },
    { id: 'description', title: 'DESCRIPTION' },
    { id: 'availability', title: 'AVAILABILITY' },
    { id: 'reviews', title: 'REVIEWS' }
  ];

  // Calendar variables - Change these to NgbDate
  leftCalendarDate: NgbDate;
  rightCalendarDate: NgbDate;
  // Availability data
  unavailableDates: NgbDate[] = [];
  bookedDates: NgbDate[] = [];

  // Update these arrays to track different status types
  fullyAvailableDates: NgbDate[] = [];      // Condition #1: Fully Green
  fullyUnavailableDates: NgbDate[] = [];    // Condition #2: Fully Red
  amOnlyDates: NgbDate[] = [];              // Condition #4: AM Green / PM Red
  pmOnlyDates: NgbDate[] = [];              // Condition #3: AM Red / PM Green
  noCheckinDates: NgbDate[] = [];           // Condition #5: Green with red circle
  //for date-range-picker
  fromDate: NgbDate | null = null;
  toDate: NgbDate | null = null;
  selectedDateRange: string = '';

  //For RatesAPP
  dataSourceCode!: string;
  providerMessages: any = [];
  RATE_AVAILABLE=1;
  scheckin: any;
  scheckout: any;
  rates: any;
  securityDeposit: any;

  private latitude!: number;
  private longitude!: number;

  // Subscriptions
  private availabilitySub: Subscription = new Subscription();

  // Track loading states
  private gmapScriptLoaded= false;
  private mapInitialized = false;
  private map!: google.maps.Map;

  datesForm!: FormGroup;   // 👈 REQUIRED
  isDatesFormSubmitting = false;
  isCalendarLoading = false;

  constructor(
              private fb: FormBuilder,
              private router: Router,
              private route: ActivatedRoute,
              private spinner: NgxSpinnerService,
              private calendar: NgbCalendar,
              private availabilityService: AvailabilityService,
              private googleMapsService: GoogleMapsService,
              private storageService: StorageService,
              private authService: AuthService,
              private crudService: CrudService,
              private toast: ToastrService,
              private modalService: NgbModal
  ) {
    this.datesForm = this.fb.group({
      searchCalender: ['', Validators.required],
      sleeps: [1, Validators.min(1)]
    });

    this.propertyId = this.route.snapshot.paramMap.get('id') || '';
    this.listId = Number(this.propertyId);
    // Initialize calendar dates
    const today = this.calendar.getToday();
    this.leftCalendarDate = today;
    this.rightCalendarDate = this.calendar.getNext(today, 'm', 1);
  }

  // Getters for form controls
  get searchCalenderControl() {
    return this.datesForm?.get('searchCalender');
  }

  get sleepsControl() {
    return this.datesForm?.get('sleeps');
  }

  ngOnInit (){
      this.spinner.show();
      if (this.storageService.isBrowser()){
          this.loadPropertyDetails(this.listId);
          // Load your images (example data)
          // this.loadPropertyImages();
          this.loadAvailabilityData();
      }
  }

  // Temporary test method
  testFebruaryLogic(): void {
    // Manually add some February dates as unavailable
    for (let day = 1; day <= 5; day++) {
      this.fullyUnavailableDates.push(new NgbDate(2026, 2, day));
    }
  }

  ngAfterViewInit (){
    if (!this.gmapScriptLoaded) {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          this.loadGoogleMapsScript();
        });
      }
      else {
        // Fallback for Safari
        setTimeout(() => this.loadGoogleMapsScript(), 2000);
      }
    }

    setTimeout(() => {this.spinner.hide();}, 1000);
  }

  private tryInitMap(): void {
    if (this.mapInitialized) {
      return;
    }

    if (!this.gmapScriptLoaded) {
      return;
    }

    if (this.latitude == null || this.longitude == null) {
      return;
    }

    this.initMap(this.latitude, this.longitude);
    this.mapInitialized = true;
  }

  loadPropertyDetails(listId:any){
    this.crudService.getPropertyDetails(listId).subscribe({
      next: (resp: any) => {
        this.spinner.hide();

        if (resp?.length > 0) {
          if (parseInt(resp[0]["status"]) == 0) {
            this.router.navigate(["/"]);
            return;
          }
          this.propertyDetailData = resp[0];
          this.RATE_AVAILABLE = resp[0]["RATE_AVAILABLE"];
          this.dataSourceCode = resp[0]["DataSourceCde"];

          const listId = resp[0].list_id;
          this.latitude = Number(resp[0].Lat);
          this.longitude = Number(resp[0].Lon);

          this.bedroomCt = Math.round(resp[0]["Bedrooms"] * 100) / 100;
          this.bathroomCt = Math.round(resp[0]["Bathrooms"] * 100) / 100;
          this.sleepsCt = Math.round(resp[0]["Sleeps"] * 100) / 100;
          this.amenity = resp[0]["Amenity"];

          // Try initializing map after data arrives
          this.tryInitMap();
          this.images = PropertyImageHelper.sortImages(
                          PropertyImageHelper.transformApiData(resp[0]["images"])
          );
          // Initialize swipers after view is ready
          setTimeout(() => {
            this.initSwipers();
          }, 500);
        }
        else {
          this.showPropertyError();
        }
      },
      error: () => {
        this.spinner.hide();
        this.showPropertyError();
      }
    });
  }

  private showPropertyError() {
    this.toast.error(
      'This property is no longer online. Please call 850-312-5400 for further assistance',
      'Property Not Found',
      {
        tapToDismiss: true,
        timeOut: 0,
        positionClass: 'toast-top-center'
      }
    );
  }

  private async loadGoogleMapsScript() {
    // Prevent multiple loads
    if (this.gmapScriptLoaded ) {
    // || this.googleMapsService.isApiLoaded()
      return;
    }

    try {
      await this.googleMapsService.loadGoogleMaps();
      this.gmapScriptLoaded = true;
      // ✅ SAFE POINT — API + DOM both ready
      // this.tryInitMap();
      console.log('Google Maps script loaded');
    }
    catch (error) {
      console.error('Failed to load Google Maps:', error);
    }
    finally {

    }
  }

  private initMap(lat: number, lng: number): void {
    const mapEl = document.getElementById('property-map');

    if (!mapEl) {
      console.warn('Map element not found');
      return;
    }

    this.map = new google.maps.Map(mapEl, {
      center: { lat: lat, lng: lng },
      zoom: 10,
      mapId: environment.googleMapsMapId,
      fullscreenControl: false,
      streetViewControl: false,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      draggable: false
    });
    this.addMarker(lat, lng);
  }

  private addMarker(lat: number, lng: number): void {
    const position = { lat, lng };

    new google.maps.marker.AdvancedMarkerElement({
      map: this.map,
      position
    });
  }

  initSwipers() {
    if (!this.thumbSwiperRef?.nativeElement || !this.mainSwiperRef?.nativeElement) {
      console.error('Swiper elements not found');
      return;
    }

    // MARK: Updated - Initialize thumbnail swiper with navigation
    this.thumbSwiper = new Swiper(this.thumbSwiperRef.nativeElement, {
      spaceBetween: 4,
      slidesPerView: 6,
      freeMode: true,
      watchSlidesProgress: true,
      // MARK: Added navigation for thumbnails
      navigation: {
        nextEl: '.swiper-button-next-thumb',
        prevEl: '.swiper-button-prev-thumb',
      },
      breakpoints: {
        320: { slidesPerView: 3, spaceBetween: 4 },   // Mobile: 3 images
        576: { slidesPerView: 4, spaceBetween: 4 },   // Small tablet: 4 images
        768: { slidesPerView: 5, spaceBetween: 4 },   // Tablet: 5 images
        1024: { slidesPerView: 6, spaceBetween: 4 }   // Desktop: 6 images
      }
    });

    // MARK: Updated - Initialize main swiper with thumbs and navigation
    this.mainSwiper = new Swiper(this.mainSwiperRef.nativeElement, {
      spaceBetween: 10,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      thumbs: {
        swiper: this.thumbSwiper
      },
      on: {
        slideChange: (swiper: any) => {
          this.currentSlide = swiper.activeIndex;
        }
      }
    });
  }

  goToSlide(index: number) {
    if (this.mainSwiper) {
      this.mainSwiper.slideTo(index);
    }
  }

  getImageDisplayNumber(image: PropertyImage, index: number): number {
    if (image.sort) {
      return typeof image.sort === 'string' ? parseInt(image.sort) : image.sort;
    }
    return index + 1;
  }

  // Clean up swiper instances
  ngOnDestroy() {
    if (this.mainSwiper) {
      this.mainSwiper.destroy();
    }
    if (this.thumbSwiper) {
      this.thumbSwiper.destroy();
    }

    // ===== CLEANUP =====
    this.availabilitySub.unsubscribe();
  }

  /**
   * Handle tab selection
   */
  onTabSelect(event: any): void {
    const tabIndex = event?.id;
    if (tabIndex >= 0 && tabIndex < this.tabs.length) {
      this.currentTab = this.tabs[tabIndex].id;
    }
  }

  /**
   * Select a specific tab programmatically
   */
  selectTab(tabId: string, event?: Event): void {
    event?.preventDefault();
    alert  (tabId);

    if (!this.propertyTabs) return;

    const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
    alert  (tabId);
    if (tabIndex !== -1 && this.propertyTabs.tabs[tabIndex]) {
      this.propertyTabs.tabs[tabIndex].active = true;
      this.currentTab = tabId;
      alert  (this.currentTab);
    }
  }

  /**
   * Navigate to next tab
   */
  nextTab(): void {
    const currentIndex = this.tabs.findIndex(tab => tab.id === this.currentTab);
    if (currentIndex < this.tabs.length - 1) {
      const nextTab = this.tabs[currentIndex + 1];
      this.selectTab(nextTab.id);
    }
  }

  /**
   * Navigate to previous tab
   */
  previousTab(): void {
    const currentIndex = this.tabs.findIndex(tab => tab.id === this.currentTab);
    if (currentIndex > 0) {
      const prevTab = this.tabs[currentIndex - 1];
      this.selectTab(prevTab.id);
    }
  }

  /**
   * Check if a tab is active
   */
  isTabActive(tabId: string): boolean {
    return this.currentTab === tabId;
  }

  /**
   * Get the current active tab title
   */
  getActiveTabTitle(): string {
    const activeTab = this.tabs.find(tab => tab.id === this.currentTab);
    return activeTab?.title || '';
  }

  // ===== CALENDAR METHODS (SIMPLIFIED) =====
  // Temporary debugging
  loadAvailabilityData(): void {
    this.isCalendarLoading = true;
    this.availabilitySub = this.availabilityService.getAvailability(this.propertyId)
      .subscribe(data => {

        // Reset arrays
        this.fullyAvailableDates = [];
        this.fullyUnavailableDates = [];
        this.amOnlyDates = [];
        this.pmOnlyDates = [];
        this.noCheckinDates = [];

        // Categorize dates based on status
        data.forEach(item => {
          switch (item.status) {
            case 'available':
              this.fullyAvailableDates.push(item.date);
              break;
            case 'unavailable':
              this.fullyUnavailableDates.push(item.date);
              break;
            case 'am_only':
              this.amOnlyDates.push(item.date);
              break;
            case 'pm_only':
              this.pmOnlyDates.push(item.date);
              break;
            case 'no_checkin':
              this.noCheckinDates.push(item.date);
              break;
            default:
              console.warn(`Unknown status for date ${item.date.year}-${item.date.month}-${item.date.day}: ${item.status}`);
          }
        });
        this.isCalendarLoading = false;
        /*
        console.log('=== CATEGORIZATION ===');
        console.log('Fully available (green):', this.fullyAvailableDates.length);
        console.log('Fully unavailable (red):', this.fullyUnavailableDates.length);
        console.log('AM only (top green/bottom red):', this.amOnlyDates.length);
        console.log('PM only (top red/bottom green):', this.pmOnlyDates.length);
        console.log('No checkin (green with red dot):', this.noCheckinDates.length);
        */

        // Run test first
        // setTimeout(() => {this.testFebruaryLogic();}, 5000);
      });
  }

  // Single check method used by both templates and markDisabled
  isDateUnavailable(date: NgbDate): boolean {
    return this.bookedDates.some(d => d.equals(date)) ||
      this.unavailableDates.some(d => d.equals(date));
  }

  // Update markDisabled to handle different statuses
  markDisabled = (date: NgbDate): boolean => {
    // Dates that are fully unavailable should be disabled
    return this.fullyUnavailableDates.some(d => d.equals(date));
  };

  // Method to get custom CSS classes for each date
// Update getDateCustomClass to add debugging
  getDateCustomClass(date: NgbDate): string {
    const isUnavailable = this.fullyUnavailableDates.some(d => d.equals(date));
    const isAvailable = this.fullyAvailableDates.some(d => d.equals(date));
    const isAmOnly = this.amOnlyDates.some(d => d.equals(date));
    const isPmOnly = this.pmOnlyDates.some(d => d.equals(date));
    const isNoCheckin = this.noCheckinDates.some(d => d.equals(date));

    /*
    // Debug: log February dates
    if (date.year === 2026 && date.month === 2 && date.day <= 5) {
      console.log(`Feb ${date.day}, 2026 - Status:`, {
        unavailable: isUnavailable,
        available: isAvailable,
        amOnly: isAmOnly,
        pmOnly: isPmOnly,
        noCheckin: isNoCheckin
      });
    }
    */

    if (isUnavailable) {
      return 'date-fully-unavailable';
    } else if (isAmOnly) {
      return 'date-am-only';
    } else if (isPmOnly) {
      return 'date-pm-only';
    } else if (isNoCheckin) {
      return 'date-no-checkin';
    } else if (isAvailable) {
      return 'date-fully-available';
    }
    return '';
  }

  // Helper method to check date status for tooltips
  getDateStatusText(date: NgbDate): string {
    if (this.fullyUnavailableDates.some(d => d.equals(date))) {
      return 'Not Available';
    } else if (this.amOnlyDates.some(d => d.equals(date))) {
      return 'Available AM only';
    } else if (this.pmOnlyDates.some(d => d.equals(date))) {
      return 'Available PM only';
    } else if (this.noCheckinDates.some(d => d.equals(date))) {
      return 'Available (No Check-in)';
    } else if (this.fullyAvailableDates.some(d => d.equals(date))) {
      return 'Available';
    }
    return 'Unknown';
  }

  // Synchronized navigation handlers
  onLeftCalendarNavigate(event: NgbDatepickerNavigateEvent) {
    // Update left calendar
    this.leftCalendarDate = new NgbDate(event.next.year, event.next.month, 1);

    // Synchronize right calendar (1 month ahead)
    this.rightCalendarDate = this.calendar.getNext(this.leftCalendarDate, 'm', 1);
  }

  onRightCalendarNavigate(event: NgbDatepickerNavigateEvent) {
    // Update right calendar
    this.rightCalendarDate = new NgbDate(event.next.year, event.next.month, 1);

    // Synchronize left calendar (1 month behind)
    this.leftCalendarDate = this.calendar.getPrev(this.rightCalendarDate, 'm', 1);
  }

  // Helper methods
  getDateStruct(date: NgbDate): NgbDateStruct {
    return { year: date.year, month: date.month, day: date.day };
  }

  //date-range-picker
  onDateSelection(date: NgbDate, dp: NgbInputDatepicker) {
    // 🚫 Block selecting unavailable start date
    if (this.isDateUnavailable(date)) {
      return;
    }

    // 1️⃣ If no range yet, set check-in
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
      this.updateDateRangeText();
      // Keep calendar open for checkout selection
      return;
    }

    // 2️⃣ If check-in exists, but no checkout yet
    if (this.fromDate && !this.toDate) {
      // If user clicked a date before check-in, reset check-in
      if (date.before(this.fromDate)) {
        this.fromDate = date;
        this.updateDateRangeText();
        return;
      }

      // 🚫 Block checkout if any unavailable date exists in between
      if (!this.isRangeValid(this.fromDate, date)) {
        return;
      }

      // ✅ Valid checkout selected
      this.toDate = date;
      this.updateDateRangeText();

      // 🔥 Auto-scroll to checkout month
      dp.navigateTo({
        year: date.year,
        month: date.month
      });

      // ✅ Auto-close calendar after a brief delay (for better UX)
      setTimeout(() => {
        dp.close();
      }, 100); // Small delay to show the selection visually

      return;
    }

    // 3️⃣ If both check-in and checkout exist, reset range
    if (this.fromDate && this.toDate) {
      this.fromDate = date;
      this.toDate = null;
      this.updateDateRangeText();
    }
  }

  updateDateRangeText(): void {
    if (this.fromDate && this.toDate) {
      // Format with leading zeros: "MM/DD/YYYY - MM/DD/YYYY"
      const fromStr = this.formatDateWithLeadingZeros(this.fromDate);
      const toStr = this.formatDateWithLeadingZeros(this.toDate);
      this.selectedDateRange = `${fromStr} - ${toStr}`;
    } else if (this.fromDate) {
      // Only check-in selected
      const fromStr = this.formatDateWithLeadingZeros(this.fromDate);
      this.selectedDateRange = `${fromStr} - Select checkout`;
    } else {
      this.selectedDateRange = '';
    }
  }

  formatDateRange(): string {
    return this.selectedDateRange;
  }

  getPlaceholderText(): string {
    if (this.fromDate && !this.toDate) {
      const fromStr = this.formatDateWithLeadingZeros(this.fromDate);
      return `${fromStr} - Choose checkout date`;
    }
    return "Please choose checkin-checkout date";
  }

  isRangeStart(date: NgbDate): boolean {
    return !!this.fromDate && date.equals(this.fromDate);
  }

  isRangeEnd(date: NgbDate): boolean {
    return !!this.toDate && date.equals(this.toDate);
  }

  isInsideRange(date: NgbDate): boolean {
    if (!this.fromDate || !this.toDate) {
      return false;
    }

    // Check if date is strictly between fromDate and toDate
    return date.after(this.fromDate) && date.before(this.toDate);
  }

  closeDatepicker(dp: NgbInputDatepicker): void {
    dp.close();
  }

  clearSelection(): void {
    this.fromDate = null;
    this.toDate = null;
    this.selectedDateRange = '';
  }

  isRangeValid(from: NgbDate, to: NgbDate): boolean {
    let current = from;

    while (current.before(to)) {
      if (this.isDateUnavailable(current)) {
        return false;
      }

      current = this.calendar.getNext(current, 'd', 1); // ✅ correct
    }

    return true;
  }

  formatDateWithLeadingZeros(date: NgbDate): string {
    // Add leading zeros to month and day
    const month = date.month.toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    return `${month}/${day}/${date.year}`;
  }

  onDatesFormSubmit(): void {
    this.datesForm.markAllAsTouched();

    if (this.datesForm.invalid) {
      console.error('Form is invalid');
      if (this.searchCalenderControl?.hasError('required')) {
        this.showToast('Please select check-in and check-out dates', 'error');
      }
      if (this.sleepsControl?.hasError('min')) {
        this.showToast('Number of guests must be at least 1', 'error');
      }
      return;
    }

    this.isDatesFormSubmitting = true;

    try {
      // Get the value directly from formatDateRange() since that's what shows in the UI
      const dateRangeString = this.formatDateRange();
      console.log('Date range string from formatDateRange():', dateRangeString);

      if (!dateRangeString || !dateRangeString.includes(' - ')) {
        throw new Error('Please select both check-in and check-out dates');
      }

      const dates = dateRangeString.split(' - ').map(d => d.trim());
      console.log('Dates after split:', dates);

      if (dates.length !== 2) {
        throw new Error('Please select both check-in and check-out dates.');
      }

      // Validate that we don't have "Select checkout" in the string
      if (dates[1].toLowerCase().includes('select')) {
        throw new Error('Please select a check-out date');
      }

      const SDATE = this.formatDateForAPI(dates[0]);
      const EDATE = this.formatDateForAPI(dates[1]);

      // Validate dates are in correct order
      const startDate = new Date(SDATE);
      const endDate = new Date(EDATE);

      if (startDate >= endDate) {
        throw new Error('Check-out date must be after check-in date');
      }

      const formValue = this.datesForm.value;
      this.spinner.show();
      this.scheckin = SDATE;
      this.scheckout = EDATE;

      if (this.RATE_AVAILABLE == 0){
        this.isDatesFormSubmitting = false;
        this.spinner.hide();
        this.openRateNotAvailableModal();
        return;
      }

      if (this.dataSourceCode !== "AK") {
        this.isDatesFormSubmitting = false;
        this.spinner.hide();

        const message = `Unfortunately, this property requires that we call for rates. Please
			submit your inquiry and one of our travel advisors will send you a
			quote with rates as soon as possible.`.trim();
        this.providerMessages.push(message);
        this.showZeroRateModal();

        return;
      }

      // Call API
      this.crudService.getRates(
        this.listId.toString(),
        SDATE,
        EDATE,
        formValue.sleeps || 1
      ).subscribe({
        next: (response) => {
          this.isDatesFormSubmitting = false;

          if (response.error === false && response.available) {
            if (parseFloat(response["Price"]) == 0) {
              this.providerMessages = response["providerMessages"];
              this.showZeroRateModal();
            }
            else {
              this.showRatesInfoModal(response);
              // this.showToast('Rates loaded successfully!', 'success');
            }
          }
          else if (! response.available){
            //Dates not available
            // this.showToast(response.message || 'Dates not available', 'warning');
            // this.providerMessages = response["providerMessages"];
            const checkin = this.scheckin;
            const checkout = this.scheckout;

            const message = `Unfortunately, your dates from ${checkin} to ${checkout} are not available.
Please check the Availability Section for alternate dates or click on the
button below to request alternate options. For immediate assistance,
please call 850-312-5400. Thank you.`.trim();
            this.providerMessages.push(message);

            this.showZeroRateModal();
          }

          this.spinner.hide();
        },
        error: (error) => {
          this.isDatesFormSubmitting = false;
          this.showToast('Error loading rates. Please try again.', 'error');
          console.error('API Error:', error);
          this.spinner.hide();
        }
      });

    } catch (error: any) {
      this.isDatesFormSubmitting = false;
      this.showToast(error.message || 'Invalid date selection', 'error');
      console.error('Error:', error);
    }
  }

// Also update formatDateForAPI to be more robust
  private formatDateForAPI(dateString: string): string {
    // Clean the string
    const cleanString = dateString.trim();

    // Remove any non-numeric characters except slash
    const numericString = cleanString.replace(/[^0-9/]/g, '');

    // Split by slash
    const parts = numericString.split('/');

    if (parts.length !== 3) {
      throw new Error(`Invalid date format: ${dateString}. Expected MM/DD/YYYY`);
    }

    const [month, day, year] = parts;

    // Pad month and day with leading zeros
    const paddedMonth = month.padStart(2, '0');
    const paddedDay = day.padStart(2, '0');

    // Return in YYYY-MM-DD format
    return `${year}-${paddedMonth}-${paddedDay}`;
  }

  // Simple toast method
  private showToast(message: string, type: 'success' | 'error' | 'warning'): void {
    // Using alert for now, but you should replace with a proper toast service
    const alertMessage = `${type.toUpperCase()}: ${message}`;

    // You can customize the alert style based on type
    switch (type) {
      case 'success':
        alert(alertMessage);
        break;
      case 'error':
        alert(alertMessage);
        break;
      case 'warning':
        alert(alertMessage);
        break;
    }

    console.log(`${type.toUpperCase()}: ${message}`);
  }

  sendManagersiteURL() {
    // const checkInDate = localStorage.getItem("checkInDate");
    // const checkOutDate = localStorage.getItem("checkOutDate");

    // Check if checkInDate or checkOutDate is null
    // const formattedCheckInDate = checkInDate ? checkInDate : "";
    // const formattedCheckOutDate = checkOutDate ? checkOutDate : "";
    // this.managersiteURL = `http://quote.destinique.com/destin/dashboard/?v=list&view_list_id=${this.listId}&checkin=${formattedCheckInDate}&checkout=${formattedCheckOutDate}`;
    const managersiteURL = `http://quote.destinique.com/destin/dashboard/?v=list&view_list_id=${this.listId}`;
    window.open(managersiteURL, "_blank");
  }

  getRatesAndShowPopup() {
    /*
    const checkInDate = localStorage.getItem("checkInDate");
    const checkOutDate = localStorage.getItem("checkOutDate");
    // const scrapingURL = `https://destinique.org/ratesapp4website/?task=get_rate&list_id=${this.listId}&SDATE=${checkInDate}&EDATE=${checkOutDate}&rateScraped=1`;
    const scrapingURL = `https://destinique.org/ratesapp4website/index-debug.php?task=get_rate&list_id=${this.listId}&SDATE=${checkInDate}&EDATE=${checkOutDate}&rateScraped=1`;

    // Make an HTTP GET request to the scrapingURL
    this.http.get(scrapingURL).subscribe(
      (resp) => {
        if (resp && resp["Price"]) {
          const basePrice = parseFloat(resp["base_price"]).toFixed(2);
          const commission = parseFloat(resp["commission"]).toFixed(2);
          const price = parseFloat(resp["Price"]).toFixed(2);
          const sourceRateDetails	= resp["sourceRateDetails"];
          const satisfiedRule	= resp["satisfiedRule"];
          this.openPopup(`${price}`, `${basePrice}`, `${commission}`, sourceRateDetails, satisfiedRule);
        } else {
          // Handle the case where no price is found
          this.openErrorPopup("Unable to fetch the price");
        }
      },
      (error) => {
        // Handle the error case
        this.openErrorPopup("An error occurred while fetching the price");
      }
    );
    */
  }

  getPropertyId() {
    const property_id = localStorage.getItem("PropertyunitId");

    this.openPopupForPropId(`${property_id}`);
  }

  openPopupForPropId(property_id: any) {
    this.toast.success(`${property_id}`, "Property Id", {
      tapToDismiss: true,
      closeButton: true,
      timeOut: 0,
      positionClass: "toast-top-center",
    });
  }

  sendDestiniqueManageIamgeURL() {
    let manageImgURL  = `https://quote.destinique.com/destin/dashboard/?v=upload&list_id=${this.listId}`;
    window.open(manageImgURL, "_blank");
  }

  openRateNotAvailableModal(){
    this.modalService.open(this.rateNotAvailableTpl, {
      size: 'lg',
      centered: true,
      scrollable: false,
      backdrop: 'static',
      keyboard: false
    });
  }

  showZeroRateModal(){
    this.modalService.open(this.zeroRateTpl, {
      size: 'lg',
      centered: true,
      scrollable: false,
      backdrop: 'static',
      keyboard: false
    });
  }

  closeModalAndNavigate(routePath:any) {
    this.modalService.dismissAll();
    this.router.navigateByUrl('/' + routePath);
  }

  showRatesInfoModal(rateInfo?: any) {
    if (rateInfo){
      this.securityDeposit = parseFloat(rateInfo["securityDeposit"]).toFixed(2);
      this.rates = parseFloat(rateInfo["Price"]).toFixed(2);
    }

    this.modalService.open(this.ratesShowTpl, {
      size: 'lg',
      centered: true,
      scrollable: false,
      backdrop: 'static',
      keyboard: false
    });
  }
}
