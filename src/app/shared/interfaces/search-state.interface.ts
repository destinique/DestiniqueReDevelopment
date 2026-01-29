// location.interface.ts
export interface LocationData {
  text: string;           // Formatted address from Google
  city: string;           // Extracted city
  state: string;          // Extracted state/region
  country: string;        // Extracted country
  latitude: number | null;       // For maps & proximity search
  longitude: number | null;      // For maps & proximity search
  placeId: string | null;        // Google Place ID
}

// search-state.interface.ts
export interface SearchState {
  // Location data from Google Places
  location: LocationData | null;

  // Date range for availability
  checkIn: Date | null;
  checkOut: Date | null;

  // Numeric filters
  minBedrooms: number | null;
  minBathrooms: number | null;
  minGuests: number | null;

  // Price range
  minPrice: number | null;
  maxPrice: number | null;

  // Array filters (multi-select)
  amenities: string[];
  providers: string[];
  propertyTypes: string[];
  viewTypes: string[];

  // Boolean filters
  searchExact: boolean;
  petFriendly: boolean;

  // Pagination & sorting
  page: number;
  pageSize: number;
  sortBy: string;
}

// search-params.interface.ts (for API requests)
export interface SearchParams extends Omit<SearchState, 'location'> {
  // Flatten location for API
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  locationText?: string;
}
