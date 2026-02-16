// property-list.component.ts
import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PropertyService, PropertyResponse, Property } from 'src/app/shared/services/property.service';
import { SearchStateService } from 'src/app/shared/services/search-state.service';
import { LoadSpinnerService } from 'src/app/shared/services/load-spinner.service';
import {
  buildUrlFromState,
  areUrlsEquivalent,
  DEFAULT_PROPERTIES_URL_CONFIG
} from '../properties-url.config';
import { SearchState } from 'src/app/shared/interfaces/search-state.interface';

@Component({
  selector: 'app-property-list',
  templateUrl: './property-list.component.html',
  styleUrls: ['./property-list.component.scss']
})
export class PropertyListComponent implements OnInit, OnDestroy {
  // ========== PROPERTY DATA ==========
  properties: Property[] = [];

  // ========== DROPDOWNS ==========
  advancedSearchOpen = false;
  priceRangeOpen = false;
  @ViewChild('advancedSearchDropdown') advancedSearchDropdown?: ElementRef<HTMLDivElement>;
  @ViewChild('priceRangeDropdown') priceRangeDropdown?: ElementRef<HTMLDivElement>;
  @ViewChild('propertiesGridArea') propertiesGridArea?: ElementRef<HTMLDivElement>;
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
  /** Set when syncing URL; skip the next state$ emission (from resolver) to avoid loop + duplicate API call */
  private skipNextEmissionFromUrlSync = false;
  isLoading = false;
  isInitialLoad = true; // spinner on first load, skeleton on pagination/filter changes
  skeletonCount = [1, 2, 3];
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
    private loadSpinner: LoadSpinnerService,
    private router: Router
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
      .subscribe((state) => {
        if (this.skipNextEmissionFromUrlSync) {
          this.skipNextEmissionFromUrlSync = false;
          return; // Emission came from resolver after our URL sync – don't load API or sync again
        }
        this.loadProperties();
        this.syncUrlFromState(state);
      });
  }

  /**
   * Sync browser URL to match search state for shareable links.
   * Uses replaceUrl to avoid polluting history on filter changes.
   * Does NOT trigger API call; the resolver's state update is skipped via skipNextEmissionFromUrlSync.
   * Passes queryParams: null when empty to explicitly clear URL params on reset.
   */
  private syncUrlFromState(state: SearchState): void {
    const config = DEFAULT_PROPERTIES_URL_CONFIG;
    const currentUrl = this.router.url.split('#')[0];
    if (areUrlsEquivalent(currentUrl, state, config)) {
      return;
    }
    this.skipNextEmissionFromUrlSync = true;
    const { pathCommands, queryParams } = buildUrlFromState(state, config);
    const hasQueryParams = Object.keys(queryParams).length > 0;
    this.router.navigate(pathCommands, {
      queryParams: hasQueryParams ? queryParams : null,
      replaceUrl: true
    });
  }

  private loadProperties(): void {
    this.isLoading = true;

    if (this.isInitialLoad) {
      this.loadSpinner.show('Loading properties...');
    }

    const params = this.searchState.getSearchParams();

    this.propertyService.searchProperties(params).subscribe({
      next: (response: PropertyResponse) => {
        this.properties = response.data;
        this.updatePaginationInfo(response);
        this.isLoading = false;
        if (this.isInitialLoad) {
          this.isInitialLoad = false;
          this.loadSpinner.hide();
        }
      },
      error: (error) => {
        console.error('Error loading properties:', error);
        this.properties = [];
        this.isLoading = false;
        if (this.isInitialLoad) {
          this.isInitialLoad = false;
          this.loadSpinner.hide();
        }
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
    this.scrollToPropertiesGrid();
    this.searchState.updatePagination(page);
  }

  onPageSizeChange(pageSize: number): void {
    this.scrollToPropertiesGrid();
    this.searchState.updatePagination(1, pageSize);
  }

  onSortChange(sortBy: string): void {
    this.scrollToPropertiesGrid();
    this.searchState.updateSorting(sortBy);
  }

  private scrollToPropertiesGrid(): void {
    this.propertiesGridArea?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    if (this.advancedSearchOpen) this.priceRangeOpen = false;
  }

  togglePriceRange(): void {
    this.priceRangeOpen = !this.priceRangeOpen;
    if (this.priceRangeOpen) this.advancedSearchOpen = false;
  }

  closePriceRange(): void {
    this.priceRangeOpen = false;
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
    if (this.priceRangeOpen && this.priceRangeDropdown?.nativeElement && !this.priceRangeDropdown.nativeElement.contains(target)) {
      this.priceRangeOpen = false;
    }
  }
}
