import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EnvService } from 'src/app/env.service';

export interface MapImage {
  URLTxt?: string;
}

export interface MapProperty {
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
  images?: MapImage[];
}

export interface MapApiResponse {
  success: boolean;
  data: MapProperty[];
  message: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable({
  providedIn: 'root',
})
export class MapPropertiesService {
  /** Map-specific endpoint (properties_map.php under api-user/) */
  private readonly apiUrl: string;

  constructor(
    private http: HttpClient,
    private env: EnvService
  ) {
    this.apiUrl = `${this.env.apiUrl}properties_map.php`;
  }

  /**
   * Fetch properties for the map.
   * Accepts a minimal set of filters (locationText, latitude, longitude, etc.).
   */
  getProperties(params: {
    locationText?: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    state?: string;
    country?: string;
    pageSize?: number;
  }): Observable<MapProperty[]> {
    let httpParams = new HttpParams();

    const effectivePageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 5000;
    httpParams = httpParams.set('pageSize', effectivePageSize.toString());
    httpParams = httpParams.set('sortBy', 'newest');

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        return;
      }
      if (key === 'pageSize') {
        // already handled
        return;
      }
      httpParams = httpParams.set(key, value.toString());
    });

    return this.http
      .get<MapApiResponse>(this.apiUrl, { params: httpParams })
      .pipe(map((resp) => resp?.data ?? []));
  }
}

