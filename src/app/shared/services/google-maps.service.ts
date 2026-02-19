import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

declare const google: any;

export interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetails {
  address_components: any[];
  formatted_address: string;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  name: string;
  place_id: string;
  // Extracted fields
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

@Injectable({ providedIn: 'root' })
export class GoogleMapsService {
  private apiLoaded = false;
  private loadPromise: Promise<void> | null = null;
  private listeners: ((loaded: boolean) => void)[] = [];
  private autocompleteService: any;
  private placesService: any;

  // ========== CORE LOADING METHODS ==========

  // Ultra-lazy loading - only when explicitly called
  loadGoogleMaps(): Promise<void> {
    if (this.apiLoaded || typeof google !== 'undefined') {
      this.apiLoaded = true;
      this.initializeServices();
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    console.log('🔄 Loading Google Maps script on demand...');

    this.loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places,marker`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.apiLoaded = true;
        this.initializeServices();
        console.log('✅ Google Maps script loaded');
        this.notifyListeners(true);
        resolve();
      };

      script.onerror = (error) => {
        console.error('❌ Failed to load Google Maps script', error);
        this.loadPromise = null;
        this.notifyListeners(false);
        reject(error);
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  private initializeServices() {
    if (typeof google !== 'undefined') {
      this.autocompleteService = new google.maps.places.AutocompleteService();
      this.placesService = new google.maps.places.PlacesService(document.createElement('div'));
    }
  }

  // ========== LISTENER METHODS ==========

  // For components that need to know when API is loaded
  onApiLoaded(callback: (loaded: boolean) => void) {
    if (this.apiLoaded) {
      callback(true);
    } else {
      this.listeners.push(callback);
    }
  }

  private notifyListeners(loaded: boolean) {
    this.listeners.forEach(callback => callback(loaded));
    this.listeners = [];
  }

  // ========== PREDICTION & PLACE METHODS ==========

  // Get place predictions as user types
  getPlacePredictions(input: string): Promise<PlacePrediction[]> {
    return new Promise((resolve, reject) => {
      if (!this.autocompleteService) {
        reject(new Error('Autocomplete service not initialized. Call loadGoogleMaps() first.'));
        return;
      }

      if (!input || input.length < 2) {
        resolve([]);
        return;
      }

      this.autocompleteService.getPlacePredictions(
        {
          input: input,
          // No types restriction = returns all place types including cities, states, countries, continents
          // This matches @agm/core behavior which shows continent-level suggestions like "Caribbean", "North America"
          // types: ['(regions)'] // Removed to allow continents
          // componentRestrictions: { country: 'us' }
        },
        (predictions: any[], status: string) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions.map(p => ({
              description: p.description,
              place_id: p.place_id,
              structured_formatting: p.structured_formatting
            })));
          } else {
            resolve([]);
          }
        }
      );
    });
  }

  // Get place details by place_id
  // Update getPlaceDetails to return structured data
  getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        reject(new Error('Places service not initialized. Call loadGoogleMaps() first.'));
        return;
      }

      this.placesService.getDetails(
        {
          placeId: placeId,
          fields: [
            'address_components',
            'formatted_address',
            'geometry',
            'name',
            'place_id'
          ]
        },
        (place: any, status: string) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            const details = this.extractPlaceDetails(place);
            resolve(details);
          } else {
            reject(new Error(`Failed to get place details: ${status}`));
          }
        }
      );
    });
  }

  // Helper method to extract structured data from place
  private extractPlaceDetails(place: any): PlaceDetails {
    const addressComponents = place.address_components || [];

    // Extract components
    const city = this.getAddressComponent(addressComponents, ['locality', 'postal_town', 'administrative_area_level_2']);
    const state = this.getAddressComponent(addressComponents, ['administrative_area_level_1']);
    const country = this.getAddressComponent(addressComponents, ['country']);
    const zipCode = this.getAddressComponent(addressComponents, ['postal_code']);

    // Get coordinates
    let latitude: number | undefined;
    let longitude: number | undefined;
    if (place.geometry?.location) {
      latitude = place.geometry.location.lat();
      longitude = place.geometry.location.lng();
    }

    return {
      address_components: addressComponents,
      formatted_address: place.formatted_address || '',
      geometry: place.geometry,
      name: place.name || '',
      place_id: place.place_id || '',
      city,
      state,
      country,
      zipCode,
      latitude,
      longitude
    };
  }

  // Helper to get specific address component
  private getAddressComponent(components: any[], types: string[]): string {
    for (const component of components) {
      for (const type of types) {
        if (component.types.includes(type)) {
          return component.long_name;
        }
      }
    }
    return '';
  }

  // ========== UTILITY METHODS ==========

  // Check if API is already loaded
  isApiLoaded(): boolean {
    return this.apiLoaded || typeof google !== 'undefined';
  }

  // Check if load is in progress
  isLoadInProgress(): boolean {
    return !!this.loadPromise;
  }
}
