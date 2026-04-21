import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, NgZone } from '@angular/core';
import { MapPropertiesService, MapProperty } from '../map-properties.service';
import { GoogleMapsService } from 'src/app/shared/services/google-maps.service';
import { StorageService } from 'src/app/shared/services/storage.service';

declare const google: any;

@Component({
  selector: 'app-destinique-map',
  templateUrl: './destinique-map.component.html',
  styleUrls: ['./destinique-map.component.scss']
})
export class DestiniqueMapComponent implements OnInit, AfterViewInit {

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef<HTMLInputElement>;

  map!: google.maps.Map;
  infoWindow!: google.maps.InfoWindow;
  markers: google.maps.Marker[] = [];

  /** All properties loaded once on page load (4512) */
  private allProperties: MapProperty[] = [];
  /** Currently displayed properties on map (filtered from allProperties) */
  properties: MapProperty[] = [];
  /** localStorage cache key + TTL (24h) */
  private static readonly MAP_PROPS_CACHE_KEY = 'dest_map_all_properties_v1';
  private static readonly MAP_PROPS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  // Default: Destin, FL
  defaultCenter = { lat: 30.3935, lng: -86.4958 };
  defaultLocationText = '';//'Destin, Florida';
  private readonly mapMinZoom = 4;

  /** Site theme green/teal for markers (#378f86) */
  private readonly markerColor = '#378f86';
  /** Hover color for marker (lighter teal) */
  private readonly markerHoverColor = '#6fccc2';
  /** Highlight color for active marker (success green) */
  private readonly markerHighlightColor = '#33d286';
  private markerIconUrl: string | null = null;
  private markerHoverIconUrl: string | null = null;
  private markerHighlightIconUrl: string | null = null;
  private activeMarker: google.maps.Marker | null = null;

  isApiLoaded = false;
  loading = false;
  mapReady = false;

  constructor(
    private mapPropertiesService: MapPropertiesService,
    private googleMapsService: GoogleMapsService,
    private storageService: StorageService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // SSR/prerender guard
    if (!this.storageService.isBrowser()) {
      return;
    }
    this.googleMapsService
      .loadGoogleMaps()
      .then(() => {
        this.isApiLoaded = true;
        // Map & autocomplete will also be initialized in ngAfterViewInit
      })
      .catch((err) => {
        console.error('Failed to load Google Maps API for DestiniqueMapComponent', err);
      });
  }

  ngAfterViewInit(): void {
    if (!this.storageService.isBrowser()) {
      return;
    }
    if (this.isApiLoaded) {
      this.initializeMapAndSearch();
    } else {
      this.googleMapsService.onApiLoaded((loaded) => {
        if (loaded) {
          this.initializeMapAndSearch();
        }
      });
    }
  }

  private initializeMapAndSearch(): void {
    this.markerIconUrl = this.getMarkerIconUrl(this.markerColor);
    this.markerHoverIconUrl = this.getMarkerIconUrl(this.markerHoverColor);
    this.markerHighlightIconUrl = this.getMarkerIconUrl(this.markerHighlightColor);
    this.registerCarouselHandlers();
    this.initMap();
    this.initAutocomplete();
    this.loadAllPropertiesOnce();
  }

  /** SVG pin marker in theme green (#378f86). */
  private getMarkerIconUrl(color: string): string {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42">
        <path fill="${color}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"
          d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"/>
        <circle cx="12" cy="12" r="5" fill="#fff"/>
      </svg>`;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  private registerCarouselHandlers(): void {
    (window as any).mapCarouselPrev = (popupId: string) => this.carouselStep(popupId, -1);
    (window as any).mapCarouselNext = (popupId: string) => this.carouselStep(popupId, 1);
  }

  private carouselStep(popupId: string, delta: number): void {
    const el = document.getElementById(popupId);
    if (!el) return;
    const inner = el.querySelector('.map-info-carousel-inner') as HTMLElement;
    const count = inner?.querySelectorAll('img').length || 1;
    if (count <= 1) return;
    const current = parseInt(inner?.getAttribute('data-index') || '0', 10);
    let next = current + delta;
    if (next < 0) next = count - 1;
    if (next >= count) next = 0;
    inner?.setAttribute('data-index', String(next));
    if (inner) inner.style.transform = `translateX(-${next * 100}%)`;
  }

  private initMap(): void {
    if (!this.mapContainer?.nativeElement || typeof google === 'undefined') {
      return;
    }

    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: this.defaultCenter,
      zoom: 6,
      minZoom: this.mapMinZoom,
      mapTypeId: 'roadmap',
      streetViewControl: false,
      // Allow zoom with mouse wheel without requiring Ctrl
      scrollwheel: true,
      gestureHandling: 'greedy',
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM,
      },
    });

    this.infoWindow = new google.maps.InfoWindow();
  }

  private initAutocomplete(): void {
    if (!this.searchInput?.nativeElement || typeof google === 'undefined') {
      return;
    }

    const autocomplete = new google.maps.places.Autocomplete(this.searchInput.nativeElement, {
      // Include address_components so we can derive city/state/country
      fields: ['geometry', 'formatted_address', 'name', 'address_component'],
    });

    autocomplete.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const locationText = place.formatted_address || place.name || '';

        // Parse city, state, country from address_components
        const addressComponents = place.address_components || [];
        const getComponent = (type: string): string | '' => {
          const comp = addressComponents.find((c: any) => c.types?.includes(type));
          return comp?.long_name || comp?.short_name || '';
        };

        const city =
          getComponent('locality') ||
          getComponent('postal_town') ||
          getComponent('sublocality') ||
          getComponent('administrative_area_level_2') ||
          '';
        const state = getComponent('administrative_area_level_1') || '';
        const country = getComponent('country') || '';

        this.map.setCenter({ lat, lng });
        this.map.setZoom(10);

        this.applyClientSideFilter(lat, lng, locationText, city, state, country);
      });
    });
  }

  /**
   * Load the full map dataset once (e.g. 4512 properties),
   * then reuse in-memory filtering for subsequent searches.
   */
  private loadAllPropertiesOnce(): void {
    const cached = this.tryLoadAllPropertiesFromCache();
    if (cached && cached.length) {
      this.allProperties = cached;
      this.properties = cached;
      this.refreshMarkers();
      this.loading = false;
      this.mapReady = true;
      return;
    }

    this.loading = true;
    this.mapPropertiesService
      .getProperties({ pageSize: 5000 })
      .subscribe({
        next: (props) => {
          const valid = (props ?? []).filter(
            (p) => typeof p.latitude === 'number' && typeof p.longitude === 'number'
          );
          this.allProperties = valid;
          this.properties = valid;
          this.saveAllPropertiesToCache(valid);
          this.refreshMarkers();
          this.loading = false;
          this.mapReady = true;
        },
        error: (err) => {
          console.error('Failed to load map properties', err);
          this.loading = false;
          this.mapReady = true;
        },
      });
  }

  private tryLoadAllPropertiesFromCache(): MapProperty[] | null {
    if (!this.storageService.isBrowser()) return null;
    try {
      const raw = localStorage.getItem(DestiniqueMapComponent.MAP_PROPS_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { savedAt?: number; data?: unknown };
      const savedAt = typeof parsed?.savedAt === 'number' ? parsed.savedAt : 0;
      if (!savedAt) return null;

      const age = Date.now() - savedAt;
      if (age > DestiniqueMapComponent.MAP_PROPS_CACHE_TTL_MS) {
        // Expired
        localStorage.removeItem(DestiniqueMapComponent.MAP_PROPS_CACHE_KEY);
        return null;
      }

      const data = parsed?.data;
      if (!Array.isArray(data)) return null;

      // Minimal validation: ensure required fields exist and coordinates are numbers
      return (data as any[]).filter(
        (p) =>
          p &&
          typeof p.list_id === 'number' &&
          typeof p.latitude === 'number' &&
          typeof p.longitude === 'number'
      ) as MapProperty[];
    } catch {
      return null;
    }
  }

  private saveAllPropertiesToCache(data: MapProperty[]): void {
    if (!this.storageService.isBrowser()) return;
    try {
      localStorage.setItem(
        DestiniqueMapComponent.MAP_PROPS_CACHE_KEY,
        JSON.stringify({ savedAt: Date.now(), data })
      );
    } catch {
      // ignore quota / privacy mode
    }
  }

  /** Clear search box and redraw all properties */
  onResetSearch(): void {
    if (!this.storageService.isBrowser()) return;
    try {
      if (this.searchInput?.nativeElement) {
        this.searchInput.nativeElement.value = '';
      }
    } catch {
      // ignore
    }
    if (this.map) {
      this.map.setCenter(this.defaultCenter);
      this.map.setZoom(6);
    }
    this.properties = this.allProperties.slice();
    this.refreshMarkers();
  }

  private applyClientSideFilter(
    lat: number,
    lng: number,
    locationText: string,
    city?: string,
    state?: string,
    country?: string
  ): void {
    const src = this.allProperties ?? [];
    if (!src.length) {
      return;
    }

    const norm = (v: unknown): string => String(v ?? '').trim().toLowerCase();
    const cityN = norm(city);
    const stateN = norm(state);
    const countryN = norm(country);
    const textN = norm(locationText);

    // 1) Prefer exact-ish matches on administrative fields when available
    let filtered: MapProperty[] = src;
    if (cityN) {
      filtered = src.filter((p) => norm(p.city) === cityN);
    } else if (stateN) {
      filtered = src.filter((p) => norm(p.state) === stateN);
    } else if (countryN) {
      filtered = src.filter((p) => norm(p.country) === countryN);
    }

    // 2) If no matches, fall back to a broad text contains search
    if ((!filtered || filtered.length === 0) && textN) {
      filtered = src.filter((p) => {
        const hay = [
          p.city,
          p.state,
          p.country,
          p.Neighborhood,
          p.Complex,
          p.RegionContinent,
          p.Zip,
        ]
          .map(norm)
          .filter(Boolean)
          .join(' ');
        return hay.includes(textN);
      });
    }

    // 3) If still nothing, fall back to a radius search around the selected point
    if (!filtered || filtered.length === 0) {
      const radiusKm = 160; // ~100 miles
      filtered = src.filter((p) => this.haversineKm(lat, lng, p.latitude, p.longitude) <= radiusKm);
    }

    this.properties = filtered;
    this.refreshMarkers();
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (d: number): number => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private refreshMarkers(): void {
    this.clearMarkers();

    if (!this.map || !this.properties?.length) {
      return;
    }

    this.properties.forEach((prop) => {
      const marker = new google.maps.Marker({
        position: { lat: prop.latitude, lng: prop.longitude },
        map: this.map,
        title: `Property ID: ${prop.list_id}`,
        icon: this.markerIconUrl ? { url: this.markerIconUrl, scaledSize: new google.maps.Size(28, 42) } : undefined,
      });

      marker.addListener('click', () => {
        this.handleMarkerClick(marker, prop);
      });

      marker.addListener('mouseover', () => {
        this.handleMarkerMouseOver(marker);
      });

      marker.addListener('mouseout', () => {
        this.handleMarkerMouseOut(marker);
      });

      this.markers.push(marker);
    });
  }

  private clearMarkers(): void {
    this.markers.forEach((m) => m.setMap(null));
    this.markers = [];
    this.activeMarker = null;
  }

  private handleMarkerClick(marker: google.maps.Marker, prop: MapProperty): void {
    // Reset previous active marker (icon + animation)
    if (this.activeMarker && this.activeMarker !== marker) {
      this.activeMarker.setAnimation(null);
      if (this.markerIconUrl) {
        this.activeMarker.setIcon({
          url: this.markerIconUrl,
          scaledSize: new google.maps.Size(28, 42),
        });
      }
    }

    this.activeMarker = marker;

    // Apply highlighted icon and bounce animation
    if (this.markerHighlightIconUrl) {
      marker.setIcon({
        url: this.markerHighlightIconUrl,
        scaledSize: new google.maps.Size(28, 42),
      });
    }

    marker.setAnimation(google.maps.Animation.BOUNCE);

    // Stop bouncing after a short period, but keep icon highlighted
    setTimeout(() => {
      if (this.activeMarker === marker) {
        marker.setAnimation(null);
      }
    }, 1400);

    this.openInfoWindow(marker, prop);
  }

  private handleMarkerMouseOver(marker: google.maps.Marker): void {
    // Do not override the highlighted icon for the active marker
    if (this.activeMarker === marker) {
      return;
    }
    if (this.markerHoverIconUrl) {
      marker.setIcon({
        url: this.markerHoverIconUrl,
        scaledSize: new google.maps.Size(28, 42),
      });
    }
  }

  private handleMarkerMouseOut(marker: google.maps.Marker): void {
    // Keep active marker highlighted; reset others to default color
    if (this.activeMarker === marker) {
      return;
    }
    if (this.markerIconUrl) {
      marker.setIcon({
        url: this.markerIconUrl,
        scaledSize: new google.maps.Size(28, 42),
      });
    }
  }

  private openInfoWindow(marker: google.maps.Marker, prop: MapProperty): void {
    const images = (prop.images && prop.images.length > 0)
      ? prop.images.map((img) => img.URLTxt || '').filter(Boolean)
      : [];
    const defaultImg = 'https://destinique.com/dest-images/assets/default.png';
    const imageUrls = images.length > 0 ? images : [defaultImg];

    const popupId = `map-popup-${prop.list_id}`;
    const imgSlides = imageUrls
      .map((url) => `<img src="${url}" alt="Property ${prop.list_id}" />`)
      .join('');

    const cityState = [prop.city, prop.state, prop.country].filter(Boolean).join(', ');
    const viewTypeLabel = (prop.view_type && String(prop.view_type).trim()) ? String(prop.view_type).trim() : 'N/A';
    const hasMultiple = imageUrls.length > 1;
    const prevNext = hasMultiple
      ? `<button type="button" class="map-carousel-btn map-carousel-prev" onclick="window.mapCarouselPrev('${popupId}')" aria-label="Previous">‹</button>
         <button type="button" class="map-carousel-btn map-carousel-next" onclick="window.mapCarouselNext('${popupId}')" aria-label="Next">›</button>`
      : '';

    const propertyUrl = `/property/${prop.list_id}`;

    const content = `
      <div id="${popupId}" class="map-info-window map-info-window-fixed">
        <div class="map-info-carousel">
          <div class="map-info-carousel-inner" data-index="0" style="transform: translateX(0%);">
            ${imgSlides}
          </div>
          ${prevNext}
          <a href="${propertyUrl}" target="_blank" rel="noopener noreferrer" class="map-info-property-id-overlay">Property ID: ${prop.list_id}</a>
        </div>
        <div class="map-info-content">
          <div class="map-info-location">${cityState}</div>
          <div class="map-info-meta">GUESTS ${prop.sleeps} | BR ${prop.bedrooms} | BA ${prop.bathrooms} | ${(prop.property_type || '').toUpperCase()}</div>
          <div class="map-info-price">From $${prop.price_per_night.toFixed(0)} / night</div>
          <a href="${propertyUrl}" target="_blank" rel="noopener noreferrer" class="map-info-view-type">VIEW | ${viewTypeLabel}</a>
        </div>
      </div>
    `;

    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map, marker);
  }

}
