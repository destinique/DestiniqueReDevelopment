import {
  Component,
  Input,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  NgZone,
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { GoogleMapsService } from 'src/app/shared/services/google-maps.service';
import { Property } from 'src/app/shared/services/property.service';

declare const google: any;

@Component({
  selector: 'app-property-map',
  templateUrl: './property-map.component.html',
  styleUrls: ['./property-map.component.scss'],
})
export class PropertyMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() properties: Property[] = [];
  @Input() selectedPropertyId: number | null = null;
  /** When the user hovers a property card in the list, highlight the matching marker on the map */
  @Input() hoveredPropertyId: number | null = null;
  /** When true, show a centered loader on the map (e.g. while list is filtering by visible bounds) */
  @Input() mapPropertiesLoading = false;
  @Output() propertyFocused = new EventEmitter<number>();
  @Output() visiblePropertyIdsChange = new EventEmitter<number[]>();
  @Output() resetRequested = new EventEmitter<void>();
  @Output() filteringActivated = new EventEmitter<void>();

  /** Used to ignore zoom events triggered by our own fitBounds / reset logic */
  private programmaticZoomInProgress = false;
  /** After the user manually zooms or drags, we stop auto-fitting bounds */
  private hasUserInteracted = false;
  /** When true, next map 'idle' will not emit visiblePropertyIdsChange (avoids list skeleton on marker click pan) */
  private skipNextIdleEmit = false;
  /** Emits when map idle; debounced so we only emit visible IDs after user stops zooming/panning */
  private readonly visibleIdsTrigger$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();
  private readonly visibleIdsDebounceMs = 400;
  /** Padding (px) when fitting bounds so all property markers stay inside the visible map */
  private readonly fitBoundsPadding = 80;

  @ViewChild('mapContainer', { static: false })
  mapContainer!: ElementRef<HTMLDivElement>;

  map!: google.maps.Map;
  markers: google.maps.Marker[] = [];
  /** list_id for each marker (same order as markers) for hover highlight */
  private markerListIds: number[] = [];
  infoWindow!: google.maps.InfoWindow;
  /** Default location pin icon (teal) */
  private markerIconUrl: string | null = null;
  /** Location pin icon when hovered (highlight color) */
  private markerIconUrlHighlight: string | null = null;
  private readonly markerIconSize = { w: 28, h: 38 };
  /** When user hovers a marker on the map (not the list), bring that marker to front */
  private mapHoveredListId: number | null = null;
  private readonly markerZIndexFront = 1000;
  private readonly markerZIndexBack = 0;
  /** Delayed fitBounds timeout so initial load fits after map container has dimensions */
  private fitBoundsTimeout: ReturnType<typeof setTimeout> | null = null;
  /** When true, next map idle will set minZoom to current zoom (prevent zooming out past all-properties view) */
  private pendingMinZoomFromFitBounds = false;

  mapReady = false;

  constructor(
    private googleMapsService: GoogleMapsService,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit(): void {
    this.googleMapsService
      .loadGoogleMaps()
      .then(() => {
        this.initializeMap();
        this.updateMarkers();
      })
      .catch((err) => {
        console.error('Failed to load Google Maps API for PropertyMapComponent', err);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['properties'] && this.map) {
      this.updateMarkers();
    }

    if (changes['selectedPropertyId'] && this.map) {
      this.highlightSelectedProperty();
    }

    if (changes['hoveredPropertyId'] && this.map && this.markers.length > 0) {
      this.updateMarkerHighlights();
    }
  }

  ngOnDestroy(): void {
    if (this.fitBoundsTimeout) {
      clearTimeout(this.fitBoundsTimeout);
      this.fitBoundsTimeout = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeMap(): void {
    if (!this.mapContainer?.nativeElement || typeof google === 'undefined') {
      return;
    }

    this.markerIconUrl = this.buildMarkerIcon('#378f86');
    this.markerIconUrlHighlight = this.buildMarkerIcon('rgb(255, 222, 81)');

    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: { lat: 30.3935, lng: -86.4958 },
      zoom: 6,
      mapTypeId: 'roadmap',
      zoomControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      mapTypeControl: true,
      gestureHandling: 'greedy',
    });

    this.infoWindow = new google.maps.InfoWindow();

    this.mapReady = true;

    this.visibleIdsTrigger$
      .pipe(
        debounceTime(this.visibleIdsDebounceMs),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.ngZone.run(() => this.emitVisiblePropertyIds()));

    this.map.addListener('idle', () => {
      this.ngZone.run(() => {
        if (this.pendingMinZoomFromFitBounds && this.map) {
          this.pendingMinZoomFromFitBounds = false;
          const zoom = this.map.getZoom();
          if (typeof zoom === 'number') {
            this.map.setOptions({ minZoom: zoom });
          }
        }
        if (this.skipNextIdleEmit) {
          this.skipNextIdleEmit = false;
          return;
        }
        this.visibleIdsTrigger$.next();
      });
    });

    this.map.addListener('zoom_changed', () => {
      this.ngZone.run(() => {
        if (this.programmaticZoomInProgress) {
          // Clear the flag and ignore this zoom event.
          this.programmaticZoomInProgress = false;
          return;
        }
        this.hasUserInteracted = true;
        this.filteringActivated.emit();
      });
    });

    this.map.addListener('dragend', () => {
      this.ngZone.run(() => {
        this.hasUserInteracted = true;
        this.filteringActivated.emit();
      });
    });

    // Trigger resize after layout so map draws when container has dimensions
    setTimeout(() => {
      if (typeof google !== 'undefined' && google.maps?.event && this.map) {
        google.maps.event.trigger(this.map, 'resize');
      }
    }, 100);
  }

  private updateMarkers(): void {
    this.clearMarkers();

    if (!this.map || !this.properties?.length || typeof google === 'undefined') {
      return;
    }

    const bounds = new google.maps.LatLngBounds();

    this.markerListIds = [];

    this.properties
      .filter(
        (p) =>
          typeof p.latitude === 'number' &&
          typeof p.longitude === 'number'
      )
      .forEach((prop) => {
        const position = { lat: prop.latitude, lng: prop.longitude };
        const priceText = '$' + (prop.price_per_night ?? 0).toFixed(0);
        const listId = prop.list_id;
        const marker = new google.maps.Marker({
          position,
          map: this.map,
          title: `Property ID: ${listId} – ${priceText}/night`,
            icon: this.markerIconUrl
            ? {
                url: this.markerIconUrl,
                scaledSize: new google.maps.Size(this.markerIconSize.w, this.markerIconSize.h),
                anchor: new google.maps.Point(this.markerIconSize.w / 2, this.markerIconSize.h - 2),
              }
            : undefined,
          zIndex: this.markerZIndexBack,
        });

        marker.addListener('click', () => {
          this.propertyFocused.emit(listId);
          this.openInfoWindow(marker, prop);
        });

        marker.addListener('mouseover', () => {
          this.ngZone.run(() => {
            this.mapHoveredListId = listId;
            this.updateMarkerHighlights();
          });
        });
        marker.addListener('mouseout', () => {
          this.ngZone.run(() => {
            this.mapHoveredListId = null;
            this.updateMarkerHighlights();
          });
        });

        bounds.extend(position);
        this.markers.push(marker);
        this.markerListIds.push(prop.list_id);
      });

    if (!bounds.isEmpty() && !this.hasUserInteracted) {
      this.pendingMinZoomFromFitBounds = true;
      this.programmaticZoomInProgress = true;
      if (typeof google !== 'undefined' && google.maps?.event && this.map) {
        google.maps.event.trigger(this.map, 'resize');
      }
      this.map.fitBounds(bounds, this.fitBoundsPadding);
      if (this.fitBoundsTimeout) {
        clearTimeout(this.fitBoundsTimeout);
      }
      this.fitBoundsTimeout = setTimeout(() => {
        this.fitBoundsTimeout = null;
        if (this.map && !this.hasUserInteracted && !bounds.isEmpty()) {
          this.pendingMinZoomFromFitBounds = true;
          this.programmaticZoomInProgress = true;
          if (typeof google !== 'undefined' && google.maps?.event) {
            google.maps.event.trigger(this.map, 'resize');
          }
          this.map.fitBounds(bounds, this.fitBoundsPadding);
        }
      }, 250);
    }

    this.highlightSelectedProperty();
    this.updateMarkerHighlights();
    this.emitVisiblePropertyIds();
  }

  /** Update marker icons (highlight pin when hovered from list) and z-index so hovered one is on top */
  private updateMarkerHighlights(): void {
    if (!this.map || this.markers.length === 0 || this.markerListIds.length !== this.markers.length) {
      return;
    }
    const iconConfig = (url: string) => ({
      url,
      scaledSize: new google.maps.Size(this.markerIconSize.w, this.markerIconSize.h),
      anchor: new google.maps.Point(this.markerIconSize.w / 2, this.markerIconSize.h - 2),
    });
    this.markers.forEach((marker, i) => {
      const listId = this.markerListIds[i];
      const isHovered = this.hoveredPropertyId === listId || this.mapHoveredListId === listId;
      if (isHovered && this.markerIconUrlHighlight) {
        marker.setIcon(iconConfig(this.markerIconUrlHighlight));
      } else if (this.markerIconUrl) {
        marker.setIcon(iconConfig(this.markerIconUrl));
      }
      marker.setAnimation(isHovered ? google.maps.Animation.BOUNCE : null);
      this.setMarkerZIndex(marker, i);
    });
  }

  /** Which list_id should be drawn on top (list hover or map marker hover) */
  private getListIdOnTop(): number | null {
    return this.hoveredPropertyId ?? this.mapHoveredListId;
  }

  private setMarkerZIndex(marker: google.maps.Marker, index: number): void {
    const listIdOnTop = this.getListIdOnTop();
    const isOnTop = listIdOnTop !== null && this.markerListIds[index] === listIdOnTop;
    marker.setZIndex(isOnTop ? this.markerZIndexFront : this.markerZIndexBack);
  }

  /** Bring the hovered marker (from list or map) to front, others to back */
  private bringMarkerToFront(): void {
    if (!this.markers.length || this.markerListIds.length !== this.markers.length) return;
    this.markers.forEach((marker, i) => this.setMarkerZIndex(marker, i));
  }

  private openInfoWindow(marker: google.maps.Marker, prop: Property): void {
    const images = (prop.images && prop.images.length > 0)
      ? prop.images.map((img) => img.URLTxt || '').filter(Boolean)
      : [];
    const defaultImg = 'https://destinique.com/dest-images/assets/default.png';
    const imageUrl = images.length > 0 ? images[0] : defaultImg;
    const cityState = [prop.city, prop.state, prop.country].filter(Boolean).join(', ');
    const viewTypeLabel = (prop.view_type && String(prop.view_type).trim()) ? String(prop.view_type).trim() : 'N/A';
    const propertyUrl = `/property/${prop.list_id}`;
    const content = `
      <div class="map-info-window map-info-window-fixed">
        <div class="map-info-carousel">
          <div class="map-info-carousel-inner" data-index="0" style="transform: translateX(0%);">
            <img src="${imageUrl}" alt="Property ${prop.list_id}" />
          </div>
          <a href="${propertyUrl}" target="_blank" rel="noopener noreferrer" class="map-info-property-id-overlay">
            Property ID: ${prop.list_id}
          </a>
        </div>
        <div class="map-info-content">
          <div class="map-info-location">${cityState}</div>
          <div class="map-info-meta">
            GUESTS ${prop.sleeps} | BR ${prop.bedrooms} | BA ${prop.bathrooms} | ${(prop.property_type || '').toUpperCase()}
          </div>
          <div class="map-info-price">From $${prop.price_per_night.toFixed(0)} / night</div>
          <a href="${propertyUrl}" target="_blank" rel="noopener noreferrer" class="map-info-view-type">
            VIEW | ${viewTypeLabel}
          </a>
        </div>
      </div>
    `;
    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map, marker);
  }

  private clearMarkers(): void {
    this.markers.forEach((m) => m.setMap(null));
    this.markers = [];
    this.markerListIds = [];
  }

  /** Builds a house-pin marker icon (SVG data URL). */
  private buildMarkerIcon(pinColor: string): string {
    const houseColor = pinColor === '#378f86' ? '#378f86' : '#333333';
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="44" height="60" viewBox="0 0 44 60">
        <defs>
          <filter id="ms" x="-40%" y="-20%" width="180%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.35)"/>
          </filter>
        </defs>
        <path d="M22 2 C10.95 2 2 10.95 2 22 C2 34.5 22 56 22 56 C22 56 42 34.5 42 22 C42 10.95 33.05 2 22 2 Z"
              fill="${pinColor}" stroke="#ffffff" stroke-width="1.5" filter="url(#ms)"/>
        <circle cx="22" cy="21" r="12" fill="white" opacity="0.95"/>
        <path d="M22 13.5 L14 20.5 H16.5 V27.5 H19.5 V23.5 H24.5 V27.5 H27.5 V20.5 H30 Z"
              fill="${houseColor}"/>
      </svg>`;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  private highlightSelectedProperty(): void {
    if (!this.selectedPropertyId || !this.properties?.length || !this.markers?.length) {
      return;
    }

    const index = this.properties.findIndex((p) => p.list_id === this.selectedPropertyId);
    if (index === -1 || !this.markers[index]) return;

    this.skipNextIdleEmit = true;
    this.map.panTo(this.markers[index].getPosition()!);
  }

  private emitVisiblePropertyIds(): void {
    if (!this.map || !this.properties?.length) {
      this.visiblePropertyIdsChange.emit([]);
      return;
    }

    const bounds = this.map.getBounds();
    if (!bounds) {
      this.visiblePropertyIdsChange.emit(this.properties.map((p) => p.list_id));
      return;
    }

    const visibleIds = this.properties
      .filter(
        (p) =>
          typeof p.latitude === 'number' &&
          typeof p.longitude === 'number' &&
          bounds.contains(new google.maps.LatLng(p.latitude, p.longitude))
      )
      .map((p) => p.list_id);

    this.visiblePropertyIdsChange.emit(visibleIds);
  }

  resetMapView(): void {
    if (!this.map || !this.properties?.length) {
      this.ngZone.run(() => this.resetRequested.emit());
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    this.properties
      .filter(
        (p) =>
          typeof p.latitude === 'number' &&
          typeof p.longitude === 'number'
      )
      .forEach((p) => {
        bounds.extend(new google.maps.LatLng(p.latitude, p.longitude));
      });

    if (!bounds.isEmpty()) {
      this.hasUserInteracted = false;
      this.pendingMinZoomFromFitBounds = true;
      this.programmaticZoomInProgress = true;
      if (typeof google !== 'undefined' && google.maps?.event && this.map) {
        google.maps.event.trigger(this.map, 'resize');
      }
      this.map.fitBounds(bounds, this.fitBoundsPadding);
    }

    this.ngZone.run(() => {
      this.resetRequested.emit();
      this.emitVisiblePropertyIds();
    });
  }
}

