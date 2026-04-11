import { Injectable, Inject, Optional, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { PropertyMetaData, PropertyService } from '../services/property.service';
import { SeoService } from '../services/seo.service';
import { PROP_META_MAP_LOADER } from '../tokens/prop-meta-map.loader.token';

@Injectable({ providedIn: 'root' })
export class PropertyMetaResolver implements Resolve<PropertyMetaData | null> {
  constructor(
    private propertyService: PropertyService,
    private seoService: SeoService,
    @Inject(PLATFORM_ID) private platformId: object,
    @Optional() @Inject(PROP_META_MAP_LOADER)
    private propMetaMapLoader?: () => Observable<Record<string, PropertyMetaData>>
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<PropertyMetaData | null> {
    const idParam = route.paramMap.get('id');
    const listId = Number(idParam);
    if (!idParam || !Number.isFinite(listId) || listId <= 0) {
      return of(null);
    }

    const meta$ = isPlatformServer(this.platformId)
      ? this.resolveMetaForPrerender(listId)
      : this.propertyService.getPropertyMetaDataById(listId);

    return meta$.pipe(
      tap((meta) => {
        if (!meta) return;
        this.seoService.updateSeo({
          title: meta.title,
          description: meta.description,
          keywords: meta.keywords,
          image: meta.image,
          url: meta.url
        });
      }),
      catchError(() => of(null))
    );
  }

  /**
   * During SSR/prerender: read repo-root prop_meta_data.json via server-only loader (disk).
   * If list_id missing or invalid, fall back to API. Browser never registers the loader.
   */
  private resolveMetaForPrerender(listId: number): Observable<PropertyMetaData> {
    const key = String(listId);
    if (!this.propMetaMapLoader) {
      return this.propertyService.getPropertyMetaDataById(listId);
    }
    return this.propMetaMapLoader().pipe(
      switchMap((map) => {
        const fromJson = map[key];
        if (fromJson && this.isValidPropertyMeta(fromJson)) {
          return of(fromJson);
        }
        return this.propertyService.getPropertyMetaDataById(listId);
      })
    );
  }

  private isValidPropertyMeta(value: unknown): value is PropertyMetaData {
    if (!value || typeof value !== 'object') return false;
    const o = value as Record<string, unknown>;
    return (
      typeof o['title'] === 'string' &&
      typeof o['description'] === 'string' &&
      typeof o['url'] === 'string' &&
      typeof o['keywords'] === 'string' &&
      typeof o['image'] === 'string'
    );
  }
}
