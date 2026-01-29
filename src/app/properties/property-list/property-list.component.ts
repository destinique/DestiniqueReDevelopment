// property-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
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
  expandedPropertyId: number | null = null;
  showMoreDetailsGlobal = false;

  // ========== FILTER OPTIONS ==========
  sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'bedrooms', label: 'Bedrooms' },
    { value: 'bathrooms', label: 'Bathrooms' },
    { value: 'sleeps', label: 'Sleeps' }
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
    this.loadProperties();
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
    this.expandedPropertyId = this.expandedPropertyId === propertyId ? null : propertyId;
  }

  onToggleGlobalMoreDetails(): void {
    this.showMoreDetailsGlobal = !this.showMoreDetailsGlobal;
    if (!this.showMoreDetailsGlobal) {
      this.expandedPropertyId = null;
    }
  }
}
