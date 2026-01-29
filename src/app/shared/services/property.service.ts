// property.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

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

  constructor(private http: HttpClient) {
    // No dependency on SearchStateService
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
