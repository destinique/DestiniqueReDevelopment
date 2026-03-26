// property-list.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList,
  ChangeDetectorRef,
} from '@angular/core';
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
  mapProperties: Property[] = [];
  activePropertyId: number | null = null;
  /** When user hovers a list card, this is set so the map can highlight the matching marker */
  hoveredPropertyId: number | null = null;
  visiblePropertyIds: number[] = [];
  private lastAppliedVisiblePropertyIds: number[] | null = null;
  mapFilteringEnabled = false;
  private mapFilterDebounceHandle: any = null;

  // ========== DROPDOWNS ==========
  advancedSearchOpen = false;
  priceRangeOpen = false;
  @ViewChild('advancedSearchDropdown') advancedSearchDropdown?: ElementRef<HTMLDivElement>;
  @ViewChild('priceRangeDropdown') priceRangeDropdown?: ElementRef<HTMLDivElement>;
  @ViewChild('propertiesGridArea') propertiesGridArea?: ElementRef<HTMLDivElement>;
  @ViewChildren('propertyCardWrapper') propertyCardWrappers?: QueryList<ElementRef<HTMLDivElement>>;
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
  private intersectionObserver?: IntersectionObserver;
  isLoading = false;
  /** While map-based filtering is in progress, show card skeletons */
  isFiltering = false;
  isInitialLoad = true; // spinner on first load, skeleton on pagination/filter changes
  /** Skeleton placeholders count = pageSize so list height doesn't shrink when showing skeleton */
  get skeletonArray(): number[] {
    const n = this.paginationInfo?.pageSize ?? 12;
    return Array.from({ length: Math.min(Math.max(n, 1), 60) }, (_, i) => i);
  }

  /** More Details: set of property list_ids that are expanded (per-card toggle) */
  expandedPropertyIds: Set<number> = new Set();
  /** More Details: when true, all cards show expanded details */
  showMoreDetailsGlobal = false;
  /** Show Map: when true (default), the map panel is visible */
  showMap = true;

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
    { value: 12, label: '12' },
    { value: 24, label: '24' },
    { value: 48, label: '48' },
    { value: 60, label: '60' }
  ];

  constructor(
    private propertyService: PropertyService,
    public searchState: SearchStateService,
    private loadSpinner: LoadSpinnerService,
    private router: Router,
    private cdr: ChangeDetectorRef
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
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
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
        this.mapProperties = response.data;
        this.properties = response.data;
        this.activePropertyId = this.properties.length ? this.properties[0].list_id : null;
        this.updatePaginationInfo(response);
        this.isLoading = false;
        this.isFiltering = false;
        this.loadInProgress = false;
        if (this.isInitialLoad) {
          this.isInitialLoad = false;
          this.loadSpinner.hide();
        }
      },
      error: (error) => {
        console.error('Error loading properties:', error);
        this.mapProperties = [];
        this.properties = [];
        this.activePropertyId = null;
        this.isLoading = false;
        this.isFiltering = false;
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
    this.searchState.updatePagination(page);
  }

  onPageSizeChange(pageSize: number): void {
    this.searchState.updatePagination(1, pageSize);
  }

  onSortChange(sortBy: string): void {
    this.searchState.updateSorting(sortBy);
  }

  /** Toggle More Details for a single property card */
  onToggleExpand(propertyId: number): void {
    const next = new Set(this.expandedPropertyIds);
    if (next.has(propertyId)) next.delete(propertyId);
    else next.add(propertyId);
    this.expandedPropertyIds = next;
  }

  /** View more toggle: when on, all cards show expanded details */
  onViewMoreToggle(): void {
    this.showMoreDetailsGlobal = !this.showMoreDetailsGlobal;
  }

  /** Show Map toggle: when off, hides the map panel and expands the list to full width */
  onShowMapToggle(): void {
    this.showMap = !this.showMap;

    // Whenever map panel visibility changes, reset map-bounds filtering state
    // and fetch a fresh unbounded list for current search params.
    this.visiblePropertyIds = [];
    this.lastAppliedVisiblePropertyIds = null;
    this.mapFilteringEnabled = false;
    this.isFiltering = true;
    this.properties = this.mapProperties.slice();

    // Force refresh even when params are unchanged (keep existing skeleton behavior).
    this.lastApiParamsKey = null;
    this.loadProperties();
  }

  /** Keyboard: Space/Enter on View more switch toggles it */
  onViewMoreKeydown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.onViewMoreToggle();
    }
  }

  private scrollToPropertiesGrid(): void {
    this.propertiesGridArea?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onListIdSearchComplete(results: any): void {
    // Handle list ID search results
    if (results && results.length > 0) {
      this.mapProperties = results;
      this.properties = results;
      this.activePropertyId = this.properties[0]?.list_id ?? null;
      // Update pagination for single result
      this.paginationInfo = {
        page: 1,
        pageSize: this.paginationInfo.pageSize,
        total: results.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      };
      this.isFiltering = false;
    }
  }

  setActiveProperty(listId: number): void {
    this.activePropertyId = listId;
  }

  onMapPropertyFocused(listId: number): void {
    this.activePropertyId = listId;
  }

  onVisiblePropertyIdsChange(ids: number[]): void {
    if (!this.mapFilteringEnabled) {
      // Ignore map bounds changes until user has actually zoomed.
      return;
    }

    // Debounce updates so we only filter once the user pauses zooming/panning.
    this.isFiltering = true;
    if (this.mapFilterDebounceHandle) {
      clearTimeout(this.mapFilterDebounceHandle);
    }

    this.visiblePropertyIds = ids ?? [];

    this.mapFilterDebounceHandle = setTimeout(() => {
      if (!this.visiblePropertyIds || this.visiblePropertyIds.length === 0) {
        this.properties = [];
        this.lastAppliedVisiblePropertyIds = [];
        this.scrollToPropertiesGrid();
        this.isFiltering = false;
        this.cdr.detectChanges();
        return;
      }

      const nextIds = [...this.visiblePropertyIds].sort((a, b) => a - b);
      const prevIds = this.lastAppliedVisiblePropertyIds
        ? [...this.lastAppliedVisiblePropertyIds].sort((a, b) => a - b)
        : null;

      const isSameAsPrevious =
        !!prevIds &&
        prevIds.length === nextIds.length &&
        prevIds.every((id, idx) => id === nextIds[idx]);

      if (isSameAsPrevious) {
        this.isFiltering = false;
        this.cdr.detectChanges();
        return;
      }

      const idSet = new Set(this.visiblePropertyIds);
      this.properties = this.mapProperties.filter((p) => idSet.has(p.list_id));
      this.lastAppliedVisiblePropertyIds = nextIds;
      this.scrollToPropertiesGrid();
      this.isFiltering = false;
      this.cdr.detectChanges();
    }, 250);
  }

  onMapReset(): void {
    this.visiblePropertyIds = [];
    this.lastAppliedVisiblePropertyIds = null;
    this.mapFilteringEnabled = false;
    this.properties = this.mapProperties.slice();
  }

  onMapFilteringActivated(): void {
    this.mapFilteringEnabled = true;
    this.isFiltering = true;
    this.cdr.detectChanges();
  }

  private setupIntersectionObserver(): void {
    if (typeof window === 'undefined' || !(window as any).IntersectionObserver) {
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        const visible: Array<{ id: number; distance: number }> = [];
        const viewportCenter = window.innerHeight / 2;

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          const idAttr = target.getAttribute('data-property-id');
          if (!idAttr) continue;
          const rect = entry.boundingClientRect;
          const elementCenter = rect.top + rect.height / 2;
          const distance = Math.abs(elementCenter - viewportCenter);
          visible.push({ id: Number(idAttr), distance });
        }

        if (!visible.length) return;

        visible.sort((a, b) => a.distance - b.distance);
        const closest = visible[0];
        if (closest && closest.id !== this.activePropertyId) {
          this.activePropertyId = closest.id;
        }
      },
      {
        threshold: 0.4
      }
    );

    const observeAll = (list: QueryList<ElementRef<HTMLDivElement>>) => {
      this.intersectionObserver?.disconnect();
      list.forEach((el) => {
        if (el.nativeElement) {
          this.intersectionObserver?.observe(el.nativeElement);
        }
      });
    };

    if (this.propertyCardWrappers) {
      observeAll(this.propertyCardWrappers);
      this.propertyCardWrappers.changes.subscribe(
        (list: QueryList<ElementRef<HTMLDivElement>>) => observeAll(list)
      );
    }
  }

  /** Stable identity for list items so Angular reuses DOM and images don’t re-render on scroll */
  trackByPropertyId(_: number, property: Property): number {
    return property.list_id;
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
