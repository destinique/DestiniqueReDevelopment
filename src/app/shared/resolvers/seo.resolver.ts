import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { SeoService } from '../services/seo.service';

@Injectable({
  providedIn: 'root'
})
export class SeoResolver implements Resolve<boolean> {

  constructor(private seoService: SeoService) {}

  resolve(route: ActivatedRouteSnapshot): boolean {
    const seo = route.data['seo'];

    if (seo) {
      this.seoService.updateSeo(seo);
    }

    return true;
  }
}