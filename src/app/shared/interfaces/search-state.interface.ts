// location.interface.ts
export interface LocationData {
  text: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;      // Change from number | null
  longitude?: number;     // Change from number | null
  placeId?: string;       // Change from string | null
}

// search-state.interface.ts
export interface SearchParams {
  // Flattened location
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;        // Remove | null, just use undefined
  longitude?: number;       // Remove | null, just use undefined
  locationText?: string;

  // Dates
  checkIn?: Date;
  checkOut?: Date;

  // Numeric filters - use undefined instead of null
  minBedrooms?: number;     // Changed from number | null
  minBathrooms?: number;    // Changed from number | null
  minGuests?: number;       // Changed from number | null
  minPrice?: number;        // Changed from number | null
  maxPrice?: number;        // Changed from number | null

  // Array filters
  amenities?: string[];
  providers?: string[];
  propertyTypes?: string[];
  viewTypes?: string[];

  // Boolean filters
  searchExact?: boolean;
  petFriendly?: boolean;

  // Pagination
  page?: number;
  pageSize?: number;
  sortBy?: string;
}

// search-params.interface.ts (for API requests)
/*
export interface SearchParams extends Omit<SearchState, 'location'> {
  // Flatten location for API
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  locationText?: string;
}
*/

// search-state.interface.ts
export interface SearchState {
  location: LocationData | null;

  // Use undefined everywhere for consistency
  checkIn?: Date;
  checkOut?: Date;
  minBedrooms?: number;      // Changed from number | null
  minBathrooms?: number;     // Changed from number | null
  minGuests?: number;        // Changed from number | null
  minPrice?: number;         // Changed from number | null
  maxPrice?: number;         // Changed from number | null

  // Keep arrays and booleans with defaults
  amenities: string[];
  providers: string[];
  propertyTypes: string[];
  viewTypes: string[];
  searchExact: boolean;
  petFriendly: boolean;
  page: number;
  pageSize: number;
  sortBy: string;
}
