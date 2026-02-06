// property-list.component.ts
import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PropertyService, PropertyResponse, Property } from 'src/app/shared/services/property.service';
import { SearchStateService } from 'src/app/shared/services/search-state.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-property-list',
  templateUrl: './property-list.component.html',
  styleUrls: ['./property-list.component.scss']
})
export class PropertyListComponent implements OnInit, OnDestroy {
  // ========== PROPERTY DATA ==========
  properties: Property[] = [];

  // ========== ADVANCED SEARCH DROPDOWN ==========
  advancedSearchOpen = false;
  @ViewChild('advancedSearchDropdown') advancedSearchDropdown?: ElementRef<HTMLDivElement>;
  paginationInfo: any = {
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  };

  // ========== COMPONENT STATE ==========
  private destroy$ = new Subject<void>();
  private searchSubscription?: Subscription;
  isLoading = false;
  expandedPropertyIds: Set<number> = new Set();
  showMoreDetailsGlobal = false;

  // ========== FILTER OPTIONS ==========
  sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'bedrooms_asc', label: 'Bedroom# (Low to High)' },
    { value: 'bedrooms_desc', label: 'Bedroom# (High to Low)' },
    { value: 'bathrooms_asc', label: 'Bathroom# (Low to High)' },
    { value: 'bathrooms_desc', label: 'Bathroom# (High to Low)' },
    { value: 'sleeps_asc', label: 'Sleeps# (Low to High)' },
    { value: 'sleeps_desc', label: 'Sleeps# (High to Low)' },
    { value: 'city_asc', label: 'City Name ASC' },
    { value: 'city_desc', label: 'City Name DESC' },
    { value: 'state_asc', label: 'State Name ASC' },
    { value: 'state_desc', label: 'State Name DESC' }
  ];

  pageSizeOptions = [
    { value: 12, label: '12 per page' },
    { value: 24, label: '24 per page' },
    { value: 48, label: '48 per page' },
    { value: 60, label: '60 per page' }
  ];

  constructor(
    private propertyService: PropertyService,
    public searchState: SearchStateService,
    private spinner: NgxSpinnerService
  ) {}

  // ========== LIFECYCLE HOOKS ==========
  ngOnInit(): void {
    this.setupSearchListener();
    //this.loadProperties();
    // we don't need to call this method as setupSearchListener has subscribed to a BehaviorSubject
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  // ========== DATA LOADING ==========
  private setupSearchListener(): void {
    this.searchState.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadProperties();
      });
  }

  private loadProperties(): void {
    this.isLoading = true;
    this.spinner.show();

    const params = this.searchState.getSearchParams();

    this.propertyService.searchProperties(params).subscribe({
      next: (response: PropertyResponse) => {
        this.properties = response.data;

        // console.log(this.properties);

        this.updatePaginationInfo(response);
        this.isLoading = false;
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error loading properties:', error);
        this.properties = [];
        this.isLoading = false;
        this.spinner.hide();
      }
    });
  }

  private updatePaginationInfo(response: PropertyResponse): void {
    this.paginationInfo = {
      page: response.pagination.page,
      pageSize: response.pagination.pageSize,
      total: response.pagination.total,
      totalPages: response.pagination.totalPages,
      hasNext: response.pagination.page < response.pagination.totalPages,
      hasPrev: response.pagination.page > 1
    };
  }

  // ========== EVENT HANDLERS ==========
  onPageChange(page: number): void {
    this.searchState.updatePagination(page);
  }

  onPageSizeChange(pageSize: number): void {
    this.searchState.updatePagination(1, pageSize);
  }

  onSortChange(sortBy: string): void {
    this.searchState.updateSorting(sortBy);
  }

  onListIdSearchComplete(results: any): void {
    // Handle list ID search results
    if (results && results.length > 0) {
      this.properties = results;
      // Update pagination for single result
      this.paginationInfo = {
        page: 1,
        pageSize: this.paginationInfo.pageSize,
        total: results.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      };
    }
  }

  onToggleExpand(propertyId: number): void {
    const next = new Set(this.expandedPropertyIds);
    if (next.has(propertyId)) next.delete(propertyId);
    else next.add(propertyId);
    this.expandedPropertyIds = next;
  }

  onToggleGlobalMoreDetails(): void {
    // this.showMoreDetailsGlobal = !this.showMoreDetailsGlobal;
    if (!this.showMoreDetailsGlobal) {
      this.expandedPropertyIds = new Set();
    }
  }

  toggleAdvancedSearch(): void {
    this.advancedSearchOpen = !this.advancedSearchOpen;
  }

  closeAdvancedSearch(): void {
    this.advancedSearchOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (this.advancedSearchOpen && this.advancedSearchDropdown?.nativeElement && !this.advancedSearchDropdown.nativeElement.contains(target)) {
      this.advancedSearchOpen = false;
    }
  }
}
