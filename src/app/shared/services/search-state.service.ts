import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';
import { SearchState, LocationData, SearchParams } from '../interfaces/search-state.interface';

@Injectable({
  providedIn: 'root'
})
export class SearchStateService {
  // Default initial state - ALL optional fields should be undefined
  private defaultState: SearchState = {
    location: null,
    // REMOVE ALL null values for optional fields
    // They will be undefined by default
    amenities: [],
    providers: [],
    propertyTypes: [],
    viewTypes: [],
    searchExact: false,
    petFriendly: false,
    page: 1,
    pageSize: 12,
    sortBy: 'newest'
    // minBedrooms, minBathrooms, minGuests, minPrice, maxPrice, checkIn, checkOut
    // are automatically undefined (optional fields)
  };

  // Main state observable
  private stateSubject = new BehaviorSubject<SearchState>(this.defaultState);
  public state$ = this.stateSubject.asObservable();

  // Convenience observables for specific state parts
  public location$ = this.state$.pipe(
    map(state => state.location),
    distinctUntilChanged()
  );

  public filters$ = this.state$.pipe(
    map(state => {
      const { page, pageSize, sortBy, ...filters } = state;
      return filters;
    }),
    distinctUntilChanged()
  );

  public pagination$ = this.state$.pipe(
    map(state => ({
      page: state.page,
      pageSize: state.pageSize,
      sortBy: state.sortBy
    })),
    distinctUntilChanged()
  );

  /**
   * Get current state snapshot
   */
  get currentState(): SearchState {
    return this.stateSubject.getValue();
  }

  /**
   * Update location from Google Places
   */
  updateLocation(location: LocationData | null): void {
    this.updateState({ location, page: 1 });
  }

  /**
   * Update date range - CHANGE: Accept undefined, not null
   */
  updateDates(checkIn?: Date, checkOut?: Date): void {
    this.updateState({ checkIn, checkOut, page: 1 });
  }

  /**
   * Update numeric filters - CHANGE: Accept undefined, not null
   */
  updateNumericFilter(field: 'minBedrooms' | 'minBathrooms' | 'minGuests', value?: number): void {
    this.updateState({ [field]: value, page: 1 });
  }

  /**
   * Update price range - CHANGE: Accept undefined, not null
   */
  updatePriceRange(minPrice?: number, maxPrice?: number): void {
    this.updateState({ minPrice, maxPrice, page: 1 });
  }

  /**
   * Update array filters (amenities, providers, etc.)
   */
  updateArrayFilter(field: 'amenities' | 'providers' | 'propertyTypes' | 'viewTypes', items: string[]): void {
    this.updateState({ [field]: items, page: 1 });
  }

  /**
   * Update all advanced-search filters in one go (single state emission).
   */
  updateAdvancedFilters(updates: Partial<Pick<SearchState, 'minBedrooms' | 'minBathrooms' | 'amenities' | 'providers' | 'propertyTypes' | 'viewTypes' | 'searchExact' | 'petFriendly'>>): void {
    this.updateState({ ...updates, page: 1 });
  }

  /**
   * Toggle boolean filters
   */
  toggleBooleanFilter(field: 'searchExact' | 'petFriendly', value?: boolean): void {
    const currentValue = this.currentState[field];
    const newValue = value !== undefined ? value : !currentValue;
    this.updateState({ [field]: newValue, page: 1 });
  }

  /**
   * Update pagination
   */
  updatePagination(page: number, pageSize?: number): void {
    const updates: Partial<SearchState> = { page };
    if (pageSize !== undefined) {
      updates.pageSize = pageSize;
    }
    this.updateState(updates);
  }

  /**
   * Update sorting
   */
  updateSorting(sortBy: string): void {
    this.updateState({ sortBy, page: 1 });
  }

  /**
   * Check if any search filters are active - CHANGE: Check for undefined
   */
  hasActiveFilters(): boolean {
    const state = this.currentState;
    return !!(
      state.location ||
      state.checkIn !== undefined ||
      state.checkOut !== undefined ||
      state.minBedrooms !== undefined ||
      state.minBathrooms !== undefined ||
      state.minGuests !== undefined ||
      state.minPrice !== undefined ||
      state.maxPrice !== undefined ||
      state.amenities.length > 0 ||
      state.providers.length > 0 ||
      state.propertyTypes.length > 0 ||
      state.viewTypes.length > 0 ||
      state.searchExact ||
      state.petFriendly
    );
  }

  /**
   * Get active filters count - CHANGE: Check for undefined, not truthy
   */
  getActiveFiltersCount(): number {
    const state = this.currentState;
    let count = 0;

    if (state.location) count++;
    if (state.checkIn !== undefined) count++;  // Changed from if (state.checkIn)
    if (state.checkOut !== undefined) count++; // Changed from if (state.checkOut)
    if (state.minBedrooms !== undefined) count++;
    if (state.minBathrooms !== undefined) count++;
    if (state.minGuests !== undefined) count++;
    if (state.minPrice !== undefined || state.maxPrice !== undefined) count++;
    if (state.amenities.length) count++;
    if (state.providers.length) count++;
    if (state.propertyTypes.length) count++;
    if (state.viewTypes.length) count++;
    if (state.searchExact) count++;
    if (state.petFriendly) count++;

    return count;
  }

  /**
   * Prepare search parameters for API request
   */
  getSearchParams(): SearchParams {
    const state = this.currentState;

    const params: SearchParams = {
      // Flatten location (convert null to undefined)
      city: state.location?.city,
      state: state.location?.state,
      country: state.location?.country,
      latitude: state.location?.latitude,  // No need for || undefined
      longitude: state.location?.longitude, // No need for || undefined
      locationText: state.location?.text,

      // Dates - already undefined if not set
      checkIn: state.checkIn,
      checkOut: state.checkOut,

      // Numeric filters - no conversion needed since they're already undefined
      minBedrooms: state.minBedrooms,
      minBathrooms: state.minBathrooms,
      minGuests: state.minGuests,
      minPrice: state.minPrice,
      maxPrice: state.maxPrice,

      // Arrays (only include if non-empty)
      amenities: state.amenities.length > 0 ? state.amenities : undefined,
      providers: state.providers.length > 0 ? state.providers : undefined,
      propertyTypes: state.propertyTypes.length > 0 ? state.propertyTypes : undefined,
      viewTypes: state.viewTypes.length > 0 ? state.viewTypes : undefined,

      // Booleans (only include if true)
      searchExact: state.searchExact || undefined,
      petFriendly: state.petFriendly || undefined,

      // Pagination
      page: state.page,
      pageSize: state.pageSize,
      sortBy: state.sortBy
    };

    return params;
  }

  /**
   * Reset all filters to defaults
   */
  resetAll(): void {
    this.stateSubject.next(this.defaultState);
  }

  /**
   * Reset only search filters (keep pagination/sort)
   */
  resetFilters(): void {
    const current = this.currentState;
    this.stateSubject.next({
      ...this.defaultState,
      page: current.page,
      pageSize: current.pageSize,
      sortBy: current.sortBy
    });
  }

  /**
   * Private helper to update state
   */
  private updateState(updates: Partial<SearchState>): void {
    const previousState = this.currentState;
    const newState = { ...previousState, ...updates };

    // Log changes
    this.logStateChange(previousState, newState);

    this.stateSubject.next(newState);
  }

  /**
   * Initialize from URL parameters (for bookmarking/sharing searches)
   */
  initializeFromUrlParams(params: any): void {
    console.log('Initialize from URL params:', params);
  }

  /**
   * DEBUG: Log current state to console
   */
  debugLogCurrentState(label: string = 'Current State'): void {
    const state = this.currentState;
    console.log(`🔍 ${label}:`, {
      location: state.location,
      checkIn: state.checkIn,
      checkOut: state.checkOut,
      minBedrooms: state.minBedrooms,
      minBathrooms: state.minBathrooms,
      minGuests: state.minGuests,
      minPrice: state.minPrice,
      maxPrice: state.maxPrice,
      amenities: state.amenities,
      providers: state.providers,
      propertyTypes: state.propertyTypes,
      viewTypes: state.viewTypes,
      searchExact: state.searchExact,
      petFriendly: state.petFriendly,
      page: state.page,
      pageSize: state.pageSize,
      sortBy: state.sortBy
    });

    console.log('📤 API Params:', this.getSearchParams());
  }

  /**
   * DEBUG: Log when state changes
   */
  private logStateChange(previousState: SearchState, newState: SearchState): void {
    const changes: any = {};

    Object.keys(newState).forEach(key => {
      const typedKey = key as keyof SearchState;
      if (JSON.stringify(previousState[typedKey]) !== JSON.stringify(newState[typedKey])) {
        changes[key] = {
          from: previousState[typedKey],
          to: newState[typedKey]
        };
      }
    });

    if (Object.keys(changes).length > 0) {
      console.log('🔄 State Changed:', changes);
    }
  }
}
