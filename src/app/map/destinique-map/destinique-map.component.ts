import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, NgZone } from '@angular/core';
import { MapPropertiesService, MapProperty } from '../map-properties.service';
import { GoogleMapsService } from 'src/app/shared/services/google-maps.service';

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

  properties: MapProperty[] = [];

  // Default: Destin, FL
  defaultCenter = { lat: 30.3935, lng: -86.4958 };
  defaultLocationText = 'Destin, Florida';

  /** Site theme green/teal for markers (#378f86) */
  private readonly markerColor = '#378f86';
  private markerIconUrl: string | null = null;

  isApiLoaded = false;
  loading = false;

  constructor(
    private mapPropertiesService: MapPropertiesService,
    private googleMapsService: GoogleMapsService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
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
    this.markerIconUrl = this.getMarkerIconUrl();
    this.registerCarouselHandlers();
    this.initMap();
    this.initAutocomplete();
    this.loadPropertiesForLocation(this.defaultCenter.lat, this.defaultCenter.lng, this.defaultLocationText);
  }

  /** SVG pin marker in theme green (#378f86). */
  private getMarkerIconUrl(): string {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42">
        <path fill="${this.markerColor}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"
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
      zoom: 10,
      mapTypeId: 'roadmap',
    });

    this.infoWindow = new google.maps.InfoWindow();
  }

  private initAutocomplete(): void {
    if (!this.searchInput?.nativeElement || typeof google === 'undefined') {
      return;
    }

    const autocomplete = new google.maps.places.Autocomplete(this.searchInput.nativeElement, {
      fields: ['geometry', 'formatted_address', 'name'],
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

        this.map.setCenter({ lat, lng });
        this.map.setZoom(10);

        this.loadPropertiesForLocation(lat, lng, locationText);
      });
    });
  }

  private loadPropertiesForLocation(lat: number, lng: number, locationText: string): void {
    this.loading = true;
    this.mapPropertiesService
      .getProperties({
        latitude: lat,
        longitude: lng,
        locationText,
      })
      .subscribe({
        next: (props) => {
          this.properties = props.filter(
            (p) => typeof p.latitude === 'number' && typeof p.longitude === 'number'
          );
          this.refreshMarkers();
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load map properties', err);
          this.loading = false;
        },
      });
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
        this.openInfoWindow(marker, prop);
      });

      this.markers.push(marker);
    });
  }

  private clearMarkers(): void {
    this.markers.forEach((m) => m.setMap(null));
    this.markers = [];
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
          <div class="map-info-view-type">VIEW | ${viewTypeLabel}</div>
        </div>
      </div>
    `;

    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map, marker);
  }

}
