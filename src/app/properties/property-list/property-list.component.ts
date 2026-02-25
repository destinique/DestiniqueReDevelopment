// property-list.component.ts
import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
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
  /** De-dupe key for last search params sent to API */
  private lastApiParamsKey: string | null = null;
  /** Set when syncing URL; next state$ emission (from resolver) must not call syncUrlFromState again or browser can loop/freeze */
  private skipNextEmissionFromUrlSync = false;
  /** True while a URL sync is in progress; prevents loading again from urlNeedsUpdate=false when setTimeout ran first */
  private syncInProgress = false;
  /** Prevents a second loadProperties() from running until the current request finishes (stops duplicate API calls) */
  private loadInProgress = false;
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
          this.syncInProgress = false;
          this.loadProperties();
          return;
        }

        const config = DEFAULT_PROPERTIES_URL_CONFIG;
        const currentUrl = this.router.url.split('#')[0];
        const urlNeedsUpdate = !areUrlsEquivalent(currentUrl, state, config);

        if (urlNeedsUpdate) {
          this.syncUrlFromState(state);
        } else {
          if (this.syncInProgress) {
            this.syncInProgress = false;
            return;
          }
          this.loadProperties();
        }
      });
  }

  /**
   * Sync browser URL to match search state for shareable links.
   * Sets skipNextEmissionFromUrlSync so the resolver's state emission does not call syncUrlFromState again
   * (router.url can still be old when resolver runs, which would cause an infinite sync loop and freeze the browser).
   * Fallback setTimeout triggers loadProperties only when resolver does not run (e.g. reset to empty URL).
   */
  private syncUrlFromState(state: SearchState): void {
    const config = DEFAULT_PROPERTIES_URL_CONFIG;
    this.skipNextEmissionFromUrlSync = true;
    this.syncInProgress = true;
    const { pathCommands, queryParams } = buildUrlFromState(state, config);
    const hasQueryParams = Object.keys(queryParams).length > 0;

    this.router.navigate(pathCommands, {
      queryParams: hasQueryParams ? queryParams : null,
      replaceUrl: true
    }).then(() => {
      setTimeout(() => {
        if (this.skipNextEmissionFromUrlSync) {
          this.skipNextEmissionFromUrlSync = false;
          this.loadProperties();
          setTimeout(() => (this.syncInProgress = false), 50);
        }
      }, 150);
    }).catch(() => {
      this.skipNextEmissionFromUrlSync = false;
      this.syncInProgress = false;
      this.loadProperties();
    });
  }

  /**
   * Stable string key for params so identical params always produce the same key
   * (avoids duplicate API calls when resolver and user state differ only by property order or Date format).
   */
  private stableParamsKey(obj: Record<string, unknown> | unknown): string {
    if (obj === null || obj === undefined) return '';
    if (obj instanceof Date) return obj.getTime().toString();
    if (typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return '[' + obj.map((v) => this.stableParamsKey(v)).join(',') + ']';
    const keys = Object.keys(obj).filter((k) => (obj as Record<string, unknown>)[k] !== undefined && (obj as Record<string, unknown>)[k] !== null).sort();
    const parts = keys.map((k) => JSON.stringify(k) + ':' + this.stableParamsKey((obj as Record<string, unknown>)[k]));
    return '{' + parts.join(',') + '}';
  }

  private loadProperties(): void {
    if (this.loadInProgress) return;

    const params = this.searchState.getSearchParams();
    const key = this.stableParamsKey(params);

    if (this.lastApiParamsKey === key) return;
    this.lastApiParamsKey = key;
    this.loadInProgress = true;

    this.isLoading = true;

    if (this.isInitialLoad) {
      this.loadSpinner.show('Loading properties...');
    }

    this.propertyService.searchProperties(params).subscribe({
      next: (response: PropertyResponse) => {
        this.properties = response.data;
        this.updatePaginationInfo(response);
        this.isLoading = false;
        this.loadInProgress = false;
        if (this.isInitialLoad) {
          this.isInitialLoad = false;
          this.loadSpinner.hide();
        }
      },
      error: (error) => {
        console.error('Error loading properties:', error);
        this.properties = [];
        this.isLoading = false;
        this.loadInProgress = false;
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
