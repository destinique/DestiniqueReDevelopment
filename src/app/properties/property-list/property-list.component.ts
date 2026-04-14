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
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
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
  /** Marker under pointer on map (list highlight while hovering) */
  mapMarkerHoverListId: number | null = null;
  /** Last property chosen by clicking a map marker (keeps list ring after pointer leaves marker) */
  lastMapClickedListId: number | null = null;
  private mapListScrollDebounce: ReturnType<typeof setTimeout> | null = null;
  private readonly mapListScrollDebounceMs = 90;
  /** Same-path navigations (e.g. query-only pageSize/sort) should not jump scroll — Router scrollPositionRestoration scrolls to top otherwise */
  private windowScrollToRestoreAfterNav: number | null = null;
  /** Which list_id gets the map-sync highlight (hover wins over last click) */
  get mapListMarkerHighlightId(): number | null {
    return this.mapMarkerHoverListId ?? this.lastMapClickedListId;
  }
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
    summary: '',
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
    this.setupSamePathScrollPreservation();
    //this.loadProperties();
    // we don't need to call this method as setupSearchListener has subscribed to a BehaviorSubject
  }

  /**
   * When only query params change (per page, sort, filters), the root Router still scrolls the window.
   * Preserve vertical scroll for same-path navigations on the properties routes.
   */
  private setupSamePathScrollPreservation(): void {
    const pathOnly = (url: string): string => {
      const t = url.trim();
      const withSlash = t.startsWith('/') ? t : '/' + t;
      return withSlash.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
    };

    this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter((e): e is NavigationStart => e instanceof NavigationStart)
      )
      .subscribe((e) => {
        const prevPath = pathOnly(this.router.url);
        const nextPath = pathOnly(e.url);
        if (prevPath !== nextPath || !prevPath.startsWith('/properties')) {
          this.windowScrollToRestoreAfterNav = null;
          return;
        }
        this.windowScrollToRestoreAfterNav =
          window.scrollY || document.documentElement.scrollTop || 0;
      });

    this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd)
      )
      .subscribe(() => {
        const y = this.windowScrollToRestoreAfterNav;
        if (y === null) {
          return;
        }
        this.windowScrollToRestoreAfterNav = null;
        const restore = (): void => {
          window.scrollTo({ top: y, left: 0, behavior: 'auto' });
        };
        setTimeout(restore, 0);
        setTimeout(restore, 50);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    if (this.mapListScrollDebounce) {
      clearTimeout(this.mapListScrollDebounce);
      this.mapListScrollDebounce = null;
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
        this.mapMarkerHoverListId = null;
        this.lastMapClickedListId = null;
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
    const paginationSummary = (response.pagination as any).summary;
    this.paginationInfo = {
      page: response.pagination.page,
      pageSize: response.pagination.pageSize,
      total: response.pagination.total,
      summary: paginationSummary ?? `${response.pagination.total} properties`,
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
    this.mapMarkerHoverListId = null;
    this.lastMapClickedListId = null;

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
    this.propertiesGridArea?.nativeElement?.scrollIntoView({
      behavior: 'auto',
      block: 'nearest',
      inline: 'nearest',
    });
  }

  onListIdSearchComplete(results: any): void {
    // Handle list ID search results
    if (results && results.length > 0) {
      this.mapProperties = results;
      this.properties = results;
      this.activePropertyId = this.properties[0]?.list_id ?? null;
      this.mapMarkerHoverListId = null;
      this.lastMapClickedListId = null;
      // Update pagination for single result
      this.paginationInfo = {
        page: 1,
        pageSize: this.paginationInfo.pageSize,
        total: results.length,
        summary: `${results.length} properties`,
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
    this.lastMapClickedListId = listId;
    if (this.mapListScrollDebounce) {
      clearTimeout(this.mapListScrollDebounce);
      this.mapListScrollDebounce = null;
    }
    this.scheduleScrollListToPropertyCard(listId, true);
  }

  onMapMarkerListHover(listId: number | null): void {
    this.mapMarkerHoverListId = listId;
    if (this.mapListScrollDebounce) {
      clearTimeout(this.mapListScrollDebounce);
      this.mapListScrollDebounce = null;
    }
    if (listId == null) {
      return;
    }
    this.scheduleScrollListToPropertyCard(listId, false);
  }

  private scheduleScrollListToPropertyCard(listId: number, immediate: boolean): void {
    const run = () => {
      this.mapListScrollDebounce = null;
      this.scrollListToPropertyCard(listId);
    };
    if (immediate) {
      requestAnimationFrame(() => run());
      return;
    }
    this.mapListScrollDebounce = setTimeout(run, this.mapListScrollDebounceMs);
  }

  private scrollListToPropertyCard(listId: number): void {
    const idStr = String(listId);
    const fromQuery = this.propertyCardWrappers
      ?.toArray()
      .find((r) => r.nativeElement?.getAttribute('data-property-id') === idStr);
    const el =
      fromQuery?.nativeElement ??
      (typeof document !== 'undefined'
        ? (document.querySelector(`[data-property-id="${idStr}"]`) as HTMLElement | null)
        : null);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
