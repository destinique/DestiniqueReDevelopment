/** Image entry on a property list/search record (properties.php). */
export interface PropertyListImage {
  URLTxt?: string;
}

/**
 * Location match tier from properties.php expanded location search.
 * - 0: matched by text/address (city, state, locationText, etc.)
 * - 1: matched by 30 km radius only
 */
export type LocationMatchTier = 0 | 1;

/**
 * Property record from `api-user/properties.php` search response (`data[]`).
 */
export interface Property {
  list_id: number;
  bedrooms: number;
  bathrooms: number;
  sleeps: number;
  price_per_night: number;
  city: string;
  state: string;
  property_type: string;
  view_type: string;
  latitude: number;
  longitude: number;
  petFriendly: boolean;
  rating: number;
  seo_url: string | null;
  Neighborhood: string;
  Zip: number | string;
  Complex: string;
  country: string;
  RegionContinent: string;
  images?: PropertyListImage[];

  /**
   * Present on every search result.
   * `0` = text/address match, `1` = radius-only when search used lat/lng; otherwise `null`.
   */
  location_match_tier: LocationMatchTier | null;

  /**
   * Present on every search result.
   * Distance from search coordinates in km; `null` for text matches or when no lat/lng search.
   */
  distance_km: number | null;

  /** Other endpoints may include these; omitted on list search. */
  provider?: string;
  headline?: string;
  address1?: string;
  description?: string;
  meta_title?: string | null;
  meta_description?: string | null;
  URL?: string;
  created_at?: string;
  amenities?: unknown[];
}

/** @deprecated Use PropertyListImage — kept for imports from property.service */
export type Image = PropertyListImage;

export interface PropertySearchPagination {
  page: number;
  pageSize: number;
  total: number;
  summary?: string;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PropertyResponse {
  success: boolean;
  data: Property[];
  message: string;
  pagination: PropertySearchPagination;
}
