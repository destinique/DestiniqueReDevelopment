import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { PropertyMetaData, PropertyService } from '../services/property.service';
import { SeoService } from '../services/seo.service';

@Injectable({ providedIn: 'root' })
export class PropertyMetaResolver implements Resolve<PropertyMetaData | null> {
  constructor(
    private propertyService: PropertyService,
    private seoService: SeoService
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<PropertyMetaData | null> {
    const idParam = route.paramMap.get('id');
    const listId = Number(idParam);
    if (!idParam || !Number.isFinite(listId) || listId <= 0) {
      return of(null);
    }

    return this.propertyService.getPropertyMetaDataById(listId).pipe(
      tap((meta) => {
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
}
