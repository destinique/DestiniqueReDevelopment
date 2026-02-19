import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';
import { SearchState, LocationData, SearchParams } from '../interfaces/search-state.interface';

/** Valid sortBy values for URL param validation */
const VALID_SORT_BY = new Set([
  'newest', 'oldest', 'price_low', 'price_high',
  'bedrooms_asc', 'bedrooms_desc', 'bathrooms_asc', 'bathrooms_desc',
  'sleeps_asc', 'sleeps_desc', 'city_asc', 'city_desc', 'state_asc', 'state_desc'
]);

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
  updatePriceRange(updates: Partial<Pick<SearchState, 'minPrice' | 'maxPrice'>>): void {
    this.updateState({ ...updates, page: 1 });
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

    // For country-level search (e.g. Italy, United States): omit city to avoid API returning 0 results
    const rawCity = state.location?.city;
    const country = state.location?.country;
    const city = rawCity && country && rawCity === country ? undefined : rawCity;

    const params: SearchParams = {
      // Flatten location (convert null to undefined)
      city,
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
   * Reset only main search fields (destination, dates, bedrooms, guests).
   * Keeps advanced filters (amenities, providers, propertyTypes, viewTypes, etc.) and pagination.
   */
  resetBasicSearch(): void {
    const current = this.currentState;
    this.stateSubject.next({
      ...current,
      location: null,
      checkIn: undefined,
      checkOut: undefined,
      minBedrooms: undefined,
      minGuests: undefined,
      page: 1
    });
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
   * Initialize search state from URL path and query parameters.
   * Supports bookmarking and sharing of search URLs.
   *
   * Path param: city (decoded) - location display text; e.g. "Destin", "Destin, FL 32541, USA"
   * Query params: latitude, longitude, state, country, checkIn, checkOut, minBedrooms,
   * minBathrooms, minGuests, minPrice, maxPrice, page, pageSize, sortBy, amenities,
   * providers, propertyTypes, viewTypes, searchExact, petFriendly.
   */
  initializeFromUrlParams(params: Record<string, any>): void {
    if (!params || typeof params !== 'object' || Object.keys(params).length === 0) {
      return;
    }

    const updates: Partial<SearchState> = {};

    // --- Location (path :city + query latitude, longitude, state, country) ---
    const pathCity = this.safeDecodeParam(params['city']);
    if (pathCity) {
      const stateParam = this.safeDecodeParam(params['state']) || '';
      const countryParam = this.safeDecodeParam(params['country']) || '';
      const lat = this.parseNum(params['latitude']);
      const lng = this.parseNum(params['longitude']);
      const placeId = typeof params['placeId'] === 'string' ? params['placeId'].trim() : undefined;
      // For country-level paths (e.g. "Italy", "Caribbean"): keep city empty to avoid API returning 0 results
      const extractedCity = this.extractCityFromPath(pathCity);
      const city = extractedCity && countryParam && extractedCity === countryParam ? '' : (extractedCity || '');

      updates.location = {
        text: pathCity,
        city,
        state: stateParam,
        country: countryParam,
        latitude: lat,
        longitude: lng,
        placeId: placeId || undefined
      };
    }

    // --- Dates ---
    const checkIn = this.parseDate(params['checkIn']);
    const checkOut = this.parseDate(params['checkOut']);
    if (checkIn) updates.checkIn = checkIn;
    if (checkOut) updates.checkOut = checkOut;

    // --- Numeric filters ---
    const minBed = this.parseNum(params['minBedrooms']);
    const minBath = this.parseNum(params['minBathrooms']);
    const minGuests = this.parseNum(params['minGuests']);
    const minP = this.parseNum(params['minPrice']);
    const maxP = this.parseNum(params['maxPrice']);
    if (minBed !== undefined) updates.minBedrooms = minBed;
    if (minBath !== undefined) updates.minBathrooms = minBath;
    if (minGuests !== undefined) updates.minGuests = minGuests;
    if (minP !== undefined) updates.minPrice = minP;
    if (maxP !== undefined) updates.maxPrice = maxP;

    // --- Pagination ---
    const page = this.parseNum(params['page']);
    const pageSize = this.parseNum(params['pageSize']);
    if (page !== undefined && page >= 1) updates.page = Math.floor(page);
    if (pageSize !== undefined && pageSize >= 1 && pageSize <= 60) {
      updates.pageSize = Math.min(60, Math.max(1, Math.floor(pageSize)));
    }

    // --- Sort ---
    const sortBy = typeof params['sortBy'] === 'string' ? params['sortBy'].trim() : '';
    if (sortBy && VALID_SORT_BY.has(sortBy)) {
      updates.sortBy = sortBy;
    }

    // --- Array filters (comma-separated) ---
    updates.amenities = this.parseStringArray(params['amenities']);
    updates.providers = this.parseNumberArray(params['providers']);
    updates.propertyTypes = this.parseStringArray(params['propertyTypes']);
    updates.viewTypes = this.parseStringArray(params['viewTypes']);

    // --- Booleans ---
    updates.searchExact = this.parseBool(params['searchExact']);
    updates.petFriendly = this.parseBool(params['petFriendly']);

    if (Object.keys(updates).length > 0) {
      const current = this.currentState;
      this.stateSubject.next({ ...current, ...updates });
    }
  }

  /** Decode URL-encoded param safely */
  private safeDecodeParam(value: any): string {
    if (value == null || value === '') return '';
    try {
      return decodeURIComponent(String(value).trim());
    } catch {
      return String(value).trim();
    }
  }

  /** Extract city segment from path like "Destin, FL 32541, USA" -> "Destin" */
  private extractCityFromPath(pathText: string): string {
    const trimmed = pathText.trim();
    const firstComma = trimmed.indexOf(',');
    return firstComma > 0 ? trimmed.slice(0, firstComma).trim() : trimmed;
  }

  /** Parse string to number; return undefined if invalid */
  private parseNum(value: any): number | undefined {
    if (value == null || value === '') return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  /** Parse ISO date string to Date */
  private parseDate(value: any): Date | undefined {
    if (value == null || value === '') return undefined;
    const d = new Date(String(value));
    return isNaN(d.getTime()) ? undefined : d;
  }

  /** Parse comma-separated string to string[] */
  private parseStringArray(value: any): string[] {
    if (value == null || value === '') return [];
    const str = String(value).trim();
    if (!str) return [];
    return str.split(',').map(s => this.safeDecodeParam(s.trim())).filter(Boolean);
  }

  /** Parse comma-separated string to number[] */
  private parseNumberArray(value: any): number[] {
    const arr = this.parseStringArray(value);
    return arr.map(s => Number(s)).filter(n => Number.isFinite(n));
  }

  /** Parse boolean param (true, 1, yes) */
  private parseBool(value: any): boolean {
    if (value == null || value === '') return false;
    const s = String(value).toLowerCase();
    return s === 'true' || s === '1' || s === 'yes';
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
