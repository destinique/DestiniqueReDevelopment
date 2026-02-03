// property.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { FilterOption } from '../interfaces/advanced-filter-form.interface';
import { VIEW_TYPES_REMOVE_LIST } from '../constants/view-type-remove-list.constant';

/** API response for getAllViewTypeAndHouseType.php */
export interface ViewTypeAndHouseTypeResponse {
  viewtypes: string[];
  categories: string[] | Array<{ name: string; id?: string }>;
}

export interface Property {
  // Exact field names from API response
  list_id: number;
  provider: string;           // lowercase
  headline: string;
  bedrooms: number;
  bathrooms: number;
  sleeps: number;
  price_per_night: number;
  city: string;
  state: string;
  address1: string;
  property_type: string;
  view_type: string;          // Note: sometimes empty string
  latitude: number;
  longitude: number;
  rating: number;
  seo_url: string | null;
  description: string;
  Neighborhood: string;       // Capital N (from API)
  Zip: number;                // Capital Z (from API)
  Complex: string;            // Capital C (from API)
  meta_title: string | null;
  meta_description: string | null;
  URL: string;                // Capital URL (from API)
  created_at: string;
  petFriendly: boolean;       // lowercase F (from API)
  amenities: any[];

  // Optional fields that might not always be present
  country?: string;
  RegionContinent?: string;
}

export interface PropertyResponse {
  success: boolean;
  data: Property[];
  message: string;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SearchParams {
  // Location
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  locationText?: string;

  // Dates
  checkIn?: Date;
  checkOut?: Date;

  // Numeric filters
  minBedrooms?: number;
  minBathrooms?: number;
  minGuests?: number;
  minPrice?: number;
  maxPrice?: number;

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

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private apiUrl = 'https://api.destinique.com/api-user/properties.php';
  private apiUserBase = 'https://api.destinique.com/api-user/';

  /** Cached observable for filter options (property types + view types). */
  private filterOptions$: Observable<{ propertyTypes: FilterOption[]; viewTypes: FilterOption[] }> | null = null;

  constructor(private http: HttpClient) {
    // No dependency on SearchStateService
  }

  /**
   * Get property type and view type options from API, filtered and mapped to FilterOption[].
   * Uses shareReplay(1) so multiple subscribers get the same result and the request is not repeated.
   */
  getFilterOptions(): Observable<{ propertyTypes: FilterOption[]; viewTypes: FilterOption[] }> {
    if (!this.filterOptions$) {
      this.filterOptions$ = this.http
        .get<ViewTypeAndHouseTypeResponse>(`${this.apiUserBase}getAllViewTypeAndHouseType.php`)
        .pipe(
          map((data) => ({
            propertyTypes: this.normalizeToFilterOptions(data.categories),
            viewTypes: this.normalizeToFilterOptions(
              (data.viewtypes || []).filter((t) => !VIEW_TYPES_REMOVE_LIST.includes(t))
            )
          })),
          shareReplay(1),
          catchError((err) => {
            console.error('getFilterOptions failed', err);
            return of({ propertyTypes: [], viewTypes: [] });
          })
        );
    }
    return this.filterOptions$;
  }

  private normalizeToFilterOptions(
    raw: string[] | Array<{ name: string; id?: string }>
  ): FilterOption[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((item) => {
      if (typeof item === 'string') {
        return { name: item, id: this.toSlug(item) };
      }
      const name = item?.name ?? '';
      return { name, id: item?.id ?? this.toSlug(name) };
    }).filter((opt) => opt.name !== '');
  }

  private toSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Search properties with given parameters
   */
  searchProperties(params: SearchParams): Observable<PropertyResponse> {
    // Convert to HttpParams for the API call
    let httpParams = new HttpParams();

    // Add all non-null/undefined parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          // For array parameters (amenities, providers, etc.)
          if (value.length > 0) {
            httpParams = httpParams.append(key, value.join(','));
          }
        } else if (value instanceof Date) {
          // Format dates as YYYY-MM-DD
          httpParams = httpParams.append(key, this.formatDate(value));
        } else if (typeof value === 'boolean') {
          // Convert boolean to string
          httpParams = httpParams.append(key, value.toString());
        } else {
          httpParams = httpParams.append(key, value.toString());
        }
      }
    });

    console.log('🔍 API Call with params:', httpParams.toString());

    return this.http.get<PropertyResponse>(this.apiUrl, { params: httpParams })
      .pipe(
        catchError(error => {
          console.error('❌ API Error:', error);
          throw error;
        })
      );
  }

  /**
   * Format date as YYYY-MM-DD for API
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get a single property by list_id
   */
  getPropertyById(listId: number): Observable<Property> {
    return this.http.get<Property>(`${this.apiUrl}/${listId}`);
  }

  /**
   * Simple search by list_id (for admin/search panel)
   */
  searchByListId(listId: string): Observable<Property> {
    return this.http.get<Property>(`${this.apiUrl}/list/${listId}`);
  }
}
