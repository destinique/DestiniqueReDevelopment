// search-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';
import { SearchState, LocationData, SearchParams } from '../interfaces/search-state.interface';

@Injectable({
  providedIn: 'root'
})
export class SearchStateService {
  // Default initial state
  private defaultState: SearchState = {
    location: null,
    checkIn: null,
    checkOut: null,
    minBedrooms: null,
    minBathrooms: null,
    minGuests: null,
    minPrice: null,
    maxPrice: null,
    amenities: [],
    providers: [],
    propertyTypes: [],
    viewTypes: [],
    searchExact: false,
    petFriendly: false,
    page: 1,
    pageSize: 12,
    sortBy: 'newest'
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
    this.updateState({ location, page: 1 }); // Reset to page 1 on new search
  }

  /**
   * Update date range
   */
  updateDates(checkIn: Date | null, checkOut: Date | null): void {
    this.updateState({ checkIn, checkOut, page: 1 });
  }

  /**
   * Update numeric filters (bedrooms, bathrooms, guests)
   */
  updateNumericFilter(field: 'minBedrooms' | 'minBathrooms' | 'minGuests', value: number | null): void {
    this.updateState({ [field]: value, page: 1 });
  }

  /**
   * Update price range
   */
  updatePriceRange(minPrice: number | null, maxPrice: number | null): void {
    this.updateState({ minPrice, maxPrice, page: 1 });
  }

  /**
   * Update array filters (amenities, providers, etc.)
   */
  updateArrayFilter(field: 'amenities' | 'providers' | 'propertyTypes' | 'viewTypes', items: string[]): void {
    this.updateState({ [field]: items, page: 1 });
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
   * Check if any search filters are active (excluding pagination/sort)
   */
  hasActiveFilters(): boolean {
    const state = this.currentState;
    return !!(
      state.location ||
      state.checkIn ||
      state.checkOut ||
      state.minBedrooms ||
      state.minBathrooms ||
      state.minGuests ||
      state.minPrice ||
      state.maxPrice ||
      state.amenities.length > 0 ||
      state.providers.length > 0 ||
      state.propertyTypes.length > 0 ||
      state.viewTypes.length > 0 ||
      state.searchExact ||
      state.petFriendly
    );
  }

  /**
   * Get active filters count
   */
  getActiveFiltersCount(): number {
    const state = this.currentState;
    let count = 0;

    if (state.location) count++;
    if (state.checkIn) count++;
    if (state.minBedrooms) count++;
    if (state.minBathrooms) count++;
    if (state.minGuests) count++;
    if (state.minPrice || state.maxPrice) count++;
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

    return {
      // Flatten location data
      city: state.location?.city || undefined,
      state: state.location?.state || undefined,
      country: state.location?.country || undefined,
      latitude: state.location?.latitude || undefined,
      longitude: state.location?.longitude || undefined,
      locationText: state.location?.text || undefined,

      // Copy other properties
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
    };
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
    // Parse URL params and update state
    // You would implement this based on your routing strategy
    console.log('Initialize from URL params:', params);
    // Example: this.updateLocation(params.location ? JSON.parse(params.location) : null);
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

    // Also show API-ready params
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
